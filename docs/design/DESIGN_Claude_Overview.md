# DESIGN.md — AI Content Studio (Stitch Design System)

## Creative Direction

### Who Is This For?

Independent creators, AI filmmakers, YouTube producers, and content teams who want to turn scripts into finished videos or intelligently edit existing footage using AI. They're creative people who are technically capable but not engineers. They've been frustrated by tools that are either too expensive (Higgsfield's credit system burns through budgets), too complex (ComfyUI requires a PhD in node graphs), or too limited (basic editors that generate clips but can't orchestrate a full production). They want to feel like a director — in control of the creative vision while the system handles the technical execution.

### What Should They Feel?

**Capable, not overwhelmed.** The interface should feel like a professional production tool — something that takes their work seriously — but never intimidating. Think of the difference between walking into a modern creative studio versus walking into an airplane cockpit. Both are professional environments, but a studio invites you to create while a cockpit makes you afraid to touch anything.

**Creative confidence.** The aesthetic should echo the output: modern, intentional, crafted. When a creator opens the dashboard, they should feel the same anticipation as opening a fresh project file. Light, clean environments with vibrant accent colors. Purposeful negative space. Controlled energy.

### Design Concept: "The Modern Creative Studio"

Think about what a modern creative studio looks like — light, bright surfaces that make content stand out, precise technical elements that inform without distracting, and controls that are immediately accessible but don't clutter the workspace. The interface is the frame around the creator's work, not the work itself. It should recede when viewing content and emerge when making decisions.

This is not a social media app (bright, playful, attention-grabbing). This is not an enterprise dashboard (dense, utilitarian, data-heavy). This is a modern creative production environment — light, clean, focused, with Electric Lime accent colors for the most important actions.

### Visual References

The aesthetic sits at the intersection of: Linear's clean light interface (professional productivity tool feel), Figma's modern light UI (clean information architecture), Notion's content-forward light UI (content takes center stage), and a modern creative studio app (light surfaces, vibrant accents, technical precision).

---

## Color System

### Color Hierarchy

Colors are assigned by role and visual weight, not as a matching palette.

**Neutral (85-90% of screen) — The Light Canvas:**
The environment. Clean white and light gray surfaces that create a modern, bright workspace. This is the "studio" — light enough that content pops but clean enough that it doesn't feel cluttered.

- Page background: `#F9F9F9` — Light gray surface
- Card/surface background: `#FFFFFF` — Pure white for elevated content
- Subtle/muted surface: `#F1F1F1` — Tertiary surface for hover states
- Border default: `#E5E5E5` — Subtle separation
- Border strong: `#D1D5DB` — More visible separation

**Primary (Core content) — Dark on Light:**
Text, headings, icons that communicate information. High contrast against the light canvas. Clean dark colors for readability.

- Primary text: `#000000` — Main headings and body
- Secondary text: `#6B7280` — Supporting text, descriptions, metadata
- Muted/disabled text: `#9CA3AF` — Inactive states, placeholders

**Accent (Call to action) — Electric Lime:**
The primary accent color used sparingly for the most important interactive elements. Buttons, active states, progress indicators, links. This is the "creative spark" — it tells the creator where to act. Electric Lime because it reads as both creative and modern, and it stands out dramatically against the light canvas.

- Action primary: `#DFFF00` — Primary buttons, active navigation, key CTAs
- Action hover: `#C8EF00` — Hover state
- Action background tint: `#F1FFD2` — Subtle backgrounds for active states
- Action text: `#000000` — Text on Electric Lime background

**Dark Navigation (Top Bar):**
- Top navigation background: `#121212` — Near black for contrast
- Top nav text: `#FFFFFF` / `#F1FFD2` — White and Electric Lime for navigation
- Top nav input background: `#1A1A1A` — Slightly lighter than nav

**Status Colors (Semantic):**
Used for system feedback. Each needs a background variant, a border variant, and a text variant that work on the light canvas.

- Success: `#34C759` bg:`#34C75915` — Render complete, upload success
- Information: `#5AC8FA` bg:`#5AC8FA15` — Indexing, processing
- Warning: `#FFD60A` bg:`#FFD60A15` — Approaching limits, slow render
- Error: `#FF453A` bg:`#FF453A15` — Failed render, payment issue

---

## Typography

### Font Selection

**Headline font: DM Sans (Bold/Medium)**
Clean, geometric, slightly rounded sans-serif that feels modern and confident without being cold. Has excellent readability at large sizes. Professional but approachable — like a modern studio brand, not a law firm.

**Body font: DM Sans (Regular/Medium)**
Same family for consistency. Highly readable for longer text (script previews, descriptions, documentation). The geometric quality gives technical content a polished feel.

