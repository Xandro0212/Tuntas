import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/activity";
import { normalizeWhatsApp } from "@/lib/dates";
import { getDb, mutateDb } from "@/lib/store";
import {
  isWhatsAppConfigured,
  parseWhatsAppCommand,
  sendWhatsAppText,
  statusMessage,
  verifyWhatsAppSignature,
  WHATSAPP_HELP,
  whatsappVerifyToken,
} from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === whatsappVerifyToken()) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyWhatsAppSignature(raw, signature)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const payload = JSON.parse(raw) as {
      entry?: {
        changes?: {
          value?: {
            messages?: {
              from?: string;
              type?: string;
              text?: { body?: string };
            }[];
          };
        }[];
      }[];
    };

    const messages = (
      payload.entry?.flatMap((entry) =>
        entry.changes?.flatMap((change) => change.value?.messages ?? []),
      ) ?? []
    ).filter(
      (message): message is { from?: string; type?: string; text?: { body?: string } } =>
        Boolean(message),
    );

    for (const message of messages) {
      const from = message.from;
      const text = message.text?.body;
      if (!from || !text) continue;

      const fromPhone = normalizeWhatsApp(from);
      const db = await getDb();
      const projects = db.projects
        .filter((project) => normalizeWhatsApp(project.clientWa) === fromPhone)
        .sort((a, b) => a.deadline.localeCompare(b.deadline));
      const project = projects[0];

      if (!project) {
        await sendWhatsAppText(
          from,
          "Nomor ini belum terhubung ke proyek Tuntas. Hubungi pemilik usaha untuk menghubungkan nomor WhatsApp klien.",
        );
        continue;
      }

      const command = parseWhatsAppCommand(text);
      if (command === "confirm") {
        await mutateDb((database) => {
          const target = database.projects.find((item) => item.id === project.id);
          if (target) {
            target.clientConfirmedAt = new Date().toISOString();
            target.updatedAt = new Date().toISOString();
          }
          recordActivity(database, {
            workspaceId: project.workspaceId,
            user: { id: `whatsapp:${fromPhone}`, name: project.clientName },
            action: "project.update",
            detail: `Konfirmasi pesanan via WhatsApp · ${project.title}`,
            entityId: project.id,
          });
        });
        await sendWhatsAppText(
          from,
          `Terima kasih ${project.clientName}. Pesanan "${project.title}" sudah dikonfirmasi. Kami akan mengabari progres berikutnya.`,
        );
        continue;
      }

      if (command === "status") {
        const tasks = db.tasks.filter((task) => task.projectId === project.id);
        const workspace = db.workspaces.find(
          (item) => item.id === project.workspaceId,
        );
        await sendWhatsAppText(
          from,
          statusMessage(project, tasks, workspace?.name ?? "Tuntas"),
        );
        continue;
      }

      await sendWhatsAppText(
        from,
        `${WHATSAPP_HELP}\n\nProyek aktif: ${project.title}`,
      );
    }

    return NextResponse.json({ ok: true, configured: isWhatsAppConfigured() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
