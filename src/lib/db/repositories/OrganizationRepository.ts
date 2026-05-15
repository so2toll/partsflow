/**
 * Organization Repository - Graph-Based Implementation
 *
 * Repository for Organization entity operations using graph queries.
 * Uses the graph abstraction layer for all data access.
 *
 * @module lib/db/repositories/OrganizationRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export type OrganizationType = 'shop' | 'supplier' | 'fleet' | 'other';

export interface Organization {
  id: string;
  name: string;
  orgType: OrganizationType;  // Renamed from 'type' to avoid JS reserved word conflicts
  domain?: string;
  address?: string;
  phone?: string;
  email?: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  branding?: {
    logo?: string;
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
  limits?: {
    maxVideos?: number;
    maxStorageGB?: number;
    maxUsers?: number;
  };
  features?: {
    autoHighlights?: boolean;
    customAIModels?: boolean;
    advancedAnalytics?: boolean;
  };
}

export interface OrganizationUser {
  userId: string;
  organizationId: string;
  role: "Admin" | "User" | "Viewer";
  joinedAt: string;
}

// ============================================================================
// Organization Repository
// ============================================================================

/**
 * Repository for Organization entity operations using graph queries
 */
export class OrganizationRepository {
  /**
   * Create a new organization
   *
   * @param data Organization data
   * @returns Created organization
   *
   * @example
   * ```typescript
   * const repo = new OrganizationRepository();
   * const org = await repo.create({
   *   name: "Acme Corp",
   *   domain: "acme.com"
   * });
   * ```
   */
  async create(data: {
    name: string;
    orgType?: OrganizationType;  // Renamed from 'type'
    domain?: string;
    address?: string;
    phone?: string;
    email?: string;
    settings?: Partial<OrganizationSettings>;
  }): Promise<Organization> {
    const orgId = `org_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create organization node
    const result = await graph.mutate(
      `
      CREATE (o:Organization {
        id: $id,
        name: $name,
        orgType: $orgType,
        domain: $domain,
        address: $address,
        phone: $phone,
        email: $email,
        settings: $settings,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN o
      `,
      {
        id: orgId,
        name: data.name,
        orgType: data.orgType || 'other',
        domain: data.domain || null,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        settings: JSON.stringify(data.settings || {}),
        now,
      }
    );

    return this.mapNodeToOrganization(result);
  }

  /**
   * Find organization by ID
   *
   * @param id Organization ID
   * @returns Organization or null if not found
   */
  async findById(id: string): Promise<Organization | null> {
    const results = await graph.query<any>(
      `
      MATCH (o:Organization {id: $id})
      RETURN o
      `,
      { id }
    );

    if (results.length === 0 || !results[0].o) {
      return null;
    }

    return this.mapNodeToOrganization(results[0].o);
  }

  /**
   * Find organization by domain
   *
   * @param domain Organization domain
   * @returns Organization or null if not found
   */
  async findByDomain(domain: string): Promise<Organization | null> {
    const results = await graph.query<any>(
      `
      MATCH (o:Organization {domain: $domain})
      RETURN o
      `,
      { domain }
    );

    if (results.length === 0 || !results[0].o) {
      return null;
    }

    return this.mapNodeToOrganization(results[0].o);
  }

  /**
   * List all organizations with pagination
   *
   * @param options Query options
   * @returns Organizations and total count
   */
  async list(options: {
    limit?: number;
    offset?: number;
    orgType?: OrganizationType;  // Renamed from 'type'
    orderBy?: string;
    orderDir?: "ASC" | "DESC";
  } = {}): Promise<{ organizations: Organization[]; total: number }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get organizations using graph query
    const results = await graph.query<any>(
      `
      MATCH (o:Organization)
      RETURN o
      ORDER BY o.createdAt ${options.orderDir || "DESC"}
      LIMIT $limit
      SKIP $offset
      `,
      { limit, offset }
    );

    let organizations = results
      .filter((r) => r.o)
      .map((result) => this.mapNodeToOrganization(result.o));

    // Filter by orgType if specified
    if (options.orgType) {
      organizations = organizations.filter(org => org.orgType === options.orgType);
    }

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (o:Organization)
      RETURN count(o) as count
      `
    );

    const total = countResults[0]?.count || 0;

    return { organizations, total };
  }

  /**
   * Find organizations by orgType
   *
   * @param orgType Organization type
   * @returns Organizations of the specified type
   */
  async findByType(orgType: OrganizationType): Promise<Organization[]> {
    const { organizations } = await this.list({ orgType, limit: 1000 });
    return organizations;
  }

  /**
   * Update organization
   *
   * @param id Organization ID
   * @param data Updates to apply
   * @returns Updated organization
   */
  async update(
    id: string,
    data: Partial<
      Omit<Organization, "id" | "createdAt" | "updatedAt"> & {
        settings?: Partial<OrganizationSettings>;
      }
    >
  ): Promise<Organization> {
    // Build updates object
    const updates: Record<string, unknown> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.domain !== undefined) updates.domain = data.domain;
    if (data.settings !== undefined) updates.settings = JSON.stringify(data.settings);

    const result = await graph.updateNode(id, updates);

    return this.mapNodeToOrganization(result);
  }

