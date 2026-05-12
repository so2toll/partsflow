# Voiceover Generation Guide

This guide explains how to generate the voiceover for the recruitment video using ElevenLabs.

## Voice Selection

**Selected Voice:** Matilda
**Voice ID:** `XrExE9yKIg1WjnnlVkGX`
**Characteristics:** Warm, confident female voice, professional yet approachable

## Script with Exact Timing

Total Duration: 30 seconds

### Scene 1 (0-6 seconds)
```
Atlanta Mental health clinicians: Local schools need your expertise.
```
**Duration:** ~5 seconds
**Tone:** Professional, inviting, authoritative

---

### Scene 2 (6-13 seconds)
```
Children are waiting for your support. Join a team that values your skills.
```
**Duration:** ~6 seconds
**Tone:** Warm, emotional, encouraging

---

### Scene 3 (13-21 seconds)
```
Skip the resume black hole. Verify your credentials quickly and get interviewed immediately.
```
**Duration:** ~7 seconds
**Tone:** Energetic, solution-focused, professional

---

### Scene 4 (21-30 seconds)
```
Scan the code or text us now. Your next chapter starts here.
```
**Duration:** ~8 seconds
**Tone:** Clear call-to-action, warm, inviting

---

## Generation Methods

### Option 1: ElevenLabs Web Interface

1. Go to https://elevenlabs.io
2. Select the Matilda voice
3. Paste the complete script (all scenes combined)
4. Adjust settings:
   - **Stability:** 0.5-0.6 (balanced)
   - **Clarity:** 0.7-0.8 (clear speech)
   - **Style Exaggeration:** 0.3-0.4 (natural)
5. Generate audio
6. Download as MP3
7. Save to `remotion/assets/voiceover.mp3`

### Option 2: ElevenLabs API (Python)

```python
import requests
import os

ELEVENLABS_API_KEY = "your_api_key_here"
VOICE_ID = "XrExE9yKIg1WjnnlVkGX"  # Matilda

script = """
Atlanta Mental health clinicians: Local schools need your expertise.

Children are waiting for your support. Join a team that values your skills.

Skip the resume black hole. Verify your credentials quickly and get interviewed immediately.

Scan the code or text us now. Your next chapter starts here.
"""

url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": ELEVENLABS_API_KEY
}

data = {
    "text": script,
    "model_id": "eleven_monolingual_v1",
    "voice_settings": {
        "stability": 0.6,
        "similarity_boost": 0.75,
        "style": 0.35,
        "use_speaker_boost": True
    }
}

response = requests.post(url, json=data, headers=headers)

if response.status_code == 200:
    with open("assets/voiceover.mp3", "wb") as f:
        f.write(response.content)
    print("Voiceover generated successfully!")
else:
    print(f"Error: {response.status_code} - {response.text}")
```

### Option 3: ElevenLabs API (Node.js)

```javascript
const fs = require('fs');
const axios = require('axios');

const ELEVENLABS_API_KEY = 'your_api_key_here';
const VOICE_ID = 'XrExE9yKIg1WjnnlVkGX'; // Matilda

const script = `
Atlanta Mental health clinicians: Local schools need your expertise.

Children are waiting for your support. Join a team that values your skills.

Skip the resume black hole. Verify your credentials quickly and get interviewed immediately.

Scan the code or text us now. Your next chapter starts here.
`;

async function generateVoiceover() {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  try {
    const response = await axios.post(
      url,
      {
        text: script,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        responseType: 'arraybuffer',
      }
    );

    fs.writeFileSync('assets/voiceover.mp3', response.data);
    console.log('Voiceover generated successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateVoiceover();
```

## Verification Steps

After generating the voiceover:

1. **Listen to the entire audio** to ensure:
   - Clear pronunciation
   - Appropriate pacing (not too fast or slow)
   - Natural pauses between sentences
   - Warm, professional tone throughout

2. **Check timing** using Whisper or similar:
   ```bash
   # Install whisper
   pip install openai-whisper

   # Transcribe with timestamps
   whisper assets/voiceover.mp3 --model base --language en --task transcribe
   ```

3. **Verify scene alignment:**
   - Scene 1 ends around 6 seconds
   - Scene 2 ends around 13 seconds
   - Scene 3 ends around 21 seconds
   - Scene 4 ends around 30 seconds

4. **Test in Remotion:**
   - Add voiceover to composition
   - Preview in Remotion Studio
   - Check sync with visuals
   - Adjust scene timing if needed

## Audio Mixing Guidelines

### Volume Levels
- **Voiceover:** 100% (1.0)
- **Background Music:** 15-20% (0.15-0.20)

The background music should be audible but not compete with the voiceover.

### Audio Balance Testing
1. Play the full video with both tracks
2. Ensure voiceover is clearly heard
3. Music should enhance, not distract
4. No audio clipping or distortion

## Troubleshooting

### Voiceover too fast
- Add more natural pauses (line breaks) in script
- Reduce speaking rate in voice settings
- Consider splitting into separate clips

### Voiceover too slow
- Remove extra pauses
- Increase speaking rate slightly
- Condense script wording

### Unnatural pronunciation
- Add punctuation for natural pauses
- Use phonetic spelling for difficult words
- Try different voice settings

### Timing doesn't match scenes
- Adjust scene durations in `Composition.tsx`
- Re-record specific sections
- Use audio editing to add/remove pauses

## Alternative Voices (if Matilda doesn't work)

If you need to try different voices:

1. **Rachel** (Voice ID: `21m00Tcm4TlvDq8ikWAM`) - Calm, professional female
2. **Sarah** (Voice ID: `EXAVITQu4vr4xnSDxMaL`) - Friendly, warm female
3. **Bella** (Voice ID: `EXAVITQu4vr4xnSDxMaL`) - Professional, clear female

Test each voice with a sample before generating the full script.

## Final Checklist

- [ ] Voiceover generated with correct voice (Matilda)
- [ ] Audio saved as `remotion/assets/voiceover.mp3`
- [ ] Timing verified with Whisper transcription
- [ ] Added to Composition.tsx
- [ ] Volume levels balanced (voiceover 100%, music 18%)
- [ ] Previewed in Remotion Studio
- [ ] All scenes sync correctly with audio
- [ ] Final audio quality check (no clipping, clear speech)
