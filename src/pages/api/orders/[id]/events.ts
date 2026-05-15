/**
 * Order Status Events API (SSE)
 *
 * Server-Sent Events endpoint for real-time order status updates.
 *
 * GET /api/orders/[id]/events
 *
 * @description Clients can subscribe to this endpoint to receive real-time
 * updates when an order's status changes. The connection is kept alive and
 * events are pushed as they occur.
 */

import type { APIRoute } from 'astro';
import { orderRepository } from '../../../../lib/db/repositories/OrderRepository';
import { isTerminalStatus } from '../../../../lib/order/orderStateMachine';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const orderId = params.id;

  if (!orderId) {
    return new Response(
      JSON.stringify({ error: 'Order ID required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify order exists
  const order = await orderRepository.findById(orderId);
  if (!order) {
    return new Response(
      JSON.stringify({ error: 'Order not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Set up SSE headers
      const headers = new Headers();
      headers.set('Content-Type', 'text/event-stream');
      headers.set('Cache-Control', 'no-cache');
      headers.set('Connection', 'keep-alive');
      headers.set('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        orderId,
        status: order.status,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectEvent));

      // Set up polling to check for status changes
      let lastStatus = order.status;
      let isClosed = false;

      // Check if status is terminal
      if (isTerminalStatus(lastStatus)) {
        const terminalEvent = `event: terminal\ndata: ${JSON.stringify({
          orderId,
          status: lastStatus,
          timestamp: new Date().toISOString(),
          message: `Order has reached terminal status: ${lastStatus}`,
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(terminalEvent));
        controller.close();
        isClosed = true;
      }

      // Poll for status changes every 2 seconds
      const pollInterval = setInterval(async () => {
        if (isClosed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          // Fetch latest order status
          const updatedOrder = await orderRepository.findById(orderId);

          if (!updatedOrder) {
            // Order was deleted
            const errorEvent = `event: error\ndata: ${JSON.stringify({
              orderId,
              error: 'Order not found',
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(errorEvent));
            controller.close();
            isClosed = true;
            clearInterval(pollInterval);
            return;
          }

          // Check if status changed
          if (updatedOrder.status !== lastStatus) {
            lastStatus = updatedOrder.status;

            // Send status update event
            const statusEvent = `event: status_update\ndata: ${JSON.stringify({
              orderId,
              status: updatedOrder.status,
              previousStatus: order.status,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(statusEvent));

            // Check if new status is terminal
            if (isTerminalStatus(updatedOrder.status)) {
              const terminalEvent = `event: terminal\ndata: ${JSON.stringify({
                orderId,
                status: updatedOrder.status,
                timestamp: new Date().toISOString(),
                message: `Order has reached terminal status: ${updatedOrder.status}`,
              })}\n\n`;
              controller.enqueue(new TextEncoder().encode(terminalEvent));
              controller.close();
              isClosed = true;
              clearInterval(pollInterval);
            }
          }

          // Send keep-alive comment every 30 seconds
          const keepAlive = `: keep-alive\n\n`;
          controller.enqueue(new TextEncoder().encode(keepAlive));
        } catch (error) {
          console.error('[OrderEvents] Polling error:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            orderId,
            error: 'Failed to fetch order updates',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorEvent));
          controller.close();
          isClosed = true;
          clearInterval(pollInterval);
        }
      }, 2000);

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(pollInterval);
        controller.close();
      });

      // Close connection after 5 minutes (client should reconnect)
      setTimeout(() => {
        if (!isClosed) {
          isClosed = true;
          clearInterval(pollInterval);
          controller.close();
        }
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
