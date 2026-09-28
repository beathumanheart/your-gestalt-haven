# Handoff: Homepage compaction — Services, Pricing, Footer socials, EN/RU toggle

## Overview
Targeted improvements to the humanheart.life homepage (repo: `beathumanheart/your-gestalt-haven`, branch `main`). Not a redesign — the existing palette, fonts, section order and all other sections stay exactly as they are. Four areas change:

1. **Services section** — restructured and compacted: topics first (expanded to 4 groups × 6 subtopics), then a one-line short/long-term row, a practical-info pill, and a compact solidarity-pricing slider replacing the 3-tier grid + "pay more / pay less" boxes.
2. **Header** — language switcher becomes an EN · RU segmented toggle.
3. **Footer** — adds a centered row of 3 social icon buttons (Substack, Instagram, YouTube) below the existing columns.
4. **Copy** — a handful of rewritten lines (all listed below; EN only, RU translations still needed).

## About the Design Files
`Homepage - with social links.dc.html` in this bundle is a **design reference created in HTML** — a prototype showing intended look and behavior, not production code. The task is to **recreate these changes in the existing codebase** (Vite + React + TypeScript + Tailwind + shadcn), using its established patterns: content lives in `src/content/*.ts` (bilingual EN/RU objects), components in `src/components/`, theme tokens in `src/index.css` / `tailwind.config.ts`. `Homepage - current.dc.html` is a reference recreation of the page BEFORE changes, for diffing.

## Fidelity
**High-fidelity.** Colors, spacing and typography are final and use the site's existing HSL tokens. Recreate pixel-perfectly with the existing Tailwind token classes (`text-primary`, `bg-muted`, `border-border`, `font-display`, `font-body`, etc.) rather than raw HSL values — the values below map 1:1 to tokens already defined in `src/index.css`.

## Design Tokens (existing — for reference, all already in src/index.css)
- Background cream: `hsl(40 33% 97%)`
- Ink / foreground: `hsl(30 10% 25%)`
- Muted text: `hsl(30 8% 50%)`
- Sage / primary: `hsl(150 25% 35%)`
- Sage light bg: `hsl(150 20% 90%)`
- Terracotta accent: `hsl(18 60% 55%)`
- Border: `hsl(35 20% 88%)`
- Beige section bg: `hsl(35 30% 90%)` (used at 30–50% alpha)
- Fonts: Cormorant Garamond (display), Lora (body)

---

## Change 1: Services section (`src/components/Services.tsx`, `src/content/services.ts`)

### New section order
1. Section heading
2. "What we might work on" — 4 topic cards (NEW, replaces the 3 chips that used to sit at the END of the section)
3. Short-term / long-term — one bordered row (replaces the two big cards)
4. Practical-info pill + payment line (replaces the "How It Works" panel)
5. Solidarity pricing — compact slider block (replaces €40–€190 headline + 3 tier cards + 2 guidance boxes)

### 1a. Section heading (one heading only — "My Approach" eyebrow and the old H2 are deleted)
- H2: `What We Might <em>Work On</em>` — Cormorant Garamond 48px weight 300, "Work On" italic, centered
- Subtitle, Lora 16px, muted, max-width 576px, centered:
  `None of these will describe you exactly — your story is your own. These are simply the doors people most often come through.`
- DELETED copy: "My Approach" eyebrow, "How I Can Support You", "Short-term or long-term therapy in the Gestalt tradition — meeting you exactly where you are."

### 1b. Topic cards — 2×2 grid, gap 16px
Card: padding 24–26px, radius 16px, background cream `hsl(40 33% 97%)`, 1px border `hsl(35 20% 88%)`. No shadow.
Card header: 17px lucide icon in terracotta + Cormorant Garamond 20px title, gap 10px, margin-bottom 12px.
Body: one Lora 14px muted paragraph, line-height 1.75, subtopics separated by ` · ` (middle dot, not a list).

