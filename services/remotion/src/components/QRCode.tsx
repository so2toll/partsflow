import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  url: string;
  size?: number;
  delay?: number;
}

export const QRCodeComponent: React.FC<QRCodeProps> = ({
  url,
  size = 250,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scale})`,
        opacity,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}
    >
      <QRCodeSVG
        value={url}
        size={size}
        level="H"
        includeMargin={true}
      />
    </div>
  );
};
