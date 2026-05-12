// /**
//  * S3 Storage Client
//  *
//  * Provides file storage operations for interview recordings, resumes,
//  * and other binary assets. Supports AWS S3 and S3-compatible services (MinIO).
//  *
//  * @module lib/storage/s3
//  * @version 0.1.0
//  */

// import {
//   S3Client,
//   PutObjectCommand,
//   GetObjectCommand,
//   DeleteObjectCommand,
//   ListObjectsV2Command,
//   ListBucketsCommand,
//   HeadObjectCommand,
//   type PutObjectCommandInput,
//   type GetObjectCommandInput,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// /**
//  * S3 client singleton
//  */
// let s3Client: S3Client | null = null;

// /**
//  * S3 initialization and health status
//  */
// let s3Initialized = false;
// let s3HealthStatus: 'unknown' | 'healthy' | 'unhealthy' = 'unknown';

// /**
//  * Get or create S3 client instance
//  *
//  * Supports both AWS S3 and S3-compatible services like MinIO.
//  *
//  * @returns {S3Client} S3 client instance
//  */
// export function getS3Client(): S3Client {
//   if (s3Client) {
//     return s3Client;
//   }

//   const region = import.meta.env.AWS_REGION || process.env.AWS_REGION || "us-east-1";
//   const accessKeyId = import.meta.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
//   const secretAccessKey = import.meta.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
//   const endpoint = import.meta.env.AWS_ENDPOINT_URL || process.env.AWS_ENDPOINT_URL;

//   if (!accessKeyId || !secretAccessKey) {
//     throw new Error(
//       "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
//     );
//   }

//   const config: any = {
//     region,
//     credentials: {
//       accessKeyId,
//       secretAccessKey,
//     },
//   };

//   // For local MinIO or other S3-compatible services
//   if (endpoint) {
//     config.endpoint = endpoint;
//     config.forcePathStyle = true; // Required for MinIO
//   }

//   s3Client = new S3Client(config);
//   return s3Client;
// }

// /**
//  * Initialize and validate S3 connection at startup
//  *
//  * Validates that AWS credentials are configured correctly and that
//  * the S3 service is accessible. Should be called during application
//  * bootstrap to fail fast if S3 is misconfigured.
//  *
//  * @returns {Promise<void>}
//  * @throws {Error} If S3 initialization or validation fails
//  *
//  * @example
//  * ```typescript
//  * // In application startup (e.g., astro.config.mjs or startup script)
//  * import { initializeS3 } from '@/lib/storage/s3';
//  *
//  * async function bootstrap() {
//  *   await initializeS3();
//  *   console.log('S3 ready');
//  * }
//  * ```
//  */
// export async function initializeS3(): Promise<void> {
//   if (s3Initialized) return;

//   try {
//     const client = getS3Client(); // This will throw if creds missing

//     // Test connection with a ListBuckets call
//     // This validates that credentials are valid and S3 is accessible
//     await client.send(new ListBucketsCommand({}));

//     s3HealthStatus = 'healthy';
//     s3Initialized = true;

//     console.log('✅ S3 connection validated successfully');
//   } catch (error) {
//     s3HealthStatus = 'unhealthy';
//     console.error('❌ S3 initialization failed:', error);

//     const errorMessage = error instanceof Error ? error.message : String(error);
//     throw new Error(
//       `Failed to initialize S3: ${errorMessage}\n` +
//       `Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION environment variables.`
//     );
//   }
// }

// /**
//  * Health check for S3 storage
//  *
//  * Returns the current health status of the S3 connection.
//  * If not yet initialized, attempts initialization first.
//  *
//  * @returns {Promise<boolean>} True if S3 is healthy, false otherwise
//  *
//  * @example
//  * ```typescript
//  * // In health check endpoint
//  * const isHealthy = await checkS3Health();
//  * if (!isHealthy) {
//  *   return new Response('S3 unavailable', { status: 503 });
//  * }
//  * ```
//  */
// export async function checkS3Health(): Promise<boolean> {
//   if (s3HealthStatus === 'unknown') {
//     try {
//       await initializeS3();
//     } catch (error) {
//       return false;
//     }
//   }
//   return s3HealthStatus === 'healthy';
// }

// /**
//  * Get current S3 health status
//  *
//  * Returns the cached health status without performing a check.
//  *
//  * @returns {'unknown' | 'healthy' | 'unhealthy'} Current health status
//  */
// export function getS3HealthStatus(): 'unknown' | 'healthy' | 'unhealthy' {
//   return s3HealthStatus;
// }

