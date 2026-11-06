"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  GripVertical,
  Hourglass,
  Loader2,
  MessageSquareText,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./avatar";
import { Modal } from "./modal";
import { ProjectIdentity } from "./project-identity";
import { WarningBanner } from "./warning-banner";
import { useI18n } from "./language-provider";
import { STATUSES, TASK_TYPE_COLOR, TASK_TYPE_LABEL, phaseTone } from "@/lib/constants";
import {
  diffDays,
  formatDateRange,
  formatLongDate,
  formatShortDate,
  relativeDeadline,
  todayISO,
} from "@/lib/dates";
import { getBufferDates } from "@/lib/schedule";
import type { Holiday, Phase, Project, Task, TaskStatus, TaskType } from "@/lib/types";

const STATUS_STYLE: Record<TaskStatus, { dot: string; soft: string; text: string }> = {
  todo: { dot: "#94a3b8", soft: "#f1f5f9", text: "#475569" },
  doing: { dot: "#8b5cf6", soft: "#f1ecfe", text: "#6d28d9" },
  waiting: { dot: "#fb923c", soft: "#fff7ed", text: "#b45309" },
  done: { dot: "#5b21b6", soft: "#ede9fe", text: "#4c1d95" },
};

interface KanbanProps {
  project: Project;
  phases: Phase[];
  initialTasks: Task[];
  holidays: Holiday[];
  projects: { id: string; title: string }[];
  view: "kanban" | "daftar";
  businessName: string;
  today: string;
}

