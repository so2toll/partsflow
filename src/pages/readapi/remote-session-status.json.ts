import type { APIRoute } from 'astro';
import { getBrowserService } from '../../lib/services/remote-browser';
import { getSession } from '../../lib/stores/signing-session';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'Session ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const session = getSession(sessionId);
    if (!session) {
      return new Response(JSON.stringify({
        error: 'Session not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const browserService = getBrowserService();
    const browserSession = browserService.getSession(sessionId);
    
    let screenshot = null;
    if (browserSession) {
      try {
        screenshot = await browserService.captureScreenshot(sessionId);
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
      }
    }
    
    // Build response with session type detection and PDF data
    const responseData: any = {
      sessionId,
      status: session.status,
      sessionType: session.sessionType || 'browser',
      screenshot,
      signatureRequested: session.signatureRequested || false,
      signatureData: session.signatureData || null,
      lastUpdate: new Date().toISOString()
    };
    
    // Add PDF-specific data if this is a PDF session
    if (session.sessionType === 'pdf') {
      responseData.pdfTemplateSlug = session.templateSlug;
      responseData.pdfFinalized = session.pdfFinalized || false;
      responseData.templateId = session.templateId;
    }
    
    // Add browserbase live view URL if available
    if (session.liveViewUrl) {
      responseData.liveViewUrl = session.liveViewUrl;
    }
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Remote session status error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get session status'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};