/**
 * ScriptEditor Example Usage
 *
 * This file demonstrates various ways to use the ScriptEditor component
 * with scene parsing capabilities.
 */

import { useState } from 'react';
import ScriptEditor, { ParsedScene } from './ScriptEditor';

/**
 * Example 1: Basic usage with scene parsing callback
 */
export function BasicExample() {
  const [script, setScript] = useState('');

  const handleSceneParse = (scenes: ParsedScene[]) => {
    console.log('Parsed scenes:', scenes);
    // You can use this data to preview scenes, estimate costs, etc.
  };

  return (
    <ScriptEditor
      value={script}
      onChange={setScript}
      onSceneParse={handleSceneParse}
    />
  );
}

/**
 * Example 2: With character limit and custom placeholder
 */
export function WithLimitsExample() {
  const [script, setScript] = useState('');

  return (
    <ScriptEditor
      value={script}
      onChange={setScript}
      maxLength={5000}
      placeholder="Write your script here..."
      showSceneBreakdown={true}
    />
  );
}

/**
 * Example 3: Disabled state for viewing mode
 */
export function ViewOnlyExample({ script }: { script: string }) {
  return (
    <ScriptEditor
      value={script}
      onChange={() => {}}
      disabled={true}
      showSceneBreakdown={true}
    />
  );
}

/**
 * Example 4: With scene breakdown hidden by default
 */
export function NoBreakdownExample() {
  const [script, setScript] = useState('');

  return (
    <ScriptEditor
      value={script}
      onChange={setScript}
      showSceneBreakdown={false}
    />
  );
}

/**
 * Example 5: Full-featured example with scene preview
 */
export function FullFeaturedExample() {
  const [script, setScript] = useState('');
  const [parsedScenes, setParsedScenes] = useState<ParsedScene[]>([]);

  const handleSceneParse = (scenes: ParsedScene[]) => {
    setParsedScenes(scenes);
  };

  const totalDuration = parsedScenes.reduce(
    (acc, scene) => acc + scene.estimatedDuration,
    0
  );

  return (
    <div>
      <ScriptEditor
        value={script}
        onChange={setScript}
        maxLength={10000}
        onSceneParse={handleSceneParse}
        showSceneBreakdown={true}
      />

      {/* Additional scene preview */}
      {parsedScenes.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Scene Summary</h3>
          <p>Total Scenes: {parsedScenes.length}</p>
          <p>Estimated Duration: {Math.floor(totalDuration / 60)}m {Math.floor(totalDuration % 60)}s</p>
          <p>
            Characters:{' '}
            {Array.from(
              new Set(parsedScenes.flatMap((s) => s.characters))
            ).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Pre-populated with example script
 */
export function PrePopulatedExample() {
  const [script, setScript] = useState(`[Scene 1] - INT. COFFEE SHOP - MORNING

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

ALEX
Let's get started!

[Scene 3] - INT. HOME OFFICE - EVENING

Alex sits at a desk with a computer.

ALEX
Thanks for watching. Don't forget to like and subscribe!`);

  return (
    <ScriptEditor
      value={script}
      onChange={setScript}
      showSceneBreakdown={true}
    />
  );
}

/**
 * Example 7: Integration with form submission
 */
export function FormIntegrationExample() {
  const [script, setScript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!script.trim()) {
      alert('Please enter a script');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to API
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const result = await response.json();
      console.log('Video generated:', result);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate video');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ScriptEditor
        value={script}
        onChange={setScript}
        onSceneParse={(scenes) => {
          console.log('Will generate', scenes.length, 'scenes');
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting || !script.trim()}
        style={{
          marginTop: '16px',
          padding: '12px 24px',
          background: '#DFFF00',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting || !script.trim() ? 0.5 : 1,
        }}
      >
        {isSubmitting ? 'Generating...' : 'Generate Video'}
      </button>
    </form>
  );
}

/**
 * Example 8: Custom styling with className
 */
export function CustomStylingExample() {
  const [script, setScript] = useState('');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <ScriptEditor
        value={script}
        onChange={setScript}
        className="custom-script-editor"
      />

      <style>{`
        .custom-script-editor {
          border: 2px solid #DFFF00;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