// /**
//  * Upload a file to S3
//  *
//  * @param {string} key S3 object key (path)
//  * @param {Buffer | ReadableStream | Uint8Array} body File content
//  * @param {string} contentType MIME type
//  * @param {Record<string, string>} metadata Optional metadata tags
//  * @returns {Promise<string>} S3 URI (s3://bucket/key)
//  *
//  * @throws {Error} If upload fails
//  *
//  * @example
//  * ```typescript
//  * const buffer = await file.arrayBuffer();
//  * const s3Uri = await uploadFile(
//  *   "resumes/cand_123/resume.pdf",
//  *   Buffer.from(buffer),
//  *   "application/pdf",
//  *   { candidateId: "cand_123" }
//  * );
//  * ```
//  */
// export async function uploadFile(
//   key: string,
//   body: Buffer | ReadableStream | Uint8Array,
//   contentType: string,
//   metadata?: Record<string, string>
// ): Promise<string> {
//   const client = getS3Client();
//   const bucket = import.meta.env.S3_FILES_BUCKET || process.env.S3_FILES_BUCKET || "data3d-files";

//   try {
//     const command = new PutObjectCommand({
//       Bucket: bucket,
//       Key: key,
//       Body: body,
//       ContentType: contentType,
//       Metadata: metadata,
//     });

//     await client.send(command);

//     return `s3://${bucket}/${key}`;
//   } catch (error) {
//     console.error("S3 upload error:", error);
//     throw new Error(
//       `Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`
//     );
//   }
// }

// /**
//  * Get a presigned URL for uploading a file
//  *
//  * Returns a temporary URL that clients can use to upload files directly to S3
//  * without going through the server.
//  *
//  * @param {string} key S3 object key
//  * @param {string} contentType Expected MIME type
//  * @param {number} expiresIn Expiration time in seconds (default: 1 hour)
//  * @returns {Promise<string>} Presigned upload URL
//  *
//  * @example
//  * ```typescript
//  * // Server-side: generate upload URL
//  * const uploadUrl = await getSignedUploadUrl(
//  *   `resumes/${candidateId}/resume.pdf`,
//  *   "application/pdf",
//  *   3600
//  * );
//  *
//  * // Client-side: upload directly to S3
//  * await fetch(uploadUrl, {
//  *   method: 'PUT',
//  *   body: fileBuffer,
//  *   headers: { 'Content-Type': 'application/pdf' }
//  * });
//  * ```
//  */
// export async function getSignedUploadUrl(
//   key: string,
//   contentType: string,
//   expiresIn: number = 3600
// ): Promise<string> {
//   const client = getS3Client();
//   const bucket = import.meta.env.S3_FILES_BUCKET || process.env.S3_FILES_BUCKET || "data3d-files";

//   try {
//     const command = new PutObjectCommand({
//       Bucket: bucket,
//       Key: key,
//       ContentType: contentType,
//     });

//     const signedUrl = await getSignedUrl(client, command, { expiresIn });
//     return signedUrl;
//   } catch (error) {
//     console.error("Error generating signed upload URL:", error);
//     throw new Error(
//       `Failed to generate upload URL: ${error instanceof Error ? error.message : String(error)}`
//     );
//   }
// }

// /**
//  * Get a presigned URL for downloading a file
//  *
//  * Returns a temporary URL for accessing a file from S3.
//  *
//  * @param {string} key S3 object key
//  * @param {number} expiresIn Expiration time in seconds (default: 1 hour)
//  * @returns {Promise<string>} Presigned download URL
//  *
//  * @example
//  * ```typescript
//  * const downloadUrl = await getSignedDownloadUrl(
//  *   "recordings/intv_123/full_recording.webm",
//  *   3600
//  * );
//  * ```
//  */
// export async function getSignedDownloadUrl(
//   key: string,
//   expiresIn: number = 3600
// ): Promise<string> {
//   const client = getS3Client();
//   const bucket = import.meta.env.S3_FILES_BUCKET || process.env.S3_FILES_BUCKET || "data3d-files";

//   try {
//     const command = new GetObjectCommand({
//       Bucket: bucket,
//       Key: key,
//     });

//     const signedUrl = await getSignedUrl(client, command, { expiresIn });
//     return signedUrl;
//   } catch (error) {
//     console.error("Error generating signed download URL:", error);
//     throw new Error(
//       `Failed to generate download URL: ${error instanceof Error ? error.message : String(error)}`
//     );
//   }
// }

// /**
//  * Delete a file from S3
//  *
//  * @param {string} key S3 object key
//  * @returns {Promise<void>}
//  *
//  * @throws {Error} If deletion fails
//  *
//  * @example
//  * ```typescript
//  * await deleteFile("resumes/cand_123/resume.pdf");
//  * ```
//  */
// export async function deleteFile(key: string): Promise<void> {
//   const client = getS3Client();
//   const bucket = import.meta.env.S3_FILES_BUCKET || process.env.S3_FILES_BUCKET || "data3d-files";

//   try {
//     const command = new DeleteObjectCommand({
//       Bucket: bucket,
//       Key: key,
//     });

//     await client.send(command);
//   } catch (error) {
//     console.error("S3 delete error:", error);
//     throw new Error(
//       `Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`
//     );
//   }
// }

