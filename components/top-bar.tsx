"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, MessageCircle, Search, X } from "lucide-react";
import { Avatar } from "./avatar";
import { useI18n } from "./language-provider";
import { relativeDeadline } from "@/lib/dates";
import type { PublicUser } from "@/lib/types";

interface ProjectLink {
  id: string;
  title: string;
  clientName: string;
  deadline: string;
}

export function TopBar({
  user,
  projects,
}: {
  user: PublicUser;
  projects: ProjectLink[];
}) {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects.slice(0, 4);
    return projects
      .filter(
        (project) =>
          project.title.toLowerCase().includes(needle) ||
          project.clientName.toLowerCase().includes(needle),
      )
      .slice(0, 6);
  }, [projects, query]);

  function openProject(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/proyek/${id}`);
  }

  return (
    <header className="flex items-center gap-3">
      <div className="relative w-full max-w-[380px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
            if (event.key === "Enter" && results[0]) openProject(results[0].id);
          }}
          placeholder={t("Cari tugas atau proyek…")}
          aria-label={t("Cari tugas atau proyek")}
          className="h-11 w-full rounded-xl border border-line bg-card pl-11 pr-14 text-[13px] text-ink outline-none transition placeholder:text-[#a79fb8] focus:border-[#a78bfa] focus:ring-[3px] focus:ring-[#7c3aed]/10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-muted">
          /
        </span>
        {query && (
          <button
            type="button"
            className="absolute right-10 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-paper hover:text-ink"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label={t("Hapus pencarian")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              aria-label={t("Tutup pencarian")}
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-full z-40 mt-2 w-[360px] overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[0_24px_50px_-24px_rgba(30,20,60,0.35)] animate-fade-in">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                {query ? t("Hasil pencarian") : t("Proyek terakhir")}
              </div>
              {results.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => openProject(project.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-paper"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-soft text-[10px] font-bold text-green">
                    {project.title.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-ink">
                      {project.title}
                    </span>
                    <span className="block truncate text-[10.5px] text-muted">
                      {project.clientName} · {relativeDeadline(project.deadline, lang)}
                    </span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                </button>
              ))}
              {!results.length && (
                <div className="px-3 py-5 text-center text-[11.5px] leading-relaxed text-muted">
                  {t("Tidak ada proyek yang cocok. Coba kata lain atau buat proyek baru.")}
                </div>
              )}
              <Link
                href="/proyek"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-between rounded-xl border border-line bg-paper px-2.5 py-2 text-[11.5px] font-semibold text-ink-2 transition hover:text-ink"
              >
                {t("Lihat semua proyek")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden items-center rounded-xl border border-line bg-card p-0.5 sm:flex">
          {(["id", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                lang === code ? "bg-green text-white" : "text-muted hover:text-ink"
              }`}
              aria-pressed={lang === code}
            >
              {code}
            </button>
          ))}
        </div>
        <Link
          href="/klien"
          className="icon-btn h-10 w-10 rounded-xl border border-line bg-card text-ink-2 hover:bg-paper"
          title={t("Klien")}
          aria-label={t("Klien")}
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
        <Link
          href="/hari-ini"
          className="icon-btn relative h-10 w-10 rounded-xl border border-line bg-card text-ink-2 hover:bg-paper"
          title={t("Tugas hari ini")}
          aria-label={t("Tugas hari ini")}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-green ring-2 ring-white" />
        </Link>
        <div className="ml-2 hidden items-center gap-2.5 border-l border-line pl-3 sm:flex">
          <Avatar name={user.name} size="md" />
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold text-ink">{user.name}</div>
            <div className="truncate text-[10.5px] text-muted">{user.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
