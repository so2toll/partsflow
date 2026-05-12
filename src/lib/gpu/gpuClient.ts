/**
 * GPU Service Client
 *
 * Internal client for interacting with the GPU rendering service.
 * This is a Phase 2 stub that will use real GPU service endpoints in Phase 3.
 *
 * Phase 2 Behavior:
 * - Calls internal stub GPU API endpoints
 * - Simulates realistic GPU rendering times
 * - Returns mock render results
 *
 * Phase 3 Behavior:
 * - Integrates with actual GPU rendering service
 * - Handles authentication and rate limiting
 * - Implements retry logic for failed renders
 *
 * @module lib/gpu/gpuClient
 * @version 0.1.0
 */

/**
 * GPU render quality options
 */
export type GPUQuality = '720p' | '1080p' | '4k';

/**
 * GPU quality tier mapping
 */
export type GPUQualityTier = 'standard' | 'high' | 'premium';

/**
 * Keyframe data structure
 */
export interface KeyframeData {
  sceneId: string;
  sceneNumber: number;
  description: string;
  imageUrl: string;
  estimatedFrames: number;
}

/**
 * Render result structure
 */
export interface RenderResult {
  success: boolean;
  frameUrl: string;
  renderTime: number;
  sceneId: string;
  quality: GPUQuality;
}

/**
 * Keyframe generation result structure
 */
export interface KeyframesResult {
  success: boolean;
  keyframes: KeyframeData[];
  processingTime: number;
  totalScenes: number;
}

/**
 * GPU service status structure
 */
export interface GPUStatus {
  status: 'available' | 'busy' | 'unavailable';
  queueDepth: number;
  activeJobs: number;
  averageRenderTime: number;
  gpus: Array<{
    id: string;
    status: 'idle' | 'active';
    utilization: number;
  }>;
}

/**
 * GPU Service Client
 *
 * Provides methods to interact with the GPU rendering service.
 *
 * @class GPUClient
 */
export class GPUClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/gpu') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get GPU service status
   *
   * @returns {Promise<GPUStatus>} Current GPU service status
   * @throws {Error} If status request fails
   *
   * @example
   * ```typescript
   * const client = new GPUClient();
   * const status = await client.getStatus();
   * console.log(`GPU status: ${status.status}`);
   * ```
   */
  async getStatus(): Promise<GPUStatus> {
    const response = await fetch(`${this.baseUrl}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to get GPU status');
    }

    return response.json();
  }

  /**
   * Generate keyframes from script
   *
   * @param {string} script - Script content
   * @param {number} sceneCount - Expected number of scenes
   * @param {GPUQualityTier} qualityTier - Quality tier for keyframes
   * @returns {Promise<KeyframesResult>} Generated keyframe data
   * @throws {Error} If keyframe generation fails
   *
   * @example
   * ```typescript
   * const client = new GPUClient();
   * const result = await client.generateKeyframes(
   *   'Scene 1: Introduction...\nScene 2: Main content...',
   *   2,
   *   'high'
   * );
   * console.log(`Generated ${result.totalScenes} keyframes`);
   * ```
   */
  async generateKeyframes(
    script: string,
    sceneCount: number,
    qualityTier: GPUQualityTier = 'standard'
  ): Promise<KeyframesResult> {
    const response = await fetch(`${this.baseUrl}/keyframes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script,
        sceneCount,
        qualityTier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to generate keyframes');
    }

    return response.json();
  }

  /**
   * Render a single scene frame
   *
   * @param {string} sceneId - Scene identifier
   * @param {any} keyframeData - Keyframe data for the scene
   * @param {GPUQuality} renderQuality - Render quality
   * @returns {Promise<RenderResult>} Render result with frame URL
   * @throws {Error} If render fails
   *
   * @example
   * ```typescript
   * const client = new GPUClient();
   * const result = await client.renderScene(
   *   'scene_abc123',
   *   { description: 'A beautiful sunset...' },
   *   '1080p'
   * );
   * console.log(`Rendered frame: ${result.frameUrl}`);
   * ```
   */
  async renderScene(
    sceneId: string,
    keyframeData: any,
    renderQuality: GPUQuality = '1080p'
  ): Promise<RenderResult> {
    const response = await fetch(`${this.baseUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneId,
        keyframeData,
        renderQuality,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to render scene');
    }

    return response.json();
  }

  /**
   * Render multiple scenes in batch
   *
   * Phase 2: Renders scenes sequentially with progress tracking
   * Phase 3: Will use parallel rendering with GPU queue management
   *
   * @param {KeyframeData[]} keyframes - Array of keyframe data
   * @param {GPUQuality} renderQuality - Render quality
   * @param {(sceneNumber: number, progress: number) => void} onProgress - Progress callback
   * @returns {Promise<RenderResult[]>} Array of render results
   * @throws {Error} If any render fails
   *
   * @example
   * ```typescript
   * const client = new GPUClient();
   * const results = await client.renderBatch(
   *   keyframes,
   *   '1080p',
   *   (sceneNum, progress) => {
   *     console.log(`Scene ${sceneNum}: ${progress}%`);
   *   }
   * );
   * ```
   */
  async renderBatch(
    keyframes: KeyframeData[],
    renderQuality: GPUQuality = '1080p',
    onProgress?: (sceneNumber: number, progress: number) => void
  ): Promise<RenderResult[]> {
    const results: RenderResult[] = [];

    for (let i = 0; i < keyframes.length; i++) {
      const keyframe = keyframes[i];
      const sceneNumber = keyframe.sceneNumber;

      // Update progress for scene start
      onProgress?.(sceneNumber, 0);

      try {
        const result = await this.renderScene(
          keyframe.sceneId,
          keyframe,
          renderQuality
        );

        results.push(result);

        // Update progress for scene complete
        onProgress?.(sceneNumber, 100);

        console.log(
          `[GPUClient] Rendered scene ${sceneNumber}/${keyframes.length} ` +
          `in ${result.renderTime}ms`
        );
      } catch (error) {
        console.error(
          `[GPUClient] Failed to render scene ${sceneNumber}:`,
          error
        );
        throw error;
      }
    }

    return results;
  }

  /**
   * Map quality tier to render quality
   *
   * @param {GPUQualityTier} qualityTier - Quality tier
   * @returns {GPUQuality} Render quality
   *
   * @example
   * ```typescript
   * const client = new GPUClient();
   * const quality = client.mapQualityTier('premium'); // '4k'
   * ```
   */
  mapQualityTier(qualityTier: GPUQualityTier): GPUQuality {
    const qualityMap: Record<GPUQualityTier, GPUQuality> = {
      standard: '720p',
      high: '1080p',
      premium: '4k',
    };

    return qualityMap[qualityTier] || '1080p';
  }
}

// Export singleton instance
export const gpuClient = new GPUClient();
