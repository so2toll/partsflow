/**
 * Generate Worker Tests
 *
 * Demonstrates the updated generate worker with GPU service integration.
 *
 * This test file shows how the worker now:
 * 1. Calls GPU service to generate keyframes from script
 * 2. Renders each scene sequentially
 * 3. Provides detailed progress updates
 * 4. Updates project status throughout the process
 *
 * @module lib/workers/__tests__/generateWorker.test
 */

import { generateVideo } from '../generateWorker';
import { projectRepository } from '../../db/repositories';
import { gpuClient } from '../../gpu/gpuClient';

// Mock repositories
jest.mock('../../db/repositories');
jest.mock('../../gpu/gpuClient');

describe('Generate Worker - GPU Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProject = {
    id: 'proj_test123',
    name: 'Test Project',
    userId: 'user_test123',
    organizationId: 'org_test123',
    videoStatus: 'draft',
    script: 'Test script content',
  };

  const mockScript = `
    [Scene 1]
    Opening shot of a sunrise over mountains. The camera pans slowly across the landscape.

    [Scene 2]
    A person walks through a forest, sunlight streaming through the trees.

    [Scene 3]
    Close-up of a flower blooming, time-lapse effect.

    [Scene 4]
    Sunset over the ocean with waves crashing on the shore.

    [Scene 5]
    Night sky filled with stars, camera zooms out to reveal the Milky Way.
  `;

  test('should generate video with GPU service integration', async () => {
    // Setup mocks
    (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.updateVideoStatus as jest.Mock).mockResolvedValue(undefined);
    (projectRepository.setOutputVideo as jest.Mock).mockResolvedValue(undefined);

    const mockKeyframes = {
      success: true,
      keyframes: [
        {
          sceneId: 'scene_1',
          sceneNumber: 1,
          description: 'Opening shot...',
          imageUrl: 'https://example.com/keyframes/scene1.jpg',
          estimatedFrames: 30,
        },
        {
          sceneId: 'scene_2',
          sceneNumber: 2,
          description: 'Person walking...',
          imageUrl: 'https://example.com/keyframes/scene2.jpg',
          estimatedFrames: 25,
        },
      ],
      processingTime: 700,
      totalScenes: 2,
    };

    (gpuClient.generateKeyframes as jest.Mock).mockResolvedValue(mockKeyframes);
    (gpuClient.renderScene as jest.Mock)
      .mockResolvedValueOnce({
        success: true,
        frameUrl: 'https://example.com/frames/scene1.jpg',
        renderTime: 400,
        sceneId: 'scene_1',
        quality: '1080p',
      })
      .mockResolvedValueOnce({
        success: true,
        frameUrl: 'https://example.com/frames/scene2.jpg',
        renderTime: 350,
        sceneId: 'scene_2',
        quality: '1080p',
      });

    // Track progress updates
    const progressUpdates: any[] = [];
    const onProgress = (stage: string, progress: number, details?: string) => {
      progressUpdates.push({ stage, progress, details });
    };

    // Execute generation
    await generateVideo(mockProject.id, mockScript, {
      renderQuality: '1080p',
      mode: 'create',
      qualityTier: 'high',
      onProgress,
    });

    // Verify GPU service was called
    expect(gpuClient.generateKeyframes).toHaveBeenCalledWith(
      mockScript,
      5, // 5 scenes detected from [Scene N] markers
      'high'
    );

    expect(gpuClient.renderScene).toHaveBeenCalledTimes(2);
    expect(gpuClient.renderScene).toHaveBeenCalledWith(
      'scene_1',
      mockKeyframes.keyframes[0],
      '1080p'
    );
    expect(gpuClient.renderScene).toHaveBeenCalledWith(
      'scene_2',
      mockKeyframes.keyframes[1],
      '1080p'
    );

    // Verify progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0]).toMatchObject({
      stage: 'initializing',
      progress: 0,
    });

    // Verify keyframes stage
    const keyframesUpdate = progressUpdates.find((u) => u.stage === 'keyframes');
    expect(keyframesUpdate).toBeDefined();
    expect(keyframesUpdate?.details).toContain('2 keyframes');

    // Verify rendering stage
    const renderingUpdate = progressUpdates.find((u) => u.stage === 'rendering');
    expect(renderingUpdate).toBeDefined();
    expect(renderingUpdate?.details).toContain('scene 1 of 2');

    // Verify completed stage
    const completedUpdate = progressUpdates.find((u) => u.stage === 'completed');
    expect(completedUpdate).toMatchObject({
      progress: 100,
    });

    // Verify project status updates
    expect(projectRepository.updateVideoStatus).toHaveBeenCalledWith(
      mockProject.id,
      'generating'
    );
    expect(projectRepository.updateVideoStatus).toHaveBeenCalledWith(
      mockProject.id,
      'generating',
      { totalScenes: 2 }
    );
    expect(projectRepository.updateVideoStatus).toHaveBeenCalledWith(
      mockProject.id,
      'generating',
      { completedScenes: 1 }
    );
    expect(projectRepository.updateVideoStatus).toHaveBeenCalledWith(
      mockProject.id,
      'generating',
      { completedScenes: 2 }
    );

    // Verify output was set
    expect(projectRepository.setOutputVideo).toHaveBeenCalledWith(
      mockProject.id,
      expect.objectContaining({
        outputVideoUrl: expect.stringContaining(mockProject.id),
        thumbnailUrl: expect.stringContaining('scene1'),
        estimatedDuration: expect.any(Number),
        usedMinutes: expect.any(Number),
      })
    );
  });

  test('should handle render failures gracefully', async () => {
    // Setup mocks
    (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.updateVideoStatus as jest.Mock).mockResolvedValue(undefined);

    const mockKeyframes = {
      success: true,
      keyframes: [
        {
          sceneId: 'scene_1',
          sceneNumber: 1,
          description: 'Scene 1',
          imageUrl: 'https://example.com/keyframes/scene1.jpg',
          estimatedFrames: 30,
        },
      ],
      processingTime: 500,
      totalScenes: 1,
    };

    (gpuClient.generateKeyframes as jest.Mock).mockResolvedValue(mockKeyframes);
    (gpuClient.renderScene as jest.Mock).mockRejectedValue(
      new Error('GPU service unavailable')
    );

    // Execute generation and expect failure
    await expect(
      generateVideo(mockProject.id, mockScript, {
        renderQuality: '1080p',
      })
    ).rejects.toThrow('Failed to render scene 1');

    // Verify failure was recorded
    expect(projectRepository.updateVideoStatus).toHaveBeenCalledWith(
      mockProject.id,
      'failed',
      {
        errorMessage: expect.stringContaining('Failed to render scene 1'),
      }
    );
  });

  test('should estimate scene count from script markers', async () => {
    (projectRepository.findById as jest.Mock).mockResolvedValue(mockProject);
    (projectRepository.updateVideoStatus as jest.Mock).mockResolvedValue(undefined);
    (projectRepository.setOutputVideo as jest.Mock).mockResolvedValue(undefined);

    const scriptWith10Scenes = `
      ${Array.from({ length: 10 }, (_, i) => `[Scene ${i + 1}] Content here`).join('\n\n')}
    `;

    (gpuClient.generateKeyframes as jest.Mock).mockResolvedValue({
      success: true,
      keyframes: [],
      processingTime: 1000,
      totalScenes: 10,
    });

    (gpuClient.renderScene as jest.Mock).mockResolvedValue({
      success: true,
      frameUrl: 'https://example.com/frame.jpg',
      renderTime: 400,
      sceneId: 'scene_1',
      quality: '1080p',
    });

    await generateVideo(mockProject.id, scriptWith10Scenes, {
      renderQuality: '1080p',
    });

    expect(gpuClient.generateKeyframes).toHaveBeenCalledWith(
      scriptWith10Scenes,
      10, // Should detect 10 scenes
      'standard'
    );
  });
});

/**
 * Example: Manual test with real progress tracking
 *
 * To manually test the worker with real GPU endpoints:
 *
 * ```typescript
 * import { generateVideo } from '@/lib/workers/generateWorker';
 *
 * async function testGeneration() {
 *   const projectId = 'test_project_123';
 *   const script = `
 *     [Scene 1]
 *     A beautiful mountain landscape at sunrise.
 *
 *     [Scene 2]
 *     A river flowing through a green valley.
 *
 *     [Scene 3]
 *   `;
 *
 *   try {
 *     await generateVideo(projectId, script, {
 *       renderQuality: '1080p',
 *       mode: 'create',
 *       qualityTier: 'high',
 *       onProgress: (stage, progress, details) => {
 *         console.log(`[${stage}] ${progress}% - ${details || ''}`);
 *       }
 *     });
 *
 *     console.log('Generation complete!');
 *   } catch (error) {
 *     console.error('Generation failed:', error);
 *   }
 * }
 *
 * testGeneration();
 * ```
 */
