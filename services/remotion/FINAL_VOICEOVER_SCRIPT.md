# Final Voiceover Script (24 seconds - Scenes 2-4 only)

## Audio Setup

- **Scene 1 (0-6s):** Uses the audio FROM THE VIDEO (person speaking on camera)
- **Scenes 2-4 (6-30s):** Uses ElevenLabs voiceover (Matilda)

---

## ElevenLabs Script (Do NOT include Scene 1)

```
Children are waiting for your support. Join a team that truly values your skills and experience.

Skip the resume black hole. Verify your credentials quickly and get interviewed immediately. No waiting, no endless applications.

Scan the code or text us now. Your next chapter starts here. Make the difference you were meant to make.
```

---

## Timeline Breakdown

**Scene 1 (0-6 seconds):**
- Audio: FROM VIDEO CLIP (natural, person speaking)
- Text: "Atlanta Mental health clinicians: Local schools need your expertise."

**Scene 2 (6-13 seconds):**
- Audio: ELEVENLABS VOICEOVER starts here
- Text: "Children are waiting for your support. Join a team that truly values your skills and experience."

**Scene 3 (13-21 seconds):**
- Audio: ELEVENLABS VOICEOVER continues
- Text: "Skip the resume black hole. Verify your credentials quickly and get interviewed immediately. No waiting, no endless applications."

**Scene 4 (21-30 seconds):**
- Audio: ELEVENLABS VOICEOVER continues
- Text: "Scan the code or text us now. Your next chapter starts here. Make the difference you were meant to make."

---

## Generate Voiceover

### Option 1: Web Interface
1. Go to https://elevenlabs.io
2. Select **Matilda** voice
3. Paste ONLY the script above (without Scene 1)
4. Generate and download
5. Replace `assets/voiceover.mp3`

### Option 2: Script (Already Updated)
```bash
export ELEVENLABS_API_KEY="your_key"
node generate-voiceover.js
```

---

## Technical Details

- **Voiceover starts at:** 6 seconds (180 frames at 30fps)
- **Voiceover duration:** ~24 seconds
- **Total video duration:** 30 seconds
- **Scene 1 audio:** From video file (unmuted)
- **Scenes 2-4 audio:** From voiceover.mp3 (starts at 180 frames)

---

This creates a natural flow where:
1. The person speaks directly to camera (authentic)
2. Professional voiceover takes over for the rest (polished)
