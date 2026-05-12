/**
 * Video Indexing Worker
 *
 * Background worker that processes ASSET_INDEX queue jobs.
 * Handles:
 * - Video frame extraction (stub)
 * - Thumbnail generation (stub)
 * - Clip creation in database
 * - Progress tracking
 * - Database status updates
 * - Error handling and recovery
 *
 * @module workers/index-worker
 */

import { createWorker, AssetIndexJobData, QUEUES } from '../src/lib/queue';
import { clipRepository } from '../src/lib/db/repositories/ClipRepository';
import { graph } from '../src/lib/db/graph';
import { Job } from 'bullmq';

// ============================================================================
// Types
// ============================================================================

interface FrameData {
  timestamp: number;
  frameUrl: string;
  thumbnailUrl: string;
}

interface ClipData {
  startTime: number;
  endTime: number;
  sceneType: string;
  frameData: FrameData;
}

// ============================================================================
// Worker Processing Logic
// ============================================================================

/**
 * Process a video indexing job
 *
 * Workflow:
 * 1. Extract frames from video (stub - generates mock frames)
 * 2. Generate thumbnails for each frame (stub - uses placeholder URLs)
 * 3. Detect scenes/clips (stub - creates 10 evenly-spaced clips)
 * 4. Create clip records in database
 * 5. Update asset/project status
 *
 * @param job BullMQ job containing asset indexing data
 * @returns Success result with clip count
 */
