/**
 * GraphDB - Graph Abstraction Layer for SQL
 *
 * Provides a Cypher-like query interface that translates to SQL queries.
 * Allows you to think in graphs while storing data in SQL (SQLite/Turso).
 *
 * Storage Model:
 * - Nodes stored in `nodes` table with label and properties (JSON)
 * - Relationships stored in `relationships` table with from_node_id, to_node_id, type, and properties (JSON)
 *
 * @module lib/db/graph
 * @version 0.1.0
 */

import { appQuery, appExecute } from "./app";

// ============================================================================
// Debug Logging
// ============================================================================

/**
 * Debug flag - set GRAPH_DB_DEBUG=true in environment to enable logging
 */
const DEBUG = process.env.GRAPH_DB_DEBUG === 'true';

/**
 * Debug logger - only logs when GRAPH_DB_DEBUG is enabled
 */
function debugLog(...args: unknown[]): void {
  if (DEBUG) {
    console.log('[GraphDB]', ...args);
  }
}

// ============================================================================
// Types
// ============================================================================

export interface Node {
  id: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface Relationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphQueryResult {
  nodes?: Node[];
  relationships?: Relationship[];
  [key: string]: unknown;
}

// ============================================================================
// Cypher Parser
// ============================================================================

interface ParsedMatch {
  nodeVar?: string;
  label?: string;
  properties: Record<string, unknown>;
  relationshipType?: string;
  direction?: "out" | "in" | "both";
  targetNode?: string;
  targetLabel?: string;
  targetProps: Record<string, unknown>;
}

interface ParsedQuery {
  match: ParsedMatch[];
  returnFields: string[];
  whereConditions?: string[];
  orderBy?: string;
  limit?: number;
  skip?: number;
}

/**
 * Simple Cypher-like query parser
 * Supports: MATCH, WHERE, RETURN, ORDER BY, LIMIT, SKIP
 * Supports: CREATE, MERGE (for mutations)
 */
class CypherParser {
  parse(query: string): ParsedQuery {
    const normalized = query.replace(/\s+/g, " ").trim();

    const parsed: ParsedQuery = {
      match: [],
      returnFields: [],
    };

    // Parse MATCH clauses - handle both simple nodes and relationships
    // First try to match relationship patterns: (node)-[:REL]->(target)
    const relationshipRegex = /MATCH\s*\((\w+)(?::(\w+))?(?:\s*\{([^}]+)\})?\)-\[?:?(\w+)\]?\]->\((\w+)(?::(\w+))?(?:\s*\{([^}]+)\})?\)/gi;
    let matchMatch;

    // Try to match relationship patterns first
    while ((matchMatch = relationshipRegex.exec(normalized)) !== null) {
      const [
        ,
        nodeVar,
        label,
        propsStr,
        relType,
        targetNode,
        targetLabel,
        targetPropsStr,
      ] = matchMatch;

      parsed.match.push({
        nodeVar,
        label,
        properties: propsStr ? this.parseProperties(propsStr) : {},
        relationshipType: relType,
        targetNode,
        targetLabel,
        targetProps: targetPropsStr ? this.parseProperties(targetPropsStr) : {},
      });
    }

    // If no relationship matches found, try simple node matches: (var:Label {props})
    if (parsed.match.length === 0) {
      const nodeRegex = /MATCH\s*\((\w+)(?::(\w+))?(?:\s*\{([^}]+)\})?\)/gi;
      while ((matchMatch = nodeRegex.exec(normalized)) !== null) {
        const [
          ,
          nodeVar,
          label,
          propsStr,
        ] = matchMatch;

        parsed.match.push({
          nodeVar,
          label,
          properties: propsStr ? this.parseProperties(propsStr) : {},
          relationshipType: undefined,
          targetNode: undefined,
          targetLabel: undefined,
          targetProps: undefined,
        });
      }
    }

    // Parse RETURN clause
    const returnRegex = /RETURN\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+SKIP|$)/gi;
    const returnMatch = returnRegex.exec(normalized);
    if (returnMatch) {
      parsed.returnFields = returnMatch[1].split(",").map((f) => f.trim());
    }

    // Parse WHERE clause
    const whereRegex = /WHERE\s+(.+?)(?:\s+RETURN|\s+ORDER\s+BY|\s+LIMIT|\s+SKIP|$)/gi;
    const whereMatch = whereRegex.exec(normalized);
    if (whereMatch) {
      parsed.whereConditions = [whereMatch[1].trim()];
    }

    // Parse ORDER BY - handle both simple names (t) and property access (t.name)
    const orderRegex = /ORDER\s+BY\s+([\w.]+)\s*(ASC|DESC)?/gi;
    const orderMatch = orderRegex.exec(normalized);
    if (orderMatch) {
      const field = orderMatch[1];
      const direction = orderMatch[2] || "ASC";
      parsed.orderBy = `${field} ${direction}`;
    }

    // Parse LIMIT
    const limitRegex = /LIMIT\s+(\d+)/gi;
    const limitMatch = limitRegex.exec(normalized);
    if (limitMatch) {
      parsed.limit = parseInt(limitMatch[1], 10);
    }

    // Parse SKIP
    const skipRegex = /SKIP\s+(\d+)/gi;
    const skipMatch = skipRegex.exec(normalized);
    if (skipMatch) {
      parsed.skip = parseInt(skipMatch[1], 10);
    }

    return parsed;
  }

  private parseProperties(propsStr: string): Record<string, unknown> {
    const props: Record<string, unknown> = {};
    const propRegex = /(\w+):\s*(\$?\w+|"[^"]*"|'[^']*')/g;
    let propMatch;

    while ((propMatch = propRegex.exec(propsStr)) !== null) {
      const [, key, value] = propMatch;
      if (value.startsWith("$")) {
        props[key] = { param: value.slice(1) };
      } else if (
        value.startsWith('"') ||
        value.startsWith("'")
      ) {
        props[key] = value.slice(1, -1);
      } else {
        props[key] = value;
      }
    }

    return props;
  }
}

