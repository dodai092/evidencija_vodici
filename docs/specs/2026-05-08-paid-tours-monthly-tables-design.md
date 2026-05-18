# Paid Tours Monthly Breakdown Tables — Design Spec

**Date:** 2026-05-08  
**Scope:** Comparison tab (`page-cmp.js`) — two new monthly breakdown tables, one per paid tour chart section.

---

## What We're Building

Two read-only summary tables appended below the existing paid-type bar charts on the comparison tab. Each table shows, per month, how 2025 and 2026 compare across three metrics: tour count, PAX, and average PAX per tour.

- **Private Paid Tours table** — primary emphasis on Tours (placed below `privatePaidChart-cmp`)
- **Shared Paid Tours table** — primary emphasis on PAX (placed below `sharedPaidChart-cmp`)

---

## Table Structure

**Rows:** Jan → cutoff month (one row per month). Partial month marked with `*`. Total row at bottom.

**Columns:** Three metric groups, each with four sub-columns:

```
Month | ── Tours ─────────────── | ── PAX ──────────────────── | ── Avg PAX ─────────────────
      | '25   '26    ±     ±%    | '25   '26     ±      ±%     | '25   '26     ±      ±%
Jan   |  26    15   -11  -42%   |  118    68   -50    -42%    |  4.5   4.5    —       —
Feb   |  23    19    -4  -17%   |  101    87   -14    -14%    |  4.4   4.6   +0.2    +5%
```

- `±` = absolute difference (`'26 - '25`)
- `±%` = relative difference (`± / '25 * 100`), shown as `—` when `'25 = 0`
- Avg PAX = `pax / tours`, rounded to 1 decimal; shown as `—` when tours = 0
- Primary emphasis column header (Tours for private, PAX for shared) gets a subtle bold/accent treatment

---

## Filters

Tables respond to:
- **City pills** — per-chart (`activePrivateCity` / `activeSharedCity`)
- **Type pills** — per-chart (`activePrivateType` / `activeSharedType`)
- **Language filter** — global `activeLang`
- **Date cutoff** — `GLOBAL_DATE` (same as charts)

No new filter state needed — all four are already passed into or read by `_getTypeMonthData()`.

---

## Implementation Plan

### `index.html`

Add a `<div>` placeholder inside each chart-card block, directly after the `<canvas>`:

```html
<!-- inside private paid chart-card, after <canvas id="privatePaidChart-cmp"> -->
<div id="private-type-table-cmp"></div>

<!-- inside shared paid chart-card, after <canvas id="sharedPaidChart-cmp"> -->
<div id="shared-type-table-cmp"></div>
```

### `page-cmp.js`

Add a new function `renderPaidTypeTable(containerId, city, typeFilter, allTypes, primaryMetric)`:

1. Resolve `types` from `typeFilter` / `allTypes` (same as `buildTypeChart`)
2. Call `this._getTypeMonthData(city, types, 'tours', 25)` and `..., 26)` → gives `{ primary: tours, secondary: pax }` per month
3. Compute avg PAX per month per year: `pax / tours || 0`
4. Build HTML string using `.mpax-table` structure:
   - Three `<th colspan="4">` group headers: `Tours`, `PAX`, `Avg PAX`
   - Sub-header row: `'25 / '26 / ± / ±%` × 3
   - Body rows: one per month
   - Total row: summed tours/PAX, recalculated avg from totals
5. Inject into `containerId`

Call `renderPaidTypeTable` from `updatePaidTypeCharts()`, after each `buildTypeChart` call:

```js
buildTypeChart('privatePaidChart-cmp', ..., 'tours');
renderPaidTypeTable('private-type-table-cmp', this.activePrivateCity, this.activePrivateType, this.PRIVATE_TYPES, 'tours');

buildTypeChart('sharedPaidChart-cmp', ..., 'tours');
renderPaidTypeTable('shared-type-table-cmp', this.activeSharedCity, this.activeSharedType, this.SHARED_TYPES, 'pax');
```

### `guides.css`

Reuse `.mpax-table`, `.mpax-sub-head`, `.mpax-total`, `.mpax-month`, `.pos`, `.neg`, `.neu`.

Add metric group header style (new class `.mpax-metric-head`):
- Neutral background (`var(--smoke)`)
- `var(--text2)` text color, bold, small caps
- Primary metric column (`primaryMetric === 'tours'` → Tours group; `=== 'pax'` → PAX group) gets a slightly darker or accented header to signal primary emphasis

---

## Delta Formatting

Shared with existing `fmtDelta` pattern:
- `diff > 0` → class `pos`, prefix `+`
- `diff < 0` → class `neg`
- `diff = 0` → class `neu`, show `—`
- `'25 = 0 && '26 = 0` → `—` in all cells

Avg PAX delta formatted to 1 decimal (e.g. `+0.3`, `-1.2`).

---

## Out of Scope

- No city breakdown within these tables (city is a filter, not a column dimension)
- No per-guide breakdown
- No chart-type toggle on the table itself
