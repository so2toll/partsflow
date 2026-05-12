/**
 * POST /api/video/index
 *
 * Video Indexing Endpoint for Edit Mode
 *
 * Triggers AI-powered video indexing for uploaded videos:
 * 1. Validates video exists and is uploaded
 * 2. Queues indexing job with BullMQ
 * 3. Returns jobId for progress tracking
 *
 * The indexing job will:
 * - Extract keyframes from video
 * - Generate embeddings with DeepLake
 * - Create searchable clips
 * - Enable semantic search and highlight generation
 *
 * Request Body:
 * {
 *   videoId: string;  // ID of uploaded video
 * }
 *
 * Response:
 * {
 *   success: true,
 *   jobId: string,
 *   videoId: string,
 *   message: string,
 *   estimatedTime: string
 * }
 *
 * Security:
 * - Requires authenticated session
 * - Requires 'video:update' permission
 * - Organization scoping enforced
 *
 * @module pages/api/video/index
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { addAssetIndexJob } from '@/lib/queue';
import { graph } from '@/lib/db/graph';
import { hasPermissionByRole } from '@/lib/services/PermissionService';
import { VIDEO_AI_PERMISSIONS } from '@/lib/configs/rbacConfig';

export const POST: APIRoute = async ({ request, cookies }) => {
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
    // 2. Check Video Update Permission
    // =========================================================================
    if (!hasPermissionByRole(userRole, VIDEO_AI_PERMISSIONS.VIDEO_UPDATE)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden',
          details: 'You do not have permission to index videos'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Parse Request Body
    // =========================================================================
    const body = await request.json();
    const { videoId } = body as { videoId: string };

    if (!videoId?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation Error',
          details: 'videoId is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. Verify Video Exists and User Has Access
    // =========================================================================
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

    // Verify user has access to this video (organization scoping)
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

    // Check if video is already indexed
    if (video.indexed === true) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Already Indexed',
          details: 'This video has already been indexed'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if video is in correct status
    if (video.status !== 'uploaded') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Status',
          details: `Video is in '${video.status}' status. Only uploaded videos can be indexed.`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 5. Create Project for Video (if not exists)
    // =========================================================================
    // For Edit Mode, we create a lightweight project to track the video
    let projectId = video.projectId;

    if (!projectId) {
      projectId = `proj_${Date.now()}`;
      const now = new Date().toISOString();

      await graph.mutate(
        `
        CREATE (p:Project {
          id: $projectId,
          name: $name,
          description: $description,
          organizationId: $organizationId,
          mode: 'edit',
          createdBy: $userId,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        RETURN p
        `,
        {
          projectId,
          name: `Edit: ${video.originalFilename}`,
          description: `Edit mode project for ${video.originalFilename}`,
          organizationId: video.organizationId,
          userId,
          createdAt: now,
          updatedAt: now,
        }
      );

      // Link video to project
      await graph.updateNode(videoId, { projectId });

      console.log(`[Video Index] Created project ${projectId} for video ${videoId}`);
    }

    // =========================================================================
    // 6. Update Video Status to 'indexing'
    // =========================================================================
    await graph.updateNode(videoId, {
      status: 'indexing',
      updatedAt: new Date().toISOString(),
    });

    // =========================================================================
    // 7. Queue Indexing Job
    // =========================================================================
    const job = await addAssetIndexJob({
      assetId: videoId,
      userId,
      projectId,
      blobUrl: video.videoUrl,
    });

    console.log(`[Video Index] Queued indexing job ${job.id} for video ${videoId}`);

    // =========================================================================
    // 8. Estimate Processing Time
    // =========================================================================
    // Rough estimate: 1 minute per 10MB of video
    const fileSizeMB = (video.fileSize || 0) / (1024 * 1024);
    const estimatedMinutes = Math.max(1, Math.ceil(fileSizeMB / 10));

    // =========================================================================
    // 9. Return Success Response
    // =========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        videoId,
        projectId,
        message: 'Video indexing started successfully',
        estimatedTime: `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Video Index] Error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Request',
          details: 'Request body must be valid JSON'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
