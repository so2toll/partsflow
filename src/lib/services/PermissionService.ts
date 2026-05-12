/**
 * Permission Service
 *
 * Provides helper functions for checking user permissions
 * across organizations, teams, and projects.
 *
 * Permission Priority:
 * 1. Direct project permission (highest)
 * 2. Team membership role
 * 3. Organization role (lowest)
 *
 * @module lib/services/PermissionService
 */

import { projectRepository } from "../db/repositories/ProjectRepository";
import { teamRepository } from "../db/repositories/TeamRepository";
import { organizationRepository } from "../db/repositories/OrganizationRepository";
import { getSession, UnifiedSession } from "../auth/session-adapter";
import type { EffectivePermission } from "../db/repositories/ProjectRepository";

// ============================================================================
// Types
// ============================================================================

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
  permission: EffectivePermission | null;
}

// ============================================================================
// Project Permission Checks
// ============================================================================

/**
 * Check if a user can edit a project
 *
 * @param session User session
 * @param projectId Project ID
 * @returns True if user can edit
 */
export async function canEditProject(
  session: UnifiedSession | null,
  projectId: string
): Promise<PermissionCheckResult> {
  if (!session) {
    return {
      allowed: false,
      reason: "Not authenticated",
      permission: null,
    };
  }

  const permission = await projectRepository.getEffectivePermission(
    session.user.id,
    projectId,
    session.user.role
  );

  return {
    allowed: permission.canEdit,
    reason: permission.canEdit
      ? `Can edit via ${permission.source}`
      : `No edit permission (role: ${permission.role})`,
    permission,
  };
}

/**
 * Check if a user can view a project
 *
 * @param session User session
 * @param projectId Project ID
 * @returns True if user can view
 */
export async function canViewProject(
  session: UnifiedSession | null,
  projectId: string
): Promise<PermissionCheckResult> {
  if (!session) {
    return {
      allowed: false,
      reason: "Not authenticated",
      permission: null,
    };
  }

  const permission = await projectRepository.getEffectivePermission(
    session.user.id,
    projectId,
    session.user.role
  );

  return {
    allowed: permission.canView,
    reason: permission.canView
      ? `Can view via ${permission.source}`
      : `No view permission (role: ${permission.role})`,
    permission,
  };
}

/**
 * Check if a user can delete a project
 *
 * @param session User session
 * @param projectId Project ID
 * @returns True if user can delete
 */
export async function canDeleteProject(
  session: UnifiedSession | null,
  projectId: string
): Promise<PermissionCheckResult> {
  if (!session) {
    return {
      allowed: false,
      reason: "Not authenticated",
      permission: null,
    };
  }

  const permission = await projectRepository.getEffectivePermission(
    session.user.id,
    projectId,
    session.user.role
  );

  return {
    allowed: permission.canDelete,
    reason: permission.canDelete
      ? `Can delete via ${permission.source}`
      : `No delete permission (role: ${permission.role})`,
    permission,
  };
}

/**
 * Check if a user can invite others to a project
 *
 * @param session User session
 * @param projectId Project ID
 * @returns True if user can invite
 */
export async function canInviteToProject(
  session: UnifiedSession | null,
  projectId: string
): Promise<PermissionCheckResult> {
  if (!session) {
    return {
      allowed: false,
      reason: "Not authenticated",
      permission: null,
    };
  }

  const permission = await projectRepository.getEffectivePermission(
    session.user.id,
    projectId,
    session.user.role
  );

  return {
    allowed: permission.canInvite,
    reason: permission.canInvite
      ? `Can invite via ${permission.source}`
      : `No invite permission (role: ${permission.role})`,
    permission,
  };
}

// ============================================================================
// Team Permission Checks
// ============================================================================

/**
 * Check if a user can view a team
 *
 * @param session User session
 * @param teamId Team ID
 * @returns True if user can view
 */
export async function canViewTeam(
  session: UnifiedSession | null,
  teamId: string
): Promise<boolean> {
  if (!session) {
    return false;
  }

  // Admins can view all teams in their org
  if (session.user.role === "Admin") {
    return true;
  }

  // Check if user is a member of the team
  const teams = await teamRepository.findByUserId(session.user.id);
  return teams.some((t) => t.team.id === teamId);
}

/**
 * Check if a user can manage a team (add/remove members)
 *
 * @param session User session
 * @param teamId Team ID
 * @returns True if user can manage
 */
export async function canManageTeam(
  session: UnifiedSession | null,
  teamId: string
): Promise<boolean> {
  if (!session) {
    return false;
  }

  // Admins can manage all teams in their org
  if (session.user.role === "Admin") {
    return true;
  }

  // Check if user is a team admin
  const teams = await teamRepository.findByUserId(session.user.id);
  const team = teams.find((t) => t.team.id === teamId);

  return team?.role === "Admin";
}

