# Date-Aware Filtering for Management Dashboard

**Date:** 2026-05-14  
**Objective:** Enable all graphs on management.html to adapt to the date picker, showing data only up to the chosen date with daily precision.

---

## Current State

### What works
- P&L tab: KPI cards adapt to chosen date (month precision)
- P&L tab: Monthly tables adapt to chosen date (month precision)
- Date picker exists and updates `GLOBAL_DATE`
- `mgmtRefreshAll()` re-renders all initialized tabs when date changes

### What doesn't work
- P&L tab: "POS vs CPP" chart and financial cards (Direct/OTA) show full-year data
- Guides tab: Adapts to month, not exact date
- Channels tab: No date adaptation
- Ops tab: No date adaptation

### Data structure gap
- Guide statistics have `byDay` (daily breakdown: `"m-d"` keys)
- Financial data (mgmt) has only `byMonth` (monthly aggregation)
- Need to enhance extraction to create `mgmt.byDay` for daily financial filtering

---

## Solution Design

### Phase 1: Enhanced Data Extraction

**File:** `scripts/extract_guides.py`

**Changes:**
1. When processing each row, if a valid date exists (column C_DATE), extract the day number
2. Aggregate financial metrics into `mgmt.byDay` alongside `mgmt.byMonth`:
   - Key format: `"m-d"` (e.g., `"5-14"` for May 14)
   - Values: same financial entry structure as `byMonth` (revenue, vendorCost, grossMargin, tourCost, commissionCost, processingFee, vatAmount, amountBeforeTax)
3. Update `to_plain_mgmt()` to include `byDay` in output
4. Regenerate both `data-2025.js` and `data-2026.js`

**Example output structure:**
```javascript
{
  "mgmt": {
    "revenue": 36204.0,
    "vendorCost": 13785.0,
    "byMonth": {
      "1": { revenue: 5000, vendorCost: 2000, ... },
      "5": { revenue: 8200, vendorCost: 3100, ... }
    },
    "byDay": {
      "1-15": { revenue: 2500, vendorCost: 1000, ... },
      "5-14": { revenue: 500, vendorCost: 200, ... },
      "5-15": { revenue: 600, vendorCost: 250, ... }
    },
    "byChannel": { ... },
    "bySource": { ... }
  }
}
```

### Phase 2: Filtering Helpers

**File:** `management.js`

**New functions:**

#### `filterMgmtByDate(mgmt, cutoffDateStr)`
Filters financial data to cutoff date.
- **Input:** mgmt object and date string (e.g., `"2026-05-14"`)
- **Output:** Aggregated financial totals summing all `byDay` entries ≤ cutoff
- **Logic:**
  - Parse cutoffDate to extract month and day
  - Iterate `mgmt.byDay` entries
  - Include entry if `entry_month < cutoff_month OR (entry_month == cutoff_month AND entry_day <= cutoff_day)`
  - Return summed totals: `{ revenue, vendorCost, grossMargin, tourCost, commissionCost, processingFee, vatAmount, amountBeforeTax }`

#### `filterStatsByDate(stats, cutoffDateStr)`
Filters tour statistics to cutoff date.
- **Input:** stats.all object and date string
- **Output:** Aggregated tour totals (freeTours, paidTours, freePax, paidPax)
- **Logic:**
  - Similar to filterMgmtByDate but for tour counts
  - Sum from `byDay` and `byMonth` up to cutoff

### Phase 3: Render Function Updates

**File:** `management.js`

Update each render function to use filtered data:

1. **`renderPlKpis(city)`** — P&L KPI cards
   - For each guide in city: call `filterMgmtByDate(g.mgmt, GLOBAL_DATE)`
   - Sum filtered results for KPI display

2. **`renderWaterfall()`** — Waterfall chart (revenue → costs → profit)
   - Filter each financial component to cutoff date
   - Re-draw Chart.js waterfall with filtered data

3. **`renderMonthTrend()`** — Monthly P&L trend line
   - Build month array up to cutoff month
   - For cutoff month, use filtered day data (not full month)
   - Re-draw Chart.js line chart

4. **`renderBillingTrend()`** — Direct/OTA revenue comparison
   - Filter `mgmt.byChannel` data by date
   - Update card values and delta calculations

5. **`renderGuideTable()`** — Guides tab table
   - Filter guide stats to cutoff date
   - Re-render table rows with filtered totals

6. **`renderDirectOtaTraend()`** — Channels tab trend
   - Filter by-channel data to cutoff date
   - Re-draw Chart.js chart

7. **`renderOpsMonthLine()`** — Ops tab monthly line
   - Filter stats to cutoff date
   - Re-draw Chart.js chart

### Phase 4: Workflow

1. Run `python3 scripts/extract_guides.py --year 2026 > data-2026.js`
2. Run `python3 scripts/extract_guides.py --year 2025 > data-2025.js`
3. Verify extraction includes `byDay` for mgmt in both files
4. Update management.js with filter helpers
5. Update all 7 render functions
6. Test date picker changes → all tabs adapt to exact date

---

## Data Model Examples

### Before (current)
```javascript
guide.mgmt = {
  revenue: 36204.0,
  byMonth: {
    "1": { revenue: 5000, vendorCost: 2000, grossMargin: 3000, ... },
    "5": { revenue: 8200, vendorCost: 3100, grossMargin: 5100, ... }
  },
  byChannel: { ... }
}
```

### After (with daily data)
```javascript
guide.mgmt = {
  revenue: 36204.0,
  byMonth: { ... }, // unchanged
  byDay: {
    "1-15": { revenue: 2500, vendorCost: 1000, grossMargin: 1500, ... },
    "1-16": { revenue: 2500, vendorCost: 1000, grossMargin: 1500, ... },
    "5-14": { revenue: 500, vendorCost: 200, grossMargin: 300, ... },
    "5-15": { revenue: 600, vendorCost: 250, grossMargin: 350, ... }
  },
  byChannel: { ... } // unchanged
}
```

---

## Success Criteria

- ✅ When user picks May 15, 2026: all graphs show Jan 1 – May 15 data only
- ✅ When user picks March 1, 2026: all graphs show Jan 1 – Mar 1 data only
- ✅ Data is filtered to exact day, not just month-end
- ✅ All 4 tabs (P&L, Guides, Channels, Ops) respond to date changes
- ✅ Date picker updates reflect immediately in all charts and KPIs
- ✅ Waterfall, trend lines, and comparison cards all update correctly

---

## Assumptions

1. Excel source (`Copy of 1.1 Evidencija prodaje 26.xlsx`) has a Date column (column C_DATE) with valid date values for all rows
2. All rows have a month (required) and many have a day (optional); rows without days fall back to month-level aggregation
3. Financial data exists at the same granularity as guide stats (one row per transaction/tour)
4. No pre-computed year-to-date totals in the Excel; all aggregation happens in extraction

---

## Files Modified

1. `scripts/extract_guides.py` — Add `byDay` aggregation for mgmt
2. `data-2025.js` — Regenerated with daily financial data
3. `data-2026.js` — Regenerated with daily financial data
4. `management.js` — Add filters and update render functions

---

## Notes

- Backward compatibility: `byMonth` remains unchanged; existing code using it continues to work
- `mgmtRefreshAll()` already calls all render functions; no changes needed to the refresh orchestration
- Theme updates (`mgmtUpdateCharts()`) continue to work unchanged
- Chart.js instances are destroyed and recreated on filter change (existing pattern)
