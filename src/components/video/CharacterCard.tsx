/**
 * CharacterCard Component
 *
 * Card component for displaying character information:
 * - Avatar/thumbnail
 * - Name and description
 * - Personality traits
 * - Voice selection
 * - Edit/delete actions
 *
 * @component video/CharacterCard
 */

import { useState } from 'react';

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  personality?: string[];
  voiceId?: string;
  age?: string;
  style?: 'realistic' | 'cartoon' | 'anime' | 'stylized';
}

interface CharacterCardProps {
  character: Character;
  voices?: VoiceOption[];
  onEdit?: (character: Character) => void;
  onDelete?: (characterId: string) => void;
  onVoiceChange?: (characterId: string, voiceId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_VOICES: VoiceOption[] = [
  { id: 'voice_1', name: 'Alex (US Male)', language: 'en-US', gender: 'male' },
  { id: 'voice_2', name: 'Sarah (US Female)', language: 'en-US', gender: 'female' },
  { id: 'voice_3', name: 'James (UK Male)', language: 'en-GB', gender: 'male' },
];

export default function CharacterCard({
  character,
  voices = DEFAULT_VOICES,
  onEdit,
  onDelete,
  onVoiceChange,
  selectable = false,
  selected = false,
  onSelectChange,
  disabled = false,
  className = '',
}: CharacterCardProps) {
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  const handleDelete = () => {
    if (disabled) return;
    if (confirm(`Delete character "${character.name}"?`)) {
      onDelete?.(character.id);
    }
  };

  const currentVoice = voices.find((v) => v.id === character.voiceId);

  return (
    <div
      className={`character-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${className}`}
    >
      {/* Selection Checkbox */}
      {selectable && (
        <label className="character-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectChange?.(e.target.checked)}
            disabled={disabled}
          />
        </label>
      )}

      {/* Character Avatar */}
      <div className="character-avatar">
        {character.avatarUrl ? (
          <img src={character.avatarUrl} alt={character.name} className="avatar-image" />
        ) : (
          <div className="avatar-placeholder">
            <span className="avatar-initial">{character.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className={`character-style style-${character.style || 'realistic'}`} />
      </div>

      {/* Character Info */}
      <div className="character-info">
        <h3 className="character-name">{character.name}</h3>
        {character.description && (
          <p className="character-description">{character.description}</p>
        )}
        {character.age && (
          <span className="character-age">Age: {character.age}</span>
        )}

        {/* Personality Traits */}
        {character.personality && character.personality.length > 0 && (
          <div className="personality-traits">
            {character.personality.slice(0, 3).map((trait, index) => (
              <span key={index} className="trait-badge">
                {trait}
              </span>
            ))}
          </div>
        )}

        {/* Voice Selection */}
        {voices.length > 0 && (
          <div className="voice-section">
            <button
              onClick={() => setShowVoiceSelector(!showVoiceSelector)}
              className="voice-selector-btn"
              disabled={disabled}
            >
              <span className="voice-icon">🎙️</span>
              <span className="voice-label">
                {currentVoice ? currentVoice.name : 'Select Voice'}
              </span>
              <span className={`voice-arrow ${showVoiceSelector ? 'open' : ''}`}>▼</span>
            </button>

            {showVoiceSelector && (
              <div className="voice-dropdown">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      onVoiceChange?.(character.id, voice.id);
                      setShowVoiceSelector(false);
                    }}
                    className={`voice-option ${voice.id === character.voiceId ? 'active' : ''}`}
                  >
                    <span>{voice.name}</span>
                    <span className="voice-meta">
                      {voice.language} • {voice.gender}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!disabled && (onEdit || onDelete) && (
        <div className="character-actions">
          {onEdit && (
            <button onClick={() => onEdit(character)} className="action-btn edit-btn" aria-label="Edit character">
              ✏️
            </button>
          )}
          {onDelete && (
            <button onClick={handleDelete} className="action-btn delete-btn" aria-label="Delete character">
              🗑️
            </button>
          )}
        </div>
      )}

      <style>{`
        .character-card {
          position: relative;
          display: flex;
          gap: 16px;
          padding: 16px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .character-card:hover:not(.disabled) {
          border-color: #cbd5e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .character-card.selected {
          border-color: #DFFF00;
          background-color: #ffffcc;
        }

        .character-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Checkbox */
        .character-checkbox {
          position: absolute;
          top: 12px;
          left: 12px;
        }

        .character-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #DFFF00;
          cursor: pointer;
        }

        /* Avatar */
        .character-avatar {
          position: relative;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-initial {
          font-size: 32px;
          font-weight: 700;
          color: white;
        }

        .character-style {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .style-realistic {
          background-color: #48bb78;
        }

        .style-cartoon {
          background-color: #ed8936;
        }

        .style-anime {
          background-color: #e53e3e;
        }

        .style-stylized {
          background-color: #9f7aea;
        }

        /* Info */
        .character-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .character-name {
          font-size: 16px;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .character-description {
          font-size: 13px;
          color: #718096;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .character-age {
          font-size: 12px;
          color: #a0aec0;
        }

        .personality-traits {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .trait-badge {
          font-size: 11px;
          padding: 2px 8px;
          background-color: #edf2f7;
          color: #4a5568;
          border-radius: 4px;
        }

        /* Voice Selector */
        .voice-section {
          position: relative;
          margin-top: 4px;
        }

        .voice-selector-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 6px 12px;
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
        }

        .voice-selector-btn:hover:not(:disabled) {
          background-color: #edf2f7;
          border-color: #cbd5e0;
        }

        .voice-selector-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .voice-icon {
          font-size: 14px;
        }

        .voice-label {
          flex: 1;
          text-align: left;
        }

        .voice-arrow {
          font-size: 10px;
          transition: transform 0.2s;
        }

        .voice-arrow.open {
          transform: rotate(180deg);
        }

        .voice-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 10;
          overflow: hidden;
        }

        .voice-option {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
          padding: 8px 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .voice-option:hover {
          background-color: #f7fafc;
        }

        .voice-option.active {
          background-color: #ffffcc;
        }

        .voice-meta {
          font-size: 11px;
          color: #a0aec0;
        }

        /* Actions */
        .character-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          padding: 0;
          background: none;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background-color: #f7fafc;
        }

        .delete-btn:hover {
          background-color: #fed7d7;
        }

        @media (max-width: 480px) {
          .character-card {
            flex-wrap: wrap;
          }

          .character-avatar {
            width: 60px;
            height: 60px;
          }

          .character-info {
            width: calc(100% - 80px);
          }

          .character-actions {
            position: absolute;
            top: 12px;
            right: 12px;
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}
