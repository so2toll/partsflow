/**
 * Better Auth server configuration
 * Only used when AUTH_PROVIDER=better-auth
 *
 * Database:
 * - Local development: SQLite (./data/auth.db)
 * - Production/Vercel: Turso (set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN)
 */

import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import Database from "better-sqlite3";

/**
 * Build database connection based on environment
 * - If TURSO_DATABASE_URL is set, use Turso with LibsqlDialect
 * - Otherwise, use local SQLite (development)
 */
function buildDatabase() {
  const tursoUrl = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const tursoToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    console.log("[Auth] Using Turso database (LibsqlDialect)");
    // Better Auth accepts { dialect, type } directly for Turso
    return {
      dialect: new LibsqlDialect({
        url: tursoUrl,
        authToken: tursoToken,
      }),
      type: "sqlite" as const,
    };
  }

  console.log("[Auth] Using local SQLite database");
  // Local development: local SQLite file
  return new Database("./data/auth.db");
}

// Create auth instance
const authInstance = betterAuth({
  database: buildDatabase(),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true for production
    minPasswordLength: 8,
    // sendResetPassword: async ({ user, url }) => {
    //   // TODO: Implement password reset email
    //   // await resend.emails.send({
    //   //   from: 'noreply@yourdomain.com',
    //   //   to: user.email,
    //   //   subject: 'Reset your password',
    //   //   html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
    //   // });
    // },
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
        defaultValue: "User", // Valid roles: SuperAdmin | User (all non-superadmin are "User")
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

// ============================================================================
// Run migrations synchronously before exporting
// ============================================================================
// Better Auth will create tables automatically on first connection
// runMigrations is idempotent (CREATE TABLE IF NOT EXISTS)
// ============================================================================
let migrationsRan = false;
async function ensureMigrations() {
  if (migrationsRan) return;

  try {
    const ctx = await authInstance.$context;
    await ctx.runMigrations();
    migrationsRan = true;
    console.log("[Auth] ✅ Migrations run successfully");
  } catch (error) {
    console.error("[Auth] ❌ Migration error:", error);
    throw error;
  }
}

// Run migrations immediately when module loads
const migrationPromise = ensureMigrations();

// Export a promise that resolves to auth after migrations
export const auth = authInstance;

// Export types for use elsewhere
export type Session = typeof authInstance.$Infer.Session;
export type User = typeof authInstance.$Infer.Session.user;

// Export migration promise for awaiting in entry points
export { migrationPromise };

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
 * @returns true if user is Admin or User (includes Drivers who are "User" in auth.db)
 */
export function canEdit(session: Session | null): boolean {
  const role = session?.user?.role;
  return role === "Admin" || role === "User";
}

/**
 * Check if user has specific permission based on role
 * @param session User session
 * @param requiredRole Minimum required role (only SuperAdmin | User in auth.db)
 * @returns true if user has required role
 *
 * NOTE: Driver and other worker types are determined in app.db, not auth.db
 * Use app.db queries to check User.workerType or relationships for real roles
 */
export function hasRole(
  session: Session | null,
  requiredRole: "SuperAdmin" | "User"
): boolean {
  // Simple hierarchy: SuperAdmin > User
  // All other roles (Driver, ShopOwner, etc.) live in app.db
  const roleHierarchy = { SuperAdmin: 2, User: 1 };
  const userRole = session?.user?.role as "SuperAdmin" | "User" | undefined;

  if (!userRole) return false;

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

/**
 * Check if user is a Driver
 * @param session User session
 * @returns true if user is a Driver
 *
 * DEPRECATED: This now returns false since Drivers have role "User" in auth.db
 * Use app.db queries for driver detection:
 * - Check User.workerType === "Driver"
 * - Check if User -[IS_DRIVER]-> Driver relationship exists
 */
export function isDriver(session: Session | null): boolean {
  // Drivers are now "User" role in auth.db
  // Real driver detection happens in app.db via workerType or relationships
  return false;
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
