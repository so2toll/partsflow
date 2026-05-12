/**
 * Client-Side Error Handler
 *
 * Provides utilities for handling errors on the client side.
 * Includes API error parsing, display, and reporting.
 *
 * @module lib/utils/errorHandler
 * @version 1.0.0
 */

import type { ApiError, ErrorCode } from '@/types/errors';
import { getUserFriendlyMessage } from '@/types/errors';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API response with potential error
 */
interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  details?: string;
  data?: T;
  [key: string]: unknown;
}

/**
 * Error display options
 */
interface ErrorDisplayOptions {
  /** Whether to show error details */
  showDetails?: boolean;
  /** Custom error message */
  customMessage?: string;
  /** Callback for error reporting */
  onError?: (error: ApiError) => void;
  /** Whether to show toast notification */
  showToast?: boolean;
  /** Toast duration in milliseconds */
  toastDuration?: number;
}

// ============================================================================
// ERROR PARSING
// ============================================================================

/**
 * Parse API response error
 */
export function parseApiError(response: ApiResponse): ApiError | null {
  // Check if response has error field
  if (!response.error && response.success !== false) {
    return null;
  }

  // Generate request ID for client-side errors
  const requestId = `CLIENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Try to parse structured error
  if (response.code && response.message && response.requestId) {
    return response as ApiError;
  }

  // Create error from simple error response
  return {
    code: (response.code as ErrorCode) || 'INTERNAL_ERROR',
    message: response.error || 'An error occurred',
    details: response.details ? { details: response.details } : undefined,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract error message from API response
 */
export function getErrorMessage(response: ApiResponse): string {
  const apiError = parseApiError(response);

  if (!apiError) {
    return 'An unexpected error occurred';
  }

  // Return user-friendly message if available
  return getUserFriendlyMessage(apiError.code) || apiError.message;
}

// ============================================================================
// ERROR DISPLAY
// ============================================================================

/**
 * Display error to user
 */
export function displayError(
  error: ApiError | ApiResponse | Error | string,
  options: ErrorDisplayOptions = {}
): void {
  const {
    showDetails = false,
    customMessage,
    onError,
    showToast = true,
    toastDuration = 5000,
  } = options;

  // Normalize error
  let apiError: ApiError;

  if (typeof error === 'string') {
    apiError = {
      code: 'INTERNAL_ERROR',
      message: error,
      requestId: `CLIENT_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  } else if (error instanceof Error) {
    apiError = {
      code: 'INTERNAL_ERROR',
      message: error.message,
      requestId: `CLIENT_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  } else if ('error' in error || 'code' in error) {
    const parsed = parseApiError(error as ApiResponse);
    apiError = parsed || {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred',
      requestId: `CLIENT_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  } else {
    apiError = error as ApiError;
  }

  // Get user-friendly message
  const userMessage = customMessage || getUserFriendlyMessage(apiError.code);

  // Log to console
  console.error('[ErrorHandler]', apiError);

  // Call error callback
  if (onError) {
    onError(apiError);
  }

  // Show toast notification
  if (showToast) {
    showToastNotification(userMessage, {
      duration: toastDuration,
      details: showDetails ? apiError : undefined,
    });
  }

  // Store error for support
  storeErrorForSupport(apiError);
}

/**
 * Show toast notification
 */
function showToastNotification(
  message: string,
  options: { duration?: number; details?: ApiError } = {}
): void {
  const { duration = 5000, details } = options;

  // Check if toast library is available
  if (typeof window !== 'undefined' && (window as any).toast) {
    (window as any).toast.error(message, {
      duration,
      details: details ? JSON.stringify(details, null, 2) : undefined,
    });
    return;
  }

  // Fallback: Simple alert (can be replaced with custom toast component)
  if (typeof window !== 'undefined') {
    // Create custom toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f56565;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Add CSS animations for custom toast
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================================
// ERROR STORAGE
// ============================================================================

/**
 * Store error for support reference
 */
function storeErrorForSupport(error: ApiError): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    // Get existing errors
    const errorsJson = sessionStorage.getItem('recentErrors');
    const errors: ApiError[] = errorsJson ? JSON.parse(errorsJson) : [];

    // Add new error
    errors.unshift(error);

    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.pop();
    }

    // Store back
    sessionStorage.setItem('recentErrors', JSON.stringify(errors));
  } catch (e) {
    // Session storage might not be available
    console.warn('Failed to store error in sessionStorage:', e);
  }
}

/**
 * Get recent errors for support
 */
export function getRecentErrors(): ApiError[] {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }

  try {
    const errorsJson = sessionStorage.getItem('recentErrors');
    return errorsJson ? JSON.parse(errorsJson) : [];
  } catch (e) {
    console.warn('Failed to retrieve errors from sessionStorage:', e);
    return [];
  }
}

/**
 * Clear stored errors
 */
export function clearStoredErrors(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('recentErrors');
  }
}

// ============================================================================
// ERROR REPORTING
// ============================================================================

/**
 * Report error to monitoring service
 */
export function reportError(
  error: Error | ApiError,
  context?: {
    userId?: string;
    organizationId?: string;
    route?: string;
    [key: string]: unknown;
  }
): void {
  // Log to console
  console.error('[Error Reporting]', error, context);

  // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
  // Example: Sentry.captureException(error, { user: { id: context?.userId } });
}

/**
 * Create error boundary fallback component props
 */
export function createErrorBoundaryProps(error: Error): {
  title: string;
  message: string;
  error: Error;
} {
  return {
    title: 'Something went wrong',
    message: getUserFriendlyMessage('INTERNAL_ERROR'),
    error,
  };
}

// ============================================================================
// FETCH WRAPPER
// ============================================================================

/**
 * Wrapper around fetch with automatic error handling
 */
export async function fetchWithErrorHandling<T = unknown>(
  url: string,
  options?: RequestInit,
  errorOptions?: ErrorDisplayOptions
): Promise<T> {
  try {
    const response = await fetch(url, options);

    // Check if response is ok
    if (!response.ok) {
      // Try to parse error from response
      let apiResponse: ApiResponse;

      try {
        apiResponse = await response.json();
      } catch (e) {
        // If not JSON, create generic error
        apiResponse = {
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Display error
      displayError(apiResponse, errorOptions);

      // Throw error
      throw new Error(getErrorMessage(apiResponse));
    }

    // Parse and return response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Display error if not already displayed
    if (!(error instanceof Error && error.message.includes('HTTP'))) {
      displayError(error as Error, errorOptions);
    }

    throw error;
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if value is an ApiError
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'requestId' in value
  );
}

/**
 * Check if fetch response is an error
 */
export function isErrorResponse(response: ApiResponse): boolean {
  return !response.success || !!response.error;
}
