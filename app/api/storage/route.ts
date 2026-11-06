import { NextResponse } from "next/server";
import { getDb, storageBackend } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Lightweight storage diagnostic. It returns no user data, only the backend
 * name and collection counts, so it is safe to open after configuring env vars
 * on Vercel.
 */
export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json({
      ok: true,
      storage: storageBackend,
      counts: {
        users: db.users.length,
        projects: db.projects.length,
        phases: db.phases.length,
        tasks: db.tasks.length,
        holidays: db.holidays.length,
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
