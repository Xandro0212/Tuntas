import { describe, expect, it } from "vitest";
import { generateMockPlan, generateQuestions } from "../lib/ai";
import { createSeedDatabase } from "../lib/seed";

const input = {
  category: "kerajinan" as const,
  title: "Meja kayu",
  story: "Membuat meja kayu untuk klien dengan deadline akhir bulan.",
  clientName: "Klien",
  deadline: "2026-12-20",
  team: ["Made"],
  workdays: [1, 2, 3, 4, 5, 6],
};

describe("planner and seed", () => {
  it("generates deterministic questions and a plan without an API key", () => {
    const questions = generateQuestions(input);
    expect(questions).toHaveLength(3);
    expect(questions.map((question) => question.id)).toEqual([
      "install",
      "approval",
      "material",
    ]);

    const plan = generateMockPlan(input, {}, "id");
    expect(plan.phases.length).toBeGreaterThan(0);
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.tasks.every((task) => task.duration_days >= 1)).toBe(true);
  });

  it("seed data is already workspace-aware", () => {
    const seed = createSeedDatabase();
    expect(seed.workspaces).toHaveLength(1);
    expect(seed.users[0].role).toBe("owner");
    expect(seed.users[0].workspaceId).toBe(seed.workspaces[0].id);
    expect(seed.projects.every((project) => project.workspaceId === seed.users[0].workspaceId)).toBe(true);
    expect(seed.projects).toHaveLength(5);
    expect(seed.tasks).toHaveLength(65);
  });
});
