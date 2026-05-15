/**
 * Driver Repository - Graph-Based Implementation
 *
 * Repository for Driver entity operations using graph queries.
 * Manages driver operational data separate from User authentication.
 *
 * @module lib/db/repositories/DriverRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export type DriverStatus = 'offline' | 'available' | 'on_delivery' | 'suspended';

export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  vehiclePlate: string;
  status: DriverStatus;
  currentLat: number | null;
  currentLng: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverData {
  userId: string;
  licenseNumber: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plate: string;
  };
}

export interface UpdateDriverLocationData {
  driverId: string;
  lat: number;
  lng: number;
}

export interface ListDriversOptions {
  limit?: number;
  offset?: number;
  status?: DriverStatus;
}

// ============================================================================
// Driver Repository
// ============================================================================

export class DriverRepository {
  constructor(private graph: typeof graph) {}

  /**
   * Create a new driver
   *
   * @param data Driver data including userId, license, and vehicle info
   * @returns Created driver
   *
   * @example
   * ```typescript
   * const driver = await driverRepository.create({
   *   userId: 'user_abc123',
   *   licenseNumber: 'DL-12345',
   *   vehicle: {
   *     make: 'Ford',
   *     model: 'Transit',
   *     year: 2022,
   *     color: 'White',
   *     plate: 'ABC1234'
   *   }
   * });
   * ```
   */
  async create(data: CreateDriverData): Promise<Driver> {
    const driverId = `drv_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create driver node
    const result = await graph.mutate(
      `
      CREATE (d:Driver {
        id: $id,
        userId: $userId,
        licenseNumber: $licenseNumber,
        vehicleMake: $vehicleMake,
        vehicleModel: $vehicleModel,
        vehicleYear: $vehicleYear,
        vehicleColor: $vehicleColor,
        vehiclePlate: $vehiclePlate,
        status: $status,
        currentLat: $currentLat,
        currentLng: $currentLng,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN d
      `,
      {
        id: driverId,
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        vehicleMake: data.vehicle.make,
        vehicleModel: data.vehicle.model,
        vehicleYear: data.vehicle.year,
        vehicleColor: data.vehicle.color,
        vehiclePlate: data.vehicle.plate,
        status: 'offline',
        currentLat: null,
        currentLng: null,
        now,
      }
    );

    // Create IS_DRIVER relationship from User to Driver
    await graph.createRelationship(data.userId, driverId, "IS_DRIVER", {
      createdAt: now,
    });

    console.log(`[DriverRepo] Created driver ${driverId} for user ${data.userId}`);

    return this.mapNodeToDriver(result);
  }

  /**
   * Find driver by ID
   *
   * @param id Driver ULID
   * @returns Driver or null if not found
   */
  async findById(id: string): Promise<Driver | null> {
    const results = await graph.query<any>(
      `
      MATCH (d:Driver {id: $id})
      RETURN d
      `,
      { id }
    );

    if (results.length === 0 || !results[0].d) {
      return null;
    }

    return this.mapNodeToDriver(results[0].d);
  }

  /**
   * Find driver by user ID
   *
   * @param userId User global_id
   * @returns Driver or null if not found
   */
  async findByUserId(userId: string): Promise<Driver | null> {
    const results = await graph.query<any>(
      `
      MATCH (u:User {id: $userId})-[:IS_DRIVER]->(d:Driver)
      RETURN d
      `,
      { userId }
    );

    if (results.length === 0 || !results[0].d) {
      return null;
    }

    return this.mapNodeToDriver(results[0].d);
  }

  /**
   * Update driver status
   *
   * @param driverId Driver ULID
   * @param status New status
   * @returns Updated driver
   */
  async updateStatus(driverId: string, status: DriverStatus): Promise<Driver> {
    const result = await graph.updateNode(driverId, {
      status,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[DriverRepo] Updated driver ${driverId} status to ${status}`);

    return this.mapNodeToDriver(result);
  }

  /**
   * Update driver location
   *
   * @param data Location data including driverId, lat, lng
   * @returns Updated driver
   */
  async updateLocation(data: UpdateDriverLocationData): Promise<Driver> {
    const result = await graph.updateNode(data.driverId, {
      currentLat: data.lat,
      currentLng: data.lng,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[DriverRepo] Updated driver ${data.driverId} location`);

    return this.mapNodeToDriver(result);
  }

  /**
   * Find all available drivers
   *
   * @returns Array of drivers with status='available'
   */
  async findAvailable(): Promise<Driver[]> {
    const results = await graph.query<any>(
      `
      MATCH (d:Driver {status: 'available'})
      RETURN d
      ORDER BY d.createdAt DESC
      `
    );

    return results
      .filter((r) => r.d)
      .map((result) => this.mapNodeToDriver(result.d));
  }

  /**
   * Find drivers by status
   *
   * @param status Driver status to filter by
   * @returns Array of drivers with specified status
   */
  async findByStatus(status: DriverStatus): Promise<Driver[]> {
    const results = await graph.query<any>(
      `
      MATCH (d:Driver {status: $status})
      RETURN d
      ORDER BY d.createdAt DESC
      `,
      { status }
    );

    return results
      .filter((r) => r.d)
      .map((result) => this.mapNodeToDriver(result.d));
  }

  /**
   * List drivers with pagination
   *
   * @param options Query options
   * @returns Drivers and total count
   */
  async list(options: ListDriversOptions = {}): Promise<{ drivers: Driver[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let whereClause = "";
    const params: Record<string, unknown> = {};

    if (options.status) {
      whereClause = " WHERE d.status = $status";
      params.status = options.status;
    }

    const results = await graph.query<any>(
      `
      MATCH (d:Driver)
      ${whereClause}
      RETURN d
      ORDER BY d.createdAt DESC
      LIMIT $limit
      SKIP $offset
      `,
      { ...params, limit, offset }
    );

    const drivers = results
      .filter((r) => r.d)
      .map((result) => this.mapNodeToDriver(result.d));

    // Get total count
    const countParams: Record<string, unknown> = {};
    if (options.status) {
      countParams.status = options.status;
    }

    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (d:Driver)
      ${whereClause}
      RETURN count(d) as count
      `,
      countParams
    );

    const total = countResults[0]?.count || 0;

    return { drivers, total };
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToDriver(node: Node): Driver {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id (SQL primary key)
    const id = props?.id || node.id;

    return {
      id,
      userId: props?.userId,
      licenseNumber: props?.licenseNumber,
      vehicleMake: props?.vehicleMake,
      vehicleModel: props?.vehicleModel,
      vehicleYear: props?.vehicleYear || 0,
      vehicleColor: props?.vehicleColor,
      vehiclePlate: props?.vehiclePlate,
      status: props?.status as DriverStatus || 'offline',
      currentLat: props?.currentLat || null,
      currentLng: props?.currentLng || null,
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const driverRepository = new DriverRepository(graph);
