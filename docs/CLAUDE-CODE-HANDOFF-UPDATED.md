# Claude Code Handoff — AI Content Studio Platform

## Document Purpose

This document provides Claude Code with the full context needed to build an AI content studio platform. It covers architecture, technology choices, data models, event flows, screen specifications, and implementation priorities. The project has been extensively researched and architected across multiple planning sessions. All major technical decisions are made — Claude Code's job is execution, not re-evaluation of architecture.

---

## 1. Project Overview

### What We're Building

A vertically integrated AI content studio with two core capabilities:

1. **Script-to-Video (Create Mode):** User pastes a script → Director Agent parses it into scenes → generates character-consistent keyframes → renders video clips → assembles finished video with audio, transitions, and captions. Cost: $3-8 per multi-minute video vs $50-100+ via API alternatives.

2. **Intelligent Editing (Edit Mode):** User uploads existing footage → system segments, analyzes, embeds, and indexes all clips → user gives natural language editing instructions → Director Agent finds matching clips, arranges them, fills gaps with AI-generated content → delivers assembled edit.

Both modes share the same underlying architecture: the same Director Agent, the same DeepLake tensor database, the same inference pipeline, the same assembly system.

### One-Line Positioning

"A script-to-video platform that produces cinematic AI content with consistent characters at 80-90% lower cost than alternatives — plus intelligent editing that understands your footage and assembles it on command."

### Target Users (Phase 1)

AI filmmakers priced out of Higgsfield or frustrated by credit limitations. YouTube/TikTok creators who want AI-produced content without technical complexity. Podcasters and educators who need visual content from scripts or recordings. The "edit my footage" crowd — creators with lots of footage who want AI to assemble rough cuts.

### Business Model

Subscription-based with soft usage limits:
- **Creator tier (~$29/mo):** Up to 50 videos/month, standard quality (720p), basic character library
- **Studio tier (~$79/mo):** Up to 150 videos/month, cinema quality (1080p+), full character library, priority rendering, commercial license

Revenue at scale comes from subscriptions, future brand bounty commissions, render markup, and data licensing. For MVP, focus only on subscriptions + individual purchases.

---

## 2. Architecture Overview

### Three-Layer Disaggregated Architecture

The system has three independent layers that scale separately (inspired by VAST Data's DASE architecture):

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: APPLICATION (Astro + BetterAuth + Turso)      │
│  User-facing web app, auth, payments, project mgmt,     │
│  job queue, notifications, dashboards                   │
│  Runs on: Azure VM (always-on, general purpose)         │
├─────────────────────────────────────────────────────────┤
│  LAYER 2: DIRECTOR AGENT + UNDERSTANDING PIPELINE       │
│  Script parsing, scene decomposition, DeepLake queries, │
│  render dispatching, video understanding/indexing,      │
│  Remotion assembly                                      │
│  Runs on: Azure VM (CPU) + Lambda GPU (inference)       │
├─────────────────────────────────────────────────────────┤
│  LAYER 3: INFERENCE SERVICES                            │
│  WanGP (video generation), FireRed (keyframes),         │
│  CLIP/SigLIP (embeddings), Whisper (transcription),     │
│  VLM (scene descriptions)                               │
│  Runs on: Lambda Cloud GPU ($7,500 credits)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STORAGE (shared across all layers, scales independently)│
│  Azure Blob Storage: video files, media assets          │
│  DeepLake on Azure Blob: tensors, embeddings, vectors   │
│  Turso: relational data (users, projects, jobs, billing)│
└─────────────────────────────────────────────────────────┘
```

### Key Design Principles

- **Disaggregated:** Storage, compute, and application logic scale independently. Adding GPU workers doesn't require duplicating the media library. Growing the media library doesn't require more GPUs.
- **Event-driven pipeline:** Each stage triggers the next. Video uploaded → segmentation → embedding → indexing → ready. No polling loops.
- **Director Agent as reasoning router:** The Director Agent doesn't follow a fixed pipeline — it reasons about what each scene needs and routes to the appropriate tools/models/quality levels.
- **Model-agnostic:** WanGP supports multiple video models (Wan 2.2, LTX 2.3, HunyuanVideo, Flux). New models integrate without architecture changes.
- **Stub-first development:** Build the full application with stubbed inference calls first. Plug in real GPU inference without changing application code.

---

## 3. Technology Stack

### Application Layer

| Component | Technology | Status | Purpose |
|-----------|-----------|--------|---------|
| Frontend | **Astro.js** | ✅ EXISTING | SSR/SSG web framework, islands architecture for React components |
| Auth | **BetterAuth** | ✅ EXISTING | Email/password auth, sessions, server-side `auth.api.getSession()` |
| Database | **Turso** (prod) / **SQLite** (local dev) | ✅ EXISTING | Dual-db: `auth.db` (BetterAuth) + `app.db` (graph data) |
| Graph Layer | **Custom Cypher-to-SQL parser** (`graph.ts`) | ✅ EXISTING | Graph abstraction over SQLite — nodes + relationships tables |
| Repositories | **Repository pattern** | ✅ EXISTING | OrganizationRepo, ProjectRepo, TeamRepo (graph-based) |
| RBAC | **Role-based access control** | ✅ EXISTING | Admin/User/Viewer roles, team permissions, audit logging |
| Multitenancy | **Organization → Projects → Teams → Users** | ✅ EXISTING | Full org hierarchy modeled as graph nodes + relationships |
| Payments | **Stripe** + Stripe Checkout | ❌ TO BUILD | Subscriptions, one-time purchases, webhook handling |
| Job Queue | **BullMQ** (on Redis) | ❌ TO BUILD | Async job management for render and indexing tasks |
| File Storage | **Azure Blob Storage** | ❌ TO BUILD | Video files, uploaded footage, rendered outputs, thumbnails |
| Email | **Resend** or similar | ❌ TO BUILD | Transactional emails (render complete, welcome, etc.) |
| Hosting | **Azure VM** (Standard_B2s or D2s_v3) | ❌ TO BUILD | Application server for web app + API + workers |

### IMPORTANT: Existing Graph Architecture

The application database (`app.db`) uses a **graph-on-SQLite** architecture with only two tables:

```sql
-- ALL entities stored as nodes (no separate tables per entity type)
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,      -- 'Organization', 'Project', 'Team', 'User', 'Character', 'Scene', 'Job', etc.
  properties TEXT NOT NULL, -- JSON blob with all entity properties
  created_at TEXT DEFAULT (datetime('now'))
);

