# Creating Alternative Video Versions

This guide shows you how to create multiple video variations in the same Remotion project without starting from scratch.

## Why Multiple Versions in One Project?

- Give clients options to choose from
- A/B test different approaches
- Reuse all your assets and components
- Preview all versions in one Remotion Studio session
- Render whichever version(s) you need

---

## How It Works

Remotion lets you register multiple "compositions" (videos) in the same project. Each composition can:
- Use the same scenes in different orders
- Have different durations
- Use different assets/backgrounds
- Have different pacing/timing
- Have different color schemes or styles

---

## Step-by-Step: Creating Alternative Versions

### 1. Create Variation Files

Copy your main composition file and create variations:

```bash
cd remotion/src
cp Composition.tsx Composition-v2.tsx
cp Composition.tsx Composition-v3.tsx
```

Your structure will look like:
```
src/
├── Composition.tsx          # Version 1 (original)
├── Composition-v2.tsx       # Version 2 (faster pace)
├── Composition-v3.tsx       # Version 3 (alternative style)
└── scenes/
    ├── Scene1Opening.tsx
    ├── Scene2Impact.tsx
    └── ...
```

### 2. Modify Each Variation

Edit `Composition-v2.tsx` and `Composition-v3.tsx`:

**Example - Version 2 (Faster Pace):**
```tsx
// Composition-v2.tsx
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Scene1Opening } from './scenes/Scene1Opening';
import { Scene2Impact } from './scenes/Scene2Impact';
import { Scene3FastTrack } from './scenes/Scene3FastTrack';
import { Scene4CTA } from './scenes/Scene4CTA';

export const MainCompositionV2: React.FC = () => {
  // SHORTER durations for faster pace
  const scene1Duration = 150; // 5 seconds (was 6)
  const scene2Duration = 180; // 6 seconds (was 7)
  const scene3Duration = 210; // 7 seconds (was 8)
  const scene4Duration = 210; // 7 seconds (was 9)
  // Total: 25 seconds (was 30)

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Audio
        src={staticFile('educational-background-school-music.mp3')}
        volume={0.18}
      />

      <Sequence from={0} durationInFrames={scene1Duration}>
        <Scene1Opening />
      </Sequence>

      <Sequence from={scene1Duration} durationInFrames={scene2Duration}>
        <Scene2Impact />
      </Sequence>

      <Sequence from={scene1Duration + scene2Duration} durationInFrames={scene3Duration}>
        <Scene3FastTrack />
      </Sequence>

      <Sequence from={scene1Duration + scene2Duration + scene3Duration} durationInFrames={scene4Duration}>
        <Scene4CTA />
      </Sequence>

      <Sequence from={150}>
        <Audio src={staticFile('voiceover.mp3')} volume={1.0} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

**Example - Version 3 (Different Scene Order):**
```tsx
// Composition-v3.tsx
export const MainCompositionV3: React.FC = () => {
  const scene1Duration = 240; // Start with "Skip Resume Black Hole" hook
  const scene2Duration = 210;
  const scene3Duration = 180;
  const scene4Duration = 270;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <Audio
        src={staticFile('educational-background-school-music.mp3')}
        volume={0.18}
      />

      {/* Lead with the strong hook! */}
      <Sequence from={0} durationInFrames={scene1Duration}>
        <Scene3FastTrack /> {/* Was Scene 3, now opening */}
      </Sequence>

      <Sequence from={scene1Duration} durationInFrames={scene2Duration}>
        <Scene1Opening /> {/* Was Scene 1 */}
      </Sequence>

      <Sequence from={scene1Duration + scene2Duration} durationInFrames={scene3Duration}>
        <Scene2Impact /> {/* Was Scene 2 */}
      </Sequence>

      <Sequence from={scene1Duration + scene2Duration + scene3Duration} durationInFrames={scene4Duration}>
        <Scene4CTA />
      </Sequence>

      <Sequence from={150}>
        <Audio src={staticFile('voiceover-v3.mp3')} volume={1.0} />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 3. Register All Versions in Root.tsx

Edit `src/Root.tsx` to register all compositions:

```tsx
import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './Composition';
import { MainCompositionV2 } from './Composition-v2';
import { MainCompositionV3 } from './Composition-v3';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Version 1: Original (30 seconds) */}
      <Composition
        id="SchoolCounselorRecruitment"
        component={MainComposition}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* Version 2: Fast Pace (25 seconds) */}
      <Composition
        id="SchoolCounselorRecruitment-V2-Fast"
        component={MainCompositionV2}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* Version 3: Alternative Order (30 seconds) */}
      <Composition
        id="SchoolCounselorRecruitment-V3-Alt"
        component={MainCompositionV3}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
```

### 4. Preview All Versions

Start Remotion Studio:
```bash
npm start
```

In the browser, you'll see a **dropdown menu** at the top with all your compositions:
- SchoolCounselorRecruitment
- SchoolCounselorRecruitment-V2-Fast
- SchoolCounselorRecruitment-V3-Alt

Click between them to preview each version!

### 5. Render Specific Version

Render whichever version you want:

```bash
# Render Version 1 (original)
npx remotion render src/index.ts SchoolCounselorRecruitment output-v1.mp4

# Render Version 2 (fast)
npx remotion render src/index.ts SchoolCounselorRecruitment-V2-Fast output-v2.mp4

# Render Version 3 (alternative)
npx remotion render src/index.ts SchoolCounselorRecruitment-V3-Alt output-v3.mp4
```

For LinkedIn CTV quality:
```bash
npx remotion render src/index.ts SchoolCounselorRecruitment-V2-Fast output-v2-ctv.mp4 \
  --codec h264 \
  --video-bitrate 20M \
  --audio-bitrate 192000
```

---

## Suggested Variations to Try

### Version 2: Faster/Punchier (20-25 seconds)
**Changes:**
- Reduce each scene by 1-2 seconds
- Faster text animations (lower delay values)
- Trim pauses in voiceover
- More energetic feel

**Best for:** Social media, shorter attention spans

### Version 3: Different Visual Style
**Changes:**
- Swap background videos (use unused assets)
- Different color palette (warm oranges vs cool blues)
- Alternative text positioning
- Use Higgsfield AI-generated backgrounds

**Best for:** Testing what resonates visually

### Version 4: Hook-First Approach
**Changes:**
- Lead with Scene 3 ("Skip Resume Black Hole")
- Follow with Scene 1 (introduction)
- Scene 2 (impact)
- End with Scene 4 (CTA)

**Best for:** Grabbing attention immediately

### Version 5: Different Tone
**Changes:**
- Warmer color grading
- Different font choices
- Different background music
- Alternative voiceover style

**Best for:** A/B testing emotional appeal

---

## Quick Quality Improvements (No New Files Needed)

You can make these changes to any composition without creating new files:

### 1. Adjust Pacing
```tsx
// In Composition.tsx
const scene1Duration = 150; // Change from 180 to make it snappier
```

### 2. Color Grading
```tsx
// Add color overlay to any scene
<AbsoluteFill style={{
  background: 'linear-gradient(rgba(255,165,0,0.1), rgba(255,165,0,0.1))'
}}>
  {/* Your scene content */}
</AbsoluteFill>
```

### 3. Text Refinement
```tsx
// In any scene file, adjust:
<TextReveal
  text="New, Better Copy"
  fontSize={72}  // Increase size
  delay={5}      // Show earlier
  animationType="scale"  // Different animation
/>
```

### 4. Music Volume
```tsx
// In Composition.tsx
<Audio
  src={staticFile('educational-background-school-music.mp3')}
  volume={0.12}  // Lower from 0.18 for more subtle
/>
```

### 5. Use Alternative Assets
```tsx
// In Scene3FastTrack.tsx, swap video:
<OffthreadVideo
  src={staticFile('psychologist-taking-notes-in-foreground-head-cut-off-blurred-patient-in-chair-in-background.mp4')}
  // Instead of current video
/>
```

---

## Using Higgsfield AI Scenes

After generating scenes with Higgsfield AI using `prompts/ai-scenes.md`:

1. Download generated videos from Higgsfield
2. Save them in `assets/` folder with descriptive names
3. Use in any scene:

```tsx
<OffthreadVideo
  src={staticFile('higgsfield-professional-office-scene.mp4')}
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```

---

## Tips for Creating Variations

### Keep What Works
- Don't change everything at once
- Test one variable at a time (pacing vs visuals vs order)
- Keep successful elements across versions

### Organize Your Files
```
remotion/
├── src/
│   ├── Composition.tsx           # Original
│   ├── Composition-fast.tsx      # Faster version
│   ├── Composition-warm.tsx      # Warm color scheme
│   └── Composition-hook-first.tsx # Different order
└── renders/
    ├── v1-original.mp4
    ├── v2-fast.mp4
    ├── v3-warm.mp4
    └── v4-hook-first.mp4
```

### Name Compositions Clearly
```tsx
id="SchoolCounselorRecruitment-V2-25sec-Fast"
id="SchoolCounselorRecruitment-V3-WarmTone"
id="SchoolCounselorRecruitment-V4-HookFirst"
```

### Use Props for Easy Variations
Instead of separate files, use props:

```tsx
// Composition.tsx
export const MainComposition: React.FC<{
  pace?: 'normal' | 'fast';
  colorScheme?: 'cool' | 'warm';
}> = ({ pace = 'normal', colorScheme = 'cool' }) => {
  const scene1Duration = pace === 'fast' ? 150 : 180;
  const backgroundColor = colorScheme === 'warm' ? '#2d1810' : '#0f172a';

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* ... */}
    </AbsoluteFill>
  );
};

// In Root.tsx
<Composition
  id="Normal-Cool"
  component={MainComposition}
  defaultProps={{ pace: 'normal', colorScheme: 'cool' }}
  {...otherProps}
/>
<Composition
  id="Fast-Warm"
  component={MainComposition}
  defaultProps={{ pace: 'fast', colorScheme: 'warm' }}
  {...otherProps}
/>
```

---

## Rendering Multiple Versions at Once

Create a bash script `render-all-versions.sh`:

```bash
#!/bin/bash

echo "Rendering all versions..."

npx remotion render src/index.ts SchoolCounselorRecruitment renders/v1-original.mp4 \
  --codec h264 --video-bitrate 20M --audio-bitrate 192000

npx remotion render src/index.ts SchoolCounselorRecruitment-V2-Fast renders/v2-fast.mp4 \
  --codec h264 --video-bitrate 20M --audio-bitrate 192000

npx remotion render src/index.ts SchoolCounselorRecruitment-V3-Alt renders/v3-alt.mp4 \
  --codec h264 --video-bitrate 20M --audio-bitrate 192000

echo "All versions rendered to ./renders/ folder"
```

Make it executable and run:
```bash
chmod +x render-all-versions.sh
./render-all-versions.sh
```

---

## Common Scenarios

### Client Wants Multiple Lengths
Create 15s, 30s, and 60s versions:
```tsx
// 15-second version
<Composition id="15sec" component={Short15} durationInFrames={450} {...} />

// 30-second version
<Composition id="30sec" component={Standard30} durationInFrames={900} {...} />

// 60-second version
<Composition id="60sec" component={Long60} durationInFrames={1800} {...} />
```

### A/B Testing Different Hooks
Keep everything the same except Scene 1:
```tsx
// Composition-hookA.tsx uses Scene1Opening
// Composition-hookB.tsx uses Scene1OpeningAlt
// Everything else identical
```

### Different Phone Numbers/QR Codes
Use props instead of hardcoding:
```tsx
export const MainComposition: React.FC<{ phoneNumber: string; qrUrl: string }> =
  ({ phoneNumber, qrUrl }) => {
    return (
      <AbsoluteFill>
        {/* Pass props down to Scene4CTA */}
        <Scene4CTA phoneNumber={phoneNumber} qrUrl={qrUrl} />
      </AbsoluteFill>
    );
  };
```

---

## Summary

- **One project** can have unlimited video versions
- **Register multiple compositions** in `Root.tsx`
- **Preview all in Remotion Studio** via dropdown
- **Render only what you need** by specifying composition ID
- **Reuse all assets, components, and code**

This approach saves time, keeps everything organized, and lets you give clients options without duplicating work.

---

**Ready to create your variations?**

1. Decide what variations you want (pace, visuals, order, tone)
2. Copy `Composition.tsx` to `Composition-v2.tsx`, etc.
3. Make your changes to each version
4. Register all in `Root.tsx`
5. Preview with `npm start`
6. Render your favorites

Good luck!