/**
 * Check if a user can edit team membership
 *
 * @param session User session
 * @param teamId Team ID
 * @returns True if user can edit membership
 */
export async function canEditTeamMembership(
  session: UnifiedSession | null,
  teamId: string
): Promise<boolean> {
  return canManageTeam(session, teamId);
}

// ============================================================================
// Organization Permission Checks
// ============================================================================

/**
 * Check if a user is an admin of their organization
 *
 * @param session User session
 * @returns True if user is org admin
 */
export function isOrgAdmin(session: UnifiedSession | null): boolean {
  return session?.user.role === "Admin";
}

/**
 * Check if a user can manage users in their organization
 *
 * @param session User session
 * @returns True if user can manage users
 */
export function canManageUsers(session: UnifiedSession | null): boolean {
  return session?.user.role === "Admin";
}

/**
 * Check if a user can manage organization settings
 *
 * @param session User session
 * @returns True if user can manage settings
 */
export function canManageOrgSettings(session: UnifiedSession | null): boolean {
  return session?.user.role === "Admin";
}

/**
 * Check if a user can create teams in their organization
 *
 * @param session User session
 * @returns True if user can create teams
 */
export function canCreateTeams(session: UnifiedSession | null): boolean {
  if (!session) return false;
  return session.user.role === "Admin" || session.user.role === "User";
}

/**
 * Check if a user can create projects in their organization
 *
 * @param session User session
 * @returns True if user can create projects
 */
export function canCreateProjects(session: UnifiedSession | null): boolean {
  if (!session) return false;
  return session.user.role === "Admin" || session.user.role === "User";
}

// ============================================================================
// Astro Helper Functions
// ============================================================================

/**
 * Astro middleware helper to require project edit permission
 * Throws redirect if user doesn't have permission
 *
 * @param session User session from getSession()
 * @param projectId Project ID
 * @param redirectTo URL to redirect to if not allowed
 */
export async function requireProjectEdit(
  session: UnifiedSession | null,
  projectId: string,
  redirectTo: string = "/app/projects"
): Promise<void> {
  const check = await canEditProject(session, projectId);
  if (!check.allowed) {
    const error = new Error("Unauthorized");
    (error as any).redirectTo = redirectTo;
    throw error;
  }
}

/**
 * Astro middleware helper to require project view permission
 *
 * @param session User session from getSession()
 * @param projectId Project ID
 * @param redirectTo URL to redirect to if not allowed
 */
export async function requireProjectView(
  session: UnifiedSession | null,
  projectId: string,
  redirectTo: string = "/app/projects"
): Promise<void> {
  const check = await canViewProject(session, projectId);
  if (!check.allowed) {
    const error = new Error("Unauthorized");
    (error as any).redirectTo = redirectTo;
    throw error;
  }
}

/**
 * Astro middleware helper to require admin role
 *
 * @param session User session from getSession()
 * @param redirectTo URL to redirect to if not allowed
 */
export function requireAdmin(
  session: UnifiedSession | null,
  redirectTo: string = "/app/dashboard"
): void {
  if (!isOrgAdmin(session)) {
    const error = new Error("Unauthorized");
    (error as any).redirectTo = redirectTo;
    throw error;
  }
}

/**
 * Astro middleware helper to require any non-viewer role
 *
 * @param session User session from getSession()
 * @param redirectTo URL to redirect to if not allowed
 */
