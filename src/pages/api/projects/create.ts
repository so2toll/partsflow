/**
 * Create Project API Endpoint
 *
 * Creates a new project for the user's organization
 * Anyone with User role or higher can create projects
 *
 * POST /api/projects/create
 * Body: { name: string, description?: string }
 */

import type { APIRoute } from "astro";
import { projectRepository } from "../../../lib/db/repositories/ProjectRepository";
import { getSession } from "../../../lib/auth/session-adapter";
import { logProjectCreate } from "../../../lib/services/AuditService";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(request, cookies);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use global_id if available, otherwise fall back to id for backward compatibility
    const userId = session?.user?.global_id || session?.user?.id;
    const organizationId = session?.user?.organizationId;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "User ID not found",
          details: "Your session does not contain a valid user ID. Please log out and log back in.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({
          error: "Organization required",
          details: "Your account is not associated with an organization. Please contact support.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { name, description } = await request.json();

    if (!name) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: name",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Projects] Creating project "${name}" for org ${organizationId}`);

    const project = await projectRepository.create({
      name,
      description,
      organizationId,
      createdBy: userId,
    });

    // Log project creation
    try {
      await logProjectCreate(
        userId,
        organizationId,
        project.id,
        project.name
      );
    } catch (auditError) {
      console.error("Error logging project creation:", auditError);
    }

    console.log(`[Projects] Created project ${project.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        project,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Projects] Error creating project:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to create project",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
