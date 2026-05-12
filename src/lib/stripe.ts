/**
 * Stripe Client Helper Functions
 *
 * Production-grade Stripe integration with comprehensive error handling,
 * TypeScript types, and helper functions for:
 * - Creating checkout sessions
 * - Creating customer portal sessions
 * - Validating webhooks
 * - Retrieving subscription details
 * - Managing subscriptions
 *
 * @module lib/stripe
 * @version 1.0.0
 */

import Stripe from 'stripe';

// ============================================================================
// Configuration & Initialization
// ============================================================================

/**
 * Stripe client initialization
 * Uses latest API version with TypeScript support
 */
const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  // Enable telemetry for production monitoring
  telemetry: true,
});

/**
 * Price IDs from environment variables
 * Maps plan tiers to Stripe Price IDs
 */
export const STRIPE_PRICES = {
  FREE: import.meta.env.STRIPE_PRICE_ID_FREE,
  PRO: import.meta.env.STRIPE_PRICE_ID_PRO,
  ENTERPRISE: import.meta.env.STRIPE_PRICE_ID_ENTERPRISE,
} as const;

/**
 * Supported plan types
 */
export type PlanType = 'free' | 'pro' | 'enterprise';

/**
 * Subscription status types matching Stripe and internal system
 */
export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete';

/**
 * Plan limits (minutes per month)
 */
export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 5,
  pro: 300,
  enterprise: Infinity,
};

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Custom error for Stripe-related failures
 * Provides structured error information for API responses
 */
