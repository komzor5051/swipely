# Design: Hero Ambient Background Video

**Date**: 2026-03-06
**Status**: Approved

## Overview

Ambient looping background video for the Hero section of swipely.ru. Plays behind the existing Hero content (text + CTA buttons). Silent, autoplay, loop.

## Technical Specs

- **Tool**: Remotion (swipely-promo/ sub-project)
- **Format**: 1920×1080, 30fps, 750 frames (25 seconds)
- **Output**: WebM + MP4 (for cross-browser)
- **Placement**: `swipely-nextjs/public/hero-ambient.webm` + `.mp4`

## Visual Design

### Background
- White `#FFFFFF` base
- Subtle grid dot pattern matching the site: `rgba(0,0,0,0.04)` at 15×15px — video blends seamlessly with Hero
- Animated blue radial gradients (same as `.gradient-bg` CSS) slowly breathing

### Parallax Layers (3 depths)

**Layer 1 — Far (slow)**
- Cards: 320×400px
- Opacity: 0.12
- Speed multiplier: ×0.25
- Blur: 6px
- Motion: slow diagonal drift ↘

**Layer 2 — Mid**
- Cards: 260×325px
- Opacity: 0.30
- Speed multiplier: ×0.55
- Blur: 1px
- Motion: slight rotation ±4°

**Layer 3 — Near (fast)**
- Cards: 200×250px
- Opacity: 0.55
- Speed multiplier: ×1.0
- Blur: 0px (sharp)

### Card Templates Used
- SwipelySlide (blue gradient)
- GridMultiSlide (white + grid dots + lime accents)
- PurpleAccentSlide
- ReceiptSlide (monospace style)

Each card has slow sinusoidal rotation ±3° and float offset.

### Seamless Loop
Cards start off-screen → drift across → teleport back to start position. 25s loop invisible to user.

## Integration in Next.js Hero

Replace the static 3D card stack (right column) with `<video>` OR add as absolute background behind the entire Hero section:

```tsx
<video
  autoPlay
  muted
  loop
  playsInline
  className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
  src="/hero-ambient.webm"
/>
```

## File Locations

- Source: `swipely-promo/src/HeroAmbient.tsx` (new composition)
- Output: `swipely-nextjs/public/hero-ambient.webm` + `hero-ambient.mp4`
- Integration: `swipely-nextjs/app/page.tsx` Hero section
