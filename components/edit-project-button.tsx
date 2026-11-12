"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./modal";
import { useI18n } from "./language-provider";
import type { Project } from "@/lib/types";

export function EditProjectButton({ project }: { project: Project }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: project.title,
    clientName: project.clientName,
    clientWa: project.clientWa,
    deadline: project.deadline,
    deadlineTime: project.deadlineTime ?? "",
    story: project.story,
    value: String(project.value ?? 0),
    whatsappNotify: project.whatsappNotify !== false,
  });

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value) || 0,
          deadlineTime: form.deadlineTime || undefined,
          whatsappNotify: form.whatsappNotify,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal mengubah proyek."));
      }
      toast.success(t("Proyek diperbarui."));
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal mengubah proyek."));
    } finally {
      setSaving(false);
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
        className="btn-ghost btn-sm px-2.5 text-muted hover:bg-paper hover:text-ink"
        aria-label={t("Edit proyek")}
        title={t("Edit proyek")}
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <Modal
          title={t("Edit proyek")}
          subtitle={t("Perubahan deadline akan menyusun ulang tanggal tugas.")}
          onClose={() => {
            if (!saving) setOpen(false);
          }}
          wide
          footer={
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                {t("Batal")}
              </button>
              <button type="button" className="btn-primary" onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? t("Menyimpan…") : t("Simpan perubahan")}
              </button>
            </>
          }
        >
          {error && (
            <div className="mb-3 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="edit-project-title">
                {t("Nama proyek")}
              </label>
              <input
                id="edit-project-title"
                className="field"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-project-client">
                {t("Nama klien")}
              </label>
              <input
                id="edit-project-client"
                className="field"
                value={form.clientName}
                onChange={(event) => setForm({ ...form, clientName: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-project-wa">
                {t("Nomor WhatsApp")}
              </label>
              <input
                id="edit-project-wa"
                className="field"
                value={form.clientWa}
                onChange={(event) => setForm({ ...form, clientWa: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-project-deadline">
                {t("Deadline")}
              </label>
              <input
                id="edit-project-deadline"
                type="date"
                className="field"
                value={form.deadline}
                onChange={(event) => setForm({ ...form, deadline: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-project-time">
                {t("Jam deadline")}
              </label>
              <input
                id="edit-project-time"
                type="time"
                className="field"
                value={form.deadlineTime}
                onChange={(event) => setForm({ ...form, deadlineTime: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="edit-project-value">
                {t("Nilai proyek")}
              </label>
              <input
                id="edit-project-value"
                type="number"
                min={0}
                className="field"
                value={form.value}
                onChange={(event) => setForm({ ...form, value: event.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-[11.5px] font-medium text-ink-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.whatsappNotify}
                onChange={(event) =>
                  setForm({ ...form, whatsappNotify: event.target.checked })
                }
                className="h-4 w-4 accent-[#7c3aed]"
              />
              {t("Kirim notifikasi WhatsApp otomatis ke klien")}
            </label>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="edit-project-story">
                {t("Cerita proyek")}
              </label>
              <textarea
                id="edit-project-story"
                className="field min-h-[120px] resize-y text-[12px] leading-relaxed"
                maxLength={6000}
                value={form.story}
                onChange={(event) => setForm({ ...form, story: event.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
