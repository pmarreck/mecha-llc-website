# Mecha LLC Website — Design Spec

**Date:** 2026-04-17
**Status:** Approved for implementation
**Deploy target:** GitHub Pages, repo `pmarreck/mecha-llc-website`, custom domain `mecha.llc`

## Purpose

A small, professional marketing site for Mecha LLC with three pages: home, consulting services, and software (coming-soon apps). The site must read as credible to two audiences that rarely overlap — attorneys and financial services professionals on one hand, and technical buyers on the other — with *data integrity* as the unifying theme.

## Scope

In scope:
- Three static HTML pages served by GitHub Pages at the root of `pmarreck/mecha-llc-website`.
- Shared visual system (CSS + minimal JS) with three intentional flourishes: format ticker, scroll fade-ins, cursor-proximity edge light.
- Phone number obfuscation via inline SVG.
- Custom domain configuration for `mecha.llc`.
- Local preview via the existing `server.lua` (LuaJIT) in the repo root.

Out of scope:
- Contact form (no backend; GitHub Pages is static-only).
- Blog, CMS, analytics, consent banners.
- License changes or licensing discussion for the apps (mentioned by user; deferred).
- Any per-app documentation or product pages beyond the coming-soon card on `/software/`.

## Stack

- Hand-written HTML and CSS. No templating, no build step.
- One shared `assets/css/site.css` containing all styles (design tokens as CSS custom properties).
- One shared `assets/js/site.js` containing the three JS features.
- `server.lua` for local preview (already present).
- Deployed as-is from `main` branch via GitHub Pages "Deploy from a branch."

Rationale: three pages is below the threshold where a templating engine saves more than it costs. Duplicating ~15 lines of nav + footer per page is cheaper than a Ruby/Node toolchain.

## Directory Layout

```
mecha-llc-website/
├── index.html
├── consulting/index.html
├── software/index.html
├── assets/
│   ├── css/site.css
│   ├── js/site.js
│   └── img/
│       ├── validate.png            (from ../validate_gui/Icon.png)
│       ├── entropy-shield.png      (from ../entropy_shield/EntropyShieldIcon.png)
│       ├── blip.png                (from ../BLIP/assets/app-icon.png)
│       └── favicon.svg
├── CNAME                           (contents: mecha.llc)
├── server.lua                      (existing)
├── README.md
└── docs/superpowers/specs/2026-04-17-mecha-llc-website-design.md
```

URLs: `/`, `/consulting/`, `/software/`. Trailing slashes are canonical (GitHub Pages serves `consulting/index.html` at `/consulting/`).

## Visual System

**Color tokens** (defined as CSS custom properties on `:root`):
- `--bg: #0f1115` — page background
- `--bg-elev: #141821` — card background (subtle elevation)
- `--fg: #eaeaea` — primary text
- `--fg-muted: #9fb1c5` — secondary text
- `--fg-subtle: #8aa0b8` — tertiary text, labels
- `--accent: #3b82f6` — primary CTA, links
- `--accent-dim: #7aa4d6` — eyebrow labels, accents
- `--border: #1f2833` — card borders
- `--border-strong: #2a3340` — secondary button borders

**Typography:**
- `Inter` for everything (via system-stack fallback: `'Inter', system-ui, -apple-system, sans-serif`).
- Display sizes ~40px hero / ~34px sub-page hero, letter-spacing `-0.01em`, weight 650.
- Body 15px, `--fg-muted`, line-height 1.55–1.6.
- Eyebrow labels 11px, letter-spacing 0.18em, uppercase, `--accent-dim`.

**Hero background:** single radial gradient fixed in top-right, `rgba(120,170,255,0.20) → transparent 62%`, 700×260px.

**Shared components** (realized as CSS classes, not partials):
- Top nav: brand mark (`MECHA · LLC`) on the left, three links (`Consulting`, `Software`, `Contact`) on the right. Current page gets a 1px blue underline.
- Footer: horizontal rule, contact block (email mailto, obfuscated phone), small © line. Same markup on every page.
- `.card` base: 1px `--border`, 8px radius, 16–18px padding, background `--bg-elev`.
- `.btn-primary`: solid `--accent`, white text, 6px radius. `.btn-secondary`: 1px `--border-strong` outline, `--fg` text.

## Page Content

### `/` (home)

