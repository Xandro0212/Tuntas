"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectIdentity } from "./project-identity";
import { useI18n } from "./language-provider";
import {
  EN_DAYS_SHORT,
  EN_MONTHS,
  EN_MONTHS_SHORT,
  ID_DAYS_SHORT,
  ID_MONTHS,
  ID_MONTHS_SHORT,
  addDays,
  formatLongDate,
  formatShortDate,
  parseISODate,
  relativeDeadline,
  startOfWeekMonday,
  weekdayIndex,
} from "@/lib/dates";
import { phaseTone } from "@/lib/constants";
import { getBufferDates } from "@/lib/schedule";
import type { Holiday, Phase, Project, Task } from "@/lib/types";
import type { OtherProjectTask } from "@/lib/data";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

function longRange(start: string, end: string, lang: "id" | "en") {
  const a = parseISODate(start);
  const b = parseISODate(end);
  const months = lang === "en" ? EN_MONTHS : ID_MONTHS;
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${a.getUTCDate()}–${b.getUTCDate()} ${months[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  }
  if (a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${a.getUTCDate()} ${months[a.getUTCMonth()]} – ${b.getUTCDate()} ${
      months[b.getUTCMonth()]
    } ${b.getUTCFullYear()}`;
  }
  return `${formatLongDate(start, false, lang)} – ${formatLongDate(end, false, lang)}`;
}

export function CalendarView({
  project,
  phases,
  tasks,
  holidays,
  projects,
  otherTasks,
  today,
  canManage,
}: {
  project: Project;
  phases: Phase[];
  tasks: Task[];
  holidays: Holiday[];
  projects: { id: string; title: string }[];
  otherTasks: OtherProjectTask[];
  today: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const monthShort = lang === "en" ? EN_MONTHS_SHORT : ID_MONTHS_SHORT;
  const dayShort = lang === "en" ? EN_DAYS_SHORT : ID_DAYS_SHORT;
  const firstUndone = tasks
    .filter((task) => task.status !== "done")
    .map((task) => task.startDate)
    .sort()[0];
  const anchor = firstUndone && firstUndone > today ? firstUndone : today;
  const [viewStart, setViewStart] = useState(() => startOfWeekMonday(anchor));
  const [holidayList, setHolidayList] = useState(holidays);
  const [showOthers, setShowOthers] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: today, name: "" });
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<string | null>(null);

  useEffect(() => {
    setHolidayList(holidays);
  }, [holidays]);

  const days = Array.from({ length: 42 }, (_, index) => addDays(viewStart, index));
  const viewEnd = days[days.length - 1];
  const holidayMap = new Map(holidayList.map((holiday) => [holiday.date, holiday]));
  const bufferDates = getBufferDates(
    project.deadline,
    Math.max(1, project.bufferDays),
    project.workdays,
    holidayList.map((holiday) => holiday.date),
  );
  const bufferSet = new Set(bufferDates);
  const phaseById = new Map(phases.map((phase, index) => [phase.id, { ...phase, index }]));

  const starts = tasks.map((task) => task.startDate).sort();
  const finishes = tasks.map((task) => task.dueDate).sort();
  const projectStart = starts[0] ?? today;
  const projectFinish = finishes.at(-1) ?? project.deadline;
  const done = tasks.filter((task) => task.status === "done").length;

  function tasksOn(date: string) {
    return tasks
      .filter((task) => task.startDate <= date && task.dueDate >= date)
      .sort((a, b) => a.order - b.order);
  }

  function othersOn(date: string) {
    if (!showOthers) return [];
    return otherTasks.filter((task) => task.startDate <= date && task.dueDate >= date);
  }

  const contentDays = days.filter((date) => {
    return (
      tasksOn(date).length > 0 ||
      othersOn(date).length > 0 ||
      Boolean(holidayMap.get(date)) ||
      bufferSet.has(date) ||
      date === project.deadline ||
      date === today
    );
  });

  async function addHoliday(event: React.FormEvent) {
    event.preventDefault();
    if (!holidayForm.name.trim()) {
      toast.error(t("Nama hari libur wajib diisi."));
      return;
    }
    setSavingHoliday(true);
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holidayForm),
      });
      const payload = (await response.json()) as {
        error?: string;
        holiday?: Holiday;
        adjustedProjects?: number;
      };
      if (!response.ok || !payload.holiday) {
        throw new Error(payload.error ? t(payload.error) : t("Gagal menambah hari libur."));
      }
      setHolidayList((current) => [...current, payload.holiday!]);
      setHolidayForm({ date: today, name: "" });
      toast.success(
        payload.adjustedProjects
          ? `${t("Hari libur ditambahkan.")} ${t("{n} proyek disesuaikan jadwalnya.", {
              n: payload.adjustedProjects,
            })}`
          : t("Hari libur ditambahkan."),
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal menambah hari libur."));
    } finally {
      setSavingHoliday(false);
    }
  }

  async function removeHoliday(id: string) {
    setDeletingHoliday(id);
    try {
      const response = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(payload.error ? t(payload.error) : t("Gagal menghapus hari libur."));
      setHolidayList((current) => current.filter((holiday) => holiday.id !== id));
      toast.success(t("Hari libur dihapus."));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Gagal menghapus hari libur."));
    } finally {
      setDeletingHoliday(null);
    }
  }

  return (
    <div className="space-y-5">
      <ProjectIdentity
        project={project}
        projects={projects}
        eyebrow={t("Kalender proyek")}
        canManage={canManage}
        phases={phases}
      />

      <div className="panel flex flex-col gap-3 p-3.5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="section-title">{t("Rentang kalender")}</div>
          <h2 className="mt-0.5 text-[19px] font-extrabold tracking-[-0.03em] sm:text-[22px]">
            {longRange(viewStart, viewEnd, lang)}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            {t(
              "Senin–Sabtu · Minggu dan hari libur otomatis dilewati · deadline {date} ({relative})",
              {
                date: formatShortDate(project.deadline, lang),
                relative: relativeDeadline(project.deadline, lang),
              },
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-line bg-card p-0.5">
            <button
              type="button"
              className="icon-btn h-8 w-8"
              onClick={() => setViewStart((current) => addDays(current, -28))}
              aria-label={t("Mundur 4 minggu")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewStart(startOfWeekMonday(today))}
              className="px-2.5 text-[11.5px] font-semibold text-ink-2 hover:text-green"
            >
              {t("Hari ini")}
            </button>
            <button
              type="button"
              className="icon-btn h-8 w-8"
              onClick={() => setViewStart((current) => addDays(current, 28))}
              aria-label={t("Maju 4 minggu")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-[11.5px] font-semibold text-ink-2">
            <input
              type="checkbox"
              checked={showOthers}
              onChange={(event) => setShowOthers(event.target.checked)}
              className="h-3.5 w-3.5 accent-amber-400"
            />
            {t("Tampilkan proyek lain")}
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] font-medium text-muted">
        {phases.map((phase, index) => {
          const tone = phaseTone(phase.name, index);
          return (
            <span key={phase.id} className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
              {phase.name}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm border border-dashed border-green/60 bg-green/15" />
          {t("Cadangan")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-green/40" />
          {t("Libur")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-gradient-to-r from-[#a78bfa] to-[#6d28d9]" />
          {t("Deadline klien")}
        </span>
      </div>

      <div className="panel hidden overflow-hidden xl:block">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b border-line bg-paper/70">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className={`px-2 py-2 text-[10px] font-bold uppercase tracking-wider ${
                    day === 0 ? "text-muted/60" : "text-muted"
                  }`}
                >
                  {dayShort[day]}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((date) => {
                const sunday = weekdayIndex(date) === 0;
                const holiday = holidayMap.get(date);
                const isToday = date === today;
                const isDeadline = date === project.deadline;
                const isBuffer = bufferSet.has(date);
                const dayTasks = tasksOn(date);
                const dayOthers = othersOn(date);
                const visibleTasks = dayTasks.slice(0, 3);
                const remaining = dayTasks.length - visibleTasks.length + dayOthers.length;
                return (
                  <div
                    key={date}
                    className={`min-h-[112px] border-b border-r border-line p-1.5 last:border-r-0 ${
                      sunday ? "bg-paper-2/45" : ""
                    } ${holiday ? "bg-green-soft/45" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10.5px] font-bold ${
                          isToday ? "bg-green text-white" : "text-ink-2"
                        }`}
                      >
                        {parseISODate(date).getUTCDate()}
                      </span>
                      {holiday && (
                        <span
                          className="max-w-[72%] truncate text-[8px] font-semibold leading-tight text-green/65"
                          title={holiday.name}
                        >
                          {holiday.name}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1">
                      {isDeadline && (
                        <div className="rounded bg-gradient-to-r from-[#a78bfa] to-[#6d28d9] px-1.5 py-1 text-[8.5px] font-bold leading-tight text-white">
                          {t("Deadline klien").toUpperCase()}
                        </div>
                      )}
                      {isBuffer && !isDeadline && (
                        <div className="rounded border border-dashed border-green/40 bg-mint/50 px-1.5 py-1 text-[8.5px] font-semibold leading-tight text-green/70">
                          {t("Cadangan")}
                        </div>
                      )}
                      {visibleTasks.map((task) => {
                        const phase = phaseById.get(task.phaseId);
                        const tone = phaseTone(phase?.name ?? "Tugas", phase?.index ?? 0);
                        return (
                          <div
                            key={task.id}
                            title={`${phase?.name ?? ""} · ${task.title} · ${task.assignee}`}
                            className={`truncate rounded px-1.5 py-1 text-[8.5px] font-semibold leading-tight ${
                              task.status === "done" ? "line-through opacity-55" : ""
                            }`}
                            style={{ background: tone.bg, color: tone.text }}
                          >
                            {task.title}
                          </div>
                        );
                      })}
                      {showOthers &&
                        dayOthers.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            title={`${task.projectTitle} · ${task.phaseName} · ${task.title}`}
                            className={`truncate rounded border border-line bg-card px-1.5 py-1 text-[8.5px] font-medium leading-tight text-ink-2 ${
                              task.status === "done" ? "line-through opacity-55" : ""
                            }`}
                          >
                            {task.title}
                          </div>
                        ))}
                      {remaining > 0 && (
                        <div className="px-1 text-[8.5px] font-semibold text-muted">
                          +{" "}
                          {remaining === 1
                            ? t("1 tugas")
                            : t("{n} tugas", { n: remaining })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="xl:hidden">
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-[12px] font-bold text-ink-2">{t("Jadwal per hari")}</h3>
          <span className="text-[10px] text-muted">{t("Hari yang ada kegiatan")}</span>
        </div>
        <div className="space-y-2">
          {contentDays.map((date) => {
            const dayTasks = tasksOn(date);
            const dayOthers = othersOn(date);
            const holiday = holidayMap.get(date);
            const isToday = date === today;
            const isDeadline = date === project.deadline;
            const isBuffer = bufferSet.has(date);
            const parsed = parseISODate(date);
            const dayName = dayShort[weekdayIndex(date)];
            const monthName = monthShort[parsed.getUTCMonth()];

            return (
              <div
                key={date}
                className={`panel p-3 ${isToday ? "ring-1 ring-green/25" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="w-9 shrink-0 text-center">
                    <div className="text-[8.5px] font-bold uppercase tracking-wider text-muted">
                      {dayName}
                    </div>
                    <div
                      className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                        isToday ? "bg-green text-white" : "text-ink"
                      }`}
                    >
                      {parsed.getUTCDate()}
                    </div>
                    <div className="mt-0.5 text-[8px] text-muted">{monthName}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    {(holiday || isDeadline || isBuffer) && (
                      <div className="flex flex-wrap gap-1">
                        {isDeadline && (
                          <span className="chip-sm bg-gradient-to-r from-[#a78bfa] to-[#6d28d9] text-white">
                            {t("Deadline klien")}
                          </span>
                        )}
                        {holiday && (
                          <span className="chip-sm bg-green-soft text-green">
                            <CalendarDays className="h-2.5 w-2.5" /> {holiday.name}
                          </span>
                        )}
                        {isBuffer && !isDeadline && (
                          <span className="chip-sm border border-dashed border-green/40 bg-mint/60 text-green">
                            {t("Cadangan")}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-1.5 space-y-1">
                      {dayTasks.map((task) => {
                        const phase = phaseById.get(task.phaseId);
                        const tone = phaseTone(phase?.name ?? "Tugas", phase?.index ?? 0);
                        return (
                          <div
                            key={task.id}
                            className={`rounded-md px-2 py-1.5 text-[10px] ${
                              task.status === "done" ? "line-through opacity-55" : ""
                            }`}
                            style={{ background: tone.bg, color: tone.text }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold leading-snug">{task.title}</span>
                              <span className="shrink-0 text-[8.5px] font-medium opacity-70">
                                {task.assignee}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[8.5px] opacity-65">
                              {phase?.name}
                              {task.status === "done" ? ` · ${t("selesai")}` : ""}
                            </div>
                          </div>
                        );
                      })}
                      {showOthers &&
                        dayOthers.map((task) => (
                          <div
                            key={task.id}
                            className={`rounded-md border border-line bg-card px-2 py-1.5 text-[10px] text-ink-2 ${
                              task.status === "done" ? "line-through opacity-55" : ""
                            }`}
                          >
                            <div className="font-semibold leading-snug">{task.title}</div>
                            <div className="mt-0.5 text-[8.5px] text-muted">
                              {task.projectTitle} · {task.phaseName}
                            </div>
                          </div>
                        ))}
                      {!dayTasks.length && !dayOthers.length && (
                        <div className="text-[9.5px] text-muted">{t("Tidak ada tugas.")}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!contentDays.length && (
            <div className="panel p-5 text-center text-[11px] text-muted">
              {t("Tidak ada jadwal pada rentang ini.")}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[13.5px] font-bold text-ink">{t("Libur yang diperhitungkan")}</h3>
              <p className="mt-0.5 text-[11px] text-muted">
                {t("Minggu selalu libur. Tambah odalan atau cuti usaha sendiri di sini.")}
              </p>
            </div>
            <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold text-muted">
              {holidayList.length}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            {holidayList.map((holiday) => (
              <div
                key={holiday.id}
                className="flex items-center gap-2 rounded-lg border border-line bg-paper/40 px-2.5 py-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green-soft text-green">
                  <CalendarDays className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11.5px] font-semibold text-ink">{holiday.name}</div>
                  <div className="text-[9.5px] text-muted">
                    {formatLongDate(holiday.date, false, lang)} ·{" "}
                    {t(
                      holiday.source === "national"
                        ? "Nasional"
                        : holiday.source === "bali"
                          ? "Bali"
                          : "Ditambahkan",
                    )}
                  </div>
                </div>
                {canManage && holiday.source === "user" ? (
                  <button
                    type="button"
                    className="icon-btn h-7 w-7 text-muted hover:text-danger"
                    onClick={() => removeHoliday(holiday.id)}
                    disabled={deletingHoliday === holiday.id}
                    aria-label={t("Hapus hari libur")}
                  >
                    {deletingHoliday === holiday.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <Lock className="h-3 w-3 text-muted/50" />
                )}
              </div>
            ))}
            {!holidayList.length && (
              <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] text-muted">
                {t("Belum ada hari libur tambahan.")}
              </p>
            )}
          </div>

          {canManage && (
          <form onSubmit={addHoliday} className="mt-3 grid gap-2 sm:grid-cols-[130px_1fr_auto]">
            <input
              type="date"
              className="field-sm"
              value={holidayForm.date}
              onChange={(event) => setHolidayForm({ ...holidayForm, date: event.target.value })}
              onInput={(event) =>
                setHolidayForm((current) => ({
                  ...current,
                  date: (event.target as HTMLInputElement).value,
                }))
              }
              required
            />
            <input
              className="field-sm"
              placeholder={t("mis. Odalan banjar")}
              value={holidayForm.name}
              onChange={(event) => setHolidayForm({ ...holidayForm, name: event.target.value })}
              required
            />
            <button type="submit" className="btn-secondary btn-sm" disabled={savingHoliday}>
              {savingHoliday ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {t("Tambah")}
            </button>
          </form>
          )}
        </div>

        <div className="panel overflow-hidden p-4">
          <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-blue/15 blur-3xl" />
          <h3 className="relative text-[13.5px] font-bold text-ink">
            {t("Target internal vs deadline klien")}
          </h3>
          <p className="relative mt-0.5 text-[11px] text-muted">
            {t(
              "Tanggal dihitung mundur dari deadline, dengan cadangan 10% durasi (minimal 1 hari kerja).",
            )}
          </p>
          <div className="relative mt-3 rounded-xl border border-line bg-paper p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                {t("Target selesai internal")}
              </span>
              <span className="text-[13px] font-bold text-ink">
                {formatLongDate(projectFinish, false, lang)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                {t("Deadline klien")}
              </span>
              <span className="text-[13px] font-bold text-ink">
                {formatLongDate(project.deadline, false, lang)}
              </span>
            </div>
            <div className="mt-2.5 rounded-lg border border-green/20 bg-green-soft px-2.5 py-2 text-[11px] font-semibold text-green">
              {t("Ada {n} hari kerja cadangan di antaranya.", { n: project.bufferDays })}
            </div>
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-muted">
            <span>
              {t("Mulai")} <b className="text-ink">{formatShortDate(projectStart, lang)}</b>
            </span>
            <span>
              {t("{done} dari {total} tugas selesai", { done, total: tasks.length })}
            </span>
            <span>
              {holidayList.length === 1
                ? t("1 hari libur tercatat")
                : t("{n} hari libur tercatat", { n: holidayList.length })}
            </span>
          </div>
          <Link
            href={`/proyek/${project.id}`}
            className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-green hover:underline"
          >
            {t("Lihat papan Kanban →")}
          </Link>
        </div>
      </div>
    </div>
  );
}
