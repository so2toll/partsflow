# Azure Blob Storage Client

Comprehensive Azure Blob Storage client for Video AI Content Studio with TypeScript types, error handling, and production-ready patterns.

## Features

- **Multiple Upload Formats**: Buffer, Blob, ArrayBuffer, ReadableStream
- **SAS URL Generation**: Time-limited access URLs for client-side operations
- **Bulk Operations**: Delete multiple files with concurrency control
- **Health Checks**: Connection validation and health monitoring
- **Type Safety**: Full TypeScript type definitions
- **Error Handling**: Comprehensive try-catch with detailed error messages
- **Query Operations**: List files, check existence, get metadata

## Installation

The `@azure/storage-blob` package is already installed:

```bash
pnpm add @azure/storage-blob
```

## Configuration

Set the following environment variables in `.env.local`:

```bash
# Option 1: Connection string (preferred for production)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net

# Option 2: Account name and key (for development)
AZURE_STORAGE_ACCOUNT_NAME=youraccountname
AZURE_STORAGE_ACCOUNT_KEY=youraccountkey
```

## Container Structure

The client uses the following containers:

- `uploads` - User-uploaded video files
- `keyframes` - Extracted video keyframes
- `clips` - Generated video clips
- `videos` - Processed/finished videos
- `characters` - Character assets for AI generation
- `thumbnails` - Video thumbnails

## Quick Start

### Initialize at Startup

```typescript
import { initializeAzureStorage } from '@/lib/storage';

// In your application bootstrap
await initializeAzureStorage();
```

### Upload a File

```typescript
import { uploadBlob, CONTAINERS } from '@/lib/storage';

const url = await uploadBlob({
  container: CONTAINERS.UPLOADS,
  blobName: 'user123/video.mp4',
  data: fileBuffer,
  contentType: 'video/mp4',
  metadata: {
    userId: 'user123',
    uploadedAt: new Date().toISOString()
  }
});
```

### Download a File

```typescript
import { downloadBlob } from '@/lib/storage';

const buffer = await downloadBlob({
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4'
});
```

### Delete a File

```typescript
import { deleteBlob } from '@/lib/storage';

await deleteBlob({
  container: CONTAINERS.UPLOADS,
  blobName: 'user123/video.mp4'
});
```

### Generate SAS URL

```typescript
import { generateSasUrl } from '@/lib/storage';

// Read-only URL (valid for 1 hour)
const readUrl = await generateSasUrl({
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4',
  expiresInMinutes: 60,
  permissions: 'r'
});

// Upload URL (valid for 30 minutes)
const uploadUrl = await generateSasUrl({
  container: CONTAINERS.UPLOADS,
  blobName: 'user123/new-video.mp4',
  expiresInMinutes: 30,
  permissions: 'cw'  // create + write
});
```

## API Reference

### Upload Operations

#### `uploadBlob(params)`

Upload a file to Azure Blob Storage.

**Parameters:**
- `container`: Container name (use `CONTAINERS` enum)
- `blobName`: Blob path (e.g., `'user123/video.mp4'`)
- `data`: File data (Buffer, Blob, ArrayBuffer, or ReadableStream)
- `contentType?`: MIME type (e.g., `'video/mp4'`)
- `metadata?`: Custom metadata key-value pairs
- `tags?`: Indexing tags

**Returns:** `Promise<string>` - Public URL of uploaded blob

**Example:**
```typescript
const url = await uploadBlob({
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4',
  data: buffer,
  contentType: 'video/mp4',
  metadata: { userId: 'user123' },
  tags: { Project: 'video-ai' }
});
```

#### `uploadFromUrl(sourceUrl, params)`

Copy a file from a URL directly to Azure (server-side copy).

**Parameters:**
- `sourceUrl`: Source URL to copy from
- `params`: Upload parameters (same as `uploadBlob` but without `data`)

**Returns:** `Promise<string>` - Public URL of copied blob

**Example:**
```typescript
const url = await uploadFromUrl('https://example.com/video.mp4', {
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/copied.mp4',
  contentType: 'video/mp4'
});
```

### Download Operations

#### `downloadBlob(params)`

Download a blob as a Buffer.

