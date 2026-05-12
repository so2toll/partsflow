-- Migration: Add global_id column to auth.db
-- Date: 2026-05-01
-- Description: Adds global_id column to user table for unified ID system

-- Add global_id column (can be NULL initially)
ALTER TABLE user ADD COLUMN global_id TEXT;

-- Create unique index on global_id
CREATE UNIQUE INDEX idx_user_global_id ON user(global_id);

-- Verify the column was added
PRAGMA table_info(user);
