/**
 * Unified session adapter for both auth systems
 * Provides consistent session interface regardless of auth provider
 */

import Iron from "@hapi/iron";
import { auth } from "./auth";
import { getAuthProvider, isBetterAuth, isXanoAuth } from "./feature-flag";
import { COOKIE_NAME } from "../constants/constants.js";

// Better Auth cookie name
const BETTER_AUTH_COOKIE = "better-auth.session_token";

/**
 * Unified session shape returned by the adapter
 */
export interface UnifiedSession {
  user: {
    id: string;
    global_id?: string; // App database ULID - primary identifier for app operations
    email: string;
    name?: string;
    role: string;
    organizationId?: string;
  };
  provider: "xano" | "better-auth";
}

/**
 * Get session from Xano auth system
 */
async function getXanoSession(
  cookies: AstroCookies
): Promise<UnifiedSession | null> {
  const cookieValue = cookies.get(COOKIE_NAME)?.value;

  if (!cookieValue) {
    return null;
  }

  try {
    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    if (!TOKEN_SECRET) {
      console.error("TOKEN_SECRET not set");
      return null;
    }

    const decrypted = await Iron.unseal(cookieValue, TOKEN_SECRET, Iron.defaults);

    // Xano session shape from check/index.astro
    const sessionData = decrypted as {
      message?: {
        authStatus?: string;
        email?: string;
        name?: string;
        role?: string;
        id?: string;
        xano_id?: string;
      };
    };

    if (!sessionData?.message?.email) {
      return null;
    }

    return {
      user: {
        id: sessionData.message.id || sessionData.message.xano_id || "",
        email: sessionData.message.email,
        name: sessionData.message.name,
        role: sessionData.message.role || "Unverified",
        organizationId: sessionData.message.organizationId,
      },
      provider: "xano",
    };
  } catch (error) {
    console.error("Error decrypting Xano session:", error);
    return null;
  }
}

/**
 * Get session from Better Auth system
 */
async function getBetterAuthSession(
  request: Request
): Promise<UnifiedSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return null;
    }

    const user = session.user as any;
    // Use global_id if available, otherwise fall back to id for backward compatibility
    const primaryId = user.global_id || user.id;

    return {
      user: {
        id: user.id, // Keep Better Auth's internal id for reference
        global_id: user.global_id, // App database ULID - primary identifier
        email: user.email,
        name: user.name || undefined,
        role: user.role || "Unverified",
        organizationId: user.organizationId,
      },
      provider: "better-auth",
    };
  } catch (error) {
    console.error("Error getting Better Auth session:", error);
    return null;
  }
}

/**
 * Type for Astro cookies interface
 */
interface AstroCookies {
  get(name: string): { value: string } | undefined;
  delete(name: string, options?: any): void;
  set(name: string, value: string, options?: any): void;
}

/**
 * Get the current session regardless of auth provider
 * Returns unified session shape for consistent usage
 */
export async function getSession(
  request: Request,
  cookies: AstroCookies
): Promise<UnifiedSession | null> {
  if (isBetterAuth()) {
    return getBetterAuthSession(request);
  }
  return getXanoSession(cookies);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(
  request: Request,
  cookies: AstroCookies
): Promise<boolean> {
  const session = await getSession(request, cookies);
  return session !== null;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  request: Request,
  cookies: AstroCookies,
  role: string
): Promise<boolean> {
  const session = await getSession(request, cookies);
  if (!session) return false;
  return session.user.role.toLowerCase() === role.toLowerCase();
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(
  request: Request,
  cookies: AstroCookies,
  roles: string[]
): Promise<boolean> {
  const session = await getSession(request, cookies);
  if (!session) return false;
  const userRole = session.user.role.toLowerCase();
  return roles.some((r) => r.toLowerCase() === userRole);
}

/**
 * Get the current auth provider being used
 */
export { getAuthProvider };
