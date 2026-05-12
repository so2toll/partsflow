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
    const { name, allowedDomains, webhookUrl, branding } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Client name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate allowed domains if provided
    if (allowedDomains && !Array.isArray(allowedDomains)) {
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Allowed domains must be an array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the client
    const clientData = {
      name: name.trim(),
      allowedDomains: allowedDomains || [],
      webhookUrl: webhookUrl || null,
      branding: branding || {}
    };

    const newClient = ApiClientService.createClient(clientData);

    return new Response(JSON.stringify({
      message: 'success',
      data: {
        client: {
          clientId: newClient.clientId,
          clientSecret: newClient.clientSecret,
          name: newClient.name,
          allowedDomains: newClient.allowedDomains,
          status: newClient.status,
          createdAt: newClient.createdAt,
          settings: newClient.settings
        }
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating client:', error);
    
    return new Response(JSON.stringify({
      message: 'error',
      error: error.message || 'Failed to create client'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};