// ============================================================================
// SQL Generator
// ============================================================================

class SQLGenerator {
  generateSelect(parsed: ParsedQuery, params: Record<string, unknown>): {
    sql: string;
    queryParams: unknown[];
  } {
    const queryParams: unknown[] = [];
    let selectClause = "SELECT DISTINCT ";
    let fromClause = "FROM nodes n1";
    let joinClauses: string[] = [];
    let whereClauses: string[] = [];

    // Build SELECT clause
    if (parsed.returnFields.includes("*")) {
      selectClause += "n1.*";
    } else {
      const fields = parsed.returnFields.map((field) => {
        // Check for aggregate functions (count, sum, avg, max, min)
        const aggregateMatch = field.match(/(count|sum|avg|max|min)\((\w+)\)\s+as\s+(\w+)/i);

        if (aggregateMatch) {
          const [, func, varName, alias] = aggregateMatch;
          // Handle aggregate functions - count the nodes
          if (func.toLowerCase() === "count") {
            // Find which node index this variable refers to
            const nodeIndex = parsed.match.findIndex((m) => m.nodeVar === varName || m.targetNode === varName);
            const nodeNum = nodeIndex >= 0 ? nodeIndex + 1 : 1;
            return `COUNT(DISTINCT n${nodeNum}.id) as ${alias}`;
          }
          return `${func.toUpperCase()}(n1.properties->>'${varName}') as ${alias}`;
        }

        // Handle property access (e.g., v.name)
        if (field.includes(".")) {
          const [varName, propName] = field.split(".");
          const nodeIndex = parsed.match.findIndex((m) => m.nodeVar === varName || m.targetNode === varName);
          const nodeNum = nodeIndex >= 0 ? nodeIndex + 1 : 1;
          return `n${nodeNum}.properties->>'${propName}' as ${field.replace(".", "_")}`;
        }

        // Handle simple variable references (e.g., v, org, p)
        const nodeIndex = parsed.match.findIndex((m) => m.nodeVar === field || m.targetNode === field);
        if (nodeIndex >= 0) {
          const match = parsed.match[nodeIndex];
          // If field is the targetNode, use n2 (index + 2), otherwise use n1 (index + 1)
          const nodeNum = match.targetNode === field ? nodeIndex + 2 : nodeIndex + 1;
          return `n${nodeNum}.id as ${field}_id, n${nodeNum}.label as ${field}_label, n${nodeNum}.properties as ${field}_props`;
        }

        // Fallback to n1
        return `n1.id as ${field}_id, n1.label as ${field}_label, n1.properties as ${field}_props`;
      });
      selectClause += fields.join(", ");
    }

    // Build JOINs based on MATCH patterns
    parsed.match.forEach((match, index) => {
      if (match.targetNode) {
        // Relationship pattern
        const sourceNodeNum = index + 1;
        const targetNodeNum = index + 2;
        fromClause += `, nodes n${targetNodeNum}`;
        joinClauses.push(
          `JOIN relationships r${index} ON r${index}.from_node_id = n${sourceNodeNum}.id AND r${index}.to_node_id = n${targetNodeNum}.id`
        );

        if (match.relationshipType) {
          whereClauses.push(`r${index}.type = ?`);
          queryParams.push(match.relationshipType);
        }
      }

      // Node label filters
      if (match.label) {
        whereClauses.push(`n${index + 1}.label = ?`);
        queryParams.push(match.label);
      }

      // Node property filters
      Object.entries(match.properties).forEach(([key, value]) => {
        if (typeof value === "object" && "param" in value) {
          whereClauses.push(
            `json_extract(n${index + 1}.properties, '$.${key}') = ?`
          );
          queryParams.push(params[value.param as string]);
        } else {
          whereClauses.push(
            `json_extract(n${index + 1}.properties, '$.${key}') = ?`
          );
          queryParams.push(value);
        }
      });

      if (match.targetLabel) {
        whereClauses.push(`n${index + 2}.label = ?`);
        queryParams.push(match.targetLabel);
      }

      // Target node property filters
      if (match.targetProps && Object.keys(match.targetProps).length > 0) {
        Object.entries(match.targetProps).forEach(([key, value]) => {
          if (typeof value === "object" && "param" in value) {
            whereClauses.push(
              `json_extract(n${index + 2}.properties, '$.${key}') = ?`
            );
            queryParams.push(params[value.param as string]);
          } else {
            whereClauses.push(
              `json_extract(n${index + 2}.properties, '$.${key}') = ?`
            );
            queryParams.push(value);
          }
        });
      }
    });

    // Combine WHERE clauses
    let whereClause = "";
    if (parsed.whereConditions) {
      whereClauses.push(...parsed.whereConditions);
    }
    if (whereClauses.length > 0) {
      whereClause = "WHERE " + whereClauses.join(" AND ");
    }

    // Build ORDER BY
    let orderClause = "";
    if (parsed.orderBy) {
      // Parse "field direction" format
      const orderParts = parsed.orderBy.trim().split(/\s+/);
      const field = orderParts[0];
      const direction = orderParts[1] || "ASC";

      // Handle property access like "t.name" or simple names like "t"
      if (field.includes(".")) {
        const [varName, propName] = field.split(".");
        const nodeIndex = parsed.match.findIndex((m) => m.nodeVar === varName || m.targetNode === varName);
        const nodeNum = nodeIndex >= 0 ? nodeIndex + 1 : 1;
        orderClause = `ORDER BY json_extract(n${nodeNum}.properties, '$.${propName}') ${direction}`;
      } else {
        // Simple name - use the _id alias
        orderClause = `ORDER BY ${field}_id ${direction}`;
      }
    }

    // Build LIMIT
    let limitClause = "";
    if (parsed.limit) {
      limitClause = `LIMIT ${parsed.limit}`;
    }

    // Combine all clauses
    const sql = `${selectClause}
${fromClause}
${joinClauses.join("\n")}
${whereClause}
${orderClause}
${limitClause}`;

    return { sql, queryParams };
  }

