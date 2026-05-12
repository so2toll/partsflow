/// <reference types="astro/client" />

interface ImportMetaEnv {
  // ==============================================================================
  // Existing Environment Variables
  // ==============================================================================
  readonly TURSO_DATABASE_URL: string;
  readonly TURSO_AUTH_TOKEN: string;

  // AWS S3
  readonly AWS_REGION?: string;
  readonly AWS_ACCESS_KEY_ID?: string;
  readonly AWS_SECRET_ACCESS_KEY?: string;
  readonly AWS_ENDPOINT_URL?: string;
  readonly S3_FILES_BUCKET?: string;
  readonly S3_LAKE_BUCKET?: string;

  // Better Auth
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;

  // Supabase PostgreSQL (for DuckLake)
  readonly SUPABASE_HOST?: string;
  readonly SUPABASE_USER?: string;
  readonly SUPABASE_PASSWORD?: string;
  readonly SUPABASE_DATABASE?: string;
  readonly SUPABASE_PORT?: string;
  readonly SUPABASE_CONNECTION_STRING?: string;

  // MotherDuck
  readonly MOTHERDUCK_TOKEN?: string;

  // ==============================================================================
  // Video AI Content Studio - Infrastructure
  // ==============================================================================

  // Redis (for BullMQ job queues)
  readonly REDIS_URL: string;

  // Azure Blob Storage (for video uploads, keyframes, clips)
  readonly AZURE_STORAGE_CONNECTION_STRING?: string;
  readonly AZURE_STORAGE_ACCOUNT_NAME?: string;
  readonly AZURE_STORAGE_ACCOUNT_KEY?: string;

  // Stripe (subscription billing)
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;

  // Stripe Product Price IDs
  readonly STRIPE_PRICE_ID_FREE?: string;
  readonly STRIPE_PRICE_ID_PRO?: string;
  readonly STRIPE_PRICE_ID_ENTERPRISE?: string;

  // Director Agent (Python service for AI video generation)
  readonly DIRECTOR_AGENT_URL: string;
  readonly DIRECTOR_AGENT_API_KEY?: string;

  // GPU Worker (Lambda Cloud or similar)
  readonly GPU_WORKER_URL?: string;
  readonly GPU_WORKER_API_KEY?: string;

  // DeepLake (vector database for video embeddings)
  readonly DEEPLAKE_TOKEN?: string;
  readonly DEEPLAKE_ORG_ID?: string;

  // Resend (email notifications)
  readonly RESEND_API_KEY?: string;
  readonly EMAIL_FROM?: string;
  readonly EMAIL_FROM_NAME?: string;

  // App Configuration
  readonly APP_URL: string;
  readonly MAX_VIDEO_UPLOAD_SIZE_MB?: string;
  readonly MAX_VIDEO_DURATION_SECONDS?: string;

  // ==============================================================================
  // Internal APIs & Services
  // ==============================================================================

  readonly DATA3D_INTERNAL_API_KEY?: string;
  readonly EVENT_STORE_URL?: string;
  readonly EVENT_STORE_API_KEY?: string;

  // ==============================================================================
  // AI Services
  // ==============================================================================

  // Anthropic Claude
  readonly ANTHROPIC_API_KEY?: string;

  // Google Gemini
  readonly GOOGLE_GENAI_API_KEY?: string;

  // OpenAI
  readonly OPENAI_API_KEY?: string;

  // Deepgram
  readonly DEEPGRAM_API_KEY?: string;

  // ==============================================================================
  // Monitoring & Observability
  // ==============================================================================

  readonly SENTRY_DSN?: string;
  readonly DATADOG_API_KEY?: string;

  // ==============================================================================
  // Feature Flags
  // ==============================================================================

  readonly ENABLE_EVENT_PROCESSOR?: string;
  readonly ENABLE_MATERIALIZED_VIEWS?: string;
  readonly ENABLE_TIME_TRAVEL_QUERIES?: string;

  // ==============================================================================
  // Development
  // ==============================================================================

  readonly NODE_ENV: string;
  readonly LOG_LEVEL?: string;
  readonly GRAPH_DB_DEBUG?: string;

  // ==============================================================================
  // DocuSeal Configuration (Optional)
  // ==============================================================================

  readonly DOCUSEAL_API_KEY?: string;
  readonly DOCUSEAL_API_URL?: string;
  readonly DOCUSEAL_EMBED_URL?: string;
  readonly DOCUSEAL_TEMPLATE_ID?: string;
  readonly PUBLIC_DOCUSEAL_TEMPLATE_ID?: string;

  // ==============================================================================
  // OpenReplay Configuration (Optional)
  // ==============================================================================

  readonly OPENREPLAY_PROJECT_KEY?: string;
  readonly OPENREPLAY_INGEST_POINT?: string;
  readonly OPENREPLAY_API_KEY?: string;

  // ==============================================================================
  // Session Configuration
  // ==============================================================================

  readonly SESSION_TIMEOUT_MINUTES?: string;

  // ==============================================================================
  // Legacy Feature Flags
  // ==============================================================================

  readonly ENABLE_CONSENT_MODAL?: string;
  readonly ENABLE_MOBILE_SIGNING?: string;
  readonly ENABLE_AUDIT_LOGGING?: string;

  // ==============================================================================
  // Remote Browser Settings (Playwright)
  // ==============================================================================

  readonly PLAYWRIGHT_MODE?: string;
  readonly BROWSER_HEADLESS?: string;
  readonly BROWSER_TIMEOUT?: string;
  readonly SCREENSHOT_QUALITY?: string;

  // Browserbase
  readonly BROWSERBASE_API_KEY?: string;
  readonly BROWSERBASE_PROJECT_ID?: string;

  // Browserless.io
  readonly BROWSERLESS_TOKEN?: string;
  readonly BROWSERLESS_WS_URL?: string;

  // ==============================================================================
  // Email Configuration
  // ==============================================================================

  readonly SENDGRID_API_KEY?: string;
  readonly SENDGRID_FROM_EMAIL?: string;

  readonly AWS_SES_REGION?: string;
  readonly AWS_SES_ACCESS_KEY_ID?: string;
  readonly AWS_SES_SECRET_ACCESS_KEY?: string;
  readonly AWS_SES_FROM_EMAIL?: string;

  // Twilio
  readonly TWILIO_ACCOUNT_SID?: string;
  readonly TWILIO_AUTH_TOKEN?: string;
  readonly TWILIO_PHONE_NUMBER?: string;

  // LiveKit
  readonly LIVEKIT_API_KEY?: string;
  readonly LIVEKIT_API_SECRET?: string;
  readonly LIVEKIT_URL?: string;
  readonly PUBLIC_LIVEKIT_URL?: string;

  // ==============================================================================
  // Interview Agent Configuration
  // ==============================================================================

  readonly INTERVIEW_MAX_DURATION_MS?: string;
  readonly INTERVIEW_MAX_QUESTIONS?: string;
  readonly INTERVIEW_MIN_QUESTIONS?: string;

  // ==============================================================================
  // Alignment Loop Configuration
  // ==============================================================================

  readonly ALIGNMENT_BATCH_THRESHOLD?: string;
  readonly ALIGNMENT_MIN_DISAGREEMENT_RATE?: string;
  readonly ALIGNMENT_EXPORT_BUCKET?: string;

  // ==============================================================================
  // Event Processor Configuration
  // ==============================================================================

  readonly EVENT_PROCESSOR_POLL_INTERVAL?: string;
  readonly EVENT_PROCESSOR_BATCH_SIZE?: string;
  readonly EVENT_PROCESSOR_MAX_RETRIES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
