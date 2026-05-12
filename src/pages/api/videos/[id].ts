/**
 * API Endpoint: Get Single Recruitment Video
 *
 * GET /api/videos/[id]
 *
 * Purpose:
 * Returns details for a single recruitment video.
 *
 * Security:
 * - Requires authenticated session
 * - Validates user has 'Recruiter' or 'Admin' role
 *
 * @returns {
 *   success: boolean,
 *   video: RecruitmentVideo
 * }
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { videoRepository } from '../../../lib/db/repositories/VideoRepository';

export const GET: APIRoute = async ({ request, cookies, params }) => {
  // Verify user session
  const session = await getSession(request, cookies);

  if (!session) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized - No session found' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check user role
  const userRole = session.user.role;
  if (!['Recruiter', 'Admin'].includes(userRole)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Forbidden - Insufficient permissions' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const videoId = params.id;

    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing video ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch video
    const video = await videoRepository.findById(videoId);

    if (!video) {
      return new Response(
        JSON.stringify({ success: false, error: 'Video not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        video,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching video:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch video',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
