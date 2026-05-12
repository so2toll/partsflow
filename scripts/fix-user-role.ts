/**
 * Fix User Role Script
 *
 * This script updates the Better Auth user with the correct organizationId and role
 * to match the graph database user.
 *
 * Run with: npx tsx scripts/fix-user-role.ts
 */

import Database from "better-sqlite3";
import { auth } from "../src/lib/auth/auth";

async function fixUserRole() {
  console.log("[FixUserRole] Starting user role fix...");

  // The user's email to fix
  const targetEmail = "steventester1234@gmail.com";
  // The organizationId from the graph database
  const organizationId = "org_01KQE7CS82VSADTR04TFAM0R5T";
  // The correct role from the graph database
  const correctRole = "Admin";

  try {
    // Get Better Auth database
    const db = (auth as any).database;
    const tableName = (auth as any).user?.tableName || "user";

    // Find the user by email
    const usersResult = await auth.api.listUsers();
    const users = (usersResult as any)?.users || [];
    const user = users.find((u: any) => u.email === targetEmail);

    if (!user) {
      console.error(`[FixUserRole] User not found: ${targetEmail}`);
      process.exit(1);
    }

    console.log(`[FixUserRole] Found user:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Current Role: ${user.role || "not set"}`);
    console.log(`  - Current organizationId: ${user.organizationId || "not set"}`);

    // Update the user with correct organizationId and role
    await db
      .prepare(`UPDATE ${tableName} SET organizationId = ?, role = ? WHERE id = ?`)
      .bind(organizationId, correctRole, user.id)
      .execute();

    console.log(`\n[FixUserRole] Updated user with:`);
    console.log(`  - organizationId: ${organizationId}`);
    console.log(`  - role: ${correctRole}`);

    // Verify the update
    const updatedUsersResult = await auth.api.listUsers();
    const updatedUsers = (updatedUsersResult as any)?.users || [];
    const updatedUser = updatedUsers.find((u: any) => u.email === targetEmail);

    console.log(`\n[FixUserRole] Verification:`);
    console.log(`  - Role: ${updatedUser?.role || "not set"}`);
    console.log(`  - organizationId: ${updatedUser?.organizationId || "not set"}`);

    console.log("\n[FixUserRole] ✅ Fix complete!");
    console.log("\nPlease restart your dev server and try accessing /app/dashboard again.");
  } catch (error) {
    console.error("[FixUserRole] Error:", error);
    process.exit(1);
  }
}

fixUserRole();
