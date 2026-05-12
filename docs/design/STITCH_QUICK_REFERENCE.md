# Stitch Design System - Quick Reference

Quick reference for the Stitch design system used across the application.

## Colors

### Primary Accent - Electric Lime
```css
#DFFF00 - Main accent color (buttons, links, active states)
```

### Surface Colors
```css
#f9f9f9 - Surface (main background)
#ffffff - Surface container (cards, modals)
#f3f3f4 - Surface container low (inputs)
```

### Text Colors
```css
#1a1c1c - Primary text (headings, body)
#666666 - Secondary text (descriptions, metadata)
```

### Semantic Colors
```css
#22c55e - Success
#f59e0b - Warning
#ef4444 - Danger
```

## Typography (DM Sans)

| Size | Usage | Font-Size | Weight |
|------|-------|-----------|--------|
| Display Large | Hero titles | 64px | 700 |
| Headline Large | Page titles | 32px | 700 |
| Headline Medium | Section titles | 24px | 500 |
| Body Large | Emphasized text | 18px | 400 |
| Body Medium | Default text | 16px | 400 |
| Label Medium | Form labels | 14px | 500 |
| Label Small | Tags, metadata | 12px | 700 |

## Spacing (8px Rhythm)

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| base | 8px | Base unit |
| sm | 12px | Compact spacing |
| md | 24px | Comfortable spacing |
| lg | 48px | Section spacing |
| xl | 80px | Large spacing |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | Small elements |
| md | 8px | Buttons, inputs |
| lg | 12px | Cards (small) |
| xl | 16px | Cards (default) |
| full | 9999px | Pills, badges |

## Shadows

```css
/* Cards */
0 8px 30px rgba(0, 0, 0, 0.04)

/* Hover */
0 12px 40px rgba(0, 0, 0, 0.08)
```

## Component Usage

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-outline">Outline</button>
```

### Inputs
```html
<input type="text" class="input" placeholder="Enter..." />
```

### Cards
```html
<div class="card">
  <!-- Content -->
</div>
```

### Badges
```html
<span class="badge badge-primary">Active</span>
<span class="badge badge-success">Complete</span>
```

## Rules

1. **No borders on cards** - Use shadows instead
2. **Electric Lime for CTAs** - Primary actions only
3. **8px spacing multiples** - Always use multiples of 8
4. **DM Sans only** - No other fonts
5. **White backgrounds** - For main content areas
6. **High contrast** - Ensure WCAG AA compliance

## Implementation Workflow

When building a new feature, follow this order:

1. **Visit the Components Library** first at `/app/components-library` (SuperAdmin only)
   - See live examples of all components
   - Copy patterns directly
   - Verify your implementation matches

2. **Reference this document** for quick token lookups

3. **Use existing UI components** from `/src/components/ui/`

4. **Invoke `/stitch` skill** if you need guidance

## Checklist

When implementing a new feature:

- [ ] **Visit `/app/components-library` first** - See live examples
- [ ] Use existing components from `/src/components/ui/`
- [ ] Copy HTML/CSS patterns from components library
- [ ] Use Electric Lime (#DFFF00) for primary actions only
- [ ] Use DM Sans for all typography
- [ ] Follow 8px spacing rhythm
- [ ] Use borderless cards with ambient shadows
- [ ] Apply appropriate border radius (8/12/16px)
- [ ] Use proper color contrast
- [ ] Test hover and focus states
- [ ] Verify mobile responsiveness

## Resources

- **Components Library:** `/app/components-library` (SuperAdmin) - **START HERE**
- **Full Spec:** `/docs/design/DESIGN.md`
- **UI Components:** `/src/components/ui/`
- **Global Styles:** `/src/styles/global.css`
- **Skill:** Invoke `/stitch` for implementation guidance
