/**
 * Video Repository - Graph-Based Implementation
 *
 * Example repository showing how to use graph operations
 * for data access while maintaining clean separation.
 *
 * This replaces the old SQL-based VideoRepository with graph queries.
 *
 * @module lib/db/repositories/VideoRepository
 * @version 0.2.0 - Graph Edition
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
  fps?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  description?: string;
  thumbnailUrl?: string;
  orderIndex: number;
  createdAt: string;
}

export interface Detection {
  id: string;
  sceneId: string;
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  type: "object_detection" | "scene_classification" | "tracking";
  createdAt: string;
}

// ============================================================================
// Video Repository
// ============================================================================

/**
 * Repository for Video entity operations using graph queries
 */
export class VideoRepository {
  /**
   * Create a new video
   *
   * @param data Video data
   * @returns Created video
   *
   * @example
   * ```typescript
   * const repo = new VideoRepository();
   * const video = await repo.create({
   *   title: "My Video",
   *   url: "https://example.com/video.mp4",
   *   duration: 120
   * });
   * ```
   */
  async create(data: {
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    duration?: number;
    format?: string;
    width?: number;
    height?: number;
    fps?: number;
  }): Promise<Video> {
    const videoId = `vid_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create video node
    const result = await graph.mutate(
      `
      CREATE (v:Video {
        id: $id,
        title: $title,
        description: $description,
        url: $url,
        thumbnailUrl: $thumbnailUrl,
        duration: $duration,
        format: $format,
        width: $width,
        height: $height,
        fps: $fps,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN v
      `,
      {
        id: videoId,
        title: data.title,
        description: data.description || null,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl || null,
        duration: data.duration || null,
        format: data.format || null,
        width: data.width || null,
        height: data.height || null,
        fps: data.fps || null,
        now,
      }
    );

    return this.mapNodeToVideo(result);
  }

  /**
   * Find video by ID
   *
   * @param id Video ID
   * @returns Video or null if not found
   */
  async findById(id: string): Promise<Video | null> {
    const results = await graph.query<any>(
      `
      MATCH (v:Video {id: $id})
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
   * List all videos with optional filtering
   *
   * @param options Query options
   * @returns Videos and total count
   */
  async list(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "ASC" | "DESC";
  } = {}): Promise<{ videos: Video[]; total: number }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get videos using graph query
    const results = await graph.query<any>(
      `
      MATCH (v:Video)
      RETURN v
      ORDER BY v.createdAt ${options.orderDir || "DESC"}
      LIMIT ${limit}
      SKIP ${offset}
      `
    );

    const videos = results
      .filter((r) => r.v)
      .map((result) => this.mapNodeToVideo(result.v));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (v:Video)
      RETURN count(v) as count
      `
    );

    const total = countResults[0]?.count || 0;

    return { videos, total };
  }

  /**
   * Find videos with their scenes
   *
   * @param videoId Optional video ID to filter by
   * @returns Videos with their scenes
   */
  async findWithScenes(videoId?: string): Promise<
    Array<{
      video: Video;
      scenes: Scene[];
    }>
  > {
    const whereClause = videoId ? "{id: $videoId}" : "";
    const params: Record<string, string> = videoId ? { videoId } : {};

    const results = await graph.query<any>(
      `
      MATCH (v:Video ${whereClause})-[:HAS_SCENE]->(s:Scene)
      RETURN v, collect(s) as scenes
      ORDER BY v.createdAt DESC
      `,
      params
    );

    return results.map((result) => ({
      video: this.mapNodeToVideo(result.v),
      scenes: result.scenes.map((s: Node) => this.mapNodeToScene(s)),
    }));
  }

  /**
   * Find videos with detection results
   *
   * @param videoId Optional video ID to filter by
   * @returns Videos with scenes and detections
   */
  async findWithDetections(videoId?: string): Promise<
    Array<{
      video: Video;
      scenes: Array<{
        scene: Scene;
        detections: Detection[];
      }>;
    }>
  > {
    const whereClause = videoId ? "{id: $videoId}" : "";
    const params: Record<string, string> = videoId ? { videoId } : {};

    const results = await graph.query<any>(
      `
      MATCH (v:Video ${whereClause})-[:HAS_SCENE]->(s:Scene)-[:HAS_DETECTION]->(d:Detection)
      RETURN v, s, collect(d) as detections
      ORDER BY v.createdAt DESC, s.orderIndex ASC
      `,
      params
    );

    // Group by video and scene
    const videoMap = new Map<
      string,
      {
        video: Video;
        scenes: Map<string, { scene: Scene; detections: Detection[] }>;
      }
    >();

    results.forEach((result) => {
      const video = this.mapNodeToVideo(result.v);
      const scene = this.mapNodeToScene(result.s);
      const detections = result.detections.map((d: Node) =>
        this.mapNodeToDetection(d)
      );

      if (!videoMap.has(video.id)) {
        videoMap.set(video.id, {
          video,
          scenes: new Map(),
        });
      }

      const videoEntry = videoMap.get(video.id)!;
      if (!videoEntry.scenes.has(scene.id)) {
        videoEntry.scenes.set(scene.id, { scene, detections: [] });
      }

      const sceneEntry = videoEntry.scenes.get(scene.id)!;
      sceneEntry.detections.push(...detections);
    });

    // Convert to array format
    return Array.from(videoMap.values()).map((entry) => ({
      video: entry.video,
      scenes: Array.from(entry.scenes.values()),
    }));
  }

  /**
   * Update video
   *
   * @param id Video ID
   * @param data Updates to apply
   * @returns Updated video
   */
  async update(
    id: string,
    data: Partial<
      Omit<Video, "id" | "createdAt" | "updatedAt">
    >
  ): Promise<Video> {
    // For now, this is a placeholder - you'd implement this with
    // a graph MERGE operation or direct SQL update
    throw new Error("Update not implemented yet");
  }

  /**
   * Delete video
   *
   * @param id Video ID
   */
  async delete(id: string): Promise<void> {
    // This would cascade delete scenes and detections
    // For now, placeholder
    throw new Error("Delete not implemented yet");
  }

  // ========================================================================
  // Scene Operations
  // ========================================================================

  /**
   * Add a scene to a video
   *
   * @param videoId Video ID
   * @param data Scene data
   * @returns Created scene
   */
  async addScene(
    videoId: string,
    data: {
      startTime: number;
      endTime: number;
      description?: string;
      thumbnailUrl?: string;
      orderIndex: number;
    }
  ): Promise<Scene> {
    const sceneId = `scn_${ulid()}`;
    const now = new Date().toISOString();

    // Create scene node
    await graph.mutate(
      `
      CREATE (s:Scene {
        id: $id,
        videoId: $videoId,
        startTime: $startTime,
        endTime: $endTime,
        description: $description,
        thumbnailUrl: $thumbnailUrl,
        orderIndex: $orderIndex,
        createdAt: $now
      })
      RETURN s
      `,
      {
        id: sceneId,
        videoId,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        orderIndex: data.orderIndex,
        now,
      }
    );

    // Create relationship from video to scene
    await graph.createRelationship(videoId, sceneId, "HAS_SCENE", {
      order: data.orderIndex,
    });

    const results = await graph.query<any>(
      `
      MATCH (s:Scene {id: $id})
      RETURN s
      `,
      { id: sceneId }
    );

    return this.mapNodeToScene(results[0].s);
  }

  /**
   * Add detection to a scene
   *
   * @param sceneId Scene ID
   * @param data Detection data
   * @returns Created detection
   */
  async addDetection(
    sceneId: string,
    data: {
      label: string;
      confidence: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      timestamp: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Detection> {
    const detectionId = `det_${ulid()}`;

    // Create detection node
    await graph.mutate(
      `
      CREATE (d:Detection {
        id: $id,
        sceneId: $sceneId,
        label: $label,
        confidence: $confidence,
        boundingBox: $boundingBox,
        timestamp: $timestamp,
        metadata: $metadata
      })
      RETURN d
      `,
      {
        id: detectionId,
        sceneId,
        label: data.label,
        confidence: data.confidence,
        boundingBox: data.boundingBox || null,
        timestamp: data.timestamp,
        metadata: data.metadata || null,
      }
    );

    // Create relationship from scene to detection
    await graph.createRelationship(sceneId, detectionId, "HAS_DETECTION", {
      confidence: data.confidence,
    });

    const results = await graph.query<any>(
      `
      MATCH (d:Detection {id: $id})
      RETURN d
      `,
      { id: detectionId }
    );

    return this.mapNodeToDetection(results[0].d);
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToVideo(node: Node): Video {
    const props = node.properties as any;
    return {
      id: node.id,
      title: props.title,
      description: props.description,
      url: props.url,
      thumbnailUrl: props.thumbnailUrl,
      duration: props.duration,
      format: props.format,
      width: props.width,
      height: props.height,
      fps: props.fps,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  private mapNodeToScene(node: Node): Scene {
    const props = node.properties as any;
    return {
      id: node.id,
      videoId: props.videoId,
      startTime: props.startTime,
      endTime: props.endTime,
      description: props.description,
      thumbnailUrl: props.thumbnailUrl,
      orderIndex: props.orderIndex,
      createdAt: props.createdAt,
    };
  }

  private mapNodeToDetection(node: Node): Detection {
    const props = node.properties as any;
    return {
      id: node.id,
      sceneId: props.sceneId,
      label: props.label,
      confidence: props.confidence,
      boundingBox: props.boundingBox,
      timestamp: props.timestamp,
      metadata: props.metadata,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const videoRepository = new VideoRepository();