export function requireEditAccess(
  session: UnifiedSession | null,
  redirectTo: string = "/app/dashboard"
): void {
  if (!session || (session.user.role !== "Admin" && session.user.role !== "User")) {
    const error = new Error("Unauthorized");
    (error as any).redirectTo = redirectTo;
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all accessible project IDs for a user
 *
 * @param session User session
 * @returns Array of project IDs user can access
 */
export async function getAccessibleProjectIds(
  session: UnifiedSession | null
): Promise<string[]> {
  if (!session) {
    return [];
  }

  const projectIds = new Set<string>();

  // 1. Get all projects in user's organization
  const org = await organizationRepository.findById(session.user.organizationId!);
  if (org) {
    const projects = await projectRepository.findByOrgId(org.id);
    projects.projects.forEach((p) => projectIds.add(p.id));
  }

  // 2. Get projects from team memberships
  const teams = await teamRepository.findByUserId(session.user.id);
  for (const team of teams) {
    const teamProjects = await projectRepository.getTeams(team.team.id);
    teamProjects.forEach((t: any) => {
      // Extract project IDs from teams' WORKS_ON relationships
      // This would need to be implemented in ProjectRepository
    });
  }

  return Array.from(projectIds);
}

/**
 * Filter projects by user's access level
 *
 * @param session User session
 * @param projectIds Array of project IDs to filter
 * @returns Array of project IDs user can access
 */
export async function filterAccessibleProjects(
  session: UnifiedSession | null,
  projectIds: string[]
): Promise<string[]> {
  if (!session) {
    return [];
  }

  const accessible: string[] = [];

  for (const projectId of projectIds) {
    const check = await canViewProject(session, projectId);
    if (check.allowed) {
      accessible.push(projectId);
    }
  }

  return accessible;
}

// ============================================================================
// Video AI Permission Checks
// ============================================================================

import { VIDEO_AI_ROLES, VIDEO_AI_PERMISSIONS } from '../configs/rbacConfig.js';

/**
 * Check if a user has a specific Video AI permission
 * Supports wildcards: video:* matches video:create, video:read, etc.
 *
 * @param userId User ID
 * @param organizationId Organization ID
 * @param permission Permission string (e.g., 'video:create')
 * @returns True if user has permission
 */
export async function hasPermission(
  userId: string,
  organizationId: string | null,
  permission: string
): Promise<boolean> {
  // Get user's session/role - this would need to be passed in or fetched
  // For now, simplified implementation that checks role permissions
  return hasPermissionByRole(null, permission);
}

/**
 * Check if a role has a specific permission
 *
 * @param userRole User's role (from session)
 * @param permission Permission string
 * @returns True if role has permission
 */
export function hasPermissionByRole(
  userRole: string | null,
  permission: string
): boolean {
  if (!userRole) return false;

  const roleConfig = VIDEO_AI_ROLES[userRole as keyof typeof VIDEO_AI_ROLES];
  if (!roleConfig) return false;

  // Check for wildcard permission (*)
  if (roleConfig.permissions.includes('*')) {
    return true;
  }

  // Check for exact match
  if (roleConfig.permissions.includes(permission)) {
    return true;
  }

  // Check for wildcard category (e.g., video:*)
  const [category] = permission.split(':');
  const wildcardPermission = `${category}:*`;
  if (roleConfig.permissions.includes(wildcardPermission)) {
    return true;
  }

  return false;
}

/**
 * Check if user can generate videos (requires active subscription + permission)
 */
export function canGenerateVideo(
  session: UnifiedSession | null,
  plan: string = 'free',
  usedMinutes: number = 0
): boolean {
  if (!session) return false;

  // Check permission
  const hasPermission = hasPermissionByRole(session.user.role, VIDEO_AI_PERMISSIONS.VIDEO_GENERATE);
  if (!hasPermission) return false;

  // Check quota (simplified - should use actual plan limits)
  const limits: Record<string, number> = {
    free: 5,
    creator: 60,
    pro: 300,
    enterprise: Infinity,
  };

  return usedMinutes < (limits[plan] || 0);
}

/**
 * Check if user can upload assets
 */
export function canUploadAssets(session: UnifiedSession | null): boolean {
  if (!session) return false;
  return hasPermissionByRole(session.user.role, VIDEO_AI_PERMISSIONS.ASSET_UPLOAD);
}

/**
 * Check if user can manage billing
 */
export function canManageBilling(session: UnifiedSession | null): boolean {
  if (!session) return false;
  return hasPermissionByRole(session.user.role, VIDEO_AI_PERMISSIONS.BILLING_MANAGE);
}

/**
 * Check if user can create characters
 */
export function canCreateCharacters(session: UnifiedSession | null): boolean {
  if (!session) return false;
  return hasPermissionByRole(session.user.role, VIDEO_AI_PERMISSIONS.CHARACTER_CREATE);
}

/**
 * Check if user can delete videos
 */
export function canDeleteVideos(session: UnifiedSession | null): boolean {
  if (!session) return false;
  return hasPermissionByRole(session.user.role, VIDEO_AI_PERMISSIONS.VIDEO_DELETE);
}

/**
 * Get all permissions for a role
 * Expands wildcards into full permission list
 */
export function getRolePermissions(userRole: string): string[] {
  const roleConfig = VIDEO_AI_ROLES[userRole as keyof typeof VIDEO_AI_ROLES];
  if (!roleConfig) return [];

  if (roleConfig.permissions.includes('*')) {
    // Return all permissions
    return Object.values(VIDEO_AI_PERMISSIONS);
  }

  const expanded: string[] = [];
  for (const perm of roleConfig.permissions) {
    if (perm.endsWith(':*')) {
      // Expand wildcard
      const category = perm.replace(':*', '');
      const categoryPerms = Object.values(VIDEO_AI_PERMISSIONS).filter(p =>
        p.startsWith(`${category}:`)
      );
      expanded.push(...categoryPerms);
    } else {
      expanded.push(perm);
    }
  }

  return [...new Set(expanded)]; // Remove duplicates
}
