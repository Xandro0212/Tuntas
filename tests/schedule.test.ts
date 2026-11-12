import { describe, expect, it } from "vitest";
import { scheduleTasks } from "../lib/schedule";

describe("scheduleTasks", () => {
  it("counts backward from the deadline and skips holidays", () => {
    const result = scheduleTasks({
      deadline: "2026-12-07",
      workdays: [1, 2, 3, 4, 5, 6],
      holidays: ["2026-11-25"],
      tasks: [
        { id: "t1", durationDays: 2, dependsOn: [], order: 1 },
        { id: "t2", durationDays: 1, dependsOn: ["t1"], order: 2 },
      ],
    });

    expect(result.projectFinish <= "2026-12-07").toBe(true);
    expect(result.bufferDays).toBeGreaterThanOrEqual(1);
    expect(result.dates.t1).toBeDefined();
    expect(result.dates.t2).toBeDefined();
    expect(result.dates.t1.dueDate).not.toBe("2026-11-25");
    expect(result.dates.t1.startDate).not.toBe("2026-11-25");
    expect(result.dates.t2.startDate).not.toBe("2026-11-25");
  });

  it("never schedules work on Sunday", () => {
    const result = scheduleTasks({
      deadline: "2026-12-07",
      workdays: [1, 2, 3, 4, 5, 6],
      holidays: [],
      tasks: [{ id: "t1", durationDays: 6, dependsOn: [], order: 1 }],
    });

    const { startDate, dueDate } = result.dates.t1;
    expect(new Date(`${startDate}T00:00:00Z`).getUTCDay()).not.toBe(0);
    expect(new Date(`${dueDate}T00:00:00Z`).getUTCDay()).not.toBe(0);
  });
});
