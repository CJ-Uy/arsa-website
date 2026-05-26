# DESIGN.md — ARSA Visual Design System

> Source of truth for ARSA (Ateneo Resident Students Association) brand expression on web.
> Derived from `branding/[ARSA2526] Brandbook/` and `branding/[ARSA2526] Event Brandbook Guidelines/`.
> Read this before designing or redesigning any ARSA page, component, banner, event tab, or marketing surface.

---

## 1. Brand Essence

**Motto**: _"in ARSA, it's good to be home"_

**Vision (paraphrased)**: Allow residents to approach ARSA without hesitation and know who to approach. Three pillars:

- **Council** — competent, visible, able to grow while nurturing the dorm community
- **Dormers** — active and organic involvement through genuine connections
- **Community** — bridges tradition and innovation

**Emotional register**: Warm, welcoming, home-like. Council/community feel. Diverse but unified. Bridges tradition (gold/maroon) and the new (crimson/violet) with Ateneo as the cool, trustworthy foundation (blue).

**Voice when designing**:

- Welcoming over formal
- Confident over flashy
- Communal over individual
- Warm over corporate

---

## 2. Color System

### Primary palette (warm — leads every composition)

| Token name      | Hex       | Brandbook name | Use                                                   |
| --------------- | --------- | -------------- | ----------------------------------------------------- |
| `arsa-maroon`   | `#a2250f` | (deep red)     | Primary brand red. Backgrounds, primary buttons.      |
| `arsa-orange`   | `#bc3700` | (burnt orange) | Gradient companion to maroon. Accents.                |
| `arsa-crimson`  | `#da1e39` | Crimson        | Passion, leadership. CTAs, highlights, error states.  |
| `arsa-violet`   | `#9f1d51` | Disco Violet   | Unity/diversity. Gradient start. Decorative.          |

### Secondary palette (cool — Ateneo anchor)

| Token name        | Hex       | Brandbook name | Use                                                  |
| ----------------- | --------- | -------------- | ---------------------------------------------------- |
| `arsa-navy`       | `#0e3663` | (deep navy)    | Body text on light bg, deep accents.                 |
| `arsa-blue`       | `#206299` | Matisse Blue   | Ateneo connection, info states, secondary buttons.   |

### Supporting palette (energy + breath)

| Token name      | Hex       | Brandbook name | Use                                                   |
| --------------- | --------- | -------------- | ----------------------------------------------------- |
| `arsa-saffron`  | `#f7bc37` | Saffron        | Highlights, badges, hover states, gold accents.      |
| `arsa-cream`    | `#ffefcd` | (cream)        | Light backgrounds, subtle warm fills, paper tones.   |

### Neutrals

- White `#ffffff` — surfaces, cards, content backgrounds
- Black `#000000` — pure text only when needed (rare; prefer `arsa-navy`)
- Cream `#ffefcd` — the brand-correct off-white. Prefer over `#f5f5f5` greys.

### Color rules (non-negotiable)

1. **Warm leads, blue supports.** Never make blue the dominant color of a page. Blue is the Ateneo anchor — accent only.
2. **No greys for warmth tones.** If a "muted background" is needed, reach for `arsa-cream` or a 5–10% tint of maroon, not neutral grey.
3. **Always pair crimson/orange with cream or white text.** Never put `arsa-saffron` text on `arsa-orange` (low contrast).
4. **Saffron is precious.** Use it sparingly — small badges, hover, gold-stroke accents. Never as a flood color.
5. **`#0e3663` navy is the body-text fallback**, not `#000`. Reserve `#000` for monochrome contexts only.

---

## 3. The Signature Gradient

The single most recognizable ARSA visual mark.

```
linear-gradient(135deg, #9f1d51 0%, #a2250f 50%, #bc3700 100%)
```

**Where it appears**:

- Brandbook page headers
- Announcement banners
- Event hero overlays
- Cover slides / title cards
- Primary CTA backgrounds (sparingly)

**Variants**:

| Variant         | Direction      | Stops                                       | Use                                       |
| --------------- | -------------- | ------------------------------------------- | ----------------------------------------- |
| Standard        | `135deg`       | `#9f1d51 → #a2250f → #bc3700`               | Default headers, banners                  |
| Horizontal      | `90deg` / `to right` | same stops                            | Footer accent, divider strips             |
| Soft / overlay  | `135deg`       | `rgba(159,29,81,.9) → rgba(188,55,0,.9)`    | Over photography (dorm building, events)  |
| Radial spotlight| `radial-gradient(circle at 30% 20%, ...)` | violet center → maroon edge | Hero highlights, gacha cards |

