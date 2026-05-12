/**
 * POST /api/video/generate
 *
 * Video Generation Endpoint for Video AI Content Studio
 *
 * Creates a new video project, validates user quota, and queues generation job.
 * Follows Video AI Content Studio patterns with proper RBAC and quota validation.
 *
 * Request Body:
 * {
 *   projectName: string;
 *   projectDescription?: string;
 *   script: string;
 *   prompt?: string;  // Alternative to script
 *   qualityTier: 'standard' | 'high' | 'premium';
 *   selectedCharacters?: string[];
 * }
 *
 * Response:
 * {
 *   success: true;
 *   projectId: string;
 *   videoId: string;
 *   jobId: string;
 *   estimatedMinutes: number;
 *   message: string;
 * }
 *
 * @module pages/api/video/generate
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { projectRepository, userSubscriptionRepository } from '@/lib/db/repositories';
import { addVideoGenerateJob } from '@/lib/queue';
import { ulid } from 'ulid';
import { graph } from '@/lib/db/graph';
import { hasPermissionByRole } from '@/lib/services/PermissionService';
import { VIDEO_AI_PERMISSIONS } from '@/lib/configs/rbacConfig.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // =========================================================================
    // 1. Authenticate User
    // =========================================================================
    const session = await getSession(request, cookies);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Valid authentication required'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.global_id || session.user.id;
    const userRole = session.user.role;

    // =========================================================================
    // 2. Check Video Generation Permission
    // =========================================================================
    if (!hasPermissionByRole(userRole, VIDEO_AI_PERMISSIONS.VIDEO_GENERATE)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          details: 'You do not have permission to generate videos'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Parse and Validate Request Body
    // =========================================================================
    const body = await request.json();
    const {
      projectName,
      projectDescription,
      script,
      prompt,
      qualityTier,
      selectedCharacters = [],
    } = body as {
      projectName: string;
      projectDescription?: string;
      script?: string;
      prompt?: string;
      qualityTier: 'standard' | 'high' | 'premium';
      selectedCharacters?: string[];
    };

    // Validate required fields
    if (!projectName?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'Project name is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Accept either script or prompt
    const videoContent = script || prompt;
    if (!videoContent?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'Either script or prompt is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate quality tier
    const validQualityTiers = ['standard', 'high', 'premium'];
    if (!validQualityTiers.includes(qualityTier)) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: `Invalid quality tier. Must be one of: ${validQualityTiers.join(', ')}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Validate User Quota
    // =========================================================================
    // Estimate video duration based on word count (roughly: 150 words = 1 minute)
    const wordCount = videoContent.trim().split(/\s+/).length;
    const estimatedMinutes = Math.ceil(wordCount / 150);

    // Check if user has sufficient quota
    const hasQuota = await userSubscriptionRepository.hasQuota(userId, estimatedMinutes);

    if (!hasQuota) {
      const remaining = await userSubscriptionRepository.getRemainingMinutes(userId);
      return new Response(
        JSON.stringify({
          error: 'Insufficient Quota',
          message: `You need ${estimatedMinutes} minutes but only have ${remaining} remaining`,
          remainingMinutes: remaining,
          estimatedMinutes: estimatedMinutes,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. Get User's Organization
    // =========================================================================
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return new Response(
        JSON.stringify({
          error: 'Organization Required',
          details: 'Your account is not associated with an organization. Please contact support.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 5. Create Video Project
    // =========================================================================
    const renderQuality = qualityTier === 'premium' ? '4k' : qualityTier === 'high' ? '1080p' : '720p';

    const project = await projectRepository.createVideoProject({
      name: projectName,
      description: projectDescription,
      userId,
      organizationId,
      mode: 'create',
      script: videoContent,
      renderQuality,
    });

    // Update script with scene count (estimated from [Scene N] markers)
    const scenes = videoContent.split(/\[Scene \d+\]/i).filter(s => s.trim());
    await projectRepository.updateScript(project.id, videoContent, scenes.length);

    // =========================================================================
    // 6. Create Video Node in Graph
    // =========================================================================
    const videoId = `vid_${ulid()}`;
    const now = new Date().toISOString();

    // Create video node with initial status
    await graph.mutate(
      `
      CREATE (v:Video {
        id: $id,
        projectId: $projectId,
        userId: $userId,
        organizationId: $organizationId,
        script: $script,
        prompt: $prompt,
        qualityTier: $qualityTier,
        renderQuality: $renderQuality,
        status: $status,
        estimatedDurationMinutes: $estimatedDurationMinutes,
        outputVideoUrl: $outputVideoUrl,
        thumbnailUrl: $thumbnailUrl,
        selectedCharacters: $selectedCharacters,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN v
      `,
      {
        id: videoId,
        projectId: project.id,
        userId,
        organizationId,
        script: script || null,
        prompt: prompt || null,
        qualityTier,
        renderQuality,
        status: 'draft',
        estimatedDurationMinutes: estimatedMinutes,
        outputVideoUrl: null,
        thumbnailUrl: null,
        selectedCharacters: JSON.stringify(selectedCharacters),
        now,
      }
    );

    // Create relationship between project and video
    await graph.createRelationship(project.id, videoId, 'HAS_VIDEO', {
      createdAt: now,
    });

    console.log(`[Video AI] Created video node ${videoId} for project ${project.id}`);

    // =========================================================================
    // 7. Queue Video Generation Job
    // =========================================================================
    const job = await addVideoGenerateJob({
      projectId: project.id,
      userId,
      organizationId,
      sceneIds: [], // Will be populated by script parser in worker
      quality: renderQuality,
    });

    console.log(`[Video AI] Created project ${project.id}, video ${videoId}, and queued job ${job.id}`);

    // =========================================================================
    // 8. Return Success Response
    // =========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        projectId: project.id,
        videoId: videoId,
        jobId: job.id,
        estimatedMinutes,
        estimatedScenes: scenes.length,
        message: 'Video generation started successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Video AI] Generation error:', error);

    // Determine appropriate status code
    let statusCode = 500;
    let errorDetails = 'An unexpected error occurred';

    if (error instanceof Error) {
      errorDetails = error.message;

      // Check for specific error types
      if (error.message.includes('quota')) {
        statusCode = 402;
      } else if (error.message.includes('validation')) {
        statusCode = 400;
      } else if (error.message.includes('unauthorized')) {
        statusCode = 401;
      }
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to start video generation',
        details: errorDetails,
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/video/generate?projectId={projectId}
 *
 * Get generation status for a video project
 *
 * Query Parameters:
 * - projectId: string (required) - Project ID to check status
 *
 * Response:
 * {
 *   projectId: string;
 *   videoStatus: 'draft' | 'scripted' | 'generating' | 'rendering' | 'completed' | 'failed';
 *   jobStatus?: {
 *     state: string;
 *     progress: number;
 *   };
 *   outputVideoUrl?: string;
 *   thumbnailUrl?: string;
 *   completedScenes: number;
 *   totalScenes: number;
 * }
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // =========================================================================
    // 1. Authenticate User
    // =========================================================================
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Valid authentication required'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 2. Parse Query Parameters
    // =========================================================================
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const videoId = url.searchParams.get('videoId');

    if (!projectId && !videoId) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'Either projectId or videoId is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Get Project Status
    // =========================================================================
    const project = await projectRepository.findById(projectId || '');

    if (!project) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          details: 'Project not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. Get Video Node (if videoId provided)
    // =========================================================================
    let videoData: any = null;
    if (videoId) {
      const videoResults = await graph.query<any>(
        `
        MATCH (v:Video {id: $videoId})
        RETURN v
        `,
        { videoId }
      );

      if (videoResults.length > 0 && videoResults[0].v) {
        const videoNode = videoResults[0].v;
        videoData = {
          id: videoNode.properties.id,
          status: videoNode.properties.status,
          outputVideoUrl: videoNode.properties.outputVideoUrl,
          thumbnailUrl: videoNode.properties.thumbnailUrl,
          estimatedDurationMinutes: videoNode.properties.estimatedDurationMinutes,
        };
      }
    }

    // =========================================================================
    // 5. Get Job Status from Queue (if available)
    // =========================================================================
    // TODO: Integrate with BullMQ to get real-time job status
    // For now, return project-based status
    const jobStatus = {
      state: 'queued',
      progress: 0,
    };

    // Map project videoStatus to job state
    const videoProject = project as any;
    if (videoProject.videoStatus === 'generating') {
      jobStatus.state = 'processing';
      jobStatus.progress = Math.round(
        (videoProject.completedScenes / videoProject.totalScenes) * 100
      ) || 0;
    } else if (videoProject.videoStatus === 'completed') {
      jobStatus.state = 'completed';
      jobStatus.progress = 100;
    } else if (videoProject.videoStatus === 'failed') {
      jobStatus.state = 'failed';
    }

    // =========================================================================
    // 6. Return Status Response
    // =========================================================================
    return new Response(
      JSON.stringify({
        projectId: project.id,
        videoId: videoData?.id,
        videoStatus: videoProject.videoStatus || 'draft',
        jobStatus,
        outputVideoUrl: videoData?.outputVideoUrl || videoProject.outputVideoUrl,
        thumbnailUrl: videoData?.thumbnailUrl || videoProject.thumbnailUrl,
        completedScenes: videoProject.completedScenes || 0,
        totalScenes: videoProject.totalScenes || 0,
        errorMessage: videoProject.errorMessage,
        estimatedDurationMinutes: videoData?.estimatedDurationMinutes,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Video AI] Status error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
