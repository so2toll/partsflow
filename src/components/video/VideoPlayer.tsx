/**
 * VideoPlayer Component
 *
 * Video player with:
 * - HLS playback support
 * - Custom controls
 * - Download option
 * - Thumbnail preview
 *
 * @component video/VideoPlayer
 */

import { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  showDownload?: boolean;
  className?: string;
  onEnded?: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  showDownload = true,
  className = '',
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.volume > 0) {
      video.volume = 0;
      setVolume(0);
    } else {
      video.volume = 1;
      setVolume(1);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = title || 'video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`video-player ${className}`}>
      {title && <div className="video-title">{title}</div>}

      <div className="video-container">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          controls={false}
          className="video-element"
        />

        {/* Custom Controls */}
        <div className="video-controls">
          {/* Play/Pause Button */}
          <button onClick={togglePlay} className="control-btn play-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶️'}
          </button>

          {/* Progress Bar */}
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-slider"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <button onClick={toggleMute} className="control-btn volume-btn" aria-label="Toggle mute">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="control-btn fullscreen-btn"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>

          {/* Download Button */}
          {showDownload && (
            <button onClick={handleDownload} className="control-btn download-btn" aria-label="Download video">
              ⬇️
            </button>
          )}
        </div>
      </div>

      <style>{`
        .video-player {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .video-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-neutral-600);
        }

        .video-container {
          position: relative;
          width: 100%;
          background-color: var(--color-neutral-900);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .video-element {
          width: 100%;
          display: block;
          max-height: 70vh;
        }

        .video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          opacity: 0;
          transition: opacity 300ms;
        }

        .video-container:hover .video-controls {
          opacity: 1;
        }

        .control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: var(--radius-md);
          font-size: 16px;
          cursor: pointer;
          transition: background 200ms, transform 200ms;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .play-btn {
          width: 44px;
          height: 44px;
          font-size: 20px;
          background: var(--color-primary-300);
          color: var(--color-neutral-900);
        }

        .play-btn:hover {
          background: var(--color-primary-400);
        }

        .progress-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .progress-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-sm);
          outline: none;
          cursor: pointer;
        }

        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: var(--color-primary-300);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: transform 100ms;
        }

        .progress-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .progress-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: var(--color-primary-300);
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: transform 100ms;
        }

        .progress-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        .time-display {
          display: flex;
          gap: var(--spacing-xs);
          font-size: 11px;
          font-weight: 500;
          color: var(--color-surface-50);
          font-family: var(--font-sans);
        }

        .volume-slider {
          width: 60px;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-sm);
          outline: none;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          background: var(--color-surface-50);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: transform 100ms;
        }

        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .volume-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          background: var(--color-surface-50);
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: transform 100ms;
        }

        .volume-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        @media (max-width: 640px) {
          .video-controls {
            flex-wrap: wrap;
            padding: 8px;
          }

          .progress-container {
            order: -1;
            width: 100%;
          }

          .volume-slider {
            display: none;
          }

          .fullscreen-btn {
            margin-left: auto;
          }

          .control-btn {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

          .play-btn {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
