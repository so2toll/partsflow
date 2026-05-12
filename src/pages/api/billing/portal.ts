import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { createPortalSession } from '@/lib/stripe';
import { userSubscriptionRepository } from '@/lib/db/repositories';

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // 2. Get user's subscription info
    const subscription = await userSubscriptionRepository.getSubscription(userId);

    if (!subscription.stripeCustomerId) {
      return new Response(
        JSON.stringify({
          error: 'No subscription found',
          message: 'You need an active subscription to access the billing portal.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Create portal session
    const origin = new URL(request.url).origin;
    const portalSession = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${origin}/app/settings/billing`,
    });

    // 4. Return portal URL
    return new Response(
      JSON.stringify({
        success: true,
        portalUrl: portalSession.url,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Billing] Portal error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
