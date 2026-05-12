/**
 * DuckLake Database Client
 *
 * Provides connection to DuckDB with DuckLake extension for event store
 * and domain data. DuckLake is a lakehouse format that stores data in
 * Parquet files on S3 with ACID transactions via PostgreSQL catalog.
 *
 * @module lib/db/ducklake
 * @version 0.1.0
 */

import duckdb, { type Database, type Connection } from "duckdb";

/**
 * DuckDB database instance (singleton)
 */
let db: Database | null = null;

/**
 * DuckDB connection instance (singleton)
 */
let conn: Connection | null = null;

/**
 * Track initialization state
 */
let initialized = false;

/**
 * Initialize DuckDB with DuckLake extension and S3 configuration
 *
 * This function:
 * 1. Creates an in-memory DuckDB instance
 * 2. Installs and loads required extensions (ducklake, httpfs)
 * 3. Configures S3 credentials
 * 4. Attaches the DuckLake catalog (PostgreSQL + S3)
 *
 * Note: DuckLake extension may not be available in standard DuckDB distributions.
 * For now, we'll set up standard DuckDB with S3 support and prepare for DuckLake.
 *
 * @returns {Promise<Connection>} DuckDB connection
 *
 * @throws {Error} If initialization fails
 */
export async function initializeDuckDB(): Promise<Connection> {
  if (conn && initialized) {
    return conn;
  }

  return new Promise((resolve, reject) => {
    try {
      // Create in-memory database (data lives in S3/Parquet)
      db = new duckdb.Database(":memory:", (err) => {
        if (err) {
          reject(new Error(`Failed to create DuckDB instance: ${err.message}`));
          return;
        }

        conn = db!.connect();

        // Initialize extensions and configuration
        const initSQL = buildInitializationSQL();

        conn.run(initSQL, (err) => {
          if (err) {
            console.error("DuckDB initialization error:", err);
            reject(new Error(`Failed to initialize DuckDB: ${err.message}`));
            return;
          }

          initialized = true;
          console.log("DuckDB initialized successfully");
          resolve(conn!);
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Build initialization SQL for DuckDB
 *
 * Generates SQL statements to:
 * - Install required extensions
 * - Configure S3 access
 * - Attach DuckLake catalog (when available)
 *
 * @returns {string} SQL initialization script
 */
function buildInitializationSQL(): string {
  const awsRegion = import.meta.env.AWS_REGION || process.env.AWS_REGION || "us-east-1";
  const awsAccessKeyId = import.meta.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
  const awsSecretKey = import.meta.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";
  const awsEndpoint = import.meta.env.AWS_ENDPOINT_URL || process.env.AWS_ENDPOINT_URL || "";

  // Build initialization script
  let sql = `
    -- Install and load httpfs extension for S3 access
    INSTALL httpfs;
    LOAD httpfs;

    -- Configure S3 credentials
    SET s3_region = '${awsRegion}';
  `;

  if (awsAccessKeyId && awsSecretKey) {
    sql += `
    SET s3_access_key_id = '${awsAccessKeyId}';
    SET s3_secret_access_key = '${awsSecretKey}';
    `;
  }

  if (awsEndpoint) {
    // For MinIO or other S3-compatible services
    sql += `
    SET s3_endpoint = '${awsEndpoint}';
    SET s3_use_ssl = ${awsEndpoint.startsWith('https')};
    SET s3_url_style = 'path';
    `;
  }

  // Note: DuckLake extension installation would go here when available
  // For now, we'll work with standard DuckDB and Parquet files
  // sql += `
  //   INSTALL ducklake;
  //   LOAD ducklake;
  // `;

  return sql;
}

/**
 * Get the active DuckDB connection
 *
 * Initializes the connection if not already initialized.
 *
 * @returns {Promise<Connection>} DuckDB connection
 */
export async function getConnection(): Promise<Connection> {
  if (!conn || !initialized) {
    return await initializeDuckDB();
  }
  return conn;
}

/**
 * Execute a SQL query and return all results
 *
 * @template T Expected result type
 * @param {string} sql SQL query
 * @param {unknown[]} params Query parameters
 * @returns {Promise<T[]>} Query results
 *
 * @example
 * ```typescript
 * const candidates = await query<Candidate>(
 *   "SELECT * FROM candidates WHERE status = ?",
 *   ["submitted"]
 * );
 * ```
 */
export async function query<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const connection = await getConnection();

  return new Promise((resolve, reject) => {
    connection.all(sql, ...params, (err, rows) => {
      if (err) {
        console.error("DuckDB query error:", err);
        reject(new Error(`Query failed: ${err.message}`));
        return;
      }
      resolve(rows as T[]);
    });
  });
}

/**
 * Execute a SQL statement that doesn't return results
 *
 * @param {string} sql SQL statement
 * @param {unknown[]} params Statement parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await execute(
 *   "INSERT INTO candidates (id, email, name) VALUES (?, ?, ?)",
 *   ["cand_123", "john@example.com", "John Doe"]
 * );
 * ```
 */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<void> {
  const connection = await getConnection();

  return new Promise((resolve, reject) => {
    connection.run(sql, ...params, (err) => {
      if (err) {
        console.error("DuckDB execute error:", err);
        reject(new Error(`Statement failed: ${err.message}`));
        return;
      }
      resolve();
    });
  });
}

/**
 * Execute multiple SQL statements as a batch
 *
 * Useful for running DDL scripts or multiple related statements.
 * Note: This doesn't provide transaction guarantees in DuckDB.
 *
 * @param {string} sql Multi-statement SQL script
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await executeBatch(`
 *   CREATE TABLE IF NOT EXISTS candidates (...);
 *   CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
 * `);
 * ```
 */
export async function executeBatch(sql: string): Promise<void> {
  const connection = await getConnection();

  return new Promise((resolve, reject) => {
    connection.exec(sql, (err) => {
      if (err) {
        console.error("DuckDB batch execute error:", err);
        reject(new Error(`Batch execution failed: ${err.message}`));
        return;
      }
      resolve();
    });
  });
}

/**
 * Execute a query and return a single row
 *
 * @template T Expected result type
 * @param {string} sql SQL query
 * @param {unknown[]} params Query parameters
 * @returns {Promise<T | null>} Single row or null if not found
 *
 * @example
 * ```typescript
 * const candidate = await queryOne<Candidate>(
 *   "SELECT * FROM candidates WHERE id = ?",
 *   ["cand_123"]
 * );
 * ```
 */
export async function queryOne<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Create a table from a Parquet file on S3
 *
 * DuckDB can directly query Parquet files on S3 without loading into memory.
 *
 * @param {string} tableName Table name to create
 * @param {string} s3Path S3 path to Parquet file(s)
 * @param {boolean} replace Whether to replace existing table
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await createTableFromParquet(
 *   "candidates",
 *   "s3://data3d-lake/candidates/*.parquet"
 * );
 * ```
 */
export async function createTableFromParquet(
  tableName: string,
  s3Path: string,
  replace: boolean = false
): Promise<void> {
  const createOrReplace = replace ? "CREATE OR REPLACE TABLE" : "CREATE TABLE IF NOT EXISTS";

  const sql = `
    ${createOrReplace} ${tableName} AS
    SELECT * FROM read_parquet('${s3Path}')
  `;

  await execute(sql);
}

/**
 * Export query results to Parquet file on S3
 *
 * @param {string} query SQL query to export
 * @param {string} s3Path S3 path for output file
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await exportToParquet(
 *   "SELECT * FROM candidates WHERE status = 'approved'",
 *   "s3://data3d-exports/approved_candidates.parquet"
 * );
 * ```
 */
export async function exportToParquet(
  query: string,
  s3Path: string
): Promise<void> {
  const sql = `
    COPY (${query})
    TO '${s3Path}'
    (FORMAT PARQUET, COMPRESSION ZSTD)
  `;

  await execute(sql);
}

/**
 * Close DuckDB connection
 *
 * Should be called during application shutdown.
 *
 * @returns {Promise<void>}
 */
export async function closeDuckDB(): Promise<void> {
  return new Promise((resolve) => {
    if (conn) {
      conn.close(() => {
        conn = null;
        initialized = false;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Health check - verify DuckDB is accessible
 *
 * @returns {Promise<boolean>} True if database is accessible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query<{ num: number }>("SELECT 1 as num");
    return result.length > 0 && result[0].num === 1;
  } catch (error) {
    console.error("DuckDB health check failed:", error);
    return false;
  }
}
