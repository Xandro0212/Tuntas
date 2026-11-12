"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Link2,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./avatar";
import { useI18n } from "./language-provider";
import { formatLongDate } from "@/lib/dates";
import type { Invite, PublicUser } from "@/lib/types";

export function TeamManager({
  initialMembers,
  initialInvites,
  workspaceName,
  currentUserId,
  title,
}: {
  initialMembers: PublicUser[];
  initialInvites: Invite[];
  workspaceName: string;
  currentUserId: string;
  title: string;
}) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [removingInvite, setRemovingInvite] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as {
        error?: string;
        invite?: Invite;
      };
      if (!response.ok || !payload.invite) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal membuat undangan."));
      }
      setInvites((current) => [
        payload.invite!,
        ...current.filter((item) => item.id !== payload.invite!.id),
      ]);
      setForm({ name: "", email: "" });
      toast.success(t("Tautan undangan dibuat. Salin dan kirim ke karyawan."));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal membuat undangan."));
    } finally {
      setSaving(false);
    }
  }

  async function copyInvite(invite: Invite) {
    const url = `${window.location.origin}/join/${invite.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("Tautan undangan disalin."));
    } catch {
      toast.error(t("Gagal menyalin tautan. Buka manual: {url}", { url }));
    }
  }

  async function removeInvite(invite: Invite) {
    setRemovingInvite(invite.id);
    try {
      const response = await fetch(`/api/invites/${invite.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal menghapus undangan."));
      }
      setInvites((current) => current.filter((item) => item.id !== invite.id));
      toast.success(t("Undangan dihapus."));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Gagal menghapus undangan."));
    } finally {
      setRemovingInvite(null);
    }
  }

  async function removeMember(member: PublicUser) {
    if (
      !window.confirm(
        t("Hapus {name} dari tim? Tugas yang ditugaskan akan menjadi tanpa akun.", {
          name: member.name,
        }),
      )
    ) {
      return;
    }
    setDeleting(member.id);
    try {
      const response = await fetch(`/api/employees/${member.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal menghapus karyawan."));
      }
      setMembers((current) => current.filter((item) => item.id !== member.id));
      toast.success(t("Karyawan dihapus."));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Gagal menghapus karyawan."));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="section-title">{t("Ruang kerja {name}", { name: workspaceName })}</div>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.04em] sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {t(
              "Owner mengelola proyek dan membagi tugas. Karyawan hanya bisa memperbarui tugas yang ditugaskan kepadanya.",
            )}
          </p>
        </div>
        <span className="chip-sm border border-green/20 bg-green-soft text-green">
          <Users className="h-3 w-3" />{" "}
          {members.length === 1
            ? t("1 anggota")
            : t("{n} anggota", { n: members.length })}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="panel overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <div className="section-title">{t("Anggota workspace")}</div>
          </div>
          <div className="divide-y divide-line">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={member.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-[13px] font-bold text-ink">{member.name}</span>
                    <span
                      className={`chip-sm ${
                        member.role === "owner"
                          ? "bg-green-soft text-green"
                          : "bg-paper-2 text-muted"
                      }`}
                    >
                      {member.role === "owner" ? t("Owner") : t("Karyawan")}
                    </span>
                    {member.id === currentUserId && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">
                        {t("Kamu")}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-muted">{member.email}</div>
                </div>
                {member.role === "employee" && (
                  <button
                    type="button"
                    className="btn-ghost btn-sm px-2 text-muted hover:bg-rust-soft hover:text-rust"
                    onClick={() => removeMember(member)}
                    disabled={deleting === member.id}
                    aria-label={t("Hapus {name}", { name: member.name })}
                    title={t("Hapus karyawan")}
                  >
                    {deleting === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-soft text-green">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[13px] font-bold text-ink">{t("Undang karyawan")}</div>
              <div className="text-[10.5px] text-muted">
                {t("Buat tautan. Karyawan membuat password sendiri.")}
              </div>
            </div>
          </div>

          <form onSubmit={createInvite} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="employee-name">
                {t("Nama karyawan")}
              </label>
              <input
                id="employee-name"
                className="field"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder={t("Mis. Wayan")}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="employee-email">
                {t("Email")}
              </label>
              <input
                id="employee-email"
                type="email"
                className="field"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="nama@usaha.id"
                required
              />
            </div>
            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[11.5px] text-danger">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {saving ? t("Membuat…") : t("Buat tautan undangan")}
            </button>
          </form>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-green/15 bg-green-soft px-3 py-2.5 text-[10.5px] leading-relaxed text-green/80">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t(
              "UMKM tanpa karyawan tetap bisa memakai Tuntas sebagai Owner tunggal.",
            )}
          </div>
        </section>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="section-title">{t("Undangan menunggu")}</div>
            <div className="mt-0.5 text-[10.5px] text-muted">
              {t("Tautan berlaku 7 hari dan hanya bisa dipakai sekali.")}
            </div>
          </div>
          <span className="chip-sm bg-paper-2 text-muted">{invites.length}</span>
        </div>
        <div className="divide-y divide-line">
          {invites.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-muted">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-ink">
                  {invite.name} · {invite.email}
                </div>
                <div className="text-[10.5px] text-muted">
                  {t("Berlaku sampai {date}", {
                    date: formatLongDate(invite.expiresAt.slice(0, 10), false, lang),
                  })}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => copyInvite(invite)}
                >
                  <Copy className="h-3.5 w-3.5" /> {t("Salin tautan")}
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm px-2 text-muted hover:bg-rust-soft hover:text-rust"
                  onClick={() => removeInvite(invite)}
                  disabled={removingInvite === invite.id}
                  aria-label={t("Hapus undangan")}
                >
                  {removingInvite === invite.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {!invites.length && (
            <div className="px-4 py-8 text-center text-[11.5px] text-muted">
              {t("Belum ada undangan menunggu.")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
