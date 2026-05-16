/**
 * Driver Status SSE Endpoint
 *
 * Event-driven SSE endpoint for real-time driver status updates.
 * Clients receive events when drivers toggle their available/offline status.
 *
 * GET /api/sse/driver-status
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { sseManager, SSEClient } from '../../../lib/sse/sseManager';
import { driverRepository } from '../../../lib/db/repositories';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Check authentication
  const session = await getSession(request);

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userRole = session.user?.role;

  // Only SuperAdmin can access driver status SSE
  if (userRole !== 'SuperAdmin') {
    return new Response('Forbidden', { status: 403 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Fetch initial driver data
  let initialDrivers = [];
  try {
    initialDrivers = await driverRepository.findByStatus('available');
  } catch (error) {
    console.error('[SSE Driver Status] Error fetching initial drivers:', error);
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start: function(controller) {
      console.log(`[SSE Driver Status] Client connected: ${userEmail}`);

      // Send initial connection message with current data
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to driver status updates',
        data: {
          availableDrivers: initialDrivers.map(d => ({
            id: d.id,
            status: d.status,
            userId: d.userId,
          }))
        }
      })}\n\n`);

      // Register client with SSE manager
      const client: SSEClient = {
        id: '',
        userId: userId,
        role: userRole,
        channel: 'driver-status',
        controller: controller,
        connectedAt: new Date(),
      };

      const clientId = sseManager.register(client);
      client.id = clientId;

      // Cleanup on disconnect
      request.signal.addEventListener('abort', function() {
        console.log(`[SSE Driver Status] Client disconnected: ${clientId}`);
        sseManager.unregister(clientId);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
};
