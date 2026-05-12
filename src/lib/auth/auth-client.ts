/**
 * Better Auth client-side helper
 * Only used when AUTH_PROVIDER=better-auth
 */

import { createAuthClient } from "better-auth/react";

// Create the auth client for client-side operations
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000",
});

// Export commonly used functions
export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  return authClient.signIn.email({
    email,
    password,
  });
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  name: string
) {
  return authClient.signUp.email({
    email,
    password,
    name,
  });
}

/**
 * Sign out the current user
 */
export async function logout() {
  return authClient.signOut();
}

/**
 * Get the current session (if any)
 */
export async function getClientSession() {
  return authClient.getSession();
}

// ============================================================================
// Organization Helper Functions (Client-side)
// ============================================================================

/**
 * Get the organization ID from the current session
 * @returns Organization ID or null
 */
export async function getUserOrganizationId(): Promise<string | null> {
  const session = await getClientSession();
  return session?.user?.organizationId || null;
}

/**
 * Get the user's role from the current session
 * @returns User role (Admin, User, Viewer) or null
 */
export async function getUserRole(): Promise<string | null> {
  const session = await getClientSession();
  return session?.user?.role || null;
}

/**
 * Check if current user is an Admin
 * @returns true if user is Admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await getClientSession();
  return session?.user?.role === "Admin";
}

/**
 * Check if current user can edit (not Viewer)
 * @returns true if user is Admin or User
 */
export async function canCurrentUserEdit(): Promise<boolean> {
  const session = await getClientSession();
  const role = session?.user?.role;
  return role === "Admin" || role === "User";
}
