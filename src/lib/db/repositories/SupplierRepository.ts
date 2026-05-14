/**
 * Supplier Repository - Graph-Based Implementation
 *
 * Repository for Supplier entity operations using graph queries.
 * Suppliers are Organizations with orgType='supplier'.
 *
 * @module lib/db/repositories/SupplierRepository
 * @version 0.1.0
 */

import { organizationRepository, type Organization } from "./OrganizationRepository";
import { ulid } from "ulid";

// ============================================================================
// Types
// ============================================================================

export interface Supplier extends Organization {
  orgType: 'supplier';
}

export interface CreateSupplierData {
  name: string;
  displayName: string;
  address: string;
  phone: string;
  isActive?: boolean;
}

// ============================================================================
// Mock Supplier Data
// ============================================================================

const MOCK_SUPPLIERS: CreateSupplierData[] = [
  {
    name: "Advance Auto Parts - Eastern Blvd",
    displayName: "Advance Auto Parts",
    address: "2400 Eastern Blvd, Baltimore, MD 21221",
    phone: "(410) 687-0200",
    isActive: true,
  },
  {
    name: "AutoZone - Pulaski Hwy",
    displayName: "AutoZone",
    address: "6200 Pulaski Hwy, Baltimore, MD 21224",
    phone: "(410) 288-0800",
    isActive: true,
  },
  {
    name: "O'Reilly Auto Parts - Belair Rd",
    displayName: "O'Reilly Auto Parts",
    address: "6400 Belair Rd, Baltimore, MD 21206",
    phone: "(410) 663-0100",
    isActive: true,
  },
  {
    name: "NAPA Auto Parts - Washington Blvd",
    displayName: "NAPA Auto Parts",
    address: "2300 Washington Blvd, Baltimore, MD 21230",
    phone: "(410) 576-0700",
    isActive: true,
  },
  {
    name: "Carquest Auto Parts - Frederick Ave",
    displayName: "Carquest Auto Parts",
    address: "3900 Frederick Ave, Baltimore, MD 21229",
    phone: "(410) 367-2600",
    isActive: true,
  },
];

// ============================================================================
// Supplier Repository
// ============================================================================

export class SupplierRepository {
  /**
   * Create a new supplier
   *
   * Creates an Organization node with orgType='supplier'.
   *
   * @param data Supplier data
   * @returns Created supplier
   *
   * @example
   * ```typescript
   * const supplier = await supplierRepository.create({
   *   name: "NAPA Auto Parts - Downtown",
   *   displayName: "NAPA Auto Parts",
   *   address: "123 Main St, Baltimore, MD 21201",
   *   phone: "(410) 555-0123"
   * });
   * ```
   */
  async create(data: CreateSupplierData): Promise<Supplier> {
    const supplier = await organizationRepository.create({
      ...data,
      orgType: 'supplier',
    });

    return supplier as Supplier;
  }

  /**
   * Find supplier by ID
   *
   * @param id Supplier ULID
   * @returns Supplier or null if not found
   */
  async findById(id: string): Promise<Supplier | null> {
    const org = await organizationRepository.findById(id);

    if (!org || org.orgType !== 'supplier') {
      return null;
    }

    return org as Supplier;
  }

  /**
   * Get all suppliers
   *
   * @returns Array of all suppliers sorted by name
   */
  async list(): Promise<Supplier[]> {
    const result = await organizationRepository.list({
      orgType: 'supplier',
      limit: 100,
    });

    return result.organizations as Supplier[];
  }

  /**
   * Get active suppliers only
   *
   * For MVP, all suppliers are active. This method exists for future filtering capability.
   *
   * @returns Array of active suppliers
   */
  async findActive(): Promise<Supplier[]> {
    // All suppliers are active in MVP
    return this.list();
  }

  /**
   * Seed mock suppliers into the database
   *
   * Checks if suppliers already exist before seeding to avoid duplicates.
   * Creates 5 Baltimore-area auto parts suppliers.
   *
   * @returns Number of suppliers created
   *
   * @example
   * ```typescript
   * const created = await supplierRepository.seedMockSuppliers();
   * console.log(`Created ${created} mock suppliers`);
   * ```
   */
  async seedMockSuppliers(): Promise<number> {
    // Check if suppliers already exist
    const existing = await this.list();

    if (existing.length > 0) {
      console.log(`[SupplierRepo] Found ${existing.length} existing suppliers, skipping seed`);
      return 0;
    }

    let created = 0;

    for (const supplierData of MOCK_SUPPLIERS) {
      try {
        await this.create(supplierData);
        created++;
        console.log(`[SupplierRepo] Seeded supplier: ${supplierData.displayName}`);
      } catch (error) {
        console.error(`[SupplierRepo] Failed to seed supplier: ${supplierData.displayName}`, error);
      }
    }

    console.log(`[SupplierRepo] Seeded ${created} mock suppliers`);

    return created;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const supplierRepository = new SupplierRepository();
