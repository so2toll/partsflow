/**
 * Order Status SSE Endpoint
 *
 * Event-driven SSE endpoint for real-time order status updates.
 * Clients receive events when orders change status.
 *
 * GET /api/sse/order-status
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

  // Only SuperAdmin can access order status SSE
  if (userRole !== 'SuperAdmin') {
    return new Response('Forbidden', { status: 403 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Fetch initial active order data
  let initialActiveOrders = [];
  try {
    // Get active orders (dispatched, picked_up, en_route)
    const [dispatchedOrders, pickedUpOrders, enRouteOrders] = await Promise.all([
      orderRepository.list({ status: 'dispatched' as any, limit: 100 }),
      orderRepository.list({ status: 'picked_up' as any, limit: 100 }),
      orderRepository.list({ status: 'en_route' as any, limit: 100 }),
    ]);

    initialActiveOrders = [
      ...dispatchedOrders.orders,
      ...pickedUpOrders.orders,
      ...enRouteOrders.orders,
    ];
  } catch (error) {
    console.error('[SSE Order Status] Error fetching initial orders:', error);
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start: function(controller) {
      console.log(`[SSE Order Status] Client connected: ${userEmail}`);

      // Send initial connection message with current data
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to order status updates',
        data: {
          activeOrders: initialActiveOrders.map(o => ({
            id: o.id,
            status: o.status,
            driverId: o.driverId,
            partName: o.partName,
          }))
        }
      })}\n\n`);

      // Register client with SSE manager
      const client: SSEClient = {
        id: '',
        userId: userId,
        role: userRole,
        channel: 'order-status',
        controller: controller,
        connectedAt: new Date(),
      };

      const clientId = sseManager.register(client);
      client.id = clientId;

      // Cleanup on disconnect
      request.signal.addEventListener('abort', function() {
        console.log(`[SSE Order Status] Client disconnected: ${clientId}`);
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
