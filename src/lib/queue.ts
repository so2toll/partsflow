import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Queue names
export const QUEUES = {
  VIDEO_GENERATE: 'video-generate',
  ASSET_INDEX: 'asset-index',
  VIDEO_ASSEMBLE: 'video-assemble',
  NOTIFICATION: 'notification',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

// Job data types
export interface VideoGenerateJobData {
  projectId: string;
  userId: string;
  organizationId: string;
  sceneIds: string[];
  quality: 'draft' | '720p' | '1080p' | '4k';
}

export interface AssetIndexJobData {
  assetId: string;
  userId: string;
  projectId: string;
  blobUrl: string;
}

export interface VideoAssembleJobData {
  projectId: string;
  clipIds: string[];
  outputFormat: 'mp4' | 'webm';
}

export interface NotificationJobData {
  type: 'email' | 'webhook';
  userId: string;
  template: string;
  data: Record<string, unknown>;
}

export type JobData =
  | VideoGenerateJobData
  | AssetIndexJobData
  | VideoAssembleJobData
  | NotificationJobData;

// Redis connection (shared across queues)
let _connection: Redis | null = null;

function getConnection(): Redis {
  if (!_connection) {
    const redisUrl = import.meta.env.REDIS_URL || 'redis://localhost:6379';
    _connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
    });
  }
  return _connection;
}

// Queue instances cache
const queues = new Map<QueueName, Queue>();

/**
 * Get or create a queue instance
 */
export function getQueue<T extends JobData>(name: QueueName): Queue<T> {
  if (!queues.has(name)) {
    const queue = new Queue<T>(name, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs for debugging
        },
      },
    });
    queues.set(name, queue as Queue<JobData>);
  }
  return queues.get(name) as Queue<T>;
}

/**
 * Add a job to a queue
 */
export async function addJob<T extends JobData>(params: {
  queue: QueueName;
  name: string;
  data: T;
  priority?: number;
  delay?: number;
  jobId?: string;
}): Promise<Job<T>> {
  const { queue: queueName, name, data, priority, delay, jobId } = params;
  const queue = getQueue<T>(queueName);

  return queue.add(name, data, {
    priority,
    delay,
    jobId,
  });
}

/**
 * Get a job by ID
 */
export async function getJob<T extends JobData>(
  queueName: QueueName,
  jobId: string
): Promise<Job<T> | undefined> {
  const queue = getQueue<T>(queueName);
  return queue.getJob(jobId);
}

/**
 * Get job state (status and progress)
 * Returns the current state of a job: 'waiting', 'active', 'completed', 'failed', 'delayed'
 */
export async function getJobState<T extends JobData>(
  queueName: QueueName,
  jobId: string
): Promise<{ state: string; progress?: number } | undefined> {
  const job = await getJob<T>(queueName, jobId);

  if (!job) {
    return undefined;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    state: state || 'unknown',
    progress: progress ? Math.round(progress) : 0,
  };
}

/**
 * Get job counts for a queue
 */
export async function getJobCounts(queueName: QueueName) {
  const queue = getQueue(queueName);
  return queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
}

/**
 * Create a worker for processing jobs
 * Note: Workers should be created in separate worker processes, not in the main app
 */
export function createWorker<T extends JobData>(
  queueName: QueueName,
  processor: (job: Job<T>) => Promise<unknown>,
  options?: {
    concurrency?: number;
  }
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection: getConnection(),
    concurrency: options?.concurrency || 1,
  });
}

/**
 * Create queue events listener
 */
export function createQueueEvents(queueName: QueueName): QueueEvents {
  return new QueueEvents(queueName, {
    connection: getConnection(),
  });
}

/**
 * Graceful shutdown - close all connections
 */
export async function closeQueues(): Promise<void> {
  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();

  if (_connection) {
    await _connection.quit();
    _connection = null;
  }
}

// Job helper functions

/**
 * Add a video generation job
 */
export async function addVideoGenerateJob(
  data: VideoGenerateJobData,
  options?: { priority?: number }
): Promise<Job<VideoGenerateJobData>> {
  return addJob({
    queue: QUEUES.VIDEO_GENERATE,
    name: 'generate',
    data,
    priority: options?.priority,
    jobId: `generate:${data.projectId}`, // Prevent duplicate jobs
  });
}

/**
 * Add an asset indexing job
 */
export async function addAssetIndexJob(
  data: AssetIndexJobData
): Promise<Job<AssetIndexJobData>> {
  return addJob({
    queue: QUEUES.ASSET_INDEX,
    name: 'index',
    data,
    jobId: `index:${data.assetId}`,
  });
}

/**
 * Add a video assembly job
 */
export async function addVideoAssembleJob(
  data: VideoAssembleJobData
): Promise<Job<VideoAssembleJobData>> {
  return addJob({
    queue: QUEUES.VIDEO_ASSEMBLE,
    name: 'assemble',
    data,
    jobId: `assemble:${data.projectId}`,
  });
}

/**
 * Add a notification job
 */
export async function addNotificationJob(
  data: NotificationJobData
): Promise<Job<NotificationJobData>> {
  return addJob({
    queue: QUEUES.NOTIFICATION,
    name: data.type,
    data,
  });
}
