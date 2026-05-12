/**
 * Asset Repository - Graph-Based Implementation
 *
 * Repository for UploadedAsset entity operations using graph queries.
 * Assets are video/media files uploaded to a project for processing.
 *
 * @module lib/db/repositories/AssetRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export type IndexingStatus = 'pending' | 'indexing' | 'indexed' | 'failed';

export interface UploadedAsset {
  id: string;              // asset_xxx
  userId: string;          // uploader
  projectId: string;
  organizationId: string;
  filename: string;
  blobUrl: string;
  fileSizeBytes: number;
  durationSeconds: number;
  mimeType: string;
  indexingStatus: IndexingStatus;
  clipCount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAssetData {
  userId: string;
  projectId: string;
  organizationId: string;
  filename: string;
  blobUrl: string;
  fileSizeBytes: number;
  durationSeconds: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Asset Repository
// ============================================================================

/**
 * Repository for UploadedAsset entity operations using graph queries
 */
export class AssetRepository {
  /**
   * Create a new asset
   *
   * @param data Asset data
   * @returns Created asset
   *
   * @example
   * ```typescript
   * const repo = new AssetRepository();
   * const asset = await repo.create({
   *   userId: "user_123",
   *   projectId: "proj_123",
   *   organizationId: "org_123",
   *   filename: "interview.mp4",
   *   blobUrl: "https://storage.example.com/interview.mp4",
   *   fileSizeBytes: 104857600,
   *   durationSeconds: 300,
   *   mimeType: "video/mp4"
   * });
   * ```
   */
  async create(data: CreateAssetData): Promise<UploadedAsset> {
    const assetId = `asset_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create asset node
    const result = await graph.mutate(
      `
      CREATE (a:UploadedAsset {
        id: $id,
        userId: $userId,
        projectId: $projectId,
        organizationId: $organizationId,
        filename: $filename,
        blobUrl: $blobUrl,
        fileSizeBytes: $fileSizeBytes,
        durationSeconds: $durationSeconds,
        mimeType: $mimeType,
        indexingStatus: $indexingStatus,
        clipCount: $clipCount,
        metadata: $metadata,
        createdAt: $now
      })
      RETURN a
      `,
      {
        id: assetId,
        userId: data.userId,
        projectId: data.projectId,
        organizationId: data.organizationId,
        filename: data.filename,
        blobUrl: data.blobUrl,
        fileSizeBytes: data.fileSizeBytes,
        durationSeconds: data.durationSeconds,
        mimeType: data.mimeType,
        indexingStatus: 'pending',
        clipCount: null,
        metadata: JSON.stringify(data.metadata || {}),
        now,
      }
    );

    // Create HAS_ASSET relationship from project to asset
    await graph.createRelationship(data.projectId, assetId, "HAS_ASSET", {
      createdAt: now,
    });

    return this.mapNodeToAsset(result);
  }

  /**
   * Find asset by ID
   *
   * @param id Asset ID
   * @returns Asset or null if not found
   */
  async findById(id: string): Promise<UploadedAsset | null> {
    const results = await graph.query<any>(
      `
      MATCH (a:UploadedAsset {id: $id})
      RETURN a
      `,
      { id }
    );

    if (results.length === 0 || !results[0].a) {
      return null;
    }

    return this.mapNodeToAsset(results[0].a);
  }

  /**
   * Find all assets for a project
   *
   * @param projectId Project ID
   * @param options Query options
   * @returns Assets and total count
   */
  async findByProject(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ assets: UploadedAsset[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get assets using graph query
    const results = await graph.query<any>(
      `
      MATCH (p:Project {id: $projectId})-[:HAS_ASSET]->(a:UploadedAsset)
      RETURN a
      ORDER BY a.createdAt DESC
      LIMIT ${limit}
      SKIP ${offset}
      `,
      { projectId }
    );

    const assets = results
      .filter((r) => r.a)
      .map((result) => this.mapNodeToAsset(result.a));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (p:Project {id: $projectId})-[:HAS_ASSET]->(a:UploadedAsset)
      RETURN count(a) as count
      `,
      { projectId }
    );

    const total = countResults[0]?.count || 0;

    return { assets, total };
  }

  /**
   * Update asset
   *
   * @param id Asset ID
   * @param data Updates to apply
   * @returns Updated asset
   */
  async update(
    id: string,
    data: Partial<Omit<UploadedAsset, "id" | "createdAt" | "userId" | "projectId" | "organizationId">>
  ): Promise<UploadedAsset> {
    const updates: Record<string, unknown> = {};

    if (data.filename !== undefined) updates.filename = data.filename;
    if (data.blobUrl !== undefined) updates.blobUrl = data.blobUrl;
    if (data.fileSizeBytes !== undefined) updates.fileSizeBytes = data.fileSizeBytes;
    if (data.durationSeconds !== undefined) updates.durationSeconds = data.durationSeconds;
    if (data.mimeType !== undefined) updates.mimeType = data.mimeType;
    if (data.indexingStatus !== undefined) updates.indexingStatus = data.indexingStatus;
    if (data.clipCount !== undefined) updates.clipCount = data.clipCount;
    if (data.metadata !== undefined) updates.metadata = JSON.stringify(data.metadata);

    const result = await graph.updateNode(id, updates);

    return this.mapNodeToAsset(result);
  }

  /**
   * Update indexing status with optional clip count
   *
   * @param id Asset ID
   * @param status New indexing status
   * @param clipCount Optional clip count (for indexed status)
   * @returns Updated asset
   */
  async updateIndexingStatus(
    id: string,
    status: IndexingStatus,
    clipCount?: number
  ): Promise<UploadedAsset> {
    const updates: Partial<UploadedAsset> = { indexingStatus: status };

    if (clipCount !== undefined) {
      updates.clipCount = clipCount;
    }

    return this.update(id, updates);
  }

  /**
   * Delete asset and its clips
   *
   * @param id Asset ID
   */
  async delete(id: string): Promise<void> {
    // First delete all clips associated with this asset
    const clips = await this.getClips(id);
    for (const clip of clips) {
      await graph.deleteNode(clip.id);
    }

    // Delete the asset node and all its relationships
    await graph.deleteNode(id);
  }

  /**
   * Get clips extracted from this asset
   *
   * @param assetId Asset ID
   * @returns Clips from the asset
   */
  async getClips(assetId: string): Promise<Node[]> {
    const results = await graph.queryRelated(assetId, "HAS_CLIP", "out", "Clip");

    return results.map(({ node }) => node);
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToAsset(node: Node): UploadedAsset {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id
    const id = props?.id || node.id;

    return {
      id,
      userId: props?.userId,
      projectId: props?.projectId,
      organizationId: props?.organizationId,
      filename: props?.filename,
      blobUrl: props?.blobUrl,
      fileSizeBytes: props?.fileSizeBytes ?? 0,
      durationSeconds: props?.durationSeconds ?? 0,
      mimeType: props?.mimeType,
      indexingStatus: props?.indexingStatus || 'pending',
      clipCount: props?.clipCount,
      metadata: typeof props?.metadata === 'string'
        ? JSON.parse(props.metadata)
        : props?.metadata || {},
      createdAt: props?.createdAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const assetRepository = new AssetRepository();
