/**
 * Order Creation API
 *
 * Creates a new parts delivery order.
 *
 * POST /api/orders/create
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { orderRepository } from '../../../lib/db/repositories/OrderRepository';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get session
    const session = await getSession(request, new Request(request.headers).headers ? new Headers(request.headers) : new Headers());

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = session.user;
    const userId = user?.global_id || user?.id;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'No organization found. Please contact support.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      partId,
      partNumber,
      partName,
      supplierId,
      supplierName,
      price,
      priority,
      deliveryAddress,
    } = body;

    // Validate required fields
    if (!partNumber || !partName || !supplierId || !supplierName || !price || !priority || !deliveryAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create order
    const order = await orderRepository.create({
      shopId: organizationId,
      createdBy: userId,
      priority,
      deliveryAddress,
      partNumber,
      partName,
      supplierId,
      supplierName,
      partsCostCents: Math.round(price * 100), // Convert dollars to cents
    });

    return new Response(
      JSON.stringify({
        orderId: order.id,
        success: true,
        order,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[OrderCreate] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
