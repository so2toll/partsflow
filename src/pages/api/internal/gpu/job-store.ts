/**
 * GPU Worker Job Store (In-Memory Mock)
 *
 * In-memory storage for mock GPU worker jobs.
 * In production, this would be replaced with Redis or database storage.
 *
 * Features:
 * - Thread-safe job storage using Map
 * - Automatic job expiration
 * - Progress tracking
 * - Job state management
 *
 * @module pages/api/internal/gpu/job-store
 * @version 1.0.0
 */

import type { MockJob, GPUJobState } from './types';

// ============================================================================
// In-Memory Job Storage
// ============================================================================

/**
 * In-memory job store
 * Key: jobId
 * Value: MockJob
 */
const jobStore = new Map<string, MockJob>();

/**
 * Job expiration time (24 hours)
 */
const JOB_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Job Store Operations
// ============================================================================

/**
 * Create a new job in the store
 */
export function createJob(job: Omit<MockJob, 'startedAt'>): MockJob {
  const newJob: MockJob = {
    ...job,
    startedAt: new Date().toISOString(),
  };

  jobStore.set(job.jobId, newJob);

  // Schedule job expiration
  setTimeout(() => {
    jobStore.delete(job.jobId);
  }, JOB_EXPIRATION_MS);

  return newJob;
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): MockJob | undefined {
  return jobStore.get(jobId);
}

/**
 * Update job state and progress
 */
export function updateJob(
  jobId: string,
  updates: Partial<Pick<MockJob, 'state' | 'progress' | 'completedAt' | 'error' | 'errorMessage'>>
): MockJob | undefined {
  const job = jobStore.get(jobId);

  if (!job) {
    return undefined;
  }

  const updatedJob = {
    ...job,
    ...updates,
  };

  jobStore.set(jobId, updatedJob);

  return updatedJob;
}

/**
 * Complete a job successfully
 */
export function completeJob(jobId: string, resultData?: Record<string, unknown>): MockJob | undefined {
  return updateJob(jobId, {
    state: 'completed',
    progress: 100,
    completedAt: new Date().toISOString(),
    ...resultData,
  });
}

/**
 * Fail a job
 */
export function failJob(jobId: string, error: string, errorMessage?: string): MockJob | undefined {
  return updateJob(jobId, {
    state: 'failed',
    error,
    errorMessage,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Get all jobs (for debugging)
 */
export function getAllJobs(): MockJob[] {
  return Array.from(jobStore.values());
}

/**
 * Clear all jobs (for testing)
 */
export function clearAllJobs(): void {
  jobStore.clear();
}

/**
 * Get job count by state
 */
export function getJobCountByState(state: GPUJobState): number {
  return Array.from(jobStore.values()).filter(job => job.state === state).length;
}
