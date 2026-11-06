import fs from "node:fs/promises";
import path from "node:path";
import { createSeedDatabase } from "./seed";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const STATE_ID = "main";
const STATE_TABLE = (process.env.SUPABASE_STATE_TABLE || "tuntas_state").replace(
  /[^a-zA-Z0-9_]/g,
  "",
);

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

export const storageBackend: "supabase" | "file" =
  SUPABASE_URL && SUPABASE_KEY ? "supabase" : "file";

type StoredDatabase = {
  db: Database;
  version: number;
};

const globalForDb = globalThis as unknown as {
  __tuntasQueue?: Promise<unknown>;
  __tuntasCache?: StoredDatabase & { backend: "supabase" | "file"; at: number };
  __tuntasSeeding?: Promise<StoredDatabase> | null;
};

const CACHE_TTL_MS = 350;

function cloneDatabase(db: Database): Database {
  return structuredClone(db);
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const db = value as Partial<Database>;
  return (
    Array.isArray(db.users) &&
    Array.isArray(db.projects) &&
    Array.isArray(db.phases) &&
    Array.isArray(db.tasks) &&
    Array.isArray(db.holidays)
  );
}

function cacheStored(backend: "supabase" | "file", stored: StoredDatabase): StoredDatabase {
  globalForDb.__tuntasCache = {
    ...stored,
    db: cloneDatabase(stored.db),
    backend,
    at: Date.now(),
  };
  return stored;
}

function cachedStored(backend: "supabase" | "file"): StoredDatabase | null {
  const cached = globalForDb.__tuntasCache;
  if (!cached || cached.backend !== backend) return null;
  if (Date.now() - cached.at > CACHE_TTL_MS) return null;
  return { db: cloneDatabase(cached.db), version: cached.version };
}

// ---------------------------------------------------------------------------
// Supabase state storage
//
// The app keeps its small relational snapshot as one JSONB document so the
// existing domain code can stay unchanged. Writes use an optimistic version
// check, which means two devices cannot silently overwrite each other.
// ---------------------------------------------------------------------------

async function supabaseRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function supabaseError(response: Response, action: string): Promise<Error> {
  const body = await response.text().catch(() => "");
  if (
    response.status === 404 ||
    body.includes("does not exist") ||
    body.includes("PGRST205")
  ) {
    return new Error(
      `Tabel Supabase "${STATE_TABLE}" belum ada. Jalankan file supabase/schema.sql di SQL Editor Supabase.`,
    );
  }
  return new Error(
    `Supabase gagal ${action} (${response.status}): ${body.slice(0, 300) || "tanpa pesan"}`,
  );
}

async function readSupabase(): Promise<StoredDatabase | null> {
  const response = await supabaseRequest(
    `${STATE_TABLE}?id=eq.${encodeURIComponent(STATE_ID)}&select=data,version`,
  );
  if (!response.ok) throw await supabaseError(response, "membaca data");
  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const row = rows[0] as { data?: unknown; version?: unknown };
  if (!isDatabase(row.data)) {
    throw new Error("Data Supabase tidak memiliki struktur Tuntas yang valid.");
  }
  return {
    db: row.data,
    version: Number(row.version) || 1,
  };
}

async function insertSupabase(db: Database): Promise<void> {
  const response = await supabaseRequest(STATE_TABLE, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: STATE_ID,
      data: db,
      version: 1,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok && response.status !== 409) {
    throw await supabaseError(response, "membuat data awal");
  }
}

async function loadSupabase(force = false): Promise<StoredDatabase> {
  if (!force) {
    const cached = cachedStored("supabase");
    if (cached) return cached;
  }

  let stored = await readSupabase();
  if (!stored) {
    if (!globalForDb.__tuntasSeeding) {
      globalForDb.__tuntasSeeding = (async () => {
        await insertSupabase(createSeedDatabase());
        const created = await readSupabase();
        if (!created) {
          throw new Error(
            "Supabase belum bisa menyimpan data awal. Periksa SUPABASE_URL dan service role key.",
          );
        }
        return created;
      })().finally(() => {
        globalForDb.__tuntasSeeding = null;
      });
    }
    stored = await globalForDb.__tuntasSeeding;
  }

  return cacheStored("supabase", stored);
}

async function mutateSupabase<T>(
  mutation: (db: Database) => T | Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const current = await loadSupabase(true);
    const draft = cloneDatabase(current.db);
    const result = await mutation(draft);

    const response = await supabaseRequest(
      `${STATE_TABLE}?id=eq.${encodeURIComponent(STATE_ID)}&version=eq.${current.version}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          data: draft,
          version: current.version + 1,
          updated_at: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) throw await supabaseError(response, "menyimpan data");

    const rows = (await response.json()) as unknown;
    if (Array.isArray(rows) && rows.length > 0) {
      cacheStored("supabase", {
        db: draft,
        version: current.version + 1,
      });
      return result;
    }
    // Someone else wrote first. Re-read and replay the mutation.
  }

  throw new Error(
    "Data sedang diperbarui perangkat lain. Coba simpan lagi sebentar.",
  );
}

// ---------------------------------------------------------------------------
// Local JSON fallback (development). On Vercel this path is read-only, so the
// Supabase branch above is required in production.
// ---------------------------------------------------------------------------

async function readLocalFile(): Promise<Database | null> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return isDatabase(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeLocalFile(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${DB_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(temp, DB_FILE);
}

async function loadLocal(force = false): Promise<StoredDatabase> {
  if (!force) {
    const cached = cachedStored("file");
    if (cached) return cached;
  }

  let db = await readLocalFile();
  if (!db) {
    db = createSeedDatabase();
    await writeLocalFile(db);
  }
  return cacheStored("file", { db, version: 0 });
}

async function mutateLocal<T>(mutation: (db: Database) => T | Promise<T>): Promise<T> {
  const previous = globalForDb.__tuntasQueue ?? Promise.resolve();
  const run = previous.then(async () => {
    const current = await loadLocal(true);
    const draft = cloneDatabase(current.db);
    const result = await mutation(draft);
    await writeLocalFile(draft);
    cacheStored("file", { db: draft, version: 0 });
    return result;
  });
  globalForDb.__tuntasQueue = run.catch(() => undefined);
  return run;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getDb(): Promise<Database> {
  if (storageBackend === "supabase") {
    return (await loadSupabase()).db;
  }
  return (await loadLocal()).db;
}

export async function mutateDb<T>(
  mutation: (db: Database) => T | Promise<T>,
): Promise<T> {
  if (storageBackend === "supabase") {
    const previous = globalForDb.__tuntasQueue ?? Promise.resolve();
    const run = previous.then(() => mutateSupabase(mutation));
    globalForDb.__tuntasQueue = run.catch(() => undefined);
    return run;
  }
  return mutateLocal(mutation);
}
