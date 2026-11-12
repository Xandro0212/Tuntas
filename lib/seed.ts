import seedData from "../data/db.json";
import { migrateDatabase } from "./migrate";
import type { Database } from "./types";

/**
 * Demo data source.
 *
 * `data/db.json` is kept as the canonical demo snapshot so the local fallback,
 * Supabase bootstrap, and the documented demo account all start with exactly
 * the same projects, phases, tasks, and holidays.
 */
export function createSeedDatabase(): Database {
  return migrateDatabase(seedData as unknown as Database).db;
}