-- ALL relationships stored in one table
CREATE TABLE relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  type TEXT NOT NULL,       -- 'HAS_PROJECT', 'HAS_TEAM', 'MEMBER_OF', 'HAS_SCENE', 'FEATURES_CHARACTER', etc.
  properties TEXT DEFAULT '{}', -- JSON: role, joinedAt, order, etc.
  created_at TEXT DEFAULT (datetime('now'))
);
```

**New entities for video AI features are added as new node labels and relationship types — NO new SQL tables, NO migrations needed.** Data access goes through the `graph` singleton exported from `src/lib/db/graph.ts` using Cypher-like query syntax, and through Repository classes that wrap graph operations.

**CRITICAL: Read GRAPH-PARSER-FIXES.md before modifying graph.ts.** The parser has known issues (SET/DELETE not implemented, race condition in mutate, incoming relationships not parsed). The fixes document provides specific solutions.

### Director Agent + Understanding Pipeline

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Orchestrator | **Python** service (FastAPI or plain script) | Script parsing, scene decomposition, pipeline coordination |
| Tensor Database | **DeepLake** (v3.x, embedded mode on Azure Blob) | Character identity storage, clip embeddings, scene descriptions |
| Scene Detection | **PySceneDetect** | Automatic scene boundary detection in uploaded footage |
| Media Processing | **FFmpeg** | Clip extraction, frame extraction, audio extraction, transcoding |
| Visual Embeddings | **CLIP** (ViT-L/14 via open_clip or transformers) | Semantic visual embeddings for search and retrieval |
| Audio Transcription | **Whisper** (openai-whisper, "base" or "small" model) | Speech-to-text with timestamps for uploaded footage |
| Scene Descriptions | **Qwen2-VL-7B** or similar open VLM | Natural language descriptions of each scene/clip |
| Video Assembly | **Remotion** | Programmatic React-based video composition and rendering |

### Inference Services (GPU)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Video Generation | **WanGP** | Unified inference for Wan 2.2, LTX 2.3, HunyuanVideo, Flux |
| Keyframe Generation | **FireRed Image Edit** | Identity-consistent reference images per scene |
| Character Identity | **DeepLake** tensors | LoRA refs, embeddings, style notes per character |
| GPU Compute | **Lambda Cloud** ($7,500 credits) | A10/A100 instances for inference workloads |

### Development Environment

| Component | Details |
|-----------|---------|
| Local Machine | 2019 MacBook Pro 13", Intel Iris Plus 645, no NVIDIA GPU |
| Local Dev | Astro dev server, Python venv, SQLite, Redis (local or Docker) |
| GPU Access | Lambda Cloud (SSH into GPU instances for inference work) |
| Code Editor | VS Code or similar |
| Version Control | Git + GitHub |
| Design Tool | **Google Stitch** for UI/UX design → export to code |

---

## 4. Data Architecture

### 4.1 Graph Database — Existing Node Types (already implemented)

These node types and relationships already exist in the codebase and are managed through existing repositories:

```cypher
-- Organization (tenant root) — OrganizationRepository
(:Organization {id, name, domain, settings, createdAt, updatedAt})

-- User (extends BetterAuth user) — managed via auth + graph
(:User {id, email, name, role, organizationId, createdAt})

-- Project (workspace) — ProjectRepository  
(:Project {id, name, description, organizationId, createdAt, updatedAt})

-- Team (collaboration group) — TeamRepository
(:Team {id, name, organizationId, createdBy, createdAt, updatedAt})

-- Existing Relationships:
(:User)-[:OWNS]->(:Organization)
(:Organization)-[:HAS_PROJECT]->(:Project)
(:Organization)-[:HAS_TEAM]->(:Team)
(:Team)-[:WORKS_ON]->(:Project)
(:User)-[:MEMBER_OF {role, joinedAt}]->(:Team)
(:User)-[:CREATED]->(:Project)
```

### 4.2 Graph Database — NEW Node Types for Video AI (to build)

These follow the same pattern as existing repositories. Create new Repository classes following the patterns in `OrganizationRepository.ts` and `TeamRepository.ts`.

```cypher
-- Character (reusable identity for video consistency) — NEW: CharacterRepository
CREATE (c:Character {
  id: "char_xxx",              -- ULID prefixed with char_
  userId: "user_xxx",          -- owner
  organizationId: "org_xxx",   -- tenant scoping
  name: "Detective Sarah",
  description: "Mid-30s, dark hair, determined expression, noir aesthetic",
  deeplakeRef: "characters/char_xxx",  -- key into DeepLake tensor dataset
  referenceImageUrl: "https://blob.../characters/char_xxx/reference.png",
  metadata: '{"style":"noir","loraRef":"..."}',  -- JSON string
  createdAt: "...",
  updatedAt: "..."
})

-- Relationships:
(:Organization)-[:HAS_CHARACTER]->(:Character)
(:Project)-[:USES_CHARACTER]->(:Character)

-- Scene (parsed from script, part of a project) — NEW: SceneRepository
CREATE (s:Scene {
  id: "scene_xxx",
  projectId: "proj_xxx",
  sceneIndex: 1,                -- ordering within project
  description: "Detective enters dark alley, rain falling",
  dialogue: "Something doesn't feel right...",
  modelSelection: "ltx23",     -- which model: 'ltx23', 'wan22', 'draft'
  keyframeUrl: null,            -- Azure Blob URL, set after generation
  clipUrl: null,                -- Azure Blob URL, set after rendering
  clipDurationSeconds: null,
  status: "pending",           -- 'pending', 'keyframe_gen', 'rendering', 'complete', 'failed'
  metadata: '{"camera":"wide","mood":"tense","lighting":"low-key"}',
  createdAt: "...",
  updatedAt: "..."
})

-- Relationships:
(:Project)-[:HAS_SCENE {order: 1}]->(:Scene)
(:Scene)-[:FEATURES_CHARACTER]->(:Character)

-- Job (async processing task) — NEW: JobRepository
CREATE (j:Job {
  id: "job_xxx",
  userId: "user_xxx",
  projectId: "proj_xxx",
  organizationId: "org_xxx",
  jobType: "generate_video",   -- 'generate_video', 'index_footage', 'render_clip', 'assemble_video'
  status: "queued",            -- 'queued', 'processing', 'complete', 'failed', 'cancelled'
  priority: 0,
  payload: '{"qualityTier":"standard"}',  -- JSON input params
  result: null,                 -- JSON output data when complete
  errorMessage: null,
  workerId: null,
  startedAt: null,
  completedAt: null,
  createdAt: "..."
})

