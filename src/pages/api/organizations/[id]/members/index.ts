/**
 * Get Organization Members API Endpoint
 *
 * Returns all members of an organization with their roles
 * Organization Admins can see this for their org, SuperAdmin can see all orgs
 *
 * GET /api/organizations/{id}/members
 */

import type { APIRoute } from "astro";
import { organizationRepository } from "../../../../../lib/db/repositories/OrganizationRepository";
import { teamRepository } from "../../../../../lib/db/repositories/TeamRepository";
import { getSession } from "../../../../../lib/auth/session-adapter";
import { isSystemAdmin } from "../../../../../lib/auth/auth";

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = await getSession(request, cookies);

    if (!session?.user?.id) {
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

    const organizationId = params.id;

    // Check permissions: SuperAdmin or Org Admin can view members
    const isSuperAdminRole = session.user.role === "SuperAdmin";
    const isOrgAdmin = session.user.role === "Admin";

    if (!isSuperAdminRole && !isOrgAdmin) {
      return new Response(
        JSON.stringify({
          error: "Forbidden: Must be an Admin",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For Org Admins, verify they're in this organization
    if (!isSuperAdminRole && isOrgAdmin) {
      // Use global_id if available, otherwise fall back to id for backward compatibility
      const userId = session.user.global_id || session.user.id;
      const usersOrg = await organizationRepository.findByUserId(userId);
      if (!usersOrg || usersOrg.id !== organizationId) {
        return new Response(
          JSON.stringify({
            error: "Forbidden: You can only view members of your own organization",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get all users in the organization
    const users = await organizationRepository.getUsers(organizationId);

    // Get all teams in the organization to show team memberships
    const teamsResult = await teamRepository.findByOrgId(organizationId);
    const teams = teamsResult.teams;

    // For each user, get their team memberships
    const membersWithTeams = await Promise.all(
      users.map(async (user) => {
        // Get teams this user is a member of
        const userTeams = await teamRepository.findByUserId(user.user.properties.id);

        return {
          id: user.user.properties.id,
          email: user.user.properties.email,
          name: user.user.properties.name,
          role: user.role, // Organization-level role
          joinedAt: user.joinedAt,
          teams: userTeams.map((ut) => ({
            id: ut.team.id,
            name: ut.team.name,
            role: ut.role, // Team-level role
          })),
        };
      })
    );

    return new Response(
      JSON.stringify({
        organizationId,
        members: membersWithTeams,
        total: membersWithTeams.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[OrgMembers] Error fetching members:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch organization members",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
