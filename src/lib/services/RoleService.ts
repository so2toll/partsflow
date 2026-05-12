/**
 * Role Service
 *
 * Handles role management for users including:
 * - Updating Better Auth user roles
 * - Syncing roles with graph database User nodes
 * - Validating role change permissions
 * - Logging all role changes to audit log
 *
 * Valid roles: Admin, User, Viewer
 */

import { auth } from "../auth/auth";
import { graph } from "../db/graph";
import { getSession, hasRole, isAuthenticated } from "../auth/session-adapter";
import { logRoleChange } from "./AuditService";

// ============================================================================
// Types
// ============================================================================

export type UserRole = "Admin" | "User" | "Viewer";

export interface RoleUpdateResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ============================================================================
// Role Validation
// ============================================================================

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return ["Admin", "User", "Viewer"].includes(role);
}

/**
 * Get role hierarchy level for permission checks
 * Higher number = more permissions
 */
export function getRoleLevel(role: UserRole): number {
  const hierarchy = { Admin: 3, User: 2, Viewer: 1 };
  return hierarchy[role] || 0;
}

/**
 * Check if a user can grant a specific role
 * User can only grant roles at or below their own level
 */
export function canGrantRole(granterRole: UserRole, targetRole: UserRole): boolean {
  return getRoleLevel(granterRole) >= getRoleLevel(targetRole);
}

// ============================================================================
// Role Management
// ============================================================================

/**
 * Update a user's role in both Better Auth and graph database
 *
 * @param targetUserId ID of the user whose role is being changed (can be global_id or Better Auth ID)
 * @param newRole New role to assign (Admin, User, Viewer)
 * @param requesterRequest Request object from the user making the change
 * @param requesterCookies Cookies from the user making the change
 * @returns Result object with success status and message
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: string,
  requesterRequest: Request,
  requesterCookies: any
): Promise<RoleUpdateResult> {
  // Validate the new role
  if (!isValidRole(newRole)) {
    return {
      success: false,
      message: `Invalid role: ${newRole}. Valid roles are: Admin, User, Viewer`,
    };
  }

  // Check if requester is authenticated
  const requesterSession = await getSession(requesterRequest, requesterCookies);
  if (!requesterSession) {
    return {
      success: false,
      message: "You must be authenticated to change roles",
    };
  }

  // Check if requester is an admin
  const requesterRole = requesterSession.user.role as UserRole;
  if (requesterRole !== "Admin") {
    return {
      success: false,
      message: "Only admins can change user roles",
    };
  }

  // Get all users from Better Auth
  const targetUserList = await auth.api.listUsers({
    headers: requesterRequest.headers,
  });

  // Determine if targetUserId is a global_id (app DB ULID) or Better Auth ID
  const isGlobalId = targetUserId.startsWith("user_");
  let targetUser: any;
  let betterAuthUserId: string;
  let appDbUserId: string;

  if (isGlobalId) {
    // targetUserId is a global_id - find user by global_id in Better Auth
    targetUser = (targetUserList as any)?.users?.find(
      (u: any) => u.global_id === targetUserId
    );

    if (!targetUser) {
      return {
        success: false,
        message: "User not found (global_id not linked in auth.db)",
      };
    }

    betterAuthUserId = targetUser.id;
    appDbUserId = targetUserId;
  } else {
    // targetUserId is a Better Auth ID - find user directly
    targetUser = (targetUserList as any)?.users?.find(
      (u: any) => u.id === targetUserId
    );

    if (!targetUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    betterAuthUserId = targetUserId;
    appDbUserId = targetUser.global_id || targetUserId;
  }

  // Check if requester and target user are in the same organization
  if (
    requesterSession.user.organizationId &&
    (targetUser as any).organizationId !== requesterSession.user.organizationId
  ) {
    return {
      success: false,
      message: "You can only change roles for users in your organization",
    };
  }

  // Prevent users from changing their own role
  // Use global_id if available, otherwise fall back to id for backward compatibility
  const requesterId = requesterSession.user.global_id || requesterSession.user.id;
  if (requesterId === appDbUserId || requesterSession.user.id === betterAuthUserId) {
    return {
      success: false,
      message: "You cannot change your own role",
    };
  }

  // Get the current role before changing (for audit log)
  const oldRole = (targetUser as any).role || "User";

  try {
    // Update Better Auth user role
    // Note: Better Auth doesn't have a direct update API, so we'll use the database
    // This is a workaround - in production you'd want a proper API endpoint
    const db = (auth as any).database;
    const tableName = (auth as any).user?.tableName || "user";

    await db
      .prepare(`UPDATE ${tableName} SET role = ? WHERE id = ?`)
      .bind(newRole, betterAuthUserId)
      .execute();

    // Update graph database User node (use appDbUserId which is the global_id)
    await graph.query(
      `
      MATCH (u:User {id: $userId})
      SET u.role = $role
      RETURN u
      `,
      { userId: appDbUserId, role: newRole }
    );

    // Log the role change to audit log (use appDbUserId for consistency)
    try {
      await logRoleChange(
        requesterSession.user.global_id || requesterSession.user.id,
        appDbUserId,
        requesterSession.user.organizationId!,
        oldRole,
        newRole
      );
    } catch (auditError) {
      // Log error but don't fail the role change
      console.error("Error logging role change:", auditError);
    }

    return {
      success: true,
      message: `Role updated to ${newRole}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: newRole,
      },
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      message: "Failed to update role. Please try again.",
    };
  }
}

/**
 * Get all users in an organization with their roles
 *
 * @param organizationId Organization ID
 * @returns Array of users with their roles
 */
export async function getOrganizationUsers(
  organizationId: string
): Promise<Array<{ id: string; email: string; name?: string; role: string }>> {
  try {
    // Get users from Better Auth
    const allUsers = await auth.api.listUsers();

    // Filter by organization and map to desired format
    const users = (allUsers as any)?.users
      ?.filter((u: any) => u.organizationId === organizationId)
      ?.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role || "User",
      }));

    return users || [];
  } catch (error) {
    console.error("Error getting organization users:", error);
    return [];
  }
}

/**
 * Get a user's role from Better Auth
 *
 * @param userId User ID
 * @returns User role or null
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const allUsers = await auth.api.listUsers();
    const user = (allUsers as any)?.users?.find((u: any) => u.id === userId);
    return user?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}
