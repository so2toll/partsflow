/**
 * UsageMeter Component Examples
 *
 * This file demonstrates various usage patterns of the UsageMeter component
 */

'use client';

import { useState } from 'react';
import UsageMeter, { PlanType, validateUsageMeterProps } from './UsageMeter';

/**
 * Example 1: Basic usage with free tier
 */
export function UsageMeterExampleFree() {
  return (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Free Tier - Low Usage</h3>
      <UsageMeter
        usedMinutes={2}
        totalMinutes={5}
        planType="free"
        periodStart="2024-01-01T00:00:00Z"
        periodEnd="2024-02-01T00:00:00Z"
      />
    </div>
  );
}

/**
 * Example 2: Creator plan with warning level
 */
export function UsageMeterExampleCreator() {
  return (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Creator Plan - Near Limit</h3>
      <UsageMeter
        usedMinutes={52}
        totalMinutes={60}
        planType="creator"
        periodStart="2024-01-01T00:00:00Z"
        periodEnd="2024-02-01T00:00:00Z"
        onUpgrade={() => console.log('Upgrade clicked')}
      />
    </div>
  );
}

/**
 * Example 3: Pro plan with exceeded limit
 */
export function UsageMeterExamplePro() {
  return (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Pro Plan - Limit Exceeded</h3>
      <UsageMeter
        usedMinutes={320}
        totalMinutes={300}
        planType="pro"
        periodStart="2024-01-01T00:00:00Z"
        periodEnd="2024-02-01T00:00:00Z"
        onUpgrade={() => console.log('Upgrade clicked')}
      />
    </div>
  );
}

/**
 * Example 4: Enterprise plan (unlimited)
 */
export function UsageMeterExampleEnterprise() {
  return (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Enterprise - Unlimited</h3>
      <UsageMeter
        usedMinutes={1250}
        totalMinutes={999999}
        planType="enterprise"
      />
    </div>
  );
}

/**
 * Example 5: Compact mode for sidebar
 */
export function UsageMeterExampleCompact() {
  return (
    <div className="p-4 max-w-sm">
      <h3 className="text-lg font-semibold mb-4">Compact Mode</h3>
      <UsageMeter
        usedMinutes={45}
        totalMinutes={60}
        planType="creator"
        compact
      />
    </div>
  );
}

/**
 * Example 6: With custom styling
 */
export function UsageMeterExampleCustom() {
  return (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Custom Styling</h3>
      <UsageMeter
        usedMinutes={25}
        totalMinutes={60}
        planType="creator"
        className="shadow-lg"
        periodStart="2024-01-01T00:00:00Z"
        periodEnd="2024-02-01T00:00:00Z"
      />
    </div>
  );
}

/**
 * Example 7: Dynamic usage meter with state
 */
export function UsageMeterExampleDynamic() {
  const [usedMinutes, setUsedMinutes] = useState(30);

  return (
    <div className="p-4 max-w-md space-y-4">
      <h3 className="text-lg font-semibold mb-4">Dynamic Usage Meter</h3>

      <UsageMeter
        usedMinutes={usedMinutes}
        totalMinutes={60}
        planType="creator"
        periodStart="2024-01-01T00:00:00Z"
        periodEnd="2024-02-01T00:00:00Z"
        onUpgrade={() => console.log('Upgrade clicked')}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Adjust Usage:</label>
        <input
          type="range"
          min="0"
          max="70"
          value={usedMinutes}
          onChange={(e) => setUsedMinutes(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-neutral-500">
          Current usage: {usedMinutes} minutes
        </div>
      </div>
    </div>
  );
}

/**
 * Example 8: All plans comparison
 */
export function UsageMeterExampleComparison() {
  const plans: PlanType[] = ['free', 'creator', 'pro', 'enterprise'];

  return (
    <div className="p-4 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">All Plans Comparison</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <UsageMeter
            key={plan}
            usedMinutes={plan === 'enterprise' ? 150 : plan === 'pro' ? 200 : plan === 'creator' ? 45 : 3}
            totalMinutes={plan === 'free' ? 5 : plan === 'creator' ? 60 : plan === 'pro' ? 300 : 999999}
            planType={plan}
            periodStart="2024-01-01T00:00:00Z"
            periodEnd="2024-02-01T00:00:00Z"
            onUpgrade={() => console.log(`Upgrade from ${plan}`)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example 9: With validation
 */
export function UsageMeterExampleWithValidation() {
  const props = {
    usedMinutes: 45,
    totalMinutes: 60,
    planType: 'creator' as PlanType,
  };

  // Validate props before rendering
  const isValid = validateUsageMeterProps(props);

  if (!isValid) {
    return (
      <div className="p-4 bg-danger-50 text-danger-700 rounded">
        Invalid UsageMeter configuration
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">With Validation</h3>
      <UsageMeter {...props} />
    </div>
  );
}

/**
 * Example 10: Real-world usage in a dashboard
 */
export function UsageMeterDashboard() {
  // In a real app, this data would come from an API
  const subscriptionData = {
    usedMinutes: 52,
    totalMinutes: 60,
    planType: 'creator' as PlanType,
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subscription Dashboard</h2>
        <p className="text-neutral-500">Monitor your usage and upgrade when needed</p>
      </div>

      <UsageMeter
        {...subscriptionData}
        onUpgrade={() => {
          // Navigate to pricing page
          window.location.href = '/pricing';
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-surface-50 rounded-lg">
          <div className="text-2xl font-bold text-neutral-600">
            {subscriptionData.usedMinutes}
          </div>
          <div className="text-sm text-neutral-400">Minutes Used</div>
        </div>
        <div className="p-4 bg-surface-50 rounded-lg">
          <div className="text-2xl font-bold text-neutral-600">
            {subscriptionData.totalMinutes - subscriptionData.usedMinutes}
          </div>
          <div className="text-sm text-neutral-400">Minutes Remaining</div>
        </div>
        <div className="p-4 bg-surface-50 rounded-lg">
          <div className="text-2xl font-bold text-neutral-600">
            {Math.ceil((new Date(subscriptionData.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
          </div>
          <div className="text-sm text-neutral-400">Days Until Reset</div>
        </div>
      </div>
    </div>
  );
}

// Example export for storybook or documentation
export default {
  title: 'Components/UsageMeter',
  component: UsageMeter,
  examples: {
    Free: UsageMeterExampleFree,
    Creator: UsageMeterExampleCreator,
    Pro: UsageMeterExamplePro,
    Enterprise: UsageMeterExampleEnterprise,
    Compact: UsageMeterExampleCompact,
    Custom: UsageMeterExampleCustom,
    Dynamic: UsageMeterExampleDynamic,
    Comparison: UsageMeterExampleComparison,
    Validation: UsageMeterExampleWithValidation,
    Dashboard: UsageMeterDashboard,
  },
};
