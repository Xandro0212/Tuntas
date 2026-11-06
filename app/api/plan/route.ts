import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLang } from "@/lib/lang-server";
import { generateLlmPlan, generateMockPlan, generateQuestions, type PlanInput } from "@/lib/ai";
import type { Category } from "@/lib/types";

const CATEGORIES = new Set<Category>(["kerajinan", "katering", "konveksi", "jasa", "lainnya"]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      mode?: "questions" | "plan";
      category?: string;
      title?: string;
      story?: string;
      clientName?: string;
      deadline?: string;
      team?: string[];
      workdays?: number[];
      value?: number;
      answers?: Record<string, string>;
    };

    const category = (body.category ?? "kerajinan") as Category;
    if (!CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Jenis pekerjaan tidak dikenal." }, { status: 400 });
    }
    const input: PlanInput = {
      category,
      title: (body.title ?? "").trim().slice(0, 160),
      story: (body.story ?? "").trim(),
      clientName: (body.clientName ?? "").trim().slice(0, 80),
      deadline: body.deadline ?? "",
      team: Array.isArray(body.team) ? body.team.slice(0, 12) : [],
      workdays: Array.isArray(body.workdays) ? body.workdays : [1, 2, 3, 4, 5, 6],
      value: Number(body.value) || undefined,
    };

    if (input.title.length < 2 || input.story.length < 10) {
      return NextResponse.json(
        { error: "Nama proyek dan cerita proyek perlu diisi lebih lengkap." },
        { status: 400 },
      );
    }

    if (body.mode !== "plan") {
      return NextResponse.json({
        questions: generateQuestions(input, await getLang()),
        engine: process.env.AI_API_KEY || process.env.OPENAI_API_KEY ? "llm" : "demo",
      });
    }

    const answers = body.answers ?? {};
    try {
      const llmPlan = await generateLlmPlan(input, answers);
      if (llmPlan) {
        return NextResponse.json({ plan: llmPlan, engine: "llm" });
      }
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `AI belum bisa menyusun rencana: ${error.message} Coba lagi sebentar.`
              : "AI belum bisa menyusun rencana. Coba lagi sebentar.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      plan: generateMockPlan(input, answers),
      engine: "demo",
    });
  } catch {
    return NextResponse.json({ error: "Permintaan tidak bisa diproses." }, { status: 400 });
  }
}
