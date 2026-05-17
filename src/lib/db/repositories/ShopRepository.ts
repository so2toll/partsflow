/**
 * Shop Repository - Thin Wrapper Around Organization
 *
 * Provides a shop-specific API that wraps OrganizationRepository.
 * All shops are Organizations with orgType='shop'.
 *
 * @module lib/db/repositories/ShopRepository
 * @version 0.1.0
 */

import { organizationRepository, type Organization, type OrganizationSettings } from "./OrganizationRepository";

// ============================================================================
// Types
// ============================================================================

/**
 * Shop is an Organization with orgType='shop'
 * This type alias makes the API clearer for shop-specific code
 */
export type Shop = Organization;

export interface CreateShopData {
  name: string;
  address: string;
  phone: string;
  email: string;
  domain?: string;
  settings?: Partial<OrganizationSettings>;
}

// ============================================================================
// Shop Repository
// ============================================================================

/**
 * Repository for Shop operations
 * Wraps OrganizationRepository with orgType='shop' enforcement
 */
export class ShopRepository {
  /**
   * Create a new shop
   *
   * @param data Shop data
   * @returns Created shop (Organization with orgType='shop')
   *
   * @example
   * ```typescript
   * const shop = await shopRepository.create({
   *   name: "Baltimore Auto Repair",
   *   address: "123 Main St, Baltimore, MD 21201",
   *   phone: "(410) 555-0123",
   *   email: "shop@example.com"
   * });
   * ```
   */
  async create(data: CreateShopData): Promise<Shop> {
    return organizationRepository.create({
      ...data,
      orgType: 'shop',
    });
  }

  /**
   * Find shop by ID
   *
   * @param id Shop/Organization ID
   * @returns Shop or null if not found
   */
  async findById(id: string): Promise<Shop | null> {
    const org = await organizationRepository.findById(id);

    // Verify it's actually a shop
    if (org && org.orgType !== 'shop') {
      return null;
    }

    return org;
  }

  /**
   * Find shop by domain
   *
   * @param domain Shop domain
   * @returns Shop or null if not found
   */
  async findByDomain(domain: string): Promise<Shop | null> {
    const org = await organizationRepository.findByDomain(domain);

    if (org && org.orgType !== 'shop') {
      return null;
    }

    return org;
  }

  /**
   * List all shops with pagination
   *
   * @param options Query options
   * @returns Shops and total count
   */
  async list(options: {
    limit?: number;
    offset?: number;
    orderDir?: "ASC" | "DESC";
  } = {}): Promise<{ shops: Shop[]; total: number }> {
    const { organizations, total } = await organizationRepository.list({
      ...options,
      orgType: 'shop',
    });

    return { shops: organizations, total };
  }

  /**
   * Update shop
   *
   * @param id Shop ID
   * @param data Updates to apply
   * @returns Updated shop
   */
  async update(
    id: string,
    data: Partial<Omit<Shop, "id" | "orgType" | "createdAt" | "updatedAt">>
  ): Promise<Shop> {
    return organizationRepository.update(id, data);
  }

  /**
   * Add a user to a shop (creates OWNS relationship)
   *
   * @param userId User ID
   * @param shopId Shop ID
   * @param role User role in shop (Owner, Manager, Tech, Viewer)
   */
  async addUser(
    userId: string,
    shopId: string,
    role: "Owner" | "Manager" | "Tech" | "Viewer" = "Tech"
  ): Promise<void> {
    // Map shop roles to organization roles
    const orgRole = role === "Owner" || role === "Manager" ? "Admin" :
                    role === "Tech" ? "User" : "Viewer";

    await organizationRepository.addUser(userId, shopId, orgRole);
  }

  /**
   * Get all users in a shop
   *
   * @param shopId Shop ID
   * @returns Users with their roles
   */
  async getUsers(shopId: string) {
    return organizationRepository.getUsers(shopId);
  }

  /**
   * Get shop for a user
   *
   * @param userId User ID
   * @returns Shop or null if user not in a shop
   */
  async findByUserId(userId: string): Promise<Shop | null> {
    const org = await organizationRepository.findByUserId(userId);

    if (org && org.orgType !== 'shop') {
      return null;
    }

    return org;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const shopRepository = new ShopRepository();
