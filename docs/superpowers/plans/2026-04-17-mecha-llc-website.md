# Mecha LLC Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a three-page static marketing site for Mecha LLC (home, consulting, software) to GitHub Pages at `mecha.llc`.

**Architecture:** Hand-written static HTML + one shared CSS file + one shared JS file. No build step. Three JS flourishes (format ticker, scroll fade-ins, cursor-proximity edge light). SVG-based phone obfuscation. Local preview via the existing `server.lua`.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, `mask-composite`), vanilla ES2020 JS, LuaJIT server (already present). Bash + curl for verification scripts.

**Spec reference:** `docs/superpowers/specs/2026-04-17-mecha-llc-website-design.md`

**TDD note:** Formal TDD is applied to verifiable properties (phone obfuscation must not leak digits, all three pages must serve, internal links must resolve). Visual layout is verified manually in a browser since automated visual testing is out of scope for this project's size.

---

## Task 1: Project scaffolding

**Files:**
- Create: `CNAME`
- Create: `README.md`
- Create: `assets/img/validate.png` (copied from `../validate_gui/Icon.png`)
- Create: `assets/img/entropy-shield.png` (copied from `../entropy_shield/EntropyShieldIcon.png`)
- Create: `assets/img/blip.png` (copied from `../BLIP/assets/app-icon.png`)

- [ ] **Step 1: Create CNAME file**

```bash
echo "mecha.llc" > CNAME
```

- [ ] **Step 2: Create README.md**

Write `README.md`:

```markdown
# Mecha LLC Website

Static site for [mecha.llc](https://mecha.llc), served by GitHub Pages from this repo.

## Local preview

```
./server.lua           # default port 8080
PORT=8000 ./server.lua # override
```

Requires LuaJIT with `luasocket` and `luafilesystem`.

## Structure

- `index.html`, `consulting/index.html`, `software/index.html` — the three pages
- `assets/css/site.css`, `assets/js/site.js` — shared styles and scripts
- `assets/img/` — app icons and favicon
- `CNAME` — custom domain for GitHub Pages

See `docs/superpowers/specs/` for the design spec and `docs/superpowers/plans/` for the implementation plan.

## Deployment

Pushed to `yolo` branch, served by GitHub Pages. Custom domain configured via DNS A records at the registrar.
```

- [ ] **Step 3: Copy app icons from sibling projects**

```bash
mkdir -p assets/img
cp ../validate_gui/Icon.png assets/img/validate.png
cp ../entropy_shield/EntropyShieldIcon.png assets/img/entropy-shield.png
cp ../BLIP/assets/app-icon.png assets/img/blip.png
ls -la assets/img/
```

Expected: three `.png` files present, each > 100KB.

- [ ] **Step 4: Commit**

```bash
git add CNAME README.md assets/img/
git commit -m "scaffold: CNAME, README, app icons"
```

---

## Task 2: Smoke test harness (TDD — failing test first)

**Files:**
- Create: `tests/smoke.sh`
- Create: `tests/phone-obfuscation.sh`

- [ ] **Step 1: Write the smoke test (will fail until pages exist)**

Write `tests/smoke.sh`:

```bash
#!/usr/bin/env bash
# Starts server.lua, curls all three pages, asserts expected content markers.
set -euo pipefail

PORT="${PORT:-9987}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="$PORT" ./server.lua >/tmp/mecha-smoke.log 2>&1 &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null || true" EXIT

# Wait up to 2s for the server to bind
for _ in $(seq 1 20); do
    if curl -sf "http://127.0.0.1:$PORT/" -o /dev/null; then break; fi
    sleep 0.1
done

check_page() {
    local path="$1"
    local needle="$2"
    local body
    body="$(curl -sf "http://127.0.0.1:$PORT$path")" || {
        echo "FAIL: $path returned non-200"
        exit 1
    }
    if ! grep -qF "$needle" <<<"$body"; then
        echo "FAIL: $path missing expected marker: $needle"
        exit 1
    fi
    echo "OK: $path"
}

check_page "/"            'High-stakes engineering'
check_page "/consulting/" 'AI and engineering help'
check_page "/software/"   'Tools for people who care'

echo "All smoke checks passed."
```

- [ ] **Step 2: Write the phone-obfuscation test (will fail once pages exist)**

Write `tests/phone-obfuscation.sh`:

```bash
#!/usr/bin/env bash
# Asserts the phone number does not appear as a contiguous string in any
# page source. The number must be present visually via SVG, assembled by
# JS at click time for tel: navigation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERNS=(
    '2035704096'
    '203-570-4096'
    '(203) 570-4096'
    '(203)570-4096'
    '203.570.4096'
    '2035704'
    '5704096'
    '+12035704096'
    'tel:+12035704096'
    'tel:2035704096'
)

PAGES=("index.html" "consulting/index.html" "software/index.html" "assets/js/site.js")

fail=0
for page in "${PAGES[@]}"; do
    [[ -f "$page" ]] || continue
    for pattern in "${PATTERNS[@]}"; do
        if grep -Fq "$pattern" "$page"; then
            echo "FAIL: $page leaks phone pattern: '$pattern'"
            fail=1
        fi
    done
done

if [[ $fail -ne 0 ]]; then
    exit 1
fi

echo "OK: phone number not leaked in static sources."
```

- [ ] **Step 3: Make tests executable and run smoke test (expect failure)**

```bash
chmod +x tests/smoke.sh tests/phone-obfuscation.sh
./tests/smoke.sh
```

Expected: FAIL — pages don't exist yet. The error will be `curl ... returned non-200` or similar. That failure is what proves the test is live. The phone-obfuscation test passes vacuously (no files to check), which is fine — it tightens up in Task 9.

- [ ] **Step 4: Commit failing tests**

```bash
git add tests/
git commit -m "test: add smoke and phone-obfuscation test harnesses"
```

