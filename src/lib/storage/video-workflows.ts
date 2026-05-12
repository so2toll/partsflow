/**
 * Video AI Storage Workflows
 *
 * High-level workflow functions for common Video AI Content Studio operations.
 * These wrap the base Azure Blob Storage client with business logic.
 *
 * @module lib/storage/video-workflows
 * @version 1.0.0
 */

import {
  uploadBlob,
  deleteBlob,
  deleteBlobs,
  blobExists,
  getBlobMetadata,
  listBlobs,
  generateSasUrl,
  getBlobUrl,
  type UploadBlobParams,
  type DeleteBlobParams,
  CONTAINERS,
} from './storage';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Video upload metadata
 */
export interface VideoUploadMetadata {
  /** User ID who owns the video */
  userId: string;
  /** Video ID (ULID or UUID) */
  videoId: string;
  /** Original filename */
  originalFilename: string;
  /** File size in bytes */
  fileSize: number;
  /** Video duration in seconds */
  duration?: number;
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
  /** Video codec */
  codec?: string;
  /** Additional custom metadata */
  [key: string]: string | number | undefined;
}

/**
 * Keyframe metadata
 */
export interface KeyframeMetadata {
  /** User ID who owns the video */
  userId: string;
  /** Video ID */
  videoId: string;
  /** Frame index in the video */
  frameIndex: number;
  /** Timestamp in seconds */
  timestamp: number;
  /** Scene number (if detected) */
  sceneNumber?: number;
}

/**
 * Video processing result
 */
export interface VideoProcessingResult {
  /** URL of the processed video */
  processedUrl: string;
  /** URL of the thumbnail */
  thumbnailUrl: string;
  /** Number of keyframes extracted */
  keyframeCount: number;
  /** Total size of all keyframes in bytes */
  keyframesSize: number;
}

/**
 * Video storage summary
 */
export interface VideoStorageSummary {
  /** Number of videos */
  videoCount: number;
  /** Total storage used in bytes */
  totalSize: number;
  /** Number of keyframes */
  keyframeCount: number;
  /** Number of thumbnails */
  thumbnailCount: number;
}

// =============================================================================
// Upload Workflows
// =============================================================================

/**
 * Upload an original video file
 *
 * Stores the user-uploaded video in the 'uploads' container with metadata.
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {Buffer | Blob | ArrayBuffer | ReadableStream} data - Video data
 * @param {VideoUploadMetadata} metadata - Video metadata
 * @returns {Promise<string>} Public URL of uploaded video
 *
 * @example
 * ```typescript
 * const url = await uploadOriginalVideo('user123', 'video_abc', buffer, {
 *   originalFilename: 'my-video.mp4',
 *   fileSize: buffer.length,
 *   duration: 120,
 *   width: 1920,
 *   height: 1080
 * });
 * ```
 */
export async function uploadOriginalVideo(
  userId: string,
  videoId: string,
  data: Buffer | Blob | ArrayBuffer | ReadableStream,
  metadata: VideoUploadMetadata
): Promise<string> {
  const blobName = `${userId}/${videoId}/original.mp4`;

  const uploadParams: UploadBlobParams = {
    container: CONTAINERS.UPLOADS,
    blobName,
    data,
    contentType: 'video/mp4',
    metadata: {
      userId,
      videoId,
      originalFilename: metadata.originalFilename,
      fileSize: metadata.fileSize.toString(),
      duration: metadata.duration?.toString() || '',
      width: metadata.width?.toString() || '',
      height: metadata.height?.toString() || '',
      codec: metadata.codec || '',
      uploadedAt: new Date().toISOString(),
    },
  };

  return uploadBlob(uploadParams);
}

/**
 * Upload a processed video file
 *
 * Stores the final processed video in the 'videos' container.
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {Buffer | Blob | ArrayBuffer | ReadableStream} data - Video data
 * @param {Partial<VideoUploadMetadata>} metadata - Optional metadata
 * @returns {Promise<string>} Public URL of processed video
 */
export async function uploadProcessedVideo(
  userId: string,
  videoId: string,
  data: Buffer | Blob | ArrayBuffer | ReadableStream,
  metadata?: Partial<VideoUploadMetadata>
): Promise<string> {
  const blobName = `${userId}/${videoId}/processed.mp4`;

  const uploadParams: UploadBlobParams = {
    container: CONTAINERS.VIDEOS,
    blobName,
    data,
    contentType: 'video/mp4',
    metadata: {
      userId,
      videoId,
      processedAt: new Date().toISOString(),
      ...(metadata && {
        duration: metadata.duration?.toString() || '',
        width: metadata.width?.toString() || '',
        height: metadata.height?.toString() || '',
      }),
    },
  };

  return uploadBlob(uploadParams);
}

