import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Attachment } from "./types";

const BUCKET = "tuntas-uploads";

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
)
  .replace(/\/+$/, "")
  .replace(/\/rest\/v1$/, "");
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

const globalForUploads = globalThis as unknown as {
  __tuntasBucket?: Promise<void>;
};

export function extensionForMime(mime: string): string | null {
  return EXTENSION_BY_MIME[mime] ?? null;
}

function supabaseStorageUrl(pathname: string): string {
  return `${SUPABASE_URL}/storage/v1/${pathname}`;
}

async function ensureBucket(): Promise<void> {
  if (!globalForUploads.__tuntasBucket) {
    globalForUploads.__tuntasBucket = (async () => {
      const response = await fetch(supabaseStorageUrl(`bucket/${BUCKET}`), {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (response.ok) return;

      const create = await fetch(supabaseStorageUrl("bucket"), {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
      });
      if (!create.ok && create.status !== 409) {
        throw new Error(`Gagal menyiapkan bucket upload (${create.status}).`);
      }
    })().catch((error) => {
      globalForUploads.__tuntasBucket = undefined;
      throw error;
    });
  }
  return globalForUploads.__tuntasBucket;
}

async function saveToSupabase(
  file: File,
  workspaceId: string,
  extension: string,
): Promise<Attachment> {
  await ensureBucket();
  const objectPath = `${workspaceId}/${randomUUID()}.${extension}`;
  const response = await fetch(
    supabaseStorageUrl(`object/${BUCKET}/${objectPath}`),
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: Buffer.from(await file.arrayBuffer()),
    },
  );
  if (!response.ok) {
    throw new Error(`Gagal mengunggah file ke Supabase (${response.status}).`);
  }
  return {
    name: file.name.slice(0, 120),
    url: supabaseStorageUrl(`object/public/${BUCKET}/${objectPath}`),
    size: file.size,
  };
}

async function saveToLocal(
  file: File,
  extension: string,
): Promise<Attachment> {
  const filename = `${randomUUID()}.${extension}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return {
    name: file.name.slice(0, 120),
    url: `/uploads/${filename}`,
    size: file.size,
  };
}

export async function saveUpload(
  file: File,
  workspaceId: string,
): Promise<Attachment> {
  const extension = extensionForMime(file.type);
  if (!extension) {
    throw new Error("Format file harus JPG, PNG, WEBP, GIF, atau PDF.");
  }
  if (SUPABASE_URL && SUPABASE_KEY) {
    return saveToSupabase(file, workspaceId, extension);
  }
  return saveToLocal(file, extension);
}

export async function deleteUpload(url: string): Promise<void> {
  if (!url) return;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex !== -1 && SUPABASE_URL && SUPABASE_KEY) {
    const objectPath = url.slice(markerIndex + marker.length);
    const response = await fetch(
      supabaseStorageUrl(`object/${BUCKET}/${objectPath}`),
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`Gagal menghapus file Supabase (${response.status}).`);
    }
    return;
  }

  if (url.startsWith("/uploads/")) {
    const filename = path.basename(url);
    if (!filename) return;
    await fs.unlink(path.join(process.cwd(), "public", "uploads", filename));
  }
}
