/**
 * Video Repository
 *
 * Provides data access operations for recruitment video entities.
 *
 * @module lib/db/repositories/VideoRepository
 * @version 0.1.0
 */

import { ulid } from 'ulid';
import { query, queryOne, execute } from '../turso';

export interface RecruitmentVideo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  type: 'meta_ad' | 'youtube_ad' | 'ctv_ad';
  jobRequisitionId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Repository for recruitment video operations
 */
export class VideoRepository {
  /**
   * Create a new recruitment video
   */
  async create(data: {
    title: string;
    description?: string;
    thumbnailUrl: string;
    videoUrl: string;
    type: 'meta_ad' | 'youtube_ad' | 'ctv_ad';
    jobRequisitionId?: string;
    tags?: string[];
  }): Promise<RecruitmentVideo> {
    const videoId = `rvid_${ulid()}`;
    const now = new Date().toISOString();
    const tags = JSON.stringify(data.tags || []);

    await execute(
      `
      INSERT INTO recruitment_videos (
        id, title, description, thumbnail_url, video_url,
        type, job_requisition_id, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        videoId,
        data.title,
        data.description || null,
        data.thumbnailUrl,
        data.videoUrl,
        data.type,
        data.jobRequisitionId || null,
        tags,
        now,
        now,
      ]
    );

    return (await this.findById(videoId))!;
  }

  /**
   * Find video by ID
   */
  async findById(id: string): Promise<RecruitmentVideo | null> {
    const result = await queryOne<any>(
      'SELECT * FROM recruitment_videos WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return this.transformRow(result);
  }

  /**
   * List videos with optional filters
   */
  async list(options: {
    type?: 'meta_ad' | 'youtube_ad' | 'ctv_ad';
    jobRequisitionId?: string;
    searchQuery?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
  } = {}): Promise<{ videos: RecruitmentVideo[]; total: number }> {
    const {
      type,
      jobRequisitionId,
      searchQuery,
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      orderDir = 'DESC',
    } = options;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (jobRequisitionId) {
      conditions.push('job_requisition_id = ?');
      params.push(jobRequisitionId);
    }

    if (searchQuery) {
      conditions.push('(title LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM recruitment_videos ${whereClause}`,
      params
    );
    const total = countResult?.count || 0;

    // Get videos
    const videos = await query<any>(
      `
      SELECT * FROM recruitment_videos
      ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return {
      videos: videos.map((v) => this.transformRow(v)),
      total,
    };
  }

  /**
   * Delete video by ID
   */
  async delete(id: string): Promise<boolean> {
    await execute('DELETE FROM recruitment_videos WHERE id = ?', [id]);
    return true;
  }

  /**
   * Transform database row to RecruitmentVideo object
   */
  private transformRow(row: any): RecruitmentVideo {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      videoUrl: row.video_url,
      type: row.type,
      jobRequisitionId: row.job_requisition_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Export singleton instance
export const videoRepository = new VideoRepository();