| Card | Icon (lucide) | Subtopics |
|---|---|---|
| Grief & loss | Heart | Death of someone close · Anticipatory grief and long illness · Miscarriage and childlessness · Losing a home or country · The end of a relationship · Grief no one around you recognises |
| Relationships | Users | Partners and intimacy · Repeating patterns in who you choose · Parents and family roles · Friendship, distance and drifting apart · Conflict and boundaries at work · Loneliness inside a relationship |
| Anxiety & feeling stuck | Flame (or similar) | Constant low-level worry · Dread with no clear cause · Burnout and exhaustion · Procrastination and self-criticism · Shame and perfectionism · Anger you don't know where to put |
| Transitions & meaning | Clock | Emigration and life between countries · Career change or losing work · Becoming a parent · Ageing, time and mortality · Identity, values and belonging · "Is this really my life?" |

### 1c. Short-term / long-term row
One row, 2 columns (gap 32px), padding 22px 0, 1px top AND bottom border `hsl(35 20% 88%)`. No cards, no icons, no bullet lists.
Each column: `display:flex; align-items:baseline; gap:12px` —
- Term: Cormorant Garamond 19px ink, `white-space:nowrap` — `Short-term` / `Long-term`
- Line: Lora 14.5px muted:
  - Short-term: `Up to 10 sessions — when one thing needs attention, and an end we can both see.`
  - Long-term: `Six months and on — when it's less about one thing, and more about how your life fits together.`
- DELETED: both card descriptions and both 4-item bullet lists (Personal growth / Understanding patterns / … and Something pressing / Life transitions / …).

### 1d. Practical-info pill
Fully-rounded pill (`border-radius:999px`), padding 18px 30px, background `hsl(35 30% 90% / .5)`, 1px border. Content centered, `flex-wrap:wrap`, gap 10px 28px, Lora 14px. Three items separated by 1×16px vertical hairlines (`hsl(35 20% 85%)`):
1. Video icon (sage) + `Online, wherever you are` (ink)
2. Clock icon (sage) + `50 minutes, usually weekly` (ink)
3. `Payment within 24h` (muted — MUST stay this short or the pill wraps; the max content width is ~800px)
Below the pill, margin-top 14px, centered Lora 13.5px muted: `Bank transfer, Wise, Revolut or crypto.`
Margin-bottom 56px.

### 1e. Solidarity pricing — compact 2-column block
Container: padding 26px 32px, radius 20px, background `hsl(35 30% 90% / .5)`, 1px border. Grid `1fr 1.1fr`, gap 36px, vertically centered. Total height ≈190px.

Left column:
- Row: CreditCard icon 17px sage + `SOLIDARITY PRICING` (13px uppercase, letter-spacing .2em, sage)
- Lora 14.5px muted, line-height 1.6: `This works because we trust each other — those who can pay more make it possible for those who can't. Choose the number that's honest for your life right now.`

Right column (the slider):
- Price row: `€{rate}` Cormorant Garamond 34px ink + `per 50 min` 13px muted + band label right-aligned 13px sage
- `<input type="range" min="40" max="190" step="5">`, default 80
- Under it: `€40` / `€190` at the ends, 12.5px muted
- Guidance paragraph 13.5px muted, line-height 1.6, `min-height:44px` (prevents jump between bands)

Band logic (3 bands):
- rate < 70 → label `When resources are tight`; note `Choose here if you're studying, between jobs, carrying debt or medical costs, or supporting others financially. No explanation asked for.`
- 70 ≤ rate ≤ 110 → label `A fair rate for most`; note `Choose here if your income covers your needs with some room left over. This is what most people pay.`
- rate > 110 → label `Helping someone else access care`; note `Choose here if you own property or have savings, travel for pleasure, or have family to fall back on. Your rate quietly funds someone else's.`

Slider styling (add to `src/index.css`):
```css
input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; }
input[type=range]::-webkit-slider-runnable-track { height:2px; background:hsl(35 20% 85%); border-radius:2px; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:26px; height:26px; margin-top:-12px; border-radius:50%; background:hsl(150 25% 35%); border:4px solid hsl(40 33% 97%); box-shadow:0 2px 8px hsl(30 10% 25% / .25); cursor:grab; }
/* add -moz-range-track / -moz-range-thumb equivalents for Firefox */
```
DELETED: `€40 – €190` headline, the 3 tier cards (€40–60 / €70–110 / €110–190), the "Choosing your rate" divider, and both "You might pay more/less if you:" boxes. Their content is preserved in the 3 band notes above.

State: local `useState<number>(80)` is enough. Optional: pass the chosen rate into the booking widget later (not in scope).

