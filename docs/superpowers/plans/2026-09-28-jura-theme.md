# Jura Look and Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the evidencija report look like `jura-guide-report` (fonts, palette, nav, page headers, chips, cards, tables, modal, dark mode) without changing any tab, feature, DOM structure or page behaviour.

**Architecture:** One new stylesheet, `jura-theme.css`, linked after `guides.css`, redefines the CSS tokens and restyles components by overriding selectors that already exist. `guides.css` and `../shared/fs-core.css` (shared with the monday and recap reports) are not edited. The only JS changes are the chart font name and reading chart colors from `body` (where the dark tokens live).

**Tech Stack:** Plain CSS (custom properties, `color-mix`), Google Fonts (IBM Plex Sans), esbuild bundle, Playwright smoke suite (`tests/smoke.spec.js`), vitest (`tests/**/*.test.js`).

**Spec:** `docs/superpowers/specs/2026-09-28-jura-theme-design.md` (approved 2026-09-28). Reference design: `../../jura-guide-report/report.css`.

Paths below are relative to `Projects/active/tin-monday-report/evidencija/` unless stated.

## Global Constraints

- Do not edit `guides.css`, `../shared/fs-core.css`, any `data-*.js`, or page JS other than the two chart changes in Task 5 (font name, and `getChartColors` reading `body`). No DOM or markup change except the three `<head>` edits in Task 1.
- `jura-theme.css` must be the LAST stylesheet `<link>` in `index.html`.
- Desktop-only rules go inside `@media (min-width: 769px)`. The report already has a mobile layout (`guides.css` at 768px and below, including a fixed bottom tab bar) that this work must not disturb.
- `--nav-h` must equal the real rendered nav height (Management's sticky sub-nav and KPI bar offset from it).
- No em dashes anywhere (CSS comments, docs, commit messages).
- Style: 2-space indent in CSS to match `guides.css`; test code uses 4-space indent, single quotes, semicolons, like `tests/smoke.spec.js`.
- No commit or push unless Antun asks. Commit steps are the exact commands to run once he approves.
- Karpathy guidelines: the simplest rule that passes the stated check, one selector at a time, no `!important` unless a test proves a selector cannot otherwise win (record a `Ruling:` if you use one).
- Before any Playwright run: `npm run build` (the suite loads `dist/app.js`).

### Plan corrections to the spec (decided while writing the plan)

1. **Dark-mode `--y25` is `#7b6df0`, not `#4a3aa7`.** Jura's indigo on `#121212` measures about 2:1, below the 3:1 needed for chart lines. `#7b6df0` measures about 4.7:1. Light mode keeps `#4a3aa7`.
2. **Active city chip text is `var(--text)`, not Jura's hue-colored text.** Jura's `--zagreb-text` on its own 16 percent tint measures about 4.0:1 in light mode, below 4.5:1. The chip keeps Jura's hue border and 16 percent tint.
3. **Table body cells are not tinted per city.** Jura does that with per-cell classes, which would need markup changes. City identity stays in the head cells and row labels.
4. **Desktop-only scoping** for nav, `--pad` and `--nav-h` (see constraints).

## Review Focus

Most likely first. Each has a pinning test in the task named in brackets.

1. **`--nav-h` no longer matches the real nav height**, so Management's sticky sub-nav and KPI bar overlap or leave a gap. [Task 1 test "nav height equals --nav-h"]
2. **The theme breaks the phone layout**: desktop nav rules leak below 769px and hide or move the fixed bottom tab bar, or `--pad` stops shrinking. [Task 2 test "phone layout keeps its bottom tab bar"]
3. **Text on tinted fills fails contrast** in light or dark (active city chips, city table heads). [Task 2 chip test, Task 4 head test]
4. **Chart lines vanish on the dark surface**: 2025 indigo is about 2:1 on `#121212`, and charts read colors from `<html>`, which never sees the dark tokens, so a chart built in dark mode gets the light 2026 near-black line on a near-black page. [Task 1 test "year line colors have 3:1 contrast", Task 5 test "charts built in dark mode read the dark year colors"]
5. **Print output changes**: nav reappears or dark tokens leak into print. [Task 6 test "print hides the nav"]

Also pinned: no `Montserrat` left in `src` and charts use the new font [Task 5]; charts read the new year colors [Task 5].

---

### Task 1: Foundation (file, fonts, tokens, nav height)

**Files:**
- Create: `jura-theme.css`
- Modify: `index.html` (`<head>`: font link, theme link, dark flash guard)
- Test: `tests/smoke.spec.js` (append)

**Interfaces:**
- Consumes: existing tokens from `fs-core.css` and `guides.css` (`--white`, `--smoke`, `--card-bg`, `--border`, `--border-dark`, `--text`, `--text2`, `--text3`, `--radius`, `--radius-sm`, `--nav-h`, `--pad`, `--max-w`, `--nav-bg`, `--font-*`, city and year tokens).
- Produces: the Jura token values that Tasks 2 to 5 rely on (`--zagreb-pill` etc. are the text-safe city hues; `--y25`, `--y26`).

- [ ] **Step 1: Write the failing tests**

Append to `tests/smoke.spec.js`:

```js
// ── Jura theme ────────────────────────────────────────────────────────────────

function parseCssColor(s) {
    let m = s.match(/^rgba?\(([^)]+)\)/);
    if (m) {
        const [r, g, b] = m[1].split(/[ ,/]+/).map(Number);
        return [r, g, b];
    }
    m = s.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
    if (m) return [m[1], m[2], m[3]].map(x => Math.round(parseFloat(x) * 255));
    throw new Error(`unparsed color: ${s}`);
}
function luminance([r, g, b]) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}
const cssVar = (page, name) => page.evaluate(n => getComputedStyle(document.body).getPropertyValue(n).trim(), name);
const setDark = (page, on) => page.evaluate(d => document.body.classList.toggle('dark-mode', d), on);
const styleOf = (page, sel, prop) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);

test.describe('Jura theme: foundation', () => {
    test('theme stylesheet loads after every other stylesheet', async ({ page }) => {
        await load(page);
        const hrefs = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href')));
        expect(hrefs[hrefs.length - 1]).toBe('jura-theme.css');
        expect(hrefs.some(h => h.includes('IBM+Plex+Sans'))).toBe(true);
    });

    test('light tokens: Plex font, Jura surface, text, radius and city hues', async ({ page }) => {
        await load(page);
        expect(await styleOf(page, 'body', 'fontFamily')).toContain('IBM Plex Sans');
        expect(await styleOf(page, 'body', 'backgroundColor')).toBe('rgb(255, 255, 255)');
        expect(await styleOf(page, 'body', 'color')).toBe('rgb(26, 26, 26)');
        expect(await cssVar(page, '--radius')).toBe('4px');
        expect([await cssVar(page, '--zagreb'), await cssVar(page, '--dubrovnik'), await cssVar(page, '--split'), await cssVar(page, '--zadar')])
            .toEqual(['#2a78d6', '#eb6834', '#1baf7a', '#eda100']);
        expect([await cssVar(page, '--y25'), await cssVar(page, '--y26')]).toEqual(['#4a3aa7', '#1a1a1a']);
    });

    test('dark tokens: Jura dark surface and text', async ({ page }) => {
        await load(page);
        await setDark(page, true);
        expect(await styleOf(page, 'body', 'backgroundColor')).toBe('rgb(18, 18, 18)');
        expect(await styleOf(page, 'body', 'color')).toBe('rgb(240, 240, 240)');
        expect(await styleOf(page, '.nav', 'backgroundColor')).toBe('rgb(18, 18, 18)');
        expect([await cssVar(page, '--y25'), await cssVar(page, '--y26')]).toEqual(['#7b6df0', '#f0f0f0']);
    });

    test('nav height equals --nav-h so sticky offsets line up', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        const navHeight = await page.locator('.nav').evaluate(el => el.getBoundingClientRect().height);
        expect(navHeight).toBe(parseFloat(await cssVar(page, '--nav-h')));
    });

    test('year line colors have 3:1 contrast against the page in both themes', async ({ page }) => {
        await load(page);
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const bg = parseCssColor(await styleOf(page, 'body', 'backgroundColor'));
            for (const v of ['--y25', '--y26']) {
                const hex = await cssVar(page, v);
                const rgbv = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
                expect(contrastRatio(rgbv, bg), `${v} on ${dark ? 'dark' : 'light'}`).toBeGreaterThanOrEqual(3);
            }
        }
    });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run build && npx playwright test -g "Jura theme: foundation"`
Expected: FAIL on all five (last stylesheet is `guides.css`; body font is Montserrat; nav is not 56px).

- [ ] **Step 3: Edit `index.html`**

In `<head>`, replace the two lines

```html
    <link rel="stylesheet" href="guides.css">
    <style>html.dark-mode body { background-color: #111111; color: #eeeeee; }</style>
```

with (font link and the theme link last, flash guard updated to the new dark surface):

```html
    <link rel="stylesheet" href="guides.css">
    <style>html.dark-mode body { background-color: #121212; color: #f0f0f0; }</style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="jura-theme.css">
```

Keep the existing `<script>` that adds `dark-mode` to `<html>` untouched.

- [ ] **Step 4: Create `jura-theme.css`**

```css
/* jura-theme.css: makes evidencija look like jura-guide-report.
   Loaded after guides.css. To switch the theme off, remove its <link> in index.html.
   Spec: docs/superpowers/specs/2026-09-28-jura-theme-design.md */

:root {
  --font-sans: 'IBM Plex Sans', -apple-system, 'Helvetica Neue', sans-serif;
  --font-serif: var(--font-sans);
  --font-mono: var(--font-sans);
  --radius: 4px;
  --radius-sm: 4px;

  --white: #ffffff;
  --smoke: #f5f5f5;
  --card-bg: #f5f5f5;
  --nav-bg: #ffffff;
  --border: #dddddd;
  --border-dark: #dddddd;
  --text: #1a1a1a;
  --text2: #4d4d4d;
  --text3: #767676;

  --zagreb: #2a78d6;
  --dubrovnik: #eb6834;
  --split: #1baf7a;
  --zadar: #eda100;
  /* text-safe city hues (white text on these clears 4.5:1) */
  --zagreb-pill: #2771ca;
  --dubrovnik-pill: #ce4914;
  --split-pill: #15875e;
  --zadar-pill: #916300;

  --y25: #4a3aa7;
  --y26: #1a1a1a;
}

body.dark-mode {
  --white: #121212;
  --smoke: #1e1e1e;
  --card-bg: #1e1e1e;
  --nav-bg: #121212;
  --border: #333333;
  --border-dark: #333333;
  --text: #f0f0f0;
  --text2: #c0c0c0;
  --text3: #a0a0a0;

  --zagreb-pill: #3780d8;
  --dubrovnik-pill: #eb6834;
  --split-pill: #1baf7a;
  --zadar-pill: #eda100;

  /* lifted from Jura's #4a3aa7, which is about 2:1 on #121212 */
  --y25: #7b6df0;
  --y26: #f0f0f0;
}

@media (min-width: 769px) {
  :root {
    --nav-h: 56px;
    --pad: 24px;
    --max-w: 1440px;
  }

  .nav {
    height: var(--nav-h);
    padding: 0 var(--pad);
  }
}

body {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `npm run build && npx playwright test -g "Jura theme: foundation" && npx vitest run && npx playwright test`
Expected: the 5 new tests pass and the whole suite stays green (49 vitest, 48 plus 5 Playwright).

- [ ] **Step 6: Look at it**

Open `index.html` and take a screenshot of the Comparison tab in light and dark. Expected: Plex font, white or `#121212` page, nav 56px tall. Everything else still looks like the old design. Put screenshots in the session scratchpad.

- [ ] **Step 7: Commit (when Antun approves)**

```bash
git add jura-theme.css index.html tests/smoke.spec.js
git commit -m "Jura theme: tokens, fonts, nav height"
```

---

### Task 2: Nav, page header, filter controls

**Files:**
- Modify: `jura-theme.css` (append)
- Test: `tests/smoke.spec.js` (append)

**Interfaces:**
- Consumes: Task 1 tokens. Existing selectors: `.nav-tabs .nav-tab`, `.mgmt-subnav .nav-tab`, `.print-btn`, `.theme-toggle-icon`, `.date-picker-ui`, `.date-picker-label`, `.filter-select`, `.header`, `.header-left h1`, `.header-badge`, `.main`, `.section-title`, `.city-filter-pill`, `.pill`, `button.city-pill`.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Write the failing tests**

Append inside a new `test.describe('Jura theme: chrome', ...)`:

```js
test.describe('Jura theme: chrome', () => {
    test('active main tab is underlined in the text color, no uppercase', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        expect(await styleOf(page, '#tab-cmp', 'textTransform')).toBe('none');
        expect(await styleOf(page, '#tab-cmp', 'borderBottomColor')).toBe(await styleOf(page, 'body', 'color'));
        expect(await styleOf(page, '#tab-cmp', 'fontFamily')).toContain('IBM Plex Sans');
    });

    test('Management sub-tabs use the same plain tab style', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        await page.click('#tab-mgmt');
        expect(await styleOf(page, '#tab-pl', 'textTransform')).toBe('none');
        expect(await styleOf(page, '#tab-pl', 'borderBottomColor')).toBe(await styleOf(page, 'body', 'color'));
    });

    test('print button is outlined and plain', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        expect(await styleOf(page, '.print-btn', 'textTransform')).toBe('none');
        expect(await styleOf(page, '.print-btn', 'backgroundColor')).toBe('rgba(0, 0, 0, 0)');
    });

    test('page header is a compact title row without the badge', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#page-gd .header h1');
        expect(await styleOf(page, '#page-gd .header h1', 'fontSize')).toBe('20px');
        expect(await styleOf(page, '#page-gd .header h1', 'fontFamily')).toContain('IBM Plex Sans');
        expect(await styleOf(page, '#page-gd .header-badge', 'display')).toBe('none');
    });

    test('filter chips and selects use 4px corners', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#page-gd .city-filter-pill');
        expect(await styleOf(page, '#page-gd .city-filter-pill', 'borderRadius')).toBe('4px');
        expect(await styleOf(page, '#page-gd .pill', 'borderRadius')).toBe('4px');
        expect(await styleOf(page, '#lang-filter-gd', 'borderRadius')).toBe('4px');
    });

    test('active city chip text has 4.5:1 contrast on its tint, light and dark', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.click('#page-gd .city-filter-pill[data-city="Zagreb"]');
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const sel = '#page-gd .city-filter-pill.active';
            const fg = parseCssColor(await styleOf(page, sel, 'color'));
            const bg = parseCssColor(await styleOf(page, sel, 'backgroundColor'));
            expect(contrastRatio(fg, bg), dark ? 'dark' : 'light').toBeGreaterThanOrEqual(4.5);
        }
    });

    test('phone layout keeps its bottom tab bar and 16px padding', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await load(page);
        expect(await styleOf(page, '.nav-tabs', 'position')).toBe('fixed');
        expect(await cssVar(page, '--pad')).toBe('16px');
    });
});
```

- [ ] **Step 2: Run to verify the failures**

Run: `npx playwright test -g "Jura theme: chrome"`
Expected: FAIL on the first six (old uppercase tabs, black print button, 50px serif h1, 20px pills; the select radius assertion already passes because `--radius-sm` is 4px, the pill assertions in the same test fail). The phone test is a regression guard: it should PASS now and after. If it fails now, stop and check the mobile block in `guides.css` (lines 612 to 738) before continuing.

- [ ] **Step 3: Append the CSS**

Append to `jura-theme.css`:

```css
/* ── NAV (desktop only: the phone layout is left as is) ── */
@media (min-width: 769px) {
  .nav-tabs { gap: 22px; margin-left: 12px; }
  .nav-tabs .nav-tab {
    padding: 6px 0 10px;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    color: var(--text3);
  }
  .nav-tabs .nav-tab:hover { color: var(--text); }
  .nav-tabs .nav-tab.active {
    color: var(--text);
    font-weight: 600;
    border-bottom-color: var(--text);
  }
}

.nav img { height: 28px; }
.nav-actions { gap: 8px; }
.theme-toggle-icon { border: 1px solid var(--border); border-radius: var(--radius); }
.print-btn {
  padding: 6px 12px;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}
.print-btn:hover,
body.dark-mode .print-btn:hover { background: var(--smoke); }
.date-picker-label { font-size: 12px; }
.date-picker-ui,
.filter-select {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 10px;
  border-radius: var(--radius);
  font-size: 13px;
}

/* Management sub-nav */
.mgmt-subnav { background: var(--white); border-bottom: 1px solid var(--border); }
.mgmt-subnav .nav-tab {
  padding: 10px 12px 8px;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--text3);
}
.mgmt-subnav .nav-tab:hover { color: var(--text); }
.mgmt-subnav .nav-tab.active,
.nav-tab.mgmt-tab-active {
  color: var(--text);
  font-weight: 600;
  border-bottom-color: var(--text);
}

/* ── PAGE HEADER: compact title row, badge hidden ── */
.header {
  padding: 20px var(--pad) 14px;
  align-items: baseline;
}
.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.2;
}
.header-left h1 .accent { color: var(--text3); font-weight: 400; }
.header-left p {
  font-size: 13px;
  letter-spacing: 0;
  text-transform: none;
  margin-top: 4px;
}
.header-right { font-size: 13px; }
.header-badge { display: none; }
.main { padding: 24px var(--pad); }
.section-title { letter-spacing: 0.04em; font-weight: 600; }
.section-title::after { display: none; }

/* ── FILTER CHIPS ── */
.city-filter-pill,
.pill {
  padding: 6px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}
.city-filter-pill:hover,
.pill:hover { border-color: var(--text3); color: var(--text); }
.city-filter-pill.active,
.pill.active {
  background: var(--text);
  border-color: var(--text);
  color: var(--white);
}
.city-filter-pill[data-city="Zagreb"] { --chip-hue: var(--zagreb); }
.city-filter-pill[data-city="Dubrovnik"] { --chip-hue: var(--dubrovnik); }
.city-filter-pill[data-city="Split"] { --chip-hue: var(--split); }
.city-filter-pill[data-city="Zadar"] { --chip-hue: var(--zadar); }
.city-filter-pill.active[data-city="Zagreb"],
.city-filter-pill.active[data-city="Dubrovnik"],
.city-filter-pill.active[data-city="Split"],
.city-filter-pill.active[data-city="Zadar"] {
  background: color-mix(in srgb, var(--chip-hue) 16%, var(--white));
  border-color: var(--chip-hue);
  color: var(--text);
}
button.city-pill { border-radius: var(--radius); font-family: var(--font-sans); }
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm run build && npx playwright test -g "Jura theme" && npx vitest run && npx playwright test`
Expected: all pass, including the phone guard.

- [ ] **Step 5: Look at it**

Screenshots of the nav and header on Tours 2025, Comparison, Guides and Management (all five sub-tabs are switched in Task 6), light and dark, at 1400 and 390 wide. Expected: plain underlined tabs, compact title, chips with 4px corners, no teal badge, phone bottom bar intact. Compare against `jura-guide-report` (run its `index.html`) side by side.

- [ ] **Step 6: Commit (when Antun approves)**

```bash
git add jura-theme.css tests/smoke.spec.js
git commit -m "Jura theme: nav, page header, filter chips"
```

---

### Task 3: Cards, KPIs, banner, modal

**Files:**
- Modify: `jura-theme.css` (append)
- Test: `tests/smoke.spec.js` (append)

**Interfaces:**
- Consumes: Task 1 tokens. Existing selectors: `.kpi`, `.kpi.hl-*`, `.kpi-grid`, `.kpi-label`, `.kpi-value`, `.card`, `.chart-card`, `.chart-card h3`, `.guide-card`, `.gc-stripe`, `.gc-body`, `.avatar`, `.gc-name`, `.gc-badge`, `.gc-badge-new`, `.city-pill`, `.guide-flag-line`, `.guide-detail-modal`.
- Produces: `--avatar-hue` on `.guide-card[data-city]` (used only in this file).

- [ ] **Step 1: Write the failing tests**

```js
test.describe('Jura theme: cards', () => {
    test('KPI cards are flat with a plain 26px sans value', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForSelector('#page-26 .kpi.hl-green');
        expect(await styleOf(page, '#page-26 .kpi.hl-green', 'borderTopWidth')).toBe('1px');
        expect(await styleOf(page, '#page-26 .kpi-value', 'fontSize')).toBe('26px');
        expect(await styleOf(page, '#page-26 .kpi-value', 'fontFamily')).toContain('IBM Plex Sans');
    });

    test('chart cards have no shadow, also on hover', async ({ page }) => {
        await load(page);
        await page.locator('#page-cmp .chart-card').first().hover();
        expect(await styleOf(page, '#page-cmp .chart-card', 'boxShadow')).toBe('none');
    });

    test('guide cards drop the stripe, take a city tint and 4px corners', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-sections-gd .guide-card[data-city="Zagreb"]');
        const card = '#guide-sections-gd .guide-card[data-city="Zagreb"]';
        expect(await styleOf(page, `${card} .gc-stripe`, 'display')).toBe('none');
        expect(await styleOf(page, card, 'borderRadius')).toBe('4px');
        expect(await styleOf(page, card, 'backgroundColor')).not.toBe(await styleOf(page, 'body', 'backgroundColor'));
        expect(await styleOf(page, `${card} .avatar`, 'borderRadius')).toBe('4px');
    });

    test('guide card name and text stay readable on the tint in both themes', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-sections-gd .guide-card[data-city="Split"]');
        const card = '#guide-sections-gd .guide-card[data-city="Split"]';
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const fg = parseCssColor(await styleOf(page, `${card} .gc-name`, 'color'));
            const bg = parseCssColor(await styleOf(page, card, 'backgroundColor'));
            expect(contrastRatio(fg, bg), dark ? 'dark' : 'light').toBeGreaterThanOrEqual(4.5);
        }
    });

    test('movers banner lines are boxed and use the delta colors', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-flags-gd .guide-flag-line.neg');
        expect(await styleOf(page, '#guide-flags-gd .guide-flag-line', 'backgroundColor')).not.toBe('rgba(0, 0, 0, 0)');
        expect(await styleOf(page, '#guide-flags-gd .guide-flag-line.neg', 'color')).toBe('rgb(212, 84, 90)');
    });

    test('detail modal is flat with 4px corners and a hairline border', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.locator('#guide-sections-gd .guide-card').first().click();
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
        expect(await styleOf(page, '#guide-detail-modal-gd', 'borderRadius')).toBe('4px');
        expect(await styleOf(page, '#guide-detail-modal-gd', 'borderTopWidth')).toBe('1px');
    });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test -g "Jura theme: cards"`
Expected: FAIL on the KPI, chart card, guide card and banner tests (3px `hl-green` top border and 36px value, hover shadow, visible stripe, banner without a box). The guide card contrast test and the modal test may already pass, because Task 1 set `--radius` to 4px and the card text is dark on a light surface; that is fine.

- [ ] **Step 3: Append the CSS**

```css
/* ── KPI + CARDS ── */
.kpi-grid { background: transparent; padding: 0; gap: 12px; margin-bottom: 20px; }
.kpi { padding: 14px 16px; }
.kpi:hover { background: var(--white); }
.kpi.hl-teal,
.kpi.hl-green,
.kpi.hl-blue { border-top: 1px solid var(--border); }
.kpi.hl-teal .kpi-value,
.kpi.hl-green .kpi-value,
.kpi.hl-blue .kpi-value { color: var(--text); }
.kpi-label,
.chart-card-title,
.card-title {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--text3);
}
.kpi-value { font-size: 26px; font-weight: 600; line-height: 1.2; margin-top: 4px; }

.card,
.chart-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: none;
}
.card:hover,
.chart-card:hover,
body.dark-mode .card,
body.dark-mode .card:hover {
  box-shadow: none;
  border-color: var(--border);
}
.chart-card h3 { font-size: 15px; font-weight: 600; }

/* ── GUIDE CARDS ── */
.guide-card[data-city="Zagreb"] { --avatar-hue: var(--zagreb); }
.guide-card[data-city="Dubrovnik"] { --avatar-hue: var(--dubrovnik); }
.guide-card[data-city="Split"] { --avatar-hue: var(--split); }
.guide-card[data-city="Zadar"] { --avatar-hue: var(--zadar); }
.guide-card {
  background: color-mix(in srgb, var(--avatar-hue, var(--white)) 10%, var(--white));
  border-radius: var(--radius);
}
.guide-card:hover {
  box-shadow: none;
  transform: none;
  border-color: var(--text3);
}
.gc-stripe { display: none; }
.gc-body { padding: 14px 16px 0; }
.avatar { border-radius: var(--radius); }
.gc-name { font-weight: 600; }
.guide-card .city-pill {
  border-radius: var(--radius);
  letter-spacing: 0.04em;
}
.gc-badge {
  border-radius: var(--radius);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.gc-badge-new { color: var(--delta-pos); border-color: var(--delta-pos); }

/* ── MOVERS BANNER + MODAL ── */
.guide-flag-line {
  padding: 8px 12px;
  border-radius: var(--radius);
  background: var(--smoke);
  margin-bottom: 6px;
}
.guide-flag-line:last-child { margin-bottom: 0; }
.guide-flag-line.neg { color: var(--delta-neg); }
.guide-flag-line.pos { color: var(--delta-pos); }
.guide-detail-modal {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.guide-detail-city { text-transform: uppercase; letter-spacing: 0.04em; }
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm run build && npx playwright test -g "Jura theme" && npx vitest run && npx playwright test`
Expected: all pass. If the guide card contrast test fails in dark mode, lower the tint from 10 to 8 percent and note a `Ruling:`.

- [ ] **Step 5: Look at it**

Screenshots of Tours 2026 (KPIs), Comparison (chart cards), Guides cards view, the movers banner and an open modal, light and dark. Compare with Jura's Guides and Comparison tabs. Expected: flat bordered cards, tinted guide cards with square avatars, no stripe, no hover lift.

- [ ] **Step 6: Commit (when Antun approves)**

```bash
git add jura-theme.css tests/smoke.spec.js
git commit -m "Jura theme: KPI, chart and guide cards, banner, modal"
```

---

### Task 4: Tables

**Files:**
- Modify: `jura-theme.css` (append)
- Test: `tests/smoke.spec.js` (append)

**Interfaces:**
- Consumes: Task 1 tokens. Existing selectors: `.mpax-table` and its `th`, `td`, `.mpax-city-head` (+ `.zagreb` etc.), `.gd-group-head`, `.mpax-sub-head`, `.mpax-month-head`, `tr.mpax-total`, `.gc-cmp-table`, `.mgmt-table`.
- Produces: nothing new.

- [ ] **Step 1: Write the failing tests**

```js
test.describe('Jura theme: tables', () => {
    test('monthly table is flat: hairline row borders, 2px total row, 13px', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForSelector('#page-26 .mpax-table tr.mpax-total');
        expect(await styleOf(page, '#page-26 .mpax-table', 'fontSize')).toBe('13px');
        expect(await styleOf(page, '#page-26 .mpax-table td', 'borderLeftWidth')).toBe('0px');
        expect(await styleOf(page, '#page-26 .mpax-table tr.mpax-total td', 'borderTopWidth')).toBe('2px');
        expect(await styleOf(page, '#page-26 .mpax-table', 'fontFamily')).toContain('IBM Plex Sans');
    });

    test('city head cells keep 4.5:1 text contrast on their tint, light and dark', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForSelector('#page-26 .mpax-city-head.zagreb');
        for (const city of ['zagreb', 'dubrovnik', 'split', 'zadar']) {
            for (const dark of [false, true]) {
                await setDark(page, dark);
                const sel = `#page-26 .mpax-city-head.${city}`;
                const fg = parseCssColor(await styleOf(page, sel, 'color'));
                const bg = parseCssColor(await styleOf(page, sel, 'backgroundColor'));
                expect(contrastRatio(fg, bg), `${city} ${dark ? 'dark' : 'light'}`).toBeGreaterThanOrEqual(4.5);
            }
        }
    });

    test('Guides table group heads stay readable after the retheme', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.click('#guide-view-table-gd');
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const sel = '#guide-table-gd thead tr:first-child th.mpax-city-head';
            const fg = parseCssColor(await styleOf(page, sel, 'color'));
            const bg = parseCssColor(await styleOf(page, sel, 'backgroundColor'));
            expect(contrastRatio(fg, bg), dark ? 'dark' : 'light').toBeGreaterThanOrEqual(4.5);
        }
    });
});
```

- [ ] **Step 2: Run to verify the failures**

Run: `npx playwright test -g "Jura theme: tables"`
Expected: FAIL on the first two (12px, 1px full borders, white text on solid city fill fails or passes by accident in one theme). The third guards the earlier fix: it may pass already. A pass here before the CSS is fine.

- [ ] **Step 3: Append the CSS**

```css
/* ── TABLES ── */
.mpax-table { font-size: 13px; }
.mpax-table th,
.mpax-table td {
  border: none;
  border-bottom: 1px solid var(--border);
}
.mpax-table .mpax-city-head {
  color: var(--text);
  font-weight: 600;
  letter-spacing: 0;
}
.mpax-city-head.zagreb { background: color-mix(in srgb, var(--zagreb) 22%, var(--white)); }
.mpax-city-head.dubrovnik { background: color-mix(in srgb, var(--dubrovnik) 22%, var(--white)); }
.mpax-city-head.split { background: color-mix(in srgb, var(--split) 22%, var(--white)); }
.mpax-city-head.zadar { background: color-mix(in srgb, var(--zadar) 22%, var(--white)); }
.mpax-table tr.mpax-total td {
  background: transparent;
  border-top: 2px solid var(--text);
}
.mpax-table td.mpax-month { font-size: 12px; }
.mpax-note { font-size: 11px; }

