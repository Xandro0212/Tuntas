import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { getDb, mutateDb } from "@/lib/store";
import { getLang } from "@/lib/lang-server";
import { translate } from "@/lib/i18n";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  const lang = await getLang();
  if (!user) {
    return NextResponse.json(
      { error: translate(lang, "Silakan masuk terlebih dahulu.") },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const db = await getDb();
    const project = db.projects.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!project) {
      return NextResponse.json(
        { error: translate(lang, "Proyek tidak ditemukan.") },
        { status: 404 },
      );
    }

    await mutateDb((db) => {
      db.projects = db.projects.filter((item) => item.id !== id);
      db.phases = db.phases.filter((item) => item.projectId !== id);
      db.tasks = db.tasks.filter((item) => item.projectId !== id);
    });

    for (const attachment of project.attachments ?? []) {
      if (!attachment.url?.startsWith("/uploads/")) continue;
      const filename = path.basename(attachment.url);
      if (!filename) continue;
      try {
        await fs.promises.unlink(path.join(process.cwd(), "public", "uploads", filename));
      } catch {
        // The database entry is already gone; a missing file should not fail the delete.
      }
    }

    const store = await cookies();
    if (store.get("tuntas_project")?.value === id) {
      store.delete("tuntas_project");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: translate(lang, "Gagal menghapus proyek.") },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
