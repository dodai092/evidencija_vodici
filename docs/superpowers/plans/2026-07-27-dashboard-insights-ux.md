# Dashboard Insights & UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four roadmap items from `docs/superpowers/specs/2026-07-26-dashboard-insights-ux-design.md`: fix a broken recommendation on the Operational tab, add guide search + cross-linking, add a "biggest negative mover" callout to Channels and Cities, and extend the existing P&L insight-strip pattern to the other four Management sub-tabs.

**Architecture:** No new subsystems. All work is additive changes to the existing vanilla-JS page-module architecture (`src/pages/**`) and the shared `src/pages/management/helpers.js` grab-bag of pure functions + DOM renderers. One function (`renderInsightCallouts`) moves from `pl.js` to `helpers.js` so five tabs can call it; one new pure function (`findBiggestNegativeMover`) is added to `helpers.js` with real unit tests since it has no DOM dependency.

**Tech Stack:** Vanilla ES modules bundled with esbuild, Chart.js 4.4.1 (untouched by this work), Vitest for the one new pure-function test file.

## Global Constraints

- No new financial fields and no changes to `scripts/extract_guides.py` or the data shape (spec: Non-goals).
- No visual redesign — reuse `.insight-pill`, `.action-panel`, `.city-filter-pill`-style conventions already in `guides.css` (spec: Non-goals).
- Channels/Operational insight data stays **unfiltered** (`kpiTotals26.mgmt` / `kpiTotals25.mgmt` as-is); Guides/Cities insight data stays **date-filtered** (`computeFilteredKpis`/`computeCity25`) — each tab keeps whatever convention it already uses for its own numbers (spec: Context, point 2).
- "Biggest mover" = worst (most negative) YoY € gross-margin swing only, with a minimum revenue floor of €500 in either year (spec: Item 3 decisions).
- The Operational tab's existing "Small Group Problem" panel (`renderPaxBandActionPanel` in `ops.js`) is NOT replaced by the new generic helper — only Channels and Cities get the new callout (spec: Item 3 decisions).
- No new test infrastructure beyond the existing Vitest setup already used by `tests/shared.test.js`; DOM-rendering changes are verified manually in-browser, consistent with how `management/*.js` has shipped historically (spec: Testing).
- Build with `npm run build` before every manual browser verification — `dist/app.js` is the bundle actually loaded by `index.html` and is not rebuilt automatically.

---

### Task 1: Fix the paxband action-panel bug

**Files:**
- Modify: `src/pages/management/ops.js:178-203` (`renderPaxBandActionPanel`)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — pure bugfix, no signature changes.

**Bug:** `breakevenBand` is the first band in `GUIDE_PBAND_ORDER = ['1-5','6-10','11+']` with positive GM. When the `1-5` band itself is already positive, the panel still tells the user to "raise minimum from 2 PAX to 1 PAX" — self-contradictory. The fix only needs to gate on whether the `1-5` band is actually negative; when it's negative, `breakevenBand` is already guaranteed to resolve to `'6-10'` or `'11+'` (or `null`), because `'1-5'` itself failed the positive-GM check in the loop that computed it.

- [ ] **Step 1: Read the current function to confirm line numbers haven't drifted**

Run: `sed -n '178,203p' src/pages/management/ops.js`
Expected output starts with `    // Find the first PAX band with positive GM% in 2026` and ends with the closing of `renderPaxBandActionPanel`.

- [ ] **Step 2: Apply the fix**

Replace:
```js
    const el = document.getElementById('paxband-action-panel');
    if (el) {
        const breakevenNote = breakevenBand
            ? `<div><strong>⚡ Action:</strong> Raise minimum from 2 PAX to <strong>${breakevenBand.split('-')[0]} PAX</strong> to guarantee positive margin on every tour</div>`
            : '';
```
with:
```js
    const el = document.getElementById('paxband-action-panel');
    if (el) {
        const breakevenNote = (smallGroup26.grossMargin < 0 && breakevenBand)
            ? `<div><strong>⚡ Action:</strong> Enforce a minimum of <strong>${breakevenBand.split('-')[0]} PAX</strong> per booking to guarantee positive margin on every tour</div>`
            : '';
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `dist/app.js  ...kb` with no errors.

- [ ] **Step 4: Verify in browser**

Serve the repo root (e.g. `python3 -m http.server 8934` from the `Tin-monday_report` parent directory) and open `evidencija/index.html`. Go to Management → Operational. With current data (the 1-5 PAX band is GM-positive, per commit `62a24c0`), confirm the "⚡ Action" line is now **absent** from the Small Group Problem panel — only Prevalence/Margin loss/Trend lines show.

To confirm the line still appears correctly when the band IS negative, temporarily edit `data-2026.js`'s `kpiTotals26.mgmt.byGuidePaxBand["1-5"].grossMargin` to a negative number in a scratch copy (do not commit), rebuild, reload, confirm the action line reappears with the new wording, then revert the scratch edit (it was never committed, so a plain reload after `git checkout -- data-2026.js` style revert isn't even needed if you never saved the file — just don't save the test edit).

- [ ] **Step 5: Commit**

```bash
git add src/pages/management/ops.js
git commit -m "fix: correct paxband action-panel recommendation logic