**Mono/Label font: JetBrains Mono or IBM Plex Mono**
For timestamps, file sizes, render costs, technical metadata, code-like content. Gives a technical feel to data readouts.

### Typography Scale

- H1 (Page titles): DM Sans Bold, 32px/40px line-height
- H2 (Section headers): DM Sans Bold, 24px/32px line-height
- H3 (Card titles, subsections): DM Sans Medium, 18px/26px line-height
- Body: DM Sans Regular, 14px/22px line-height
- Body large: DM Sans Regular, 16px/24px line-height
- Small/Caption: DM Sans Regular, 12px/16px line-height
- Label/Mono: JetBrains Mono Medium, 12px/16px line-height
- Stat/Metric: DM Sans Bold, 28px/36px line-height (for dashboard numbers)

---

## Spacing & Radius

**Border radius:**
- Cards, containers: 12px — Slightly rounded, modern but not bubbly
- Tags, badges, pills: 999px (full round) — Clear visual distinction from containers
- Buttons: 8px — Subtly rounded, actionable feel
- Inputs: 8px — Match buttons for visual harmony
- Modals/dialogs: 16px — Slightly more rounded for floating overlay feel

**Spacing values (base-8 system):**
- 4px — Tight internal spacing (icon to label)
- 8px — Small gap (between related elements)
- 12px — Default inner padding
- 16px — Standard padding, card internal spacing
- 24px — Section spacing within a page
- 32px — Major section gaps
- 48px — Page section divisions
- 64px — Hero/feature section spacing

---

## Icons

- **Library**: Material Symbols Outlined (Google) or Lucide React
- **Size scale**: 16px (small/inline), 20px (default), 24px (large/navigation)
- **Style**: Filled/Outlined variants. Consistent with DM Sans' geometric quality.
- **Color**: Inherit from text color. Electric Lime accent only for interactive/active states.

---

## Component Specifications

### 1. Buttons

