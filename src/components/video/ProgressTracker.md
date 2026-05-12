# ProgressTracker Component

## Overview

The `ProgressTracker` component is a React component that displays real-time progress for video generation pipeline stages. It provides visual feedback for multi-stage async operations with estimated time remaining, progress percentage, and status indicators.

## Features

- **Multi-stage progress tracking** - Visualizes each stage of the video generation pipeline
- **Real-time updates** - Automatically updates via custom events from polling
- **Estimated time remaining** - Calculates ETA based on stage progress
- **Error handling** - Displays error messages with retry functionality
- **Responsive design** - Mobile-friendly layout
- **Accessible** - Proper ARIA labels and semantic HTML

## Installation

The component is already installed in your project at:
```
src/components/video/ProgressTracker.tsx
```

## Usage

### Basic Example

```tsx
import ProgressTracker from '@/components/video/ProgressTracker';

function MyComponent() {
  return (
    <ProgressTracker
      currentStage="generating"
      progress={45}
      error={null}
    />
  );
}
```

### With Retry Handler

```tsx
function VideoGenerationPage() {
  const handleRetry = () => {
    // Retry the video generation
    retryGeneration();
  };

  return (
    <ProgressTracker
      currentStage="failed"
      progress={35}
      error="GPU resources unavailable"
      onRetry={handleRetry}
    />
  );
}
```

### With Real-time Updates (Recommended)

The component automatically listens for `video-progress-update` events:

```tsx
import { useEffect } from 'react';
import ProgressTracker from '@/components/video/ProgressTracker';
import type { PipelineStage } from '@/types';

function VideoProgressPage({ projectId }: { projectId: string }) {
  const [stage, setStage] = useState<PipelineStage>('parsing');
  const [progress, setProgress] = useState(0);

  // Poll for updates and dispatch events
  useEffect(() => {
    const pollStatus = async () => {
      const response = await fetch(`/api/video/status?projectId=${projectId}`);
      const data = await response.json();

      // Dispatch event - ProgressTracker will automatically update
      window.dispatchEvent(new CustomEvent('video-progress-update', {
        detail: {
          stage: data.videoStatus,
          progress: data.progress
        }
      }));
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [projectId]);

  return (
    <ProgressTracker
      currentStage={stage}
      progress={progress}
    />
  );
}
```

## Props

### ProgressTrackerProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentStage` | `PipelineStage` | Yes | - | Current pipeline stage (see PipelineStage types below) |
| `progress` | `number` | Yes | - | Progress percentage (0-100) |
| `error` | `string \| null` | No | `null` | Error message to display |
| `onRetry` | `() => void` | No | - | Callback when retry button is clicked |
| `className` | `string` | No | `''` | Additional CSS classes |

## Pipeline Stages

The component tracks the following pipeline stages:

| Stage | Description | Estimated Time |
|-------|-------------|----------------|
| `parsing` | Analyzing script and extracting scenes | ~10s |
| `keyframes` | Creating visual references for each scene | ~30s |
| `generating` | AI is creating scene animations | ~120s |
| `rendering` | Applying final quality settings | ~45s |
| `assembling` | Combining scenes into final video | ~15s |
| `completed` | Video generation finished successfully | - |
| `failed` | An error occurred during generation | - |

## Type Definitions

```typescript
import type { PipelineStage, VideoProgressUpdateDetail } from '@/types/video';

// PipelineStage type
type PipelineStage =
  | 'parsing'
  | 'keyframes'
  | 'generating'
  | 'rendering'
  | 'assembling'
  | 'completed'
  | 'failed';

// Event detail type
interface VideoProgressUpdateDetail {
  stage: PipelineStage;
  progress: number;
}
```

## Component State Management

The component uses internal state to handle real-time updates:

1. **Initial Props** - Sets initial stage and progress from props
2. **Event Listener** - Listens for `video-progress-update` events
3. **Local State** - Updates internal state when events are received
4. **Prop Changes** - Syncs with parent component when props change

This design allows the component to work both:
- **Standalone** - With controlled props from parent
- **Event-driven** - With automatic updates via polling/WebSocket

## Styling

The component uses inline styles within a `<style>` tag in the JSX. This follows the project's pattern for React components (see VideoPlayer, ScriptEditor, UsageMeter).

### Custom Styling

You can add custom classes via the `className` prop:

```tsx
<ProgressTracker
  currentStage="generating"
  progress={45}
  className="my-custom-tracker"
/>
```

Then define styles in your CSS:

```css
.my-custom-tracker {
  max-width: 600px;
  margin: 0 auto;
}
```

## Accessibility

The component includes several accessibility features:

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Clear visual feedback for all states
- Error messages are properly associated with controls

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Component uses `useEffect` for event listener setup/cleanup
- Minimal re-renders due to targeted state updates
- CSS animations use GPU-accelerated properties
- Event listener is properly cleaned up on unmount

## Error Handling

The component handles three types of errors:

1. **Generation Errors** - Displayed when `currentStage="failed"`
2. **Network Errors** - Can be passed via `error` prop
3. **Retry Logic** - Optional `onRetry` callback for user recovery

## Integration Examples

### With Astro Islands

```astro
---
import ProgressTracker from '@/components/video/ProgressTracker';
---

<div class="video-progress">
  <ProgressTracker
    client:idle
    currentStage="generating"
    progress={45}
  />
</div>
```

### With Next.js

```tsx
'use client';
import ProgressTracker from '@/components/video/ProgressTracker';

export default function VideoPage() {
  return <ProgressTracker currentStage="generating" progress={45} />;
}
```

### With Vite/React

```tsx
import ProgressTracker from '@/components/video/ProgressTracker';

function App() {
  return (
    <ProgressTracker
      currentStage="generating"
      progress={45}
    />
  );
}
```

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressTracker from '@/components/video/ProgressTracker';

test('displays current stage and progress', () => {
  render(
    <ProgressTracker
      currentStage="generating"
      progress={45}
    />
  );

  expect(screen.getByText('Generating Video')).toBeInTheDocument();
  expect(screen.getByText('45%')).toBeInTheDocument();
});

test('calls onRetry when retry button clicked', () => {
  const onRetry = jest.fn();
  render(
    <ProgressTracker
      currentStage="failed"
      progress={35}
      error="Test error"
      onRetry={onRetry}
    />
  );

  fireEvent.click(screen.getByText('Try Again'));
  expect(onRetry).toHaveBeenCalled();
});
```

## FAQ

**Q: How do I update progress from server-side polling?**
A: Dispatch a `video-progress-update` event with the new stage and progress. The component will automatically update.

**Q: Can I customize the stage labels?**
A: Currently, stage labels are hardcoded. For custom labels, you can fork the component or extend it.

**Q: How do I hide the estimated time?**
A: The estimated time is automatically calculated. To hide it, you'd need to modify the component's render logic.

**Q: Does this work with SSR?**
A: Yes, the component is SSR-safe. Use `client:idle` or `client:load` directives in Astro for hydration.

## Related Components

- `VideoPlayer` - For playing completed videos
- `ScriptEditor` - For editing video scripts
- `UsageMeter` - For tracking subscription usage
- `QualitySelector` - For selecting render quality

## Maintenance

To modify the pipeline stages or update styling:

1. Edit `src/components/video/ProgressTracker.tsx`
2. Update the `STAGES` array for new stages/time estimates
3. Update the `<style>` block for visual changes
4. Update types in `src/types/video.ts` if changing structure

## License

This component is part of the Data3D Video AI Content Studio project.
