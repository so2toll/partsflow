/**
 * GPU Worker Endpoint: Generate Keyframe
 *
 * POST /api/internal/gpu/generate-keyframe
 *
 * Purpose:
 * Simulates GPU-based keyframe generation for video scenes.
 * This is a mock endpoint that returns realistic responses with delay simulation
 * to demonstrate the Phase 3 Director Agent flow.
 *
 * Features:
 * - Validates request parameters
 * - Creates mock job with unique ID
 * - Simulates GPU processing time (2-5 seconds)
 * - Returns mock keyframe image URL
 * - Progress tracking through job status endpoint
 *
 * Request Body:
 * {
 *   sceneId: string;
 *   prompt: string;
 *   style?: string;
 *   quality?: 'draft' | 'standard' | 'high';
 *   frameNumber?: number;
 * }
 *
 * Response:
 * {
 *   success: true;
 *   jobId: string;
 *   keyframeId: string;
 *   estimatedTimeSeconds: number;
 *   message: string;
 * }
 *
 * @module pages/api/internal/gpu/generate-keyframe
 * @version 1.0.0
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { ulid } from 'ulid';
import type {
  GenerateKeyframeRequest,
  GenerateKeyframeResponse,
  MockJob,
  MockKeyframeResult,
} from './types';
import { createJob, completeJob, failJob } from './job-store';

// ============================================================================
// Constants
// ============================================================================

/**
 * Base URL for mock keyframe images
 */
const MOCK_KEYFRAME_BASE_URL = 'https://placehold.co';

/**
 * Processing time ranges (in milliseconds) by quality tier
 */
const PROCESSING_TIME_MS = {
  draft: 2000,      // 2 seconds
  standard: 3500,   // 3.5 seconds
  high: 5000,       // 5 seconds
};

/**
 * Default keyframe dimensions by quality tier
 */
const KEYFRAME_DIMENSIONS = {
  draft: { width: 1280, height: 720 },
  standard: { width: 1920, height: 1080 },
  high: { width: 3840, height: 2160 },
};

// ============================================================================
// POST Endpoint
// ============================================================================

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // =========================================================================
    // 1. Authenticate Request
    // =========================================================================
    // Note: In production, this would validate an internal API key
    // For now, we accept both authenticated sessions and internal requests
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
    // 2. Parse and Validate Request Body
    // =========================================================================
    const body = await request.json();
    const {
      sceneId,
      prompt,
      style = 'realistic',
      quality = 'standard',
      frameNumber = 0,
    } = body as GenerateKeyframeRequest;

    // Validate required fields
    if (!sceneId?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'sceneId is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: 'prompt is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate quality tier
    const validQualities = ['draft', 'standard', 'high'];
    if (!validQualities.includes(quality)) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          details: `Invalid quality. Must be one of: ${validQualities.join(', ')}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Generate Mock Job and Keyframe IDs
    // =========================================================================
    const jobId = `gpu_keyframe_${ulid()}`;
    const keyframeId = `keyframe_${ulid()}`;

    // =========================================================================
    // 4. Calculate Processing Time
    // =========================================================================
    const processingTimeMs = PROCESSING_TIME_MS[quality];
    const estimatedTimeSeconds = Math.ceil(processingTimeMs / 1000);

    // =========================================================================
    // 5. Create Job in Store
    // =========================================================================
    const dimensions = KEYFRAME_DIMENSIONS[quality];

    const job: Omit<MockJob, 'startedAt'> = {
      jobId,
      jobType: 'keyframe',
      state: 'queued',
      progress: 0,
      data: {
        sceneId,
        prompt,
        style,
        quality,
        frameNumber,
        keyframeId,
        dimensions,
      },
    };

    createJob(job);

    console.log(`[GPU Worker] Keyframe job ${jobId} queued for scene ${sceneId}`);

    // =========================================================================
    // 6. Simulate GPU Processing (Async)
    // =========================================================================
    // Start processing simulation
    setTimeout(async () => {
      try {
        // Update job to processing state
        const processingJob = await fetch(`${request.url}/../status/${jobId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: 'processing', progress: 10 }),
        });

        // Simulate progress updates
        const progressUpdates = [25, 50, 75, 90];
        for (const progress of progressUpdates) {
          await new Promise(resolve => setTimeout(resolve, processingTimeMs / progressUpdates.length));
          await fetch(`${request.url}/../status/${jobId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress }),
          });
        }

        // Generate mock keyframe result
        const keyframeResult: MockKeyframeResult = {
          keyframeId,
          url: `${MOCK_KEYFRAME_BASE_URL}/${dimensions.width}x${dimensions.height}/png?text=${encodeURIComponent('Keyframe+' + frameNumber)}&style=${style}`,
          thumbnailUrl: `${MOCK_KEYFRAME_BASE_URL}/${Math.round(dimensions.width / 4)}x${Math.round(dimensions.height / 4)}/png?text=${encodeURIComponent('KF+' + frameNumber)}&style=${style}`,
          width: dimensions.width,
          height: dimensions.height,
          format: 'png',
          sizeBytes: dimensions.width * dimensions.height * 4, // Rough estimate
        };

        // Complete the job
        completeJob(jobId, {
          keyframeId,
          keyframeUrl: keyframeResult.url,
          thumbnailUrl: keyframeResult.thumbnailUrl,
        });

        console.log(`[GPU Worker] Keyframe job ${jobId} completed`);

      } catch (error) {
        console.error(`[GPU Worker] Keyframe job ${jobId} failed:`, error);
        failJob(jobId, 'processing_failed', error instanceof Error ? error.message : 'Unknown error');
      }
    }, 500); // Small delay before starting processing

    // =========================================================================
    // 7. Return Immediate Response
    // =========================================================================
    const response: GenerateKeyframeResponse = {
      success: true,
      jobId,
      keyframeId,
      estimatedTimeSeconds,
      message: `Keyframe generation started. Estimated time: ${estimatedTimeSeconds}s`,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GPU Worker] Generate keyframe error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate keyframe',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
