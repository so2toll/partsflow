---
name: Creative AI Design System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#474832'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#78795f'
  outline-variant: '#c8c8ab'
  surface-tint: '#576500'
  primary: '#576500'
  on-primary: '#ffffff'
  primary-container: '#eaff7b'
  on-primary-container: '#677600'
  inverse-primary: '#b8d300'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#f6f4f3'
  on-tertiary-container: '#6f6f6f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2f000'
  primary-fixed-dim: '#b8d300'
  on-primary-fixed: '#191e00'
  on-primary-fixed-variant: '#414c00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e4e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: DM Sans
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
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
    fontWeight: '500'
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
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
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

## Brand & Style

This design system is built for a creative AI studio that prioritizes speed, clarity, and high-energy output. The visual language blends **Minimalism** with **High-Contrast Bold** accents, creating a professional environment that doesn't sacrifice the excitement of creative exploration.

The personality is "High-Performance Laboratory"—a space where the background recedes to let AI-generated content shine, while the UI elements use electric accents to signal activity and innovation. By using pure whites and deep charcoals, the system establishes a premium, authoritative foundation, while the neon primary color provides the "spark" of artificial intelligence.

## Colors

The palette is anchored by a high-energy contrast ratio. The **Primary Accent (#DFFF00)** is an "Electric Lime" intended for critical actions and state indicators. It should be paired exclusively with black text or icons to ensure legibility.

- **Surface:** Pure #FFFFFF is used for the main canvas to maximize the "pop" of the primary accent.
- **Header:** A deep charcoal/black (#121212) provides a structural frame at the top of the interface, separating navigation from the creative workspace.
- **Secondary/Text:** We use a deep black for primary headings and a muted gray (#666666) for secondary metadata to maintain a clean hierarchy.

## Typography

DM Sans is the sole typeface, chosen for its geometric purity and approachable character. 

- **Headlines:** Use tight tracking and bold weights for large display text to mimic the "boldness" of AI-driven media.
- **Body:** Standardized at 16px for optimal readability against the white background.
- **Labels:** Small labels use a medium weight and slight tracking to ensure they remain legible even when used within dense toolsets or secondary navigation.

## Layout & Spacing

The design system utilizes a **12-column fixed grid** for top-level pages, with a container max-width of 1440px to prevent excessive line lengths on ultra-wide monitors.

A strict 8px rhythmic grid governs all internal padding and margins. Spacious "xl" margins are encouraged between major sections to emphasize the clean, professional aesthetic, while toolbars and sidebars use "sm" and "md" spacing to maintain functional density.

## Elevation & Depth

To maintain a "borderless" look, the design system avoids strokes on cards and containers. Depth is conveyed through **Ambient Shadows**:

- **Card Elevation:** A very diffused, low-opacity shadow (e.g., `0 8px 30px rgba(0,0,0,0.04)`). This creates a "lifted" effect that feels light and airy.
- **Header Elevation:** The dark header is flat; it relies on its color contrast against the white background rather than shadows for separation.
- **Interactive States:** On hover, card shadows should slightly intensify and shift downward (e.g., `0 12px 40px rgba(0,0,0,0.08)`) to provide tactile feedback without the need for a border.

## Shapes

The shape language is consistently **Rounded (Level 2)**. 

- **Base Radius (8px):** Applied to standard buttons, input fields, and small UI components.
- **Large Radius (16px):** Used for cards and primary modal containers to soften the overall visual impact.
- **Pill Shapes:** Used for tags, chips, and toggle switches to differentiate interactive "status" elements from structural elements.

## Components

### Buttons
- **Primary:** Electric Lime (#DFFF00) background with black (#000000) text. No border.
- **Secondary:** Transparent background with a thin 1px charcoal border or a light gray ghost fill.
- **Tertiary:** Text-only with a heavy underline appearing on hover.

### Cards
Cards are the primary content vessel. They must be **borderless** with the "Card Elevation" shadow defined in the Elevation section. They should have a 16px border-radius.

### Input Fields
Inputs use a very light gray background (#F5F5F5) rather than a border. On focus, the background turns pure white and a 2px Electric Lime bottom border appears to signal activity.

### Header
The global header is a solid #121212 block. Navigation links should be white with a 50% opacity, turning 100% white on hover.

### Prompt Bar (Specific to AI Studio)
A specialized wide input component with a 32px border-radius, a soft shadow, and a large Electric Lime "Generate" button on the far right.