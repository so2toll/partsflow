/**
 * Update Organization Member Role API Endpoint
 *
 * Updates a user's organization-level role
 * Only SuperAdmin and Org Admins can change roles
 *
 * PUT /api/organizations/{id}/members/{userId}/role
 * Body: { role: "Admin" | "User" | "Viewer" }
 */

import type { APIRoute } from "astro";
import { graph } from "../../../../../../lib/db/graph";
import { getSession } from "../../../../../../lib/auth/session-adapter";
import { isSystemAdmin } from "../../../../../../lib/auth/auth";
import { organizationRepository } from "../../../../../../lib/db/repositories/OrganizationRepository";
import { logTeamMemberRoleChange } from "../../../../../../lib/services/AuditService";
import { auth } from "../../../../../../lib/auth/auth";

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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
    const targetUserId = params.userId;
    const { role } = await request.json();

    if (!role || !["Admin", "User", "Viewer"].includes(role)) {
      return new Response(
        JSON.stringify({
          error: "Invalid role. Must be Admin, User, or Viewer",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check permissions
    const isSuperAdminRole = isSystemAdmin(session);

    if (!isSuperAdminRole) {
      // For regular admins, check they're an admin of this org
      // Use global_id if available, otherwise fall back to id for backward compatibility
      const userId = session.user.global_id || session.user.id;
      const usersOrg = await organizationRepository.findByUserId(userId);

      if (!usersOrg || usersOrg.id !== organizationId || session.user.role !== "Admin") {
        return new Response(
          JSON.stringify({
            error: "Forbidden: Must be a System SuperAdmin or Organization Admin",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Verify target user is in this organization
    const orgMembers = await organizationRepository.getUsers(organizationId);
    const targetMember = orgMembers.find(m => m.user.properties.id === targetUserId);

    if (!targetMember) {
      return new Response(
        JSON.stringify({
          error: "User not found in this organization",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prevent removing the last admin
    const oldRole = targetMember.role;
    if (oldRole === "Admin" && role !== "Admin") {
      const adminCount = orgMembers.filter(m => m.role === "Admin").length;
      if (adminCount <= 1) {
        return new Response(
          JSON.stringify({
            error: "Cannot change role: Organization must have at least one Admin",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update user's role in User node properties (app.db)
    await graph.query<any>(
      `
      MATCH (u:User {id: $userId})
      SET u.role = $role
      RETURN u
      `,
      { userId: targetUserId, role }
    );

    // Sync role to auth.db (Better Auth) using email as the link
    try {
      const db = (auth as any).database;
      const tableName = (auth as any).user?.tableName || "user";

      // Get the target user's email from app.db
      const userResult = await graph.query<any>(
        `
        MATCH (u:User {id: $userId})
        RETURN u.email as email
        `,
        { userId: targetUserId }
      );

      const userEmail = userResult[0]?.email;
      if (userEmail) {
        await db
          .prepare(`UPDATE ${tableName} SET role = ? WHERE email = ?`)
          .bind(role, userEmail)
          .execute();
        console.log(`[OrgRole] Synced role ${role} to auth.db for ${userEmail}`);
      }
    } catch (authError) {
      // Log error but don't fail the role change
      console.error("[OrgRole] Error syncing role to auth.db:", authError);
    }

    // Log the role change
    try {
      // Use global_id if available, otherwise fall back to id for backward compatibility
      const performedBy = session.user.global_id || session.user.id;
      await logTeamMemberRoleChange(
        performedBy,
        targetUserId,
        organizationId,
        "N/A", // No team context for org role changes
        oldRole,
        role
      );
    } catch (auditError) {
      console.error("Error logging org member role change:", auditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: targetUserId,
        newRole: role,
        previousRole: oldRole,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[OrgMembers] Error updating member role:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to update member role",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};