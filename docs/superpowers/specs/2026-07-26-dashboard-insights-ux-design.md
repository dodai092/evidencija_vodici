# Dashboard insights & UX improvements — design spec

Date: 2026-07-26

## Context

Evidencija is a single-user (FreeSpirit director) internal BI dashboard reviewed weekly to answer one recurring question: **"am I on track vs 2025?"** The Management tab already carries real financial depth (P&L, Guides, Channels, Operational, Cities). A UI walkthrough of all four top-level tabs plus the five Management sub-tabs surfaced four concrete, independently shippable improvements. This spec covers all four, in build order.

Two things discovered during the walkthrough materially changed scope from the original proposal and are called out explicitly below:

1. **P&L already has the "mini scorecard" pattern.** `renderWeekFlash()` and `renderInsightCallouts()` in `src/pages/management/pl.js` render a week-over-week chip strip (`#week-flash`) and a 3-pill delta strip (`#insight-strip`, `.insight-pill`) showing Revenue/Gross Margin/GM% vs 2025. Item 4 below is therefore an **extension of existing code to four more tabs**, not a new component.
2. **Channels and Operational read unfiltered totals; Guides, Cities, and P&L read date-filtered totals.** `kpiTotals26.mgmt` / `kpiTotals25.mgmt` (used directly by `channels.js` and `ops.js`) are NOT cut off at `GLOBAL_DATE` — they're the full-data totals. `computeFilteredKpis()` / `computeCity25()` (used by `pl.js`, `guides.js`, `cities.js`) ARE cut off via `filterMgmtByDate()`. This is pre-existing behavior, not something this spec changes. Each new insight-strip instance must read from whichever source that tab already uses for its own numbers, to avoid introducing a *new* mismatch on top of the existing one.

## Goals

- Fix a broken recommendation shown to the user today.
- Make it faster to find one guide among 30+ cards.
- Surface the single worst YoY swing on Channels and Cities — the two dimensions that don't have this today.
- Give the four remaining Management sub-tabs the same at-a-glance delta strip P&L already has.

## Non-goals

- No new financial fields, no changes to `extract_guides.py` or the data shape.
- No changes to the Tours 2025 / Tours 2026 / Comparison tabs' scorecards — scoped to Management only (see decision log below).
- No fix to the Channels/Ops date-filtering inconsistency — pre-existing, out of scope.
- No visual redesign — reuse existing CSS classes (`.insight-pill`, `.insight-strip`, `.mgmt-table`, etc.) and color vocabulary.

---

## Item 1 — Fix the paxband action-panel bug

**File:** `src/pages/management/ops.js`, `renderPaxBandActionPanel()` (~line 162-203).

**Bug:** `breakevenBand` is found by scanning `GUIDE_PBAND_ORDER = ['1-5','6-10','11+']` for the first band with positive GM. When the `1-5` band itself is already positive (true today, post the `62a24c0` fix), the panel still renders:
> "⚡ Action: Raise minimum from 2 PAX to **1 PAX** to guarantee positive margin on every tour"