export class StripeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public stripeError?: Stripe.StripeRawError
  ) {
    super(message);
    this.name = 'StripeError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for webhook signature validation failures
 */
export class WebhookSignatureError extends Error {
  constructor(message: string = 'Invalid webhook signature') {
    super(message);
    this.name = 'WebhookSignatureError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Parameters for creating a checkout session
 */
export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  // Optional: allow existing customer
  customerId?: string;
  // Optional: trial period
  trialPeriodDays?: number;
}

/**
 * Parameters for creating a customer portal session
 */
export interface CreatePortalSessionParams {
  customerId: string;
  returnUrl: string;
}

/**
 * Parameters for getting or creating a customer
 */
export interface GetOrCreateCustomerParams {
  userId: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Subscription details retrieved from Stripe
 */
export interface SubscriptionDetails {
  subscriptionId: string;
  customerId: string;
  status: SubscriptionStatus;
  planType: PlanType;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  priceId: string;
}

/**
 * Webhook event handler result
 */
export interface WebhookHandlerResult {
  success: boolean;
  processed: boolean;
  error?: string;
}

// ============================================================================
// Checkout Session Functions
// ============================================================================

/**
 * Create a Stripe Checkout session for subscription purchase
 *
 * @param params Checkout session parameters
 * @returns Stripe Checkout Session
 * @throws {StripeError} If session creation fails
 *
 * @example
 * ```typescript
 * const session = await createCheckoutSession({
 *   userId: 'user_123',
 *   email: 'user@example.com',
 *   priceId: STRIPE_PRICES.PRO,
 *   successUrl: 'https://app.com/billing/success',
 *   cancelUrl: 'https://app.com/pricing',
 *   metadata: { plan: 'pro' }
 * });
 * ```
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  try {
    const {
      userId,
      email,
      priceId,
      successUrl,
      cancelUrl,
      metadata = {},
      customerId,
      trialPeriodDays,
    } = params;

    // Validate required parameters
    if (!userId || !email || !priceId) {
      throw new StripeError(
        'Missing required parameters: userId, email, and priceId are required',
        'MISSING_PARAMETERS',
        400
      );
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      throw new StripeError(
        'Invalid price ID format. Must start with "price_"',
        'INVALID_PRICE_ID',
        400
      );
    }

    // Build session creation parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        ...metadata,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    };

    // Add customer if exists
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = email;
    }

    // Add trial period if specified
    if (trialPeriodDays) {
      sessionParams.subscription_data = sessionParams.subscription_data || {};
      sessionParams.subscription_data.trial_period_days = trialPeriodDays;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return session;
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    // Re-throw custom errors
    if (error instanceof StripeError) {
      throw error;
    }

    // Wrap unknown errors
    throw new StripeError(
      'Failed to create checkout session',
      'CHECKOUT_SESSION_FAILED',
      500
    );
  }
}

// ============================================================================
// Customer Portal Functions
// ============================================================================

/**
 * Create a billing portal session for subscription management
 * Allows customers to update payment methods, view invoices, and cancel subscriptions
 *
 * @param params Portal session parameters
 * @returns Stripe Billing Portal Session
 * @throws {StripeError} If portal session creation fails
 *
 * @example
 * ```typescript
 * const portalSession = await createPortalSession({
 *   customerId: 'cus_abc123',
 *   returnUrl: 'https://app.com/billing'
 * });
 * ```
 */
export async function createPortalSession(
  params: CreatePortalSessionParams
): Promise<Stripe.BillingPortal.Session> {
  try {
    const { customerId, returnUrl } = params;

    // Validate required parameters
    if (!customerId) {
      throw new StripeError(
        'Missing required parameter: customerId',
        'MISSING_CUSTOMER_ID',
        400
      );
    }

    if (!returnUrl) {
      throw new StripeError(
        'Missing required parameter: returnUrl',
        'MISSING_RETURN_URL',
        400
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return portalSession;
  } catch (error) {
    console.error('[Stripe] Error creating portal session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    if (error instanceof StripeError) {
      throw error;
    }

    throw new StripeError(
      'Failed to create portal session',
      'PORTAL_SESSION_FAILED',
      500
    );
  }
}

// ============================================================================
// Webhook Validation Functions
// ============================================================================

/**
 * Verify webhook signature and construct event
 * This is critical for security - prevents webhook spoofing
 *
 * @param payload Raw request body (string or Buffer)
 * @param signature Stripe-Signature header value
 * @returns Verified Stripe Event
 * @throws {WebhookSignatureError} If signature is invalid or missing
 *
 * @example
 * ```typescript
 * try {
 *   const event = await constructWebhookEvent(rawBody, signature);
 *   // Process event...
 * } catch (error) {
 *   if (error instanceof WebhookSignatureError) {
 *     // Return 400 - invalid signature
 *   }
 * }
 * ```
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string | null
): Stripe.Event {
  try {
    // Validate signature presence
    if (!signature) {
      throw new WebhookSignatureError('Missing stripe-signature header');
    }

    // Validate webhook secret is configured
    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new StripeError(
        'Stripe webhook secret not configured',
        'MISSING_WEBHOOK_SECRET',
        500
      );
    }

    // Verify and construct event
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error);

    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      throw new WebhookSignatureError(error.message);
    }

    if (error instanceof WebhookSignatureError) {
      throw error;
    }

    throw new WebhookSignatureError('Webhook verification failed');
  }
}

/**
 * Test webhook signature without throwing
 * Useful for logging and monitoring
 *
 * @param payload Raw request body
 * @param signature Stripe-Signature header value
 * @returns True if signature is valid, false otherwise
 */
export function isValidWebhookSignature(
  payload: string | Buffer,
  signature: string | null
): boolean {
  try {
    constructWebhookEvent(payload, signature);
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// Subscription Retrieval Functions
// ============================================================================

/**
 * Retrieve subscription details from Stripe
 * Returns comprehensive subscription information for dashboard/billing pages
 *
 * @param subscriptionId Stripe Subscription ID
 * @returns Subscription details
 * @throws {StripeError} If retrieval fails
 *
 * @example
 * ```typescript
 * const details = await getSubscriptionDetails('sub_abc123');
 * console.log(details.status); // 'active'
 * console.log(details.planType); // 'pro'
 * ```
 */
export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<SubscriptionDetails> {
  try {
    if (!subscriptionId) {
      throw new StripeError(
        'Missing subscription ID',
        'MISSING_SUBSCRIPTION_ID',
        400
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });

    // Extract plan information
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      throw new StripeError(
        'Subscription has no price ID',
        'INVALID_SUBSCRIPTION',
        400
      );
    }

    const planType = getPlanFromPriceId(priceId);

    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      status: mapStripeStatus(subscription.status),
      planType,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
      priceId,
    };
  } catch (error) {
    console.error('[Stripe] Error retrieving subscription:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    if (error instanceof StripeError) {
      throw error;
    }

    throw new StripeError(
      'Failed to retrieve subscription details',
      'SUBSCRIPTION_RETRIEVAL_FAILED',
      500
    );
  }
}

/**
 * Get active subscription for a customer
 *
 * @param customerId Stripe Customer ID
 * @returns Active subscription or null if none exists
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    return subscriptions.data[0] || null;
  } catch (error) {
    console.error('[Stripe] Error listing subscriptions:', error);
    return null;
  }
}

/**
 * Get all subscriptions for a customer
 *
 * @param customerId Stripe Customer ID
 * @param limit Maximum number of subscriptions to return
 * @returns Array of subscriptions
 */
export async function getCustomerSubscriptions(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Subscription[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit,
    });

    return subscriptions.data;
  } catch (error) {
    console.error('[Stripe] Error listing subscriptions:', error);
    return [];
  }
}

// ============================================================================
// Subscription Management Functions
// ============================================================================

/**
 * Cancel subscription at period end
 * Subscription remains active until current period ends
 *
 * @param subscriptionId Stripe Subscription ID
 * @returns Updated subscription
 * @throws {StripeError} If cancellation fails
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    if (!subscriptionId) {
      throw new StripeError(
        'Missing subscription ID',
        'MISSING_SUBSCRIPTION_ID',
        400
      );
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  } catch (error) {
    console.error('[Stripe] Error canceling subscription:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    throw new StripeError(
      'Failed to cancel subscription',
      'SUBSCRIPTION_CANCELLATION_FAILED',
      500
    );
  }
}

/**
 * Cancel subscription immediately (with proration)
 *
 * @param subscriptionId Stripe Subscription ID
 * @returns Canceled subscription
 * @throws {StripeError} If cancellation fails
 */
export async function cancelSubscriptionImmediately(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    if (!subscriptionId) {
      throw new StripeError(
        'Missing subscription ID',
        'MISSING_SUBSCRIPTION_ID',
        400
      );
    }

    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    return subscription;
  } catch (error) {
    console.error('[Stripe] Error canceling subscription:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    throw new StripeError(
      'Failed to cancel subscription',
      'SUBSCRIPTION_CANCELLATION_FAILED',
      500
    );
  }
}

/**
 * Resume a subscription scheduled for cancellation
 *
 * @param subscriptionId Stripe Subscription ID
 * @returns Updated subscription
 * @throws {StripeError} If resume fails
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    if (!subscriptionId) {
      throw new StripeError(
        'Missing subscription ID',
        'MISSING_SUBSCRIPTION_ID',
        400
      );
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return subscription;
  } catch (error) {
    console.error('[Stripe] Error resuming subscription:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    throw new StripeError(
      'Failed to resume subscription',
      'SUBSCRIPTION_RESUME_FAILED',
      500
    );
  }
}

/**
 * Update subscription to a different plan
 *
 * @param subscriptionId Stripe Subscription ID
 * @param newPriceId New price ID to upgrade/downgrade to
 * @param prorationBehavior How to handle proration (default: 'create_prorations')
 * @returns Updated subscription
 * @throws {StripeError} If update fails
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string,
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
): Promise<Stripe.Subscription> {
  try {
    if (!subscriptionId || !newPriceId) {
      throw new StripeError(
        'Missing required parameters: subscriptionId and newPriceId',
        'MISSING_PARAMETERS',
        400
      );
    }

    // Get current subscription to find the subscription item ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      throw new StripeError(
        'Subscription has no items',
        'INVALID_SUBSCRIPTION',
        400
      );
    }

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        proration_behavior: prorationBehavior,
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId,
          },
        ],
      }
    );

    return updatedSubscription;
  } catch (error) {
    console.error('[Stripe] Error updating subscription:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    throw new StripeError(
      'Failed to update subscription',
      'SUBSCRIPTION_UPDATE_FAILED',
      500
    );
  }
}

// ============================================================================
// Customer Management Functions
// ============================================================================

/**
 * Get or create Stripe customer for a user
 * Searches for existing customer by userId metadata, creates if not found
 *
 * @param params Customer parameters
 * @returns Stripe Customer
 * @throws {StripeError} If customer creation/retrieval fails
 *
 * @example
 * ```typescript
 * const customer = await getOrCreateCustomer({
 *   userId: 'user_123',
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   metadata: { organizationId: 'org_456' }
 * });
 * ```
 */
export async function getOrCreateCustomer(
  params: GetOrCreateCustomerParams
): Promise<Stripe.Customer> {
  try {
    const { userId, email, name, metadata = {} } = params;

    // Validate required parameters
    if (!userId || !email) {
      throw new StripeError(
        'Missing required parameters: userId and email',
        'MISSING_PARAMETERS',
        400
      );
    }

    // Search for existing customer by userId metadata
    try {
      const existingCustomers = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
      });

      if (existingCustomers.data.length > 0) {
        // Update existing customer if email or name changed
        const customer = existingCustomers.data[0];
        const needsUpdate =
          customer.email !== email || (name && customer.name !== name);

        if (needsUpdate) {
          return await stripe.customers.update(customer.id, {
            email,
            name,
          });
        }

        return customer;
      }
    } catch (searchError) {
      // Search API might fail, continue to create new customer
      console.warn('[Stripe] Customer search failed, creating new customer:', searchError);
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
        ...metadata,
      },
    });

    return customer;
  } catch (error) {
    console.error('[Stripe] Error creating/retrieving customer:', error);

    if (error instanceof Stripe.errors.StripeError) {
      throw new StripeError(
        error.message,
        error.code || 'STRIPE_ERROR',
        error.statusCode || 500,
        error
      );
    }

    if (error instanceof StripeError) {
      throw error;
    }

    throw new StripeError(
      'Failed to get or create customer',
      'CUSTOMER_CREATION_FAILED',
      500
    );
  }
}

