/**
 * Interview Recording Storage Utilities
 *
 * Handles storage and retrieval of interview audio/video recordings.
 *
 * @module lib/storage/recordings
 * @version 0.1.0
 */

import {
  uploadFile,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  listFiles,
  fileExists,
} from "./s3";

/**
 * Save the complete interview recording
 *
 * @param {string} interviewId Interview ID
 * @param {Buffer} recording Recording buffer
 * @param {string} format File format (webm, mp4, etc.)
 * @returns {Promise<string>} S3 URL
 *
 * @throws {Error} If upload fails
 *
 * @example
 * ```typescript
 * const s3Url = await saveRecording(
 *   "intv_123",
 *   recordingBuffer,
 *   "webm"
 * );
 * ```
 */
export async function saveRecording(
  interviewId: string,
  recording: Buffer,
  format: string = "webm"
): Promise<string> {
  const key = `recordings/${interviewId}/full_recording.${format}`;

  // Determine content type
  const contentTypes: Record<string, string> = {
    webm: "video/webm",
    mp4: "video/mp4",
    mkv: "video/x-matroska",
  };
  const contentType = contentTypes[format] || "video/webm";

  return await uploadFile(key, recording, contentType, {
    interviewId,
    recordingType: "full",
    uploadedAt: new Date().toISOString(),
  });
}

/**
 * Save audio for a specific question turn
 *
 * @param {string} interviewId Interview ID
 * @param {number} turnNumber Turn sequence number
 * @param {"question" | "response"} type Audio type
 * @param {Buffer} audio Audio buffer
 * @param {string} format Audio format (mp3, wav, etc.)
 * @returns {Promise<string>} S3 URL
 *
 * @example
 * ```typescript
 * const audioUrl = await saveTurnAudio(
 *   "intv_123",
 *   1,
 *   "question",
 *   audioBuffer,
 *   "mp3"
 * );
 * ```
 */
export async function saveTurnAudio(
  interviewId: string,
  turnNumber: number,
  type: "question" | "response",
  audio: Buffer,
  format: string = "mp3"
): Promise<string> {
  const paddedTurn = turnNumber.toString().padStart(3, "0");
  const key = `recordings/${interviewId}/turns/turn_${paddedTurn}_${type}.${format}`;

  // Determine content type
  const contentTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    webm: "audio/webm",
  };
  const contentType = contentTypes[format] || "audio/mpeg";

  return await uploadFile(key, audio, contentType, {
    interviewId,
    turnNumber: turnNumber.toString(),
    audioType: type,
    uploadedAt: new Date().toISOString(),
  });
}

/**
 * Get presigned URL for uploading a recording directly from client
 *
 * @param {string} interviewId Interview ID
 * @param {string} format File format
 * @param {number} expiresIn Expiration time in seconds (default: 2 hours)
 * @returns {Promise<{uploadUrl: string, key: string}>} Upload URL and S3 key
 *
 * @example
 * ```typescript
 * const { uploadUrl, key } = await getRecordingUploadUrl("intv_123", "webm");
 * // Client uploads directly to uploadUrl
 * ```
 */
export async function getRecordingUploadUrl(
  interviewId: string,
  format: string = "webm",
  expiresIn: number = 7200 // 2 hours for large files
): Promise<{ uploadUrl: string; key: string }> {
  const key = `recordings/${interviewId}/full_recording.${format}`;

  const contentTypes: Record<string, string> = {
    webm: "video/webm",
    mp4: "video/mp4",
    mkv: "video/x-matroska",
  };
  const contentType = contentTypes[format] || "video/webm";

  const uploadUrl = await getSignedUploadUrl(key, contentType, expiresIn);

  return { uploadUrl, key };
}

/**
 * Get download URL for interview recording
 *
 * @param {string} interviewId Interview ID
 * @param {string} format Expected format (optional, will try common formats)
 * @param {number} expiresIn Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string | null>} Download URL or null if not found
 *
 * @example
 * ```typescript
 * const url = await getRecordingUrl("intv_123");
 * if (url) {
 *   window.open(url, '_blank');
 * }
 * ```
 */
export async function getRecordingUrl(
  interviewId: string,
  format?: string,
  expiresIn: number = 3600
): Promise<string | null> {
  // If format specified, try that first
  if (format) {
    const key = `recordings/${interviewId}/full_recording.${format}`;
    if (await fileExists(key)) {
      return await getSignedDownloadUrl(key, expiresIn);
    }
  }

  // Try common formats
  const formats = ["webm", "mp4", "mkv"];
  for (const fmt of formats) {
    const key = `recordings/${interviewId}/full_recording.${fmt}`;
    try {
      if (await fileExists(key)) {
        return await getSignedDownloadUrl(key, expiresIn);
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * Get download URL for a specific turn's audio
 *
 * @param {string} interviewId Interview ID
 * @param {number} turnNumber Turn number
 * @param {"question" | "response"} type Audio type
 * @param {number} expiresIn Expiration time in seconds
 * @returns {Promise<string | null>} Download URL or null if not found
 *
 * @example
 * ```typescript
 * const url = await getTurnAudioUrl("intv_123", 1, "response");
 * ```
 */
export async function getTurnAudioUrl(
  interviewId: string,
  turnNumber: number,
  type: "question" | "response",
  expiresIn: number = 3600
): Promise<string | null> {
  const paddedTurn = turnNumber.toString().padStart(3, "0");

  // Try common formats
  const formats = ["mp3", "wav", "ogg", "webm"];
  for (const format of formats) {
    const key = `recordings/${interviewId}/turns/turn_${paddedTurn}_${type}.${format}`;

    try {
      if (await fileExists(key)) {
        return await getSignedDownloadUrl(key, expiresIn);
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

/**
 * List all turn audio files for an interview
 *
 * @param {string} interviewId Interview ID
 * @returns {Promise<string[]>} Array of S3 keys
 *
 * @example
 * ```typescript
 * const turnFiles = await listTurnAudio("intv_123");
 * // Returns: ["recordings/intv_123/turns/turn_001_question.mp3", ...]
 * ```
 */
export async function listTurnAudio(interviewId: string): Promise<string[]> {
  const prefix = `recordings/${interviewId}/turns/`;
  return await listFiles(prefix);
}

/**
 * Check if recording exists for an interview
 *
 * @param {string} interviewId Interview ID
 * @returns {Promise<boolean>} True if recording exists
 *
 * @example
 * ```typescript
 * if (await recordingExists("intv_123")) {
 *   console.log("Recording available");
 * }
 * ```
 */
export async function recordingExists(interviewId: string): Promise<boolean> {
  const formats = ["webm", "mp4", "mkv"];

  for (const format of formats) {
    const key = `recordings/${interviewId}/full_recording.${format}`;
    if (await fileExists(key)) {
      return true;
    }
  }

  return false;
}
