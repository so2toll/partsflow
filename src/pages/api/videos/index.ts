/**
 * API Endpoint: List Recruitment Videos
 *
 * GET /api/videos
 *
 * Purpose:
 * Returns a paginated list of recruitment videos with optional filtering.
 *
 * Security:
 * - Requires authenticated session
 * - Validates user has 'Recruiter' or 'Admin' role
 *
 * Query Parameters:
 * - type?: 'meta_ad' | 'youtube_ad' | 'ctv_ad'
 * - jobRequisitionId?: string
 * - search?: string
 * - limit?: number (default: 20, max: 100)
 * - offset?: number (default: 0)
 *
 * @returns {
 *   success: boolean,
 *   videos: RecruitmentVideo[],
 *   total: number,
 *   limit: number,
 *   offset: number
 * }
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { videoRepository } from '../../../lib/db/repositories/VideoRepository';

export const GET: APIRoute = async ({ request, cookies, url }) => {
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
    // Parse query parameters
    const type = url.searchParams.get('type') as 'meta_ad' | 'youtube_ad' | 'ctv_ad' | null;
    const jobRequisitionId = url.searchParams.get('jobRequisitionId');
    const searchQuery = url.searchParams.get('search');
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Fetch videos
    const result = await videoRepository.list({
      type: type || undefined,
      jobRequisitionId: jobRequisitionId || undefined,
      searchQuery: searchQuery || undefined,
      limit,
      offset,
    });

    return new Response(
      JSON.stringify({
        success: true,
        videos: result.videos,
        total: result.total,
        limit,
        offset,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
