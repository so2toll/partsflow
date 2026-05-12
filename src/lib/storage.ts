/**
 * Azure Blob Storage Client
 *
 * Provides file storage operations for video uploads, keyframes, clips,
 * and other binary assets in the Video AI Content Studio.
 *
 * Features:
 * - Upload files (Buffer, Blob, ArrayBuffer, ReadableStream)
 * - Download files as Buffer
 * - Delete files
 * - Generate SAS URLs for temporary access
 * - List files with prefix filtering
 * - Check file existence
 *
 * @module lib/storage
 * @version 1.0.0
 */

import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  BlobDownloadResponseModel,
} from '@azure/storage-blob';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Azure Blob Storage container names
 * Maps to containers in the Azure Storage Account
 */
export const CONTAINERS = {
  /** User-uploaded video files */
  UPLOADS: 'uploads',
  /** Extracted video keyframes */
  KEYFRAMES: 'keyframes',
  /** Generated video clips */
  CLIPS: 'clips',
  /** Processed/finished videos */
  VIDEOS: 'videos',
  /** Character assets for AI generation */
  CHARACTERS: 'characters',
  /** Video thumbnails */
  THUMBNAILS: 'thumbnails',
} as const;

/**
 * Container name type
 */
export type ContainerName = (typeof CONTAINERS)[keyof typeof CONTAINERS];

/**
 * Upload operation parameters
 */
export interface UploadBlobParams {
  /** Target container */
  container: ContainerName;
  /** Blob name (path within container) */
  blobName: string;
  /** File data to upload */
  data: Buffer | Blob | ArrayBuffer | ReadableStream;
  /** MIME content type */
  contentType?: string;
  /** Custom metadata key-value pairs */
  metadata?: Record<string, string>;
  /** Upload tags for indexing */
  tags?: Record<string, string>;
}

/**
 * Download operation parameters
 */
export interface DownloadBlobParams {
  /** Source container */
  container: ContainerName;
  /** Blob name (path within container) */
  blobName: string;
}

/**
 * Delete operation parameters
 */
export interface DeleteBlobParams {
  /** Target container */
  container: ContainerName;
  /** Blob name (path within container) */
  blobName: string;
}

/**
 * SAS URL generation parameters
 */
export interface GenerateSasUrlParams {
  /** Target container */
  container: ContainerName;
  /** Blob name (path within container) */
  blobName: string;
  /** URL expiration time in minutes (default: 60) */
  expiresInMinutes?: number;
  /** SAS permissions (default: 'r' for read) */
  permissions?: 'r' | 'w' | 'rw' | 'c' | 'cw';
}

/**
 * Blob metadata
 */
export interface BlobMetadata {
  /** Blob size in bytes */
  size: number;
  /** Content type (MIME type) */
  contentType: string;
  /** Last modified date */
  lastModified: Date;
  /** Custom metadata */
  metadata: Record<string, string>;
  /** ETag for versioning */
  etag: string;
}

/**
 * List blobs parameters
 */
export interface ListBlobsParams {
  /** Container to list */
  container: ContainerName;
  /** Filter by prefix (e.g., "videos/user123/") */
  prefix?: string;
  /** Maximum results (default: 100) */
  maxResults?: number;
}

// =============================================================================
// Client Initialization
// =============================================================================

/**
 * BlobServiceClient singleton instance
 * Lazily initialized on first access
 */
let blobServiceClient: BlobServiceClient | null = null;

/**
 * Azure Storage initialization and health status
 */
let azureInitialized = false;
let azureHealthStatus: 'unknown' | 'healthy' | 'unhealthy' = 'unknown';

/**
 * Get or create Azure Blob Service Client
 *
 * Supports two authentication methods:
 * 1. Connection string (preferred for production)
 * 2. Account name + key (for development)
 *
 * @returns {BlobServiceClient} Azure Blob Service Client instance
 * @throws {Error} If Azure credentials are not configured
 *
 * @example
 * ```typescript
 * const client = getBlobServiceClient();
 * const containerClient = client.getContainerClient('uploads');
 * ```
 */
