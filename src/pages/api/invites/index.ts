/**
 * List Invites API Endpoint
 *
 * Returns all invites with pagination and filtering
 * Only accessible by SuperAdmin users
 *
 * GET /api/invites?status=pending&type=shop_owner&limit=20&offset=0
 */

import type { APIRoute } from "astro";
import { inviteRepository } from "../../../lib/db/repositories/InviteRepository";
import { getSession } from "../../../lib/auth/session-adapter";
import { isSystemAdmin } from "../../../lib/auth/auth";

export const GET: APIRoute = async ({ request, cookies, url }) => {
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
        JSON.stringify({ error: "Only SuperAdmin can view invites" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse query params
    const status = url.searchParams.get("status") as any;
    const type = url.searchParams.get("type") as any;
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    console.log(`[Invites] Listing invites - status: ${status}, type: ${type}, limit: ${limit}, offset: ${offset}`);

    // Get invites
    const { invites, total } = await inviteRepository.list({
      status,
      type,
      limit,
      offset,
      orderDir: "DESC",
    });

    // Generate URLs for each invite
    const baseUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:3000";
    const invitesWithUrls = invites.map((invite) => ({
      ...invite,
      url: `${baseUrl}/onboard?token=${invite.token}`,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        invites: invitesWithUrls,
        total,
        limit,
        offset,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Invites] Error listing invites:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to list invites",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
