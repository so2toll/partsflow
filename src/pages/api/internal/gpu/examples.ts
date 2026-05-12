/**
 * GPU Worker API Examples
 *
 * This file contains example code demonstrating how to use the GPU worker mock endpoints.
 * These examples show typical integration patterns for video generation flows.
 *
 * @module pages/api/internal/gpu/examples
 * @version 1.0.0
 */

// ============================================================================
// Example 1: Generate Keyframe with Polling
// ============================================================================

/**
 * Example: Generate a keyframe and poll for completion
 */
export async function generateKeyframeWithPolling(params: {
  sceneId: string;
  prompt: string;
  quality?: 'draft' | 'standard' | 'high';
}) {
  // Start keyframe generation
  const generateResponse = await fetch('/api/internal/gpu/generate-keyframe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!generateResponse.ok) {
    throw new Error('Failed to start keyframe generation');
  }

  const { jobId, estimatedTimeSeconds } = await generateResponse.json();

  console.log(`Keyframe generation started (job: ${jobId})`);
  console.log(`Estimated time: ${estimatedTimeSeconds}s`);

  // Poll for completion
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/internal/gpu/status/${jobId}`);

        if (!statusResponse.ok) {
          clearInterval(pollInterval);
          reject(new Error('Failed to get job status'));
          return;
        }

        const status = await statusResponse.json();

        console.log(`Progress: ${status.progress}%`);

        if (status.state === 'completed') {
          clearInterval(pollInterval);
          console.log('✅ Keyframe ready!');
          resolve({
            keyframeId: status.keyframeId,
            keyframeUrl: status.keyframeUrl,
            thumbnailUrl: status.thumbnailUrl,
          });
        } else if (status.state === 'failed') {
          clearInterval(pollInterval);
          console.error('❌ Generation failed');
          reject(new Error(status.errorMessage || 'Unknown error'));
        }
      } catch (error) {
        clearInterval(pollInterval);
        reject(error);
      }
    }, 500); // Poll every 500ms

    // Set timeout based on estimated time + 30% buffer
    setTimeout(() => {
      clearInterval(pollInterval);
      reject(new Error('Keyframe generation timed out'));
    }, estimatedTimeSeconds * 1000 * 1.3);
  });
}

// ============================================================================
// Example 2: Generate Scene with Frame-by-Frame Progress
// ============================================================================

/**
 * Example: Generate a scene with detailed progress tracking
 */
export async function generateSceneWithProgress(params: {
  sceneId: string;
  script: string;
  duration: number;
  quality?: 'draft' | 'standard' | 'high';
  onProgress?: (progress: number, completedFrames: number, totalFrames: number) => void;
}) {
  const { sceneId, script, duration, quality, onProgress } = params;

  // Start scene generation
  const generateResponse = await fetch('/api/internal/gpu/generate-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneId,
      script,
      duration,
      quality,
    }),
  });

  if (!generateResponse.ok) {
    throw new Error('Failed to start scene generation');
  }

  const { jobId, estimatedTimeSeconds, totalFrames } = await generateResponse.json();

  console.log(`Scene generation started (job: ${jobId})`);
  console.log(`Total frames: ${totalFrames}`);
  console.log(`Estimated time: ${estimatedTimeSeconds}s`);

  // Poll for completion
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/internal/gpu/status/${jobId}`);

        if (!statusResponse.ok) {
          clearInterval(pollInterval);
          reject(new Error('Failed to get job status'));
          return;
        }

        const status = await statusResponse.json();

        // Call progress callback if provided
        if (onProgress) {
          onProgress(status.progress, status.completedFrames, status.totalFrames);
        }

        console.log(`Progress: ${status.completedFrames}/${status.totalFrames} frames (${status.progress}%)`);

        if (status.state === 'completed') {
          clearInterval(pollInterval);
          console.log('✅ Scene ready!');
          resolve({
            sceneId: status.sceneId,
            sceneUrl: status.sceneUrl,
            thumbnailUrl: status.thumbnailUrl,
            duration: status.duration,
            fps: status.fps,
            resolution: status.resolution,
          });
        } else if (status.state === 'failed') {
          clearInterval(pollInterval);
          console.error('❌ Generation failed');
          reject(new Error(status.errorMessage || 'Unknown error'));
        }
      } catch (error) {
        clearInterval(pollInterval);
        reject(error);
      }
    }, 1000); // Poll every 1 second

    // Set timeout based on estimated time + 50% buffer
    setTimeout(() => {
      clearInterval(pollInterval);
      reject(new Error('Scene generation timed out'));
    }, estimatedTimeSeconds * 1000 * 1.5);
  });
}

