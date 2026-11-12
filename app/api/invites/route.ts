import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/auth";
import { getWorkspaceInvites } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";
import { getDb, mutateDb } from "@/lib/store";

const INVITE_DAYS = 7;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa melihat undangan." },
      { status: 403 },
    );
  }
  return NextResponse.json({
    invites: await getWorkspaceInvites(user.workspaceId),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa mengundang karyawan." },
      { status: 403 },
    );
  }
  const limit = rateLimit(`invite:${user.id}`, 30, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak undangan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const body = (await request.json()) as { name?: string; email?: string };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    if (name.length < 2) {
      return NextResponse.json({ error: "Nama karyawan minimal 2 karakter." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email belum benar." }, { status: 400 });
    }

    const db = await getDb();
    if (db.users.some((item) => item.email.toLowerCase() === email)) {
      return NextResponse.json({ error: "Email ini sudah terdaftar." }, { status: 409 });
    }
    const now = new Date().toISOString();
    const duplicate = db.invites.find(
      (invite) =>
        invite.workspaceId === user.workspaceId &&
        invite.email.toLowerCase() === email &&
        !invite.usedAt &&
        invite.expiresAt > now,
    );
    if (duplicate) {
      return NextResponse.json({
        invite: duplicate,
        path: `/join/${duplicate.token}`,
        existing: true,
      });
    }

    const invite = {
      id: `inv_${randomUUID()}`,
      token: randomBytes(24).toString("base64url"),
      workspaceId: user.workspaceId,
      email,
      name,
      createdBy: user.id,
      createdAt: now,
      expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000).toISOString(),
      usedAt: null,
    };

    await mutateDb((database) => {
      if (!Array.isArray(database.invites)) database.invites = [];
      database.invites.push(invite);
    });

    return NextResponse.json({
      invite,
      path: `/join/${invite.token}`,
    });
  } catch {
    return NextResponse.json({ error: "Gagal membuat undangan." }, { status: 500 });
  }
}
