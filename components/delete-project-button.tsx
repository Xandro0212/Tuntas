"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./modal";
import { useI18n } from "./language-provider";

export function DeleteProjectButton({
  projectId,
  projectTitle,
  className = "btn-ghost btn-sm px-2.5 text-muted hover:bg-rust-soft hover:text-rust",
}: {
  projectId: string;
  projectTitle: string;
  className?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal menghapus proyek."));
      }
      toast.success(t("Proyek dihapus."));
      setOpen(false);
      if (window.location.pathname === "/proyek") {
        router.refresh();
      } else {
        router.push("/proyek");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menghapus proyek."));
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className={className}
        aria-label={t("Hapus proyek")}
        title={t("Hapus proyek")}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <Modal
          title={t("Hapus proyek?")}
          subtitle={t("Proyek akan dihapus permanen dari ruang kerja ini.")}
          onClose={() => {
            if (!deleting) setOpen(false);
          }}
          footer={
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
                disabled={deleting}
              >
                {t("Batal")}
              </button>
              <button
                type="button"
                className="btn-rust"
                onClick={remove}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? t("Menghapus…") : t("Hapus proyek")}
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3 rounded-xl border border-rust/25 bg-rust-soft p-3.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rust/20 bg-rust/10 text-rust">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-bold text-ink">{projectTitle}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-rust/85">
                {t(
                  "Semua tugas, tahap, dan lampiran proyek ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.",
                )}
              </p>
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
