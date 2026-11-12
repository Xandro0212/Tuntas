import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { getDb, mutateDb } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
    const { id } = await params;
    const body = (await request.json()) as { name?: string };
    const name = (body.name ?? "").trim();
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Nama tahap minimal 2 karakter." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const project = db.projects.find(
      (item) => item.id === id && item.workspaceId === user.workspaceId,
    );
    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
    }
    const order =
      Math.max(
        0,
        ...db.phases
          .filter((phase) => phase.projectId === project.id)
          .map((phase) => phase.order),
      ) + 1;
    const phase = {
      id: `ph_${randomUUID()}`,
      projectId: project.id,
      name: name.slice(0, 80),
      order,
    };

    await mutateDb((database) => {
      database.phases.push(phase);
      const target = database.projects.find((item) => item.id === project.id);
      if (target) target.updatedAt = new Date().toISOString();
      recordActivity(database, {
        workspaceId: user.workspaceId,
        user,
        action: "phase.create",
        detail: phase.name,
        entityId: phase.id,
      });
    });

    return NextResponse.json({ phase });
  } catch {
    return NextResponse.json({ error: "Gagal menambah tahap." }, { status: 500 });
  }
}
