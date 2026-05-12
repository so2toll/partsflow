/**
 * Better Auth server configuration
 * Only used when AUTH_PROVIDER=better-auth
 *
 * Database:
 * - Local development: SQLite (./data/auth.db)
 * - Production/Vercel: Turso (set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN)
 */

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import { initAuthDb } from "./init-auth-db";

// Initialize auth.db schema (ensures global_id and organizationId columns exist)
initAuthDb();

// Database path for local SQLite
const SQLITE_DB_PATH = "./data/auth.db";

/**
 * Get the appropriate database connection based on environment
 * - If TURSO_DATABASE_URL is set, use Turso (production/Vercel)
 * - Otherwise, use local SQLite (development)
 */
function getDatabase() {
  const tursoUrl = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const tursoToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    console.log("Using Turso database");
    return createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }

  console.log("Using local SQLite database");
  return new Database(SQLITE_DB_PATH);
}

export const auth = betterAuth({
  database: getDatabase(),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true for production
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 8, // 8 hours (matches existing Xano session)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "User", // Valid roles: SuperAdmin, Admin, User, Viewer
      },
      organizationId: {
        type: "string",
        required: false,
      },
      global_id: {
        type: "string",
        required: false,
        // This will be the app database ULID - the primary identifier for app operations
      },
    },
  },

  // Base URL for email links
  baseURL: import.meta.env.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // Secret for signing tokens
  secret: import.meta.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
});

// Export types for use elsewhere
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the organization ID from the current session
 * @param session User session
 * @returns Organization ID or null
 */
export function getUserOrg(session: Session | null): string | null {
  return session?.user?.organizationId || null;
}

/**
 * Get the user's role from the current session
 * @param session User session
 * @returns User role (Admin, User, Viewer) or null
 */
export function getUserRole(session: Session | null): string | null {
  return session?.user?.role || null;
}

/**
 * Check if user has Admin role
 * @param session User session
 * @returns true if user is Admin
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "Admin";
}

/**
 * Check if user has at least User role (not Viewer)
 * @param session User session
 * @returns true if user is Admin or User
 */
export function canEdit(session: Session | null): boolean {
  const role = session?.user?.role;
  return role === "Admin" || role === "User";
}

/**
 * Check if user has specific permission based on role
 * @param session User session
 * @param requiredRole Minimum required role
 * @returns true if user has required role
 */
export function hasRole(
  session: Session | null,
  requiredRole: "SuperAdmin" | "Admin" | "User" | "Viewer"
): boolean {
  const roleHierarchy = { SuperAdmin: 4, Admin: 3, User: 2, Viewer: 1 };
  const userRole = session?.user?.role as "SuperAdmin" | "Admin" | "User" | "Viewer" | undefined;

  if (!userRole) return false;

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

/**
 * Check if user is a System SuperAdmin
 * SuperAdmins have access to all organizations and can manage the entire system
 *
 * @param session User session
 * @returns true if user is SuperAdmin
 */
export function isSystemAdmin(session: Session | null): boolean {
  return session?.user?.role === "SuperAdmin";
}

/**
 * Check if user belongs to a specific organization
 * @param session User session
 * @param organizationId Organization ID to check
 * @returns true if user belongs to the organization
 */
export function belongsToOrganization(
  session: Session | null,
  organizationId: string
): boolean {
  return session?.user?.organizationId === organizationId;
}
