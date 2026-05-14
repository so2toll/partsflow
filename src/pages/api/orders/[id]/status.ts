/**
 * Order Status Update API
 *
 * Updates an order's status (used by drivers).
 *
 * POST /api/orders/[id]/status
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../../lib/auth/session-adapter';
import { orderRepository } from '../../../../../lib/db/repositories/OrderRepository';
import { driverRepository } from '../../../../../lib/db/repositories/DriverRepository';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const session = await getSession(request);

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

    if (!status || !['picked_up', 'en_route', 'delivered', 'confirmed'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the order
    const order = await orderRepository.findById(orderId);

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
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