export function KanbanView({
  project,
  phases,
  initialTasks,
  holidays,
  projects,
  view,
  businessName,
  today,
}: KanbanProps) {
  const { lang, t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState<TaskStatus | null>(null);
  const lastDragRef = useRef(0);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const done = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const lateTasks = tasks
    .filter((task) => task.status !== "done" && task.dueDate < today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const bufferDates = getBufferDates(
    project.deadline,
    Math.max(1, project.bufferDays),
    project.workdays,
    holidays.map((holiday) => holiday.date),
  );
  const bufferRemaining = bufferDates.filter((date) => date >= today).length;

  const phaseById = new Map(phases.map((phase, index) => [phase.id, { ...phase, index }]));

  async function updateStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    const previous = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, status, completedAt: status === "done" ? today : null }
          : item,
      ),
    );
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(payload.error ? t(payload.error) : t("Gagal memindahkan tugas."));
      toast.success(
        status === "done"
          ? t("Tugas ditandai selesai.")
          : t("Dipindah ke {status}.", {
              status: t(STATUSES.find((item) => item.id === status)?.label ?? ""),
            }),
      );
    } catch (error) {
      setTasks(previous);
      toast.error(error instanceof Error ? error.message : t("Gagal memindahkan tugas."));
    }
  }

  return (
    <div className="space-y-5">
      <ProjectIdentity
        project={project}
        projects={projects}
        eyebrow={t("Hari ini, {date}", { date: formatLongDate(today, true, lang) })}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-[18px] bg-[linear-gradient(140deg,#7c3aed_0%,#6425c9_55%,#4c1d95_100%)] px-4 py-4 text-white shadow-[0_22px_40px_-24px_rgba(76,29,149,0.7)]">
          <div className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                {t("Deadline klien")}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[22px] font-extrabold tracking-[-0.03em]">
                  {formatShortDate(project.deadline, lang)}
                </span>
                {project.deadlineTime && (
                  <span className="text-[11px] font-semibold text-white/70">{project.deadlineTime}</span>
                )}
              </div>
              <div
                className={`mt-1 text-[11px] font-medium ${
                  diffDays(today, project.deadline) < 0 ? "text-[#fecdd3]" : "text-white/70"
                }`}
              >
                {relativeDeadline(project.deadline, lang)}
              </div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white">
              <CalendarDays className="h-4.5 w-4.5" />
            </span>
          </div>
        </div>

        <div className="panel overflow-hidden px-4 py-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-green/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="section-title">{t("Progres")}</span>
                <span className="text-[11px] font-bold text-green">{progress}%</span>
              </div>
              <div className="mt-2 text-[22px] font-extrabold tracking-[-0.03em]">
                {done}{" "}
                <span className="text-[12px] font-semibold text-muted">
                  {tasks.length === 1 ? t("dari 1 tugas") : t("dari {n} tugas", { n: tasks.length })}
                </span>
              </div>
              <div className="progress-track mt-2.5">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green/25 bg-green-soft text-green">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </span>
          </div>
        </div>

        <div className="panel overflow-hidden border-green/25 bg-green-soft px-4 py-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-green/25 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="section-title text-green/80">{t("Cadangan waktu")}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-green/60">
                  10%
                </span>
              </div>
              <div className="mt-2 text-[22px] font-extrabold tracking-[-0.03em] text-green">
                {bufferRemaining === 1
                  ? t("1 hari kerja")
                  : t("{n} hari kerja", { n: bufferRemaining })}
              </div>
              <div className="mt-1 text-[11px] font-medium text-green/75">
                {bufferRemaining <= 1
                  ? t("Hampir habis — jaga jadwal")
                  : t("Masih {n} hari sebelum deadline", { n: bufferRemaining })}
              </div>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green/30 bg-green/15 text-green">
              <Hourglass className="h-4.5 w-4.5" />
            </span>
          </div>
        </div>
      </div>

      <WarningBanner
        project={project}
        businessName={businessName}
        lateTasks={lateTasks}
        bufferRemaining={bufferRemaining}
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="no-scrollbar flex overflow-x-auto">
          <div className="inline-flex shrink-0 rounded-lg border border-line bg-card p-1">
            <Link
              href={`/proyek/${project.id}`}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                view === "kanban" ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Kanban
            </Link>
            <Link
              href={`/proyek/${project.id}/kalender`}
              className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-muted transition hover:text-ink"
            >
              {t("Kalender")}
            </Link>
            <Link
              href={`/proyek/${project.id}?view=daftar`}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                view === "daftar" ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {t("Daftar")}
            </Link>
          </div>
        </div>

        <div className="no-scrollbar flex items-center gap-3 overflow-x-auto text-[11px] font-medium text-muted">
          <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted/70 sm:inline">
            {t("Tahap")}
          </span>
          {phases.map((phase, index) => {
            const tone = phaseTone(phase.name, index);
            return (
              <span key={phase.id} className="inline-flex shrink-0 items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
                {phase.name}
              </span>
            );
          })}
        </div>
      </div>

      <PhaseProgress phases={phases} tasks={tasks} />

      {view === "daftar" ? (
        <TaskList
          tasks={tasks}
          phases={phases}
          today={today}
          onOpen={setEditing}
          onToggleDone={(task) =>
            updateStatus(task, task.status === "done" ? "todo" : "done")
          }
          onMove={updateStatus}
          onAdd={() => setAdding("todo")}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUSES.map((status) => {
            const style = STATUS_STYLE[status.id];
            const list = tasks
              .filter((task) => task.status === status.id)
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.order - b.order);
            const isExpanded = expanded[status.id];
            const visible = isExpanded ? list : list.slice(0, 6);
            const hidden = list.length - visible.length;

            return (
              <section
                key={status.id}
                className={`kanban-column flex w-[272px] shrink-0 flex-col p-2.5 transition-colors xl:w-auto xl:min-w-0 xl:flex-1 ${
                  dragOver === status.id ? "ring-2 ring-green/25" : ""
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOver(status.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/plain") || draggingId;
                  const task = tasks.find((item) => item.id === id);
                  setDragOver(null);
                  setDraggingId(null);
                  if (task) updateStatus(task, status.id);
                }}
              >
                <div className="flex items-center justify-between px-1 pb-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: style.dot }}
                    />
                    <span className="text-[12px] font-bold text-ink">{t(status.label)}</span>
                  </div>
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                    style={{ background: style.soft, color: style.text }}
                  >
                    {list.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  {visible.map((task) => {
                    const phase = phaseById.get(task.phaseId);
                    const tone = phaseTone(phase?.name ?? "Tugas", phase?.index ?? 0);
                    const late = task.status !== "done" && task.dueDate < today;
                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(event) => {
                          lastDragRef.current = Date.now();
                          setDraggingId(task.id);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", task.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOver(null);
                        }}
                        onClick={() => {
                          if (Date.now() - lastDragRef.current < 250) return;
                          setEditing(task);
                        }}
                        className={`task-card group ${late ? "task-card-late" : ""} ${
                          draggingId === task.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="inline-flex min-w-0 items-center gap-1.5 truncate text-[10px] font-bold"
                            style={{ color: tone.text }}
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: tone.dot }}
                            />
                            <span className="truncate">{phase?.name ?? t("Tanpa tahap")}</span>
                          </span>
                          <GripVertical className="h-3 w-3 shrink-0 text-line-strong opacity-0 transition group-hover:opacity-100" />
                        </div>
                        <h3
                          className={`mt-1.5 text-[12.5px] font-bold leading-snug text-ink ${
                            task.status === "done" ? "line-through decoration-1 opacity-60" : ""
                          }`}
                        >
                          {task.title}
                        </h3>

                        {task.type !== "internal" && (
                          <div
                            className="mt-1 text-[10px] font-semibold"
                            style={{ color: TASK_TYPE_COLOR[task.type] }}
                          >
                            {t(TASK_TYPE_LABEL[task.type])}
                          </div>
                        )}

                        {late && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-rust">
                            <AlertTriangle className="h-3 w-3" />
                            {diffDays(task.dueDate, today) === 1
                              ? t("Terlambat 1 hari")
                              : t("Terlambat {n} hari", {
                                  n: diffDays(task.dueDate, today),
                                })}
                          </div>
                        )}

                        {task.progressNote && task.status !== "done" && (
                          <div className="mt-1.5 flex gap-1.5 rounded-lg border border-line bg-paper px-2 py-1.5 text-[9.5px] leading-snug text-ink-2/80">
                            <MessageSquareText className="mt-0.5 h-2.5 w-2.5 shrink-0 text-green/70" />
                            <span className="line-clamp-2">{task.progressNote}</span>
                          </div>
                        )}

                        <div className="mt-2.5 flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10.5px] font-medium text-muted">
                              {formatDateRange(task.startDate, task.dueDate, lang)}
                            </div>
                            {task.status === "done" && (
                              <div className="mt-0.5 inline-flex items-center gap-1 text-[9.5px] font-semibold text-green/70">
                                <Check className="h-2.5 w-2.5" /> {t("Selesai")}
                              </div>
                            )}
                          </div>
                          <Avatar name={task.assignee} size="sm" />
                        </div>

                        {/* Touch devices cannot use HTML5 drag-and-drop reliably. */}
                        <div
                          className="mt-2 flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2 py-1.5 xl:hidden"
                          draggable={false}
                          onDragStart={(event) => event.preventDefault()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                            {t("Pindah")}
                          </span>
                          <select
                            aria-label={t("Pindahkan tugas ke kolom lain")}
                            value={task.status}
                            onChange={(event) =>
                              updateStatus(task, event.target.value as TaskStatus)
                            }
                            onMouseDown={(event) => event.stopPropagation()}
                            onTouchStart={(event) => event.stopPropagation()}
                            className="min-w-0 flex-1 cursor-pointer bg-transparent text-[11px] font-semibold text-ink outline-none"
                          >
                            {STATUSES.map((option) => (
                              <option key={option.id} value={option.id}>
                                {t(option.label)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    );
                  })}

                  {!list.length && (
                    <button
                      type="button"
                      onClick={() => setAdding(status.id)}
                      className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line-strong/70 px-3 py-7 text-[11px] font-medium text-muted transition hover:border-green/40 hover:bg-paper hover:text-green"
                    >
                      <Plus className="h-4 w-4" />
                      {t("Belum ada tugas")}
                    </button>
                  )}

                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((current) => ({ ...current, [status.id]: true }))
                      }
                      className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong py-2 text-[10.5px] font-semibold text-muted transition hover:bg-paper hover:text-ink"
                    >
                      {t("Lihat {n} tugas lainnya", { n: hidden })}{" "}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setAdding(status.id)}
                  className="mt-2 flex w-full items-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-muted transition hover:bg-paper hover:text-green"
                >
                  <Plus className="h-3.5 w-3.5" /> {t("Tambah tugas")}
                </button>
              </section>
            );
          })}
        </div>
      )}

      {editing && (
        <TaskEditModal
          task={editing}
          phases={phases}
          team={project.team}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setTasks((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
            setEditing(null);
          }}
          onDeleted={(id) => {
            setTasks((current) => current.filter((item) => item.id !== id));
            setEditing(null);
          }}
        />
      )}

      {adding && (
        <AddTaskModal
          projectId={project.id}
          phases={phases}
          team={project.team}
          initialStatus={adding}
          onClose={() => setAdding(null)}
          onCreated={(task) => {
            setTasks((current) => [...current, task]);
            setAdding(null);
          }}
        />
      )}
    </div>
  );
}

