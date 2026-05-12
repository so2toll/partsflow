/**
 * Astro Permission Middleware
 *
 * Middleware functions for protecting Astro routes based on user permissions.
 * These functions throw errors with redirectTo properties that can be caught
 * in try/catch blocks in Astro pages for graceful redirects.
 *
 * @module lib/middleware/requirePermission
 * @version 1.0.0
 */

import type { AstroCookies, AstroRequest } from "astro";
import { getSession, UnifiedSession } from "../auth/session-adapter";
import {
  canEditProject,
  canViewProject,
  canDeleteProject,
  canInviteToProject,
  canViewTeam,
  canManageTeam,
  canManageUsers,
  canCreateTeams,
  canCreateProjects,
  isOrgAdmin,
} from "../services/PermissionService";

// ============================================================================
// Types
// ============================================================================

/**
 * Error thrown when permission check fails
 * Includes redirectTo property for handling redirects
 */
export class PermissionError extends Error {
  redirectTo: string;
  permission: string;

  constructor(message: string, redirectTo: string, permission: string) {
    super(message);
    this.name = "PermissionError";
    this.redirectTo = redirectTo;
    this.permission = permission;
  }
}

/**
 * Middleware context passed to permission functions
 */
export interface MiddlewareContext {
  request: AstroRequest;
  cookies: AstroCookies;
}

// ============================================================================
// Organization-level Permission Middleware
// ============================================================================

/**
 * Require user to be authenticated
 * Throws PermissionError if not authenticated
 *
 * @param context Middleware context
 * @param redirectTo URL to redirect to if not authenticated
 * @returns User session
 */
export async function requireAuth(
  context: MiddlewareContext,
  redirectTo: string = "/login"
): Promise<UnifiedSession> {
  const session = await getSession(context.request, context.cookies);

  if (!session) {
    throw new PermissionError(
      "Authentication required",
      redirectTo,
      "authenticated"
    );
  }

  return session;
}

/**
 * Require user to have Admin role
 * Throws PermissionError if not Admin
 *
 * @param context Middleware context
 * @param redirectTo URL to redirect to if not authorized
 */
export function requireOrgAdmin(
  context: MiddlewareContext,
  redirectTo: string = "/app/dashboard"
): void {
  if (!isOrgAdmin(null)) {
    // Need to get session first
    getSession(context.request, context.cookies).then((session) => {
      if (!isOrgAdmin(session)) {
        throw new PermissionError(
          "Admin access required",
          redirectTo,
          "org_admin"
        );
      }
    });
  }
}

