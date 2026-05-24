---
name: Kinetic Assistive Interface
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#0060ac'
  on-secondary: '#ffffff'
  secondary-container: '#64a8fe'
  on-secondary-container: '#003c70'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-lg:
    fontFamily: manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: manrope
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: atkinsonHyperlegibleNext
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: atkinsonHyperlegibleNext
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: atkinsonHyperlegibleNext
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  touch-target-min: 56px
  card-padding: 24px
---

## Brand & Style
The design system is centered on the intersection of medical precision and futuristic empathy. Designed for the "Assistive Smart Glove System," the aesthetic avoids the sterile coldness of traditional medical software in favor of a "Calm Tech" approach. It prioritizes cognitive ease and physical accessibility for users who may be experiencing limited mobility, tremors, or sensory fatigue.

The style is **Modern / Glassmorphic**, utilizing soft layers and subtle gradients to create a sense of depth and airiness. The interface should feel like a guided partner—quietly intelligent, encouraging, and unfailingly reliable. High-contrast elements ensure clarity, while spacious layouts prevent accidental interactions, creating a sanctuary of control for the user.

## Colors
This design system uses a palette rooted in "Trust Blue." The primary blue is vibrant enough to signify modern technology but deep enough to meet AAA accessibility standards against the light background. 

Functional colors (Success, Warning, Danger) are saturated to ensure they are immediately distinguishable. In dark mode, the palette shifts to deep navy tones to reduce eye strain and light emission, which is particularly beneficial for users with light sensitivity. Gradients should be used sparingly, primarily on primary action buttons or "Glove Active" status indicators, moving from Primary to Secondary Blue to evoke a sense of motion and energy.

## Typography
Typography is the backbone of accessibility in this design system. We utilize **Manrope** for headlines to provide a clean, modern, and slightly technical feel. For all functional text, body copy, and labels, we use **Atkinson Hyperlegible Next**, which was specifically designed to increase character recognition and legibility for low-vision readers.

Line heights are intentionally generous (1.6x for body text) to prevent "crowding" of information. High contrast between text and background is maintained at all times, and font weights never drop below 400 to ensure stroke thickness remains visible under various lighting conditions.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile-first interaction. We use an 8px base unit to ensure consistent scaling. 

For the "Assistive Smart Glove System," whitespace is a functional tool, not just an aesthetic choice. Large 24px margins prevent users from accidentally hitting the edges of the screen, and 16px gutters provide clear separation between interactive zones. To accommodate users with tremors, all primary touch targets have a minimum height of 56px, exceeding standard accessibility guidelines to ensure a high success rate for interactions.

## Elevation & Depth
The design system employs **Ambient Shadows** and **Tonal Layers** to define hierarchy. 

1.  **Base Layer:** The background (#F7F8FA) acts as the canvas.
2.  **Card Layer:** Interactive content sits on floating white cards with a high-diffusion shadow (Blur: 20px, Y: 4px, Opacity: 6% Black). This "lift" suggests the card can be interacted with.
3.  **Active Layer:** For critical alerts or active glove states, a subtle backdrop blur (12px) is used on overlays to keep the user focused on the immediate task while maintaining environmental context.

Shadows should be tinted slightly with the Primary Blue (e.g., 2% saturation) to maintain the "Calm Tech" atmosphere and avoid a "muddy" appearance in dark mode.

## Shapes
The shape language is organic and approachable. This design system uses **Rounded (Level 2)** settings as the default. 

- **Standard Components (Buttons, Inputs):** 0.5rem (8px) corner radius.
- **Surface Containers (Cards, Modals):** 1.5rem (24px) corner radius to create a soft, friendly silhouette that feels safe to the touch.
- **Progress Indicators:** Fully rounded (pill-shaped) to represent the fluid nature of movement and kinetic data.

## Components

### Buttons
Primary buttons are 56px tall with bold typography and a subtle blue gradient. Secondary buttons use a ghost style with a 2px border. All buttons must have a "Pressed" state that provides clear visual feedback (scaling down by 2% or darkening the fill) to assist users with tactile feedback needs.

### Floating Cards
Cards are the primary container. They should have 24px internal padding and 24px rounded corners. Use cards to group related glove telemetry or health data, ensuring only one primary action is present per card to reduce cognitive load.

### Input Fields
Inputs must have a minimum height of 56px. Labels are always persistent (no floating labels that disappear) to assist users with memory or cognitive impairments. Borders should thicken to 3px on focus using the Primary Blue.

### Glove Status Indicators
A specialized component featuring a pulsating glow and a "Pulse" icon. Use Success Green for "Connected," Warning Amber for "Calibration Required," and Danger Red for "Disconnected."

### List Items
List items should be separated by clear 8px gaps (not just dividers) to provide distinct tap targets. Icons should be used alongside text in every list item to provide dual-coding for faster recognition.