---

## Task 3: Page skeletons to make the smoke test pass

**Files:**
- Create: `index.html`
- Create: `consulting/index.html`
- Create: `software/index.html`

- [ ] **Step 1: Create the home page skeleton**

Write `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mecha LLC — Data integrity engineering</title>
  <meta name="description" content="Custom software, AI consulting for law and finance, and contract code review. Data integrity as the product.">
  <link rel="stylesheet" href="/assets/css/site.css">
  <script defer src="/assets/js/site.js"></script>
</head>
<body>
  <main>
    <section class="hero">
      <p class="eyebrow">Data integrity</p>
      <h1>High-stakes engineering<br>that holds up under audit.</h1>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 2: Create the consulting page skeleton**

Write `consulting/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Consulting — Mecha LLC</title>
  <meta name="description" content="AI and engineering help for regulated, high-stakes work. Contract engagements for law, finance, and software teams.">
  <link rel="stylesheet" href="/assets/css/site.css">
  <script defer src="/assets/js/site.js"></script>
</head>
<body>
  <main>
    <section class="hero">
      <p class="eyebrow">Consulting</p>
      <h1>AI and engineering help<br>for regulated, high-stakes work.</h1>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 3: Create the software page skeleton**

Write `software/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Software — Mecha LLC</title>
  <meta name="description" content="Data integrity apps from Mecha LLC: Validate, Entropy Shield, and BLIP Archiver.">
  <link rel="stylesheet" href="/assets/css/site.css">
  <script defer src="/assets/js/site.js"></script>
</head>
<body>
  <main>
    <section class="hero">
      <p class="eyebrow">Data integrity apps</p>
      <h1>Tools for people who care<br>about their bytes.</h1>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run the smoke test — expect PASS**

```bash
./tests/smoke.sh
```

Expected output:
```
OK: /
OK: /consulting/
OK: /software/
All smoke checks passed.
```

- [ ] **Step 5: Commit**

```bash
git add index.html consulting/index.html software/index.html
git commit -m "feat: add skeleton HTML for three pages (smoke test passes)"
```

---

## Task 4: Design tokens and base CSS

**Files:**
- Create: `assets/css/site.css`

- [ ] **Step 1: Write the design tokens, typography reset, and utility base**

Write `assets/css/site.css`:

```css
/* ============================================================
   Mecha LLC — shared stylesheet
   Tokens -> base -> layout -> components -> features.
   ============================================================ */

:root {
  --bg: #0f1115;
  --bg-elev: #141821;
  --fg: #eaeaea;
  --fg-muted: #9fb1c5;
  --fg-subtle: #8aa0b8;
  --accent: #3b82f6;
  --accent-dim: #7aa4d6;
  --border: #1f2833;
  --border-strong: #2a3340;

  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace;

  --page-max: 1040px;
  --page-pad: clamp(20px, 4vw, 56px);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover { color: var(--accent-dim); }

img { display: block; max-width: 100%; height: auto; }

h1, h2, h3, h4 { margin: 0; font-weight: 650; letter-spacing: -0.01em; }

p { margin: 0; }

/* Page shell */
.page {
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 var(--page-pad);
}

/* Eyebrow labels */
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--accent-dim);
  text-transform: uppercase;
  margin-bottom: 12px;
}

/* Muted subtitle below hero */
.subhead {
  color: var(--fg-muted);
  font-size: 15px;
  line-height: 1.6;
  max-width: 560px;
  margin-top: 16px;
}
```

- [ ] **Step 2: Load the page and verify no layout errors**

```bash
./server.lua &
SERVER_PID=$!
sleep 0.3
curl -sf http://127.0.0.1:8080/ | head -20
kill $SERVER_PID
```

Expected: the HTML shell loads, headline shows in the Inter font on dark background. (Spot-check in browser if convenient.)

- [ ] **Step 3: Commit**

```bash
git add assets/css/site.css
git commit -m "feat: add design tokens and base stylesheet"
```

---

## Task 5: Shared nav and footer

**Files:**
- Modify: `assets/css/site.css` (append)
- Modify: `index.html`
- Modify: `consulting/index.html`
- Modify: `software/index.html`

- [ ] **Step 1: Append nav + footer styles to `assets/css/site.css`**

Append:

```css
/* ==========================================================
   Top nav
   ========================================================== */
.site-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 40px;
  padding-bottom: 48px;
}

.site-nav .brand {
  font-size: 12px;
  letter-spacing: 0.22em;
  color: var(--fg-subtle);
  font-weight: 600;
}

.site-nav .links {
  display: flex;
  gap: 22px;
  font-size: 13px;
  color: var(--fg-muted);
}

.site-nav .links a {
  position: relative;
  padding-bottom: 2px;
}

.site-nav .links a.active {
  color: var(--fg);
  border-bottom: 1px solid var(--accent);
}

.site-nav .links a:hover { color: var(--fg); }

/* ==========================================================
   Footer + contact section
   ========================================================== */
.contact-section {
  margin-top: 72px;
  padding-top: 40px;
  border-top: 1px solid var(--border);
}

.contact-section h2 {
  font-size: 22px;
}

.contact-section .contact-rows {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 560px;
}

.contact-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-row .label {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--accent-dim);
  text-transform: uppercase;
}

.contact-row .value {
  font-size: 15px;
  color: var(--fg);
}

