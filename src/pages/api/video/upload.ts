/**
 * POST /api/video/upload
 *
 * Video Upload Endpoint for Edit Mode
 *
 * Handles video file uploads for Edit Mode workflow:
 * 1. Validates file type and size
 * 2. Uploads to Azure Blob Storage
 * 3. Creates video record in database
 * 4. Returns videoId for redirect to edit page
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: { file: File }
 *
 * Response:
 * {
 *   success: true,
 *   videoId: string,
 *   videoUrl: string,
 *   message: string
 * }
 *
 * Security:
 * - Requires authenticated session
 * - Requires 'asset:upload' permission
 * - Organization scoping enforced
 *
 * @module pages/api/video/upload
 */

import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { uploadBlob, CONTAINERS } from '@/lib/storage';
import { graph } from '@/lib/db/graph';
import { ulid } from 'ulid';
import { hasPermissionByRole } from '@/lib/services/PermissionService';
import { VIDEO_AI_PERMISSIONS } from '@/lib/configs/rbacConfig';

// File validation constants
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi'];

/**
 * Validate uploaded video file
 *
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
function validateVideoFile(file: File): string | null {
  // Check file type
  const hasValidType = ALLOWED_VIDEO_TYPES.includes(file.type);
  const hasValidExtension = ALLOWED_VIDEO_EXTENSIONS.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidType && !hasValidExtension) {
    return 'Invalid file type. Only MP4, MOV, and AVI files are supported.';
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return `File size (${sizeMB}MB) exceeds the maximum allowed size of 500MB.`;
  }

  return null;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // =========================================================================
    // 1. Authenticate User
    // =========================================================================
    const session = await getSession(request, cookies);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          details: 'Valid authentication required'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.global_id || session.user.id;
    const userRole = session.user.role;
    const organizationId = session.user.organizationId;

    // =========================================================================
    // 2. Check Upload Permission
    // =========================================================================
    if (!hasPermissionByRole(userRole, VIDEO_AI_PERMISSIONS.ASSET_UPLOAD)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden',
          details: 'You do not have permission to upload videos'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Validate Organization
    // =========================================================================
    if (!organizationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Organization Required',
          details: 'Your account is not associated with an organization. Please contact support.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 4. Parse FormData and Extract File
    // =========================================================================
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing File',
          details: 'No file provided in request'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 5. Validate File
    // =========================================================================
    const validationError = validateVideoFile(file);

    if (validationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation Error',
          details: validationError
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 6. Generate Unique Filename
    // =========================================================================
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const videoId = `vid_${ulid()}`;
    const uniqueFilename = `${organizationId}/${videoId}.${fileExtension}`;

    console.log(`[Video Upload] Uploading file for user ${userId}: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

    // =========================================================================
    // 7. Upload to Azure Blob Storage
    // =========================================================================
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let videoUrl: string;
    try {
      videoUrl = await uploadBlob({
        container: CONTAINERS.UPLOADS,
        blobName: uniqueFilename,
        data: buffer,
        contentType: file.type || 'video/mp4',
        metadata: {
          userId: userId,
          organizationId: organizationId,
          originalFilename: file.name,
          uploadedAt: new Date().toISOString(),
        },
        tags: {
          type: 'video-upload',
          mode: 'edit',
        }
      });

      console.log(`[Video Upload] File uploaded to storage: ${videoUrl}`);
    } catch (uploadError) {
      console.error('[Video Upload] Storage upload failed:', uploadError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Upload Failed',
          details: 'Failed to upload file to storage. Please try again.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 8. Create Video Record in Database
    // =========================================================================
    const now = new Date().toISOString();

    try {
      await graph.mutate(
        `
        CREATE (v:UploadedVideo {
          id: $id,
          userId: $userId,
          organizationId: $organizationId,
          originalFilename: $originalFilename,
          filename: $filename,
          videoUrl: $videoUrl,
          fileSize: $fileSize,
          mimeType: $mimeType,
          status: $status,
          indexed: $indexed,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        RETURN v
        `,
        {
          id: videoId,
          userId,
          organizationId,
          originalFilename: file.name,
          filename: uniqueFilename,
          videoUrl,
          fileSize: file.size,
          mimeType: file.type || 'video/mp4',
          status: 'uploaded',
          indexed: false,
          createdAt: now,
          updatedAt: now,
        }
      );

      console.log(`[Video Upload] Video record created: ${videoId}`);

    } catch (dbError) {
      console.error('[Video Upload] Database insert failed:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database Error',
          details: 'Failed to create video record. Please try again.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 9. Return Success Response
    // =========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        videoUrl,
        filename: file.name,
        fileSize: file.size,
        message: 'Video uploaded successfully'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Video Upload] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
