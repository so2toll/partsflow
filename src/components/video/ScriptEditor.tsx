/**
 * ScriptEditor Component
 *
 * Advanced script editor with scene parsing and real-time validation:
 * - Character limit display with warnings
 * - Scene hint/placeholder text
 * - Word count
 * - Auto-resize textarea
 * - Scene parsing and breakdown
 * - Character dialogue detection
 * - Scene duration estimation
 * - Script validation and suggestions
 *
 * @component video/ScriptEditor
 */

import { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Represents a parsed scene from the script
 */
export interface ParsedScene {
  id: string;
  number: number;
  heading: string;
  location?: string;
  time?: string;
  type?: 'INT' | 'EXT' | 'INT/EXT';
  content: string;
  dialogueCount: number;
  actionCount: number;
  estimatedDuration: number; // in seconds
  characters: string[];
  startLine: number;
  endLine: number;
}

/**
 * Represents a character found in the script
 */
export interface CharacterMention {
  name: string;
  dialogueLines: number;
  firstAppearance: number; // scene number
}

/**
 * Script validation result
 */
export interface ScriptValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSceneBreakdown?: boolean;
  onSceneParse?: (scenes: ParsedScene[]) => void;
}

/**
 * Default placeholder with proper script format
 */
const DEFAULT_PLACEHOLDER = `Write your video script here...

Example format:
[Scene 1] - INT. COFFEE SHOP - MORNING
ALEX
(entering, excited)
Hey everyone, welcome back!

[Scene 2] - EXT. PARK - AFTERNOON
Alex walks through the park, gesturing animatedly.

ALEX (V.O.)
Today we're going to explore something amazing...`;

/**
 * Parse script text into structured scenes
 * @param script - The script text to parse
 * @returns Array of parsed scenes
 */
