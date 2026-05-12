/**
 * Team Permission Middleware
 *
 * Middleware for protecting API routes that require team permissions
 *
 * @module lib/middleware/requireTeamPermission
 */

import type { APIRoute } from "astro";
import { canManageTeam, canRemoveMember } from "../services/TeamPermissionService";
import { getSession } from "../auth/session-adapter";
import { isSystemAdmin } from "../auth/auth";

/**
 * Check if user is an organization admin or system admin
 */
function isAdmin(userRole: string): boolean {
  return userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "superadmin";
}

/**
 * Middleware wrapper that requires the user to be a team admin
 * Organization admins and System SuperAdmins can manage any team
 *
 * @param handler The API route handler to wrap
 * @returns Wrapped handler that checks for team admin permission
 */
export const requireTeamAdmin = (handler: APIRoute): APIRoute => {
  return async (context) => {
    const { params, request, cookies } = context;
    const teamId = params.id;

    // Get current user
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      console.log("[TeamPerm] ❌ Unauthorized - no session");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[TeamPerm] 🔍 Checking permissions for team:", teamId);
    console.log("[TeamPerm] 👤 Session user:", {
      email: session.user.email,
      id: session.user.id,
      global_id: session.user.global_id,
      role: session.user.role,
      organizationId: session.user.organizationId,
    });

    // System SuperAdmins can manage any team across all organizations
    if (isSystemAdmin(session)) {
      console.log("[TeamPerm] ✅ SuperAdmin - granted");
      return handler(context);
    }

    // Organization admins can manage any team in their org
    if (isAdmin(session.user.role)) {
      console.log("[TeamPerm] ✅ Organization Admin - granted");
      return handler(context);
    }

    console.log("[TeamPerm] ⚠️  Not SuperAdmin or Org Admin, checking team membership...");

    // Check if user is team admin (use global_id for app db lookups)
    const userId = session.user.global_id || session.user.id;
    console.log("[TeamPerm] 🔑 Using userId for team check:", userId);

    const canManage = await canManageTeam(userId, teamId);
    console.log("[TeamPerm] 🎯 Can manage team?", canManage);

    if (!canManage) {
      console.log("[TeamPerm] ❌ Forbidden - not a team admin");
      return new Response(
        JSON.stringify({ error: "Forbidden: Must be a team admin" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[TeamPerm] ✅ Team Admin - granted");
    return handler(context);
  };
};

/**
 * Middleware wrapper that checks if user can remove a member
 * System SuperAdmins and Organization admins can remove any member (except team creators)
 *
 * @param handler The API route handler to wrap
 * @returns Wrapped handler that checks for member removal permission
 */
export const requireCanRemoveMember = (handler: APIRoute): APIRoute => {
  return async (context) => {
    const { params, request, cookies } = context;
    const teamId = params.id;

    // Get current user
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get target user ID from request body
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.userId;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "Missing userId in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // System SuperAdmins and Organization admins can remove any member
    // (except team creators, which is checked in the repository)
    if (!isAdmin(session.user.role)) {
      // For regular users, check team-level permissions
      // Use global_id for app db lookups
      const actorUserId = session.user.global_id || session.user.id;
      const canRemove = await canRemoveMember(actorUserId, targetUserId, teamId);
      if (!canRemove) {
        return new Response(
          JSON.stringify({
            error: "Forbidden: Cannot remove this member",
            reason: "You must be a team admin and cannot remove other admins or yourself if you're the last admin",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Create a new request with the original body for the handler
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(body),
    });

    return handler({ ...context, request: newRequest });
  };
};
