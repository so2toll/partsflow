/**
 * Set up System SuperAdmin
 *
 * This script sets steventester1234@gmail.com as the System SuperAdmin
 * The SuperAdmin has access to all organizations, teams, and projects
 */

import { graph } from "../lib/db/graph";

const SUPER_ADMIN_EMAIL = "steventester1234@gmail.com";

async function setupSuperAdmin() {
  console.log("[SuperAdmin Setup] Starting...");

  try {
    // Find the user by email
    const results = await graph.query<any>(
      `
      MATCH (u:User {email: $email})
      RETURN u
      `,
      { email: SUPER_ADMIN_EMAIL }
    );

    if (results.length === 0 || !results[0].u) {
      console.error(`[SuperAdmin Setup] User ${SUPER_ADMIN_EMAIL} not found!`);
      return;
    }

    const userProps = results[0].u.properties;
    const userId = userProps.id;
    const currentRole = userProps.role;
    const currentOrgId = userProps.organizationId;

    console.log(`[SuperAdmin Setup] Found user:`, {
      id: userId,
      email: userProps.email,
      name: userProps.name,
      currentRole,
      currentOrgId,
    });

    // Update user to be SuperAdmin with no organization
    await graph.updateNode(userId, {
      role: "SuperAdmin",
      organizationId: null, // SuperAdmin exists outside organizations
    });

    console.log(`[SuperAdmin Setup] ✅ Successfully set ${SUPER_ADMIN_EMAIL} as SuperAdmin`);
    console.log(`[SuperAdmin Setup] Previous role: ${currentRole}, Previous org: ${currentOrgId || 'none'}`);
    console.log(`[SuperAdmin Setup] User now has system-level access to all resources`);

  } catch (error) {
    console.error("[SuperAdmin Setup] Error:", error);
    throw error;
  }
}

// Run the setup
setupSuperAdmin()
  .then(() => {
    console.log("[SuperAdmin Setup] Complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[SuperAdmin Setup] Failed:", error);
    process.exit(1);
  });
