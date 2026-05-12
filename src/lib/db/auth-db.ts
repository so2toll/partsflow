/**
 * Auth Database Client Helper
 *
 * Provides direct SQL access to the Better Auth database
 * Used for operations that Better Auth doesn't support via its API
 *
 * Uses the same configuration as auth.ts (Turso or local SQLite)
 */

import { createClient } from "@libsql/client";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import Database from "better-sqlite3";

/**
 * Get a database client for the auth database
 * This matches the logic in auth.ts buildDatabase()
 */
function getAuthDatabase() {
  const tursoUrl = (globalThis as any).process?.env?.TURSO_DATABASE_URL
    || (import.meta.env as any).TURSO_DATABASE_URL;
  const tursoToken = (globalThis as any).process?.env?.TURSO_AUTH_TOKEN
    || (import.meta.env as any).TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    // Turso: Use libsql client
    return createClient({ url: tursoUrl, authToken: tursoToken });
  }

  // Local: Use better-sqlite3
  return new Database("./data/auth.db");
}

/**
 * Execute a SELECT query against the auth database
 */
export async function authQuery<T = unknown>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  const db = getAuthDatabase();

  if ('execute' in db) {
    // Turso / libsql client
    const result = await db.execute({ sql, args });
    return result.rows as T[];
  } else {
    // better-sqlite3
    const stmt = (db as any).prepare(sql);
    return stmt.all(...args) as T[];
  }
}

/**
 * Execute an INSERT/UPDATE/DELETE against the auth database
 */
export async function authExecute(
  sql: string,
  args: unknown[] = []
): Promise<number> {
  const db = getAuthDatabase();

  if ('execute' in db) {
    // Turso / libsql client
    const result = await db.execute({ sql, args });
    return result.rowsAffected || 0;
  } else {
    // better-sqlite3
    const stmt = (db as any).prepare(sql);
    const result = stmt.run(...args);
    return result.changes || 0;
  }
}

/**
 * Query for a single row (returns first result or null)
 */
export async function authQueryOne<T = unknown>(
  sql: string,
  args: unknown[] = []
): Promise<T | null> {
  const results = await authQuery<T>(sql, args);
  return results.length > 0 ? results[0] : null;
}
