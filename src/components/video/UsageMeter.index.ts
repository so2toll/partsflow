/**
 * UsageMeter Component Exports
 *
 * Centralized exports for the UsageMeter component and related utilities
 */

// Main component
export { default as UsageMeter } from './UsageMeter';
export type { PlanType } from './UsageMeter';
export { validateUsageMeterProps } from './UsageMeter';

// Examples (for development and documentation)
export {
  UsageMeterExampleFree,
  UsageMeterExampleCreator,
  UsageMeterExamplePro,
  UsageMeterExampleEnterprise,
  UsageMeterExampleCompact,
  UsageMeterExampleCustom,
  UsageMeterExampleDynamic,
  UsageMeterExampleComparison,
  UsageMeterExampleWithValidation,
  UsageMeterDashboard,
} from './UsageMeter.example';

// Re-export default example object
export { default as UsageMeterExamples } from './UsageMeter.example';

/**
 * Quick import for the main component:
 *
 * ```tsx
 * import { UsageMeter } from '@/components/video/UsageMeter.index';
 * ```
 *
 * Or import with types:
 *
 * ```tsx
 * import UsageMeter, { PlanType, validateUsageMeterProps } from '@/components/video/UsageMeter.index';
 * ```
 */
