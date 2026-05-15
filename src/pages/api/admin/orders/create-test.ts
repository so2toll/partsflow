/**
 * Create Test Order API
 *
 * Creates a test order for development and testing purposes.
 * Only accessible by SuperAdmin users.
 *
 * POST /api/admin/orders/create-test
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth/session-adapter';
import { orderRepository } from '../../../../lib/db/repositories/OrderRepository';
import { organizationRepository } from '../../../../lib/db/repositories/OrganizationRepository';

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

    // Only SuperAdmin can create test orders
    if (userRole !== 'SuperAdmin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      partName,
      partNumber,
      supplierName,
      supplierId,
      deliveryAddress,
      priority = 'P1',
    } = body;

    // Validate required fields
    if (!partName || !partNumber || !supplierName || !supplierId || !deliveryAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: partName, partNumber, supplierName, supplierId, deliveryAddress' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's organization (shop)
    const userId = user?.global_id || user?.id;
    const organization = await organizationRepository.findByUserId(userId);

    if (!organization) {
      return new Response(
        JSON.stringify({ error: 'User must belong to an organization to create orders' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create test order
    const order = await orderRepository.create({
      shopId: organization.id,
      createdBy: userId,
      priority: priority as 'P0' | 'P1' | 'P2' | 'P3', // Keep uppercase for OrderPriority type
      deliveryAddress,
      partNumber,
      partName,
      supplierId,
      supplierName,
      partsCostCents: Math.floor(Math.random() * 10000) + 2000, // Random cost between $20-$120
    });

    return new Response(
      JSON.stringify({
        success: true,
        order,
        message: 'Test order created successfully',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CreateTestOrder] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create test order',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
