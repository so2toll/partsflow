/**
 * Resume Storage Utilities
 *
 * Handles resume upload, storage, and retrieval operations.
 *
 * @module lib/storage/resume
 * @version 0.1.0
 */

import {
  uploadFile,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  fileExists,
  extractKeyFromUri,
  buildS3Uri,
} from "./s3";

/**
 * Upload a resume file for a candidate
 *
 * @param {string} candidateId Candidate ID
 * @param {File | Buffer} file Resume file
 * @param {string} filename Original filename
 * @returns {Promise<{url: string, key: string}>} S3 URL and key
 *
 * @throws {Error} If upload fails
 *
 * @example
 * ```typescript
 * const { url, key } = await uploadResume(
 *   "cand_123",
 *   resumeFile,
 *   "john_doe_resume.pdf"
 * );
 * ```
 */
export async function uploadResume(
  candidateId: string,
  file: File | Buffer,
  filename: string
): Promise<{ url: string; key: string }> {
  // Extract file extension
  const extension = filename.split(".").pop()?.toLowerCase() || "pdf";

  // Validate file type
  const validExtensions = ["pdf", "doc", "docx", "txt"];
  if (!validExtensions.includes(extension)) {
    throw new Error(
      `Invalid resume file type: ${extension}. Allowed types: ${validExtensions.join(", ")}`
    );
  }

  // Determine content type
  const contentTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
  };
  const contentType = contentTypes[extension] || "application/octet-stream";

  // Build S3 key
  const key = `resumes/${candidateId}/original.${extension}`;

  // Convert File to Buffer if needed
  let buffer: Buffer;
  if (file instanceof Buffer) {
    buffer = file;
  } else {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (buffer.length > maxSize) {
    throw new Error(
      `Resume file too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`
    );
  }

  // Upload to S3
  const url = await uploadFile(key, buffer, contentType, {
    candidateId,
    originalFilename: filename,
    uploadedAt: new Date().toISOString(),
  });

  return { url, key };
}

/**
 * Get a presigned URL for uploading a resume directly from client
 *
 * This allows clients to upload files directly to S3 without going through the server.
 *
 * @param {string} candidateId Candidate ID
 * @param {string} fileExtension File extension (pdf, doc, docx, txt)
 * @param {number} expiresIn Expiration time in seconds (default: 1 hour)
 * @returns {Promise<{uploadUrl: string, key: string}>} Upload URL and S3 key
 *
 * @example
 * ```typescript
 * // Server-side
 * const { uploadUrl, key } = await getResumeUploadUrl("cand_123", "pdf");
 *
 * // Client-side
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   body: file,
 *   headers: { 'Content-Type': 'application/pdf' }
 * });
 * ```
 */
export async function getResumeUploadUrl(
  candidateId: string,
  fileExtension: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
  // Validate extension
  const validExtensions = ["pdf", "doc", "docx", "txt"];
  if (!validExtensions.includes(fileExtension.toLowerCase())) {
    throw new Error(
      `Invalid file extension: ${fileExtension}. Allowed: ${validExtensions.join(", ")}`
    );
  }

  // Determine content type
  const contentTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
  };
  const contentType = contentTypes[fileExtension.toLowerCase()] || "application/octet-stream";

  // Build S3 key
  const key = `resumes/${candidateId}/original.${fileExtension}`;

  // Generate presigned URL
  const uploadUrl = await getSignedUploadUrl(key, contentType, expiresIn);

  return { uploadUrl, key };
}

/**
 * Get download URL for a candidate's resume
 *
 * Returns a presigned URL that can be used to download the resume.
 * Tries common file extensions if exact file is not specified.
 *
 * @param {string} candidateId Candidate ID
 * @param {number} expiresIn Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string | null>} Download URL or null if not found
 *
 * @example
 * ```typescript
 * const downloadUrl = await getResumeDownloadUrl("cand_123");
 * if (downloadUrl) {
 *   window.open(downloadUrl, '_blank');
 * }
 * ```
 */
export async function getResumeDownloadUrl(
  candidateId: string,
  expiresIn: number = 3600
): Promise<string | null> {
  // Try common extensions in order of preference
  const extensions = ["pdf", "docx", "doc", "txt"];

  for (const ext of extensions) {
    const key = `resumes/${candidateId}/original.${ext}`;

    try {
      if (await fileExists(key)) {
        return await getSignedDownloadUrl(key, expiresIn);
      }
    } catch (error) {
      // Continue to next extension
      continue;
    }
  }

  return null;
}

/**
 * Check if a resume exists for a candidate
 *
 * @param {string} candidateId Candidate ID
 * @returns {Promise<boolean>} True if resume exists
 *
 * @example
 * ```typescript
 * if (await resumeExists("cand_123")) {
 *   console.log("Resume on file");
 * }
 * ```
 */
export async function resumeExists(candidateId: string): Promise<boolean> {
  const extensions = ["pdf", "docx", "doc", "txt"];

  for (const ext of extensions) {
    const key = `resumes/${candidateId}/original.${ext}`;
    if (await fileExists(key)) {
      return true;
    }
  }

  return false;
}

/**
 * Store extracted text from resume
 *
 * Saves the text extraction result for quick retrieval without
 * re-parsing the original file.
 *
 * @param {string} candidateId Candidate ID
 * @param {string} extractedText Plain text content
 * @returns {Promise<string>} S3 URL of extracted text
 *
 * @example
 * ```typescript
 * const textUrl = await storeExtractedText(
 *   "cand_123",
 *   "John Doe\nSoftware Engineer\n..."
 * );
 * ```
 */
export async function storeExtractedText(
  candidateId: string,
  extractedText: string
): Promise<string> {
  const key = `resumes/${candidateId}/extracted.txt`;
  const buffer = Buffer.from(extractedText, "utf-8");

  return await uploadFile(key, buffer, "text/plain", {
    candidateId,
    extractedAt: new Date().toISOString(),
  });
}