  generateInsert(
    label: string,
    properties: Record<string, unknown>
  ): { sql: string; params: unknown[] } {
    const nodeId = properties.id as string;

    const sql = `
      INSERT INTO nodes (id, label, properties)
      VALUES (?, ?, ?)
    `;

    return {
      sql,
      params: [nodeId, label, JSON.stringify(properties)],
    };
  }

  generateCreateRelationship(
    fromNodeId: string,
    toNodeId: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): { sql: string; params: unknown[] } {
    const sql = `
      INSERT INTO relationships (from_node_id, to_node_id, type, properties)
      VALUES (?, ?, ?, ?)
    `;

    return {
      sql,
      params: [fromNodeId, toNodeId, type, JSON.stringify(properties)],
    };
  }
}

// ============================================================================
// GraphDB Client
// ============================================================================

class GraphDB {
  private parser: CypherParser;
  private generator: SQLGenerator;

  constructor() {
    this.parser = new CypherParser();
    this.generator = new SQLGenerator();
  }

  /**
   * Execute a Cypher-like READ query
   *
   * @param cypherQuery Cypher-like query string
   * @param params Query parameters
   * @returns Query results
   *
   * @example
   * ```typescript
   * const results = await graph.query(`
   *   MATCH (v:Video {id: $id})
   *   RETURN v
   * `, { id: 'vid_123' });
   * ```
   */
  async query<T = GraphQueryResult>(
    cypherQuery: string,
    params: Record<string, unknown> = {}
  ): Promise<T[]> {
    const parsed = this.parser.parse(cypherQuery);
    const { sql, queryParams } = this.generator.generateSelect(parsed, params);

    debugLog(` Generated SQL:\n${sql}`);
    debugLog(` Params:`, queryParams);

    const results = await appQuery<any>(sql, queryParams);

    console.log('[GraphDB] Raw SQL results:', results.length, 'rows');

    // Transform results to match Cypher-like return format
    const transformed = this.transformResults(results, parsed);
    console.log('[GraphDB] Transformed results:', transformed.length, 'items');
    return transformed;
  }