### 1f. DELETED at end of section
The old "I often work with:" chips row (Grief & Loss / Relationships / Life Transitions) — superseded by the topic cards.

## Change 2: Header language switcher (`src/components/LanguageSwitcher.tsx`)
Replace the globe-icon pill button with a segmented control:
- Container: `display:flex; gap:2px; padding:4px; border-radius:999px; border:1px solid hsl(35 20% 88% / .5); background:hsl(40 33% 97% / .5); backdrop-filter:blur(4px)`; Lora 13px
- Active segment: `padding:5px 12px; border-radius:999px; background:hsl(40 33% 97%); color:hsl(30 10% 25%); font-weight:500; box-shadow:0 1px 3px hsl(30 10% 25% / .08)`
- Inactive segment: same padding, muted color, `cursor:pointer`; hover → `background:hsl(35 30% 90% / .6); color:hsl(30 10% 25%)`; transition `.2s`
- Wire to the existing `LanguageContext` (`EN` / `RU` segments; clicking inactive one switches language)

## Change 3: Footer socials (`src/components/Footer.tsx`, content in `src/content/*.ts`)
Below the existing 3-column row (brand | nav links | email/copyright), add a full-width row:
- `margin-top:28px; padding-top:24px; border-top:1px solid hsl(35 20% 88%); display:flex; justify-content:center; gap:12px`
- Three icon-only circular links, 38×38px: `border-radius:999px; border:1px solid hsl(35 20% 88%); color:hsl(30 8% 50%)`; icon 16px
- Icons: Substack (3 bars + open envelope glyph — inline SVG in the design file; lucide has no Substack icon), Instagram (lucide `Instagram`), YouTube (lucide `Youtube`)
- Hover: `color:hsl(18 60% 50%); border-color:hsl(18 60% 55% / .45); background:hsl(18 60% 55% / .1); transform:translateY(-2px)`; transition `.2s` on color/background/border-color/transform
- Each has `title` + `aria-label` with the platform name; `target="_blank" rel="noopener noreferrer"`
- **URLs are placeholders** (`https://substack.com/humanheartbeat`, `https://instagram.com/humanheartbeat`, `https://youtube.com/@humanheartbeat`) — ⚠️ get real URLs from Genia before merging. Keep them in the content files, not hardcoded in the component.

## Change 4: Booking widget — no code change, DB task
The design shows 3 session-type cards with duration only and **no prices** — this matches the existing `SessionTypeSelector` behavior when `show_price=false`. The live `session_types` rows in Supabase are the source of truth; nothing to implement, but do NOT reintroduce seed data ("Initial Consultation" / €40 / €80 are seed examples only, they don't exist on the live site).

## Interactions & Behavior
- Slider: updates €-figure, band label and guidance text live (`onChange`/`onInput`); guidance area has fixed min-height so the block doesn't reflow
- Topic cards, short/long-term row, pill: static, no hover states
- Footer icons + header toggle: hover states as specified, keyboard-focusable links/buttons
- Responsive: topic grid 2×2 → 1 column below ~640px; pricing grid 2 col → stacked; pill wraps gracefully (items center); footer social row already centered

## RU copy — still needed
All new/changed EN strings need Russian counterparts written as their own sentences (not literal translations), added to the RU objects in `src/content/services.ts`. List of strings requiring RU: section subtitle, 4×6 subtopics, short/long-term lines, pill items, payment line, pricing intro, 3 band labels + 3 band notes.

## Files in this bundle
- `Homepage - with social links.dc.html` — the design (open in a browser; slider is live)
- `Homepage - current.dc.html` — pre-change reference recreation, for diffing
- `src/assets/hero-therapy.jpg`, `src/assets/portrait.jpeg` — copied from the repo, unchanged (only so the reference files render)

## Suggested workflow
```
git checkout -b redesign/services-footer
# point Claude Code at this folder: "implement design_handoff_homepage_compaction/README.md"
npm run dev   # verify against the design file side by side
git commit -am "Compact services + pricing slider, footer socials, EN/RU toggle"
git push -u origin redesign/services-footer
```
PR → merge → prod deploy as usual. Before merging: real social URLs, RU strings, confirm session-type names in the Supabase admin.