-- Relationships:
(:Project)-[:HAS_JOB]->(:Job)
(:User)-[:SUBMITTED]->(:Job)

-- UploadedAsset (footage file for edit mode) — NEW: AssetRepository
CREATE (a:UploadedAsset {
  id: "asset_xxx",
  userId: "user_xxx",
  projectId: "proj_xxx",
  organizationId: "org_xxx",
  filename: "interview_raw.mp4",
  blobUrl: "https://blob.../uploads/...",
  fileSizeBytes: 52428800,
  durationSeconds: 600.0,
  mimeType: "video/mp4",
  indexingStatus: "pending",   -- 'pending', 'indexing', 'indexed', 'failed'
  clipCount: null,
  metadata: '{"resolution":"1920x1080","fps":30}',
  createdAt: "..."
})

-- Relationships:
(:Project)-[:HAS_ASSET]->(:UploadedAsset)

-- Clip (detected segment from uploaded footage) — stored in DeepLake primarily,
-- but a lightweight graph node links it for relationship traversal
CREATE (clip:Clip {
  id: "clip_xxx",
  assetId: "asset_xxx",
  projectId: "proj_xxx",
  startTime: 0.0,
  endTime: 5.2,
  sceneType: "dialogue",      -- auto-classified
  deeplakeRef: "clips/proj_xxx/clip_xxx",  -- key into DeepLake
  clipPath: "https://blob.../uploads/.../clips/clip_001.mp4",
  keyframePath: "https://blob.../uploads/.../clips/clip_001_keyframe.jpg",
  createdAt: "..."
})

-- Relationships:
(:UploadedAsset)-[:HAS_CLIP]->(:Clip)

-- Video (final output) — stored as a node for graph traversal
CREATE (v:Video {
  id: "vid_xxx",
  projectId: "proj_xxx",
  outputUrl: "https://blob.../projects/.../output/final.mp4",
  thumbnailUrl: "https://blob.../projects/.../output/thumbnail.jpg",
  durationSeconds: 180.5,
  renderCostCents: 45,
  createdAt: "..."
})

-- Relationships:
(:Project)-[:PRODUCED]->(:Video)

-- PaymentEvent (audit trail) — NEW: PaymentRepository
CREATE (pe:PaymentEvent {
  id: "pay_xxx",
  userId: "user_xxx",
  stripeEventId: "evt_xxx",
  eventType: "subscription_created",
  amountCents: 2900,
  currency: "usd",
  metadata: '{"full_stripe_event":"..."}',
  createdAt: "..."
})

-- Relationships:
(:User)-[:MADE_PAYMENT]->(:PaymentEvent)
```

### 4.3 New Repository Classes to Create

Follow the existing repository patterns (see `OrganizationRepository.ts`, `TeamRepository.ts`):

| Repository | Node Type | Key Methods |
|------------|-----------|-------------|
| `CharacterRepository` | Character | `create()`, `findById()`, `findByOrgId()`, `findByProjectId()`, `update()`, `delete()` |
| `SceneRepository` | Scene | `create()`, `findByProjectId()`, `updateStatus()`, `updateUrls()` |
| `JobRepository` | Job | `create()`, `findById()`, `findByProjectId()`, `updateStatus()`, `findNextQueued()` |
| `AssetRepository` | UploadedAsset | `create()`, `findById()`, `findByProjectId()`, `updateIndexingStatus()` |
| `ClipRepository` | Clip | `create()`, `findByAssetId()`, `findByProjectId()` |
| `VideoRepository` | Video | `create()`, `findByProjectId()` |
| `PaymentRepository` | PaymentEvent | `create()`, `findByUserId()` |

**IMPORTANT:** Use `graph.mutate()` for creates, `graph.updateNode()` for updates (after Fix 2 from GRAPH-PARSER-FIXES.md), `graph.deleteNode()` / `graph.deleteRelationship()` for deletes (after Fix 3). Use `graph.query()` for reads. Use `graph.queryRelated()` for reads that need relationship properties (after Fix 5). Until those fixes are applied, use direct SQL via `appQuery`/`appExecute` for update/delete operations (same pattern as `getMembers()` in TeamRepository).

### 4.2 DeepLake Datasets (on Azure Blob Storage)

DeepLake stores tensor data — embeddings, images, and structured metadata that support similarity search. Stored at `azure://<storage-account>/<container>/deeplake/`

**Character Identity Dataset** (`deeplake/characters/`)
```python
# Schema per row:
{
    "character_id": str,        # matches Turso characters.id
    "user_id": str,             # ownership
    "embedding": tensor,        # CLIP embedding of reference image (768-dim)
    "reference_image": tensor,  # actual reference image tensor
    "style_notes": str,         # natural language style description
    "lora_ref": str,            # path to LoRA weights if fine-tuned
}
```

**Clip Index Dataset** (`deeplake/clips/{project_id}/`)
```python
# Schema per row (one per detected clip/scene in uploaded footage):
{
    "clip_id": str,             # unique clip identifier
    "project_id": str,          # which project this belongs to
    "user_id": str,             # ownership
    "source_asset_id": str,     # matches uploaded_assets.id
    "start_time": float,        # start timestamp in source video
    "end_time": float,          # end timestamp in source video
    "visual_embedding": tensor, # CLIP embedding of representative keyframe (768-dim)
    "transcript": str,          # Whisper transcription of this clip's audio
    "description": str,         # VLM-generated natural language description
    "scene_type": str,          # auto-classified: 'dialogue', 'action', 'establishing', 'closeup', etc.
    "clip_path": str,           # Azure Blob path to extracted clip file
    "keyframe_path": str,       # Azure Blob path to representative keyframe image
}
```

### 4.3 Azure Blob Storage Structure

```
<storage-account>/<container>/
├── uploads/
│   └── {user_id}/
│       └── {asset_id}/
│           ├── original.mp4          # uploaded source footage
│           └── clips/
│               ├── clip_001.mp4      # extracted scene clips
│               ├── clip_002.mp4
│               └── ...
├── projects/
│   └── {user_id}/
│       └── {project_id}/
│           ├── keyframes/
│           │   ├── scene_001.png     # FireRed-generated keyframes
│           │   └── scene_002.png
│           ├── clips/
│           │   ├── scene_001.mp4     # WanGP-rendered clips
│           │   └── scene_002.mp4
│           ├── output/
│           │   ├── final.mp4         # assembled final video
│           │   └── thumbnail.jpg
│           └── remotion/
│               └── composition.json  # Remotion composition data
├── characters/
│   └── {user_id}/
│       └── {character_id}/
│           ├── reference.png         # uploaded character reference image
│           └── lora/                 # optional LoRA weights
└── deeplake/
    ├── characters/                   # DeepLake character identity dataset
    └── clips/
        └── {project_id}/            # DeepLake clip index per project
```

