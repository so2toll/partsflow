/**
 * Job Repository - Graph-Based Implementation
 *
 * Repository for Job entity operations using graph queries.
 * Jobs are background tasks for video generation, rendering, and indexing.
 *
 * @module lib/db/repositories/JobRepository
 * @version 0.1.0
 */

import { ulid } from "ulid";
import { graph } from "../graph";
import type { Node } from "../graph";

// ============================================================================
// Types
// ============================================================================

export type JobStatus = 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled';
export type JobType = 'generate_video' | 'index_footage' | 'render_clip' | 'assemble_video';

export interface Job {
  id: string;              // job_xxx
  userId: string;          // submitted by
  projectId: string;
  organizationId: string;
  jobType: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorMessage?: string;
  workerId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateJobData {
  userId: string;
  projectId: string;
  organizationId: string;
  jobType: JobType;
  priority?: number;
  payload: Record<string, unknown>;
}

// ============================================================================
// Job Repository
// ============================================================================

/**
 * Repository for Job entity operations using graph queries
 */
export class JobRepository {
  /**
   * Create a new job
   *
   * @param data Job data
   * @returns Created job
   *
   * @example
   * ```typescript
   * const repo = new JobRepository();
   * const job = await repo.create({
   *   userId: "user_123",
   *   projectId: "proj_123",
   *   organizationId: "org_123",
   *   jobType: "generate_video",
   *   payload: { sceneIds: ["scene_1", "scene_2"] }
   * });
   * ```
   */
  async create(data: CreateJobData): Promise<Job> {
    const jobId = `job_${ulid()}`;
    const now = new Date().toISOString();

    // Use graph mutation to create job node
    const result = await graph.mutate(
      `
      CREATE (j:Job {
        id: $id,
        userId: $userId,
        projectId: $projectId,
        organizationId: $organizationId,
        jobType: $jobType,
        status: $status,
        priority: $priority,
        payload: $payload,
        result: $result,
        errorMessage: $errorMessage,
        workerId: $workerId,
        startedAt: $startedAt,
        completedAt: $completedAt,
        createdAt: $now
      })
      RETURN j
      `,
      {
        id: jobId,
        userId: data.userId,
        projectId: data.projectId,
        organizationId: data.organizationId,
        jobType: data.jobType,
        status: 'queued',
        priority: data.priority ?? 0,
        payload: JSON.stringify(data.payload),
        result: null,
        errorMessage: null,
        workerId: null,
        startedAt: null,
        completedAt: null,
        now,
      }
    );

    // Create HAS_JOB relationship from project to job
    await graph.createRelationship(data.projectId, jobId, "HAS_JOB", {
      createdAt: now,
    });

    // Create SUBMITTED relationship from user to job
    await graph.createRelationship(data.userId, jobId, "SUBMITTED", {
      submittedAt: now,
    });

    return this.mapNodeToJob(result);
  }

  /**
   * Find job by ID
   *
   * @param id Job ID
   * @returns Job or null if not found
   */
  async findById(id: string): Promise<Job | null> {
    const results = await graph.query<any>(
      `
      MATCH (j:Job {id: $id})
      RETURN j
      `,
      { id }
    );

    if (results.length === 0 || !results[0].j) {
      return null;
    }

    return this.mapNodeToJob(results[0].j);
  }

