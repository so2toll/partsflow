/**
 * Audit Log Repository - Graph-Based Implementation
 *
 * Repository for AuditLog entity operations using graph queries.
 * Tracks all permission and access changes for compliance.
 *
 * @module lib/db/repositories/AuditLogRepository
 * @version 1.0.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

/**
 * Audit event types that can be logged
 */
export type AuditEventType =
  | "role_change" // User role changed (org level)
  | "team_add" // User added to team
  | "team_remove" // User removed from team
  | "team_role_change" // User's team role changed
  | "project_permission_grant" // Project permission granted
  | "project_permission_revoke" // Project permission revoked
  | "project_permission_change" // Project permission level changed
  | "team_create" // Team created
  | "team_delete" // Team deleted
  | "org_create" // Organization created
  | "project_create" // Project created
  | "project_delete" // Project deleted;

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  performedBy: string; // User ID who performed the action
  affectedUser?: string; // User ID who was affected (if applicable)
  organizationId: string;
  resourceId?: string; // ID of the resource (team, project, etc.)
  resourceType?: string; // Type of resource (team, project, etc.)
  details: Record<string, any>;
  timestamp: string;
}

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilters {
  userId?: string; // Filter by user who performed action
  affectedUser?: string; // Filter by affected user
  organizationId?: string; // Filter by organization
  eventType?: AuditEventType; // Filter by event type
  resourceId?: string; // Filter by resource
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  limit?: number;
  offset?: number;
}

// ============================================================================
// Audit Log Repository
// ============================================================================

/**
 * Repository for AuditLog entity operations using graph queries
 */
export class AuditLogRepository {
  /**
   * Log an audit event
   *
   * @param event Audit event details
   * @returns Created audit log entry
   */
  async log(event: {
    eventType: AuditEventType;
    performedBy: string;
    affectedUser?: string;
    organizationId: string;
    resourceId?: string;
    resourceType?: string;
    details: Record<string, any>;
  }): Promise<AuditLog> {
    const auditId = `audit_${ulid()}`;
    const now = new Date().toISOString();

    // Create audit log node
    const result = await graph.mutate(
      `
      CREATE (a:AuditLog {
        id: $id,
        eventType: $eventType,
        organizationId: $organizationId,
        resourceId: $resourceId,
        resourceType: $resourceType,
        details: $details,
        timestamp: $now
      })
      RETURN a
      `,
      {
        id: auditId,
        eventType: event.eventType,
        organizationId: event.organizationId,
        resourceId: event.resourceId || null,
        resourceType: event.resourceType || null,
        details: JSON.stringify(event.details),
        now,
      }
    );

    // Create PERFORMED relationship from actor to audit log
    await graph.createRelationship(event.performedBy, auditId, "PERFORMED", {
      timestamp: now,
    });

    // If there's an affected user, create AFFECTED relationship
    if (event.affectedUser) {
      await graph.createRelationship(auditId, event.affectedUser, "AFFECTED", {
        timestamp: now,
      });
    }

    // Create IN_ORG relationship
    await graph.createRelationship(auditId, event.organizationId, "IN_ORG", {
      timestamp: now,
    });

    return this.mapNodeToAuditLog(result, event);
  }

  /**
   * Get audit logs for a specific user (actions they performed)
   *
   * @param userId User ID
   * @param options Query options
   * @returns Audit logs and total count
   */
  async getLogsForUser(
    userId: string,
    options: Omit<AuditLogFilters, "userId"> & { limit?: number; offset?: number } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Build WHERE conditions
    const whereConditions: string[] = ["u.id = $userId"];
    const params: Record<string, any> = { userId };

    if (options.eventType) {
      whereConditions.push("a.eventType = $eventType");
      params.eventType = options.eventType;
    }

    if (options.startDate) {
      whereConditions.push("a.timestamp >= $startDate");
      params.startDate = options.startDate;
    }

    if (options.endDate) {
      whereConditions.push("a.timestamp <= $endDate");
      params.endDate = options.endDate;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get logs
    const results = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[r:PERFORMED]->(a:AuditLog)
      WHERE ${whereClause}
      RETURN a
      ORDER BY a.timestamp DESC
      LIMIT $limit
      SKIP $offset
      `,
      { ...params, limit, offset }
    );

    const logs = results.map((result) => this.mapQueryResultToAuditLog(result.a));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (u:User {id: $userId})-[r:PERFORMED]->(a:AuditLog)
      WHERE ${whereClause}
      RETURN count(a) as count
      `,
      params
    );

    const total = countResults[0]?.count || 0;

    return { logs, total };
  }