Only surface the 'enforce a minimum' recommendation when the 1-5 PAX
band is actually running negative margin. Previously the panel could
tell the user to 'raise minimum from 2 PAX to 1 PAX' even when the
1-5 band was already break-even, which is self-contradictory."
```

---

### Task 2: Guide-card search — Tours 2026

**Files:**
- Modify: `src/pages/page-2026.js`
- Modify: `src/i18n.js`
- Modify: `guides.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Page26.searchTerm` (string, default `''`), `Page26.applySearchFilter()`, `Page26.filterGuideSearch(term)` — Task 4 (cross-link) relies on `Page26.searchTerm` being resettable and `Page26.applySearchFilter()` existing, indirectly via `Page26.renderAll()`.

- [ ] **Step 1: Add the translation key**

In `src/i18n.js`, find the `en.labels` block (starts `labels: {` around line 11) and the line:
```js
      avgPaxPerTour: 'Avg PAX per Tour',
```
Add immediately after it:
```js
      searchGuide: 'Search guide…',
```

Find the `hr.labels` block (starts `labels: {` around line 158) and the line:
```js
      avgPaxPerTour: 'Prosječan PAX po turi',
```
Add immediately after it:
```js
      searchGuide: 'Pretraži vodiča…',
```

- [ ] **Step 2: Add `searchTerm` state and the search input to `_buildGuides()`**

In `src/pages/page-2026.js`, add `searchTerm: ''` to the `Page26` object's state fields (right after `activeSharedType: 'all',`):
```js
    activeSharedType: 'all',
    searchTerm: '',
```

Replace `_buildGuides()`:
```js
    _buildGuides() {
        return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('guides-body-26')">
                <span>${t('labels.guides')}</span>
                <span class="section-chevron">▾</span>
            </button>
            <div id="guides-body-26" class="section-body">
                <div id="guide-sections-26"></div>
            </div>
        </div>`;
    },
```
with:
```js
    _buildGuides() {
        return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('guides-body-26')">
                <span>${t('labels.guides')}</span>
                <span class="section-chevron">▾</span>
            </button>
            <div id="guides-body-26" class="section-body">
                <input type="text" id="guide-search-26" class="guide-search-input"
                       placeholder="${t('labels.searchGuide')}"
                       oninput="Page26.filterGuideSearch(this.value)">
                <div id="guide-sections-26"></div>
            </div>
        </div>`;
    },
```

- [ ] **Step 3: Add `applySearchFilter()` and `filterGuideSearch()` methods**

Add these two methods to the `Page26` object, right after `filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },`:
```js
    filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },

    applySearchFilter() {
        const term = (this.searchTerm || '').toLowerCase();
        this._scope('.guide-card').forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            card.style.display = !term || name.includes(term) ? '' : 'none';
        });
    },
    filterGuideSearch(term) {
        this.searchTerm = term;
        this.applySearchFilter();
    },
```

- [ ] **Step 4: Reapply the search filter after every `renderAll()`**

In `renderAll()`, replace:
```js
        container.innerHTML = html;
        this.updateKPIs();
        this.updateChart();
        this.renderCityBars();
        this.renderMonthlyTable();
        this.updatePaidTypeCharts();
    },
```
with:
```js
        container.innerHTML = html;
        this.applySearchFilter();
        this.updateKPIs();
        this.updateChart();
        this.renderCityBars();
        this.renderMonthlyTable();
        this.updatePaidTypeCharts();
    },
```

- [ ] **Step 5: Style the search input**

In `guides.css`, find:
```css
body.dark-mode .filter-select {
  color-scheme: dark;
}
```
Add immediately after it:
```css

.guide-search-input {
  display: block;
  background: var(--smoke);
  border: 1px solid var(--border-dark);
  color: var(--text2);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: 12px;
  outline: none;
  width: 220px;
  max-width: 100%;
  margin: 0 0 16px;
}

body.dark-mode .guide-search-input {
  color-scheme: dark;
}
```

- [ ] **Step 6: Build and verify in browser**

Run: `npm run build`

Open the dashboard, go to Tours 2026. Confirm a search box appears above the guide cards. Type part of a guide's name (e.g. "kata" for "Katarina Novoselac") — confirm only matching cards remain visible and others are hidden. Clear the box — confirm all cards for the active city filter reappear. Click a different city pill while a search term is active — confirm the search term still applies (the city-filter re-render calls `renderAll()`, which now reapplies the search filter).

- [ ] **Step 7: Commit**

```bash
git add src/pages/page-2026.js src/i18n.js guides.css
git commit -m "feat: add guide-card search to Tours 2026 tab"
```

---

### Task 3: Guide-card search — Tours 2025

**Files:**
- Modify: `src/pages/page-2025.js`

**Interfaces:**
- Consumes: `labels.searchGuide` translation key and `.guide-search-input` CSS class (both added in Task 2).
- Produces: `Page25.searchTerm`, `Page25.applySearchFilter()`, `Page25.filterGuideSearch(term)` — mirrors Task 2's `Page26` additions, no other task depends on these.

This is the same change as Task 2, applied to `Page25` in `src/pages/page-2025.js` (structurally identical file — same field names, same `_buildGuides()`/`renderAll()` shape, just with `-25` suffixes).

- [ ] **Step 1: Add `searchTerm` state**

In `src/pages/page-2025.js`, add `searchTerm: ''` right after `activeSharedType: 'all',`:
```js
    activeSharedType: 'all',
    searchTerm: '',
