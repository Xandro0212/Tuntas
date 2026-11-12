"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Columns3,
  FolderKanban,
  History,
  LayoutList,
  LogOut,
  Menu,
  Plus,
  Sun,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { TopBar } from "./top-bar";
import { useI18n } from "./language-provider";
import { diffDays, formatShortDate, initials, relativeDeadline, todayISO } from "@/lib/dates";
import type { PublicUser } from "@/lib/types";

interface ProjectLink {
  id: string;
  title: string;
  clientName: string;
  deadline: string;
}

const NAV = [
  { href: "/hari-ini", label: "Hari ini", icon: Sun, match: (path: string) => path === "/hari-ini" },
  {
    href: "/kanban",
    label: "Kanban",
    icon: Columns3,
    match: (path: string) =>
      path.startsWith("/proyek/") && path !== "/proyek/baru" && !path.endsWith("/kalender"),
  },
  {
    href: "/kalender",
    label: "Kalender",
    icon: CalendarDays,
    match: (path: string) => path.endsWith("/kalender"),
  },
  {
    href: "/proyek",
    label: "Proyek",
    icon: FolderKanban,
    match: (path: string) => path === "/proyek" || path === "/proyek/baru",
  },
  { href: "/klien", label: "Klien", icon: Users, match: (path: string) => path.startsWith("/klien") },
  {
    href: "/aktivitas",
    label: "Aktivitas",
    icon: History,
    match: (path: string) => path.startsWith("/aktivitas"),
  },
];

const OWNER_NAV = [
  ...NAV,
  {
    href: "/tim",
    label: "Tim",
    icon: UsersRound,
    match: (path: string) => path.startsWith("/tim"),
  },
];

function AccountMenu({ user, onLogout }: { user: PublicUser; onLogout: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-card p-2 text-left transition hover:bg-paper"
        aria-label={t("Menu akun")}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-soft text-[11px] font-bold text-green">
          {initials(user.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold text-ink">{user.name}</span>
          <span className="block truncate text-[10.5px] text-muted">{user.email}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label={t("Tutup menu")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 z-40 mb-2 w-[238px] overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[0_24px_50px_-24px_rgba(30,20,60,0.35)] animate-fade-in">
            <div className="px-2.5 py-2">
              <div className="text-[12px] font-semibold text-ink">{user.name}</div>
              <div className="truncate text-[10.5px] text-muted">{user.email}</div>
            </div>
            <div className="divider my-1" />
            <Link
              href="/proyek/baru"
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] text-ink-2 hover:bg-paper hover:text-ink"
              onClick={() => setOpen(false)}
            >
              <Plus className="h-3.5 w-3.5" /> {t("Proyek baru")}
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] text-danger hover:bg-rust-soft"
            >
              <LogOut className="h-3.5 w-3.5" /> {t("Keluar")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({
  user,
  projects,
  children,
}: {
  user: PublicUser;
  projects: ProjectLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();
  const [mobileMenu, setMobileMenu] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const activeId = pathname.startsWith("/proyek/") ? pathname.split("/")[2] : undefined;
  const navigation = user.role === "owner" ? OWNER_NAV : NAV;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-5">
        <Link href="/" aria-label={t("Tuntas — beranda")}>
          <Logo />
        </Link>
        <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-line bg-paper px-2.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-soft text-[10.5px] font-bold text-green">
            {initials(user.businessName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11.5px] font-semibold text-ink">{user.businessName}</div>
            <div className="truncate text-[10px] text-muted">{t("Ruang kerja UMKM")}</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <div className="section-title px-3 pb-1.5">{t("Menu")}</div>
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
              >
                <item.icon className="h-4 w-4" strokeWidth={active ? 2.3 : 1.9} />
                {t(item.label)}
                {item.href === "/proyek" && projects.length > 0 && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-green-soft text-green"
                    }`}
                  >
                    {projects.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 flex items-center justify-between px-3 pb-1.5">
          <span className="section-title">{t("Proyek")}</span>
          <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-muted">
            {projects.length}
          </span>
        </div>
        <div className="space-y-1">
          {projects.map((project) => {
            const active = activeId === project.id;
            const late = diffDays(todayISO(), project.deadline) < 0;
            return (
              <Link
                key={project.id}
                href={`/proyek/${project.id}`}
                className={`block rounded-xl px-2.5 py-2 transition ${
                  active
                    ? "border border-[#ddd0fb] bg-green-soft"
                    : "border border-transparent hover:bg-paper"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      active ? "bg-green" : late ? "bg-rust" : "bg-line-strong"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-[12px] font-semibold ${
                        active ? "text-green" : "text-ink"
                      }`}
                    >
                      {project.title}
                    </div>
                    <div className="truncate text-[10px] text-muted">{project.clientName}</div>
                    <div
                      className={`mt-0.5 text-[10px] font-medium ${
                        late ? "text-rust" : "text-muted"
                      }`}
                    >
                      {formatShortDate(project.deadline, lang)} · {relativeDeadline(project.deadline, lang)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {!projects.length && (
            <div className="rounded-xl border border-dashed border-line-strong px-3 py-4 text-center text-[11px] leading-relaxed text-muted">
              {t("Belum ada proyek. Ceritakan pesanan pertamamu.")}
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-2 lg:hidden">
        <div className="flex items-center justify-between rounded-xl border border-line bg-card px-2.5 py-1.5">
          <span className="text-[10.5px] font-semibold text-muted">{t("Bahasa")}</span>
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
      </div>

      <div className="border-t border-line px-3 py-3">
        <AccountMenu user={user} onLogout={logout} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line bg-card lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-card/95 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label={t("Tuntas — beranda")}>
          <Logo />
        </Link>
        <div className="flex items-center gap-1.5">
          <Link href="/proyek/baru" className="icon-btn" aria-label={t("Proyek baru")}>
            <Plus className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMobileMenu(true)}
            aria-label={t("Buka menu")}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1a1230]/40 backdrop-blur-sm"
            aria-label={t("Tutup menu")}
            onClick={() => setMobileMenu(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[286px] border-r border-line bg-card shadow-2xl animate-slide-up">
            <button
              type="button"
              className="absolute right-2 top-2 z-10 icon-btn"
              onClick={() => setMobileMenu(false)}
              aria-label={t("Tutup")}
            >
              <X className="h-4.5 w-4.5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="pb-28 lg:pb-8 lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1540px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="hidden lg:block">
            <TopBar user={user} projects={projects} />
          </div>
          <div className="mt-0 lg:mt-5">{children}</div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
          {[
            { href: "/hari-ini", label: "Hari ini", icon: LayoutList, match: (path: string) => path === "/hari-ini" },
            { href: "/kanban", label: "Kanban", icon: Columns3, match: (path: string) => path.startsWith("/proyek/") && path !== "/proyek/baru" && !path.endsWith("/kalender") },
            { href: "/kalender", label: "Kalender", icon: CalendarDays, match: (path: string) => path.endsWith("/kalender") },
            { href: "/proyek", label: "Proyek", icon: FolderKanban, match: (path: string) => path === "/proyek" || path === "/proyek/baru" },
          ].map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition ${
                  active ? "bg-green text-white" : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <item.icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.4 : 1.9} />
                {t(item.label)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
