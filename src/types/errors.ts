/**
 * Error Types for Data3D Expert Reasoning Engine
 *
 * Standardized error codes and structures for consistent error handling
 * across the application. All API errors follow the ApiError interface.
 *
 * @module types/errors
 * @version 1.0.0
 */

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Standardized error codes for the application
 */
export enum ErrorCode {
  // ========================================
  // 4xx Client Errors
  // ========================================

  /** Validation error - request data is invalid */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /** Resource not found */
  NOT_FOUND = 'NOT_FOUND',

  /** Unauthorized - no valid authentication */
  UNAUTHORIZED = 'UNAUTHORIZED',

  /** Forbidden - authenticated but not authorized */
  FORBIDDEN = 'FORBIDDEN',

  /** Conflict - resource already exists or state conflict */
  CONFLICT = 'CONFLICT',

  // ========================================
  // Interview-specific Errors
  // ========================================

  /** Interview has already been started */
  INTERVIEW_ALREADY_STARTED = 'INTERVIEW_ALREADY_STARTED',

  /** Interview is not ready to start */
  INTERVIEW_NOT_READY = 'INTERVIEW_NOT_READY',

  /** Interview has already been completed */
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',

  // ========================================
  // Evaluation-specific Errors
  // ========================================

  /** Transcript is not ready for evaluation */
  TRANSCRIPT_NOT_READY = 'TRANSCRIPT_NOT_READY',

  /** Axiom set not found */
  AXIOM_SET_NOT_FOUND = 'AXIOM_SET_NOT_FOUND',

  // ========================================
  // 5xx Server Errors
  // ========================================

  /** Internal server error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  /** LiveKit service error */
  LIVEKIT_ERROR = 'LIVEKIT_ERROR',

  /** Transcription service error */
  TRANSCRIPTION_ERROR = 'TRANSCRIPTION_ERROR',

  /** LLM service error */
  LLM_ERROR = 'LLM_ERROR',

  /** Storage service error (S3) */
  STORAGE_ERROR = 'STORAGE_ERROR',

  /** Database error */
  DATABASE_ERROR = 'DATABASE_ERROR',

  /** Event store error */
  EVENT_STORE_ERROR = 'EVENT_STORE_ERROR',

  // ========================================
  // Video AI-specific Errors
  // ========================================

  /** Insufficient quota for video generation */
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',

  /** Video generation failed */
  VIDEO_GENERATION_FAILED = 'VIDEO_GENERATION_FAILED',

  /** Invalid video quality tier */
  INVALID_QUALITY_TIER = 'INVALID_QUALITY_TIER',

  /** Video processing timeout */
  VIDEO_TIMEOUT = 'VIDEO_TIMEOUT',

  // ========================================
  // Organization/Team Errors
  // ========================================

  /** Organization not found */
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',

  /** Team not found */
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',

  /** User not a member of organization */
  NOT_ORGANIZATION_MEMBER = 'NOT_ORGANIZATION_MEMBER',

  /** User not a member of team */
  NOT_TEAM_MEMBER = 'NOT_TEAM_MEMBER',

  // ========================================
  // Project Errors
  // ========================================

  /** Project not found */
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',

  /** Project already assigned to team */
  PROJECT_ALREADY_ASSIGNED = 'PROJECT_ALREADY_ASSIGNED',

  /** Project not assigned to team */
  PROJECT_NOT_ASSIGNED = 'PROJECT_NOT_ASSIGNED',

  // ========================================
  // Character Errors
  // ========================================

  /** Character not found */
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',

  /** Invalid character data */
  INVALID_CHARACTER_DATA = 'INVALID_CHARACTER_DATA',
}

// ============================================================================
// ERROR INTERFACES
// ============================================================================

/**
 * Standard API error response
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: ErrorCode;

  /** Human-readable error message */
  message: string;

  /** Additional error details */
  details?: Record<string, unknown>;

  /** Request ID for tracing */
  requestId: string;

  /** Timestamp of error */
  timestamp?: string;
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  /** Field that failed validation */
  field: string;

  /** Validation error message */
  message: string;

  /** Value that was provided */
  value?: unknown;

  /** Expected type or format */
  expected?: string;
}

