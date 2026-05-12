import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { userSubscriptionRepository } from '@/lib/db/repositories';
import { type PlanType } from '@/lib/stripe';

export interface SubscriptionResponse {
  plan: PlanType;
  status: 'none' | 'active' | 'past_due' | 'canceled' | 'trialing';
  usage: {
    usedMinutes: number;
    totalMinutes: number;
    remainingMinutes: number;
    percentUsed: number;
  };
  billing: {
    periodStart?: string;
    periodEnd?: string;
    daysRemaining?: number;
  };
  canGenerate: boolean;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate user
    const session = await getSession(request, cookies);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = session.user.global_id || session.user.id;

    // 2. Get subscription info
    const subscription = await userSubscriptionRepository.getSubscription(userId);

    // 3. Calculate usage
    const remainingMinutes = Math.max(
      0,
      subscription.totalMinutesLimit - subscription.usedMinutesThisPeriod
    );
    const percentUsed = subscription.totalMinutesLimit > 0
      ? Math.round((subscription.usedMinutesThisPeriod / subscription.totalMinutesLimit) * 100)
      : 0;

    // 4. Calculate billing period
    let daysRemaining: number | undefined;
    if (subscription.periodEnd) {
      const now = new Date();
      const end = new Date(subscription.periodEnd);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // 5. Check if user can generate
    const canGenerate =
      (subscription.subscriptionStatus === 'active' ||
        subscription.subscriptionStatus === 'trialing' ||
        subscription.planType === 'free') &&
      remainingMinutes > 0;

    // 6. Build response
    const response: SubscriptionResponse = {
      plan: subscription.planType,
      status: subscription.subscriptionStatus,
      usage: {
        usedMinutes: subscription.usedMinutesThisPeriod,
        totalMinutes: subscription.totalMinutesLimit,
        remainingMinutes,
        percentUsed,
      },
      billing: {
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        daysRemaining,
      },
      canGenerate,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Billing] Get subscription error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
