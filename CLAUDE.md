# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static HTML dashboard tracking guide production statistics for FreeSpirit travel agency. Four tabs: full-year 2025, YTD 2026, a 2025-vs-2026 comparison, and a Management financial dashboard. Deployed to GitHub Pages. Built with esbuild (ES modules → IIFE bundle). Chart.js 4.4.1 from CDN only.

## Development

```bash
npm run build      # production bundle → dist/app.js
npm run dev        # watch mode (re-bundles on save)
```

Open `index.html` directly in a browser, or use VS Code Live Server (port 5501). There is no linting or testing step.

## Monthly Data Update

Source of truth is a local Excel file (`1.1 Evidencija prodaje 26.xlsx`) that is **not** in this repo.

```bash
source venv/bin/activate
python3 scripts/extract_guides.py --year 2026 > data-2026.js
# Verify in browser (see below), then:
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

### Verifying the update in browser

Before committing, confirm the new numbers actually render correctly (not just that `extract_guides.py` ran without error):

1. Serve the directory locally (e.g. `python3 -m http.server`) and use the Playwright MCP tools to navigate to `index.html`.
2. Screenshot the 2026 tab and check the console for JS errors.
3. Compare the rendered KPI totals (guides, free/paid tours & pax) against the new `kpiTotals26` values in the freshly generated `data-2026.js` — a page that loads without errors can still show stale or mis-summed numbers.
4. Click through the 2025, Comparison, and Management tabs and screenshot each — these read the same underlying data and are where a bad `cityStats`/`filteredStats` change would surface as a KPI/chart mismatch (see the troubleshooting table below).
5. Toggle dark mode and change the date-as-of picker once to confirm `updateDateAsOf()` re-renders without breaking.

`scripts/extract_guides.py` reads the `Evidencija` sheet (2026) or `Evidencija_25` sheet (2025) and auto-detects column positions from the header row. Both years use the same Excel file: `1.1 Evidencija prodaje 26.xlsx`.

To regenerate 2025 data (rarely needed — only to correct historical data):
```bash
python3 scripts/extract_guides.py --year 2025 > data-2025.js
```

If the workbook has both years combined in a single `Evidencija` sheet (distinguished by the `Year` column) instead of a separate `Evidencija_25` tab, override the sheet explicitly:
```bash
python3 scripts/extract_guides.py --year 2025 --sheet Evidencija > data-2025.js
```
The script filters rows by the `Year` column when present, so this works correctly either way.

## Architecture

### Build pipeline

- Entry: `src/main.js`
- Output: `dist/app.js` (IIFE bundle, ~208kb)
- `data-2025.js` and `data-2026.js` are loaded as separate script tags (generated, not bundled)
- `Chart.js` loaded from CDN
- **`fs-core.js` is NOT used** — evidencija has its own JS architecture (ES modules → esbuild bundle)

### File responsibilities

| File | Role |
|---|---|
| `index.html` | Shell with 4 empty `.page` containers + management sub-nav HTML inside `#page-mgmt`. **Never edited for data updates.** |
| `../shared/fs-core.css` | Shared foundation — loads first. Variables, dark mode, nav, kpi, card, bar/owner/agency CSS. |
| `guides.css` | Evidencija-specific styles — `--radius: 8px`, filter bar, date picker, management dashboard, guide card styles, language toggle, sticky KPI bar, city/year/delta color vars. |
| `src/main.js` | Entry point — boots theme/language, exposes all `window.*` globals, registers pages |
| `src/shared.js` | Constants, `PAGES` registry, `filteredStats()`, `showPage()`, `updateDateAsOf()`, keyboard shortcuts |
| `src/i18n.js` | `TRANSLATIONS`, `t()`, `tOpposite()`, `titleAttr()` |
| `src/theme.js` | `toggleTheme()`, `toggleLanguage()`, theme/language init |
| `src/pages/page-2025.js` | `Page25` — renders TY2025 tab |
| `src/pages/page-2026.js` | `Page26` — renders TY2026 tab |
| `src/pages/page-cmp/index.js` | `PageCmp` — renders comparison tab + Chart.js instances |
| `src/pages/management/index.js` | `PageMgmt` + all management functions — P&L, Guides, Channels, Ops, Cities tabs |
| `data-2025.js` | Generated from Evidencija_25 — exports `guideStats25`, `kpiTotals25` (includes `mgmt` financial fields) |
| `data-2026.js` | Generated from Evidencija — exports `guideStats26`, `kpiTotals26` (includes `mgmt` financial fields) |
| `scripts/extract_guides.py` | Data extractor — reads Excel sheets, outputs JS. Supports --year 2025/2026. |
| `scripts/append_guides.py` | Appends new guide data entries |

### Page module pattern

Each tab is a plain object with a lazy-init pattern registered in `PAGES`:

```js
const Page25 = {
    _initialized: false,
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    init() { /* generate DOM, call renderAll() */ },
    renderAll() { /* re-render on filter/date change */ },
};
```

`showPage()` in `shared.js` calls `.init()` on first visit and `.renderAll()` on subsequent visits. Management uses `PageMgmt` which delegates to `mgmtShowTab('pl', el)` on first visit.

### Management tab

The Management tab (`#page-mgmt`) is fully static HTML in `index.html` — the 5 mgmt sub-pages (`mgmt-pl`, `mgmt-guides`, `mgmt-channels`, `mgmt-ops`, `mgmt-cities`) and the `.mgmt-subnav` are pre-rendered. `mgmtShowTab(id, el)` in `src/pages/management/index.js` handles sub-tab switching with lazy init per sub-tab.

