// Widget Session Data API - Following existing readapi pattern
// Returns widget session data for authenticated requests

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/stores/persistent-session-store.js';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    console.log('Widget session data API called');
    
    // Get parameters (following your existing pattern)
    const sessionId = url.searchParams.get('sessionId');
    const cookie = url.searchParams.get('cookie');
    
    // Get request body
    const body = await request.json().catch(() => ({}));
    
    console.log('Widget API params:', { sessionId, cookie });
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Missing sessionId parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get widget session from persistent store
    console.log('Widget API - Looking for sessionId:', sessionId);
    const session = await getSession(sessionId);

    if (!session) {
      console.log('Widget API - Session not found or expired:', sessionId);
      return new Response(JSON.stringify({
        message: 'error',
        error: 'Widget session not found or expired',
        debug: {
          requestedSessionId: sessionId
        }
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Session expiry is already handled by the persistent store
    console.log('Widget API - Session found:', sessionId);

    // Calculate expiration for response (4 hours from creation)
    const createdAt = new Date(session.timestamps?.created || Date.now());
    const expiresAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);

    // Prepare response data following your pattern
    const responseData = {
      message: 'success',
      data: {
        message: {
          id: session.sessionId,
          sessionId: session.sessionId,
          sessionType: session.sessionType || 'widget',
          userRole: session.widgetUserRole || session.metadata?.widgetUserRole || 'victim',
          role: (session.widgetUserRole || session.metadata?.widgetUserRole) === 'advocate' ? 'Advocate' : 'Victim', // Map to RBAC role
          name: session.formData?.name || 'Widget User',
          email: session.formData?.email || 'widget@client.com',
          authStatus: 'success',
          clientId: session.metadata?.clientId,
          status: session.status || 'active',
          createdAt: session.timestamps?.created,
          expiresAt: expiresAt.toISOString(),
          // Additional widget-specific data
          widgetData: {
            sessionMode: session.sessionType,
            templateSlug: session.templateSlug,
            signatureRequested: session.signatureRequested || false,
            metadata: session.metadata || {}
          }
        }
      },
      addOnData: [{
        widgetContext: true,
        embedMode: true,
        clientOrigin: session.metadata?.clientOrigin || 'unknown'
      }]
    };
    
    console.log('Returning widget session data:', responseData);
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error: any) {
    console.error('Widget session data API error:', error);
    
    return new Response(JSON.stringify({
      message: 'error',
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};