/**
 * Dispatch Assignment API
 *
 * Manually assigns a driver to an order.
 *
 * POST /api/admin/dispatch/assign
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth/session-adapter';
import { orderRepository } from '../../../../lib/db/repositories/OrderRepository';
import { driverRepository } from '../../../../lib/db/repositories/DriverRepository';
import { validateTransition } from '../../../../lib/order/orderStateMachine';
import { broadcastOrderStatus, broadcastDriverStatus } from '../../../../lib/sse/sseManager';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(request, cookies);

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = session.user;
    const userRole = user?.role;

    // Only SuperAdmin can assign drivers
    if (userRole !== 'SuperAdmin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { orderId, driverId } = body;

    if (!orderId || !driverId) {
      return new Response(
        JSON.stringify({ error: 'Order ID and Driver ID required' }),
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
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the driver
    const driver = await driverRepository.findById(driverId);

    if (!driver) {
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (driver.status !== 'available') {
      return new Response(
        JSON.stringify({ error: 'Driver is not available' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Dispatch order to driver
    const updatedOrder = await orderRepository.dispatch(orderId, driverId);

    // Update driver status to on_delivery
    await driverRepository.updateStatus(driverId, 'on_delivery');

    // Broadcast order status change
    broadcastOrderStatus(orderId, 'dispatched', {
      partName: updatedOrder.partName,
      partNumber: updatedOrder.partNumber,
      driverId: driverId,
    });

    // Broadcast driver status change
    broadcastDriverStatus(driverId, 'on_delivery', {
      userId: driver.userId,
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
    console.error('[DispatchAssign] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to assign driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
