/**
 * Auth Database Initialization
 *
 * Ensures the auth.db has the correct schema including custom fields
 * This should be called when the app starts up
 */

import Database from "better-sqlite3";

const SQLITE_DB_PATH = "./data/auth.db";

/**
 * Initialize auth.db with required custom fields
 * This ensures global_id and organizationId columns exist even if
 * Better Auth's migrations don't include them
 */
export function initAuthDb(): void {
  console.log("[AuthDB Init] Checking auth.db schema...");

  try {
    const db = new Database(SQLITE_DB_PATH);

    // Check if global_id column exists
    const columns = db.prepare("PRAGMA table_info(user)").all() as Array<{
      name: string;
    }>;

    const hasGlobalId = columns.some((col) => col.name === "global_id");
    const hasOrgId = columns.some((col) => col.name === "organizationId");

    if (!hasGlobalId) {
      console.log("[AuthDB Init] ⚠️  global_id column missing, adding...");
      db.exec("ALTER TABLE user ADD COLUMN global_id TEXT");
      db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_global_id ON user(global_id)");
      console.log("[AuthDB Init] ✅ Added global_id column");
    } else {
      console.log("[AuthDB Init] ✅ global_id column exists");
    }

    if (!hasOrgId) {
      console.log("[AuthDB Init] ⚠️  organizationId column missing, adding...");
      db.exec("ALTER TABLE user ADD COLUMN organizationId TEXT");
      console.log("[AuthDB Init] ✅ Added organizationId column");
    } else {
      console.log("[AuthDB Init] ✅ organizationId column exists");
    }

    db.close();
    console.log("[AuthDB Init] Complete");
  } catch (error) {
    console.error("[AuthDB Init] Error:", error);
    throw error;
  }
}
