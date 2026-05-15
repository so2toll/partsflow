/**
 * Driver Status Update API
 *
 * Updates a driver's availability status.
 *
 * POST /api/drivers/status
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/session-adapter';
import { driverRepository } from '../../../lib/db/repositories/DriverRepository';

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

    const userId = session.user?.global_id || session.user?.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['offline', 'available', 'on_delivery', 'suspended'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
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

    // Update driver status
    const updatedDriver = await driverRepository.updateStatus(driver.id, status);

    // Verify the update by fetching again
    const verification = await driverRepository.findById(driver.id);
    console.log('[DriverStatus] Update verification:', {
      driverId: driver.id,
      requestedStatus: status,
      updatedStatus: updatedDriver.status,
      verifiedStatus: verification?.status,
      match: updatedDriver.status === status && verification?.status === status
    });

    return new Response(
      JSON.stringify({
        success: true,
        driver: updatedDriver,
        verification: verification ? { status: verification.status } : null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[DriverStatus] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
