# UsageMeter Component

A comprehensive React component for displaying subscription usage metrics with visual progress indicators, plan upgrade prompts, and billing period information.

## Features

- **Real-time Usage Calculation**: Automatically calculates remaining minutes and usage percentage
- **Visual Progress Bar**: Color-coded progress bar that changes based on usage level
- **Smart Status Messages**: Context-aware messages that adapt to usage levels
- **Expandable Details**: Toggle-able section showing detailed usage information
- **Plan Upgrade Prompts**: Intelligent CTAs that appear when near or at limits
- **Billing Period Information**: Shows current billing period and days until reset
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **TypeScript Support**: Fully typed with comprehensive TypeScript definitions
- **Design System Integration**: Uses Stitch Design System colors and tokens

## Installation

The component is located at:
```
src/components/video/UsageMeter.tsx
```

## Usage

### Basic Example

```tsx
import UsageMeter from '@/components/video/UsageMeter';

function MyComponent() {
  return (
    <UsageMeter
      usedMinutes={45}
      totalMinutes={60}
      planType="creator"
      periodStart="2024-01-01T00:00:00Z"
      periodEnd="2024-02-01T00:00:00Z"
    />
  );
}
```

### With Upgrade Handler

```tsx
import UsageMeter from '@/components/video/UsageMeter';
import { useRouter } from 'next/navigation';

function SubscriptionWidget() {
  const router = useRouter();

  return (
    <UsageMeter
      usedMinutes={52}
      totalMinutes={60}
      planType="creator"
      periodStart="2024-01-01T00:00:00Z"
      periodEnd="2024-02-01T00:00:00Z"
      onUpgrade={() => router.push('/pricing')}
    />
  );
}
```

### Compact Mode

```tsx
<UsageMeter
  usedMinutes={25}
  totalMinutes={60}
  planType="creator"
  compact
/>
```

## Props

### UsageMeterProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `usedMinutes` | `number` | Yes | - | Number of minutes used in current billing period |
| `totalMinutes` | `number` | Yes | - | Total minutes available in current plan |
| `planType` | `PlanType` | Yes | - | Current subscription plan type |
| `periodStart` | `string` | No | - | Billing period start date (ISO string) |
| `periodEnd` | `string` | No | - | Billing period end date (ISO string) |
| `onUpgrade` | `() => void` | No | - | Callback when upgrade button is clicked |
| `className` | `string` | No | - | Additional CSS classes |
| `compact` | `boolean` | No | `false` | Compact mode for smaller displays |

### PlanType

Union type: `'free' | 'creator' | 'pro' | 'enterprise'`

## Behavior

### Usage Levels

The component automatically determines the usage level based on the percentage of minutes used:

| Level | Percentage | Color | Behavior |
|-------|-----------|-------|----------|
| Low | 0-49% | Green | Shows checkmark icon |
| Medium | 50-79% | Orange | Shows checkmark icon |
| High | 80-99% | Dark Orange | Shows warning icon, displays upgrade CTA |
| Exceeded | 100%+ | Red | Shows warning icon, displays urgent upgrade CTA |
| Unlimited | N/A | Purple (Enterprise) | Shows infinity icon, no progress bar |

### Visual States

1. **Low Usage (0-49%)**
   - Green progress bar
   - White background
   - Checkmark icon with success message

2. **Medium Usage (50-79%)**
   - Orange progress bar
   - White background
   - Checkmark icon with remaining minutes

3. **High Usage (80-99%)**
   - Dark orange progress bar
   - Light yellow background
   - Warning icon
   - "Get More Minutes" CTA button

4. **Exceeded Limit (100%+)**
   - Red progress bar
   - Light red background
   - Warning icon with urgent message
   - "Upgrade Now" CTA button

5. **Enterprise (Unlimited)**
   - Purple accent color
   - Light purple background
   - Infinity icon
   - No progress bar shown

## Plan Limits

Default plan limits (in minutes per billing period):

| Plan | Limit |
|------|-------|
| Free | 5 minutes |
| Creator | 60 minutes |
| Pro | 300 minutes |
| Enterprise | Unlimited (999,999) |

