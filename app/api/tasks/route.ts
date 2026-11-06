import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { mutateDb, getDb } from "@/lib/store";
import { scheduleSingleTask } from "@/lib/schedule";
import { getHolidays, localizeTask } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { todayISO } from "@/lib/dates";
import type { TaskStatus, TaskType } from "@/lib/types";

const TYPES = new Set<TaskType>(["internal", "waiting_client", "vendor", "payment", "delivery"]);
const STATUSES = new Set<TaskStatus>(["todo", "doing", "waiting", "done"]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  const lang = await getLang();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      projectId?: string;
      phaseId?: string;
      title?: string;
      type?: TaskType;
      assignee?: string;
      durationDays?: number;
      status?: TaskStatus;
      progressNote?: string;
    };
    const db = getDb();
    const project = db.projects.find((item) => item.id === body.projectId && item.userId === user.id);
    if (!project) return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
    const phase = db.phases.find((item) => item.id === body.phaseId && item.projectId === project.id);
    if (!phase) return NextResponse.json({ error: "Tahap tidak ditemukan." }, { status: 400 });
    const title = (body.title ?? "").trim();
    if (title.length < 2) return NextResponse.json({ error: "Judul tugas wajib diisi." }, { status: 400 });
    if (db.tasks.filter((task) => task.projectId === project.id).length >= 120) {
      return NextResponse.json({ error: "Batas tugas proyek tercapai." }, { status: 400 });
    }

    const durationDays = Math.min(60, Math.max(1, Math.round(Number(body.durationDays) || 1)));
    const holidays = getHolidays().map((holiday) => holiday.date);
    const date = scheduleSingleTask({
      deadline: project.deadline,
      bufferDays: project.bufferDays,
      workdays: project.workdays,
      holidays,
      durationDays,
    });
    const status = STATUSES.has(body.status as TaskStatus) ? (body.status as TaskStatus) : "todo";
    const task = {
      id: `t_${randomUUID()}`,
      projectId: project.id,
      phaseId: phase.id,
      title: title.slice(0, 160),
      type: TYPES.has(body.type as TaskType) ? (body.type as TaskType) : ("internal" as TaskType),
      startDate: date.startDate,
      dueDate: date.dueDate,
      durationDays,
      dependsOn: [],
      assignee: (body.assignee || project.team[0] || "Saya").slice(0, 60),
      status,
      source: "manual" as const,
      order: Math.max(0, ...db.tasks.filter((item) => item.projectId === project.id).map((item) => item.order)) + 1,
      completedAt: status === "done" ? todayISO() : null,
      progressNote: (body.progressNote ?? "").trim().slice(0, 500) || undefined,
    };

    await mutateDb((database) => {
      database.tasks.push(task);
      const target = database.projects.find((item) => item.id === project.id);
      if (target) target.updatedAt = new Date().toISOString();
    });

    return NextResponse.json({ task: localizeTask(lang, task) });
  } catch {
    return NextResponse.json({ error: "Gagal menambah tugas." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    const db = getDb();
    const task = db.tasks.find((item) => item.id === id);
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    const project = db.projects.find((item) => item.id === task.projectId && item.userId === user.id);
    if (!project) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    await mutateDb((database) => {
      database.tasks = database.tasks.filter((item) => item.id !== id);
      const target = database.projects.find((item) => item.id === project.id);
      if (target) target.updatedAt = new Date().toISOString();
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus tugas." }, { status: 500 });
  }
}

export const runtime = "nodejs";
