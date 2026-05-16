/**
 * Create Invite API Endpoint
 *
 * Creates a new invite link for Shop Owners or Drivers
 * Only accessible by SuperAdmin users
 *
 * POST /api/invites/create
 * Body: { type: 'shop_owner' | 'driver', expiresInDays?: number }
 */

import type { APIRoute } from "astro";
import { inviteRepository } from "../../../lib/db/repositories/InviteRepository";
import { getSession } from "../../../lib/auth/session-adapter";
import { isSystemAdmin } from "../../../lib/auth/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const session = await getSession(request, cookies);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is SuperAdmin
    if (!isSystemAdmin(session)) {
      return new Response(
        JSON.stringify({ error: "Only SuperAdmin can create invites" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { type, expiresInDays } = await request.json();

    // Validate type
    if (!type || !["shop_owner", "driver"].includes(type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid type. Must be 'shop_owner' or 'driver'",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get current user ID
    const createdBy = session.user?.global_id || session.user?.id;

    console.log(`[Invites] Creating ${type} invite by user ${createdBy}`);

    // Create invite
    const invite = await inviteRepository.create({
      type,
      createdBy,
      expiresInDays: expiresInDays || 7,
    });

    // Generate the full invite URL using the request's origin
    const url = new URL(request.url);
    const baseUrl = url.origin;
    const inviteUrl = `${baseUrl}/onboard?token=${invite.token}`;

    console.log(`[Invites] Created invite ${invite.id} with token ${invite.token}`);

    return new Response(
      JSON.stringify({
        success: true,
        invite: {
          ...invite,
          url: inviteUrl,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Invites] Error creating invite:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to create invite",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