  /**
   * Execute a Cypher-like WRITE query (CREATE node)
   *
   * @param cypherQuery Cypher-like CREATE query
   * @param params Query parameters
   * @returns Created node
   *
   * @example
   * ```typescript
   * const video = await graph.mutate(`
   *   CREATE (v:Video {
   *     id: $id,
   *     title: $title,
   *     url: $url
   *   })
   *   RETURN v
   * `, {
   *   id: 'vid_123',
   *   title: 'My Video',
   *   url: 'https://example.com/video.mp4'
   * });
   * ```
   */
  async mutate<T = Node>(
    cypherQuery: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    // Parse CREATE clause
    const createRegex =
      /CREATE\s*\((\w+):(\w+)\s*\{([^}]+)\}\)\s*RETURN\s+(\w+)/i;
    const match = createRegex.exec(cypherQuery);

    if (!match) {
      throw new Error("Unsupported CREATE query format");
    }

    const [, varName, label, propsStr, returnVar] = match;

    // Parse properties
    const properties: Record<string, unknown> = {};
    const propRegex = /(\w+):\s*\$(\w+)/g;
    let propMatch;

    while ((propMatch = propRegex.exec(propsStr)) !== null) {
      const [, key, paramKey] = propMatch;
      properties[key] = params[paramKey];
    }

    // Generate and execute INSERT
    const { sql, params: insertParams } = this.generator.generateInsert(
      label,
      properties
    );

    debugLog(` Generated SQL:\n${sql}`);
    debugLog(` Params:`, insertParams);

    await appExecute(sql, insertParams);