**Tailwind utility pattern**:

```html
<div class="bg-gradient-to-br from-[#9f1d51] via-[#a2250f] to-[#bc3700]">
```

**Rules**:

- Always include all three stops — never two-color gradient.
- White or `arsa-cream` text only on the gradient. No saffron, no blue.
- On photos, layer at 70–90% opacity with a soft vignette to keep dorm building / event imagery readable.

---

## 4. Typography

### Font stack

| Role        | Brandbook spec | Web fallback (in-repo)                     |
| ----------- | -------------- | ------------------------------------------ |
| Header      | **Avenir**     | `"Lexend Deca", "Avenir", system-ui, sans-serif` (Lexend Deca loaded; Avenir for licensed contexts) |
| Subheader   | **Proxima Nova** | `"Lexend Deca", "Proxima Nova", system-ui, sans-serif` |
| Body        | Proxima Nova / Gotham Pro / Lexend Deca | `"Lexend Deca", system-ui, sans-serif` |
| Motto / accent | _Italic serif_ (per brandbook motto rendering) | `Georgia, "Times New Roman", serif` italic |

> **Note**: Lexend Deca is loaded in `src/app/globals.css` and is the in-repo workhorse for all three roles. Treat the brandbook fonts as ideal — Lexend Deca is the production substitute.

### Type scale (web)

| Use                    | Size            | Weight | Line height | Tracking  |
| ---------------------- | --------------- | ------ | ----------- | --------- |
| Hero / display         | `clamp(2.5rem, 6vw, 4.5rem)` | 800    | 1.0–1.1     | -0.02em   |
| H1                     | `2.5rem` (40px) | 700    | 1.15        | -0.01em   |
| H2                     | `2rem` (32px)   | 700    | 1.2         | -0.01em   |
| H3                     | `1.5rem` (24px) | 600    | 1.3         | 0         |
| H4 / section eyebrow   | `1rem` UPPERCASE | 700   | 1.2         | 0.08em    |
| Body                   | `1rem` (16px)   | 400    | 1.6         | 0         |
| Body small             | `0.875rem`      | 400    | 1.5         | 0         |
| Caption / meta         | `0.75rem`       | 500    | 1.4         | 0.02em    |
| Motto / pull-quote     | `1.5rem`–`2.5rem` italic serif | 400 | 1.3 | 0 |

### Typography rules

1. **Headers in UPPERCASE on gradient backgrounds.** Mirrors brandbook section titles ("VISION", "COLOR", "TYPOGRAPHY").
2. **Use the italic serif motto sparingly.** Hero subtitles, About page tagline, footer signature. Not in UI chrome.
3. **Body always in Lexend Deca.** Don't mix sans families on a single page.
4. **Numbered section labels** (e.g., "01 THEME", "04 COLOR") are an ARSA pattern — use for long pages or guides.

---

## 5. Logo Usage

### Two approved marks

1. **Official logo** — Dorm building (red brick) under a wing crest, framed by lamp/key/book seal. Full color.
2. **Alternative logo** — Line-art version of same composition. Use on photographs, dense backgrounds, or where the official logo would compete.

### Logo rules (verbatim from brandbook)

- The image **must not be distorted or stretched**. Original proportions only.
- **Do not modify the alternative logo's colors** of the official version.
- The logo must **not be cropped**.
- Logo must remain **fully visible** — never partially obscured.

### Web placement

- Header navigation: official logo, max-height 40–48px desktop, 32px mobile.
- Footer: alternative logo (white on gradient) or official on cream.
- Favicon: simplified mark or the building element only.
- **Never place the official logo on a busy background** — reach for the alternative.

---

## 6. Texture & Surface

The brandbook calls out two paper-like textures (subtle off-white / light grey).

**On the web**:

- Use a **subtle paper / cream texture** on long-form content sections (About, Resources, Publications) to add warmth.
- Implement via low-opacity SVG noise or a tiled cream-tinted texture image. Never apply over gradient banners.
- Keep textures at 5–10% opacity. They should be felt, not seen.

