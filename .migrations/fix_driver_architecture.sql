-- Migration: Fix Driver Architecture
-- Date: 2026-05-13
-- Description: Update driver records to use clean auth roles (User) with workerType in app.db
--
-- This fixes the architecture where:
-- - auth.db should only have roles: SuperAdmin | User
-- - app.db should have User.workerType for worker classification
-- - Driver operational data stays in separate Driver node

-- ============================================
-- STEP 1: Fix auth.db (change Driver role to User)
-- ============================================

-- Get the driver user IDs first
-- SELECT id, email FROM user WHERE role = 'Driver';

-- Update driver roles to "User" in auth.db
UPDATE user
SET role = 'User'
WHERE role = 'Driver';

-- Verify
-- SELECT id, email, role FROM user WHERE email LIKE '%driver%';

-- ============================================
-- STEP 2: Fix app.db User node (add workerType property)
-- ============================================

-- First, let's see what we have
-- SELECT id, properties FROM nodes WHERE label = 'Driver';

-- Option A: If Driver nodes exist, we need to:
-- 1. Create User nodes with workerType: 'Driver'
-- 2. Move Driver node properties to a new Driver operational node
-- 3. Create IS_DRIVER relationships

-- For the test driver, assuming:
-- - Driver node id: drv_01KRH9QMNWFHY5EM9KKSKW7GNG
-- - No User node exists yet for this driver

-- Create User node with workerType if it doesn't exist
INSERT OR IGNORE INTO nodes (id, label, properties)
VALUES (
  'user_01KRH9QMNPRRP2RM9EE71AQ45T',
  'User',
  json_object(
    'id', 'user_01KRH9QMNPRRP2RM9EE71AQ45T',
    'workerType', 'Driver',
    'createdAt', datetime('now'),
    'updatedAt', datetime('now')
  )
);

-- Update existing User node to add workerType
UPDATE nodes
SET properties = json_set(
  properties,
  '$.workerType',
  'Driver'
)
WHERE id = 'user_01KRH9QMNPRRP2RM9EE71AQ45T'
  AND label = 'User';

-- ============================================
-- STEP 3: Verify the relationships
-- ============================================

-- Check that IS_DRIVER relationship exists
-- SELECT * FROM relationships
-- WHERE from_node = 'user_01KRH9QMNPRRP2RM9EE71AQ45T'
--   AND to_node = 'drv_01KRH9QMNWFHY5EM9KKSKW7GNG'
--   AND type = 'IS_DRIVER';

-- If relationship doesn't exist, create it
INSERT OR IGNORE INTO relationships (from_node, to_node, type, properties)
VALUES (
  'user_01KRH9QMNPRRP2RM9EE71AQ45T',
  'drv_01KRH9QMNWFHY5EM9KKSKW7GNG',
  'IS_DRIVER',
  json_object('createdAt', datetime('now'))
);

-- ============================================
-- CLEANUP: Remove any Driver label nodes that shouldn't exist
-- ============================================

-- NOTE: Do NOT delete the operational Driver nodes (drv_*)
-- Only delete if there are Driver label nodes that are actually User nodes

-- After migration, all people should be User nodes:
-- - Users with workerType: 'ShopOwner', 'ShopManager', 'ShopTech'
-- - Users with workerType: 'Driver' (linked to operational Driver node)

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- All users should have role = 'User' in auth.db (except SuperAdmin)
-- SELECT id, email, role FROM user WHERE role NOT IN ('SuperAdmin', 'User');

-- All people in app.db should be User nodes
-- SELECT id, label, json_extract(properties, '$.workerType') as workerType
-- FROM nodes
-- WHERE label IN ('User', 'Driver')
-- ORDER BY label, id;

-- Check relationships
-- SELECT r.from_node, n1.label as from_label,
--        r.to_node, n2.label as to_label,
--        r.type, json_extract(r.properties, '$.role') as rel_role
-- FROM relationships r
-- JOIN nodes n1 ON r.from_node = n1.id
-- JOIN nodes n2 ON r.to_node = n2.id
-- WHERE r.type IN ('OWNS', 'IS_DRIVER', 'MEMBER_OF')
-- ORDER BY r.type, r.from_node;
