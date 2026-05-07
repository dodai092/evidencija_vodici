# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static HTML dashboard tracking guide production statistics for FreeSpirit travel agency. Three tabs: full-year 2025, YTD 2026, and a 2025-vs-2026 comparison. Deployed to GitHub Pages. No build step, no framework — Chart.js 4.4.1 from CDN only.

## Development

Open `index.html` directly in a browser, or use VS Code Live Server (port 5501). There is no linting, testing, or build step.

## Monthly Data Update

Source of truth is a local Excel file (`Copy of 1.1 Evidencija prodaje 26.xlsx`) that is **not** in this repo.

```bash
source venv/bin/activate
python3 extract_guides.py --year 2026 > data-2026.js
# Verify in browser, then:
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

`extract_guides.py` reads the `helper_2026` sheet and auto-detects column positions from the header row. `data-2025.js` is a closed year — only touch it to correct historical data.

## Architecture

### File responsibilities

| File | Role |
|---|---|
| `index.html` | Nav shell + three `<div class="page">` containers. **Never edited for data updates.** |
| `guides.css` | All styles — CSS variables, dark mode, component styles |
| `shared.js` | Constants, `filteredStats()`, `showPage()`, `toggleTheme()`, `updateDateAsOf()` |
| `page-2025.js` | `Page25` object — renders TY2025 tab |
| `page-2026.js` | `Page26` object — renders TY2026 tab |
| `page-cmp.js` | `PageCmp` object — renders comparison tab + Chart.js instances |
| `data-2025.js` | Static — exports `guideStats25`, `kpiTotals25` |
| `data-2026.js` | Generated — exports `guideStats26`, `kpiTotals26` |

### Page module pattern

Each tab is a plain object (`Page25`, `Page26`, `PageCmp`) with a lazy-init pattern:

```js
const Page25 = {
    _initialized: false,
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    init() { /* first render */ this._initialized = true; },
    renderAll() { /* re-render on filter change */ },
};
```

`showPage()` in `shared.js` calls `.init()` on first visit and `.renderAll()` / `.updateCharts()` on subsequent visits.

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
  }
}
```

`kpiTotals26` / `kpiTotals25` are simple flat objects with `guides`, `freeTours`, `paidTours`, `freePax`, `paidPax`.

### Filtering and date cutoff

`GLOBAL_DATE` in `shared.js` is the as-of date (default `'2026-05-06'`). The date picker in the nav calls `updateDateAsOf()` which re-renders all initialized pages.

`filteredStats(stats, months)` in `shared.js` is the central filtering function:
- For complete months (< cutoff month): sums `byMonth` aggregates.
- For the partial current month: sums individual `byDay` entries up to `cutoffDay`.
- Falls back to full-month `byMonth` if `byDay` is absent (older 2025 data).

### Extending the comparison date range

The comparison tab (`page-cmp.js`) shows Jan–May by default. To extend to June after June data lands:

1. In `page-cmp.js`, find the `ytd()` loop and change `m <= 5` → `m <= 6`.
2. In `index.html`, update the comparison subtitle text (Croatian month name in the `<p>` under the Usporedba nav tab).

### Theme system

CSS variables on `:root`; `body.dark-mode` overrides. `toggleTheme()` persists to `localStorage`. Chart colors call `getComputedStyle` at render time, so `PageCmp.updateCharts()` must be called after a theme switch (already wired in `toggleTheme()`).

### Guide ordering

`extract_guides.py` contains `GUIDE_ORDER` — a hardcoded city → name list that controls output order in `data-2026.js`. Guides not in this list appear at the end under their city. Update this list when new guides are added permanently.

## Troubleshooting `extract_guides.py`

| Error | Cause | Fix |
|---|---|---|
| `Column "X" not found` | Header row renamed in Excel | Check column names in the sheet |
| Guide missing | Name typo or extra space in Excel | Names must match exactly |
| `ModuleNotFoundError: openpyxl` | venv not active | `source venv/bin/activate` |