```

- [ ] **Step 2: Update `_buildGuides()`**

Replace:
```js
    _buildGuides() {
        return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('guides-body-25')">
                <span>${t('labels.guides')}</span>
                <span class="section-chevron">▾</span>
            </button>
            <div id="guides-body-25" class="section-body">
                <div id="guide-sections-25"></div>
            </div>
        </div>`;
    },
```
with:
```js
    _buildGuides() {
        return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('guides-body-25')">
                <span>${t('labels.guides')}</span>
                <span class="section-chevron">▾</span>
            </button>
            <div id="guides-body-25" class="section-body">
                <input type="text" id="guide-search-25" class="guide-search-input"
                       placeholder="${t('labels.searchGuide')}"
                       oninput="Page25.filterGuideSearch(this.value)">
                <div id="guide-sections-25"></div>
            </div>
        </div>`;
    },
```

- [ ] **Step 3: Add the two methods**

Find `filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },` in `page-2025.js` and add immediately after it:
```js
    applySearchFilter() {
        const term = (this.searchTerm || '').toLowerCase();
        this._scope('.guide-card').forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            card.style.display = !term || name.includes(term) ? '' : 'none';
        });
    },
    filterGuideSearch(term) {
        this.searchTerm = term;
        this.applySearchFilter();
    },
```

- [ ] **Step 4: Reapply filter after render**

In `Page25.renderAll()`, replace:
```js
        container.innerHTML = html;
        this.updateKPIs();
        this.updateChart();
        this.renderCityBars();
        this.renderMonthlyTable();
        this.updatePaidTypeCharts();
    },
```
with:
```js
        container.innerHTML = html;
        this.applySearchFilter();
        this.updateKPIs();
        this.updateChart();
        this.renderCityBars();
        this.renderMonthlyTable();
        this.updatePaidTypeCharts();
    },
```

- [ ] **Step 5: Build and verify in browser**

Run: `npm run build`. Go to Tours 2025, repeat the same manual check as Task 2 Step 6.

- [ ] **Step 6: Commit**

```bash
git add src/pages/page-2025.js
git commit -m "feat: add guide-card search to Tours 2025 tab"
```

---

### Task 4: Cross-link Management → Guides table to the guide's card on Tours 2026

**Files:**
- Modify: `src/pages/page-2026.js`
- Modify: `src/pages/management/guides.js`
- Modify: `guides.css`

**Interfaces:**
- Consumes: `Page26.searchTerm`, `Page26.applySearchFilter()`, `Page26.renderAll()` (Task 2); `showPage(id, tab)` from `src/shared.js` (existing, signature: `showPage(id: string, tab: HTMLElement)`); guide cards' existing `data-name="<guide name>"` attribute (existing, `page-2026.js`).
- Produces: `Page26.jumpToGuide(name: string)` — used only by the onclick attribute generated in `guides.js`'s guide-name table cells, not called from any other task.

- [ ] **Step 1: Import `showPage` into `page-2026.js`**

Change the top import line:
```js
import { getCityColor, getChartColors as _chartColors, CITY_CLS, CITIES, MONTH_NAMES_HR, filteredStats, safeName, fmtN, getCutoffMonth, getGlobalDate, registerPage } from '../shared.js';
```
to:
```js
import { getCityColor, getChartColors as _chartColors, CITY_CLS, CITIES, MONTH_NAMES_HR, filteredStats, safeName, fmtN, getCutoffMonth, getGlobalDate, registerPage, showPage } from '../shared.js';
```

- [ ] **Step 2: Add `Page26.jumpToGuide(name)`**

Add this method right after `filterGuideSearch(term) { ... },` (added in Task 2):
```js
    jumpToGuide(name) {
        const tabEl = document.getElementById('tab-26');
        if (tabEl) showPage('page-26', tabEl);
        this.activeCity = 'all';
        this.searchTerm = '';
        const searchInput = this._el('guide-search');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('#page-26 .city-filter-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.city === 'all'));
        this.renderAll();
        requestAnimationFrame(() => {
            const card = document.querySelector(`#page-26 .guide-card[data-name="${CSS.escape(name)}"]`);
            if (!card) return;
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('guide-card-highlight');
            setTimeout(() => card.classList.remove('guide-card-highlight'), 1500);
        });
    },
```

- [ ] **Step 3: Make guide names in the Management → Guides table clickable**

In `src/pages/management/guides.js`, in `renderGuideTable()`, find:
```js
            <td class="guide-name">${r.name}</td>
```
Replace with:
```js
            <td class="guide-name"><a href="#" class="guide-name-link" onclick="Page26.jumpToGuide('${r.name.replace(/'/g, "\\'")}'); return false;">${r.name}</a></td>
```

- [ ] **Step 4: Style the link and the highlight pulse**

In `guides.css`, find the `.guide-search-input` / dark-mode block added in Task 2 and add after it:
```css

