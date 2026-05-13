/**
 * MotoFlow Video AI Content Studio - Type Definitions
 *
 * Central export point for all type definitions used across the application.
 * This barrel file provides convenient imports for error types and video types.
 *
 * @module types
 * @version 0.3.0
 *
 * @example
 * ```typescript
 * // Import error types
 * import { ApiError, ValidationError, createApiError } from '@/types';
 *
 * // Import video types
 * import { PipelineStage, VideoProject, VideoStatusResponse } from '@/types';
 * ```
 */

// ============================================================================
// DOMAIN ENTITIES & CONTRACTS
// ============================================================================

// Note: contracts.ts contains legacy recruitment system types and is retained
// for reference only. Types are not exported as they are not used in the
// current Video AI Content Studio application.

// ============================================================================
// EVENTS, COMMANDS, QUERIES
// ============================================================================

// Legacy event sourcing infrastructure has been removed.
// - src/types/events.ts (deleted)
// - src/types/commands.ts (deleted)
// - src/types/queries.ts (deleted)
// - src/lib/db/event-store.ts (deleted)

// ============================================================================
// ERRORS
// ============================================================================

export {
  ErrorCode,
  type ApiError,
  type ValidationErrorDetail,
  type ValidationError,
  type NotFoundError,
  type ServiceError,
  createValidationError,
  createNotFoundError,
  createServiceError,
  createApiError,
  isValidationError,
  isNotFoundError,
  isServiceError,
  isRetryableError,
} from './errors';

// ============================================================================
// VIDEO AI CONTENT STUDIO
// ============================================================================

export {
  type PipelineStage,
  type VideoStatus,
  type VideoQuality,
  type VideoMode,
  type VideoProject,
  type VideoStatusResponse,
  type VideoProgressUpdateDetail,
  type VideoCharacter,
  type VideoUsage,
  type PlanType,
} from './video';