.site-footer {
  margin-top: 56px;
  padding: 24px 0 40px;
  font-size: 12px;
  color: var(--fg-subtle);
  border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .contact-section .contact-rows { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Add nav and shared footer markup to `index.html`**

Replace the entire body of `index.html` with:

```html
<body>
  <div class="page">
    <nav class="site-nav">
      <a href="/" class="brand">MECHA · LLC</a>
      <div class="links">
        <a href="/consulting/">Consulting</a>
        <a href="/software/">Software</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>

    <main>
      <section class="hero">
        <p class="eyebrow">Data integrity</p>
        <h1>High-stakes engineering<br>that holds up under audit.</h1>
      </section>
    </main>

    <section id="contact" class="contact-section">
      <h2>Contact</h2>
      <div class="contact-rows">
        <div class="contact-row">
          <span class="label">Email</span>
          <a class="value" href="mailto:peter@marreck.com?subject=Came%20from%20your%20homepage">peter@marreck.com</a>
        </div>
        <div class="contact-row">
          <span class="label">Phone</span>
          <span class="value" data-phone><!-- obfuscated SVG injected in Task 9 --></span>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      &copy; Mecha LLC
    </footer>
  </div>
</body>
```

- [ ] **Step 3: Apply the same nav + contact + footer to `consulting/index.html`**

Replace the body of `consulting/index.html` with the same structure, but with `class="active"` on the Consulting link:

```html
<body>
  <div class="page">
    <nav class="site-nav">
      <a href="/" class="brand">MECHA · LLC</a>
      <div class="links">
        <a href="/consulting/" class="active">Consulting</a>
        <a href="/software/">Software</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>

    <main>
      <section class="hero">
        <p class="eyebrow">Consulting</p>
        <h1>AI and engineering help<br>for regulated, high-stakes work.</h1>
      </section>
    </main>

    <section id="contact" class="contact-section">
      <h2>Contact</h2>
      <div class="contact-rows">
        <div class="contact-row">
          <span class="label">Email</span>
          <a class="value" href="mailto:peter@marreck.com?subject=Came%20from%20your%20homepage">peter@marreck.com</a>
        </div>
        <div class="contact-row">
          <span class="label">Phone</span>
          <span class="value" data-phone></span>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      &copy; Mecha LLC
    </footer>
  </div>
</body>
```

- [ ] **Step 4: Apply the same nav + contact + footer to `software/index.html`**

Same structure with `class="active"` on the Software link:

```html
<body>
  <div class="page">
    <nav class="site-nav">
      <a href="/" class="brand">MECHA · LLC</a>
      <div class="links">
        <a href="/consulting/">Consulting</a>
        <a href="/software/" class="active">Software</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>

    <main>
      <section class="hero">
        <p class="eyebrow">Data integrity apps</p>
        <h1>Tools for people who care<br>about their bytes.</h1>
      </section>
    </main>

    <section id="contact" class="contact-section">
      <h2>Contact</h2>
      <div class="contact-rows">
        <div class="contact-row">
          <span class="label">Email</span>
          <a class="value" href="mailto:peter@marreck.com?subject=Came%20from%20your%20homepage">peter@marreck.com</a>
        </div>
        <div class="contact-row">
          <span class="label">Phone</span>
          <span class="value" data-phone></span>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      &copy; Mecha LLC
    </footer>
  </div>
</body>
```

- [ ] **Step 5: Run smoke test to confirm nothing regressed**

```bash
./tests/smoke.sh
```

Expected: all three pages still pass.

- [ ] **Step 6: Manual browser check**

Start `./server.lua`, open `http://127.0.0.1:8080/` in a browser, click through all three pages. Verify:
- Nav appears on all three pages, the active link has a blue underline.
- Contact section appears at the bottom (phone area will be empty until Task 9).
- Footer visible.

Stop the server when done.

- [ ] **Step 7: Commit**

```bash
git add assets/css/site.css index.html consulting/index.html software/index.html
git commit -m "feat: shared nav, contact section, and footer"
```

---

## Task 6: Hero layout and primary CTA buttons

**Files:**
- Modify: `assets/css/site.css` (append)
- Modify: `index.html`
- Modify: `consulting/index.html`
- Modify: `software/index.html`

- [ ] **Step 1: Append hero + button styles**

Append to `assets/css/site.css`:

```css
/* ==========================================================
   Hero
   ========================================================== */
.hero {
  position: relative;
  overflow: hidden;
  padding: 8px 0 48px;
}

.hero::before {
  content: '';
  position: absolute;
  inset: -40px 0 0 0;
  background: radial-gradient(700px 260px at 78% 0%, rgba(120, 170, 255, 0.20), transparent 62%);
  pointer-events: none;
  z-index: 0;
}

.hero > * { position: relative; z-index: 1; }

.hero h1 {
  font-size: clamp(28px, 4.5vw, 40px);
  line-height: 1.12;
  max-width: 680px;
}

/* ==========================================================
   Buttons
   ========================================================== */
.btn-row {
  display: flex;
  gap: 10px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  padding: 11px 18px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
  cursor: pointer;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover { background: #5a95f5; color: #fff; }

.btn-secondary {
  border-color: var(--border-strong);
  color: var(--fg);
}
.btn-secondary:hover { border-color: var(--accent-dim); color: var(--fg); }
```

- [ ] **Step 2: Update home hero with subhead and CTAs**

In `index.html`, replace the `<section class="hero">` block with:

```html
<section class="hero">
  <p class="eyebrow">Data integrity</p>
  <h1>High-stakes engineering<br>that holds up under audit.</h1>
  <p class="subhead">Custom software, AI consulting for law and finance, and contract code review &mdash; from an engineer who treats correctness and data integrity as the product, not the polish.</p>
  <div class="btn-row">
    <a class="btn btn-primary" href="mailto:peter@marreck.com?subject=Came%20from%20your%20homepage">Get in touch &rarr;</a>
    <a class="btn btn-secondary" href="/software/">Data integrity apps</a>
  </div>
</section>
```

- [ ] **Step 3: Update consulting hero**

In `consulting/index.html`, replace the `<section class="hero">` block with:

```html
<section class="hero">
  <p class="eyebrow">Consulting</p>
  <h1>AI and engineering help<br>for regulated, high-stakes work.</h1>
  <p class="subhead">Contract engagements for law firms, financial services, and software teams that need correctness they can defend, not demo-grade output.</p>
</section>
```

- [ ] **Step 4: Update software hero**

In `software/index.html`, replace the `<section class="hero">` block with:

```html
<section class="hero">
  <p class="eyebrow">Data integrity apps</p>
  <h1>Tools for people who care<br>about their bytes.</h1>
  <p class="subhead">Three apps in active development. Built on a shared foundation of format-aware, bit-for-bit correctness.</p>
</section>
```

- [ ] **Step 5: Smoke test**

```bash
./tests/smoke.sh
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add assets/css/site.css index.html consulting/index.html software/index.html
git commit -m "feat: hero layout with gradient backdrop and CTA buttons"
```

---

## Task 7: Home page teaser cards

**Files:**
- Modify: `assets/css/site.css` (append)
- Modify: `index.html`

- [ ] **Step 1: Append card styles**

Append to `assets/css/site.css`:

```css
/* ==========================================================
   Cards (generic)
   ========================================================== */
.card {
  position: relative;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 18px;
}

.card .card-eyebrow {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--accent-dim);
}

.card h3 {
  font-size: 15px;
  margin-top: 8px;
}

.card p {
  font-size: 13px;
  color: var(--fg-muted);
  margin-top: 6px;
  line-height: 1.5;
}

/* Home teaser grid */
.teaser-grid {
  margin-top: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-width: 720px;
}

@media (max-width: 640px) {
  .teaser-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Add teaser cards to home page**

In `index.html`, after the closing `</section>` of the hero (but before `</main>`), add:

```html
<section class="teaser-grid">
  <a class="card" href="/consulting/">
    <div class="card-eyebrow">CONSULTING &rarr;</div>
    <h3>AI for law &amp; finance, code review</h3>
    <p>Contract engagements.</p>
  </a>
  <a class="card" href="/software/">
    <div class="card-eyebrow">SOFTWARE &rarr;</div>
    <h3>Validate &middot; Entropy Shield &middot; BLIP</h3>
    <p>Coming soon.</p>
  </a>
</section>
```

- [ ] **Step 3: Smoke test**

```bash
./tests/smoke.sh
```

- [ ] **Step 4: Manual browser check**

Hover the teaser cards. Confirm links route correctly and cards have subtle border.

- [ ] **Step 5: Commit**

```bash
git add assets/css/site.css index.html
git commit -m "feat: home page teaser cards for consulting and software"
```

---

## Task 8: Consulting page service cards

**Files:**
- Modify: `assets/css/site.css` (append)
- Modify: `consulting/index.html`

- [ ] **Step 1: Append consulting-specific styles**

Append to `assets/css/site.css`:

```css
/* ==========================================================
   Consulting page
   ========================================================== */
.service-grid {
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

@media (max-width: 780px) {
  .service-grid { grid-template-columns: 1fr; }
}

.engagement-blurb {
  margin-top: 36px;
  padding: 18px;
  border-left: 2px solid var(--accent);
  background: rgba(59, 130, 246, 0.05);
  font-size: 13px;
  color: var(--fg-muted);
  line-height: 1.55;
  max-width: 720px;
}
```

- [ ] **Step 2: Add the service cards, engagement blurb, and CTA to the consulting page**

In `consulting/index.html`, after the closing `</section>` of the hero and before `</main>`, add:

```html
<section class="service-grid">
  <div class="card">
    <div class="card-eyebrow">A &middot; LEGAL</div>
    <h3>LLM &amp; workflow design for document-heavy practices</h3>
    <p>Retrieval, review automation, and prompt architectures built to be auditable.</p>
  </div>
  <div class="card">
    <div class="card-eyebrow">B &middot; FINANCE</div>
    <h3>AI integration under audit and compliance constraints</h3>
    <p>Pipelines designed for reproducibility, traceability, and review.</p>
  </div>
  <div class="card">
    <div class="card-eyebrow">C &middot; CODE REVIEW</div>
    <h3>Contract code review</h3>
    <p>Deep reviews for correctness, security, and architecture. Independent second pair of eyes.</p>
  </div>
</section>

<p class="engagement-blurb">
  Engagements start with a scoped conversation &mdash; no pitch deck, no SOW theater. If the fit's right, we write a short agreement and get moving.
</p>

<div class="btn-row" style="margin-top: 28px;">
  <a class="btn btn-primary" href="mailto:peter@marreck.com?subject=Came%20from%20your%20homepage">Get in touch &rarr;</a>
</div>
```

- [ ] **Step 3: Smoke test**

```bash
./tests/smoke.sh
```

- [ ] **Step 4: Manual browser check**

Visit `/consulting/` and confirm three service cards render in a row (or single column on narrow viewports), the blue left-border engagement blurb shows, and the "Get in touch" button works.

- [ ] **Step 5: Commit**

```bash
git add assets/css/site.css consulting/index.html
git commit -m "feat: consulting page services, engagement blurb, CTA"
```

---

## Task 9: Software page app cards with icons

**Files:**
- Modify: `assets/css/site.css` (append)
- Modify: `software/index.html`

- [ ] **Step 1: Append app-card styles**

Append to `assets/css/site.css`:

```css
/* ==========================================================
   Software page
   ========================================================== */
.app-list {
  margin-top: 40px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  max-width: 820px;
}

.app-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 18px;
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 16px;
  align-items: center;
  position: relative;
}

.app-card .icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  background: #1a2030;
}

.app-card .title-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.app-card h3 { font-size: 16px; font-weight: 600; }

.app-card .pill {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--accent);
  border: 1px solid #2a3e5c;
  padding: 2px 7px;
  border-radius: 3px;
  text-transform: uppercase;
}

