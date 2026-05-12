/**
 * UsageMeter Component
 *
 * Displays subscription usage with:
 * - Minutes used/remaining
 * - Visual progress bar
 * - Plan upgrade prompts
 * - Billing period info
 *
 * @component video/UsageMeter
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export type PlanType = 'free' | 'creator' | 'pro' | 'enterprise';

interface UsageMeterProps {
  /** Number of minutes used in current billing period */
  usedMinutes: number;
  /** Total minutes available in current plan */
  totalMinutes: number;
  /** Current subscription plan type */
  planType: PlanType;
  /** Billing period start date (ISO string) */
  periodStart?: string;
  /** Billing period end date (ISO string) */
  periodEnd?: string;
  /** Callback when upgrade button is clicked */
  onUpgrade?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Plan limits in minutes per billing period
 */
const PLAN_LIMITS: Record<PlanType, number> = {
  free: 5,
  creator: 60,
  pro: 300,
  enterprise: 999999,
};

/**
 * Display names for plan types
 */
const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Free Tier',
  creator: 'Creator',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

/**
 * Usage level thresholds for visual indicators
 */
const USAGE_THRESHOLDS = {
  WARNING: 80, // Show warning at 80% usage
  DANGER: 100, // Show danger at 100% usage
};

/**
 * UsageMeter displays subscription usage metrics with visual progress indicators
 *
 * Features:
 * - Real-time usage calculation
 * - Visual progress bar with color-coded states
 * - Expandable details section
 * - Plan upgrade prompts when near limits
 * - Billing period information
 * - Responsive design
 *
 * @example
 * ```tsx
 * <UsageMeter
 *   usedMinutes={45}
 *   totalMinutes={60}
 *   planType="creator"
 *   periodStart="2024-01-01"
 *   periodEnd="2024-02-01"
 *   onUpgrade={() => router.push('/pricing')}
 * />
 * ```
 */
export default function UsageMeter({
  usedMinutes,
  totalMinutes,
  planType,
  periodStart,
  periodEnd,
  onUpgrade,
  className,
  compact = false,
}: UsageMeterProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate usage metrics
  const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
  const usagePercent = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;
  const isNearLimit = usagePercent >= USAGE_THRESHOLDS.WARNING;
  const isAtLimit = usagePercent >= USAGE_THRESHOLDS.DANGER;
  const isEnterprise = planType === 'enterprise';

  // Calculate days until billing period resets
  const daysUntilReset = periodEnd
    ? Math.max(0, Math.ceil((new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  /**
   * Determine the current usage level for styling
   */
  const getUsageLevel = (): 'low' | 'medium' | 'high' | 'exceeded' | 'unlimited' => {
    if (isEnterprise) return 'unlimited';
    if (usagePercent >= 100) return 'exceeded';
    if (usagePercent >= 80) return 'high';
    if (usagePercent >= 50) return 'medium';
    return 'low';
  };

  /**
   * Get progress bar color based on usage level
   */
  const getProgressColor = () => {
    const level = getUsageLevel();
    const colors = {
      low: 'bg-success-500',
      medium: 'bg-warning-500',
      high: 'bg-warning-700',
      exceeded: 'bg-danger-500',
      unlimited: 'bg-primary-500',
    };
    return colors[level];
  };

  /**
   * Get status message and icon based on usage
   */
  const getStatusMessage = () => {
    if (isAtLimit) {
      return {
        text: `${remainingMinutes} minutes remaining - Upgrade to continue`,
        icon: '⚠️',
        className: 'text-danger-700',
      };
    }
    if (isNearLimit) {
      return {
        text: `${remainingMinutes} minutes remaining this period`,
        icon: '⚠️',
        className: 'text-warning-700',
      };
    }
    if (isEnterprise) {
      return {
        text: 'Unlimited usage',
        icon: '∞',
        className: 'text-primary-700',
      };
    }
    return {
      text: `${remainingMinutes} minutes remaining`,
      icon: '✓',
      className: 'text-success-700',
    };
  };

  /**
   * Format date string to readable format
   */
  const formatPeriod = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get card background color based on usage level
   */
  const getCardBackground = () => {
    const level = getUsageLevel();
    const backgrounds = {
      low: 'bg-surface-50',
      medium: 'bg-surface-50',
      high: 'bg-warning-50',
      exceeded: 'bg-danger-50',
      unlimited: 'bg-primary-50',
    };
    return backgrounds[level];
  };

  const status = getStatusMessage();
  const usageLevel = getUsageLevel();

  return (
    <Card className={cn(getCardBackground(), 'border-neutral-200', className)}>
      <CardHeader className="pb-3">
        {/* Header with plan info and details toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs text-sm">
            <span className="font-semibold text-neutral-600">{PLAN_NAMES[planType]}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500">
              {usedMinutes} / {isEnterprise ? '∞' : totalMinutes} min
            </span>
          </div>
          {!isEnterprise && !compact && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 rounded hover:bg-neutral-200 transition-colors text-neutral-400 hover:text-neutral-600"
              aria-label={showDetails ? 'Hide details' : 'Show details'}
              aria-expanded={showDetails}
            >
              <svg
                className={cn('w-4 h-4 transition-transform', showDetails && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-sm">
        {/* Progress Bar */}
        {!isEnterprise && (
          <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 ease-out rounded-full',
                getProgressColor()
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
              role="progressbar"
              aria-valuenow={usedMinutes}
              aria-valuemin={0}
              aria-valuemax={totalMinutes}
              aria-label={`${Math.round(usagePercent)}% used`}
            />
          </div>
        )}

        {/* Status Message */}
        <div className={cn('flex items-center gap-xs text-sm font-medium', status.className)}>
          <span>{status.icon}</span>
          <span>{status.text}</span>
        </div>

        {/* Expanded Details */}
        {showDetails && !isEnterprise && !compact && (
          <div className="pt-sm border-t border-neutral-200 space-y-xs">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Used this period</span>
              <span className="font-semibold text-neutral-600">{usedMinutes} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Remaining</span>
              <span className="font-semibold text-neutral-600">{remainingMinutes} min</span>
            </div>
            {daysUntilReset !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Resets in</span>
                <span className="font-semibold text-neutral-600">
                  {daysUntilReset === 0
                    ? 'today'
                    : daysUntilReset === 1
                      ? '1 day'
                      : `${daysUntilReset} days`}
                </span>
              </div>
            )}
            {periodStart && periodEnd && (
              <div className="flex justify-center pt-xs">
                <span className="text-xs text-neutral-300">
                  {formatPeriod(periodStart)} - {formatPeriod(periodEnd)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Upgrade CTA */}
        {!isEnterprise && (isAtLimit || isNearLimit) && onUpgrade && (
          <Button
            onClick={onUpgrade}
            variant="primary"
            size="sm"
            className="w-full mt-xs"
          >
            {isAtLimit ? 'Upgrade Now' : 'Get More Minutes'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Helper function to validate usage meter props
 */
export function validateUsageMeterProps(props: UsageMeterProps): boolean {
  const { usedMinutes, totalMinutes, planType } = props;

  if (usedMinutes < 0) {
    console.error('UsageMeter: usedMinutes cannot be negative');
    return false;
  }

  if (totalMinutes < 0) {
    console.error('UsageMeter: totalMinutes cannot be negative');
    return false;
  }

  if (!PLAN_LIMITS[planType]) {
    console.error(`UsageMeter: Invalid planType "${planType}"`);
    return false;
  }

  return true;
}
