/**
 * GPU Worker Endpoint: Job Status
 *
 * GET /api/internal/gpu/status/[jobId]
 * PATCH /api/internal/gpu/status/[jobId] (internal)
 *
 * Purpose:
 * Retrieves the current status and progress of a GPU worker job.
 * Also supports internal PATCH requests to update job progress.
 *
 * Features:
 * - Returns job state, progress, and result data
 * - Includes estimated completion time
 * - Returns keyframe/scene URLs when available
 * - Supports internal progress updates
 * - Handles completed and failed jobs
 *
 * Response (GET):
 * {
 *   jobId: string;
 *   jobType: 'keyframe' | 'scene';
 *   state: 'queued' | 'processing' | 'completed' | 'failed';
 *   progress: number; // 0-100
 *   startedAt: string;
 *   completedAt?: string;
 *   estimatedCompletion?: string;
 *   // Keyframe-specific
 *   keyframeId?: string;
 *   keyframeUrl?: string;
 *   // Scene-specific
 *   sceneId?: string;
 *   sceneUrl?: string;
 *   totalFrames?: number;
 *   completedFrames?: number;
 *   // Error handling
 *   error?: string;
 *   errorMessage?: string;
 *   retryable?: boolean;
 * }
 *
 * @module pages/api/internal/gpu/status/[jobId]
 * @version 1.0.0
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { getJob, updateJob } from '../job-store';
import type { GPUJobStatus } from '../types';

// ============================================================================
// GET Endpoint - Retrieve Job Status
// ============================================================================

export const GET: APIRoute = async ({ request, cookies, params }) => {
  try {
    // =========================================================================
    // 1. Authenticate Request
    // =========================================================================
    const session = await getSession(request, cookies);
    const isInternalRequest = request.headers.get('x-internal-api-key') === process.env.INTERNAL_API_KEY;

    if (!session?.user?.id && !isInternalRequest) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Valid authentication or internal API key required'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 2. Get Job ID from Route Parameter
    // =========================================================================
    const jobId = params.jobId;

    if (!jobId) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'Job ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Retrieve Job from Store
    // =========================================================================
    const job = getJob(jobId);

    if (!job) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          details: `Job ${jobId} not found or has expired`
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. Calculate Estimated Completion Time
    // =========================================================================
    let estimatedCompletion: string | undefined;

    if (job.state === 'processing') {
      // Estimate based on progress and elapsed time
      const startedAt = new Date(job.startedAt).getTime();
      const elapsedMs = Date.now() - startedAt;

      if (job.progress > 0) {
        const estimatedTotalMs = (elapsedMs / job.progress) * 100;
        const completionTime = startedAt + estimatedTotalMs;
        estimatedCompletion = new Date(completionTime).toISOString();
      }
    }

    // =========================================================================
    // 5. Build Status Response
    // =========================================================================
    const status: GPUJobStatus = {
      jobId: job.jobId,
      jobType: job.jobType,
      state: job.state,
      progress: job.progress,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      estimatedCompletion,
    };

    // Add keyframe-specific data
    if (job.jobType === 'keyframe') {
      status.keyframeId = job.data.keyframeId as string;
      status.keyframeUrl = job.data.keyframeUrl as string;
    }

    // Add scene-specific data
    if (job.jobType === 'scene') {
      status.sceneId = job.data.sceneId as string;
      status.sceneUrl = job.data.sceneUrl as string;
      status.totalFrames = job.data.totalFrames as number;
      status.completedFrames = job.data.completedFrames as number;
    }

    // Add error information if job failed
    if (job.state === 'failed') {
      status.error = job.error;
      status.errorMessage = job.errorMessage;
      status.retryable = !job.error?.includes('invalid_request'); // Most errors are retryable
    }

    // =========================================================================
    // 6. Return Status Response
    // =========================================================================
    return new Response(
      JSON.stringify(status),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GPU Worker] Status error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// PATCH Endpoint - Update Job Progress (Internal Only)
// ============================================================================

export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    // =========================================================================
    // 1. Authenticate Internal Request
    // =========================================================================
    const isInternalRequest = request.headers.get('x-internal-api-key') === process.env.INTERNAL_API_KEY;

    if (!isInternalRequest) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Internal API key required for progress updates'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 2. Get Job ID from Route Parameter
    // =========================================================================
    const jobId = params.jobId;

    if (!jobId) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'Job ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Parse Update Data
    // =========================================================================
    const body = await request.json();
    const { state, progress, completedFrames, keyframeUrl, sceneUrl, thumbnailUrl } = body;

    // Build update object
    const updates: Partial<{
      state: 'queued' | 'processing' | 'completed' | 'failed';
      progress: number;
      data: Record<string, unknown>;
    }> = {};

    if (state) {
      updates.state = state;
    }

    if (typeof progress === 'number') {
      updates.progress = Math.min(100, Math.max(0, progress)); // Clamp to 0-100
    }

    // Add optional data updates
    const dataUpdates: Record<string, unknown> = {};

    if (typeof completedFrames === 'number') {
      dataUpdates.completedFrames = completedFrames;
    }

    if (keyframeUrl) {
      dataUpdates.keyframeUrl = keyframeUrl;
    }

    if (sceneUrl) {
      dataUpdates.sceneUrl = sceneUrl;
    }

    if (thumbnailUrl) {
      dataUpdates.thumbnailUrl = thumbnailUrl;
    }

    if (Object.keys(dataUpdates).length > 0) {
      updates.data = dataUpdates;
    }

    // =========================================================================
    // 4. Update Job in Store
    // =========================================================================
    const updatedJob = updateJob(jobId, updates);

    if (!updatedJob) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          details: `Job ${jobId} not found`
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 5. Return Updated Job Status
    // =========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        jobId: updatedJob.jobId,
        state: updatedJob.state,
        progress: updatedJob.progress,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GPU Worker] Update status error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
