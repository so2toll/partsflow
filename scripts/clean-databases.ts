/**
 * Clean Slate Database Reset
 *
 * This script:
 * 1. Clears all sessions from auth.db (forces re-login)
 * 2. Clears all nodes from app.db EXCEPT User nodes
 * 3. Clears all relationships from app.db
 *
 * Use this when you want a fresh start but keep your user accounts.
 */

import Database from "better-sqlite3";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const AUTH_DB_PATH = join(DATA_DIR, "auth.db");
const APP_DB_PATH = join(DATA_DIR, "app.db");

function cleanAuthDb() {
  console.log("\n[Auth DB] Clearing all sessions...");

  const authDb = new Database(AUTH_DB_PATH);

  // Clear all sessions (forces users to re-login)
  const deleteSessions = authDb.prepare("DELETE FROM session");
  const result = deleteSessions.run();

  console.log(`[Auth DB] ✅ Deleted ${result.changes} sessions`);

  // Show remaining users
  const users = authDb.prepare("SELECT id, email, role FROM user").all();
  console.log(`[Auth DB] Users retained:`);
  users.forEach((user: any) => {
    console.log(`  - ${user.email} (${user.role})`);
  });

  authDb.close();
}

function cleanAppDb() {
  console.log("\n[App DB] Cleaning graph database...");

  const appDb = new Database(APP_DB_PATH);

  // Get counts before
  const beforeNodes = appDb.prepare("SELECT COUNT(*) as count FROM nodes").get() as any;
  const beforeRels = appDb.prepare("SELECT COUNT(*) as count FROM relationships").get() as any;
  console.log(`[App DB] Before: ${beforeNodes.count} nodes, ${beforeRels.count} relationships`);

  // Delete all relationships first (foreign key constraints)
  const deleteRels = appDb.prepare("DELETE FROM relationships");
  const relResult = deleteRels.run();
  console.log(`[App DB] ✅ Deleted ${relResult.changes} relationships`);

  // Delete all nodes EXCEPT Users
  const deleteNodes = appDb.prepare("DELETE FROM nodes WHERE label != 'User'");
  const nodeResult = deleteNodes.run();
  console.log(`[App DB] ✅ Deleted ${nodeResult.changes} non-User nodes`);

  // Show remaining User nodes
  const users = appDb.prepare("SELECT id, properties FROM nodes WHERE label = 'User'").all() as any[];
  console.log(`[App DB] Users retained:`);
  users.forEach((node: any) => {
    const props = JSON.parse(node.properties);
    console.log(`  - ${props.email} (${props.role})`);
  });

  appDb.close();
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Clean Slate Database Reset");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    cleanAuthDb();
    cleanAppDb();

    console.log("\n✅ Clean slate complete!");
    console.log("\nNext steps:");
    console.log("  1. Start your dev server (npm run dev)");
    console.log("  2. Log in with your existing accounts");
    console.log("  3. Register a new organization to get started");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
