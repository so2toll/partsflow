# GPU Worker Mock Endpoints

Mock GPU worker endpoints for simulating Phase 3 Director Agent flows in the Video AI Content Studio. These endpoints simulate realistic GPU inference responses with proper delay simulation and progress tracking.

## Overview

These endpoints provide a realistic simulation of GPU-based video generation operations without requiring actual GPU infrastructure. They are designed to demonstrate the full video generation flow from script to final output.

**Important**: These are mock endpoints intended for development and testing. In production, they would be replaced by actual GPU worker services.

## Endpoints

### 1. Generate Keyframe

**Endpoint**: `POST /api/internal/gpu/generate-keyframe`

**Purpose**: Simulates GPU-based keyframe image generation for video scenes.

**Request Body**:
```typescript
{
  sceneId: string;          // Required: Scene identifier
  prompt: string;           // Required: Visual prompt for keyframe
  style?: string;           // Optional: Visual style (default: 'realistic')
  quality?: 'draft' | 'standard' | 'high';  // Optional: Quality tier (default: 'standard')
  frameNumber?: number;     // Optional: Frame number (default: 0)
}
```

**Response**:
```typescript
{
  success: true;
  jobId: string;            // Job ID for status tracking
  keyframeId: string;       // Keyframe identifier
  estimatedTimeSeconds: number;  // Estimated processing time
  message: string;          // Status message
}
```

**Processing Times**:
- Draft: ~2 seconds
- Standard: ~3.5 seconds
- High: ~5 seconds

**Example Usage**:
```bash
curl -X POST http://localhost:4321/api/internal/gpu/generate-keyframe \
  -H "Content-Type: application/json" \
  -d '{
    "sceneId": "scene_123",
    "prompt": "A beautiful sunset over mountains",
    "style": "cinematic",
    "quality": "standard",
    "frameNumber": 0
  }'
```

---

### 2. Generate Scene

**Endpoint**: `POST /api/internal/gpu/generate-scene`

**Purpose**: Simulates GPU-based full scene video generation.

**Request Body**:
```typescript
{
  sceneId: string;          // Required: Scene identifier
  script: string;           // Required: Scene script/description
  duration: number;         // Required: Duration in seconds (1-60)
  quality?: 'draft' | 'standard' | 'high';  // Optional: Quality tier (default: 'standard')
  fps?: number;             // Optional: Frames per second (default: 30)
  resolution?: {            // Optional: Video resolution
    width: number;
    height: number;
  };
  includeAudio?: boolean;   // Optional: Include audio (default: true)
}
```

**Response**:
```typescript
{
  success: true;
  jobId: string;            // Job ID for status tracking
  sceneId: string;          // Scene identifier
  estimatedTimeSeconds: number;  // Estimated processing time
  totalFrames: number;      // Total frames to generate
  message: string;          // Status message
}
```

**Processing Times** (varies by duration and quality):
- Draft: ~50ms per frame
- Standard: ~100ms per frame
- High: ~200ms per frame

**Example Usage**:
```bash
curl -X POST http://localhost:4321/api/internal/gpu/generate-scene \
  -H "Content-Type: application/json" \
  -d '{
    "sceneId": "scene_123",
    "script": "A peaceful meadow with flowers swaying in the breeze",
    "duration": 5,
    "quality": "standard",
    "fps": 30
  }'
```

---

### 3. Get Job Status

**Endpoint**: `GET /api/internal/gpu/status/[jobId]`

**Purpose**: Retrieves the current status and progress of a GPU worker job.

**Response**:
```typescript
{
  jobId: string;
  jobType: 'keyframe' | 'scene';
  state: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;         // 0-100
  startedAt: string;        // ISO 8601 timestamp
  completedAt?: string;     // ISO 8601 timestamp (when completed)
  estimatedCompletion?: string;  // ISO 8601 timestamp (when processing)

  // Keyframe-specific fields
  keyframeId?: string;
  keyframeUrl?: string;     // Available when completed

  // Scene-specific fields
  sceneId?: string;
  sceneUrl?: string;        // Available when completed
  totalFrames?: number;
  completedFrames?: number;

  // Error handling
  error?: string;
  errorMessage?: string;
  retryable?: boolean;
}
```

**Example Usage**:
```bash
curl http://localhost:4321/api/internal/gpu/status/gpu_keyframe_123ABC
```

**Job States**:
- `queued`: Job is waiting in the queue
- `processing`: Job is actively being processed
- `completed`: Job completed successfully
- `failed`: Job failed (check error fields)

---

## Integration Examples

### Example 1: Complete Keyframe Generation Flow

