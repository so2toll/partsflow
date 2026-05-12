#!/usr/bin/env node

/**
 * ElevenLabs Voiceover Generator
 *
 * Usage:
 *   1. Set your API key: export ELEVENLABS_API_KEY="your_key"
 *   2. Run: node generate-voiceover.js
 *
 * Or provide API key as argument:
 *   node generate-voiceover.js YOUR_API_KEY
 */

const fs = require('fs');
const https = require('https');

const VOICE_ID = 'XrExE9yKIg1WjnnlVkGX'; // Matilda voice
const API_KEY = process.argv[2] || process.env.ELEVENLABS_API_KEY;

const SCRIPT = `Children are waiting for your support. Join a team that truly values your skills and experience.

Skip the resume black hole. Verify your credentials quickly and get interviewed immediately. No waiting, no endless applications.

Scan the code or text us now. Your next chapter starts here. Make the difference you were meant to make.`;

if (!API_KEY) {
  console.error('❌ Error: ElevenLabs API key not found.');
  console.error('');
  console.error('Please provide your API key in one of these ways:');
  console.error('  1. Environment variable: export ELEVENLABS_API_KEY="your_key"');
  console.error('  2. Command argument: node generate-voiceover.js YOUR_API_KEY');
  console.error('');
  console.error('Get your API key at: https://elevenlabs.io/');
  process.exit(1);
}

console.log('🎙️  Generating voiceover with ElevenLabs...');
console.log('Voice: Matilda');
console.log('');

const postData = JSON.stringify({
  text: SCRIPT,
  model_id: 'eleven_monolingual_v1',
  voice_settings: {
    stability: 0.6,
    similarity_boost: 0.75,
    style: 0.35,
    use_speaker_boost: true,
  },
});

const options = {
  hostname: 'api.elevenlabs.io',
  port: 443,
  path: `/v1/text-to-speech/${VOICE_ID}`,
  method: 'POST',
  headers: {
    'Accept': 'audio/mpeg',
    'Content-Type': 'application/json',
    'xi-api-key': API_KEY,
    'Content-Length': postData.length,
  },
};

const req = https.request(options, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ Error: API returned status ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.error(chunk.toString());
    });
    process.exit(1);
  }

  const chunks = [];

  res.on('data', (chunk) => {
    chunks.push(chunk);
    process.stdout.write('.');
  });

  res.on('end', () => {
    console.log('');
    const buffer = Buffer.concat(chunks);
    const outputPath = './assets/voiceover.mp3';

    fs.writeFileSync(outputPath, buffer);

    console.log('');
    console.log('✅ Voiceover generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Uncomment voiceover Audio in src/Composition.tsx');
    console.log('  2. Run: npm start');
    console.log('  3. Preview your video!');
    console.log('');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
