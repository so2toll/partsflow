-- ============================================================================
-- Legacy Event Infrastructure & Database Tables Cleanup
-- ============================================================================
-- Migration: 001_drop_legacy_tables
-- Date: 2026-05-03
-- Description: Drop 21 legacy database tables from old recruitment/interview
--              evaluation system. Current application is a Video AI Content
--              Studio with completely different functionality.
--
-- Tables to RETAIN (4 tables):
--   - user: User accounts
--   - session: User sessions
--   - account: OAuth accounts
--   - verification: Verification tokens
--
-- Tables to DROP (21 tables):
--   - candidates, interviews, question_turns, candidate_onboarding
--   - job_requisitions, recruitment_videos
--   - assessment_responses, assessment_evaluations, assessment_templates
--   - assessment_scenarios
--   - ab_tests, events, event_dead_letter_queue
--   - axiom_evaluations, axioms, axiom_sets
--   - alignment_events, alignment_batches
--   - partners, nodes, relationships
-- ============================================================================

BEGIN TRANSACTION;

-- Drop assessment-related tables (in dependency order)
DROP TABLE IF EXISTS assessment_evaluations;
DROP TABLE IF EXISTS assessment_responses;
DROP TABLE IF EXISTS assessment_scenarios;
DROP TABLE IF EXISTS assessment_templates;

-- Drop testing table
DROP TABLE IF EXISTS ab_tests;

-- Drop recruitment tables (in dependency order)
DROP TABLE IF EXISTS candidate_onboarding;
DROP TABLE IF EXISTS question_turns;
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS job_requisitions;
DROP TABLE IF EXISTS recruitment_videos;

-- Drop event sourcing tables
DROP TABLE IF EXISTS event_dead_letter_queue;
DROP TABLE IF EXISTS events;

-- Drop evaluation/axiom tables (in dependency order)
DROP TABLE IF EXISTS axiom_evaluations;
DROP TABLE IF EXISTS axiom_sets;
DROP TABLE IF EXISTS axioms;
DROP TABLE IF EXISTS alignment_batches;
DROP TABLE IF EXISTS alignment_events;

-- Drop partner and graph tables
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS nodes;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After migration, only these 4 tables should remain:
--   - account
--   - session
--   - user
--   - verification
-- ============================================================================

-- Verify remaining tables
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
