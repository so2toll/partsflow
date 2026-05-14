/**
 * Order Repository - Graph-Based Implementation
 *
 * Repository for Order entity operations using graph queries.
 * Manages parts delivery orders with priority-based pricing and SLA tracking.
 *
 * @module lib/db/repositories/OrderRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export type OrderPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type OrderStatus = 'pending' | 'dispatched' | 'picked_up' | 'en_route' | 'delivered' | 'confirmed' | 'cancelled' | 'failed';

export interface Order {
  id: string;
  shopId: string;
  createdBy: string;
  priority: OrderPriority;
  status: OrderStatus;
  deliveryAddress: string;
  totalCents: number;
  deliveryFeeCents: number;
  slaTargetAt: string;
  deliveredAt: string | null;
  partNumber: string;
  partName: string;
  supplierId: string;
  supplierName: string;
  driverId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  shopId: string;
  createdBy: string;
  priority: OrderPriority;
  deliveryAddress: string;
  partNumber: string;
  partName: string;
  supplierId: string;
  supplierName: string;
  partsCostCents: number;
}

export interface ListOrdersOptions {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
  priority?: OrderPriority;
  shopId?: string;
  driverId?: string;
}

// ============================================================================
// Priority Configuration
// ============================================================================

const PRIORITY_CONFIG = {
  P0: {
    deliveryFeeCents: 5500, // $55
    slaMinutes: 30,
    label: 'Emergency',
    color: 'red',
  },
  P1: {
    deliveryFeeCents: 3800, // $38
    slaMinutes: 45,
    label: 'Urgent',
    color: 'yellow',
  },
  P2: {
    deliveryFeeCents: 2200, // $22
    slaMinutes: 60,
    label: 'Standard',
    color: 'orange',
  },
  P3: {
    deliveryFeeCents: 1600, // $16
    slaMinutes: 120,
    label: 'Scheduled',
    color: 'blue',
  },
} as const;

// ============================================================================
// Order Repository
// ============================================================================

export class OrderRepository {
  constructor(private graph: typeof graph) {}

  /**
   * Calculate SLA target timestamp based on priority
   *
   * @param priority Order priority level
   * @returns ISO timestamp of SLA target
   */
  private calculateSlaTarget(priority: OrderPriority): string {
    const minutes = PRIORITY_CONFIG[priority].slaMinutes;
    const target = new Date();
    target.setMinutes(target.getMinutes() + minutes);
    return target.toISOString();
  }

  /**
   * Calculate delivery fee based on priority
   *
   * @param priority Order priority level
   * @returns Delivery fee in cents
   */
  private calculateDeliveryFee(priority: OrderPriority): number {
    return PRIORITY_CONFIG[priority].deliveryFeeCents;
  }

  /**
   * Create a new order
   *
   * @param data Order data including shop, part, supplier, and priority
   * @returns Created order
   *
   * @example
   * ```typescript
   * const order = await orderRepository.create({
   *   shopId: 'org_abc123',
   *   createdBy: 'user_xyz789',
   *   priority: 'P2',
   *   deliveryAddress: '123 Main St, Baltimore, MD 21201',
   *   partNumber: 'BB-1234',
   *   partName: 'Brake Booster Assembly',
   *   supplierId: 'sup_def456',
   *   supplierName: 'Advance Auto Parts',
   *   partsCostCents: 18999
   * });
   * ```
   */
  async create(data: CreateOrderData): Promise<Order> {
    const orderId = `ord_${ulid()}`;
    const now = new Date().toISOString();
    const deliveryFeeCents = this.calculateDeliveryFee(data.priority);
    const slaTargetAt = this.calculateSlaTarget(data.priority);
    const totalCents = data.partsCostCents + deliveryFeeCents;

    // Use graph mutation to create order node
    const result = await graph.mutate(
      `
      CREATE (o:Order {
        id: $id,
        shopId: $shopId,
        createdBy: $createdBy,
        priority: $priority,
        status: $status,
        deliveryAddress: $deliveryAddress,
        totalCents: $totalCents,
        deliveryFeeCents: $deliveryFeeCents,
        slaTargetAt: $slaTargetAt,
        deliveredAt: $deliveredAt,
        partNumber: $partNumber,
        partName: $partName,
        supplierId: $supplierId,
        supplierName: $supplierName,
        driverId: $driverId,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN o
      `,
      {
        id: orderId,
        shopId: data.shopId,
        createdBy: data.createdBy,
        priority: data.priority,
        status: 'pending',
        deliveryAddress: data.deliveryAddress,
        totalCents,
        deliveryFeeCents,
        slaTargetAt,
        deliveredAt: null,
        partNumber: data.partNumber,
        partName: data.partName,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        driverId: null,
        now,
      }
    );

    // Create HAS_ORDER relationship from Shop to Order
    await graph.createRelationship(data.shopId, orderId, "HAS_ORDER", {
      createdAt: now,
    });

    console.log(`[OrderRepo] Created order ${orderId} for shop ${data.shopId}`);

    return this.mapNodeToOrder(result);
  }

  /**
   * Find order by ID
   *
   * @param id Order ULID
   * @returns Order or null if not found
   */
  async findById(id: string): Promise<Order | null> {
    const results = await graph.query<any>(
      `
      MATCH (o:Order {id: $id})
      RETURN o
      `,
      { id }
    );

    if (results.length === 0 || !results[0].o) {
      return null;
    }

    return this.mapNodeToOrder(results[0].o);
  }

  /**
   * Find orders by shop ID
   *
   * @param shopId Organization ULID
   * @param options Query options (status, priority, pagination)
   * @returns Orders and total count
   */
  async findByShopId(
    shopId: string,
    options: Omit<ListOrdersOptions, 'shopId'> = {}
  ): Promise<{ orders: Order[]; total: number }> {
    return this.list({ ...options, shopId });
  }

  /**
   * Find orders assigned to a driver
   *
   * @param driverId Driver ULID
   * @param options Query options
   * @returns Orders and total count
   */
  async findByDriverId(
    driverId: string,
    options: Omit<ListOrdersOptions, 'driverId'> = {}
  ): Promise<{ orders: Order[]; total: number }> {
    return this.list({ ...options, driverId });
  }

  /**
   * Update order status
   *
   * Advances the order through its lifecycle and sets deliveredAt timestamp when appropriate.
   *
   * @param orderId Order ULID
   * @param status New status
   * @returns Updated order
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    // Set deliveredAt timestamp when order is delivered
    if (status === 'delivered') {
      updateData.deliveredAt = new Date().toISOString();
    }

    const result = await graph.updateNode(orderId, updateData);

    console.log(`[OrderRepo] Updated order ${orderId} status to ${status}`);

    return this.mapNodeToOrder(result);
  }

  /**
   * Dispatch an order to a driver
   *
   * Assigns a driver to the order and updates status to 'dispatched'.
   *
   * @param orderId Order ULID
   * @param driverId Driver ULID
   * @returns Updated order
   */
  async dispatch(orderId: string, driverId: string): Promise<Order> {
    // Update order with driver assignment and status
    const result = await graph.updateNode(orderId, {
      driverId,
      status: 'dispatched',
      updatedAt: new Date().toISOString(),
    });

    // Create DELIVERING relationship from Driver to Order
    await graph.createRelationship(driverId, orderId, "DELIVERING", {
      assignedAt: new Date().toISOString(),
    });

    console.log(`[OrderRepo] Dispatched order ${orderId} to driver ${driverId}`);

    return this.mapNodeToOrder(result);
  }

  /**
   * Find all pending orders ready for dispatch
   *
   * @returns Array of pending orders
   */
  async findPending(): Promise<Order[]> {
    const results = await graph.query<any>(
      `
      MATCH (o:Order {status: 'pending'})
      RETURN o
      ORDER BY o.priority ASC, o.createdAt ASC
      `
    );

    return results
      .filter((r) => r.o)
      .map((result) => this.mapNodeToOrder(result.o));
  }

  /**
   * List orders with filters and pagination
   *
   * @param options Query options (filters, pagination)
   * @returns Orders and total count
   */
  async list(options: ListOrdersOptions = {}): Promise<{ orders: Order[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (options.status) {
      conditions.push('o.status = $status');
      params.status = options.status;
    }

    if (options.priority) {
      conditions.push('o.priority = $priority');
      params.priority = options.priority;
    }

    if (options.shopId) {
      conditions.push('o.shopId = $shopId');
      params.shopId = options.shopId;
    }

    if (options.driverId) {
      conditions.push('o.driverId = $driverId');
      params.driverId = options.driverId;
    }

    const whereClause = conditions.length > 0
      ? ` WHERE ${conditions.join(' AND ')}`
      : '';

    const results = await graph.query<any>(
      `
      MATCH (o:Order)
      ${whereClause}
      RETURN o
      ORDER BY o.createdAt DESC
      LIMIT ${limit}
      SKIP ${offset}
      `,
      params
    );

    const orders = results
      .filter((r) => r.o)
      .map((result) => this.mapNodeToOrder(result.o));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (o:Order)
      ${whereClause}
      RETURN count(o) as count
      `,
      params
    );

    const total = countResults[0]?.count || 0;

    return { orders, total };
  }

  /**
   * Get priority configuration
   *
   * @returns Priority configuration object
   */
  getPriorityConfig() {
    return PRIORITY_CONFIG;
  }

  /**
   * Get SLA status for an order
   *
   * @param order Order object
   * @returns SLA status: 'ahead', 'on_track', 'at_risk', 'overdue'
   */
  getSlaStatus(order: Order): 'ahead' | 'on_track' | 'at_risk' | 'overdue' {
    const now = Date.now();
    const slaTarget = new Date(order.slaTargetAt).getTime();
    const diff = slaTarget - now;

    // Overdue: past SLA target
    if (diff < 0) {
      return 'overdue';
    }

    // At risk: within 10 minutes of SLA
    if (diff < 10 * 60 * 1000) {
      return 'at_risk';
    }

    // On track: within 50% of SLA time
    const totalSlaTime = PRIORITY_CONFIG[order.priority].slaMinutes * 60 * 1000;
    if (diff < totalSlaTime * 0.5) {
      return 'on_track';
    }

    // Ahead: more than 50% of SLA time remaining
    return 'ahead';
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToOrder(node: Node): Order {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id (SQL primary key)
    const id = props?.id || node.id;

    return {
      id,
      shopId: props?.shopId,
      createdBy: props?.createdBy,
      priority: props?.priority as OrderPriority || 'P2',
      status: props?.status as OrderStatus || 'pending',
      deliveryAddress: props?.deliveryAddress,
      totalCents: props?.totalCents || 0,
      deliveryFeeCents: props?.deliveryFeeCents || 0,
      slaTargetAt: props?.slaTargetAt,
      deliveredAt: props?.deliveredAt || null,
      partNumber: props?.partNumber,
      partName: props?.partName,
      supplierId: props?.supplierId,
      supplierName: props?.supplierName,
      driverId: props?.driverId || null,
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const orderRepository = new OrderRepository(graph);
