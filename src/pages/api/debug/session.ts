/**
 * Debug Session Endpoint
 *
 * Returns the current user session for debugging purposes.
 * Remove this file before production!
 *
 * GET /api/debug/session
 */

import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth/session-adapter";
import { auth } from "../../../lib/auth/auth";

export const GET: APIRoute = async ({ request, cookies }) => {
  // Get unified session
  const session = await getSession(request, cookies);

  if (!session) {
    return new Response(
      JSON.stringify({
        error: "No active session",
        authenticated: false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get raw Better Auth session for token info
  let rawSession: any = null;
  try {
    rawSession = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (e) {
    // Ignore if we can't get raw session
  }

  // Return full session data for debugging
  return new Response(
    JSON.stringify({
      authenticated: true,
      user: {
        id: session.user?.id,
        global_id: session.user?.global_id,
        email: session.user?.email,
        name: session.user?.name,
        role: session.user?.role,
        organizationId: session.user?.organizationId,
        createdAt: session.user?.createdAt,
      },
      rawSession: rawSession ? {
        session: {
          id: rawSession.session?.id,
          expiresAt: rawSession.session?.expiresAt,
          token: rawSession.session?.token ? rawSession.session.token.substring(0, 30) + "..." : "N/A",
        },
        user: {
          id: rawSession.user?.id,
          email: rawSession.user?.email,
        }
      } : null,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
