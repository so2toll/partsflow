/**
 * Feature flag utilities for auth provider switching
 * Allows non-destructive migration between Xano and Better Auth
 */

export type AuthProvider = 'xano' | 'better-auth';

/**
 * Get the current auth provider from environment variable
 * Defaults to 'xano' if not set
 */
export function getAuthProvider(): AuthProvider {
  const provider = import.meta.env.AUTH_PROVIDER || process.env.AUTH_PROVIDER;
  if (provider === 'better-auth') {
    return 'better-auth';
  }
  return 'xano';
}

/**
 * Check if Xano auth is the current provider
 */
export const isXanoAuth = (): boolean => getAuthProvider() === 'xano';

/**
 * Check if Better Auth is the current provider
 */
export const isBetterAuth = (): boolean => getAuthProvider() === 'better-auth';

/**
 * Get the login URL based on the current auth provider
 */
export function getLoginUrl(): string {
  return isBetterAuth() ? '/auth/login/' : '/log-in/';
}

/**
 * Get the register URL based on the current auth provider
 */
export function getRegisterUrl(): string {
  return isBetterAuth() ? '/auth/register/' : '/sign-up/';
}

/**
 * Get the logout URL based on the current auth provider
 */
export function getLogoutUrl(): string {
  return isBetterAuth() ? '/auth/logout/' : '/logout/';
}
