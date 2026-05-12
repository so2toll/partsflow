import { interpolate, spring } from 'remotion';

export const fadeIn = (frame: number, fps: number, delay = 0, duration = 20) => {
  return interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const fadeOut = (frame: number, fps: number, startFrame: number, duration = 20) => {
  return interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const scaleIn = (frame: number, fps: number, delay = 0) => {
  return spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.5,
    },
    from: 0,
    to: 1,
  });
};

export const slideFromBottom = (frame: number, fps: number, delay = 0) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  return interpolate(progress, [0, 1], [100, 0]);
};

export const slideFromLeft = (frame: number, fps: number, delay = 0) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  return interpolate(progress, [0, 1], [-100, 0]);
};

export const staggeredDelay = (index: number, baseDelay = 5) => {
  return baseDelay * index;
};
