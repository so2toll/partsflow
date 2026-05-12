# Production Checklist

Use this checklist to track your progress from setup to final render.

## ✅ Phase 1: Setup (Complete!)

- [x] Project structure created
- [x] Dependencies installed (`npm install`)
- [x] All scene components implemented
- [x] Animation utilities created
- [x] Reusable components (TextReveal, QRCode)
- [x] Documentation written
- [x] Background music integrated

## ⏳ Phase 2: Voiceover Generation (Your Turn!)

- [ ] Have ElevenLabs account/API key
- [ ] Generate voiceover with Matilda voice
- [ ] Save as `assets/voiceover.mp3`
- [ ] Uncomment Audio component in `src/Composition.tsx`
- [ ] Verify voiceover timing with preview

**Quick Commands:**
```bash
# If using API:
export ELEVENLABS_API_KEY="your_key"
node generate-voiceover.js

# Or use web interface - see VOICEOVER_GUIDE.md
```

## ⏳ Phase 3: Customization (Optional)

- [ ] Update phone number in `src/scenes/Scene4CTA.tsx`
- [ ] Update QR code URL in `src/scenes/Scene4CTA.tsx`
- [ ] Adjust colors if needed
- [ ] Adjust text sizes if needed
- [ ] Test QR code scanability

**Current Placeholders:**
- Phone: `(555) 123-4567` → Replace with real number
- QR URL: `https://example.com` → Replace with landing page

## ⏳ Phase 4: Preview & Testing

- [ ] Start Remotion Studio: `npm start`
- [ ] Preview opens in browser (http://localhost:3000)
- [ ] All scenes play smoothly
- [ ] Voiceover syncs with visuals
- [ ] Music volume is appropriate (not too loud)
- [ ] Text is readable at full screen
- [ ] QR code is scannable with phone
- [ ] No black frames or gaps
- [ ] Total duration is 30 seconds

**Preview Command:**
```bash
cd remotion
npm start
```

## ⏳ Phase 5: Final Adjustments

- [ ] Scene timing adjustments (if needed)
- [ ] Volume levels balanced
  - Voiceover: 100% (1.0)
  - Music: 18% (0.18)
- [ ] Text timing feels natural
- [ ] Transitions are smooth
- [ ] Colors look good
- [ ] No technical issues

## ⏳ Phase 6: Render

- [ ] Close preview (Ctrl+C in terminal)
- [ ] Choose render quality:
  - [ ] High Quality (CRF 1) - Recommended for CTV
  - [ ] Standard Quality - Faster, smaller file

**Render Commands:**
```bash
# High Quality (Recommended for CTV)
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --codec h264 --crf 1

# Standard Quality
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4
```

- [ ] Render completes without errors
- [ ] Output file `output.mp4` created
- [ ] Video plays correctly in media player

## ⏳ Phase 7: Quality Control

- [ ] Watch full video start to finish
- [ ] Audio is clear and balanced
- [ ] Video quality is excellent
- [ ] No stuttering or frame drops
- [ ] Text is readable on TV screen (test if possible)
- [ ] QR code scans correctly
- [ ] Phone number is legible
- [ ] Message is clear and compelling
- [ ] Call-to-action is prominent

## ⏳ Phase 8: Distribution

- [ ] Video file meets platform requirements
- [ ] File size acceptable for distribution
- [ ] Video format compatible (MP4/H.264)
- [ ] Resolution correct (1920x1080)
- [ ] Frame rate correct (30fps)
- [ ] Ready for upload to CTV platform

---

## Quick Reference

### Start Preview
```bash
cd remotion
npm start
```

### Generate Voiceover
```bash
# Web: https://elevenlabs.io (Matilda voice)
# API: node generate-voiceover.js
```

### Render Video
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4
```

### File Locations
- **Voiceover:** `assets/voiceover.mp3`
- **Output Video:** `output.mp4`
- **Phone Number:** `src/scenes/Scene4CTA.tsx`
- **QR Code URL:** `src/scenes/Scene4CTA.tsx`
- **Scene Timing:** `src/Composition.tsx`

### Documentation
- **Quick Start:** `QUICK_START.md`
- **Full Guide:** `README.md`
- **Voiceover:** `VOICEOVER_GUIDE.md`
- **Project Info:** `PROJECT_SUMMARY.md`

---

## Current Status

**What's Done:**
- ✅ Complete project structure
- ✅ All 4 scenes implemented
- ✅ Animations and transitions
- ✅ Background music integrated
- ✅ Dependencies installed

**What's Next:**
1. Generate voiceover with ElevenLabs
2. Preview in Remotion Studio
3. Make any adjustments
4. Render final video

**Estimated Time to Complete:**
- Voiceover generation: 5-10 minutes
- Preview and adjustments: 15-30 minutes
- Final render: 5-15 minutes
- **Total: 30-60 minutes**

You're almost there! 🎉
