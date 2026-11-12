import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { getDb, mutateDb } from "@/lib/store";

async function loadContext(id: string, phaseId: string, workspaceId: string) {
  const db = await getDb();
  const project = db.projects.find(
    (item) => item.id === id && item.workspaceId === workspaceId,
  );
  if (!project) return null;
  const phase = db.phases.find(
    (item) => item.id === phaseId && item.projectId === project.id,
  );
  if (!phase) return null;
  return { db, project, phase };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa mengatur tahap." },
      { status: 403 },
    );
  }

  try {
    const { id, phaseId } = await params;
    const context = await loadContext(id, phaseId, user.workspaceId);
    if (!context) {
      return NextResponse.json({ error: "Tahap tidak ditemukan." }, { status: 404 });
    }
    const body = (await request.json()) as {
      name?: string;
      direction?: "up" | "down";
    };

    if (body.direction === "up" || body.direction === "down") {
      const ordered = context.db.phases
        .filter((phase) => phase.projectId === id)
        .sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((phase) => phase.id === phaseId);
      const targetIndex = body.direction === "up" ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= ordered.length) {
        return NextResponse.json({ ok: true });
      }

      await mutateDb((database) => {
        const first = database.phases.find((item) => item.id === ordered[index].id);
        const second = database.phases.find((item) => item.id === ordered[targetIndex].id);
        if (first && second) {
          const order = first.order;
          first.order = second.order;
          second.order = order;
        }
        const project = database.projects.find((item) => item.id === id);
        if (project) project.updatedAt = new Date().toISOString();
        recordActivity(database, {
          workspaceId: user.workspaceId,
          user,
          action: "phase.update",
          detail: ordered[index].name,
          entityId: phaseId,
        });
      });
      return NextResponse.json({ ok: true });
    }

    const name = (body.name ?? "").trim();
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Nama tahap minimal 2 karakter." },
        { status: 400 },
      );
    }

    await mutateDb((database) => {
      const target = database.phases.find((item) => item.id === phaseId);
      if (target) target.name = name.slice(0, 80);
      const project = database.projects.find((item) => item.id === id);
      if (project) project.updatedAt = new Date().toISOString();
      recordActivity(database, {
        workspaceId: user.workspaceId,
        user,
        action: "phase.update",
        detail: name,
        entityId: phaseId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal mengubah tahap." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa mengatur tahap." },
      { status: 403 },
    );
  }

  try {
    const { id, phaseId } = await params;
    const context = await loadContext(id, phaseId, user.workspaceId);
    if (!context) {
      return NextResponse.json({ error: "Tahap tidak ditemukan." }, { status: 404 });
    }
    const phases = context.db.phases.filter((phase) => phase.projectId === id);
    if (phases.length <= 1) {
      return NextResponse.json(
        { error: "Proyek harus punya minimal satu tahap." },
        { status: 400 },
      );
    }
    const tasks = context.db.tasks.filter((task) => task.phaseId === phaseId);
    if (tasks.length) {
      return NextResponse.json(
        {
          error:
            "Tahap ini masih punya tugas. Pindahkan tugas ke tahap lain terlebih dahulu.",
        },
        { status: 400 },
      );
    }

    await mutateDb((database) => {
      database.phases = database.phases.filter((phase) => phase.id !== phaseId);
      const ordered = database.phases
        .filter((phase) => phase.projectId === id)
        .sort((a, b) => a.order - b.order);
      ordered.forEach((phase, index) => {
        phase.order = index + 1;
      });
      const project = database.projects.find((item) => item.id === id);
      if (project) project.updatedAt = new Date().toISOString();
      recordActivity(database, {
        workspaceId: user.workspaceId,
        user,
        action: "phase.delete",
        detail: context.phase.name,
        entityId: phaseId,
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus tahap." }, { status: 500 });
  }
}
