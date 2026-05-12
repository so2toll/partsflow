# Quick Start Guide

Get your video up and running in minutes!

## Step 1: Dependencies (Already Done! ✓)

Dependencies are installed and ready to go.

## Step 2: Preview the Video

Start the Remotion Studio to see your video:

```bash
cd remotion
npm start
```

This will open your browser at `http://localhost:3000` with the Remotion Studio.

## Step 3: Generate Voiceover

### Quick Method (Web Interface)

1. Go to [ElevenLabs](https://elevenlabs.io)
2. Select **Matilda** voice
3. Paste this script:

```
Atlanta Mental health clinicians: Local schools need your expertise.

Children are waiting for your support. Join a team that values your skills.

Skip the resume black hole. Verify your credentials quickly and get interviewed immediately.

Scan the code or text us now. Your next chapter starts here.
```

4. Generate and download as MP3
5. Save it as `remotion/assets/voiceover.mp3`

### With API (if you have an API key)

```bash
# Set your API key
export ELEVENLABS_API_KEY="your_key_here"

# Run the generation script
node generate-voiceover.js
```

See `VOICEOVER_GUIDE.md` for detailed instructions.

## Step 4: Add Voiceover to Video

Edit `src/Composition.tsx` and uncomment this section (around line 40):

```tsx
<Audio
  src={staticFile('voiceover.mp3')}
  volume={1.0}
  startFrom={0}
/>
```

Save the file and the preview will automatically update!

## Step 5: Customize (Optional)

### Change Phone Number

Edit `src/scenes/Scene4CTA.tsx` - find line with `(555) 123-4567` and replace with your number.

### Change QR Code URL

Edit `src/scenes/Scene4CTA.tsx` - find `url="https://example.com"` and replace with your URL.

### Adjust Colors/Text

All customizations are in the `src/scenes/` folder:
- `Scene1Opening.tsx` - Opening scene
- `Scene2Impact.tsx` - Impact scene
- `Scene3FastTrack.tsx` - Fast track offer
- `Scene4CTA.tsx` - Call to action

## Step 6: Render Final Video

### Standard Quality
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4
```

### High Quality (Recommended for CTV)
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --codec h264 --crf 1
```

The video will be saved as `output.mp4` in the remotion folder.

## Troubleshooting

### Can't see video in preview?
- Make sure you're in the `remotion` directory
- Try refreshing the browser
- Check that video files exist in `assets/` folder

### Audio not syncing?
- Verify voiceover file is named exactly `voiceover.mp3`
- Check that the file is in the `assets/` folder
- Verify you uncommented the Audio component in Composition.tsx

### Text too small/large?
- Edit the `fontSize` prop in the scene files
- Values are in pixels (e.g., `fontSize={80}`)

### Want different transitions?
- Edit `animationType` in TextReveal components
- Options: `'fade'`, `'scale'`, `'slide'`

## Need Help?

- **Full Documentation:** See `README.md`
- **Voiceover Details:** See `VOICEOVER_GUIDE.md`
- **AI Scene Generation:** See `prompts/ai-scenes.md`
- **Remotion Docs:** https://www.remotion.dev/docs

## Project Timeline

- ✅ Project structure created
- ✅ All scenes implemented
- ✅ Animations and transitions added
- ✅ Dependencies installed
- ⏳ Generate voiceover
- ⏳ Preview and adjust
- ⏳ Final render

You're almost there! Just generate the voiceover and you'll be ready to render.
