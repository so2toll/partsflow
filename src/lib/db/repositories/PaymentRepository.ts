/**
 * Payment Repository - Graph-Based Implementation
 *
 * Repository for PaymentEvent entity operations using graph queries.
 * PaymentEvents track Stripe webhook events for billing and usage tracking.
 *
 * @module lib/db/repositories/PaymentRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export interface PaymentEvent {
  id: string;              // pay_xxx
  userId: string;
  stripeEventId: string;
  eventType: string;       // 'subscription_created' | 'charge_succeeded' | etc
  amountCents: number;
  currency: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreatePaymentEventData {
  userId: string;
  stripeEventId: string;
  eventType: string;
  amountCents: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Payment Repository
// ============================================================================

/**
 * Repository for PaymentEvent entity operations using graph queries
 */
export class PaymentRepository {
  /**
   * Create a new payment event
   *
   * @param data Payment event data
   * @returns Created payment event
   *
   * @example
   * ```typescript
   * const repo = new PaymentRepository();
   * const payment = await repo.create({
   *   userId: "user_123",
   *   stripeEventId: "evt_abc123",
   *   eventType: "charge_succeeded",
   *   amountCents: 2999,
   *   currency: "usd"
   * });
   * ```
   */
  async create(data: CreatePaymentEventData): Promise<PaymentEvent> {
    const paymentId = `pay_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create payment event node
    const result = await graph.mutate(
      `
      CREATE (p:PaymentEvent {
        id: $id,
        userId: $userId,
        stripeEventId: $stripeEventId,
        eventType: $eventType,
        amountCents: $amountCents,
        currency: $currency,
        metadata: $metadata,
        createdAt: $now
      })
      RETURN p
      `,
      {
        id: paymentId,
        userId: data.userId,
        stripeEventId: data.stripeEventId,
        eventType: data.eventType,
        amountCents: data.amountCents,
        currency: data.currency,
        metadata: JSON.stringify(data.metadata || {}),
        now,
      }
    );

    // Create MADE_PAYMENT relationship from user to payment
    await graph.createRelationship(data.userId, paymentId, "MADE_PAYMENT", {
      createdAt: now,
    });

    return this.mapNodeToPayment(result);
  }

  /**
   * Find payment event by ID
   *
   * @param id Payment event ID
   * @returns Payment event or null if not found
   */
  async findById(id: string): Promise<PaymentEvent | null> {
    const results = await graph.query<any>(
      `
      MATCH (p:PaymentEvent {id: $id})
      RETURN p
      `,
      { id }
    );

    if (results.length === 0 || !results[0].p) {
      return null;
    }

    return this.mapNodeToPayment(results[0].p);
  }

  /**
   * Find payment event by Stripe event ID (for idempotency)
   *
   * @param stripeEventId Stripe event ID
   * @returns Payment event or null if not found
   */
  async findByStripeEventId(stripeEventId: string): Promise<PaymentEvent | null> {
    const results = await graph.query<any>(
      `
      MATCH (p:PaymentEvent {stripeEventId: $stripeEventId})
      RETURN p
      `,
      { stripeEventId }
    );

    if (results.length === 0 || !results[0].p) {
      return null;
    }

    return this.mapNodeToPayment(results[0].p);
  }

  /**
   * Find all payment events for a user
   *
   * @param userId User ID
   * @param options Query options
   * @returns Payment events and total count
   */
  async findByUser(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ payments: PaymentEvent[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get payments using graph query
    const results = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[:MADE_PAYMENT]->(p:PaymentEvent)
      RETURN p
      ORDER BY p.createdAt DESC
      LIMIT ${limit}
      SKIP ${offset}
      `,
      { userId }
    );

    const payments = results
      .filter((r) => r.p)
      .map((result) => this.mapNodeToPayment(result.p));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (u:User {id: $userId})-[:MADE_PAYMENT]->(p:PaymentEvent)
      RETURN count(p) as count
      `,
      { userId }
    );

    const total = countResults[0]?.count || 0;

    return { payments, total };
  }

  /**
   * Calculate total spend by user within a date range
   *
   * @param userId User ID
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @returns Total amount in cents
   */
  async sumByUser(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    // Get all payments for user
    const { payments } = await this.findByUser(userId, { limit: 1000 });

    // Filter by date range if provided
    let filteredPayments = payments;

    if (startDate) {
      filteredPayments = filteredPayments.filter(
        (p) => p.createdAt >= startDate
      );
    }

    if (endDate) {
      filteredPayments = filteredPayments.filter(
        (p) => p.createdAt <= endDate
      );
    }

    // Sum up the amounts
    return filteredPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToPayment(node: Node): PaymentEvent {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id
    const id = props?.id || node.id;

    return {
      id,
      userId: props?.userId,
      stripeEventId: props?.stripeEventId,
      eventType: props?.eventType,
      amountCents: props?.amountCents ?? 0,
      currency: props?.currency || 'usd',
      metadata: typeof props?.metadata === 'string'
        ? JSON.parse(props.metadata)
        : props?.metadata || {},
      createdAt: props?.createdAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const paymentRepository = new PaymentRepository();
