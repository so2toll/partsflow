-- Migration: Remove betterAuthId field from User nodes
-- Date: 2026-05-01
-- Description: Removes the betterAuthId field now that global_id is the primary identifier

-- Verify current state (check for users with betterAuthId)
SELECT
  'Users with betterAuthId:' as check_type;
SELECT
  json_extract(properties, '$.email') as email,
  json_extract(properties, '$.betterAuthId') as betterAuthId
FROM nodes
WHERE label = 'User'
AND json_extract(properties, '$.betterAuthId') IS NOT NULL;

-- Remove betterAuthId field from all User nodes
UPDATE nodes
SET properties = json_remove(properties, '$.betterAuthId')
WHERE label = 'User';

-- Verify removal
SELECT
  'Users after removal:' as check_type;
SELECT
  json_extract(properties, '$.email') as email,
  json_extract(properties, '$.id') as id,
  json_extract(properties, '$.role') as role
FROM nodes
WHERE label = 'User';
