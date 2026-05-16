/**
 * Team Repository - Graph-Based Implementation
 *
 * Repository for Team entity operations using graph queries.
 * Uses the graph abstraction layer for all data access.
 *
 * @module lib/db/repositories/TeamRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";
import {
  logTeamMemberAdd,
  logTeamMemberRemove,
  logTeamMemberRoleChange,
  logTeamCreate,
  logTeamDelete,
} from "../../services/AuditService";

// ============================================================================
// Types
// ============================================================================

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: "Admin" | "User" | "Viewer";
  joinedAt: string;
}

// ============================================================================
// Team Repository
// ============================================================================

/**
 * Repository for Team entity operations using graph queries
 */
export class TeamRepository {
  /**
   * Create a new team
   *
   * @param data Team data
   * @returns Created team
   *
   * @example
   * ```typescript
   * const repo = new TeamRepository();
   * const team = await repo.create({
   *   name: "Content Team",
   *   organizationId: "org_123"
   * });
   * ```
   */
  async create(data: {
    name: string;
    organizationId: string;
    createdBy?: string;
  }): Promise<Team> {
    const teamId = `team_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create team node
    const result = await graph.mutate(
      `
      CREATE (t:Team {
        id: $id,
        name: $name,
        organizationId: $organizationId,
        createdBy: $createdBy,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN t
      `,
      {
        id: teamId,
        name: data.name,
        organizationId: data.organizationId,
        createdBy: data.createdBy || null,
        now,
      }
    );

    // Create HAS_TEAM relationship from organization to team
    await graph.createRelationship(data.organizationId, teamId, "HAS_TEAM", {
      createdAt: now,
    });

    // Automatically add the creator as a Team Admin
    if (data.createdBy) {
      try {
        await graph.createRelationship(data.createdBy, teamId, "MEMBER_OF", {
          role: "Admin",
          joinedAt: now,
        });
        console.log(`[TeamRepo] Auto-added creator ${data.createdBy} as Team Admin for ${teamId}`);
      } catch (error) {
        console.error(`[TeamRepo] Error adding creator as team member:`, error);
        // Don't fail team creation if this fails
      }
    }

    // Log team creation
    const performedBy = data.createdBy || "system";
    try {
      await logTeamCreate(
        performedBy,
        data.organizationId,
        teamId,
        data.name,
        "" // Project ID - would need to be passed separately if needed
      );
    } catch (auditError) {
      console.error("Error logging team creation:", auditError);
    }

    return this.mapNodeToTeam(result);
  }

  /**
   * Find team by ID
   *
   * @param id Team ID
   * @returns Team or null if not found
   */
  async findById(id: string): Promise<Team | null> {
    const results = await graph.query<any>(
      `
      MATCH (t:Team {id: $id})
      RETURN t
      `,
      { id }
    );

    if (results.length === 0 || !results[0].t) {
      return null;
    }

    return this.mapNodeToTeam(results[0].t);
  }

  /**
   * Find all teams for an organization
   *
   * @param organizationId Organization ID
   * @param options Query options
   * @returns Teams and total count
   *
   * @example
   * ```typescript
   * const { teams, total } = await repo.findByOrgId("org_123");
   * ```
   */
  async findByOrgId(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ teams: Team[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get teams using graph query with relationship traversal
    const results = await graph.query<any>(
      `
      MATCH (org:Organization {id: $organizationId})-[:HAS_TEAM]->(t:Team)
      RETURN t
      ORDER BY t.name ASC
      LIMIT $limit
      SKIP $offset
      `,
      { organizationId, limit, offset }
    );

    const teams = results
      .filter((r) => r.t)
      .map((result) => this.mapNodeToTeam(result.t));

    console.log('[TeamRepository.findByOrgId] Found teams:', teams.map(t => ({ id: t.id, name: t.name })));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (org:Organization {id: $organizationId})-[:HAS_TEAM]->(t:Team)
      RETURN count(t) as count
      `,
      { organizationId }
    );

    const total = countResults[0]?.count || 0;

    return { teams, total };
  }

  /**
   * Find teams by project
   *
   * @param projectId Project ID
   * @returns Teams working on the project
   */
  async findByProject(projectId: string): Promise<Team[]> {
    // Use outgoing direction: (t:Team)-[:WORKS_ON]->(p:Project)
    const results = await graph.query<any>(
      `
      MATCH (t:Team)-[:WORKS_ON]->(p:Project {id: $projectId})
      RETURN t
      ORDER BY t.name ASC
      `,
      { projectId }
    );

    return results
      .filter((r) => r.t)
      .map((result) => this.mapNodeToTeam(result.t));
  }

  /**
   * List all teams with pagination
   *
   * @param options Query options
   * @returns Teams and total count
   */
  async list(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "ASC" | "DESC";
  } = {}): Promise<{ teams: Team[]; total: number }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get teams using graph query
    const results = await graph.query<any>(
      `
      MATCH (t:Team)
      RETURN t
      ORDER BY t.createdAt ${options.orderDir || "DESC"}
      LIMIT $limit
      SKIP $offset
      `,
      { limit, offset }
    );