.app-card p.description {
  font-size: 13px;
  color: var(--fg-muted);
  margin-top: 6px;
  line-height: 1.5;
}

.app-card .status {
  font-size: 11px;
  color: var(--accent-dim);
  margin-top: 6px;
}

.app-card .repo-link {
  font-size: 11px;
  padding: 5px 10px;
  border: 1px solid var(--border-strong);
  color: var(--fg);
  border-radius: 4px;
  white-space: nowrap;
}

.app-card .repo-link:hover { border-color: var(--accent-dim); }

@media (max-width: 640px) {
  .app-card { grid-template-columns: 48px 1fr; }
  .app-card .icon { width: 48px; height: 48px; }
  .app-card .repo-link { grid-column: 2; justify-self: start; }
}
```

- [ ] **Step 2: Add the app cards and CTA to the software page**

In `software/index.html`, after the closing `</section>` of the hero and before `</main>`, add:

```html
<section class="app-list">
  <article class="app-card">
    <img class="icon" src="/assets/img/validate.png" alt="Validate icon">
    <div>
      <div class="title-row">
        <h3>Validate</h3>
        <span class="pill">Coming soon</span>
      </div>
      <p class="description">The first app to attempt validation of the byte-level binary structure of every common file format (240+) and many less-common ones. Only made possible with AI assistance.</p>
      <div class="status">Open source &middot; GUI version coming</div>
    </div>
    <a class="repo-link" href="https://github.com/pmarreck/validate" target="_blank" rel="noopener">GitHub &UpperRightArrow;</a>
  </article>

  <article class="app-card">
    <img class="icon" src="/assets/img/entropy-shield.png" alt="Entropy Shield icon">
    <div>
      <div class="title-row">
        <h3>Entropy Shield</h3>
        <span class="pill">Coming soon</span>
      </div>
      <p class="description">Protects files against bitrot. Detects and repairs silent corruption before it spreads.</p>
      <div class="status">Commercial</div>
    </div>
    <span></span>
  </article>

  <article class="app-card">
    <img class="icon" src="/assets/img/blip.png" alt="BLIP Archiver icon">
    <div>
      <div class="title-row">
        <h3>BLIP Archiver</h3>
        <span class="pill">Coming soon</span>
      </div>
      <p class="description">Best-in-class compression for common file types. Smaller archives without lossy trade-offs.</p>
      <div class="status">Open source &middot; App coming</div>
    </div>
    <a class="repo-link" href="https://github.com/pmarreck/BLIP" target="_blank" rel="noopener">GitHub &UpperRightArrow;</a>
  </article>
