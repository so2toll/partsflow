/**
 * Azure Blob Storage Usage Examples
 *
 * This file demonstrates common usage patterns for the Azure Blob Storage client.
 * These are examples only - do not import this file in production code.
 *
 * @module lib/storage.example
 */

import {
  uploadBlob,
  downloadBlob,
  deleteBlob,
  deleteBlobs,
  generateSasUrl,
  blobExists,
  getBlobMetadata,
  listBlobs,
  getBlobUrl,
  parseBlobUrl,
  uploadFromUrl,
  initializeAzureStorage,
  checkAzureStorageHealth,
  CONTAINERS,
  type UploadBlobParams,
  type DownloadBlobParams,
  type DeleteBlobParams,
} from './storage';

// =============================================================================
// Initialization Examples
// =============================================================================

/**
 * Initialize Azure Storage at application startup
 */
export async function example01_initialization() {
  try {
    await initializeAzureStorage();
    console.log('Azure Storage is ready');
  } catch (error) {
    console.error('Failed to initialize Azure Storage:', error);
    process.exit(1);
  }
}

/**
 * Health check endpoint
 */
export async function example02_healthCheck() {
  const isHealthy = await checkAzureStorageHealth();

  if (!isHealthy) {
    return { status: 'unhealthy', message: 'Azure Storage unavailable' };
  }

  return { status: 'healthy', message: 'Azure Storage available' };
}

// =============================================================================
// Upload Examples
// =============================================================================

/**
 * Upload a video file from disk
 */
export async function example03_uploadVideo() {
  import fs from 'fs/promises';

  const videoBuffer = await fs.readFile('video.mp4');

  const uploadParams: UploadBlobParams = {
    container: CONTAINERS.UPLOADS,
    blobName: 'user123/video.mp4',
    data: videoBuffer,
    contentType: 'video/mp4',
    metadata: {
      userId: 'user123',
      originalFilename: 'video.mp4',
      uploadedAt: new Date().toISOString(),
    },
  };

  const url = await uploadBlob(uploadParams);
  console.log('Video uploaded to:', url);
  return url;
}

/**
 * Upload a file from a URL (server-side copy)
 */
export async function example04_uploadFromUrl() {
  const sourceUrl = 'https://example.com/video.mp4';

  const url = await uploadFromUrl(sourceUrl, {
    container: CONTAINERS.VIDEOS,
    blobName: 'user123/copied-video.mp4',
    contentType: 'video/mp4',
  });

  console.log('Video copied from URL to:', url);
  return url;
}

/**
 * Upload with custom tags for indexing
 */
export async function example05_uploadWithTags() {
  import fs from 'fs/promises';

  const thumbnailBuffer = await fs.readFile('thumbnail.jpg');

  const url = await uploadBlob({
    container: CONTAINERS.THUMBNAILS,
    blobName: 'user123/video123/thumb.jpg',
    data: thumbnailBuffer,
    contentType: 'image/jpeg',
    metadata: {
      userId: 'user123',
      videoId: 'video123',
    },
    tags: {
      Project: 'video-ai',
      Environment: 'production',
      ContentType: 'thumbnail',
    },
  });

  console.log('Thumbnail uploaded with tags:', url);
  return url;
}

// =============================================================================
// Download Examples
// =============================================================================

/**
 * Download a video file
 */
export async function example06_downloadVideo() {
  const downloadParams: DownloadBlobParams = {
    container: CONTAINERS.VIDEOS,
    blobName: 'user123/video.mp4',
  };

  const buffer = await downloadBlob(downloadParams);

  // Save to local file
  import fs from 'fs/promises';
  await fs.writeFile('downloaded-video.mp4', buffer);

  console.log(`Downloaded ${buffer.length} bytes`);
  return buffer;
}

// =============================================================================
// SAS URL Examples (Client-Side Upload/Download)
// =============================================================================

/**
 * Generate SAS URL for client-side upload
 *
 * Use this pattern to allow browsers to upload directly to Azure
 * without going through your server
 */
export async function example07_generateUploadSasUrl() {
  const uploadUrl = await generateSasUrl({
    container: CONTAINERS.UPLOADS,
    blobName: 'user123/new-video.mp4',
    expiresInMinutes: 30,
    permissions: 'cw', // create + write
  });

  console.log('Upload SAS URL (expires in 30 min):', uploadUrl);

  // Client-side usage:
  // const response = await fetch(uploadUrl, {
  //   method: 'PUT',
  //   body: fileData,
  //   headers: { 'x-ms-blob-type': 'BlockBlob' }
  // });

  return uploadUrl;
}

/**
 * Generate SAS URL for client-side download
 *
 * Use this pattern to provide temporary access to private files
 */
