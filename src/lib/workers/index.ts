/**
 * Workers Index
 *
 * Exports all worker functions for easy importing.
 *
 * @module lib/workers
 * @version 0.1.0
 */

export {
  generateVideo,
  validateScript,
  estimateDuration,
  type GenerateVideoOptions,
} from './generateWorker';
