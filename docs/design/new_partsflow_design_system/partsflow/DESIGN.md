---
name: PartsFlow
colors:
  surface: '#fff8f6'
  surface-dim: '#f1d4ca'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ec'
  surface-container: '#ffe9e2'
  surface-container-high: '#ffe2d8'
  surface-container-highest: '#fadcd2'
  on-surface: '#271812'
  on-surface-variant: '#5b4137'
  inverse-surface: '#3e2c26'
  inverse-on-surface: '#ffede7'
  outline: '#8f7065'
  outline-variant: '#e4beb1'
  surface-tint: '#a73a00'
  primary: '#a73a00'
  on-primary: '#ffffff'
  primary-container: '#ff5c00'
  on-primary-container: '#521800'
  inverse-primary: '#ffb59a'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dcdddd'
  on-secondary-container: '#5f6161'
  tertiary: '#0061a6'
  on-tertiary: '#ffffff'
  tertiary-container: '#0096fd'
  on-tertiary-container: '#002d51'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#d2e4ff'
  tertiary-fixed-dim: '#a0c9ff'
  on-tertiary-fixed: '#001c37'
  on-tertiary-fixed-variant: '#00497f'
  background: '#fff8f6'
  on-background: '#271812'
  surface-variant: '#fadcd2'
typography:
  display-xl:
    fontFamily: DM Sans
    fontSize: 80px
    fontWeight: '900'
    lineHeight: '0.95'
    letterSpacing: -0.03em
  display-lg:
    fontFamily: DM Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.06em
  label-sm:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.08em
  stat-value:
    fontFamily: DM Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1440px
  gutter: 24px
---

# PartsFlow Design System

## Brand & Style
PartsFlow is the real-time parts sourcing and delivery platform for automotive repair shops. The design system primarily operates in **Light Mode** for shop-facing pages (search, order, track), with a high-contrast **Dark Mode** reserved for internal operations, dispatch, and the global navigation shell. 

The personality is "Urgent Professional" — a platform that communicates speed, reliability, and operational precision. The light palette provides a clean, high-legibility workspace for busy shops, while the orange accent conveys urgency without alarm. The typography is bold and confident, reflecting a platform where every second of bay time matters.

## Two Surface Modes

### Light Mode — Shop App (Primary)
Used for: parts search, order flow, order history, profile, billing, and shop settings.
Background layers:
- **light-surface (#F8F9FA)** — page background
- **light-surface-raised (#FFFFFF)** — cards, modals, panels
- **light-surface-sunken (#F2F2F2)** — input backgrounds, inset areas (Secondary Color)
- **light-border (#E2E5E9)** — card borders (optional, used sparingly)

Text on light surfaces: `text-primary-light (#0F1923)` for headings and key values, `text-secondary-light (#556070)` for descriptions, `text-muted-light (#8B95A5)` for metadata and disabled states.

### Dark Mode — Operations & Navigation
Used for: ops dashboard, dispatch center, driver ops, and the global nav bar.
Background layers from darkest to lightest:
- **surface-900 (#0B1117)** — page background, deepest layer
- **surface-800 (#0F1923)** — primary surface (sidebar, main content background)
- **surface-700 (#152030)** — raised cards, panels
- **surface-600 (#1A2638)** — elevated cards, modals

Text on dark surfaces: `text-primary-dark (#FFFFFF)` for headings, `text-secondary-dark (#8B95A5)` for labels, `text-muted-dark (#5A6578)` for disabled content.

## Colors

### Primary Accent — Blaze Orange
The primary accent (#FF5C00) is the dominant brand color. Warm, urgent, unmistakably automotive.
Used for:
- Primary CTAs (Get Parts Now, Place Order, Dispatch, Search)
- Active nav items and selected states
- Live status indicators (en route, active delivery)
- Logo mark background

Always pair with white text on filled buttons and badges. On light surfaces, orange is used for interactive elements; body text should remain dark for accessibility.

### Secondary — Cooling Gray
The secondary color (#F2F2F2) provides a neutral, low-contrast balance to the high-energy primary orange. 
Used for:
- Secondary CTAs and ghost buttons
- Backgrounds for search bars and input fields
- Subtle dividers and layout structure

### Semantic Status
Status colors are used for data, alerts, and operational indicators:
- **Success (#22C55E)** — delivered, confirmed, revenue metrics
- **Warning (#F59E0B)** — P1 urgent priority, delivery time concerns
- **Danger (#EF4444)** — P0 emergency, SLA breach, failed delivery
- **Info (#3B82F6)** — dispatched, picked up, driver status

## Typography
DM Sans is the sole typeface. No secondary fonts.
The system uses bold weights aggressively — headings at 700–900, labels at 600–700, and body at 400. This creates a high-confidence feel.

Labels are always uppercase with wide letter-spacing (0.06–0.08em). Stat values use 36px at 800 weight with tight negative tracking (-0.02em) and are often color-coded to match their semantic meaning.

## Layout & Spacing
12-column grid, container max-width 1440px. 8px rhythmic spacing base.

### Spacing Rules
- **Between major sections:** lg (48px) or xl (80px)
- **Between cards in a grid:** md (24px)
- **Inside cards:** md (24px) padding
- **Between a label and its value:** xs (4px) or sm (12px)

## Elevation & Depth

### On Light Surfaces (Primary)
Cards use subtle shadows (`card`) to float above the light background. No borders by default; borders are used only for visible separation when cards are adjacent. On hover, shadows deepen (`card-hover`). The secondary gray (#F2F2F2) is used to define "sunken" interactive zones.

### On Dark Surfaces
Cards use lighter surface colors for elevation rather than shadows (e.g., `surface-700` floats above `surface-800`). 

## Shapes
- **Buttons and inputs:** 8px radius (DEFAULT)
- **Cards:** 12px radius (lg) on dark surfaces, 12–16px (lg to xl) on light surfaces
- **Pills and badges:** 9999px (full) — always pill-shaped
- **Modals:** 16px radius (xl)

## Components

### Buttons
- **Primary (Orange):** Background #FF5C00, text white. 8px radius. 
- **Secondary:** Background #F2F2F2, text #0F1923. Provides a distinct yet subtle alternative to the primary action.

### Stat Cards
Stat cards feature a large colored value. In light mode, they appear as clean white cards with a subtle left-border accent matching the status color.
┌─────────────────────┐
│  $4,820             │  ← stat-value (36px, 800wt, green)
│  REVENUE TODAY      │  ← label-sm (uppercase, muted)
└─────────────────────┘

### Search Bar (Shop-Facing Hero)
The most prominent element in light mode:
- 720px max width
- 20px radius for visual emphasis
- Secondary gray (#F2F2F2) background or subtle shadow
- Bold Orange "Search" CTA button

### Order Status Tracker
A horizontal stepper for the shop app:
- Completed steps: Navy charcoal fill.
- Current step: Orange fill with glow.
- Upcoming: Muted outline on secondary gray track.