// ============================================================================
// Example 3: Batch Keyframe Generation
// ============================================================================

/**
 * Example: Generate multiple keyframes in parallel
 */
export async function generateKeyframesBatch(params: Array<{
  sceneId: string;
  prompt: string;
  frameNumber: number;
}>) {
  console.log(`Starting batch generation of ${params.length} keyframes...`);

  // Start all keyframe generations in parallel
  const jobs = await Promise.all(
    params.map(async (param) => {
      const response = await fetch('/api/internal/gpu/generate-keyframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(param),
      });

      if (!response.ok) {
        throw new Error(`Failed to start job for frame ${param.frameNumber}`);
      }

      return response.json();
    })
  );

  console.log(`Started ${jobs.length} jobs`);

  // Poll all jobs until complete
  const results = await Promise.all(
    jobs.map((job) =>
      new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/internal/gpu/status/${job.jobId}`);
            const status = await statusResponse.json();

            if (status.state === 'completed') {
              clearInterval(pollInterval);
              resolve({
                frameNumber: job.frameNumber,
                keyframeUrl: status.keyframeUrl,
                keyframeId: status.keyframeId,
              });
            } else if (status.state === 'failed') {
              clearInterval(pollInterval);
              reject(new Error(`Job ${job.jobId} failed: ${status.errorMessage}`));
            }
          } catch (error) {
            clearInterval(pollInterval);
            reject(error);
          }
        }, 500);
      })
    )
  );

  console.log(`✅ All ${results.length} keyframes ready!`);
  return results;
}

// ============================================================================
// Example 4: Video Generation Pipeline
// ============================================================================

/**
 * Example: Complete video generation pipeline with scenes
 */
export async function generateVideoPipeline(params: {
  scenes: Array<{
    sceneId: string;
    script: string;
    duration: number;
  }>;
  quality: 'draft' | 'standard' | 'high';
}) {
  console.log(`Starting video generation pipeline with ${params.scenes.length} scenes...`);

  const sceneResults = [];

  for (const scene of params.scenes) {
    console.log(`Generating scene: ${scene.sceneId}`);

    try {
      const result = await generateSceneWithProgress({
        ...scene,
        quality: params.quality,
        onProgress: (progress, completed, total) => {
          console.log(`  ${scene.sceneId}: ${completed}/${total} frames (${progress}%)`);
        },
      });

      sceneResults.push(result);
      console.log(`✅ Scene ${scene.sceneId} complete`);
    } catch (error) {
      console.error(`❌ Scene ${scene.sceneId} failed:`, error);
      throw error;
    }
  }

  console.log('✅ All scenes generated successfully!');
  return sceneResults;
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example usage in a component or API route
 */
export async function exampleUsage() {
  // Example 1: Generate a single keyframe
  console.log('=== Example 1: Generate Keyframe ===');
  const keyframe = await generateKeyframeWithPolling({
    sceneId: 'scene_001',
    prompt: 'A dramatic mountain vista at sunset',
    quality: 'standard',
  });
  console.log('Keyframe result:', keyframe);

  // Example 2: Generate a short scene
  console.log('\n=== Example 2: Generate Scene ===');
  const scene = await generateSceneWithProgress({
    sceneId: 'scene_001',
    script: 'A drone shot flying over a forest canopy',
    duration: 5,
    quality: 'draft',
    onProgress: (progress, completed, total) => {
      console.log(`Scene progress: ${progress}%`);
    },
  });
  console.log('Scene result:', scene);

  // Example 3: Batch keyframes
  console.log('\n=== Example 3: Batch Keyframes ===');
  const keyframes = await generateKeyframesBatch([
    {
      sceneId: 'scene_001',
      prompt: 'Opening shot',
      frameNumber: 0,
    },
    {
      sceneId: 'scene_001',
      prompt: 'Middle shot',
      frameNumber: 150,
    },
    {
      sceneId: 'scene_001',
      prompt: 'Closing shot',
      frameNumber: 300,
    },
  ]);
  console.log('Batch keyframes result:', keyframes);

  // Example 4: Complete pipeline
  console.log('\n=== Example 4: Video Pipeline ===');
  const video = await generateVideoPipeline({
    scenes: [
      {
        sceneId: 'scene_001',
        script: 'Opening scene with title card',
        duration: 3,
      },
      {
        sceneId: 'scene_002',
        script: 'Main content',
        duration: 10,
      },
      {
        sceneId: 'scene_003',
        script: 'Closing scene',
        duration: 3,
      },
    ],
    quality: 'draft',
  });
  console.log('Video pipeline result:', video);
}
