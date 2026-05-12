# GPU Worker API - Quick Reference

Quick reference for GPU worker mock endpoints.

## Base URL
```
http://localhost:4321/api/internal/gpu
```

## Endpoints

### 1. Generate Keyframe
```
POST /generate-keyframe
```

**Request:**
```typescript
{
  sceneId: string;           // Required
  prompt: string;            // Required
  style?: string;            // Default: 'realistic'
  quality?: 'draft' | 'standard' | 'high';  // Default: 'standard'
  frameNumber?: number;      // Default: 0
}
```

**Response:**
```typescript
{
  success: true;
  jobId: string;
  keyframeId: string;
  estimatedTimeSeconds: number;
  message: string;
}
```

**Processing Time:**
- Draft: 2s
- Standard: 3.5s
- High: 5s

---

### 2. Generate Scene
```
POST /generate-scene
```

**Request:**
```typescript
{
  sceneId: string;           // Required
  script: string;            // Required
  duration: number;          // Required (1-60 seconds)
  quality?: 'draft' | 'standard' | 'high';  // Default: 'standard'
  fps?: number;              // Default: 30
  resolution?: { width: number; height: number; };
  includeAudio?: boolean;    // Default: true
}
```

**Response:**
```typescript
{
  success: true;
  jobId: string;
  sceneId: string;
  estimatedTimeSeconds: number;
  totalFrames: number;
  message: string;
}
```

**Processing Time:**
- Draft: 50ms per frame
- Standard: 100ms per frame
- High: 200ms per frame

---

### 3. Get Job Status
```
GET /status/{jobId}
```

**Response:**
```typescript
{
  jobId: string;
  jobType: 'keyframe' | 'scene';
  state: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;          // 0-100
  startedAt: string;         // ISO 8601
  completedAt?: string;      // ISO 8601
  estimatedCompletion?: string;  // ISO 8601

  // Keyframe-specific
  keyframeId?: string;
  keyframeUrl?: string;

  // Scene-specific
  sceneId?: string;
  sceneUrl?: string;
  totalFrames?: number;
  completedFrames?: number;

  // Error handling
  error?: string;
  errorMessage?: string;
  retryable?: boolean;
}
```

---

## Quick Examples

### Generate Keyframe
```bash
curl -X POST http://localhost:4321/api/internal/gpu/generate-keyframe \
  -H "Content-Type: application/json" \
  -d '{
    "sceneId": "scene_001",
    "prompt": "A beautiful sunset",
    "quality": "draft"
  }'
```

### Generate Scene
```bash
curl -X POST http://localhost:4321/api/internal/gpu/generate-scene \
  -H "Content-Type: application/json" \
  -d '{
    "sceneId": "scene_001",
    "script": "A drone shot",
    "duration": 5,
    "quality": "draft"
  }'
```

### Check Status
```bash
curl http://localhost:4321/api/internal/gpu/status/gpu_keyframe_XXX
```

---

## JavaScript/TypeScript Usage

### Generate Keyframe with Polling
```typescript
async function generateKeyframe(sceneId: string, prompt: string) {
  // Start generation
  const response = await fetch('/api/internal/gpu/generate-keyframe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneId, prompt, quality: 'draft' })
  });

  const { jobId } = await response.json();

  // Poll for completion
  while (true) {
    const status = await fetch(`/api/internal/gpu/status/${jobId}`).then(r => r.json());

    console.log(`Progress: ${status.progress}%`);

    if (status.state === 'completed') {
      return status.keyframeUrl;
    }

    if (status.state === 'failed') {
      throw new Error(status.errorMessage);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

### Generate Scene with Progress
```typescript
async function generateScene(sceneId: string, script: string, duration: number) {
  // Start generation
  const response = await fetch('/api/internal/gpu/generate-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneId, script, duration, quality: 'draft' })
  });

  const { jobId, totalFrames } = await response.json();

  // Poll for completion
  while (true) {
    const status = await fetch(`/api/internal/gpu/status/${jobId}`).then(r => r.json());

    console.log(`Frames: ${status.completedFrames}/${status.totalFrames}`);

    if (status.state === 'completed') {
      return status.sceneUrl;
    }

    if (status.state === 'failed') {
      throw new Error(status.errorMessage);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

## Job States

| State | Description |
|-------|-------------|
| `queued` | Job is waiting in queue |
| `processing` | Job is actively being processed |
| `completed` | Job completed successfully |
| `failed` | Job failed (check `errorMessage`) |

---

## Quality Tiers

| Tier | Keyframe Time | Scene Time (per frame) | Resolution |
|------|---------------|----------------------|------------|
| `draft` | 2s | 50ms | 1280x720 |
| `standard` | 3.5s | 100ms | 1920x1080 |
| `high` | 5s | 200ms | 3840x2160 |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Validation error (missing/invalid fields) |
| 401 | Unauthorized (no valid session or API key) |
| 404 | Job not found |
| 500 | Server error |

---

## Tips

1. **Use draft quality for testing** - Much faster processing
2. **Keep scenes short** - Max 60 seconds, but 3-10s is better for testing
3. **Poll every 500ms-1s** - Don't overwhelm the server
4. **Handle failures gracefully** - Check `retryable` flag
5. **Set timeouts** - Jobs can take longer than estimated

---

## See Also

- [Full Documentation](./README.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Code Examples](./examples.ts)
- [Test Script](./test-endpoints.ts)
