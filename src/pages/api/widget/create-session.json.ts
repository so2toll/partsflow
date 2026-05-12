// Public API Proxy - Widget Session Creation
// Forwards requests to internal createapi endpoint for clean public API

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Public API: Widget session creation proxy called');
    
    // Get the base URL to forward to internal endpoint
    const baseUrl = getBaseUrl(request);
    const internalEndpoint = `${baseUrl}/createapi/widget-session-create.json`;
    
    console.log('Forwarding request to internal endpoint:', internalEndpoint);
    
    // Forward the request to the internal endpoint
    const forwardedResponse = await fetch(internalEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'X-Client-Id': request.headers.get('X-Client-Id') || '',
        'X-Client-Secret': request.headers.get('X-Client-Secret') || '',
        'Origin': request.headers.get('Origin') || ''
      },
      body: await request.text()
    });
    
    // Get the response data
    const responseData = await forwardedResponse.text();
    
    console.log('Internal endpoint response status:', forwardedResponse.status);
    
    // Forward the response back to the client with appropriate headers
    return new Response(responseData, {
      status: forwardedResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id, X-Client-Secret'
      }
    });
    
  } catch (error: any) {
    console.error('Public API proxy error:', error);
    
    return new Response(JSON.stringify({
      message: 'error',
      error: 'Proxy error',
      details: 'Failed to forward request to internal API: ' + error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Handle preflight OPTIONS requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id, X-Client-Secret'
    }
  });
};

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}