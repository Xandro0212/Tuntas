import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { setSessionCookie } from "@/lib/auth";
import { getDb, mutateDb } from "@/lib/store";
import { createPasswordHash } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      businessName?: string;
      email?: string;
      password?: string;
    };
    const name = (body.name ?? "").trim();
    const businessName = (body.businessName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (name.length < 2) return NextResponse.json({ error: "Nama minimal 2 karakter." }, { status: 400 });
    if (businessName.length < 2)
      return NextResponse.json({ error: "Nama usaha minimal 2 karakter." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Format email belum benar." }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    const db = await getDb();
    if (db.users.some((user) => user.email.toLowerCase() === email)) {
      return NextResponse.json({ error: "Email ini sudah terdaftar." }, { status: 409 });
    }

    const { salt, hash } = createPasswordHash(password);
    const id = `u_${randomUUID()}`;
    await mutateDb((db) => {
      db.users.push({
        id,
        name,
        businessName,
        email,
        salt,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
      });
    });

    await setSessionCookie(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal membuat akun. Coba lagi." }, { status: 500 });
  }
}