export function parseScenes(script: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const lines = script.split('\n');
  let currentScene: Partial<ParsedScene> | null = null;
  let sceneNumber = 0;
  let lineIndex = 0;

  // Scene heading pattern: [Scene N] - LOCATION - TIME
  const scenePattern = /^\[Scene\s+(\d+)\]\s*-\s*(.+)$/i;
  const locationPattern = /^(INT\.|EXT\.|INT\/EXT\.)\s+(.+?)\s*-\s*(.+)$/i;
  const dialoguePattern = /^([A-Z][A-Z0-9\s']+)(?:\s*\((.*?)\))?$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const sceneMatch = line.match(scenePattern);

    if (sceneMatch) {
      // Save previous scene
      if (currentScene && currentScene.content) {
        scenes.push({
          id: `scene-${sceneNumber}`,
          number: sceneNumber,
          heading: currentScene.heading || '',
          content: currentScene.content.trim(),
          dialogueCount: currentScene.dialogueCount || 0,
          actionCount: currentScene.actionCount || 0,
          estimatedDuration: currentScene.estimatedDuration || 0,
          characters: currentScene.characters || [],
          startLine: currentScene.startLine || 0,
          endLine: i - 1,
        });
      }

      // Start new scene
      sceneNumber = parseInt(sceneMatch[1], 10);
      const locationInfo = sceneMatch[2].trim();

      currentScene = {
        number: sceneNumber,
        heading: line,
        content: '',
        dialogueCount: 0,
        actionCount: 0,
        estimatedDuration: 0,
        characters: [],
        startLine: i,
      };

      // Parse location info
      const locationMatch = locationInfo.match(locationPattern);
      if (locationMatch) {
        currentScene.type = locationMatch[1].toUpperCase() as 'INT' | 'EXT' | 'INT/EXT';
        currentScene.location = locationMatch[2].trim();
        currentScene.time = locationMatch[3].trim();
      }
    } else if (currentScene) {
      // Add content to current scene
      currentScene.content += line + '\n';

      // Check for dialogue
      const dialogueMatch = line.match(dialoguePattern);
      if (dialogueMatch && line.length < 60 && !line.includes('.')) {
        currentScene.dialogueCount = (currentScene.dialogueCount || 0) + 1;
        const characterName = dialogueMatch[1].trim();
        if (!currentScene.characters?.includes(characterName)) {
          currentScene.characters = [...(currentScene.characters || []), characterName];
        }
      } else {
        currentScene.actionCount = (currentScene.actionCount || 0) + 1;
      }

      // Estimate duration (rough approximation)
      const words = line.split(/\s+/).length;
      currentScene.estimatedDuration = (currentScene.estimatedDuration || 0) + (words * 0.5); // 0.5s per word
    }
  }

  // Save last scene
  if (currentScene && currentScene.content) {
    scenes.push({
      id: `scene-${sceneNumber}`,
      number: sceneNumber,
      heading: currentScene.heading || '',
      content: currentScene.content.trim(),
      dialogueCount: currentScene.dialogueCount || 0,
      actionCount: currentScene.actionCount || 0,
      estimatedDuration: currentScene.estimatedDuration || 0,
      characters: currentScene.characters || [],
      startLine: currentScene.startLine || 0,
      endLine: lines.length - 1,
    });
  }

  return scenes;
}

/**
 * Extract all character mentions from parsed scenes
 * @param scenes - Array of parsed scenes
 * @returns Array of character mentions
 */
export function extractCharacters(scenes: ParsedScene[]): CharacterMention[] {
  const characterMap = new Map<string, CharacterMention>();

  scenes.forEach((scene) => {
    scene.characters.forEach((characterName) => {
      if (!characterMap.has(characterName)) {
        characterMap.set(characterName, {
          name: characterName,
          dialogueLines: 0,
          firstAppearance: scene.number,
        });
      }
      const character = characterMap.get(characterName)!;
      character.dialogueLines += scene.dialogueCount;
    });
  });

  return Array.from(characterMap.values()).sort((a, b) => a.firstAppearance - b.firstAppearance);
}

/**
 * Validate script and provide suggestions
 * @param script - The script text to validate
 * @param scenes - Array of parsed scenes
 * @returns Validation result with errors, warnings, and suggestions
 */
export function validateScript(script: string, scenes: ParsedScene[]): ScriptValidation {
  const validation: ScriptValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  // Check if script is empty
  if (!script.trim()) {
    validation.isValid = false;
    validation.errors.push('Script is empty');
    return validation;
  }

  // Check if there are any scenes
  if (scenes.length === 0) {
    validation.isValid = false;
    validation.errors.push('No scenes detected. Use format: [Scene N] - LOCATION - TIME');
    return validation;
  }

  // Check scene numbering
  for (let i = 0; i < scenes.length; i++) {
    if (scenes[i].number !== i + 1) {
      validation.warnings.push(`Scene ${i + 1} is numbered as ${scenes[i].number}`);
    }
  }

  // Check for very short scenes
  scenes.forEach((scene) => {
    if (scene.estimatedDuration < 5) {
      validation.suggestions.push(`Scene ${scene.number} is very short (${scene.estimatedDuration.toFixed(1)}s)`);
    }
  });

  // Check for character consistency
  const characters = extractCharacters(scenes);
  if (characters.length === 0) {
    validation.suggestions.push('Consider adding character dialogue for more engaging content');
  }

  // Check for proper scene heading format
  scenes.forEach((scene) => {
    if (!scene.type) {
      validation.warnings.push(`Scene ${scene.number}: Missing scene type (INT./EXT.)`);
    }
    if (!scene.location) {
      validation.warnings.push(`Scene ${scene.number}: Missing location`);
    }
    if (!scene.time) {
      validation.warnings.push(`Scene ${scene.number}: Missing time of day`);
    }
  });

  return validation;
}

/**
 * Format duration in human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export default function ScriptEditor({
  value,
  onChange,
  maxLength = 10000,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
  className = '',
  showSceneBreakdown = true,
  onSceneParse,
}: ScriptEditorProps) {
  const [charCount, setCharCount] = useState(value.length);
  const [wordCount, setWordCount] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse scenes from script
  const scenes = useMemo(() => parseScenes(value), [value]);

  // Extract characters
  const characters = useMemo(() => extractCharacters(scenes), [scenes]);

  // Validate script
  const validation = useMemo(() => validateScript(value, scenes), [value, scenes]);

  // Calculate total estimated duration
  const totalDuration = useMemo(
    () => scenes.reduce((acc, scene) => acc + scene.estimatedDuration, 0),
    [scenes]
  );

  // Notify parent of scene changes
  useEffect(() => {
    onSceneParse?.(scenes);
  }, [scenes, onSceneParse]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`;
    }
  }, [value]);

  // Update counts when value changes
  useEffect(() => {
    setCharCount(value.length);
    setWordCount(value.trim() ? value.trim().split(/\s+/).length : 0);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className={`script-editor ${className}`}>
      {/* Header */}
      <div className="script-header">
        <label htmlFor="script-input" className="script-label">
          Video Script
        </label>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="breakdown-toggle"
          disabled={disabled}
        >
          {showBreakdown ? '▼' : '▶'} Scene Breakdown
        </button>
      </div>

      {/* Main Editor */}
      <textarea
        ref={textareaRef}
        id="script-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="script-textarea"
        rows={12}
      />

      {/* Footer Stats */}
      <div className="script-footer">
        <div className="script-stats">
          <span className="stat">{wordCount} words</span>
          <span className="stat">{scenes.length} scenes</span>
          <span className="stat">{formatDuration(totalDuration)}</span>
          <span className="stat">{charCount} / {maxLength.toLocaleString()} characters</span>
        </div>
        <div className={`char-indicator ${charCount > maxLength * 0.9 ? 'warning' : ''}`}>
          {charCount > maxLength * 0.9 && '⚠️ approaching limit'}
        </div>
      </div>

      {/* Scene Breakdown */}
      {showBreakdown && showSceneBreakdown && (
        <div className="scene-breakdown">
          {/* Validation Messages */}
          {!validation.isValid && validation.errors.length > 0 && (
            <div className="validation-errors">
              <h4>Errors:</h4>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="validation-warnings">
              <h4>Warnings:</h4>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.suggestions.length > 0 && (
            <div className="validation-suggestions">
              <h4>Suggestions:</h4>
              <ul>
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Scenes List */}
          <div className="scenes-list">
            <h4>Scenes ({scenes.length})</h4>
            {scenes.map((scene) => (
              <div key={scene.id} className="scene-item">
                <div className="scene-header">
                  <span className="scene-number">Scene {scene.number}</span>
                  <span className="scene-duration">{formatDuration(scene.estimatedDuration)}</span>
                </div>
                <div className="scene-details">
                  {scene.type && <span className="scene-type">{scene.type}</span>}
                  {scene.location && <span className="scene-location">{scene.location}</span>}
                  {scene.time && <span className="scene-time">{scene.time}</span>}
                </div>
                <div className="scene-stats">
                  <span>{scene.dialogueCount} dialogue lines</span>
                  <span>{scene.actionCount} action lines</span>
                  {scene.characters.length > 0 && (
                    <span>{scene.characters.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Characters List */}
          {characters.length > 0 && (
            <div className="characters-list">
              <h4>Characters ({characters.length})</h4>
              <ul>
                {characters.map((character) => (
                  <li key={character.name}>
                    <strong>{character.name}</strong> - {character.dialogueLines} lines
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        .script-editor {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .script-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .script-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-neutral-600);
        }

        .breakdown-toggle {
          padding: 6px var(--spacing-sm);
          background-color: var(--color-surface-100);
          border: 1px solid var(--color-surface-500);
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-neutral-500);
          cursor: pointer;
          transition: all 200ms;
        }

        .breakdown-toggle:hover:not(:disabled) {
          background-color: var(--color-surface-200);
          border-color: var(--color-neutral-300);
        }

        .breakdown-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .script-textarea {
          width: 100%;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.6;
          border: 1px solid var(--color-surface-500);
          border-radius: var(--radius-md);
          resize: vertical;
          min-height: 200px;
          max-height: 500px;
          transition: border-color 200ms, box-shadow 200ms;
          background-color: var(--color-surface-50);
          color: var(--color-neutral-600);
        }

        .script-textarea:focus {
          outline: none;
          border-color: var(--color-primary-300);
          box-shadow: 0 0 0 2px var(--color-primary-300);
        }

        .script-textarea:disabled {
          background-color: var(--color-surface-100);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .script-textarea::placeholder {
          color: var(--color-neutral-400);
        }

        .script-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .script-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat {
          font-size: 12px;
          color: var(--color-neutral-400);
        }

        .char-indicator {
          font-size: 12px;
          color: var(--color-success-500);
          font-weight: 500;
        }

        .char-indicator.warning {
          color: var(--color-warning-500);
        }

        /* Scene Breakdown */
        .scene-breakdown {
          padding: 16px;
          background-color: var(--color-surface-100);
          border: 1px solid var(--color-surface-500);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .validation-errors,
        .validation-warnings,
        .validation-suggestions {
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
        }

        .validation-errors {
          background-color: var(--color-danger-50);
          border: 1px solid var(--color-danger-500);
        }

        .validation-warnings {
          background-color: var(--color-warning-50);
          border: 1px solid var(--color-warning-500);
        }

        .validation-suggestions {
          background-color: var(--color-success-50);
          border: 1px solid var(--color-success-500);
        }

        .validation-errors h4,
        .validation-warnings h4,
        .validation-suggestions h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-neutral-600);
        }

        .validation-errors ul,
        .validation-warnings ul,
        .validation-suggestions ul {
          margin: 0;
          padding-left: 20px;
        }

        .validation-errors li,
        .validation-warnings li,
        .validation-suggestions li {
          font-size: 12px;
          margin-bottom: var(--spacing-xs);
          color: var(--color-neutral-600);
        }

        .scenes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .scenes-list h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-neutral-600);
        }

        .scene-item {
          padding: var(--spacing-sm);
          background-color: var(--color-surface-50);
          border: 1px solid var(--color-surface-500);
          border-radius: var(--radius-md);
          transition: box-shadow 200ms;
        }

        .scene-item:hover {
          box-shadow: var(--shadow-card);
        }

        .scene-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .scene-number {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-neutral-600);
        }

        .scene-duration {
          font-size: 12px;
          color: var(--color-neutral-400);
        }

        .scene-details {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .scene-type {
          padding: 2px 6px;
          background-color: var(--color-primary-300);
          color: var(--color-neutral-900);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .scene-location,
        .scene-time {
          font-size: 12px;
          color: var(--color-neutral-500);
        }

        .scene-stats {
          display: flex;
          gap: var(--spacing-sm);
          font-size: 11px;
          color: var(--color-neutral-400);
        }

        .characters-list {
          display: flex;
          flex-direction: column;
        }

        .characters-list h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-neutral-600);
        }

        .characters-list ul {
          margin: 0;
          padding-left: 20px;
        }

        .characters-list li {
          font-size: 12px;
          color: var(--color-neutral-500);
          margin-bottom: var(--spacing-xs);
        }

        @media (max-width: 640px) {
          .script-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .script-footer {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .scene-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
          }
        }
      `}</style>
    </div>
  );
}