  /**
   * Get audit logs for an organization
   *
   * @param organizationId Organization ID
   * @param options Query options
   * @returns Audit logs and total count
   */
  async getLogsForOrganization(
    organizationId: string,
    options: AuditLogFilters = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Build WHERE conditions
    const whereConditions: string[] = ["a.organizationId = $organizationId"];
    const params: Record<string, any> = { organizationId };

    if (options.eventType) {
      whereConditions.push("a.eventType = $eventType");
      params.eventType = options.eventType;
    }

    if (options.startDate) {
      whereConditions.push("a.timestamp >= $startDate");
      params.startDate = options.startDate;
    }

    if (options.endDate) {
      whereConditions.push("a.timestamp <= $endDate");
      params.endDate = options.endDate;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get logs
    const results = await graph.query<any>(
      `
      MATCH (a:AuditLog)
      WHERE ${whereClause}
      RETURN a
      ORDER BY a.timestamp DESC
      LIMIT $limit
      SKIP $offset
      `,
      { ...params, limit, offset }
    );

    const logs = results.map((result) => this.mapQueryResultToAuditLog(result.a));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (a:AuditLog)
      WHERE ${whereClause}
      RETURN count(a) as count
      `,
      params
    );

    const total = countResults[0]?.count || 0;

    return { logs, total };
  }

  /**
   * Get audit logs for a specific resource (team, project, etc.)
   *
   * @param resourceId Resource ID
   * @param options Query options
   * @returns Audit logs and total count
   */
  async getLogsForResource(
    resourceId: string,
    options: Omit<AuditLogFilters, "resourceId"> & { limit?: number; offset?: number } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Build WHERE conditions
    const whereConditions: string[] = ["a.resourceId = $resourceId"];
    const params: Record<string, any> = { resourceId };

    if (options.eventType) {
      whereConditions.push("a.eventType = $eventType");
      params.eventType = options.eventType;
    }

    if (options.startDate) {
      whereConditions.push("a.timestamp >= $startDate");
      params.startDate = options.startDate;
    }

    if (options.endDate) {
      whereConditions.push("a.timestamp <= $endDate");
      params.endDate = options.endDate;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get logs
    const results = await graph.query<any>(
      `
      MATCH (a:AuditLog)
      WHERE ${whereClause}
      RETURN a
      ORDER BY a.timestamp DESC
      LIMIT $limit
      SKIP $offset
      `,
      { ...params, limit, offset }
    );

    const logs = results.map((result) => this.mapQueryResultToAuditLog(result.a));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (a:AuditLog)
      WHERE ${whereClause}
      RETURN count(a) as count
      `,
      params
    );

    const total = countResults[0]?.count || 0;

    return { logs, total };
  }

  /**
   * Get audit logs affecting a specific user
   *
   * @param userId User ID
   * @param options Query options
   * @returns Audit logs and total count
   */
  async getLogsAffectingUser(
    userId: string,
    options: Omit<AuditLogFilters, "affectedUser"> & { limit?: number; offset?: number } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Build WHERE conditions
    const whereConditions: string[] = ["affectedUser.id = $userId"];
    const params: Record<string, any> = { userId };

    if (options.eventType) {
      whereConditions.push("a.eventType = $eventType");
      params.eventType = options.eventType;
    }

    if (options.startDate) {
      whereConditions.push("a.timestamp >= $startDate");
      params.startDate = options.startDate;
    }

    if (options.endDate) {
      whereConditions.push("a.timestamp <= $endDate");
      params.endDate = options.endDate;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get logs
    const results = await graph.query<any>(
      `
      MATCH (a:AuditLog)-[r:AFFECTED]->(affectedUser:User {id: $userId})
      WHERE ${whereClause}
      RETURN a
      ORDER BY a.timestamp DESC
      LIMIT $limit
      SKIP $offset
      `,
      { ...params, limit, offset }
    );

    const logs = results.map((result) => this.mapQueryResultToAuditLog(result.a));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (a:AuditLog)-[r:AFFECTED]->(affectedUser:User {id: $userId})
      WHERE ${whereClause}
      RETURN count(a) as count
      `,
      params
    );

    const total = countResults[0]?.count || 0;

    return { logs, total };
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToAuditLog(node: Node, event: {
    eventType: AuditEventType;
    performedBy: string;
    affectedUser?: string;
    organizationId: string;
    resourceId?: string;
    resourceType?: string;
    details: Record<string, any>;
  }): AuditLog {
    return {
      id: node.id,
      eventType: event.eventType,
      performedBy: event.performedBy,
      affectedUser: event.affectedUser,
      organizationId: event.organizationId,
      resourceId: event.resourceId,
      resourceType: event.resourceType,
      details: event.details,
      timestamp: new Date().toISOString(),
    };
  }

  private mapQueryResultToAuditLog(node: Node): AuditLog {
    const props = node.properties as any;
    return {
      id: node.id,
      eventType: props.eventType,
      performedBy: props.performedBy || "", // Would need to join to get this
      affectedUser: props.affectedUser,
      organizationId: props.organizationId,
      resourceId: props.resourceId,
      resourceType: props.resourceType,
      details:
        typeof props.details === "string"
          ? JSON.parse(props.details)
          : props.details || {},
      timestamp: props.timestamp,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const auditLogRepository = new AuditLogRepository();
