/**
 * API Endpoint: Character Collection Operations
 *
 * GET /api/characters - List characters for an organization
 * POST /api/characters - Create a new character (with optional file upload)
 *
 * Purpose:
 * - List: Returns paginated list of characters scoped to user's organization
 * - Create: Creates a new character with optional reference image upload
 *
 * Security:
 * - Requires authenticated session
 * - List: Requires 'character:read' permission (all roles except StudioViewer)
 * - Create: Requires 'character:create' permission (StudioAdmin, User, SuperAdmin)
 * - Organization scoping: Users can only access their organization's characters
 * - SuperAdmin bypass: Can view all characters across organizations
 *
 * Query Parameters (GET):
 * - limit?: number (default: 20, max: 100)
 * - offset?: number (default: 0)
 * - search?: string - Search by name/description
 *
 * Request Body (POST - JSON):
 * - name: string (required)
 * - description?: string
 * - deeplakeRef?: string
 * - metadata?: Record<string, unknown>
 *
 * Request Body (POST - FormData with file upload):
 * - name: string (required)
 * - description?: string
 * - referenceImage: File (optional) - Reference image for character
 * - metadata?: string (JSON stringified)
 *
 * @returns {
 *   success: boolean,
 *   characters?: Character[],
 *   character?: Character,
 *   total?: number,
 *   limit?: number,
 *   offset?: number,
 *   error?: string
 * }
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { characterRepository } from '@/lib/db/repositories/CharacterRepository';
import { VIDEO_AI_PERMISSIONS } from '@/lib/configs/rbacConfig';
import { uploadBlob, CONTAINERS } from '@/lib/storage-adapter';
import { ulid } from 'ulid';

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

// ============================================================================
// GET /api/characters - List characters
// ============================================================================

export const GET: APIRoute = async ({ request, cookies, url }) => {
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

    // Parse query parameters
    const searchQuery = url.searchParams.get('search');
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Determine organization ID
    // SuperAdmin can see all characters (pass undefined to get all)
    // Other roles are scoped to their organization
    const organizationId = session.user.role === 'SuperAdmin'
      ? undefined
      : session.user.organizationId;

    if (!organizationId && session.user.role !== 'SuperAdmin') {
      return new Response(
        JSON.stringify({ success: false, error: 'User not associated with an organization' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch characters
    // SuperAdmin can see all characters across all organizations
    const result = session.user.role === 'SuperAdmin'
      ? await characterRepository.findAll({ limit, offset })
      : await characterRepository.findByOrgId(organizationId!, { limit, offset });

    // Filter by search query if provided (client-side filtering for now)
    let filteredCharacters = result.characters;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredCharacters = result.characters.filter(
        (char) =>
          char.name?.toLowerCase().includes(searchLower) ||
          char.description?.toLowerCase().includes(searchLower)
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        characters: filteredCharacters,
        total: searchQuery ? filteredCharacters.length : result.total,
        limit,
        offset,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Characters API] List error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch characters',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// POST /api/characters - Create character
// ============================================================================

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify user session
    const session = await getSession(request, cookies);

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No session found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check user has permission to create characters
    if (!hasPermission(session.user.role, VIDEO_AI_PERMISSIONS.CHARACTER_CREATE)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has an organization
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User must belong to an organization' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const userId = session.user.global_id || session.user.id;

    let characterData: {
      name: string;
      description?: string;
      deeplakeRef?: string;
      referenceImageUrl?: string;
      metadata?: Record<string, unknown>;
    };

    // Handle FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const name = formData.get('name') as string;
      const description = formData.get('description') as string | null;
      const deeplakeRef = formData.get('deeplakeRef') as string | null;
      const referenceImage = formData.get('referenceImage') as File | null;
      const metadataStr = formData.get('metadata') as string | null;

      // Validate required fields
      if (!name?.trim()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Character name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

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

        // Upload to Azure Blob Storage
        const arrayBuffer = await referenceImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique filename
        const fileExtension = referenceImage.name.split('.').pop() || 'jpg';
        const uniqueFilename = `${session.user.organizationId}/char_${ulid()}.${fileExtension}`;

        try {
          referenceImageUrl = await uploadBlob({
            container: CONTAINERS.CHARACTERS,
            blobName: uniqueFilename,
            data: buffer,
            contentType: referenceImage.type,
            metadata: {
              userId: userId,
              organizationId: session.user.organizationId || '',
              originalName: referenceImage.name,
            },
          });
        } catch (uploadError) {
          console.error('[Characters API] File upload failed:', uploadError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to upload character image to storage'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
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

      characterData = {
        name: name.trim(),
        description: description?.trim() || undefined,
        deeplakeRef: deeplakeRef?.trim() || undefined,
        referenceImageUrl,
        metadata,
      };
    }
    // Handle JSON request
    else {
      const body = await request.json();

      if (!body.name?.trim()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Character name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      characterData = {
        name: body.name.trim(),
        description: body.description?.trim(),
        deeplakeRef: body.deeplakeRef?.trim(),
        referenceImageUrl: body.referenceImageUrl?.trim(),
        metadata: body.metadata,
      };
    }

    // Create character
    const character = await characterRepository.create({
      userId,
      organizationId,
      ...characterData,
    });

    return new Response(
      JSON.stringify({
        success: true,
        character,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Characters API] Create error:', error);

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
        error: 'Failed to create character',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