/**
 * Upload a keyframe image
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {number} frameIndex - Frame index
 * @param {Buffer} imageData - Image data
 * @param {KeyframeMetadata} metadata - Keyframe metadata
 * @returns {Promise<string>} Public URL of keyframe
 */
export async function uploadKeyframe(
  userId: string,
  videoId: string,
  frameIndex: number,
  imageData: Buffer,
  metadata: KeyframeMetadata
): Promise<string> {
  const blobName = `${userId}/${videoId}/keyframes/${String(frameIndex).padStart(6, '0')}.jpg`;

  const uploadParams: UploadBlobParams = {
    container: CONTAINERS.KEYFRAMES,
    blobName,
    data: imageData,
    contentType: 'image/jpeg',
    metadata: {
      userId,
      videoId,
      frameIndex: frameIndex.toString(),
      timestamp: metadata.timestamp.toString(),
      sceneNumber: metadata.sceneNumber?.toString() || '',
      extractedAt: new Date().toISOString(),
    },
  };

  return uploadBlob(uploadParams);
}

/**
 * Upload a thumbnail image
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {Buffer} imageData - Image data
 * @returns {Promise<string>} Public URL of thumbnail
 */
export async function uploadThumbnail(
  userId: string,
  videoId: string,
  imageData: Buffer
): Promise<string> {
  const blobName = `${userId}/${videoId}/thumbnail.jpg`;

  const uploadParams: UploadBlobParams = {
    container: CONTAINERS.THUMBNAILS,
    blobName,
    data: imageData,
    contentType: 'image/jpeg',
    metadata: {
      userId,
      videoId,
      createdAt: new Date().toISOString(),
    },
  };

  return uploadBlob(uploadParams);
}

/**
 * Upload a character asset for AI generation
 *
 * @param {string} userId - User ID
 * @param {string} characterId - Character ID
 * @param {Buffer | Blob | ArrayBuffer | ReadableStream} data - Character image data
 * @param {string} filename - Original filename
 * @returns {Promise<string>} Public URL of character asset
 */
export async function uploadCharacterAsset(
  userId: string,
  characterId: string,
  data: Buffer | Blob | ArrayBuffer | ReadableStream,
  filename: string
): Promise<string> {
  const blobName = `${userId}/${characterId}/${filename}`;

  const uploadParams: UploadBlobParams = {
    container: CONTAINERS.CHARACTERS,
    blobName,
    data,
    contentType: 'image/png',
    metadata: {
      userId,
      characterId,
      filename,
      uploadedAt: new Date().toISOString(),
    },
  };

  return uploadBlob(uploadParams);
}

// =============================================================================
// Processing Workflows
// =============================================================================

/**
 * Complete video processing workflow
 *
 * This function handles the complete workflow of storing processed video content:
 * 1. Upload processed video
 * 2. Upload keyframes
 * 3. Upload thumbnail
 * 4. Optionally clean up original upload
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {Buffer} processedVideo - Processed video data
 * @param {Buffer[]} keyframes - Array of keyframe images
 * @param {Buffer} thumbnail - Thumbnail image
 * @param {boolean} cleanupOriginal - Whether to delete the original upload
 * @returns {Promise<VideoProcessingResult>} Processing result with URLs
 *
 * @example
 * ```typescript
 * const result = await processVideoWorkflow('user123', 'video_abc', processedBuffer, keyframeBuffers, thumbnailBuffer, true);
 * console.log('Processed video:', result.processedUrl);
 * console.log('Keyframes extracted:', result.keyframeCount);
 * ```
 */
