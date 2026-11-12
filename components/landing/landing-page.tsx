"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  Columns3,
  Hammer,
  ListChecks,
  MessageCircle,
  Mic,
  ShieldCheck,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Wand2,
  Zap,
} from "lucide-react";
import { BrandMark, Logo } from "@/components/logo";
import { LandingHeader } from "./landing-header";
import { DemoButton } from "./demo-button";
import { Reveal } from "./reveal";
import { Counter } from "./counter";
import { HeroBoard } from "./hero-board";
import { LANDING_COPY, type LandingCopy, type Lang } from "./copy";
import { useI18n } from "@/components/language-provider";

const STAT_VALUES = [18, 0, 10, 4];
const STAT_ICONS = [Wand2, CalendarDays, ShieldCheck, Columns3];
const STEP_ICONS = [Mic, Sparkles, ListChecks, Columns3];
const CATEGORY_ICONS = [Hammer, UtensilsCrossed, Shirt, Briefcase, Zap];

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-[720px] text-center" : "max-w-[720px]"}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-green">
        <span className="h-1 w-1 rounded-full bg-green shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
        {eyebrow}
      </div>
      <h2 className="mt-3 text-[30px] font-extrabold leading-[1.08] tracking-[-0.04em] text-ink sm:text-[38px]">
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-[13px] leading-relaxed text-muted sm:text-[14px] ${center ? "mx-auto max-w-[580px]" : "max-w-[600px]"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  tag,
  title,
  description,
  children,
  className = "",
}: {
  icon: React.ElementType;
  tag: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`panel group relative flex h-full flex-col overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-green/25 sm:p-6 ${className}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-green/10 blur-2xl transition duration-500 group-hover:bg-green/20" />
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-green/20 bg-green-soft text-green shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted">{tag}</span>
      </div>
      <h3 className="relative mt-4 text-[18px] font-bold leading-snug tracking-[-0.025em] text-ink sm:text-[19px]">
        {title}
      </h3>
      <p className="relative mt-1.5 text-[12px] leading-relaxed text-muted">{description}</p>
      <div className="relative mt-auto pt-5">{children}</div>
    </article>
  );
}

function AiFeature({ lang, copy }: { lang: Lang; copy: LandingCopy["features"]["ai"] }) {
  const tasks =
    lang === "en"
      ? [
          ["3-view sketch", "3 days"],
          ["Fiberglass casting", "4 days"],
          ["Delivery & install", "2 days"],
        ]
      : [
          ["Sketsa 3 tampak", "3 hari"],
          ["Cetak fiberglass", "4 hari"],
          ["Pengiriman & pasang", "2 hari"],
        ];
  const options =
    lang === "en"
      ? ["Yes, my team", "Client handles it", "Use a vendor"]
      : ["Ya, tim saya", "Dikerjakan klien", "Pakai vendor"];

  return (
    <FeatureCard
      icon={Sparkles}
      tag={copy.tag}
      title={copy.title}
      description={copy.description}
      className="lg:col-span-7"
    >
      <div className="space-y-2">
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md border border-line bg-paper p-3 text-[10.5px] leading-relaxed text-ink-2">
          {lang === "en"
            ? "“2-meter fiberglass horse statue, bronze finish. Deadline 7 Dec, installed in the provincial office lobby. The client wants to see the sketch first.”"
            : "“Patung kuda fiberglass 2 meter, finishing perunggu. Deadline 7 Des, dipasang di lobby kantor dinas. Klien mau lihat sketsa dulu.”"}
        </div>
        <div className="max-w-[93%] rounded-2xl rounded-bl-md border border-green/20 bg-green-soft p-3">
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-green">
            <Sparkles className="h-3 w-3" /> {lang === "en" ? "Tuntas AI" : "Tuntas AI"}
            <span className="ml-1 flex gap-0.5">
              <span className="typing-dot h-1 w-1 rounded-full bg-green" />
              <span className="typing-dot h-1 w-1 rounded-full bg-green" />
              <span className="typing-dot h-1 w-1 rounded-full bg-green" />
            </span>
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-2">
            {lang === "en"
              ? "I found 18 tasks across 4 phases. Does installation at the site count as your team's job?"
              : "Aku dapat 18 tugas dalam 4 tahap. Pemasangan di lokasi termasuk tugasmu?"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.map((option, index) => (
              <span
                key={option}
                className={
                  index === 0
                    ? "rounded-full bg-green px-2.5 py-1 text-[8.5px] font-bold text-white"
                    : "rounded-full border border-line px-2.5 py-1 text-[8.5px] font-medium text-ink-2"
                }
              >
                {option}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5 pt-1 sm:grid-cols-3">
          {tasks.map(([title, duration]) => (
            <div
              key={title}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2 py-1.5 text-[8.5px]"
            >
              <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green" />
              <span className="truncate font-semibold text-ink-2">{title}</span>
              <span className="ml-auto shrink-0 text-muted">{duration}</span>
            </div>
          ))}
        </div>
      </div>
    </FeatureCard>
  );
}

function KanbanFeature({ lang, copy }: { lang: Lang; copy: LandingCopy["features"]["kanban"] }) {
  const columns =
    lang === "en"
      ? [
          { label: "Not started", count: 10, tone: "#94a3b8", items: ["Sanding & filling", "Finishing coat"] },
          { label: "In progress", count: 1, tone: "#8b5cf6", items: ["Fiberglass casting"] },
          { label: "Done", count: 6, tone: "#6d28d9", items: ["3-view sketch", "Steel frame"] },
        ]
      : [
          { label: "Belum", count: 10, tone: "#94a3b8", items: ["Dempul & amplas", "Finishing cat"] },
          { label: "Jalan", count: 1, tone: "#8b5cf6", items: ["Cetak fiberglass"] },
          { label: "Selesai", count: 6, tone: "#6d28d9", items: ["Sketsa 3 tampak", "Rangka besi"] },
        ];

  return (
    <FeatureCard
      icon={Columns3}
      tag={copy.tag}
      title={copy.title}
      description={copy.description}
      className="lg:col-span-5"
    >
      <div className="grid grid-cols-3 gap-1.5">
        {columns.map((column) => (
          <div key={column.label} className="rounded-xl border border-line bg-paper p-1.5">
            <div className="mb-1.5 flex items-center gap-1 px-0.5 text-[8px] font-bold text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: column.tone }} />
              {column.label}
              <span className="ml-auto text-muted">{column.count}</span>
            </div>
            <div className="space-y-1.5">
              {column.items.map((item) => (
                <div key={item} className="rounded-lg border border-line bg-paper p-1.5 text-[8px] font-semibold leading-tight text-ink-2">
                  {item}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="h-1 w-7 rounded-full" style={{ background: column.tone, opacity: 0.6 }} />
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-paper-2 text-[5.5px]">W</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </FeatureCard>
  );
}

function CalendarFeature({ lang, copy }: { lang: Lang; copy: LandingCopy["features"]["calendar"] }) {
  const days = [
    ["2", ""],
    ["3", "mint"],
    ["4", ""],
    ["5", "mint"],
    ["6", "amber"],
    ["7", ""],
    ["8", ""],
    ["9", "mint"],
    ["10", "mint"],
    ["11", ""],
    ["12", "mint"],
    ["13", ""],
    ["14", "amber"],
    ["15", ""],
    ["16", ""],
    ["17", "mint"],
    ["18", "mint"],
    ["19", ""],
    ["20", ""],
    ["21", ""],
    ["22", ""],
  ];

  return (
    <FeatureCard
      icon={CalendarDays}
      tag={copy.tag}
      title={copy.title}
      description={copy.description}
      className="lg:col-span-4"
    >
      <div className="rounded-xl border border-line bg-paper p-2.5">
        <div className="grid grid-cols-7 gap-1 text-center text-[7px] font-bold text-muted">
          {(lang === "en"
            ? ["M", "T", "W", "T", "F", "S", "S"]
            : ["S", "S", "R", "K", "J", "S", "M"]
          ).map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {days.map(([day, tone], index) => (
            <span
              key={`${day}-${index}`}
              className={`flex h-5 items-center justify-center rounded text-[7.5px] font-semibold ${
                tone === "amber"
                  ? "bg-green text-white"
                  : tone === "mint"
                    ? "border border-green/20 bg-green-soft text-ink-2"
                    : "border border-line/60 text-muted"
              }`}
            >
              {day}
            </span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-full border border-green/20 bg-green-soft px-2 py-0.5 text-[7px] font-semibold text-green">
            {lang === "en" ? "Holiday Nov 25" : "Libur 25 Nov"}
          </span>
          <span className="rounded-full bg-green px-2 py-0.5 text-[7px] font-bold text-white">
            {lang === "en" ? "Deadline Dec 7" : "Deadline 7 Des"}
          </span>
          <span className="rounded-full border border-dashed border-green/30 px-2 py-0.5 text-[7px] text-muted">
            {lang === "en" ? "Buffer" : "Cadangan"}
          </span>
        </div>
      </div>
    </FeatureCard>
  );
}

function TodayFeature({ lang, copy }: { lang: Lang; copy: LandingCopy["features"]["today"] }) {
  const rows =
    lang === "en"
      ? [
          { name: "Bu Sari", task: "Buy vegetables & spices", time: "14.00", done: false, initials: "BS" },
          { name: "Kadek", task: "Pick up 20 kg chicken order", time: "late", done: false, initials: "K" },
          { name: "Made", task: "Confirm the final menu", time: "09.10", done: true, initials: "M" },
        ]
      : [
          { name: "Bu Sari", task: "Belanja sayur & bumbu", time: "14.00", done: false, initials: "BS" },
          { name: "Kadek", task: "Ambil pesanan ayam 20 kg", time: "terlambat", done: false, initials: "K" },
          { name: "Made", task: "Konfirmasi menu final", time: "09.10", done: true, initials: "M" },
        ];

  return (
    <FeatureCard
      icon={ListChecks}
      tag={copy.tag}
      title={copy.title}
      description={copy.description}
      className="lg:col-span-4"
    >
      <div className="space-y-1.5">
        {rows.map((item) => (
          <div key={item.task} className="flex items-center gap-2 rounded-lg border border-line bg-paper p-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-line text-[7px] font-bold text-ink-2">
              {item.done ? <Check className="h-3 w-3 text-green" /> : ""}
            </span>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] text-[6.5px] font-bold text-white">
              {item.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-[8.5px] font-semibold ${item.done ? "text-muted line-through" : "text-ink-2"}`}>
                {item.task}
              </div>
              <div className="text-[7px] text-muted">
                {item.name} · {item.time}
              </div>
            </div>
            {(item.time === "terlambat" || item.time === "late") && (
              <span className="shrink-0 rounded-full bg-rust-soft px-1.5 py-0.5 text-[6.5px] font-bold text-rust">
                {lang === "en" ? "Late" : "Terlambat"}
              </span>
            )}
          </div>
        ))}
      </div>
    </FeatureCard>
  );
}