1. Nav.
2. Hero: eyebrow `DATA INTEGRITY`, headline "High-stakes engineering that holds up under audit.", subhead naming the three lines of work, CTAs "Get in touch →" (mailto) and "Data integrity apps" (`/software/`).
3. Format ticker (see JS feature 1) — small standalone module just below the hero.
4. Two teaser cards side-by-side linking to `/consulting/` and `/software/`.
5. Contact section (`id="contact"`).
6. Footer.

### `/consulting/`

1. Nav (Consulting active).
2. Hero: eyebrow `CONSULTING`, headline "AI and engineering help for regulated, high-stakes work.", subhead framing target audience.
3. Three service cards:
   - **A · Legal** — "LLM & workflow design for document-heavy practices. Retrieval, review automation, and prompt architectures built to be auditable."
   - **B · Finance** — "AI integration under audit and compliance constraints. Pipelines designed for reproducibility, traceability, and review."
   - **C · Code Review** — "Contract code review. Deep reviews for correctness, security, and architecture. Independent second pair of eyes."
4. Engagement blurb in a left-border callout: "Engagements start with a scoped conversation — no pitch deck, no SOW theater. If the fit's right, we write a short agreement and get moving."
5. "Get in touch →" CTA.
6. Contact section + footer.

### `/software/`

1. Nav (Software active).
2. Hero: eyebrow `DATA INTEGRITY APPS`, headline "Tools for people who care about their bytes.", subhead.
3. Three app cards, each with 64×64 icon (left), name + `COMING SOON` badge + description + status line, repo link on the right where applicable:
   - **Validate** — "The first app to attempt validation of the byte-level binary structure of every common file format (240+) and many less-common ones. Only made possible with AI assistance." · Status: "Open source · GUI version coming" · Repo link: `https://github.com/pmarreck/validate`
   - **Entropy Shield** — "Protects files against bitrot. Detects and repairs silent corruption before it spreads." · Status: "Commercial" · No repo link.
   - **BLIP Archiver** — "Best-in-class compression for common file types. Smaller archives without lossy trade-offs." · Status: "Open source · App coming" · Repo link: `https://github.com/pmarreck/BLIP`
4. "Get in touch →" CTA.
5. Contact section + footer.

## Contact + Phone Obfuscation

**Email:** plain `mailto:peter@marreck.com?subject=Came%20from%20your%20homepage`. Obfuscation not needed — the mailto is the whole point, and the email is already public elsewhere.

**Phone:** inline SVG, rendered visually as `<phone-elided>`. Implementation:

- Single `<svg>` element with explicit `width`/`height` and a `viewBox`.
- One `<text>` element containing ten `<tspan>` elements, one per digit.
- DOM order is scrambled (e.g., `6902)3-50754(09` plus the structural characters); visual order is set by each tspan's explicit `x` attribute.
- Digits and structural characters (`(`, `)`, `-`, spaces) are all rendered as `<tspan>` in the same SVG so the visual string is correct.
- No `tel:` link in the source HTML. On click (or keyboard activation), JS assembles `tel:<phone-elided>` at runtime and `location.href = ...`. This keeps the digits out of the static HTML while giving mobile users a working tap-to-call.
- Cursor style `pointer` and `role="link"` / `tabindex="0"` for basic keyboard access; no aria-label with the number (that would defeat the obfuscation).

Accepted trade-offs: not selectable, not copyable, not screen-reader-accessible. Email is still the default contact channel, which is screen-reader-fine.

## JS Features

Three features, all in `assets/js/site.js`. Load with `<script defer src="/assets/js/site.js"></script>`.

### 1. Format ticker (home only)

Ported from `../validate/docs/index.html` (lines ~411–598 in that file at time of writing) and restyled for dark theme. Copy the format list verbatim (`formats` array with ~100 entries, each `{ext, cat}`). 500ms cycle. Fixed-width scroller box (`8.5ch`) with a translating inner track, category badge swaps in sync.

Styling differences from validate's version:
- Dark theme: `rgba(255,255,255,0.06)` box background, `rgba(255,255,255,0.12)` border, no backdrop-filter blur (unnecessary on dark bg).
- Category badge uses `--accent-dim` text on a 1px `--border-strong` outline.

The ticker's purpose is signature/brand reinforcement, not a "stat" — no "240+" counter, no tooltip. Keep it small.

### 2. Scroll fade-ins

