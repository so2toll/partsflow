/**
 * Team Permission Service
 *
 * Handles team-level permission checks for RBAC
 *
 * @module lib/services/TeamPermissionService
 */

import { teamRepository } from "../db/repositories/TeamRepository";
import { graph } from "../db/graph";

/**
 * Check if user can manage a team (add/remove members, change roles)
 *
 * @param userId User ID to check
 * @param teamId Team ID to check
 * @returns true if user is a team admin
 */
export async function canManageTeam(
  userId: string,
  teamId: string
): Promise<boolean> {
  const members = await teamRepository.getMembers(teamId);
  const membership = members.find((m) => m.user.properties.id === userId);

  if (!membership) return false;
  return membership.role === "Admin";
}

/**
 * Get a user's system-level role
 * This checks the database for the actual role, not session
 *
 * @param userId User ID
 * @returns User's role (SuperAdmin, Admin, User, Viewer) or null
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const results = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})
    RETURN u.role as role
    `,
    { userId }
  );

  if (results.length === 0) return null;
  return results[0].role || null;
}

/**
 * Check if user is a System SuperAdmin or Organization Admin
 *
 * @param userId User ID to check
 * @returns true if user is SuperAdmin or Admin
 */
export async function isAdminRole(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  if (!role) return false;
  const roleLower = role.toLowerCase();
  return roleLower === "superadmin" || roleLower === "admin";
}

/**
 * Check if user can remove a specific member
 * - Can't remove yourself if you're the last admin
 * - Can't remove other admins unless you're the owner
 *
 * @param actorId User ID performing the action
 * @param targetId User ID to be removed
 * @param teamId Team ID
 * @returns true if removal is allowed
 */
export async function canRemoveMember(
  actorId: string,
  targetId: string,
  teamId: string
): Promise<boolean> {
  const members = await teamRepository.getMembers(teamId);
  const actorMembership = members.find((m) => m.user.properties.id === actorId);
  const targetMembership = members.find((m) => m.user.properties.id === targetId);

  if (!actorMembership || actorMembership.role !== "Admin") return false;

  // Can't remove yourself if you're the only admin
  if (actorId === targetId) {
    const adminCount = members.filter((m) => m.role === "Admin").length;
    return adminCount > 1;
  }

  // Can't remove other admins (unless you're the team creator - future enhancement)
  if (targetMembership?.role === "Admin") return false;

  return true;
}

/**
 * Check if user can edit projects the team works on
 *
 * @param userId User ID to check
 * @param teamId Team ID
 * @returns true if user is User or Admin role in the team
 */
export async function canEditTeamProjects(
  userId: string,
  teamId: string
): Promise<boolean> {
  const members = await teamRepository.getMembers(teamId);
  const membership = members.find((m) => m.user.properties.id === userId);

  if (!membership) return false;
  return membership.role === "User" || membership.role === "Admin";
}

/**
 * Check if user can change a member's role
 * - Can't change your own role (prevent self-demotion)
 * - Can't demote the last admin
 *
 * @param actorId User ID performing the action
 * @param targetId User ID whose role is being changed
 * @param teamId Team ID
 * @param newRole The new role being assigned
 * @returns Object with { allowed: boolean, reason?: string }
 */
export async function canChangeMemberRole(
  actorId: string,
  targetId: string,
  teamId: string,
  newRole: "Admin" | "User" | "Viewer"
): Promise<{ allowed: boolean; reason?: string }> {
  const members = await teamRepository.getMembers(teamId);
  const actorMembership = members.find((m) => m.user.properties.id === actorId);
  const targetMembership = members.find((m) => m.user.properties.id === targetId);

  // Actor must be an Admin
  if (!actorMembership || actorMembership.role !== "Admin") {
    return { allowed: false, reason: "Only team admins can change member roles" };
  }

  // Target must be a member
  if (!targetMembership) {
    return { allowed: false, reason: "Target user is not a member of this team" };
  }

  // Can't change your own role (prevent self-demotion)
  if (actorId === targetId) {
    return { allowed: false, reason: "You cannot change your own role" };
  }

  // Count current admins
  const adminCount = members.filter((m) => m.role === "Admin").length;

  // Can't demote the last admin
  if (targetMembership.role === "Admin" && newRole !== "Admin") {
    if (adminCount <= 1) {
      return { allowed: false, reason: "Cannot demote the last admin - team would have no admin" };
    }
  }

  // Can't promote other admins (redundant but harmless)
  if (targetMembership.role === "Admin" && newRole === "Admin") {
    return { allowed: true };
  }

  return { allowed: true };
}
