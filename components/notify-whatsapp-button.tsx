"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "./language-provider";

export function NotifyWhatsAppButton({
  projectId,
  className = "btn-secondary btn-sm",
}: {
  projectId: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "confirmation" }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal mengirim WhatsApp."));
      }
      toast.success(t("Konfirmasi pesanan dikirim ke WhatsApp klien."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal mengirim WhatsApp."));
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={send}
      disabled={sending}
      className={className}
      title={t("Kirim konfirmasi pesanan via WhatsApp")}
      aria-label={t("Kirim konfirmasi pesanan via WhatsApp")}
    >
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{t("Konfirmasi WA")}</span>
    </button>
  );
}
