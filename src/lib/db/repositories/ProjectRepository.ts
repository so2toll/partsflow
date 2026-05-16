/**
 * Project Repository - Graph-Based Implementation
 *
 * Repository for Project entity operations using graph queries.
 * Uses the graph abstraction layer for all data access.
 *
 * @module lib/db/repositories/ProjectRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  settings: ProjectSettings;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  autoHighlights?: boolean;
  defaultAIModel?: string;
  processingPriority?: "low" | "normal" | "high";
}

/**
 * Project-level permission levels
 * Priority: Owner > Editor > Viewer > NoAccess
 */
export type ProjectPermissionLevel = "Owner" | "Editor" | "Viewer" | "NoAccess";

/**
 * Project permission granted to a user
 */
export interface ProjectPermission {
  userId: string;
  projectId: string;
  permission: ProjectPermissionLevel;
  grantedBy: string;
  grantedAt: string;
}

/**
 * Effective permission for a user on a project
 * Combines org role, team role, and project permission
 */
export interface EffectivePermission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageTeam: boolean;
  source: "org" | "team" | "project";
  role: string;
}

// ============================================================================
// Video AI Types
// ============================================================================

/**
 * Project mode types for Video AI
 */
export type ProjectMode = 'create' | 'edit' | 'standard';

/**
 * Video AI project status
 */
export type VideoProjectStatus =
  | 'draft'
  | 'scripted'
  | 'generating'
  | 'rendering'
  | 'completed'
  | 'failed';

/**
 * Extended project interface for Video AI projects
 */
export interface VideoProject extends Project {
  mode: ProjectMode;
  script?: string;
  videoStatus: VideoProjectStatus;
  totalScenes: number;
  completedScenes: number;
  estimatedDuration?: number;  // in seconds
  outputVideoUrl?: string;
  thumbnailUrl?: string;
  renderQuality: '720p' | '1080p' | '4k';
  usedMinutes: number;  // Billing tracking
  errorMessage?: string;
}

// ============================================================================
// Project Repository
// ============================================================================

/**
 * Repository for Project entity operations using graph queries
 */
export class ProjectRepository {
  /**
   * Create a new project
   *
   * @param data Project data
   * @returns Created project
   *
   * @example
   * ```typescript
   * const repo = new ProjectRepository();
   * const project = await repo.create({
   *   name: "Marketing Videos",
   *   organizationId: "org_123",
   *   description: "Social media content"
   * });
   * ```
   */
  async create(data: {
    name: string;
    organizationId: string;
    description?: string;
    settings?: Partial<ProjectSettings>;
    createdBy?: string;
  }): Promise<Project> {
    const projectId = `proj_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create project node
    const result = await graph.mutate(
      `
      CREATE (p:Project {
        id: $id,
        name: $name,
        description: $description,
        organizationId: $organizationId,
        settings: $settings,
        createdBy: $createdBy,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN p
      `,
      {
        id: projectId,
        name: data.name,
        description: data.description || null,
        organizationId: data.organizationId,
        settings: JSON.stringify(data.settings || {}),
        createdBy: data.createdBy || null,
        now,
      }
    );

    // Create HAS_PROJECT relationship from organization to project
    await graph.createRelationship(data.organizationId, projectId, "HAS_PROJECT", {
      createdAt: now,
    });

    // Automatically add the creator as a Project Owner
    if (data.createdBy) {
      try {
        await graph.createRelationship(data.createdBy, projectId, "OWNS", {
          grantedAt: now,
        });
        console.log(`[ProjectRepo] Auto-added creator ${data.createdBy} as Project Owner for ${projectId}`);
      } catch (error) {
        console.error(`[ProjectRepo] Error adding creator as project owner:`, error);
        // Don't fail project creation if this fails
      }
    }

    return this.mapNodeToProject(result);
  }

  /**
   * Find project by ID
   *
   * @param id Project ID
   * @returns Project or null if not found
   */
  async findById(id: string): Promise<Project | null> {
    const results = await graph.query<any>(
      `
      MATCH (p:Project {id: $id})
      RETURN p
      `,
      { id }
    );

    if (results.length === 0 || !results[0].p) {
      return null;
    }

    return this.mapNodeToProject(results[0].p);
  }

  /**
   * Find all projects for an organization
   *
   * @param organizationId Organization ID
   * @param options Query options
   * @returns Projects and total count
   *
   * @example
   * ```typescript
   * const { projects, total } = await repo.findByOrgId("org_123");
   * ```
   */
  async findByOrgId(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ projects: Project[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get projects using graph query with relationship traversal
    const results = await graph.query<any>(
      `
      MATCH (org:Organization {id: $organizationId})-[:HAS_PROJECT]->(p:Project)
      RETURN p
      ORDER BY p.createdAt DESC
      LIMIT $limit
      SKIP $offset
      `,
      { organizationId, limit, offset }
    );

    const projects = results
      .filter((r) => r.p)
      .map((result) => this.mapNodeToProject(result.p));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (org:Organization {id: $organizationId})-[:HAS_PROJECT]->(p:Project)
      RETURN count(p) as count
      `,
      { organizationId }
    );

    const total = countResults[0]?.count || 0;

    return { projects, total };
  }

  /**
   * List all projects with pagination
   *
   * @param options Query options
   * @returns Projects and total count
   */
  async list(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "ASC" | "DESC";
  } = {}): Promise<{ projects: Project[]; total: number }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get projects using graph query
    const results = await graph.query<any>(
      `
      MATCH (p:Project)
      RETURN p
      ORDER BY p.createdAt ${options.orderDir || "DESC"}
      LIMIT $limit
      SKIP $offset
      `,
      { limit, offset }
    );

