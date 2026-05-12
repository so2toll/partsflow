# Troubleshooting Guide

Common issues and solutions for the School Counselor Recruitment Video project.

## Installation Issues

### "Cannot find module '@remotion/cli'"

**Problem:** Dependencies not installed correctly.

**Solution:**
```bash
cd remotion
rm -rf node_modules package-lock.json
npm install
```

### "Node version not supported"

**Problem:** Node.js version too old.

**Solution:**
- Update to Node.js 18 or higher
- Download from: https://nodejs.org/

## Preview Issues

### "npm start" doesn't open browser

**Solution:**
```bash
# Manually open in browser:
open http://localhost:3000

# Or use a different port:
PORT=3001 npm start
```

### Video doesn't appear in preview

**Possible Causes & Solutions:**

1. **Video file path incorrect**
   - Check `staticFile()` paths match exact filenames in `assets/`
   - Filenames are case-sensitive
   - No typos in video filenames

2. **Assets folder not recognized**
   - Verify folder structure: `remotion/assets/`
   - Try restarting Remotion Studio

3. **Browser cache issue**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Clear browser cache
   - Restart Remotion Studio

### "Cannot resolve 'qrcode.react'"

**Solution:**
```bash
npm install qrcode.react --save
```

### "Cannot resolve 'lucide-react'"

**Solution:**
```bash
npm install lucide-react --save
```

## Audio Issues

### Voiceover not playing

**Checklist:**
1. File exists: `assets/voiceover.mp3`
2. Audio component uncommented in `src/Composition.tsx`
3. Correct `staticFile('voiceover.mp3')` path
4. File is valid MP3 format
5. Browser audio not muted

**Test audio file:**
```bash
# Play in terminal (Mac)
afplay assets/voiceover.mp3

# Check file info
file assets/voiceover.mp3
```

### Background music too loud

**Solution:**
Edit `src/Composition.tsx`:
```tsx
<Audio
  src={staticFile('educational-background-school-music.mp3')}
  volume={0.15} // Reduce from 0.18 to 0.15
  startFrom={0}
/>
```

### Audio out of sync

**Solutions:**

1. **Adjust scene durations** in `src/Composition.tsx`:
```tsx
const scene1Duration = 180; // Increase/decrease frames
```

2. **Adjust animation delays** in scene files:
```tsx
<TextReveal
  text="Your text"
  delay={20} // Increase/decrease delay
/>
```

3. **Check voiceover timing:**
```bash
# Use Whisper to get timestamps
pip install openai-whisper
whisper assets/voiceover.mp3 --model base
```

## Rendering Issues

### Render fails with "Out of memory"

**Solutions:**

1. **Reduce concurrency:**
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --concurrency=1
```

2. **Lower quality temporarily:**
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --crf 23
```

3. **Close other applications**
4. **Render shorter test segment first:**
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --frames=0-90
```

### Render produces black video

**Possible Causes:**

1. **Video files corrupted or incompatible**
   - Test individual video files
   - Re-download if necessary
   - Convert to standard MP4 H.264 format

2. **OffthreadVideo not loading**
   - Check Chrome/Chromium is installed
   - Try using regular `<Video>` component temporarily

### Render takes forever

**Normal render times:**
- Standard quality: 3-10 minutes
- High quality (CRF 1): 10-30 minutes

**Speed up:**
```bash
# Use more threads (if you have powerful CPU)
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --concurrency=8

# Lower quality
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --crf 28
```

## Visual Issues

### Text not visible / hard to read

**Solutions:**

1. **Increase font size** in scene files:
```tsx
<TextReveal
  text="Your text"
  fontSize={90} // Increase from default
/>
```

2. **Adjust text color** for better contrast:
```tsx
<TextReveal
  text="Your text"
  color="#ffffff" // Try different colors
/>
```

3. **Increase shadow** for readability:
```tsx
style={{
  textShadow: '4px 4px 12px rgba(0,0,0,0.9)', // Stronger shadow
}}
```

### QR code not scannable

**Solutions:**

1. **Increase size:**
```tsx
<QRCodeComponent
  url="https://example.com"
  size={300} // Increase from 250