**Parameters:**
- `container`: Container name
- `blobName`: Blob path

**Returns:** `Promise<Buffer>` - Blob content

**Example:**
```typescript
const buffer = await downloadBlob({
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4'
});
```

### Delete Operations

#### `deleteBlob(params)`

Delete a single blob.

**Parameters:**
- `container`: Container name
- `blobName`: Blob path

**Returns:** `Promise<void>`

**Example:**
```typescript
await deleteBlob({
  container: CONTAINERS.UPLOADS,
  blobName: 'user123/video.mp4'
});
```

#### `deleteBlobs(blobs)`

Delete multiple blobs in parallel with concurrency control.

**Parameters:**
- `blobs`: Array of delete parameters

**Returns:** `Promise<{ deleted: number; failed: number }>` - Deletion statistics

**Example:**
```typescript
const result = await deleteBlobs([
  { container: CONTAINERS.UPLOADS, blobName: 'user123/video1.mp4' },
  { container: CONTAINERS.UPLOADS, blobName: 'user123/video2.mp4' }
]);
console.log(`Deleted ${result.deleted}, Failed ${result.failed}`);
```

### SAS URL Generation

#### `generateSasUrl(params)`

Generate a time-limited URL with specific permissions.

**Parameters:**
- `container`: Container name
- `blobName`: Blob path
- `expiresInMinutes?`: Expiration time in minutes (default: 60)
- `permissions?`: SAS permissions
  - `'r'` - read only
  - `'w'` - write only
  - `'rw'` - read + write
  - `'c'` - create
  - `'cw'` - create + write

**Returns:** `Promise<string>` - SAS URL with embedded token

**Example:**
```typescript
const url = await generateSasUrl({
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4',
  expiresInMinutes: 30,
  permissions: 'r'
});
```

### Query Operations

#### `blobExists(params)`

Check if a blob exists.

**Parameters:**
- `container`: Container name
- `blobName`: Blob path

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const exists = await blobExists({
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4'
});
```

#### `getBlobMetadata(params)`

Get blob metadata without downloading content.

**Parameters:**
- `container`: Container name
- `blobName`: Blob path

**Returns:** `Promise<BlobMetadata>`
```typescript
{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata: Record<string, string>;
  etag: string;
}
```

**Example:**
```typescript
const metadata = await getBlobMetadata({
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4'
});
console.log(`Size: ${metadata.size} bytes`);
```

#### `listBlobs(params)`

List blobs in a container with optional prefix filtering.

**Parameters:**
- `container`: Container name
- `prefix?`: Filter by prefix (e.g., `'user123/'`)
- `maxResults?`: Maximum results (default: 100)

**Returns:** `Promise<string[]>` - Array of blob names

**Example:**
```typescript
const videos = await listBlobs({
  container: CONTAINERS.VIDEOS,
  prefix: 'user123/',
  maxResults: 100
});
```

### Utility Functions

#### `getBlobUrl(container, blobName)`

Get the public URL for a blob (requires container to have public access).

**Parameters:**
- `container`: Container name
- `blobName`: Blob path

**Returns:** `string` - Full blob URL

**Example:**
```typescript
const url = getBlobUrl(CONTAINERS.VIDEOS, 'user123/video.mp4');
// Returns: "https://account.blob.core.windows.net/videos/user123/video.mp4"
```

#### `parseBlobUrl(url)`

Parse blob name from full Azure Storage URL.

**Parameters:**
- `url`: Full Azure Blob Storage URL

**Returns:** `{ container: string; blobName: string } | null`

**Example:**
```typescript
const parsed = parseBlobUrl('https://account.blob.core.windows.net/uploads/user123/video.mp4');
// Returns: { container: 'uploads', blobName: 'user123/video.mp4' }
```

### Health Check

#### `initializeAzureStorage()`

Initialize and validate Azure Storage connection at startup.

**Returns:** `Promise<void>`

**Throws:** Error if initialization fails

**Example:**
```typescript
try {
  await initializeAzureStorage();
  console.log('Azure Storage ready');
} catch (error) {
  console.error('Azure Storage failed:', error);
  process.exit(1);
}
```

#### `checkAzureStorageHealth()`

Check if Azure Storage is healthy.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const isHealthy = await checkAzureStorageHealth();
if (!isHealthy) {
  return new Response('Azure Storage unavailable', { status: 503 });
}
```

