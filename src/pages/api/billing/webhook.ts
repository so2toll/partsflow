import type { APIRoute } from 'astro';
import { constructWebhookEvent, getPlanFromPriceId, stripe } from '@/lib/stripe';
import { userSubscriptionRepository } from '@/lib/db/repositories';
import { paymentRepository } from '@/lib/db/repositories';
import type Stripe from 'stripe';

// Disable body parsing - we need raw body for signature verification
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    // 3. Handle event types
    console.log(`[Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // 4. Return success
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
};

/**
 * Handle checkout.session.completed
 * User just completed checkout - subscription should be created
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('[Webhook] No userId in checkout session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Link customer to user
  await userSubscriptionRepository.updateSubscription(userId, {
    stripeCustomerId: customerId,
    subscriptionId: subscriptionId,
  });

  console.log(`[Webhook] Checkout completed for user ${userId}`);

  // Log payment event
  await paymentRepository.create({
    userId,
    stripeEventId: session.id,
    eventType: 'checkout.session.completed',
    amountCents: session.amount_total || 0,
    currency: session.currency || 'usd',
    metadata: {
      plan: session.metadata?.plan,
    },
  });
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    console.log(`[Webhook] Looking up user by customer ${customerId}`);
    // TODO: Lookup user by stripeCustomerId
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planType = getPlanFromPriceId(priceId);

  await userSubscriptionRepository.updateSubscription(userId, {
    subscriptionId: subscription.id,
    subscriptionStatus: mapSubscriptionStatus(subscription.status),
    planType,
    periodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  console.log(`[Webhook] Subscription updated for user ${userId}: ${planType} (${subscription.status})`);
}

/**
 * Handle subscription deleted (canceled)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await userSubscriptionRepository.updateSubscription(userId, {
    subscriptionStatus: 'canceled',
    planType: 'free',
  });

  console.log(`[Webhook] Subscription canceled for user ${userId}`);

  // Log payment event
  await paymentRepository.create({
    userId,
    stripeEventId: subscription.id,
    eventType: 'customer.subscription.deleted',
    amountCents: 0,
    currency: 'usd',
    metadata: {},
  });
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Get subscription to find userId
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Reset usage for new billing period
  await userSubscriptionRepository.resetUsage(
    userId,
    new Date(subscription.current_period_start * 1000).toISOString(),
    new Date(subscription.current_period_end * 1000).toISOString()
  );

  console.log(`[Webhook] Invoice paid for user ${userId}, usage reset`);

  // Log payment event
  await paymentRepository.create({
    userId,
    stripeEventId: invoice.id,
    eventType: 'invoice.paid',
    amountCents: invoice.amount_paid,
    currency: invoice.currency,
    metadata: {
      invoiceNumber: invoice.number,
    },
  });
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await userSubscriptionRepository.updateSubscription(userId, {
    subscriptionStatus: 'past_due',
  });

  console.log(`[Webhook] Payment failed for user ${userId}`);

  // TODO: Send email notification to user

  // Log payment event
  await paymentRepository.create({
    userId,
    stripeEventId: invoice.id,
    eventType: 'invoice.payment_failed',
    amountCents: invoice.amount_due,
    currency: invoice.currency,
    metadata: {
      invoiceNumber: invoice.number,
    },
  });
}

/**
 * Map Stripe status to our status
 */
function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'none' | 'active' | 'past_due' | 'canceled' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'none';
  }
}
