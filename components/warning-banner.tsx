"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./modal";
import { useI18n } from "./language-provider";
import { diffDays, formatLongDate, normalizeWhatsApp, todayISO } from "@/lib/dates";
import type { Project, Task } from "@/lib/types";

export function WaReminderModal({
  project,
  businessName,
  task,
  bufferRemaining,
  onClose,
}: {
  project: Project;
  businessName: string;
  task?: Task | null;
  bufferRemaining: number;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const initial = useMemo(() => {
    const greeting =
      lang === "en" ? `Om swastyastu ${project.clientName},` : `Om swastyastu ${project.clientName},`;
    if (lang === "en") {
      if (task) {
        return `${greeting}

I'm from ${businessName}. For the project "${project.title}", we are waiting for confirmation on "${task.title}" before we can move to the next phase. Could you confirm today so the target date ${formatLongDate(project.deadline, false, lang)} stays safe?

Thank you 🙏`;
      }
      return `${greeting}

I'm from ${businessName}. The project "${project.title}" is scheduled to finish on ${formatLongDate(project.deadline, false, lang)}. We currently have ${bufferRemaining} working days of buffer left, so we want to make sure all materials and approvals are ready.

Could we confirm the pending items today?

Thank you 🙏`;
    }
    if (task) {
      return `${greeting}

Saya dari ${businessName}. Untuk proyek "${project.title}", saat ini kami menunggu konfirmasi "${task.title}" sebelum bisa lanjut ke tahap berikutnya. Boleh dibantu konfirmasi hari ini? Agar target ${formatLongDate(project.deadline, false, lang)} tetap aman.

Terima kasih 🙏`;
    }
    return `${greeting}

Saya dari ${businessName}. Proyek "${project.title}" dijadwalkan selesai pada ${formatLongDate(project.deadline, false, lang)}. Saat ini sisa cadangan waktu tinggal ${bufferRemaining} hari kerja, jadi kami ingin memastikan semua bahan dan persetujuan sudah siap.

Boleh kita konfirmasi hal-hal yang masih tertunda hari ini?

Terima kasih 🙏`;
  }, [project, businessName, task, bufferRemaining, lang]);

  const [message, setMessage] = useState(initial);
  const wa = normalizeWhatsApp(project.clientWa);
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(message)}` : "#";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success(t("Draf pesan disalin."));
    } catch {
      toast.error(t("Gagal menyalin. Pilih teksnya secara manual."));
    }
  }

  return (
    <Modal
      title={t("Siapkan pesan untuk klien")}
      subtitle={t(
        "Tuntas tidak mengirim pesan otomatis. Kamu bisa cek dan edit dulu sebelum membuka WhatsApp.",
      )}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={copy}>
            <Copy className="h-4 w-4" /> {t("Salin pesan")}
          </button>
          <a
            className={`btn-primary ${!wa ? "pointer-events-none opacity-40" : ""}`}
            href={waLink}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <MessageCircle className="h-4 w-4" /> {t("Buka WhatsApp")}
          </a>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-[11.5px] text-muted">
          <Check className="h-3.5 w-3.5 text-green" />
          {t("Draf dibuat dari data proyek. Nomor tujuan:")}{" "}
          <span className="font-semibold text-ink-2">
            {project.clientWa || t("belum diisi")}
          </span>
        </div>
        <div>
          <label className="label" htmlFor="wa-message">
            {t("Draf pesan")}
          </label>
          <textarea
            id="wa-message"
            className="field min-h-[210px] resize-y leading-relaxed"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

export function WarningBanner({
  project,
  businessName,
  lateTasks,
  bufferRemaining,
  canManage = false,
}: {
  project: Project;
  businessName: string;
  lateTasks: Task[];
  bufferRemaining: number;
  canManage?: boolean;
}) {
  const { lang, t } = useI18n();
  const [waOpen, setWaOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const today = todayISO();
  const firstLate = lateTasks[0];
  const show = Boolean(firstLate) || bufferRemaining <= 1;

  if (!show) return null;

  const lateDays = firstLate ? diffDays(firstLate.dueDate, today) : 0;
  const headline = firstLate
    ? lateDays === 1
      ? t("{task} terlambat 1 hari", { task: firstLate.title })
      : t("{task} terlambat {n} hari", { task: firstLate.title, n: lateDays })
    : bufferRemaining === 1
      ? t("Cadangan waktu tinggal 1 hari")
      : t("Cadangan waktu tinggal {n} hari", { n: bufferRemaining });
  const detail = firstLate
    ? t(
        "Kabar ini juga disiapkan untuk {client}.{more} Kamu bisa kirim pengingat lewat WhatsApp — pesan tidak terkirim otomatis.",
        {
          client: project.clientName,
          more:
            lateTasks.length > 1
              ? t(" Ada {n} tugas lain yang juga lewat tanggal.", { n: lateTasks.length - 1 })
              : "",
        },
      )
    : t(
        "Sisa cadangan sebelum deadline {date}. Pertimbangkan mengatur ulang jadwal atau mengabari klien lebih awal.",
        { date: formatLongDate(project.deadline, false, lang) },
      );

  async function reschedule() {
    setRescheduling(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/reschedule`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(payload.error ? t(payload.error) : t("Gagal mengatur ulang."));
      toast.success(t("Jadwal disusun ulang. Tanggal tugas sudah diperbarui."));
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal mengatur ulang."));
      setRescheduling(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-rust/30 bg-rust-soft px-4 py-3.5 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rust/25 bg-rust/15 text-rust">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[12.5px] font-bold text-ink">{headline}</div>
            <div className="mt-0.5 max-w-[760px] text-[11.5px] leading-relaxed text-rust/80">
              {detail}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 xl:pl-3">
          <button type="button" className="btn-primary btn-sm" onClick={() => setWaOpen(true)}>
            <MessageCircle className="h-3.5 w-3.5" /> {t("Kirim pengingat via WhatsApp")}
          </button>
          {canManage && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={reschedule}
              disabled={rescheduling}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rescheduling ? "animate-spin" : ""}`} />
              {rescheduling ? t("Menyusun…") : t("Atur ulang jadwal")}
            </button>
          )}
        </div>
      </div>

      {waOpen && (
        <WaReminderModal
          project={project}
          businessName={businessName}
          task={firstLate}
          bufferRemaining={bufferRemaining}
          onClose={() => setWaOpen(false)}
        />
      )}
    </>
  );
}
