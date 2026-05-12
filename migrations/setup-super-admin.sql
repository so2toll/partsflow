-- Migration: Set up System SuperAdmin
-- Date: 2026-05-01
-- Description: Sets steventester1234@gmail.com as System SuperAdmin

-- Update user to be SuperAdmin with no organization (exists outside org structure)
UPDATE nodes
SET properties = json_set(
  properties,
  '$.role',
  'SuperAdmin'
),
properties = json_set(
  properties,
  '$.organizationId',
  NULL
)
WHERE label = 'User'
AND json_extract(properties, '$.email') = 'steventester1234@gmail.com';

-- Verify the update
SELECT
  id,
  json_extract(properties, '$.email') as email,
  json_extract(properties, '$.name') as name,
  json_extract(properties, '$.role') as role,
  json_extract(properties, '$.organizationId') as organizationId
FROM nodes
WHERE label = 'User'
AND json_extract(properties, '$.email') = 'steventester1234@gmail.com';
