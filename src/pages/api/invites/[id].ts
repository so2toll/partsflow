/**
 * Invite Management API Endpoint
 *
 * GET /api/invites/[id] - Get invite details
 * DELETE /api/invites/[id] - Revoke an invite
 *
 * Only accessible by SuperAdmin users
 */

import type { APIRoute } from "astro";
import { inviteRepository } from "../../../lib/db/repositories/InviteRepository";
import { getSession } from "../../../lib/auth/session-adapter";
import { isSystemAdmin } from "../../../lib/auth/auth";

export const GET: APIRoute = async ({ params, request, cookies }) => {
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

    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Invite ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const invite = await inviteRepository.findById(id);

    if (!invite) {
      return new Response(
        JSON.stringify({ error: "Invite not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate URL
    const baseUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/onboard?token=${invite.token}`;

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
    console.error("[Invites] Error getting invite:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to get invite",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
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
        JSON.stringify({ error: "Only SuperAdmin can revoke invites" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Invite ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if invite exists
    const invite = await inviteRepository.findById(id);

    if (!invite) {
      return new Response(
        JSON.stringify({ error: "Invite not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Can only revoke pending invites
    if (invite.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: `Cannot revoke invite with status '${invite.status}'`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Invites] Revoking invite ${id}`);

    // Revoke the invite
    const revokedInvite = await inviteRepository.revoke(id);

    return new Response(
      JSON.stringify({
        success: true,
        invite: revokedInvite,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Invites] Error revoking invite:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to revoke invite",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
