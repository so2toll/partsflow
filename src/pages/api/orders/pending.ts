/**
 * Pending Orders API Endpoint
 *
 * Returns all pending (unassigned) orders for drivers to see and accept.
 *
 * GET /api/orders/pending
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { orderRepository } from '../../../lib/db/repositories/OrderRepository';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const session = await getSession(request, cookies);

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pending orders
    const pendingOrders = await orderRepository.findPending();

    console.log('[PendingOrders] Fetched:', pendingOrders.length, 'pending orders');

    return new Response(
      JSON.stringify({
        success: true,
        orders: pendingOrders,
        total: pendingOrders.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PendingOrders] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch pending orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
