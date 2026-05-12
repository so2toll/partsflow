/**
 * GET /api/clips
 *
 * Clips Listing Endpoint for Edit Mode
 *
 * Returns paginated, searchable list of clips for a video or project.
 * Clips are generated during video indexing and represent searchable segments.
 *
 * Query Parameters:
 * - videoId?: string - Filter by video ID
 * - projectId?: string - Filter by project ID
 * - search?: string - Search by scene type or content
 * - sceneType?: string - Filter by scene type (dialogue, action, etc.)
 * - limit?: number (default: 20, max: 100)
 * - offset?: number (default: 0)
 *
 * Response:
 * {
 *   success: true,
 *   clips: Clip[],
 *   total: number,
 *   limit: number,
 *   offset: number
 * }
 *
 * Security:
 * - Requires authenticated session
 * - Requires 'video:read' permission
 * - Organization scoping enforced
 *
 * @module pages/api/clips
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { clipRepository } from '@/lib/db/repositories/ClipRepository';
import { graph } from '@/lib/db/graph';
import { hasPermissionByRole } from '@/lib/services/PermissionService';
import { VIDEO_AI_PERMISSIONS } from '@/lib/configs/rbacConfig';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // =========================================================================
    // 1. Authenticate User
    // =========================================================================
    const session = await getSession(request, cookies);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          details: 'Valid authentication required'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.global_id || session.user.id;
    const userRole = session.user.role;
    const organizationId = session.user.organizationId;

    // =========================================================================
    // 2. Check Video Read Permission
    // =========================================================================
    if (!hasPermissionByRole(userRole, VIDEO_AI_PERMISSIONS.VIDEO_READ)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden',
          details: 'You do not have permission to view clips'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Parse Query Parameters
    // =========================================================================
    const videoId = url.searchParams.get('videoId');
    const projectId = url.searchParams.get('projectId');
    const search = url.searchParams.get('search');
    const sceneType = url.searchParams.get('sceneType');
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Require either videoId or projectId
    if (!videoId && !projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation Error',
          details: 'Either videoId or projectId is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. Verify Access to Video/Project
    // =========================================================================
    if (videoId) {
      // Verify video exists and user has access
      const videoResults = await graph.query<any>(
        `
        MATCH (v:UploadedVideo {id: $videoId})
        RETURN v
        `,
        { videoId }
      );

      if (videoResults.length === 0 || !videoResults[0].v) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Not Found',
            details: 'Video not found'
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const video = videoResults[0].v.properties;

      // Check organization access
      if (userRole !== 'SuperAdmin' && video.organizationId !== organizationId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Forbidden',
            details: 'You do not have access to this video'
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (projectId) {
      // Verify project exists and user has access
      const projectResults = await graph.query<any>(
        `
        MATCH (p:Project {id: $projectId})
        RETURN p
        `,
        { projectId }
      );

      if (projectResults.length === 0 || !projectResults[0].p) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Not Found',
            details: 'Project not found'
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const project = projectResults[0].p.properties;

      // Check organization access
      if (userRole !== 'SuperAdmin' && project.organizationId !== organizationId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Forbidden',
            details: 'You do not have access to this project'
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // 5. Fetch Clips
    // =========================================================================
    let clips;

    if (videoId) {
      // Get clips for specific video
      clips = await clipRepository.findByAsset(videoId);
    } else if (projectId) {
      // Get clips for project
      if (sceneType) {
        clips = await clipRepository.findBySceneType(projectId, sceneType);
      } else {
        clips = await clipRepository.findByProject(projectId);
      }
    } else {
      clips = [];
    }

    // =========================================================================
    // 6. Apply Search Filter (Client-side for now)
    // =========================================================================
    let filteredClips = clips;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredClips = clips.filter(clip =>
        clip.sceneType.toLowerCase().includes(searchLower) ||
        clip.deeplakeRef.toLowerCase().includes(searchLower)
      );
    }

    // =========================================================================
    // 7. Apply Pagination
    // =========================================================================
    const total = filteredClips.length;
    const paginatedClips = filteredClips.slice(offset, offset + limit);

    // =========================================================================
    // 8. Return Success Response
    // =========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        clips: paginatedClips,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Clips API] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
