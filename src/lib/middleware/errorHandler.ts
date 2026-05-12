/**
 * Error Handling Middleware
 *
 * Provides standardized error handling for API routes.
 * Catches errors, logs them, and returns consistent error responses.
 *
 * Features:
 * - Wraps API route handlers with error handling
 * - Generates unique request IDs for tracing
 * - Maps errors to appropriate HTTP status codes
 * - Logs errors with context for debugging
 * - Returns standardized error responses
 *
 * @module lib/middleware/errorHandler
 * @version 1.0.0
 */

import type { APIRoute } from 'astro';
import type { AstroCookies } from 'astro';
import {
  ErrorCode,
  type ApiError,
  createValidationError,
  createNotFoundError,
  createServiceError,
  createApiError,
} from '@/types/errors';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Error handler context
 */
interface ErrorHandlerContext {
  /** Request object */
  request: Request;
  /** Cookies object */
  cookies: AstroCookies;
  /** Request ID for tracing */
  requestId: string;
  /** Timestamp of request */
  timestamp: string;
}

/**
 * Known application error types
 */
interface AppError extends Error {
  /** Error code for programmatic handling */
  code?: ErrorCode | string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Whether error should be logged */
  logLevel?: 'error' | 'warn' | 'info';
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

/**
 * Maps error codes to HTTP status codes
 */
const ERROR_CODE_TO_STATUS: Record<ErrorCode, number> = {
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

  // Server errors (5xx)
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.LIVEKIT_ERROR]: 503,
  [ErrorCode.TRANSCRIPTION_ERROR]: 503,
  [ErrorCode.LLM_ERROR]: 503,
  [ErrorCode.STORAGE_ERROR]: 503,
  [ErrorCode.DATABASE_ERROR]: 503,
  [ErrorCode.EVENT_STORE_ERROR]: 503,
};

/**
 * Maps common error patterns to error codes
 */
function mapErrorToCode(error: Error): ErrorCode {
  const message = error.message.toLowerCase();

  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCode.VALIDATION_ERROR;
  }

  // Not found errors
  if (message.includes('not found') || message.includes('does not exist')) {
    return ErrorCode.NOT_FOUND;
  }

  // Authorization errors
  if (message.includes('unauthorized') || message.includes('not authenticated')) {
    return ErrorCode.UNAUTHORIZED;
  }

  // Permission errors
  if (message.includes('forbidden') || message.includes('not authorized') || message.includes('permission')) {
    return ErrorCode.FORBIDDEN;
  }

  // Conflict errors
  if (message.includes('conflict') || message.includes('already exists') || message.includes('duplicate')) {
    return ErrorCode.CONFLICT;
  }

  // Database errors
  if (message.includes('database') || message.includes('db') || message.includes('query')) {
    return ErrorCode.DATABASE_ERROR;
  }

  // Storage errors
  if (message.includes('storage') || message.includes('s3') || message.includes('upload')) {
    return ErrorCode.STORAGE_ERROR;
  }

  // Service errors
  if (message.includes('livekit') || message.includes('transcription') || message.includes('llm')) {
    return ErrorCode.INTERNAL_ERROR;
  }

  // Default to internal error
  return ErrorCode.INTERNAL_ERROR;
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log error with context for debugging
 */
function logError(error: Error, context: ErrorHandlerContext, statusCode: number): void {
  const logLevel = (error as AppError).logLevel || 'error';
  const logMessage = `[${context.requestId}] ${error.name}: ${error.message}`;

  const logData = {
    requestId: context.requestId,
    timestamp: context.timestamp,
    url: context.request.url,
    method: context.request.method,
    statusCode,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as AppError).code,
    },
  };

  // Log at appropriate level
  if (logLevel === 'error') {
    console.error(logMessage, logData);
  } else if (logLevel === 'warn') {
    console.warn(logMessage, logData);
  } else {
    console.info(logMessage, logData);
  }

  // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
  // Example: Sentry.captureException(error, { tags: { requestId: context.requestId } });
}

// ============================================================================
// ERROR RESPONSE CREATION
// ============================================================================

/**
 * Create standardized error response
 */
