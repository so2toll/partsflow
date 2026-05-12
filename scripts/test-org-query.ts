/**
 * Test Organization Query
 *
 * Direct test of the GraphDB query to find the organization
 */

import { graph } from "../src/lib/db/graph";

async function testOrgQuery() {
  console.log("[Test] Testing Organization query...\n");

  const orgId = "org_01KQE7CS82VSADTR04TFAM0R5T";

  // Test 1: Simple MATCH query
  console.log("[Test] Query 1: MATCH (o:Organization {id: $id}) RETURN o");
  try {
    const results = await graph.query<any>(
      `
      MATCH (o:Organization {id: $id})
      RETURN o
      `,
      { id: orgId }
    );
    console.log("[Test] Results:", JSON.stringify(results, null, 2));
  } catch (error: any) {
    console.error("[Test] Error:", error.message);
  }

  console.log("\n---\n");

  // Test 2: Raw SQL query
  console.log("[Test] Query 2: Raw SQL SELECT");
  const { appQuery } = await import("../src/lib/db/app");
  try {
    const rows = await appQuery<any>(
      `SELECT * FROM nodes WHERE label = ? AND json_extract(properties, '$.id') = ?`,
      ["Organization", orgId]
    );
    console.log("[Test] SQL Results:", JSON.stringify(rows, null, 2));

    if (rows.length > 0) {
      const row = rows[0];
      const props = typeof row.properties === "string" ? JSON.parse(row.properties) : row.properties;
      console.log("\n[Test] Organization Name:", props.name);
    }
  } catch (error: any) {
    console.error("[Test] SQL Error:", error.message);
  }
}

testOrgQuery().then(() => process.exit(0));