export async function processVideoWorkflow(
  userId: string,
  videoId: string,
  processedVideo: Buffer,
  keyframes: Buffer[],
  thumbnail: Buffer,
  cleanupOriginal: boolean = true
): Promise<VideoProcessingResult> {
  try {
    // Upload processed video
    const processedUrl = await uploadProcessedVideo(userId, videoId, processedVideo, {
      fileSize: processedVideo.length,
    });

    // Upload keyframes
    let keyframesSize = 0;
    for (let i = 0; i < keyframes.length; i++) {
      const keyframeUrl = await uploadKeyframe(userId, videoId, i, keyframes[i], {
        userId,
        videoId,
        frameIndex: i,
        timestamp: 0, // Caller should provide actual timestamps
      });
      keyframesSize += keyframes[i].length;
    }

    // Upload thumbnail
    const thumbnailUrl = await uploadThumbnail(userId, videoId, thumbnail);

    // Clean up original upload if requested
    if (cleanupOriginal) {
      const originalBlobName = `${userId}/${videoId}/original.mp4`;
      const originalExists = await blobExists({
        container: CONTAINERS.UPLOADS,
        blobName: originalBlobName,
      });

      if (originalExists) {
        await deleteBlob({
          container: CONTAINERS.UPLOADS,
          blobName: originalBlobName,
        });
      }
    }

    return {
      processedUrl,
      thumbnailUrl,
      keyframeCount: keyframes.length,
      keyframesSize,
    };
  } catch (error) {
    console.error(`Video processing workflow failed for video "${videoId}":`, error);
    throw new Error(
      `Failed to process video "${videoId}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// =============================================================================
// Query Workflows
// =============================================================================

/**
 * Get all videos for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array<{ videoId: string; url: string; metadata: import('./storage').BlobMetadata }>>}
 */
export async function getUserVideos(
  userId: string
): Promise<Array<{ videoId: string; url: string; metadata: import('./storage').BlobMetadata }>> {
  const videoNames = await listBlobs({
    container: CONTAINERS.VIDEOS,
    prefix: `${userId}/`,
  });

  const videos = await Promise.all(
    videoNames.map(async (blobName) => {
      // Extract video ID from path: userId/videoId/processed.mp4
      const parts = blobName.split('/');
      const videoId = parts[1];

      const metadata = await getBlobMetadata({
        container: CONTAINERS.VIDEOS,
        blobName,
      });

      const url = getBlobUrl(CONTAINERS.VIDEOS, blobName);

      return { videoId, url, metadata };
    })
  );

  return videos;
}

/**
 * Get all keyframes for a video
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<Array<{ frameIndex: number; url: string; metadata: import('./storage').BlobMetadata }>>}
 */
export async function getVideoKeyframes(
  userId: string,
  videoId: string
): Promise<Array<{ frameIndex: number; url: string; metadata: import('./storage').BlobMetadata }>> {
  const keyframeNames = await listBlobs({
    container: CONTAINERS.KEYFRAMES,
    prefix: `${userId}/${videoId}/keyframes/`,
  });

  const keyframes = await Promise.all(
    keyframeNames.map(async (blobName) => {
      const metadata = await getBlobMetadata({
        container: CONTAINERS.KEYFRAMES,
        blobName,
      });

      const frameIndex = parseInt(metadata.metadata.frameIndex || '0', 10);
      const url = getBlobUrl(CONTAINERS.KEYFRAMES, blobName);

      return { frameIndex, url, metadata };
    })
  );

  // Sort by frame index
  return keyframes.sort((a, b) => a.frameIndex - b.frameIndex);
}

/**
 * Get storage summary for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<VideoStorageSummary>}
 */
export async function getUserStorageSummary(userId: string): Promise<VideoStorageSummary> {
  // Get all videos
  const videos = await listBlobs({
    container: CONTAINERS.VIDEOS,
    prefix: `${userId}/`,
  });

  // Get all keyframes
  const keyframes = await listBlobs({
    container: CONTAINERS.KEYFRAMES,
    prefix: `${userId}/`,
  });

  // Get all thumbnails
  const thumbnails = await listBlobs({
    container: CONTAINERS.THUMBNAILS,
    prefix: `${userId}/`,
  });

  // Calculate total size
  let totalSize = 0;

  for (const blobName of videos) {
    const metadata = await getBlobMetadata({
      container: CONTAINERS.VIDEOS,
      blobName,
    });
    totalSize += metadata.size;
  }

  for (const blobName of keyframes) {
    const metadata = await getBlobMetadata({
      container: CONTAINERS.KEYFRAMES,
      blobName,
    });
    totalSize += metadata.size;
  }

  for (const blobName of thumbnails) {
    const metadata = await getBlobMetadata({
      container: CONTAINERS.THUMBNAILS,
      blobName,
    });
    totalSize += metadata.size;
  }

  return {
    videoCount: videos.length,
    totalSize,
    keyframeCount: keyframes.length,
    thumbnailCount: thumbnails.length,
  };
}

/**
 * Check if a video exists
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<boolean>}
 */
export async function videoExists(userId: string, videoId: string): Promise<boolean> {
  return blobExists({
    container: CONTAINERS.VIDEOS,
    blobName: `${userId}/${videoId}/processed.mp4`,
  });
}

// =============================================================================
// Delete Workflows
// =============================================================================

/**
 * Delete all data for a video
 *
 * Deletes the processed video, all keyframes, thumbnail, and optionally the original upload.
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {boolean} deleteOriginal - Whether to delete the original upload
 * @returns {Promise<{ deleted: number; failed: number }>} Deletion statistics
 *
 * @example
 * ```typescript
 * const result = await deleteVideo('user123', 'video_abc', true);
 * console.log(`Deleted ${result.deleted} files`);
 * ```
 */
export async function deleteVideo(
  userId: string,
  videoId: string,
  deleteOriginal: boolean = true
): Promise<{ deleted: number; failed: number }> {
  const blobsToDelete: DeleteBlobParams[] = [];

  // Add processed video
  blobsToDelete.push({
    container: CONTAINERS.VIDEOS,
    blobName: `${userId}/${videoId}/processed.mp4`,
  });

  // Add thumbnail
  blobsToDelete.push({
    container: CONTAINERS.THUMBNAILS,
    blobName: `${userId}/${videoId}/thumbnail.jpg`,
  });

  // Add original upload if requested
  if (deleteOriginal) {
    blobsToDelete.push({
      container: CONTAINERS.UPLOADS,
      blobName: `${userId}/${videoId}/original.mp4`,
    });
  }

  // Add all keyframes
  const keyframeNames = await listBlobs({
    container: CONTAINERS.KEYFRAMES,
    prefix: `${userId}/${videoId}/keyframes/`,
  });

  for (const blobName of keyframeNames) {
    blobsToDelete.push({
      container: CONTAINERS.KEYFRAMES,
      blobName,
    });
  }

  return deleteBlobs(blobsToDelete);
}

/**
 * Delete all data for a user
 *
 * WARNING: This is a destructive operation that cannot be undone.
 *
 * @param {string} userId - User ID
 * @returns {Promise<{ deleted: number; failed: number }>} Deletion statistics
 */
export async function deleteUserData(userId: string): Promise<{ deleted: number; failed: number }> {
  const blobsToDelete: DeleteBlobParams[] = [];

  // Collect all files from all containers
  const containers: Array<CONTAINERS.UPLOADS | CONTAINERS.VIDEOS | CONTAINERS.KEYFRAMES | CONTAINERS.THUMBNAILS | CONTAINERS.CHARACTERS> = [
    CONTAINERS.UPLOADS,
    CONTAINERS.VIDEOS,
    CONTAINERS.KEYFRAMES,
    CONTAINERS.THUMBNAILS,
    CONTAINERS.CHARACTERS,
  ];

  for (const container of containers) {
    const blobNames = await listBlobs({
      container,
      prefix: `${userId}/`,
    });

    for (const blobName of blobNames) {
      blobsToDelete.push({
        container,
        blobName,
      });
    }
  }

  return deleteBlobs(blobsToDelete);
}

// =============================================================================
// SAS URL Workflows
// =============================================================================

/**
 * Generate upload URL for a new video
 *
 * Creates a SAS URL that allows the client to upload directly to Azure.
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {number} expiresInMinutes - URL expiration time (default: 30)
 * @returns {Promise<{ uploadUrl: string; blobName: string }>}
 *
 * @example
 * ```typescript
 * const { uploadUrl, blobName } = await generateVideoUploadUrl('user123', 'video_abc');
 * // Send uploadUrl to client for direct upload
 * ```
 */
export async function generateVideoUploadUrl(
  userId: string,
  videoId: string,
  expiresInMinutes: number = 30
): Promise<{ uploadUrl: string; blobName: string }> {
  const blobName = `${userId}/${videoId}/original.mp4`;

  const uploadUrl = await generateSasUrl({
    container: CONTAINERS.UPLOADS,
    blobName,
    expiresInMinutes,
    permissions: 'cw',
  });

  return { uploadUrl, blobName };
}

/**
 * Generate download URL for a processed video
 *
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {number} expiresInMinutes - URL expiration time (default: 60)
 * @returns {Promise<string>} Download URL
 */
export async function generateVideoDownloadUrl(
  userId: string,
  videoId: string,
  expiresInMinutes: number = 60
): Promise<string> {
  return generateSasUrl({
    container: CONTAINERS.VIDEOS,
    blobName: `${userId}/${videoId}/processed.mp4`,
    expiresInMinutes,
    permissions: 'r',
  });
}
