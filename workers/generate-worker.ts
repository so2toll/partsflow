/**
 * Video Generation Worker
 *
 * Background worker that processes video generation jobs.
 * Handles:
 * - Scene-by-scene video generation
 * - Progress tracking
 * - Database status updates
 * - Error handling and recovery
 *
 * @module workers/generate-worker
 */

import { createWorker, VideoGenerateJobData, QUEUES } from '../src/lib/queue';
import { projectRepository } from '../src/lib/db/repositories';
import { Job } from 'bullmq';

// Import Director Agent client (to be implemented in Phase 3 - GPU integration)
// import { directorAgent } from '../src/lib/agents/director';

/**
 * Process a video generation job
 * Updates project status through stages: scripted -> generating -> rendering -> completed
 */
async function processVideoGenerate(job: Job<VideoGenerateJobData>): Promise<{ success: boolean; outputUrl: string }> {
  const { projectId, sceneIds, quality, userId, organizationId } = job.data;

  console.log(`[Worker] Starting video generation for project ${projectId}`);
  console.log(`[Worker] Scenes: ${sceneIds.length}, Quality: ${quality}, User: ${userId}`);

  try {
    // Stage 1: Initialize generation (10%)
    await job.updateProgress(10);
    await projectRepository.updateVideoStatus(projectId, 'generating', {
      completedScenes: 0,
      totalScenes: sceneIds.length,
    });

    console.log(`[Worker] Project ${projectId} status set to 'generating'`);

    // Stage 2: Generate scenes (10% -> 70%)
    for (let i = 0; i < sceneIds.length; i++) {
      const sceneId = sceneIds[i];

      console.log(`[Worker] Processing scene ${i + 1}/${sceneIds.length}: ${sceneId}`);

      // TODO Phase 3: Call Director Agent to generate scene video
      // const sceneVideo = await directorAgent.generateScene({
      //   sceneId,
      //   quality,
      //   projectId,
      // });

      // Simulate scene generation (remove in Phase 3)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update progress
      const completedScenes = i + 1;
      const sceneProgress = 10 + (completedScenes / sceneIds.length) * 60;

      await job.updateProgress(sceneProgress);
      await projectRepository.updateVideoStatus(projectId, 'generating', {
        completedScenes,
        totalScenes: sceneIds.length,
      });

      console.log(`[Worker] Scene ${i + 1}/${sceneIds.length} completed (${Math.round(sceneProgress)}%)`);
    }

    // Stage 3: Rendering/Assembly (70% -> 90%)
    await job.updateProgress(70);
    await projectRepository.updateVideoStatus(projectId, 'rendering', {
      completedScenes: sceneIds.length,
      totalScenes: sceneIds.length,
    });

    console.log(`[Worker] All scenes generated, starting video assembly`);

    // TODO Phase 3: Call Director Agent to assemble final video
    // const finalVideo = await directorAgent.assembleVideo({
    //   projectId,
    //   sceneVideos,
    //   quality,
    // });

    // Simulate video assembly (remove in Phase 3)
    await new Promise(resolve => setTimeout(resolve, 3000));
    await job.updateProgress(90);

    // Stage 4: Upload and finalize (90% -> 100%)
    console.log(`[Worker] Video assembled, uploading to storage`);

    // TODO Phase 3: Upload to Azure Blob Storage
    // const outputUrl = await uploadBlob({
    //   container: CONTAINERS.VIDEOS,
    //   blobName: `${organizationId}/${projectId}/output.mp4`,
    //   data: finalVideo,
    //   contentType: 'video/mp4',
    // });

    // Stub output URL (replace in Phase 3)
    const outputUrl = `https://storage.example.com/videos/${organizationId}/${projectId}/output.mp4`;
    const thumbnailUrl = `https://storage.example.com/videos/${organizationId}/${projectId}/thumbnail.jpg`;

    // Calculate estimated duration and used minutes
    const estimatedDuration = sceneIds.length * 30; // 30 seconds per scene (stub)
    const usedMinutes = Math.ceil(estimatedDuration / 60);

    // Complete the video project
    await projectRepository.completeVideo(projectId, {
      outputVideoUrl: outputUrl,
      thumbnailUrl: thumbnailUrl,
      estimatedDuration: estimatedDuration,
      usedMinutes: usedMinutes,
    });

    await job.updateProgress(100);

    console.log(`[Worker] ✅ Video generation completed for project ${projectId}`);
    console.log(`[Worker] Output URL: ${outputUrl}`);
    console.log(`[Worker] Duration: ${estimatedDuration}s, Used minutes: ${usedMinutes}`);

    return {
      success: true,
      outputUrl,
    };

  } catch (error) {
    console.error(`[Worker] ❌ Video generation failed for project ${projectId}:`, error);

    // Update project status to failed with error message
    await projectRepository.updateVideoStatus(projectId, 'failed', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
    });

    throw error;
  }
}

// Create and start worker
const worker = createWorker<VideoGenerateJobData>(
  QUEUES.VIDEO_GENERATE,
  processVideoGenerate,
  { concurrency: 2 } // Process up to 2 videos simultaneously
);

// Event handlers
worker.on('completed', (job) => {
  console.log(`[Worker] ✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`[Worker] ⚠️ Job ${jobId} stalled (may be processing on another worker)`);
});

// Graceful shutdown
async function shutdown() {
  console.log('[Worker] Shutting down gracefully...');

  await worker.close();
  console.log('[Worker] Worker closed');

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[Worker] 🚀 Video generation worker started');
console.log('[Worker] Listening on queue:', QUEUES.VIDEO_GENERATE);
console.log('[Worker] Concurrency:', 2);
