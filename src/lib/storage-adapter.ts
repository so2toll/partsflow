/**
 * Storage Adapter - Hybrid Local/Azure Implementation
 *
 * This adapter provides a unified interface that can switch between:
 * - Local filesystem (development)
 * - Azure Blob Storage (production)
 *
 * Set STORAGE_MODE=local or STORAGE_MODE=azure in .env
 * All code uses the same interface - just flip the env var to migrate!
 */

import { uploadBlob as uploadBlobAzure, downloadBlob as downloadBlobAzure, deleteBlob as deleteBlobAzure, CONTAINERS } from './storage';
import fs from 'fs/promises';
import path from 'path';
import { ulid } from 'ulid';

// Storage mode from environment
const STORAGE_MODE = import.meta.env.STORAGE_MODE || 'local';
const LOCAL_STORAGE_PATH = import.meta.env.LOCAL_STORAGE_PATH || './storage';

console.log(`[Storage Adapter] Mode: ${STORAGE_MODE}`);

// ============================================================================
// Local Filesystem Implementation
// ============================================================================

async function uploadBlobLocal(params: {
  container: string;
  blobName: string;
  data: Buffer | Blob | ArrayBuffer;
  contentType?: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const { container, blobName, data, contentType } = params;

  // Create container directory if it doesn't exist
  const containerPath = path.join(LOCAL_STORAGE_PATH, container);
  await fs.mkdir(containerPath, { recursive: true });

  // Write file
  const filePath = path.join(containerPath, blobName);
  const fileDir = path.dirname(filePath);
  await fs.mkdir(fileDir, { recursive: true });

  let buffer: Buffer;
  if (data instanceof Buffer) {
    buffer = data;
  } else if (data instanceof Blob) {
    const arrayBuffer = await data.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (data instanceof ArrayBuffer) {
    buffer = Buffer.from(data);
  } else {
    throw new Error('Invalid data type');
  }

  await fs.writeFile(filePath, buffer);

  // Return local file URL (for dev environment)
  const localUrl = `/storage/${container}/${blobName}`;
  console.log(`[Storage Adapter] Uploaded to local: ${localUrl}`);

  return localUrl;
}

async function downloadBlobLocal(params: {
  container: string;
  blobName: string;
}): Promise<Buffer> {
  const { container, blobName } = params;
  const filePath = path.join(LOCAL_STORAGE_PATH, container, blobName);

  const buffer = await fs.readFile(filePath);
  console.log(`[Storage Adapter] Downloaded from local: ${filePath}`);

  return buffer;
}

async function deleteBlobLocal(params: {
  container: string;
  blobName: string;
}): Promise<void> {
  const { container, blobName } = params;
  const filePath = path.join(LOCAL_STORAGE_PATH, container, blobName);

  await fs.unlink(filePath);
  console.log(`[Storage Adapter] Deleted from local: ${filePath}`);
}

// ============================================================================
// Unified Interface - Auto-switches based on STORAGE_MODE
// ============================================================================

/**
 * Upload a file to storage (local or Azure)
 * Usage is identical regardless of backend!
 */
export async function uploadBlob(params: {
  container: string;
  blobName: string;
  data: Buffer | Blob | ArrayBuffer;
  contentType?: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  if (STORAGE_MODE === 'azure') {
    return await uploadBlobAzure(params);
  } else {
    return await uploadBlobLocal(params);
  }
}

/**
 * Download a file from storage (local or Azure)
 */
export async function downloadBlob(params: {
  container: string;
  blobName: string;
}): Promise<Buffer> {
  if (STORAGE_MODE === 'azure') {
    return await downloadBlobAzure(params);
  } else {
    return await downloadBlobLocal(params);
  }
}

/**
 * Delete a file from storage (local or Azure)
 */
export async function deleteBlob(params: {
  container: string;
  blobName: string;
}): Promise<void> {
  if (STORAGE_MODE === 'azure') {
    return await deleteBlobAzure(params);
  } else {
    return await deleteBlobLocal(params);
  }
}

// Re-export containers for convenience
export { CONTAINERS };

/**
 * Get the current storage mode
 */
export function getStorageMode(): 'local' | 'azure' {
  return STORAGE_MODE as 'local' | 'azure';
}

/**
 * Check if storage is configured and ready
 */
export function isStorageReady(): boolean {
  if (STORAGE_MODE === 'azure') {
    // Check if Azure env vars are set
    return !!(
      import.meta.env.AZURE_STORAGE_CONNECTION_STRING ||
      (import.meta.env.AZURE_STORAGE_ACCOUNT_NAME && import.meta.env.AZURE_STORAGE_ACCOUNT_KEY)
    );
  } else {
    // Local storage is always ready
    return true;
  }
}
