/**
 * Better Auth API catch-all handler
 * Handles all /api/auth/* routes when Better Auth is enabled
 */

import type { APIRoute } from "astro";
import { auth, migrationPromise } from "../../../lib/auth/auth";
import { isBetterAuth } from "../../../lib/auth/feature-flag";

/**
 * Handle all HTTP methods for Better Auth
 * This includes GET (session), POST (sign in/up), etc.
 *
 * IMPORTANT: Awaits migrations before handling any requests
 * to ensure database schema is ready in serverless environments.
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

  // Ensure migrations have run before handling requests
  // This is critical for serverless environments where each request
  // might be handled by a fresh function instance
  try {
    await migrationPromise;
  } catch (error) {
    console.error("[Auth API] Migration failed:", error);
    return new Response(
      JSON.stringify({
        error: "Database initialization failed",
        message: "Could not initialize authentication system",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Pass request to Better Auth handler
  return auth.handler(ctx.request);
};