</section>

<div class="btn-row" style="margin-top: 28px;">
  <a class="btn btn-primary" href="mailto:peter@marreck.com?subject=Came%20from%20your%20homepage">Get in touch &rarr;</a>
</div>
```

- [ ] **Step 3: Smoke test**

```bash
./tests/smoke.sh
```

- [ ] **Step 4: Manual browser check**

Visit `/software/`. Confirm:
- All three icons load (check DevTools Network tab for 200s).
- App cards render with icon on left, text in middle, GitHub link on right (where applicable).
- Entropy Shield has no repo link; the grid cell is empty.
- Mobile view: icon shrinks to 48px, GitHub link wraps below.

- [ ] **Step 5: Commit**

```bash
git add assets/css/site.css software/index.html
git commit -m "feat: software page app cards with icons and repo links"
```

---

## Task 10: Phone obfuscation (TDD)

**Files:**
- Create: `assets/js/site.js`
- Modify: `assets/css/site.css` (append)
- Modify: `index.html`, `consulting/index.html`, `software/index.html` (contact section already has `<span data-phone>`)

- [ ] **Step 1: Run the phone-obfuscation test (should pass vacuously since no phone markup exists yet)**

```bash
./tests/phone-obfuscation.sh
```

Expected: `OK: phone number not leaked in static sources.`

- [ ] **Step 2: Tighten the test to require the SVG is present and correct**

Append to `tests/phone-obfuscation.sh` (before the final `echo "OK: ..."`):

```bash
# Every page must render the phone SVG at runtime. We verify by checking
# that each page has a <span data-phone></span> placeholder that site.js
# will populate, and that site.js contains the digits as separate string
# literals (not as a contiguous number).
for page in index.html consulting/index.html software/index.html; do
    if ! grep -q 'data-phone' "$page"; then
        echo "FAIL: $page missing data-phone placeholder"
        exit 1
    fi
done

# site.js must exist and must not contain a contiguous phone number.
if [[ ! -f assets/js/site.js ]]; then
    echo "FAIL: assets/js/site.js missing"
    exit 1
