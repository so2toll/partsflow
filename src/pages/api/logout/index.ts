
/**
 * Logout API Endpoint - Robust Version
 *
 * Handles logout requests via POST
 * Uses Better Auth's signOut method + explicit cookie deletion
 */

import { auth } from "../../../lib/auth/auth";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("[Logout API] Processing logout request...");

    // Step 1: Call Better Auth signOut
    await auth.api.signOut({
      headers: request.headers,
    });

    console.log("[Logout API] Better Auth signOut completed");

    // Step 2: Create response with explicit cookie deletion
    const response = new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Explicitly delete the session cookie
          "Set-Cookie": "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
        },
      }
    );

    console.log("[Logout API] Response with cookie deletion headers sent");
    return response;
  } catch (error) {
    console.error("[Logout API] Error:", error);

    // Still try to send cookie deletion even on error
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Logout completed with errors",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          // Always try to delete the cookie
          "Set-Cookie": "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
        },
      }
    );

    return response;
  }
};
