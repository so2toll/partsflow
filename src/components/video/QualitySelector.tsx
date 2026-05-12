/**
 * QualitySelector Component
 *
 * Radio/toggle selector for video quality tiers:
 * - Standard (720p) - 2 min/video
 * - High (1080p) - 5 min/video
 * - Premium (4K) - 15 min/video
 *
 * Shows estimated time and plan limits
 *
 * @component video/QualitySelector
 */

import { useState } from 'react';

export type QualityTier = 'standard' | 'high' | 'premium';

interface QualityOption {
  id: QualityTier;
  label: string;
  resolution: string;
  maxDuration: number; // in minutes
  recommended: boolean;
  description: string;
}

interface QualitySelectorProps {
  value: QualityTier;
  onChange: (value: QualityTier) => void;
  disabled?: boolean;
  planType?: 'free' | 'creator' | 'pro' | 'enterprise';
  className?: string;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    resolution: '720p',
    maxDuration: 2,
    recommended: false,
    description: 'Good for social media and quick content',
  },
  {
    id: 'high',
    label: 'High Quality',
    resolution: '1080p',
    maxDuration: 5,
    recommended: true,
    description: 'Best for YouTube and professional content',
  },
  {
    id: 'premium',
    label: 'Premium',
    resolution: '4K',
    maxDuration: 15,
    recommended: false,
    description: 'Cinema-quality for high-end productions',
  },
];

const PLAN_LIMITS: Record<string, QualityTier[]> = {
  free: ['standard'],
  creator: ['standard', 'high'],
  pro: ['standard', 'high', 'premium'],
  enterprise: ['standard', 'high', 'premium'],
};

export default function QualitySelector({
  value,
  onChange,
  disabled = false,
  planType = 'free',
  className = '',
}: QualitySelectorProps) {
  const allowedTiers = PLAN_LIMITS[planType] || ['standard'];

  const handleSelect = (tier: QualityTier) => {
    if (!disabled && allowedTiers.includes(tier)) {
      onChange(tier);
    }
  };

  return (
    <div className={`quality-selector ${className}`}>
      <label className="quality-label">
        Video Quality
      </label>
      <div className="quality-options">
        {QUALITY_OPTIONS.map((option) => {
          const isAllowed = allowedTiers.includes(option.id);
          const isSelected = value === option.id;
          const isLocked = !isAllowed;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={disabled || isLocked}
              className={`
                quality-option
                ${isSelected ? 'selected' : ''}
                ${isLocked ? 'locked' : ''}
                ${option.recommended ? 'recommended' : ''}
              `}
              aria-pressed={isSelected}
              aria-disabled={isLocked}
            >
              <div className="option-header">
                <div className="option-title-row">
                  <input
                    type="radio"
                    name="quality"
                    checked={isSelected}
                    readOnly
                    className="radio-input"
                  />
                  <span className="option-label">{option.label}</span>
                  {option.recommended && (
                    <span className="recommended-badge">Recommended</span>
                  )}
                </div>
                <span className="option-resolution">{option.resolution}</span>
              </div>
              <div className="option-description">{option.description}</div>
              <div className="option-meta">
                <span className="max-duration">Up to {option.maxDuration} min/video</span>
                {isLocked && (
                  <span className="lock-badge">
                    Requires {planType === 'free' ? 'Creator' : 'Pro'} plan
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .quality-selector {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .quality-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-neutral-600);
        }

        .quality-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-sm);
        }

        .quality-option {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border: 2px solid var(--color-surface-500);
          border-radius: var(--radius-lg);
          background: var(--color-surface-50);
          cursor: pointer;
          transition: all 200ms;
          text-align: left;
        }

        .quality-option:hover:not(.locked):not(:disabled) {
          border-color: var(--color-neutral-300);
          box-shadow: var(--shadow-card);
        }

        .quality-option.selected {
          border-color: var(--color-primary-300);
          background-color: var(--color-primary-50);
          box-shadow: 0 0 0 2px var(--color-primary-300);
        }

        .quality-option.locked {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .quality-option.recommended {
          position: relative;
        }

        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }

        .option-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .radio-input {
          margin: 0;
          cursor: pointer;
          accent-color: var(--color-primary-300);
        }

        .option-label {
          font-weight: 600;
          font-size: 15px;
          color: var(--color-neutral-600);
        }

        .recommended-badge {
          font-size: 10px;
          padding: 2px 6px;
          background-color: var(--color-primary-300);
          color: var(--color-neutral-900);
          border-radius: var(--radius-sm);
          font-weight: 700;
          text-transform: uppercase;
        }

        .option-resolution {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-neutral-400);
        }

        .option-description {
          font-size: 13px;
          color: var(--color-neutral-500);
          line-height: 1.4;
        }

        .option-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .max-duration {
          color: var(--color-neutral-400);
        }

        .lock-badge {
          font-size: 11px;
          padding: 2px 6px;
          background-color: var(--color-danger-50);
          color: var(--color-danger-700);
          border-radius: var(--radius-sm);
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .quality-options {
            grid-template-columns: 1fr;
          }

          .option-header {
            flex-direction: column;
            gap: var(--spacing-xs);
          }

          .option-meta {
            flex-direction: column;
            gap: var(--spacing-xs);
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
