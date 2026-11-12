import { createHmac, timingSafeEqual } from "node:crypto";
import { formatLongDate, normalizeWhatsApp, todayISO } from "./dates";
import type { Project, Task } from "./types";

const TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || "";
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

export function isWhatsAppConfigured(): boolean {
  return Boolean(TOKEN && PHONE_NUMBER_ID);
}

export function whatsappVerifyToken(): string {
  return VERIFY_TOKEN;
}

export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!APP_SECRET) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  const actual = signature.slice("sha256=".length);
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isWhatsAppConfigured()) return { ok: false, skipped: true };
  const recipient = normalizeWhatsApp(to);
  if (!recipient) return { ok: false, skipped: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "text",
          text: { body: body.slice(0, 3900) },
        }),
      },
    );
    if (!response.ok) {
      return {
        ok: false,
        error: `WhatsApp API ${response.status}: ${(await response.text()).slice(0, 200)}`,
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "WhatsApp request failed.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function projectConfirmationMessage(
  project: Project,
  businessName: string,
): string {
  return [
    `Halo ${project.clientName},`,
    "",
    `Terima kasih. Pesanan "${project.title}" sudah kami terima di ${businessName}.`,
    `Target selesai: ${formatLongDate(project.deadline, false, "id")}.`,
    "",
    "Kami akan mengirim kabar saat ada progres penting atau pekerjaan selesai.",
    "",
    "Balas STATUS untuk melihat progres, atau KONFIRMASI untuk mengonfirmasi pesanan.",
  ].join("\n");
}

export function taskUpdateMessage(
  project: Project,
  task: Task,
  businessName: string,
): string | null {
  if (task.status === "done") {
    return [
      `Halo ${project.clientName},`,
      "",
      `Kabar baik dari ${businessName}: tugas "${task.title}" pada proyek "${project.title}" sudah selesai.`,
      task.progressNote ? `Catatan: ${task.progressNote}` : "",
      "",
      "Balas STATUS untuk melihat ringkasan progres.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (task.status === "waiting") {
    return [
      `Halo ${project.clientName},`,
      "",
      `Kami menunggu konfirmasi untuk "${task.title}" pada proyek "${project.title}".`,
      task.progressNote ? `Catatan: ${task.progressNote}` : "",
      "",
      "Mohon balas jika sudah bisa dikonfirmasi. Terima kasih.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (task.progressNote) {
    return [
      `Halo ${project.clientName},`,
      "",
      `Update dari ${businessName} untuk "${project.title}":`,
      task.progressNote,
      "",
      "Balas STATUS untuk melihat ringkasan progres.",
    ].join("\n");
  }
  return null;
}

export function statusMessage(
  project: Project,
  tasks: Task[],
  businessName: string,
): string {
  const done = tasks.filter((task) => task.status === "done").length;
  const total = tasks.length;
  const late = tasks.filter(
    (task) => task.status !== "done" && task.dueDate < todayISO(),
  ).length;
  return [
    `Halo ${project.clientName},`,
    "",
    `Status proyek "${project.title}" di ${businessName}:`,
    `- Progres: ${done}/${total} tugas selesai (${total ? Math.round((done / total) * 100) : 0}%)`,
    `- Deadline: ${formatLongDate(project.deadline, false, "id")}`,
    late ? `- Perlu perhatian: ${late} tugas sudah lewat tanggal` : "- Tidak ada tugas yang lewat tanggal",
    project.clientConfirmedAt
      ? "- Pesanan sudah dikonfirmasi"
      : "- Pesanan belum dikonfirmasi (balas KONFIRMASI)",
    "",
    "Balas BANTU untuk daftar perintah.",
  ].join("\n");
}

export function parseWhatsAppCommand(
  text: string,
): "status" | "confirm" | "help" | "unknown" {
  const value = text.trim().toLowerCase();
  if (["status", "progres", "progress"].includes(value)) return "status";
  if (["konfirmasi", "confirm", "ok", "oke"].includes(value)) return "confirm";
  if (["bantu", "help", "menu", "start"].includes(value)) return "help";
  return "unknown";
}

export const WHATSAPP_HELP = [
  "Perintah Tuntas:",
  "- STATUS — lihat progres proyek",
  "- KONFIRMASI — konfirmasi pesanan",
  "- BANTU — tampilkan menu ini",
].join("\n");
