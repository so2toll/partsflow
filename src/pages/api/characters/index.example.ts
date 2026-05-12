/**
 * API Endpoint: Character Collection Operations (WITH ERROR HANDLING EXAMPLE)
 *
 * This is an EXAMPLE showing how to use the error handling middleware.
 * The actual implementation is in index.ts
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
 * @module pages/api/characters
 * @version 2.0.0 (with error handling)
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { characterRepository } from '@/lib/db/repositories/CharacterRepository';
import { VIDEO_AI_PERMISSIONS } from '@/lib/configs/rbacConfig';
import {
  withErrorHandler,
  throwUnauthorizedError,
  throwForbiddenError,
  throwValidationError,
  throwNotFoundError,
  validateRequiredFields,
  validateFieldType,
} from '@/lib/middleware/errorHandler';

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

/**
 * GET /api/characters
 *
 * List characters with pagination and search
 *
 * Query Parameters:
 * - limit?: number (default: 20, max: 100)
 * - offset?: number (default: 0)
 * - search?: string - Search by name/description
 *
 * Response:
 * {
 *   success: true,
 *   characters: Character[],
 *   total: number,
 *   limit: number,
 *   offset: number
 * }
 */
export const GET = withErrorHandler(async ({ request, cookies, url, requestId }) => {
  // =========================================================================
  // 1. Authenticate User
  // =========================================================================
  const session = await getSession(request, cookies);
  if (!session) {
    throwUnauthorizedError('Valid authentication required');
  }

  // =========================================================================
  // 2. Authorize Request
  // =========================================================================
  if (!hasPermission(session.user.role, VIDEO_AI_PERMISSIONS.CHARACTER_READ)) {
    throwForbiddenError('You do not have permission to view characters');
  }

  // =========================================================================
  // 3. Parse and Validate Query Parameters
  // =========================================================================
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  // Validate and parse limit
  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throwValidationError(
      'limit',
      'Limit must be between 1 and 100',
      limitParam,
      'number (1-100)'
    );
  }

  // Validate and parse offset
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  if (isNaN(offset) || offset < 0) {
    throwValidationError(
      'offset',
      'Offset must be a non-negative number',
      offsetParam,
      'number >= 0'
    );
  }

  // =========================================================================
  // 4. Determine Organization Scope
  // =========================================================================
  const organizationId = session.user.role === 'SuperAdmin'
    ? undefined
    : session.user.organizationId;

  if (!organizationId && session.user.role !== 'SuperAdmin') {
    throwValidationError(
      'organizationId',
      'User must be associated with an organization',
      session.user.organizationId,
      'string (organization ID)'
    );
  }

  // =========================================================================
  // 5. Fetch Characters
  // =========================================================================
  const result = await characterRepository.findByOrgId(
    organizationId || '',
    { limit, offset }
  );

  // =========================================================================
  // 6. Filter by Search Query (if provided)
  // =========================================================================
  const searchQuery = url.searchParams.get('search');
  let filteredCharacters = result.characters;

  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    filteredCharacters = result.characters.filter(
      (char) =>
        char.name?.toLowerCase().includes(searchLower) ||
        char.description?.toLowerCase().includes(searchLower)
    );
  }

  // =========================================================================
  // 7. Return Success Response
  // =========================================================================
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
});

// ============================================================================
// POST /api/characters - Create character
// ============================================================================

/**
 * POST /api/characters
 *
 * Create a new character
 *
 * Request Body (JSON):
 * {
 *   name: string (required);
 *   description?: string;
 *   deeplakeRef?: string;
 *   referenceImageUrl?: string;
 *   metadata?: Record<string, unknown>;
 * }
 *
 * Request Body (FormData with file upload):
 * {
 *   name: string (required);
 *   description?: string;
 *   referenceImage?: File;
 *   metadata?: string (JSON stringified);
 * }
 *
 * Response:
 * {
 *   success: true,
 *   character: Character
 * }
 */
export const POST = withErrorHandler(async ({ request, cookies, requestId }) => {
  // =========================================================================
  // 1. Authenticate User
  // =========================================================================
  const session = await getSession(request, cookies);
  if (!session) {
    throwUnauthorizedError('Valid authentication required');
  }

  // =========================================================================
  // 2. Authorize Request
  // =========================================================================
  if (!hasPermission(session.user.role, VIDEO_AI_PERMISSIONS.CHARACTER_CREATE)) {
    throwForbiddenError('You do not have permission to create characters');
  }

  // =========================================================================
  // 3. Validate Organization
  // =========================================================================
  const organizationId = session.user.organizationId;
  if (!organizationId) {
    throwValidationError(
      'organizationId',
      'User must belong to an organization',
      undefined,
      'string (organization ID)'
    );
  }

  const userId = session.user.global_id || session.user.id;
  const contentType = request.headers.get('content-type') || '';

  let characterData: {
    name: string;
    description?: string;
    deeplakeRef?: string;
    referenceImageUrl?: string;
    metadata?: Record<string, unknown>;
  };

  // =========================================================================
  // 4. Parse Request Body
  // =========================================================================

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
      throwValidationError(
        'name',
        'Character name is required',
        name,
        'string (non-empty)'
      );
    }

    // Process reference image upload if present
    let referenceImageUrl: string | undefined;
    if (referenceImage && referenceImage.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(referenceImage.type)) {
        throwValidationError(
          'referenceImage',
          'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF',
          referenceImage.type,
          'image/jpeg | image/png | image/webp | image/gif'
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (referenceImage.size > maxSize) {
        throwValidationError(
          'referenceImage',
          'File size exceeds 5MB limit',
          referenceImage.size,
          'number <= 5242880 (5MB)'
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
        throwValidationError(
          'metadata',
          'Invalid metadata JSON',
          metadataStr,
          'valid JSON string'
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

    // Validate required fields using helper
    validateRequiredFields(body, ['name']);

    // Validate field types
    validateFieldType(body, 'name', 'string');
    if (body.description !== undefined) {
      validateFieldType(body, 'description', 'string');
    }
    if (body.deeplakeRef !== undefined) {
      validateFieldType(body, 'deeplakeRef', 'string');
    }
    if (body.referenceImageUrl !== undefined) {
      validateFieldType(body, 'referenceImageUrl', 'string');
    }
    if (body.metadata !== undefined) {
      validateFieldType(body, 'metadata', 'object');
    }

    characterData = {
      name: body.name.trim(),
      description: body.description?.trim(),
      deeplakeRef: body.deeplakeRef?.trim(),
      referenceImageUrl: body.referenceImageUrl?.trim(),
      metadata: body.metadata,
    };
  }

  // =========================================================================
  // 5. Create Character
  // =========================================================================
  const character = await characterRepository.create({
    userId,
    organizationId,
    ...characterData,
  });

  // =========================================================================
  // 6. Return Success Response
  // =========================================================================
  return new Response(
    JSON.stringify({
      success: true,
      character,
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
});
