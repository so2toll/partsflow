/**
 * Create Team API Endpoint
 *
 * Creates a new team and optionally assigns it to a project
 *
 * POST /api/teams/create
 * Body: { name: string, organizationId: string, projectId?: string }
 */

import type { APIRoute } from "astro";
import { teamRepository } from "../../../lib/db/repositories/TeamRepository";
import { getSession } from "../../../lib/auth/session-adapter";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { name, organizationId, projectId } = await request.json();

    if (!name || !organizationId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: name, organizationId",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get current user for audit log
    const session = await getSession(request, cookies);
    // Use global_id if available, otherwise fall back to id for backward compatibility
    const performedBy = session?.user?.global_id || session?.user?.id;

    console.log(`[Teams] Creating team "${name}" for org ${organizationId}`);

    // Create team
    const team = await teamRepository.create({
      name,
      organizationId,
      createdBy: performedBy,
    });

    // Assign team to project if provided
    if (projectId) {
      await teamRepository.assignToProject(team.id, projectId);
      console.log(`[Teams] Created team ${team.id} and assigned to project ${projectId}`);
    } else {
      console.log(`[Teams] Created team ${team.id} without project assignment`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        team,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Teams] Error creating team:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to create team",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
