"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Columns3,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./logo";
import { useI18n } from "./language-provider";

type Mode = "login" | "register";

export default function LoginForm({ initialMode = "login" }: { initialMode?: Mode }) {
  const { lang, setLang, t } = useI18n();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState<"demo" | "form" | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submitLogin(email: string, password: string, kind: "demo" | "form") {
    setError("");
    setLoading(kind);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ? t(payload.error) : t("Gagal masuk."));
      window.location.href = "/kanban";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal masuk."));
      setLoading(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (mode === "login") {
      await submitLogin(form.email, form.password, "form");
      return;
    }

    setLoading("form");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(payload.error ? t(payload.error) : t("Gagal membuat akun."));
      toast.success(t("Akun dibuat. Selamat datang di Tuntas!"));
      window.location.href = "/proyek/baru";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal membuat akun."));
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] items-stretch gap-4 px-3 py-3 sm:px-5 sm:py-5 lg:grid-cols-[1.02fr_0.98fr] lg:gap-5 lg:p-6">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden rounded-[30px] border border-line bg-card px-10 py-9 text-ink shadow-[0_30px_60px_-45px_rgba(76,29,149,0.3)] lg:flex lg:flex-col xl:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 12%, rgba(139,92,246,0.14) 0, transparent 32%), radial-gradient(circle at 88% 82%, rgba(196,181,253,0.28) 0, transparent 38%)",
            }}
          />
          <div className="relative">
            <Link href="/" aria-label={t("Tuntas — beranda")} className="inline-flex">
              <Logo variant="dark" size="lg" />
            </Link>
          </div>

          <div className="relative mt-16 max-w-[520px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-green/25 bg-green/10 px-3 py-1 text-[11.5px] font-semibold tracking-wide text-green backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> {t("KANBAN + AI UNTUK UMKM")}
            </span>
            <h1 className="mt-5 text-[46px] font-extrabold leading-[1.05] tracking-[-0.045em] text-ink">
              {lang === "en" ? "PLAN IT." : "Dari cerita klien,"}
              <br />
              {lang === "en" ? "TRACK IT." : "Jadi rencana"}
              <br />
              <span className="text-gradient">
                {lang === "en" ? "GET IT DONE." : "Yang tuntas."}
              </span>
            </h1>
            <p className="mt-5 max-w-[430px] text-[15px] leading-relaxed text-ink-2/85">
              {lang === "en"
                ? "Tell us about your order. Tuntas breaks it into tasks, counts dates backward from the deadline, and protects buffer time so you never work at the last minute again."
                : "Ceritakan pesananmu. Tuntas memecahnya menjadi tugas, menghitung tanggal mundur dari deadline, dan menjaga cadangan waktu agar tidak ada lagi kerja di menit terakhir."}
            </p>
          </div>

          <div className="relative mt-9 grid max-w-[470px] grid-cols-3 gap-3">
            {[
              {
                icon: Sparkles,
                title: t("AI pecah tugas"),
                desc: t("Dari cerita jadi 18 tugas"),
              },
              {
                icon: CalendarDays,
                title: t("Kalender proyek"),
                desc: t("Libur & cadangan ikut dihitung"),
              },
              { icon: Columns3, title: t("Kanban rapi"), desc: t("Drag, selesai, langsung tersimpan") },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-line bg-paper p-3.5"
              >
                <item.icon className="h-4 w-4 text-green" />
                <div className="mt-2.5 text-[12.5px] font-semibold">{item.title}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-muted">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Mini board */}
          <div className="relative mt-10 max-w-[500px] rounded-2xl border border-line bg-paper p-4 text-ink shadow-[0_20px_45px_-35px_rgba(76,29,149,0.35)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-muted">{t("PROYEK AKTIF")}</div>
                <div className="text-[13px] font-bold">
                  {lang === "en"
                    ? "Horse statue — Provincial Office"
                    : "Patung kuda — Dinas Provinsi"}
                </div>
              </div>
              <div className="rounded-full border border-green/25 bg-green-soft px-2.5 py-1 text-[10.5px] font-bold text-green">
                {t("2 hari cadangan")}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: lang === "en" ? "Todo" : "Belum",
                  tone: "#c7b9a6",
                  text: "#475569",
                  items:
                    lang === "en"
                      ? ["Sanding & filling", "Finishing coat"]
                      : ["Dempul & amplas", "Finishing cat"],
                },
                {
                  label: lang === "en" ? "In progress" : "Jalan",
                  tone: "#8b5cf6",
                  text: "#6d28d9",
                  items: lang === "en" ? ["Fiberglass casting"] : ["Cetak fiberglass"],
                },
                {
                  label: lang === "en" ? "Client" : "Klien",
                  tone: "#fb923c",
                  text: "#c2410c",
                  items: lang === "en" ? ["Nameplate confirmation"] : ["Konfirmasi plakat"],
                },
                {
                  label: lang === "en" ? "Done" : "Selesai",
                  tone: "#5b21b6",
                  text: "#4c1d95",
                  items:
                    lang === "en"
                      ? ["3-view sketch", "Steel frame"]
                      : ["Sketsa 3 tampak", "Rangka besi"],
                },
              ].map((column) => (
                <div key={column.label} className="rounded-lg border border-line bg-card p-1.5">
                  <div className="mb-1.5 flex items-center gap-1 px-0.5 text-[9px] font-bold text-muted">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: column.text }} />
                    {column.label}
                  </div>
                  <div className="space-y-1.5">
                    {column.items.map((item) => (
                      <div key={item} className="rounded-md border border-line bg-card p-1.5 text-[9px] font-semibold leading-tight">
                        {item}
                        <div className="mt-1 h-1 w-8 rounded-full" style={{ background: column.tone }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-auto flex items-center gap-2 pt-8 text-[11.5px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("Data demo disimpan lokal · tidak ada pesan yang terkirim otomatis")}
          </div>
        </section>

        {/* Form panel */}
        <section className="flex flex-col justify-center rounded-[30px] border border-line bg-card px-5 py-8 shadow-[0_30px_60px_-45px_rgba(76,29,149,0.3)] sm:px-10 lg:px-12 xl:px-16">
          <div className="mb-8 lg:hidden">
            <Link href="/" aria-label={t("Tuntas — beranda")} className="inline-flex">
              <Logo variant="dark" size="md" />
            </Link>
          </div>

          <div className="w-full max-w-[420px] animate-slide-up">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t("Kembali ke beranda")}
              </Link>
              <div className="flex items-center gap-0.5 rounded-lg border border-line bg-paper p-0.5">
                {(["id", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase transition ${
                      lang === code ? "bg-green text-white" : "text-muted"
                    }`}
                    aria-pressed={lang === code}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <div className="section-title">{t("Masuk ke ruang kerja")}</div>
              <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.035em] text-ink">
                {mode === "login" ? t("Selamat datang kembali.") : t("Buat ruang kerja baru.")}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                {mode === "login"
                  ? t("Kelola proyek klien, deadline, dan tugas tim dari satu papan.")
                  : t("Cukup 30 detik. Setelah itu kamu bisa langsung menceritakan proyek pertama.")}
              </p>
            </div>

            {mode === "login" && (
              <div className="mb-5 rounded-xl border border-mint-2 bg-green-soft p-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green text-mint">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-bold text-green">
                      {t("Akun demo siap dipakai")}
                    </div>
                    <div className="mt-1 text-[11.5px] leading-relaxed text-green/70">
                      {t("Sudah berisi 4 proyek, 47 tugas, kalender, dan hari libur contoh.")}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-green/80">
                      <span>demo@tuntas.id</span>
                      <span>demo123</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary mt-3 w-full"
                  disabled={loading !== null}
                  onClick={() => submitLogin("demo@tuntas.id", "demo123", "demo")}
                >
                  {loading === "demo" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("Membuka demo…")}
                    </>
                  ) : (
                    <>
                      {t("Masuk dengan akun demo")} <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-danger/20 bg-danger/[0.06] px-3.5 py-2.5 text-[12.5px] font-medium text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "register" && (
                <>
                  <div>
                    <label className="label" htmlFor="name">
                      {t("Nama kamu")}
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="name"
                        className="field pl-9"
                        value={form.name}
                        onChange={(event) => update("name", event.target.value)}
                        placeholder="Made Arta"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="businessName">
                      {t("Nama usaha")}
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="businessName"
                        className="field pl-9"
                        value={form.businessName}
                        onChange={(event) => update("businessName", event.target.value)}
                        placeholder="Made Art Studio"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="label" htmlFor="email">
                  {t("Email")}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="email"
                    type="email"
                    className="field pl-9"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    placeholder={lang === "en" ? "name@business.id" : "nama@usaha.id"}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="password">
                  {t("Password")}
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="password"
                    type="password"
                    className="field pl-9"
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                    placeholder={mode === "register" ? t("Minimal 6 karakter") : "••••••••"}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading !== null}>
                {loading === "form" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("Memproses…")}
                  </>
                ) : mode === "login" ? (
                  <>
                    {t("Masuk")} <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t("Buat akun")} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-[12.5px] text-muted">
              {mode === "login" ? (
                <>
                  {t("Belum punya akun?")}{" "}
                  <button
                    type="button"
                    className="font-semibold text-green underline-offset-2 hover:underline"
                    onClick={() => {
                      setMode("register");
                      setError("");
                    }}
                  >
                    {t("Buat akun baru")}
                  </button>
                </>
              ) : (
                <>
                  {t("Sudah punya akun?")}{" "}
                  <button
                    type="button"
                    className="font-semibold text-green underline-offset-2 hover:underline"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                  >
                    {t("Masuk")}
                  </button>
                </>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-muted/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("Password di-hash · sesi aman di server lokal")}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
