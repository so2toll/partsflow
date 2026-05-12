import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { fadeIn } from '../utils/transitions';

export const Scene1Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const videoOpacity = fadeIn(frame, fps, 0, 15);

  // Fade out video audio at the end for smooth transition
  const videoVolume = interpolate(frame, [0, 140, 160, 180], [1.0, 1.0, 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade out entire scene at the end for smooth transition to Scene 2
  const sceneOpacity = interpolate(frame, [0, 160, 180], [1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', opacity: sceneOpacity }}>
      {/* Background Video - Full frame visible, letterbox bars blend with dark bg */}
      <div style={{ opacity: videoOpacity, width: '100%', height: '90%' }}>
     <OffthreadVideo
    src={staticFile('1st-frame-main-pyschologist-actress-sitting-in-chair-by-window-writing-notes-then-turning-to-the-camera-to-deliver-message.mp4')}
  
    style={{
      width: '70%',
      height: '110%',
      objectFit: 'cover',
      
      transform: 'scalex(1.85)',
      opacity: '1'
    }}
  />

 

      </div>
    </AbsoluteFill>
  );
};
