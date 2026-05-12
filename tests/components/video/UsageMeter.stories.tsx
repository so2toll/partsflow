/**
 * UsageMeter Stories for Storybook
 *
 * Storybook stories to visualize and test the UsageMeter component
 */

import type { Meta, StoryObj } from '@storybook/react';
import UsageMeter, { PlanType, validateUsageMeterProps } from './UsageMeter';

const meta: Meta<typeof UsageMeter> = {
  title: 'Components/Video/UsageMeter',
  component: UsageMeter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A comprehensive React component for displaying subscription usage metrics with visual progress indicators.

## Features

- Real-time usage calculation
- Visual progress bar with color-coded states
- Expandable details section
- Plan upgrade prompts when near limits
- Billing period information
- Responsive design
- Full accessibility support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    usedMinutes: {
      description: 'Number of minutes used in current billing period',
      control: 'number',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 0 },
      },
    },
    totalMinutes: {
      description: 'Total minutes available in current plan',
      control: 'number',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 60 },
      },
    },
    planType: {
      description: 'Current subscription plan type',
      control: 'select',
      options: ['free', 'creator', 'pro', 'enterprise'],
      table: {
        type: { summary: 'PlanType' },
        defaultValue: { summary: 'creator' },
      },
    },
    periodStart: {
      description: 'Billing period start date (ISO string)',
      control: 'date',
      table: {
        type: { summary: 'string' },
      },
    },
    periodEnd: {
      description: 'Billing period end date (ISO string)',
      control: 'date',
      table: {
        type: { summary: 'string' },
      },
    },
    onUpgrade: {
      description: 'Callback when upgrade button is clicked',
      action: 'upgrade clicked',
      table: {
        type: { summary: '() => void' },
      },
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
      table: {
        type: { summary: 'string' },
      },
    },
    compact: {
      description: 'Compact mode for smaller displays',
      control: 'boolean',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UsageMeter>;

/**
 * Basic usage example with Creator plan at medium usage level
 */
export const Default: Story = {
  args: {
    usedMinutes: 30,
    totalMinutes: 60,
    planType: 'creator',
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
  },
};

/**
 * Free tier with low usage
 */
export const FreeTier: Story = {
  args: {
    usedMinutes: 2,
    totalMinutes: 5,
    planType: 'free',
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
  },
};

/**
 * Creator plan near limit (warning state)
 */
export const CreatorNearLimit: Story = {
  args: {
    usedMinutes: 52,
    totalMinutes: 60,
    planType: 'creator',
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
  },
};

/**
 * Pro plan exceeded limit (danger state)
 */
export const ProExceeded: Story = {
  args: {
    usedMinutes: 320,
    totalMinutes: 300,
    planType: 'pro',
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
  },
};

/**
 * Enterprise plan with unlimited usage
 */
export const EnterpriseUnlimited: Story = {
  args: {
    usedMinutes: 1250,
    totalMinutes: 999999,
    planType: 'enterprise',
  },
};

/**
 * Compact mode for smaller displays
 */
export const Compact: Story = {
  args: {
    usedMinutes: 45,
    totalMinutes: 60,
    planType: 'creator',
    compact: true,
  },
};

/**
 * All plans side by side for comparison
 */
export const AllPlans: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Free Tier</h3>
        <UsageMeter
          usedMinutes={3}
          totalMinutes={5}
          planType="free"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Creator</h3>
        <UsageMeter
          usedMinutes={45}
          totalMinutes={60}
          planType="creator"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Pro</h3>
        <UsageMeter
          usedMinutes={200}
          totalMinutes={300}
          planType="pro"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Enterprise</h3>
        <UsageMeter
          usedMinutes={1500}
          totalMinutes={999999}
          planType="enterprise"
        />
      </div>
    </div>
  ),
};

/**
 * All usage levels demonstrated
 */