**Primary button:** Electric Lime background (#DFFF00), black text, 8px radius. Used sparingly — one primary CTA per screen section. Hover: slightly darker lime (#C8EF00).

**Secondary button:** Light gray background (#F1F1F1), dark text. For secondary actions. Hover: slightly darker gray.

**Ghost button:** No border, no background. Just text with hover underline or background. For tertiary actions, cancel, dismiss.

**Destructive button:** Error red background, white text. Only for irreversible actions (delete project, cancel subscription).

### 2. Inputs

**Text input:** White background (#FFFFFF), subtle border (#E5E5E5), gray placeholder text (#9CA3AF). Focus state: Electric Lime ring/border. Error state: error red border with error message below. 8px radius.

**Text area (Script Editor):** Same styling but taller. Should feel like a document — generous padding, comfortable line height.

**Select/Dropdown:** Match input styling. Dropdown panel has white background with subtle shadow.

**File upload zone:** Dashed border (#E5E5E5), centered icon and text. Hover: border becomes Electric Lime, subtle background tint. Active/dragging: Electric Lime border solid, background tint (#F1FFD2).

### 3. Cards

**Project card:** White background, subtle border (#E5E5E5), 12px radius, subtle shadow (0 1px 3px rgba(0,0,0,0.1)). Thumbnail image, project title, mode badge, status badge, date. Hover: subtle elevation.

**Stat card (Dashboard):** White background, subtle shadow, 12px radius. Metric number in large stat font, label in small/caption.

### 4. Badges/Tags

**Status badges:** Rounded pill shape. Uses status color system. Small dot indicator + text. Variants: queued (neutral), processing (info blue), complete (success green), failed (error red).

**Mode badges:** "Create" and "Edit" with distinct but non-status colors. Subtle background tint + text.

**Role badges:** Admin / User / Viewer. Subtle colored backgrounds matching permission level.

### 5. Tables

**Light theme table:** No heavy borders. Use subtle row separators (#F1F1F1). Header row slightly different background. Hover row: subtle highlight. Sortable columns with chevron indicators.

### 6. Progress Indicators

**Generation progress bar:** Segmented into pipeline stages. Active segment has Electric Lime fill with subtle animation. Completed segments are solid accent. Pending segments are muted.

### 7. Navigation

**Top navigation bar:** Full-width dark bar (#121212). Logo/brand mark left. Navigation links center or left-aligned in white/Electric Lime. User avatar + dropdown right. Active page indicator using Electric Lime underline or background. Height: 64px.

**Sidebar:** White surface, full height below top nav. Icon + label navigation items. Active item has Electric Lime background tint (#F1FFD2). Width: 256px.

### 8. Modals/Dialogs

**Overlay:** Semi-transparent dark backdrop (rgba(0,0,0,0.5)). Modal centered with white background, 16px radius, shadow. Clear title, content area, action buttons at bottom. Close button top-right.

### 9. Alerts/Notifications

**Toast notifications:** Bottom-right positioned. White surface with left accent color border indicating type. Shadow, auto-dismiss after 5 seconds.

### 10. Dashboard Widgets

**Quick stats grid:** 3-4 stat cards in a row. White background, subtle shadow. Projects count, videos generated, storage used, subscription status.

### 11. Empty States

Large icon or illustration, encouraging headline, clear CTA button. Clean, inviting feel.

---

## Page Layouts

### General Layout Structure

```
┌──────────────────────────────────────────┐
│  Top Nav (Dark) - 64px height            │
├──────────┬───────────────────────────────┤
│          │                               │
│ Sidebar  │  Page Content - max-width     │
│ (White)  │  centered, with 24-32px       │
│ 256px    │  padding                      │
│          │                               │
│          │  ┌────────────────────────┐  │
│          │  │  Page Header           │  │
│          │  │  Title + subtitle      │  │
│          │  ├────────────────────────┤  │
│          │  │                        │  │
│          │  │  Main Content Area     │  │
│          │  │  Cards, forms, tables  │  │
│          │  │                        │  │
│          │  └────────────────────────┘  │
│          │                               │
└──────────┴───────────────────────────────┘
```

### Screen-Specific Layouts

**Dashboard:** Page navigation links, stats grid (4 columns) at top, followed by recent projects grid (3 columns).

**Projects:** Grid of project cards with filtering/search.

**Teams:** Grid of team cards or list view with member management.

**Profile:** User info, settings, activity history.

---

## Interaction Patterns

### Micro-interactions

- Button press: Subtle scale-down (0.98) for tactile feel
- Card hover: Subtle shadow increase or border brightening
- Toggle/switch: Smooth slide animation with accent color
- Tab switching: Underline slides to active tab

### Loading States

- Skeleton screens for card grids and lists (light shimmer)
- Spinner for isolated actions (Electric Lime spinner)
- Progress bar for known-duration operations
- Pulsing dot for indefinite waits

### Transitions

- Page transitions: Subtle fade (150-200ms)
- Modal open: Scale from 0.95 to 1.0 with fade (200ms)
- Content reveal: Stagger-fade for lists and grids

---

## Dos and Don'ts

### Do

- Use the light canvas as the foundation — white cards on light gray backgrounds
- Reserve Electric Lime for interactive elements and the single most important action per screen
- Use generous negative space — the interface should breathe
- Show video thumbnails and previews wherever possible
- Make progress feel tangible — animations, percentage counts
- Keep technical metadata in mono font for clarity

### Don't

- Don't use more than 2-3 colors on any single screen beyond the neutral palette
- Don't make interactive elements look the same as static content
- Don't hide critical actions in menus — key actions should be visible
- Don't use heavy drop shadows — use subtle shadows (0 1px 3px rgba(0,0,0,0.1))
- Don't clutter the interface — keep it clean and focused

---

## Technical Implementation Notes

### Framework Integration

- **CSS Framework**: Tailwind CSS v4 for utility classes and responsive design
- **Component Library**: shadcn/ui for base components (Button, Input, Card, Dialog, Badge, Table, Tabs, Progress)
- **Icons**: Material Symbols Outlined or Lucide React
- **Frontend**: Astro with React islands for interactive components
- **Theme**: Light theme with Electric Lime accents

### Tailwind Configuration

Configure `tailwind.config.mjs` with Stitch design tokens:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          300: '#DFFF00', // Electric Lime
          400: '#C8EF00', // Hover
          100: '#F1FFD2', // Background tint
        },
        surface: {
          100: '#F9F9F9', // Page background
          200: '#FFFFFF', // Card background
          300: '#F1F1F1', // Hover
        },
        neutral: {
          600: '#000000', // Primary text
          400: '#6B7280', // Secondary text
          300: '#9CA3AF', // Muted text
        },
        border: {
          default: '#E5E5E5',
          strong: '#D1D5DB',
        },
        nav: {
          bg: '#121212', // Dark nav background
          text: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        // Base-8 system
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
      },
    },
  },
}
```

### Component Usage

When building components:
- Use Tailwind utility classes for styling
- Use shadcn/ui components as base, customized with Stitch tokens
- All interactive elements become React islands with `client:` directives
- Static layout stays as Astro components
- Reference `/app/components-library` for live component examples

---

*This DESIGN.md establishes the light theme with Electric Lime accents for the AI Content Studio. This is the authoritative design reference for all implementation work.*
