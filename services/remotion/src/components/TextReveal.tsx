import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface TextRevealProps {
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  style?: React.CSSProperties;
  animationType?: 'fade' | 'scale' | 'slide';
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  delay = 0,
  fontSize = 70,
  fontWeight = 'bold',
  color = '#ffffff',
  style = {},
  animationType = 'scale',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.5,
    },
  });

  let transform = '';
  let opacity = 1;

  if (animationType === 'fade') {
    opacity = interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (animationType === 'scale') {
    const scale = interpolate(progress, [0, 1], [0.8, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    transform = `scale(${scale})`;
  } else if (animationType === 'slide') {
    const translateY = interpolate(progress, [0, 1], [30, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    transform = `translateY(${translateY}px)`;
  }

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color,
        textAlign: 'center',
        textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        opacity,
        transform,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
