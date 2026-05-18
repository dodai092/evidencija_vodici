# Implementation Plan: Date-Aware Filtering for Management Dashboard

## Overview
Implement daily-precision date filtering across all management dashboard tabs (P&L, Guides, Channels, Ops) by enhancing data extraction and adding filter helpers.

---

## Phase 1: Data Extraction Enhancement

### Task 1.1: Modify extract_guides.py to add byDay aggregation
**File:** `scripts/extract_guides.py`

**Steps:**
1. Locate the `empty_mgmt()` function and add `'byDay': defaultdict(_fin_entry)` if not already present
2. In the row processing loop, after extracting `month`, extract `day` from the date column (already does this for stats; replicate for mgmt)
3. Create a function `add_mgmt_fin_row(mgmt, month, day, financial_values)` that aggregates into both `byMonth[str(month)]` and `byDay["m-d"]`
4. Call this function for each row instead of the current direct aggregation
5. Verify `to_plain_mgmt()` includes `byDay` in output (add if missing)

**Verification:**
- Run extraction with `--year 2026` and grep for `"byDay"` in output
- Spot-check a few day entries (e.g., `"1-15"`, `"5-14"`) to ensure financial data is present

---

### Task 1.2: Regenerate data files
**Files:** `data-2025.js`, `data-2026.js`

**Steps:**
1. Activate venv: `source venv/bin/activate`
2. Extract 2026: `python3 scripts/extract_guides.py --year 2026 > data-2026.js`
3. Extract 2025: `python3 scripts/extract_guides.py --year 2025 > data-2025.js`
4. Verify both files are valid JavaScript (no syntax errors)
5. Check file size increased (due to new `byDay` entries)
6. Commit: `git add data-2025.js data-2026.js && git commit -m "Regenerate: add daily financial data (byDay)"`

---

## Phase 2: Filter Helpers in management.js

### Task 2.1: Add filterMgmtByDate helper
**File:** `management.js`

**Location:** After line 90 (`_sumStatMonths` function)

**Code to add:**
```javascript
function filterMgmtByDate(mgmt, cutoffDate) {
    if (!mgmt || !cutoffDate) return _fin_entry();
    
    const [year, monthStr, dayStr] = cutoffDate.split('-');
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay = parseInt(dayStr);
    
    const acc = _fin_entry();
    if (!mgmt.byDay) return acc;
    
    for (const [key, val] of Object.entries(mgmt.byDay)) {
        const [m, d] = key.split('-').map(Number);
        if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
            for (const f of _FIN_FIELDS) {
                acc[f] += val[f] || 0;
            }
        }
    }
    return acc;
}
```

**Verification:**
- Call with test date: `filterMgmtByDate(guideStats26[0].mgmt, "2026-05-14")` should return aggregated data
- Compare output with full-period aggregation to ensure sums are consistent

---

### Task 2.2: Add filterStatsByDate helper
**File:** `management.js`

**Location:** After filterMgmtByDate

**Code to add:**
```javascript
function filterStatsByDate(stats, cutoffDate) {
    if (!stats || !cutoffDate) return { freeTours: 0, paidTours: 0, freePax: 0, paidPax: 0 };
    
    const [year, monthStr, dayStr] = cutoffDate.split('-');
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay = parseInt(dayStr);
    
    let freeTours=0, paidTours=0, freePax=0, paidPax=0;
    
    if (stats.byDay) {
        for (const [key, val] of Object.entries(stats.byDay)) {
            const [m, d] = key.split('-').map(Number);
            if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
                freeTours += val.free?.tours || 0;
                paidTours += val.paid?.tours || 0;
                freePax += val.free?.pax || 0;
                paidPax += val.paid?.pax || 0;
            }
        }
    }
    return { freeTours, paidTours, freePax, paidPax };
}
```

**Verification:**
- Test with sample data
- Ensure month < cutoff and exact cutoff date both work

---

## Phase 3: Render Function Updates

### Task 3.1: Update renderPlKpis
**File:** `management.js`

**Current logic:** Sums full guide mgmt data via `_sumMgmtMonths(g.mgmt, cutoff)`

**Changes:**
1. Replace `_sumMgmtMonths(g.mgmt, cutoff)` calls with `filterMgmtByDate(g.mgmt, GLOBAL_DATE)`
2. Update KPI card values: revenue, grossMargin, tourCost, commissionCost, vatAmount
3. Test: Pick May 14 → verify KPI values match expected filtered totals

---

### Task 3.2: Update renderWaterfall
**File:** `management.js`

**Current logic:** Chart.js waterfall showing revenue → costs → profit progression

