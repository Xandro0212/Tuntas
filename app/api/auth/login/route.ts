import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/store";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }
    const limit = rateLimit(`login:${getClientIp(request)}:${email}`, 10, 5 * 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }
    const db = await getDb();
    const user = db.users.find((item) => item.email.toLowerCase() === email);
    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    }
    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal masuk. Coba lagi." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
