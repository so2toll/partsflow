import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { TextReveal } from '../components/TextReveal';
import { fadeIn } from '../utils/transitions';

export const Scene2Impact: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in from black to overlap with Scene 1's fade out
  const videoOpacity = fadeIn(frame, fps, 0, 30);

  // Split screen animation
  const leftPosition = interpolate(frame, [0, 30], [-50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rightPosition = interpolate(frame, [0, 30], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
      {/* Split Screen Layout */}
      <div style={{ display: 'flex', width: '100%', height: '100%', opacity: videoOpacity }}>
        {/* Left Side - Blue gradient background with text */}
        <div
          style={{
            width: '50%',
            height: '100%',
            transform: `translateX(${leftPosition}%)`,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(12,74,110,0.95) 0%, rgba(3,105,161,0.95) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 60,
          }}
        >
          <TextReveal
            text="Make a Real Difference"
            delay={15}
            fontSize={65}
            fontWeight="bold"
            color="#ffffff"
            animationType="scale"
            style={{
              marginBottom: 40,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              textAlign: 'center',
            }}
          />
          <TextReveal
            text="Children are waiting for your support."
            delay={35}
            fontSize={42}
            fontWeight="600"
            color="#e0f2fe"
            animationType="slide"
            style={{
              marginBottom: 25,
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          />
          <TextReveal
            text="Join a team that values your skills."
            delay={55}
            fontSize={42}
            fontWeight="600"
            color="#e0f2fe"
            animationType="slide"
            style={{
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          />
        </div>

        {/* Right Side - Children entering school */}
        <div
          style={{
            width: '50%',
            height: '100%',
            transform: `translateX(${rightPosition}%)`,
            overflow: 'hidden',
          }}
        >
          <OffthreadVideo
            src={staticFile('stock-video-of-children-entering-school-running-into-the-schools-entrance-door-happily.mp4')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