    const teams = results
      .filter((r) => r.t)
      .map((result) => this.mapNodeToTeam(result.t));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (t:Team)
      RETURN count(t) as count
      `
    );

    const total = countResults[0]?.count || 0;

    return { teams, total };
  }

  /**
   * Update team
   *
   * @param id Team ID
   * @param data Updates to apply
   * @returns Updated team
   */
  async update(
    id: string,
    data: Partial<Omit<Team, "id" | "createdAt" | "updatedAt" | "organizationId">>
  ): Promise<Team> {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;

    const result = await graph.updateNode(id, updates);

    return this.mapNodeToTeam(result);
  }

  /**
   * Delete team
   *
   * @param id Team ID
   * @param performedBy User ID who is deleting the team
   */
  async delete(id: string, performedBy?: string): Promise<void> {
    // Get team info before deletion for audit log
    const team = await this.findById(id);

    // Delete the team node and all its relationships
    await graph.deleteNode(id);

    // Log team deletion
    if (team && performedBy) {
      try {
        await logTeamDelete(
          performedBy,
          team.organizationId,
          id,
          team.name
        );
      } catch (auditError) {
        console.error("Error logging team deletion:", auditError);
      }
    }
  }

  /**
   * Add a member to a team (creates MEMBER_OF relationship)
   *
   * @param teamId Team ID
   * @param userId User ID
   * @param role User role in team (Admin, User, Viewer)
   * @param performedBy User ID who is adding the member (for audit log)
   * @returns void
   *
   * @example
   * ```typescript
   * await repo.addMember("team_123", "user_456", "Admin", "user_789");
   * ```
   */
  async addMember(
    teamId: string,
    userId: string,
    role: "Admin" | "User" | "Viewer" = "User",
    performedBy?: string
  ): Promise<void> {
    const now = new Date().toISOString();

    // Check if user is already a member
    const existingMembers = await this.getMembers(teamId);
    const existingMember = existingMembers.find(m => m.user.properties.id === userId);

    // Get team info for audit log
    const team = await this.findById(teamId);

    if (existingMember) {
      // User is already a member - update their role if different
      if (existingMember.role !== role) {
        await this.updateMemberRole(teamId, userId, role, performedBy);
      }
      return;
    }

    // Create MEMBER_OF relationship from user to team
    await graph.createRelationship(userId, teamId, "MEMBER_OF", {
      role,
      joinedAt: now,
    });

    // Log member addition
    if (team && performedBy) {
      try {
        await logTeamMemberAdd(
          performedBy,
          userId,
          team.organizationId,
          teamId,
          team.name,
          role
        );
      } catch (auditError) {
        console.error("Error logging team member addition:", auditError);
      }
    }
  }

  /**
   * Remove a member from a team
   *
   * @param teamId Team ID
   * @param userId User ID
   * @param performedBy User ID who is removing the member (for audit log)
   */
  async removeMember(
    teamId: string,
    userId: string,
    performedBy?: string
  ): Promise<void> {
    // Get team info and current role for audit log
    const team = await this.findById(teamId);

    // Prevent removing the team creator/owner
    if (team && team.createdBy === userId) {
      throw new Error("Cannot remove the team creator/owner");
    }

    let previousRole = "Unknown";

    if (team) {
      const members = await this.getMembers(teamId);
      const member = members.find((m) => m.user.properties.id === userId);
      if (member) {
        previousRole = member.role;
      }
    }

    // Delete the MEMBER_OF relationship
    await graph.deleteRelationship(userId, teamId, "MEMBER_OF");

    // Log member removal
    if (team && performedBy) {
      try {
        await logTeamMemberRemove(
          performedBy,
          userId,
          team.organizationId,
          teamId,
          team.name,
          previousRole
        );
      } catch (auditError) {
        console.error("Error logging team member removal:", auditError);
      }
    }
  }

  /**
   * Update member role
   *
   * @param teamId Team ID
   * @param userId User ID
   * @param role New role
   * @param performedBy User ID who is changing the role (for audit log)
   */
  async updateMemberRole(
    teamId: string,
    userId: string,
    role: "Admin" | "User" | "Viewer",
    performedBy?: string
  ): Promise<void> {
    // Get team info and current role for audit log
    const team = await this.findById(teamId);
    let oldRole = "Unknown";

    if (team) {
      const members = await this.getMembers(teamId);
      const member = members.find((m) => m.user.id === userId);
      if (member) {
        oldRole = member.role;
      }
    }

    // Update the MEMBER_OF relationship with new role
    await graph.updateRelationship(userId, teamId, "MEMBER_OF", { role });

    // Log role change
    if (team && performedBy && oldRole !== role) {
      try {
        await logTeamMemberRoleChange(
          performedBy,
          userId,
          team.organizationId,
          teamId,
          team.name,
          oldRole,
          role
        );
      } catch (auditError) {
        console.error("Error logging team member role change:", auditError);
      }
    }
  }

  /**
   * Get all members of a team
   *
   * @param teamId Team ID
   * @returns Members with their roles
   */
  async getMembers(teamId: string): Promise<
    Array<{
      user: Node;
      role: string;
      joinedAt: string;
    }>
  > {
    // Use queryRelated to get users with their MEMBER_OF relationship properties
    const results = await graph.queryRelated(teamId, "MEMBER_OF", "in", "User");

    return results.map(({ node, relationship }) => ({
      user: node,
      role: (relationship.properties.role as string) || "User",
      joinedAt: (relationship.properties.joinedAt as string) || new Date().toISOString(),
    }));
  }

  /**
   * Get teams for a user
   *
   * @param userId User ID
   * @returns Teams with user's role
   */
  async findByUserId(userId: string): Promise<
    Array<{
      team: Team;
      role: string;
      joinedAt: string;
    }>
  > {
    const results = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:Team)
      RETURN t, r.role as role, r.joinedAt as joinedAt
      ORDER BY t.name ASC
      `,
      { userId }
    );

    return results.map((result) => ({
      team: this.mapNodeToTeam(result.t),
      role: result.role,
      joinedAt: result.joinedAt,
    }));
  }

  /**
   * Assign team to project
   *
   * @param teamId Team ID
   * @param projectId Project ID
   */
  async assignToProject(teamId: string, projectId: string): Promise<void> {
    const now = new Date().toISOString();

    // Create WORKS_ON relationship from team to project
    await graph.createRelationship(teamId, projectId, "WORKS_ON", {
      assignedAt: now,
    });
  }

  /**
   * Remove team from project
   *
   * @param teamId Team ID
   * @param projectId Project ID
   */
  async removeFromProject(teamId: string, projectId: string): Promise<void> {
    await graph.deleteRelationship(teamId, projectId, "WORKS_ON");
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToTeam(node: Node): Team {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id (SQL primary key)
    const id = props?.id || node.id;

    return {
      id,
      name: props?.name,
      organizationId: props?.organizationId,
      createdBy: props?.createdBy,
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const teamRepository = new TeamRepository();
