/**
 * ULID Utility for Data3D Expert Reasoning Engine
 *
 * Generates ULIDs (Universally Unique Lexicographically Sortable Identifiers)
 * with entity-specific prefixes for all domain entities.
 *
 * ULID Benefits:
 * - Lexicographically sortable (time-ordered)
 * - 128-bit compatible with UUID
 * - Case-insensitive, URL-safe
 * - No special characters
 * - Timestamp-based for chronological ordering
 *
 * @module lib/utils/ulid
 * @version 0.1.0
 */

import { ulid } from 'ulid';

/**
 * Entity prefixes for ID generation
 */
export const EntityPrefix = {
  CANDIDATE: 'cand',
  INTERVIEW: 'intv',
  QUESTION_TURN: 'turn',
  AXIOM_EVALUATION: 'eval',
  ALIGNMENT_EVENT: 'align',
  AXIOM: 'axiom',
  AXIOM_SET: 'aset',
  JOB_REQUISITION: 'job',
  PARTNER: 'part',
  USER: 'user',
  EVENT: 'evt',
} as const;

/**
 * Type for entity prefixes
 */
export type EntityPrefixType = typeof EntityPrefix[keyof typeof EntityPrefix];

/**
 * Generate a ULID with an entity-specific prefix
 *
 * @param prefix - Entity prefix (e.g., 'cand', 'intv', 'turn')
 * @returns Prefixed ULID string (e.g., 'cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 *
 * @example
 * ```typescript
 * const candidateId = generateId('cand');
 * // Returns: 'cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F'
 *
 * const interviewId = generateId(EntityPrefix.INTERVIEW);
 * // Returns: 'intv_01HQ3K5P7Y8X9Z0A1B2C3D4E5G'
 * ```
 */
export function generateId(prefix: string): string {
  return `${prefix}_${ulid()}`;
}

/**
 * Generate a candidate ID
 * @returns Candidate ID (e.g., 'cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateCandidateId(): string {
  return generateId(EntityPrefix.CANDIDATE);
}

/**
 * Generate an interview ID
 * @returns Interview ID (e.g., 'intv_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateInterviewId(): string {
  return generateId(EntityPrefix.INTERVIEW);
}

/**
 * Generate a question turn ID
 * @returns Question turn ID (e.g., 'turn_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateQuestionTurnId(): string {
  return generateId(EntityPrefix.QUESTION_TURN);
}

/**
 * Generate an axiom evaluation ID
 * @returns Axiom evaluation ID (e.g., 'eval_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateAxiomEvaluationId(): string {
  return generateId(EntityPrefix.AXIOM_EVALUATION);
}

/**
 * Generate an alignment event ID
 * @returns Alignment event ID (e.g., 'align_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateAlignmentEventId(): string {
  return generateId(EntityPrefix.ALIGNMENT_EVENT);
}

/**
 * Generate an axiom ID
 * @returns Axiom ID (e.g., 'axiom_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateAxiomId(): string {
  return generateId(EntityPrefix.AXIOM);
}

/**
 * Generate an axiom set ID
 * @returns Axiom set ID (e.g., 'aset_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateAxiomSetId(): string {
  return generateId(EntityPrefix.AXIOM_SET);
}

/**
 * Generate a job requisition ID
 * @returns Job requisition ID (e.g., 'job_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateJobRequisitionId(): string {
  return generateId(EntityPrefix.JOB_REQUISITION);
}

/**
 * Generate a partner ID
 * @returns Partner ID (e.g., 'part_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generatePartnerId(): string {
  return generateId(EntityPrefix.PARTNER);
}

/**
 * Generate a user ID
 * @returns User ID (e.g., 'user_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateUserId(): string {
  return generateId(EntityPrefix.USER);
}

/**
 * Generate an event ID
 * @returns Event ID (e.g., 'evt_01HQ3K5P7Y8X9Z0A1B2C3D4E5F')
 */
export function generateEventId(): string {
  return generateId(EntityPrefix.EVENT);
}

/**
 * Extract the prefix from a ULID
 *
 * @param id - The ULID string
 * @returns The prefix or null if invalid format
 *
 * @example
 * ```typescript
 * const prefix = extractPrefix('cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F');
 * // Returns: 'cand'
 * ```
 */
export function extractPrefix(id: string): string | null {
  const parts = id.split('_');
  return parts.length === 2 ? parts[0] : null;
}

/**
 * Extract the ULID portion from a prefixed ID
 *
 * @param id - The prefixed ULID string
 * @returns The ULID portion or null if invalid format
 *
 * @example
 * ```typescript
 * const ulid = extractUlid('cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F');
 * // Returns: '01HQ3K5P7Y8X9Z0A1B2C3D4E5F'
 * ```
 */
export function extractUlid(id: string): string | null {
  const parts = id.split('_');
  return parts.length === 2 ? parts[1] : null;
}

/**
 * Validate a prefixed ULID format
 *
 * @param id - The ID to validate
 * @param expectedPrefix - Optional expected prefix
 * @returns True if valid format
 *
 * @example
 * ```typescript
 * isValidId('cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F'); // true
 * isValidId('cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F', 'cand'); // true
 * isValidId('cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F', 'intv'); // false
 * isValidId('invalid_id'); // false
 * ```
 */
export function isValidId(id: string, expectedPrefix?: string): boolean {
  const parts = id.split('_');

  if (parts.length !== 2) {
    return false;
  }

  const [prefix, ulidPart] = parts;

  // Check prefix matches if expected prefix provided
  if (expectedPrefix && prefix !== expectedPrefix) {
    return false;
  }

  // ULID must be exactly 26 characters
  if (ulidPart.length !== 26) {
    return false;
  }

  // ULID must only contain valid characters (Crockford's Base32)
  const validChars = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/;
  return validChars.test(ulidPart);
}

/**
 * Get the timestamp from a ULID
 *
 * @param id - The ULID string (with or without prefix)
 * @returns Date object representing the ULID timestamp
 *
 * @example
 * ```typescript
 * const timestamp = getTimestamp('cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F');
 * // Returns: Date object
 * ```
 */
export function getTimestamp(id: string): Date {
  const ulidPart = extractUlid(id) || id;

  // ULID timestamp is encoded in the first 10 characters
  // Decode from Crockford's Base32 to milliseconds
  const timestamp = decodeTime(ulidPart);
  return new Date(timestamp);
}

/**
 * Decode the timestamp from a ULID
 * (Internal helper function)
 */
function decodeTime(id: string): number {
  if (id.length !== 26) {
    throw new Error('Invalid ULID length');
  }

  const time = id.substring(0, 10);
  let timestamp = 0;

  const encoding = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  for (let i = 0; i < time.length; i++) {
    const char = time[i];
    const value = encoding.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character in ULID: ${char}`);
    }
    timestamp = timestamp * 32 + value;
  }

  return timestamp;
}
