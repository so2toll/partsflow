-- Migration: Verify global_id sync between databases
-- Date: 2026-05-01
-- Description: Verifies all users have global_id in auth.db

-- Check for users without global_id (should return 0 rows)
SELECT 'Users without global_id:' as check_type;
SELECT email, name, role FROM user WHERE global_id IS NULL;

-- Check for duplicate global_ids (should return 0 rows)
SELECT 'Duplicate global_ids:' as check_type;
SELECT global_id, COUNT(*) as count FROM user GROUP BY global_id HAVING COUNT(*) > 1;

-- Show current state
SELECT 'Current state:' as check_type;
SELECT email, global_id, role FROM user ORDER BY email;

-- Verify against app.db (manual check needed)
-- Run this against app.db:
-- SELECT id, json_extract(properties, '$.email') as email FROM nodes WHERE label = 'User';
-- The id from app.db should match global_id in auth.db for each email
