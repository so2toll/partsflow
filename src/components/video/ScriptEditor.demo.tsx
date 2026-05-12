/**
 * ScriptEditor Demo Component
 *
 * This is a demo page showcasing the ScriptEditor component
 * with various example scripts and configurations.
 */

import { useState } from 'react';
import ScriptEditor, { ParsedScene } from './ScriptEditor';

/**
 * Example scripts for demonstration
 */
const EXAMPLE_SCRIPTS = {
  basic: `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
(entering, excited)
Hey everyone, welcome back to the channel!

Alex walks to the counter, smiling at the barista.

ALEX
Can I get a latte, please?`,

  multiScene: `[Scene 1] - INT. COFFEE SHOP - MORNING

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

[Scene 3] - INT. HOME OFFICE - EVENING

Alex sits at a desk with a computer.

ALEX
Thanks for watching. Don't forget to like and subscribe!`,

  multiCharacter: `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
(entering, excited)
Hey everyone, welcome back!

SARAH
(sitting at table)
Hey Alex! How are you?

ALEX
Great! Working on a new video.

SARAH
That's awesome! What's it about?

ALEX
I'll show you. Let me grab a coffee first.

Sarah smiles as Alex walks to the counter.

[Scene 2] - EXT. PARK - AFTERNOON

Alex and Sarah walk through the park together.

ALEX
So, the video is about AI and creativity.

SARAH
That sounds fascinating!

ALEX
Yeah, I think people will love it.

SARAH
I can't wait to see the final result.`,

  complex: `[Scene 1] - INT. APARTMENT - MORNING

JASON
(rubbing sleep from eyes)
What time is it?

MELISSA
(checking phone)
7:30. We're going to be late!

Jason jumps out of bed and rushes to the bathroom.

[Scene 2] - INT. KITCHEN - MORNING

Melissa quickly makes coffee while Jason gets dressed.

JASON (O.S.)
(from bedroom)
Did you see my keys?

MELISSA
(on counter!

Jason runs in, grabbing the keys and coffee.

JASON
Thanks! You're a lifesaver.

[Scene 3] - EXT. STREET - MORNING

Jason and Melissa run to their car. It's raining.

MELISSA
I hope the traffic isn't too bad.

JASON
(starting engine)
With this rain? We'll be lucky if we get there at all.

[Scene 4] - INT. CAR - MORNING

They drive through the rain, tense but focused.

JASON
We can make it. Just need to take the shortcut.

MELISSA
(worried)
The shortcut? Through the construction?

JASON
Trust me.

[Scene 5] - INT. OFFICE - MORNING

Jason and Melissa burst through the doors, breathless.

BOSS
(jumping from his chair)
Where have you two been?

JASON
(smiling)
Sorry boss. Traffic was... interesting.

The boss looks at them, then starts laughing.

BOSS
You're just in time for the meeting. Let's go.

Jason and Melissa exchange relieved glances.`,
};

export default function ScriptEditorDemo() {
  const [script, setScript] = useState(EXAMPLE_SCRIPTS.multiScene);
  const [selectedExample, setSelectedExample] = useState<keyof typeof EXAMPLE_SCRIPTS>('multiScene');
  const [parsedScenes, setParsedScenes] = useState<ParsedScene[]>([]);

  const handleSceneParse = (scenes: ParsedScene[]) => {
    setParsedScenes(scenes);
  };

  const handleExampleChange = (exampleKey: keyof typeof EXAMPLE_SCRIPTS) => {
    setSelectedExample(exampleKey);
    setScript(EXAMPLE_SCRIPTS[exampleKey]);
  };

  const totalDuration = parsedScenes.reduce(
    (acc, scene) => acc + scene.estimatedDuration,
    0
  );

  const allCharacters = Array.from(
    new Set(parsedScenes.flatMap((scene) => scene.characters))
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 12px 0', color: '#2d3748' }}>
          ScriptEditor Component Demo
        </h1>
        <p style={{ fontSize: '16px', color: '#718096', margin: '0' }}>
          Advanced script editor with real-time scene parsing and validation
        </p>
      </div>

      {/* Example Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', display: 'block', marginBottom: '8px' }}>
          Load Example Script:
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExampleChange('basic')}
            style={{
              padding: '8px 16px',
              background: selectedExample === 'basic' ? '#DFFF00' : '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Basic
          </button>
          <button
            onClick={() => handleExampleChange('multiScene')}
            style={{
              padding: '8px 16px',
              background: selectedExample === 'multiScene' ? '#DFFF00' : '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Multi-Scene
          </button>
          <button
            onClick={() => handleExampleChange('multiCharacter')}
            style={{
              padding: '8px 16px',
              background: selectedExample === 'multiCharacter' ? '#DFFF00' : '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Multi-Character
          </button>
          <button
            onClick={() => handleExampleChange('complex')}
            style={{
              padding: '8px 16px',
              background: selectedExample === 'complex' ? '#DFFF00' : '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Complex
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {parsedScenes.length > 0 && (
        <div style={{
          padding: '20px',
          background: '#f7fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>
            Script Statistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Total Scenes</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>{parsedScenes.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Duration</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>
                {Math.floor(totalDuration / 60)}m {Math.floor(totalDuration % 60)}s
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Characters</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>{allCharacters.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Dialogue Lines</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>
                {parsedScenes.reduce((acc, s) => acc + s.dialogueCount, 0)}
              </div>
            </div>
          </div>
          {allCharacters.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px' }}>Characters:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {allCharacters.map((char) => (
                  <span
                    key={char}
                    style={{
                      padding: '4px 12px',
                      background: '#edf2f7',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#4a5568',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Script Editor */}
      <ScriptEditor
        value={script}
        onChange={setScript}
        onSceneParse={handleSceneParse}
        showSceneBreakdown={true}
        maxLength={10000}
      />

      {/* Footer */}
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#718096' }}>
        <p>
          <strong>Tip:</strong> Click "Scene Breakdown" to see parsed scenes, characters, and validation messages
        </p>
        <p style={{ marginTop: '8px' }}>
          Try editing the script above to see real-time parsing in action
        </p>
      </div>
    </div>
  );
}
