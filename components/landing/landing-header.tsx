"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Languages, Menu, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { DemoButton } from "./demo-button";
import type { LandingCopy, Lang } from "./copy";

const LINKS = [
  { href: "#fitur", key: "features" as const },
  { href: "#cara-kerja", key: "how" as const },
  { href: "#untuk-siapa", key: "who" as const },
  { href: "#demo", key: "demo" as const },
];

export function LandingHeader({
  isLoggedIn,
  lang,
  onLanguageChange,
  copy,
}: {
  isLoggedIn: boolean;
  lang: Lang;
  onLanguageChange: (lang: Lang) => void;
  copy: LandingCopy;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-card/80 shadow-[0_20px_40px_-32px_rgba(76,29,149,0.3)] backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Tuntas — beranda">
          <Logo variant="dark" />
        </Link>

        <nav className="hidden items-center gap-7 text-[12.5px] font-semibold text-ink-2 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-ink">
              {copy.nav[link.key]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-0.5 rounded-lg border border-line bg-paper p-0.5 sm:flex">
            <Languages className="mx-1 h-3 w-3 text-muted" />
            {(["id", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onLanguageChange(code)}
                className={`rounded-md px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide transition ${
                  lang === code
                    ? "bg-paper text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
                aria-pressed={lang === code}
                aria-label={code === "id" ? "Bahasa Indonesia" : "English"}
              >
                {code}
              </button>
            ))}
          </div>
          {!isLoggedIn && (
            <Link
              href="/login"
              className="hidden rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-ink-2 transition hover:bg-paper hover:text-ink md:block"
            >
              {copy.signIn}
            </Link>
          )}
          <DemoButton
            isLoggedIn={isLoggedIn}
            label={isLoggedIn ? copy.workspace : copy.tryDemo}
            className="btn-primary btn-sm shrink-0"
          />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="icon-btn lg:hidden"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-4 mb-3 overflow-hidden rounded-2xl border border-line bg-card p-2 shadow-2xl backdrop-blur-2xl lg:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[12.5px] font-semibold text-ink-2 transition hover:bg-paper hover:text-ink"
            >
              {copy.nav[link.key]} <ArrowUpRight className="h-3.5 w-3.5 text-green" />
            </a>
          ))}
          <div className="mt-1 flex items-center justify-between rounded-xl border border-line bg-paper px-3 py-2">
            <span className="text-[11px] font-semibold text-ink-2">{copy.language}</span>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-paper p-0.5">
              {(["id", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLanguageChange(code)}
                  className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition ${
                    lang === code ? "bg-paper text-ink" : "text-muted"
                  }`}
                  aria-pressed={lang === code}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          <Link
            href={isLoggedIn ? "/kanban" : "/login"}
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center justify-between rounded-xl border border-line bg-paper px-3 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-paper"
          >
            {isLoggedIn ? copy.openWorkspace : copy.signInWorkspace}
            <ArrowUpRight className="h-3.5 w-3.5 text-green" />
          </Link>
          <div className="px-3 pb-1 pt-2 text-[10px] text-muted">
            <Sparkles className="mr-1 inline h-3 w-3 text-green" />
            {copy.hero.trust[0]}
          </div>
        </div>
      )}
    </header>
  );
}