---

## 5. Core Event Flows

These flows follow event modeling principles. Each flow shows the sequence of commands, events, and state changes.

### 5.1 Script-to-Video Generation Flow (Create Mode)

```
USER ACTION: Pastes script, selects quality tier, clicks "Generate"

1. [Command] SubmitScript
   → Validates user has subscription/quota (check User node properties)
   → Creates Project node in graph (status: 'processing', mode: 'create')
   → Creates Job node in graph (jobType: 'generate_video', status: 'queued')
   → Creates relationships: (Project)-[:HAS_JOB]->(Job), (User)-[:SUBMITTED]->(Job)
   → Enqueues job in BullMQ
   → Returns project_id to frontend for polling/SSE

2. [Event] ScriptReceived
   → Director Agent picks up job from queue
   → Parses script into scene objects using LLM
   → Creates Scene nodes in graph with (Project)-[:HAS_SCENE]->(Scene) relationships
   → For each scene: identifies characters, determines model selection,
     writes camera/mood/style metadata into Scene node properties

3. [Event] ScenesParsed
   → For each scene with characters:
     → Queries DeepLake for character identity tensors
     → Calls FireRed to generate keyframe (character + scene description)
     → Stores keyframe in Azure Blob
     → Updates scene record with keyframe_url

4. [Event] KeyframesGenerated
   → For each scene:
     → Dispatches render job to GPU worker (via BullMQ sub-queue or HTTP call to Lambda)
     → GPU worker runs WanGP with appropriate model:
       - Dialogue scenes → LTX 2.3 (native audio)
       - Visual quality scenes → Wan 2.2
       - Draft tier → fastest/cheapest model
     → Rendered clip stored in Azure Blob
     → Scene record updated with clip_url and status

5. [Event] ClipsRendered (all scenes complete)
   → Director Agent builds Remotion composition:
     → Sequences clips in scene order
     → Adds transitions between scenes
     → Layers audio (LTX native audio or generated TTS)
     → Adds captions if requested
   → Remotion renders final .mp4
   → Final video stored in Azure Blob

6. [Event] VideoAssembled
   → Project record updated (status: 'complete', output_video_url set)
   → User usage count incremented
   → Thumbnail generated
   → User notified (email + in-app notification)
   → Job record updated (status: 'complete')

7. [Frontend] User sees completed video
   → Video player with download button
   → Option to regenerate specific scenes
   → Option to adjust and re-render
```

### 5.2 Intelligent Editing Flow (Edit Mode)

```
USER ACTION: Uploads video file(s), provides editing instructions

1. [Command] UploadFootage
   → Validates user has subscription/quota
   → Uploads file to Azure Blob (uploads/{user_id}/{asset_id}/)
   → Creates UploadedAsset node in graph (indexingStatus: 'pending')
   → Creates Project node (mode: 'edit') if not existing
   → Creates Job node (jobType: 'index_footage', status: 'queued')
   → Creates relationships: (Project)-[:HAS_ASSET]->(UploadedAsset), (Project)-[:HAS_JOB]->(Job)
   → Enqueues indexing job

2. [Event] FootageReceived
   → Worker picks up indexing job
   → PySceneDetect analyzes video → detects scene boundaries
   → FFmpeg extracts individual clips at scene boundaries
   → Clips stored in Azure Blob (uploads/{user_id}/{asset_id}/clips/)

3. [Event] ClipsExtracted
   → For each clip:
     a. FFmpeg extracts representative keyframe(s)
     b. CLIP generates visual embedding (batch all frames together — Pattern 1)
     c. Store keyframe in Azure Blob

4. [Event] FramesEmbedded
   → Whisper transcribes full audio track with timestamps
   → Transcript segments aligned with clip timestamps

5. [Event] AudioTranscribed
   → VLM (Qwen2-VL) generates description for each clip
   → Auto-classifies scene type (dialogue, action, establishing, etc.)
   → (This is the slowest step — sequential or batched Pattern 2/3)

6. [Event] ScenesDescribed
   → All data written to DeepLake clip index:
     → Visual embeddings, transcripts, descriptions, scene types, paths
   → Uploaded asset record updated (indexing_status: 'indexed', clip_count set)
   → User notified: "Your footage is ready for editing"

7. [Command] SubmitEditInstructions
   → User provides natural language editing instruction:
     "Match b-roll to the narration. Make it feel suspenseful. Keep it under 3 minutes."
   → Director Agent queries DeepLake to find matching clips
   → Reasons about clip selection, ordering, pacing
   → Builds Remotion composition
   → Renders assembled edit
   → Returns to user for review

8. [Event] EditAssembled
   → Same delivery flow as Create Mode (step 6-7 above)
```

### 5.3 Hybrid Mode (Script + Existing Footage)

```
Combines both flows:
→ User uploads footage AND provides script
→ System indexes footage (Edit Mode flow steps 1-6)
→ Director Agent matches existing clips to script scenes where possible
→ Generates new clips (via Create Mode) for scenes without matching footage
→ Assembles everything together in Remotion
→ Delivers unified video mixing real footage and AI-generated content
```

---

## 6. API Endpoints

