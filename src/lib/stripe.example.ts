/**
 * Stripe Helper Functions - Usage Examples
 *
 * This file demonstrates how to use the Stripe helper functions
 * from src/lib/stripe.ts in various scenarios.
 *
 * @module lib/stripe.example
 */

import {
  // Checkout & Portal
  createCheckoutSession,
  createPortalSession,

  // Subscription Management
  getSubscriptionDetails,
  getActiveSubscription,
  getCustomerSubscriptions,
  cancelSubscriptionAtPeriodEnd,
  cancelSubscriptionImmediately,
  resumeSubscription,
  updateSubscriptionPlan,

  // Customer Management
  getOrCreateCustomer,
  getCustomer,

  // Webhook Validation
  constructWebhookEvent,
  isValidWebhookSignature,

  // Utility Functions
  getPlanFromPriceId,
  mapStripeStatus,
  hasQuota,
  getRemainingQuota,
  isStripeConfigured,
  getPublishableKey,

  // Types
  type PlanType,
  type SubscriptionDetails,
  type CreateCheckoutSessionParams,
  type GetOrCreateCustomerParams,

  // Error Classes
  StripeError,
  WebhookSignatureError,
} from './stripe';

// ============================================================================
// Example 1: Creating a Checkout Session
// ============================================================================

/**
 * Example API route handler for creating a checkout session
 * Usage: POST /api/billing/create-checkout
 */
export async function exampleCreateCheckout() {
  try {
    // Get authenticated user from session
    const userId = 'user_abc123';
    const email = 'user@example.com';
    const name = 'John Doe';

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId,
      email,
      name,
      metadata: {
        organizationId: 'org_xyz',
      },
    });

    // Determine which plan to purchase
    const selectedPlan: PlanType = 'pro';
    const priceId = getPriceIdForPlan(selectedPlan);

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      userId,
      email,
      priceId,
      successUrl: 'https://yourapp.com/billing/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://yourapp.com/pricing',
      customerId: customer.id, // Use existing customer
      metadata: {
        plan: selectedPlan,
        organizationId: 'org_xyz',
      },
      trialPeriodDays: selectedPlan === 'pro' ? 14 : undefined, // 14-day trial for pro
    });

    // Return checkout URL to frontend
    return {
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    };
  } catch (error) {
    if (error instanceof StripeError) {
      console.error('Stripe error:', error.message, error.code);
      return {
        error: error.message,
        code: error.code,
      };
    }
    throw error;
  }
}

function getPriceIdForPlan(plan: PlanType): string {
  // Map plan type to price ID from environment
  const priceMap = {
    free: process.env.STRIPE_PRICE_ID_FREE || '',
    pro: process.env.STRIPE_PRICE_ID_PRO || '',
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
  };
  return priceMap[plan];
}

// ============================================================================
// Example 2: Creating Customer Portal Session
// ============================================================================

/**
 * Example API route handler for creating billing portal session
 * Usage: POST /api/billing/portal
 */
export async function exampleCreatePortal() {
  try {
    const userId = 'user_abc123';

    // Get user's subscription from database
    // const subscription = await userSubscriptionRepository.getSubscription(userId);
    const stripeCustomerId = 'cus_abc123'; // From database

    if (!stripeCustomerId) {
      throw new Error('No Stripe customer found for user');
    }

    // Create portal session
    const portalSession = await createPortalSession({
      customerId: stripeCustomerId,
      returnUrl: 'https://yourapp.com/app/settings/billing',
    });

    return {
      success: true,
      portalUrl: portalSession.url,
    };
  } catch (error) {
    if (error instanceof StripeError) {
      console.error('Portal error:', error.message);
      return { error: error.message };
    }
    throw error;
  }
}

// ============================================================================
// Example 3: Webhook Handler
// ============================================================================

/**
 * Example webhook handler with signature verification
 * Usage: POST /api/billing/webhook
 */
