import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { extensionForMime, saveUpload } from "@/lib/uploads";
import { rateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (user.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya Owner yang bisa mengunggah lampiran." },
      { status: 403 },
    );
  }
  const limit = rateLimit(`upload:${user.id}`, 30, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak unggahan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5 MB." }, { status: 400 });
    }
    if (!extensionForMime(file.type)) {
      return NextResponse.json(
        { error: "Format file harus JPG, PNG, WEBP, GIF, atau PDF." },
        { status: 400 },
      );
    }
    const attachment = await saveUpload(file, user.workspaceId);
    return NextResponse.json(attachment);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal mengunggah file.",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
