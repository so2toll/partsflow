/**
 * Remove Team from Project API Endpoint
 *
 * Removes a team from working on a project
 *
 * POST /api/projects/{id}/remove-team
 * Body: { teamId: string }
 */

import type { APIRoute } from "astro";
import { projectRepository } from "../../../../lib/db/repositories/ProjectRepository";
import { getSession } from "../../../../lib/auth/session-adapter";

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = await getSession(request, cookies);

    // Use global_id if available, otherwise fall back to id for backward compatibility
    const userId = session?.user?.global_id || session?.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const projectId = params.id;
    const { teamId } = await request.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: teamId",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Projects] Removing team ${teamId} from project ${projectId}`);

    await projectRepository.removeTeam(teamId, projectId);

    console.log(`[Projects] Removed team ${teamId} from project ${projectId}`);

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Projects] Error removing team from project:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to remove team from project",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
