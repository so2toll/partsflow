# UsageMeter - Quick Reference Guide

## Import

```tsx
import UsageMeter from '@/components/video/UsageMeter';
// or
import UsageMeter, { PlanType, validateUsageMeterProps } from '@/components/video/UsageMeter';
```

## Basic Usage

```tsx
<UsageMeter
  usedMinutes={45}
  totalMinutes={60}
  planType="creator"
/>
```

## All Props

```tsx
<UsageMeter
  usedMinutes={45}                    // Required: minutes used
  totalMinutes={60}                   // Required: total minutes
  planType="creator"                  // Required: 'free' | 'creator' | 'pro' | 'enterprise'
  periodStart="2024-01-01T00:00:00Z" // Optional: billing start
  periodEnd="2024-02-01T00:00:00Z"   // Optional: billing end
  onUpgrade={() => {...}}            // Optional: upgrade callback
  className="extra-class"             // Optional: CSS classes
  compact={false}                     // Optional: compact mode
/>
```

## Plan Types

| Type | Limit | Display |
|------|-------|---------|
| `free` | 5 min | Free Tier |
| `creator` | 60 min | Creator |
| `pro` | 300 min | Pro |
| `enterprise` | ∞ | Enterprise |

## Usage Levels

- **0-49%**: Green, checkmark, white background
- **50-79%**: Orange, checkmark, white background
- **80-99%**: Dark orange, warning, yellow background, shows CTA
- **100%+**: Red, warning, red background, shows urgent CTA
- **Enterprise**: Purple, infinity, no progress bar

## Common Patterns

### With Upgrade Navigation

```tsx
import { useRouter } from 'next/navigation';

function UsageWidget() {
  const router = useRouter();

  return (
    <UsageMeter
      usedMinutes={52}
      totalMinutes={60}
      planType="creator"
      onUpgrade={() => router.push('/pricing')}
    />
  );
}
```

### Compact Mode (Sidebar)

```tsx
<UsageMeter
  usedMinutes={25}
  totalMinutes={60}
  planType="creator"
  compact
/>
```

### With API Data

```tsx
const [usage, setUsage] = useState(null);

useEffect(() => {
  fetch('/api/usage')
    .then(res => res.json())
    .then(data => setUsage(data));
}, []);

return usage ? <UsageMeter {...usage} /> : <Loading />;
```

### With Validation

```tsx
const props = { usedMinutes: 45, totalMinutes: 60, planType: 'creator' };

if (validateUsageMeterProps(props)) {
  return <UsageMeter {...props} />;
}
```

## Styling

### Custom Classes

```tsx
<UsageMeter
  {...props}
  className="shadow-lg border-2"
/>
```

### Color Override (via inline style)

```tsx
<UsageMeter
  {...props}
  className="border-blue-500"
/>
```

## Validation

```tsx
import { validateUsageMeterProps } from '@/components/video/UsageMeter';

const props = {
  usedMinutes: 45,
  totalMinutes: 60,
  planType: 'creator',
};

// Returns true if valid, false otherwise
const isValid = validateUsageMeterProps(props);
```

## Accessibility

The component includes:
- ✓ ARIA labels on progress bar
- ✓ Keyboard navigation support
- ✓ Screen reader compatible
- ✓ WCAG AA color contrast
- ✓ Focus indicators

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Files

- Component: `UsageMeter.tsx`
- Examples: `UsageMeter.example.tsx`
- Docs: `UsageMeter.README.md`
- Tests: `UsageMeter.test.tsx`
- Stories: `UsageMeter.stories.tsx`
- Summary: `USAGE_METER_SUMMARY.md`

## Quick Examples

### Free Tier (Low)
```tsx
<UsageMeter usedMinutes={2} totalMinutes={5} planType="free" />
```

### Creator (Warning)
```tsx
<UsageMeter usedMinutes={52} totalMinutes={60} planType="creator" />
```

### Pro (Exceeded)
```tsx
<UsageMeter usedMinutes={320} totalMinutes={300} planType="pro" />
```

### Enterprise (Unlimited)
```tsx
<UsageMeter usedMinutes={1000} totalMinutes={999999} planType="enterprise" />
```

## Troubleshooting

**Progress bar not showing?**
- Check if `planType="enterprise"` (no progress bar for unlimited)

**Upgrade button not appearing?**
- Must have `onUpgrade` prop
- Usage must be ≥80% (high) or ≥100% (exceeded)

**Colors not changing?**
- Usage levels: 0-49% (low), 50-79% (medium), 80-99% (high), 100%+ (exceeded)

**Details not expanding?**
- Check if `compact={true}` (no details in compact mode)
- Enterprise plans don't show details

## See Also

- Full documentation: `UsageMeter.README.md`
- Code examples: `UsageMeter.example.tsx`
- Test suite: `UsageMeter.test.tsx`
- Storybook: `UsageMeter.stories.tsx`