This is self-contradictory (raising a minimum *to* the smallest band, and referencing a "2 PAX" baseline that isn't derived from anything).

**Fix:** Only render the action line when the `1-5` band's gross margin is actually negative (`smallGroup26.grossMargin < 0`). When it's negative, phrase the action around the real negative band and the actual next-positive band, without assuming a "2 PAX" starting point:
> "⚡ Action: Tours under {breakevenBand.split('-')[0]} PAX are running negative margin — enforce that as your minimum booking size."

When `smallGroup26.grossMargin >= 0`, omit the action line entirely (the Prevalence/Margin loss/Trend lines still render as they do today).

**Verify:** With current data (1-5 band GM positive), the action line no longer appears. Manually set test data where the 1-5 band GM is negative and confirm the line reappears with correct wording.

---

## Item 2 — Guide search + cross-linking

### 2a. Search box on Tours 2025 / Tours 2026

**Files:** `src/pages/page-2025.js`, `src/pages/page-2026.js`, `index.html`, `guides.css`.

Guide cards already carry `data-name="${g.name}"` and `data-city="${g.city}"` (`page-2026.js:66`, same pattern in `page-2025.js`). Add a text input above the guide-card grid on both pages (each page already has its own grid container — insert per-page, not shared, since `Page25`/`Page26` are independent lazy-init objects).

Behavior: on `input` event, lowercase-substring-match against each visible `.guide-card`'s `data-name`, toggle `display: none` on non-matches. Interacts with the existing city-pill filter by AND-combining: a card must pass both the active city filter and the search text to show. Simplest implementation: add a `this.searchTerm = ''` field to `Page25`/`Page26`, and have the existing per-card city-filter loop (`page-2026.js:118`) also check `card.name.toLowerCase().includes(this.searchTerm)`.

No new data, no persistence — resets on tab switch/reload, consistent with how `activeCity` already resets.

### 2b. Cross-link from Management → Guides table to the guide's card

**Files:** `src/pages/management/guides.js` (`renderGuideTable`), `src/pages/page-2026.js`.

Each guide-name cell in the Management → Guides table (`guides.js:86`) becomes a link. Clicking it:
1. Switches the main nav to the Tours 2026 tab: `showPage('page-26', document.getElementById('tab-26'))` — reuse the existing nav function from `shared.js` (`showPage(id, tab)` requires the nav tab element itself, not just the id).
2. Resets `Page26.activeCity` to `'all'` and clears any search term, so the guide is guaranteed visible regardless of current filter state.
3. Scrolls to and briefly highlights (`.guide-card` gets a temporary CSS class, e.g. a 1.5s outline pulse) the card matching `data-name="<guide name>"`.

Guide names match exactly between `guideStats26` and the Management table (same source array), so no slugification or fuzzy matching is needed — direct `data-name` equality.

**Verify:** Click a guide row in Management → Guides, land on Tours 2026 with that guide's card visible and highlighted, regardless of which city pill was active before navigating.

---

## Item 3 — "Biggest mover" callout on Channels and Cities

**New shared helper**, added to `src/pages/management/helpers.js`:

```js
// entries: [{ name, revenue26, gm26, revenue25, gm25 }]
// Returns the single worst YoY € gross-margin swing, or null if none qualifies.
export function findBiggestNegativeMover(entries, minRevenue = 500) {
    return entries
        .filter(e => e.revenue26 >= minRevenue || e.revenue25 >= minRevenue)
        .map(e => ({ ...e, delta: e.gm26 - e.gm25 }))
        .filter(e => e.delta < 0)
        .sort((a, b) => a.delta - b.delta)[0] || null;
}
```

Rendered as a single callout box (reusing the existing `.insight-strip`/`.insight-pill` look, or the amber-boxed style already used by `renderPaxBandActionPanel`'s "Small Group Problem" panel — pick whichever the Channels/Cities pages already have a container class for, to avoid inventing a third visual treatment):

> **Biggest swing:** Viator gross margin −€13,083 vs 2025 (€13,998 → €915), on €31,955 revenue at 28.0% commission.

Decisions locked in the previous conversation:
- **Worst (negative) swing only** — this is a problem-flagging tool, not a leaderboard.
- **Minimum revenue floor: €500** (either year) — excludes one-off/near-zero channels or cities from dominating on a tiny base.
- **Ops keeps its existing hand-written Small Group Problem panel untouched** — this helper is net-new on Channels and Cities only, not a replacement.

### Channels tab

**File:** `src/pages/management/channels.js`, called from `initChannels()`.

Source data: `kpiTotals26.mgmt.bySource` vs `kpiTotals25.mgmt.bySource` (same source `renderOtaSourceTable()` already uses) — unfiltered totals, consistent with the rest of this tab.

### Cities tab

**File:** `src/pages/management/cities.js`, called from `renderCitiesTab()`.

Source data: for each of the 4 `CITIES`, `computeFilteredKpis(city)` vs `computeCity25(city)` (same calls `renderCitiesTab()` already makes per city card) — date-filtered, consistent with the rest of this tab.

**Verify:** On Channels, the callout currently should identify Viator (−€13,083, matches the OTA Source Detail table's Δ GM column). On Cities, it should identify whichever city has the worst GM delta of the 4 (cross-check against the existing city KPI cards' "∆ GM" line).

---

## Item 4 — Extend the insight-strip pattern to Guides, Channels, Operational, Cities

**Refactor:** Move `renderInsightCallouts(k, k25)` out of `pl.js` into `helpers.js` as an exported, generic function taking a target element id as a third argument (default `'insight-strip'`), so each tab can call it against its own container:

```js
export function renderInsightCallouts(k, k25, elId = 'insight-strip') { ... }
```

No change to its internal logic — it already computes Revenue Δ, Gross Margin Δ, and GM% Δ generically from any two `{revenue, grossMargin, ...}`-shaped objects (`pl.js:152-210`).

**New DOM containers** (static HTML in `index.html`, one per Management sub-tab, matching the existing `id="insight-strip"` pattern used on `#mgmt-pl`):

| Tab | New element id | Data source (k, k25) |
|---|---|---|
| Guides | `insight-strip-guides` | `computeFilteredKpis(city)`, `computeCity25(city)` — same as the tab's own table, re-render on city-pill change like `renderGuideTable` already does |
| Channels | `insight-strip-channels` | `kpiTotals26.mgmt`, `kpiTotals25.mgmt` — unfiltered, matching this tab's existing convention |
| Operational | `insight-strip-ops` | `kpiTotals26.mgmt`, `kpiTotals25.mgmt` — unfiltered, matching this tab's existing convention |
| Cities | `insight-strip-cities` | `computeFilteredKpis('all')`, `computeCity25('all')` — date-filtered, matching this tab's existing convention |

Each tab's `init*()` function gets one added call (e.g. `initChannels()` calls `renderInsightCallouts(kpiTotals26.mgmt, kpiTotals25?.mgmt, 'insight-strip-channels')`), and each `refresh*()` function re-renders it on date-cutoff change, mirroring how `refreshPl()` already does.

**Placement:** top of each sub-tab's `.main`, before the tab's own KPI cards/charts — matching where `#insight-strip` sits on P&L (`index.html:165`, right after the city-pill row where applicable).

**Verify:** Switching to each of the 4 tabs shows a 3-pill strip (Revenue/GM/GM% vs 2025) with values that reconcile against that tab's own existing KPI cards/tables. Changing the date-through picker updates all five tabs' strips consistently with their own existing re-render behavior.

---

## Build order & dependencies

1. Item 1 (bug fix) — standalone, do first since Item 4 touches the same file area conceptually (Ops tab) and should build on corrected logic.
2. Item 2 (search + cross-link) — standalone.
3. Item 3 (biggest-mover helper + Channels/Cities callouts) — standalone; introduces `findBiggestNegativeMover` in `helpers.js`.
4. Item 4 (insight-strip extraction + 4 new instances) — depends on nothing from Item 3, but touches `helpers.js` alongside it; do after Item 3 to avoid merge friction in the same file.

## Testing

No existing Vitest coverage touches `management/*.js` rendering functions directly (per `tests/shared.test.js` scope — filteredStats/date helpers only). This spec doesn't add new test infrastructure; verification is manual per the "Verify" notes above, consistent with how `management/*.js` changes have shipped historically (per recent commit history — data/logic fixes verified in-browser, not via new unit tests). If this pattern should change, that's a separate decision outside this spec's scope.
