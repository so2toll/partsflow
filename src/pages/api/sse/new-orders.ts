/**
 * New Orders SSE Endpoint
 *
 * Event-driven SSE endpoint for real-time new order notifications.
 * Clients receive events when new orders are created.
 *
 * GET /api/sse/new-orders
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { sseManager, SSEClient } from '../../../lib/sse/sseManager';
import { orderRepository } from '../../../lib/db/repositories';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Check authentication
  const session = await getSession(request);

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userRole = session.user?.role;

  // Only SuperAdmin can access new orders SSE
  if (userRole !== 'SuperAdmin') {
    return new Response('Forbidden', { status: 403 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Fetch initial pending orders count
  let initialPendingCount = 0;
  try {
    const pendingOrders = await orderRepository.findPending();
    initialPendingCount = pendingOrders.length;
  } catch (error) {
    console.error('[SSE New Orders] Error fetching initial orders:', error);
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start: function(controller) {
      console.log(`[SSE New Orders] Client connected: ${userEmail}`);

      // Send initial connection message with current data
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to new order notifications',
        data: {
          pendingCount: initialPendingCount
        }
      })}\n\n`);

      // Register client with SSE manager
      const client: SSEClient = {
        id: '',
        userId: userId,
        role: userRole,
        channel: 'new-orders',
        controller: controller,
        connectedAt: new Date(),
      };

      const clientId = sseManager.register(client);
      client.id = clientId;

      // Cleanup on disconnect
      request.signal.addEventListener('abort', function() {
        console.log(`[SSE New Orders] Client disconnected: ${clientId}`);
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
