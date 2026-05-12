import type { APIRoute } from 'astro';
import { ApiClientService } from '../../../lib/services/api-clients.js';
import { COOKIE_NAME } from '../../../lib/constants/constants.js';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const cookie = cookies.get(COOKIE_NAME);
    if (!cookie?.value) {
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: Validate admin role from cookie/session
    // For now, assuming authentication check is sufficient for admin access

    // Get client statistics
    const stats = ApiClientService.getClientStats();

    return new Response(JSON.stringify({
      message: 'success',
      data: {
        stats: stats
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching client stats:', error);

    return new Response(JSON.stringify({
      message: 'error',
      error: error.message || 'Failed to fetch client stats'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};