import type { Database, User, Workspace } from "./types";

/**
 * National and Bali holidays are shared by every workspace. User-created
 * holidays are scoped to one workspace.
 */
export const GLOBAL_WORKSPACE_ID = "*";

function workspaceForUser(user: User): Workspace {
  return {
    id: `w_${user.id}`,
    name: user.businessName || "Ruang kerja",
    ownerId: user.id,
    createdAt: user.createdAt,
  };
}

/**
 * Upgrades old single-user snapshots into the workspace/role model without
 * deleting any projects, phases, tasks, or holidays.
 */
export function migrateDatabase(input: Database): { db: Database; changed: boolean } {
  const db = structuredClone(input);
  let changed = false;

  if (!Array.isArray(db.workspaces)) {
    db.workspaces = [];
    changed = true;
  }
  if (!Array.isArray(db.invites)) {
    db.invites = [];
    changed = true;
  }
  if (!Array.isArray(db.activities)) {
    db.activities = [];
    changed = true;
  }

  for (const user of db.users) {
    if (!user.workspaceId) {
      const workspace = workspaceForUser(user);
      if (!db.workspaces.some((item) => item.id === workspace.id)) {
        db.workspaces.push(workspace);
      }
      user.workspaceId = workspace.id;
      changed = true;
    }
    if (!user.role) {
      user.role = "owner";
      changed = true;
    }
  }

  const demoWorkspaceId =
    db.users.find((user) => user.email.toLowerCase() === "demo@tuntas.id")?.workspaceId ??
    db.users[0]?.workspaceId ??
    GLOBAL_WORKSPACE_ID;

  for (const project of db.projects) {
    if (!project.workspaceId) {
      const owner = db.users.find((user) => user.id === project.userId);
      project.workspaceId = owner?.workspaceId ?? demoWorkspaceId;
      changed = true;
    }
  }

  for (const holiday of db.holidays) {
    if (!holiday.workspaceId) {
      holiday.workspaceId = holiday.source === "user" ? demoWorkspaceId : GLOBAL_WORKSPACE_ID;
      changed = true;
    }
  }

  const usersByWorkspace = new Map<string, User[]>();
  for (const user of db.users) {
    const list = usersByWorkspace.get(user.workspaceId) ?? [];
    list.push(user);
    usersByWorkspace.set(user.workspaceId, list);
  }

  for (const task of db.tasks) {
    if (task.assigneeUserId !== undefined && task.assigneeUserId !== null) continue;
    const project = db.projects.find((item) => item.id === task.projectId);
    const members = project ? (usersByWorkspace.get(project.workspaceId) ?? []) : [];
    const assigneeName = task.assignee.trim().toLowerCase();
    const match =
      members.find((user) => user.name.trim().toLowerCase() === assigneeName) ??
      members.find(
        (user) => user.name.trim().toLowerCase().split(/\s+/)[0] === assigneeName,
      );
    if (match) {
      task.assigneeUserId = match.id;
      changed = true;
    } else if (task.assigneeUserId === undefined) {
      task.assigneeUserId = null;
      changed = true;
    }
  }

  return { db, changed };
}