function PhaseProgress({ phases, tasks }: { phases: Phase[]; tasks: Task[] }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="section-title">{t("Progres tahap")}</span>
        <span className="text-[10px] text-muted">{t("Update singkat tiap tahap")}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {phases.map((phase, index) => {
          const tone = phaseTone(phase.name, index);
          const list = tasks.filter((task) => task.phaseId === phase.id);
          const done = list.filter((task) => task.status === "done").length;
          const total = list.length;
          const percent = total ? Math.round((done / total) * 100) : 0;
          const noteTask =
            [...list]
              .filter((task) => task.progressNote && task.status !== "done")
              .sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0] ??
            list.find((task) => task.progressNote);
          const nextTask = list.find((task) => task.status !== "done");
          const note = noteTask?.progressNote
            ? noteTask.progressNote
            : total > 0 && done === total
              ? t("Semua tugas tahap ini selesai.")
              : done > 0
                ? t("{done} dari {total} tugas selesai. Berikutnya: {next}.", {
                    done,
                    total,
                    next: nextTask?.title ?? "—",
                  })
                : t("{total} tugas belum dimulai.", { total });

          return (
            <div
              key={phase.id}
              className="glass-soft rounded-xl p-3"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: tone.dot, boxShadow: `0 0 8px ${tone.dot}55` }}
                />
                <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: tone.text }}>
                  {phase.name}
                </span>
                <span className="ml-auto shrink-0 text-[9px] font-semibold text-muted">
                  {done}/{total}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, background: tone.dot }}
                />
              </div>
              <div className="mt-2 flex gap-1.5 text-[9.5px] leading-snug text-muted">
                <MessageSquareText className="mt-0.5 h-2.5 w-2.5 shrink-0 text-green/65" />
                <span className="line-clamp-2">{note}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskList({
  tasks,
  phases,
  today,
  onOpen,
  onToggleDone,
  onMove,
  onAdd,
}: {
  tasks: Task[];
  phases: Phase[];
  today: string;
  onOpen: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onAdd: () => void;
}) {
  const { lang, t } = useI18n();
  const phaseById = new Map(phases.map((phase, index) => [phase.id, { ...phase, index }]));

  return (
    <div className="panel overflow-hidden">
      <div className="hidden grid-cols-[42px_minmax(0,1fr)_150px_130px_120px] gap-3 border-b border-line bg-paper/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted sm:grid">
        <span>{t("Selesai")}</span>
        <span>{t("Tugas")}</span>
        <span>{t("Tahap")}</span>
        <span>{t("Tanggal")}</span>
        <span>{t("PJ")}</span>
      </div>
      {STATUSES.map((status) => {
        const list = tasks
          .filter((task) => task.status === status.id)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        if (!list.length) return null;
        return (
          <div key={status.id}>
            <div className="flex items-center gap-2 border-b border-line bg-paper/40 px-4 py-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: STATUS_STYLE[status.id].dot }}
              />
              <span className="text-[11px] font-bold text-ink-2">{t(status.label)}</span>
              <span className="text-[10px] text-muted">{list.length}</span>
            </div>
            {list.map((task) => {
              const phase = phaseById.get(task.phaseId);
              const tone = phaseTone(phase?.name ?? "Tugas", phase?.index ?? 0);
              const late = task.status !== "done" && task.dueDate < today;
              return (
                <div
                  key={task.id}
                  className="grid cursor-pointer grid-cols-[42px_minmax(0,1fr)] items-center gap-3 border-b border-line/70 px-4 py-2.5 transition last:border-0 hover:bg-paper/50 sm:grid-cols-[42px_minmax(0,1fr)_150px_130px_120px]"
                  onClick={() => onOpen(task)}
                >
                  <button
                    type="button"
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                      task.status === "done"
                        ? "border-green bg-green text-white"
                        : "border-line-strong bg-card hover:border-green"
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleDone(task);
                    }}
                    aria-label={task.status === "done" ? t("Tandai belum selesai") : t("Tandai selesai")}
                  >
                    {task.status === "done" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0">
                    <div
                      className={`truncate text-[12.5px] font-semibold text-ink ${
                        task.status === "done" ? "line-through opacity-55" : ""
                      }`}
                    >
                      {task.title}
                    </div>
                    {task.progressNote && (
                      <div className="mt-0.5 line-clamp-1 text-[9.5px] text-muted">
                        {task.progressNote}
                      </div>
                    )}
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted sm:hidden">
                      <span style={{ color: tone.text }}>{phase?.name}</span>
                      <span>{formatDateRange(task.startDate, task.dueDate, lang)}</span>
                      {late && <span className="font-bold text-rust">{t("Terlambat")}</span>}
                    </div>
                  </div>
                  <span className="hidden truncate text-[11px] font-medium sm:block" style={{ color: tone.text }}>
                    {phase?.name}
                  </span>
                  <span className={`hidden text-[11px] sm:block ${late ? "font-bold text-rust" : "text-muted"}`}>
                    {formatDateRange(task.startDate, task.dueDate, lang)}
                  </span>
                  <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1 sm:justify-start">
                    <select
                      aria-label={t("Pindahkan tugas ke kolom lain")}
                      value={task.status}
                      onChange={(event) =>
                        onMove(task, event.target.value as TaskStatus)
                      }
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                      onTouchStart={(event) => event.stopPropagation()}
                      className="mr-auto max-w-[140px] cursor-pointer rounded-md border border-line bg-card px-1.5 py-1 text-[10px] font-semibold text-ink-2 outline-none xl:hidden"
                    >
                      {STATUSES.map((status) => (
                        <option key={status.id} value={status.id}>
                          {t(status.label)}
                        </option>
                      ))}
                    </select>
                    <Avatar name={task.assignee} size="xs" />
                    <span className="hidden truncate text-[10.5px] text-muted sm:inline">
                      {task.assignee}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {!tasks.length && (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <p className="text-[12.5px] text-muted">{t("Belum ada tugas di proyek ini.")}</p>
          <button type="button" className="btn-mint btn-sm" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" /> {t("Tambah tugas pertama")}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center gap-1.5 border-t border-dashed border-line px-4 py-3 text-[11.5px] font-semibold text-muted transition hover:bg-paper hover:text-green"
      >
        <Plus className="h-3.5 w-3.5" /> {t("Tambah tugas")}
      </button>
    </div>
  );
}

function TaskEditModal({
  task,
  phases,
  team,
  onClose,
  onSaved,
  onDeleted,
}: {
  task: Task;
  phases: Phase[];
  team: string[];
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const { lang, t } = useI18n();
  const [form, setForm] = useState({
    title: task.title,
    phaseId: task.phaseId,
    type: task.type,
    assignee: task.assignee,
    status: task.status,
    startDate: task.startDate,
    dueDate: task.dueDate,
    durationDays: task.durationDays,
    progressNote: task.progressNote ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          phaseId: form.phaseId,
          type: form.type,
          startDate: form.startDate,
          dueDate: form.dueDate,
          durationDays: form.durationDays,
          ...(form.title !== task.title ? { title: form.title } : {}),
          ...(form.assignee !== task.assignee ? { assignee: form.assignee } : {}),
          ...(form.progressNote !== (task.progressNote ?? "")
            ? { progressNote: form.progressNote }
            : {}),
        }),
      });
      const payload = (await response.json()) as { error?: string; task?: Task };
      if (!response.ok || !payload.task)
        throw new Error(payload.error ? t(payload.error) : t("Gagal menyimpan tugas."));
      toast.success(t("Tugas diperbarui."));
      onSaved(payload.task);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menyimpan tugas."));
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("Hapus tugas ini? Tindakan ini tidak bisa dibatalkan."))) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(payload.error ? t(payload.error) : t("Gagal menghapus tugas."));
      toast.success(t("Tugas dihapus."));
      onDeleted(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menghapus tugas."));
      setDeleting(false);
    }
  }

  return (
    <Modal
      title={t("Detail tugas")}
      subtitle={`${formatLongDate(task.startDate, true, lang)} → ${formatLongDate(task.dueDate, true, lang)}`}
      onClose={onClose}
      wide
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="btn-ghost btn-sm text-danger hover:bg-danger/[0.06]"
            onClick={remove}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {t("Hapus")}
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t("Batal")}
            </button>
            <button type="button" className="btn-primary" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t("Menyimpan…") : t("Simpan perubahan")}
            </button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-3 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <div className="space-y-3.5">
        <div>
          <label className="label" htmlFor="task-title">
            {t("Judul tugas")}
          </label>
          <input
            id="task-title"
            className="field"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="task-progress-note">
            {t("Deskripsi progres")}
          </label>
          <textarea
            id="task-progress-note"
            className="field min-h-[72px] resize-y text-[12px] leading-relaxed"
            maxLength={500}
            placeholder={t(
              "Mis. plakat sedang dalam pengantaran dengan estimasi penyampaian tgl 10 Nov pukul 16:45.",
            )}
            value={form.progressNote}
            onChange={(event) => setForm({ ...form, progressNote: event.target.value })}
          />
          <p className="mt-1 text-[10px] text-muted">
            {t("Tampil di kartu Kanban dan ringkasan progres tahap.")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="task-phase">
              {t("Tahap")}
            </label>
            <select
              id="task-phase"
              className="field"
              value={form.phaseId}
              onChange={(event) => setForm({ ...form, phaseId: event.target.value })}
            >
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-status">
              {t("Kolom")}
            </label>
            <select
              id="task-status"
              className="field"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
            >
              {STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {t(status.label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-type">
              {t("Tipe")}
            </label>
            <select
              id="task-type"
              className="field"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as TaskType })}
            >
              {Object.entries(TASK_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-assignee">
              {t("Penanggung jawab")}
            </label>
            <input
              id="task-assignee"
              className="field"
              list={`team-${task.id}`}
              value={form.assignee}
              onChange={(event) => setForm({ ...form, assignee: event.target.value })}
            />
            <datalist id={`team-${task.id}`}>
              {team.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="task-start">
              {t("Mulai")}
            </label>
            <input
              id="task-start"
              type="date"
              className="field"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="task-due">
              {t("Selesai")}
            </label>
            <input
              id="task-due"
              type="date"
              className="field"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-[11px] text-muted">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("Tanggal tidak boleh jatuh di hari Minggu atau hari libur.")}
        </div>
      </div>
    </Modal>
  );
}

function AddTaskModal({
  projectId,
  phases,
  team,
  initialStatus,
  onClose,
  onCreated,
}: {
  projectId: string;
  phases: Phase[];
  team: string[];
  initialStatus: TaskStatus;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: "",
    phaseId: phases[0]?.id ?? "",
    type: "internal" as TaskType,
    assignee: team[0] ?? "Saya",
    durationDays: 1,
    status: initialStatus,
    progressNote: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const statusLabel = STATUSES.find((status) => status.id === initialStatus)?.label;

  async function save() {
    if (form.title.trim().length < 2) {
      setError(t("Judul tugas minimal 2 karakter."));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId }),
      });
      const payload = (await response.json()) as { error?: string; task?: Task };
      if (!response.ok || !payload.task)
        throw new Error(payload.error ? t(payload.error) : t("Gagal menambah tugas."));
      toast.success(t("Tugas ditambahkan."));
      onCreated(payload.task);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menambah tugas."));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={t("Tambah tugas")}
      subtitle={t("Akan masuk ke kolom {status}. Tanggal dihitung mundur dari deadline.", {
        status: t(statusLabel ?? ""),
      })}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("Batal")}
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? t("Menyimpan…") : t("Tambah tugas")}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-3 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <div className="space-y-3.5">
        <div>
          <label className="label" htmlFor="new-task-title">
            {t("Judul tugas")}
          </label>
          <input
            id="new-task-title"
            className="field"
            autoFocus
            placeholder={t("Mis. Konfirmasi jadwal pengiriman")}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="new-task-progress-note">
            {t("Deskripsi progres (opsional)")}
          </label>
          <textarea
            id="new-task-progress-note"
            className="field min-h-[64px] resize-y text-[12px] leading-relaxed"
            maxLength={500}
            placeholder={t("Update singkat yang akan tampil di kartu dan tahap.")}
            value={form.progressNote}
            onChange={(event) => setForm({ ...form, progressNote: event.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="new-task-phase">
              {t("Tahap")}
            </label>
            <select
              id="new-task-phase"
              className="field"
              value={form.phaseId}
              onChange={(event) => setForm({ ...form, phaseId: event.target.value })}
            >
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="new-task-type">
              {t("Tipe")}
            </label>
            <select
              id="new-task-type"
              className="field"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as TaskType })}
            >
              {Object.entries(TASK_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="new-task-assignee">
              {t("Penanggung jawab")}
            </label>
            <input
              id="new-task-assignee"
              className="field"
              list="new-task-team"
              value={form.assignee}
              onChange={(event) => setForm({ ...form, assignee: event.target.value })}
            />
            <datalist id="new-task-team">
              {team.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="new-task-duration">
              {t("Durasi (hari kerja)")}
            </label>
            <input
              id="new-task-duration"
              type="number"
              min={1}
              max={60}
              className="field"
              value={form.durationDays}
              onChange={(event) =>
                setForm({ ...form, durationDays: Number(event.target.value) || 1 })
              }
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
