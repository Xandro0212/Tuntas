import { describe, expect, it } from "vitest";
import { GLOBAL_WORKSPACE_ID, migrateDatabase } from "../lib/migrate";
import type { Database } from "../lib/types";

function oldDatabase(): Database {
  return {
    users: [
      {
        id: "u_owner",
        name: "Made Arta",
        businessName: "Made Art Studio",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    projects: [
      {
        id: "p1",
        userId: "u_owner",
        title: "Proyek",
        category: "kerajinan",
        clientName: "Klien",
        clientWa: "0812",
        deadline: "2026-12-01",
        bufferDays: 1,
        story: "Cerita",
        team: ["Made"],
        workdays: [1, 2, 3, 4, 5, 6],
        attachments: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    phases: [{ id: "ph1", projectId: "p1", name: "Persiapan", order: 1 }],
    tasks: [
      {
        id: "t1",
        projectId: "p1",
        phaseId: "ph1",
        title: "Tugas",
        type: "internal",
        startDate: "2026-11-01",
        dueDate: "2026-11-02",
        durationDays: 1,
        dependsOn: [],
        assignee: "Made",
        status: "todo",
        source: "ai",
        order: 1,
      },
    ],
    holidays: [
      { id: "h1", date: "2026-12-25", name: "Natal", source: "national" },
      { id: "h2", date: "2026-12-31", name: "Odalan", source: "user" },
    ],
  } as unknown as Database;
}

describe("migrateDatabase", () => {
  it("creates a workspace, owner role, and tenant ids without deleting data", () => {
    const result = migrateDatabase(oldDatabase());

    expect(result.changed).toBe(true);
    expect(result.db.workspaces).toHaveLength(1);
    expect(result.db.workspaces[0].ownerId).toBe("u_owner");
    expect(result.db.users[0].workspaceId).toBe(result.db.workspaces[0].id);
    expect(result.db.users[0].role).toBe("owner");
    expect(result.db.projects[0].workspaceId).toBe(result.db.workspaces[0].id);
    expect(result.db.holidays.find((item) => item.id === "h1")?.workspaceId).toBe(
      GLOBAL_WORKSPACE_ID,
    );
    expect(result.db.holidays.find((item) => item.id === "h2")?.workspaceId).toBe(
      result.db.workspaces[0].id,
    );
    expect(result.db.tasks[0].assigneeUserId).toBe("u_owner");
  });

  it("is idempotent", () => {
    const first = migrateDatabase(oldDatabase());
    const second = migrateDatabase(first.db);
    expect(second.changed).toBe(false);
  });
});
