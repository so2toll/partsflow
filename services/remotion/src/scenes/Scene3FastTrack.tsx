import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { TextReveal } from '../components/TextReveal';
import { fadeIn, fadeOut } from '../utils/transitions';

export const Scene3FastTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // First video fades in and out
  const video1Opacity = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Second video fades in after first one starts fading out
  const video2Opacity = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out the entire scene at the end for smooth transition to Scene 4
  const sceneOpacity = interpolate(frame, [210, 240], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', opacity: sceneOpacity }}>
      {/* First Background Video - Trimmed to 3 seconds (90 frames) with fade out */}
      <div style={{ opacity: video1Opacity, position: 'absolute', width: '100%', height: '100%' }}>
        <OffthreadVideo
          muted
          src={staticFile('main-psychologist-actress-sitting-across-from-patient-talking-with-notes-shown-in-focus-in-background-while-patients-back-of-head-shown-in-background-blurred-then-camera-pans-to-right-to-child-sitting-on-beanie-all-inside-office.mp4')}
          endAt={90}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Second Background Video - Fades in after first video */}
      <div style={{ opacity: video2Opacity, position: 'absolute', width: '100%', height: '100%' }}>
        <OffthreadVideo
          src={staticFile('psychologist-taking-notes-in-foreground-head-cut-off-blurred-patient-in-chair-in-background.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Gradient Overlay - darker on right for text readability */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to left, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.6) 50%, rgba(30,41,59,0.7) 100%)',
        }}
      />

      {/* Content - Positioned on the right side, cascading down */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingRight: 100,
          paddingLeft: 100,
        }}
      >
        {/* Main Heading - Right aligned, multi-line */}
        <div style={{ textAlign: 'right', maxWidth: '700px' }}>
          <TextReveal
            text="Skip the"
            delay={10}
            fontSize={58}
            fontWeight="bold"
            color="#fbbf24"
            animationType="slide"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 10,
            }}
          />
          <TextReveal
            text="Resume Black Hole"
            delay={20}
            fontSize={68}
            fontWeight="bold"
            color="#fbbf24"
            animationType="slide"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 50,
            }}
          />

          {/* Subtitle Text - Right aligned, multi-line */}
          <TextReveal
            text="Interview Immediately,"
            delay={40}
            fontSize={50}
            fontWeight="bold"
            color="#ffffff"
            animationType="slide"
            style={{
              marginBottom: 5,
            }}
          />
          <TextReveal
            text="No Waiting"
            delay={50}
            fontSize={50}
            fontWeight="bold"
            color="#ffffff"
            animationType="slide"
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
