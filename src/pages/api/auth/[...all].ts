/**
 * Better Auth API catch-all handler
 * Handles all /api/auth/* routes when Better Auth is enabled
 */

import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth/auth";
import { isBetterAuth } from "../../../lib/auth/feature-flag";

/**
 * Handle all HTTP methods for Better Auth
 * This includes GET (session), POST (sign in/up), etc.
 */
export const ALL: APIRoute = async (ctx) => {
  // Only process if Better Auth is the active provider
  if (!isBetterAuth()) {
    return new Response(
      JSON.stringify({
        error: "Better Auth not enabled",
        message: "Set AUTH_PROVIDER=better-auth in .env to enable",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Pass request to Better Auth handler
  return auth.handler(ctx.request);
};
