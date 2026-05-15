/**
 * Auto-Dispatch API
 *
 * Automatically assigns the nearest available driver to an order.
 *
 * POST /api/admin/dispatch/auto-assign
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth/session-adapter';
import { orderRepository } from '../../../../lib/db/repositories/OrderRepository';
import { driverRepository } from '../../../../lib/db/repositories/DriverRepository';
import { validateTransition } from '../../../../lib/order/orderStateMachine';

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

    // Only SuperAdmin can auto-assign
    if (userRole !== 'SuperAdmin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
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

    // Get available drivers
    const availableDrivers = await driverRepository.findAvailable();

    if (availableDrivers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No available drivers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For MVP: Select first available driver
    // TODO: Implement geospatial distance calculation
    const selectedDriver = availableDrivers[0];

    // Dispatch order to driver
    const updatedOrder = await orderRepository.dispatch(orderId, selectedDriver.id);

    // Update driver status to on_delivery
    await driverRepository.updateStatus(selectedDriver.id, 'on_delivery');

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
        driver: selectedDriver,
        autoAssigned: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[DispatchAutoAssign] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to auto-assign driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