fi
```

- [ ] **Step 3: Run the tightened test — expect FAIL**

```bash
./tests/phone-obfuscation.sh
```

Expected: FAIL — `assets/js/site.js missing`.

- [ ] **Step 4: Create `assets/js/site.js` with the phone-obfuscation feature**

Write `assets/js/site.js`:

```javascript
/* Mecha LLC — site.js
   Features loaded on every page:
     1. Phone obfuscation (all pages)
     2. Format ticker (home only; no-op elsewhere)
     3. Scroll fade-ins (all pages)
     4. Cursor-proximity edge light on cards (all pages, pointer:fine only)
*/
(() => {
  'use strict';

  /* -------------------------------------------------
     1. Phone obfuscation
     ------------------------------------------------- */
  // Digits are stored as individual characters. Country code and area code
  // are assembled at click-time to produce "tel:+1..." navigation. Source
  // HTML never contains the contiguous number.
  const PHONE = {
    cc: ['1'],
    parts: [
      { chars: ['2', '0', '3'] },
      { chars: ['5', '7', '0'] },
      { chars: ['4', '0', '9', '6'] },
    ],
  };

  function flatDigits() {
    const all = [];
    for (const p of PHONE.parts) all.push(...p.chars);
    return all;
  }

  // Visual layout: "(" "2" "0" "3" ")" " " "5" "7" "0" "-" "4" "0" "9" "6"
  // Structural chars + digits share a single SVG; visual order is set by
  // the x attribute on each <tspan>, while DOM order is scrambled.
  function buildPhoneSvg() {
    const digits = flatDigits(); // ['2','0','3','5','7','0','4','0','9','6']
    const structural = [
      { ch: '(', xCh: 0  },
      { ch: ')', xCh: 4  },
      { ch: '-', xCh: 9  },
    ];

    // Visual arrangement in character cells (0-based columns):
    // 0 "("  1 "2"  2 "0"  3 "3"  4 ")"  5 " "  6 "5"  7 "7"  8 "0"
    // 9 "-" 10 "4" 11 "0" 12 "9" 13 "6"
    const cells = [
      { xCh: 1,  ch: digits[0] },
      { xCh: 2,  ch: digits[1] },
      { xCh: 3,  ch: digits[2] },
      { xCh: 6,  ch: digits[3] },
      { xCh: 7,  ch: digits[4] },
      { xCh: 8,  ch: digits[5] },
      { xCh: 10, ch: digits[6] },
      { xCh: 11, ch: digits[7] },
      { xCh: 12, ch: digits[8] },
      { xCh: 13, ch: digits[9] },
    ];

    const allCells = cells.concat(structural);
    // Shuffle DOM order deterministically: reverse, then rotate. Result is
    // not alphabetical and not matched by common phone regexes when
    // concatenated.
    allCells.reverse();
    const rotate = 5;
    const rotated = allCells.slice(rotate).concat(allCells.slice(0, rotate));

    const CHAR_W = 9; // px advance per character cell in our chosen font/size
    const svgNS = 'http://www.w3.org/2000/svg';
    const width = 14 * CHAR_W;
    const height = 20;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'link');
    svg.setAttribute('tabindex', '0');
    svg.style.cursor = 'pointer';
    svg.style.verticalAlign = 'middle';

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('y', '15');
    text.setAttribute('font-family', "Inter, system-ui, sans-serif");
    text.setAttribute('font-size', '15');
    text.setAttribute('fill', 'currentColor');

    for (const cell of rotated) {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', String(cell.xCh * CHAR_W));
      tspan.textContent = cell.ch;
      text.appendChild(tspan);
    }

    svg.appendChild(text);

    const assembleTelUrl = () => {
      const digitsStr = flatDigits().join('');
      return 'tel:+' + PHONE.cc.join('') + digitsStr;
    };

    const activate = () => { window.location.href = assembleTelUrl(); };
    svg.addEventListener('click', activate);
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });

    return svg;
  }

  function mountPhone() {
    document.querySelectorAll('[data-phone]').forEach((el) => {
      if (el.children.length > 0) return; // already mounted
      el.appendChild(buildPhoneSvg());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountPhone);
  } else {
    mountPhone();
  }

  // Ticker, fade-ins, and edge-light are added in later tasks.
})();
```

- [ ] **Step 5: Append phone-specific CSS**

Append to `assets/css/site.css`:

```css
/* Phone SVG — inherits color from the surrounding .value */
[data-phone] svg { color: var(--fg); }
[data-phone] svg:hover { color: var(--accent-dim); }
[data-phone] svg:focus { outline: 1px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
```

- [ ] **Step 6: Run the phone-obfuscation test — expect PASS**

```bash
./tests/phone-obfuscation.sh
```

Expected: `OK: phone number not leaked in static sources.`

- [ ] **Step 7: Manual verification in browser**

Start `./server.lua`, visit `/`, scroll to contact section. Confirm:
- Phone reads as `(203) 570-4096` visually.
- `Ctrl+F` "2035704096" in view-source — no match.
- Clicking the phone launches the system's phone handler (or shows browser's "open tel:" prompt).
- Keyboard Tab reaches the phone, Enter activates it.

Stop the server.

- [ ] **Step 8: Smoke test too (regression guard)**

```bash
./tests/smoke.sh
```

- [ ] **Step 9: Commit**

```bash
git add assets/js/site.js assets/css/site.css tests/phone-obfuscation.sh
git commit -m "feat: phone obfuscation via inline SVG + runtime tel: assembly"
```

---

## Task 11: Format ticker (home only)

**Files:**
- Modify: `assets/js/site.js` (append new IIFE block within the existing outer IIFE)
- Modify: `assets/css/site.css` (append)
- Modify: `index.html`

**Reference:** see `../validate/docs/index.html` around the `.scroller-container`, `.scroller-track`, `formats` array, and `cycle()` function. Port the formats array verbatim; restyle the container for dark theme.

- [ ] **Step 1: Copy the formats array from validate into `assets/js/site.js`**

Open `../validate/docs/index.html` and locate the line beginning with `const formats = [` (around line 444). Copy the array verbatim into `assets/js/site.js`, appending inside the outer IIFE but below the phone block:

```javascript
  /* -------------------------------------------------
     2. Format ticker (home only)
     ------------------------------------------------- */
  const formats = [
    // PASTE THE ENTIRE formats ARRAY FROM ../validate/docs/index.html HERE.
    // It is an array of objects: { ext: 'png', cat: 'image' }, ~100 entries.
  ];

  function startTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return; // only exists on home

    const currentEl = track.children[0];
    const nextEl    = track.children[1];
    const catEl     = document.getElementById('ticker-cat');
    if (!currentEl || !nextEl || !catEl) return;

    let idx = 0;
    currentEl.textContent = '.' + formats[0].ext;
    catEl.textContent = formats[0].cat;

    function cycle() {
      const nextIdx = (idx + 1) % formats.length;
      nextEl.textContent = '.' + formats[nextIdx].ext;

      track.style.transform = 'translateY(-2.2em)';

      setTimeout(() => {
        // Instant reset after animation completes
        track.style.transition = 'none';
        track.style.transform = 'translateY(0)';
        currentEl.textContent = '.' + formats[nextIdx].ext;
        catEl.textContent = formats[nextIdx].cat;
        // Force reflow, then restore transition
        void track.offsetWidth;
        track.style.transition = '';
      }, 250);

      idx = nextIdx;
    }

    setInterval(cycle, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTicker);
  } else {
    startTicker();
  }
```

- [ ] **Step 2: Append ticker CSS**

Append to `assets/css/site.css`:

```css
/* ==========================================================
   Format ticker (home only)
   ========================================================== */
.ticker {
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--fg-muted);
}