## Validation

Use the provided validation helper to ensure props are correct:

```tsx
import { validateUsageMeterProps } from '@/components/video/UsageMeter';

const props = {
  usedMinutes: 45,
  totalMinutes: 60,
  planType: 'creator',
};

if (validateUsageMeterProps(props)) {
  return <UsageMeter {...props} />;
} else {
  return <div>Invalid configuration</div>;
}
```

## Styling

The component uses Tailwind CSS classes from the Stitch Design System:

- **Colors**: `primary-*`, `success-*`, `warning-*`, `danger-*`, `neutral-*`, `surface-*`
- **Spacing**: `gap-xs`, `space-y-sm`, `pt-sm`, etc.
- **Typography**: `text-sm`, `font-semibold`, etc.
- **Borders**: `border-neutral-200`, `rounded-full`

Custom styles can be added via the `className` prop:

```tsx
<UsageMeter
  {...props}
  className="shadow-lg border-2"
/>
```

## Accessibility

The component implements several accessibility features:

- **ARIA Labels**: Progress bar has proper `role="progressbar"` and `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Keyboard Navigation**: Toggle button is accessible via keyboard
- **Screen Reader Support**: Status messages and usage information are readable by screen readers
- **Color Contrast**: All text meets WCAG AA contrast requirements
- **Focus States**: Proper focus indicators on interactive elements

## Examples

See `UsageMeter.example.tsx` for comprehensive examples including:

1. Basic usage with free tier
2. Creator plan with warning level
3. Pro plan with exceeded limit
4. Enterprise plan (unlimited)
5. Compact mode
6. Custom styling
7. Dynamic usage meter with state
8. All plans comparison
9. With validation
10. Real-world dashboard integration

## Integration Examples

### Next.js App Router

```tsx
// app/dashboard/page.tsx
'use client';

import UsageMeter from '@/components/video/UsageMeter';

export default function DashboardPage() {
  return (
    <div>
      <UsageMeter
        usedMinutes={45}
        totalMinutes={60}
        planType="creator"
        onUpgrade={() => router.push('/pricing')}
      />
    </div>
  );
}
```

### with API Data

```tsx
'use client';

import { useEffect, useState } from 'react';
import UsageMeter from '@/components/video/UsageMeter';

export default function UsageWidget() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetch('/api/usage')
      .then(res => res.json())
      .then(data => setUsage(data));
  }, []);

  if (!usage) return <div>Loading...</div>;

  return <UsageMeter {...usage} />;
}
```

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import UsageMeter from '@/components/video/UsageMeter';

describe('UsageMeter', () => {
  it('displays correct usage percentage', () => {
    render(
      <UsageMeter
        usedMinutes={30}
        totalMinutes={60}
        planType="creator"
      />
    );

    expect(screen.getByText('30 / 60 min')).toBeInTheDocument();
  });

  it('shows upgrade CTA when near limit', () => {
    const onUpgrade = jest.fn();
    render(
      <UsageMeter
        usedMinutes={55}
        totalMinutes={60}
        planType="creator"
        onUpgrade={onUpgrade}
      />
    );

    const upgradeButton = screen.getByText('Get More Minutes');
    upgradeButton.click();
    expect(onUpgrade).toHaveBeenCalled();
  });
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- React 18+
- Tailwind CSS (Stitch Design System)
- TypeScript 5+

## License

Internal component - Copyright 2024

## Contributing

When modifying this component:

1. Maintain TypeScript type safety
2. Follow the existing code style
3. Update examples for new features
4. Ensure accessibility standards are met
5. Test with different plan types and usage levels
6. Update this README for any API changes

## Changelog

### v2.0.0 (2024-05-05)
- Complete rewrite using Tailwind CSS and Stitch Design System
- Added TypeScript support with comprehensive types
- Improved accessibility with ARIA labels
- Added compact mode prop
- Enhanced validation helper
- Better component composition using Card and Button components
- Improved documentation with examples

### v1.0.0
- Initial release with inline styles
