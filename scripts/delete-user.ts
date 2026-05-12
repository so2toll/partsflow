/**
 * Delete User Script
 *
 * Deletes a user from both auth.db and app.db by email
 * Useful for cleaning up test users
 *
 * Usage: npx tsx scripts/delete-user.ts <email>
 * Example: npx tsx scripts/delete-user.ts "steventester1234@gmail.com"
 */

import { authQuery, authExecute } from "../src/lib/db/auth-db";
import { appQuery, appExecute } from "../src/lib/db/app";

async function deleteUserByEmail(email: string) {
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  Delete User: ${email}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  try {
    // Step 1: Delete from auth database
    console.log(`[Step 1] Deleting from auth database...`);
    const authUsers = await authQuery<any>(
      `SELECT id, email, role FROM user WHERE email = ?`,
      [email]
    );

    if (authUsers.length > 0) {
      const authUserId = authUsers[0].id;
      console.log(`  Found auth user: ${authUserId}`);

      // Delete sessions first
      await authExecute(`DELETE FROM session WHERE userId = ?`, [authUserId]);
      console.log(`  ✅ Deleted sessions`);

      // Delete accounts
      await authExecute(`DELETE FROM account WHERE userId = ?`, [authUserId]);
      console.log(`  ✅ Deleted accounts`);

      // Delete user
      await authExecute(`DELETE FROM user WHERE email = ?`, [email]);
      console.log(`  ✅ Deleted user from auth database`);
    } else {
      console.log(`  ⚠️  No user found in auth database`);
    }

    // Step 2: Delete from app database (graph)
    console.log(`\n[Step 2] Deleting from app database...`);
    const appUsers = await appQuery<any>(
      `SELECT id, properties FROM nodes WHERE label = 'User'`
    );

    let userIdToDelete: string | null = null;
    for (const node of appUsers) {
      const props = JSON.parse(node.properties);
      if (props.email === email) {
        userIdToDelete = node.id;
        break;
      }
    }

    if (userIdToDelete) {
      console.log(`  Found app user node: ${userIdToDelete}`);

      // Delete relationships
      await appExecute(`DELETE FROM relationships WHERE from_node_id = ?`, [userIdToDelete]);
      await appExecute(`DELETE FROM relationships WHERE to_node_id = ?`, [userIdToDelete]);
      console.log(`  ✅ Deleted relationships`);

      // Delete user node
      await appExecute(`DELETE FROM nodes WHERE id = ?`, [userIdToDelete]);
      console.log(`  ✅ Deleted user from app database`);
    } else {
      console.log(`  ⚠️  No user found in app database`);
    }

    // Step 3: Clean up organization (if it was the only user)
    console.log(`\n[Step 3] Checking for orphaned organizations...`);
    const orgs = await appQuery<any>(
      `SELECT id, properties FROM nodes WHERE label = 'Organization'`
    );

    for (const org of orgs) {
      const props = JSON.parse(org.properties);
      // Check if this organization has any users
      const memberCount = await appQuery<any>(
        `SELECT COUNT(*) as count FROM relationships WHERE to_node_id = ? AND type = 'MEMBER_OF'`,
        [org.id]
      );

      if (memberCount[0].count === 0) {
        console.log(`  🗑️  Deleting empty organization: ${props.name} (${org.id})`);
        await appExecute(`DELETE FROM nodes WHERE id = ?`, [org.id]);
      }
    }

    console.log(`\n✅ User ${email} deleted successfully!\n`);

  } catch (error) {
    console.error(`\n❌ Error deleting user:`, error);
    process.exit(1);
  }
}

// Get email from command line
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("\nUsage: npx tsx scripts/delete-user.ts <email>\n");
  console.log("Example: npx tsx scripts/delete-user.ts \"steventester1234@gmail.com\"\n");
  process.exit(1);
}

const emailToDelete = args[0];

deleteUserByEmail(emailToDelete)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