    // Fetch and return the created node by its specific ID (not by label to avoid race conditions)
    const nodeId = properties.id as string;
    const results = await appQuery<any>(
      "SELECT * FROM nodes WHERE id = ?",
      [nodeId]
    );

    const row = results[0];
    // Transform raw SQL row to Node object
    return {
      id: row.id,
      label: row.label,
      properties: typeof row.properties === 'string' ? JSON.parse(row.properties) : row.properties,
    } as T;
  }

  /**
   * Create a relationship between two nodes
   *
   * @param fromNodeId Source node ID
   * @param toNodeId Target node ID
   * @param type Relationship type
   * @param properties Optional relationship properties
   * @returns Created relationship
   *
   * @example
   * ```typescript
   * await graph.createRelationship(
   *   'vid_123',
   *   'scene_456',
   *   'HAS_SCENE',
   *   { order: 1 }
   * );
   * ```
   */
  async createRelationship(
    fromNodeId: string,
    toNodeId: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): Promise<Relationship> {
    // Check if relationship already exists (unique constraint)
    const existing = await appQuery<any>(
      `SELECT * FROM relationships
       WHERE from_node_id = ? AND to_node_id = ? AND type = ?
       LIMIT 1`,
      [fromNodeId, toNodeId, type]
    );

    if (existing.length > 0) {
      debugLog(` Relationship already exists: ${fromNodeId} -[${type}]-> ${toNodeId}`);
      debugLog(` Returning existing relationship instead of creating duplicate`);
      return existing[0] as Relationship;
    }

    const { sql, params: relParams } = this.generator.generateCreateRelationship(
      fromNodeId,
      toNodeId,
      type,
      properties
    );

    debugLog(` Generated SQL:\n${sql}`);
    debugLog(` Params:`, relParams);

    await appExecute(sql, relParams);

    // Fetch and return the created relationship
    const results = await appQuery<any>(
      `SELECT * FROM relationships
       WHERE from_node_id = ? AND to_node_id = ? AND type = ?
       ORDER BY created_at DESC LIMIT 1`,
      [fromNodeId, toNodeId, type]
    );

    return results[0] as Relationship;
  }

  /**
   * Update a node's properties (merges with existing properties)
   *
   * @param nodeId Node ID to update
   * @param updates Properties to update (merged with existing)
   * @returns Updated node
   *
   * @example
   * ```typescript
   * await graph.updateNode('team_123', { name: 'New Name' });
   * ```
   */
  async updateNode(
    nodeId: string,
    updates: Record<string, unknown>
  ): Promise<Node> {
    // Fetch existing node
    const existing = await appQuery<any>(
      "SELECT * FROM nodes WHERE id = ?",
      [nodeId]
    );

    if (existing.length === 0) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    const row = existing[0];
    const existingProps = typeof row.properties === 'string'
      ? JSON.parse(row.properties)
      : row.properties;

    // Merge updates into existing properties
    const now = new Date().toISOString();
    const mergedProps = { ...existingProps, ...updates, updatedAt: now };

    // Write back
    await appExecute(
      "UPDATE nodes SET properties = ? WHERE id = ?",
      [JSON.stringify(mergedProps), nodeId]
    );

    debugLog(` Updated node ${nodeId}`);

    return {
      id: row.id,
      label: row.label,
      properties: mergedProps,
    };
  }

  /**
   * Update a relationship's properties (merges with existing properties)
   *
   * @param fromNodeId Source node ID
   * @param toNodeId Target node ID
   * @param type Relationship type
   * @param updates Properties to update (merged with existing)
   * @returns Updated relationship
   *
   * @example
   * ```typescript
   * await graph.updateRelationship('user_123', 'team_456', 'MEMBER_OF', { role: 'Admin' });
   * ```
   */
  async updateRelationship(
    fromNodeId: string,
    toNodeId: string,
    type: string,
    updates: Record<string, unknown>
  ): Promise<Relationship> {
    // Fetch existing relationship
    const existing = await appQuery<any>(
      `SELECT * FROM relationships
       WHERE from_node_id = ? AND to_node_id = ? AND type = ?`,
      [fromNodeId, toNodeId, type]
    );

    if (existing.length === 0) {
      throw new Error(`Relationship not found: (${fromNodeId})-[:${type}]->(${toNodeId})`);
    }

    const row = existing[0];
    const existingProps = typeof row.properties === 'string'
      ? JSON.parse(row.properties)
      : row.properties;

    // Merge updates into existing properties
    const mergedProps = { ...existingProps, ...updates };

    // Write back
    await appExecute(
      `UPDATE relationships SET properties = ?
       WHERE from_node_id = ? AND to_node_id = ? AND type = ?`,
      [JSON.stringify(mergedProps), fromNodeId, toNodeId, type]
    );

    debugLog(` Updated relationship (${fromNodeId})-[:${type}]->(${toNodeId})`);

    return {
      id: row.id,
      fromNodeId: row.from_node_id,
      toNodeId: row.to_node_id,
      type: row.type,
      properties: mergedProps,
    };
  }

  /**
   * Delete a node and all its relationships (DETACH DELETE behavior)
   *
   * @param nodeId Node ID to delete
   * @returns True if node was deleted
   *
   * @example
   * ```typescript
   * await graph.deleteNode('team_123');
   * ```
   */
  async deleteNode(nodeId: string): Promise<boolean> {
    // Delete all relationships involving this node first
    await appExecute(
      "DELETE FROM relationships WHERE from_node_id = ? OR to_node_id = ?",
      [nodeId, nodeId]
    );

    // Delete the node itself
    await appExecute(
      "DELETE FROM nodes WHERE id = ?",
      [nodeId]
    );

    debugLog(` Deleted node ${nodeId} and its relationships`);

    return true;
  }

  /**
   * Delete a specific relationship
   *
   * @param fromNodeId Source node ID
   * @param toNodeId Target node ID
   * @param type Relationship type
   * @returns True if relationship was deleted
   *
   * @example
   * ```typescript
   * await graph.deleteRelationship('user_123', 'team_456', 'MEMBER_OF');
   * ```
   */
  async deleteRelationship(
    fromNodeId: string,
    toNodeId: string,
    type: string
  ): Promise<boolean> {
    await appExecute(
      "DELETE FROM relationships WHERE from_node_id = ? AND to_node_id = ? AND type = ?",
      [fromNodeId, toNodeId, type]
    );

    debugLog(` Deleted relationship (${fromNodeId})-[:${type}]->(${toNodeId})`);

    return true;
  }

  /**
   * Query for related nodes with their relationship properties
   *
   * @param nodeId Node ID to start from
   * @param relationshipType Relationship type to traverse
   * @param direction Direction: "in" (incoming) or "out" (outgoing)
   * @param targetLabel Optional label filter for target nodes
   * @returns Array of related nodes with relationship properties
   *
   * @example
   * ```typescript
   * // Get all members of a team with their roles
   * const members = await graph.queryRelated('team_123', 'MEMBER_OF', 'in', 'User');
   * // Returns: [{ node: { id, label, properties }, relationship: { properties: { role: 'Admin' } } }]
   * ```
   */
  async queryRelated(
    nodeId: string,
    relationshipType: string,
    direction: "in" | "out",
    targetLabel?: string
  ): Promise<Array<{
    node: Node;
    relationship: { properties: Record<string, unknown> };
  }>> {
    const params: unknown[] = [nodeId, relationshipType];

    let sql: string;
    if (direction === "out") {
      // Outgoing: (nodeId)-[:type]->(target)
      sql = `
        SELECT n.id, n.label, n.properties as node_props, r.properties as rel_props
        FROM relationships r
        JOIN nodes n ON n.id = r.to_node_id
        WHERE r.from_node_id = ? AND r.type = ?
      `;
    } else {
      // Incoming: (target)-[:type]->(nodeId)
      sql = `
        SELECT n.id, n.label, n.properties as node_props, r.properties as rel_props
        FROM relationships r
        JOIN nodes n ON n.id = r.from_node_id
        WHERE r.to_node_id = ? AND r.type = ?
      `;
    }

    if (targetLabel) {
      sql += " AND n.label = ?";
      params.push(targetLabel);
    }

    sql += " ORDER BY r.created_at ASC";

    const results = await appQuery<any>(sql, params);

    return results.map((row) => ({
      node: {
        id: row.id,
        label: row.label,
        properties: typeof row.node_props === 'string'
          ? JSON.parse(row.node_props)
          : row.node_props,
      },
      relationship: {
        properties: typeof row.rel_props === 'string'
          ? JSON.parse(row.rel_props)
          : row.rel_props,
      },
    }));
  }

  /**
   * Get all nodes (for graph visualization)
   */
  async getAllNodes(limit = 100): Promise<Node[]> {
    const results = await appQuery<any>(
      `SELECT * FROM nodes ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );

    return results.map((row) => ({
      id: row.id,
      label: row.label,
      properties: typeof row.properties === "string" ? JSON.parse(row.properties) : row.properties,
    }));
  }

  /**
   * Get all relationships (for graph visualization)
   */
  async getAllRelationships(limit = 100): Promise<Relationship[]> {
    const results = await appQuery<any>(
      `SELECT * FROM relationships ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );

    return results.map((row) => ({
      id: row.id,
      fromNodeId: row.from_node_id,
      toNodeId: row.to_node_id,
      type: row.type,
      properties: typeof row.properties === "string" ? JSON.parse(row.properties) : row.properties,
    }));
  }

  /**
   * Get graph data for visualization
   */
  async getGraphData(limit = 200): Promise<{
    nodes: Node[];
    relationships: Relationship[];
  }> {
    const [nodes, relationships] = await Promise.all([
      this.getAllNodes(limit),
      this.getAllRelationships(limit),
    ]);

    return { nodes, relationships };
  }

  private transformResults(
    results: any[],
    parsed: ParsedQuery
  ): any[] {
    // Transform SQL results to match Cypher-like format
    return results.map((row) => {
      const transformed: any = {};

      parsed.returnFields.forEach((field) => {
        // Check for aggregate functions (count, sum, avg, max, min)
        const aggregateMatch = field.match(/(count|sum|avg|max|min)\((\w+)\)\s+as\s+(\w+)/i);

        if (aggregateMatch) {
          const [, func, , alias] = aggregateMatch;
          // For aggregate functions, just return the value directly
          transformed[alias] = row[alias];
        } else if (field.includes(".")) {
          const [nodeVar, prop] = field.split(".");
          if (!transformed[nodeVar]) {
            const props = row[`${nodeVar}_props`];
            transformed[nodeVar] = {
              id: row[`${nodeVar}_id`],
              label: row[`${nodeVar}_label`],
              properties: this.parseJsonSafely(props),
            };
          }
          if (transformed[nodeVar] && prop) {
            transformed[nodeVar][prop] = row[`${field.replace(".", "_")}`];
          }
        } else {
          // Check if this is a simple aggregate (just the alias, like "count")
          const fieldKey = field as keyof typeof row;
          if (row[fieldKey] !== undefined && typeof row[fieldKey] === 'number') {
            transformed[field] = row[fieldKey];
          } else {
            const props = row[`${field}_props`];
            transformed[field] = {
              id: row[`${field}_id`],
              label: row[`${field}_label`],
              properties: this.parseJsonSafely(props),
            };
          }
        }
      });

      return transformed;
    });
  }

  /**
   * Safely parse JSON string, return object if already parsed
   */
  private parseJsonSafely(value: any): any {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return {};
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const graph = new GraphDB();

// ============================================================================
// Re-exports
// ============================================================================

export type { Node, Relationship, GraphQueryResult };
