import { CalendarDays, Check, Clock3, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/logo";
import { HERO_BOARD_COPY, type Lang } from "./copy";

interface HeroTask {
  phase: string;
  phaseEn: string;
  title: string;
  titleEn: string;
  date: string;
  dateEn: string;
  initials: string;
  phaseTone: string;
  progress?: number;
  done?: boolean;
}

interface HeroColumn {
  label: string;
  count: number;
  tone: string;
  tasks: HeroTask[];
}

const COLUMNS: HeroColumn[] = [
  {
    label: "Belum mulai",
    count: 10,
    tone: "#94a3b8",
    tasks: [
      { phase: "Produksi", phaseEn: "Production", title: "Dempul & amplas", titleEn: "Sanding & filling", date: "12–14 Nov", dateEn: "12–14 Nov", initials: "W", phaseTone: "#8b5cf6" },
      { phase: "Finishing", phaseEn: "Finishing", title: "Finishing cat", titleEn: "Finishing coat", date: "16–20 Nov", dateEn: "16–20 Nov", initials: "M", phaseTone: "#f59e0b" },
    ],
  },
  {
    label: "Dikerjakan",
    count: 1,
    tone: "#8b5cf6",
    tasks: [
      {
        phase: "Produksi",
        phaseEn: "Production",
        title: "Cetak fiberglass",
        titleEn: "Fiberglass casting",
        date: "5–9 Nov",
        dateEn: "5–9 Nov",
        initials: "W",
        phaseTone: "#8b5cf6",
        progress: 58,
      },
    ],
  },
  {
    label: "Selesai",
    count: 6,
    tone: "#6d28d9",
    tasks: [
      { phase: "Persiapan", phaseEn: "Preparation", title: "Sketsa 3 tampak", titleEn: "3-view sketch", date: "28–30 Okt", dateEn: "28–30 Oct", initials: "M", phaseTone: "#93c5fd", done: true },
      { phase: "Produksi", phaseEn: "Production", title: "Buat rangka besi", titleEn: "Steel frame", date: "3–4 Nov", dateEn: "3–4 Nov", initials: "W", phaseTone: "#8b5cf6", done: true },
    ],
  },
];

export function HeroBoard({ lang }: { lang: Lang }) {
  const t = HERO_BOARD_COPY[lang];
  return (
    <div
      className="relative mx-auto w-full max-w-[590px] px-3 py-4 sm:px-5"
      role="img"
      aria-label={t.aria}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-10 top-0 h-56 w-56 rounded-full bg-green/20 blur-[80px] animate-glow" />
        <div className="absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-rust/10 blur-[70px]" />
        <div className="absolute inset-x-8 inset-y-0 rounded-[38px] border border-line/70 rotate-3" />
        <div className="absolute inset-x-2 inset-y-4 rounded-[34px] border border-line/60 -rotate-2" />
      </div>

      <div className="hero-window relative rounded-[26px] border border-line bg-card p-3 shadow-[0_40px_80px_-40px_rgba(76,29,149,0.35)]">
        <div className="flex items-center gap-2 px-1 pb-2.5">
          <BrandMark className="h-5 w-5" />
          <span className="text-[9.5px] font-bold tracking-[-0.02em] text-ink">Tuntas</span>
          <span className="ml-1 h-1 w-1 rounded-full bg-line" />
          <span className="text-[8.5px] text-muted">{t.workspace}</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-line" />
            <span className="h-1.5 w-1.5 rounded-full bg-line" />
            <span className="h-1.5 w-1.5 rounded-full bg-green/70" />
          </span>
        </div>

        <div className="rounded-[20px] border border-line bg-paper p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted">
                {t.activeProject}
              </div>
              <div className="mt-0.5 truncate text-[12.5px] font-bold tracking-[-0.02em] text-ink">
                {lang === "en" ? "Horse statue — Provincial Office" : "Patung kuda — Dinas Provinsi"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-green/25 bg-green-soft px-2 py-1 text-[8px] font-bold text-green">
              <CalendarDays className="h-2.5 w-2.5" /> {lang === "en" ? "7 Dec" : "7 Des"}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="glass-soft rounded-xl p-2">
              <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-[0.12em] text-muted">
                {t.progress} <span className="text-green">33%</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[15px] font-extrabold text-ink">6</span>
                <span className="text-[8px] text-muted">{t.ofTasks}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper-2">
                <div className="h-full rounded-full bg-gradient-to-r from-[#a78bfa] via-[#8b5cf6] to-[#6d28d9]" style={{ width: "33%" }} />
              </div>
            </div>
            <div className="glass-soft rounded-xl p-2">
              <div className="text-[7.5px] font-bold uppercase tracking-[0.12em] text-muted">
                {t.buffer}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[15px] font-extrabold text-green">2</span>
                <span className="text-[8px] text-muted">{t.workingDays}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[7.5px] text-muted">
                <Check className="h-2.5 w-2.5 text-green" /> {t.weekendSkipped}
              </div>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {COLUMNS.map((column) => (
              <div key={column.label} className="rounded-xl border border-line bg-paper p-1.5">
                <div className="mb-1.5 flex items-center gap-1 px-0.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: column.tone }} />
                  <span className="text-[7.5px] font-bold text-ink-2">
                    {column.label === "Belum mulai"
                      ? t.notStarted
                      : column.label === "Dikerjakan"
                        ? t.inProgress
                        : t.done}
                  </span>
                  <span className="ml-auto text-[7px] text-muted">{column.count}</span>
                </div>
                <div className="space-y-1.5">
                  {column.tasks.map((task) => (
                    <div
                      key={task.title}
                      className={`rounded-lg border border-line bg-paper p-1.5 ${
                        task.done ? "opacity-75" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className="h-1 w-1 rounded-full"
                          style={{ background: task.phaseTone }}
                        />
                        <span className="truncate text-[6.5px] font-bold" style={{ color: task.phaseTone }}>
                          {lang === "en" ? task.phaseEn : task.phase}
                        </span>
                        {task.done && <Check className="ml-auto h-2 w-2 text-green" />}
                      </div>
                      <div className={`mt-0.5 text-[7.5px] font-semibold leading-tight text-ink ${task.done ? "line-through opacity-70" : ""}`}>
                        {lang === "en" ? task.titleEn : task.title}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-[6.5px] text-muted">{lang === "en" ? task.dateEn : task.date}</span>
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-paper-2 text-[5.5px] font-bold text-ink-2">
                          {task.initials}
                        </span>
                      </div>
                      {"progress" in task && task.progress ? (
                        <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-paper-2">
                          <div className="h-full rounded-full bg-green" style={{ width: `${task.progress}%` }} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-1 pt-2.5 text-[7.5px] text-muted">
          <Clock3 className="h-2.5 w-2.5" /> {t.today}
          <span className="ml-auto inline-flex items-center gap-1 text-green">
            <Sparkles className="h-2.5 w-2.5" /> {t.aiActive}
          </span>
        </div>
      </div>

      <div className="absolute -right-2 top-24 z-20 hidden w-[170px] animate-float rounded-2xl border border-line bg-card p-3 shadow-[0_24px_50px_-24px_rgba(76,29,149,0.35)] sm:-right-7 sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-green text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-[9px] font-bold text-ink">{t.aiBroke}</span>
        </div>
        <div className="mt-2 flex items-end gap-1.5">
          <span className="text-gradient text-[23px] font-extrabold leading-none">18</span>
          <span className="mb-0.5 text-[8px] leading-tight text-muted">{t.tasksFromStory}</span>
        </div>
        <div className="mt-2 flex gap-1">
          <span className="rounded-full bg-paper px-1.5 py-0.5 text-[7px] font-semibold text-ink-2">{t.phases}</span>
          <span className="rounded-full bg-paper px-1.5 py-0.5 text-[7px] font-semibold text-ink-2">{t.owners}</span>
        </div>
      </div>

      <div className="absolute -left-1 bottom-16 z-20 hidden animate-float-slow rounded-xl border border-line bg-card px-3 py-2 shadow-[0_20px_40px_-20px_rgba(76,29,149,0.35)] sm:-left-6 sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-soft text-green">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <div>
            <div className="text-[6.5px] font-bold uppercase tracking-[0.12em] text-muted">{t.bufferChip}</div>
            <div className="text-[10px] font-bold text-ink">{t.bufferValue}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