async function processAssetIndex(job: Job<AssetIndexJobData>): Promise<{ success: boolean; clipCount: number }> {
  const { assetId, userId, projectId, blobUrl } = job.data;

  console.log(`[Index Worker] Starting indexing for asset ${assetId}`);
  console.log(`[Index Worker] Project: ${projectId}, User: ${userId}`);
  console.log(`[Index Worker] Blob URL: ${blobUrl}`);

  try {
    // =========================================================================
    // Stage 1: Verify Asset Exists (0-10%)
    // =========================================================================
    await job.updateProgress(0);

    const assetResults = await graph.query<any>(
      `
      MATCH (a:UploadedAsset {id: $assetId})
      RETURN a
      `,
      { assetId }
    );

    if (assetResults.length === 0 || !assetResults[0].a) {
      throw new Error(`Asset ${assetId} not found in database`);
    }

    const asset = assetResults[0].a.properties;
    console.log(`[Index Worker] Asset found: ${asset.filename || 'unknown'}`);

    // Update asset status to 'indexing'
    await graph.updateNode(assetId, {
      indexingStatus: 'indexing',
      indexingStartedAt: new Date().toISOString(),
    });

    await job.updateProgress(10);

    // =========================================================================
    // Stage 2: Extract Video Metadata (10-20%)
    // =========================================================================
    console.log(`[Index Worker] Extracting video metadata...`);

    // TODO Phase 3: Use ffmpeg/ffprobe to extract actual video metadata
    // const metadata = await extractVideoMetadata(blobUrl);

    // Stub: Generate mock metadata
    const videoDuration = 180; // 3 minutes (stub)
    const videoWidth = 1920;
    const videoHeight = 1080;
    const fps = 30;

    console.log(`[Index Worker] Video duration: ${videoDuration}s (${videoWidth}x${videoHeight} @ ${fps}fps)`);

    // Update asset with metadata
    await graph.updateNode(assetId, {
      duration: videoDuration,
      width: videoWidth,
      height: videoHeight,
      fps: fps,
    });

    await job.updateProgress(20);

    // =========================================================================
    // Stage 3: Extract Frames (20-50%)
    // =========================================================================
    console.log(`[Index Worker] Extracting frames...`);

    // TODO Phase 3: Use ffmpeg to extract frames at regular intervals
    // const frames = await extractFrames(blobUrl, videoDuration);

    // Stub: Generate 10 fake frames with evenly spaced timestamps
    const frameCount = 10;
    const frameInterval = videoDuration / frameCount;
    const frames: FrameData[] = [];

    for (let i = 0; i < frameCount; i++) {
      const timestamp = i * frameInterval;

      // TODO Phase 3: Extract actual frame and upload to blob storage
      // const frameBlob = await extractFrame(blobUrl, timestamp);
      // const frameUrl = await uploadBlob({
      //   container: 'frames',
      //   blobName: `${projectId}/${assetId}/frame_${timestamp}.jpg`,
      //   data: frameBlob,
      //   contentType: 'image/jpeg',
      // });
      // const thumbnailUrl = await generateThumbnail(frameBlob);

      // Stub: Use placeholder URLs
      const frameUrl = `https://storage.example.com/frames/${projectId}/${assetId}/frame_${Math.floor(timestamp)}.jpg`;
      const thumbnailUrl = `https://storage.example.com/thumbnails/${projectId}/${assetId}/thumb_${Math.floor(timestamp)}.jpg`;

      frames.push({
        timestamp,
        frameUrl,
        thumbnailUrl,
      });

      // Update progress (20% to 50% across all frames)
      const frameProgress = 20 + ((i + 1) / frameCount) * 30;
      await job.updateProgress(frameProgress);

      console.log(`[Index Worker] Extracted frame ${i + 1}/${frameCount} at ${timestamp.toFixed(2)}s`);
    }

    console.log(`[Index Worker] Frame extraction complete: ${frames.length} frames`);
    await job.updateProgress(50);

    // =========================================================================
    // Stage 4: Detect Scenes/Clips (50-70%)
    // =========================================================================
    console.log(`[Index Worker] Detecting scenes and creating clips...`);

    // TODO Phase 3: Use AI/ML to detect scene changes and classify clip types
    // const scenes = await detectScenes(frames, blobUrl);

    // Stub: Create clips from frames with mock scene types
    const sceneTypes = ['dialogue', 'action', 'establishing', 'closeup', 'transition'];
    const clips: ClipData[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const nextFrame = frames[i + 1];

      // Create a clip from this frame to the next (or to end of video)
      const startTime = frame.timestamp;
      const endTime = nextFrame ? nextFrame.timestamp : videoDuration;
      const sceneType = sceneTypes[i % sceneTypes.length]; // Cycle through scene types

      clips.push({
        startTime,
        endTime,
        sceneType,
        frameData: frame,
      });

      // Update progress (50% to 70% across all clips)
      const clipProgress = 50 + ((i + 1) / frames.length) * 20;
      await job.updateProgress(clipProgress);
    }

    console.log(`[Index Worker] Scene detection complete: ${clips.length} clips found`);
    await job.updateProgress(70);

    // =========================================================================
    // Stage 5: Create Clip Records in Database (70-90%)
    // =========================================================================
    console.log(`[Index Worker] Creating clip records in database...`);

    const createdClips = [];

    for (let i = 0; i < clips.length; i++) {
      const clipData = clips[i];

      // TODO Phase 3: Generate actual clip video file and upload
      // const clipBlob = await extractClip(blobUrl, clipData.startTime, clipData.endTime);
      // const clipUrl = await uploadBlob({
      //   container: 'clips',
      //   blobName: `${projectId}/${assetId}/clip_${i}.mp4`,
      //   data: clipBlob,
      //   contentType: 'video/mp4',
      // });

      // Stub: Use placeholder URLs
      const clipUrl = `https://storage.example.com/clips/${projectId}/${assetId}/clip_${i}.mp4`;

      // Create clip in database
      const clip = await clipRepository.create({
        assetId,
        projectId,
        startTime: clipData.startTime,
        endTime: clipData.endTime,
        sceneType: clipData.sceneType,
        deeplakeRef: `deeplake_${assetId}_${i}`, // Stub for vector DB reference
        clipPath: clipUrl,
        keyframePath: clipData.frameData.thumbnailUrl,
      });

      createdClips.push(clip);

      // Update progress (70% to 90% across all clip creates)
      const createProgress = 70 + ((i + 1) / clips.length) * 20;
      await job.updateProgress(createProgress);

      console.log(`[Index Worker] Created clip ${i + 1}/${clips.length}: ${clip.id} (${clipData.sceneType})`);
    }

    console.log(`[Index Worker] Database records created: ${createdClips.length} clips`);
    await job.updateProgress(90);

    // =========================================================================
    // Stage 6: Finalize Indexing (90-100%)
    // =========================================================================
    console.log(`[Index Worker] Finalizing indexing...`);

    // Update asset status to 'indexed'
    await graph.updateNode(assetId, {
      indexingStatus: 'indexed',
      indexingCompletedAt: new Date().toISOString(),
      clipCount: createdClips.length,
      frameCount: frames.length,
    });

    // Update project if exists
    if (projectId) {
      await graph.query(
        `
        MATCH (p:Project {id: $projectId})
        SET p.lastIndexedAt = $now
        RETURN p
        `,
        {
          projectId,
          now: new Date().toISOString(),
        }
      );
    }

    await job.updateProgress(100);

    console.log(`[Index Worker] ✅ Indexing completed for asset ${assetId}`);
    console.log(`[Index Worker] Total clips created: ${createdClips.length}`);
    console.log(`[Index Worker] Total frames extracted: ${frames.length}`);

    return {
      success: true,
      clipCount: createdClips.length,
    };

  } catch (error) {
    console.error(`[Index Worker] ❌ Indexing failed for asset ${assetId}:`, error);

    // Update asset status to 'failed' with error message
    try {
      await graph.updateNode(assetId, {
        indexingStatus: 'failed',
        indexingError: error instanceof Error ? error.message : 'Unknown error occurred',
        indexingFailedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error(`[Index Worker] Failed to update asset status:`, updateError);
    }

    throw error;
  }
}

// ============================================================================
// Worker Setup
// ============================================================================

/**
 * Create and start the indexing worker
 * Processes jobs from the ASSET_INDEX queue
 */
const worker = createWorker<AssetIndexJobData>(
  QUEUES.ASSET_INDEX,
  processAssetIndex,
  { concurrency: 3 } // Process up to 3 videos simultaneously
);

// ============================================================================
// Event Handlers
// ============================================================================

worker.on('completed', (job) => {
  console.log(`[Index Worker] ✅ Job ${job.id} completed successfully`);
  console.log(`[Index Worker] Asset: ${job.data.assetId}, Clips created: ${job.returnvalue?.clipCount || 0}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Index Worker] ❌ Job ${job?.id} failed:`, err.message);
  if (job) {
    console.error(`[Index Worker] Asset: ${job.data.assetId}`);
  }
});

worker.on('error', (err) => {
  console.error('[Index Worker] Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`[Index Worker] ⚠️ Job ${jobId} stalled (may be processing on another worker)`);
});

worker.on('active', (job) => {
  console.log(`[Index Worker] 🔄 Job ${job.id} is now active`);
  console.log(`[Index Worker] Processing asset: ${job.data.assetId}`);
});

worker.on('progress', (job, progress) => {
  console.log(`[Index Worker] 📊 Job ${job.id} progress: ${Math.round(progress)}%`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Gracefully shutdown the worker
 * Waits for active jobs to complete before exiting
 */
async function shutdown() {
  console.log('[Index Worker] Shutting down gracefully...');

  try {
    // Close the worker (waits for active jobs to complete)
    await worker.close();
    console.log('[Index Worker] Worker closed successfully');

    // Close database connections if needed
    // await graph.close();

    console.log('[Index Worker] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Index Worker] Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Index Worker] Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Index Worker] Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});

// ============================================================================
// Worker Started
// ============================================================================

console.log('[Index Worker] 🚀 Video indexing worker started');
console.log('[Index Worker] Queue:', QUEUES.ASSET_INDEX);
console.log('[Index Worker] Concurrency:', 3);
console.log('[Index Worker] Ready to process video indexing jobs');
