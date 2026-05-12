import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import {
  createCheckoutSession,
  getOrCreateCustomer,
  STRIPE_PRICES,
  type PlanType,
} from '@/lib/stripe';

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
    const email = session.user.email;
    const name = session.user.name;

    // 2. Parse request body
    const body = await request.json();
    const { plan } = body as { plan: PlanType };

    // 3. Validate plan
    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan selected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId,
      email,
      name,
    });

    // 5. Create checkout session
    const origin = new URL(request.url).origin;
    const checkoutSession = await createCheckoutSession({
      userId,
      email,
      priceId,
      successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing`,
      metadata: {
        plan,
      },
    });

    // 6. Return checkout URL
    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Billing] Checkout error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function getPriceIdForPlan(plan: PlanType): string | null {
  switch (plan) {
    case 'pro':
      return STRIPE_PRICES.PRO;
    case 'enterprise':
      return STRIPE_PRICES.ENTERPRISE;
    default:
      return STRIPE_PRICES.FREE;
  }
}
