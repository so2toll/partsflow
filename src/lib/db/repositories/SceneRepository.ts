/**
 * Scene Repository - Graph-Based Implementation
 *
 * Repository for Scene entity operations using graph queries.
 * Scenes are ordered segments within a project's video.
 *
 * @module lib/db/repositories/SceneRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export type SceneStatus = 'pending' | 'keyframe_gen' | 'rendering' | 'complete' | 'failed';
export type ModelSelection = 'ltx23' | 'wan22' | 'draft';

export interface Scene {
  id: string;              // scene_xxx
  projectId: string;
  sceneIndex: number;      // ordering within project
  description?: string;
  dialogue?: string;
  modelSelection: ModelSelection;
  keyframeUrl?: string;
  clipUrl?: string;
  clipDurationSeconds?: number;
  status: SceneStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSceneData {
  projectId: string;
  sceneIndex: number;
  description?: string;
  dialogue?: string;
  modelSelection?: ModelSelection;
  keyframeUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Scene Repository
// ============================================================================

/**
 * Repository for Scene entity operations using graph queries
 */
export class SceneRepository {
  /**
   * Create a new scene
   *
   * @param data Scene data
   * @returns Created scene
   *
   * @example
   * ```typescript
   * const repo = new SceneRepository();
   * const scene = await repo.create({
   *   projectId: "proj_123",
   *   sceneIndex: 0,
   *   description: "Opening shot",
   *   modelSelection: "ltx23"
   * });
   * ```
   */
  async create(data: CreateSceneData): Promise<Scene> {
    const sceneId = `scene_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create scene node
    const result = await graph.mutate(
      `
      CREATE (s:Scene {
        id: $id,
        projectId: $projectId,
        sceneIndex: $sceneIndex,
        description: $description,
        dialogue: $dialogue,
        modelSelection: $modelSelection,
        keyframeUrl: $keyframeUrl,
        clipUrl: $clipUrl,
        clipDurationSeconds: $clipDurationSeconds,
        status: $status,
        metadata: $metadata,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN s
      `,
      {
        id: sceneId,
        projectId: data.projectId,
        sceneIndex: data.sceneIndex,
        description: data.description || null,
        dialogue: data.dialogue || null,
        modelSelection: data.modelSelection || 'draft',
        keyframeUrl: data.keyframeUrl || null,
        clipUrl: null,
        clipDurationSeconds: null,
        status: 'pending',
        metadata: JSON.stringify(data.metadata || {}),
        now,
      }
    );

    // Create HAS_SCENE relationship from project to scene with order property
    await graph.createRelationship(data.projectId, sceneId, "HAS_SCENE", {
      order: data.sceneIndex,
      createdAt: now,
    });

    return this.mapNodeToScene(result);
  }

  /**
   * Find scene by ID
   *
   * @param id Scene ID
   * @returns Scene or null if not found
   */
  async findById(id: string): Promise<Scene | null> {
    const results = await graph.query<any>(
      `
      MATCH (s:Scene {id: $id})
      RETURN s
      `,
      { id }
    );

    if (results.length === 0 || !results[0].s) {
      return null;
    }

    return this.mapNodeToScene(results[0].s);
  }

  /**
   * Find all scenes for a project ordered by sceneIndex
   *
   * @param projectId Project ID
   * @returns Scenes ordered by index
   */
  async findByProject(projectId: string): Promise<Scene[]> {
    const results = await graph.query<any>(
      `
      MATCH (p:Project {id: $projectId})-[:HAS_SCENE]->(s:Scene)
      RETURN s
      ORDER BY s.sceneIndex ASC
      `,
      { projectId }
    );

    return results
      .filter((r) => r.s)
      .map((result) => this.mapNodeToScene(result.s));
  }

  /**
   * Update scene
   *
   * @param id Scene ID
   * @param data Updates to apply
   * @returns Updated scene
   */
  async update(
    id: string,
    data: Partial<Omit<Scene, "id" | "createdAt" | "updatedAt" | "projectId">>
  ): Promise<Scene> {
    const updates: Record<string, unknown> = {};

    if (data.sceneIndex !== undefined) updates.sceneIndex = data.sceneIndex;
    if (data.description !== undefined) updates.description = data.description;
    if (data.dialogue !== undefined) updates.dialogue = data.dialogue;
    if (data.modelSelection !== undefined) updates.modelSelection = data.modelSelection;
    if (data.keyframeUrl !== undefined) updates.keyframeUrl = data.keyframeUrl;
    if (data.clipUrl !== undefined) updates.clipUrl = data.clipUrl;
    if (data.clipDurationSeconds !== undefined) updates.clipDurationSeconds = data.clipDurationSeconds;
    if (data.status !== undefined) updates.status = data.status;
    if (data.metadata !== undefined) updates.metadata = JSON.stringify(data.metadata);

    const result = await graph.updateNode(id, updates);

    return this.mapNodeToScene(result);
  }

  /**
   * Update scene status
   *
   * @param id Scene ID
   * @param status New status
   * @returns Updated scene
   */
  async updateStatus(id: string, status: SceneStatus): Promise<Scene> {
    return this.update(id, { status });
  }

  /**
   * Delete scene
   *
   * @param id Scene ID
   */
  async delete(id: string): Promise<void> {
    // Delete the scene node and all its relationships
    await graph.deleteNode(id);
  }

  /**
   * Reorder scenes within a project
   *
   * @param projectId Project ID
   * @param sceneIds Ordered array of scene IDs
   */
  async reorder(projectId: string, sceneIds: string[]): Promise<void> {
    // Update each scene's sceneIndex and relationship order
    for (let i = 0; i < sceneIds.length; i++) {
      const sceneId = sceneIds[i];

      // Update scene node
      await graph.updateNode(sceneId, { sceneIndex: i });

      // Update relationship order property
      await graph.updateRelationship(projectId, sceneId, "HAS_SCENE", { order: i });
    }
  }

  /**
   * Add character to a scene (creates FEATURES_CHARACTER relationship)
   *
   * @param sceneId Scene ID
   * @param characterId Character ID
   */
  async addCharacter(sceneId: string, characterId: string): Promise<void> {
    const now = new Date().toISOString();

    await graph.createRelationship(sceneId, characterId, "FEATURES_CHARACTER", {
      addedAt: now,
    });
  }

  /**
   * Remove character from a scene
   *
   * @param sceneId Scene ID
   * @param characterId Character ID
   */
  async removeCharacter(sceneId: string, characterId: string): Promise<void> {
    await graph.deleteRelationship(sceneId, characterId, "FEATURES_CHARACTER");
  }

  /**
   * Get characters featured in a scene
   *
   * @param sceneId Scene ID
   * @returns Characters in the scene
   */
  async getCharacters(sceneId: string): Promise<Node[]> {
    const results = await graph.queryRelated(sceneId, "FEATURES_CHARACTER", "out", "Character");

    return results.map(({ node }) => node);
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToScene(node: Node): Scene {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id
    const id = props?.id || node.id;

    return {
      id,
      projectId: props?.projectId,
      sceneIndex: props?.sceneIndex ?? 0,
      description: props?.description,
      dialogue: props?.dialogue,
      modelSelection: props?.modelSelection || 'draft',
      keyframeUrl: props?.keyframeUrl,
      clipUrl: props?.clipUrl,
      clipDurationSeconds: props?.clipDurationSeconds,
      status: props?.status || 'pending',
      metadata: typeof props?.metadata === 'string'
        ? JSON.parse(props.metadata)
        : props?.metadata || {},
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const sceneRepository = new SceneRepository();
