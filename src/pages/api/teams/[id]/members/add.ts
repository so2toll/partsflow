/**
 * Add Team Member API Endpoint
 *
 * Adds a user to a team with a specific role
 * Requires team admin permission
 *
 * POST /api/teams/{id}/members/add
 * Body: { email: string, role: string }
 */

import type { APIRoute } from "astro";
import { teamRepository } from "../../../../../lib/db/repositories/TeamRepository";
import { graph } from "../../../../../lib/db/graph";
import { getSession } from "../../../../../lib/auth/session-adapter";
import { requireTeamAdmin } from "../../../../../lib/middleware/requireTeamPermission";
import { canChangeMemberRole } from "../../../../../lib/services/TeamPermissionService";

const addMemberHandler: APIRoute = async ({ params, request, cookies }) => {
  try {
    const teamId = params.id;
    const { email, role } = await request.json();

    if (!teamId || !email || !role) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: teamId, email, role",
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

    // Find user by email
    const userResults = await graph.query<any>(
      `
      MATCH (u:User {email: $email})
      RETURN u
      `,
      { email }
    );

    if (!userResults || userResults.length === 0) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          details: `No user found with email: ${email}`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = userResults[0].u.properties.id;

    console.log(`[Teams] Adding user ${userId} (${email}) to team ${teamId} as ${role}`);

    // Check if user is already a member
    const existingMembers = await teamRepository.getMembers(teamId);
    const existingMember = existingMembers.find(m => m.user.properties.id === userId);

    if (existingMember) {
      // User is already a member - check if role change is allowed
      console.log(`[Teams] User ${userId} is already a member with role ${existingMember.role}, changing to ${role}`);

      if (existingMember.role !== role) {
        // Check if role change is allowed
        const roleCheck = await canChangeMemberRole(
          performedBy,
          userId,
          teamId,
          role as "Admin" | "User" | "Viewer"
        );

        if (!roleCheck.allowed) {
          console.log(`[Teams] Role change not allowed: ${roleCheck.reason}`);
          return new Response(
            JSON.stringify({
              error: roleCheck.reason || "Cannot change member role",
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Role change is allowed - update it
        await teamRepository.updateMemberRole(teamId, userId, role as "Admin" | "User" | "Viewer", performedBy);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: existingMember.role !== role ? "Member role updated" : "Member already has this role",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add new member to team
    await teamRepository.addMember(teamId, userId, role as "Admin" | "User" | "Viewer", performedBy);

    console.log(`[Teams] Added user ${userId} to team ${teamId}`);

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
    console.error("[Teams] Error adding member:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to add member to team",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST = requireTeamAdmin(addMemberHandler);
