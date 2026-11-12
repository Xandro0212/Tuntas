"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Mic,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./avatar";
import { useI18n } from "./language-provider";
import { diffDays, formatShortDate, relativeDeadline } from "@/lib/dates";
import type { Project, PublicUser, TodayTask } from "@/lib/types";

interface Nearest {
  project: Project;
  done: number;
  total: number;
  progress: number;
}

export function TodayView({
  user,
  today,
  todayLabel,
  todayTasks,
  tomorrowLabel,
  tomorrowTasks,
  nearest,
  projects,
}: {
  user: PublicUser;
  today: string;
  todayLabel: string;
  todayTasks: TodayTask[];
  tomorrowLabel: string;
  tomorrowTasks: TodayTask[];
  nearest: Nearest | null;
  projects: { id: string; title: string; deadline: string }[];
}) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [overrides, setOverrides] = useState<Record<string, "done" | "todo">>({});
  const firstName = user.name.split(" ")[0];

  const statusOf = (task: TodayTask) => overrides[task.id] ?? task.status;
  const sorted = [...todayTasks].sort((a, b) => {
    const aDone = statusOf(a) === "done";
    const bDone = statusOf(b) === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aLate = a.dueDate < today;
    const bLate = b.dueDate < today;
    if (aLate !== bLate) return aLate ? -1 : 1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const groups = new Map<string, TodayTask[]>();
  for (const task of sorted) {
    const list = groups.get(task.assignee) ?? [];
    list.push(task);
    groups.set(task.assignee, list);
  }

  async function toggle(task: TodayTask) {
    if (user.role !== "owner" && task.assigneeUserId !== user.id) {
      toast.error(t("Tugas ini bukan untukmu."));
      return;
    }
    const current = statusOf(task);
    const next = current === "done" ? "todo" : "done";
    setOverrides((value) => ({ ...value, [task.id]: next }));
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(payload.error ? t(payload.error) : t("Gagal memperbarui tugas."));
      toast.success(next === "done" ? t("Mantap, tugas selesai.") : t("Tugas dibuka kembali."));
      router.refresh();
    } catch (error) {
      setOverrides((value) => {
        const next = { ...value };
        delete next[task.id];
        return next;
      });
      toast.error(error instanceof Error ? error.message : t("Gagal memperbarui tugas."));
    }
  }

  const notDone = sorted.filter((task) => statusOf(task) !== "done").length;

  return (
    <div className="mx-auto w-full max-w-[1060px]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            {user.businessName}
          </div>
          <h1 className="mt-1 text-[25px] font-extrabold leading-tight tracking-[-0.04em] sm:text-[34px]">
            {t("Om Swastyastu, {name}.", { name: firstName })}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <Clock className="h-3.5 w-3.5" /> {todayLabel}
          </div>
        </div>
        <Avatar name={user.name} size="lg" className="mt-1 ring-4 ring-white" />
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:items-start">
        <div className="space-y-4">
          {nearest ? (
            <Link
              href={`/proyek/${nearest.project.id}`}
              className="group relative block overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#7c3aed_0%,#6425c9_50%,#3b0f7a_100%)] p-5 text-white shadow-[0_24px_45px_-28px_rgba(76,29,149,0.65)] transition hover:shadow-[0_28px_50px_-24px_rgba(76,29,149,0.7)] sm:p-6"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ddd0fb]">
                    {t("Deadline terdekat")}
                  </div>
                  <h2 className="mt-1.5 text-[19px] font-bold leading-snug tracking-[-0.02em] sm:text-[22px]">
                    {nearest.project.title}
                  </h2>
                  <div className="mt-1.5 text-[12px] text-white/70">
                    {formatShortDate(nearest.project.deadline, lang)} ·{" "}
                    {relativeDeadline(nearest.project.deadline, lang)}
                    {nearest.project.deadlineTime
                      ? ` · ${t("tiba")} ${nearest.project.deadlineTime}`
                      : ""}
                  </div>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition group-hover:bg-white/20">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <div className="relative mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${nearest.progress}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-bold text-white">
                  {t("{done}/{total} tugas", {
                    done: nearest.done,
                    total: nearest.total,
                  })}
                </span>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed border-line-strong bg-card px-5 py-8 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-green" />
              <h2 className="mt-2 text-[16px] font-bold">{t("Belum ada proyek")}</h2>
              <p className="mt-1 text-[12px] text-muted">
                {t("Ceritakan pesanan pertamamu, AI akan menyusun tugasnya.")}
              </p>
              <Link href="/proyek/baru" className="btn-primary mt-4">
                {t("Mulai proyek pertama")}
              </Link>
            </div>
          )}

          <section>
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-bold tracking-[-0.02em]">{t("Tugas hari ini")}</h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  {notDone > 0
                    ? t("{n} tugas masih perlu disentuh. Centang kalau sudah selesai.", {
                        n: notDone,
                      })
                    : t("Semua tugas hari ini sudah selesai. Kerja bagus!")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-card px-2.5 py-1 text-[10.5px] font-bold text-muted ring-1 ring-line">
                {todayTasks.length === 1
                  ? t("1 tugas")
                  : t("{n} tugas", { n: todayTasks.length })}
              </span>
            </div>

            {groups.size ? (
              <div className="space-y-3">
                {Array.from(groups.entries()).map(([assignee, list]) => (
                  <div key={assignee} className="panel overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-line bg-paper/50 px-4 py-2.5">
                      <Avatar name={assignee} size="sm" />
                      <span className="text-[12px] font-bold text-ink">{assignee}</span>
                      <span className="text-[10px] text-muted">
                        {list.filter((task) => statusOf(task) !== "done").length === 1
                          ? t("1 belum selesai")
                          : t("{n} belum selesai", {
                              n: list.filter((task) => statusOf(task) !== "done").length,
                            })}
                      </span>
                    </div>
                    <div>
                      {list.map((task) => {
                        const done = statusOf(task) === "done";
                        const late = task.dueDate < today;
                        const canToggle = user.role === "owner" || task.assigneeUserId === user.id;
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggle(task)}
                            disabled={!canToggle}
                            className="flex w-full items-start gap-3 border-b border-line/70 px-4 py-3 text-left transition last:border-0 hover:bg-paper/45 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                done
                                  ? "border-green bg-green text-white"
                                  : "border-line-strong bg-card hover:border-green"
                              }`}
                            >
                              {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block text-[13px] font-semibold leading-snug ${
                                  done ? "text-muted line-through" : "text-ink"
                                }`}
                              >
                                {task.title}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] text-muted">
                                <span className="truncate">{task.projectTitle}</span>
                                <span className="text-line-strong">·</span>
                                <span>{task.phaseName}</span>
                                {late && !done && (
                                  <>
                                    <span className="text-line-strong">·</span>
                                    <span className="font-bold text-rust">
                                      {diffDays(task.dueDate, today) === 1
                                        ? t("Terlambat 1 hari")
                                        : t("Terlambat {n} hari", {
                                            n: diffDays(task.dueDate, today),
                                          })}
                                    </span>
                                  </>
                                )}
                                {done && (
                                  <>
                                    <span className="text-line-strong">·</span>
                                    <span className="font-semibold text-green">{t("Selesai")}</span>
                                  </>
                                )}
                              </span>
                            </span>
                            <span className="mt-0.5 shrink-0 text-[10px] font-medium text-muted">
                              {formatShortDate(task.dueDate, lang)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel flex flex-col items-center px-5 py-10 text-center">
                <CheckCircle2 className="h-7 w-7 text-green" />
                <h3 className="mt-2 text-[14px] font-bold">
                  {t("Tidak ada tugas jatuh tempo hari ini")}
                </h3>
                <p className="mt-1 max-w-[360px] text-[11.5px] leading-relaxed text-muted">
                  {t(
                    "Waktu yang bagus untuk mengecek proyek berikutnya atau menyiapkan pesanan baru.",
                  )}
                </p>
                <Link href="/proyek/baru" className="btn-secondary btn-sm mt-3">
                  <Sparkles className="h-3.5 w-3.5" /> {t("Ceritakan pesanan baru")}
                </Link>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 className="text-[13.5px] font-bold">{t("Besok")}</h2>
                <p className="text-[10.5px] text-muted">{tomorrowLabel}</p>
              </div>
              <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold text-muted">
                {tomorrowTasks.length}
              </span>
            </div>
            <div>
              {tomorrowTasks.length ? (
                tomorrowTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 border-b border-line/70 px-4 py-3 last:border-0"
                  >
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green-soft text-green">
                      <CalendarIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold leading-snug">{task.title}</div>
                      <div className="mt-0.5 truncate text-[10px] text-muted">
                        {task.projectTitle} · {task.assignee}
                      </div>
                    </div>
                    <Avatar name={task.assignee} size="xs" />
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-[11px] text-muted">
                  {t("Belum ada tugas untuk besok.")}
                </div>
              )}
            </div>
          </div>

          <Link
            href="/proyek/baru?cerita=1"
            className="group panel flex w-full items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c4b5fd]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-soft text-green">
              <Mic className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink">
                {t("Ceritakan pesanan baru")}
              </span>
              <span className="mt-0.5 block text-[10.5px] leading-snug text-muted">
                {t("Rekam suara atau tempel chat WA. AI yang menyusun tugasnya.")}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-green transition group-hover:translate-x-0.5" />
          </Link>

          {projects.length > 0 && (
            <div className="panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[12.5px] font-bold">{t("Proyek aktif")}</h2>
                <Link href="/proyek" className="text-[10.5px] font-semibold text-green hover:underline">
                  {t("Semua")}
                </Link>
              </div>
              <div className="mt-2.5 space-y-2">
                {projects.slice(0, 4).map((project) => (
                  <Link
                    key={project.id}
                    href={`/proyek/${project.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 transition hover:bg-paper"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px] font-semibold text-ink">
                        {project.title}
                      </span>
                      <span className="block text-[9.5px] text-muted">
                        {formatShortDate(project.deadline, lang)} ·{" "}
                        {relativeDeadline(project.deadline, lang)}
                      </span>
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" strokeLinecap="round" />
    </svg>
  );
}
