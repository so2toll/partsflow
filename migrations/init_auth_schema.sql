-- ============================================================================
-- Better Auth Base Schema + Custom Fields
-- ============================================================================
--
-- Complete migration for Turso auth database.
-- Creates base Better Auth tables plus custom fields (global_id, organizationId).
--
-- Run: turso db shell partsflow-auth < migrations/init_auth_schema.sql
--
-- ============================================================================

-- ============================================================================
-- Base Better Auth Tables (created by Better Auth)
-- ============================================================================

-- User table
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  emailVerified INTEGER,
  image TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  -- Custom fields (PartsFlow extensions)
  role TEXT DEFAULT 'User',
  organizationId TEXT,
  global_id TEXT UNIQUE
);

-- Session table
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER,
  userId TEXT,
  token TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Account table (for OAuth providers)
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT,
  providerId TEXT,
  userId TEXT,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  expiresAt INTEGER,
  password TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Verification table
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT,
  value TEXT,
  expiresAt INTEGER,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- User indexes
CREATE UNIQUE INDEX IF NOT EXISTS user_email_key ON user(email);
CREATE INDEX IF NOT EXISTS user_global_id_idx ON user(global_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS session_userId_idx ON session(userId);
CREATE INDEX IF NOT EXISTS session_token_idx ON session(token);
CREATE INDEX IF NOT EXISTS session_expiresAt_idx ON session(expiresAt);

-- Account indexes
CREATE INDEX IF NOT EXISTS account_userId_idx ON account(userId);
CREATE INDEX IF NOT EXISTS account_provider_idx ON account(providerId, accountId);

-- Verification indexes
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
CREATE INDEX IF NOT EXISTS verification_expiresAt_idx ON verification(expiresAt);

-- ============================================================================
-- Complete
-- ============================================================================

-- Verify schema
.schema user
.schema session
.schema account
.schema verification
