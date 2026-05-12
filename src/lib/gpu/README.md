# GPU Service Integration

This directory contains the GPU service client and API endpoints for the Video AI Content Studio.

## Overview

The GPU service provides stub endpoints for video rendering operations in Phase 2, which will be replaced with actual GPU rendering services in Phase 3.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Generate Worker                          │
│  (src/lib/workers/generateWorker.ts)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 1. Generate Keyframes
                     │ 2. Render Scenes
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    GPU Client                                │
│  (src/lib/gpu/gpuClient.ts)                                 │
│                                                              │
│  - Provides TypeScript API for GPU operations               │
│  - Handles error retry logic                                │
│  - Manages batch rendering                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Requests
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  GPU API Endpoints                           │
│  (src/pages/api/gpu/)                                       │
│                                                              │
│  - /api/gpu/status     - GPU service status                 │
│  - /api/gpu/keyframes  - Generate keyframes from script     │
│  - /api/gpu/render     - Render single scene frame          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. GPU Client (`gpuClient.ts`)

TypeScript client library for interacting with GPU services.

**Key Methods:**
- `getStatus()` - Get GPU service availability and load
- `generateKeyframes(script, sceneCount, qualityTier)` - Generate keyframes from script
- `renderScene(sceneId, keyframeData, renderQuality)` - Render single scene
- `renderBatch(keyframes, renderQuality, onProgress)` - Render multiple scenes
- `mapQualityTier(qualityTier)` - Map quality tier to render quality

**Usage Example:**
```typescript
import { gpuClient } from '@/lib/gpu/gpuClient';

// Generate keyframes
const result = await gpuClient.generateKeyframes(
  'Scene 1: Introduction...\nScene 2: Main content...',
  2,
  'high'
);

console.log(`Generated ${result.totalScenes} keyframes`);

// Render scenes
const renders = await gpuClient.renderBatch(
  result.keyframes,
  '1080p',
  (sceneNum, progress) => {
    console.log(`Scene ${sceneNum}: ${progress}%`);
  }
);
```

### 2. GPU API Endpoints

#### GET /api/gpu/status

Returns current GPU service status.

**Response:**
```json
{
  "status": "available",
  "queueDepth": 0,
  "activeJobs": 0,
  "averageRenderTime": 400,
  "gpus": [
    {
      "id": "gpu-001",
      "status": "idle",
      "utilization": 0
    }
  ]
}
```

#### POST /api/gpu/keyframes

Generates keyframes from script content.

**Request:**
```json
{
  "script": "[Scene 1] Introduction...\n[Scene 2] Main content...",
  "sceneCount": 2,
  "qualityTier": "high"
}
```

**Response:**
```json
{
  "success": true,
  "keyframes": [
    {
      "sceneId": "scene_abc123",
      "sceneNumber": 1,
      "description": "Introduction...",
      "imageUrl": "https://example.com/keyframes/scene_abc123.jpg",
      "estimatedFrames": 30
    }
  ],
  "processingTime": 700,
  "totalScenes": 2
}
```

#### POST /api/gpu/render

Renders a single scene frame.

**Request:**
```json
{
  "sceneId": "scene_abc123",
  "keyframeData": {
    "description": "A beautiful sunset..."
  },
  "renderQuality": "1080p"
}
```

**Response:**
```json
{
  "success": true,
  "frameUrl": "https://example.com/frames/scene_abc123_1080p.jpg",
  "renderTime": 400,
  "sceneId": "scene_abc123",
  "quality": "1080p"
}
```

## Generate Worker Integration

The generate worker now uses the GPU client for realistic progress simulation:

### Generation Stages

1. **Initializing (0-20%)**: Setup and validation
2. **Keyframes (20-30%)**: Generate keyframes from script
3. **Rendering (30-90%)**: Render each scene sequentially
4. **Assembling (90-100%)**: Assemble final video

### Progress Updates

The worker provides detailed progress updates:

```typescript
await generateVideo(projectId, script, {
  renderQuality: '1080p',
  qualityTier: 'high',
  onProgress: (stage, progress, details) => {
    console.log(`[${stage}] ${progress}% - ${details}`);
    // Output:
    // [initializing] 0% - Starting video generation...
    // [keyframes] 20% - Analyzing script and generating keyframes...
    // [keyframes] 20% - Generated 5 keyframes
    // [rendering] 30% - Rendering scene 1 of 5...
    // [rendering] 42% - Rendering scene 2 of 5...
    // ...
    // [assembling] 90% - Assembling final video...
    // [completed] 100% - Video generation complete!
  }
});
```

## Quality Tiers

| Tier      | Render Quality | Render Time | Use Case                     |
|-----------|----------------|-------------|------------------------------|
| standard  | 720p           | 200ms       | Quick previews, drafts       |
| high      | 1080p          | 400ms       | Standard quality output      |
| premium   | 4k             | 800ms       | High-quality final output    |

## Phase 2 Limitations

- GPU endpoints are stubs with simulated delays
- No actual GPU rendering is performed
- Render outputs are mock URLs
- All rendering is sequential (no parallel processing)

## Phase 3 Enhancements

In Phase 3, the following will be implemented:

1. **Real GPU Integration**: Connect to actual GPU rendering service
2. **Parallel Rendering**: Render multiple scenes simultaneously
3. **GPU Queue Management**: Intelligent load balancing across GPUs
4. **Retry Logic**: Automatic retry for failed renders
5. **Real Output**: Actual video files and thumbnails
6. **WebSocket Updates**: Real-time progress streaming
7. **Cancellation Support**: Cancel in-progress generations

## Testing

See `/src/lib/workers/__tests__/generateWorker.test.ts` for comprehensive tests.

To manually test the GPU integration:

```typescript
import { gpuClient } from '@/lib/gpu/gpuClient';

// Test GPU status
const status = await gpuClient.getStatus();
console.log('GPU Status:', status);

// Test keyframe generation
const keyframes = await gpuClient.generateKeyframes(
  '[Scene 1] Test scene...\n[Scene 2] Another scene...',
  2,
  'high'
);
console.log('Keyframes:', keyframes);

// Test scene rendering
const render = await gpuClient.renderScene(
  keyframes.keyframes[0].sceneId,
  keyframes.keyframes[0],
  '1080p'
);
console.log('Render result:', render);
```

## Error Handling

All GPU client methods throw errors on failure:

```typescript
try {
  await gpuClient.renderScene(sceneId, keyframeData, '1080p');
} catch (error) {
  console.error('Render failed:', error.message);
  // Handle error: retry, log, update project status, etc.
}
```

## Logging

The GPU client logs all operations for debugging:

```
[GPUClient] Rendered scene 1/5 in 400ms
[GPUClient] Rendered scene 2/5 in 350ms
...
```

The generate worker provides detailed logging:

```
[GenerateWorker] Starting video generation for project proj_123
[GenerateWorker] Estimated 5 scenes from script
[GenerateWorker] Generated 5 keyframes in 700ms
[GenerateWorker] Rendering scene 1/5...
[GenerateWorker] Scene 1 rendered in 400ms
...
```