The `.mgmt-subnav` is `position: sticky; top: 56px` (just below the main nav). `#sticky-kpi-bar` is `position: fixed` and JS-positioned to `nav.offsetHeight` on mount.

### Data shape

Each guide entry in `guideStats25` / `guideStats26`:

```js
{
  name: "Guide Name",
  city: "Zagreb",            // Zagreb | Dubrovnik | Split | Zadar | Unknown
  stats: {
    eng: {
      free: { tours, pax },
      paid: { tours, pax },
      byType: { [typeName]: { tours, pax } },
      byMonth: { [1..12]: { name, free: { tours, pax }, paid: { tours, pax } } },
      byDay:   { ["m-d"]: { free, paid } }  // present in 2026 data; enables partial-month cutoff
    },
    esp: { /* same shape */ },
    fra: { /* same shape */ },
    all: { /* aggregate across languages */ },
  },
  mgmt: { /* financial fields: revenue, vendorCost, grossMargin, byDay, bySource, ... */ }
}
```

`kpiTotals26` / `kpiTotals25` are flat objects with `guides`, `freeTours`, `paidTours`, `freePax`, `paidPax`, and a `mgmt` sub-object with aggregates.

### City totals (`cityStats25` / `cityStats26`)

Every city-based chart or KPI (Free/Paid Pax by City, Free Pax by Month and City, the top KPI cards) must read from `cityStats25` / `cityStats26`, **not** by grouping `guideStats*` by each guide's `city` field. A guide's `city` field is only their assigned home city (from `GUIDE_ORDER`, used purely to group/order their card in the guide list) — a guide can tour in a different city than their assignment, and guides missing from `GUIDE_ORDER` fall back to `city: "Unknown"`. Summing by guide's `city` silently mis-attributes or drops pax from any such tour.

`cityStats{suffix}` is built in `extract_guides.py` from each row's own `City` column, independent of vendor/guide identity:

```js
const cityStats26 = {
  Zagreb:     { eng: {...}, esp: {...}, fra: {...}, all: {...} },  // same shape as a guideStats stats-per-lang object
  Dubrovnik:  { ... },
  Split:      { ... },
  Zadar:      { ... },
  // + any other raw City code present in the sheet (e.g. 'pu'/'rv' = Pula/Rovinj) — out of this report's scope, see below
};
```

**Report scope is strictly the 4 tracked cities** (Zagreb, Dubrovnik, Split, Zadar) — `CITIES` in `shared.js`. Any row whose `City` column maps to something else (e.g. `pu`/Pula, `rv`/Rovinj) is excluded from every city-scoped total consistently: KPI cards, city charts/tables, and guide-city filters. All `updateKPIs()` implementations and any `mergedGuides`/`guideStats*` filtering by city must include `CITIES.includes(g.city)` (or sum only over `CITIES`) so headline numbers always equal the sum of the city breakdown — never sum "all guides" and expect it to match a city-scoped chart.

### Filtering and date cutoff

`GLOBAL_DATE` in `shared.js` is the as-of date, defaulting to today's date. The date picker in the nav calls `updateDateAsOf()` which re-renders all initialized pages including management.

`filteredStats(stats, months)` in `shared.js` is the central filtering function:
- For complete months (< cutoff month): sums `byMonth` aggregates.
- For the partial current month: sums individual `byDay` entries up to `cutoffDay`.
- Falls back to full-month `byMonth` if `byDay` is absent (older 2025 data).

### The comparison date range

The comparison tab (`page-cmp/index.js`) computes its range label and month dropdown automatically from `getCutoffMonth()` (or the active month filter) on every render — the `Jan–Jun` text in `index.html`'s `.ytd-range-label` spans is only a pre-JS placeholder. No source edit or rebuild is needed as new months land; a data-only update is sufficient. (This used to require a manual edit; fixed in `61e73ba` — don't reintroduce a hardcoded range.)

### Theme system

CSS variables and `body.dark-mode` overrides are defined in `../shared/fs-core.css`. Evidencija-specific color vars (`--radius`, city colors, delta colors, etc.) stay in `guides.css`. `toggleTheme()` in `src/theme.js` persists to `localStorage` and updates all initialized page charts including management. The SVG sun/moon theme button uses `.theme-toggle-icon` class — styled by `fs-core.css`.

### Guide ordering

`extract_guides.py` contains `GUIDE_ORDER` — a hardcoded city → name list that controls output order in `data-2026.js` and which city a guide's own card is grouped under in the guide list. Guides not in this list get `city: "Unknown"` and appear at the end. Update this list when new guides are added permanently.

This list has **no effect on city-scoped totals** (KPI cards, city charts) — those come from `cityStats*`, built from each row's real `City` column. A guide missing from `GUIDE_ORDER` will show up in the wrong section of the guide list (or not at all, since `"Unknown"` isn't rendered), but their pax still count correctly under the right city everywhere else.

## Troubleshooting `extract_guides.py`

| Error | Cause | Fix |
|---|---|---|
| `Column "X" not found` | Header row renamed in Excel | Check column names in the sheet |
| Guide missing | Name typo or extra space in Excel | Names must match exactly |
| `ModuleNotFoundError: openpyxl` | venv not active | `source venv/bin/activate` |
| KPI card total ≠ sum of city chart/table | Something is summing `guideStats*` grouped by guide's `city` instead of reading `cityStats*` | See "City totals" above — use `cityStats*`, and scope every "all cities" sum to `CITIES` only |
