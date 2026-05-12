/**
 * Get Team Members API Endpoint
 *
 * Returns all members of a team with their roles
 *
 * GET /api/teams/{id}/members
 */

import type { APIRoute } from "astro";
import { teamRepository } from "../../../../../lib/db/repositories/TeamRepository";

export const GET: APIRoute = async ({ params }) => {
  try {
    const teamId = params.id;

    if (!teamId) {
      return new Response(
        JSON.stringify({
          error: "Missing team ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Teams API] Getting members for team: ${teamId}`);

    const members = await teamRepository.getMembers(teamId);

    console.log(`[Teams API] Raw members from repo:`, members);

    // Transform to response format
    const responseMembers = members.map((member) => {
      console.log(`[Teams API] Processing member:`, {
        user: member.user,
        userName: member.user?.properties?.name,
        userEmail: member.user?.properties?.email,
      });

      return {
        user: {
          id: member.user.properties.id,
          name: member.user.properties.name,
          email: member.user.properties.email,
        },
        role: member.role,
        joinedAt: member.joinedAt,
      };
    });

    console.log(`[Teams API] Returning members:`, responseMembers);

    return new Response(
      JSON.stringify({
        members: responseMembers,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Teams API] Error getting members:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to get team members",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
