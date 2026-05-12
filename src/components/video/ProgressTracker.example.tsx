/**
 * ProgressTracker Component Usage Examples
 *
 * This file demonstrates various ways to use the ProgressTracker component
 * in your application. Copy and adapt these examples as needed.
 *
 * @example
 * ```tsx
 * import ProgressTracker from '@/components/video/ProgressTracker';
 * import type { PipelineStage } from '@/types/video';
 * ```
 */

import ProgressTracker from './ProgressTracker';
import type { PipelineStage } from '@/types/video';

// ============================================================================
// EXAMPLE 1: Basic Usage with Static Props
// ============================================================================

export function BasicExample() {
  return (
    <ProgressTracker
      currentStage="generating"
      progress={45}
      error={null}
      className="my-progress-tracker"
    />
  );
}

// ============================================================================
// EXAMPLE 2: With Retry Handler
// ============================================================================

export function WithRetryExample() {
  const handleRetry = () => {
    console.log('Retrying video generation...');
    // Implement retry logic here
  };

  return (
    <ProgressTracker
      currentStage="failed"
      progress={35}
      error="Failed to generate scene 3: Insufficient GPU resources"
      onRetry={handleRetry}
    />
  );
}

// ============================================================================
// EXAMPLE 3: Dynamic State Updates
// ============================================================================

export function DynamicStateExample() {
  const [stage, setStage] = useState<PipelineStage>('parsing');
  const [progress, setProgress] = useState(0);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setStage('completed');
          return 100;
        }
        return prev + 5;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ProgressTracker
      currentStage={stage}
      progress={progress}
      error={null}
    />
  );
}

// ============================================================================
// EXAMPLE 4: With Real-time Polling Integration
// ============================================================================

export function WithPollingExample({ projectId }: { projectId: string }) {
  const [stage, setStage] = useState<PipelineStage>('parsing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Poll for status updates
  useEffect(() => {
    if (stage === 'completed' || stage === 'failed') {
      return; // Stop polling if terminal state
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/video/status?projectId=${projectId}`);
        const data = await response.json();

        setStage(data.videoStatus);
        setProgress(data.progress);
        setError(data.errorMessage || null);
      } catch (err) {
        console.error('Error polling status:', err);
        setError('Failed to fetch status');
      }
    };

    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [projectId, stage]);

  const handleRetry = async () => {
    try {
      const response = await fetch('/api/video/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        setStage('parsing');
        setProgress(0);
        setError(null);
      }
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  return (
    <ProgressTracker
      currentStage={stage}
      progress={progress}
      error={error}
      onRetry={handleRetry}
    />
  );
}

// ============================================================================
// EXAMPLE 5: Complete Video Generation Flow
// ============================================================================

export function CompleteFlowExample() {
  const [stage, setStage] = useState<PipelineStage>('parsing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Simulate the complete generation pipeline
  useEffect(() => {
    const stages: PipelineStage[] = ['parsing', 'keyframes', 'generating', 'rendering', 'assembling', 'completed'];
    let currentStageIndex = 0;

    const simulateProgress = () => {
      const currentStageId = stages[currentStageIndex];
      setStage(currentStageId);

      let stageProgress = 0;
      const stageInterval = setInterval(() => {
        stageProgress += 10;

        if (stageProgress >= 100) {
          clearInterval(stageInterval);
          currentStageIndex++;

          if (currentStageIndex < stages.length) {
            setTimeout(simulateProgress, 500); // Brief pause between stages
          }
        }

        // Calculate overall progress
        const overallProgress = Math.round(
          ((currentStageIndex * 100) + stageProgress) / stages.length
        );
        setProgress(overallProgress);
      }, 500);
    };

    simulateProgress();
  }, []);

  return (
    <div>
      <h2>Video Generation Progress</h2>
      <ProgressTracker
        currentStage={stage}
        progress={progress}
        error={error}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Integration with Event-Based Updates (Recommended)
// ============================================================================

/**
 * This example shows the recommended pattern for integrating ProgressTracker
 * with server-sent events or polling. The component automatically listens
 * for 'video-progress-update' events, so you just need to dispatch them.
 */
export function EventDrivenExample({ projectId }: { projectId: string }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Poll for status updates and dispatch events
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/video/status?projectId=${projectId}`);
        const data = await response.json();

        // Dispatch event - ProgressTracker will automatically update
        window.dispatchEvent(new CustomEvent('video-progress-update', {
          detail: {
            stage: data.videoStatus,
            progress: data.progress
          }
        }));

        if (data.errorMessage) {
          setError(data.errorMessage);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  const handleRetry = async () => {
    // Implement retry logic
    console.log('Retrying...');
  };

  return (
    <ProgressTracker
      currentStage="parsing" // Initial state
      progress={0} // Initial progress
      error={error}
      onRetry={handleRetry}
    />
  );
}

// ============================================================================
// EXAMPLE 7: All States Showcase
// ============================================================================

export function AllStatesShowcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <section>
        <h3>1. Parsing Stage (20%)</h3>
        <ProgressTracker currentStage="parsing" progress={20} />
      </section>

      <section>
        <h3>2. Keyframes Stage (45%)</h3>
        <ProgressTracker currentStage="keyframes" progress={45} />
      </section>

      <section>
        <h3>3. Generating Stage (60%)</h3>
        <ProgressTracker currentStage="generating" progress={60} />
      </section>

      <section>
        <h3>4. Rendering Stage (85%)</h3>
        <ProgressTracker currentStage="rendering" progress={85} />
      </section>

      <section>
        <h3>5. Assembling Stage (95%)</h3>
        <ProgressTracker currentStage="assembling" progress={95} />
      </section>

      <section>
        <h3>6. Completed (100%)</h3>
        <ProgressTracker currentStage="completed" progress={100} />
      </section>

      <section>
        <h3>7. Failed with Error</h3>
        <ProgressTracker
          currentStage="failed"
          progress={35}
          error="GPU resources unavailable. Please try again."
          onRetry={() => alert('Retrying...')}
        />
      </section>
    </div>
  );
}
