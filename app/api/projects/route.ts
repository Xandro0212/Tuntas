import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { mutateDb } from "@/lib/store";
import { scheduleTasks } from "@/lib/schedule";
import { getHolidays } from "@/lib/data";
import type { Category, Project, Task, TaskType } from "@/lib/types";

const CATEGORIES = new Set<Category>(["kerajinan", "katering", "konveksi", "jasa", "lainnya"]);
const TYPES = new Set<TaskType>(["internal", "waiting_client", "vendor", "payment", "delivery"]);

interface IncomingTask {
  tempId: string;
  phaseIndex: number;
  title: string;
  type: TaskType;
  durationDays: number;
  dependsOn: string[];
  assignee: string;
  source?: "ai" | "manual";
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      title?: string;
      category?: string;
      clientName?: string;
      clientWa?: string;
      deadline?: string;
      deadlineTime?: string;
      story?: string;
      value?: number;
      team?: string[];
      workdays?: number[];
      attachments?: { name: string; url: string; size?: number }[];
      phases?: { name: string }[];
      tasks?: IncomingTask[];
    };

    const title = (body.title ?? "").trim();
    const clientName = (body.clientName ?? "").trim();
    const clientWa = (body.clientWa ?? "").trim();
    const deadline = (body.deadline ?? "").trim();
    const story = (body.story ?? "").trim();
    const category = (body.category ?? "kerajinan") as Category;
    const phases = (body.phases ?? []).filter((phase) => phase?.name?.trim());
    const incomingTasks = (body.tasks ?? []).filter((task) => task?.title?.trim());

    if (title.length < 2) return NextResponse.json({ error: "Nama proyek wajib diisi." }, { status: 400 });
    if (!CATEGORIES.has(category))
      return NextResponse.json({ error: "Jenis pekerjaan tidak valid." }, { status: 400 });
    if (!clientName) return NextResponse.json({ error: "Nama klien wajib diisi." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline))
      return NextResponse.json({ error: "Deadline belum diisi." }, { status: 400 });
    if (!phases.length) return NextResponse.json({ error: "Rencana belum punya tahap." }, { status: 400 });
    if (!incomingTasks.length)
      return NextResponse.json({ error: "Rencana belum punya tugas." }, { status: 400 });
    if (incomingTasks.length > 100)
      return NextResponse.json({ error: "Terlalu banyak tugas dalam satu proyek." }, { status: 400 });

    const workdays = Array.isArray(body.workdays) && body.workdays.length
      ? body.workdays
      : [1, 2, 3, 4, 5, 6];
    const team = Array.isArray(body.team) ? body.team.filter(Boolean).slice(0, 20) : [];
    const holidays = getHolidays();
    const holidayDates = holidays.map((holiday) => holiday.date);

    const projectId = `p_${randomUUID()}`;
    const phaseIds = phases.map(() => `ph_${randomUUID()}`);
    const taskTempToId = new Map<string, string>();
    for (const task of incomingTasks) {
      taskTempToId.set(task.tempId, `t_${randomUUID()}`);
    }

    const schedule = scheduleTasks({
      deadline,
      workdays,
      holidays: holidayDates,
      tasks: incomingTasks.map((task, index) => ({
        id: task.tempId,
        durationDays: Math.max(1, Math.round(Number(task.durationDays) || 1)),
        dependsOn: (task.dependsOn ?? []).filter((dep) => taskTempToId.has(dep)),
        order: index + 1,
      })),
    });

    const now = new Date().toISOString();
    const project: Project = {
      id: projectId,
      userId: user.id,
      title: title.slice(0, 160),
      category,
      clientName: clientName.slice(0, 100),
      clientWa: clientWa.slice(0, 40),
      deadline,
      deadlineTime: body.deadlineTime?.slice(0, 5) || undefined,
      bufferDays: schedule.bufferDays,
      story: story.slice(0, 6000),
      value: Number(body.value) || 0,
      team,
      workdays: Array.from(new Set(workdays)),
      attachments: Array.isArray(body.attachments)
        ? body.attachments.slice(0, 8).map((file) => ({
            name: String(file.name ?? "Lampiran").slice(0, 120),
            url: String(file.url ?? ""),
            size: Number(file.size) || 0,
          }))
        : [],
      createdAt: now,
      updatedAt: now,
    };

    const tasks: Task[] = incomingTasks.map((task, index) => {
      const phaseIndex = Math.min(Math.max(0, Number(task.phaseIndex) || 0), phaseIds.length - 1);
      const date = schedule.dates[task.tempId] ?? {
        startDate: schedule.projectStart,
        dueDate: schedule.projectFinish,
      };
      const type = TYPES.has(task.type) ? task.type : "internal";
      return {
        id: taskTempToId.get(task.tempId)!,
        projectId,
        phaseId: phaseIds[phaseIndex],
        title: task.title.trim().slice(0, 160),
        type,
        startDate: date.startDate,
        dueDate: date.dueDate,
        durationDays: Math.max(1, Math.round(Number(task.durationDays) || 1)),
        dependsOn: (task.dependsOn ?? [])
          .map((dep) => taskTempToId.get(dep))
          .filter((dep): dep is string => Boolean(dep)),
        assignee: (task.assignee || team[0] || "Saya").slice(0, 60),
        status: "todo",
        source: task.source === "manual" ? "manual" : "ai",
        order: index + 1,
        completedAt: null,
      };
    });

    await mutateDb((db) => {
      db.projects.push(project);
      phases.forEach((phase, index) => {
        db.phases.push({
          id: phaseIds[index],
          projectId,
          name: phase.name.trim().slice(0, 80),
          order: index + 1,
        });
      });
      db.tasks.push(...tasks);
    });

    return NextResponse.json({ id: projectId });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan proyek. Coba lagi." }, { status: 500 });
  }
}