  /**
   * Add a user to an organization (creates OWNS relationship)
   *
   * @param userId User ID
   * @param organizationId Organization ID
   * @param role User role in organization (Admin, User, Viewer)
   * @returns Created relationship
   *
   * @example
   * ```typescript
   * await repo.addUser("user_123", "org_456", "Admin");
   * ```
   */
  async addUser(
    userId: string,
    organizationId: string,
    role: "Admin" | "User" | "Viewer" = "User"
  ): Promise<void> {
    const now = new Date().toISOString();

    // Create OWNS relationship from user to organization
    await graph.createRelationship(userId, organizationId, "OWNS", {
      role,
      joinedAt: now,
    });

    // Update the User node to include organizationId
    await graph.query<any>(
      `
      MATCH (u:User {id: $userId})
      SET u.organizationId = $organizationId, u.role = $role
      RETURN u
      `,
      { userId, organizationId, role }
    );
  }

  /**
   * Get all users in an organization
   *
   * @param organizationId Organization ID
   * @returns Users with their roles
   */
  async getUsers(organizationId: string): Promise<
    Array<{
      user: Node;
      role: string;
      joinedAt: string;
    }>
  > {
    const results = await graph.query<any>(
      `
      MATCH (u:User)-[r:OWNS]->(o:Organization {id: $organizationId})
      RETURN u, r.role as role, r.joinedAt as joinedAt
      ORDER BY r.joinedAt DESC
      `,
      { organizationId }
    );

    return results.map((result) => ({
      user: result.u,
      role: result.role,
      joinedAt: result.joinedAt,
    }));
  }

  /**
   * Get organization for a user
   *
   * @param userId User ID
   * @returns Organization or null if user not in an organization
   */
  async findByUserId(userId: string): Promise<Organization | null> {
    const results = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[:OWNS]->(o:Organization)
      RETURN o
      `,
      { userId }
    );

    if (results.length === 0 || !results[0].o) {
      return null;
    }

    return this.mapNodeToOrganization(results[0].o);
  }

  /**
   * Verify that a user is an active member of an organization
   *
   * @param userId User ID
   * @param organizationId Organization ID
   * @returns true if user is an active member, false otherwise
   */
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const results = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[r:OWNS]->(o:Organization {id: $organizationId})
      RETURN count(r) as memberCount
      `,
      { userId, organizationId }
    );

    return (results[0]?.memberCount || 0) > 0;
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToOrganization(node: Node): Organization {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id (SQL primary key)
    const id = props?.id || node.id;

    return {
      id,
      name: props?.name,
      orgType: props?.orgType || props?.type || 'other',  // Support both orgType and legacy type
      domain: props?.domain,
      address: props?.address,
      phone: props?.phone,
      email: props?.email,
      settings:
        typeof props?.settings === "string"
          ? JSON.parse(props.settings)
          : props?.settings || {},
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const organizationRepository = new OrganizationRepository();
