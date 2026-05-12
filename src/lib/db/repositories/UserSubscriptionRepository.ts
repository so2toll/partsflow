/**
 * User Subscription Repository
 *
 * Manages subscription and billing data for users.
 * Extends User nodes with subscription fields.
 *
 * @module lib/db/repositories/UserSubscriptionRepository
 */

import { graph, type Node } from '../graph';

// ============================================================================
// Types
// ============================================================================

export interface UserSubscription {
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus: 'none' | 'active' | 'past_due' | 'canceled' | 'trialing';
  planType: 'free' | 'creator' | 'pro' | 'enterprise';
  periodStart?: string;
  periodEnd?: string;
  usedMinutesThisPeriod: number;
  totalMinutesLimit: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription: UserSubscription;
}

// ============================================================================
// User Subscription Repository
// ============================================================================

class UserSubscriptionRepository {
  /**
   * Get user's subscription info
   */
  async getSubscription(userId: string): Promise<UserSubscription> {
    const results = await graph.query<Node>(
      `MATCH (u:User {id: $userId}) RETURN u`,
      { userId }
    );

    if (results.length === 0) {
      // Return free tier defaults for non-existent user
      return this.getDefaultSubscription();
    }

    // Access the user node properties from the query result
    const userNode = results[0].u as Node;
    const props = typeof userNode.properties === 'string'
      ? JSON.parse(userNode.properties)
      : userNode.properties;

    return this.mapToSubscription(props || {});
  }

  /**
   * Update subscription after Stripe webhook
   */
  async updateSubscription(
    userId: string,
    data: Partial<UserSubscription>
  ): Promise<UserSubscription> {
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.stripeCustomerId !== undefined) {
      updates.stripeCustomerId = data.stripeCustomerId;
    }
    if (data.subscriptionId !== undefined) {
      updates.subscriptionId = data.subscriptionId;
    }
    if (data.subscriptionStatus !== undefined) {
      updates.subscriptionStatus = data.subscriptionStatus;
    }
    if (data.planType !== undefined) {
      updates.planType = data.planType;
      updates.totalMinutesLimit = this.getMinutesLimit(data.planType);
    }
    if (data.periodStart !== undefined) {
      updates.periodStart = data.periodStart;
    }
    if (data.periodEnd !== undefined) {
      updates.periodEnd = data.periodEnd;
    }
    if (data.usedMinutesThisPeriod !== undefined) {
      updates.usedMinutesThisPeriod = data.usedMinutesThisPeriod;
    }

    const result = await graph.updateNode(userId, updates);

    // Handle case where result might be undefined or have no properties
    if (!result || !result.properties) {
      // If update failed, return current subscription
      return await this.getSubscription(userId);
    }

    const props = typeof result.properties === 'string'
      ? JSON.parse(result.properties)
      : result.properties;

    return this.mapToSubscription(props);
  }

  /**
   * Increment used minutes
   */
  async addUsedMinutes(userId: string, minutes: number): Promise<UserSubscription> {
    const current = await this.getSubscription(userId);
    const newUsed = current.usedMinutesThisPeriod + minutes;

    return this.updateSubscription(userId, {
      usedMinutesThisPeriod: newUsed,
    });
  }

  /**
   * Reset usage at period start
   */
  async resetUsage(userId: string, periodStart: string, periodEnd: string): Promise<void> {
    await this.updateSubscription(userId, {
      usedMinutesThisPeriod: 0,
      periodStart,
      periodEnd,
    });
  }

  /**
   * Check if user has quota for generation
   */
  async hasQuota(userId: string, requestedMinutes: number): Promise<boolean> {
    const sub = await this.getSubscription(userId);

    // For paid plans, require active subscription
    if (sub.planType !== 'free') {
      if (sub.subscriptionStatus !== 'active' && sub.subscriptionStatus !== 'trialing') {
        return false;
      }
    }

    // Check quota limit
    return sub.usedMinutesThisPeriod + requestedMinutes <= sub.totalMinutesLimit;
  }

  /**
   * Get remaining minutes
   */
  async getRemainingMinutes(userId: string): Promise<number> {
    const sub = await this.getSubscription(userId);
    return Math.max(0, sub.totalMinutesLimit - sub.usedMinutesThisPeriod);
  }

  /**
   * Get user's plan type
   */
  async getPlanType(userId: string): Promise<UserSubscription['planType']> {
    const sub = await this.getSubscription(userId);
    return sub.planType;
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const sub = await this.getSubscription(userId);
    return sub.subscriptionStatus === 'active' || sub.subscriptionStatus === 'trialing';
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  private getDefaultSubscription(): UserSubscription {
    return {
      subscriptionStatus: 'none',
      planType: 'free',
      usedMinutesThisPeriod: 0,
      totalMinutesLimit: 5,
    };
  }

  private getMinutesLimit(planType: UserSubscription['planType']): number {
    const limits = {
      free: 5,
      creator: 60,
      pro: 300,
      enterprise: 999999, // Effectively unlimited
    };
    return limits[planType];
  }

  private mapToSubscription(props: Record<string, unknown> | undefined | null): UserSubscription {
    // Safety check: if props is undefined/null, return default subscription
    if (!props) {
      return this.getDefaultSubscription();
    }

    const planType = (props.planType as UserSubscription['planType']) || 'free';

    return {
      stripeCustomerId: props.stripeCustomerId as string | undefined,
      subscriptionId: props.subscriptionId as string | undefined,
      subscriptionStatus:
        (props.subscriptionStatus as UserSubscription['subscriptionStatus']) || 'none',
      planType,
      periodStart: props.periodStart as string | undefined,
      periodEnd: props.periodEnd as string | undefined,
      usedMinutesThisPeriod: (props.usedMinutesThisPeriod as number) || 0,
      totalMinutesLimit: (props.totalMinutesLimit as number) || this.getMinutesLimit(planType),
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const userSubscriptionRepository = new UserSubscriptionRepository();
