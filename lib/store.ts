import fs from "node:fs";
import path from "node:path";
import { createSeedDatabase } from "./seed";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const globalForDb = globalThis as unknown as {
  __tuntasDb?: Database;
  __tuntasQueue?: Promise<unknown>;
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load(): Database {
  if (globalForDb.__tuntasDb) return globalForDb.__tuntasDb;
  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
      if (parsed && Array.isArray(parsed.users)) {
        globalForDb.__tuntasDb = parsed;
        return parsed;
      }
    } catch {
      // file rusak → dibuat ulang dari seed
    }
  }

  const seeded = createSeedDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
  globalForDb.__tuntasDb = seeded;
  return seeded;
}

function persist(db: Database) {
  ensureDataDir();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}

export function getDb(): Database {
  return load();
}

export async function mutateDb<T>(mutation: (db: Database) => T): Promise<T> {
  const previous = globalForDb.__tuntasQueue ?? Promise.resolve();
  const run = previous.then(() => {
    const db = load();
    const result = mutation(db);
    persist(db);
    return result;
  });
  globalForDb.__tuntasQueue = run.catch(() => undefined);
  return run;
}