**Changes:**
1. Filter financial data before passing to chart: `filterMgmtByDate(allGuidesData.mgmt, GLOBAL_DATE)`
2. Recalculate chart segment values from filtered data
3. Destroy and recreate Chart.js instance
4. Test: Date change → waterfall shrinks/grows to match cutoff

---

### Task 3.3: Update renderMonthTrend
**File:** `management.js`

**Current logic:** Line chart showing P&L by month

**Changes:**
1. Build month array: loop months 1 to cutoffMonth
2. For months < cutoffMonth: use full `byMonth[m]` aggregates
3. For month == cutoffMonth: sum only `byDay` entries where day <= cutoffDay
4. Update Chart.js datasets with filtered monthly values
5. Destroy and recreate chart instance
6. Test: Picking May 14 shows partial May; picking May 31 shows full May

---

### Task 3.4: Update renderBillingTrend
**File:** `management.js`

**Current logic:** Cards showing Direct (POS) vs OTA (CPP) revenue and margins

**Changes:**
1. Filter all guides' financial data to cutoff date
2. Sum by billing method (POS/CPP) from filtered data
3. Update card values: revenue, margin %, delta vs 2025
4. Re-calculate comparison to 2025 (also filter 2025 data same way)
5. Test: Date change updates card values immediately

---

### Task 3.5: Update renderGuideTable
**File:** `management.js`

**Current logic:** Table showing guide stats by language/type/month

**Changes:**
1. For each guide, filter stats: `filterStatsByDate(g.stats.all, GLOBAL_DATE)`
2. Use filtered freeTours, paidTours, freePax, paidPax for table rows
3. Re-render table rows
4. Test: Date change → table totals shrink to match cutoff

---

### Task 3.6: Update renderDirectOtaTraend
**File:** `management.js`

**Current logic:** Channels tab trend chart

**Changes:**
1. Filter financial data by channel (web, OTA, free, b2b) to cutoff date
2. Build datasets for Chart.js with filtered channel data
3. Destroy and recreate chart
4. Test: Date change → channel chart updates

---

### Task 3.7: Update renderOpsMonthLine
**File:** `management.js`

**Current logic:** Ops tab monthly trend

**Changes:**
1. Filter stats to cutoff date: `filterStatsByDate(stats, GLOBAL_DATE)`
2. Build monthly arrays up to cutoffMonth
3. Partial month uses filtered day data
4. Update Chart.js line chart
5. Test: Date change → ops chart responds

---

## Phase 4: Integration & Testing

### Task 4.1: Verify mgmtRefreshAll still works
**File:** `management.js`

**Steps:**
1. Ensure `mgmtRefreshAll()` calls all 7 updated render functions
2. No changes needed — it already does (lines 1151–1159)
3. Test: Change date picker → all tabs re-render if initialized

---

### Task 4.2: Manual testing — all 4 tabs
**Test cases:**

1. **P&L tab:**
   - Pick May 14 → KPI cards show filtered totals
   - Waterfall chart shows Jan–May 14 breakdown
   - Monthly trend line ends at partial May
   - Direct/OTA cards update with filtered revenue
   
2. **Guides tab:**
   - Pick May 14 → table shows tours/pax up to May 14
   - Totals match filtered stats

3. **Channels tab:**
   - Pick May 14 → channel trend chart shows filtered data
   - Web/OTA/etc. totals reflect May 14 cutoff

4. **Ops tab:**
   - Pick May 14 → ops chart shows filtered data
   - Monthly breakdown shows partial May

5. **Edge cases:**
   - Pick Jan 1 → only Jan 1 data shown
   - Pick Dec 31 → full year shown
   - Theme toggle → chart colors update (existing behavior)

---

## Commit Strategy

**Commit 1:** Data extraction
```
git add scripts/extract_guides.py data-2025.js data-2026.js
git commit -m "Add daily financial data (byDay) to extracted guide stats"
```

**Commit 2:** Filter helpers
```
git add management.js
git commit -m "Add filterMgmtByDate and filterStatsByDate helpers"
```

**Commit 3:** Render updates (1-2 commits depending on scope)
```
git add management.js
git commit -m "Update P&L render functions to use date filtering"
git commit -m "Update Guides, Channels, Ops render functions to use date filtering"
```

---

## Success Criteria

- ✅ All 4 tabs respond to date picker changes
- ✅ Data is filtered to exact day, not month-end
- ✅ Waterfall, trend lines, cards all update correctly
- ✅ Edge dates (Jan 1, Dec 31) work as expected
- ✅ Existing theme toggle behavior unchanged
- ✅ No console errors when changing dates
