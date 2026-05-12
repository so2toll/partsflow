/**
 * GraphDB Demo Script
 *
 * Demonstrates how to use the graph abstraction layer
 * for your video inferencing and AI content studio.
 *
 * Run with: TURSO_DATABASE_URL="file:./data/app.db" npx tsx scripts/graph-demo.ts
 */

// Set environment for local development
if (!process.env.TURSO_DATABASE_URL) {
  process.env.TURSO_DATABASE_URL = "file:./data/app.db";
}

import { graph } from "../src/lib/db/graph";
import { ulid } from "ulid";

async function main() {
  console.log("🕸️  GraphDB Demo\n");

  // ========================================================================
  // 1. Create a video
  // ========================================================================
  console.log("1. Creating a video node...");

  const videoId = `vid_demo_${ulid()}`;
  const video = await graph.mutate(
    `
    CREATE (v:Video {
      id: $id,
      title: $title,
      url: $url,
      duration: $duration,
      createdAt: $now
    })
    RETURN v
    `,
    {
      id: videoId,
      title: "Demo Video - Product Showcase",
      url: "https://example.com/demo-product.mp4",
      duration: 180,
      now: new Date().toISOString(),
    }
  );

  console.log(`✅ Created video: ${video.id}`);
  console.log(`   Title: ${video.properties?.title}`);
  console.log(`   Duration: ${video.properties?.duration}s\n`);

  // ========================================================================
  // 2. Create an AI model
  // ========================================================================
  console.log("2. Creating an AI model node...");

  const modelId = `mdl_demo_${ulid()}`;
  const model = await graph.mutate(
    `
    CREATE (m:AIModel {
      id: $id,
      name: $name,
      version: $version,
      type: $type,
      createdAt: $now
    })
    RETURN m
    `,
    {
      id: modelId,
      name: "YOLOv8",
      version: "2024.1",
      type: "object_detection",
      now: new Date().toISOString(),
    }
  );

  console.log(`✅ Created model: ${model.id}`);
  console.log(`   Name: ${model.properties?.name}`);
  console.log(`   Type: ${model.properties?.type}\n`);

  // ========================================================================
  // 3. Create scenes
  // ========================================================================
  console.log("3. Creating scene nodes...");

  const scene1Id = `scn_demo_${ulid()}`;
  const scene2Id = `scn_demo_${ulid()}`;

  await graph.mutate(
    `
    CREATE (s:Scene {
      id: $id,
      videoId: $videoId,
      startTime: $startTime,
      endTime: $endTime,
      description: $description,
      orderIndex: $orderIndex,
      createdAt: $now
    })
    RETURN s
    `,
    {
      id: scene1Id,
      videoId,
      startTime: 0,
      endTime: 30,
      description: "Product introduction",
      orderIndex: 1,
      now: new Date().toISOString(),
    }
  );

  await graph.mutate(
    `
    CREATE (s:Scene {
      id: $id,
      videoId: $videoId,
      startTime: $startTime,
      endTime: $endTime,
      description: $description,
      orderIndex: $orderIndex,
      createdAt: $now
    })
    RETURN s
    `,
    {
      id: scene2Id,
      videoId,
      startTime: 30,
      endTime: 60,
      description: "Feature demonstration",
      orderIndex: 2,
      now: new Date().toISOString(),
    }
  );

  console.log(`✅ Created scenes: ${scene1Id}, ${scene2Id}\n`);

  // ========================================================================
  // 4. Create relationships
  // ========================================================================
  console.log("4. Creating relationships...");

  // Video -> Scene relationships
  await graph.createRelationship(videoId, scene1Id, "HAS_SCENE", {
    order: 1,
  });
  await graph.createRelationship(videoId, scene2Id, "HAS_SCENE", {
    order: 2,
  });

  // Video -> Model relationship
  await graph.createRelationship(videoId, modelId, "PROCESSED_BY", {
    timestamp: new Date().toISOString(),
  });

  console.log(`✅ Created relationships:\n`);
  console.log(`   ${videoId} -[:HAS_SCENE]-> ${scene1Id}`);
  console.log(`   ${videoId} -[:HAS_SCENE]-> ${scene2Id}`);
  console.log(`   ${videoId} -[:PROCESSED_BY]-> ${modelId}\n`);

  // ========================================================================
  // 5. Create detections
  // ========================================================================
  console.log("5. Creating detection nodes...");

  const detection1Id = `det_demo_${ulid()}`;
  const detection2Id = `det_demo_${ulid()}`;

  await graph.mutate(
    `
    CREATE (d:Detection {
      id: $id,
      sceneId: $sceneId,
      label: $label,
      confidence: $confidence,
      boundingBox: $boundingBox,
      timestamp: $timestamp
    })
    RETURN d
    `,
    {
      id: detection1Id,
      sceneId: scene1Id,
      label: "product_box",
      confidence: 0.95,
      boundingBox: { x: 100, y: 150, width: 200, height: 300 },
      timestamp: 5.2,
    }
  );

  await graph.mutate(
    `
    CREATE (d:Detection {
      id: $id,
      sceneId: $sceneId,
      label: $label,
      confidence: $confidence,
      boundingBox: $boundingBox,
      timestamp: $timestamp
    })
    RETURN d
    `,
    {
      id: detection2Id,
      sceneId: scene2Id,
      label: "person",
      confidence: 0.87,
      boundingBox: { x: 300, y: 100, width: 150, height: 400 },
      timestamp: 35.8,
    }
  );

  // Scene -> Detection relationships
  await graph.createRelationship(scene1Id, detection1Id, "HAS_DETECTION", {
    confidence: 0.95,
  });
  await graph.createRelationship(scene2Id, detection2Id, "HAS_DETECTION", {
    confidence: 0.87,
  });

  console.log(`✅ Created detections:\n`);
  console.log(`   ${scene1Id} -[:HAS_DETECTION]-> ${detection1Id} (product_box)`);
  console.log(`   ${scene2Id} -[:HAS_DETECTION]-> ${detection2Id} (person)\n`);

  // ========================================================================
  // 6. Query the graph
  // ========================================================================
  console.log("6. Querying the graph...\n");

  // Query 1: Get video with scenes
  console.log("📊 Query 1: Video with scenes");
  console.log("Cypher:");
  console.log(`
    MATCH (v:Video {id: $id})-[:HAS_SCENE]->(s:Scene)
    RETURN v, collect(s) as scenes
  `);

  const result1 = await graph.query(
    `
    MATCH (v:Video {id: $id})-[:HAS_SCENE]->(s:Scene)
    RETURN v, collect(s) as scenes
    `,
    { id: videoId }
  );

  console.log("\nResult:");
  console.log(JSON.stringify(result1, null, 2));
  console.log();

  // Query 2: Get video with scenes and detections
  console.log("📊 Query 2: Video with scenes and detections");
  console.log("Cypher:");
  console.log(`
    MATCH (v:Video {id: $id})-[:HAS_SCENE]->(s:Scene)-[:HAS_DETECTION]->(d:Detection)
    RETURN v, s, d
  `);

  const result2 = await graph.query(
    `
    MATCH (v:Video {id: $id})-[:HAS_SCENE]->(s:Scene)-[:HAS_DETECTION]->(d:Detection)
    RETURN v, s, d
    `,
    { id: videoId }
  );

  console.log("\nResult:");
  console.log(JSON.stringify(result2, null, 2));
  console.log();

  // Query 3: Get all nodes for visualization
  console.log("📊 Query 3: All graph data (for visualization)");
  console.log("Cypher:");
  console.log(`
    MATCH (n)
    RETURN n
    LIMIT 20
  `);

  const result3 = await graph.query(
    `
    MATCH (n)
    RETURN n
    LIMIT 20
    `
  );

  console.log("\nResult:");
  console.log(`Total nodes: ${result3.length}`);
  console.log(
    `Node types: ${[...new Set(result3.map((r) => r.n?.label))].join(", ")}`
  );
  console.log();

  // ========================================================================
  // 7. Get full graph data for visualization
  // ========================================================================
  console.log("7. Getting full graph data...\n");

  const { nodes, relationships } = await graph.getGraphData(50);

  console.log(`📈 Graph Statistics:`);
  console.log(`   Total nodes: ${nodes.length}`);
  console.log(`   Total relationships: ${relationships.length}`);
  console.log(`\n   Node breakdown:`);

  const nodeCounts = nodes.reduce((acc, node) => {
    acc[node.label] = (acc[node.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(nodeCounts).forEach(([label, count]) => {
    console.log(`      ${label}: ${count}`);
  });

  console.log(`\n   Relationship breakdown:`);

  const relCounts = relationships.reduce((acc, rel) => {
    acc[rel.type] = (acc[rel.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(relCounts).forEach(([type, count]) => {
    console.log(`      ${type}: ${count}`);
  });

  console.log("\n✅ Demo complete!");
  console.log("\n💡 Next steps:");
  console.log("   1. Run the migration: sqlite3 data/app.db < migrations/create_graph_schema.sql");
  console.log("   2. Start your dev server: npm run dev");
  console.log("   3. Visit the graph explorer: http://localhost:3000/dev/graph-explorer");
  console.log("   4. Create repositories using the graph operations");
  console.log("   5. Use Arrows.app to design your schema\n");
}

// Run the demo
main().catch(console.error);
