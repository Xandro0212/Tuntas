import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { GLOBAL_WORKSPACE_ID } from "@/lib/migrate";
import { getDb, storageBackend } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Workspace-scoped storage diagnostic. It returns no user content, only the
 * backend name and collection counts for the signed-in workspace.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const projects = db.projects.filter(
      (project) => project.workspaceId === user.workspaceId,
    );
    const projectIds = new Set(projects.map((project) => project.id));
    return NextResponse.json({
      ok: true,
      storage: storageBackend,
      workspace: user.workspaceId,
      counts: {
        members: db.users.filter((item) => item.workspaceId === user.workspaceId).length,
        projects: projects.length,
        phases: db.phases.filter((phase) => projectIds.has(phase.projectId)).length,
        tasks: db.tasks.filter((task) => projectIds.has(task.projectId)).length,
        holidays: db.holidays.filter(
          (holiday) =>
            holiday.workspaceId === user.workspaceId ||
            holiday.workspaceId === GLOBAL_WORKSPACE_ID,
        ).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        storage: storageBackend,
        error: error instanceof Error ? error.message : "Penyimpanan tidak bisa dibaca.",
      },
      { status: 500 },
    );
  }
}
