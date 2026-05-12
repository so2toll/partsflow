# GraphDB - Graph Abstraction Layer for SQL

A Cypher-like query interface for SQLite/Turso that lets you think in graphs while storing data in SQL.

## What This Is

- **GraphDB Abstraction Layer**: Translates Cypher-like queries to SQL
- **Storage**: Uses SQLite (local) or Turso (production) - no graph database needed
- **Visualization**: Dev-only graph explorer to visualize your data like Neo4j Bloom
- **Repository Pattern**: Clean separation - all DB operations in repositories using graph queries

## Architecture

```
Your Code (.astro/.ts files)
  ↓ calls
Repositories (VideoRepository, etc.)
  ↓ use
GraphDB Layer (Cypher → SQL translation)
  ↓ stores in
SQLite (local) / Turso (prod)
  ↓ visualize in
Graph Explorer (dev-only route)
```

## Quick Start

### 1. Run the Migration

Create the graph schema tables:

```bash
# Local SQLite
sqlite3 data/app.db < migrations/create_graph_schema.sql

# Turso (production)
turso db execute <database-name> -f migrations/create_graph_schema.sql
```

### 2. Run the Demo

See the graph system in action:

```bash
npm run graph-demo
# or
npx tsx scripts/graph-demo.ts
```

### 3. Use in Your Code

**In a repository (`src/lib/db/repositories/VideoRepository.ts`):**

```typescript
import { graph } from '@/lib/db/graph';

export class VideoRepository {
  async findById(id: string) {
    const results = await graph.query(`
      MATCH (v:Video {id: $id})
      RETURN v
    `, { id });
    return results[0]?.v;
  }

  async findWithScenes(videoId: string) {
    return await graph.query(`
      MATCH (v:Video {id: $id})-[:HAS_SCENE]->(s:Scene)
      RETURN v, collect(s) as scenes
    `, { id: videoId });
  }

  async create(data) {
    return await graph.mutate(`
      CREATE (v:Video {
        id: $id,
        title: $title,
        url: $url
      })
      RETURN v
    `, data);
  }
}
```

**In an Astro page:**

```astro
---
import { videoRepository } from '@/lib/db/repositories/VideoRepository';

const video = await videoRepository.findById('vid_123');
const videoWithScenes = await videoRepository.findWithScenes('vid_123');
---

<h1>{video.title}</h1>
{videoWithScenes.scenes.map(scene => (
  <div>{scene.description}</div>
))}
```

### 4. Visualize in Dev

Visit the graph explorer:

```
http://localhost:3000/dev/graph-explorer
```

See your data as an interactive graph with:
- Node visualization by type
- Relationship traversal
- Ad-hoc query execution
- Color-coded node types

## Graph Query Syntax

Supports Cypher-like syntax:

### MATCH Queries

```cypher
-- Find a node by ID
MATCH (v:Video {id: $id})
RETURN v

-- Find relationships
MATCH (v:Video)-[:HAS_SCENE]->(s:Scene)
RETURN v, s

-- Complex traversal
MATCH (v:Video)-[:HAS_SCENE]->(s:Scene)-[:HAS_DETECTION]->(d:Detection)
WHERE d.confidence > 0.8
RETURN v, s, d
LIMIT 10
```

### CREATE Queries

```cypher
-- Create a node
CREATE (v:Video {
  id: $id,
  title: $title,
  url: $url
})
RETURN v

-- Create relationships via API
await graph.createRelationship(
  fromNodeId,
  toNodeId,
  'HAS_SCENE',
  { order: 1 }
);
```

## Schema Design

Use [Arrows.app](https://arrows.app) to design your graph schema:

1. **Design nodes**: Video, Scene, Detection, AIModel, Project, Asset
2. **Draw relationships**: HAS_SCENE, HAS_DETECTION, PROCESSED_BY
3. **Export/import**: Use as reference for implementation
4. **Iterate**: Update schema as needed

## Storage Model

**Nodes Table:**
```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  properties TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);
```

**Relationships Table:**
```sql
CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  properties TEXT DEFAULT '{}',
  created_at TEXT,
  FOREIGN KEY (from_node_id) REFERENCES nodes(id),
  FOREIGN KEY (to_node_id) REFERENCES nodes(id)
);
```

## Example Graph Schema for Video/AI Content Studio

```
(Video)-[:HAS_SCENE]->(Scene)
(Scene)-[:HAS_DETECTION]->(Detection)
(Video)-[:PROCESSED_BY]->(AIModel)
(Project)-[:CONTAINS]->(Video)
(Asset)-[:LINKED_TO]->(Video)
(User)-[:CREATED]->(Video)
(User)-[:OWNS]->(Project)
```

## Files Created

- `src/lib/db/graph.ts` - GraphDB abstraction layer
- `src/pages/dev/graph-explorer.astro` - Graph visualization UI
- `src/pages/dev/api/graph-query.ts` - Query API endpoint
- `src/lib/db/repositories/VideoRepository.example.ts` - Example repository
- `migrations/create_graph_schema.sql` - Database schema migration
- `scripts/graph-demo.ts` - Demo script

## Next Steps

1. **Design your schema** using Arrows.app
2. **Run the migration** to create tables
3. **Create repositories** for your domain entities
4. **Use graph queries** for complex traversals
5. **Visualize data** in the graph explorer during development
6. **Keep simple CRUD** as repository methods
7. **Use graph queries** for relationship-heavy operations

## Benefits

✅ **Graph mental model** - Think in nodes and relationships
✅ **SQL storage** - SQLite/Turso, no graph DB needed
✅ **Clean separation** - Repositories encapsulate DB operations
✅ **Dev visualization** - See your data as a graph
✅ **Portable** - Just SQL underneath, no vendor lock-in
✅ **Familiar syntax** - Cypher-like queries if you know Neo4j

## Notes

- Graph explorer is **dev-only** - remove or protect in production
- Queries are logged to console for debugging
- JSON stored in TEXT columns for properties
- Cascade deletes set up for relationships
- Indexed for common query patterns