```typescript
// 1. Start keyframe generation
const response = await fetch('/api/internal/gpu/generate-keyframe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sceneId: 'scene_abc',
    prompt: 'Dramatic mountain vista at sunset',
    quality: 'high'
  })
});

const { jobId, estimatedTimeSeconds } = await response.json();

// 2. Poll for completion
const pollInterval = setInterval(async () => {
  const statusResponse = await fetch(`/api/internal/gpu/status/${jobId}`);
  const status = await statusResponse.json();

  console.log(`Progress: ${status.progress}%`);

  if (status.state === 'completed') {
    clearInterval(pollInterval);
    console.log('Keyframe ready:', status.keyframeUrl);
  } else if (status.state === 'failed') {
    clearInterval(pollInterval);
    console.error('Generation failed:', status.errorMessage);
  }
}, 500);
```

### Example 2: Complete Scene Generation Flow

```typescript
// 1. Start scene generation
const response = await fetch('/api/internal/gpu/generate-scene', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sceneId: 'scene_xyz',
    script: 'A drone shot flying over a forest canopy',
    duration: 10,
    quality: 'standard',
    fps: 30
  })
});

const { jobId, totalFrames } = await response.json();

// 2. Poll for completion with frame-by-frame progress
const pollInterval = setInterval(async () => {
  const statusResponse = await fetch(`/api/internal/gpu/status/${jobId}`);
  const status = await statusResponse.json();

  console.log(`Frames: ${status.completedFrames}/${status.totalFrames} (${status.progress}%)`);

  if (status.state === 'completed') {
    clearInterval(pollInterval);
    console.log('Scene ready:', status.sceneUrl);
  } else if (status.state === 'failed') {
    clearInterval(pollInterval);
    console.error('Generation failed:', status.errorMessage);
  }
}, 1000);
```

---

## Mock Data

### Keyframe URLs
Mock keyframes use placeholder images:
```
https://placehold.co/{width}x{height}/png?text=Keyframe+{frameNumber}&style={style}
```

### Scene URLs
Mock scenes use sample video URLs:
```
https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4
```

---

## Technical Implementation

### Job Storage
- Uses in-memory Map storage (not persistent)
- Jobs expire after 24 hours
- In production, replace with Redis or database

### Progress Simulation
- Uses `setTimeout` to simulate GPU processing delays
- Updates progress at regular intervals
- Supports both keyframe and scene generation

### Authentication
- Accepts both user sessions (via cookies)
- Accepts internal API key (via `x-internal-api-key` header)
- In production, use internal API key only

---

## Production Migration Guide

When migrating to actual GPU workers:

1. **Replace Mock Endpoints**: Replace these mock endpoints with actual GPU worker service calls

2. **Update Authentication**: Use internal API keys or service-to-service authentication

3. **Persistent Job Storage**: Use Redis or database for job storage

4. **Real GPU Processing**: Integrate with actual GPU inference services (e.g., RunPod, AWS Batch)

5. **Error Handling**: Implement proper retry logic and error recovery

6. **Monitoring**: Add proper monitoring and alerting for GPU worker health

---

## File Structure

```
src/pages/api/internal/gpu/
├── types.ts                    # Type definitions
├── job-store.ts                # In-memory job storage
├── generate-keyframe.ts        # Keyframe generation endpoint
├── generate-scene.ts           # Scene generation endpoint
├── status/[jobId].ts           # Job status endpoint
└── README.md                   # This file
```

---

## Development Notes

- These endpoints are designed for development and testing
- Processing times are simulated and may not reflect actual GPU performance
- Mock URLs are placeholders and should be replaced with actual storage URLs
- Job storage is not persistent across server restarts

---

## Testing

### Test Keyframe Generation
```bash
# Start generation
curl -X POST http://localhost:4321/api/internal/gpu/generate-keyframe \
  -H "Content-Type: application/json" \
  -d '{"sceneId":"test","prompt":"test","quality":"draft"}'

# Check status (replace with actual jobId)
curl http://localhost:4321/api/internal/gpu/status/gpu_keyframe_XXXX
```

### Test Scene Generation
```bash
# Start generation
curl -X POST http://localhost:4321/api/internal/gpu/generate-scene \
  -H "Content-Type: application/json" \
  -d '{"sceneId":"test","script":"test scene","duration":3,"quality":"draft"}'

# Check status (replace with actual jobId)
curl http://localhost:4321/api/internal/gpu/status/gpu_scene_XXXX
```

---

## Version History

- **1.0.0** (2026-05-06): Initial release with mock GPU worker endpoints
  - Keyframe generation
  - Scene generation
  - Job status tracking
  - Progress simulation
