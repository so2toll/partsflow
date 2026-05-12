-- ============================================================================
-- Graph Schema Migration
-- ============================================================================
--
-- Creates the base tables for graph storage in SQLite/Turso.
-- This enables the GraphDB abstraction layer to store graph data
-- as SQL tables.
--
-- Run this migration against your database before using the graph layer.
--
-- Local: sqlite3 data/app.db < migrations/create_graph_schema.sql
-- Turso: turso db execute <database-name> -f migrations/create_graph_schema.sql
--
-- ============================================================================

-- Nodes table
-- Stores all graph nodes with labels and properties (JSON)
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  properties TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common node queries
CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label);
CREATE INDEX IF NOT EXISTS idx_nodes_created_at ON nodes(created_at);

-- Relationships table
-- Stores all graph relationships between nodes
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  properties TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (from_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (to_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- Indexes for common relationship queries
CREATE INDEX IF NOT EXISTS idx_relationships_from_node ON relationships(from_node_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to_node ON relationships(to_node_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type);
CREATE INDEX IF NOT EXISTS idx_relationships_created_at ON relationships(created_at);

-- Composite index for relationship traversals
CREATE INDEX IF NOT EXISTS idx_relationships_from_type ON relationships(from_node_id, type);
CREATE INDEX IF NOT EXISTS idx_relationships_to_type ON relationships(to_node_id, type);

-- ============================================================================
-- Example Data (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing the graph explorer

-- -- Sample Video
-- INSERT INTO nodes (id, label, properties) VALUES (
--   'vid_sample_001',
--   'Video',
--   json_object(
--     'title', 'Sample Video',
--     'url', 'https://example.com/sample.mp4',
--     'duration', 120,
--     'createdAt', datetime('now'),
--     'updatedAt', datetime('now')
--   )
-- );

-- -- Sample Scene
-- INSERT INTO nodes (id, label, properties) VALUES (
--   'scn_sample_001',
--   'Scene',
--   json_object(
--     'videoId', 'vid_sample_001',
--     'startTime', 0,
--     'endTime', 30,
--     'description', 'Opening scene',
--     'orderIndex', 1,
--     'createdAt', datetime('now')
--   )
-- );

-- -- Sample Detection
-- INSERT INTO nodes (id, label, properties) VALUES (
--   'det_sample_001',
--   'Detection',
--   json_object(
--     'sceneId', 'scn_sample_001',
--     'label', 'person',
--     'confidence', 0.95,
--     'boundingBox', json_object('x', 100, 'y', 150, 'width', 200, 'height', 300),
--     'timestamp', 5.2,
--     'metadata', json_object('model', 'yolov8', 'version', '1.0')
--   )
-- );

-- -- Sample AI Model
-- INSERT INTO nodes (id, label, properties) VALUES (
--   'mdl_sample_001',
--   'AIModel',
--   json_object(
--     'name', 'YOLOv8',
--     'version', '1.0',
--     'type', 'object_detection',
--     'createdAt', datetime('now')
--   )
-- );

-- -- Relationships
-- INSERT INTO relationships (id, from_node_id, to_node_id, type, properties) VALUES
-- ('rel_vid_scn_001', 'vid_sample_001', 'scn_sample_001', 'HAS_SCENE', json_object('order', 1)),
-- ('rel_scn_det_001', 'scn_sample_001', 'det_sample_001', 'HAS_DETECTION', json_object('confidence', 0.95)),
-- ('rel_vid_mdl_001', 'vid_sample_001', 'mdl_sample_001', 'PROCESSED_BY', '{}');