### Authentication (handled by BetterAuth — existing IP)
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session
```

### Projects
```
GET    /api/projects                    → List user's projects
POST   /api/projects                    → Create new project
GET    /api/projects/:id                → Get project details + scenes
DELETE /api/projects/:id                → Delete project
POST   /api/projects/:id/generate       → Start generation (Create Mode)
POST   /api/projects/:id/edit           → Submit edit instructions (Edit Mode)
GET    /api/projects/:id/status         → Poll generation status (or use SSE)
```

### Characters
```
GET    /api/characters                  → List user's characters
POST   /api/characters                  → Create character (with reference image upload)
GET    /api/characters/:id              → Get character details
PUT    /api/characters/:id              → Update character
DELETE /api/characters/:id              → Delete character
```

### Assets (Edit Mode)
```
POST   /api/assets/upload               → Upload footage file (multipart)
GET    /api/assets/:id/status           → Check indexing status
GET    /api/assets/:id/clips            → List indexed clips with metadata
POST   /api/assets/:id/search           → Search clips by text/similarity
```

### Billing
```
POST   /api/billing/create-checkout     → Create Stripe Checkout session
POST   /api/billing/webhook             → Stripe webhook handler
GET    /api/billing/subscription        → Get current subscription details
POST   /api/billing/portal              → Create Stripe Customer Portal session
```

### Jobs (internal/admin)
```
GET    /api/jobs/:id                    → Get job status and details
GET    /api/admin/jobs                  → List all jobs (admin only)
```

---

## 7. Screen Specifications

These are the screens to design in Google Stitch and then implement. Each screen lists its purpose, key elements, and connected API endpoints.

### 7.1 Landing / Marketing Page
- **Purpose:** Convert visitors to signups
- **Key elements:** Hero with demo video, value proposition ("Script in. Video out. $29/month."), feature highlights (Create Mode + Edit Mode), pricing table (Creator vs Studio), demo gallery showing sample outputs, CTA to sign up
- **API:** None (static page with auth links)

### 7.2 Dashboard (Post-Login Home)
- **Purpose:** Overview of user's projects and quick actions
- **Key elements:** Project list (cards with thumbnail, title, status, date), "New Project" button, usage meter (X of Y videos this month), subscription status badge, quick-start prompts for new users
- **API:** `GET /api/projects`, `GET /api/billing/subscription`

### 7.3 New Project — Create Mode
- **Purpose:** Script input and generation settings
- **Key elements:** Large text area for script input, quality tier selector (Draft / Standard / Cinema) with price/time estimates, character selector (choose from existing library or create new), "Generate" button, optional: scene preview after parsing (before rendering)
- **API:** `POST /api/projects`, `POST /api/projects/:id/generate`, `GET /api/characters`

### 7.4 New Project — Edit Mode
- **Purpose:** Upload footage and provide editing instructions
- **Key elements:** Drag-and-drop file upload area (supports multiple files), upload progress indicator, indexing progress indicator per file, once indexed: clip gallery showing all detected scenes with thumbnails, text input for editing instructions, "Assemble Edit" button
- **API:** `POST /api/assets/upload`, `GET /api/assets/:id/status`, `GET /api/assets/:id/clips`, `POST /api/projects/:id/edit`

### 7.5 Generation Progress View
- **Purpose:** Show real-time progress of video generation or editing
- **Key elements:** Progress bar or step indicator (Parsing → Keyframes → Rendering → Assembly), per-scene status (if applicable), estimated time remaining, cancel button, preview of completed scenes as they finish (progressive reveal)
- **API:** `GET /api/projects/:id/status` (polling) or SSE endpoint

### 7.6 Video Player / Result View
- **Purpose:** View and download completed video
- **Key elements:** Video player (with standard controls), download button (.mp4), share link (optional), scene-by-scene breakdown (thumbnails + descriptions), "Regenerate Scene" buttons per scene, "New Version" button to iterate, project metadata (quality tier, render cost, duration)
- **API:** `GET /api/projects/:id`

### 7.7 Character Library
- **Purpose:** Manage reusable characters for consistency across projects
- **Key elements:** Grid of character cards (reference image, name, description), "Add Character" button, character detail modal (upload reference image, set name, write style notes), delete/edit options
- **API:** `GET /api/characters`, `POST /api/characters`, `PUT /api/characters/:id`, `DELETE /api/characters/:id`

### 7.8 Account / Settings
- **Purpose:** Manage account, subscription, and preferences
- **Key elements:** Profile info (name, email, avatar), subscription management (current plan, upgrade/downgrade, usage stats), billing history, Stripe Customer Portal link, API key management (future), notification preferences
- **API:** `GET /api/billing/subscription`, `POST /api/billing/portal`

### 7.9 Pricing Page
- **Purpose:** Show plan options for conversion
- **Key elements:** Two-tier comparison (Creator vs Studio), feature matrix, FAQ, CTA buttons linking to Stripe Checkout
- **API:** `POST /api/billing/create-checkout`

---

## 8. Project Directory Structure

```
project-root/
├── README.md
├── CLAUDE-CODE-HANDOFF.md          # this document
├── GRAPH-PARSER-FIXES.md           # known issues + fixes for graph.ts
├── package.json
│
├── data/                           # SQLite databases (gitignored)
│   ├── auth.db                     # BetterAuth database
│   └── app.db                      # Application graph database (nodes + relationships)
│
├── src/                            # Astro frontend + API routes
│   ├── layouts/
│   │   └── BaseLayout.astro        # ✅ EXISTS
│   ├── pages/
│   │   ├── index.astro             # Landing page (needs video AI redesign)
│   │   ├── register/               # ✅ EXISTS — org-aware registration
│   │   ├── app/
│   │   │   ├── dashboard.astro     # ✅ EXISTS — needs video AI content
│   │   │   ├── projects.astro      # ✅ EXISTS — needs video AI project types
│   │   │   ├── teams.astro         # ✅ EXISTS
│   │   │   └── settings/           # ✅ EXISTS (partial)
│   │   ├── projects/
│   │   │   ├── new.astro           # ❌ NEW — mode selector (Create/Edit/Hybrid)
│   │   │   ├── [id].astro          # ❌ NEW — project detail / video player
│   │   │   └── [id]/
│   │   │       └── progress.astro  # ❌ NEW — generation progress view
│   │   ├── characters/
│   │   │   └── index.astro         # ❌ NEW — character library
│   │   ├── pricing.astro           # ❌ NEW — subscription tiers
│   │   └── dev/
│   │       └── graph-explorer/     # ✅ EXISTS — graph visualization tool
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── RegisterForm.tsx    # ✅ EXISTS
│   │   │   ├── TeamForm.tsx        # ✅ EXISTS
│   │   │   ├── TeamMemberForm.tsx  # ✅ EXISTS
│   │   │   ├── ProjectForm.tsx     # ✅ EXISTS
│   │   │   ├── ScriptEditor.tsx    # ❌ NEW — script input (React island)
│   │   │   ├── QualitySelector.tsx # ❌ NEW — quality tier picker
│   │   │   ├── FileUploader.tsx    # ❌ NEW — drag-and-drop upload
│   │   │   ├── VideoPlayer.tsx     # ❌ NEW — video playback
│   │   │   ├── ProgressTracker.tsx # ❌ NEW — generation progress
│   │   │   ├── CharacterCard.tsx   # ❌ NEW — character library card
│   │   │   ├── UsageMeter.tsx      # ❌ NEW — subscription usage
│   │   │   └── ClipGallery.tsx     # ❌ NEW — indexed clips viewer
│   ├── api/                        # API route handlers
│   │   ├── register/
│   │   │   └── setup-organization.ts  # ✅ EXISTS
│   │   ├── projects/
│   │   │   ├── create.ts           # ✅ EXISTS (needs video AI fields)
│   │   │   ├── index.ts            # ✅ EXISTS
│   │   │   ├── [id]/
│   │   │   │   ├── assign-team.ts  # ✅ EXISTS
│   │   │   │   ├── teams.ts        # ✅ EXISTS
│   │   │   │   ├── generate.ts     # ❌ NEW — start video generation
│   │   │   │   ├── edit.ts         # ❌ NEW — submit edit instructions
│   │   │   │   └── status.ts       # ❌ NEW — poll generation status
│   │   ├── teams/                  # ✅ EXISTS (create, members/add, members/remove)
│   │   ├── characters/
│   │   │   ├── index.ts            # ❌ NEW — list, create
│   │   │   └── [id].ts             # ❌ NEW — get, update, delete
│   │   ├── assets/
│   │   │   ├── upload.ts           # ❌ NEW — upload footage
│   │   │   ├── [id]/
│   │   │   │   ├── status.ts       # ❌ NEW — indexing status
│   │   │   │   ├── clips.ts        # ❌ NEW — list indexed clips
│   │   │   │   └── search.ts       # ❌ NEW — search clips
│   │   ├── billing/
│   │   │   ├── create-checkout.ts  # ❌ NEW
│   │   │   ├── webhook.ts          # ❌ NEW — Stripe webhook
│   │   │   ├── subscription.ts     # ❌ NEW
│   │   │   └── portal.ts           # ❌ NEW
│   │   └── users/
│   │       └── [id]/
│   │           └── role.ts         # ✅ EXISTS — role management
│   └── lib/
│       ├── auth/
│       │   ├── auth.ts             # ✅ EXISTS — BetterAuth server config
│       │   └── auth-client.ts      # ✅ EXISTS — client-side auth
│       ├── db/
│       │   ├── app.ts              # ✅ EXISTS — app.db connection (appQuery, appExecute)
│       │   ├── graph.ts            # ✅ EXISTS — Cypher-to-SQL parser (see GRAPH-PARSER-FIXES.md)
│       │   └── repositories/
│       │       ├── OrganizationRepository.ts  # ✅ EXISTS
│       │       ├── ProjectRepository.ts       # ✅ EXISTS (needs video AI fields)
│       │       ├── TeamRepository.ts          # ✅ EXISTS
│       │       ├── CharacterRepository.ts     # ❌ NEW
│       │       ├── SceneRepository.ts         # ❌ NEW
│       │       ├── JobRepository.ts           # ❌ NEW
│       │       ├── AssetRepository.ts         # ❌ NEW
│       │       ├── ClipRepository.ts          # ❌ NEW
│       │       ├── VideoRepository.ts         # ❌ NEW
│       │       └── PaymentRepository.ts       # ❌ NEW
│       ├── services/
│       │   ├── AuditService.ts     # ✅ EXISTS — audit logging
│       │   ├── TeamPermissionService.ts  # ✅ EXISTS
│       │   └── PermissionService.ts # ✅ EXISTS (partial)
│       ├── middleware/
│       │   └── requireTeamPermission.ts  # ✅ EXISTS
│       ├── configs/
│       │   └── rbacConfig.js       # ✅ EXISTS (needs Video AI roles)
│       ├── stripe.ts               # ❌ NEW — Stripe client + helpers
│       ├── storage.ts              # ❌ NEW — Azure Blob Storage client
│       ├── queue.ts                # ❌ NEW — BullMQ queue setup
│       └── utils.ts                # ✅ EXISTS (may need extension)
│
├── workers/                        # ❌ NEW — Background job processors
│   ├── generate-worker.ts          # Processes 'generate_video' jobs
│   ├── index-worker.ts             # Processes 'index_footage' jobs
│   └── render-worker.ts            # Processes individual scene render jobs
│
├── director/                       # ❌ NEW — Director Agent (Python)
│   ├── requirements.txt
│   ├── director.py                 # Main orchestrator entry point
│   ├── script_parser.py            # Script → scene decomposition
│   ├── scene_router.py             # Reasoning: which model/quality per scene
│   ├── character_resolver.py       # DeepLake queries for character identity
│   ├── keyframe_generator.py       # FireRed keyframe generation calls
│   ├── render_dispatcher.py        # Dispatch render jobs to GPU workers
│   ├── video_assembler.py          # Remotion composition builder
│   ├── video_indexer.py            # Upload indexing pipeline
│   ├── clip_search.py              # DeepLake similarity search
│   ├── deeplake_client.py          # DeepLake connection + dataset management
│   └── config.py                   # Environment variables, model configs
│
├── gpu-worker/                     # ❌ NEW — GPU inference worker (runs on Lambda)
│   ├── requirements.txt
│   ├── worker.py                   # Main worker: HTTP API for inference requests
│   ├── wangp_inference.py          # WanGP video generation wrapper
│   ├── firered_inference.py        # FireRed keyframe generation wrapper
│   ├── clip_embedder.py            # CLIP embedding generation
│   ├── whisper_transcriber.py      # Whisper audio transcription
│   ├── vlm_describer.py            # VLM scene description generation
│   └── config.py                   # GPU worker configuration
│
├── remotion/                       # ❌ NEW — Remotion video composition
│   ├── package.json
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── VideoComposition.tsx
│   │   ├── SceneTransition.tsx
│   │   └── CaptionOverlay.tsx
│   └── remotion.config.ts
│
├── scripts/
│   ├── setup-azure-storage.sh      # ❌ NEW
│   ├── setup-deeplake.py           # ❌ NEW
│   └── seed-test-data.py           # ❌ NEW
│
├── .env.example
├── .env.local                      # ✅ EXISTS (needs new variables)
├── docker-compose.yml              # ❌ NEW — Redis for local BullMQ
└── tsconfig.json                   # ✅ EXISTS
```

---

## 9. Implementation Phases

### Phase 0: Graph Parser Fixes + Environment Setup (Day 1-2)
- [ ] Apply CRITICAL fixes from GRAPH-PARSER-FIXES.md (Fix 1: mutate race condition)
- [ ] Apply HIGH fixes (Fix 2: updateNode, Fix 3: deleteNode/deleteRelationship, Fix 4: rewrite incoming relationship queries)
- [ ] Verify existing dashboard, teams, projects pages still work after fixes
- [ ] Set up `docker-compose.yml` with Redis for local BullMQ
- [ ] Set up Azure Storage Account and blob containers
- [ ] Set up Stripe account with test keys, create two products (Creator, Studio)
- [ ] Add new environment variables to `.env.local`
- [ ] Test graph-explorer at `/dev/graph-explorer` shows all existing nodes correctly

### Phase 1: New Repositories + Video AI Project Flow (Week 1)
**Goal: Extend existing project system for video AI with STUBBED inference**

- [ ] Create CharacterRepository (following TeamRepository pattern)
- [ ] Create SceneRepository
- [ ] Create JobRepository
- [ ] Create AssetRepository + ClipRepository + VideoRepository
- [ ] Create PaymentRepository
- [ ] Extend existing ProjectRepository with video AI fields (mode, scriptText, qualityTier, status, outputVideoUrl)
- [ ] Add subscription fields to User node (subscriptionTier, stripeCustomerId, usageCount)
- [ ] Wire up Stripe Checkout for subscriptions
- [ ] Wire up Stripe webhook for payment events
- [ ] Build `src/lib/stripe.ts` (Stripe client helpers)
- [ ] Build `src/lib/storage.ts` (Azure Blob Storage client helpers)
- [ ] Build `src/lib/queue.ts` (BullMQ queue setup)
- [ ] Update rbacConfig.js with Video AI roles/views

### Phase 2: Create Mode UI + Stubbed Pipeline (Week 1-2)
**Goal: Full user flow with STUBBED inference**

- [ ] Build New Project page with mode selector (Create/Edit)
- [ ] Build Script Editor component (ScriptEditor.tsx)
- [ ] Build Quality Selector component (QualitySelector.tsx)
- [ ] Build Generation Progress page (ProgressTracker.tsx)
- [ ] Build Video Player / Result page (VideoPlayer.tsx)
- [ ] Build Character Library page + CharacterCard.tsx
- [ ] Build UsageMeter.tsx for subscription tracking
- [ ] Build Pricing page
- [ ] Implement API routes: projects/:id/generate, projects/:id/status
- [ ] Implement API routes: characters CRUD
- [ ] Implement API routes: billing (create-checkout, webhook, subscription, portal)
- [ ] Build `generate-worker.ts` that creates job, calls Director Agent stub, updates status
- [ ] Build STUB Director Agent (`director/director.py`) that:
  - Receives a script via HTTP
  - Parses it into scenes (use Claude API or hardcoded logic)
  - Waits 10-30 seconds (simulating render time)
  - Returns a placeholder video URL
- [ ] Implement usage tracking (increment on generation, check limits before allowing)
- [ ] Update dashboard with video project cards, usage meter, subscription status

**End of Phase 2:** A user can sign up (existing), subscribe (new), paste a script, see progress, and receive a placeholder video. All payment and auth flows work. Inference is stubbed.

### Phase 3: Director Agent — Real Inference (Week 2-3)
**Goal: Replace stubs with actual AI pipeline on Lambda GPU**

- [ ] Set up Lambda Cloud GPU instance (SSH access from MacBook)
- [ ] Install WanGP on Lambda instance, verify first video generation
- [ ] Install FireRed, verify keyframe generation with character consistency
- [ ] Build `gpu-worker/worker.py` — HTTP API exposing inference endpoints
- [ ] Build `director/script_parser.py` — LLM-powered script-to-scenes decomposition
- [ ] Build `director/scene_router.py` — model selection logic per scene
- [ ] Build `director/character_resolver.py` — DeepLake queries for character identity
- [ ] Build `director/keyframe_generator.py` — FireRed calls for each scene
- [ ] Build `director/render_dispatcher.py` — WanGP calls for each scene
- [ ] Build `director/video_assembler.py` — Remotion composition from rendered clips
- [ ] Build `director/deeplake_client.py` — DeepLake connection + dataset init
- [ ] Set up Remotion project (`remotion/` directory)
- [ ] Initialize DeepLake datasets on Azure Blob Storage
- [ ] Connect Director Agent to real GPU inference (HTTP API on Lambda worker)
- [ ] End-to-end test: script → parsed scenes → keyframes → rendered clips → assembled video
- [ ] Document actual render times and costs per quality tier

**End of Phase 3:** A user can paste a real script and receive a real AI-generated video.

### Phase 4: Edit Mode + Video Understanding (Week 3-4)
**Goal: Upload footage, index it, search and assemble**

- [ ] Build FileUploader.tsx component + API endpoint
- [ ] Build `director/video_indexer.py`:
  - PySceneDetect for scene boundaries
  - FFmpeg for clip extraction + keyframe extraction
  - CLIP for visual embeddings (batched — Pattern 1)
  - Whisper for audio transcription
  - VLM for scene descriptions (sequential — Pattern 2)
  - Write all data to DeepLake clip index + Clip graph nodes
- [ ] Build Edit Mode project page (ClipGallery.tsx, instruction input)
- [ ] Build `director/clip_search.py` — DeepLake similarity search
- [ ] Build edit instruction handling in Director Agent
- [ ] Implement Hybrid Mode (script + uploaded footage)
- [ ] End-to-end test: upload video → indexed → search clips → assemble edit

**End of Phase 4:** Both Create and Edit modes work.

### Phase 5: Polish and Launch (Week 4-5)
**Goal: Production-ready for first paying users**

- [ ] Build/redesign Landing page with demo videos (use Google Stitch)
- [ ] Generate 3-5 demo videos across different genres/styles
- [ ] Create comparison content (our output vs Higgsfield, vs raw model output)
- [ ] Error handling and edge cases throughout
- [ ] Rate limiting and abuse prevention
- [ ] Email notifications (Resend: render complete, welcome email)
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Deploy to production Azure VM
- [ ] Set up custom domain and SSL
- [ ] Post demos to r/StableDiffusion, r/AIVideo, AI filmmaking Twitter
- [ ] Monitor first user signups and feedback

**End of Phase 5:** Product is live with paying users.

---

## 10. Infrastructure Setup Details

### Azure Configuration
```
Resource Group: ai-studio-rg
Region: East US (or closest to you)

