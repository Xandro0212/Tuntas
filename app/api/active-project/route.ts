import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { setActiveProjectCookie } from "@/lib/active";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) return NextResponse.json({ error: "Proyek tidak valid." }, { status: 400 });
    await setActiveProjectCookie(body.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan proyek aktif." }, { status: 500 });
  }
}
