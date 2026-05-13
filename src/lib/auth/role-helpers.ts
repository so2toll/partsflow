/**
 * Role Helper Functions
 *
 * Utilities for checking user roles and worker types
 * that span both auth.db and app.db
 */

import { graph } from "../db/graph";

/**
 * Worker types that exist in app.db (User.workerType property)
 */
export type WorkerType =
  | "ShopOwner"
  | "ShopManager"
  | "ShopTech"
  | "Driver"
  | "Supplier"
  | "Other";

/**
 * Extended user info from app.db including worker type
 */
export interface AppUserInfo {
  id: string;
  workerType?: WorkerType;
  organizationId?: string;
  // Additional fields can be added as needed
}

/**
 * Get app.db user info including workerType
 *
 * @param globalUserId The user's global_id from auth.db
 * @returns User info from app.db or null
 */
export async function getAppUserInfo(
  globalUserId: string
): Promise<AppUserInfo | null> {
  try {
    const result = await graph.query<{
      u: { id: string; workerType?: string; organizationId?: string };
    }>(
      `
      MATCH (u:User {id: $id})
      RETURN u
      `,
      { id: globalUserId }
    );

    if (!result[0]?.u) {
      return null;
    }

    const userNode = result[0].u;
    return {
      id: userNode.id,
      workerType: userNode.workerType as WorkerType,
      organizationId: userNode.organizationId,
    };
  } catch (error) {
    console.error("[RoleHelpers] Error getting app user info:", error);
    return null;
  }
}

/**
 * Check if user is a Driver (checks app.db)
 *
 * @param globalUserId The user's global_id from auth.db
 * @returns true if user is a driver
 */
export async function isDriverByWorkerType(
  globalUserId: string
): Promise<boolean> {
  const userInfo = await getAppUserInfo(globalUserId);
  return userInfo?.workerType === "Driver";
}

/**
 * Check if user has a specific worker type
 *
 * @param globalUserId The user's global_id from auth.db
 * @param workerType The worker type to check
 * @returns true if user has the specified worker type
 */
export async function hasWorkerType(
  globalUserId: string,
  workerType: WorkerType
): Promise<boolean> {
  const userInfo = await getAppUserInfo(globalUserId);
  return userInfo?.workerType === workerType;
}

/**
 * Check if user belongs to a specific organization
 *
 * @param globalUserId The user's global_id from auth.db
 * @param organizationId The organization ID to check
 * @returns true if user belongs to the organization
 */
export async function belongsToOrganization(
  globalUserId: string,
  organizationId: string
): Promise<boolean> {
  const userInfo = await getAppUserInfo(globalUserId);
  return userInfo?.organizationId === organizationId;
}

/**
 * Check if user is a driver by checking IS_DRIVER relationship
 * (Alternative method - some drivers may be identified by relationship)
 *
 * @param globalUserId The user's global_id from auth.db
 * @returns true if user has IS_DRIVER relationship
 */
export async function isDriverByRelationship(
  globalUserId: string
): Promise<boolean> {
  try {
    const result = await graph.query<{
      r: Record<string, unknown>;
    }>(
      `
      MATCH (u:User {id: $id})-[r:IS_DRIVER]->()
      RETURN r LIMIT 1
      `,
      { id: globalUserId }
    );

    return result.length > 0;
  } catch (error) {
    console.error("[RoleHelpers] Error checking driver relationship:", error);
    return false;
  }
}

/**
 * Comprehensive driver check (checks both workerType and relationship)
 *
 * @param globalUserId The user's global_id from auth.db
 * @returns true if user is a driver by any method
 */
export async function isDriver(globalUserId: string): Promise<boolean> {
  const [byType, byRel] = await Promise.all([
    isDriverByWorkerType(globalUserId),
    isDriverByRelationship(globalUserId),
  ]);
  return byType || byRel;
}