Storage Account: aistudiostorage
  - Container: media (for all blob storage above)

VM (application): Standard_B2s or D2s_v3
  - OS: Ubuntu 24.04
  - Runs: Astro (Node.js), Redis, BullMQ workers
  - Always-on

Turso: Managed (turso.tech account)
  - Database: ai-studio-prod
  - Local dev: SQLite file
```

### Lambda Cloud Configuration
```
Instance type: 1x A10 (24GB VRAM) or 1x A100 (40/80GB VRAM)
  - Use A10 for development/testing ($0.75/hr approx)
  - Use A100 for Cinema-tier renders
  - Spin up only during active rendering sessions
  - SSH from MacBook for development
  - HTTP API for production render dispatching

Credits: $7,500 available
Estimated burn rate: $5-15/day during active development
```

### Environment Variables (.env.example)
```bash
# Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
# or for local dev:
DATABASE_URL=file:./local.db

# Azure Storage
AZURE_STORAGE_ACCOUNT=aistudiostorage
AZURE_STORAGE_KEY=your-key
AZURE_STORAGE_CONTAINER=media

# Auth (BetterAuth)
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:4321

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CREATOR_PRICE_ID=price_...
STRIPE_STUDIO_PRICE_ID=price_...

# Redis (BullMQ)
REDIS_URL=redis://localhost:6379

