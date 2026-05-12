/**
 * GPU Worker API Test Script
 *
 * Simple test script to verify GPU worker endpoints are working correctly.
 * This can be run manually to test the mock endpoints.
 *
 * @module pages/api/internal/gpu/test-endpoints
 * @version 1.0.0
 */

const BASE_URL = 'http://localhost:4321';

// ============================================================================
// Test 1: Generate Keyframe
// ============================================================================

async function testGenerateKeyframe() {
  console.log('🧪 Test 1: Generate Keyframe');
  console.log('================================');

  try {
    const response = await fetch(`${BASE_URL}/api/internal/gpu/generate-keyframe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId: 'test_scene_001',
        prompt: 'A beautiful sunset over mountains',
        style: 'cinematic',
        quality: 'draft',
        frameNumber: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ Keyframe generation started');
    console.log('   Job ID:', data.jobId);
    console.log('   Keyframe ID:', data.keyframeId);
    console.log('   Estimated time:', data.estimatedTimeSeconds, 'seconds');

    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// ============================================================================
// Test 2: Generate Scene
// ============================================================================

async function testGenerateScene() {
  console.log('\n🧪 Test 2: Generate Scene');
  console.log('=========================');

  try {
    const response = await fetch(`${BASE_URL}/api/internal/gpu/generate-scene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId: 'test_scene_002',
        script: 'A peaceful meadow with flowers swaying in the breeze',
        duration: 3, // Short duration for testing
        quality: 'draft',
        fps: 24,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ Scene generation started');
    console.log('   Job ID:', data.jobId);
    console.log('   Scene ID:', data.sceneId);
    console.log('   Total frames:', data.totalFrames);
    console.log('   Estimated time:', data.estimatedTimeSeconds, 'seconds');

    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// ============================================================================
// Test 3: Check Job Status
// ============================================================================

async function testJobStatus(jobId: string) {
  console.log('\n🧪 Test 3: Check Job Status');
  console.log('===========================');

  try {
    const response = await fetch(`${BASE_URL}/api/internal/gpu/status/${jobId}`);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ Job status retrieved');
    console.log('   Job ID:', data.jobId);
    console.log('   Job Type:', data.jobType);
    console.log('   State:', data.state);
    console.log('   Progress:', data.progress + '%');

    if (data.state === 'completed') {
      console.log('   ✅ Completed!');
      if (data.keyframeUrl) {
        console.log('   Keyframe URL:', data.keyframeUrl);
      }
      if (data.sceneUrl) {
        console.log('   Scene URL:', data.sceneUrl);
      }
    } else if (data.state === 'failed') {
      console.log('   ❌ Failed:', data.errorMessage);
    }

    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// ============================================================================
// Test 4: Poll Job Until Complete
// ============================================================================

async function testPollJob(jobId: string, description: string) {
  console.log(`\n🧪 Test 4: Poll Job - ${description}`);
  console.log('================================');

  const maxAttempts = 30; // 30 seconds max for draft quality
  const pollInterval = 1000; // 1 second

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/api/internal/gpu/status/${jobId}`);

      if (!response.ok) {
        console.error('❌ Failed to get status');
        return false;
      }

      const data = await response.json();
      console.log(`   [${attempt + 1}s] Progress: ${data.progress}% - State: ${data.state}`);

      if (data.state === 'completed') {
        console.log('   ✅ Job completed successfully!');
        if (data.keyframeUrl) {
          console.log('   Keyframe URL:', data.keyframeUrl);
        }
        if (data.sceneUrl) {
          console.log('   Scene URL:', data.sceneUrl);
        }
        return true;
      }

      if (data.state === 'failed') {
        console.log('   ❌ Job failed:', data.errorMessage);
        return false;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('❌ Error:', error);
      return false;
    }
  }

  console.log('   ⏱️ Polling timeout');
  return false;
}

// ============================================================================
// Run All Tests
// ============================================================================

export async function runAllTests() {
  console.log('🚀 GPU Worker API Test Suite');
  console.log('============================\n');

  // Test 1: Generate keyframe and poll
  console.log('📦 Test Suite 1: Keyframe Generation');
  console.log('====================================\n');

  const keyframeJob = await testGenerateKeyframe();
  if (keyframeJob) {
    await testPollJob(keyframeJob.jobId, 'Keyframe Generation');
  }

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Generate scene and poll
  console.log('\n📦 Test Suite 2: Scene Generation');
  console.log('==================================\n');

  const sceneJob = await testGenerateScene();
  if (sceneJob) {
    await testPollJob(sceneJob.jobId, 'Scene Generation');
  }

  console.log('\n✅ All tests completed!');
}

// ============================================================================
// Usage
// ============================================================================

if (import.meta.main) {
  runAllTests().catch(console.error);
}
