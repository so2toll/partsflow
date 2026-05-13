#!/usr/bin/env node

/**
 * Migration Script: Fix Driver Architecture
 *
 * This script fixes the driver architecture to use clean auth roles:
 * - auth.db: Only "SuperAdmin" | "User" roles
 * - app.db: User.workerType for worker classification
 * - Driver operational data stays in separate Driver node
 *
 * Run: node .migrations/fix-driver-architecture.js
 */

import Database from 'better-sqlite3';
import { ulid } from 'ulid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database paths
const authDbPath = path.resolve(process.cwd(), 'data/auth.db');
const appDbPath = path.resolve(process.cwd(), 'data/app.db');

console.log('🔧 Starting Driver Architecture Migration...\n');

// Connect to databases
const authDb = new Database(authDbPath);
const appDb = new Database(appDbPath);

try {
  // ========================================
  // STEP 1: Fix auth.db (Driver -> User)
  // ========================================
  console.log('📋 STEP 1: Fixing auth.db roles...');

  const driversToUpdate = authDb
    .prepare('SELECT id, email, role FROM user WHERE role = ?')
    .all('Driver');

  if (driversToUpdate.length === 0) {
    console.log('   ✅ No driver roles found in auth.db (already fixed)');
  } else {
    console.log(`   Found ${driversToUpdate.length} driver(s) to update:`);
    driversToUpdate.forEach((d) => {
      console.log(`   - ${d.email} (${d.id})`);
    });

    const updateStmt = authDb.prepare('UPDATE user SET role = ? WHERE id = ?');
    const updateMany = authDb.transaction((drivers) => {
      for (const driver of drivers) {
        updateStmt.run('User', driver.id);
      }
    });

    updateMany(driversToUpdate);
    console.log('   ✅ Updated driver roles to "User"');
  }

  // ========================================
  // STEP 2: Fix app.db User nodes
  // ========================================
  console.log('\n📋 STEP 2: Fixing app.db nodes...');

  // Find all Driver label nodes
  const driverNodes = appDb
    .prepare('SELECT id, properties FROM nodes WHERE label = ?')
    .all('Driver');

  if (driverNodes.length === 0) {
    console.log('   ✅ No Driver nodes found (already fixed)');
  } else {
    console.log(`   Found ${driverNodes.length} Driver node(s):`);

    for (const driverNode of driverNodes) {
      const props = JSON.parse(driverNode.properties);
      console.log(`   - ${driverNode.id}`);

      // Check if there's a corresponding User node
      // (The onboarding should have created a User node with IS_DRIVER relationship)
      const userRelationship = appDb
        .prepare(
          'SELECT from_node_id FROM relationships WHERE to_node_id = ? AND type = ?'
        )
        .get(driverNode.id, 'IS_DRIVER');

      if (userRelationship) {
        const userId = userRelationship.from_node_id;

        // Update User node to have workerType: 'Driver'
        const userNode = appDb
          .prepare('SELECT properties FROM nodes WHERE id = ? AND label = ?')
          .get(userId, 'User');

        if (userNode) {
          const userProps = JSON.parse(userNode.properties);

          // Add workerType if not present
          if (!userProps.workerType) {
            userProps.workerType = 'Driver';
            userProps.updatedAt = new Date().toISOString();

            appDb
              .prepare('UPDATE nodes SET properties = ? WHERE id = ?')
              .run(JSON.stringify(userProps), userId);

            console.log(`     ✅ Added workerType: 'Driver' to User node ${userId}`);
          } else {
            console.log(`     ✅ User node ${userId} already has workerType`);
          }
        } else {
          console.log(`     ⚠️  No User node found for ${userId}`);
        }
      } else {
        console.log(`     ⚠️  No IS_DRIVER relationship found for ${driverNode.id}`);
      }
    }
  }

  // ========================================
  // STEP 3: Verification
  // ========================================
  console.log('\n📋 STEP 3: Verification...');

  // Check auth.db
  const authRoles = authDb
    .prepare('SELECT role, COUNT(*) as count FROM user GROUP BY role')
    .all();
  console.log('   auth.db roles:');
  authRoles.forEach((r) => {
    console.log(`   - ${r.role}: ${r.count} user(s)`);
  });

  // Check app.db nodes
  const appNodes = appDb
    .prepare(
      'SELECT label, COUNT(*) as count FROM nodes WHERE label IN (?, ?) GROUP BY label'
    )
    .all('User', 'Driver');
  console.log('\n   app.db nodes:');
  appNodes.forEach((n) => {
    console.log(`   - ${n.label}: ${n.count} node(s)`);
  });

  // Check User nodes with workerType
  const workerTypes = appDb
    .prepare(
      `SELECT json_extract(properties, '$.workerType') as workerType, COUNT(*) as count
       FROM nodes
       WHERE label = 'User' AND json_extract(properties, '$.workerType') IS NOT NULL
       GROUP BY json_extract(properties, '$.workerType')`
    )
    .all();
  console.log('\n   User nodes by workerType:');
  workerTypes.forEach((wt) => {
    console.log(`   - ${wt.workerType}: ${wt.count} user(s)`);
  });

  console.log('\n✅ Migration complete!\n');

  // Show any remaining issues
  const remainingIssues = [];

  // Check for any remaining Driver roles in auth.db
  const remainingDrivers = authDb
    .prepare("SELECT COUNT(*) as count FROM user WHERE role = 'Driver'")
    .get();
  if (remainingDrivers.count > 0) {
    remainingIssues.push(
      `⚠️  Still have ${remainingDrivers.count} Driver roles in auth.db`
    );
  }

  if (remainingIssues.length > 0) {
    console.log('⚠️  Remaining issues:');
    remainingIssues.forEach((issue) => console.log(issue));
    console.log('');
  }
} catch (error) {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
} finally {
  authDb.close();
  appDb.close();
}
