/**
 * Fix User Role Script (Direct DB Access)
 *
 * This script directly updates the Better Auth SQLite database
 * to fix the role and organizationId mismatch.
 *
 * Run with: npx tsx scripts/fix-user-role-direct.ts
 */

import Database from "better-sqlite3";

async function fixUserRole() {
  console.log("[FixUserRole] Starting user role fix...");

  // The user's email to fix
  const targetEmail = "steventester1234@gmail.com";
  // The organizationId from the graph database
  const organizationId = "org_01KQE7CS82VSADTR04TFAM0R5T";
  // The correct role from the graph database
  const correctRole = "Admin";

  try {
    // Open the Better Auth database
    const db = new Database("./data/auth.db");
    db.pragma("journal_mode = WAL");

    console.log(`[FixUserRole] Opened database: ./data/auth.db`);

    // Find the user by email
    const user = db
      .prepare("SELECT * FROM user WHERE email = ?")
      .get(targetEmail) as any;

    if (!user) {
      console.error(`[FixUserRole] User not found: ${targetEmail}`);
      db.close();
      process.exit(1);
    }

    console.log(`[FixUserRole] Found user:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Name: ${user.name}`);
    console.log(`  - Current Role: ${user.role || "not set"}`);
    console.log(`  - Current organizationId: ${user.organizationId || "not set"}`);

    // Update the user with correct organizationId and role
    const updateStmt = db.prepare(
      "UPDATE user SET organizationId = ?, role = ? WHERE id = ?"
    );
    const result = updateStmt.run(organizationId, correctRole, user.id);

    console.log(`\n[FixUserRole] Updated user:`);
    console.log(`  - Rows affected: ${result.changes}`);
    console.log(`  - organizationId: ${organizationId}`);
    console.log(`  - role: ${correctRole}`);

    // Verify the update
    const updatedUser = db
      .prepare("SELECT * FROM user WHERE email = ?")
      .get(targetEmail) as any;

    console.log(`\n[FixUserRole] Verification:`);
    console.log(`  - Role: ${updatedUser?.role || "not set"}`);
    console.log(`  - organizationId: ${updatedUser?.organizationId || "not set"}`);

    db.close();

    console.log("\n[FixUserRole] ✅ Fix complete!");
    console.log("\nPlease restart your dev server and try accessing /app/dashboard again.");
    console.log("The dashboard should now show 'EAV Studios' instead of 'Loading...'");
  } catch (error) {
    console.error("[FixUserRole] Error:", error);
    process.exit(1);
  }
}

fixUserRole();
