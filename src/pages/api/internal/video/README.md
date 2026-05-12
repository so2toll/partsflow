# Video Understanding API - Mock Endpoints

## Overview

These are mock/stub endpoints for Phase 4 Edit Mode flows in the Video AI Content Studio. They simulate video indexing, clip detection, and semantic search capabilities.

**Note**: These endpoints return realistic mock data for development and testing. In production, they would integrate with actual video processing pipelines.

## Base URL

```
/api/internal/video
```

## Endpoints

### 1. Upload Video

**Endpoint**: `POST /api/internal/video/upload`

**Purpose**: Accept a video file and return a mock asset ID for video indexing.

**Request**:
- **Content-Type**: `multipart/form-data` or `application/json`
- **Body**:
  - `video`: File (required) - Video file to upload
  - `filename`: string (optional) - Filename override
  - `projectId`: string (optional) - Project association

**Response**:
```json
{
  "success": true,
  "assetId": "asset_01HZK...",
  "status": "processing",
  "filename": "my-video.mp4",
  "fileSize": 10485760,
  "mimeType": "video/mp4",
  "projectId": null,
  "estimatedDuration": 20,
  "message": "Video uploaded successfully. Processing started."
}
```

**Example**:
```bash
# With actual file upload (multipart/form-data)
curl -X POST http://localhost:4321/api/internal/video/upload \
  -F "video=@/path/to/video.mp4"

# With JSON metadata (for testing)
curl -X POST http://localhost:4321/api/internal/video/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "demo-video.mp4",
    "fileSize": 10485760,
    "mimeType": "video/mp4"
  }'
```

---

### 2. Get Detected Clips

**Endpoint**: `GET /api/internal/video/[id]/clips`

**Purpose**: Returns mock detected clips with timestamps for a video asset.

**Request Parameters**:
- `id` (route param): Video asset ID
- `minDuration` (query): Minimum clip duration in seconds (default: 2)
- `maxDuration` (query): Maximum clip duration in seconds (default: 60)
- `sceneDetection` (query): Include scene-level segments (default: true)
- `shotDetection` (query): Include shot-level segments (default: false)

**Response**:
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
      "description": "Scene 1: Product Overview section with key content",
      "confidence": 0.92,
      "thumbnailUrl": "/api/internal/video/asset_01HZK.../thumbnail?t=0",
      "metadata": {
        "sceneNumber": 1,
        "hasAudio": true,
        "hasMotion": true,
        "dominantColor": "hsl(120, 70%, 50%)"
      }
    }
  ],
  "summary": {
    "totalClips": 8,
    "scenes": 5,
    "shots": 0,
    "semanticSegments": 3
  },
  "generatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Example**:
```bash
curl "http://localhost:4321/api/internal/video/asset_01HZK.../clips?minDuration=5&maxDuration=120"
```

---

### 3. Search Clips

**Endpoint**: `POST /api/internal/video/[id]/search`

**Purpose**: Searches clips by description using semantic search and keyword matching.

**Request Parameters**:
- `id` (route param): Video asset ID

**Request Body**:
```json
{
  "query": "introduction or demo",
  "startTime": 0,        // optional: filter clips starting after this time
  "endTime": 300,        // optional: filter clips ending before this time
  "clipType": "all",     // optional: 'scene' | 'shot' | 'semantic' | 'all'
  "maxResults": 10,      // optional: maximum results (1-100, default: 10)
  "minRelevance": 0.5    // optional: minimum relevance score 0-1 (default: 0.5)
}
```

**Response**:
```json
{
  "assetId": "asset_01HZK...",
  "query": "introduction or demo",
  "results": [
    {
      "clipId": "clip_scene_1",
      "startTime": 0,
      "endTime": 45.2,
      "duration": 45.2,
      "type": "scene",
      "title": "Introduction - Product Overview",
      "description": "Scene 1: Product Overview section with key content",
      "relevanceScore": 0.85,
      "matchedTerms": ["introduction", "overview"],
      "thumbnailUrl": "/api/internal/video/asset_01HZK.../thumbnail?t=0"
    }
  ],
  "totalResults": 3,
  "totalDuration": 347.5,
  "searchTime": 45,
  "filters": {
    "startTime": 0,
    "endTime": 300,
    "clipType": "all",
    "minRelevance": 0.5
  },
  "searchedAt": "2025-01-15T10:30:00.000Z"
}
```

**Example**:
```bash
curl -X POST "http://localhost:4321/api/internal/video/asset_01HZK.../search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "product demonstration",
    "maxResults": 5,
    "minRelevance": 0.6
  }'

# Or use GET for simple queries
curl "http://localhost:4321/api/internal/video/asset_01HZK.../search?q=demo&maxResults=5"
```

---

## Clip Types

- **scene**: Major segments of the video (scenes, chapters)
- **shot**: Individual camera shots or takes
- **semantic**: Meaningful content segments (intro, demo, conclusion, etc.)

## Authentication

All endpoints require authenticated session via Better Auth cookies.

## Mock Data Generation

The endpoints generate deterministic mock data based on the asset ID:
- Same asset ID always produces the same clips
- Video duration: 2-10 minutes (random but consistent per asset)
- Scene count: 5-12 scenes
- Shot count: 15-35 shots (when requested)
- Semantic segments: 3-6 segments

## Usage Flow

1. **Upload**: `POST /api/internal/video/upload` → Get `assetId`
2. **Get Clips**: `GET /api/internal/video/{assetId}/clips` → Get all detected clips
3. **Search**: `POST /api/internal/video/{assetId}/search` → Find relevant clips

## Production Integration Notes

When implementing real video processing:

1. **Upload Endpoint**:
   - Integrate with object storage (S3, GCS, etc.)
   - Add video format validation
   - Implement virus scanning
   - Add progress tracking for large uploads

2. **Clips Endpoint**:
   - Integrate with video analysis pipeline
   - Use actual scene detection algorithms
   - Store results in database
   - Add caching for frequently accessed videos

3. **Search Endpoint**:
   - Implement vector embeddings for semantic search
   - Add full-text search on transcripts
   - Integrate with Elasticsearch or similar
   - Add query understanding and expansion

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error Type",
  "details": "Human-readable error message"
}
```

Status codes:
- `400`: Validation error
- `401`: Unauthorized
- `404`: Asset not found
- `500`: Internal server error

## Testing

Use the provided example curl commands or integrate with frontend:

```javascript
// Upload video
const uploadResponse = await fetch('/api/internal/video/upload', {
  method: 'POST',
  body: formData // or JSON for testing
});
const { assetId } = await uploadResponse.json();

// Get clips
const clipsResponse = await fetch(`/api/internal/video/${assetId}/clips`);
const { clips } = await clipsResponse.json();

// Search clips
const searchResponse = await fetch(`/api/internal/video/${assetId}/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'product demo' })
});
const { results } = await searchResponse.json();
```
