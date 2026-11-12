import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getDb } from "@/lib/store";
import {
  projectConfirmationMessage,
  sendWhatsAppText,
  statusMessage,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa mengirim pesan WhatsApp." },
      { status: 403 },
    );
  }
  const limit = rateLimit(`whatsapp:${user.id}`, 30, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak pesan WhatsApp. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { type?: "confirmation" | "status" };
    const db = await getDb();
    const project = db.projects.find(
      (item) => item.id === id && item.workspaceId === user.workspaceId,
    );
    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
    }
    if (!project.clientWa) {
      return NextResponse.json(
        { error: "Nomor WhatsApp klien belum diisi." },
        { status: 400 },
      );
    }

    const workspace = db.workspaces.find((item) => item.id === project.workspaceId);
    const text =
      body.type === "status"
        ? statusMessage(
            project,
            db.tasks.filter((task) => task.projectId === project.id),
            workspace?.name ?? user.businessName,
          )
        : projectConfirmationMessage(
            project,
            workspace?.name ?? user.businessName,
          );

    const result = await sendWhatsAppText(project.clientWa, text);
    if (result.skipped) {
      return NextResponse.json(
        {
          error:
            "WhatsApp API belum dikonfigurasi. Isi WHATSAPP_TOKEN dan WHATSAPP_PHONE_NUMBER_ID.",
        },
        { status: 503 },
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Gagal mengirim WhatsApp." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal mengirim WhatsApp." }, { status: 500 });
  }
}
