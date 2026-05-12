# ScriptEditor Component

Advanced script editor with real-time scene parsing, validation, and breakdown capabilities for video AI content generation.

## Features

- **Real-time Scene Parsing**: Automatically detects and parses scene headings using standard screenplay format
- **Character Detection**: Identifies all characters and tracks their dialogue lines
- **Duration Estimation**: Estimates scene duration based on word count and dialogue
- **Script Validation**: Provides errors, warnings, and suggestions for improving your script
- **Scene Breakdown**: Toggle-able panel showing detailed scene information
- **Character Tracking**: Lists all characters with their first appearance and dialogue count
- **Auto-resize**: Textarea automatically adjusts height based on content
- **Character Limit**: Optional character limit with warning indicators
- **Statistics Display**: Shows word count, scene count, estimated duration, and character count

## Script Format

The ScriptEditor expects scripts in standard screenplay format:

```
[Scene N] - [INT./EXT.] LOCATION - TIME_OF_DAY

CHARACTER_NAME
(dialogue direction, if any)
Dialogue text here

Action lines describe what's happening.

CHARACTER_NAME (V.O.)
Voice-over dialogue
```

### Example

```
[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
(entering, excited)
Hey everyone, welcome back to the channel!

Alex walks to the counter, smiling at the barista.

ALEX
Can I get a latte, please?

[Scene 2] - EXT. PARK - AFTERNOON

Alex walks through the park, gesturing at the scenery.

ALEX (V.O.)
Today we're going to explore something amazing.

Birds chirp in the background as Alex finds a bench to sit on.
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | **required** | Current script text |
| `onChange` | `(value: string) => void` | **required** | Callback when script changes |
| `maxLength` | `number` | `10000` | Maximum character limit |
| `placeholder` | `string` | Default placeholder text | Custom placeholder text |
| `disabled` | `boolean` | `false` | Disable editing |
| `className` | `string` | `''` | Additional CSS classes |
| `showSceneBreakdown` | `boolean` | `true` | Show scene breakdown panel |
| `onSceneParse` | `(scenes: ParsedScene[]) => void` | `undefined` | Callback when scenes are parsed |

## Types

### ParsedScene

```typescript
interface ParsedScene {
  id: string;                    // Unique scene ID (e.g., "scene-1")
  number: number;                // Scene number
  heading: string;               // Full scene heading
  location?: string;             // Parsed location
  time?: string;                 // Parsed time of day
  type?: 'INT' | 'EXT' | 'INT/EXT'; // Scene type
  content: string;               // Scene content
  dialogueCount: number;         // Number of dialogue lines
  actionCount: number;           // Number of action lines
  estimatedDuration: number;     // Estimated duration in seconds
  characters: string[];          // Characters in scene
  startLine: number;             // Starting line number
  endLine: number;               // Ending line number
}
```

### CharacterMention

```typescript
interface CharacterMention {
  name: string;              // Character name
  dialogueLines: number;     // Total dialogue lines
  firstAppearance: number;   // First scene number
}
```

### ScriptValidation

```typescript
interface ScriptValidation {
  isValid: boolean;          // Whether script is valid
  errors: string[];          // Critical errors
  warnings: string[];        // Non-critical issues
  suggestions: string[];     // Improvement suggestions
}
```

## Usage Examples

### Basic Usage

```tsx
import { useState } from 'react';
import ScriptEditor from './components/video/ScriptEditor';