  /**
   * Find all jobs for a project
   *
   * @param projectId Project ID
   * @param options Query options
   * @returns Jobs and total count
   */
  async findByProject(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: JobStatus;
    } = {}
  ): Promise<{ jobs: Job[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get jobs using graph query
    const results = await graph.query<any>(
      `
      MATCH (p:Project {id: $projectId})-[:HAS_JOB]->(j:Job)
      RETURN j
      ORDER BY j.createdAt DESC
      LIMIT ${limit}
      SKIP ${offset}
      `,
      { projectId }
    );

    let jobs = results
      .filter((r) => r.j)
      .map((result) => this.mapNodeToJob(result.j));

    // Filter by status if provided
    if (options.status) {
      jobs = jobs.filter((j) => j.status === options.status);
    }

    // Get total count
    const countResults = await graph.query<{ count: number }>(
      `
      MATCH (p:Project {id: $projectId})-[:HAS_JOB]->(j:Job)
      RETURN count(j) as count
      `,
      { projectId }
    );

    const total = countResults[0]?.count || 0;

    return { jobs, total };
  }

  /**
   * Find jobs by status
   *
   * @param status Job status
   * @param options Query options
   * @returns Jobs with the given status
   */
  async findByStatus(
    status: JobStatus,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Job[]> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const results = await graph.query<any>(
      `
      MATCH (j:Job {status: $status})
      RETURN j
      ORDER BY j.priority DESC
      LIMIT ${limit}
      SKIP ${offset}
      `,
      { status }
    );

    return results
      .filter((r) => r.j)
      .map((result) => this.mapNodeToJob(result.j));
  }

  /**
   * Find queued jobs for workers to process
   *
   * @param limit Number of jobs to return
   * @returns Queued jobs ordered by priority
   */
  async findQueued(limit: number = 10): Promise<Job[]> {
    return this.findByStatus('queued', { limit });
  }

  /**
   * Update job
   *
   * @param id Job ID
   * @param data Updates to apply
   * @returns Updated job
   */
  async update(
    id: string,
    data: Partial<Omit<Job, "id" | "createdAt" | "userId" | "projectId" | "organizationId">>
  ): Promise<Job> {
    const updates: Record<string, unknown> = {};

    if (data.jobType !== undefined) updates.jobType = data.jobType;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.payload !== undefined) updates.payload = JSON.stringify(data.payload);
    if (data.result !== undefined) updates.result = JSON.stringify(data.result);
    if (data.errorMessage !== undefined) updates.errorMessage = data.errorMessage;
    if (data.workerId !== undefined) updates.workerId = data.workerId;
    if (data.startedAt !== undefined) updates.startedAt = data.startedAt;
    if (data.completedAt !== undefined) updates.completedAt = data.completedAt;

    const result = await graph.updateNode(id, updates);

    return this.mapNodeToJob(result);
  }

  /**
   * Update job status with optional result
   *
   * @param id Job ID
   * @param status New status
   * @param result Optional result data (for completed jobs)
   * @returns Updated job
   */
  async updateStatus(
    id: string,
    status: JobStatus,
    result?: Record<string, unknown>
  ): Promise<Job> {
    const updates: Partial<Job> = { status };

    if (status === 'processing') {
      updates.startedAt = new Date().toISOString();
    } else if (status === 'complete' || status === 'failed' || status === 'cancelled') {
      updates.completedAt = new Date().toISOString();
    }

    if (result) {
      updates.result = result;
    }

    return this.update(id, updates);
  }

  /**
   * Worker claims a job for processing
   *
   * @param id Job ID
   * @param workerId Worker identifier
   * @returns Updated job
   */
  async claim(id: string, workerId: string): Promise<Job> {
    return this.update(id, {
      status: 'processing',
      workerId,
      startedAt: new Date().toISOString(),
    });
  }

  /**
   * Cancel a job
   *
   * @param id Job ID
   * @returns Updated job
   */
  async cancel(id: string): Promise<Job> {
    return this.updateStatus(id, 'cancelled');
  }

  // ========================================================================
  // Row Mappers
  // ========================================================================

  private mapNodeToJob(node: Node): Job {
    // Handle case where properties might be a JSON string
    const props = typeof node.properties === 'string'
      ? JSON.parse(node.properties)
      : node.properties;

    // Use props.id (ULID) if available, otherwise fall back to node.id
    const id = props?.id || node.id;

    return {
      id,
      userId: props?.userId,
      projectId: props?.projectId,
      organizationId: props?.organizationId,
      jobType: props?.jobType,
      status: props?.status || 'queued',
      priority: props?.priority ?? 0,
      payload: typeof props?.payload === 'string'
        ? JSON.parse(props.payload)
        : props?.payload || {},
      result: props?.result
        ? (typeof props.result === 'string' ? JSON.parse(props.result) : props.result)
        : undefined,
      errorMessage: props?.errorMessage,
      workerId: props?.workerId,
      startedAt: props?.startedAt,
      completedAt: props?.completedAt,
      createdAt: props?.createdAt,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const jobRepository = new JobRepository();