.gc-cmp-table td { border-bottom: 1px solid var(--border); }
.mgmt-table th { letter-spacing: 0.04em; }
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm run build && npx playwright test -g "Jura theme" && npx vitest run && npx playwright test`
Expected: all pass.

- [ ] **Step 5: Look at it**

Screenshots of the monthly tables on Tours 2025, 2026 and Comparison, the Guides table with the TOTAL row, and each Management sub-tab table, light and dark. Compare against Jura's tables. Expected: flat rows, tinted city heads with dark text, bold total row with a 2px rule. Note anything in Management that still looks off (colored row backgrounds `.row-poor` etc. keep working).

- [ ] **Step 6: Commit (when Antun approves)**

```bash
git add jura-theme.css tests/smoke.spec.js
git commit -m "Jura theme: tables"
```

---

### Task 5: Chart fonts and colors

**Files:**
- Modify: `src/pages/page-cmp/charts.js`, `src/pages/page-cmp/index.js`, `src/pages/page-2025.js`, `src/pages/page-2026.js`, `src/pages/management/helpers.js` (font name only)
- Modify: `src/shared.js` (`getChartColors` and `getCityColor` read `document.body`)
- Create: `tests/theme-fonts.test.js`
- Test: `tests/smoke.spec.js` (append)

**Interfaces:**
- Consumes: `--y25`, `--y26`, `--text`, `--text3`, `--border`, city tokens, read by `getChartColors()` and `getCityColor()` in `src/shared.js`.
- Produces: nothing new.

- [ ] **Step 1: Write the failing tests**

Create `tests/theme-fonts.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function jsFiles(dir) {
    return readdirSync(dir).flatMap(name => {
        const p = join(dir, name);
        return statSync(p).isDirectory() ? jsFiles(p) : p.endsWith('.js') ? [p] : [];
    });
}

