import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Scene1Opening } from './scenes/Scene1Opening';
import { Scene2Impact } from './scenes/Scene2Impact';
import { Scene3FastTrack } from './scenes/Scene3FastTrack';
import { Scene4CTA } from './scenes/Scene4CTA';

export const MainComposition: React.FC = () => {
  // Scene durations (in frames at 30fps)
  const scene1Duration = 180; // 6 seconds (0-6s)
  const scene2Duration = 210; // 7 seconds (6-13s)
  const scene3Duration = 240; // 8 seconds (13-21s)
  const scene4Duration = 270; // 9 seconds (21-30s)

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Background Music - Continuous throughout entire video */}
      <Audio
        src={staticFile('educational-background-school-music.mp3')}
        volume={(f) => {
          // Lower volume during Scene 1 (0-150 frames), normal volume after
          return f < 150 ? 0.08 : 0.18;
        }}
      />

      {/* Scene 1: Opening Hook (0-6s) */}
      <Sequence from={0} durationInFrames={scene1Duration}>
        <Scene1Opening />
      </Sequence>

      {/* Scene 2: Show the Impact (6-13s) */}
      <Sequence from={scene1Duration} durationInFrames={scene2Duration}>
        <Scene2Impact />
      </Sequence>

      {/* Scene 3: The Offer - Fast Track (13-21s) */}
      <Sequence from={scene1Duration + scene2Duration} durationInFrames={scene3Duration}>
        <Scene3FastTrack />
      </Sequence>

      {/* Scene 4: Call-to-Action (21-30s) */}
      <Sequence from={scene1Duration + scene2Duration + scene3Duration} durationInFrames={scene4Duration}>
        <Scene4CTA />
      </Sequence>

      {/* Voiceover Audio - Wrapped in Sequence to start at 5 seconds (150 frames) with fade in */}
      <Sequence from={150}>
        <Audio
          src={staticFile('voiceover.mp3')}
          volume={(f) => {
            // Fade in voiceover over first 10 frames for smooth transition
            if (f < 10) return f / 10;
            return 1.0;
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