/**
 * Require user to have Admin or User role (not Viewer)
 * Throws PermissionError if Viewer
 *
 * @param context Middleware context
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireEditAccess(
  context: MiddlewareContext,
  redirectTo: string = "/app/dashboard"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);

  if (!session || (session.user.role !== "Admin" && session.user.role !== "User")) {
    throw new PermissionError(
      "Edit access required",
      redirectTo,
      "edit_access"
    );
  }
}

/**
 * Require user to have permission to manage organization users
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireUserManagement(
  context: MiddlewareContext,
  redirectTo: string = "/app/dashboard"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);

  if (!canManageUsers(session)) {
    throw new PermissionError(
      "User management permission required",
      redirectTo,
      "user_management"
    );
  }
}

/**
 * Require user to have permission to create teams
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireCreateTeam(
  context: MiddlewareContext,
  redirectTo: string = "/app/dashboard"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);

  if (!canCreateTeams(session)) {
    throw new PermissionError(
      "Team creation permission required",
      redirectTo,
      "create_team"
    );
  }
}

/**
 * Require user to have permission to create projects
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireCreateProject(
  context: MiddlewareContext,
  redirectTo: string = "/app/dashboard"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);

  if (!canCreateProjects(session)) {
    throw new PermissionError(
      "Project creation permission required",
      redirectTo,
      "create_project"
    );
  }
}

// ============================================================================
// Project Permission Middleware
// ============================================================================

/**
 * Require user to have view access to a project
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param projectId Project ID to check
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireProjectView(
  context: MiddlewareContext,
  projectId: string,
  redirectTo: string = "/app/projects"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);
  const check = await canViewProject(session, projectId);

  if (!check.allowed) {
    throw new PermissionError(
      check.reason || "Project view access required",
      redirectTo,
      "project_view"
    );
  }
}

/**
 * Require user to have edit access to a project
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param projectId Project ID to check
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireProjectEdit(
  context: MiddlewareContext,
  projectId: string,
  redirectTo: string = "/app/projects"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);
  const check = await canEditProject(session, projectId);

  if (!check.allowed) {
    throw new PermissionError(
      check.reason || "Project edit access required",
      redirectTo,
      "project_edit"
    );
  }
}

/**
 * Require user to have delete access to a project
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param projectId Project ID to check
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireProjectDelete(
  context: MiddlewareContext,
  projectId: string,
  redirectTo: string = "/app/projects"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);
  const check = await canDeleteProject(session, projectId);

  if (!check.allowed) {
    throw new PermissionError(
      check.reason || "Project delete access required",
      redirectTo,
      "project_delete"
    );
  }
}

/**
 * Require user to have permission to invite others to a project
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param projectId Project ID to check
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireProjectInvite(
  context: MiddlewareContext,
  projectId: string,
  redirectTo: string = "/app/projects"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);
  const check = await canInviteToProject(session, projectId);

  if (!check.allowed) {
    throw new PermissionError(
      check.reason || "Project invite permission required",
      redirectTo,
      "project_invite"
    );
  }
}

// ============================================================================
// Team Permission Middleware
// ============================================================================

/**
 * Require user to have view access to a team
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param teamId Team ID to check
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireTeamView(
  context: MiddlewareContext,
  teamId: string,
  redirectTo: string = "/app/teams"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);
  const hasAccess = await canViewTeam(session, teamId);

  if (!hasAccess) {
    throw new PermissionError(
      "Team view access required",
      redirectTo,
      "team_view"
    );
  }
}

/**
 * Require user to have management access to a team
 * Throws PermissionError if not authorized
 *
 * @param context Middleware context
 * @param teamId Team ID to check
 * @param redirectTo URL to redirect to if not authorized
 */
export async function requireTeamManage(
  context: MiddlewareContext,
  teamId: string,
  redirectTo: string = "/app/teams"
): Promise<void> {
  const session = await getSession(context.request, context.cookies);
  const hasAccess = await canManageTeam(session, teamId);

  if (!hasAccess) {
    throw new PermissionError(
      "Team management permission required",
      redirectTo,
      "team_manage"
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Handle PermissionError in Astro pages
 * Use this in try/catch blocks to gracefully redirect on permission errors
 *
 * @param error Error to check
 * @returns AstroRedirect or null
 */
export function handlePermissionError(error: unknown): ReturnType<typeof Astro.redirect> | null {
  if (error instanceof PermissionError) {
    return Astro.redirect(error.redirectTo);
  }
  return null;
}

/**
 * Wrap a permission middleware call for use in Astro pages
 * Automatically handles PermissionError and redirects
 *
 * @param fn Permission middleware function to call
 * @param args Arguments to pass to the function
 * @returns Astro redirect or undefined
 */
export async function withPermissionCheck<T extends any[]>(
  fn: (context: MiddlewareContext, ...args: T) => Promise<void> | void,
  context: MiddlewareContext,
  ...args: T
): Promise<ReturnType<typeof Astro.redirect> | undefined> {
  try {
    await fn(context, ...args);
  } catch (error) {
    const redirect = handlePermissionError(error);
    if (redirect) return redirect;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example usage in an Astro page:
 *
 * ```astro
 * ---
 * import { requireAuth, requireProjectEdit, handlePermissionError } from "@/lib/middleware/requirePermission";
 *
 * const projectId = "proj_123";
 *
 * try {
 *   // Require authentication
 *   const session = await requireAuth({ request, cookies });
 *
 *   // Require project edit permission
 *   await requireProjectEdit({ request, cookies }, projectId);
 * } catch (error) {
 *   const redirect = handlePermissionError(error);
 *   if (redirect) return redirect;
 * }
 *
 * // ... rest of your page code
 * ---
 * ```
 */
