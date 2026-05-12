# School Counselor Recruitment Video

A professional 30-second CTV recruitment ad for licensed mental health clinicians (school counselors/psychologists) in Atlanta.

## Project Structure

```
remotion/
├── assets/                  # Video clips, images, and audio
├── prompts/                 # AI generation prompts for Higgsfield.ai
├── src/
│   ├── components/          # Reusable React components
│   │   ├── TextReveal.tsx  # Animated text component
│   │   └── QRCode.tsx      # QR code with animation
│   ├── scenes/              # Individual scene components
│   │   ├── Scene1Opening.tsx
│   │   ├── Scene2Impact.tsx
│   │   ├── Scene3FastTrack.tsx
│   │   └── Scene4CTA.tsx
│   ├── utils/               # Helper functions
│   │   └── transitions.ts   # Animation utilities
│   ├── Composition.tsx      # Main video composition
│   ├── Root.tsx             # Remotion root component
│   └── index.ts             # Entry point
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

## Video Structure (30 seconds)

### Scene 1: Opening Hook (0-6s)
- **Message:** "Atlanta Mental health clinicians: Local schools need your expertise."
- **Visual:** Professional counselor in office setting
- **Style:** Warm, professional introduction

### Scene 2: Show the Impact (6-13s)
- **Message:** "Children are waiting for your support. Join a team that values your skills."
- **Visual:** Split-screen showing counselor with child and children at school
- **Style:** Emotional connection, vibrant

### Scene 3: The Offer - Fast Track (13-21s)
- **Message:** "Skip the resume black hole. Verify your credentials quickly and get interviewed immediately."
- **Visual:** Professional office setting with animated feature boxes
- **Style:** Modern, dynamic, professional

### Scene 4: Call-to-Action (21-30s)
- **Message:** "Scan the code or text us now. Your next chapter starts here."
- **Visual:** Large QR code and phone number with clear call-to-action
- **Style:** Clean, prominent, easy to scan/read

## Getting Started

### 1. Install Dependencies

```bash
cd remotion
npm install
```

### 2. Start Remotion Studio

```bash
npm start
```

This will open the Remotion Studio in your browser where you can preview and edit the video.

### 3. Generate Voiceover (ElevenLabs)

Use the ElevenLabs API or web interface to generate the voiceover:

**Voice:** Matilda (Voice ID: `XrExE9yKIg1WjnnlVkGX`)

**Script with Timing:**

- **Scene 1 (0-6s):** "Atlanta Mental health clinicians: Local schools need your expertise."
- **Scene 2 (6-13s):** "Children are waiting for your support. Join a team that values your skills."
- **Scene 3 (13-21s):** "Skip the resume black hole. Verify your credentials quickly and get interviewed immediately."
- **Scene 4 (21-30s):** "Scan the code or text us now. Your next chapter starts here."

Save the generated audio as `voiceover.mp3` in the `assets/` folder.

### 4. Add Voiceover to Composition

Uncomment the voiceover audio section in `src/Composition.tsx`:

```tsx
<Audio
  src={staticFile('voiceover.mp3')}
  volume={1.0}
  startFrom={0}
/>
```

### 5. Customize

- **Phone Number:** Update in `src/scenes/Scene4CTA.tsx` (line with phone number display)
- **QR Code URL:** Update in `src/scenes/Scene4CTA.tsx` (QRCodeComponent url prop)
- **Music Volume:** Adjust in `src/Composition.tsx` (Audio volume prop)
- **Scene Durations:** Adjust frame counts in `src/Composition.tsx`
- **Text Content:** Edit text in individual scene components
- **Colors:** Modify color values in scene components

## Rendering

### Preview in Browser
```bash
npm start
```

### Render Final Video
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4
```

### High Quality Render (for CTV)
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment output.mp4 --codec h264 --crf 1
```

## Technical Specifications

- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30 fps
- **Duration:** 30 seconds (900 frames)
- **Format:** MP4 (H.264)
- **Audio:** Background music (18% volume) + voiceover (100% volume)

## Design Principles

- **Warm & Professional:** Balance clinical professionalism with approachable warmth
- **Clean Typography:** Large, legible fonts with generous spacing
- **Subtle Motion:** Smooth, purposeful animations using spring physics
- **Color Palette:** Blues/greens for trust + warm neutrals for approachability

## Customization Tips

### Changing Text Animations

Edit the `animationType` prop in TextReveal components:
- `'fade'` - Simple fade in
- `'scale'` - Scale up with fade
- `'slide'` - Slide up from bottom

### Adjusting Timing

Frame calculations at 30fps:
- 1 second = 30 frames
- Delay of 15 frames = 0.5 seconds
- Scene duration of 180 frames = 6 seconds

### Adding New Assets

1. Place assets in `assets/` folder
2. Import in scene using `staticFile('filename.ext')`
3. Use `<OffthreadVideo>` for videos or `<Img>` for images

## AI Scene Generation (Optional)

See `prompts/ai-scenes.md` for Higgsfield.ai prompts to generate additional scenes if needed.

## Troubleshooting

### Video won't load in preview
- Ensure all video files are in the `assets/` folder
- Check file paths match exactly (case-sensitive)
- Try refreshing the Remotion Studio browser tab

### Audio out of sync
- Verify voiceover timing matches scene transitions
- Check that `startFrom` prop on Audio components is set correctly
- Use Whisper or similar tool to verify voiceover timing

### Text too small/large
- Adjust `fontSize` prop in TextReveal components
- Test on actual TV screen resolution if possible

### QR code not scannable
- Increase QR code size prop
- Ensure sufficient contrast with background
- Test with actual phone camera

## Next Steps

1. ✓ Project structure created
2. ✓ All scene components implemented
3. ✓ Animation and transitions added
4. ⏳ Generate voiceover with ElevenLabs (Matilda voice)
5. ⏳ Add voiceover to composition
6. ⏳ Preview in Remotion Studio
7. ⏳ Make adjustments based on preview
8. ⏳ Final high-quality render

## Support

For Remotion documentation: https://www.remotion.dev/docs

For ElevenLabs voiceover: https://elevenlabs.io/docs

For Higgsfield.ai: Access through admin interface
