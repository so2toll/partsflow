/**
 * Validate Invite Token API Endpoint
 *
 * Validates an invite token and returns invite details if valid
 * This endpoint is PUBLIC (no auth required) - used during onboarding
 *
 * GET /api/invites/validate/[token]
 */

import type { APIRoute } from "astro";
import { inviteRepository } from "../../../../lib/db/repositories/InviteRepository";

export const GET: APIRoute = async ({ params }) => {
  try {
    const { token } = params;

    if (!token) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Token is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Invites] Validating token: ${token.substring(0, 8)}...`);

    // Validate the token
    const invite = await inviteRepository.validateToken(token);

    if (!invite) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Invalid or expired invite link",
        }),
        {
          status: 200, // Return 200 with valid: false for client-side handling
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Invites] Token valid - type: ${invite.type}, expires: ${invite.expiresAt}`);

    return new Response(
      JSON.stringify({
        valid: true,
        invite: {
          id: invite.id,
          type: invite.type,
          expiresAt: invite.expiresAt,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Invites] Error validating token:", error);

    return new Response(
      JSON.stringify({
        valid: false,
        error: "Failed to validate token",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
