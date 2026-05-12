/**
 * Update User Role API Endpoint
 *
 * PUT /api/users/[id]/role
 *
 * Updates a user's role in both Better Auth and graph database.
 * Only admins can change user roles.
 * Users can only change roles within their organization.
 *
 * Request body:
 * {
 *   "role": "Admin" | "User" | "Viewer"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Role updated to User",
 *   "user": {
 *     "id": "...",
 *     "email": "...",
 *     "role": "User"
 *   }
 * }
 */

import type { APIRoute } from "astro";
import { updateUserRole } from "../../../../lib/services/RoleService";

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const userId = params.id;

  if (!userId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "User ID is required",
      }),
      { status: 400 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Role is required",
        }),
        { status: 400 }
      );
    }

    // Update user role
    const result = await updateUserRole(userId, role, request, cookies);

    if (result.success) {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in role update endpoint:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
};
