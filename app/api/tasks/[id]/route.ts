import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, mutateDb } from "@/lib/store";
import { getHolidays, localizeTask } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { todayISO } from "@/lib/dates";
import { isWorkday } from "@/lib/schedule";
import type { TaskStatus, TaskType } from "@/lib/types";

const STATUSES = new Set<TaskStatus>(["todo", "doing", "waiting", "done"]);
const TYPES = new Set<TaskType>(["internal", "waiting_client", "vendor", "payment", "delivery"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  const lang = await getLang();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  try {
    const { id } = await params;
    const db = await getDb();
    const task = db.tasks.find((item) => item.id === id);
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    const project = db.projects.find(
      (item) => item.id === task.projectId && item.workspaceId === user.workspaceId,
    );
    if (!project) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });

    const isOwner = user.role === "owner";
    if (!isOwner && task.assigneeUserId !== user.id) {
      return NextResponse.json(
        { error: "Karyawan hanya bisa mengubah tugas yang ditugaskan kepadanya." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      status?: TaskStatus;
      title?: string;
      type?: TaskType;
      assignee?: string;
      assigneeUserId?: string | null;
      phaseId?: string;
      startDate?: string;
      dueDate?: string;
      durationDays?: number;
      progressNote?: string;
    };

    if (!isOwner) {
      const forbidden = [
        "title",
        "type",
        "assignee",
        "assigneeUserId",
        "phaseId",
        "startDate",
        "dueDate",
        "durationDays",
      ].some((key) => (body as Record<string, unknown>)[key] !== undefined);
      if (forbidden) {
        return NextResponse.json(
          {
            error:
              "Karyawan hanya bisa mengubah status dan deskripsi progres tugasnya.",
          },
          { status: 403 },
        );
      }
    }

    const updates: Partial<typeof task> = {};

    if (body.status !== undefined) {
      if (!STATUSES.has(body.status)) {
        return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
      }
      updates.status = body.status;
      updates.completedAt =
        body.status === "done" ? task.completedAt || todayISO() : null;
    }
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (title.length < 2) return NextResponse.json({ error: "Judul tugas terlalu pendek." }, { status: 400 });
      updates.title = title.slice(0, 160);
    }
    if (body.type !== undefined) {
      if (!TYPES.has(body.type)) return NextResponse.json({ error: "Tipe tugas tidak valid." }, { status: 400 });
      updates.type = body.type;
    }
    if (body.assignee !== undefined) {
      updates.assignee = body.assignee.trim().slice(0, 60) || "Saya";
    }
    if (body.assigneeUserId !== undefined) {
      if (body.assigneeUserId === null) {
        updates.assigneeUserId = null;
      } else {
        const member = db.users.find(
          (item) =>
            item.id === body.assigneeUserId &&
            item.workspaceId === project.workspaceId,
        );
        if (!member) {
          return NextResponse.json(
            { error: "Anggota tim tidak ditemukan." },
            { status: 400 },
          );
        }
        updates.assigneeUserId = member.id;
        updates.assignee = member.name;
      }
    }
    if (body.phaseId !== undefined) {
      const phase = db.phases.find(
        (item) => item.id === body.phaseId && item.projectId === project.id,
      );
      if (!phase) return NextResponse.json({ error: "Tahap tidak ditemukan." }, { status: 400 });
      updates.phaseId = phase.id;
    }
    if (body.durationDays !== undefined) {
      updates.durationDays = Math.min(60, Math.max(1, Math.round(Number(body.durationDays) || 1)));
    }
    if (body.progressNote !== undefined) {
      updates.progressNote = body.progressNote.trim().slice(0, 500) || undefined;
    }

    if (body.startDate !== undefined || body.dueDate !== undefined) {
      const startDate = body.startDate ?? task.startDate;
      const dueDate = body.dueDate ?? task.dueDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
      }
      if (startDate > dueDate) {
        return NextResponse.json({ error: "Tanggal mulai harus sebelum tanggal selesai." }, { status: 400 });
      }
      const holidayDates = (await getHolidays(project.workspaceId)).map((holiday) => holiday.date);
      if (
        !isWorkday(startDate, project.workdays, new Set(holidayDates)) ||
        !isWorkday(dueDate, project.workdays, new Set(holidayDates))
      ) {
        return NextResponse.json(
          { error: "Tanggal tidak boleh jatuh di hari Minggu atau hari libur." },
          { status: 400 },
        );
      }
      updates.startDate = startDate;
      updates.dueDate = dueDate;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
    }

    await mutateDb((database) => {
      const target = database.tasks.find((item) => item.id === id);
      if (target) Object.assign(target, updates);
      const owner = database.projects.find((item) => item.id === project.id);
      if (owner) owner.updatedAt = new Date().toISOString();
    });

    return NextResponse.json({
      ok: true,
      task: localizeTask(lang, { ...task, ...updates }),
    });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui tugas." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa menghapus tugas." },
      { status: 403 },
    );
  }
  try {
    const { id } = await params;
    const db = await getDb();
    const task = db.tasks.find((item) => item.id === id);
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    const project = db.projects.find(
      (item) => item.id === task.projectId && item.workspaceId === user.workspaceId,
    );
    if (!project) return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });

    await mutateDb((database) => {
      database.tasks = database.tasks.filter((item) => item.id !== id);
      for (const other of database.tasks) {
        if (other.dependsOn.includes(id)) {
          other.dependsOn = other.dependsOn.filter((dep) => dep !== id);
        }
      }
      const owner = database.projects.find((item) => item.id === project.id);
      if (owner) owner.updatedAt = new Date().toISOString();
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus tugas." }, { status: 500 });
  }
}
