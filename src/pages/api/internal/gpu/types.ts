/**
 * GPU Worker Types
 *
 * Type definitions for GPU worker mock endpoints.
 * These simulate Phase 3 Director Agent flows for video generation.
 *
 * @module pages/api/internal/gpu/types
 * @version 1.0.0
 */

// ============================================================================
// Job Status Types
// ============================================================================

/**
 * Job states in the GPU worker pipeline
 */
export type GPUJobState =
  | 'queued'       // Job is waiting in queue
  | 'processing'   // Job is actively being processed
  | 'completed'    // Job completed successfully
  | 'failed';      // Job failed

/**
 * Job types that can be processed by the GPU worker
 */
export type GPUJobType =
  | 'keyframe'     // Generate a single keyframe
  | 'scene';       // Generate a full scene

// ============================================================================
// Request/Response Types - Generate Keyframe
// ============================================================================

/**
 * Request body for generating a keyframe
 */
export interface GenerateKeyframeRequest {
  sceneId: string;
  prompt: string;
  style?: string;
  quality?: 'draft' | 'standard' | 'high';
  frameNumber?: number;
}

/**
 * Response body for keyframe generation
 */
export interface GenerateKeyframeResponse {
  success: boolean;
  jobId: string;
  keyframeId: string;
  estimatedTimeSeconds: number;
  message: string;
}

// ============================================================================
// Request/Response Types - Generate Scene
// ============================================================================

/**
 * Request body for generating a scene
 */
export interface GenerateSceneRequest {
  sceneId: string;
  script: string;
  duration: number; // in seconds
  quality?: 'draft' | 'standard' | 'high';
  fps?: number;
  resolution?: {
    width: number;
    height: number;
  };
  includeAudio?: boolean;
}

/**
 * Response body for scene generation
 */
export interface GenerateSceneResponse {
  success: boolean;
  jobId: string;
  sceneId: string;
  estimatedTimeSeconds: number;
  totalFrames: number;
  message: string;
}

// ============================================================================
// Response Types - Job Status
// ============================================================================

/**
 * Job status response
 */
export interface GPUJobStatus {
  jobId: string;
  jobType: GPUJobType;
  state: GPUJobState;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;

  // Keyframe-specific fields
  keyframeId?: string;
  keyframeUrl?: string;

  // Scene-specific fields
  sceneId?: string;
  sceneUrl?: string;
  totalFrames?: number;
  completedFrames?: number;

  // Error handling
  error?: string;
  errorMessage?: string;
  retryable?: boolean;
}

// ============================================================================
// Mock Data Types
// ============================================================================

/**
 * In-memory job store for mock GPU worker
 * In production, this would be stored in Redis or the database
 */
export interface MockJob {
  jobId: string;
  jobType: GPUJobType;
  state: GPUJobState;
  progress: number;
  startedAt: string;
  completedAt?: string;
  data: Record<string, unknown>;
  error?: string;
  errorMessage?: string;
}

/**
 * Mock keyframe result
 */
export interface MockKeyframeResult {
  keyframeId: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

/**
 * Mock scene result
 */
export interface MockSceneResult {
  sceneId: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  format: string;
  sizeBytes: number;
}
