/**
 * ScriptEditor Component Tests
 *
 * Tests for scene parsing, character detection, and validation logic
 */

import { describe, it, expect } from 'vitest';
import {
  parseScenes,
  extractCharacters,
  validateScript,
  formatDuration,
  type ParsedScene,
  type CharacterMention,
} from '../ScriptEditor';

describe('ScriptEditor - Scene Parsing', () => {
  it('should parse empty script', () => {
    const scenes = parseScenes('');
    expect(scenes).toEqual([]);
  });

  it('should parse single scene', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
(entering, excited)
Hey everyone, welcome back!`;

    const scenes = parseScenes(script);
    expect(scenes).toHaveLength(1);
    expect(scenes[0].number).toBe(1);
    expect(scenes[0].type).toBe('INT');
    expect(scenes[0].location).toBe('COFFEE SHOP');
    expect(scenes[0].time).toBe('MORNING');
    expect(scenes[0].characters).toContain('ALEX');
    expect(scenes[0].dialogueCount).toBeGreaterThan(0);
  });

  it('should parse multiple scenes', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
Hey everyone!

[Scene 2] - EXT. PARK - AFTERNOON

Alex walks through the park.

ALEX (V.O.)
Today we're exploring something amazing.`;

    const scenes = parseScenes(script);
    expect(scenes).toHaveLength(2);
    expect(scenes[0].number).toBe(1);
    expect(scenes[1].number).toBe(2);
    expect(scenes[0].type).toBe('INT');
    expect(scenes[1].type).toBe('EXT');
  });

  it('should detect multiple characters in scene', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
Hey everyone!

SARAH
Hi Alex!

ALEX
How are you?

SARAH
Great thanks!`;

    const scenes = parseScenes(script);
    expect(scenes[0].characters).toContain('ALEX');
    expect(scenes[0].characters).toContain('SARAH');
    expect(scenes[0].dialogueCount).toBe(4);
  });

  it('should estimate scene duration', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
This is a test line with some words

[Scene 2] - EXT. PARK - AFTERNOON

Alex walks through the park with a smile on his face.`;

    const scenes = parseScenes(script);
    expect(scenes[0].estimatedDuration).toBeGreaterThan(0);
    expect(scenes[1].estimatedDuration).toBeGreaterThan(0);
  });

  it('should handle INT/EXT scenes', () => {
    const script = `[Scene 1] - INT/EXT. CAR - MORNING

ALEX
(driving)
Let's go for a drive.`;

    const scenes = parseScenes(script);
    expect(scenes[0].type).toBe('INT/EXT');
    expect(scenes[0].location).toBe('CAR');
  });

  it('should handle voice-over dialogue', () => {
    const script = `[Scene 1] - INT. HOME - EVENING

ALEX (V.O.)
This is a voice over narration.`;

    const scenes = parseScenes(script);
    expect(scenes[0].characters).toContain('ALEX (V.O.)');
  });

  it('should count dialogue and action lines separately', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
Hey everyone!

Alex walks to the counter.

SARAH
Hi Alex!

She smiles warmly.`;

    const scenes = parseScenes(script);
    expect(scenes[0].dialogueCount).toBe(2);
    expect(scenes[0].actionCount).toBeGreaterThan(0);
  });

  it('should handle scenes without dialogue', () => {
    const script = `[Scene 1] - INT. EMPTY ROOM - NIGHT

The room is dark and silent. A single light flickers in the corner.

Dust motes dance in the light beam.`;

    const scenes = parseScenes(script);
    expect(scenes[0].dialogueCount).toBe(0);
    expect(scenes[0].actionCount).toBeGreaterThan(0);
  });
});

describe('ScriptEditor - Character Extraction', () => {
  it('should extract characters from scenes', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
Hey everyone!

[Scene 2] - EXT. PARK - AFTERNOON

SARAH
Hi Alex!`;

    const scenes = parseScenes(script);
    const characters = extractCharacters(scenes);

    expect(characters).toHaveLength(2);
    expect(characters[0].name).toBe('ALEX');
    expect(characters[1].name).toBe('SARAH');
    expect(characters[0].firstAppearance).toBe(1);
    expect(characters[1].firstAppearance).toBe(2);
  });

  it('should count dialogue lines per character', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
Hey everyone!

SARAH
Hi Alex!

ALEX
How are you?

SARAH
Great thanks!`;

    const scenes = parseScenes(script);
    const characters = extractCharacters(scenes);

    const alex = characters.find((c) => c.name === 'ALEX');
    const sarah = characters.find((c) => c.name === 'SARAH');

    expect(alex?.dialogueLines).toBe(2);
    expect(sarah?.dialogueLines).toBe(2);
  });

  it('should handle scenes with no characters', () => {
    const script = `[Scene 1] - INT. EMPTY ROOM - NIGHT

The room is dark and silent.`;

    const scenes = parseScenes(script);
    const characters = extractCharacters(scenes);

    expect(characters).toHaveLength(0);
  });
});

describe('ScriptEditor - Validation', () => {
  it('should validate empty script', () => {
    const validation = validateScript('', []);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Script is empty');
  });

  it('should validate script with no scenes', () => {
    const script = 'This is just some text without scene headers.';
    const validation = validateScript(script, []);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      'No scenes detected. Use format: [Scene N] - LOCATION - TIME'
    );
  });

  it('should warn about scene numbering issues', () => {
    const script = `[Scene 1] - INT. ROOM - MORNING

ALEX
Hello.

[Scene 3] - INT. ROOM - AFTERNOON

ALEX
Goodbye.`;

    const scenes = parseScenes(script);
    const validation = validateScript(script, scenes);

    expect(validation.warnings).toContain('Scene 2 is numbered as 3');
  });

  it('should suggest improvements for short scenes', () => {
    const script = `[Scene 1] - INT. ROOM - MORNING

ALEX
Hi.`;

    const scenes = parseScenes(script);
    const validation = validateScript(script, scenes);

    expect(validation.suggestions.length).toBeGreaterThan(0);
    expect(validation.suggestions[0]).toContain('very short');
  });

  it('should warn about missing scene type', () => {
    const script = `[Scene 1] - ROOM - MORNING

ALEX
Hello.`;

    const scenes = parseScenes(script);
    const validation = validateScript(script, scenes);

    expect(validation.warnings).toContain('Scene 1: Missing scene type (INT./EXT.)');
  });

  it('should suggest adding characters', () => {
    const script = `[Scene 1] - INT. EMPTY ROOM - NIGHT

The room is silent and dark.`;

    const scenes = parseScenes(script);
    const validation = validateScript(script, scenes);

    expect(validation.suggestions).toContain(
      'Consider adding character dialogue for more engaging content'
    );
  });

  it('should validate valid script', () => {
    const script = `[Scene 1] - INT. COFFEE SHOP - MORNING

ALEX
Hey everyone, welcome back to the channel!

Alex walks to the counter, smiling at the barista.

ALEX
Can I get a latte, please?

[Scene 2] - EXT. PARK - AFTERNOON

Alex walks through the park, gesturing at the scenery.

ALEX (V.O.)
Today we're going to explore something amazing.

Birds chirp in the background as Alex finds a bench to sit on.`;

    const scenes = parseScenes(script);
    const validation = validateScript(script, scenes);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});

describe('ScriptEditor - Duration Formatting', () => {
  it('should format seconds', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('should format long durations', () => {
    expect(formatDuration(3600)).toBe('60m 0s');
    expect(formatDuration(3665)).toBe('61m 5s');
  });
});

describe('ScriptEditor - Edge Cases', () => {
  it('should handle script with only whitespace', () => {
    const scenes = parseScenes('   \n\n   ');
    expect(scenes).toHaveLength(0);
  });

  it('should handle malformed scene headers', () => {
    const script = `This is not a scene header

ALEX
Hello`;

    const scenes = parseScenes(script);
    expect(scenes).toHaveLength(0);
  });

  it('should handle empty lines in scenes', () => {
    const script = `[Scene 1] - INT. ROOM - MORNING


ALEX


Hello`;

    const scenes = parseScenes(script);
    expect(scenes).toHaveLength(1);
    expect(scenes[0].dialogueCount).toBeGreaterThan(0);
  });

  it('should handle special characters in dialogue', () => {
    const script = `[Scene 1] - INT. ROOM - MORNING

ALEX
Hello! @#$%^&*()`;

    const scenes = parseScenes(script);
    expect(scenes).toHaveLength(1);
    expect(scenes[0].content).toContain('@#$%^&*()');
  });

  it('should handle very long dialogue lines', () => {
    const script = `[Scene 1] - INT. ROOM - MORNING

ALEX
${'This is a very long line of dialogue that goes on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on.'}`;

    const scenes = parseScenes(script);
    expect(scenes).toHaveLength(1);
    // Very long lines should not be detected as dialogue
    expect(scenes[0].dialogueCount).toBe(0);
    expect(scenes[0].actionCount).toBeGreaterThan(0);
  });

  it('should handle numbered characters', () => {
    const script = `[Scene 1] - INT. ROOM - MORNING

ALEX 2
Hello`;

    const scenes = parseScenes(script);
    expect(scenes).toHaveLength(1);
    expect(scenes[0].characters).toContain('ALEX 2');
  });
});
