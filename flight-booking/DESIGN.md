---
name: "Hemlock Paper"
description: "A warm off-white paper system that earns trust through quiet. Cream-paper surfaces, EB Garamond at oversized scale for headlines paired with Inter for UI, generous reading line-heights, a single forest-green accent reserved for verified marks and the primary CTA. Built for advisory firms, professional services, premium brands, and editorial sites that want quiet European authority."
tags: [editorial, warm, premium, serif, minimal]
colors:
  primary:   "#1c1a14"
  secondary: "#6b6759"
  tertiary:  "#1c1a14"
  neutral:   "#ebe4cf"
  surface:   "#f3ecd6"
typography:
  display: "EB Garamond"
  body:    Inter
  mono:    "JetBrains Mono"
  scale:
    hero: "6.5rem / 0.98 / 400 / -0.035em"
    h1:   "3.75rem / 1.06 / 400 / -0.022em"
    h2:   "1.875rem / 1.22 / 500 / -0.012em"
    body: "1.0625rem / 1.72 / 400 / -0.005em"
radius:
  sm: 2px
  md: 3px
  lg: 4px
  pill: 9999px
shadows:
  card:   none
  button: none
borders:
  card:    "1px solid rgba(28,26,20,0.12)"
  divider: rgba(28,26,20,0.16)
buttons:
  primary:
    background: #244232
    color: #f3ecd6
    border: none
    shape: sharp
    padding: 12px 24px
    font: 500 / 0.8125rem / 0.14em
    uppercase: true
  secondary:
    background: transparent
    color: #1c1a14
    border: 1px solid #1c1a14
    shape: sharp
    padding: 12px 24px
    font: 500 / 0.8125rem / 0.14em
    uppercase: true
  outline:
    background: transparent
    color: #1c1a14
    border: 1px solid rgba(28,26,20,0.18)
    shape: sharp
    padding: 12px 24px
    font: 500 / 0.8125rem / 0.14em
    uppercase: true
  ghost:
    background: transparent
    color: #6b6759
    border: none
    shape: sharp
    padding: 12px 16px
    font: 500 / 0.8125rem / 0.14em
    uppercase: true
charts:
  variant: "thin-bars"
  stroke_width: 1
  fill_opacity: 0
  gridlines: false
  bar_gap: 12px
  highlight: single
  dot_marker: false
fonts_url: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
dependencies: ["lucide-react"]
---

# Hemlock Paper

## AI Build Instructions

> **Read this section before writing any code.** The rules below
> are non-negotiable. Every value used in the UI must come from this
> file's frontmatter — never substitute, approximate, or invent new
> colors, fonts, radii, or shadows. If a value is missing, ask the
> user before adding one.

### 1 · Your role

You are building UI for a project that has adopted **Hemlock Paper** as its
design system. Treat `DESIGN.md` as the single source of truth.
Your job is to translate the user's product requirements into
components and pages that look like they were designed by the same
person who authored this file.

### 2 · Token compliance

- Pull every color, font family, radius, shadow, and spacing value
  from the frontmatter at the top of this file.
- Use semantic roles (e.g. `primary`, `accent`, `muted`) — never
  hard-code hex values that bypass the system.
- When a token can be expressed as a CSS variable, declare it once
  in your global stylesheet and reference it everywhere downstream.
- The Google Fonts `<link>` is provided in the Typography section.
  Add it to `<head>` before any component renders.

### 3 · Component recipes

Use these recipes verbatim when building the corresponding component.

#### Buttons

Four variants are defined. Pick one — never blend variants or invent a fifth.

- **Primary** — sharp shape, bg `#244232`, text `#f3ecd6`, padding `12px 24px`, weight `500`, uppercased.
- **Secondary** — sharp shape, text `#1c1a14`, border `1px solid #1c1a14`, padding `12px 24px`, weight `500`, uppercased.
- **Outline** — sharp shape, text `#1c1a14`, border `1px solid rgba(28,26,20,0.18)`, padding `12px 24px`, weight `500`, uppercased.
- **Ghost** — sharp shape, text `#6b6759`, padding `12px 16px`, weight `500`, uppercased.

Reach for **primary** as the single dominant CTA per screen.
**Secondary** for the supporting action. **Outline** for tertiary
actions in toolbars. **Ghost** for inline links and table actions.

#### Cards

- Background: `#f3ecd6`
- Border: `1px solid rgba(28,26,20,0.12)`
- Shadow: `none`
- Radius: `radius.lg` (`4px`)
- Internal padding: `20px` for compact cards, `24–28px` for content cards.

