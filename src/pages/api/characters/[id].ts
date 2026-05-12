/**
 * API Endpoint: Single Character Operations
 *
 * GET /api/characters/[id] - Get a single character
 * PUT /api/characters/[id] - Update a character (with optional file upload)
 * DELETE /api/characters/[id] - Delete a character
 *
 * Purpose:
 * - Get: Returns details for a single character
 * - Update: Modifies character properties and/or reference image
 * - Delete: Permanently removes a character
 *
 * Security:
 * - Requires authenticated session
 * - Get: Requires 'character:read' permission (all roles)
 * - Update: Requires 'character:update' permission (StudioAdmin, User, SuperAdmin)
 * - Delete: Requires 'character:delete' permission (StudioAdmin, SuperAdmin)
 * - Organization scoping: Users can only access their organization's characters
 * - SuperAdmin bypass: Can access any character
 *
 * Request Body (PUT - JSON):
 * - name?: string
 * - description?: string
 * - deeplakeRef?: string
 * - referenceImageUrl?: string
 * - metadata?: Record<string, unknown>
 *
 * Request Body (PUT - FormData with file upload):
 * - name?: string
 * - description?: string
 * - referenceImage?: File - New reference image for character
 * - metadata?: string (JSON stringified)
 *
 * @returns {
 *   success: boolean,
 *   character?: Character,
 *   error?: string
 * }
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { characterRepository } from '@/lib/db/repositories/CharacterRepository';
import { VIDEO_AI_PERMISSIONS } from '@/lib/configs/rbacConfig';

// Permission helper function
function hasPermission(userRole: string, permission: string): boolean {
  // SuperAdmin has all permissions
  if (userRole === 'SuperAdmin') return true;

  // Check role-based permissions
  const rolePermissions: Record<string, string[]> = {
    StudioAdmin: [
      'character:create',
      'character:read',
      'character:update',
      'character:delete',
    ],
    User: [
      'character:create',
      'character:read',
      'character:update',
    ],
    StudioViewer: [
      'character:read',
    ],
  };

  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission) || permissions.includes('*');
}

// Authorization check - verify user can access character
async function canAccessCharacter(
  characterId: string,
  userOrganizationId: string | undefined,
  userRole: string
): Promise<{ canAccess: boolean; error?: string; character?: any }> {
  const character = await characterRepository.findById(characterId);

  if (!character) {
    return { canAccess: false, error: 'Character not found' };
  }

  // SuperAdmin can access any character
  if (userRole === 'SuperAdmin') {
    return { canAccess: true, character };
  }

  // Other users can only access their organization's characters
  if (character.organizationId !== userOrganizationId) {
    return {
      canAccess: false,
      error: 'Forbidden - Character belongs to a different organization',
    };
  }

  return { canAccess: true, character };
}

// ============================================================================
// GET /api/characters/[id] - Get single character
// ============================================================================

export const GET: APIRoute = async ({ request, cookies, params }) => {
  try {
    // Verify user session
    const session = await getSession(request, cookies);

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No session found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check user has permission to read characters
    if (!hasPermission(session.user.role, VIDEO_AI_PERMISSIONS.CHARACTER_READ)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const characterId = params.id;

    if (!characterId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing character ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check authorization
    const authCheck = await canAccessCharacter(
      characterId,
      session.user.organizationId,
      session.user.role
    );

    if (!authCheck.canAccess) {
      return new Response(
        JSON.stringify({ success: false, error: authCheck.error }),
        { status: authCheck.error === 'Character not found' ? 404 : 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        character: authCheck.character,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Characters API] Get error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch character',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// PUT /api/characters/[id] - Update character
// ============================================================================

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  try {
    // Verify user session
    const session = await getSession(request, cookies);

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No session found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check user has permission to update characters
    if (!hasPermission(session.user.role, VIDEO_AI_PERMISSIONS.CHARACTER_UPDATE)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const characterId = params.id;

    if (!characterId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing character ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check authorization before updating
    const authCheck = await canAccessCharacter(
      characterId,
      session.user.organizationId,
      session.user.role
    );

    if (!authCheck.canAccess) {
      return new Response(
        JSON.stringify({ success: false, error: authCheck.error }),
        { status: authCheck.error === 'Character not found' ? 404 : 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let updateData: {
      name?: string;
      description?: string;
      deeplakeRef?: string;
      referenceImageUrl?: string;
      metadata?: Record<string, unknown>;
    };

    // Handle FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const name = formData.get('name') as string | null;
      const description = formData.get('description') as string | null;
      const deeplakeRef = formData.get('deeplakeRef') as string | null;
      const referenceImage = formData.get('referenceImage') as File | null;
      const metadataStr = formData.get('metadata') as string | null;

      // Process reference image upload if present
      let referenceImageUrl: string | undefined;
      if (referenceImage && referenceImage.size > 0) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(referenceImage.type)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF'
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (referenceImage.size > maxSize) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'File size exceeds 5MB limit'
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // TODO: Upload to cloud storage (S3, Cloudflare R2, etc.)
        // For now, create a base64 data URL as placeholder
        const arrayBuffer = await referenceImage.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        referenceImageUrl = `data:${referenceImage.type};base64,${base64}`;
      }

      // Parse metadata if provided
      let metadata: Record<string, unknown> | undefined;
      if (metadataStr) {
        try {
          metadata = JSON.parse(metadataStr);
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid metadata JSON' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      updateData = {
        name: name?.trim() || undefined,
        description: description?.trim() || undefined,
        deeplakeRef: deeplakeRef?.trim() || undefined,
        referenceImageUrl,
        metadata,
      };
    }
    // Handle JSON request
    else {
      const body = await request.json();

      updateData = {
        name: body.name?.trim() || undefined,
        description: body.description?.trim() || undefined,
        deeplakeRef: body.deeplakeRef?.trim() || undefined,
        referenceImageUrl: body.referenceImageUrl?.trim() || undefined,
        metadata: body.metadata,
      };
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    // Ensure there's at least one field to update
    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update character
    const updatedCharacter = await characterRepository.update(characterId, updateData);

    return new Response(
      JSON.stringify({
        success: true,
        character: updatedCharacter,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Characters API] Update error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body',
          details: 'Request body must be valid JSON or FormData',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update character',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// DELETE /api/characters/[id] - Delete character
// ============================================================================

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  try {
    // Verify user session
    const session = await getSession(request, cookies);

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No session found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check user has permission to delete characters
    if (!hasPermission(session.user.role, VIDEO_AI_PERMISSIONS.CHARACTER_DELETE)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const characterId = params.id;

    if (!characterId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing character ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check authorization before deleting
    const authCheck = await canAccessCharacter(
      characterId,
      session.user.organizationId,
      session.user.role
    );

    if (!authCheck.canAccess) {
      return new Response(
        JSON.stringify({ success: false, error: authCheck.error }),
        { status: authCheck.error === 'Character not found' ? 404 : 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete character
    await characterRepository.delete(characterId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Character deleted successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Characters API] Delete error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete character',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
