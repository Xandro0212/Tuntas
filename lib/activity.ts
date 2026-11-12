import { randomUUID } from "node:crypto";
import type { ActivityAction, Database, PublicUser } from "./types";

export function recordActivity(
  db: Database,
  input: {
    workspaceId: string;
    user: Pick<PublicUser, "id" | "name">;
    action: ActivityAction;
    detail: string;
    entityId?: string;
  },
) {
  if (!Array.isArray(db.activities)) db.activities = [];
  db.activities.push({
    id: `act_${randomUUID()}`,
    workspaceId: input.workspaceId,
    userId: input.user.id,
    userName: input.user.name,
    action: input.action,
    detail: input.detail.slice(0, 180),
    entityId: input.entityId ?? "",
    createdAt: new Date().toISOString(),
  });

  const workspaceActivities = db.activities.filter(
    (activity) => activity.workspaceId === input.workspaceId,
  );
  if (workspaceActivities.length > 500) {
    const remove = new Set(
      workspaceActivities.slice(0, workspaceActivities.length - 500).map((item) => item.id),
    );
    db.activities = db.activities.filter((activity) => !remove.has(activity.id));
  }
}
