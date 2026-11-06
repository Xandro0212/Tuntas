import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, mutateDb } from "@/lib/store";
import { scheduleTasks } from "@/lib/schedule";
import { getHolidays } from "@/lib/data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  try {
    const { id } = await params;
    const db = getDb();
    const project = db.projects.find((item) => item.id === id && item.userId === user.id);
    if (!project) return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
    const tasks = db.tasks
      .filter((task) => task.projectId === project.id)
      .sort((a, b) => a.order - b.order);
    if (!tasks.length) return NextResponse.json({ error: "Proyek belum punya tugas." }, { status: 400 });

    const holidays = getHolidays().map((holiday) => holiday.date);
    const schedule = scheduleTasks({
      deadline: project.deadline,
      workdays: project.workdays,
      holidays,
      tasks: tasks.map((task) => ({
        id: task.id,
        durationDays: task.durationDays,
        dependsOn: task.dependsOn,
        order: task.order,
      })),
    });

    await mutateDb((database) => {
      for (const task of database.tasks.filter((item) => item.projectId === project.id)) {
        const dates = schedule.dates[task.id];
        if (dates) {
          task.startDate = dates.startDate;
          task.dueDate = dates.dueDate;
        }
      }
      const target = database.projects.find((item) => item.id === project.id);
      if (target) {
        target.bufferDays = schedule.bufferDays;
        target.updatedAt = new Date().toISOString();
      }
    });

    return NextResponse.json({
      ok: true,
      projectStart: schedule.projectStart,
      projectFinish: schedule.projectFinish,
      bufferDays: schedule.bufferDays,
      bufferDates: schedule.bufferDates,
    });
  } catch {
    return NextResponse.json({ error: "Gagal menyusun ulang jadwal." }, { status: 500 });
  }
}