- All `.card`, `.section`, and hero child elements get class `.reveal`.
- IntersectionObserver (threshold `0.15`, `rootMargin: "0px 0px -10% 0px"`) toggles `.in-view`.
- CSS animates `opacity 0→1` and `translateY(12px → 0)` over 400ms `cubic-bezier(0.22, 1, 0.36, 1)`.
- `prefers-reduced-motion: reduce` disables the transform and shortens duration to 0.

### 3. Cursor-proximity edge light

Applied to all `.card` elements.

- CSS: `.card::before` fills the card's border region only, via `mask-composite: exclude` with a `content-box` and `border-box` mask pair. The pseudo-element's background is `radial-gradient(420px circle at var(--mx) var(--my), rgba(122,164,214,calc(var(--glow) * 0.55)), transparent 45%)`. Default `--glow: 0`.
- JS: single `mousemove` listener on `document`, rAF-throttled. For each `.card` in `document.querySelectorAll('.card')`, compute pointer position in card-local coordinates and a distance-to-center falloff factor (`1 - dist/maxRadius`, clamped). Write `--mx`, `--my`, `--glow` as inline styles.
- Skipped entirely if `window.matchMedia('(pointer: coarse)').matches` is true — no point on touch devices, and avoids a wasted listener.
- Skipped entirely if `prefers-reduced-motion: reduce`.

## Deployment

### GitHub Pages

1. From repo root: `git init -b yolo && git add -A && git commit -m "initial site"`.
2. `gh repo create pmarreck/mecha-llc-website --public --source=. --push --remote=origin`.
3. In GitHub web UI: Settings → Pages → Build and deployment → Source = "Deploy from a branch" → Branch = `yolo` / `(root)`. Save.
4. Settings → Pages → Custom domain → enter `mecha.llc` → Save. GitHub will also write a `CNAME` file, but we commit one ourselves in advance so the first deploy carries it.
5. Wait for cert provisioning (usually 10–20 min), then tick "Enforce HTTPS."

Note: main branch is `yolo` per project convention, not `main`. Adjust the Pages source branch to match.

### Dynadot DNS for `mecha.llc`

Add these records in Dynadot's DNS manager:

| Type  | Host | Value                |
|-------|------|----------------------|
| A     | @    | 185.199.108.153      |
| A     | @    | 185.199.109.153      |
| A     | @    | 185.199.110.153      |
| A     | @    | 185.199.111.153      |
| CNAME | www  | pmarreck.github.io.  |

Optional IPv6 AAAA records for apex (`@`): `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

DNS propagation: usually minutes, occasionally up to an hour.

## Local Preview

`./server.lua` (LuaJIT, already present). Default port 8080. Override with `PORT=8000 ./server.lua`. The server handles directory-index resolution, so visiting `http://127.0.0.1:8080/consulting/` correctly serves `consulting/index.html`.

No file watcher / live reload — hand-refresh the browser. For three-page iteration, that's fine.

## Verification

After implementation, before declaring done:

1. `./server.lua` then visit `/`, `/consulting/`, `/software/` in a browser. All pages render without console errors.
2. All three app icons load. Favicon appears in the tab.
3. Format ticker cycles on home. Scroll fade-ins fire on all three pages. Cursor-proximity edge light visible on cards (desktop only).
4. `curl http://127.0.0.1:8080/` and pipe to `grep -E '<phone-elided>|<area-elided>|<phone-elided>|<phone-elided>'` — must return nothing. Phone digits are not contiguous in the source.
5. Clicking the obfuscated phone number invokes `tel:<phone-elided>` (test on mobile or via browser devtools).
6. All mailto links open with the correct subject.
7. `prefers-reduced-motion: reduce` disables transform animations.
8. After deploy: `https://mecha.llc/`, `/consulting/`, `/software/` all serve with valid HTTPS.

## Design Principles Applied

- **Small, well-bounded units:** each page is independent; shared visuals live in one CSS file, shared JS in one file. Each JS feature is a separate module-style IIFE in `site.js`, independently toggleable.
- **No speculative abstraction:** three pages, three HTML files. No partials, no template engine. Nav/footer are hand-duplicated because it is cheaper than the alternative at this size.
- **Boundary-only validation:** phone obfuscation is the only defensive measure; it guards a public surface. Internally, all pages are hand-authored and trust their own content.

## Open Questions (none blocking)

None. Implementation can begin.
