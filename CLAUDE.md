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

Source of truth is a local Excel file (`Copy of 1.1 Evidencija prodaje 26.xlsx`) that is **not** in this repo.

```bash
source venv/bin/activate
python3 scripts/extract_guides.py --year 2026 > data-2026.js
# Verify in browser, then:
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

`scripts/extract_guides.py` reads the `Evidencija` sheet (2026) or `Evidencija_25` sheet (2025) and auto-detects column positions from the header row. Both years use the same Excel file: `Copy of 1.1 Evidencija prodaje 26.xlsx`.

To regenerate 2025 data (rarely needed — only to correct historical data):
```bash
python3 scripts/extract_guides.py --year 2025 > data-2025.js
```

## Architecture

### Build pipeline

- Entry: `src/main.js`
- Output: `dist/app.js` (IIFE bundle, ~208kb)
- `data-2025.js` and `data-2026.js` are loaded as separate script tags (generated, not bundled)
- `Chart.js` loaded from CDN

### File responsibilities

| File | Role |
|---|---|
| `index.html` | Shell with 4 empty `.page` containers + management sub-nav HTML inside `#page-mgmt`. **Never edited for data updates.** |
| `guides.css` | All styles — CSS variables, dark mode, management dashboard, component styles |
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

### Filtering and date cutoff

`GLOBAL_DATE` in `shared.js` is the as-of date (default `'2026-05-06'`). The date picker in the nav calls `updateDateAsOf()` which re-renders all initialized pages including management.

`filteredStats(stats, months)` in `shared.js` is the central filtering function:
- For complete months (< cutoff month): sums `byMonth` aggregates.
- For the partial current month: sums individual `byDay` entries up to `cutoffDay`.
- Falls back to full-month `byMonth` if `byDay` is absent (older 2025 data).

### Extending the comparison date range

The comparison tab (`page-cmp/index.js`) shows Jan–May by default. To extend to June after June data lands:

1. In `src/pages/page-cmp/index.js`, update the `_buildHeader()` method:
   - Change the subtitle text from `Jan–May` to `Jan–Jun`
   - Update the `ytd()` loop if it exists: change `m <= 5` → `m <= 6`

### Theme system

CSS variables on `:root`; `body.dark-mode` overrides. `toggleTheme()` in `src/theme.js` persists to `localStorage` and updates all initialized page charts including management.

### Guide ordering

`extract_guides.py` contains `GUIDE_ORDER` — a hardcoded city → name list that controls output order in `data-2026.js`. Guides not in this list appear at the end under their city. Update this list when new guides are added permanently.

## Troubleshooting `extract_guides.py`

| Error | Cause | Fix |
|---|---|---|
| `Column "X" not found` | Header row renamed in Excel | Check column names in the sheet |
| Guide missing | Name typo or extra space in Excel | Names must match exactly |
| `ModuleNotFoundError: openpyxl` | venv not active | `source venv/bin/activate` |