/**
 * Get customer by Stripe Customer ID
 *
 * @param customerId Stripe Customer ID
 * @returns Customer or null if not found
 */
export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer as Stripe.Customer;
  } catch (error) {
    console.error('[Stripe] Error retrieving customer:', error);
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map Stripe Price ID to internal PlanType
 *
 * @param priceId Stripe Price ID
 * @returns Corresponding plan type
 */
export function getPlanFromPriceId(priceId: string): PlanType {
  if (!priceId) return 'free';

  if (priceId === STRIPE_PRICES.PRO) return 'pro';
  if (priceId === STRIPE_PRICES.ENTERPRISE) return 'enterprise';
  return 'free';
}

/**
 * Map Stripe subscription status to internal status
 *
 * @param status Stripe subscription status
 * @returns Internal subscription status
 */
export function mapStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
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
    case 'incomplete':
      return 'incomplete';
    default:
      return 'none';
  }
}

/**
 * Check if user has sufficient quota for an operation
 *
 * @param plan User's plan type
 * @param usedMinutes Minutes already used in current period
 * @param requestedMinutes Minutes requested for operation
 * @returns True if operation is allowed
 */
export function hasQuota(
  plan: PlanType,
  usedMinutes: number,
  requestedMinutes: number
): boolean {
  const limit = PLAN_LIMITS[plan];

  // Enterprise has unlimited quota
  if (limit === Infinity) return true;

  return usedMinutes + requestedMinutes <= limit;
}

