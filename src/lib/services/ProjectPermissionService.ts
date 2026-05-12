/**
 * Project Permission Service
 *
 * Handles project-level permission checks using graph relationships
 *
 * Relationships:
 * - User OWNS Project → User created/owns the project (full control)
 * - User CAN_EDIT Project → User has explicit edit access
 * - User CAN_VIEW Project → User has read-only access
 * - Team WORKS_ON Project → Team can work on project (members inherit access)
 *
 * @module lib/services/ProjectPermissionService
 */

import { graph } from "../db/graph";
import { teamRepository } from "../db/repositories/TeamRepository";

// ============================================================================
// Types
// ============================================================================

export type ProjectPermission = "view" | "edit" | "delete" | "manage";

// ============================================================================
// Permission Checking Functions
// ============================================================================

/**
 * Check if user can view a project
 *
 * @param userId - User's global_id (app database ID)
 * @param projectId - Project ID
 * @returns true if user can view the project
 */
export async function canViewProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Check direct relationships
  const directAccess = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})-[r:OWNS|CAN_EDIT|CAN_VIEW]->(p:Project {id: $projectId})
    RETURN r
    `,
    { userId, projectId }
  );

  if (directAccess.length > 0) {
    return true;
  }

  // Check if user is on a team that works on this project
  const teamAccess = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})-[:MEMBER_OF]->(t:Team)-[:WORKS_ON]->(p:Project {id: $projectId})
    RETURN t
    `,
    { userId, projectId }
  );

  return teamAccess.length > 0;
}

/**
 * Check if user can edit a project
 *
 * @param userId - User's global_id (app database ID)
 * @param projectId - Project ID
 * @returns true if user can edit the project
 */
export async function canEditProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Check direct edit permissions
  const directAccess = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})-[r:OWNS|CAN_EDIT]->(p:Project {id: $projectId})
    RETURN r
    `,
    { userId, projectId }
  );

  if (directAccess.length > 0) {
    return true;
  }

  // Check if user is Team Admin of a team that works on this project
  const teamsResult = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:Team)-[:WORKS_ON]->(p:Project {id: $projectId})
    RETURN t, r.role as role
    `,
    { userId, projectId }
  );

  // User can edit if they're an Admin on any team working on the project
  return teamsResult.some((result) => result.role === "Admin");
}

/**
 * Check if user can delete a project
 *
 * @param userId - User's global_id (app database ID)
 * @param projectId - Project ID
 * @returns true if user can delete the project
 */
export async function canDeleteProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Only project owners can delete
  const result = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})-[:OWNS]->(p:Project {id: $projectId})
    RETURN u
    `,
    { userId, projectId }
  );

  return result.length > 0;
}

/**
 * Check if user can manage project settings (add/remove team, change permissions)
 *
 * @param userId - User's global_id (app database ID)
 * @param projectId - Project ID
 * @returns true if user can manage project settings
 */
export async function canManageProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Only project owners can manage project settings
  const result = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})-[:OWNS]->(p:Project {id: $projectId})
    RETURN u
    `,
    { userId, projectId }
  );

  return result.length > 0;
}

/**
 * Check if user can assign a team to a project
 *
 * @param userId - User's global_id (app database ID)
 * @param teamId - Team ID
 * @param projectId - Project ID
 * @returns true if user can assign team to project
 */
export async function canAssignTeamToProject(
  userId: string,
  teamId: string,
  projectId: string
): Promise<boolean> {
  // Must own the project
  const ownsProject = await canManageProject(userId, projectId);
  if (!ownsProject) {
    return false;
  }

  // Can assign any team from the same organization
  const team = await teamRepository.findById(teamId);
  if (!team) {
    return false;
  }

  // Get user's organization
  const userResult = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})
    RETURN u.organizationId as orgId
    `,
    { userId }
  );

  if (userResult.length === 0) {
    return false;
  }

  const userOrgId = userResult[0].orgId;
  return team.organizationId === userOrgId;
}

/**
 * Grant project permission to a user
 *
 * @param grantorUserId - User granting the permission (must be project owner)
 * @param targetUserId - User receiving the permission
 * @param projectId - Project ID
 * @param permission - Type of permission to grant
 * @returns true if permission was granted
 */
export async function grantProjectPermission(
  grantorUserId: string,
  targetUserId: string,
  projectId: string,
  permission: "CAN_VIEW" | "CAN_EDIT"
): Promise<boolean> {
  // Verify grantor is project owner
  const isOwner = await canManageProject(grantorUserId, projectId);
  if (!isOwner) {
    throw new Error("Only project owners can grant permissions");
  }

  // Remove any existing permission
  await graph.deleteRelationship(targetUserId, projectId, "CAN_VIEW");
  await graph.deleteRelationship(targetUserId, projectId, "CAN_EDIT");

  // Add new permission
  await graph.createRelationship(targetUserId, projectId, permission, {
    grantedAt: new Date().toISOString(),
    grantedBy: grantorUserId,
  });

  return true;
}

/**
 * Revoke project permission from a user
 *
 * @param grantorUserId - User revoking the permission (must be project owner)
 * @param targetUserId - User having permission revoked
 * @param projectId - Project ID
 * @returns true if permission was revoked
 */
export async function revokeProjectPermission(
  grantorUserId: string,
  targetUserId: string,
  projectId: string
): Promise<boolean> {
  // Verify grantor is project owner
  const isOwner = await canManageProject(grantorUserId, projectId);
  if (!isOwner) {
    throw new Error("Only project owners can revoke permissions");
  }

  // Remove any CAN_VIEW or CAN_EDIT relationship
  await graph.deleteRelationship(targetUserId, projectId, "CAN_VIEW");
  await graph.deleteRelationship(targetUserId, projectId, "CAN_EDIT");

  return true;
}

/**
 * Get all projects a user can access
 *
 * @param userId - User's global_id (app database ID)
 * @returns Projects the user can access with their permission level
 */
export async function getUserAccessibleProjects(
  userId: string
): Promise<Array<{ projectId: string; permission: "owns" | "can_edit" | "can_view" }>> {
  const results = await graph.query<any>(
    `
    MATCH (u:User {id: $userId})-[r]->(p:Project)
    WHERE type(r) IN ['OWNS', 'CAN_EDIT', 'CAN_VIEW']
    RETURN p.id as projectId, type(r) as relationshipType
    ORDER BY p.name ASC
    `,
    { userId }
  );

  return results.map((result) => ({
    projectId: result.projectId,
    permission:
      result.relationshipType === "OWNS"
        ? "owns"
        : result.relationshipType === "CAN_EDIT"
        ? "can_edit"
        : "can_view",
  }));
}