export const UsageLevels: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold mb-2">Low Usage (0-49%)</h3>
        <UsageMeter
          usedMinutes={20}
          totalMinutes={60}
          planType="creator"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Medium Usage (50-79%)</h3>
        <UsageMeter
          usedMinutes={40}
          totalMinutes={60}
          planType="creator"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">High Usage (80-99%)</h3>
        <UsageMeter
          usedMinutes={52}
          totalMinutes={60}
          planType="creator"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Exceeded (100%+)</h3>
        <UsageMeter
          usedMinutes={70}
          totalMinutes={60}
          planType="creator"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      </div>
    </div>
  ),
};

/**
 * Interactive example with dynamic usage slider
 */
export const Interactive: Story = {
  render: () => {
    const [usedMinutes, setUsedMinutes] = React.useState(30);

    return (
      <div className="p-6 max-w-md space-y-4">
        <UsageMeter
          usedMinutes={usedMinutes}
          totalMinutes={60}
          planType="creator"
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
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
            Current usage: {usedMinutes} minutes ({Math.round((usedMinutes / 60) * 100)}%)
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Dashboard integration example
 */
export const DashboardExample: Story = {
  render: () => {
    const subscriptionData = {
      usedMinutes: 52,
      totalMinutes: 60,
      planType: 'creator' as PlanType,
      periodStart: '2024-01-01T00:00:00Z',
      periodEnd: '2024-02-01T00:00:00Z',
    };

    const daysUntilReset = Math.ceil(
      (new Date(subscriptionData.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="p-6 space-y-6 bg-surface-100 min-w-[600px]">
        <div>
          <h2 className="text-2xl font-bold mb-2">Subscription Dashboard</h2>
          <p className="text-neutral-500">Monitor your usage and upgrade when needed</p>
        </div>

        <UsageMeter
          {...subscriptionData}
          onUpgrade={() => alert('Navigate to pricing page')}
        />

        <div className="grid gap-4 grid-cols-3">
          <div className="p-4 bg-white rounded-lg border border-neutral-200">
            <div className="text-2xl font-bold text-neutral-600">
              {subscriptionData.usedMinutes}
            </div>
            <div className="text-sm text-neutral-400">Minutes Used</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-neutral-200">
            <div className="text-2xl font-bold text-neutral-600">
              {subscriptionData.totalMinutes - subscriptionData.usedMinutes}
            </div>
            <div className="text-sm text-neutral-400">Minutes Remaining</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-neutral-200">
            <div className="text-2xl font-bold text-neutral-600">{daysUntilReset}</div>
            <div className="text-sm text-neutral-400">Days Until Reset</div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * With custom styling
 */
export const CustomStyling: Story = {
  args: {
    usedMinutes: 25,
    totalMinutes: 60,
    planType: 'creator',
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
    className: 'shadow-xl border-2 border-primary-300',
  },
};

/**
 * Validation example
 */
export const WithValidation: Story = {
  render: () => {
    const props = {
      usedMinutes: 45,
      totalMinutes: 60,
      planType: 'creator' as PlanType,
    };

    const isValid = validateUsageMeterProps(props);

    if (!isValid) {
      return (
        <div className="p-4 bg-danger-50 text-danger-700 rounded">
          Invalid UsageMeter configuration
        </div>
      );
    }

    return <UsageMeter {...props} />;
  },
};

/**
 * Accessibility demo
 */
export const Accessibility: Story = {
  args: {
    usedMinutes: 45,
    totalMinutes: 60,
    planType: 'creator',
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
  },
  parameters: {
    docs: {
      description: {
        story: `
This component includes comprehensive accessibility features:

- **ARIA Labels**: Progress bar has proper \`role="progressbar"\` and \`aria-valuenow\`, \`aria-valuemin\`, \`aria-valuemax\`
- **Keyboard Navigation**: Toggle button is fully keyboard accessible
- **Screen Reader Support**: All status messages and usage information are readable
- **Color Contrast**: Text meets WCAG AA contrast requirements
- **Focus States**: Proper focus indicators on all interactive elements

**Keyboard Controls:**
- Tab: Navigate to toggle button
- Enter/Space: Toggle details panel
- Tab: Navigate to upgrade button (when visible)
- Enter/Space: Trigger upgrade action
        `,
      },
    },
  },
};
