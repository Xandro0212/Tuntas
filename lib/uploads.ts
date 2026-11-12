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
      if (response.ok) {
        // Existing projects may have created a public bucket earlier. Force it
        // private so files can only be read through short-lived signed URLs.
        const update = await fetch(supabaseStorageUrl(`bucket/${BUCKET}`), {
          method: "PUT",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
        });
        if (update.ok) return;
      }

      const create = await fetch(supabaseStorageUrl("bucket"), {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
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
  const url = `supabase://${BUCKET}/${objectPath}`;
  const previewUrl = await signAttachmentUrl(url);
  return {
    name: file.name.slice(0, 120),
    url,
    previewUrl,
    size: file.size,
  };
}

export async function signAttachmentUrl(url: string): Promise<string> {
  if (!url.startsWith("supabase://")) return url;
  if (!SUPABASE_URL || !SUPABASE_KEY) return url;

  const rest = url.slice("supabase://".length);
  const separator = rest.indexOf("/");
  if (separator === -1) return url;
  const bucket = rest.slice(0, separator);
  const objectPath = rest.slice(separator + 1);
  const response = await fetch(
    supabaseStorageUrl(`object/sign/${bucket}/${objectPath}`),
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 60 * 60 }),
    },
  );
  if (!response.ok) {
    throw new Error(`Gagal membuat signed URL (${response.status}).`);
  }
  const payload = (await response.json()) as { signedURL?: string };
  return payload.signedURL
    ? `${SUPABASE_URL}/storage/v1${payload.signedURL}`
    : url;
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
    previewUrl: `/uploads/${filename}`,
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

  if (url.startsWith("supabase://") && SUPABASE_URL && SUPABASE_KEY) {
    const rest = url.slice("supabase://".length);
    const separator = rest.indexOf("/");
    if (separator === -1) return;
    const bucket = rest.slice(0, separator);
    const objectPath = rest.slice(separator + 1);
    const response = await fetch(
      supabaseStorageUrl(`object/${bucket}/${objectPath}`),
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
