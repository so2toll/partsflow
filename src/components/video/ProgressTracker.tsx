/**
 * ProgressTracker Component
 *
 * Displays video generation pipeline progress with:
 * - Step-by-step status indicators
 * - Progress percentage
 * - Estimated time remaining
 * - Current stage description
 * - Real-time progress updates via custom events
 *
 * @component video/ProgressTracker
 * @example
 * ```tsx
 * <ProgressTracker
 *   currentStage="generating"
 *   progress={45}
 *   error={null}
 *   onRetry={() => handleRetry()}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import type { PipelineStage, VideoProgressUpdateDetail } from '@/types/video';

interface Stage {
  id: PipelineStage;
  label: string;
  description: string;
  icon: string;
  estimatedTime: number; // in seconds
}

interface ProgressTrackerProps {
  currentStage: PipelineStage;
  progress: number; // 0-100
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

const STAGES: Stage[] = [
  {
    id: 'parsing',
    label: 'Parsing Script',
    description: 'Analyzing script and extracting scenes',
    icon: '📝',
    estimatedTime: 10,
  },
  {
    id: 'keyframes',
    label: 'Generating Keyframes',
    description: 'Creating visual references for each scene',
    icon: '🎨',
    estimatedTime: 30,
  },
  {
    id: 'generating',
    label: 'Generating Video',
    description: 'AI is creating scene animations',
    icon: '🎬',
    estimatedTime: 120,
  },
  {
    id: 'rendering',
    label: 'Rendering',
    description: 'Applying final quality settings',
    icon: '✨',
    estimatedTime: 45,
  },
  {
    id: 'assembling',
    label: 'Assembling',
    description: 'Combining scenes into final video',
    icon: '🔗',
    estimatedTime: 15,
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Your video is ready!',
    icon: '✅',
    estimatedTime: 0,
  },
  {
    id: 'failed',
    label: 'Failed',
    description: 'An error occurred during generation',
    icon: '❌',
    estimatedTime: 0,
  },
];

function getStageIndex(stage: PipelineStage): number {
  return STAGES.findIndex((s) => s.id === stage);
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes}m`;
}

export default function ProgressTracker({
  currentStage: initialStage,
  progress: initialProgress,
  error = null,
  onRetry,
  className = '',
}: ProgressTrackerProps) {
  // Local state to handle real-time updates
  const [currentStage, setCurrentStage] = useState<PipelineStage>(initialStage);
  const [progress, setProgress] = useState<number>(initialProgress);
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  // Update local state when props change (initial load or parent updates)
  useEffect(() => {
    setCurrentStage(initialStage);
    setProgress(initialProgress);
  }, [initialStage, initialProgress]);

  // Listen for real-time progress updates from polling
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent<VideoProgressUpdateDetail>) => {
      const { stage, progress: newProgress } = event.detail;
      setCurrentStage(stage);
      setProgress(newProgress);
    };

    // Type-safe event listener registration using global WindowEventMap
    window.addEventListener('video-progress-update', handleProgressUpdate);

    return () => {
      window.removeEventListener('video-progress-update', handleProgressUpdate);
    };
  }, []);

  useEffect(() => {
    const stageIndex = getStageIndex(currentStage);

    if (currentStage === 'completed') {
      setEstimatedTime('Done!');
    } else if (currentStage === 'failed') {
      setEstimatedTime('');
    } else {
      // Calculate remaining time based on current and future stages
      let remainingSeconds = 0;

      // Add partial time for current stage
      const currentStageInfo = STAGES[stageIndex];
      const currentStageRemaining = currentStageInfo.estimatedTime * (1 - progress / 100);
      remainingSeconds += currentStageRemaining;

      // Add full time for remaining stages
      for (let i = stageIndex + 1; i < STAGES.length; i++) {
        const stage = STAGES[i];
        if (stage.id !== 'completed' && stage.id !== 'failed') {
          remainingSeconds += stage.estimatedTime;
        }
      }

      setEstimatedTime(formatTime(Math.ceil(remainingSeconds)));
    }
  }, [currentStage, progress]);

  const stageIndex = getStageIndex(currentStage);
  const isFailed = currentStage === 'failed';
  const isCompleted = currentStage === 'completed';

  return (
    <div className={`progress-tracker ${className}`}>
      <div className="progress-header">
        <div className="progress-title">
          {isFailed ? 'Generation Failed' : isCompleted ? 'Video Ready!' : 'Generating Video...'}
        </div>
        {!isFailed && !isCompleted && (
          <div className="progress-eta">{estimatedTime} remaining</div>
        )}
      </div>

      {/* Progress Bar */}
      {!isFailed && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            <span className="progress-percent">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* Stages */}
      <div className="stages-container">
        {STAGES.filter((s) => s.id !== 'failed').map((stage, index) => {
          const stageStatus = getStageStatus(index, stageIndex, isCompleted);
          const isCurrentStage = index === stageIndex;

          return (
            <div key={stage.id} className={`stage stage-${stageStatus}`}>
              <div className="stage-icon-wrapper">
                <span className="stage-icon">{stage.icon}</span>
                {stageStatus === 'completed' && (
                  <span className="stage-check">✓</span>
                )}
                {isCurrentStage && !isCompleted && (
                  <span className="stage-spinner">⟳</span>
                )}
              </div>
              <div className="stage-info">
                <div className="stage-label">{stage.label}</div>
                <div className="stage-description">{stage.description}</div>
              </div>
              {isCurrentStage && !isCompleted && (
                <div className="stage-percent">{Math.round(progress)}%</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error State */}
      {isFailed && error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Completed State */}
      {isCompleted && (
        <div className="completed-state">
          <div className="success-icon">🎉</div>
          <div className="success-message">Your video is ready to view!</div>
        </div>
      )}

      <style>{`
        .progress-tracker {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-title {
          font-size: 18px;
          font-weight: 700;
          color: #2d3748;
        }

        .progress-eta {
          font-size: 14px;
          color: #718096;
        }

        /* Progress Bar */
        .progress-bar-container {
          width: 100%;
          height: 32px;
          background-color: #edf2f7;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #DFFF00 0%, #c4e600 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: width 0.3s ease;
          position: relative;
        }

        .progress-percent {
          font-size: 13px;
          font-weight: 700;
          color: #2d3748;
        }

        /* Stages */
        .stages-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stage {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .stage-current {
          background-color: #ffffcc;
        }

        .stage-completed {
          opacity: 0.7;
        }

        .stage-pending {
          opacity: 0.5;
        }

        .stage-icon-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background-color: #f7fafc;
          border-radius: 8px;
        }

        .stage-current .stage-icon-wrapper {
          background-color: #DFFF00;
        }

        .stage-icon {
          z-index: 1;
        }

        .stage-check {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background-color: #48bb78;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .stage-spinner {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background-color: #2d3748;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .stage-info {
          flex: 1;
        }

        .stage-label {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .stage-description {
          font-size: 12px;
          color: #718096;
          margin-top: 2px;
        }

        .stage-percent {
          font-size: 14px;
          font-weight: 700;
          color: #2d3748;
        }

        /* Error State */
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background-color: #fed7d7;
          border-radius: 8px;
        }

        .error-icon {
          font-size: 32px;
        }

        .error-message {
          font-size: 14px;
          color: #c53030;
          text-align: center;
        }

        .retry-button {
          padding: 8px 16px;
          background-color: #2d3748;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background-color: #1a202c;
        }

        /* Completed State */
        .completed-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background-color: #c6f6d5;
          border-radius: 8px;
        }

        .success-icon {
          font-size: 32px;
        }

        .success-message {
          font-size: 16px;
          font-weight: 600;
          color: #22543d;
        }

        @media (max-width: 640px) {
          .stage {
            flex-wrap: wrap;
          }

          .stage-percent {
            width: 100%;
            text-align: right;
          }
        }
      `}</style>
    </div>
  );
}

function getStageStatus(
  index: number,
  currentIndex: number,
  isCompleted: boolean
): 'completed' | 'current' | 'pending' {
  if (isCompleted) return 'completed';
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'pending';
}
