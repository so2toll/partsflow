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
    const { clientId, updates } = body;

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

    if (!updates || typeof updates !== 'object') {
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Updates object is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate allowed domains if provided in updates
    if (updates.allowedDomains && !Array.isArray(updates.allowedDomains)) {
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Allowed domains must be an array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the client
    const updatedClient = ApiClientService.updateClient(clientId, updates);

    return new Response(JSON.stringify({
      message: 'success',
      data: {
        client: {
          clientId: updatedClient.clientId,
          clientSecret: updatedClient.clientSecret,
          name: updatedClient.name,
          allowedDomains: updatedClient.allowedDomains,
          status: updatedClient.status,
          createdAt: updatedClient.createdAt,
          updatedAt: updatedClient.updatedAt,
          settings: updatedClient.settings
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating client:', error);
    
    const statusCode = error.message === 'Client not found' ? 404 : 500;
    
    return new Response(JSON.stringify({
      message: 'error',
      error: error.message || 'Failed to update client'
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};