#### Tabs

Variant: `underline`. Flat row of labels. Active tab gets a 2px underline in the accent color — no fill.

#### Charts

- Bar/line variant: `thin-bars`
- No gridlines — let the bars/lines carry the data.
- Highlight strategy: `single` — emphasize a single bar/point per chart.

#### Typography pairings

- **Display (`EB Garamond`)** — h1, h2, hero headlines, brand wordmarks.
- **Body (`Inter`)** — paragraphs, labels, button text, form inputs.
- **Mono (`JetBrains Mono`)** — code, eyebrows, metadata, numerals in tables.

### 4 · Hard constraints

Never do any of the following without explicit instruction from the user:

- Introduce a new color, font, radius, or shadow that isn't declared above.
- Mix this system with another (e.g. don't paste in Material or Bootstrap defaults).
- Use generic gradient defaults (purple→blue, peach→pink) — they break the system's voice.
- Reach for emoji icons. Use a consistent icon library and size icons in line with body type.
- Add motion that exceeds the system's restraint — keep transitions short (≤200ms) and subtle.

### 5 · Before you finish — verify

Run through this checklist for every screen you produce:

- [ ] Every color used appears in the Colors table above.
- [ ] Headlines use the display font; body copy uses the body font.
- [ ] Buttons match one of the declared variants exactly (shape, padding, weight).
- [ ] Border-radius values come from `radius.sm` / `radius.md` / `radius.lg` / `radius.pill`.
- [ ] Cards and dividers use the declared border + shadow tokens.
- [ ] No values were invented; if you needed something missing, you stopped and asked.

---

## 1. Atmosphere

Hemlock Paper is a warm off-white paper system that earns trust through quiet. The page surface is cream paper `#f3ecd6` — warmer than a clinical white-paper, calmer than parchment. Headlines run in EB Garamond 400 at 104px — the classical serif at scale, never bold. Body sits in Inter at 17px on a 1.72 leading — a generous reading rhythm that signals long-form respect. UI labels run in Inter 500 with 0.14em uppercase tracking — the engraved-foundry voice. The single accent is forest green `#244232` reserved for verified marks (a small filled square in front of a verified item), the primary CTA, and the active step in a process flow.

The discipline is in the proportion: huge classical serif on warm paper, generous body leading, and one forest-green mark per page that reads as a notary stamp. The system never lifts a card and never adds shadows.

**Signature moves**
- EB Garamond 400 at 104px headlines — classical serif at scale, never bold
- Warm cream paper `#f3ecd6` — never bright white, never beige
- Forest green `#244232` exclusively on verified marks + primary CTA + active step
- 17px Inter body on 1.72 leading — generous long-form reading rhythm
- 0.14em uppercase tracking on UI labels — engraved-foundry voice
- Sharp 2-4px corners — letterpress precision, no shadows anywhere

## 2. Palette

### Surfaces
- **Cream Paper** `#f3ecd6` — page background (warm off-white)
- **Cream Lift** `#ebe4cf` — secondary surfaces, footer
- **Hairline** `rgba(28,26,20,0.12)` — every divider, every card edge

### Ink
- **Ink** `#1c1a14` — text, headings (warm near-black)
- **Ink 50** `#6b6759` — secondary text, mono captions

### Accent
- **Forest** `#244232` — verified marks, primary CTA, active step indicator
- **Forest Soft** `rgba(36,66,50,0.10)` — focus ring, hovered step

## 3. Typography

| Role | Font | Size | Weight | Leading | Tracking |
|------|------|------|--------|---------|----------|
| Hero | EB Garamond | 104px | 400 | 0.98 | -0.035em |
| H1 | EB Garamond | 60px | 400 | 1.06 | -0.022em |
| H2 | EB Garamond | 30px | 500 | 1.22 | -0.012em |
| Pull Quote | EB Garamond (italic) | 26px | 400 | 1.4 | -0.008em |
| Body | Inter | 17px | 400 | 1.72 | -0.005em |
| UI / Button | Inter | 13px | 500 | 1.4 | 0.14em uppercase |
| Caption / Date | JetBrains Mono | 11px | 500 | 1.0 | 0.10em uppercase |
| Reference Number | JetBrains Mono | 13px | 500 | 1.0 | 0.04em tabular-nums |

EB Garamond at 400 only — bold breaks the classical proportion. Italic reserved for pull quotes and the verified-by line.

## 4. Buttons

### Primary (Forest — Engage)
```css
background: #244232;
color: #f3ecd6;
padding: 12px 24px;
border-radius: 3px;
text-transform: uppercase;
letter-spacing: 0.14em;
font-weight: 500;
```

The forest-green on warm paper reads as a wax-stamped notary mark, not a marketing CTA.

### Secondary (Ink Outline)
- Transparent, 1px solid ink, ink text — same near-sharp shape, same wide tracking

### Outline & Ghost
- Outline: transparent, 1px hairline at 18% ink
- Ghost: no border, ink-50 uppercase

## 5. Cards (rare)

The system prefers hairline-divided sections over cards. When a card is needed, it is sharp 4px corners with a 1px hairline at 12% ink — never lifted, never shadowed. Practice-area cards may add a 1px ink top border (3px wide) — the only chrome.

## 6. Charts

Thin precise bars (3px wide, 12px gap). One bar in forest, others in 22% ink. NO gridlines. Y-axis labels in JetBrains Mono uppercase 11px. Charts are reserved for performance breakdowns and read as inscribed exhibits.

## 7. Tabs

Underline 1px in ink for the active state. Inactive tabs are ink-50 in Inter 500 uppercase 0.14em. The active label often switches to EB Garamond italic at the same size — that is the rhythm change.

## 8. Spacing

- Base 8px
- Scale: `8, 16, 24, 32, 48, 64, 96, 128, 200`
- Section padding: 160px desktop, 80px mobile — long-form rhythm

## 9. Do's & don'ts

✅ **Do**
- Use EB Garamond at 400 only — anything heavier breaks the classical proportion
- Hold the warm cream paper surface — bright white reads as web app, beige reads as old textbook
- Reserve forest green for verified marks + primary CTA + active step exclusively
- Use 17px Inter body on 1.72 leading — long-form reading respect

❌ **Don't**
- Use stock photography of pillars, trees, or "trust" imagery — the typography earns it
- Use EB Garamond at 600+ — bold breaks the classical proportion
- Use a second accent — forest alone, on three specific surfaces
- Add shadows or lifted cards — hairlines and breathing room carry the layout

---

## Tokens

> Generated from the same source the live preview renders from.
> Treat the values below as the contract — never substitute approximations.

### Colors

| Role      | Value |
|-----------|-------|
| primary   | `#1c1a14` |
| secondary | `#6b6759` |
| tertiary  | `#1c1a14` |
| neutral   | `#ebe4cf` |
| surface   | `#f3ecd6` |

### Typography

- **Display:** EB Garamond
- **Body:** Inter
- **Mono:** JetBrains Mono

| Role | size / leading / weight / tracking |
|------|------------------------------------|
| Hero | 6.5rem / 0.98 / 400 / -0.035em |
| H1   | 3.75rem / 1.06 / 400 / -0.022em |
| H2   | 1.875rem / 1.22 / 500 / -0.012em |
| Body | 1.0625rem / 1.72 / 400 / -0.005em |

### Radius

- sm: `2px`
- md: `3px`
- lg: `4px`
- pill: `9999px`

### Shadows

- **card:** `none`
- **button:** `none`

### Borders

- **card:** `1px solid rgba(28,26,20,0.12)`
- **divider:** `rgba(28,26,20,0.16)`

### Buttons

Four variants, each fully tokenized. The preview renders from these exact values.

#### Primary

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `#244232` |
| color | `#f3ecd6` |
| border | `none` |
| padding | `12px 24px` |
| fontWeight | `500` |
| fontSize | `0.8125rem` |
| tracking | `0.14em` |
| uppercase | `true` |

#### Secondary

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `transparent` |
| color | `#1c1a14` |
| border | `1px solid #1c1a14` |
| padding | `12px 24px` |
| fontWeight | `500` |
| fontSize | `0.8125rem` |
| tracking | `0.14em` |
| uppercase | `true` |

#### Outline

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `transparent` |
| color | `#1c1a14` |
| border | `1px solid rgba(28,26,20,0.18)` |
| padding | `12px 24px` |
| fontWeight | `500` |
| fontSize | `0.8125rem` |
| tracking | `0.14em` |
| uppercase | `true` |

#### Ghost

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `transparent` |
| color | `#6b6759` |
| border | `none` |
| padding | `12px 16px` |
| fontWeight | `500` |
| fontSize | `0.8125rem` |
| tracking | `0.14em` |
| uppercase | `true` |

### Charts

| Property | Value |
|----------|-------|
| variant | `thin-bars` |
| strokeWidth | `1` |
| fillOpacity | `0` |
| gridlines | `false` |
| barGap | `12px` |
| highlight | `single` |
| dotMarker | `false` |

---

## Pro tokens

> Production-fidelity tokens. States, density, motion, elevation,
> content rules and a measured WCAG contract — derived from the
> resting tokens unless explicitly authored.

### States

#### Button

- **hover** — bg: `rgba(28, 26, 20, 0.92)`, shadow: `0 4px 20px -8px rgba(28, 26, 20, 0.4)`
- **focus** — outline: `1.5px solid #1c1a14`, outline-offset: `4px`
- **active** — transform: `translateY(1px)`, filter: `brightness(0.95)`
- **disabled** — opacity: `0.45`
- **loading** — opacity: `0.7`
- **selected** — bg: `#1c1a14`, color: `#f3ecd6`

#### Input

- **hover** — border: `1px solid #1c1a14`
- **focus** — border: `1px solid #1c1a14`, shadow: `0 1px 0 0 #1c1a14`
- **disabled** — opacity: `0.45`
- **error** — border: `1px solid #991B1B`, shadow: `0 1px 0 0 #991B1B`

#### Card

- **hover** — shadow: `0 8px 24px -12px rgba(15,23,42,0.14)`, transform: `translateY(-1px)`
- **selected** — border: `1px solid #1c1a14`

#### Tab

- **hover** — color: `#1c1a14`
- **focus** — outline: `1.5px solid #1c1a14`, outline-offset: `3px`
- **selected** — color: `#1c1a14`, border: `0 0 2px 0 solid #1c1a14`

### Density

| Mode | padding × | row × | body | radius × | Use for |
|------|-----------|-------|------|----------|---------|
| compact | 0.72 | 0.78 | 0.8125rem | 0.85 | Information-dense — tables, IDEs, dashboards |
| comfortable | 1 | 1 | 0.9375rem | — | Default — most product UI |
| spacious | 1.35 | 1.3 | 1rem | 1.15 | Editorial — marketing, long-form, settings |

### Motion

**Signature — Page turn.** Deliberate, measured motion — like turning a magazine page. Never jerky, never overdone.

```css
transition: all 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

| Token | Value |
|-------|-------|
| duration.instant | `80ms` |
| duration.fast | `180ms` |
| duration.base | `320ms` |
| duration.slow | `500ms` |
| easing.standard | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| easing.decelerate | `cubic-bezier(0.0, 0, 0.2, 1)` |
| easing.accelerate | `cubic-bezier(0.4, 0, 1, 1)` |
| easing.spring | `cubic-bezier(0.5, 1.2, 0.6, 1)` |

### Elevation

Five-level scale, system-specific recipe.

| Level | Shadow | Recipe |
|-------|--------|--------|
| level0 | `none` | Hairline only — typical editorial resting state. |
| level1 | `0 1px 2px rgba(15,23,42,0.04)` | Barely visible — list rows, dividers. |
| level2 | `0 8px 24px -12px rgba(15,23,42,0.12)` | Pull-quote, sidebar — soft lift. |
| level3 | `0 16px 40px -16px rgba(15,23,42,0.18)` | Cover story card — clear lift. |
| level4 | `0 32px 80px -24px rgba(15,23,42,0.28)` | Modal — overlays the layout, with scrim. |

### Content

- **measure:** `60ch` (max line length for body prose)
- **paragraph spacing:** `1.5em`
- **list indent:** `1.75em`
- **list gap:** `0.55em`
- **link:** color `#1c1a14`, underline `always`
- **blockquote:** border `4px solid #1c1a14`, padding `0.4em 0 0.4em 1.5em`
- **code:** background `rgba(28, 26, 20, 0.06)`, color `#1c1a14`

### Accessibility (WCAG 2.1)

**Overall:** AA

| Pair | Ratio | Required | Grade | Suggested fix |
|------|-------|----------|-------|---------------|
| Body text on surface | 14.73:1 | AA | AAA | — |
| Body text on canvas | 13.69:1 | AA | AAA | — |
| Muted text on surface | 4.79:1 | AA | AA | — |
| Accent on surface | 14.73:1 | AA-Large | AAA | — |
| Accent on canvas | 13.69:1 | AA-Large | AAA | — |
