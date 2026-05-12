/**
 * Graph Query API Endpoint
 *
 * Executes Cypher-like queries and returns results.
 * Used by the graph explorer for ad-hoc queries.
 *
 * POST /dev/api/graph-query
 * Body: { query: string, params?: Record<string, unknown> }
 */

import type { APIRoute } from "astro";
import { graph } from "../../../lib/db/graph";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { query: cypherQuery, params = {} } = await request.json();

    if (!cypherQuery || typeof cypherQuery !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required and must be a string" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Detect if this is a CREATE/MERGE operation vs SELECT/MATCH
    const isCreateQuery = cypherQuery.trim().toUpperCase().startsWith('CREATE') ||
                         cypherQuery.trim().toUpperCase().startsWith('MERGE');

    let results;
    if (isCreateQuery) {
      // Use mutate for CREATE operations
      console.log(`[GraphQueryAPI] Detected CREATE operation, using mutate`);
      results = await graph.mutate(cypherQuery, params);
    } else {
      // Use query for SELECT operations
      console.log(`[GraphQueryAPI] Detected SELECT operation, using query`);
      results = await graph.query(cypherQuery, params);
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Graph query error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to execute query",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Allow GET requests for simple queries via URL params
export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get("query");

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const results = await graph.query(query);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Graph query error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to execute query",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
