/**
 * Environment Variable Validation Helper
 *
 * Validates required environment variables at startup.
 * Warns about missing Video AI variables (don't fail, may not be set up yet).
 *
 * @module lib/env
 */

export function validateEnv(): void {
  // Core required variables (app won't work without these)
  const required: string[] = [
    'TURSO_DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
  ];

  // Required for Video AI features
  const requiredForVideoAI: string[] = [
    'REDIS_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
  ];

  // Check required core variables
  const missing = required.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map((key) => `  - ${key}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }

  // Warn for Video AI vars (don't fail, may not be set up yet)
  const missingVideoAI = requiredForVideoAI.filter((key) => !import.meta.env[key]);
  if (missingVideoAI.length > 0) {
    console.warn(
      `⚠️  [Video AI] Missing optional environment variables (some features will be disabled):\n${missingVideoAI
        .map((key) => `  - ${key}`)
        .join('\n')}\n\nTo enable Video AI features, add these to your .env.local file.`
    );
  }

  // Log successful validation
  if (missing.length === 0 && missingVideoAI.length === 0) {
    console.log('✅ Environment variables validated successfully');
  } else if (missingVideoAI.length > 0) {
    console.log('✅ Core environment variables validated (Video AI features partially configured)');
  }
}

/**
 * Check if a specific Video AI feature is available based on environment variables
 */
export function isFeatureAvailable(feature: 'stripe' | 'azure' | 'redis' | 'gpu' | 'deeplake'): boolean {
  switch (feature) {
    case 'stripe':
      return !!(import.meta.env.STRIPE_SECRET_KEY && import.meta.env.STRIPE_PUBLISHABLE_KEY);
    case 'azure':
      return !!(import.meta.env.AZURE_STORAGE_CONNECTION_STRING || (import.meta.env.AZURE_STORAGE_ACCOUNT_NAME && import.meta.env.AZURE_STORAGE_ACCOUNT_KEY));
    case 'redis':
      return !!import.meta.env.REDIS_URL;
    case 'gpu':
      return !!(import.meta.env.GPU_WORKER_URL && import.meta.env.GPU_WORKER_API_KEY);
    case 'deeplake':
      return !!(import.meta.env.DEEPLAKE_TOKEN || import.meta.env.DEEPLAKE_ORG_ID);
    default:
      return false;
  }
}

/**
 * Get feature availability status for all Video AI features
 */
export function getFeatureStatus(): Record<string, boolean> {
  return {
    stripe: isFeatureAvailable('stripe'),
    azure: isFeatureAvailable('azure'),
    redis: isFeatureAvailable('redis'),
    gpu: isFeatureAvailable('gpu'),
    deeplake: isFeatureAvailable('deeplake'),
  };
}
