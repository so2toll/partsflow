/**
 * Order Accept API
 *
 * Allows a driver to accept an available order.
 *
 * POST /api/orders/[id]/accept
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth/session-adapter';
import { orderRepository } from '../../../../lib/db/repositories/OrderRepository';
import { driverRepository } from '../../../../lib/db/repositories/DriverRepository';

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

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get driver record for this user
    const driver = await driverRepository.findByUserId(userId);

    if (!driver) {
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (driver.status !== 'available') {
      return new Response(
        JSON.stringify({ error: 'Driver not available' }),
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

    if (order.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Order not available' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Dispatch order to driver
    const updatedOrder = await orderRepository.dispatch(orderId, driver.id);

    // Update driver status to on_delivery
    await driverRepository.updateStatus(driver.id, 'on_delivery');

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[OrderAccept] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to accept order',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
