# Generate Worker GPU Integration - Architecture Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Request                                    │
│                         POST /api/video/generate                            │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Video Queue Job                                    │
│                           (BullMQ)                                          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Generate Worker                                     │
│                    (generateVideo function)                                 │
│                                                                              │
│  1. Parse script for scene markers                                          │
│  2. Estimate scene count                                                    │
│  3. Initialize progress tracking                                            │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ Stage 1: Initialize (0-20%)
                                      │ - Validate project
                                      │ - Set status to 'generating'
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GPU Client                                           │
│                    (gpuClient.ts)                                           │
│                                                                              │
│  gpuClient.generateKeyframes(script, sceneCount, qualityTier)               │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ HTTP POST
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POST /api/gpu/keyframes                                  │
│                                                                              │
│  • Parse script for [Scene N] markers                                       │
│  • Generate keyframe metadata for each scene                                │
│  • Return scene descriptors with estimates                                  │
│  • Processing: 500ms + 100ms per scene                                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ Returns: KeyframesResult
                                      │ { keyframes: [...], totalScenes: N }
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Generate Worker                                     │
│                                                                              │
│  Stage 2: Keyframes (20-30%)                                                │
│  • Update project with total scene count                                    │
│  • Log keyframe generation results                                          │
│  • Progress: "Generated N keyframes"                                        │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ For each scene in keyframes:
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GPU Client                                           │
│                                                                              │
│  gpuClient.renderScene(sceneId, keyframeData, renderQuality)                │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ HTTP POST (per scene)
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POST /api/gpu/render                                     │
│                                                                              │
│  • Render single scene frame                                                │
│  • Simulate GPU rendering time:                                             │
│    - 720p:  200ms                                                           │
│    - 1080p: 400ms                                                           │
│    - 4k:    800ms                                                           │
│  • Return mock frame URL                                                    │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ Returns: RenderResult
                                      │ { frameUrl, renderTime, ... }
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Generate Worker                                     │
│                                                                              │
│  Stage 3: Rendering (30-90%)                                                │
│  • Process scenes sequentially                                              │
│  • Update completedScenes count                                             │
│  • Progress: "Rendering scene N of M..."                                    │
│  • Calculate progress: 30% + (N/M * 60%)                                    │
│                                                                              │
│  Example: 5 scenes                                                          │
│    Scene 1: 30% + (1/5 * 60%) = 42%                                        │
│    Scene 2: 30% + (2/5 * 60%) = 54%                                        │
│    Scene 3: 30% + (3/5 * 60%) = 66%                                        │
│    Scene 4: 30% + (4/5 * 60%) = 78%                                        │
│    Scene 5: 30% + (5/5 * 60%) = 90%                                        │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      │ All scenes complete
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Generate Worker                                     │
│                                                                              │
│  Stage 4: Assembling (90-100%)                                              │
│  • Simulate video assembly (500ms)                                          │
│  • Generate output metadata                                                 │
│  • Calculate duration and used minutes                                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Project Repository                                     │
│                                                                              │
│  setOutputVideo(projectId, {                                                │
│    outputVideoUrl,                                                          │
│    thumbnailUrl,                                                            │
│    estimatedDuration,                                                       │
│    usedMinutes                                                              │
│  })                                                                         │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Complete!                                            │
│                                                                              │
│  • Project status: 'completed'                                              │
│  • Progress: 100%                                                           │
│  • Output video URL available                                               │
│  • Thumbnail available                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Progress Timeline Example

For a 5-scene video with qualityTier='high' (1080p):

```
Time    Stage          Progress  Details                        Notes
────────────────────────────────────────────────────────────────────────────
0ms     initializing   0%        Starting video generation     Set status to 'generating'
        initializing   0%        Starting video generation

700ms   keyframes      10%       Analyzing script...           GPU: generateKeyframes()
        keyframes      20%       Generated 5 keyframes         Total: 500ms + 5*100ms

1100ms  rendering      30%       Rendering scene 1 of 5...
1500ms  rendering      42%       Rendering scene 2 of 5...     Scene 1: 400ms (1080p)
1900ms  rendering      54%       Rendering scene 3 of 5...     Scene 2: 400ms
2300ms  rendering      66%       Rendering scene 4 of 5...     Scene 3: 400ms
2700ms  rendering      78%       Rendering scene 5 of 5...     Scene 4: 400ms
3100ms  rendering      90%       Rendering scene 5 of 5...     Scene 5: 400ms

3600ms  assembling     90%       Assembling final video       500ms assembly time
        completed      100%      Video generation complete!

Total: ~3.6 seconds (vs. 3 seconds before)
```

## Key Improvements

### Before (Simple Simulation):
- Fixed 3-second duration
- Basic progress stages (0, 25, 50, 75, 100%)
- No GPU service integration
- Generic progress messages
- No scene-by-scene tracking

### After (GPU Integration):
- Dynamic duration based on scene count and quality
- Detailed progress stages with specific percentages
- Full GPU service integration
- Human-readable progress messages with details
- Scene-by-scene processing and tracking
- Realistic timing based on quality tier

## Quality Tier Impact

| Tier    | Quality | Per Scene | 5 Scenes | Keyframes | Assembly | Total |
|---------|---------|-----------|----------|-----------|----------|-------|
| std     | 720p    | 200ms     | 1.0s     | 1.0s      | 0.5s     | 2.5s  |
| high    | 1080p   | 400ms     | 2.0s     | 1.0s      | 0.5s     | 3.5s  |
| premium | 4k      | 800ms     | 4.0s     | 1.0s      | 0.5s     | 5.5s  |

## Error Handling Flow

```
Any GPU endpoint fails
        │
        ▼
Log error details
        │
        ▼
Update project status to 'failed'
        │
        ▼
Store error message in project
        │
        ▼
Throw error to upstream handler
        │
        ▼
Queue job marked as failed
        │
        ▼
User sees error in UI
```

## Data Flow

```
Script Input
    │
    ├─► Parse [Scene N] markers
    │       │
    │       └─► Estimate scene count
    │
    ├─► GPU: generateKeyframes()
    │       │
    │       ├─► Returns: KeyframesResult
    │       │       {
    │       │         keyframes: [
    │       │           { sceneId, sceneNumber, description, ... },
    │       │           ...
    │       │         ],
    │       │         totalScenes: N
    │       │       }
    │       │
    │       └─► For each keyframe:
    │               │
    │               └─► GPU: renderScene()
    │                       │
    │                       └─► Returns: RenderResult
    │                               { frameUrl, renderTime, ... }
    │
    └─► Collect all render results
            │
            └─► Generate output metadata
                    │
                    └─► Store in project
```