export async function example08_generateDownloadSasUrl() {
  const downloadUrl = await generateSasUrl({
    container: CONTAINERS.VIDEOS,
    blobName: 'user123/video.mp4',
    expiresInMinutes: 60,
    permissions: 'r', // read only
  });

  console.log('Download SAS URL (expires in 60 min):', downloadUrl);

  // Client-side usage:
  // window.location.href = downloadUrl;
  // or
  // const response = await fetch(downloadUrl);

  return downloadUrl;
}

// =============================================================================
// Query Examples
// =============================================================================

/**
 * Check if a blob exists
 */
export async function example09_checkExists() {
  const exists = await blobExists({
    container: CONTAINERS.VIDEOS,
    blobName: 'user123/video.mp4',
  });

  if (exists) {
    console.log('Video exists');
  } else {
    console.log('Video not found');
  }

  return exists;
}

/**
 * Get blob metadata
 */
export async function example10_getMetadata() {
  const metadata = await getBlobMetadata({
    container: CONTAINERS.VIDEOS,
    blobName: 'user123/video.mp4',
  });

  console.log('Size:', metadata.size, 'bytes');
  console.log('Type:', metadata.contentType);
  console.log('Last Modified:', metadata.lastModified);
  console.log('User ID:', metadata.metadata.userId);

  return metadata;
}

/**
 * List all videos for a user
 */
export async function example11_listUserVideos() {
  const videoNames = await listBlobs({
    container: CONTAINERS.VIDEOS,
    prefix: 'user123/',
    maxResults: 100,
  });

  console.log(`Found ${videoNames.length} videos:`);
  for (const name of videoNames) {
    console.log('  -', name);
  }

  return videoNames;
}

/**
 * List all thumbnails (no prefix filter)
 */
export async function example12_listAllThumbnails() {
  const thumbnails = await listBlobs({
    container: CONTAINERS.THUMBNAILS,
    maxResults: 50,
  });

  console.log(`Found ${thumbnails.length} thumbnails`);
  return thumbnails;
}

// =============================================================================
// Delete Examples
// =============================================================================

/**
 * Delete a single blob
 */
export async function example13_deleteSingle() {
  await deleteBlob({
    container: CONTAINERS.UPLOADS,
    blobName: 'user123/old-video.mp4',
  });

  console.log('Blob deleted');
}

/**
 * Delete multiple blobs (bulk operation)
 */
export async function example14_deleteMultiple() {
  const blobsToDelete: DeleteBlobParams[] = [
    { container: CONTAINERS.UPLOADS, blobName: 'user123/video1.mp4' },
    { container: CONTAINERS.UPLOADS, blobName: 'user123/video2.mp4' },
    { container: CONTAINERS.THUMBNAILS, blobName: 'user123/thumb1.jpg' },
    { container: CONTAINERS.THUMBNAILS, blobName: 'user123/thumb2.jpg' },
  ];

  const result = await deleteBlobs(blobsToDelete);

  console.log(`Deleted: ${result.deleted}, Failed: ${result.failed}`);
  return result;
}

/**
 * Delete all files for a user
 */
export async function example15_deleteAllUserFiles() {
  // First, list all user's files
  const uploads = await listBlobs({
    container: CONTAINERS.UPLOADS,
    prefix: 'user123/',
  });

  const videos = await listBlobs({
    container: CONTAINERS.VIDEOS,
    prefix: 'user123/',
  });

  const thumbnails = await listBlobs({
    container: CONTAINERS.THUMBNAILS,
    prefix: 'user123/',
  });

  // Combine all blobs into delete params
  const allBlobs: DeleteBlobParams[] = [
    ...uploads.map((blobName) => ({ container: CONTAINERS.UPLOADS, blobName })),
    ...videos.map((blobName) => ({ container: CONTAINERS.VIDEOS, blobName })),
    ...thumbnails.map((blobName) => ({ container: CONTAINERS.THUMBNAILS, blobName })),
  ];

  // Delete in bulk
  const result = await deleteBlobs(allBlobs);

  console.log(`Deleted ${result.deleted} files for user123`);
  return result;
}

// =============================================================================
// Utility Examples
// =============================================================================

/**
 * Get public URL for a blob
 */
export async function example16_getPublicUrl() {
  const url = getBlobUrl(CONTAINERS.VIDEOS, 'user123/video.mp4');
  console.log('Public URL:', url);
  return url;
}

/**
 * Parse blob URL to extract container and blob name
 */
export async function example17_parseUrl() {
  const url = 'https://myaccount.blob.core.windows.net/uploads/user123/video.mp4';

  const parsed = parseBlobUrl(url);

  if (parsed) {
    console.log('Container:', parsed.container);
    console.log('Blob Name:', parsed.blobName);

    // Can use with other functions
    await deleteBlob(parsed);
  }
}

// =============================================================================
// API Endpoint Examples
// =============================================================================

/**
 * Example API endpoint: Upload video
 * POST /api/videos/upload
 */
