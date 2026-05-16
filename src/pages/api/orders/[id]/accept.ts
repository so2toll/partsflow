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
import { validateTransition } from '../../../../lib/order/orderStateMachine';

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

    // Validate state transition using state machine
    const validation = validateTransition(order.status, 'dispatched');
    if (!validation.valid) {
      // Order is no longer available for dispatch (race condition)
      if (order.status === 'dispatched') {
        return new Response(
          JSON.stringify({ error: 'Order already accepted by another driver' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Dispatch order to driver
    const updatedOrder = await orderRepository.dispatch(orderId, driver.id);

    // Verify the order was actually dispatched to this driver (race condition check)
    if (!updatedOrder || updatedOrder.driverId !== driver.id || updatedOrder.status !== 'dispatched') {
      return new Response(
        JSON.stringify({ error: 'Order already accepted by another driver' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Don't change driver status - allow bulk pickups
    // Driver stays 'available' and can accept multiple orders

    console.log('[OrderAccept] Driver accepted order:', {
      orderId,
      driverId: driver.id,
      orderStatus: updatedOrder.status,
      driverStatus: driver.status
    });

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
        driver,
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