// /**
//  * List files in a directory (prefix)
//  *
//  * @param {string} prefix S3 key prefix (directory path)
//  * @param {number} maxKeys Maximum number of keys to return
//  * @returns {Promise<string[]>} Array of S3 keys
//  *
//  * @example
//  * ```typescript
//  * const files = await listFiles("recordings/intv_123/");
//  * // Returns: ["recordings/intv_123/full_recording.webm", ...]
//  * ```
//  */
// export async function listFiles(
//   prefix: string,
//   maxKeys: number = 1000
// ): Promise<string[]> {
//   const client = getS3Client();
//   const bucket = import.meta.env.S3_FILES_BUCKET || process.env.S3_FILES_BUCKET || "data3d-files";

//   try {
//     const command = new ListObjectsV2Command({
//       Bucket: bucket,
//       Prefix: prefix,
//       MaxKeys: maxKeys,
//     });

//     const response = await client.send(command);
//     return (response.Contents || []).map((obj) => obj.Key!).filter(Boolean);
//   } catch (error) {
//     console.error("S3 list error:", error);
//     throw new Error(
//       `Failed to list files from S3: ${error instanceof Error ? error.message : String(error)}`
//     );
//   }
// }

// /**
//  * Check if a file exists in S3
//  *
//  * @param {string} key S3 object key
//  * @returns {Promise<boolean>} True if file exists
//  *
//  * @example
//  * ```typescript
//  * const exists = await fileExists("resumes/cand_123/resume.pdf");
//  * if (!exists) {
//  *   console.log("Resume not found");
//  * }
//  * ```
//  */
// export async function fileExists(key: string): Promise<boolean> {
//   const client = getS3Client();
//   const bucket = import.meta.env.S3_FILES_BUCKET || process.env.S3_FILES_BUCKET || "data3d-files";

//   try {
//     const command = new HeadObjectCommand({
//       Bucket: bucket,
//       Key: key,
//     });

//     await client.send(command);
//     return true;
//   } catch (error: any) {
//     if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
//       return false;
//     }
//     throw error;
//   }
// }

// /**
//  * Get file metadata without downloading
//  *
//  * @param {string} key S3 object key
//  * @returns {Promise<Object>} File metadata
//  *
//  * @example
//  * ```typescript
//  * const metadata = await getFileMetadata("resumes/cand_123/resume.pdf");
//  * console.log(`Size: ${metadata.size} bytes`);
//  * console.log(`Type: ${metadata.contentType}`);
//  * ```
//  */
// export async function getFileMetadata(key: string): Promise<{
//   size: number;
//   contentType: string;
//   lastModified: Date;
//   metadata: Record<string, string>;
// }> {
//   const client = getS3Client();
//   const bucket = import.meta.env.S3_FILES_BUCKET || process.env.S3_FILES_BUCKET || "data3d-files";

//   try {
//     const command = new HeadObjectCommand({
//       Bucket: bucket,
//       Key: key,
//     });

//     const response = await client.send(command);

//     return {
//       size: response.ContentLength || 0,
//       contentType: response.ContentType || "application/octet-stream",
//       lastModified: response.LastModified || new Date(),
//       metadata: response.Metadata || {},
//     };
//   } catch (error) {
//     console.error("Error getting file metadata:", error);
//     throw new Error(
//       `Failed to get file metadata: ${error instanceof Error ? error.message : String(error)}`
//     );
//   }
// }

// /**
//  * Extract S3 key from S3 URI
//  *
//  * Converts "s3://bucket/path/to/file" to "path/to/file"
//  *
//  * @param {string} s3Uri S3 URI
//  * @returns {string} S3 key
//  *
//  * @example
//  * ```typescript
//  * const key = extractKeyFromUri("s3://data3d-files/resumes/cand_123/resume.pdf");
//  * // Returns: "resumes/cand_123/resume.pdf"
//  * ```
//  */
// export function extractKeyFromUri(s3Uri: string): string {
//   if (!s3Uri.startsWith("s3://")) {
//     throw new Error(`Invalid S3 URI: ${s3Uri}`);
//   }

//   const withoutProtocol = s3Uri.slice(5); // Remove "s3://"
//   const firstSlashIndex = withoutProtocol.indexOf("/");

//   if (firstSlashIndex === -1) {
//     throw new Error(`Invalid S3 URI format: ${s3Uri}`);
//   }

//   return withoutProtocol.slice(firstSlashIndex + 1);
// }

// /**
//  * Build S3 URI from bucket and key
//  *
//  * @param {string} bucket S3 bucket name
//  * @param {string} key S3 object key
//  * @returns {string} S3 URI
//  *
//  * @example
//  * ```typescript
//  * const uri = buildS3Uri("data3d-files", "resumes/cand_123/resume.pdf");
//  * // Returns: "s3://data3d-files/resumes/cand_123/resume.pdf"
//  * ```
//  */
// export function buildS3Uri(bucket: string, key: string): string {
//   return `s3://${bucket}/${key}`;
// }
