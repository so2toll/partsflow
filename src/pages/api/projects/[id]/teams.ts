/**
 * Get Project Teams API Endpoint
 *
 * Returns all teams assigned to a project
 *
 * GET /api/projects/{id}/teams
 */

import type { APIRoute } from "astro";
import { projectRepository } from "../../../../lib/db/repositories/ProjectRepository";

export const GET: APIRoute = async ({ params }) => {
  try {
    const projectId = params.id;

    console.log(`[ProjectTeams] Fetching teams for project: ${projectId}`);

    const teams = await projectRepository.getTeams(projectId);

    console.log(`[ProjectTeams] Found ${teams.length} teams for project ${projectId}`);
    console.log(`[ProjectTeams] Teams:`, teams.map((t) => ({
      id: t.id,
      name: t.properties?.name,
      props: t.properties
    })));

    const teamData = teams.map((t) => ({
      id: t.properties?.id || t.id,
      name: t.properties?.name,
    }));

    console.log(`[ProjectTeams] Returning team data:`, teamData);

    return new Response(
      JSON.stringify({
        teams: teamData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Projects] Error getting project teams:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to get project teams",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
