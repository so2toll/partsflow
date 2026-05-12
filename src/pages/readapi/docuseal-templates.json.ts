import type { APIRoute } from 'astro';
import { listTemplates } from '../../lib/services/docuseal';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const isWidget = url.searchParams.get('widget') === 'true';
    const sessionId = url.searchParams.get('sessionId');

    // For widget requests, validate the session exists
    if (isWidget && sessionId) {
      // TODO: Add widget session validation here if needed
      // For now, we'll trust that the widget session exists
      console.log('Widget template request for session:', sessionId);
    }

    const templates = await listTemplates();
    
    return new Response(
      JSON.stringify({
        success: true,
        templates
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching DocuSeal templates:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch templates',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};