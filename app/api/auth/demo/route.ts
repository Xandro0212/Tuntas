import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import { setSessionCookie } from "@/lib/auth";
import { createPasswordHash } from "@/lib/password";
import { createSeedDatabase } from "@/lib/seed";
import { mutateDb } from "@/lib/store";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const DEMO_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const limit = rateLimit(rateLimitKey(request, "demo"), 30, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
  try {
    const seed = createSeedDatabase();
    const now = new Date().toISOString();
    const userId = `u_demo_${randomUUID()}`;
    const workspaceId = `w_demo_${randomUUID()}`;
    const { salt, hash } = createPasswordHash(randomBytes(24).toString("hex"));

    const projectIds = new Map<string, string>();
    const phaseIds = new Map<string, string>();
    const taskIds = new Map<string, string>();

    for (const project of seed.projects) {
      projectIds.set(project.id, `p_${randomUUID()}`);
    }
    for (const phase of seed.phases) {
      phaseIds.set(phase.id, `ph_${randomUUID()}`);
    }
    for (const task of seed.tasks) {
      taskIds.set(task.id, `t_${randomUUID()}`);
    }

    const projects = seed.projects.map((project) => ({
      ...project,
      id: projectIds.get(project.id)!,
      userId,
      workspaceId,
      attachments: [],
      updatedAt: now,
    }));
    const phases = seed.phases.map((phase) => ({
      ...phase,
      id: phaseIds.get(phase.id)!,
      projectId: projectIds.get(phase.projectId)!,
    }));
    const tasks = seed.tasks.map((task) => ({
      ...task,
      id: taskIds.get(task.id)!,
      projectId: projectIds.get(task.projectId)!,
      phaseId: phaseIds.get(task.phaseId)!,
      dependsOn: task.dependsOn
        .map((id) => taskIds.get(id))
        .filter((id): id is string => Boolean(id)),
      assigneeUserId:
        task.assignee.trim().toLowerCase() === "made" ? userId : null,
    }));
    const userHolidays = seed.holidays
      .filter((holiday) => holiday.source === "user")
      .map((holiday) => ({
        ...holiday,
        id: `h_${randomUUID()}`,
        workspaceId,
      }));

    await mutateDb((db) => {
      if (!Array.isArray(db.workspaces)) db.workspaces = [];
      const cutoff = Date.now() - DEMO_TTL_MS;
      const staleUsers = db.users.filter(
        (user) =>
          user.isDemo && new Date(user.createdAt).getTime() < cutoff,
      );
      if (staleUsers.length) {
        const staleUserIds = new Set(staleUsers.map((user) => user.id));
        const staleWorkspaceIds = new Set(
          staleUsers.map((user) => user.workspaceId),
        );
        const staleProjectIds = new Set(
          db.projects
            .filter((project) => staleWorkspaceIds.has(project.workspaceId))
            .map((project) => project.id),
        );
        db.users = db.users.filter((user) => !staleUserIds.has(user.id));
        db.workspaces = db.workspaces.filter(
          (workspace) => !staleWorkspaceIds.has(workspace.id),
        );
        db.projects = db.projects.filter(
          (project) => !staleProjectIds.has(project.id),
        );
        db.phases = db.phases.filter(
          (phase) => !staleProjectIds.has(phase.projectId),
        );
        db.tasks = db.tasks.filter(
          (task) => !staleProjectIds.has(task.projectId),
        );
        db.holidays = db.holidays.filter(
          (holiday) => !staleWorkspaceIds.has(holiday.workspaceId),
        );
      }

      db.workspaces.push({
        id: workspaceId,
        name: "Made Art Studio (Demo)",
        ownerId: userId,
        createdAt: now,
      });
      db.users.push({
        id: userId,
        workspaceId,
        role: "owner",
        name: "Made Arta",
        businessName: "Made Art Studio",
        email: `demo-${userId.slice(-8)}@tuntas.local`,
        salt,
        passwordHash: hash,
        createdAt: now,
        isDemo: true,
      });
      db.projects.push(...projects);
      db.phases.push(...phases);
      db.tasks.push(...tasks);
      db.holidays.push(...userHolidays);
    });

    await setSessionCookie(userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyiapkan akun demo." },
      { status: 500 },
    );
  }
}
