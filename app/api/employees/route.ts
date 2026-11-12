import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionUser, toPublicUser } from "@/lib/auth";
import { createPasswordHash } from "@/lib/password";
import { getDb, mutateDb } from "@/lib/store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  const db = await getDb();
  const members = db.users
    .filter((item) => item.workspaceId === user.workspaceId)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map(toPublicUser);
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa menambah karyawan." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (name.length < 2) {
      return NextResponse.json({ error: "Nama karyawan minimal 2 karakter." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email belum benar." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password karyawan minimal 8 karakter." },
        { status: 400 },
      );
    }

    const db = await getDb();
    if (db.users.some((item) => item.email.toLowerCase() === email)) {
      return NextResponse.json({ error: "Email ini sudah terdaftar." }, { status: 409 });
    }
    const members = db.users.filter((item) => item.workspaceId === user.workspaceId);
    if (members.length >= 50) {
      return NextResponse.json({ error: "Batas anggota workspace tercapai." }, { status: 400 });
    }

    const { salt, hash } = createPasswordHash(password);
    const id = `u_${randomUUID()}`;
    const now = new Date().toISOString();
    const workspace = db.workspaces.find((item) => item.id === user.workspaceId);
    const employee = {
      id,
      workspaceId: user.workspaceId,
      role: "employee" as const,
      name,
      businessName: workspace?.name ?? user.businessName,
      email,
      salt,
      passwordHash: hash,
      createdAt: now,
    };

    await mutateDb((database) => {
      database.users.push(employee);
    });

    return NextResponse.json({ member: toPublicUser(employee) });
  } catch {
    return NextResponse.json({ error: "Gagal menambah karyawan." }, { status: 500 });
  }
}