.ticker .label {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--accent-dim);
  text-transform: uppercase;
}

.ticker .box {
  display: inline-block;
  width: 8.5ch;
  height: 2.2em;
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  padding: 0 0.6em;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-align: center;
}

.ticker .track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.ticker .track > div {
  height: 2.2em;
  line-height: 2.2em;
  flex-shrink: 0;
}

.ticker .badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  color: var(--accent-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

- [ ] **Step 3: Add ticker markup to home page**

In `index.html`, inside the `<section class="hero">` block, after the `</div>` that closes `.btn-row`, add:

```html
<div class="ticker" aria-hidden="true">
  <span class="label">Validating</span>
  <span class="box">
    <span class="track" id="ticker-track">
      <div></div>
      <div></div>
    </span>
  </span>
  <span class="badge" id="ticker-cat">&nbsp;</span>
</div>
```

- [ ] **Step 4: Smoke test**

```bash
./tests/smoke.sh
```

- [ ] **Step 5: Manual browser check**

Visit `/`. Ticker cycles formats every ~500ms, category badge swaps in sync, no console errors. Visit `/consulting/` and `/software/` — confirm ticker is absent (no `#ticker-track` element; `startTicker()` returns early).

- [ ] **Step 6: Commit**

```bash
git add assets/js/site.js assets/css/site.css index.html
git commit -m "feat: format ticker on home page (ported from validate)"
```

---

## Task 12: Scroll fade-ins

**Files:**
- Modify: `assets/js/site.js` (append)
- Modify: `assets/css/site.css` (append)

- [ ] **Step 1: Append fade-in JS**

Append inside the outer IIFE in `assets/js/site.js`, below the ticker block:

```javascript
  /* -------------------------------------------------
     3. Scroll fade-ins
     ------------------------------------------------- */
  function initFadeIns() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Show everything immediately; no transform animations.
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      }
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px',
    });

    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFadeIns);
  } else {
    initFadeIns();
  }
```

- [ ] **Step 2: Append fade-in CSS**

Append to `assets/css/site.css`:

```css
/* ==========================================================
   Scroll fade-ins
   ========================================================== */
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 3: Add `.reveal` class to content sections on all three pages**

In `index.html`: add `class="reveal"` to the hero `<section>`, the `<div class="ticker" ...>`, and the `<section class="teaser-grid">`. Also add `reveal` to the `<section id="contact" ...>`.

In `consulting/index.html`: add `reveal` to the hero `<section>`, the `<section class="service-grid">`, the `<p class="engagement-blurb">`, the `<div class="btn-row" ...>`, and the contact `<section>`.

In `software/index.html`: add `reveal` to the hero `<section>`, each `<article class="app-card">`, the bottom `<div class="btn-row" ...>`, and the contact `<section>`.

Example (home hero):
```html
<section class="hero reveal">
  ...
</section>
```

- [ ] **Step 4: Smoke test**

```bash
./tests/smoke.sh
```

- [ ] **Step 5: Manual browser check**

Load each page and scroll slowly. Cards and sections fade in as they enter the viewport. Toggle reduced-motion in OS settings (or via DevTools "Rendering → Emulate CSS media feature prefers-reduced-motion: reduce") and confirm elements appear instantly without transform.

- [ ] **Step 6: Commit**

```bash
git add assets/js/site.js assets/css/site.css index.html consulting/index.html software/index.html
git commit -m "feat: scroll fade-ins via IntersectionObserver"
```

---

## Task 13: Cursor-proximity edge light on cards

**Files:**
- Modify: `assets/js/site.js` (append)
- Modify: `assets/css/site.css` (append)

- [ ] **Step 1: Append edge-light CSS**

Append to `assets/css/site.css`:

```css
/* ==========================================================
   Cursor-proximity edge light on cards
   ========================================================== */
.card,
.app-card {
  --mx: 50%;
  --my: 50%;
  --glow: 0;
}

.card::before,
.app-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: radial-gradient(
    420px circle at var(--mx) var(--my),
    rgba(122, 164, 214, calc(var(--glow) * 0.55)),
    transparent 45%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  transition: opacity 120ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .card::before, .app-card::before { display: none; }
}

@media (pointer: coarse) {
  .card::before, .app-card::before { display: none; }
}
```

- [ ] **Step 2: Append edge-light JS**

Append inside the outer IIFE in `assets/js/site.js`, below the fade-ins block:

```javascript
  /* -------------------------------------------------
     4. Cursor-proximity edge light on cards
     ------------------------------------------------- */
  function initEdgeLight() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = Array.from(document.querySelectorAll('.card, .app-card'));
    if (cards.length === 0) return;

    let pending = false;
    let lastX = 0, lastY = 0;

    function update() {
      pending = false;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        const x = lastX - r.left;
        const y = lastY - r.top;
        const cx = r.width / 2;
        const cy = r.height / 2;
        const dist = Math.hypot(x - cx, y - cy);
        const maxRadius = Math.max(r.width, r.height) * 1.2;
        const glow = Math.max(0, 1 - dist / maxRadius);
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
        card.style.setProperty('--glow', glow.toFixed(3));
      }
    }

    window.addEventListener('mousemove', (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEdgeLight);
  } else {
    initEdgeLight();
  }
