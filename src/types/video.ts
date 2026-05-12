/**
 * Video AI Content Studio - Type Definitions
 *
 * Type definitions for video generation, progress tracking, and related components.
 * These types are used across the Video AI Content Studio features.
 *
 * @module types/video
 * @version 0.1.0
 */

// ============================================================================
// VIDEO GENERATION PROGRESS
// ============================================================================

/**
 * Pipeline stages for video generation workflow
 *
 * These stages represent the complete lifecycle of video generation,
 * from initial script parsing through final video assembly.
 *
 * @example
 * ```typescript
 * const currentStage: PipelineStage = 'generating';
 * ```
 */
export type PipelineStage =
  | 'parsing'        // Analyzing script and extracting scenes
  | 'keyframes'      // Generating visual references for each scene
  | 'generating'     // AI is creating scene animations
  | 'rendering'      // Applying final quality settings
  | 'assembling'     // Combining scenes into final video
  | 'completed'      // Video generation finished successfully
  | 'failed';        // An error occurred during generation

/**
 * Video status enum - matches PipelineStage but excludes draft
 *
 * @example
 * ```typescript
 * const project: { videoStatus: VideoStatus } = {
 *   videoStatus: 'generating'
 * };
 * ```
 */
export type VideoStatus =
  | 'draft'
  | 'parsing'
  | 'keyframes'
  | 'generating'
  | 'rendering'
  | 'assembling'
  | 'completed'
  | 'failed';

/**
 * Progress update event payload for real-time tracking
 *
 * This interface defines the structure of the custom event
 * dispatched during video generation progress polling.
 *
 * @example
 * ```typescript
 * window.dispatchEvent(new CustomEvent<VideoProgressUpdateDetail>('video-progress-update', {
 *   detail: { stage: 'generating', progress: 45 }
 * }));
 * ```
 */
export interface VideoProgressUpdateDetail {
  /** Current pipeline stage */
  stage: PipelineStage;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Extend global Window interface to include our custom event
 *
 * This allows TypeScript to recognize our custom event type when
 * dispatching and listening for progress updates.
 *
 * @example
 * ```typescript
 * declare global {
 *   interface WindowEventMap {
 *     'video-progress-update': CustomEvent<VideoProgressUpdateDetail>;
 *   }
 * }
 * ```
 */
declare global {
  interface WindowEventMap {
    'video-progress-update': CustomEvent<VideoProgressUpdateDetail>;
  }
}

// ============================================================================
// VIDEO PROJECT TYPES
// ============================================================================

/**
 * Quality settings for video rendering
 *
 * @example
 * ```typescript
 * const quality: VideoQuality = '1080p';
 * ```
 */
export type VideoQuality = '720p' | '1080p' | '4k';

/**
 * Video generation mode
 *
 * @example
 * ```typescript
 * const mode: VideoMode = 'create'; // Script-to-video
 * ```
 */
export type VideoMode = 'create' | 'edit';

/**
 * Video project data structure
 *
 * Represents a complete video project with all metadata,
 * settings, and status information.
 *
 * @example
 * ```typescript
 * const project: VideoProject = {
 *   id: 'proj_123',
 *   name: 'My AI Video',
 *   videoStatus: 'generating',
 *   renderQuality: '1080p',
 *   totalScenes: 5,
 *   completedScenes: 2,
 *   progress: 40
 * };
 * ```
 */
export interface VideoProject {
  /** Unique project identifier */
  id: string;
  /** Project name/title */
  name: string;
  /** Optional project description */
  description?: string;
  /** Current generation status */
  videoStatus: VideoStatus;
  /** Render quality setting */
  renderQuality: VideoQuality;
  /** Total number of scenes to generate */
  totalScenes: number;
  /** Number of completed scenes */
  completedScenes: number;
  /** Calculated progress percentage (0-100) */
  progress: number;
  /** Estimated video duration in seconds */
  estimatedDuration?: number;
  /** URL to output video (when complete) */
  outputVideoUrl?: string;
  /** URL to video thumbnail */
  thumbnailUrl?: string;
  /** Error message if generation failed */
  errorMessage?: string | null;
  /** User's script text */
  script?: string;
  /** Generation mode (create or edit) */
  mode?: VideoMode;
  /** Timestamp when project was created */
  createdAt: string;
  /** Timestamp when project was last updated */
  updatedAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Video status API response
 *
 * Returned by the /api/video/status endpoint during progress polling.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/video/status?projectId=xxx');
 * const status: VideoStatusResponse = await response.json();
 * console.log(status.progress); // 45
 * ```
 */
export interface VideoStatusResponse {
  /** Project identifier */
  projectId: string;
  /** Current video generation status */
  videoStatus: VideoStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Total scenes to generate */
  totalScenes: number;
  /** Number of completed scenes */
  completedScenes: number;
  /** Output video URL (when available) */
  outputVideoUrl?: string;
  /** Thumbnail URL (when available) */
  thumbnailUrl?: string;
  /** Estimated duration in seconds */
  estimatedDuration?: number;
  /** Error message if failed */
  errorMessage?: string | null;
}

// ============================================================================
// CHARACTER LIBRARY TYPES
// ============================================================================

/**
 * Character for video generation
 *
 * @example
 * ```typescript
 * const character: VideoCharacter = {
 *   id: 'char_123',
 *   name: 'Alex',
 *   description: 'Professional presenter',
 *   imageUrl: 'https://...'
 * };
 * ```
 */
export interface VideoCharacter {
  /** Unique character identifier */
  id: string;
  /** Character name */
  name: string;
  /** Character description/appearance */
  description: string;
  /** Reference image URL */
  imageUrl?: string;
  /** Whether this is a custom character */
  isCustom: boolean;
  /** Character tags/categories */
  tags?: string[];
}

// ============================================================================
// SUBSCRIPTION & USAGE TYPES
// ============================================================================

/**
 * Subscription plan types
 *
 * @example
 * ```typescript
 * const plan: PlanType = 'creator';
 * ```
 */
export type PlanType = 'free' | 'creator' | 'pro' | 'enterprise';

/**
 * User's video generation usage and limits
 *
 * @example
 * ```typescript
 * const usage: VideoUsage = {
 *   usedMinutes: 45,
 *   totalMinutes: 60,
 *   planType: 'creator',
 *   periodStart: '2026-05-01',
 *   periodEnd: '2026-06-01'
 * };
 * ```
 */
export interface VideoUsage {
  /** Minutes used this billing period */
  usedMinutes: number;
  /** Total minutes allowed per period */
  totalMinutes: number;
  /** Current subscription plan */
  planType: PlanType;
  /** Billing period start date */
  periodStart?: string;
  /** Billing period end date */
  periodEnd?: string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  PipelineStage,
  VideoStatus,
  VideoQuality,
  VideoMode,
  VideoProject,
  VideoStatusResponse,
  VideoProgressUpdateDetail,
  VideoCharacter,
  VideoUsage,
  PlanType,
};
