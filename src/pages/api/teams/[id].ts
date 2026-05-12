/**
 * Delete Team API Endpoint
 *
 * Deletes a team and all its relationships
 *
 * DELETE /api/teams/{id}
 */

import type { APIRoute } from "astro";
import { teamRepository } from "../../../lib/db/repositories/TeamRepository";

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const teamId = params.id;

    if (!teamId) {
      return new Response(
        JSON.stringify({
          error: "Team ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Teams] Deleting team ${teamId}`);

    await teamRepository.delete(teamId);

    console.log(`[Teams] Deleted team ${teamId}`);

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
    console.error("[Teams] Error deleting team:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to delete team",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