#### `getAzureStorageHealthStatus()`

Get current health status without performing a check.

**Returns:** `'unknown' | 'healthy' | 'unhealthy'`

**Example:**
```typescript
const status = getAzureStorageHealthStatus();
console.log('Azure Storage status:', status);
```

## Common Patterns

### Client-Side Upload with SAS URL

```typescript
// Server endpoint: Generate SAS URL
app.post('/api/upload-url', async (req, res) => {
  const { userId, fileName } = req.body;

  const uploadUrl = await generateSasUrl({
    container: CONTAINERS.UPLOADS,
    blobName: `${userId}/${Date.now()}-${fileName}`,
    expiresInMinutes: 30,
    permissions: 'cw'
  });

  res.json({ uploadUrl });
});

// Client-side: Upload directly to Azure
const response = await fetch(uploadUrl, {
  method: 'PUT',
  body: fileData,
  headers: { 'x-ms-blob-type': 'BlockBlob' }
});
```

### Bulk Delete

```typescript
// List all user files
const uploads = await listBlobs({
  container: CONTAINERS.UPLOADS,
  prefix: 'user123/'
});

const videos = await listBlobs({
  container: CONTAINERS.VIDEOS,
  prefix: 'user123/'
});

// Combine and delete
const allBlobs = [
  ...uploads.map(name => ({ container: CONTAINERS.UPLOADS, blobName: name })),
  ...videos.map(name => ({ container: CONTAINERS.VIDEOS, blobName: name }))
];

const result = await deleteBlobs(allBlobs);
console.log(`Deleted ${result.deleted} files`);
```

### Complete Video Processing Workflow

```typescript
async function processVideo(userId: string, videoId: string) {
  // 1. Upload processed video
  const processedUrl = await uploadBlob({
    container: CONTAINERS.VIDEOS,
    blobName: `${userId}/${videoId}/processed.mp4`,
    data: processedBuffer,
    contentType: 'video/mp4',
    metadata: { userId, videoId }
  });

  // 2. Upload keyframes
  for (let i = 0; i < keyframes.length; i++) {
    await uploadBlob({
      container: CONTAINERS.KEYFRAMES,
      blobName: `${userId}/${videoId}/keyframe-${i}.jpg`,
      data: keyframes[i],
      contentType: 'image/jpeg',
      metadata: { userId, videoId, frameIndex: i.toString() }
    });
  }

  // 3. Upload thumbnail
  const thumbnailUrl = await uploadBlob({
    container: CONTAINERS.THUMBNAILS,
    blobName: `${userId}/${videoId}/thumb.jpg`,
    data: thumbnailBuffer,
    contentType: 'image/jpeg',
    metadata: { userId, videoId }
  });

  // 4. Clean up original upload
  await deleteBlob({
    container: CONTAINERS.UPLOADS,
    blobName: `${userId}/${videoId}/original.mp4`
  });

  return { processedUrl, thumbnailUrl };
}
```

## Error Handling

All functions include comprehensive error handling with detailed error messages:

```typescript
try {
  const url = await uploadBlob({
    container: CONTAINERS.VIDEOS,
    blobName: 'user123/video.mp4',
    data: buffer,
    contentType: 'video/mp4'
  });
} catch (error) {
  // Error message includes:
  // - Operation type (upload)
  // - Container and blob name
  // - Specific error details
  console.error('Upload failed:', error.message);
}
```

## Type Safety

Full TypeScript type definitions are included:

```typescript
import type {
  UploadBlobParams,
  DownloadBlobParams,
  DeleteBlobParams,
  GenerateSasUrlParams,
  BlobMetadata,
  ListBlobsParams,
  ContainerName
} from '@/lib/storage';

// Use types in your code
const params: UploadBlobParams = {
  container: CONTAINERS.VIDEOS,
  blobName: 'user123/video.mp4',
  data: buffer,
  contentType: 'video/mp4'
};
```

## Testing

See `storage.example.ts` for comprehensive usage examples covering all operations.

## License

MIT