/**
 * Calculate remaining quota for a plan
 *
 * @param plan User's plan type
 * @param usedMinutes Minutes already used in current period
 * @returns Remaining minutes (Infinity for enterprise)
 */
export function getRemainingQuota(
  plan: PlanType,
  usedMinutes: number
): number {
  const limit = PLAN_LIMITS[plan];

  // Enterprise has unlimited quota
  if (limit === Infinity) return Infinity;

  return Math.max(0, limit - usedMinutes);
}

/**
 * Validate Stripe configuration
 * Checks if required environment variables are set
 *
 * @returns True if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return !!(
    import.meta.env.STRIPE_SECRET_KEY &&
    import.meta.env.STRIPE_PUBLISHABLE_KEY
  );
}

/**
 * Get Stripe publishable key for client-side use
 * Safe to expose to frontend
 *
 * @returns Publishable key or empty string if not configured
 */
export function getPublishableKey(): string {
  return import.meta.env.STRIPE_PUBLISHABLE_KEY || '';
}

// ============================================================================
// Export raw Stripe client for advanced operations
// ============================================================================

export { stripe };

/**
 * Export all types for use in other modules
 */
export type {
  CreateCheckoutSessionParams,
  CreatePortalSessionParams,
  GetOrCreateCustomerParams,
  SubscriptionDetails,
  WebhookHandlerResult,
};
