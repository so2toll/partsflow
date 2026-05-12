/**
 * Add organizationId Column to Better Auth Database
 *
 * This script adds the missing organizationId column to the user table
 * and updates the existing user with the correct organizationId and role.
 *
 * Run with: npx tsx scripts/add-organization-id-column.ts
 */

import Database from "better-sqlite3";

async function addOrganizationIdColumn() {
  console.log("[AddColumn] Starting database schema update...");

  const targetEmail = "steventester1234@gmail.com";
  const organizationId = "org_01KQE7CS82VSADTR04TFAM0R5T";
  const correctRole = "Admin";

  try {
    // Open the Better Auth database
    const db = new Database("./data/auth.db");
    db.pragma("journal_mode = WAL");

    console.log(`[AddColumn] Opened database: ./data/auth.db`);

    // Check current table schema
    const schema = db.pragma("table_info(user)");
    console.log("\n[AddColumn] Current user table columns:");
    schema.forEach((col: any) => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    // Check if organizationId column exists
    const hasOrgIdColumn = schema.some((col: any) => col.name === "organizationId");

    if (!hasOrgIdColumn) {
      console.log("\n[AddColumn] Adding organizationId column...");
      db.exec("ALTER TABLE user ADD COLUMN organizationId TEXT");
      console.log("[AddColumn] ✅ Added organizationId column");
    } else {
      console.log("\n[AddColumn] organizationId column already exists");
    }

    // Find the user by email
    const user = db
      .prepare("SELECT * FROM user WHERE email = ?")
      .get(targetEmail) as any;

    if (!user) {
      console.error(`\n[AddColumn] User not found: ${targetEmail}`);
      db.close();
      process.exit(1);
    }

    console.log(`\n[AddColumn] Found user:`);
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

    console.log(`\n[AddColumn] Updated user:`);
    console.log(`  - Rows affected: ${result.changes}`);
    console.log(`  - organizationId: ${organizationId}`);
    console.log(`  - role: ${correctRole}`);

    // Verify the update
    const updatedUser = db
      .prepare("SELECT * FROM user WHERE email = ?")
      .get(targetEmail) as any;

    console.log(`\n[AddColumn] Final verification:`);
    console.log(`  - Role: ${updatedUser?.role || "not set"}`);
    console.log(`  - organizationId: ${updatedUser?.organizationId || "not set"}`);

    db.close();

    console.log("\n[AddColumn] ✅ Complete!");
    console.log("\nPlease refresh your browser at /app/dashboard");
    console.log("You should now see 'EAV Studios' instead of 'Loading...'");
  } catch (error) {
    console.error("\n[AddColumn] Error:", error);
    process.exit(1);
  }
}

addOrganizationIdColumn();
