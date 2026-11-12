import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mutateDb } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa menghapus undangan." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    await mutateDb((database) => {
      database.invites = database.invites.filter(
        (invite) => !(invite.id === id && invite.workspaceId === user.workspaceId),
      );
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus undangan." }, { status: 500 });
  }
}
