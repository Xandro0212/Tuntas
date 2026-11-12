import { describe, expect, it } from "vitest";
import {
  parseWhatsAppCommand,
  projectConfirmationMessage,
  statusMessage,
  taskUpdateMessage,
} from "../lib/whatsapp";
import type { Project, Task } from "../lib/types";

const project: Project = {
  id: "p1",
  userId: "u1",
  workspaceId: "w1",
  title: "Meja kayu",
  category: "kerajinan",
  clientName: "Bu Ayu",
  clientWa: "081234567890",
  deadline: "2026-12-20",
  bufferDays: 2,
  story: "Cerita",
  team: ["Made"],
  workdays: [1, 2, 3, 4, 5, 6],
  attachments: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const task: Task = {
  id: "t1",
  projectId: "p1",
  phaseId: "ph1",
  title: "Finishing",
  type: "internal",
  startDate: "2026-12-01",
  dueDate: "2026-12-02",
  durationDays: 1,
  dependsOn: [],
  assignee: "Made",
  status: "doing",
  source: "ai",
  order: 1,
};

describe("WhatsApp messages", () => {
  it("parses commands", () => {
    expect(parseWhatsAppCommand("STATUS")).toBe("status");
    expect(parseWhatsAppCommand("konfirmasi")).toBe("confirm");
    expect(parseWhatsAppCommand("bantu")).toBe("help");
    expect(parseWhatsAppCommand("halo")).toBe("unknown");
  });

  it("builds confirmation and status messages", () => {
    expect(projectConfirmationMessage(project, "Made Art Studio")).toContain(
      "Meja kayu",
    );
    expect(statusMessage(project, [{ ...task, status: "done" }], "Made Art Studio")).toContain(
      "1/1",
    );
  });

  it("builds task updates when done, waiting, or with a note", () => {
    expect(taskUpdateMessage(project, { ...task, status: "done" }, "Made Art Studio")).toContain(
      "sudah selesai",
    );
    expect(
      taskUpdateMessage(project, { ...task, status: "waiting" }, "Made Art Studio"),
    ).toContain("menunggu konfirmasi");
    expect(
      taskUpdateMessage(project, { ...task, status: "doing", progressNote: "Sedang dikeringkan" }, "Made Art Studio"),
    ).toContain("Sedang dikeringkan");
  });
});
