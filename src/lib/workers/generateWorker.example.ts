/**
 * Video Generation Worker - Usage Example
 *
 * This file demonstrates how to use the generateVideo worker.
 *
 * @module lib/workers/generateWorker.example
 * @version 0.1.0
 */

import { generateVideo, type GenerateVideoOptions } from './generateWorker';

/**
 * Example 1: Basic usage with default options
 */
async function basicExample() {
  const projectId = 'proj_abc123';
  const script = 'Create a 30-second promotional video for a tech startup';

  await generateVideo(projectId, script);
  console.log('Video generation complete!');
}

/**
 * Example 2: With custom options
 */
async functionWithOptionsExample() {
  const projectId = 'proj_def456';
  const script = 'Create a product demo video highlighting key features';

  const options: GenerateVideoOptions = {
    renderQuality: '1080p',
    mode: 'create',
    maxDuration: 60,
  };

  await generateVideo(projectId, script, options);
  console.log('Video generation complete!');
}

/**
 * Example 3: With progress tracking
 */
async function withProgressExample() {
  const projectId = 'proj_ghi789';
  const script = 'Create an educational video about machine learning';

  const options: GenerateVideoOptions = {
    renderQuality: '4k',
    mode: 'create',
    qualityTier: 'premium',
    onProgress: (stage, progress, details) => {
      console.log(`[${stage}] ${progress}% - ${details || ''}`);
    },
  };

  await generateVideo(projectId, script, options);
  console.log('Video generation complete!');
}

/**
 * Example 4: Error handling
 */
async function withErrorHandlingExample() {
  const projectId = 'proj_jkl012';
  const script = 'Create a video about';

  try {
    await generateVideo(projectId, script, {
      renderQuality: '720p',
      mode: 'edit',
      qualityTier: 'standard',
      onProgress: (stage, progress, details) => {
        console.log(`[${stage}] ${progress}% - ${details || ''}`);
      },
    });
    console.log('Video generation complete!');
  } catch (error) {
    console.error('Video generation failed:', error);
    // Project status will be set to 'failed' with error message
  }
}

/**
 * Example 5: Integration with API endpoint
 *
 * This shows how the worker would be called from an API endpoint
 */
async function apiEndpointExample() {
  // Simulate API request
  const request = {
    body: {
      projectId: 'proj_mno345',
      script: 'Create a marketing video for a new product launch',
      options: {
        renderQuality: '1080p' as const,
        mode: 'create' as const,
        qualityTier: 'high' as const,
      },
    },
  };

  try {
    // Start generation (this returns immediately, generation runs in background)
    // In Phase 3, this would be a true background job/queue
    generateVideo(
      request.body.projectId,
      request.body.script,
      request.body.options
    ).catch((error) => {
      console.error('[API] Background generation failed:', error);
    });

    // Return response to client immediately
    return {
      success: true,
      message: 'Video generation started',
      projectId: request.body.projectId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export examples for documentation
export {
  basicExample,
  withOptionsExample,
  withProgressExample,
  withErrorHandlingExample,
  apiEndpointExample,
};

// Uncomment to run examples locally (for testing)
// basicExample();
// withOptionsExample();
// withProgressExample();
// withErrorHandlingExample();
