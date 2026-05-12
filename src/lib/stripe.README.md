# Stripe Helper Functions - Quick Reference

## Overview

Comprehensive Stripe integration helper functions located at `/src/lib/stripe.ts`. This module provides production-grade Stripe operations with full TypeScript support, comprehensive error handling, and security best practices.

## Features

- ✅ **Checkout Sessions**: Create subscription checkout sessions
- ✅ **Customer Portal**: Generate billing portal links for subscription management
- ✅ **Webhook Validation**: Secure webhook signature verification
- ✅ **Subscription Management**: Retrieve, update, cancel subscriptions
- ✅ **Customer Management**: Get or create Stripe customers
- ✅ **Quota Management**: Check and enforce usage limits
- ✅ **Error Handling**: Custom error classes with detailed error information
- ✅ **TypeScript Support**: Full type definitions for all operations

## Environment Variables Required

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...           # Required - Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...       # Required - Stripe publishable key (client-side)
STRIPE_WEBHOOK_SECRET=whsec_...          # Required - Webhook signing secret

# Stripe Price IDs (for your subscription plans)
STRIPE_PRICE_ID_FREE=price_...           # Free tier price ID
STRIPE_PRICE_ID_PRO=price_...            # Pro tier price ID
STRIPE_PRICE_ID_ENTERPRISE=price_...     # Enterprise tier price ID
```

## Quick Start

### 1. Creating a Checkout Session

```typescript
import { createCheckoutSession, getOrCreateCustomer, STRIPE_PRICES } from '@/lib/stripe';

// Get or create customer
const customer = await getOrCreateCustomer({
  userId: 'user_123',
  email: 'user@example.com',
  name: 'John Doe',
});

// Create checkout session
const session = await createCheckoutSession({
  userId: 'user_123',
  email: 'user@example.com',
  priceId: STRIPE_PRICES.PRO,
  successUrl: 'https://yourapp.com/billing/success',
  cancelUrl: 'https://yourapp.com/pricing',
  customerId: customer.id,
  metadata: { plan: 'pro' },
  trialPeriodDays: 14,
});

// Redirect to checkout
return Response.redirect(session.url!, 303);
```

### 2. Creating a Customer Portal Session

```typescript
import { createPortalSession } from '@/lib/stripe';

const portalSession = await createPortalSession({
  customerId: 'cus_abc123',
  returnUrl: 'https://yourapp.com/billing',
});

// Redirect to portal
return Response.redirect(portalSession.url, 303);
```

### 3. Validating Webhooks

```typescript
import { constructWebhookEvent, WebhookSignatureError } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Verify signature - throws WebhookSignatureError if invalid
    const event = constructWebhookEvent(rawBody, signature);

    // Handle event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Process checkout completion
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      return new Response('Invalid signature', { status: 400 });
    }
    return new Response('Webhook failed', { status: 500 });
  }
}
```

### 4. Retrieving Subscription Details

```typescript
import { getSubscriptionDetails } from '@/lib/stripe';

const details = await getSubscriptionDetails('sub_abc123');

console.log(details.planType);        // 'pro'
console.log(details.status);          // 'active'
console.log(details.currentPeriodEnd); // Date object
```

### 5. Checking Quota

```typescript
import { hasQuota, PLAN_LIMITS, getRemainingQuota } from '@/lib/stripe';

// Check if user can generate a 5-minute video
const canGenerate = hasQuota('pro', 50, 5); // 50 used, 5 requested
console.log(canGenerate); // true