# Lambda Cloud GPU Worker
GPU_WORKER_URL=http://your-lambda-ip:8000
GPU_WORKER_API_KEY=your-key

# DeepLake
DEEPLAKE_STORAGE_PATH=azure://aistudiostorage/media/deeplake

# Email (Resend)
RESEND_API_KEY=re_...

# LLM for Director Agent script parsing
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

---

## 11. Key Design Decisions & Constraints

### Decisions Made (do not revisit)
1. **Astro.js for frontend** — existing IP, SSR/SSG hybrid, islands architecture for interactive components
2. **BetterAuth for auth** — existing IP, already integrated
3. **Turso for relational data** — existing IP, SQLite-compatible, edge-ready
4. **DeepLake for tensor data** — embedded library, no server to manage, Azure Blob backend
5. **WanGP for video generation** — model-agnostic, supports all target models, runs on consumer GPUs
6. **FireRed for keyframes** — Apache 2.0, SOTA image editing, identity consistency
7. **Remotion for assembly** — programmatic React-based video composition
8. **Lambda Cloud for GPU** — $7,500 credits available, simpler than Azure GPU quota
9. **Azure for application hosting** — $1,000 credits, general-purpose VMs available
10. **Subscription pricing** — not per-video, reduces friction, encourages iteration
11. **Stub-first development** — build full app with stubbed inference, then plug in real GPU