function WhatsAppFeature({ lang, copy }: { lang: Lang; copy: LandingCopy["features"]["reminder"] }) {
  return (
    <FeatureCard
      icon={MessageCircle}
      tag={copy.tag}
      title={copy.title}
      description={copy.description}
      className="lg:col-span-4"
    >
      <div className="space-y-2">
        <div className="rounded-2xl rounded-bl-md border border-green/20 bg-green-soft p-3 text-[9.5px] leading-relaxed text-ink-2">
          {lang === "en"
            ? "Om swastyastu Ms. Ayu, for the Horse Statue project we are waiting for confirmation of the nameplate text. Could you confirm today? 🙏"
            : "Om swastyastu Bu Ayu, untuk proyek Patung Kuda kami menunggu konfirmasi teks plakat nama. Boleh dibantu konfirmasi hari ini? 🙏"}
        </div>
        <div className="ml-auto flex w-fit items-center gap-1.5 rounded-full bg-green px-2.5 py-1 text-[8px] font-bold text-white">
          <MessageCircle className="h-2.5 w-2.5" /> {lang === "en" ? "Open WhatsApp" : "Buka WhatsApp"}
        </div>
        <div className="flex items-center gap-1 text-[7.5px] text-muted">
          <Check className="h-2.5 w-2.5 text-green" />{" "}
          {lang === "en" ? "Draft only · not sent automatically" : "Draf saja · tidak terkirim otomatis"}
        </div>
      </div>
    </FeatureCard>
  );
}

