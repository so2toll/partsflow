/**
 * Clip Repository - Graph-Based Implementation
 *
 * Repository for Clip entity operations using graph queries.
 * Clips are segments extracted from uploaded assets after indexing.
 *
 * @module lib/db/repositories/ClipRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export interface Clip {
  id: string;              // clip_xxx
  assetId: string;         // source asset
  projectId: string;
  startTime: number;       // seconds
  endTime: number;         // seconds
  sceneType: string;       // 'dialogue' | 'action' | 'establishing' | 'closeup' | etc
  deeplakeRef: string;     // key into DeepLake
  clipPath: string;        // Azure Blob URL
  keyframePath: string;    // Azure Blob URL
  createdAt: string;
}

export interface CreateClipData {
  assetId: string;
  projectId: string;
  startTime: number;
  endTime: number;
  sceneType: string;
  deeplakeRef: string;
  clipPath: string;
  keyframePath: string;
}

// ============================================================================
// Clip Repository
// ============================================================================

/**
 * Repository for Clip entity operations using graph queries
 */
export class ClipRepository {
  /**
   * Create a new clip
   *
   * @param data Clip data
   * @returns Created clip
   *
   * @example
   * ```typescript
   * const repo = new ClipRepository();
   * const clip = await repo.create({
   *   assetId: "asset_123",
   *   projectId: "proj_123",
   *   startTime: 0,
   *   endTime: 15,
   *   sceneType: "dialogue",
   *   deeplakeRef: "clip_abc123",
   *   clipPath: "https://storage.example.com/clips/clip1.mp4",
   *   keyframePath: "https://storage.example.com/keyframes/kf1.jpg"
   * });
   * ```
   */
  async create(data: CreateClipData): Promise<Clip> {
    const clipId = `clip_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create clip node
    const result = await graph.mutate(
      `
      CREATE (c:Clip {
        id: $id,
        assetId: $assetId,
        projectId: $projectId,
        startTime: $startTime,
        endTime: $endTime,
        sceneType: $sceneType,
        deeplakeRef: $deeplakeRef,
        clipPath: $clipPath,
        keyframePath: $keyframePath,
        createdAt: $now
      })
      RETURN c
      `,
      {
        id: clipId,
        assetId: data.assetId,
        projectId: data.projectId,
        startTime: data.startTime,
        endTime: data.endTime,
        sceneType: data.sceneType,
        deeplakeRef: data.deeplakeRef,
        clipPath: data.clipPath,
        keyframePath: data.keyframePath,
        now,
      }
    );

    // Create HAS_CLIP relationship from asset to clip
    await graph.createRelationship(data.assetId, clipId, "HAS_CLIP", {
      createdAt: now,
    });

    return this.mapNodeToClip(result);
  }

  /**
   * Create multiple clips in batch (after indexing)
   *
   * @param clips Array of clip data
   * @returns Created clips
   */
  async createBatch(clips: CreateClipData[]): Promise<Clip[]> {
    const createdClips: Clip[] = [];

    for (const clipData of clips) {
      const clip = await this.create(clipData);
      createdClips.push(clip);
    }

    return createdClips;
  }

  /**
   * Find clip by ID
   *
   * @param id Clip ID
   * @returns Clip or null if not found
   */
  async findById(id: string): Promise<Clip | null> {
    const results = await graph.query<any>(
      `
      MATCH (c:Clip {id: $id})
      RETURN c
      `,
      { id }
    );

    if (results.length === 0 || !results[0].c) {
      return null;
    }

    return this.mapNodeToClip(results[0].c);
  }

  /**
   * Find all clips for an asset
   *
   * @param assetId Asset ID
   * @returns Clips from the asset ordered by start time
   */
  async findByAsset(assetId: string): Promise<Clip[]> {
    const results = await graph.query<any>(
      `
      MATCH (a:UploadedAsset {id: $assetId})-[:HAS_CLIP]->(c:Clip)
      RETURN c
      ORDER BY c.startTime ASC
      `,
      { assetId }
    );

    return results
      .filter((r) => r.c)
      .map((result) => this.mapNodeToClip(result.c));
  }

  /**
   * Find all clips in a project
   *
   * @param projectId Project ID
   * @returns All clips in the project
   */
  async findByProject(projectId: string): Promise<Clip[]> {
    const results = await graph.query<any>(
      `
      MATCH (c:Clip {projectId: $projectId})
      RETURN c
      ORDER BY c.createdAt ASC
      `,
      { projectId }
    );

    return results
      .filter((r) => r.c)
      .map((result) => this.mapNodeToClip(result.c));
  }

  /**
   * Find clips by scene type within a project
   *
   * @param projectId Project ID
   * @param sceneType Scene type to filter by
   * @returns Clips matching the scene type
   */
  async findBySceneType(projectId: string, sceneType: string): Promise<Clip[]> {
    const results = await graph.query<any>(
      `
      MATCH (c:Clip {projectId: $projectId})
      RETURN c
      ORDER BY c.startTime ASC
      `,
      { projectId }
    );

    return results
      .filter((r) => r.c)
      .map((result) => this.mapNodeToClip(result.c))
      .filter((clip) => clip.sceneType === sceneType);
  }

  /**
   * Delete a clip
   *
   * @param id Clip ID
   */
  async delete(id: string): Promise<void> {
    await graph.deleteNode(id);
  }

  /**
   * Delete all clips for an asset
   *
   * @param assetId Asset ID
   */
  async deleteByAsset(assetId: string): Promise<void> {
    const clips = await this.findByAsset(assetId);

    for (const clip of clips) {
      await this.delete(clip.id);
    }
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToClip(node: Node): Clip {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id
    const id = props?.id || node.id;

    return {
      id,
      assetId: props?.assetId,
      projectId: props?.projectId,
      startTime: props?.startTime ?? 0,
      endTime: props?.endTime ?? 0,
      sceneType: props?.sceneType || 'unknown',
      deeplakeRef: props?.deeplakeRef,
      clipPath: props?.clipPath,
      keyframePath: props?.keyframePath,
      createdAt: props?.createdAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const clipRepository = new ClipRepository();