function createErrorResponse(
  error: Error,
  context: ErrorHandlerContext
): { status: number; body: ApiError } {
  // Determine error code and status
  const appError = error as AppError;
  let errorCode = appError.code as ErrorCode;
  let statusCode = appError.statusCode;

  // If no explicit code, map from error message
  if (!errorCode) {
    errorCode = mapErrorToCode(error);
  }

  // If no explicit status, map from error code
  if (!statusCode) {
    statusCode = ERROR_CODE_TO_STATUS[errorCode] || 500;
  }

  // Log the error
  logError(error, context, statusCode);

  // Create error response based on error code
  let apiError: ApiError;

  switch (errorCode) {
    case ErrorCode.VALIDATION_ERROR:
      apiError = createValidationError(
        appError.details?.validationErrors as any[] || [],
        context.requestId
      );
      break;

    case ErrorCode.NOT_FOUND:
      apiError = createNotFoundError(
        appError.details?.resourceType as string || 'Resource',
        appError.details?.resourceId as string || 'unknown',
        context.requestId
      );
      break;

    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.LIVEKIT_ERROR:
    case ErrorCode.TRANSCRIPTION_ERROR:
    case ErrorCode.LLM_ERROR:
    case ErrorCode.STORAGE_ERROR:
    case ErrorCode.EVENT_STORE_ERROR:
      apiError = createServiceError(
        errorCode as any,
        error.message,
        context.requestId,
        appError.details?.retryable as boolean || false,
        appError.details?.serviceMessage as string
      );
      break;

    default:
      apiError = createApiError(
        errorCode,
        error.message,
        context.requestId,
        appError.details
      );
  }

  return { status: statusCode, body: apiError };
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Wrap an API route handler with error handling
 *
 * @example
 * ```ts
 * export const GET = withErrorHandler(async ({ request, cookies }) => {
 *   // Your route logic here
 *   return new Response(JSON.stringify({ success: true }));
 * });
 * ```
 */
export function withErrorHandler(
  handler: (context: ErrorHandlerContext & Parameters<APIRoute>[0]) => Promise<Response> | Response
): APIRoute {
  return async (context) => {
    // Generate unique request ID
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();

    const errorContext: ErrorHandlerContext = {
      request: context.request,
      cookies: context.cookies,
      requestId,
      timestamp,
    };

    try {
      // Execute the route handler
      return await handler({ ...context, ...errorContext });
    } catch (error) {
      // Handle the error
      if (error instanceof Error) {
        const { status, body } = createErrorResponse(error, errorContext);

        return new Response(JSON.stringify(body), {
          status,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
          },
        });
      }

      // Handle non-Error errors
      const unknownError = new Error(String(error));
      const { status, body } = createErrorResponse(unknownError, errorContext);

      return new Response(JSON.stringify(body), {
        status,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
      });
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Throw a standardized validation error
 */
export function throwValidationError(
  field: string,
  message: string,
  value?: unknown,
  expected?: string
): never {
  const error = new Error(message) as AppError;
  error.code = ErrorCode.VALIDATION_ERROR;
  error.statusCode = 400;
  error.details = {
    validationErrors: [
      {
        field,
        message,
        value,
        expected,
      },
    ],
  };
  throw error;
}

/**
 * Throw a standardized not found error
 */
export function throwNotFoundError(
  resourceType: string,
  resourceId: string
): never {
  const error = new Error(`${resourceType} not found`) as AppError;
  error.code = ErrorCode.NOT_FOUND;
  error.statusCode = 404;
  error.details = {
    resourceType,
    resourceId,
  };
  throw error;
}

/**
 * Throw a standardized forbidden error
 */
export function throwForbiddenError(message: string): never {
  const error = new Error(message) as AppError;
  error.code = ErrorCode.FORBIDDEN;
  error.statusCode = 403;
  throw error;
}

/**
 * Throw a standardized unauthorized error
 */
export function throwUnauthorizedError(message: string = 'Unauthorized'): never {
  const error = new Error(message) as AppError;
  error.code = ErrorCode.UNAUTHORIZED;
  error.statusCode = 401;
  throw error;
}

/**
 * Throw a standardized conflict error
 */
export function throwConflictError(message: string): never {
  const error = new Error(message) as AppError;
  error.code = ErrorCode.CONFLICT;
  error.statusCode = 409;
  throw error;
}

/**
 * Throw a standardized service error
 */
export function throwServiceError(
  code: ErrorCode,
  message: string,
  retryable: boolean = false
): never {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = ERROR_CODE_TO_STATUS[code] || 503;
  error.details = {
    retryable,
  };
  throw error;
}

// ============================================================================
// REQUEST VALIDATION HELPERS
// ============================================================================

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    throwValidationError(
      missingFields[0],
      `Missing required field(s): ${missingFields.join(', ')}`,
      undefined,
      `string | number | boolean`
    );
  }
}

/**
 * Validate field type
 */
export function validateFieldType(
  body: Record<string, unknown>,
  field: string,
  expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array'
): void {
  const value = body[field];

  if (value === undefined || value === null) {
    return; // Skip validation for missing fields
  }

  let isValid = false;

  switch (expectedType) {
    case 'string':
      isValid = typeof value === 'string';
      break;
    case 'number':
      isValid = typeof value === 'number' && !isNaN(value);
      break;
    case 'boolean':
      isValid = typeof value === 'boolean';
      break;
    case 'object':
      isValid = typeof value === 'object' && !Array.isArray(value);
      break;
    case 'array':
      isValid = Array.isArray(value);
      break;
  }

  if (!isValid) {
    throwValidationError(
      field,
      `Field must be of type ${expectedType}`,
      value,
      expectedType
    );
  }
}

/**
 * Validate enum value
 */
export function validateEnumValue<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowedValues: readonly T[]
): void {
  const value = body[field];

  if (value === undefined || value === null) {
    return; // Skip validation for missing fields
  }

  if (!allowedValues.includes(value as T)) {
    throwValidationError(
      field,
      `Field must be one of: ${allowedValues.join(', ')}`,
      value,
      allowedValues.join(' | ')
    );
  }
}
