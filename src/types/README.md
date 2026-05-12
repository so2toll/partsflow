# Data3D Type Definitions

This directory contains all TypeScript type definitions for the Data3D Expert Reasoning Engine project.

## Overview

The type system is organized into five main modules:

1. **contracts.ts** - Domain entities and core business types
2. **events.ts** - Event sourcing types and event payloads
3. **commands.ts** - Command (write) API request/response types
4. **queries.ts** - Query (read) API request/response types
5. **errors.ts** - Error codes and error handling types

## Usage

### Importing Types

```typescript
// Import from the barrel file (recommended)
import { Candidate, Interview, EventType, ErrorCode } from '@/types';

// Import from specific modules
import type { SubmitCandidateRequest } from '@/types/commands';
import type { ListCandidatesQuery } from '@/types/queries';
import type { CandidateSubmittedPayload } from '@/types/events';
```

### Using Domain Entities

```typescript
import { Candidate, CandidateStatus } from '@/types';
import { generateCandidateId } from '@/lib/utils/ulid';

const candidate: Candidate = {
  id: generateCandidateId(),
  email: 'expert@example.com',
  name: 'Jane Doe',
  source: 'direct',
  status: 'submitted',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

### Working with Events

```typescript
import type { Event, CandidateSubmittedPayload } from '@/types';
import { generateEventId } from '@/lib/utils/ulid';

const event: Event<CandidateSubmittedPayload> = {
  id: generateEventId(),
  type: 'CandidateSubmitted',
  aggregateType: 'Candidate',
  aggregateId: candidate.id,
  payload: {
    candidateId: candidate.id,
    email: candidate.email,
    name: candidate.name,
    source: candidate.source,
    jobRequisitionId: 'job_abc123',
  },
  metadata: {
    source: 'web-app',
    version: 1,
  },
  createdAt: new Date().toISOString(),
};
```

### Implementing Commands

```typescript
import type { SubmitCandidateRequest, SubmitCandidateResponse } from '@/types';

async function submitCandidate(
  request: SubmitCandidateRequest
): Promise<SubmitCandidateResponse> {
  // Implementation
  return {
    candidateId: 'cand_123',
    interviewId: 'intv_456',
    status: 'success',
  };
}
```

### Implementing Queries

```typescript
import type { ListCandidatesQuery, ListCandidatesResponse } from '@/types';

async function listCandidates(
  query: ListCandidatesQuery
): Promise<ListCandidatesResponse> {
  // Implementation
  return {
    candidates: [],
    total: 0,
    limit: query.limit || 20,
    offset: query.offset || 0,
  };
}
```

### Error Handling

```typescript
import {
  ErrorCode,
  createNotFoundError,
  createValidationError,
  isNotFoundError,
} from '@/types';

// Create errors
const error = createNotFoundError('Candidate', 'cand_123', 'req_abc');

// Type guards
if (isNotFoundError(error)) {
  console.log(`${error.details.resourceType} not found`);
}
```

## File Structure

```
src/types/
├── README.md           # This file
├── index.ts            # Barrel exports
├── contracts.ts        # Domain entities (2.7 KB of types)
├── events.ts           # Event types (2.4 KB of types)
├── commands.ts         # Command types (1.8 KB of types)
├── queries.ts          # Query types (2.1 KB of types)
└── errors.ts           # Error types (1.5 KB of types)
```

## ULID Utilities

The project uses ULIDs for all entity IDs. Helper functions are available:

```typescript
import {
  generateCandidateId,
  generateInterviewId,
  generateEventId,
  isValidId,
  extractPrefix,
  getTimestamp,
} from '@/lib/utils/ulid';

// Generate IDs
const candidateId = generateCandidateId();
// => 'cand_01HQ3K5P7Y8X9Z0A1B2C3D4E5F'

// Validate IDs
isValidId(candidateId); // => true
isValidId(candidateId, 'cand'); // => true

// Extract information
extractPrefix(candidateId); // => 'cand'
getTimestamp(candidateId); // => Date object
```

## Type Safety

All types follow these conventions:

1. **Strict Mode** - Types are compatible with TypeScript strict mode
2. **Named Exports** - All types use named exports (not default)
3. **Exact Naming** - Type names match the specification exactly
4. **Documentation** - Complex types have JSDoc comments
5. **Optional Fields** - Use `?:` for optional properties
6. **Type vs Interface** - Use `type` for unions, `interface` for objects

## Validation

All type files are validated on commit:

```bash
# Check types
npx tsc --noEmit --skipLibCheck

# Check specific module
npx tsc --noEmit --skipLibCheck src/types/contracts.ts
```

## References

- **Specification**: `/specs/00-CONTRACTS.md`
- **Architecture**: `/.claude/ARCHITECTURE-REFERENCE.md`
- **ULID Spec**: https://github.com/ulid/spec

## Version

**Version**: 0.1.0
**Last Updated**: January 18, 2026
**Status**: Production Ready
