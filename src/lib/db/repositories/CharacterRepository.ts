/**
 * Character Repository - Graph-Based Implementation
 *
 * Repository for Character entity operations using graph queries.
 * Characters are AI personas that can be used across projects.
 *
 * @module lib/db/repositories/CharacterRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export interface Character {
  id: string;              // char_xxx
  userId: string;          // owner
  organizationId: string;  // tenant scoping
  name: string;
  description?: string;
  deeplakeRef?: string;    // key into DeepLake tensor dataset
  referenceImageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterData {
  userId: string;
  organizationId: string;
  name: string;
  description?: string;
  deeplakeRef?: string;
  referenceImageUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Character Repository
// ============================================================================

/**
 * Repository for Character entity operations using graph queries
 */
export class CharacterRepository {
  /**
   * Create a new character
   *
   * @param data Character data
   * @returns Created character
   *
   * @example
   * ```typescript
   * const repo = new CharacterRepository();
   * const character = await repo.create({
   *   userId: "user_123",
   *   organizationId: "org_123",
   *   name: "Alex",
   *   description: "A friendly AI host"
   * });
   * ```
   */
  async create(data: CreateCharacterData): Promise<Character> {
    const characterId = `char_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create character node
    const result = await graph.mutate(
      `
      CREATE (c:Character {
        id: $id,
        userId: $userId,
        organizationId: $organizationId,
        name: $name,
        description: $description,
        deeplakeRef: $deeplakeRef,
        referenceImageUrl: $referenceImageUrl,
        metadata: $metadata,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN c
      `,
      {
        id: characterId,
        userId: data.userId,
        organizationId: data.organizationId,
        name: data.name,
        description: data.description || null,
        deeplakeRef: data.deeplakeRef || null,
        referenceImageUrl: data.referenceImageUrl || null,
        metadata: JSON.stringify(data.metadata || {}),
        now,
      }
    );

    // Create HAS_CHARACTER relationship from organization to character
    await graph.createRelationship(data.organizationId, characterId, "HAS_CHARACTER", {
      createdAt: now,
    });

    return this.mapNodeToCharacter(result);
  }

  /**
   * Find character by ID
   *
   * @param id Character ID
   * @returns Character or null if not found
   */
  async findById(id: string): Promise<Character | null> {
    const results = await graph.query<any>(
      `
      MATCH (c:Character {id: $id})
      RETURN c
      `,
      { id }
    );

    if (results.length === 0 || !results[0].c) {
      return null;
    }

    return this.mapNodeToCharacter(results[0].c);
  }

  /**
   * Find all characters for an organization
   *
   * @param orgId Organization ID
   * @param options Query options
   * @returns Characters and total count
   */
  async findByOrgId(
    orgId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ characters: Character[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get characters using graph query with relationship traversal
    const results = await graph.query<any>(
      `
      MATCH (org:Organization {id: $organizationId})-[:HAS_CHARACTER]->(c:Character)
      RETURN c
      ORDER BY c.name ASC
      LIMIT ${limit}
      SKIP ${offset}
      `,
      { organizationId: orgId }
    );

    const characters = results
      .filter((r) => r.c)
      .map((result) => this.mapNodeToCharacter(result.c));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (org:Organization {id: $organizationId})-[:HAS_CHARACTER]->(c:Character)
      RETURN count(c) as count
      `,
      { organizationId: orgId }
    );

    const total = countResults[0]?.count || 0;

    return { characters, total };
  }

  /**
   * Find all characters across all organizations (SuperAdmin only)
   *
   * @param options Pagination options
   * @returns Characters and total count
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{ characters: Character[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await graph.query<any>(
      `
      MATCH (c:Character)
      RETURN c
      ORDER BY c.name ASC
      LIMIT ${limit}
      SKIP ${offset}
      `
    );

    const characters = results
      .filter((r) => r.c)
      .map((result) => this.mapNodeToCharacter(result.c));

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (c:Character)
      RETURN count(c) as count
      `
    );

    const total = countResults[0]?.count || 0;

    return { characters, total };
  }

  /**
   * Find characters used in a project
   *
   * @param projectId Project ID
   * @returns Characters used in the project
   */
  async findByProject(projectId: string): Promise<Character[]> {
    const results = await graph.query<any>(
      `
      MATCH (p:Project {id: $projectId})-[:USES_CHARACTER]->(c:Character)
      RETURN c
      ORDER BY c.name ASC
      `,
      { projectId }
    );

    return results
      .filter((r) => r.c)
      .map((result) => this.mapNodeToCharacter(result.c));
  }

  /**
   * Update character
   *
   * @param id Character ID
   * @param data Updates to apply
   * @returns Updated character
   */
  async update(
    id: string,
    data: Partial<Omit<Character, "id" | "createdAt" | "updatedAt" | "userId" | "organizationId">>
  ): Promise<Character> {
    const updates: Record<string, unknown> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.deeplakeRef !== undefined) updates.deeplakeRef = data.deeplakeRef;
    if (data.referenceImageUrl !== undefined) updates.referenceImageUrl = data.referenceImageUrl;
    if (data.metadata !== undefined) updates.metadata = JSON.stringify(data.metadata);

    const result = await graph.updateNode(id, updates);

    return this.mapNodeToCharacter(result);
  }

  /**
   * Delete character
   *
   * @param id Character ID
   */
  async delete(id: string): Promise<void> {
    // Delete the character node and all its relationships
    await graph.deleteNode(id);
  }

  /**
   * Add character to a project (creates USES_CHARACTER relationship)
   *
   * @param characterId Character ID
   * @param projectId Project ID
   */
  async addToProject(characterId: string, projectId: string): Promise<void> {
    const now = new Date().toISOString();

    await graph.createRelationship(projectId, characterId, "USES_CHARACTER", {
      addedAt: now,
    });
  }

  /**
   * Remove character from a project
   *
   * @param characterId Character ID
   * @param projectId Project ID
   */
  async removeFromProject(characterId: string, projectId: string): Promise<void> {
    await graph.deleteRelationship(projectId, characterId, "USES_CHARACTER");
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToCharacter(node: Node): Character {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id
    const id = props?.id || node.id;

    return {
      id,
      userId: props?.userId,
      organizationId: props?.organizationId,
      name: props?.name,
      description: props?.description,
      deeplakeRef: props?.deeplakeRef,
      referenceImageUrl: props?.referenceImageUrl,
      metadata: typeof props?.metadata === 'string'
        ? JSON.parse(props.metadata)
        : props?.metadata || {},
      createdAt: props?.createdAt,
      updatedAt: props?.updatedAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const characterRepository = new CharacterRepository();
