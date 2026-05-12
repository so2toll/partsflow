# Video Understanding API - Test Examples

## Quick Test Commands

These curl commands assume you're running the dev server on `localhost:4321` and have an authenticated session.

### 1. Test Upload Endpoint

```bash
# Test with JSON metadata (simplest for testing)
curl -X POST http://localhost:4321/api/internal/video/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-video.mp4",
    "fileSize": 52428800,
    "mimeType": "video/mp4"
  }' \
  --cookie-jar cookies.txt

# Expected response:
# {
#   "success": true,
#   "assetId": "asset_01HZK...",
#   "status": "processing",
#   "filename": "test-video.mp4",
#   "fileSize": 52428800,
#   "mimeType": "video/mp4",
#   "estimatedDuration": 100,
#   "message": "Video uploaded successfully. Processing started."
# }
```

### 2. Test Get Clips Endpoint

Replace `YOUR_ASSET_ID` with the assetId from step 1.

```bash
# Get all clips
curl "http://localhost:4321/api/internal/video/YOUR_ASSET_ID/clips" \
  --cookie cookies.txt

# Get clips with duration filter
curl "http://localhost:4321/api/internal/video/YOUR_ASSET_ID/clips?minDuration=10&maxDuration=60" \
  --cookie cookies.txt

# Get scenes only
curl "http://localhost:4321/api/internal/video/YOUR_ASSET_ID/clips?sceneDetection=true&shotDetection=false" \
  --cookie cookies.txt
```

### 3. Test Search Endpoint

```bash
# Search for "introduction"
curl -X POST "http://localhost:4321/api/internal/video/YOUR_ASSET_ID/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "introduction"
  }' \
  --cookie cookies.txt

# Search for "demo" with filters
curl -X POST "http://localhost:4321/api/internal/video/YOUR_ASSET_ID/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "demo or demonstration",
    "maxResults": 5,
    "minRelevance": 0.6,
    "clipType": "scene"
  }' \
  --cookie cookies.txt

# Simple search using GET
curl "http://localhost:4321/api/internal/video/YOUR_ASSET_ID/search?q=product" \
  --cookie cookies.txt
```

## JavaScript/TypeScript Examples

### Upload Video

```typescript
async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch('/api/internal/video/upload', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  console.log('Asset ID:', data.assetId);
  return data;
}

// Or with metadata only (for testing)
async function uploadVideoMock() {
  const response = await fetch('/api/internal/video/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: 'demo.mp4',
      fileSize: 10485760,
      mimeType: 'video/mp4'
    })
  });

  return await response.json();
}
```

### Get Clips

```typescript
async function getVideoClips(assetId: string) {
  const response = await fetch(
    `/api/internal/video/${assetId}/clips?minDuration=5&maxDuration=120`
  );

  const data = await response.json();
  console.log('Found', data.summary.totalClips, 'clips');

  // Process clips
  data.clips.forEach(clip => {
    console.log(`Clip ${clip.id}: ${clip.title} (${clip.duration}s)`);
  });

  return data;
}
```

### Search Clips

```typescript
async function searchVideoClips(assetId: string, query: string) {
  const response = await fetch(`/api/internal/video/${assetId}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      maxResults: 10,
      minRelevance: 0.5,
      clipType: 'all'
    })
  });

  const data = await response.json();
  console.log(`Found ${data.totalResults} results in ${data.searchTime}ms`);

  return data;
}

// Example usage
const results = await searchVideoClips('asset_01HZK...', 'product demonstration');
results.results.forEach(result => {
  console.log(`Match: ${result.title} (relevance: ${result.relevanceScore})`);
});
```

## Complete Workflow Example

```typescript
class VideoEditor {
  private assetId: string | null = null;

  async uploadVideo(file: File) {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch('/api/internal/video/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    this.assetId = data.assetId;
    return data;
  }

  async getClips() {
    if (!this.assetId) throw new Error('No video uploaded');

    const response = await fetch(
      `/api/internal/video/${this.assetId}/clips`
    );

    return await response.json();
  }

  async searchClips(query: string) {
    if (!this.assetId) throw new Error('No video uploaded');

    const response = await fetch(
      `/api/internal/video/${this.assetId}/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }
    );

    return await response.json();
  }

  async getClipThumbnail(clipId: string, time: number) {
    if (!this.assetId) throw new Error('No video uploaded');

    return `/api/internal/video/${this.assetId}/thumbnail?t=${time}`;
  }
}

// Usage
const editor = new VideoEditor();

// Upload
await editor.uploadVideo(videoFile);

// Get all clips
const clips = await editor.getClips();
console.log('Total clips:', clips.summary.totalClips);

// Search for specific content
const searchResults = await editor.searchClips('product demo');
console.log('Found matches:', searchResults.totalResults);
```

## Expected Mock Data Structure

### Clips Response
```json
{
  "assetId": "asset_01HZK...",
  "status": "ready",
  "totalDuration": 347.5,
  "clips": [
    {
      "id": "clip_scene_1",
      "startTime": 0,
      "endTime": 45.2,
      "duration": 45.2,
      "type": "scene",
      "title": "Introduction - Product Overview",
      "description": "Scene 1: Product Overview section",
      "confidence": 0.92,
      "thumbnailUrl": "/api/internal/video/asset_.../thumbnail?t=0"
    }
  ],
  "summary": {
    "totalClips": 8,
    "scenes": 5,
    "shots": 0,
    "semanticSegments": 3
  }
}
```

### Search Response
```json
{
  "assetId": "asset_01HZK...",
  "query": "product demo",
  "results": [
    {
      "clipId": "clip_scene_2",
      "startTime": 45.2,
      "endTime": 90.5,
      "duration": 45.3,
      "type": "scene",
      "title": "Main Content - Feature Demonstration",
      "description": "Scene 2: Feature Demonstration section",
      "relevanceScore": 0.87,
      "matchedTerms": ["demonstration"],
      "thumbnailUrl": "/api/internal/video/asset_.../thumbnail?t=45"
    }
  ],
  "totalResults": 3,
  "totalDuration": 347.5,
  "searchTime": 42
}
```

## Testing Checklist

- [ ] Upload returns valid assetId
- [ ] Get clips returns scene-level segments
- [ ] Clips have valid timestamps (startTime < endTime)
- [ ] Clip durations match endTime - startTime
- [ ] Search returns relevant results for common queries
- [ ] Search relevance scores are between 0 and 1
- [ ] Filters (minDuration, maxDuration) work correctly
- [ ] Time range filters (startTime, endTime) work correctly
- [ ] Clip type filters work correctly
- [ ] Same assetId always returns same clips (deterministic)
- [ ] Error handling works for invalid assetIds
- [ ] Authentication is enforced (401 without session)
