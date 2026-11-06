import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, mutateDb } from "@/lib/store";
import { getHolidays } from "@/lib/data";
import { scheduleTasks } from "@/lib/schedule";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  try {
    const body = (await request.json()) as { date?: string; name?: string };
    const date = (body.date ?? "").trim();
    const name = (body.name ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || name.length < 2) {
      return NextResponse.json({ error: "Tanggal dan nama libur wajib diisi." }, { status: 400 });
    }
    const db = await getDb();
    if (db.holidays.some((holiday) => holiday.date === date)) {
      return NextResponse.json({ error: "Tanggal itu sudah ditandai libur." }, { status: 409 });
    }

    const holiday = {
      id: `h_${randomUUID()}`,
      date,
      name: name.slice(0, 80),
      source: "user" as const,
    };
    await mutateDb((database) => {
      database.holidays.push(holiday);
    });

    // Sesuaikan jadwal proyek milik pengguna yang punya tugas pada tanggal tersebut.
    let adjustedProjects = 0;
    const userProjects = db.projects.filter((project) => project.userId === user.id);
    const holidays = (await getHolidays()).map((holiday) => holiday.date);
    const updates: {
      projectId: string;
      dates: Record<string, { startDate: string; dueDate: string }>;
      bufferDays: number;
    }[] = [];

    for (const project of userProjects) {
      const tasks = db.tasks.filter(
        (task) => task.projectId === project.id && (task.startDate <= date && task.dueDate >= date),
      );
      if (!tasks.length) continue;
      const allTasks = db.tasks
        .filter((task) => task.projectId === project.id)
        .sort((a, b) => a.order - b.order);
      const schedule = scheduleTasks({
        deadline: project.deadline,
        workdays: project.workdays,
        holidays,
        tasks: allTasks.map((task) => ({
          id: task.id,
          durationDays: task.durationDays,
          dependsOn: task.dependsOn,
          order: task.order,
        })),
      });
      updates.push({ projectId: project.id, dates: schedule.dates, bufferDays: schedule.bufferDays });
      adjustedProjects += 1;
    }

    if (updates.length) {
      await mutateDb((database) => {
        for (const update of updates) {
          for (const task of database.tasks.filter((item) => item.projectId === update.projectId)) {
            const dates = update.dates[task.id];
            if (dates) {
              task.startDate = dates.startDate;
              task.dueDate = dates.dueDate;
            }
          }
          const target = database.projects.find((item) => item.id === update.projectId);
          if (target) {
            target.bufferDays = update.bufferDays;
            target.updatedAt = new Date().toISOString();
          }
        }
      });
    }

    return NextResponse.json({ ok: true, holiday, adjustedProjects });
  } catch {
    return NextResponse.json({ error: "Gagal menambah hari libur." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Libur tidak ditemukan." }, { status: 404 });
    const db = await getDb();
    const holiday = db.holidays.find((item) => item.id === id);
    if (!holiday) return NextResponse.json({ error: "Libur tidak ditemukan." }, { status: 404 });
    if (holiday.source !== "user") {
      return NextResponse.json(
        { error: "Hari libur nasional/bali hanya bisa dilihat, tidak dihapus." },
        { status: 400 },
      );
    }
    await mutateDb((database) => {
      database.holidays = database.holidays.filter((item) => item.id !== id);
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus hari libur." }, { status: 500 });
  }
}
