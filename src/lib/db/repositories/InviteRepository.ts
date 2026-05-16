/**
 * Invite Repository - Graph-Based Implementation
 *
 * Repository for Invite entity operations using graph queries.
 * Used for managing platform invite links for Shop Owners and Drivers.
 *
 * @module lib/db/repositories/InviteRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export type InviteType = "shop_owner" | "driver";
export type InviteStatus = "pending" | "used" | "expired" | "revoked";

export interface Invite {
  id: string;
  token: string;
  type: InviteType;
  status: InviteStatus;
  createdBy: string;
  usedBy: string | null;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
}

export interface CreateInviteData {
  type: InviteType;
  createdBy: string;
  expiresInDays?: number;
}

export interface ListInvitesOptions {
  limit?: number;
  offset?: number;
  status?: InviteStatus;
  type?: InviteType;
  createdBy?: string;
  orderDir?: "ASC" | "DESC";
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a URL-safe random token for invite links
 */
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================================================
// Invite Repository
// ============================================================================

/**
 * Repository for Invite entity operations using graph queries
 */
export class InviteRepository {
  /**
   * Create a new invite
   *
   * @param data Invite data
   * @returns Created invite
   *
   * @example
   * ```typescript
   * const invite = await inviteRepository.create({
   *   type: "shop_owner",
   *   createdBy: "user_123",
   *   expiresInDays: 7
   * });
   * ```
   */
  async create(data: CreateInviteData): Promise<Invite> {
    const inviteId = `inv_${ulid()}`;
    const token = generateToken();
    const now = new Date();
    const expiresInDays = data.expiresInDays ?? 7;
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const result = await graph.mutate(
      `
      CREATE (i:Invite {
        id: $id,
        token: $token,
        type: $type,
        status: $status,
        createdBy: $createdBy,
        usedBy: $usedBy,
        expiresAt: $expiresAt,
        createdAt: $createdAt,
        usedAt: $usedAt
      })
      RETURN i
      `,
      {
        id: inviteId,
        token,
        type: data.type,
        status: "pending",
        createdBy: data.createdBy,
        usedBy: null,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        usedAt: null,
      }
    );

    return this.mapNodeToInvite(result);
  }

  /**
   * Find invite by ID
   *
   * @param id Invite ID
   * @returns Invite or null if not found
   */
  async findById(id: string): Promise<Invite | null> {
    const results = await graph.query<any>(
      `
      MATCH (i:Invite {id: $id})
      RETURN i
      `,
      { id }
    );

    if (results.length === 0 || !results[0].i) {
      return null;
    }

    return this.mapNodeToInvite(results[0].i);
  }

  /**
   * Find invite by token
   *
   * @param token Invite token
   * @returns Invite or null if not found
   */
  async findByToken(token: string): Promise<Invite | null> {
    const results = await graph.query<any>(
      `
      MATCH (i:Invite {token: $token})
      RETURN i
      `,
      { token }
    );

    if (results.length === 0 || !results[0].i) {
      return null;
    }

    return this.mapNodeToInvite(results[0].i);
  }

  /**
   * Validate an invite token
   * Checks if token exists, is pending, and not expired
   *
   * @param token Invite token
   * @returns Invite if valid, null if invalid/expired/used
   */
  async validateToken(token: string): Promise<Invite | null> {
    const invite = await this.findByToken(token);

    if (!invite) {
      return null;
    }

    // Check if expired
    if (new Date(invite.expiresAt) < new Date()) {
      // Auto-expire the invite
      await this.updateStatus(invite.id, "expired");
      return null;
    }

    // Check if already used or revoked
    if (invite.status !== "pending") {
      return null;
    }

    return invite;
  }

  /**
   * List all invites with pagination and filtering
   *
   * @param options Query options
   * @returns Invites and total count
   */
  async list(options: ListInvitesOptions = {}): Promise<{
    invites: Invite[];
    total: number;
  }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Build query - for now using basic MATCH since filtering in SQL is complex
    const results = await graph.query<any>(
      `
      MATCH (i:Invite)
      RETURN i
      ORDER BY i.createdAt ${options.orderDir || "DESC"}
      LIMIT $limit
      SKIP $offset
      `,
      { limit, offset }
    );

    let invites = results
      .filter((r) => r.i)
      .map((result) => this.mapNodeToInvite(result.i));

    // Apply filters in memory (for MVP - can optimize later with raw SQL)
    if (options.status) {
      invites = invites.filter((inv) => inv.status === options.status);
    }
    if (options.type) {
      invites = invites.filter((inv) => inv.type === options.type);
    }
    if (options.createdBy) {
      invites = invites.filter((inv) => inv.createdBy === options.createdBy);
    }

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (i:Invite)
      RETURN count(i) as count
      `
    );

    const total = countResults[0]?.count || 0;

    return { invites, total };
  }

  /**
   * Mark invite as used
   *
   * @param token Invite token
   * @param userId User ID who used the invite
   * @returns Updated invite
   */
  async markUsed(token: string, userId: string): Promise<Invite> {
    const invite = await this.findByToken(token);

    if (!invite) {
      throw new Error(`Invite with token ${token} not found`);
    }

    const result = await graph.updateNode(invite.id, {
      status: "used",
      usedBy: userId,
      usedAt: new Date().toISOString(),
    });

    return this.mapNodeToInvite(result);
  }

  /**
   * Update invite status
   *
   * @param id Invite ID
   * @param status New status
   * @returns Updated invite
   */
  async updateStatus(id: string, status: InviteStatus): Promise<Invite> {
    const result = await graph.updateNode(id, { status });
    return this.mapNodeToInvite(result);
  }

  /**
   * Revoke an invite (set status to revoked)
   *
   * @param id Invite ID
   * @returns Updated invite
   */
  async revoke(id: string): Promise<Invite> {
    return this.updateStatus(id, "revoked");
  }

  /**
   * Delete an invite
   *
   * @param id Invite ID
   * @returns True if deleted
   */
  async delete(id: string): Promise<boolean> {
    return graph.deleteNode(id);
  }

  /**
   * Get invites created by a specific user
   *
   * @param userId User ID
   * @returns List of invites
   */
  async getByCreator(userId: string): Promise<Invite[]> {
    const results = await graph.query<any>(
      `
      MATCH (i:Invite {createdBy: $userId})
      RETURN i
      ORDER BY i.createdAt DESC
      `,
      { userId }
    );

    return results
      .filter((r) => r.i)
      .map((result) => this.mapNodeToInvite(result.i));
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToInvite(node: Node): Invite {
    const props =
      typeof node.properties === "string"
        ? JSON.parse(node.properties)
        : node.properties;

    const id = props?.id || node.id;

    return {
      id,
      token: props?.token,
      type: props?.type as InviteType,
      status: props?.status as InviteStatus,
      createdBy: props?.createdBy,
      usedBy: props?.usedBy || null,
      expiresAt: props?.expiresAt,
      createdAt: props?.createdAt,
      usedAt: props?.usedAt || null,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const inviteRepository = new InviteRepository();
