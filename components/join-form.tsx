"use client";

import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { useI18n } from "./language-provider";

export function JoinForm({
  token,
  email,
  defaultName,
}: {
  token: string;
  email: string;
  defaultName: string;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("Password minimal 8 karakter."));
      return;
    }
    if (password !== confirm) {
      setError(t("Konfirmasi password belum sama."));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal menerima undangan."));
      }
      window.location.href = "/kanban";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menerima undangan."));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3.5">
      <div>
        <label className="label" htmlFor="join-name">
          {t("Nama")}
        </label>
        <input
          id="join-name"
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="join-email">
          {t("Email")}
        </label>
        <input
          id="join-email"
          className="field bg-paper"
          value={email}
          readOnly
        />
      </div>
      <div>
        <label className="label" htmlFor="join-password">
          {t("Password")}
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="join-password"
            type="password"
            minLength={8}
            className="field pl-9"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("Minimal 8 karakter")}
            required
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="join-confirm">
          {t("Ulangi password")}
        </label>
        <input
          id="join-confirm"
          type="password"
          minLength={8}
          className="field"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </div>
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? t("Memproses…") : t("Gabung tim")}
      </button>
    </form>
  );
}
