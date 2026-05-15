import { describe, it, expect, beforeEach } from 'vitest';
import { validateTransition } from '@/lib/order/orderStateMachine';

describe('Order Status API Integration', () => {
  // Mock order data
  const mockOrder = {
    id: 'order_123',
    status: 'pending',
    shopId: 'shop_456',
    driverId: null,
    createdAt: new Date().toISOString(),
  };

  describe('State Machine Integration', () => {
    it('should allow pending order to be dispatched', () => {
      const validation = validateTransition(mockOrder.status, 'dispatched');
      expect(validation.valid).toBe(true);
    });

    it('should allow dispatched order to be picked up', () => {
      const orderInProgress = { ...mockOrder, status: 'dispatched' as const };
      const validation = validateTransition(orderInProgress.status, 'picked_up');
      expect(validation.valid).toBe(true);
    });

    it('should allow picked up order to be en route', () => {
      const orderPickedUp = { ...mockOrder, status: 'picked_up' as const };
      const validation = validateTransition(orderPickedUp.status, 'en_route');
      expect(validation.valid).toBe(true);
    });

    it('should allow en route order to be delivered', () => {
      const orderEnRoute = { ...mockOrder, status: 'en_route' as const };
      const validation = validateTransition(orderEnRoute.status, 'delivered');
      expect(validation.valid).toBe(true);
    });

    it('should allow delivered order to be confirmed', () => {
      const orderDelivered = { ...mockOrder, status: 'delivered' as const };
      const validation = validateTransition(orderDelivered.status, 'confirmed');
      expect(validation.valid).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      // Try to skip from pending to delivered
      const validation = validateTransition(mockOrder.status, 'delivered');
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Cannot transition');
    });

    it('should allow cancellation from active states', () => {
      const activeStates = ['pending', 'dispatched', 'picked_up', 'en_route'] as const;
      activeStates.forEach(status => {
        const validation = validateTransition(status, 'cancelled');
        expect(validation.valid).toBe(true);
      });
      // Delivered cannot be cancelled, only confirmed
      expect(validateTransition('delivered', 'cancelled').valid).toBe(false);
    });
  });
});
