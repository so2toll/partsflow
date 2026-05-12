/**
 * Studio Video Repository - Graph-Based Implementation
 *
 * Repository for StudioVideo entity operations using graph queries.
 * StudioVideos are final rendered videos produced by the AI Content Studio.
 *
 * Note: Named StudioVideoRepository to avoid conflict with existing
 * VideoRepository (recruitment videos).
 *
 * @module lib/db/repositories/StudioVideoRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export interface StudioVideo {
  id: string;              // vid_xxx
  projectId: string;
  outputUrl: string;       // Azure Blob URL to final .mp4
  thumbnailUrl: string;    // Azure Blob URL
  durationSeconds: number;
  renderCostCents: number;
  createdAt: string;
}

export interface CreateStudioVideoData {
  projectId: string;
  outputUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  renderCostCents: number;
}

// ============================================================================
// Studio Video Repository
// ============================================================================

/**
 * Repository for StudioVideo entity operations using graph queries
 */
export class StudioVideoRepository {
  /**
   * Create a new studio video
   *
   * @param data Video data
   * @returns Created video
   *
   * @example
   * ```typescript
   * const repo = new StudioVideoRepository();
   * const video = await repo.create({
   *   projectId: "proj_123",
   *   outputUrl: "https://storage.example.com/videos/final.mp4",
   *   thumbnailUrl: "https://storage.example.com/thumbnails/final.jpg",
   *   durationSeconds: 120,
   *   renderCostCents: 500
   * });
   * ```
   */
  async create(data: CreateStudioVideoData): Promise<StudioVideo> {
    const videoId = `vid_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create video node
    const result = await graph.mutate(
      `
      CREATE (v:StudioVideo {
        id: $id,
        projectId: $projectId,
        outputUrl: $outputUrl,
        thumbnailUrl: $thumbnailUrl,
        durationSeconds: $durationSeconds,
        renderCostCents: $renderCostCents,
        createdAt: $now
      })
      RETURN v
      `,
      {
        id: videoId,
        projectId: data.projectId,
        outputUrl: data.outputUrl,
        thumbnailUrl: data.thumbnailUrl,
        durationSeconds: data.durationSeconds,
        renderCostCents: data.renderCostCents,
        now,
      }
    );

    // Create PRODUCED relationship from project to video
    await graph.createRelationship(data.projectId, videoId, "PRODUCED", {
      createdAt: now,
    });

    return this.mapNodeToVideo(result);
  }

  /**
   * Find video by ID
   *
   * @param id Video ID
   * @returns Video or null if not found
   */
  async findById(id: string): Promise<StudioVideo | null> {
    const results = await graph.query<any>(
      `
      MATCH (v:StudioVideo {id: $id})
      RETURN v
      `,
      { id }
    );

    if (results.length === 0 || !results[0].v) {
      return null;
    }

    return this.mapNodeToVideo(results[0].v);
  }

  /**
   * Find all videos for a project
   *
   * @param projectId Project ID
   * @param options Query options
   * @returns Videos and total count
   */
  async findByProject(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ videos: StudioVideo[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get videos using graph query
    const results = await graph.query<any>(
      `
      MATCH (p:Project {id: $projectId})-[:PRODUCED]->(v:StudioVideo)
      RETURN v
      ORDER BY v.createdAt DESC
      LIMIT ${limit}
      SKIP ${offset}
      `,
      { projectId }
    );

    const videos = results
      .filter((r) => r.v)
      .map((result) => this.mapNodeToVideo(result.v));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (p:Project {id: $projectId})-[:PRODUCED]->(v:StudioVideo)
      RETURN count(v) as count
      `,
      { projectId }
    );

    const total = countResults[0]?.count || 0;

    return { videos, total };
  }

  /**
   * Delete a video
   *
   * @param id Video ID
   */
  async delete(id: string): Promise<void> {
    await graph.deleteNode(id);
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToVideo(node: Node): StudioVideo {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id
    const id = props?.id || node.id;

    return {
      id,
      projectId: props?.projectId,
      outputUrl: props?.outputUrl,
      thumbnailUrl: props?.thumbnailUrl,
      durationSeconds: props?.durationSeconds ?? 0,
      renderCostCents: props?.renderCostCents ?? 0,
      createdAt: props?.createdAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const studioVideoRepository = new StudioVideoRepository();
