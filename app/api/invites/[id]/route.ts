import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
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
      const invite = database.invites.find(
        (item) => item.id === id && item.workspaceId === user.workspaceId,
      );
      database.invites = database.invites.filter(
        (item) => !(item.id === id && item.workspaceId === user.workspaceId),
      );
      if (invite) {
        recordActivity(database, {
          workspaceId: user.workspaceId,
          user,
          action: "invite.delete",
          detail: `${invite.name} · ${invite.email}`,
          entityId: invite.id,
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus undangan." }, { status: 500 });
  }
}
