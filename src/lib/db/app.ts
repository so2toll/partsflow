/**
 * App Database Client
 *
 * Separate database for application data (graph nodes, relationships, etc.)
 * Keeps auth data separate from business data.
 *
 * @module lib/db/app
 * @version 0.1.0
 */

import { createClient, type Client } from "@libsql/client";

/**
 * App database client singleton
 */
let appClient: Client | null = null;

/**
 * Initialize and return app database client
 *
 * Uses local SQLite file for development, Turso for production.
 * Separate from auth database to keep concerns separated.
 *
 * @returns {Client} App database client instance
 */
export function getAppClient(): Client {
  if (appClient) {
    return appClient;
  }

  const url = import.meta.env?.APP_DATABASE_URL || process.env.APP_DATABASE_URL || "file:./data/app.db";
  const authToken = import.meta.env?.APP_AUTH_TOKEN || process.env.APP_AUTH_TOKEN;

  if (url.startsWith("file:")) {
    appClient = createClient({ url });
  } else {
    if (!authToken) {
      throw new Error("APP_AUTH_TOKEN is required when using Turso cloud database");
    }
    appClient = createClient({ url, authToken });
  }

  return appClient;
}

/**
 * Execute a SQL query against app database
 */
export async function appQuery<T = unknown>(
  sql: string,
  args: unknown[] = []
): Promise<T[]> {
  try {
    const client = getAppClient();
    const result = await client.execute({ sql, args });
    return result.rows as T[];
  } catch (error) {
    console.error("App query error:", error);
    throw new Error(
      `Failed to execute app query: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Execute a SQL statement against app database (INSERT, UPDATE, DELETE)
 */
export async function appExecute(
  sql: string,
  args: unknown[] = []
): Promise<number> {
  try {
    const client = getAppClient();
    const result = await client.execute({ sql, args });
    return result.rowsAffected;
  } catch (error) {
    console.error("App execute error:", error);
    throw new Error(
      `Failed to execute app statement: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Query for a single row (returns first result or null)
 */
export async function appQueryOne<T = unknown>(
  sql: string,
  args: unknown[] = []
): Promise<T | null> {
  const results = await appQuery<T>(sql, args);
  return results.length > 0 ? results[0] : null;
}