export async function example18_apiUploadEndpoint(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return new Response('Missing file or userId', { status: 400 });
    }

    // Generate unique blob name
    const blobName = `${userId}/${Date.now()}-${file.name}`;

    // Upload to Azure
    const url = await uploadBlob({
      container: CONTAINERS.UPLOADS,
      blobName,
      data: file,
      contentType: file.type,
      metadata: {
        userId,
        originalFilename: file.name,
        fileSize: file.size.toString(),
      },
    });

    return Response.json({ url, blobName });
  } catch (error) {
    console.error('Upload failed:', error);
    return new Response('Upload failed', { status: 500 });
  }
}

/**
 * Example API endpoint: Generate upload SAS URL
 * POST /api/videos/upload-sas
 */
export async function example19_apiSasUrlEndpoint(request: Request) {
  try {
    const { userId, fileName } = await request.json();

    if (!userId || !fileName) {
      return new Response('Missing userId or fileName', { status: 400 });
    }

    // Generate SAS URL for client-side upload
    const blobName = `${userId}/${Date.now()}-${fileName}`;
    const sasUrl = await generateSasUrl({
      container: CONTAINERS.UPLOADS,
      blobName,
      expiresInMinutes: 30,
      permissions: 'cw',
    });

    return Response.json({
      uploadUrl: sasUrl,
      blobName,
      expiresInMinutes: 30,
    });
  } catch (error) {
    console.error('Failed to generate SAS URL:', error);
    return new Response('Failed to generate upload URL', { status: 500 });
  }
}

/**
 * Example API endpoint: List user videos
 * GET /api/videos?userId=user123
 */
export async function example20_apiListVideosEndpoint(url: URL) {
  try {
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // List videos for user
    const videoNames = await listBlobs({
      container: CONTAINERS.VIDEOS,
      prefix: `${userId}/`,
    });

    // Get metadata for each video
    const videos = await Promise.all(
      videoNames.map(async (blobName) => {
        const metadata = await getBlobMetadata({
          container: CONTAINERS.VIDEOS,
          blobName,
        });

        return {
          name: blobName,
          url: getBlobUrl(CONTAINERS.VIDEOS, blobName),
          size: metadata.size,
          contentType: metadata.contentType,
          lastModified: metadata.lastModified,
        };
      })
    );

    return Response.json({ videos });
  } catch (error) {
    console.error('Failed to list videos:', error);
    return new Response('Failed to list videos', { status: 500 });
  }
}

// =============================================================================
// Complete Workflow Example
// =============================================================================

/**
 * Complete video processing workflow
 *
 * This example demonstrates a typical workflow:
 * 1. Upload video
 * 2. Extract keyframes
 * 3. Generate thumbnail
 * 4. Store processed video
 * 5. Clean up temporary files
 */
export async function example21_completeWorkflow() {
  const videoId = 'video123';
  const userId = 'user123';

  try {
    // Step 1: Original video uploaded to 'uploads' container
    console.log('Step 1: Video uploaded to uploads container');

    // Step 2: After processing, store in 'videos' container
    const processedUrl = await uploadBlob({
      container: CONTAINERS.VIDEOS,
      blobName: `${userId}/${videoId}/processed.mp4`,
      data: Buffer.from('processed video data'),
      contentType: 'video/mp4',
      metadata: {
        userId,
        videoId,
        processedAt: new Date().toISOString(),
      },
    });

    console.log('Step 2: Processed video stored:', processedUrl);

    // Step 3: Upload keyframes
    const keyframeNames: string[] = [];
    for (let i = 0; i < 10; i++) {
      const keyframeUrl = await uploadBlob({
        container: CONTAINERS.KEYFRAMES,
        blobName: `${userId}/${videoId}/keyframe-${i}.jpg`,
        data: Buffer.from(`keyframe ${i}`),
        contentType: 'image/jpeg',
        metadata: {
          userId,
          videoId,
          frameIndex: i.toString(),
        },
      });

      keyframeNames.push(keyframeUrl);
    }

    console.log('Step 3: Uploaded', keyframeNames.length, 'keyframes');

    // Step 4: Upload thumbnail
    const thumbnailUrl = await uploadBlob({
      container: CONTAINERS.THUMBNAILS,
      blobName: `${userId}/${videoId}/thumb.jpg`,
      data: Buffer.from('thumbnail data'),
      contentType: 'image/jpeg',
      metadata: {
        userId,
        videoId,
      },
    });

    console.log('Step 4: Thumbnail uploaded:', thumbnailUrl);

    // Step 5: Clean up original upload
    await deleteBlob({
      container: CONTAINERS.UPLOADS,
      blobName: `${userId}/${videoId}/original.mp4`,
    });

    console.log('Step 5: Cleaned up original upload');

    return {
      processedUrl,
      keyframeCount: keyframeNames.length,
      thumbnailUrl,
    };
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}
