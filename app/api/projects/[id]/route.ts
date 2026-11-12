import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { getDb, mutateDb } from "@/lib/store";
import { getLang } from "@/lib/lang-server";
import { translate } from "@/lib/i18n";
import { deleteUpload } from "@/lib/uploads";
import { getHolidays } from "@/lib/data";
import { scheduleTasks } from "@/lib/schedule";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  const lang = await getLang();
  if (!user) {
    return NextResponse.json(
      { error: translate(lang, "Silakan masuk terlebih dahulu.") },
      { status: 401 },
    );
  }
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: translate(lang, "Hanya Owner yang bisa mengubah proyek.") },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      title?: string;
      clientName?: string;
      clientWa?: string;
      deadline?: string;
      deadlineTime?: string;
      story?: string;
      value?: number;
      team?: string[];
      whatsappNotify?: boolean;
    };
    const db = await getDb();
    const project = db.projects.find(
      (item) => item.id === id && item.workspaceId === user.workspaceId,
    );
    if (!project) {
      return NextResponse.json(
        { error: translate(lang, "Proyek tidak ditemukan.") },
        { status: 404 },
      );
    }

    const title = body.title?.trim();
    const clientName = body.clientName?.trim();
    const deadline = body.deadline?.trim();
    if (title !== undefined && title.length < 2) {
      return NextResponse.json(
        { error: translate(lang, "Nama proyek wajib diisi.") },
        { status: 400 },
      );
    }
    if (clientName !== undefined && clientName.length < 2) {
      return NextResponse.json(
        { error: translate(lang, "Nama klien wajib diisi.") },
        { status: 400 },
      );
    }
    if (deadline !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return NextResponse.json(
        { error: translate(lang, "Deadline belum diisi.") },
        { status: 400 },
      );
    }

    const deadlineChanged = Boolean(deadline && deadline !== project.deadline);
    let taskDates: Record<string, { startDate: string; dueDate: string }> = {};
    let bufferDays = project.bufferDays;

    if (deadlineChanged) {
      const tasks = db.tasks
        .filter((task) => task.projectId === project.id)
        .sort((a, b) => a.order - b.order);
      const holidays = (await getHolidays(project.workspaceId)).map(
        (holiday) => holiday.date,
      );
      const schedule = scheduleTasks({
        deadline: deadline!,
        workdays: project.workdays,
        holidays,
        tasks: tasks.map((task) => ({
          id: task.id,
          durationDays: task.durationDays,
          dependsOn: task.dependsOn,
          order: task.order,
        })),
      });
      taskDates = schedule.dates;
      bufferDays = schedule.bufferDays;
    }

    await mutateDb((database) => {
      const target = database.projects.find((item) => item.id === project.id);
      if (!target) return;
      if (title !== undefined) target.title = title.slice(0, 160);
      if (clientName !== undefined) target.clientName = clientName.slice(0, 100);
      if (body.clientWa !== undefined) target.clientWa = body.clientWa.trim().slice(0, 40);
      if (body.story !== undefined) target.story = body.story.trim().slice(0, 6000);
      if (body.value !== undefined) target.value = Math.max(0, Number(body.value) || 0);
      if (body.deadlineTime !== undefined) {
        target.deadlineTime = body.deadlineTime.trim().slice(0, 5) || undefined;
      }
      if (Array.isArray(body.team)) {
        target.team = Array.from(
          new Set(body.team.map((name) => String(name).trim()).filter(Boolean)),
        ).slice(0, 20);
      }
      if (body.whatsappNotify !== undefined) {
        target.whatsappNotify = Boolean(body.whatsappNotify);
      }
      if (deadline !== undefined) target.deadline = deadline;
      if (deadlineChanged) {
        target.bufferDays = bufferDays;
        for (const task of database.tasks.filter((item) => item.projectId === target.id)) {
          const dates = taskDates[task.id];
          if (dates) {
            task.startDate = dates.startDate;
            task.dueDate = dates.dueDate;
          }
        }
      }
      target.updatedAt = new Date().toISOString();
      recordActivity(database, {
        workspaceId: user.workspaceId,
        user,
        action: "project.update",
        detail: target.title,
        entityId: target.id,
      });
    });

    const updated = (await getDb()).projects.find((item) => item.id === project.id);
    return NextResponse.json({ ok: true, project: updated });
  } catch {
    return NextResponse.json(
      { error: translate(lang, "Gagal mengubah proyek.") },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  const lang = await getLang();
  if (!user) {
    return NextResponse.json(
      { error: translate(lang, "Silakan masuk terlebih dahulu.") },
      { status: 401 },
    );
  }
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: translate(lang, "Hanya Owner yang bisa menghapus proyek.") },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const db = await getDb();
    const project = db.projects.find(
      (item) => item.id === id && item.workspaceId === user.workspaceId,
    );
    if (!project) {
      return NextResponse.json(
        { error: translate(lang, "Proyek tidak ditemukan.") },
        { status: 404 },
      );
    }

    await mutateDb((db) => {
      db.projects = db.projects.filter((item) => item.id !== id);
      db.phases = db.phases.filter((item) => item.projectId !== id);
      db.tasks = db.tasks.filter((item) => item.projectId !== id);
      recordActivity(db, {
        workspaceId: user.workspaceId,
        user,
        action: "project.delete",
        detail: project.title,
        entityId: project.id,
      });
    });

    for (const attachment of project.attachments ?? []) {
      try {
        await deleteUpload(attachment.url);
      } catch {
        // The database entry is already gone; a missing file should not fail the delete.
      }
    }

    const store = await cookies();
    if (store.get("tuntas_project")?.value === id) {
      store.delete("tuntas_project");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: translate(lang, "Gagal menghapus proyek.") },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