.guide-name-link {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.guide-name-link:hover {
  text-decoration: underline;
}

.guide-card-highlight {
  animation: guide-card-pulse 1.5s ease-out;
}

@keyframes guide-card-pulse {
  0%   { box-shadow: 0 0 0 3px var(--teal); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

- [ ] **Step 5: Build and verify in browser**

Run: `npm run build`. Go to Management → Guides. Click a guide's name (e.g. "Ivo Miličić", who ranks under Dubrovnik). Confirm: the main nav switches to Tours 2026, the city filter resets to "All cities", the page scrolls to that guide's card, and the card briefly pulses with a highlight ring. Repeat while a city pill other than "All cities" was active on Tours 2026 before clicking, to confirm the reset actually happens.

- [ ] **Step 6: Commit**

```bash
git add src/pages/page-2026.js src/pages/management/guides.js guides.css
git commit -m "feat: link guide names in Management table to their Tours 2026 card"
```

---

### Task 5: Add `findBiggestNegativeMover` helper with unit tests

**Files:**
- Modify: `src/pages/management/helpers.js`
- Create: `tests/management-helpers.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `findBiggestNegativeMover(entries: {name, revenue26, gm26, revenue25, gm25}[], minRevenue?: number = 500): {name, revenue26, gm26, revenue25, gm25, delta: number} | null` — used by Task 6 (Channels) and Task 8 (Cities).

- [ ] **Step 1: Write the failing tests**

Create `tests/management-helpers.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { findBiggestNegativeMover } from '../src/pages/management/helpers.js';

describe('findBiggestNegativeMover', () => {
    it('returns the entry with the most negative GM delta', () => {
        const entries = [
            { name: 'A', revenue26: 10000, gm26: 1000, revenue25: 10000, gm25: 1200 },  // delta -200
            { name: 'B', revenue26: 20000, gm26: 500,  revenue25: 20000, gm25: 5000 },  // delta -4500
            { name: 'C', revenue26: 5000,  gm26: 800,  revenue25: 5000,  gm25: 600 },   // delta +200
        ];
        const result = findBiggestNegativeMover(entries);
        expect(result.name).toBe('B');
        expect(result.delta).toBe(-4500);
    });

    it('excludes entries below the minimum revenue floor in both years', () => {
        const entries = [
            { name: 'Tiny', revenue26: 50, gm26: 10, revenue25: 60, gm25: 400 },   // delta -390, but revenue < 500 both years
            { name: 'Real', revenue26: 8000, gm26: 700, revenue25: 8000, gm25: 900 }, // delta -200
        ];
        const result = findBiggestNegativeMover(entries);
        expect(result.name).toBe('Real');
    });

    it('includes an entry if EITHER year is above the revenue floor', () => {
        const entries = [
            { name: 'FadingOut', revenue26: 100, gm26: -50, revenue25: 9000, gm25: 3000 }, // delta -3050, revenue25 >= 500
        ];
        const result = findBiggestNegativeMover(entries);
        expect(result.name).toBe('FadingOut');
    });

    it('returns null when no entry has a negative delta', () => {
        const entries = [
            { name: 'A', revenue26: 10000, gm26: 1200, revenue25: 10000, gm25: 1000 },
        ];
        expect(findBiggestNegativeMover(entries)).toBeNull();
    });

    it('returns null for an empty list', () => {
        expect(findBiggestNegativeMover([])).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/management-helpers.test.js`
Expected: FAIL — `findBiggestNegativeMover is not a function` (or similar import error), since it doesn't exist yet.

- [ ] **Step 3: Implement the function**

In `src/pages/management/helpers.js`, add at the end of the "Aggregation" section (right after `buildMonthlyFromDays`, before the "Chart theming" section comment):
```js
// entries: [{ name, revenue26, gm26, revenue25, gm25 }]
// Returns the single worst YoY € gross-margin swing (most negative delta),
// excluding entries with revenue below minRevenue in BOTH years. Returns
// null if no entry qualifies or none has a negative delta.
export function findBiggestNegativeMover(entries, minRevenue = 500) {
    return entries
        .filter(e => e.revenue26 >= minRevenue || e.revenue25 >= minRevenue)
        .map(e => ({ ...e, delta: e.gm26 - e.gm25 }))
        .filter(e => e.delta < 0)
        .sort((a, b) => a.delta - b.delta)[0] || null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/management-helpers.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: all existing tests plus the 5 new ones pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/management/helpers.js tests/management-helpers.test.js
git commit -m "feat: add findBiggestNegativeMover helper with unit tests"
```

---

### Task 6: Biggest-mover callout on the Channels tab

**Files:**
- Modify: `src/pages/management/channels.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `findBiggestNegativeMover` (Task 5).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the container div in `index.html`**

Find (inside `#mgmt-channels`):
```html
            <div class="main">
                <h2 class="mgmt-section-title">Commission Waterfall by Source</h2>
```
Replace with:
```html
            <div class="main">
                <div id="biggest-mover-channels" class="action-panel mb-24"></div>

                <h2 class="mgmt-section-title">Commission Waterfall by Source</h2>
```

- [ ] **Step 2: Import the helper and add the render function**

In `src/pages/management/channels.js`, change:
```js
import {
    fmt, fmtEur, dd, gmClass,
    guidesForCity, filterMgmtByDate,
    makeBarChart, makeLineChart, getThemeColors,
} from './helpers.js';
```
to:
```js
import {
    fmt, fmtEur, dd, gmClass,
    guidesForCity, filterMgmtByDate,
    makeBarChart, makeLineChart, getThemeColors,
    findBiggestNegativeMover,
} from './helpers.js';
```

Add this function after `renderCommissionWaterfall()` (before `renderDirectOtaTrend()`):
```js
export function renderBiggestMoverChannel() {
    const el = document.getElementById('biggest-mover-channels');
    if (!el) return;

    const src26 = kpiTotals26.mgmt.bySource || {};
    const src25 = typeof kpiTotals25 !== 'undefined' ? (kpiTotals25.mgmt?.bySource || {}) : {};
    const names = new Set([...Object.keys(src26), ...Object.keys(src25)]);
    const entries = Array.from(names).map(name => ({
        name,
        revenue26: src26[name]?.revenue || 0,
        gm26: src26[name]?.grossMargin || 0,
        revenue25: src25[name]?.revenue || 0,
        gm25: src25[name]?.grossMargin || 0,
    }));

    const mover = findBiggestNegativeMover(entries);
    if (!mover) { el.innerHTML = ''; return; }

    const commPct26 = mover.revenue26 > 0
        ? ((src26[mover.name]?.commissionCost || 0) / mover.revenue26 * 100)
        : 0;

    el.innerHTML = `<strong>⚡ Biggest swing:</strong> ${mover.name} gross margin ${dd(mover.delta, true)} vs 2025 ` +
        `(${fmtEur(mover.gm25)} → ${fmtEur(mover.gm26)}), on ${fmtEur(mover.revenue26)} revenue at ${commPct26.toFixed(1)}% commission.`;
}
```

- [ ] **Step 3: Call it from `initChannels()` and `refreshChannels()`**

Replace:
```js
export function initChannels() {
    renderCommissionWaterfall();
    renderDirectOtaTrend();
    renderOtaSourceTable();
    renderTourTypeTable();
}
```
with:
```js
export function initChannels() {
    renderBiggestMoverChannel();
    renderCommissionWaterfall();
    renderDirectOtaTrend();
    renderOtaSourceTable();
    renderTourTypeTable();
}
```

Replace:
```js
export function refreshChannels() {
    renderDirectOtaTrend();
}
```
with:
```js
export function refreshChannels() {
    renderBiggestMoverChannel();
    renderDirectOtaTrend();
}
```

- [ ] **Step 4: Build and verify in browser**

Run: `npm run build`. Go to Management → Channels. Confirm an amber callout box appears at the top of the tab identifying the source with the worst YoY GM swing. Cross-check the € figures against the "Δ GM" column in the OTA Source Detail table further down — they must match (same underlying `bySource` data).

- [ ] **Step 5: Commit**

```bash
git add src/pages/management/channels.js index.html
git commit -m "feat: add biggest-mover callout to Channels tab"
```

---

### Task 7: Extract `renderInsightCallouts` into `helpers.js`

**Files:**
- Modify: `src/pages/management/pl.js`
- Modify: `src/pages/management/helpers.js`
- Modify: `guides.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: nothing new.
- Produces: `renderInsightCallouts(k, k25, elId?: string = 'insight-strip')` exported from `helpers.js` — used by Tasks 8, 9, 10, 11 (Guides/Channels/Ops/Cities insight strips) and by the now-refactored `pl.js`.

This is a pure move-and-generalize refactor: same logic, one new optional parameter, no behavior change on the P&L tab.

- [ ] **Step 1: Move the function to `helpers.js`**

In `src/pages/management/pl.js`, delete the `renderInsightCallouts` function (currently lines ~152-210, starting `function renderInsightCallouts(k, k25) {` and ending with the closing `}` right before `function renderPlGuideDrilldown(city) {`).

In `src/pages/management/helpers.js`, add the function (with the signature generalized) right after `findBiggestNegativeMover` (added in Task 5), before the "Chart theming" section:
```js
export function renderInsightCallouts(k, k25, elId = 'insight-strip') {
    const el = document.getElementById(elId);
    if (!el || !k25) { if (el) el.innerHTML = ''; return; }

    const gmPct26 = k.revenue > 0 ? k.grossMargin / k.revenue * 100 : 0;
    const gmPct25 = k25.revenue > 0 ? k25.grossMargin / k25.revenue * 100 : 0;
    const commPct26 = k.revenue > 0 ? k.commissionCost / k.revenue * 100 : 0;
    const commPct25 = k25.revenue > 0 ? k25.commissionCost / k25.revenue * 100 : 0;
    const avgGm26 = k.paidTours > 0 ? k.grossMargin / k.paidTours : 0;
    const avgGm25 = k25.paidTours > 0 ? k25.grossMargin / k25.paidTours : 0;

    const candidates = [
        {
            label: 'Revenue',
            val: k.revenue - k25.revenue,
            fmt: v => (v >= 0 ? '+' : '−') + '€' + fmt(Math.abs(v)),
            pct: k25.revenue !== 0 ? (k.revenue - k25.revenue) / Math.abs(k25.revenue) * 100 : null,
            positive: true,
        },
        {
            label: 'Gross Margin',
            val: k.grossMargin - k25.grossMargin,
            fmt: v => (v >= 0 ? '+' : '−') + '€' + fmt(Math.abs(v)),
            pct: k25.grossMargin !== 0 ? (k.grossMargin - k25.grossMargin) / Math.abs(k25.grossMargin) * 100 : null,
            positive: true,
        },
        {
            label: 'GM%',
            val: gmPct26 - gmPct25,
            fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'pp margin',
            pct: null,
            positive: true,
        },
        {
            label: 'Commission rate',
            val: commPct26 - commPct25,
            fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'pp of rev',
            pct: null,
            positive: false,
        },
        {
            label: 'Avg GM/tour',
            val: avgGm26 - avgGm25,
            fmt: v => (v >= 0 ? '+' : '−') + '€' + fmt(Math.abs(v)) + '/tour',
            pct: null,
            positive: true,
        },
    ];

    const top = candidates.filter(c => ['Revenue', 'Gross Margin', 'GM%'].includes(c.label));

    el.innerHTML = top.map(c => {
        const isGood = c.positive ? c.val >= 0 : c.val <= 0;
        const cls = isGood ? 'insight-pos' : 'insight-neg';
        const arrow = isGood ? '▲' : '▼';
        const pctStr = c.pct !== null ? ` (${c.pct >= 0 ? '+' : ''}${c.pct.toFixed(1)}%)` : '';
        return `<span class="insight-pill ${cls}">${arrow} ${c.label} ${c.fmt(c.val)}${pctStr} vs 2025</span>`;
    }).join('');
}
```

- [ ] **Step 2: Import it back into `pl.js`**

Change:
```js
import {
    fmt, fmtEur, dd, gmClass,
    get25, guidesForCity,
    filterMgmtByDate, filterStatsByDate,
    computeFilteredKpis, computeCity25,
    makeBarChart, makeLineChart, axisDefaults, tooltipDefaults, getThemeColors,
    buildMonthlyFromDays, countUp,
} from './helpers.js';
```
to:
```js
import {
    fmt, fmtEur, dd, gmClass,
    get25, guidesForCity,
    filterMgmtByDate, filterStatsByDate,
    computeFilteredKpis, computeCity25,
    makeBarChart, makeLineChart, axisDefaults, tooltipDefaults, getThemeColors,
    buildMonthlyFromDays, countUp,
    renderInsightCallouts,
} from './helpers.js';
```

The existing call site `renderInsightCallouts(k, k25);` inside `renderPlKpis()` needs no change — it still targets the default `'insight-strip'` id, which is P&L's existing element.

- [ ] **Step 3: Make the CSS selector reusable and mark P&L's div with the class**

In `guides.css`, change:
```css
#insight-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
```
to:
```css
.insight-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
```

In `index.html`, find (inside `#mgmt-pl`):
```html
                <div id="insight-strip"></div>
```
Replace with:
```html
                <div id="insight-strip" class="insight-strip"></div>
```

- [ ] **Step 4: Build and verify no regression on P&L**

Run: `npm run build`. Go to Management → P&L. Confirm the three insight pills (Revenue/Gross Margin/GM% vs 2025) render exactly as before, in the same place, with the same values. Switch the "All cities" pill to "Zagreb" and back — confirm the pills update as before.

- [ ] **Step 5: Commit**

```bash
git add src/pages/management/pl.js src/pages/management/helpers.js guides.css index.html
git commit -m "refactor: move renderInsightCallouts to helpers.js for reuse across tabs

No behavior change on P&L — elId now defaults to 'insight-strip' so the
existing call site is unaffected. Enables the same insight strip on
Guides, Channels, Operational, and Cities in follow-up commits."
```

---

### Task 8: Insight strip on the Guides tab

**Files:**
- Modify: `src/pages/management/guides.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `renderInsightCallouts` (Task 7).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the container div in `index.html`**

Find (inside `#mgmt-guides`):
```html
                <div class="city-pills">
                    <button type="button" class="city-pill active" data-city="all">All cities</button>
                    <button type="button" class="city-pill" data-city="Zagreb">Zagreb</button>
                    <button type="button" class="city-pill" data-city="Dubrovnik">Dubrovnik</button>
                    <button type="button" class="city-pill" data-city="Split">Split</button>
                    <button type="button" class="city-pill" data-city="Zadar">Zadar</button>
                </div>
                <div class="table-card">
```
Replace with:
```html
                <div class="city-pills">
                    <button type="button" class="city-pill active" data-city="all">All cities</button>
                    <button type="button" class="city-pill" data-city="Zagreb">Zagreb</button>
                    <button type="button" class="city-pill" data-city="Dubrovnik">Dubrovnik</button>
                    <button type="button" class="city-pill" data-city="Split">Split</button>
                    <button type="button" class="city-pill" data-city="Zadar">Zadar</button>
                </div>
                <div id="insight-strip-guides" class="insight-strip"></div>
                <div class="table-card">
```

Note: there are two `.city-pills` blocks in `index.html` (P&L and Guides use the same markup) — make sure this edit targets the one inside `#mgmt-guides` (the second occurrence, immediately followed by `<div class="table-card">`), not the P&L one.

- [ ] **Step 2: Import the helper and call it from `renderGuideTable`**

In `src/pages/management/guides.js`, change:
```js
import { getGlobalDate, getCityColor } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, gmClass,
    get25, guidesForCity,
    filterMgmtByDate, filterStatsByDate,
} from './helpers.js';
```
to:
```js
import { getGlobalDate, getCityColor } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, gmClass,
    get25, guidesForCity,
    filterMgmtByDate, filterStatsByDate,
    computeFilteredKpis, computeCity25,
    renderInsightCallouts,
} from './helpers.js';
```

In `renderGuideTable(city)`, find the line that closes the legend block:
```js
    const legendEl = document.getElementById('guide-legend');
    if (legendEl) {
```
Add immediately before it:
```js
    renderInsightCallouts(computeFilteredKpis(city), computeCity25(city), 'insight-strip-guides');

    const legendEl = document.getElementById('guide-legend');
    if (legendEl) {
```

This one call site covers all three ways `renderGuideTable` is already invoked today: `initGuides()`, `refreshGuides()`, `mgmtSort()`, and `mgmtFilterCityPl()` (in `index.js`) — no changes needed in those functions.

- [ ] **Step 3: Build and verify in browser**

Run: `npm run build`. Go to Management → Guides. Confirm an insight strip (Revenue/Gross Margin/GM% vs 2025 pills) appears between the city pills and the table. Click each city pill in turn and confirm the pills' values change to match that city's scope (cross-check against the P&L tab's own city-scoped pills for the same city, since both use `computeFilteredKpis`/`computeCity25`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/management/guides.js index.html
git commit -m "feat: add insight strip to Guides tab"
```

---

### Task 9: Insight strip on the Channels tab

**Files:**
- Modify: `src/pages/management/channels.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `renderInsightCallouts` (Task 7).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the container div in `index.html`**

Find (inside `#mgmt-channels`, this is the block Task 6 already modified):
```html
            <div class="main">
                <div id="biggest-mover-channels" class="action-panel mb-24"></div>

                <h2 class="mgmt-section-title">Commission Waterfall by Source</h2>
```
Replace with:
```html
            <div class="main">
                <div id="insight-strip-channels" class="insight-strip"></div>
                <div id="biggest-mover-channels" class="action-panel mb-24"></div>

                <h2 class="mgmt-section-title">Commission Waterfall by Source</h2>
```

- [ ] **Step 2: Import the helper and call it**

Change the `channels.js` import (as modified by Task 6):
```js
import {
    fmt, fmtEur, dd, gmClass,
    guidesForCity, filterMgmtByDate,
    makeBarChart, makeLineChart, getThemeColors,
    findBiggestNegativeMover,
} from './helpers.js';
```
to:
```js
import {
    fmt, fmtEur, dd, gmClass,
    guidesForCity, filterMgmtByDate,
    makeBarChart, makeLineChart, getThemeColors,
    findBiggestNegativeMover, renderInsightCallouts,
} from './helpers.js';
```

Replace:
```js
export function initChannels() {
    renderBiggestMoverChannel();
    renderCommissionWaterfall();
    renderDirectOtaTrend();
    renderOtaSourceTable();
    renderTourTypeTable();
}
```
with:
```js
function renderChannelsInsightStrip() {
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    renderInsightCallouts(kpiTotals26.mgmt, mgmt25, 'insight-strip-channels');
}

export function initChannels() {
    renderChannelsInsightStrip();
    renderBiggestMoverChannel();
    renderCommissionWaterfall();
    renderDirectOtaTrend();
    renderOtaSourceTable();
    renderTourTypeTable();
}
```

Replace:
```js
export function refreshChannels() {
    renderBiggestMoverChannel();
    renderDirectOtaTrend();
}
```
with:
```js
export function refreshChannels() {
    renderChannelsInsightStrip();
    renderBiggestMoverChannel();
    renderDirectOtaTrend();
}
```

- [ ] **Step 3: Build and verify in browser**

Run: `npm run build`. Go to Management → Channels. Confirm the insight strip appears above the biggest-mover callout, with values matching the company-wide (unfiltered) totals — cross-check Revenue/GM against the P&L tab's KPI cards when P&L's city filter is set to "All cities" AND the date-through picker is set to today (P&L is date-filtered, Channels is not, so they only match exactly when the cutoff date equals the latest date in the data — this is expected, pre-existing behavior, not a bug to chase).

- [ ] **Step 4: Commit**

```bash
git add src/pages/management/channels.js index.html
git commit -m "feat: add insight strip to Channels tab"
```

---

### Task 10: Insight strip on the Operational tab

**Files:**
- Modify: `src/pages/management/ops.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `renderInsightCallouts` (Task 7).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the container div in `index.html`**

Find (inside `#mgmt-ops`):
```html
            <div class="main">
                <h2 class="mgmt-section-title">Group Size Efficiency &#x2014; The Key Driver</h2>
```
Replace with:
```html
            <div class="main">
                <div id="insight-strip-ops" class="insight-strip"></div>

                <h2 class="mgmt-section-title">Group Size Efficiency &#x2014; The Key Driver</h2>
```

- [ ] **Step 2: Import the helper and call it**

In `src/pages/management/ops.js`, change:
```js
import { getGlobalDate } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, deltaClass,
    filterMgmtByDate,
    makeBarChart, makeLineChart, axisDefaults, getThemeColors,
} from './helpers.js';
```
to:
```js
import { getGlobalDate } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, deltaClass,
    filterMgmtByDate,
    makeBarChart, makeLineChart, axisDefaults, getThemeColors,
    renderInsightCallouts,
} from './helpers.js';
```

Add this function right after the `MONTH_SHORT` constant, before `export function initOps() {`:
```js
function renderOpsInsightStrip() {
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    renderInsightCallouts(kpiTotals26.mgmt, mgmt25, 'insight-strip-ops');
}
```

In `initOps()`, add a call as the first line of the function body:
```js
export function initOps() {
    renderOpsInsightStrip();
    const mgmt26 = kpiTotals26.mgmt;
```

In `refreshOps()`, replace:
```js
export function refreshOps() {
    renderPaymentMethod();
}
```
with:
```js
export function refreshOps() {
    renderOpsInsightStrip();
    renderPaymentMethod();
}
```

- [ ] **Step 3: Build and verify in browser**

Run: `npm run build`. Go to Management → Operational. Confirm the insight strip appears at the top of the tab, above "Group Size Efficiency". Confirm the Small Group Problem panel (below the GM% chart) is completely unchanged from Task 1's fix — this task must not touch `renderPaxBandActionPanel`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/management/ops.js index.html
git commit -m "feat: add insight strip to Operational tab"
```

---

### Task 11: Insight strip + biggest-mover callout on the Cities tab

**Files:**
- Modify: `src/pages/management/cities.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `renderInsightCallouts` (Task 7), `findBiggestNegativeMover` (Task 5).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the container divs in `index.html`**

Find (inside `#mgmt-cities`):
```html
            <div class="main">
                <h2 class="mgmt-section-title">City Overview &#x2014; 2026 YTD</h2>
```
Replace with:
```html
            <div class="main">
                <div id="insight-strip-cities" class="insight-strip"></div>
                <div id="biggest-mover-cities" class="action-panel mb-24"></div>

                <h2 class="mgmt-section-title">City Overview &#x2014; 2026 YTD</h2>
```

- [ ] **Step 2: Import the helpers**

In `src/pages/management/cities.js`, change:
```js
import { CITIES, getGlobalDate } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, deltaClass, gmClass,
    filterStatsByDate, computeFilteredKpis, computeCity25,
    makeBarChart,
} from './helpers.js';
```
to:
```js
import { CITIES, getGlobalDate } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, deltaClass, gmClass,
    filterStatsByDate, computeFilteredKpis, computeCity25,
    makeBarChart,
    renderInsightCallouts, findBiggestNegativeMover,
} from './helpers.js';
```

- [ ] **Step 3: Render both, at the top of `renderCitiesTab()`**

Find the start of `renderCitiesTab()`:
```js
export function renderCitiesTab() {

    let cardsHtml = '';
```
Replace with:
```js
export function renderCitiesTab() {
    renderInsightCallouts(computeFilteredKpis('all'), computeCity25('all'), 'insight-strip-cities');
    renderBiggestMoverCity();

    let cardsHtml = '';
```

Add this new function right after `renderCitiesTab()` closes (before the `// Helper functions — not exported` comment):
```js
function renderBiggestMoverCity() {
    const el = document.getElementById('biggest-mover-cities');
    if (!el) return;

    const entries = CITIES.map(city => {
        const c26 = computeFilteredKpis(city);
        const c25 = computeCity25(city);
        return {
            name: city,
            revenue26: c26.revenue,
            gm26: c26.grossMargin,
            revenue25: c25?.revenue || 0,
            gm25: c25?.grossMargin || 0,
        };
    });

    const mover = findBiggestNegativeMover(entries);
    el.innerHTML = mover
        ? `<strong>⚡ Biggest swing:</strong> ${mover.name} gross margin ${dd(mover.delta, true)} vs 2025 (${fmtEur(mover.gm25)} → ${fmtEur(mover.gm26)}).`
        : '';
}
```

- [ ] **Step 4: Build and verify in browser**

Run: `npm run build`. Go to Management → Cities. Confirm the insight strip and the biggest-mover callout both appear above "City Overview". Cross-check the named city and € figures in the callout against that city's own KPI card further down (the "∆ GM" line).

- [ ] **Step 5: Commit**

```bash
git add src/pages/management/cities.js index.html
git commit -m "feat: add insight strip and biggest-mover callout to Cities tab"
```

---

## Self-Review Notes

- **Spec coverage:** Item 1 → Task 1. Item 2a → Tasks 2–3. Item 2b → Task 4. Item 3 → Tasks 5, 6, 11. Item 4 → Tasks 7–11. All four spec items and their sub-parts have a task.
- **Ops panel untouched by Item 3:** Task 1 is the only task that touches `renderPaxBandActionPanel`; Tasks 6–11 add new functions/call sites elsewhere in the same files without modifying it.
- **Type/signature consistency:** `findBiggestNegativeMover(entries, minRevenue = 500)` (Task 5) is called identically (positional `entries` array, default `minRevenue`) in Task 6 and Task 11. `renderInsightCallouts(k, k25, elId = 'insight-strip')` (Task 7) is called with all three tab-specific `elId` values matching the `id` attributes added to `index.html` in Tasks 8–11 (`insight-strip-guides`, `insight-strip-channels`, `insight-strip-ops`, `insight-strip-cities`) — verified each pair matches exactly.
