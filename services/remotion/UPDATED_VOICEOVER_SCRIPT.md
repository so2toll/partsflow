# Updated Voiceover Script (Extended to 30 seconds)

## New Extended Script

Since the current voiceover is only 17 seconds and we need 30 seconds, here's an extended script that adds more detail and natural pacing:

---

### Full Script (30 seconds)

```
Atlanta Mental health clinicians: Local schools need your expertise.

Children are waiting for your support. Join a team that truly values your skills and experience.

Skip the resume black hole. Verify your credentials quickly and get interviewed immediately. No waiting, no endless applications.

Scan the code or text us now. Your next chapter starts here. Make the difference you were meant to make.
```

---

## Section Breakdown with Timing

**Scene 1 (0-6 seconds):**
```
Atlanta Mental health clinicians: Local schools need your expertise.
```
*Duration: ~5 seconds*

---

**Scene 2 (6-13 seconds):**
```
Children are waiting for your support. Join a team that truly values your skills and experience.
```
*Duration: ~7 seconds*

---

**Scene 3 (13-21 seconds):**
```
Skip the resume black hole. Verify your credentials quickly and get interviewed immediately. No waiting, no endless applications.
```
*Duration: ~8 seconds*

---

**Scene 4 (21-30 seconds):**
```
Scan the code or text us now. Your next chapter starts here. Make the difference you were meant to make.
```
*Duration: ~9 seconds*

---

## How to Generate Updated Voiceover

### Option 1: ElevenLabs Web Interface

1. Go to https://elevenlabs.io
2. Select **Matilda** voice
3. Paste the full script above
4. Generate and download as MP3
5. **Replace** the existing `assets/voiceover.mp3` file
6. The preview will auto-reload

### Option 2: Using the Script

```bash
# Update the script in generate-voiceover.js first, then:
export ELEVENLABS_API_KEY="your_key"
node generate-voiceover.js
```

---

## Changes Made

**Added to make it 30 seconds:**
- Scene 2: "truly values your skills and experience" (instead of just "values your skills")
- Scene 3: "No waiting, no endless applications" (added emphasis)
- Scene 4: "Make the difference you were meant to make" (powerful closing)

**Total estimated duration:** ~30 seconds with natural pacing

---

## Voice Settings (Recommended)

- **Voice:** Matilda (Voice ID: `XrExE9yKIg1WjnnlVkGX`)
- **Stability:** 0.6
- **Clarity:** 0.75
- **Style:** 0.35
- **Speaker Boost:** True

---

After generating, the new voiceover should:
- ✅ Be exactly 30 seconds long
- ✅ Match the scene transitions perfectly
- ✅ Have natural pacing with appropriate pauses
- ✅ Not conflict with the first video (which is now muted)