function MyComponent() {
  const [script, setScript] = useState('');

  return (
    <ScriptEditor
      value={script}
      onChange={setScript}
    />
  );
}
```

### With Scene Parsing Callback

```tsx
function VideoGenerator() {
  const [script, setScript] = useState('');
  const [scenes, setScenes] = useState<ParsedScene[]>([]);

  const handleSceneParse = (parsedScenes: ParsedScene[]) => {
    setScenes(parsedScenes);
    console.log('Total duration:', parsedScenes.reduce(
      (acc, scene) => acc + scene.estimatedDuration,
      0
    ));
  };

  return (
    <ScriptEditor
      value={script}
      onChange={setScript}
      onSceneParse={handleSceneParse}
    />
  );
}
```

### With Custom Limits

```tsx
function ShortFormVideo() {
  const [script, setScript] = useState('');

  return (
    <ScriptEditor
      value={script}
      onChange={setScript}
      maxLength={2000}
      placeholder="Keep it short and engaging..."
      showSceneBreakdown={true}
    />
  );
}
```

### View-Only Mode

```tsx
function ScriptViewer({ script }: { script: string }) {
  return (
    <ScriptEditor
      value={script}
      onChange={() => {}}
      disabled={true}
      showSceneBreakdown={true}
    />
  );
}
```

## Validation Rules

The ScriptEditor validates your script and provides feedback:

### Errors
- Empty script
- No scenes detected
- Invalid scene format

### Warnings
- Scene numbering issues
- Missing scene type (INT./EXT.)
- Missing location
- Missing time of day

### Suggestions
- Very short scenes (< 5 seconds)
- No character dialogue
- Content improvement suggestions

## Parsing Logic

### Scene Detection
Scenes are detected using the pattern: `[Scene N] - LOCATION - TIME`

### Character Detection
Characters are identified by:
- Uppercase names at the start of lines
- Short lines (< 60 characters)
- Not containing periods (to avoid action lines)

### Duration Estimation
- Based on word count (0.5 seconds per word)
- Includes both dialogue and action lines
- Rough approximation for planning purposes

## Styling

The component uses inline styles with CSS-in-JS. You can customize appearance using the `className` prop:

```tsx
<ScriptEditor
  value={script}
  onChange={setScript}
  className="my-custom-class"
/>
```

```css
.my-custom-class {
  border: 2px solid #DFFF00;
  border-radius: 12px;
  padding: 20px;
}
```

## Best Practices

1. **Use Standard Format**: Follow the screenplay format for best parsing results
2. **Number Scenes Consecutively**: Use [Scene 1], [Scene 2], etc.
3. **Include Scene Types**: Always specify INT. or EXT. for scene types
4. **Character Names**: Use consistent uppercase names for characters
5. **Dialogue Directions**: Use parentheses for tone/direction: `(excited)`, `(whispering)`
6. **Voice-Over**: Mark voice-over with `(V.O.)` after character name
7. **Test Parsing**: Use the scene breakdown to verify parsing accuracy

## Integration with Video Generation

The ScriptEditor is designed to work seamlessly with video generation workflows:

```tsx
async function generateVideo(script: string, scenes: ParsedScene[]) {
  const response = await fetch('/api/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      script,
      scenes: scenes.map(s => ({
        number: s.number,
        location: s.location,
        time: s.time,
        type: s.type,
        duration: s.estimatedDuration,
      })),
    }),
  });

  return response.json();
}
```

## Performance Considerations

- Scene parsing is memoized for performance
- Parsing occurs on every script change
- For very long scripts (>100 scenes), consider debouncing the onChange handler
- Scene breakdown can be toggled off for better performance

## Future Enhancements

Potential improvements for future versions:
- Real-time collaboration
- Script versioning
- Import/export from Final Draft, Celtx, etc.
- Auto-completion for character names
- Scene reordering
- Drag-and-drop scene management
- Script templates
- AI-powered script suggestions
- Integration with character database

## Troubleshooting

### Scenes Not Detected
- Verify scene heading format: `[Scene N] - LOCATION - TIME`
- Check for extra spaces or typos
- Ensure scene numbers are included

### Characters Not Detected
- Character names must be in ALL CAPS
- Character lines should be short (< 60 characters)
- Avoid periods in character names

### Duration Seems Wrong
- Duration is a rough estimate (0.5s per word)
- Actual video duration will vary based on pacing
- Use as planning estimate, not exact timing

## See Also

- [Video AI Documentation](../../../docs/video-ai.md)
- [Scene Parser Tests](../../../__tests__/ScriptEditor.test.tsx)
- [Usage Examples](./ScriptEditor.example.tsx)