describe('chart fonts', () => {
    it('no source file still names Montserrat', () => {
        const offenders = jsFiles(new URL('../src', import.meta.url).pathname)
            .filter(f => readFileSync(f, 'utf8').includes('Montserrat'));
        expect(offenders).toEqual([]);
    });
});
```

Append to `tests/smoke.spec.js`:

```js
test.describe('Jura theme: charts', () => {
    test('comparison charts use the Plex font and the new year colors', async ({ page }) => {
        await load(page);
        await page.waitForFunction(() => window.Chart && Chart.getChart('cityChart-cmp'));
        const r = await page.evaluate(() => {
            const chart = Chart.getChart('monthlyChart-cmp');
            const cs = getComputedStyle(document.body);
            return {
                legendFont: chart.options.plugins.legend.labels.font.family,
                line25: chart.data.datasets[0].borderColor,
                line26: chart.data.datasets[1].borderColor,
                y25: cs.getPropertyValue('--y25').trim(),
                y26: cs.getPropertyValue('--y26').trim(),
            };
        });
        expect(r.legendFont).toContain('IBM Plex Sans');
        expect(r.line25).toBe(r.y25);
        expect(r.line26).toBe(r.y26);
    });

    test('charts built in dark mode read the dark year colors', async ({ page }) => {
        await load(page);
        await page.waitForFunction(() => window.Chart && Chart.getChart('monthlyChart-cmp'));
        await page.evaluate(() => {
            document.body.classList.add('dark-mode');
            window.PageCmp.renderAll();
        });
        await page.waitForFunction(
            () => Chart.getChart('monthlyChart-cmp')?.data.datasets[1].borderColor === '#f0f0f0',
            null, { timeout: 5000 });
    });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/theme-fonts.test.js && npm run build && npx playwright test -g "Jura theme: charts"`
Expected: the vitest fails listing the five files; the Playwright font assertion fails (Montserrat); the dark-mode test times out (the chart keeps the light `#1a1a1a` 2026 line). The light color assertions already pass, since charts read the tokens.

- [ ] **Step 3: Replace the font name**

Run: `grep -rln "Montserrat" src`
Expected: the five files above. Then:

```bash
grep -rl "Montserrat" src | xargs sed -i '' "s/Montserrat/IBM Plex Sans/g"
grep -rn "Montserrat" src
```

Expected: the second command prints nothing. The replaced strings read like `'IBM Plex Sans',sans-serif` (a valid canvas and Chart.js font stack).

Then in `src/shared.js` change `getCityColor` and `getChartColors` to read from the body, because the dark tokens are defined on `body.dark-mode`, not `:root`:

```js
export function getCityColor(city) {
    if (!city || city === 'Unknown') return '#999999';
    return getComputedStyle(document.body).getPropertyValue('--' + city.toLowerCase()).trim() || '#999999';
}

export function getChartColors() {
    const s = getComputedStyle(document.body);
    const tok = n => s.getPropertyValue(n).trim();
    return { text: tok('--text'), text3: tok('--text3'), border: tok('--border'), y25: tok('--y25'), y26: tok('--y26') };
}
```

(`PageGuides.getChartColors()` already reads `body`; leave it.)

- [ ] **Step 4: Run to verify they pass**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: all green.

- [ ] **Step 5: Look at it**

Screenshots of every chart-bearing tab (Tours 2025, Tours 2026, Comparison, Management P&L) in light and dark. Expected: Plex labels, blue, orange, green and yellow city bars, indigo and near-black year lines. Check the delta text drawn under the bars and above the lines (canvas overlays with fixed offsets tuned for the old font): they must not overlap the bars or run off the card. Any overlap is a finding, fix by adjusting only the offset constants in the same file and record a `Ruling:`.

- [ ] **Step 6: Commit (when Antun approves)**

```bash
git add src tests/theme-fonts.test.js tests/smoke.spec.js dist/app.js
git commit -m "Jura theme: chart font, read chart colors from body"
```

---

### Task 6: Docs, print, and verification against Jura

**Files:**
- Modify: `CLAUDE.md` (evidencija's own)
- Test: `tests/smoke.spec.js` (append)

- [ ] **Step 1: Write the print test**

```js
test.describe('Jura theme: print', () => {
    test('print hides the nav and keeps cards unbroken', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-sections-gd .guide-card');
        await page.emulateMedia({ media: 'print' });
        expect(await styleOf(page, '.nav', 'display')).toBe('none');
        expect(await styleOf(page, '#guide-sections-gd .guide-card', 'breakInside')).toBe('avoid');
    });
});
```

Run: `npx playwright test -g "Jura theme: print"`
Expected: PASS (it guards the existing print block against the theme). If it fails, the theme overrode print rules: fix in `jura-theme.css` and record a `Ruling:`.

- [ ] **Step 2: Update `CLAUDE.md`**

In the file table add a row after `guides.css`:

```
| `jura-theme.css` | Jura look and feel. Loaded last (after `guides.css`), redefines tokens and restyles components by overriding existing selectors. Remove its `<link>` in `index.html` to switch it off. Desktop-only rules live in `@media (min-width: 769px)`, the phone layout is untouched. |
```

In "Theme system" add: `Light and dark tokens for the Jura theme live in jura-theme.css (it loads after guides.css and fs-core.css, so it wins). Do not edit fs-core.css for evidencija styling, it is shared with the monday and recap reports. Chart fonts are set in JS as 'IBM Plex Sans' (search src for the name if it ever changes).` Use no em dashes.

- [ ] **Step 3: Full automated run**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: all green.

- [ ] **Step 4: Visual verification matrix (against the design, not just tests)**

Serve the folder (`python3 -m http.server`) and use Playwright to screenshot into the session scratchpad, each in light and dark, at 1400 px wide, plus the phone views at 390 px:

1. Tours 2025, Tours 2026, Comparison, Guides (cards, table, modal open), Management (P&L, Guides, Channels, Ops, Cities).
2. For each, the matching Jura tab from `../jura-guide-report` where one exists (Tours 2025, Tours 2026, Comparison, Guides).
3. Check against the spec list: Plex font, plain underlined tabs, compact header without the teal badge, 4px chips and cards, tinted guide cards, flat tables, dark surface `#121212`.
4. Phone at 390 px: bottom tab bar visible, no horizontal page scroll, filters usable.
5. Management: the sticky sub-nav sits directly under the nav with no gap or overlap; the sticky mini-KPI bar (P&L) sits directly under it.
6. Print preview of one page: no nav, white page, cards not split.
7. Console: no errors on any tab.

Report the screenshots to Antun for approval. Anything he dislikes is a `Ruling:`-tracked adjustment in `jura-theme.css`, not a revert of the approach.

- [ ] **Step 5: Commit (when Antun approves)**

```bash
git add CLAUDE.md tests/smoke.spec.js
git commit -m "Document Jura theme, add print test"
```

---

## Self-Review

**Spec coverage:** tokens and fonts (Task 1); nav, header, chips, selects, print button (Task 2); KPI, chart and guide cards, banner, modal (Task 3); tables and group heads (Task 4); chart fonts and colors, the only JS (Task 5); dark mode (tokens in Task 1, checked in every task); verification, print, docs (Task 6). Page container width and padding: `--max-w`, `--pad` in Task 1, `.main` padding in Task 2. Out of scope items (Bookings, notes, bottom nav) are untouched.

**Placeholder scan:** none. Every CSS block and test is complete. Steps 2 of Tasks 2, 3 and 4 say which assertions may already pass, and why.

**Type consistency:** helper names (`parseCssColor`, `contrastRatio`, `cssVar`, `setDark`, `styleOf`) are defined once in Task 1 and reused. Token names match the spec table. `--chip-hue` and `--avatar-hue` are defined and used in the same task.

**Assumptions to confirm at review:**
1. Chips use `var(--text)` text on the tint, not Jura's hue text (contrast, see corrections).
2. Dark 2025 line color is lifted to `#7b6df0`.
3. Guide card tint is 10 percent, dropped to 8 if dark-mode contrast fails.
4. Body cells are not tinted per city (would need markup changes).