// Get remaining quota
const remaining = getRemainingQuota('pro', 50);
console.log(remaining); // 250 (300 - 50)
```

## API Reference

### Checkout & Portal Functions

#### `createCheckoutSession(params)`

Creates a Stripe Checkout session for subscription purchase.

**Parameters:**
- `userId` (string): User ID
- `email` (string): User email
- `priceId` (string): Stripe Price ID
- `successUrl` (string): URL to redirect after success
- `cancelUrl` (string): URL to redirect after cancel
- `customerId?` (string): Existing Stripe customer ID
- `metadata?` (object): Additional metadata
- `trialPeriodDays?` (number): Trial period length

**Returns:** `Promise<Stripe.Checkout.Session>`

**Throws:** `StripeError`

#### `createPortalSession(params)`

Creates a billing portal session for subscription management.

**Parameters:**
- `customerId` (string): Stripe Customer ID
- `returnUrl` (string): URL to redirect after portal session

**Returns:** `Promise<Stripe.BillingPortal.Session>`

**Throws:** `StripeError`

### Webhook Functions

#### `constructWebhookEvent(payload, signature)`

Verifies webhook signature and constructs event.

**Parameters:**
- `payload` (string|Buffer): Raw request body
- `signature` (string|null): Stripe-Signature header value

**Returns:** `Stripe.Event`

**Throws:** `WebhookSignatureError`, `StripeError`

#### `isValidWebhookSignature(payload, signature)`

Tests webhook signature without throwing.

**Parameters:**
- `payload` (string|Buffer): Raw request body
- `signature` (string|null): Stripe-Signature header value

**Returns:** `boolean`

### Subscription Functions

#### `getSubscriptionDetails(subscriptionId)`

Retrieves comprehensive subscription details.

**Parameters:**
- `subscriptionId` (string): Stripe Subscription ID

**Returns:** `Promise<SubscriptionDetails>`

**Throws:** `StripeError`

#### `getActiveSubscription(customerId)`

Gets active subscription for a customer.

**Parameters:**
- `customerId` (string): Stripe Customer ID

**Returns:** `Promise<Stripe.Subscription | null>`

#### `cancelSubscriptionAtPeriodEnd(subscriptionId)`

Cancels subscription at period end.

**Parameters:**
- `subscriptionId` (string): Stripe Subscription ID

**Returns:** `Promise<Stripe.Subscription>`

**Throws:** `StripeError`

#### `cancelSubscriptionImmediately(subscriptionId)`

Cancels subscription immediately with proration.

**Parameters:**
- `subscriptionId` (string): Stripe Subscription ID

**Returns:** `Promise<Stripe.Subscription>`

**Throws:** `StripeError`

#### `updateSubscriptionPlan(subscriptionId, newPriceId, prorationBehavior)`

Updates subscription to a different plan.

**Parameters:**
- `subscriptionId` (string): Stripe Subscription ID
- `newPriceId` (string): New price ID
- `prorationBehavior` (string): 'create_prorations' | 'none' | 'always_invoice'

**Returns:** `Promise<Stripe.Subscription>`

**Throws:** `StripeError`

### Customer Functions

#### `getOrCreateCustomer(params)`

Gets or creates Stripe customer for a user.

**Parameters:**
- `userId` (string): User ID
- `email` (string): User email
- `name?` (string): User name
- `metadata?` (object): Additional metadata

**Returns:** `Promise<Stripe.Customer>`

**Throws:** `StripeError`

### Utility Functions

#### `getPlanFromPriceId(priceId)`

Maps Stripe Price ID to internal PlanType.

**Parameters:**
- `priceId` (string): Stripe Price ID

**Returns:** `PlanType`

#### `hasQuota(plan, usedMinutes, requestedMinutes)`

Checks if user has sufficient quota.

**Parameters:**
- `plan` (PlanType): User's plan
- `usedMinutes` (number): Minutes used this period
- `requestedMinutes` (number): Minutes requested

**Returns:** `boolean`

#### `getRemainingQuota(plan, usedMinutes)`

Calculates remaining quota for a plan.

**Parameters:**
- `plan` (PlanType): User's plan
- `usedMinutes` (number): Minutes used this period

**Returns:** `number` (Infinity for enterprise)

#### `isStripeConfigured()`

Checks if Stripe is properly configured.

**Returns:** `boolean`

#### `getPublishableKey()`

Gets Stripe publishable key for client-side use.

**Returns:** `string`

## Error Handling

### StripeError

Custom error class for Stripe-related failures.

```typescript
try {
  await createCheckoutSession(params);
} catch (error) {
  if (error instanceof StripeError) {
    console.error(error.message);   // Human-readable error
    console.error(error.code);      // Stripe error code
    console.error(error.statusCode);// HTTP status code
  }
}
```

### WebhookSignatureError

Error for webhook signature validation failures.

```typescript
try {
  const event = constructWebhookEvent(payload, signature);
} catch (error) {
  if (error instanceof WebhookSignatureError) {
    // Security issue - log and return 400
    return new Response('Invalid signature', { status: 400 });
  }
}
```

## Plan Types & Limits

```typescript
type PlanType = 'free' | 'pro' | 'enterprise';

const PLAN_LIMITS = {
  free: 5,        // 5 minutes per month
  pro: 300,       // 300 minutes per month
  enterprise: Infinity,  // Unlimited
};
```

## Subscription Status Mapping

```typescript
type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete';
```

## Webhook Event Handling

Common webhook events to handle:

- `checkout.session.completed` - User completed checkout
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Successful payment
- `invoice.payment_failed` - Payment failed

## Best Practices

### 1. Always validate webhooks

```typescript
// ✅ Good - Validate signature
const event = constructWebhookEvent(rawBody, signature);

// ❌ Bad - No validation
const event = JSON.parse(rawBody);
```

### 2. Use error boundaries

```typescript
// ✅ Good - Specific error handling
try {
  await createCheckoutSession(params);
} catch (error) {
  if (error instanceof StripeError) {
    // Handle Stripe errors
  }
}

// ❌ Bad - Generic error handling
try {
  await createCheckoutSession(params);
} catch (error) {
  // Can't distinguish error types
}
```

### 3. Check configuration

```typescript
// ✅ Good - Check before using
if (!isStripeConfigured()) {
  throw new Error('Stripe not configured');
}

// ❌ Bad - Assume it's configured
await createCheckoutSession(params); // May fail silently
```

### 4. Use metadata wisely

```typescript
// ✅ Good - Include necessary IDs
await createCheckoutSession({
  metadata: {
    userId,
    organizationId,
    plan,
  },
});

// ❌ Bad - Insufficient metadata
await createCheckoutSession({
  metadata: {}, // Can't identify user later
});
```

## Testing

See `/src/lib/stripe.example.ts` for comprehensive usage examples and testing patterns.

## Integration with Database

Use these functions in combination with your repositories:

```typescript
// Get user subscription
const subscription = await userSubscriptionRepository.getSubscription(userId);

// Check quota
const canGenerate = hasQuota(
  subscription.planType,
  subscription.usedMinutesThisPeriod,
  requestedMinutes
);

// Get Stripe details
const stripeDetails = await getSubscriptionDetails(subscription.subscriptionId);
```

## Security Considerations

1. **Never expose secret key** on client-side
2. **Always validate webhook signatures** to prevent spoofing
3. **Use metadata** to link Stripe objects to your database
4. **Handle errors gracefully** to avoid leaking information
5. **Check quotas** before allowing operations

## Troubleshooting

### Webhook signature verification fails

- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Ensure you're using raw body, not parsed JSON
- Verify webhook secret matches in Stripe Dashboard

### Customer search fails

- Customer search API requires special permissions
- Handle search failures gracefully, create new customer if needed

### Price ID not found

- Verify price IDs in environment variables
- Check prices are active in Stripe Dashboard
- Ensure API version matches price creation

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Example Code](/src/lib/stripe.example.ts)