    const projects = results
      .filter((r) => r.p)
      .map((result) => this.mapNodeToProject(result.p));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (p:Project)
      RETURN count(p) as count
      `
    );

    const total = countResults[0]?.count || 0;

    return { projects, total };
  }

  /**
   * Update project
   *
   * @param id Project ID
   * @param data Updates to apply
   * @returns Updated project
   */
  async update(
    id: string,
    data: Partial<
      Omit<Project, "id" | "createdAt" | "updatedAt" | "organizationId"> & {
        settings?: Partial<ProjectSettings>;
      }
    >
  ): Promise<Project> {
    // Build updates object
    const updates: Record<string, unknown> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.settings !== undefined) updates.settings = JSON.stringify(data.settings);
    if (data.createdBy !== undefined) updates.createdBy = data.createdBy;

    const result = await graph.updateNode(id, updates);

    return this.mapNodeToProject(result);
  }

  /**
   * Delete project
   *
   * @param id Project ID
   */
  async delete(id: string): Promise<void> {
    // Delete the project node and all its relationships
    await graph.deleteNode(id);
  }

  /**
   * Add a team to a project (creates WORKS_ON relationship)
   *
   * @param teamId Team ID
   * @param projectId Project ID
   * @returns void
   *
   * @example
   * ```typescript
   * await repo.addTeam("team_123", "proj_456");
   * ```
   */
  async addTeam(teamId: string, projectId: string): Promise<void> {
    const now = new Date().toISOString();

    // Create WORKS_ON relationship from team to project
    await graph.createRelationship(teamId, projectId, "WORKS_ON", {
      assignedAt: now,
    });
  }

  /**
   * Remove a team from a project
   *
   * @param teamId Team ID
   * @param projectId Project ID
   */
  async removeTeam(teamId: string, projectId: string): Promise<void> {
    await graph.deleteRelationship(teamId, projectId, "WORKS_ON");
  }

  /**
   * Get all teams for a project
   *
   * @param projectId Project ID
   * @returns Teams working on the project
   */
  async getTeams(projectId: string): Promise<Node[]> {
    // Use outgoing direction: (t:Team)-[:WORKS_ON]->(p:Project)
    const results = await graph.query<any>(
      `
      MATCH (t:Team)-[:WORKS_ON]->(p:Project {id: $projectId})
      RETURN t
      ORDER BY t.name ASC
      `,
      { projectId }
    );

    return results.map((result) => result.t);
  }

  /**
   * Get all videos for a project
   *
   * @param projectId Project ID
   * @returns Videos in the project
   */
  async getVideos(projectId: string): Promise<Node[]> {
    const results = await graph.query<any>(
      `
      MATCH (p:Project {id: $projectId})-[:HAS_VIDEO]->(v:Video)
      RETURN v
      ORDER BY v.createdAt DESC
      `,
      { projectId }
    );

    return results.map((result) => result.v);
  }

  // ========================================================================
  // Project Permissions
  // ========================================================================

  /**
   * Grant a user direct access to a project
   * This overrides team/org-level permissions
   *
   * @param userId User ID
   * @param projectId Project ID
   * @param permission Permission level (Owner, Editor, Viewer, NoAccess)
   * @param grantedBy User ID who granted the permission
   * @returns void
   *
   * @example
   * ```typescript
   * await repo.addProjectPermission("user_123", "proj_456", "Editor", "admin_789");
   * ```
   */
  async addProjectPermission(
    userId: string,
    projectId: string,
    permission: ProjectPermissionLevel,
    grantedBy: string
  ): Promise<void> {
    const now = new Date().toISOString();

    // Check if permission already exists
    const existing = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[r:HAS_ACCESS]->(p:Project {id: $projectId})
      RETURN r
      `,
      { userId, projectId }
    );

    if (existing.length > 0) {
      // Update existing permission
      await graph.updateRelationship(userId, projectId, "HAS_ACCESS", {
        permission,
        grantedBy,
        grantedAt: now,
      });
    } else {
      // Create new HAS_ACCESS relationship
      await graph.createRelationship(userId, projectId, "HAS_ACCESS", {
        permission,
        grantedBy,
        grantedAt: now,
      });
    }
  }

  /**
   * Remove a user's direct access to a project
   *
   * @param userId User ID
   * @param projectId Project ID
   * @returns void
   */
  async removeProjectPermission(
    userId: string,
    projectId: string
  ): Promise<void> {
    await graph.deleteRelationship(userId, projectId, "HAS_ACCESS");
  }

  /**
   * Get all permissions for a project
   *
   * @param projectId Project ID
   * @returns Array of project permissions
   */
  async getProjectPermissions(
    projectId: string
  ): Promise<ProjectPermission[]> {
    const results = await graph.query<any>(
      `
      MATCH (u:User)-[r:HAS_ACCESS]->(p:Project {id: $projectId})
      RETURN u.id as userId, r.permission as permission, r.grantedBy as grantedBy, r.grantedAt as grantedAt
      ORDER BY r.grantedAt DESC
      `,
      { projectId }
    );

    return results.map((result) => ({
      userId: result.userId,
      projectId,
      permission: result.permission,
      grantedBy: result.grantedBy,
      grantedAt: result.grantedAt,
    }));
  }

  /**
   * Get a user's permission on a specific project
   *
   * @param userId User ID
   * @param projectId Project ID
   * @returns Project permission or null if no direct permission
   */
  async getUserProjectPermission(
    userId: string,
    projectId: string
  ): Promise<ProjectPermission | null> {
    const results = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[r:HAS_ACCESS]->(p:Project {id: $projectId})
      RETURN u.id as userId, r.permission as permission, r.grantedBy as grantedBy, r.grantedAt as grantedAt
      `,
      { userId, projectId }
    );

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      userId: result.userId,
      projectId,
      permission: result.permission,
      grantedBy: result.grantedBy,
      grantedAt: result.grantedAt,
    };
  }

  /**
   * Get effective permission for a user on a project
   * Considers org role, team membership, and direct project permissions
   * Priority: Project permission > Team role > Org role
   *
   * @param userId User ID
   * @param projectId Project ID
   * @param userOrgRole User's organization-level role
   * @returns Effective permission
   */
  async getEffectivePermission(
    userId: string,
    projectId: string,
    userOrgRole: string
  ): Promise<EffectivePermission> {
    // 1. Check direct project permission (highest priority)
    const projectPermission = await this.getUserProjectPermission(userId, projectId);

    if (projectPermission) {
      return this.mapProjectPermissionToEffective(projectPermission.permission, "project");
    }

    // 2. Check team permissions
    const teamResults = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:Team)-[:WORKS_ON]->(p:Project {id: $projectId})
      RETURN r.role as role
      LIMIT 1
      `,
      { userId, projectId }
    );

    if (teamResults.length > 0) {
      return this.mapTeamRoleToEffective(teamResults[0].role, "team");
    }

    // 3. Fall back to organization role
    return this.mapOrgRoleToEffective(userOrgRole, "org");
  }

  // ========================================================================
  // Permission Mappers
  // ========================================================================

  private mapProjectPermissionToEffective(
    permission: ProjectPermissionLevel,
    source: "project" | "team" | "org"
  ): EffectivePermission {
    switch (permission) {
      case "Owner":
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageTeam: true,
          source,
          role: "Owner",
        };
      case "Editor":
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: "Editor",
        };
      case "Viewer":
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: "Viewer",
        };
      case "NoAccess":
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: "NoAccess",
        };
    }
  }

  private mapTeamRoleToEffective(
    role: string,
    source: "project" | "team" | "org"
  ): EffectivePermission {
    switch (role) {
      case "Admin":
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canInvite: true,
          canManageTeam: true,
          source,
          role: `Team ${role}`,
        };
      case "User":
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: `Team ${role}`,
        };
      case "Viewer":
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: `Team ${role}`,
        };
      default:
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: "Unknown",
        };
    }
  }

  private mapOrgRoleToEffective(
    role: string,
    source: "project" | "team" | "org"
  ): EffectivePermission {
    switch (role) {
      case "Admin":
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageTeam: true,
          source,
          role: `Org ${role}`,
        };
      case "User":
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: `Org ${role}`,
        };
      case "Viewer":
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: `Org ${role}`,
        };
      default:
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageTeam: false,
          source,
          role: "Unknown",
        };
    }
  }

  // ========================================================================
  // Video AI Methods
  // ========================================================================

  /**
   * Create a video AI project
   */
  async createVideoProject(data: {
    name: string;
    description?: string;
    userId: string;
    organizationId: string;
    teamId?: string;
    mode: ProjectMode;
    script?: string;
    renderQuality?: '720p' | '1080p' | '4k';
  }): Promise<VideoProject> {
    const projectId = `proj_${ulid()}`;
    const now = new Date().toISOString();

    const properties = {
      id: projectId,
      name: data.name,
      description: data.description || '',
      organizationId: data.organizationId,
      userId: data.userId,
      teamId: data.teamId || null,
      mode: data.mode,
      script: data.script || null,
      videoStatus: 'draft',
      totalScenes: 0,
      completedScenes: 0,
      estimatedDuration: null,
      outputVideoUrl: null,
      thumbnailUrl: null,
      renderQuality: data.renderQuality || '1080p',
      usedMinutes: 0,
      errorMessage: null,
      settings: JSON.stringify({}),
      createdBy: data.userId,
      createdAt: now,
      updatedAt: now,
    };

    await graph.mutate(
      `CREATE (p:Project {
        id: $id,
        name: $name,
        description: $description,
        organizationId: $organizationId,
        userId: $userId,
        teamId: $teamId,
        mode: $mode,
        script: $script,
        videoStatus: $videoStatus,
        totalScenes: $totalScenes,
        completedScenes: $completedScenes,
        estimatedDuration: $estimatedDuration,
        outputVideoUrl: $outputVideoUrl,
        thumbnailUrl: $thumbnailUrl,
        renderQuality: $renderQuality,
        usedMinutes: $usedMinutes,
        errorMessage: $errorMessage,
        settings: $settings,
        createdBy: $createdBy,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }) RETURN p`,
      properties
    );

    // Create relationships
    await graph.createRelationship(data.organizationId, projectId, 'HAS_PROJECT', {
      createdAt: now,
    });
    await graph.createRelationship(data.userId, projectId, 'OWNS', {
      grantedAt: now,
    });

    if (data.teamId) {
      await graph.createRelationship(data.teamId, projectId, 'HAS_PROJECT', {
        createdAt: now,
      });
    }

    return this.mapNodeToVideoProject({
      id: projectId,
      label: 'Project',
      properties,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Update video project status
   */
  async updateVideoStatus(
    projectId: string,
    status: VideoProjectStatus,
    data?: {
      completedScenes?: number;
      totalScenes?: number;
      errorMessage?: string;
    }
  ): Promise<VideoProject> {
    const updates: Record<string, unknown> = {
      videoStatus: status,
      updatedAt: new Date().toISOString(),
    };

    if (data?.completedScenes !== undefined) {
      updates.completedScenes = data.completedScenes;
    }

    if (data?.totalScenes !== undefined) {
      updates.totalScenes = data.totalScenes;
    }

    if (data?.errorMessage !== undefined) {
      updates.errorMessage = data.errorMessage;
    }

    if (status === 'completed') {
      // Clear any error message on success
      updates.errorMessage = null;
    }

    const result = await graph.updateNode(projectId, updates);
    return this.mapNodeToVideoProject(result);
  }

  /**
   * Set project output video
   */
  async setOutputVideo(
    projectId: string,
    data: {
      outputVideoUrl: string;
      thumbnailUrl?: string;
      estimatedDuration: number;
      usedMinutes: number;
    }
  ): Promise<VideoProject> {
    const updates = {
      outputVideoUrl: data.outputVideoUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      estimatedDuration: data.estimatedDuration,
      usedMinutes: data.usedMinutes,
      videoStatus: 'completed',
      updatedAt: new Date().toISOString(),
    };

    const result = await graph.updateNode(projectId, updates);
    return this.mapNodeToVideoProject(result);
  }

  /**
   * Update project script
   */
  async updateScript(
    projectId: string,
    script: string,
    totalScenes: number
  ): Promise<VideoProject> {
    const updates = {
      script,
      totalScenes,
      videoStatus: 'scripted',
      completedScenes: 0,
      updatedAt: new Date().toISOString(),
    };

    const result = await graph.updateNode(projectId, updates);
    return this.mapNodeToVideoProject(result);
  }

  /**
   * Get video projects by status
   */
  async findByVideoStatus(
    organizationId: string,
    status: VideoProjectStatus,
    options?: { limit?: number; offset?: number }
  ): Promise<{ items: VideoProject[]; total: number }> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const items = await graph.query<Node>(
      `MATCH (p:Project)
       WHERE p.organizationId = $organizationId AND p.videoStatus = $status
       RETURN p
       ORDER BY p.updatedAt DESC
       SKIP $offset
       LIMIT $limit`,
      { organizationId, status, offset, limit }
    );

    const countResult = await graph.query<{ count: number }>(
      `MATCH (p:Project)
       WHERE p.organizationId = $organizationId AND p.videoStatus = $status
       RETURN count(p) as count`,
      { organizationId, status }
    );

    return {
      items: items.map(node => this.mapNodeToVideoProject(node)),
      total: countResult[0]?.count || 0,
    };
  }

  /**
   * Get total used minutes for billing period
   */
  async getUsedMinutes(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await graph.query<{ total: number }>(
      `MATCH (p:Project)
       WHERE p.organizationId = $organizationId
         AND p.videoStatus = 'completed'
         AND p.updatedAt >= $startDate
         AND p.updatedAt <= $endDate
       RETURN SUM(p.usedMinutes) as total`,
      {
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }
    );

    return result[0]?.total || 0;
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToProject(node: Node): Project {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id (SQL primary key)
    const id = props?.id || node.id;

    return {
      id,
      name: props?.name,
      description: props?.description,
      organizationId: props?.organizationId,
      settings:
        typeof props?.settings === "string"
          ? JSON.parse(props.settings)
          : props?.settings || {},
      createdBy: props?.createdBy,
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
    };
  }

  /**
   * Map graph node to VideoProject (includes all Video AI fields)
   */
  private mapNodeToVideoProject(node: Node): VideoProject {
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    const id = props?.id || node.id;

    return {
      id,
      name: props?.name,
      description: props?.description,
      organizationId: props?.organizationId,
      settings:
        typeof props?.settings === "string"
          ? JSON.parse(props.settings)
          : props?.settings || {},
      createdBy: props?.createdBy,
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
      // Video AI specific fields with defaults for backward compatibility
      mode: (props?.mode as ProjectMode) || 'standard',
      script: props?.script,
      videoStatus: (props?.videoStatus as VideoProjectStatus) || 'draft',
      totalScenes: (props?.totalScenes as number) || 0,
      completedScenes: (props?.completedScenes as number) || 0,
      estimatedDuration: props?.estimatedDuration as number | undefined,
      outputVideoUrl: props?.outputVideoUrl as string | undefined,
      thumbnailUrl: props?.thumbnailUrl as string | undefined,
      renderQuality: (props?.renderQuality as '720p' | '1080p' | '4k') || '1080p',
      usedMinutes: (props?.usedMinutes as number) || 0,
      errorMessage: props?.errorMessage as string | undefined,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const projectRepository = new ProjectRepository();