export async function exampleWebhookHandler(request: Request) {
  try {
    // Get raw body and signature
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Verify webhook signature
    const event = constructWebhookEvent(rawBody, signature);

    console.log(`[Webhook] Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      console.error('Webhook signature verification failed:', error.message);
      return new Response('Invalid signature', { status: 400 });
    }

    console.error('Webhook handler error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Update user's subscription in database
  // await userSubscriptionRepository.updateSubscription(userId, {
  //   stripeCustomerId: customerId,
  //   subscriptionId: subscriptionId,
  // });

  console.log(`Checkout completed for user ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planType = getPlanFromPriceId(priceId);
  const status = mapStripeStatus(subscription.status);

  // Update subscription in database
  // await userSubscriptionRepository.updateSubscription(userId, {
  //   subscriptionId: subscription.id,
  //   subscriptionStatus: status,
  //   planType,
  //   periodStart: new Date(subscription.current_period_start * 1000).toISOString(),
  //   periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  // });

  console.log(`Subscription updated for user ${userId}: ${planType} (${status})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Update subscription status in database
  // await userSubscriptionRepository.updateSubscription(userId, {
  //   subscriptionStatus: 'canceled',
  //   planType: 'free',
  // });

  console.log(`Subscription canceled for user ${userId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Get subscription to find userId
  // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // const userId = subscription.metadata?.userId;
  // if (!userId) return;

  // Reset usage for new billing period
  // await userSubscriptionRepository.resetUsage(userId, periodStart, periodEnd);

  console.log(`Invoice paid, usage reset`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Update subscription status to past_due
  // await userSubscriptionRepository.updateSubscription(userId, {
  //   subscriptionStatus: 'past_due',
  // });

  console.log(`Payment failed for subscription ${subscriptionId}`);
}

// ============================================================================
// Example 4: Retrieving Subscription Details
// ============================================================================

/**
 * Example function to get subscription details for billing page
 */
export async function exampleGetSubscriptionDetails() {
  try {
    const subscriptionId = 'sub_abc123';

    // Get comprehensive subscription details
    const details: SubscriptionDetails = await getSubscriptionDetails(
      subscriptionId
    );

    console.log('Subscription Details:', {
      plan: details.planType,
      status: details.status,
      periodEnd: details.currentPeriodEnd,
      cancelAtEnd: details.cancelAtPeriodEnd,
    });

    // Calculate days remaining in billing period
    const now = new Date();
    const daysRemaining = Math.ceil(
      (details.currentPeriodEnd.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      plan: details.planType,
      status: details.status,
      currentPeriod: {
        start: details.currentPeriodStart,
        end: details.currentPeriodEnd,
        daysRemaining,
      },
      willCancel: details.cancelAtPeriodEnd,
    };
  } catch (error) {
    if (error instanceof StripeError) {
      console.error('Error getting subscription:', error.message);
      return { error: error.message };
    }
    throw error;
  }
}

// ============================================================================
// Example 5: Subscription Management
// ============================================================================

/**
 * Example functions for managing subscriptions
 */
export const subscriptionManagementExamples = {
  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await cancelSubscriptionAtPeriodEnd(subscriptionId);
      console.log(
        `Subscription will cancel at ${new Date(
          subscription.current_period_end * 1000
        ).toLocaleDateString()}`
      );
      return { success: true, subscription };
    } catch (error) {
      if (error instanceof StripeError) {
        console.error('Cancel error:', error.message);
        return { error: error.message };
      }
      throw error;
    }
  },

  /**
   * Resume a subscription that was set to cancel
   */
  async resumeSubscription(subscriptionId: string) {
    try {
      const subscription = await resumeSubscription(subscriptionId);
      console.log('Subscription resumed successfully');
      return { success: true, subscription };
    } catch (error) {
      if (error instanceof StripeError) {
        console.error('Resume error:', error.message);
        return { error: error.message };
      }
      throw error;
    }
  },

  /**
   * Upgrade or downgrade subscription plan
   */
  async changePlan(
    subscriptionId: string,
    newPlan: PlanType,
    prorata: boolean = true
  ) {
    try {
      // Get price ID for new plan
      const priceId = getPriceIdForPlan(newPlan);

      // Update subscription
      const subscription = await updateSubscriptionPlan(
        subscriptionId,
        priceId,
        prorata ? 'create_prorations' : 'none'
      );

      console.log(`Subscription updated to ${newPlan}`);
      return { success: true, subscription };
    } catch (error) {
      if (error instanceof StripeError) {
        console.error('Plan change error:', error.message);
        return { error: error.message };
      }
      throw error;
    }
  },
};

// ============================================================================
// Example 6: Quota Management
// ============================================================================

/**
 * Example functions for checking and managing usage quotas
 */
export const quotaExamples = {
  /**
   * Check if user can perform an action
   */
  canUserGenerateVideo(plan: PlanType, usedMinutes: number, requestedMinutes: number) {
    const allowed = hasQuota(plan, usedMinutes, requestedMinutes);

    if (!allowed) {
      const remaining = getRemainingQuota(plan, usedMinutes);
      console.log(
        `Insufficient quota. User has ${remaining} minutes remaining, needs ${requestedMinutes} minutes.`
      );
      return {
        allowed: false,
        remaining,
        message: 'You have exceeded your monthly quota. Please upgrade your plan.',
      };
    }

    return {
      allowed: true,
      remaining: getRemainingQuota(plan, usedMinutes + requestedMinutes),
    };
  },

  /**
   * Get quota information for dashboard display
   */
  getQuotaInfo(plan: PlanType, usedMinutes: number) {
    const remaining = getRemainingQuota(plan, usedMinutes);
    const total = PLAN_LIMITS[plan];
    const percentUsed = total === Infinity ? 0 : (usedMinutes / total) * 100;

    return {
      plan,
      used: usedMinutes,
      remaining,
      total,
      percentUsed,
      isUnlimited: total === Infinity,
    };
  },
};

// ============================================================================
// Example 7: Client-Side Integration
// ============================================================================

/**
 * Example of how to use the publishable key on the client side
 * This would go in a frontend component
 */
export const clientExample = `
// In a React/Astro component
import { getPublishableKey } from '@/lib/stripe';

function CheckoutButton() {
  const handleCheckout = async () => {
    try {
      // Call your API to create checkout session
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <button onClick={handleCheckout}>
      Upgrade to Pro
    </button>
  );
}
`;

// ============================================================================
// Example 8: Error Handling Patterns
// ============================================================================

/**
 * Example of comprehensive error handling
 */
export async function exampleWithErrorHandling() {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      throw new Error('Stripe is not configured. Please check environment variables.');
    }

    // Perform Stripe operations
    const subscription = await getSubscriptionDetails('sub_abc123');

    return { success: true, subscription };
  } catch (error) {
    // Handle different error types
    if (error instanceof StripeError) {
      // Stripe-specific error with code and status
      console.error('Stripe Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });

      // Return user-friendly error based on error code
      const userMessages: Record<string, string> = {
        MISSING_PARAMETERS: 'Required information is missing.',
        INVALID_PRICE_ID: 'The selected plan is not available.',
        SUBSCRIPTION_CANCELLATION_FAILED: 'Failed to cancel subscription. Please try again.',
        CARD_ERROR: 'Your card was declined. Please try a different payment method.',
      };

      return {
        error: userMessages[error.code] || error.message,
        code: error.code,
      };
    }

    if (error instanceof WebhookSignatureError) {
      console.error('Security: Invalid webhook signature');
      return { error: 'Invalid request' };
    }

    // Generic error handling
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// ============================================================================
// Example 9: Testing & Debugging
// ============================================================================

/**
 * Example utility functions for testing
 */
export const testingExamples = {
  /**
   * Validate webhook signature without throwing
   * Useful for logging webhook validation attempts
   */
  logWebhookValidation(rawBody: string, signature: string | null) {
    const isValid = isValidWebhookSignature(rawBody, signature);

    if (isValid) {
      console.log('[Webhook] Signature is valid');
    } else {
      console.warn('[Webhook] Signature is invalid - potential security issue');
    }

    return isValid;
  },

  /**
   * Test Stripe configuration
   */
  testConfiguration() {
    console.log('Stripe Configuration Status:');
    console.log('- Configured:', isStripeConfigured());
    console.log('- Publishable Key:', getPublishableKey() ? 'Set' : 'Not set');
    console.log('- Secret Key:', import.meta.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
    console.log('- Webhook Secret:', import.meta.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set');

    return {
      isConfigured: isStripeConfigured(),
      hasPublishableKey: !!getPublishableKey(),
      hasSecretKey: !!import.meta.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!import.meta.env.STRIPE_WEBHOOK_SECRET,
    };
  },
};

// Import Stripe types for the examples
import type Stripe from 'stripe';
