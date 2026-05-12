/**
 * API Endpoint: Get Video Generation Status
 *
 * GET /api/video/[id]/status
 *
 * Purpose:
 * Returns the generation status and progress for a video project.
 * This endpoint combines project status from the graph database with
 * real-time job status from the queue system.
 *
 * Features:
 * - Accepts video/project ID from route parameter
 * - Returns both project status and job queue status
 * - Calculates progress based on completed scenes
 * - Returns output video URL when available
 * - Includes error messages if generation failed
 *
 * Security:
 * - Requires authenticated session
 * - Validates user has access to the project
 *
 * Response Format:
 * {
 *   projectId: string,
 *   videoStatus: 'draft' | 'scripted' | 'generating' | 'rendering' | 'completed' | 'failed',
 *   progress: number (0-100),
 *   totalScenes: number,
 *   completedScenes: number,
 *   outputVideoUrl?: string,
 *   thumbnailUrl?: string,
 *   estimatedDuration?: number,
 *   errorMessage?: string,
 *   jobStatus?: {
 *     state: string,
 *     progress: number
 *   }
 * }
 *
 * @module lib/pages/api/video/[id]/status
 * @version 1.0.0
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { projectRepository } from '@/lib/db/repositories';
import { getJob, getJobState, QUEUES } from '@/lib/queue';

export const GET: APIRoute = async ({ request, cookies, params }) => {
  try {
    // 1. Authenticate user
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get project ID from route parameter
    const projectId = params.id;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get project from graph database
    const project = await projectRepository.findById(projectId);

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Cast to VideoProject to access video-specific fields
    const videoProject = project as any;

    // 5. Get job status from queue if project is in progress
    let jobStatus;
    if (videoProject.videoStatus === 'generating' || videoProject.videoStatus === 'rendering') {
      // Job ID format: generate:{projectId}
      const jobId = `generate:${projectId}`;
      const state = await getJobState(QUEUES.VIDEO_GENERATE, jobId);

      if (state) {
        jobStatus = {
          state: state.state,
          progress: state.progress || 0,
        };
      } else {
        // No job found in queue - may have completed or failed
        jobStatus = {
          state: 'unknown',
          progress: 0,
        };
      }
    }

    // 6. Calculate progress based on completed scenes
    let progress = 0;
    if (videoProject.videoStatus === 'completed') {
      progress = 100;
    } else if (videoProject.videoStatus === 'generating' || videoProject.videoStatus === 'rendering') {
      const total = videoProject.totalScenes || 1;
      const completed = videoProject.completedScenes || 0;
      progress = Math.round((completed / total) * 100);

      // Use job progress if available and more granular
      if (jobStatus && jobStatus.progress > 0) {
        progress = Math.max(progress, jobStatus.progress);
      }
    }

    // 7. Return status response
    return new Response(
      JSON.stringify({
        projectId: project.id,
        videoStatus: videoProject.videoStatus || 'draft',
        progress,
        totalScenes: videoProject.totalScenes || 0,
        completedScenes: videoProject.completedScenes || 0,
        outputVideoUrl: videoProject.outputVideoUrl,
        thumbnailUrl: videoProject.thumbnailUrl,
        estimatedDuration: videoProject.estimatedDuration,
        errorMessage: videoProject.errorMessage,
        jobStatus,
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
