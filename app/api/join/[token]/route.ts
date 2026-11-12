import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { setSessionCookie } from "@/lib/auth";
import { createPasswordHash } from "@/lib/password";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getDb, mutateDb } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const limit = rateLimit(rateLimitKey(request, "join"), 30, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const { token } = await params;
    const body = (await request.json()) as { name?: string; password?: string };
    const password = body.password ?? "";
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const invite = db.invites.find((item) => item.token === token);
    if (!invite) {
      return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    }
    if (invite.usedAt) {
      return NextResponse.json({ error: "Undangan sudah dipakai." }, { status: 410 });
    }
    if (invite.expiresAt <= new Date().toISOString()) {
      return NextResponse.json({ error: "Undangan sudah kedaluwarsa." }, { status: 410 });
    }
    if (db.users.some((user) => user.email.toLowerCase() === invite.email.toLowerCase())) {
      return NextResponse.json({ error: "Email ini sudah terdaftar." }, { status: 409 });
    }

    const name = (body.name ?? invite.name).trim().slice(0, 80);
    if (name.length < 2) {
      return NextResponse.json({ error: "Nama minimal 2 karakter." }, { status: 400 });
    }
    const workspace = db.workspaces.find((item) => item.id === invite.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace tidak ditemukan." }, { status: 404 });
    }

    const { salt, hash } = createPasswordHash(password);
    const id = `u_${randomUUID()}`;
    const now = new Date().toISOString();

    await mutateDb((database) => {
      const current = database.invites.find((item) => item.token === token);
      if (!current || current.usedAt) throw new Error("Undangan sudah dipakai.");
      database.users.push({
        id,
        workspaceId: current.workspaceId,
        role: "employee",
        name,
        businessName: workspace.name,
        email: current.email,
        salt,
        passwordHash: hash,
        createdAt: now,
      });
      current.usedAt = now;
    });

    await setSessionCookie(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Undangan sudah dipakai.") {
      return NextResponse.json({ error: "Undangan sudah dipakai." }, { status: 410 });
    }
    return NextResponse.json({ error: "Gagal menerima undangan." }, { status: 500 });
  }
}