/>
```

2. **Increase hold time** - Edit `src/Composition.tsx`:
```tsx
const scene4Duration = 300; // Increase from 270 (10 seconds)
```

3. **Test contrast** - Ensure white QR code on dark background

4. **Test with multiple phones** - Different cameras have different sensitivities

### Animations jittery or choppy

**Solutions:**

1. **In preview** - This is normal, preview is not fully optimized
2. **In final render** - Check your CPU isn't overheating
3. **Reduce animation complexity** - Simplify spring configs:
```tsx
config: {
  damping: 15, // Higher = less bounce
  stiffness: 80, // Lower = slower
}
```

### Split screen not aligned (Scene 2)

**Solution:**
Check Scene2Impact.tsx timing. Both sides should animate together:
```tsx
const leftPosition = interpolate(frame, [0, 30], [-50, 0], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

const rightPosition = interpolate(frame, [0, 30], [50, 0], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

## TypeScript Issues

### Type errors in scene files

**Solution:**
```bash
# Reinstall type definitions
npm install --save-dev @types/react @types/node typescript
```

### "Cannot find module 'remotion'"

**Solution:**
```bash
npm install remotion @remotion/cli --save
```

## Voiceover Generation Issues

### ElevenLabs API returns 401

**Problem:** Invalid or missing API key.

**Solution:**
```bash
# Check API key is set
echo $ELEVENLABS_API_KEY

# Set it if missing
export ELEVENLABS_API_KEY="your_actual_key"
```

### Voiceover sounds robotic

**Solution:**
Try different voice settings in `generate-voiceover.js`:
```javascript
voice_settings: {
  stability: 0.5,        // Lower for more variation
  similarity_boost: 0.75,
  style: 0.4,            // Higher for more expression
  use_speaker_boost: true,
}
```

### Wrong voice generated

**Solution:**
Verify voice ID in `generate-voiceover.js`:
```javascript
const VOICE_ID = 'XrExE9yKIg1WjnnlVkGX'; // Matilda
```

## Performance Issues

### Remotion Studio slow/laggy

**Solutions:**

1. **Close other applications**
2. **Reduce preview quality** - In Remotion Studio, change quality setting to "Low"
3. **Clear browser cache**
4. **Use Chrome** (best supported browser for Remotion)

### High CPU usage during preview

**This is normal** - Remotion renders in real-time. Use these to reduce load:
- Pause preview when not watching
- Lower preview quality
- Preview shorter segments

## Platform-Specific Issues

### Mac: "Cannot open remotion because developer cannot be verified"

**Solution:**
```bash
# Allow executable permissions
chmod +x setup.sh generate-voiceover.js

# If still blocked, right-click → Open
```

### Windows: "npm: command not found"

**Solution:**
- Restart terminal after Node.js installation
- Or use full path: `C:\Program Files\nodejs\npm.exe`

### Linux: Permission denied

**Solution:**
```bash
# Fix permissions
chmod +x setup.sh generate-voiceover.js

# Or run with sudo
sudo npm install
```

## Still Having Issues?

### 1. Check Remotion Documentation
https://www.remotion.dev/docs/troubleshooting

### 2. Verify Environment
```bash
# Check versions
node --version  # Should be 18+
npm --version   # Should be 8+

# Check current directory
pwd  # Should end in /remotion

# Check files exist
ls -la src/
ls -la assets/
```

### 3. Clean Install
```bash
# Remove everything and start fresh
rm -rf node_modules package-lock.json
npm install
npm start
```

### 4. Test Individual Components

Create a test composition:
```tsx
// src/TestComposition.tsx
import { AbsoluteFill } from 'remotion';

export const Test = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'blue' }}>
      <h1 style={{ color: 'white' }}>Test</h1>
    </AbsoluteFill>
  );
};
```

If basic test works, issue is in specific scene components.

### 5. Enable Debug Logging

In Remotion Studio:
- Open browser console (F12)
- Check for error messages
- Look for network failures

### 6. Contact Support

If all else fails:
- Remotion Discord: https://remotion.dev/discord
- GitHub Issues: https://github.com/remotion-dev/remotion/issues
- Include: Node version, OS, error messages, steps to reproduce

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Video won't load | Check file paths, refresh browser |
| Audio won't play | Verify file exists, uncomment Audio component |
| Text not visible | Increase fontSize, add textShadow |
| QR code won't scan | Increase size, extend duration |
| Render fails | Reduce concurrency, lower CRF |
| Preview laggy | Lower preview quality |
| Out of sync | Adjust scene durations |
| Module not found | npm install |

---

**Remember:** Most issues are solved by:
1. Verifying file paths
2. Refreshing browser
3. Reinstalling dependencies
4. Checking documentation

Don't hesitate to reference the other guides:
- `README.md` - Full documentation
- `QUICK_START.md` - Getting started
- `VOICEOVER_GUIDE.md` - Audio generation
