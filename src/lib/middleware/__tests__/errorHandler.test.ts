/**
 * Error Handler Middleware Tests
 *
 * Test suite for the error handling middleware
 *
 * @module lib/middleware/errorHandler
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import {
  throwValidationError,
  throwNotFoundError,
  throwForbiddenError,
  throwUnauthorizedError,
  throwConflictError,
  throwServiceError,
  validateRequiredFields,
  validateFieldType,
  validateEnumValue,
} from '../errorHandler';
import { ErrorCode } from '@/types/errors';

describe('Error Handler Middleware', () => {
  describe('Error Throwing Functions', () => {
    it('should throw validation error', () => {
      expect(() => {
        throwValidationError('name', 'Name is required', '', 'string');
      }).toThrowError('Name is required');
    });

    it('should throw not found error', () => {
      expect(() => {
        throwNotFoundError('Project', 'proj_123');
      }).toThrowError('Project not found');
    });

    it('should throw forbidden error', () => {
      expect(() => {
        throwForbiddenError('You do not have permission');
      }).toThrowError('You do not have permission');
    });

    it('should throw unauthorized error', () => {
      expect(() => {
        throwUnauthorizedError('Authentication required');
      }).toThrowError('Authentication required');
    });

    it('should throw conflict error', () => {
      expect(() => {
        throwConflictError('Resource already exists');
      }).toThrowError('Resource already exists');
    });

    it('should throw service error', () => {
      expect(() => {
        throwServiceError(ErrorCode.DATABASE_ERROR, 'Database connection failed', true);
      }).toThrowError('Database connection failed');
    });
  });

  describe('Validation Helpers', () => {
    describe('validateRequiredFields', () => {
      it('should not throw when all required fields are present', () => {
        const body = {
          name: 'Test',
          email: 'test@example.com',
        };

        expect(() => {
          validateRequiredFields(body, ['name', 'email']);
        }).not.toThrow();
      });

      it('should throw when required field is missing', () => {
        const body = {
          name: 'Test',
        };

        expect(() => {
          validateRequiredFields(body, ['name', 'email']);
        }).toThrowError();
      });

      it('should throw when required field is null', () => {
        const body = {
          name: 'Test',
          email: null,
        };

        expect(() => {
          validateRequiredFields(body, ['name', 'email']);
        }).toThrowError();
      });

      it('should throw when required field is undefined', () => {
        const body = {
          name: 'Test',
          email: undefined,
        };

        expect(() => {
          validateRequiredFields(body, ['name', 'email']);
        }).toThrowError();
      });
    });

    describe('validateFieldType', () => {
      it('should not throw when field type is correct', () => {
        const body = {
          name: 'Test',
          age: 25,
          active: true,
        };

        expect(() => {
          validateFieldType(body, 'name', 'string');
          validateFieldType(body, 'age', 'number');
          validateFieldType(body, 'active', 'boolean');
        }).not.toThrow();
      });

      it('should not throw when field is missing', () => {
        const body = {
          name: 'Test',
        };

        expect(() => {
          validateFieldType(body, 'email', 'string');
        }).not.toThrow();
      });

      it('should throw when field type is incorrect', () => {
        const body = {
          age: '25', // Should be number
        };

        expect(() => {
          validateFieldType(body, 'age', 'number');
        }).toThrowError();
      });

      it('should validate array type', () => {
        const body = {
          tags: ['tag1', 'tag2'],
        };

        expect(() => {
          validateFieldType(body, 'tags', 'array');
        }).not.toThrow();
      });

      it('should throw when array validation fails', () => {
        const body = {
          tags: 'not-an-array',
        };

        expect(() => {
          validateFieldType(body, 'tags', 'array');
        }).toThrowError();
      });

      it('should validate object type', () => {
        const body = {
          metadata: { key: 'value' },
        };

        expect(() => {
          validateFieldType(body, 'metadata', 'object');
        }).not.toThrow();
      });

      it('should throw when object validation fails', () => {
        const body = {
          metadata: 'not-an-object',
        };

        expect(() => {
          validateFieldType(body, 'metadata', 'object');
        }).toThrowError();
      });
    });

    describe('validateEnumValue', () => {
      it('should not throw when value is in enum', () => {
        const body = {
          status: 'draft',
        };

        expect(() => {
          validateEnumValue(body, 'status', ['draft', 'published', 'archived'] as const);
        }).not.toThrow();
      });

      it('should not throw when field is missing', () => {
        const body = {
          name: 'Test',
        };

        expect(() => {
          validateEnumValue(body, 'status', ['draft', 'published'] as const);
        }).not.toThrow();
      });

      it('should throw when value is not in enum', () => {
        const body = {
          status: 'invalid',
        };

        expect(() => {
          validateEnumValue(body, 'status', ['draft', 'published', 'archived'] as const);
        }).toThrowError();
      });

      it('should handle numeric enums', () => {
        const body = {
          priority: 1,
        };

        expect(() => {
          validateEnumValue(body, 'priority', [1, 2, 3] as const);
        }).not.toThrow();
      });
    });
  });
});
