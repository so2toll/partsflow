-- Migration: Add unique constraint for relationships
-- Date: 2026-05-01
-- Description: Prevents duplicate relationships between the same nodes
--
-- This ensures that you can't have two MEMBER_OF, WORKS_ON, HAS_ACCESS, etc.
-- relationships between the same pair of nodes.

-- Add unique index on relationships to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_relationships_unique
ON relationships(from_node_id, to_node_id, type);

-- Note: If you have existing duplicate relationships, you'll need to clean them up first:
--
-- Find duplicates:
-- SELECT from_node_id, to_node_id, type, COUNT(*) as count
-- FROM relationships
-- GROUP BY from_node_id, to_node_id, type
-- HAVING COUNT(*) > 1;
--
-- Delete duplicates (keep the first one):
-- DELETE FROM relationships
-- WHERE rowid NOT IN (
--   SELECT MIN(rowid)
--   FROM relationships
--   GROUP BY from_node_id, to_node_id, type
-- );
