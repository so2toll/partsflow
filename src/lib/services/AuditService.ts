/**
 * Audit Service
 *
 * High-level service for logging audit events.
 * Provides convenient methods for common audit operations.
 *
 * @module lib/services/AuditService
 */

import { auditLogRepository, AuditEventType } from "../db/repositories/AuditLogRepository";

// ============================================================================
// Audit Logging Control
// ============================================================================

/**
 * Feature flag to control audit logging.
 * Set AUDIT_LOGGING_ENABLED=false in .env to disable during development.
 *
 * @default true (enabled in production)
 */
const AUDIT_ENABLED = process.env.AUDIT_LOGGING_ENABLED !== 'false';

/**
 * Check if audit logging is currently enabled
 */
export function isAuditLoggingEnabled(): boolean {
  return AUDIT_ENABLED;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Log a role change event
 *
 * @param performedBy User ID who changed the role
 * @param affectedUser User ID whose role was changed
 * @param organizationId Organization ID
 * @param oldRole Previous role
 * @param newRole New role
 */
export async function logRoleChange(
  performedBy: string,
  affectedUser: string,
  organizationId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "role_change",
    performedBy,
    affectedUser,
    organizationId,
    details: {
      oldRole,
      newRole,
      change: `${oldRole} → ${newRole}`,
    },
  });
}

/**
 * Log a team member addition
 *
 * @param performedBy User ID who added the member
 * @param affectedUser User ID who was added
 * @param organizationId Organization ID
 * @param teamId Team ID
 * @param teamName Team name
 * @param role Role assigned to the user
 */
export async function logTeamMemberAdd(
  performedBy: string,
  affectedUser: string,
  organizationId: string,
  teamId: string,
  teamName: string,
  role: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "team_add",
    performedBy,
    affectedUser,
    organizationId,
    resourceId: teamId,
    resourceType: "team",
    details: {
      teamName,
      role,
      teamId,
    },
  });
}

/**
 * Log a team member removal
 *
 * @param performedBy User ID who removed the member
 * @param affectedUser User ID who was removed
 * @param organizationId Organization ID
 * @param teamId Team ID
 * @param teamName Team name
 * @param previousRole Role the user had before removal
 */
export async function logTeamMemberRemove(
  performedBy: string,
  affectedUser: string,
  organizationId: string,
  teamId: string,
  teamName: string,
  previousRole: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "team_remove",
    performedBy,
    affectedUser,
    organizationId,
    resourceId: teamId,
    resourceType: "team",
    details: {
      teamName,
      previousRole,
      teamId,
    },
  });
}

/**
 * Log a team member role change
 *
 * @param performedBy User ID who changed the role
 * @param affectedUser User ID whose role was changed
 * @param organizationId Organization ID
 * @param teamId Team ID
 * @param teamName Team name
 * @param oldRole Previous role
 * @param newRole New role
 */
export async function logTeamMemberRoleChange(
  performedBy: string,
  affectedUser: string,
  organizationId: string,
  teamId: string,
  teamName: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "team_role_change",
    performedBy,
    affectedUser,
    organizationId,
    resourceId: teamId,
    resourceType: "team",
    details: {
      teamName,
      oldRole,
      newRole,
      change: `${oldRole} → ${newRole}`,
      teamId,
    },
  });
}

/**
 * Log a project permission grant
 *
 * @param performedBy User ID who granted the permission
 * @param affectedUser User ID who was granted permission
 * @param organizationId Organization ID
 * @param projectId Project ID
 * @param projectName Project name
 * @param permission Permission level granted
 */
export async function logProjectPermissionGrant(
  performedBy: string,
  affectedUser: string,
  organizationId: string,
  projectId: string,
  projectName: string,
  permission: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "project_permission_grant",
    performedBy,
    affectedUser,
    organizationId,
    resourceId: projectId,
    resourceType: "project",
    details: {
      projectName,
      permission,
      projectId,
    },
  });
}

