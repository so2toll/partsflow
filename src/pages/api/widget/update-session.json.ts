import type { APIRoute } from 'astro';
import { getSession, updateSession } from '../../../lib/stores/signing-session';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { sessionId, templateSlug, templateName } = body;

    if (!sessionId || !templateSlug) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: sessionId and templateSlug'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update the session store with template information
    const session = getSession(sessionId);

    if (!session) {
      console.error('Session not found:', sessionId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Session not found'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update session with template information
    const updatedSession = updateSession(sessionId, {
      templateId: templateSlug,
      templateSlug: templateSlug,
      templateName: templateName,
      sessionType: 'pdf', // Mark as PDF session when template is selected
      docuSeal: {
        ...session.docuSeal,
        templateId: templateSlug
      }
    });

    console.log('Widget session updated with template:', { sessionId, templateSlug, templateName });

    // Return the victim URL using /remote-sign pattern
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session updated successfully',
        victimUrl: `/remote-sign/${sessionId}`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating widget session:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update session',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};