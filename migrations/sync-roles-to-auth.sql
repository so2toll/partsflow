-- Migration: Sync Roles from app.db to auth.db
-- Date: 2026-05-01
-- Description: Ensures roles in Better Auth (auth.db) match app.db
--
-- This script queries app.db for all users and their roles,
-- then updates auth.db to match.

-- Step 1: View current state in app.db
SELECT
  'app.db' as database,
  json_extract(properties, '$.email') as email,
  json_extract(properties, '$.name') as name,
  json_extract(properties, '$.role') as role,
  json_extract(properties, '$.organizationId') as organizationId
FROM nodes
WHERE label = 'User'
ORDER BY json_extract(properties, '$.email');

-- Step 2: For each user above, run the corresponding update on auth.db:
--
-- UPDATE user SET role = 'SuperAdmin' WHERE email = 'steventester1234@gmail.com';
-- UPDATE user SET role = 'User' WHERE email = 'steven.otu@gmail.com';
--
-- Or update all users in one go using a transaction:

-- Manual sync commands (run these in data/auth.db):
-- Note: These commands need to be run directly against auth.db

-- For steventester1234@gmail.com (SuperAdmin)
-- UPDATE user SET role = 'SuperAdmin', organizationId = NULL WHERE email = 'steventester1234@gmail.com';

-- For steven.otu@gmail.com (User)
-- UPDATE user SET role = 'User' WHERE email = 'steven.otu@gmail.com';