function DeadlineFeature({ lang, copy }: { lang: Lang; copy: LandingCopy["features"]["deadline"] }) {
  const stats =
    lang === "en"
      ? [
          { label: "Client deadline", value: "7 Dec", note: "31 days left", tone: "text-ink" },
          { label: "Progress", value: "6/18", note: "33% done", tone: "text-green" },
          { label: "Buffer time", value: "2 days", note: "still safe", tone: "text-green" },
        ]
      : [
          { label: "Deadline klien", value: "7 Des", note: "31 hari lagi", tone: "text-ink" },
          { label: "Progres", value: "6/18", note: "33% selesai", tone: "text-green" },
          { label: "Cadangan waktu", value: "2 hari", note: "masih aman", tone: "text-green" },
        ];

  return (
    <FeatureCard
      icon={AlarmClock}
      tag={copy.tag}
      title={copy.title}
      description={copy.description}
      className="lg:col-span-12"
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-paper p-3">
            <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-muted">{stat.label}</div>
            <div className={`mt-1 text-[20px] font-extrabold leading-none ${stat.tone}`}>{stat.value}</div>
            <div className="mt-1 text-[8px] text-muted">{stat.note}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2">
        <div
          className="animate-grow h-full rounded-full bg-gradient-to-r from-[#a78bfa] via-[#8b5cf6] to-[#6d28d9]"
          style={{ "--bar-width": "33%" } as React.CSSProperties}
        />
      </div>
    </FeatureCard>
  );
}