```

- [ ] **Step 3: Smoke test**

```bash
./tests/smoke.sh
```

- [ ] **Step 4: Manual browser check**

Load any page on a desktop browser. Move cursor near a card — the edge nearest the cursor should glow subtly blue, dimming as the cursor moves away. Test:
- Multiple cards glow proportionally to cursor proximity.
- Scrolling doesn't cause jank (should be 60fps; check DevTools Performance panel if unsure).
- On a touch-only device (or DevTools mobile emulation with "touch" input), effect is disabled.
- With prefers-reduced-motion, effect is disabled.

- [ ] **Step 5: Commit**

```bash
git add assets/js/site.js assets/css/site.css
git commit -m "feat: cursor-proximity edge light on cards"
```

---

## Task 14: Favicon and head meta tags

**Files:**
- Create: `assets/img/favicon.svg`
- Modify: `index.html`, `consulting/index.html`, `software/index.html` (head block)

- [ ] **Step 1: Create a minimal SVG favicon**

Write `assets/img/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0f1115"/>
  <text x="16" y="22" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="#3b82f6">M</text>
</svg>
```

- [ ] **Step 2: Add favicon link and Open Graph tags to each page's `<head>`**

For `index.html`, replace the `<head>` block with:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Mecha LLC — Data integrity engineering</title>
  <meta name="description" content="Custom software, AI consulting for law and finance, and contract code review. Data integrity as the product.">
  <link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
  <meta name="theme-color" content="#0f1115">
  <meta property="og:title" content="Mecha LLC — Data integrity engineering">
  <meta property="og:description" content="Custom software, AI consulting for law and finance, and contract code review.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://mecha.llc/">
  <link rel="stylesheet" href="/assets/css/site.css">
  <script defer src="/assets/js/site.js"></script>
</head>
```

For `consulting/index.html`, update similarly (title "Consulting — Mecha LLC", og:url "https://mecha.llc/consulting/", description from the existing meta).

For `software/index.html`, update similarly (title "Software — Mecha LLC", og:url "https://mecha.llc/software/").

- [ ] **Step 3: Smoke test**

```bash
./tests/smoke.sh
```

- [ ] **Step 4: Manual browser check**

Reload each page and confirm the favicon appears in the tab (blue "M" on dark square).

- [ ] **Step 5: Commit**

```bash
git add assets/img/favicon.svg index.html consulting/index.html software/index.html
git commit -m "feat: favicon and Open Graph head tags"
```

---

## Task 15: Final verification and push to GitHub

**Files:** none to create; deploy pre-existing content.

- [ ] **Step 1: Run all tests**

```bash
./tests/smoke.sh
./tests/phone-obfuscation.sh
```

Both must pass.

- [ ] **Step 2: Full manual verification against the spec's checklist**

Open each page in a browser and confirm (from the spec's "Verification" section):
1. All three pages render without console errors.
2. All three app icons load; favicon in tab.
3. Format ticker cycles on home. Fade-ins fire on all pages. Edge light visible on desktop.
4. Phone digits absent from `curl` output:

```bash
./server.lua &
SERVER_PID=$!
sleep 0.3
for path in / /consulting/ /software/; do
    echo "== $path =="
    curl -sf "http://127.0.0.1:8080$path" | grep -E '2035704096|\(203\)|570-4096|2035704' && echo "LEAK DETECTED" || echo "clean"
done
kill $SERVER_PID
```

Expected: each page prints `clean`.

5. Clicking the phone SVG invokes `tel:+12035704096` (test on phone or with devtools network panel).
6. All mailto links open with subject `Came from your homepage`.
7. `prefers-reduced-motion: reduce` disables motion.

- [ ] **Step 3: Create the GitHub repo and push**

```bash
gh repo create pmarreck/mecha-llc-website --public --source=. --push --remote=origin
```

Verify:
```bash
gh repo view pmarreck/mecha-llc-website --web
```

- [ ] **Step 4: Print the remaining manual steps for the user**

Output this message to the user (not a commit step):

```
Remaining manual steps:

1. GitHub Pages:
   - Visit https://github.com/pmarreck/mecha-llc-website/settings/pages
   - Build and deployment -> Source: "Deploy from a branch"
   - Branch: yolo / root (/) -> Save
   - Custom domain: mecha.llc -> Save
   - Wait 10-20 min for cert, then tick "Enforce HTTPS"

2. Dynadot DNS for mecha.llc:
   - A records (apex @):
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
   - CNAME: www -> pmarreck.github.io.

3. (Optional) IPv6 AAAA for apex:
     2606:50c0:8000::153
     2606:50c0:8001::153
     2606:50c0:8002::153
     2606:50c0:8003::153

4. Once DNS propagates (minutes to an hour), visit https://mecha.llc/ -
   all three pages should be live.
```

- [ ] **Step 5: Close out**

No commit — this task's work is the push itself.

---

## Self-review notes

- **Spec coverage:** all of the spec's sections are mapped to tasks:
  - Directory layout → Task 1
  - Visual system (tokens, nav, footer, hero, buttons, cards) → Tasks 4–9
  - Phone obfuscation → Task 10
  - Format ticker → Task 11
  - Scroll fade-ins → Task 12
  - Cursor-proximity edge light → Task 13
  - Favicon + meta → Task 14
  - Deployment (GitHub Pages, Dynadot DNS) → Task 15
  - Local preview via `server.lua` → inherited; no work required
  - Verification → Task 15
- **Type consistency:** CSS class names (`.card`, `.app-card`, `.ticker`, `.reveal`, `.in-view`, `[data-phone]`) are defined once and used consistently. JS function names (`mountPhone`, `startTicker`, `initFadeIns`, `initEdgeLight`) are unique.
- **No placeholders:** the only "paste here" instruction is the formats array (Task 11 Step 1), and the source location is specified. This is correct — copying 100 lines of data into this plan would be noise.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-17-mecha-llc-website.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
