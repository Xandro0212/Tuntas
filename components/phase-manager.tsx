"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./modal";
import { useI18n } from "./language-provider";
import type { Phase } from "@/lib/types";

export function PhaseManager({
  projectId,
  phases,
}: {
  projectId: string;
  phases: Phase[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setNames(
      Object.fromEntries(phases.map((phase) => [phase.id, phase.name])),
    );
  }, [phases]);

  async function save(phase: Phase) {
    const name = (names[phase.id] ?? "").trim();
    if (name.length < 2) {
      setError(t("Nama tahap minimal 2 karakter."));
      return;
    }
    setSaving(phase.id);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal mengubah tahap."));
      }
      toast.success(t("Tahap diperbarui."));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal mengubah tahap."));
    } finally {
      setSaving(null);
    }
  }

  async function move(phase: Phase, direction: "up" | "down") {
    setSaving(phase.id);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal mengubah tahap."));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal mengubah tahap."));
    } finally {
      setSaving(null);
    }
  }

  async function remove(phase: Phase) {
    if (
      !window.confirm(
        t("Hapus tahap {name}? Tahap hanya bisa dihapus jika tidak punya tugas.", {
          name: phase.name,
        }),
      )
    ) {
      return;
    }
    setDeleting(phase.id);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/phases/${phase.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal menghapus tahap."));
      }
      toast.success(t("Tahap dihapus."));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menghapus tahap."));
    } finally {
      setDeleting(null);
    }
  }

  async function add() {
    const name = newName.trim();
    if (name.length < 2) {
      setError(t("Nama tahap minimal 2 karakter."));
      return;
    }
    setAdding(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal menambah tahap."));
      }
      setNewName("");
      toast.success(t("Tahap ditambahkan."));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menambah tahap."));
    } finally {
      setAdding(false);
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
        aria-label={t("Kelola tahap")}
        title={t("Kelola tahap")}
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      {open && (
        <Modal
          title={t("Kelola tahap")}
          subtitle={t("Ubah nama, tambah, atau hapus tahap proyek.")}
          onClose={() => {
            if (!saving && !adding && !deleting) setOpen(false);
          }}
          wide
          footer={
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              {t("Tutup")}
            </button>
          }
        >
          {error && (
            <div className="mb-3 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {[...phases]
              .sort((a, b) => a.order - b.order)
              .map((phase, index) => (
                <div
                  key={phase.id}
                  className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-[10px] font-bold text-muted">
                    {index + 1}
                  </span>
                  <input
                    className="field-sm flex-1"
                    value={names[phase.id] ?? ""}
                    onChange={(event) =>
                      setNames((current) => ({
                        ...current,
                        [phase.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-1.5 text-muted hover:text-ink"
                    onClick={() => move(phase, "up")}
                    disabled={saving === phase.id || index === 0}
                    aria-label={t("Naikkan tahap")}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-1.5 text-muted hover:text-ink"
                    onClick={() => move(phase, "down")}
                    disabled={saving === phase.id || index === phases.length - 1}
                    aria-label={t("Turunkan tahap")}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-2 text-muted hover:text-green"
                    onClick={() => save(phase)}
                    disabled={saving === phase.id}
                    aria-label={t("Simpan tahap")}
                  >
                    {saving === phase.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-2 text-muted hover:bg-rust-soft hover:text-rust"
                    onClick={() => remove(phase)}
                    disabled={deleting === phase.id}
                    aria-label={t("Hapus tahap")}
                  >
                    {deleting === phase.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
          </div>

          <div className="mt-4 flex gap-2 border-t border-line pt-4">
            <input
              className="field flex-1"
              value={newName}
              placeholder={t("Nama tahap baru")}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") add();
              }}
            />
            <button type="button" className="btn-primary" onClick={add} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t("Tambah tahap")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