/**
 * Log a project permission revocation
 *
 * @param performedBy User ID who revoked the permission
 * @param affectedUser User ID whose permission was revoked
 * @param organizationId Organization ID
 * @param projectId Project ID
 * @param projectName Project name
 * @param previousPermission Previous permission level
 */
export async function logProjectPermissionRevoke(
  performedBy: string,
  affectedUser: string,
  organizationId: string,
  projectId: string,
  projectName: string,
  previousPermission: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "project_permission_revoke",
    performedBy,
    affectedUser,
    organizationId,
    resourceId: projectId,
    resourceType: "project",
    details: {
      projectName,
      previousPermission,
      projectId,
    },
  });
}

/**
 * Log a project permission change
 *
 * @param performedBy User ID who changed the permission
 * @param affectedUser User ID whose permission was changed
 * @param organizationId Organization ID
 * @param projectId Project ID
 * @param projectName Project name
 * @param oldPermission Previous permission level
 * @param newPermission New permission level
 */
export async function logProjectPermissionChange(
  performedBy: string,
  affectedUser: string,
  organizationId: string,
  projectId: string,
  projectName: string,
  oldPermission: string,
  newPermission: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "project_permission_change",
    performedBy,
    affectedUser,
    organizationId,
    resourceId: projectId,
    resourceType: "project",
    details: {
      projectName,
      oldPermission,
      newPermission,
      change: `${oldPermission} → ${newPermission}`,
      projectId,
    },
  });
}

/**
 * Log a team creation
 *
 * @param performedBy User ID who created the team
 * @param organizationId Organization ID
 * @param teamId Team ID
 * @param teamName Team name
 * @param projectId Project ID the team was assigned to
 */
export async function logTeamCreate(
  performedBy: string,
  organizationId: string,
  teamId: string,
  teamName: string,
  projectId: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "team_create",
    performedBy,
    organizationId,
    resourceId: teamId,
    resourceType: "team",
    details: {
      teamName,
      teamId,
      projectId,
    },
  });
}

/**
 * Log a team deletion
 *
 * @param performedBy User ID who deleted the team
 * @param organizationId Organization ID
 * @param teamId Team ID
 * @param teamName Team name
 */
export async function logTeamDelete(
  performedBy: string,
  organizationId: string,
  teamId: string,
  teamName: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "team_delete",
    performedBy,
    organizationId,
    resourceId: teamId,
    resourceType: "team",
    details: {
      teamName,
      teamId,
    },
  });
}

/**
 * Log an organization creation
 *
 * @param performedBy User ID who created the organization
 * @param organizationId Organization ID
 * @param organizationName Organization name
 */
export async function logOrganizationCreate(
  performedBy: string,
  organizationId: string,
  organizationName: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "org_create",
    performedBy,
    organizationId,
    resourceId: organizationId,
    resourceType: "organization",
    details: {
      organizationName,
    },
  });
}

/**
 * Log a project creation
 *
 * @param performedBy User ID who created the project
 * @param organizationId Organization ID
 * @param projectId Project ID
 * @param projectName Project name
 */
export async function logProjectCreate(
  performedBy: string,
  organizationId: string,
  projectId: string,
  projectName: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "project_create",
    performedBy,
    organizationId,
    resourceId: projectId,
    resourceType: "project",
    details: {
      projectName,
    },
  });
}

/**
 * Log a project deletion
 *
 * @param performedBy User ID who deleted the project
 * @param organizationId Organization ID
 * @param projectId Project ID
 * @param projectName Project name
 */
export async function logProjectDelete(
  performedBy: string,
  organizationId: string,
  projectId: string,
  projectName: string
): Promise<void> {
  if (!AUDIT_ENABLED) return;
  await auditLogRepository.log({
    eventType: "project_delete",
    performedBy,
    organizationId,
    resourceId: projectId,
    resourceType: "project",
    details: {
      projectName,
    },
  });
}