**Cards & surfaces**:

- Default card: white background, `border` from token, `--radius: 0.5rem`, `--shadow-sm`.
- Warm card variant: `arsa-cream` background, no border, soft inner shadow.
- Event card on gradient page: white background with maroon hairline border + photo header.

---

## 7. Component Patterns

### Buttons

| Variant     | Background                        | Text          | Hover                          |
| ----------- | --------------------------------- | ------------- | ------------------------------ |
| Primary     | `arsa-maroon` (#a2250f)           | white         | darken 8% / shift to crimson   |
| CTA / Hero  | gradient (signature)              | white         | scale 1.02 + shadow lift       |
| Secondary   | `arsa-blue` (#206299)             | white         | darken 8%                      |
| Tertiary    | transparent + maroon border       | maroon        | maroon fill, white text        |
| Ghost       | transparent                       | navy          | cream background               |
| Destructive | crimson (#da1e39)                 | white         | darken                         |

Always `rounded-md` (0.375rem) minimum. Avoid pill shapes for primary actions — reserved for tags/badges.

### Cards (Event, Product, Article)

- White surface
- Optional 4px gradient top border for event/featured cards
- Photo at top (16:9 or 1:1), gradient overlay if title sits on photo
- Title in Lexend Deca 600, navy
- Meta in Lexend Deca 400, muted navy
- Hover: `translate-y-[-2px]` + `shadow-md`

### Banners (announcement / event hero)

- Background: signature gradient (135deg)
- Title: UPPERCASE white Lexend Deca, 700–800
- Optional countdown numerals in saffron (#f7bc37)
- Dismissible per the existing `announcement-banner.tsx` pattern

### Forms

- Inputs: white background, navy text, cream-tinted border on focus
- Focus ring: maroon at 30% opacity
- Error: crimson (#da1e39) — never use bright red outside the palette
- Success: warm green only if absolutely required; prefer a saffron checkmark + navy text

### Tags / Badges

- Pill shape, `text-xs`, uppercase, 0.05em tracking
- Color pairs: maroon/white, crimson/white, saffron/navy, cream/maroon, blue/white
- Event-specific tags can use event theme colors but must still meet AA contrast

---

## 8. Event-Specific Theming

Per the **Event Brandbook Guidelines**, every ARSA event gets its own micro-brand layered on top of the core system.

### Event branding hierarchy

```
ARSA core brand (this doc)
   └── Event theme (custom colors, animations, hero imagery)
         └── Individual collaterals (posters, IG posts, event page)
```

### Allowed event customization

- Custom **theme color** (must coexist with one of the 8 palette hexes — pure off-palette colors disallowed)
- Custom **animations** (confetti, hearts, snow, sparkles, petals — see `ShopEvent.customTheme`)
- Custom **hero imagery** (event photography with gradient overlay if text sits on photo)
- Custom **typography accents** for event titles (still must use Lexend Deca for body)
- Custom **checkout fields** and messaging (see `ShopEvent.checkoutFields`)

### Event theme must NOT override

- Logo rules
- Body typography (Lexend Deca remains)
- Navigation / header chrome
- The connection back to the ARSA core palette (at least one palette color must remain prominent)

### Event theme connection requirement

> _"The theme needs to be connected to how the dorms is a home for the ARSAn dormers."_ — Event Brandbook

Every event theme should be defensible against this question: how does this theme reinforce that the dorm is home?

---

## 9. Imagery & Documentation Style

### Photography direction

- **Warm-toned**, festive, communal
- Dorm building exteriors and interiors as recurring motifs
- Group photos > solo portraits for community feel
- Golden hour / interior warm lighting preferred over cool fluorescent

### When using stock or supplied photos

- Apply a **subtle warm filter** if cool-toned (push toward orange/saffron)
- Always layer the gradient at 60–80% opacity if text sits on top
- Avoid over-saturated travel-blog aesthetics — keep it grounded

### Iconography

- Stroke-based icons (lucide-react is the in-repo standard) at 1.5–2px stroke
- Color: navy for default, maroon for active/selected, crimson for destructive
- Never mix flat-fill icons with stroke icons in the same surface

---

## 10. Layout & Spacing

### Grid

- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Section padding**: `py-12 md:py-16 lg:py-24`
- **Card grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8`

### Spacing scale (Tailwind defaults work fine)

Stick to `4 / 6 / 8 / 12 / 16 / 24` for vertical rhythm. Avoid odd values.

### Mobile-first

- All pages designed mobile first (matches `CLAUDE.md` direction)
- Hamburger menu < `md`
- Tables in admin areas may scroll horizontally on mobile — acceptable

### Radius

- Default: `--radius: 0.5rem` (cards, buttons, inputs)
- Small chrome (tags, badges): `0.375rem` or pill (`9999px`)
- Hero imagery: `1rem` (`rounded-2xl`)
- Never use `0` (sharp) corners — feels cold, breaks the home/warmth voice

---

## 11. Animation & Motion

ARSA's voice is welcoming, not aggressive. Motion should feel gentle.

| Use                       | Duration  | Easing                          |
| ------------------------- | --------- | ------------------------------- |
| Hover state               | 150–200ms | `ease-out`                      |
| Card lift / press         | 200ms     | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Page section reveal       | 400–600ms | `ease-out`                      |
| Banner countdown tick     | 1s (linear)                                 |
| Event animations (confetti, petals) | per event config — keep under 8s |

**Avoid**: aggressive bounces, jank-prone parallax, autoplay video with sound, motion that competes with the gradient.

---

## 12. Accessibility

- Maintain **WCAG AA contrast** on all text (4.5:1 for body, 3:1 for large text)
- White on `arsa-saffron`: **fails AA** — always pair saffron with navy text
- Crimson on white: passes AA
- Maroon on white: passes AA
- Provide `prefers-reduced-motion` fallbacks for all event animations
- Logo: include `alt` text ("ARSA logo" or descriptive event variant)

---

## 13. In-Repo Mapping (Tailwind + CSS vars)

The existing tokens in `src/app/globals.css` already map to this system. Reference:

```css
/* Approximate mappings — current implementation */
--primary           → arsa-maroon (#a2250f)         /* oklch ~0.46 0.16 32 */
--primary-foreground → arsa-cream                    /* oklch ~0.96 0.04 86 */
--secondary         → arsa-navy (#0e3663)
--accent            → arsa-cream
--accent-foreground → arsa-maroon
--destructive       → arsa-crimson
--chart-1..5        → gradient palette + navy
```

When you need a brand hex directly, prefer **arbitrary Tailwind values** with the exact hex from §2 over reaching for the CSS variable — the variables are oklch-converted and may drift fractionally:

```html
<!-- preferred for brand-critical surfaces -->
<div class="bg-[#a2250f] text-white">

<!-- shadcn / themeable UI -->
<button class="bg-primary text-primary-foreground">
```

---

## 14. Quick "Does this look like ARSA?" Checklist

Before shipping any new design:

- [ ] Warm tones lead the composition; blue is accent only
- [ ] If there's a hero/banner, it uses the signature gradient (135deg, three stops)
- [ ] Body text is Lexend Deca, navy (#0e3663) or near-black
- [ ] Headers feel UPPERCASE-confident where they sit on gradient
- [ ] At least one of the 8 brandbook hexes is dominant (not approximations)
- [ ] Logo follows the four rules (no stretch, no recolor, no crop, fully visible)
- [ ] The motto _"in ARSA, it's good to be home"_ would feel at home in the layout
- [ ] No off-palette neutral greys masquerading as warmth — use cream instead
- [ ] Saffron used sparingly (≤10% of surface area)
- [ ] Mobile-first responsive; touch targets ≥ 44×44px
- [ ] AA contrast verified on every text/background pair

---

## 15. References

- **Core brandbook**: `branding/[ARSA2526] Brandbook/` (10 pages)
- **Event brandbook**: `branding/[ARSA2526] Event Brandbook Guidelines/` (13 pages)
- **In-repo tokens**: `src/app/globals.css`
- **Component library**: `src/components/ui/` (shadcn/ui — 57 components)
- **Existing brand surfaces to study**: `src/components/main/Header.tsx`, `src/components/main/Footer.tsx`, `src/components/main/announcement-banner.tsx`, `src/app/shop/events/2026/flower-fest-2026/`

When in doubt, open `branding/[ARSA2526] Brandbook/4.png` (color page) and `7.png` (samples page) for visual reference.
