/**
 * List Projects API Endpoint
 *
 * Returns all projects for the user's organization
 *
 * GET /api/projects
 */

import type { APIRoute } from "astro";
import { projectRepository } from "../../../lib/db/repositories/ProjectRepository";
import { getSession } from "../../../lib/auth/session-adapter";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(request, cookies);

    if (!session?.user?.organizationId) {
      return new Response(
        JSON.stringify({
          error: "Organization required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { projects, total } = await projectRepository.findByOrgId(session.user.organizationId);

    console.log(`[Projects] Found ${total} projects for org ${session.user.organizationId}`);

    return new Response(
      JSON.stringify({
        projects,
        total,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Projects] Error listing projects:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to list projects",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
