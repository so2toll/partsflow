import type { APIRoute } from 'astro';
import { ApiClientService } from '../../../lib/services/api-clients.js';
import { COOKIE_NAME } from '../../../lib/constants/constants.js';

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // Parse request body
    const body = await request.json();
    const { clientId } = body;

    // Validate required fields
    if (!clientId || typeof clientId !== 'string') {
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Client ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Revoke the client
    const revokedClient = ApiClientService.revokeClient(clientId);

    return new Response(JSON.stringify({
      message: 'success',
      data: {
        client: {
          clientId: revokedClient.clientId,
          name: revokedClient.name,
          status: revokedClient.status,
          revokedAt: revokedClient.revokedAt
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error revoking client:', error);
    
    const statusCode = error.message === 'Client not found' ? 404 : 500;
    
    return new Response(JSON.stringify({
      message: 'error',
      error: error.message || 'Failed to revoke client'
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};