### Constraints
1. **No local GPU** — 2019 MacBook Pro, Intel Iris Plus. All inference must run on cloud GPU.
2. **Budget-conscious** — $7,500 Lambda credits + $1,000 Azure credits. Minimize idle compute.
3. **Solo developer** — architecture should be simple enough for one person to maintain and debug.
4. **Cloud-first workflow** — code on MacBook, deploy app to Azure VM, SSH into Lambda for GPU work.

### Things NOT to build yet
- Competition marketplace mechanics (voting, predictions, Taste Scores)
- Influencer distribution tools
- Brand bounty system
- Real-time collaborative editing
- Fine-tuned per-user LoRA models
- AutoMQ / Kafka event streaming (use Redis/BullMQ)
- Rivet Actors (use simple job processing)
- Vineyard / 3FS / M3FS (use standard file I/O)
- FastVideo inference optimization (use WanGP)
- SGLang / vLLM serving infrastructure (use standard Transformers inference)

### Things ALREADY built (do not rebuild)
- ✅ BetterAuth with email/password, sessions, server-side `auth.api.getSession()`
- ✅ Dual database: auth.db (BetterAuth) + app.db (graph nodes + relationships)
- ✅ Graph abstraction layer (`graph.ts`) with Cypher-like query interface
- ✅ Organization → Project → Team → User hierarchy as graph nodes
- ✅ Repository pattern: OrganizationRepository, ProjectRepository, TeamRepository
- ✅ RBAC: Admin/User/Viewer roles, team permissions, permission middleware
- ✅ Audit logging service (AuditService.ts)
- ✅ Graph explorer visualization (`/dev/graph-explorer`)
- ✅ Organization-aware registration flow
- ✅ Dashboard, Teams, Projects pages (need video AI content updates)
- ✅ Team management UI with member add/remove/role change
- ✅ Project create/list/assign-team API endpoints

### Google Stitch Workflow
- Design screens in Google Stitch before implementing each page
- Use Stitch's multi-screen generation for connected flows
- Export designs as reference for implementation
- Use Stitch's MCP integration with Claude Code if available
- DESIGN.md from Stitch can guide component styling consistency

### Event Modeling
- The event flows in Section 5 follow Adam Dymitruk's event modeling approach
- Focus on the two primary flows (Create Mode and Edit Mode) for now
- Each event triggers the next stage — no polling except for frontend status checks
- The event model serves as the behavioral specification for Claude Code implementation

---

## 12. Communication with GPU Worker

The Director Agent (Python, running on Azure VM or locally) communicates with the GPU Worker (Python, running on Lambda Cloud) via a simple HTTP API. This keeps the two layers cleanly separated.

### GPU Worker API (runs on Lambda instance)

```python
# Endpoints the GPU worker exposes:

POST /generate-video
  Body: { "prompt": str, "model": str, "quality": str, "keyframe_url": str, ... }
  Returns: { "clip_url": str, "duration": float }

POST /generate-keyframe
  Body: { "character_embedding": tensor, "scene_description": str, ... }
  Returns: { "keyframe_url": str }

POST /embed-frames
  Body: { "frame_urls": [str, ...] }
  Returns: { "embeddings": [[float, ...], ...] }

POST /transcribe
  Body: { "audio_url": str }
  Returns: { "transcript": str, "segments": [...] }

POST /describe-scene
  Body: { "clip_url": str }
  Returns: { "description": str, "scene_type": str }

GET /health
  Returns: { "status": "ok", "gpu": "A10", "vram_free": "18GB" }
```

The Director Agent calls these endpoints when it needs GPU work done. The GPU worker processes the request using WanGP/FireRed/CLIP/Whisper/VLM and returns results. Files are exchanged via Azure Blob Storage URLs — the Director writes inputs to blob storage, passes URLs to the GPU worker, and the GPU worker writes outputs back to blob storage.

---

*End of handoff document. This provides Claude Code with everything needed to begin implementation starting from Phase 0.*