export function getBlobServiceClient(): BlobServiceClient {
  if (blobServiceClient) {
    return blobServiceClient;
  }

  // Try connection string first (preferred for production)
  const connectionString = import.meta.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connectionString) {
    try {
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      return blobServiceClient;
    } catch (error) {
      console.error('Failed to create BlobServiceClient from connection string:', error);
      throw new Error(
        `Failed to initialize Azure Storage from connection string: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Fallback to account name + key (for development)
  const accountName = import.meta.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = import.meta.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountName || !accountKey) {
    throw new Error(
      'Azure Storage credentials not configured. Set AZURE_STORAGE_CONNECTION_STRING or both AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY environment variables.'
    );
  }

  try {
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    return blobServiceClient;
  } catch (error) {
    console.error('Failed to create BlobServiceClient from account credentials:', error);
    throw new Error(
      `Failed to initialize Azure Storage from account credentials: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get a container client for a specific container
 *
 * @param {ContainerName} containerName - Name of the container
 * @returns {ContainerClient} Container client instance
 *
 * @example
 * ```typescript
 * const containerClient = getContainerClient('uploads');
 * const blobClient = containerClient.getBlobClient('video123.mp4');
 * ```
 */
export function getContainerClient(containerName: ContainerName): ContainerClient {
  try {
    const client = getBlobServiceClient();
    return client.getContainerClient(containerName);
  } catch (error) {
    console.error(`Failed to get container client for "${containerName}":`, error);
    throw new Error(
      `Failed to access container "${containerName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Initialize and validate Azure Storage connection at startup
 *
 * Validates that Azure credentials are configured correctly and that
 * the storage service is accessible. Should be called during application
 * bootstrap to fail fast if storage is misconfigured.
 *
 * @returns {Promise<void>}
 * @throws {Error} If Azure initialization or validation fails
 *
 * @example
 * ```typescript
 * // In application startup (e.g., astro.config.mjs or startup script)
 * import { initializeAzureStorage } from '@/lib/storage';
 *
 * async function bootstrap() {
 *   await initializeAzureStorage();
 *   console.log('Azure Storage ready');
 * }
 * ```
 */
export async function initializeAzureStorage(): Promise<void> {
  if (azureInitialized) {
    return;
  }

  try {
    const client = getBlobServiceClient(); // This will throw if creds missing

    // Test connection with a getProperties call on the service
    // This validates that credentials are valid and Azure is accessible
    await client.getProperties();

    azureHealthStatus = 'healthy';
    azureInitialized = true;

    console.log('✅ Azure Blob Storage connection validated successfully');
  } catch (error) {
    azureHealthStatus = 'unhealthy';
    console.error('❌ Azure Blob Storage initialization failed:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to initialize Azure Blob Storage: ${errorMessage}\n` +
        `Check AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY environment variables.`
    );
  }
}

/**
 * Health check for Azure Blob Storage
 *
 * Returns the current health status of the storage connection.
 * If not yet initialized, attempts initialization first.
 *
 * @returns {Promise<boolean>} True if storage is healthy, false otherwise
 *
 * @example
 * ```typescript
 * // In health check endpoint
 * const isHealthy = await checkAzureStorageHealth();
 * if (!isHealthy) {
 *   return new Response('Azure Storage unavailable', { status: 503 });
 * }
 * ```
 */
export async function checkAzureStorageHealth(): Promise<boolean> {
  if (azureHealthStatus === 'unknown') {
    try {
      await initializeAzureStorage();
    } catch (error) {
      return false;
    }
  }
  return azureHealthStatus === 'healthy';
}

/**
 * Get current Azure Storage health status
 *
 * Returns the cached health status without performing a check.
 *
 * @returns {'unknown' | 'healthy' | 'unhealthy'} Current health status
 */
export function getAzureStorageHealthStatus(): 'unknown' | 'healthy' | 'unhealthy' {
  return azureHealthStatus;
}

// =============================================================================
// Upload Operations
// =============================================================================

/**
 * Upload a file to Azure Blob Storage
 *
 * Supports multiple data formats:
 * - Buffer (Node.js)
 * - Blob (Browser)
 * - ArrayBuffer (Browser/Node.js)
 * - ReadableStream (Browser/Node.js)
 *
 * @param {UploadBlobParams} params - Upload parameters
 * @returns {Promise<string>} Public URL of the uploaded blob
 * @throws {Error} If upload fails
 *
 * @example
 * ```typescript
 * // Upload from Buffer
 * const buffer = await fs.readFile('video.mp4');
 * const url = await uploadBlob({
 *   container: 'uploads',
 *   blobName: 'user123/video.mp4',
 *   data: buffer,
 *   contentType: 'video/mp4',
 *   metadata: { userId: 'user123', uploadedAt: Date.now().toString() }
 * });
 *
 * // Upload from Browser File
 * const file = fileInput.files[0];
 * const url = await uploadBlob({
 *   container: 'uploads',
 *   blobName: `user123/${file.name}`,
 *   data: file,
 *   contentType: file.type
 * });
 * ```
 */
export async function uploadBlob(params: UploadBlobParams): Promise<string> {
  const { container, blobName, data, contentType, metadata, tags } = params;

  try {
    const containerClient = getContainerClient(container);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Convert data to Buffer if needed
    let buffer: Buffer;

    try {
      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (data instanceof Blob) {
        const arrayBuffer = await data.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else if (data instanceof ArrayBuffer) {
        buffer = Buffer.from(data);
      } else if (data instanceof ReadableStream) {
        // Collect chunks from ReadableStream
        const reader = data.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }

        buffer = Buffer.concat(chunks);
      } else {
        throw new Error(`Unsupported data type: ${typeof data}`);
      }
    } catch (conversionError) {
      throw new Error(
        `Failed to convert data to Buffer: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`
      );
    }

    // Upload with options
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType || 'application/octet-stream',
      },
      metadata,
      tags,
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error(`Azure Blob upload failed for "${container}/${blobName}":`, error);
    throw new Error(
      `Failed to upload blob "${blobName}" to container "${container}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Upload a file from a URL (server-side copy)
 *
 * Copies a file from a source URL directly into Azure Storage
 * without downloading it to the server first.
 *
 * @param {string} sourceUrl - Source URL to copy from
 * @param {UploadBlobParams} params - Target upload parameters (without data)
 * @returns {Promise<string>} Public URL of the copied blob
 * @throws {Error} If copy operation fails
 *
 * @example
 * ```typescript
 * // Copy from external URL
 * const url = await uploadFromUrl(
 *   'https://example.com/video.mp4',
 *   {
 *     container: 'uploads',
 *     blobName: 'user123/video.mp4',
 *     contentType: 'video/mp4'
 *   }
 * );
 * ```
 */
export async function uploadFromUrl(
  sourceUrl: string,
  params: Omit<UploadBlobParams, 'data'>
): Promise<string> {
  const { container, blobName, contentType } = params;

  try {
    const containerClient = getContainerClient(container);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Perform server-side copy
    await blockBlobClient.syncCopyFromURL(sourceUrl);

    // Set content type if provided
    if (contentType) {
      await blockBlobClient.setHTTPHeaders({
        blobContentType: contentType,
      });
    }

    return blockBlobClient.url;
  } catch (error) {
    console.error(`Azure Blob URL upload failed for "${container}/${blobName}":`, error);
    throw new Error(
      `Failed to copy from URL to blob "${blobName}" in container "${container}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// =============================================================================
// Download Operations
// =============================================================================

/**
 * Download a blob as a Buffer
 *
 * Downloads the entire blob content into memory.
 * For large files, consider using SAS URLs with streaming instead.
 *
 * @param {DownloadBlobParams} params - Download parameters
 * @returns {Promise<Buffer>} Blob content as Buffer
 * @throws {Error} If download fails or blob doesn't exist
 *
 * @example
 * ```typescript
 * const buffer = await downloadBlob({
 *   container: 'uploads',
 *   blobName: 'user123/video.mp4'
 * });
 *
 * // Save to file
 * await fs.writeFile('local-video.mp4', buffer);
 * ```
 */
export async function downloadBlob(params: DownloadBlobParams): Promise<Buffer> {
  const { container, blobName } = params;

  try {
    const containerClient = getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    const downloadResponse: BlobDownloadResponseModel = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Download response did not contain a readable stream');
    }

    const chunks: Buffer[] = [];

    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`Azure Blob download failed for "${container}/${blobName}":`, error);
    throw new Error(
      `Failed to download blob "${blobName}" from container "${container}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// =============================================================================
// Delete Operations
// =============================================================================

/**
 * Delete a blob from Azure Storage
 *
 * @param {DeleteBlobParams} params - Delete parameters
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 *
 * @example
 * ```typescript
 * await deleteBlob({
 *   container: 'uploads',
 *   blobName: 'user123/video.mp4'
 * });
 * ```
 */
export async function deleteBlob(params: DeleteBlobParams): Promise<void> {
  const { container, blobName } = params;

  try {
    const containerClient = getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    await blobClient.deleteIfExists();
  } catch (error) {
    console.error(`Azure Blob delete failed for "${container}/${blobName}":`, error);
    throw new Error(
      `Failed to delete blob "${blobName}" from container "${container}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delete multiple blobs
 *
 * Bulk deletion operation for multiple blobs.
 * Useful for cleanup operations.
 *
 * @param {DeleteBlobParams[]} blobs - Array of blobs to delete
 * @returns {Promise<{ deleted: number; failed: number }>} Deletion statistics
 *
 * @example
 * ```typescript
 * const result = await deleteBlobs([
 *   { container: 'uploads', blobName: 'user123/video1.mp4' },
 *   { container: 'uploads', blobName: 'user123/video2.mp4' }
 * ]);
 * console.log(`Deleted ${result.deleted}, Failed ${result.failed}`);
 * ```
 */
export async function deleteBlobs(
  blobs: DeleteBlobParams[]
): Promise<{ deleted: number; failed: number }> {
  const results = { deleted: 0, failed: 0 };

  // Delete in parallel with concurrency limit
  const concurrency = 10;
  for (let i = 0; i < blobs.length; i += concurrency) {
    const batch = blobs.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async (blob) => {
        try {
          await deleteBlob(blob);
          results.deleted++;
        } catch (error) {
          console.error(`Failed to delete blob "${blob.blobName}":`, error);
          results.failed++;
        }
      })
    );
  }

  return results;
}

// =============================================================================
// SAS URL Generation
// =============================================================================

/**
 * Generate a SAS URL for temporary blob access
 *
 * Creates a time-limited URL with specific permissions.
 * Useful for direct browser uploads/downloads without exposing credentials.
 *
 * @param {GenerateSasUrlParams} params - SAS URL parameters
 * @returns {Promise<string>} SAS URL with embedded token
 * @throws {Error} If SAS URL generation fails
 *
 * @example
 * ```typescript
 * // Generate read-only URL (valid for 1 hour)
 * const readUrl = await generateSasUrl({
 *   container: 'videos',
 *   blobName: 'user123/video.mp4',
 *   expiresInMinutes: 60,
 *   permissions: 'r'
 * });
 *
 * // Generate upload URL (valid for 30 minutes)
 * const uploadUrl = await generateSasUrl({
 *   container: 'uploads',
 *   blobName: 'user123/new-video.mp4',
 *   expiresInMinutes: 30,
 *   permissions: 'cw'
 * });
 *
 * // Client-side upload using SAS URL
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   body: fileData,
 *   headers: { 'x-ms-blob-type': 'BlockBlob' }
 * });
 * ```
 */
export async function generateSasUrl(params: GenerateSasUrlParams): Promise<string> {
  const { container, blobName, expiresInMinutes = 60, permissions = 'r' } = params;

  try {
    const accountName = import.meta.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = import.meta.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!accountName || !accountKey) {
      throw new Error('Cannot generate SAS URL without account credentials');
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const containerClient = getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

    // Map permission strings to BlobSASPermissions
    const sasPermissions = BlobSASPermissions.parse(permissions);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName,
        permissions: sasPermissions,
        startsOn,
        expiresOn,
      },
      credential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error(`SAS URL generation failed for "${container}/${blobName}":`, error);
    throw new Error(
      `Failed to generate SAS URL for blob "${blobName}" in container "${container}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// =============================================================================
// Query Operations
// =============================================================================

/**
 * Check if a blob exists
 *
 * @param {DownloadBlobParams} params - Query parameters
 * @returns {Promise<boolean>} True if blob exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await blobExists({
 *   container: 'uploads',
 *   blobName: 'user123/video.mp4'
 * });
 *
 * if (!exists) {
 *   console.log('Video not found');
 * }
 * ```
 */
export async function blobExists(params: DownloadBlobParams): Promise<boolean> {
  const { container, blobName } = params;

  try {
    const containerClient = getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    return await blobClient.exists();
  } catch (error) {
    console.error(`Azure Blob existence check failed for "${container}/${blobName}":`, error);
    return false;
  }
}

/**
 * Get blob metadata without downloading content
 *
 * Retrieves metadata such as size, content type, last modified date,
 * and custom metadata key-value pairs.
 *
 * @param {DownloadBlobParams} params - Query parameters
 * @returns {Promise<BlobMetadata>} Blob metadata
 * @throws {Error} If blob doesn't exist or query fails
 *
 * @example
 * ```typescript
 * const metadata = await getBlobMetadata({
 *   container: 'uploads',
 *   blobName: 'user123/video.mp4'
 * });
 *
 * console.log(`Size: ${metadata.size} bytes`);
 * console.log(`Type: ${metadata.contentType}`);
 * console.log(`Uploaded: ${metadata.lastModified}`);
 * console.log(`User ID: ${metadata.metadata.userId}`);
 * ```
 */
export async function getBlobMetadata(params: DownloadBlobParams): Promise<BlobMetadata> {
  const { container, blobName } = params;

  try {
    const containerClient = getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    const properties = await blobClient.getProperties();

    return {
      size: properties.contentLength || 0,
      contentType: properties.contentType || 'application/octet-stream',
      lastModified: properties.lastModified || new Date(),
      metadata: properties.metadata || {},
      etag: properties.etag || '',
    };
  } catch (error) {
    console.error(`Azure Blob metadata fetch failed for "${container}/${blobName}":`, error);
    throw new Error(
      `Failed to get metadata for blob "${blobName}" in container "${container}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * List blobs in a container with optional prefix filtering
 *
 * Returns blob names (not full URLs) matching the given prefix.
 * Useful for finding all files in a directory structure.
 *
 * @param {ListBlobsParams} params - List parameters
 * @returns {Promise<string[]>} Array of blob names
 * @throws {Error} If list operation fails
 *
 * @example
 * ```typescript
 * // List all videos for a user
 * const videos = await listBlobs({
 *   container: 'videos',
 *   prefix: 'user123/',
 *   maxResults: 100
 * });
 *
 * console.log(`Found ${videos.length} videos`);
 * // Returns: ['user123/video1.mp4', 'user123/video2.mp4', ...]
 * ```
 */
export async function listBlobs(params: ListBlobsParams): Promise<string[]> {
  const { container, prefix, maxResults = 100 } = params;

  try {
    const containerClient = getContainerClient(container);

    const blobs: string[] = [];
    const iterator = containerClient.listBlobsFlat({ prefix });

    for await (const blob of iterator) {
      blobs.push(blob.name);
      if (blobs.length >= maxResults) break;
    }

    return blobs;
  } catch (error) {
    console.error(`Azure Blob list failed for container "${container}":`, error);
    throw new Error(
      `Failed to list blobs in container "${container}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the public URL for a blob
 *
 * Returns the full URL without any SAS token.
 * Requires the container to have public access configured.
 *
 * @param {ContainerName} container - Container name
 * @param {string} blobName - Blob name
 * @returns {string} Full blob URL
 *
 * @example
 * ```typescript
 * const url = getBlobUrl('videos', 'user123/video.mp4');
 * // Returns: "https://accountname.blob.core.windows.net/videos/user123/video.mp4"
 * ```
 */
export function getBlobUrl(container: ContainerName, blobName: string): string {
  try {
    const containerClient = getContainerClient(container);
    return containerClient.getBlobClient(blobName).url;
  } catch (error) {
    console.error(`Failed to get blob URL for "${container}/${blobName}":`, error);
    throw new Error(
      `Failed to get blob URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Parse blob name from full Azure Storage URL
 *
 * Extracts the container and blob name from a URL.
 *
 * @param {string} url - Full Azure Blob Storage URL
 * @returns {{ container: string; blobName: string } | null} Parsed components or null if invalid
 *
 * @example
 * ```typescript
 * const parsed = parseBlobUrl('https://account.blob.core.windows.net/uploads/user123/video.mp4');
 * // Returns: { container: 'uploads', blobName: 'user123/video.mp4' }
 *
 * if (parsed) {
 *   const { container, blobName } = parsed;
 *   await deleteBlob({ container, blobName });
 * }
 * ```
 */
export function parseBlobUrl(
  url: string
): { container: string; blobName: string } | null {
  try {
    const urlObj = new URL(url);

    // Extract hostname (account.blob.core.windows.net)
    const hostname = urlObj.hostname;

    if (!hostname.endsWith('.blob.core.windows.net')) {
      return null;
    }

    // Extract path parts: /container/blobname
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      return null;
    }

    const container = pathParts[0];
    const blobName = pathParts.slice(1).join('/');

    return { container, blobName };
  } catch (error) {
    console.error('Failed to parse blob URL:', error);
    return null;
  }
}
