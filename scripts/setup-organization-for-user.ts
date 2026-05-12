/**
 * Setup Organization for Existing User
 *
 * This script creates an organization for an existing user account.
 * Use this after running clean-databases.ts to create a fresh organization.
 *
 * Usage: npx tsx scripts/setup-organization-for-user.ts <email> <organization-name>
 * Example: npx tsx scripts/setup-organization-for-user.ts "steventester1234@gmail.com" "My Organization"
 */

import { graph } from "../src/lib/db/graph";
import { organizationRepository } from "../src/lib/db/repositories/OrganizationRepository";
import { projectRepository } from "../src/lib/db/repositories/ProjectRepository";
import Database from "better-sqlite3";
import { join } from "path";

const AUTH_DB_PATH = join(process.cwd(), "data", "auth.db");

async function setupOrganizationForUser(email: string, organizationName: string) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Setup Organization for ${email}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // Step 1: Find the user in the graph database
    console.log(`[Step 1] Looking for user in graph database...`);
    const userResults = await graph.query<any>(
      `
      MATCH (u:User {email: $email})
      RETURN u
      `,
      { email }
    );

    if (userResults.length === 0 || !userResults[0].u) {
      console.error(`❌ User ${email} not found in graph database!`);
      console.log("   Available users:");
      const allUsers = await graph.query<any>("MATCH (u:User) RETURN u");
      allUsers.forEach((result: any) => {
        const props = result.u.properties;
        console.log(`   - ${props.email} (${props.role})`);
      });
      process.exit(1);
    }

    const userNode = userResults[0].u;
    const userProps = userNode.properties;
    const userId = userProps.id;
    const userRole = userProps.role;

    console.log(`✅ Found user: ${userProps.name} (${userRole})`);
    console.log(`   ID: ${userId}`);

    // Step 2: Check if user already has an organization
    if (userProps.organizationId && userProps.organizationId !== "null") {
      console.log(`⚠️  User already has organization: ${userProps.organizationId}`);
      console.log("   Skipping organization creation.");
      console.log("\n✅ Setup complete! User can now log in.");
      return;
    }

    // Step 3: Create Organization
    console.log(`\n[Step 2] Creating organization "${organizationName}"...`);
    const organization = await organizationRepository.create({
      name: organizationName,
      settings: {
        branding: {
          colors: {
            primary: "#DFFF00", // Electric Lime from Stitch design system
            secondary: "#c8e600",
          },
        },
        limits: {
          maxVideos: 100,
          maxStorageGB: 50,
          maxUsers: 10,
        },
        features: {
          autoHighlights: true,
          customAIModels: false,
          advancedAnalytics: false,
        },
      },
    });

    console.log(`✅ Created organization: ${organization.id}`);

    // Step 4: Update user node with organizationId
    console.log(`\n[Step 3] Updating user with organizationId...`);
    await graph.updateNode(userId, {
      organizationId: organization.id,
    });

    console.log(`✅ User ${userId} now belongs to organization ${organization.id}`);

    // Step 5: Create OWNS relationship
    console.log(`\n[Step 4] Creating ownership relationship...`);
    await organizationRepository.addUser(userId, organization.id, "Admin");

    console.log(`✅ Created OWNS relationship: ${userId} -> ${organization.id}`);

    // Step 6: Update Better Auth user with organizationId and role
    console.log(`\n[Step 5] Updating Better Auth user...`);
    const authDb = new Database(AUTH_DB_PATH);

    const updateResult = authDb
      .prepare("UPDATE user SET organizationId = ?, role = ? WHERE email = ?")
      .run(organization.id, "Admin", email);

    if (updateResult.changes > 0) {
      console.log(`✅ Updated Better Auth user record`);
    } else {
      console.warn(`⚠️  No Better Auth user found with email ${email}`);
    }

    authDb.close();

    // Step 7: Create first project
    console.log(`\n[Step 6] Creating first project...`);
    const firstProject = await projectRepository.create({
      name: "My First Project",
      organizationId: organization.id,
      description: "Your first project to get started",
      settings: {
        autoHighlights: true,
        defaultAIModel: "yolov8",
        processingPriority: "normal",
      },
      createdBy: userId,
    });

    console.log(`✅ Created project: ${firstProject.id}`);

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  ✅ Setup Complete!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\nWhat's been created:");
    console.log(`  • Organization: ${organization.name} (${organization.id})`);
    console.log(`  • Project: ${firstProject.name} (${firstProject.id})`);
    console.log(`  • User ${email} is now Admin of this organization`);
    console.log("\nNext steps:");
    console.log("  1. Start your dev server (npm run dev)");
    console.log("  2. Log in at http://localhost:4321/auth/login/");
    console.log("  3. You'll be redirected to the dashboard");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("\nUsage: npx tsx scripts/setup-organization-for-user.ts <email> <organization-name>\n");
  console.log("Example: npx tsx scripts/setup-organization-for-user.ts \"steventester1234@gmail.com\" \"My Organization\"\n");
  console.log("Available users:");
  // List available users
  const authDb = new Database(AUTH_DB_PATH);
  const users = authDb.prepare("SELECT email, role FROM user").all();
  authDb.close();
  users.forEach((user: any) => {
    console.log(`  - ${user.email} (${user.role})`);
  });
  console.log();
  process.exit(1);
}

const [email, organizationName] = args;

setupOrganizationForUser(email, organizationName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
