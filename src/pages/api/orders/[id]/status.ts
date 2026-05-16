/**
 * Order Status Update API
 *
 * Updates an order's status (used by drivers).
 *
 * POST /api/orders/[id]/status
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth/session-adapter';
import { validateTransition } from '../../../../lib/order/orderStateMachine';
import { orderRepository } from '../../../../lib/db/repositories/OrderRepository';
import { driverRepository } from '../../../../lib/db/repositories/DriverRepository';
import { broadcastOrderStatus } from '../../../../lib/sse/sseManager';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, params }) => {
  try {
    const session = await getSession(request, cookies);

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user?.global_id || session.user?.id;
    const orderId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!status) {
      return new Response(
        JSON.stringify({ error: 'Status is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the order first to validate transition
    const order = await orderRepository.findById(orderId);

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate state transition using state machine
    const validation = validateTransition(order.status, status);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get driver record for this user
    const driver = await driverRepository.findByUserId(userId);

    if (!driver || order.driverId !== driver.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized for this order' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update order status
    const updatedOrder = await orderRepository.updateStatus(orderId, status);

    // Broadcast order status change to all connected dispatch clients
    broadcastOrderStatus(orderId, status, {
      partName: updatedOrder.partName,
      partNumber: updatedOrder.partNumber,
      driverId: driver.id,
    });

    // If delivered, set driver back to available
    if (status === 'delivered') {
      await driverRepository.updateStatus(driver.id, 'available');
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[OrderStatus] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update order status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
