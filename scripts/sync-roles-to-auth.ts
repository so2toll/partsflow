/**
 * Sync Roles from app.db to auth.db
 *
 * This script ensures that roles in Better Auth (auth.db) match
 * the roles in the application database (app.db).
 *
 * Run this after:
 * - Manual role changes in app.db
 * - Setting up SuperAdmin
 * - Any time auth.db and app.db are out of sync
 */

import "dotenv/config";
import { graph } from "../src/lib/db/graph";
import { auth } from "../src/lib/auth/auth";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  betterAuthId?: string;
}

async function syncRolesToAuth() {
  console.log("[RoleSync] Starting role synchronization from app.db to auth.db...");

  try {
    // Get all users from app.db
    const results = await graph.query<UserRecord>(
      `
      MATCH (u:User)
      RETURN u
      ORDER BY u.email
      `
    );

    const users = results.map((r) => r.u.properties);
    console.log(`[RoleSync] Found ${users.length} users in app.db`);

    // Get Better Auth database
    const db = (auth as any).database;
    const tableName = (auth as any).user?.tableName || "user";

    let syncCount = 0;

    for (const user of users) {
      const appDbRole = user.role;
      const email = user.email;

      // Check current role in auth.db
      const authResult = await db
        .prepare(`SELECT role, email FROM ${tableName} WHERE email = ?`)
        .bind(email)
        .first();

      if (!authResult) {
        console.log(`[RoleSync] ⚠️  User ${email} not found in auth.db`);
        continue;
      }

      const authDbRole = authResult.role;

      // Compare roles
      if (appDbRole === authDbRole) {
        console.log(`[RoleSync] ✅ ${email}: ${appDbRole} (already in sync)`);
      } else {
        // Update auth.db to match app.db
        await db
          .prepare(`UPDATE ${tableName} SET role = ? WHERE email = ?`)
          .bind(appDbRole, email)
          .execute();

        console.log(`[RoleSync] 🔄 ${email}: ${authDbRole} → ${appDbRole}`);
        syncCount++;
      }
    }

    console.log(`[RoleSync] ✅ Sync complete: ${syncCount} users updated`);
    console.log("[RoleSync] Please log out and log back in to see updated roles");

  } catch (error) {
    console.error("[RoleSync] ❌ Error:", error);
    throw error;
  }
}

// Run the sync
syncRolesToAuth()
  .then(() => {
    console.log("[RoleSync] Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[RoleSync] Failed:", error);
    process.exit(1);
  });
