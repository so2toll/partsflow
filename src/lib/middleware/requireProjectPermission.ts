/**
 * Project Permission Middleware
 *
 * Middleware for protecting API routes that require project permissions
 *
 * @module lib/middleware/requireProjectPermission
 */

import type { APIRoute } from "astro";
import {
  canViewProject,
  canEditProject,
  canDeleteProject,
  canManageProject,
} from "../services/ProjectPermissionService";
import { getSession } from "../auth/session-adapter";
import { isSystemAdmin } from "../auth/auth";

/**
 * Check if user is an organization admin
 */
function isAdmin(userRole: string): boolean {
  return userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "superadmin";
}

/**
 * Middleware wrapper that requires the user to have view access to a project
 * Organization admins and System SuperAdmins can view all projects in their org
 *
 * @param handler The API route handler to wrap
 * @returns Wrapped handler that checks for project view permission
 */
export const requireProjectView = (handler: APIRoute): APIRoute => {
  return async (context) => {
    const { params, request, cookies } = context;
    const projectId = params.id;

    // Get current user
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      console.log("[ProjectPerm] ❌ Unauthorized - no session");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[ProjectPerm] 🔍 Checking view permissions for project:", projectId);
    console.log("[ProjectPerm] 👤 Session user:", {
      email: session.user.email,
      id: session.user.id,
      global_id: session.user.global_id,
      role: session.user.role,
      organizationId: session.user.organizationId,
    });

    // System SuperAdmins can view any project across all organizations
    if (isSystemAdmin(session)) {
      console.log("[ProjectPerm] ✅ SuperAdmin - granted");
      return handler(context);
    }

    // Organization admins can view any project in their org
    if (isAdmin(session.user.role)) {
      console.log("[ProjectPerm] ✅ Organization Admin - granted");
      return handler(context);
    }

    console.log("[ProjectPerm] ⚠️  Not SuperAdmin or Org Admin, checking project access...");

    // Check if user has view access (use global_id for app db lookups)
    const userId = session.user.global_id || session.user.id;
    console.log("[ProjectPerm] 🔑 Using userId for project check:", userId);

    const canView = await canViewProject(userId, projectId);
    console.log("[ProjectPerm] 🎯 Can view project?", canView);

    if (!canView) {
      console.log("[ProjectPerm] ❌ Forbidden - no view access");
      return new Response(
        JSON.stringify({ error: "Forbidden: You do not have access to this project" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[ProjectPerm] ✅ View access granted");
    return handler(context);
  };
};

/**
 * Middleware wrapper that requires the user to have edit access to a project
 * Organization admins and System SuperAdmins can edit all projects in their org
 *
 * @param handler The API route handler to wrap
 * @returns Wrapped handler that checks for project edit permission
 */
export const requireProjectEdit = (handler: APIRoute): APIRoute => {
  return async (context) => {
    const { params, request, cookies } = context;
    const projectId = params.id;

    // Get current user
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[ProjectPerm] 🔍 Checking edit permissions for project:", projectId);

    // System SuperAdmins can edit any project across all organizations
    if (isSystemAdmin(session)) {
      console.log("[ProjectPerm] ✅ SuperAdmin - granted");
      return handler(context);
    }

    // Organization admins can edit any project in their org
    if (isAdmin(session.user.role)) {
      console.log("[ProjectPerm] ✅ Organization Admin - granted");
      return handler(context);
    }

    // Check if user has edit access (use global_id for app db lookups)
    const userId = session.user.global_id || session.user.id;
    console.log("[ProjectPerm] 🔑 Using userId for project check:", userId);

    const canEdit = await canEditProject(userId, projectId);
    console.log("[ProjectPerm] 🎯 Can edit project?", canEdit);

    if (!canEdit) {
      console.log("[ProjectPerm] ❌ Forbidden - no edit access");
      return new Response(
        JSON.stringify({ error: "Forbidden: You do not have edit access to this project" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[ProjectPerm] ✅ Edit access granted");
    return handler(context);
  };
};

/**
 * Middleware wrapper that requires the user to be a project owner
 * Only project owners can delete projects or manage settings
 *
 * @param handler The API route handler to wrap
 * @returns Wrapped handler that checks for project owner permission
 */
export const requireProjectOwner = (handler: APIRoute): APIRoute => {
  return async (context) => {
    const { params, request, cookies } = context;
    const projectId = params.id;

    // Get current user
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[ProjectPerm] 🔍 Checking owner permissions for project:", projectId);

    // System SuperAdmins can manage any project
    if (isSystemAdmin(session)) {
      console.log("[ProjectPerm] ✅ SuperAdmin - granted");
      return handler(context);
    }

    // Organization admins can manage any project in their org
    if (isAdmin(session.user.role)) {
      console.log("[ProjectPerm] ✅ Organization Admin - granted");
      return handler(context);
    }

    // Check if user is project owner (use global_id for app db lookups)
    const userId = session.user.global_id || session.user.id;
    console.log("[ProjectPerm] 🔑 Using userId for project check:", userId);

    const canManage = await canManageProject(userId, projectId);
    console.log("[ProjectPerm] 🎯 Can manage project?", canManage);

    if (!canManage) {
      console.log("[ProjectPerm] ❌ Forbidden - not a project owner");
      return new Response(
        JSON.stringify({ error: "Forbidden: Only project owners can perform this action" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[ProjectPerm] ✅ Owner access granted");
    return handler(context);
  };
};
