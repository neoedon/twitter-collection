# DESIGN SYSTEM — Nothing-Inspired Collection UI

A monochromatic, typographically-driven design system inspired by Nothing Phone / Teenage Engineering aesthetics. OLED-dark, information-dense, mechanically precise.

---

## 1. PHILOSOPHY

- **Subtract, don't add.** Every element must earn its pixel.
- **Monochrome is the canvas.** Color is an event (accent red, interactive blue), not decoration.
- **Type does the heavy lifting.** Scale, weight, spacing create hierarchy — not color or icons.
- **Data as beauty.** Numbers, labels, metadata ARE the visual.
- **Mechanical honesty.** Controls look like controls. Precision over polish.

---

## 2. TYPOGRAPHY

### Font Stack

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| Display / Hero | `Doto` | `Space Mono`, monospace | Page titles, hero moments. 48–72px. |
| Body / UI | `Space Grotesk` | system-ui, sans-serif | Body text, headings, values. 13–24px. |
| Labels / Data | `Space Mono` | `JetBrains Mono`, monospace | Labels, captions, metadata, buttons. ALL CAPS. 9–13px. |

### Load via Google Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Doto:wght@400;700&family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Line Height | Letter Spacing | Use |
|-------|------|-------------|----------------|-----|
| Display | 48–72px | 1.0 | -0.03em | Page title (Doto) |
| Heading | 24px | 1.2 | -0.01em | Section heads (Space Grotesk) |
| Body | 16px | 1.5–1.65 | 0 | Content text |
| Body Small | 14px | 1.55 | 0 | Card text |
| Subtext | 13px | 1.2 | 0.02em | Input, user names |
| Caption | 12px | 1.4 | 0.04em | Timestamps |
| Label | 11px | 1.2 | 0.06–0.08em | ALL CAPS labels, buttons, tags |
| Micro | 9–10px | 1.2 | 0.06–0.1em | Badges, small tags |

### Rules

- Labels: always `Space Mono`, ALL CAPS, wide letter-spacing
- Max 2 font families per screen, max 3 sizes
- Hierarchy through size contrast, not weight or color

---

## 3. COLOR SYSTEM (Dark Mode)

### Backgrounds & Surfaces

| Token | Hex | Role |
|-------|-----|------|
| `--black` | `#000000` | Page background (OLED) |
| `--surface` | `#111111` | Cards, elevated panels |
| `--surface-raised` | `#1A1A1A` | Nested surfaces, inputs |

### Borders

| Token | Hex | Role |
|-------|-----|------|
| `--border` | `#222222` | Subtle dividers (decorative) |
| `--border-visible` | `#333333` | Intentional borders, interactive outlines |

### Text

| Token | Hex | Role |
|-------|-----|------|
| `--text-display` | `#FFFFFF` | Headlines, hero numbers |
| `--text-primary` | `#E8E8E8` | Body text, primary content |
| `--text-secondary` | `#999999` | Labels, captions, metadata |
| `--text-disabled` | `#666666` | Disabled, timestamps, hints |

### Accent & Status

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#D71921` | Urgent, destructive, signal. ONE per screen. |
| `--accent-subtle` | `rgba(215,25,33,0.15)` | Accent tint backgrounds |
| `--interactive` | `#5B9BF6` | Links, tappable text, active selections |
| `--interactive-subtle` | `rgba(91,155,246,0.12)` | Interactive hover backgrounds |
| `--success` | `#4ade80` | Confirmed, imported, connected |
| `--success-subtle` | `rgba(74,222,128,0.12)` | Success tint backgrounds |

---

## 4. SPACING

8px base unit. Consistent vertical rhythm.

| Token | Value | Use |
|-------|-------|-----|
| `--space-xs` | 4px | Icon-to-label, tight padding |
| `--space-sm` | 8px | Internal component spacing |
| `--space-md` | 16px | Standard gaps, padding |
| `--space-lg` | 24px | Group separation, card padding |
| `--space-xl` | 32px | Section margins |
| `--space-2xl` | 48px | Major section breaks |
| `--space-3xl` | 64px | Page-level rhythm |
| `--space-4xl` | 96px | Hero breathing room |

---

## 5. COMPONENTS

### Cards

- Background: `--surface`
- Border: `1px solid --border`
- Radius: `12px`
- Padding: `16px` body
- Hover: border → `--border-visible`
- No shadows. Never.

### Nested Radius (Concentric Corners)

- A rounded element placed inside another rounded container must use `inner radius = max(0, outer radius - inset)`.
- `inset` is the actual distance from the outer edge to the inner element, usually the parent padding.
- Never copy the same radius onto both layers unless the inset is `0`.
- Prefer token-compatible combinations: outer `16px` + inset `16px` → inner `0`; outer `24px` + inset `8px` → inner `16px`.
- Web implementation: `border-radius: max(var(--radius-0), calc(var(--outer-radius) - var(--inset)));`.

### Liquid Glass Navigation