export function LandingPage({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean;
  userName: string | null;
}) {
  const { lang, setLang } = useI18n();

  useEffect(() => {
    document.title =
      lang === "en"
        ? "Tuntas — Your AI Companion for Getting Things Done"
        : "Tuntas — Kerja Lebih Cerdas, Hasil Lebih Tuntas";
  }, [lang]);

  const copy = LANDING_COPY[lang];
  const [featureTitleFirst, ...featureTitleRest] = copy.features.title.split(". ");
  const heroTitleSize =
    lang === "en"
      ? "text-[34px] sm:text-[44px] lg:text-[54px] xl:text-[58px]"
      : "text-[41px] sm:text-[56px] lg:text-[67px] xl:text-[73px]";

  return (
    <div className="landing-shell relative min-h-screen overflow-x-clip">
      <LandingHeader
        isLoggedIn={isLoggedIn}
        lang={lang}
        onLanguageChange={setLang}
        copy={copy}
      />

      <main className="relative">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[url('/brand/landing-bg.png')] bg-cover bg-[center_top] bg-no-repeat opacity-95"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_40%,rgba(247,245,252,0.86)_92%,#f7f5fc_100%)]"
            aria-hidden="true"
          />
          <div className="landing-grid pointer-events-none absolute inset-0" />
          <div className="landing-orbs pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-5 pb-14 pt-[124px] sm:px-6 lg:grid-cols-[1.03fr_0.97fr] lg:gap-6 lg:px-8 lg:pb-20 lg:pt-[160px]">
            <Reveal className="relative z-10 max-w-[640px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-green/25 bg-green-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-green backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> {copy.hero.badge}
              </div>
              <h1
                className={`mt-5 font-extrabold leading-[1.02] tracking-[-0.052em] text-ink ${heroTitleSize}`}
              >
                {copy.hero.line1}
                <br />
                {copy.hero.line3 ? (
                  <>
                    {copy.hero.line2}
                    <br />
                    <span className="relative inline-block">
                      <span className="text-gradient">{copy.hero.line3}</span>
                      <svg
                        className="hero-underline text-green"
                        viewBox="0 0 300 18"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 12C74 4 186 4 296 9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                      </svg>
                    </span>
                  </>
                ) : (
                  <span className="relative inline-block">
                    <span className="text-gradient">{copy.hero.line2}</span>
                    <svg
                      className="hero-underline text-green"
                      viewBox="0 0 300 18"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 12C74 4 186 4 296 9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.7"
                      />
                    </svg>
                  </span>
                )}
              </h1>
              {copy.hero.tagline && (
                <p className="mt-5 max-w-[560px] text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink sm:text-[18px]">
                  {copy.hero.tagline}
                </p>
              )}
              <p
                className={`max-w-[560px] text-[14px] leading-relaxed text-ink-2/85 sm:text-[15.5px] ${
                  copy.hero.tagline ? "mt-3" : "mt-6"
                }`}
              >
                {copy.hero.description}
              </p>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <DemoButton
                  isLoggedIn={isLoggedIn}
                  label={isLoggedIn ? copy.openWorkspace : copy.hero.ctaDemo}
                  className="btn-primary w-full sm:w-auto"
                />
                <a href="#cara-kerja" className="btn-secondary w-full sm:w-auto">
                  {copy.hero.ctaHow} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10.5px] font-medium text-muted">
                {copy.hero.trust.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-green" /> {item}
                  </span>
                ))}
              </div>

              {isLoggedIn && userName && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[10.5px] text-ink-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_10px_rgba(124,58,237,0.45)]" />
                  {copy.hero.signedInAs}{" "}
                  <span className="font-semibold text-ink">{userName}</span>
                </div>
              )}
            </Reveal>

            <Reveal delay={120} className="relative z-10">
              <HeroBoard lang={lang} />
            </Reveal>
          </div>

          <div className="relative mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 pb-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2">
              <BrandMark className="h-4 w-4" /> {copy.hero.demoStats}
            </span>
            <a href="#fitur" className="hidden items-center gap-1.5 transition hover:text-ink sm:inline-flex">
              {copy.hero.explore} <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </section>

        {/* MARQUEE */}
        <section className="marquee relative overflow-hidden border-y border-line bg-paper/60 py-3.5">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#f7f5fc] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f7f5fc] to-transparent" />
          <div className="flex w-max animate-marquee items-center">
            {[0, 1].map((group) => (
              <div
                key={group}
                aria-hidden={group === 1}
                className="flex shrink-0 items-center gap-10 px-5"
              >
                {copy.marquee.map((item) => (
                  <span
                    key={`${group}-${item}`}
                    className="inline-flex items-center gap-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-muted"
                  >
                    <span className="h-1 w-1 rounded-full bg-green/80" />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="relative mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {copy.stats.map((label, index) => {
              const Icon = STAT_ICONS[index];
              return (
                <Reveal key={label} delay={index * 70}>
                  <div
                    className={`h-full p-4 sm:p-5 ${
                      index === 0
                        ? "relative overflow-hidden rounded-[18px] bg-[linear-gradient(140deg,#7c3aed_0%,#6425c9_55%,#4c1d95_100%)] text-white shadow-[0_22px_40px_-24px_rgba(76,29,149,0.65)]"
                        : "panel"
                    }`}
                  >
                    {index === 0 && (
                      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
                    )}
                    <div className="relative flex items-center justify-between">
                      <span
                        className={`text-[8.5px] font-bold uppercase tracking-[0.15em] ${
                          index === 0 ? "text-white/70" : "text-muted"
                        }`}
                      >
                        {label}
                      </span>
                      <Icon className={`h-3.5 w-3.5 ${index === 0 ? "text-white" : "text-green"}`} />
                    </div>
                    <div
                      className={`relative mt-2 text-[31px] font-extrabold leading-none tracking-[-0.04em] sm:text-[36px] ${
                        index === 0 ? "text-white" : "text-ink"
                      }`}
                    >
                      <Counter
                        value={STAT_VALUES[index]}
                        suffix={index === 2 ? "%" : ""}
                      />
                    </div>
                    <div
                      className={`relative mt-2 h-px w-8 bg-gradient-to-r to-transparent ${
                        index === 0 ? "from-white/60" : "from-green"
                      }`}
                    />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* FEATURES */}
        <section id="fitur" className="landing-section mx-auto max-w-[1240px] px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow={copy.features.eyebrow}
              title={
                <>
                  {featureTitleFirst}.
                  <br className="hidden sm:block" /> {featureTitleRest.join(". ")}
                </>
              }
              description={copy.features.description}
            />
          </Reveal>

          <div className="mt-8 grid gap-3.5 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <AiFeature lang={lang} copy={copy.features.ai} />
            </Reveal>
            <Reveal delay={90} className="lg:col-span-5">
              <KanbanFeature lang={lang} copy={copy.features.kanban} />
            </Reveal>
            <Reveal className="lg:col-span-4">
              <CalendarFeature lang={lang} copy={copy.features.calendar} />
            </Reveal>
            <Reveal delay={90} className="lg:col-span-4">
              <TodayFeature lang={lang} copy={copy.features.today} />
            </Reveal>
            <Reveal delay={180} className="lg:col-span-4">
              <WhatsAppFeature lang={lang} copy={copy.features.reminder} />
            </Reveal>
            <Reveal className="lg:col-span-12">
              <DeadlineFeature lang={lang} copy={copy.features.deadline} />
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="cara-kerja" className="landing-section relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-[640px] -translate-x-1/2 rounded-full bg-green/10 blur-[100px]" />
          <div className="relative mx-auto max-w-[1240px] px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
            <Reveal>
              <SectionHeading
                eyebrow={copy.how.eyebrow}
                title={copy.how.title}
                description={copy.how.description}
                center
              />
            </Reveal>

            <div className="relative mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pointer-events-none absolute left-[8%] right-[8%] top-12 hidden h-px bg-gradient-to-r from-transparent via-green/30 to-transparent lg:block" />
              {copy.how.steps.map((step, index) => {
                const Icon = STEP_ICONS[index];
                return (
                  <Reveal key={step.title} delay={index * 80} className="h-full">
                    <div className="glass-soft relative flex h-full flex-col rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] via-[#8b5cf6] to-[#6d28d9] text-[12px] font-extrabold text-white shadow-[0_10px_22px_-10px_rgba(109,40,217,0.5)]">
                          {index + 1}
                        </span>
                        <Icon className="h-4 w-4 text-green" />
                      </div>
                      <h3 className="mt-4 text-[13.5px] font-bold text-ink">{step.title}</h3>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{step.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={150}>
              <div className="mt-3.5 flex items-start gap-3 rounded-2xl border border-green/20 bg-green-soft p-4 sm:items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green text-white">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <p className="text-[11px] leading-relaxed text-ink-2">
                  <span className="font-bold text-ink">{copy.how.noteStrong}</span> {copy.how.note}
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CATEGORIES */}
        <section id="untuk-siapa" className="landing-section mx-auto max-w-[1240px] px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Reveal>
            <SectionHeading
              eyebrow={copy.who.eyebrow}
              title={copy.who.title}
              description={copy.who.description}
            />
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
            {copy.who.categories.map((category, index) => {
              const Icon = CATEGORY_ICONS[index];
              return (
                <Reveal key={category.title} delay={index * 60} className="h-full">
                  <div className="panel group flex h-full flex-col p-4 transition duration-300 hover:-translate-y-1 hover:border-green/25">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-green/20 bg-green-soft text-green">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-3 text-[13px] font-bold text-ink">{category.title}</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted">{category.examples}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* DEMO CTA */}
        <section id="demo" className="landing-section mx-auto max-w-[1240px] px-5 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-[30px] border border-[#ddd0fb] bg-[linear-gradient(135deg,#f5f0ff_0%,#ede7fc_55%,#e5dbfa_100%)] p-5 shadow-[0_40px_80px_-45px_rgba(76,29,149,0.3)] sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-green/20 blur-[90px] animate-glow" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-rust/10 blur-[80px]" />
              <div className="pointer-events-none absolute inset-0 opacity-30 landing-grid" />

              <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <Logo variant="dark" size="lg" />
                  <h2 className="mt-5 max-w-[560px] text-[30px] font-extrabold leading-[1.06] tracking-[-0.04em] text-ink sm:text-[39px]">
                    {copy.demo.title}
                  </h2>
                  <p className="mt-3 max-w-[520px] text-[12.5px] leading-relaxed text-ink-2/80">
                    {copy.demo.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[10.5px] text-ink-2">
                      demo@tuntas.id
                    </span>
                    <span className="rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[10.5px] text-ink-2">
                      demo123
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <DemoButton
                      isLoggedIn={isLoggedIn}
                      label={isLoggedIn ? copy.openWorkspace : copy.demo.signIn}
                      className="btn-primary w-full sm:w-auto"
                    />
                    {!isLoggedIn && (
                      <Link href="/login" className="btn-secondary w-full sm:w-auto">
                        {copy.demo.manual} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[9.5px] text-muted">
                    <ShieldCheck className="h-3 w-3 text-green" /> {copy.demo.note}
                  </div>
                </div>

                <div className="glass-soft rounded-2xl p-3.5">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div>
                      <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-muted">
                        {copy.demo.workspace}
                      </div>
                      <div className="mt-0.5 text-[13px] font-bold text-ink">Made Art Studio</div>
                    </div>
                    <BrandMark className="h-8 w-8" />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {(lang === "en"
                      ? [
                          ["Horse statue — Provincial Office", "7 Dec", "6/18", "amber"],
                          ["150 lunch boxes", "19 Nov", "4/13", "mint"],
                          ["Garuda relief — Hotel Ubud", "15 Dec", "4/9", "mint"],
                          ["Carved door — Villa Canggu", "9 Jan", "1/7", "muted"],
                        ]
                      : [
                          ["Patung kuda — Dinas Provinsi", "7 Des", "6/18", "amber"],
                          ["Nasi kotak 150 porsi", "19 Nov", "4/13", "mint"],
                          ["Relief garuda — Hotel Ubud", "15 Des", "4/9", "mint"],
                          ["Ukiran pintu — Villa Canggu", "9 Jan", "1/7", "muted"],
                        ]
                    ).map(([title, date, progress, tone]) => (
                      <div
                        key={title}
                        className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-2"
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            tone === "amber"
                              ? "bg-green shadow-[0_0_8px_rgba(124,58,237,0.4)]"
                              : tone === "mint"
                                ? "bg-green/50"
                                : "bg-line-strong"
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate text-[9.5px] font-semibold text-ink-2">
                          {title}
                        </span>
                        <span className="shrink-0 text-[8px] text-muted">{date}</span>
                        <span className="shrink-0 rounded-full bg-paper px-1.5 py-0.5 text-[7.5px] font-bold text-ink-2">
                          {progress}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line px-1 pt-2.5 text-[8px] text-muted">
                    <span>{copy.demo.stats}</span>
                    <span className="inline-flex items-center gap-1 text-green">
                      <Check className="h-2.5 w-2.5" /> {copy.demo.ready}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo variant="dark" />
              <p className="mt-3 max-w-[320px] text-[11px] leading-relaxed text-muted">
                {copy.footer.description}
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[9px] text-muted">
                <span className="h-1 w-1 rounded-full bg-green" /> {copy.footer.builtFor}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
                {copy.footer.product}
              </div>
              <div className="mt-3 space-y-2 text-[11px]">
                <a href="#fitur" className="block text-ink-2 transition hover:text-ink">{copy.footer.links.features}</a>
                <a href="#cara-kerja" className="block text-ink-2 transition hover:text-ink">{copy.footer.links.how}</a>
                <a href="#untuk-siapa" className="block text-ink-2 transition hover:text-ink">{copy.footer.links.who}</a>
                <a href="#demo" className="block text-ink-2 transition hover:text-ink">{copy.footer.links.demo}</a>
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
                {copy.footer.workspace}
              </div>
              <div className="mt-3 space-y-2 text-[11px]">
                <Link href="/login" className="block text-ink-2 transition hover:text-ink">{copy.footer.links.signIn}</Link>
                <Link href="/login?mode=register" className="block text-ink-2 transition hover:text-ink">{copy.footer.links.register}</Link>
                <Link href="/kanban" className="block text-ink-2 transition hover:text-ink">{copy.footer.links.kanban}</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-line pt-4 text-[9px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>{copy.footer.copyright}</span>
            <span className="inline-flex items-center gap-1.5">
              <BrandMark className="h-3.5 w-3.5" /> {copy.footer.version}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
