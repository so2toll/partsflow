/**
 * Turso Database Client
 *
 * Provides connection to Turso (libSQL) database used for Better Auth
 * session management and user profiles. Supports both local SQLite
 * (for development) and Turso cloud (for production).
 *
 * @module lib/db/turso
 * @version 0.1.0
 */

import { createClient, type Client } from "@libsql/client";

/**
 * Turso database client singleton
 */
let tursoClient: Client | null = null;

/**
 * Initialize and return Turso database client
 *
 * This function creates a singleton connection to the Turso database.
 * In development, it uses local SQLite. In production, it connects to Turso cloud.
 *
 * @returns {Client} Turso database client instance
 *
 * @example
 * ```typescript
 * const db = getTursoClient();
 * const result = await db.execute({
 *   sql: "SELECT * FROM user_profiles WHERE id = ?",
 *   args: [userId]
 * });
 * ```
 */
export function getTursoClient(): Client {
  if (tursoClient) {
    return tursoClient;
  }

  // Handle both Astro/Vite (import.meta.env) and Node.js (process.env) environments
  const url = (import.meta.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL) as string | undefined;
  const authToken = (import.meta.env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN) as string | undefined;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL environment variable is not set. " +
      "Set it to 'file:./data/auth.db' for local development or " +
      "your Turso cloud URL for production."
    );
  }

  // For local SQLite files (development mode)
  if (url.startsWith("file:")) {
    tursoClient = createClient({
      url,
    });
  } else {
    // For Turso cloud (production mode)
    if (!authToken) {
      throw new Error(
        "TURSO_AUTH_TOKEN is required when using Turso cloud database. " +
        "Generate a token using: turso db tokens create <database-name>"
      );
    }

    tursoClient = createClient({
      url,
      authToken,
    });
  }

  return tursoClient;
}

/**
 * Execute a SQL query against Turso database
 *
 * Utility function for executing SQL queries with type safety and error handling.
 *
 * @template T The expected return type
 * @param {string} sql SQL query string
 * @param {unknown[]} args Query parameters
 * @returns {Promise<T[]>} Query results
 *
 * @throws {Error} If database query fails
 *
 * @example
 * ```typescript
 * interface UserProfile {
 *   id: string;
 *   role: string;
 * }
 *
 * const profiles = await executeQuery<UserProfile>(
 *   "SELECT * FROM user_profiles WHERE role = ?",
 *   ["Recruiter"]
 * );
 * ```
 */
export async function executeQuery<T = unknown>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  try {
    const client = getTursoClient();
    const result = await client.execute({
      sql,
      args,
    });

    return result.rows as T[];
  } catch (error) {
    console.error("Turso query error:", error);
    throw new Error(
      `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Execute a SQL statement that doesn't return results (INSERT, UPDATE, DELETE)
 *
 * @param {string} sql SQL statement
 * @param {unknown[]} args Statement parameters
 * @returns {Promise<number>} Number of affected rows
 *
 * @throws {Error} If database operation fails
 *
 * @example
 * ```typescript
 * const rowsAffected = await executeStatement(
 *   "UPDATE user_profiles SET role = ? WHERE id = ?",
 *   ["Admin", "user_123"]
 * );
 * ```
 */
export async function executeStatement(
  sql: string,
  args: unknown[] = []
): Promise<number> {
  try {
    const client = getTursoClient();
    const result = await client.execute({
      sql,
      args,
    });

    return result.rowsAffected;
  } catch (error) {
    console.error("Turso statement error:", error);
    throw new Error(
      `Failed to execute statement: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Execute multiple statements in a transaction
 *
 * All statements succeed or all fail atomically.
 *
 * @param {Array<{sql: string, args: unknown[]}>} statements Array of SQL statements
 * @returns {Promise<void>}
 *
 * @throws {Error} If any statement fails (entire transaction is rolled back)
 *
 * @example
 * ```typescript
 * await executeTransaction([
 *   {
 *     sql: "INSERT INTO user_profiles (id, role) VALUES (?, ?)",
 *     args: ["user_123", "Recruiter"]
 *   },
 *   {
 *     sql: "INSERT INTO audit_log (user_id, action) VALUES (?, ?)",
 *     args: ["user_123", "profile_created"]
 *   }
 * ]);
 * ```
 */
export async function executeTransaction(
  statements: Array<{ sql: string; args: unknown[] }>
): Promise<void> {
  const client = getTursoClient();

  try {
    await client.execute("BEGIN TRANSACTION");

    for (const statement of statements) {
      await client.execute({
        sql: statement.sql,
        args: statement.args,
      });
    }

    await client.execute("COMMIT");
  } catch (error) {
    await client.execute("ROLLBACK");
    console.error("Turso transaction error:", error);
    throw new Error(
      `Transaction failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Close the Turso database connection
 *
 * Should be called during application shutdown. Not typically needed
 * in serverless environments.
 *
 * @returns {Promise<void>}
 */
export async function closeTursoConnection(): Promise<void> {
  if (tursoClient) {
    try {
      await tursoClient.close();
      tursoClient = null;
    } catch (error) {
      console.error("Error closing Turso connection:", error);
    }
  }
}

// ============================================================================
// Compatibility aliases for repositories that import from ducklake.ts
// ============================================================================

/**
 * Query for a single row (returns first result or null)
 *
 * @template T The expected return type
 * @param {string} sql SQL query string
 * @param {unknown[]} args Query parameters
 * @returns {Promise<T | null>} First query result or null
 */
export async function queryOne<T = unknown>(
  sql: string,
  args: unknown[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(sql, args);
  return results.length > 0 ? results[0] : null;
}

/**
 * Alias for executeQuery - returns all matching rows
 * This provides compatibility with ducklake.ts interface
 */
export const query = executeQuery;

/**
 * Alias for executeStatement - executes INSERT/UPDATE/DELETE
 * This provides compatibility with ducklake.ts interface
 */
export const execute = executeStatement;
