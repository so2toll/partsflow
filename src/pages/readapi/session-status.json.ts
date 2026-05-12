import type { APIRoute } from 'astro';
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
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const session = getSession(sessionId);
    
    if (!session) {
      return new Response(JSON.stringify({
        error: 'Session not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    return new Response(JSON.stringify({
      sessionId: session.sessionId,
      status: session.status,
      sessionType: session.sessionType,
      templateId: session.templateId,
      templateSlug: session.templateSlug,
      pdfTemplateSlug: session.templateSlug, // Alias for backward compatibility
      widgetUserRole: session.widgetUserRole,
      signerSlug: session.docuSeal.signerSlug,
      formData: session.formData,
      progress: {
        consentGiven: true,
        formFilled: true,
        documentViewed: session.status !== 'initiated',
        documentSigned: session.status === 'completed'
      },
      openReplayUrl: session.openReplay.replayUrl || null,
      lastActivity: session.timestamps.started,
      signatureRequested: session.signatureRequested,
      signatureCollected: session.signatureCollected,
      signatureInjected: session.signatureInjected,
      docuSealCompleted: session.docuSealCompleted,
      pdfFinalized: session.pdfFinalized
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Session status error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get session status'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};