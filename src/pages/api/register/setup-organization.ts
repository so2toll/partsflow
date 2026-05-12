/**
 * Organization Setup API Endpoint
 *
 * Called after user registration to create:
 * - Organization node in graph
 * - User node in graph with organizationId
 * - OWNS relationship between user and organization
 * - First project "My First Project"
 * - HAS_PROJECT relationship between organization and project
 * - Updates Better Auth user with organizationId, role, and global_id
 *
 * POST /api/register/setup-organization
 * Body: { email: string, name: string, organizationName: string }
 */

import type { APIRoute } from "astro";
import { graph } from "../../../lib/db/graph";
import { organizationRepository } from "../../../lib/db/repositories/OrganizationRepository";
import { projectRepository } from "../../../lib/db/repositories/ProjectRepository";
import { authQuery, authExecute } from "../../../lib/db/auth-db";
import { ulid } from "ulid";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, name, organizationName } = await request.json();

    if (!email || !name || !organizationName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, name, organizationName",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[OrgSetup] Setting up organization "${organizationName}" for user ${email}`);

    // Step 1: Generate global_id (ULID) that will be used in both databases
    const global_id = `user_${ulid()}`;

    // Step 2: Create Organization node (do this first so we have org.id)
    const organization = await organizationRepository.create({
      name: organizationName,
      settings: {
        branding: {
          colors: {
            primary: "#667eea",
            secondary: "#7cd1f9",
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

    console.log(`[OrgSetup] Created organization: ${organization.id}`);

    // Step 3: Find the Better Auth user by email and update with org info
    let betterAuthUserId: string | null = null;
    try {
      const users = await authQuery<any>(
        `SELECT id, email, role, organizationId, global_id FROM user WHERE email = ? LIMIT 1`,
        [email]
      );

      if (users.length > 0) {
        betterAuthUserId = users[0].id;
        console.log(`[OrgSetup] Found Better Auth user: ${betterAuthUserId}`);

        // Update the Better Auth user with organizationId, role, and global_id
        await authExecute(
          `UPDATE user SET organizationId = ?, role = ?, global_id = ? WHERE id = ?`,
          [organization.id, "Admin", global_id, betterAuthUserId]
        );

        console.log(`[OrgSetup] Updated Better Auth user with organizationId, Admin role, and global_id ${global_id}`);
      } else {
        console.warn(`[OrgSetup] Better Auth user not found for email: ${email}`);
      }
    } catch (error) {
      console.error("[OrgSetup] Error updating Better Auth user:", error);
      // Continue anyway - organization is created
    }

    // Step 4: Create User node in graph using the same global_id
    const now = new Date().toISOString();

    await graph.mutate(
      `
      CREATE (u:User {
        id: $id,
        email: $email,
        name: $name,
        role: $role,
        organizationId: $organizationId,
        createdAt: $now
      })
      RETURN u
      `,
      {
        id: global_id, // Use the same ULID as global_id in auth.db
        email,
        name,
        role: "Admin",
        organizationId: organization.id,
        now,
      }
    );

    console.log(`[OrgSetup] Created user node with global_id: ${global_id}`);

    // Step 5: Create OWNS relationship from user to organization
    await organizationRepository.addUser(global_id, organization.id, "Admin");

    console.log(`[OrgSetup] Created OWNS relationship: ${global_id} -> ${organization.id}`);

    // Step 6: Create first project "My First Project"
    const firstProject = await projectRepository.create({
      name: "My First Project",
      organizationId: organization.id,
      description: "Your first project to get started",
      settings: {
        autoHighlights: true,
        defaultAIModel: "yolov8",
        processingPriority: "normal",
      },
      createdBy: global_id,
    });

    console.log(`[OrgSetup] Created first project: ${firstProject.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        organizationId: organization.id,
        userId: global_id,
        global_id: global_id,
        projectId: firstProject.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[OrgSetup] Error setting up organization:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to setup organization",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
