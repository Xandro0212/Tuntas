import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { getDb, mutateDb } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa menghapus karyawan." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const db = await getDb();
    const employee = db.users.find(
      (item) =>
        item.id === id &&
        item.workspaceId === user.workspaceId &&
        item.role === "employee",
    );
    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan." }, { status: 404 });
    }

    await mutateDb((database) => {
      database.users = database.users.filter((item) => item.id !== id);
      for (const task of database.tasks) {
        if (task.assigneeUserId === id) {
          task.assigneeUserId = null;
        }
      }
      recordActivity(database, {
        workspaceId: user.workspaceId,
        user,
        action: "employee.delete",
        detail: employee.name,
        entityId: employee.id,
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus karyawan." }, { status: 500 });
  }
}