/**
 * Validation error with field-level details
 */
export interface ValidationError extends ApiError {
  code: ErrorCode.VALIDATION_ERROR;
  details: {
    /** Array of validation errors */
    validationErrors: ValidationErrorDetail[];
  };
}

/**
 * Resource not found error
 */
export interface NotFoundError extends ApiError {
  code: ErrorCode.NOT_FOUND;
  details?: {
    /** Type of resource that was not found */
    resourceType: string;
    /** ID of resource that was not found */
    resourceId: string;
  };
}

/**
 * Service error with retry information
 */
export interface ServiceError extends ApiError {
  code:
    | ErrorCode.LIVEKIT_ERROR
    | ErrorCode.TRANSCRIPTION_ERROR
    | ErrorCode.LLM_ERROR
    | ErrorCode.STORAGE_ERROR
    | ErrorCode.DATABASE_ERROR
    | ErrorCode.EVENT_STORE_ERROR;
  details?: {
    /** Whether the operation can be retried */
    retryable: boolean;
    /** Recommended retry delay in milliseconds */
    retryAfterMs?: number;
    /** Underlying service error message */
    serviceMessage?: string;
  };
}

// ============================================================================
// ERROR FACTORIES
// ============================================================================

/**
 * Create a validation error
 */
export function createValidationError(
  errors: ValidationErrorDetail[],
  requestId: string
): ValidationError {
  return {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    details: {
      validationErrors: errors,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a not found error
 */
export function createNotFoundError(
  resourceType: string,
  resourceId: string,
  requestId: string
): NotFoundError {
  return {
    code: ErrorCode.NOT_FOUND,
    message: `${resourceType} not found`,
    details: {
      resourceType,
      resourceId,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a service error
 */
export function createServiceError(
  code:
    | ErrorCode.LIVEKIT_ERROR
    | ErrorCode.TRANSCRIPTION_ERROR
    | ErrorCode.LLM_ERROR
    | ErrorCode.STORAGE_ERROR
    | ErrorCode.DATABASE_ERROR
    | ErrorCode.EVENT_STORE_ERROR,
  message: string,
  requestId: string,
  retryable: boolean = false,
  serviceMessage?: string
): ServiceError {
  return {
    code,
    message,
    details: {
      retryable,
      serviceMessage,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a generic API error
 */
export function createApiError(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    code,
    message,
    details,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if error is a validation error
 */
export function isValidationError(error: ApiError): error is ValidationError {
  return error.code === ErrorCode.VALIDATION_ERROR;
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: ApiError): error is NotFoundError {
  return error.code === ErrorCode.NOT_FOUND;
}

/**
 * Check if error is a service error
 */
export function isServiceError(error: ApiError): error is ServiceError {
  return [
    ErrorCode.LIVEKIT_ERROR,
    ErrorCode.TRANSCRIPTION_ERROR,
    ErrorCode.LLM_ERROR,
    ErrorCode.STORAGE_ERROR,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.EVENT_STORE_ERROR,
  ].includes(error.code);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  if (isServiceError(error)) {
    return error.details?.retryable ?? false;
  }
  return false;
}

// ============================================================================
// HTTP STATUS CODE MAPPING
// ============================================================================

/**
 * Maps error codes to HTTP status codes
 */
export function getStatusCodeForError(code: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    // Client errors (4xx)
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.INTERVIEW_ALREADY_STARTED]: 409,
    [ErrorCode.INTERVIEW_NOT_READY]: 400,
    [ErrorCode.INTERVIEW_COMPLETED]: 400,
    [ErrorCode.TRANSCRIPT_NOT_READY]: 400,
    [ErrorCode.AXIOM_SET_NOT_FOUND]: 404,
    [ErrorCode.INSUFFICIENT_QUOTA]: 402,
    [ErrorCode.VIDEO_GENERATION_FAILED]: 500,
    [ErrorCode.INVALID_QUALITY_TIER]: 400,
    [ErrorCode.VIDEO_TIMEOUT]: 504,
    [ErrorCode.ORGANIZATION_NOT_FOUND]: 404,
    [ErrorCode.TEAM_NOT_FOUND]: 404,
    [ErrorCode.NOT_ORGANIZATION_MEMBER]: 403,
    [ErrorCode.NOT_TEAM_MEMBER]: 403,
    [ErrorCode.PROJECT_NOT_FOUND]: 404,
    [ErrorCode.PROJECT_ALREADY_ASSIGNED]: 409,
    [ErrorCode.PROJECT_NOT_ASSIGNED]: 400,
    [ErrorCode.CHARACTER_NOT_FOUND]: 404,
    [ErrorCode.INVALID_CHARACTER_DATA]: 400,

    // Server errors (5xx)
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.LIVEKIT_ERROR]: 503,
    [ErrorCode.TRANSCRIPTION_ERROR]: 503,
    [ErrorCode.LLM_ERROR]: 503,
    [ErrorCode.STORAGE_ERROR]: 503,
    [ErrorCode.DATABASE_ERROR]: 503,
    [ErrorCode.EVENT_STORE_ERROR]: 503,
  };

  return statusMap[code] || 500;
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Get user-friendly error message for error code
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  const messageMap: Record<ErrorCode, string> = {
    // Client errors
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
    [ErrorCode.FORBIDDEN]: "You don't have permission to perform this action.",
    [ErrorCode.CONFLICT]: 'This action conflicts with existing data. Please refresh and try again.',
    [ErrorCode.INTERVIEW_ALREADY_STARTED]: 'This interview has already been started.',
    [ErrorCode.INTERVIEW_NOT_READY]: 'This interview is not ready to start.',
    [ErrorCode.INTERVIEW_COMPLETED]: 'This interview has already been completed.',
    [ErrorCode.TRANSCRIPT_NOT_READY]: 'The transcript is not ready yet.',
    [ErrorCode.AXIOM_SET_NOT_FOUND]: 'The specified axiom set was not found.',
    [ErrorCode.INSUFFICIENT_QUOTA]: 'You have insufficient quota for this operation. Please upgrade your plan.',
    [ErrorCode.VIDEO_GENERATION_FAILED]: 'Video generation failed. Please try again.',
    [ErrorCode.INVALID_QUALITY_TIER]: 'Invalid quality tier selected.',
    [ErrorCode.VIDEO_TIMEOUT]: 'Video processing timed out. Please try again.',
    [ErrorCode.ORGANIZATION_NOT_FOUND]: 'Organization not found.',
    [ErrorCode.TEAM_NOT_FOUND]: 'Team not found.',
    [ErrorCode.NOT_ORGANIZATION_MEMBER]: 'You are not a member of this organization.',
    [ErrorCode.NOT_TEAM_MEMBER]: 'You are not a member of this team.',
    [ErrorCode.PROJECT_NOT_FOUND]: 'Project not found.',
    [ErrorCode.PROJECT_ALREADY_ASSIGNED]: 'This project is already assigned to a team.',
    [ErrorCode.PROJECT_NOT_ASSIGNED]: 'This project is not assigned to any team.',
    [ErrorCode.CHARACTER_NOT_FOUND]: 'Character not found.',
    [ErrorCode.INVALID_CHARACTER_DATA]: 'Invalid character data provided.',

    // Server errors
    [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
    [ErrorCode.LIVEKIT_ERROR]: 'Video service error. Please try again.',
    [ErrorCode.TRANSCRIPTION_ERROR]: 'Transcription service error. Please try again.',
    [ErrorCode.LLM_ERROR]: 'AI service error. Please try again.',
    [ErrorCode.STORAGE_ERROR]: 'Storage service error. Please try again.',
    [ErrorCode.DATABASE_ERROR]: 'Database error. Please try again.',
    [ErrorCode.EVENT_STORE_ERROR]: 'Event store error. Please try again.',
  };

  return messageMap[code] || 'An unexpected error occurred. Please try again.';
}
