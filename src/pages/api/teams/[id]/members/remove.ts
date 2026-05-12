/**
 * Remove Team Member API Endpoint
 *
 * Removes a user from a team
 * Requires team admin permission and validates removal constraints
 *
 * POST /api/teams/{id}/members/remove
 * Body: { userId: string }
 */

import type { APIRoute } from "astro";
import { teamRepository } from "../../../../../lib/db/repositories/TeamRepository";
import { getSession } from "../../../../../lib/auth/session-adapter";
import { requireCanRemoveMember } from "../../../../../lib/middleware/requireTeamPermission";

const removeMemberHandler: APIRoute = async ({ params, request, cookies }) => {
  try {
    const teamId = params.id;
    const { userId } = await request.json();

    if (!teamId || !userId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: teamId, userId",
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

    console.log(`[Teams] Removing user ${userId} from team ${teamId}`);

    // Remove member from team
    await teamRepository.removeMember(teamId, userId, performedBy);

    console.log(`[Teams] Removed user ${userId} from team ${teamId}`);

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
    console.error("[Teams] Error removing member:", error);

    // Handle specific errors with appropriate status codes
    let errorMessage = "Failed to remove member from team";
    let status = 500;

    if (error instanceof Error) {
      if (error.message.includes("Cannot remove the team creator")) {
        errorMessage = "Cannot remove the team creator/owner";
        status = 403;
      } else if (error.message.includes("Cannot remove")) {
        errorMessage = error.message;
        status = 403;
      }
    }

    return new Response(
      JSON.stringify({
        error: "Failed to remove member from team",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST = requireCanRemoveMember(removeMemberHandler);