- The bottom navigation is icon-only; accessible names remain on every button through `aria-label`.
- Liquid Glass must sample and distort the content behind the navigation; a shader that only paints highlights or borders does not qualify.
- Use the multi-pass WebGL pipeline from [`@ybouane/liquidglass`](https://github.com/ybouane/liquidglass) (MIT): a viewport-local scene texture → Gaussian blur → refraction/chromatic aberration/Fresnel/specular composite. Never rasterize the full feed for a fixed navigation bar.
- Keep the effect restrained: transparent dark glass, thin chromatic edge and one subtle active state. Use `backdrop-filter` only as the no-WebGL fallback.

### Fullscreen Image Gesture

- Opening the lightbox locks the document at its current scroll position; background content must never move under the fullscreen image.
- The image follows one-pointer drag in any direction. Dismiss after crossing the distance or velocity threshold; otherwise animate back to center.
- Gesture animation uses only `transform` and `opacity`, exits in `200ms` with accelerate easing, and becomes immediate under `prefers-reduced-motion`.

### Buttons (Pill)

- Font: `Space Mono`, 10–11px, ALL CAPS, 0.06em spacing
- Padding: `6px 14px`
- Border: `1px solid --border-visible`
- Radius: `999px` (pill)
- Background: `transparent`
- Hover: text → `--text-display`, border → `--text-display`

### Inputs

- Underline style: bottom border only `1px solid --border-visible`
- Font: `Space Mono`, 13px
- Placeholder: `--text-disabled`, ALL CAPS, 11px
- Focus: border → `--text-primary`
- No background, no outline

### Tags / Chips (Filter)

- Same as pill buttons
- Active state: text → `--text-display`, border → `--text-display`
- Inactive: text → `--text-secondary`, border → `--border-visible`

### Badges

- Font: `Space Mono`, 9px, ALL CAPS
- Padding: `2px 6px`
- Radius: `3px`
- Variants by role color (accent, interactive, success)
- Background: subtle tint of role color

### Toast / Inline Status

- Background: `--surface-raised`
- Border: `1px solid --border-visible`
- Radius: `8px`
- Font: `Space Mono`, 11px, ALL CAPS
- Fixed bottom-center, fade-in animation

### Modal / Dialog

- Backdrop: `rgba(0,0,0,0.85)` — no blur
- Dialog: `--surface`, `1px solid --border-visible`, `16px` radius
- Max width: `640px`, max height: `90vh`, scroll inside
- Close button: circular 36px, `--surface-raised` bg, top-right sticky
- No shadows. Border separation only.

### Lightbox (Image Preview)

- Full-screen overlay `rgba(0,0,0,0.95)`
- Image: `max 92vw / 92vh`, contain
- Close: circular button top-right
- Click outside to dismiss

### Navigation Arrows

- Circular 40px buttons, `--surface` bg
- `1px solid --border-visible`
- Positioned outside the modal (`left: -56px` / `right: -56px`)
- Hover: border/text → `--text-display`

### Drop Zone (File Upload)

- Border: `2px dashed --border-visible`
- Radius: `12px`
- Text: `Space Mono`, 12px, ALL CAPS, `--text-disabled`
- Hover / drag-over: border → `--interactive`, bg → `--interactive-subtle`

---

## 6. LAYOUT

### Page Structure

- Max width: `1440px`, centered
- Padding: `32px 24px`
- Header → Controls → Content Grid

### Masonry / Waterfall Grid

- Flexbox columns (not CSS columns)
- Like / Search: 1 column below `768px`, 2 below `1024px`, 3 below `1440px`, otherwise 4.
- Home: 1 column below `768px`, otherwise 2; each date group owns its columns.
- Gap: `16px`
- Cards have natural height (no fixed aspect ratio)
- Cards flow into the current shortest column. Never use a row-based grid that stretches a short card or leaves blank space beneath it.

---

## 7. MOTION

- Duration: `200ms` for micro-interactions, `250ms` for transitions
- Easing: `ease-out` — subtle, no spring/bounce
- Prefer opacity over position changes
- Card enter: `translateY(12px)` → `0` with fade
- No parallax, no scroll-jacking

---

## 8. DOT-MATRIX MOTIF

Background texture for the page (very subtle):

```css
background-image: radial-gradient(circle, var(--border) 0.5px, transparent 0.5px);
background-size: 24px 24px;
opacity: 0.4;
```

---

## 9. ANTI-PATTERNS

- No gradients
- No shadows / box-shadow
- No blur (except video badge `backdrop-filter`)
- No border-radius > 16px on cards (999px only for pills)
- No filled icons or emoji as UI
- No skeleton loading — use `[LOADING...]` bracket text
- No toast popups — prefer inline status
- No zebra striping
- No spring/bounce animations
- No multi-color anything

---

## 10. VOICE & MICRO-COPY

- Status text in brackets: `[LOADING...]`, `[NO RESULTS]`, `[ERROR: ...]`, `[SAVED]`
- Labels: ALL CAPS, short (1–3 words)
- Actions: verb-first, uppercase (`VIEW →`, `OPEN ORIGINAL →`, `IMPORT CSV`)
- Counter format: `1 / 1000`
- Date format: `APR 8, 2026` (uppercase month abbreviation)
