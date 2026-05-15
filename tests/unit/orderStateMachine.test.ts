import { describe, it, expect } from 'vitest';
import {
  validateTransition,
  canTransition,
  getNextAllowedStatuses,
  isTerminalStatus,
  getAllStatuses,
} from '@/lib/order/orderStateMachine';

describe('Order State Machine', () => {
  describe('validateTransition', () => {
    it('should validate pending to dispatched transition', () => {
      const result = validateTransition('pending', 'dispatched');
      expect(result.valid).toBe(true);
    });

    it('should validate dispatched to picked_up transition', () => {
      const result = validateTransition('dispatched', 'picked_up');
      expect(result.valid).toBe(true);
    });

    it('should validate picked_up to en_route transition', () => {
      const result = validateTransition('picked_up', 'en_route');
      expect(result.valid).toBe(true);
    });

    it('should validate en_route to delivered transition', () => {
      const result = validateTransition('en_route', 'delivered');
      expect(result.valid).toBe(true);
    });

    it('should validate delivered to confirmed transition', () => {
      const result = validateTransition('delivered', 'confirmed');
      expect(result.valid).toBe(true);
    });

    it('should allow active states to transition to cancelled', () => {
      expect(validateTransition('pending', 'cancelled').valid).toBe(true);
      expect(validateTransition('dispatched', 'cancelled').valid).toBe(true);
      expect(validateTransition('picked_up', 'cancelled').valid).toBe(true);
      expect(validateTransition('en_route', 'cancelled').valid).toBe(true);
      // Note: delivered cannot transition to cancelled, only to confirmed
      expect(validateTransition('delivered', 'cancelled').valid).toBe(false);
    });

    it('should reject invalid transitions', () => {
      const result = validateTransition('pending', 'delivered');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject transitions from terminal states', () => {
      expect(validateTransition('confirmed', 'cancelled').valid).toBe(false);
      expect(validateTransition('cancelled', 'pending').valid).toBe(false);
    });

    it('should reject unknown current status', () => {
      const result = validateTransition('unknown_status', 'dispatched');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown status');
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      expect(canTransition('pending', 'dispatched')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(canTransition('pending', 'delivered')).toBe(false);
    });
  });

  describe('getNextAllowedStatuses', () => {
    it('should return correct next statuses for pending', () => {
      const next = getNextAllowedStatuses('pending');
      expect(next).toContain('dispatched');
      expect(next).toContain('cancelled');
    });

    it('should return empty array for terminal states', () => {
      expect(getNextAllowedStatuses('confirmed')).toEqual([]);
      expect(getNextAllowedStatuses('cancelled')).toEqual([]);
    });
  });

  describe('isTerminalStatus', () => {
    it('should return true for confirmed status', () => {
      expect(isTerminalStatus('confirmed')).toBe(true);
    });

    it('should return true for cancelled status', () => {
      expect(isTerminalStatus('cancelled')).toBe(true);
    });

    it('should return false for non-terminal statuses', () => {
      expect(isTerminalStatus('pending')).toBe(false);
      expect(isTerminalStatus('dispatched')).toBe(false);
    });
  });

  describe('getAllStatuses', () => {
    it('should return all valid order statuses', () => {
      const statuses = getAllStatuses();
      expect(statuses).toContain('pending');
      expect(statuses).toContain('dispatched');
      expect(statuses).toContain('picked_up');
      expect(statuses).toContain('en_route');
      expect(statuses).toContain('delivered');
      expect(statuses).toContain('confirmed');
      expect(statuses).toContain('cancelled');
    });
  });
});
