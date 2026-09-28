# Guides Tab (moved from Tours 2025, Tours 2026, Comparison) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the per-guide sections out of Tours 2025, Tours 2026 and Comparison into one new Guides tab, and give that tab the guide-analysis functions from `jura-guide-report` (sort and rank, search, movers banner, detail modal with monthly trend, table view with TOTAL row, Total Tours, New badge).

**Architecture:** A pure module (`src/guide-table.js`) holds all row math and is unit tested with vitest. A new page module (`src/pages/page-guides.js`, `PageGuides`) renders the tab using the existing page-module pattern (lazy `init()`, `renderAll()`, registered in `PAGES`). The three old guide sections are then deleted. No new data: everything reads `guideStats25`, `guideStats26` and the existing `filteredStats`.

**Tech Stack:** Vanilla ES modules bundled by esbuild (`npm run build` to `dist/app.js`), Chart.js 4.4.1 from CDN, vitest (`tests/**/*.test.js`), Playwright smoke suite (`tests/smoke.spec.js`, runs against `file://index.html` and `dist/app.js`).

**Spec:** This conversation (grill-with-docs session, 2026-09-28). Approved: sort chips with rank badges, name search, movers banner, detail modal with monthly trend, table view with TOTAL row, Total Tours, New badge, and moving the guide sections out of Tours 2025, Tours 2026 and Comparison into a Guides tab like Jura's. Explicitly out: Bookings tab, FREE channel data, guide notes, `last-update.js`, mobile bottom nav, any new data. The per-guide tour-type mix and monthly table that the old Tours 2025 and Tours 2026 cards showed are re-homed in the detail modal (Antun chose this option, 2026-09-28), so no per-guide view is lost. Reference: `../../jura-guide-report/src/aggregate.js` and `../../jura-guide-report/src/pages/page-guides.js`.

Paths below are relative to `Projects/active/tin-monday-report/evidencija/` unless stated.

## Global Constraints

- One new main tab (Guides). No new data: do not touch `data-2025.js`, `data-2026.js` or `scripts/extract_guides.py`.
- Tab order: Tours 2025, Tours 2026, Comparison, **Guides**, Management. Keyboard: `1`, `2`, `3`, Guides is `4`, Management moves from `4` to `5`.
- DOM ids for the new tab use the suffix `-gd` (`tab-gd`, `page-gd`, `guide-search-gd`). The id `tab-guides` already belongs to the Management sub-tab, do not reuse it.
- Guides in scope are unchanged: only guides whose `city` is in `CITIES` (Zagreb, Dubrovnik, Split, Zadar), filtered by city, language and month.
- No em dashes anywhere (UI strings, comments, docs, commit messages).
- Style: page files use 4-space indent, single quotes, semicolons. `i18n.js` uses 2-space indent. Match the surrounding file.
- Every user-visible string goes through `t()` with `en` and `hr` entries in `src/i18n.js`.
- Numbers format with the existing `fmtN`.
- Do not use `../shared/fs-core.js`. Reuse `fs-core.css` variables (`--border`, `--card-bg`, `--text`, `--white`, `--green`, `--blue`) so dark mode works with no extra rules.
- Surgical changes: only what each task names. When a task removes a feature, delete only code and CSS that grep proves has no remaining user.
- No commit or push unless Antun asks. Commit steps are the exact commands to run once he approves.
- Karpathy guidelines apply: simplest change that passes the stated check.
- Before any Playwright run: `npm run build` (the suite loads `dist/app.js`).

## Review Focus

Failure modes the spec implies but a happy-path test would miss, most likely first. Each has a pinning test in the task named in brackets.

1. **Removing `_buildGuides()` breaks page layout.** In `page-2025.js`, `page-2026.js` and `page-cmp/index.js`, `_buildGuides()` also emits the closing `</div>` of `<div class="main">`. Delete it without replacing that tag and everything after (footer, later sections) nests wrong. [Task 5 test "pages keep one .main wrapper"]
2. **A guide with no 2025 or no 2026 entry** must show "New" or a dash, never `NaN%` or `Infinity%`. [Task 1 tests]
3. **Language filter where a guide has zero tours in that language** but real activity in others must not be badged Inactive or New. Activity is judged on `stats.all`. [Task 1 test]
4. **Search with no match** shows a visible empty message. Regex characters in the query must not throw. [Task 2 smoke test]
5. **`jumpToGuide` callers.** Something outside the three pages (most likely Management > Guides) calls `Page26.jumpToGuide(name)`. If not repointed it throws when clicked. [Task 4 step 1 finds callers, Task 4 smoke test clicks one]
6. **Management moves from key `4` to `5`.** The existing keyboard smoke test and the `?` overlay text must change with it. [Task 2]
7. **Date picker change** must re-render the Guides tab and reset its month filter. [Task 2 smoke test]

---

### Task 1: Pure guide-table module (unit tested)

No DOM. Everything the Guides tab computes lives here.

**Files:**
- Modify: `src/shared.js:90-92` (optional cutoff argument on `filteredStats`)
- Create: `src/guide-table.js`
- Test: `tests/guide-table.test.js`

**Interfaces:**
- Consumes: `filteredStats(st, months, cutoff?)` and `CITIES` from `src/shared.js`; `setGlobalDate` for tests.
- Produces (all exported from `src/guide-table.js`):
  - `mergeGuides(list25, list26)` returns `[{ name, city, g25, g26 }]` in first-seen order, `city` taken from the 2026 entry when both exist.
  - `deltaRow(v25, v26)` returns `{ v25, v26, delta, pct }`, `pct` is `null` when `v25 <= 0`, else rounded to one decimal.
  - `pctLabel(d, newText = 'new')`.
  - `TABLE_METRICS` is `['freeTours', 'freePax', 'paidTours', 'paidPax', 'totalTours']`.
  - `buildGuideRows(merged, lang, months)` returns rows in input order: `{ name, city, stopped, isNew, freeTours, freePax, paidTours, paidPax, totalTours, totalPax }`, each metric a `deltaRow`.
  - `sumRows(rows)` returns `{ name: 'TOTAL', ...metrics }`.
  - `filterByName(rows, query)`.
  - `rankGuides(rows, sort)` with `sort` in `'default' | 'name' | 'gain' | 'drop'`. `'default'` orders by `CITIES` index, then 2026 free tours descending, then 2025 free tours descending, then name.
  - `flagDeclines(rows, threshold = -30)`, `flagGainers(rows, threshold = 30)`, keyed on `totalPax`, both require `v25 > 0 && v26 > 0`.
  - `guideMonthlyDetail(g25, g26, lang, cutoffMonth, cutoffDay)` returns 12 entries `{ month, y25, y26 }`. Each year is `{ freeTours, freePax, paidTours, paidPax }`. 2025 is a full year, `y26` is `null` after `cutoffMonth`.
  - `guideMonthlyTrend(g25, g26, lang, cutoffMonth, cutoffDay)` returns 12 entries `{ month, pax25, pax26 }` (free + paid pax), derived from `guideMonthlyDetail`, `pax26` is `null` after `cutoffMonth`.
  - `guideTypeMix(g25, g26, lang, cutoffMonth, cutoffDay)` returns `[{ type, t25, p25, t26, p26 }]` (tours and pax per tour type), 2025 full year and 2026 through the as-of date, sorted by 2026 tours descending, then 2025 tours, then type name. Uses `byMonthType` and `byDayType`, falling back to `byMonthType` for the cutoff month when `byDayType` is absent.

- [ ] **Step 1: Write the failing tests**

Create `tests/guide-table.test.js`:

```js
import { describe, it, expect, beforeAll } from 'vitest';
import { setGlobalDate, filteredStats } from '../src/shared.js';
import {
    mergeGuides, deltaRow, pctLabel, buildGuideRows, sumRows, filterByName, rankGuides,
    flagDeclines, flagGainers, guideMonthlyTrend, guideMonthlyDetail, guideTypeMix, TABLE_METRICS,
} from '../src/guide-table.js';

const mo = (ft, fp, pt, pp) => ({ free: { tours: ft, pax: fp }, paid: { tours: pt, pax: pp } });
const guide = (name, city, byMonth) => ({
    name, city,
    stats: { all: { byMonth, byDay: {} }, eng: { byMonth, byDay: {} } },
});

// Ana: drops. Boris: gains. Cvita: new in 2026. Dario: stopped after 2025.
const merged = [
    { name: 'Ana',   city: 'Zagreb',    g25: guide('Ana', 'Zagreb', { 1: mo(2, 20, 1, 10) }),   g26: guide('Ana', 'Zagreb', { 1: mo(1, 8, 0, 0) }) },
    { name: 'Boris', city: 'Split',     g25: guide('Boris', 'Split', { 1: mo(1, 10, 0, 0) }),   g26: guide('Boris', 'Split', { 1: mo(2, 20, 1, 10) }) },
    { name: 'Cvita', city: 'Zadar',     g25: null,                                              g26: guide('Cvita', 'Zadar', { 1: mo(1, 5, 0, 0) }) },
    { name: 'Dario', city: 'Dubrovnik', g25: guide('Dario', 'Dubrovnik', { 1: mo(1, 5, 0, 0) }), g26: null },
];

beforeAll(() => setGlobalDate('2026-06-15'));

describe('mergeGuides', () => {
    it('joins by name in first-seen order and prefers the 2026 city', () => {
        const a25 = guide('Ana', 'Zagreb', {});
        const a26 = guide('Ana', 'Split', {});
        const out = mergeGuides([a25, guide('Dario', 'Dubrovnik', {})], [a26, guide('Cvita', 'Zadar', {})]);
        expect(out.map(m => m.name)).toEqual(['Ana', 'Dario', 'Cvita']);
        expect(out[0]).toMatchObject({ city: 'Split', g25: a25, g26: a26 });
        expect(out[1].g26).toBeNull();
        expect(out[2].g25).toBeNull();
    });
});

describe('deltaRow and pctLabel', () => {
    it('computes delta and one-decimal pct', () => {
        expect(deltaRow(30, 8)).toEqual({ v25: 30, v26: 8, delta: -22, pct: -73.3 });
    });
    it('returns null pct when 2025 is zero, never Infinity or NaN', () => {
        expect(deltaRow(0, 5).pct).toBeNull();
        expect(deltaRow(0, 0).pct).toBeNull();
    });
    it('labels new, dash, positive and negative', () => {
        expect(pctLabel(deltaRow(0, 5))).toBe('new');
        expect(pctLabel(deltaRow(0, 5), 'Novo')).toBe('Novo');
        expect(pctLabel(deltaRow(0, 0))).toBe('—');
        expect(pctLabel(deltaRow(10, 30))).toBe('+200%');
        expect(pctLabel(deltaRow(5, 0))).toBe('-100%');
    });
});

describe('buildGuideRows', () => {
    const rows = buildGuideRows(merged, 'all', []);
    it('keeps input order and computes per-metric deltas', () => {
        expect(rows.map(r => r.name)).toEqual(['Ana', 'Boris', 'Cvita', 'Dario']);
        expect(rows[0].freeTours).toEqual({ v25: 2, v26: 1, delta: -1, pct: -50 });
        expect(rows[0].totalTours).toEqual({ v25: 3, v26: 1, delta: -2, pct: -66.7 });
        expect(rows[0].totalPax).toEqual({ v25: 30, v26: 8, delta: -22, pct: -73.3 });
    });
    it('marks new and stopped guides', () => {
        expect(rows.map(r => [r.isNew, r.stopped])).toEqual([[false, false], [false, false], [true, false], [false, true]]);
    });
    it('language filter does not change stopped/new', () => {
        const fra = buildGuideRows(merged, 'fra', []);
        expect(fra[0].freeTours).toEqual({ v25: 0, v26: 0, delta: 0, pct: null });
        expect(fra.map(r => [r.isNew, r.stopped])).toEqual([[false, false], [false, false], [true, false], [false, true]]);
    });
    it('matches filteredStats for the cutoff month', () => {
        const withDay = { name: 'Eva', city: 'Zagreb', g25: null, g26: {
            name: 'Eva', city: 'Zagreb',
            stats: { all: { byMonth: { 6: mo(9, 90, 0, 0) }, byDay: { '6-10': mo(1, 10, 0, 0), '6-20': mo(1, 10, 0, 0) } } },
        } };
        const [row] = buildGuideRows([withDay], 'all', [6]);
        expect(row.freePax.v26).toBe(filteredStats(withDay.g26.stats.all, [6]).freePax);
        expect(row.freePax.v26).toBe(10); // day 20 is after the 15th cutoff
    });
});

describe('sumRows', () => {
    it('sums every metric across rows', () => {
        const total = sumRows(buildGuideRows(merged, 'all', []));
        expect(total.name).toBe('TOTAL');
        expect(total.freeTours).toEqual({ v25: 4, v26: 4, delta: 0, pct: 0 });
        expect(total.totalTours).toEqual({ v25: 5, v26: 5, delta: 0, pct: 0 });
        expect(total.totalPax).toEqual({ v25: 45, v26: 43, delta: -2, pct: -4.4 });
        TABLE_METRICS.forEach(k => expect(total[k]).toBeDefined());
    });
});

describe('search, rank and flags', () => {
    const rows = buildGuideRows(merged, 'all', []);
    it('filterByName is trimmed, case-insensitive, and safe with regex characters', () => {
        expect(filterByName(rows, '  AN ').map(r => r.name)).toEqual(['Ana']);
        expect(filterByName(rows, '(')).toEqual([]);
        expect(filterByName(rows, '').length).toBe(4);
    });
    it('rankGuides orders without mutating input', () => {
        const copy = [...rows];
        expect(rankGuides(rows, 'gain').map(r => r.name)).toEqual(['Boris', 'Cvita', 'Dario', 'Ana']);
        expect(rankGuides(rows, 'drop').map(r => r.name)).toEqual(['Ana', 'Dario', 'Cvita', 'Boris']);
        expect(rankGuides(rows, 'name').map(r => r.name)).toEqual(['Ana', 'Boris', 'Cvita', 'Dario']);
        // default: CITIES order Zagreb, Dubrovnik, Split, Zadar
        expect(rankGuides(rows, 'default').map(r => r.name)).toEqual(['Ana', 'Dario', 'Boris', 'Cvita']);
        expect(rows).toEqual(copy);
    });
    it('flags only guides present in both years past the threshold', () => {
        expect(flagDeclines(rows).map(r => r.name)).toEqual(['Ana']);
        expect(flagGainers(rows).map(r => r.name)).toEqual(['Boris']);
    });
});

describe('guideMonthlyTrend', () => {
    const g25 = guide('Ana', 'Zagreb', { 1: mo(2, 20, 1, 10), 12: mo(0, 0, 1, 7) });
    const g26 = guide('Ana', 'Zagreb', { 1: mo(1, 8, 0, 0), 6: mo(1, 5, 0, 0) });
    it('gives full-year 2025 and 2026 up to the cutoff month', () => {
        const trend = guideMonthlyTrend(g25, g26, 'all', 6, 15);
        expect(trend).toHaveLength(12);
        expect(trend[0]).toEqual({ month: 1, pax25: 30, pax26: 8 });
        expect(trend[5]).toEqual({ month: 6, pax25: 0, pax26: 5 });
        expect(trend[6].pax26).toBeNull();
        expect(trend[11]).toEqual({ month: 12, pax25: 7, pax26: null });
    });
    it('handles a missing year', () => {
        expect(guideMonthlyTrend(null, g26, 'all', 6, 15)[0]).toEqual({ month: 1, pax25: 0, pax26: 8 });
        expect(guideMonthlyTrend(g25, null, 'all', 6, 15)[0]).toEqual({ month: 1, pax25: 30, pax26: null });
    });
});

describe('guideMonthlyDetail', () => {
    const g25 = guide('Ana', 'Zagreb', { 1: mo(2, 20, 1, 10), 12: mo(0, 0, 1, 7) });
    const g26 = guide('Ana', 'Zagreb', { 1: mo(1, 8, 0, 0), 6: mo(1, 5, 0, 0) });
    it('gives free and paid tours and pax per month, 2026 only to the cutoff', () => {
        const d = guideMonthlyDetail(g25, g26, 'all', 6, 15);
        expect(d).toHaveLength(12);
        expect(d[0].y25).toEqual({ freeTours: 2, freePax: 20, paidTours: 1, paidPax: 10 });
        expect(d[0].y26).toEqual({ freeTours: 1, freePax: 8, paidTours: 0, paidPax: 0 });
        expect(d[6].y26).toBeNull();
        expect(d[11].y25).toEqual({ freeTours: 0, freePax: 0, paidTours: 1, paidPax: 7 });
    });
    it('zero-fills a missing 2025 and nulls a missing 2026', () => {
        expect(guideMonthlyDetail(null, g26, 'all', 6, 15)[0].y25).toEqual({ freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 });
        expect(guideMonthlyDetail(g25, null, 'all', 6, 15)[0].y26).toBeNull();
    });
});

describe('guideTypeMix', () => {
    const typed = (byMonthType, byDayType = {}) => ({
        name: 'T', city: 'Zagreb', stats: { all: { byMonth: {}, byDay: {}, byMonthType, byDayType } },
    });
    it('sums types per year, 2025 full year, 2026 to the cutoff, sorted by 2026 tours', () => {
        const g25 = typed({ 1: { war: { tours: 2, pax: 20 }, food: { tours: 1, pax: 5 } }, 12: { war: { tours: 1, pax: 9 } } });
        const g26 = typed({ 1: { food: { tours: 3, pax: 30 } }, 6: { best: { tours: 1, pax: 4 } }, 7: { war: { tours: 9, pax: 99 } } });
        expect(guideTypeMix(g25, g26, 'all', 6, 15)).toEqual([
            { type: 'food', t25: 1, p25: 5, t26: 3, p26: 30 },
            { type: 'best', t25: 0, p25: 0, t26: 1, p26: 4 },
            { type: 'war', t25: 3, p25: 29, t26: 0, p26: 0 },
        ]);
    });
    it('uses byDayType up to the cutoff day in the cutoff month', () => {
        const g26 = typed(
            { 6: { war: { tours: 2, pax: 20 } } },
            { '6-10': { war: { tours: 1, pax: 10 } }, '6-20': { war: { tours: 1, pax: 10 } } },
        );
        expect(guideTypeMix(null, g26, 'all', 6, 15)).toEqual([{ type: 'war', t25: 0, p25: 0, t26: 1, p26: 10 }]);
    });
    it('returns an empty list when a guide has no typed data', () => {
        expect(guideTypeMix(null, null, 'all', 6, 15)).toEqual([]);
        expect(guideTypeMix(guide('A', 'Zagreb', {}), null, 'fra', 6, 15)).toEqual([]);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/guide-table.test.js`
Expected: FAIL, "Failed to resolve import ../src/guide-table.js".

- [ ] **Step 3: Add the optional cutoff argument to `filteredStats`**

In `src/shared.js`, replace:

```js
export function filteredStats(st, months) {
    const cutoffMonth = getCutoffMonth();
    const cutoffDay   = parseInt(GLOBAL_DATE.split('-')[2]);
```

with:

```js
export function filteredStats(st, months, cutoff) {
    const cutoffMonth = cutoff ? cutoff.month : getCutoffMonth();
    const cutoffDay   = cutoff ? cutoff.day   : parseInt(GLOBAL_DATE.split('-')[2]);
```

All existing callers pass two arguments and keep their behaviour.

- [ ] **Step 4: Create `src/guide-table.js`**

```js
import { filteredStats, CITIES } from './shared.js';

const ZERO = { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 };
const ALL_METRICS = ['freeTours', 'freePax', 'paidTours', 'paidPax', 'totalTours', 'totalPax'];

export const TABLE_METRICS = ['freeTours', 'freePax', 'paidTours', 'paidPax', 'totalTours'];

export function mergeGuides(list25, list26) {
    const map = new Map();
    list25.forEach(g => map.set(g.name, { name: g.name, city: g.city, g25: g, g26: null }));
    list26.forEach(g => {
        const cur = map.get(g.name);
        if (cur) { cur.g26 = g; cur.city = g.city; }
        else map.set(g.name, { name: g.name, city: g.city, g25: null, g26: g });
    });
    return [...map.values()];
}

export function deltaRow(v25, v26) {
    const delta = v26 - v25;
    const pct = v25 <= 0 ? null : Math.round((delta / v25) * 1000) / 10;
    return { v25, v26, delta, pct };
}

export function pctLabel(d, newText = 'new') {
    if (d.pct === null) return d.v26 > 0 ? newText : '—';
    return `${d.delta > 0 ? '+' : ''}${d.pct}%`;
}

function statsOrZero(guide, lang, months, cutoff) {
    const st = guide && guide.stats[lang];
    return st ? filteredStats(st, months, cutoff) : ZERO;
}

export function buildGuideRows(merged, lang, months) {
    return merged.map(m => {
        const f25 = statsOrZero(m.g25, lang, months);
        const f26 = statsOrZero(m.g26, lang, months);
        // Activity is judged on all languages, so a language filter never flips a badge.
        const a25 = statsOrZero(m.g25, 'all', months);
        const a26 = statsOrZero(m.g26, 'all', months);
        const act25 = a25.freeTours + a25.paidTours;
        const act26 = a26.freeTours + a26.paidTours;
        return {
            name: m.name,
            city: m.city,
            stopped: act25 > 0 && act26 === 0,
            isNew: act25 === 0 && act26 > 0,
            freeTours: deltaRow(f25.freeTours, f26.freeTours),
            freePax: deltaRow(f25.freePax, f26.freePax),
            paidTours: deltaRow(f25.paidTours, f26.paidTours),
            paidPax: deltaRow(f25.paidPax, f26.paidPax),
            totalTours: deltaRow(f25.freeTours + f25.paidTours, f26.freeTours + f26.paidTours),
            totalPax: deltaRow(f25.freePax + f25.paidPax, f26.freePax + f26.paidPax),
        };
    });
}

export function sumRows(rows) {
    const total = { name: 'TOTAL' };
    ALL_METRICS.forEach(k => {
        total[k] = deltaRow(
            rows.reduce((s, r) => s + r[k].v25, 0),
            rows.reduce((s, r) => s + r[k].v26, 0),
        );
    });
    return total;
}

export function filterByName(rows, query) {
    const q = query.trim().toLowerCase();
    return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
}

const cityIndex = (c) => { const i = CITIES.indexOf(c); return i < 0 ? CITIES.length : i; };

export function rankGuides(rows, sort) {
    if (sort === 'name') return [...rows].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'gain') return [...rows].sort((a, b) => b.totalPax.delta - a.totalPax.delta);
    if (sort === 'drop') return [...rows].sort((a, b) => a.totalPax.delta - b.totalPax.delta);
    return [...rows].sort((a, b) =>
        cityIndex(a.city) - cityIndex(b.city)
        || b.freeTours.v26 - a.freeTours.v26
        || b.freeTours.v25 - a.freeTours.v25
        || a.name.localeCompare(b.name));
}

export function flagDeclines(rows, threshold = -30) {
    return rows
        .filter(r => r.totalPax.v25 > 0 && r.totalPax.v26 > 0 && r.totalPax.pct <= threshold)
        .sort((a, b) => a.totalPax.pct - b.totalPax.pct);
}

export function flagGainers(rows, threshold = 30) {
    return rows
        .filter(r => r.totalPax.v25 > 0 && r.totalPax.v26 > 0 && r.totalPax.pct >= threshold)
        .sort((a, b) => b.totalPax.pct - a.totalPax.pct);
}

// 2025 is a full year. 2026 stops at the as-of date, so later months are null (chart gap).
export function guideMonthlyDetail(g25, g26, lang, cutoffMonth, cutoffDay) {
    const st25 = g25 && g25.stats[lang];
    const st26 = g26 && g26.stats[lang];
    return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return {
            month,
            y25: st25 ? filteredStats(st25, [month], { month: 12, day: 31 }) : ZERO,
            y26: st26 && month <= cutoffMonth ? filteredStats(st26, [month], { month: cutoffMonth, day: cutoffDay }) : null,
        };
    });
}

export function guideMonthlyTrend(g25, g26, lang, cutoffMonth, cutoffDay) {
    return guideMonthlyDetail(g25, g26, lang, cutoffMonth, cutoffDay).map(r => ({
        month: r.month,
        pax25: r.y25.freePax + r.y25.paidPax,
        pax26: r.y26 ? r.y26.freePax + r.y26.paidPax : null,
    }));
}

function typeTotals(st, cutoffMonth, cutoffDay) {
    const acc = {};
    const add = (map) => {
        if (!map) return;
        Object.entries(map).forEach(([type, v]) => {
            const a = acc[type] || (acc[type] = { tours: 0, pax: 0 });
            a.tours += v.tours || 0;
            a.pax += v.pax || 0;
        });
    };
    for (let m = 1; m <= 12; m++) {
        if (m < cutoffMonth) {
            add(st.byMonthType && st.byMonthType[String(m)]);
        } else if (m === cutoffMonth) {
            if (st.byDayType && Object.keys(st.byDayType).length > 0) {
                for (let d = 1; d <= cutoffDay; d++) add(st.byDayType[`${m}-${d}`]);
            } else {
                add(st.byMonthType && st.byMonthType[String(m)]);
            }
        }
    }
    return acc;
}

export function guideTypeMix(g25, g26, lang, cutoffMonth, cutoffDay) {
    const st25 = g25 && g25.stats[lang];
    const st26 = g26 && g26.stats[lang];
    const a = st25 ? typeTotals(st25, 12, 31) : {};
    const b = st26 ? typeTotals(st26, cutoffMonth, cutoffDay) : {};
    return [...new Set([...Object.keys(a), ...Object.keys(b)])]
        .map(type => ({
            type,
            t25: a[type] ? a[type].tours : 0, p25: a[type] ? a[type].pax : 0,
            t26: b[type] ? b[type].tours : 0, p26: b[type] ? b[type].pax : 0,
        }))
        .sort((x, y) => y.t26 - x.t26 || y.t25 - x.t25 || x.type.localeCompare(y.type));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run`
Expected: PASS for `guide-table.test.js` and every pre-existing test in `tests/`.

- [ ] **Step 6: Commit (when Antun approves)**

```bash
git add src/shared.js src/guide-table.js tests/guide-table.test.js
git commit -m "Add pure guide-table module and optional cutoff on filteredStats"
```

---

### Task 2: Guides tab shell, cards, filters, search, sort, rank, banner, badges

**Files:**
- Modify: `src/shared.js` (`PAGES`, `showPage`, `updateDateAsOf`)
- Modify: `src/main.js` (import, register, shortcuts, `PAGE_MAP`, theme callback)
- Modify: `src/theme.js` (`toggleLanguage` rebuild)
- Modify: `src/i18n.js` (`en.labels`, `hr.labels`)
- Modify: `index.html` (nav tab, page container, shortcut overlay rows)
- Modify: `guides.css` (append)
- Create: `src/pages/page-guides.js`
- Test: `tests/smoke.spec.js` (edit keyboard and tab tests, append new tests)

**Interfaces:**
- Consumes: Task 1 exports; `guideStats25`, `guideStats26` globals; `showPage`, `registerPage`, `PAGES` from `shared.js`.
- Produces: `PageGuides` with `_el(id)` (appends `-gd`), `renderAll()`, `filterCity(city)`, `filterLang(lang)`, `filterMonth(m)`, `setGuideSort(value, btn)`, `setGuideQuery(value)`, `rebuildStructure()`, `init()`. Cards carry `data-name = safeName(name)` and `data-city`. DOM ids: `tab-gd`, `page-gd`, `guide-search-gd`, `guide-sort-pills-gd`, `guide-flags-gd`, `guide-sections-gd`, `lang-filter-gd`, `month-filter-gd`. Tasks 3 and 4 extend `renderAll()` and `rebuildStructure()`.

- [ ] **Step 1: Update existing tests and write the failing new ones**

In `tests/smoke.spec.js`, replace the two tests that assume 4 tabs and key `4` = Management.

Replace the body of `test('all 4 main tabs switch pages', ...)` with:

```js
    test('all 5 main tabs switch pages', async ({ page }) => {
        await load(page);

        await expect(page.locator('#page-cmp')).toBeVisible();
        await expect(page.locator('#page-26')).not.toBeVisible();

        await page.click('#tab-26');
        await expect(page.locator('#page-26')).toBeVisible();
        await expect(page.locator('#page-cmp')).not.toBeVisible();

        await page.click('#tab-cmp');
        await expect(page.locator('#page-cmp')).toBeVisible();

        await page.click('#tab-gd');
        await expect(page.locator('#page-gd')).toBeVisible();

        await page.click('#tab-mgmt');
        await expect(page.locator('#page-mgmt')).toBeVisible();

        await page.click('#tab-25');
        await expect(page.locator('#page-25')).toBeVisible();
    });
```

Replace `test('1–4 switch main tabs', ...)` with:

```js
    test('1–5 switch main tabs', async ({ page }) => {
        await load(page);

        await page.keyboard.press('2');
        await expect(page.locator('#page-26')).toBeVisible();

        await page.keyboard.press('3');
        await expect(page.locator('#page-cmp')).toBeVisible();

        await page.keyboard.press('4');
        await expect(page.locator('#page-gd')).toBeVisible();

        await page.keyboard.press('5');
        await expect(page.locator('#page-mgmt')).toBeVisible();

        await page.keyboard.press('1');
        await expect(page.locator('#page-25')).toBeVisible();
    });
```

Append the new tab's tests:

```js
// ── Guides tab ────────────────────────────────────────────────────────────────

async function openGuideTab(page) {
    await load(page);
    await page.click('#tab-gd');
    await page.waitForFunction(() => document.querySelectorAll('#guide-sections-gd .guide-card').length > 0);
}

test.describe('Guides tab', () => {
    test('renders cards with a Total T row', async ({ page }) => {
        await openGuideTab(page);
        await expect(page.locator('#guide-sections-gd .guide-card').first().locator('.gc-cmp-table tr')).toHaveCount(5);
    });

    test('city filter shows only cards from the selected city', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#page-gd .city-filter-pill[data-city="Zagreb"]');
        const cards = await page.locator('#guide-sections-gd .guide-card').all();
        expect(cards.length).toBeGreaterThan(0);
        for (const card of cards) await expect(card).toHaveAttribute('data-city', 'Zagreb');
    });

    test('language and month filters re-render without error', async ({ page }) => {
        await openGuideTab(page);
        await page.selectOption('#lang-filter-gd', 'eng');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
        await page.selectOption('#month-filter-gd', '1');
        await page.selectOption('#month-filter-gd', 'all');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
    });

    test('search narrows cards and shows an empty state', async ({ page }) => {
        await openGuideTab(page);
        const cards = page.locator('#guide-sections-gd .guide-card');
        const before = await cards.count();
        expect(before).toBeGreaterThan(1);
        const firstName = await cards.first().locator('.gc-name').innerText();
        await page.fill('#guide-search-gd', firstName);
        const after = await cards.count();
        expect(after).toBeGreaterThan(0);
        expect(after).toBeLessThan(before);
        await page.fill('#guide-search-gd', '(zzzz-no-such-guide');
        await expect(page.locator('#guide-sections-gd .guide-empty')).toBeVisible();
    });

    test('sort chips rank cards by pax change', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-sort-pills-gd .pill[data-value="gain"]');
        await expect(page.locator('#guide-sections-gd .guide-card .gc-rank').first()).toHaveText('#1');
        await page.click('#guide-sort-pills-gd .pill[data-value="default"]');
        await expect(page.locator('#guide-sections-gd .gc-rank')).toHaveCount(0);
    });

    test('date picker change re-renders the tab', async ({ page }) => {
        await openGuideTab(page);
        await page.fill('#cutoff-picker', '2026-03-15');
        await page.dispatchEvent('#cutoff-picker', 'change');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
        await expect(page.locator('#month-filter-gd')).toHaveValue('all');
    });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run build && npx playwright test -g "Guides tab|main tabs"`
Expected: FAIL (`#tab-gd` not found).

- [ ] **Step 3: Add i18n strings**

In `src/i18n.js`, inside `en.labels` after `moreDetail: 'More detail',` add:

```js
      totalTours: 'Total Tours',
      totalT: 'Total t',
      sortDefault: 'By city',
      sortName: 'Name',
      sortGain: 'PAX ↑',
      sortDrop: 'PAX ↓',
      badgeNew: 'New',
      badgeInactive: 'Inactive in 2026',
      flagDown: 'Down over 30%',
      flagUp: 'Up over 30%',
      noGuidesFound: 'No guides found',
      viewCards: 'Cards',
      viewTable: 'Table',
      guide: 'Guide',
      guideTotalNote: 'Totals add up each listed guide, grouped by their home city. They can differ from the city-based figures on the other tabs.',
```

In `hr.labels` after `moreDetail: 'Više detalja',` add:

```js
      totalTours: 'Ukupno tura',
      totalT: 'Ukupno t',
      sortDefault: 'Po gradu',
      sortName: 'Ime',
      sortGain: 'PAX ↑',
      sortDrop: 'PAX ↓',
      badgeNew: 'Novo',
      badgeInactive: 'Neaktivan u 2026.',
      flagDown: 'Pad veći od 30%',
      flagUp: 'Rast veći od 30%',
      noGuidesFound: 'Nema pronađenih vodiča',
      viewCards: 'Kartice',
      viewTable: 'Tablica',
      guide: 'Vodič',
      guideTotalNote: 'Zbrojevi obuhvaćaju svakog navedenog vodiča, grupirano po matičnom gradu. Mogu se razlikovati od brojki po gradu na drugim karticama.',
```

Check first that none of these keys already exist in either block. `searchGuide` and `guides` do exist and are reused, not redefined.

- [ ] **Step 4: Wire the page into `src/shared.js`**

In `PAGES`, add `PageGuides: null,` after `PageCmp: null,`.

In `updateDateAsOf`, inside the `requestAnimationFrame` callback after the `PageCmp` block, add:

```js
        if (PAGES.PageGuides && PAGES.PageGuides._initialized) PAGES.PageGuides.renderAll();
```

In `showPage`, add to the `titles` map `'page-gd': 'Guides',` and add after the `page-cmp` lines (before the `page-mgmt` block):

```js
    if (id === 'page-gd' && PAGES.PageGuides) {
        if (!PAGES.PageGuides._initialized) PAGES.PageGuides.init();
        else PAGES.PageGuides.renderAll();
    }
```

`updateDateAsOf` already resets every page's `activeMonths` and every `select[id^="month-filter-"]` to `all`, which covers `month-filter-gd`.

- [ ] **Step 5: Wire `src/main.js` and `src/theme.js`**

`main.js`:
- Add `import { PageGuides } from './pages/page-guides.js';` after the `PageCmp` import.
- After `PAGES.PageCmp  = PageCmp;` add `PAGES.PageGuides = PageGuides;`.
- After `window.PageCmp       = PageCmp;` add `window.PageGuides    = PageGuides;`.
- In the `registerThemeChangeCallback` body add a first line `PAGES.PageGuides.closeGuideDetail();` (the modal chart keeps the old theme colours, so it is closed on a theme change). `PAGES` is already imported.
- In `PAGE_MAP` add `'tab-gd':   'page-gd',` between `tab-cmp` and `tab-mgmt`.
- In `initKeyboardShortcuts`, replace the `'4'` line and add `'5'`:

```js
        '4': () => { const el = document.getElementById('tab-gd');   if (el) showPage('page-gd', el); },
        '5': () => { const el = document.getElementById('tab-mgmt'); if (el) showPage('page-mgmt', el); },
```

`theme.js`, in `toggleLanguage`'s `requestAnimationFrame` callback, after the `PageCmp` block add:

```js
        if (PAGES.PageGuides && PAGES.PageGuides._initialized) {
            PAGES.PageGuides.rebuildStructure();
            PAGES.PageGuides.renderAll();
        }
```

- [ ] **Step 6: Wire `index.html`**

Nav: add between the `tab-cmp` and `tab-mgmt` divs:

```html
                <div id="tab-gd" class="nav-tab" role="tab" aria-selected="false" tabindex="-1" data-i18n="labels.guides">Guides</div>
```

Page container: add after `<div id="page-cmp" class="page active"></div>`:

```html
    <!-- ── TAB: GUIDES ────────────────────────────────────────── -->
    <div id="page-gd" class="page"></div>
```

Shortcut overlay: replace the `4` row and add a `5` row:

```html
            <tr><td>4</td><td>Guides</td></tr>
            <tr><td>5</td><td>Management</td></tr>
```

- [ ] **Step 7: Create `src/pages/page-guides.js`**

```js
import {
    CITIES, CITY_CLS, getCityColor, getChartColors as _chartColors, MONTH_NAMES_HR,
    fmtN, getCutoffMonth, getGlobalDate, getRangeLabel, parseGlobalDate,
    registerPage, safeName, showPage,
} from '../shared.js';
import { t } from '../i18n.js';
import {
    mergeGuides, buildGuideRows, sumRows, filterByName, rankGuides,
    flagDeclines, flagGainers, guideMonthlyTrend, pctLabel, TABLE_METRICS,
} from '../guide-table.js';

export const PageGuides = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    activeSort: 'default',
    guideQuery: '',
    guideView: 'cards',
    _initialized: false,

    _el(id) { return document.getElementById(id + '-gd'); },

    _setActivePill(groupId, activeBtn) {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    },

    // Month options depend on the as-of date, so they are rebuilt on every render.
    _syncMonthOptions() {
        const sel = this._el('month-filter');
        if (!sel) return;
        const current = this.activeMonths.length ? String(this.activeMonths[0]) : 'all';
        sel.innerHTML = `<option value="all">${t('labels.all')}</option>` +
            Array.from({ length: getCutoffMonth() }, (_, i) => `<option value="${i + 1}">${MONTH_NAMES_HR[i + 1]}</option>`).join('');
        sel.value = current;
    },

    _deltaBadge(d) {
        if (d.v25 === 0 && d.v26 === 0) return '<span class="dash">—</span>';
        if (d.pct === null) return `<span class="delta pos">${t('labels.badgeNew').toUpperCase()}</span>`;
        const cls = d.delta > 0 ? 'pos' : d.delta < 0 ? 'neg' : 'neu';
        const sym = d.delta > 0 ? '▲' : d.delta < 0 ? '▼' : '=';
        return `<span class="delta ${cls}">${sym}${fmtN(Math.abs(d.delta))} (${pctLabel(d)})</span>`;
    },

    cardHtml(r, m, extra = {}) {
        const col = getCityColor(r.city);
        const init = r.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const rank = extra.rank ? `<span class="gc-rank">#${extra.rank}</span>` : '';
        const badges =
            (r.isNew ? `<span class="gc-badge gc-badge-new">${t('labels.badgeNew')}</span>` : '') +
            (r.stopped ? `<span class="gc-badge">${t('labels.badgeInactive')}</span>` : '');
        const line = (labelKey, d) =>
            `<tr><td class="label">${t(labelKey)}</td>` +
            `<td class="v25">${m.g25 ? fmtN(d.v25) : '—'}</td>` +
            `<td class="v26">${m.g26 ? fmtN(d.v26) : '—'}</td>` +
            `<td class="delta">${m.g25 && m.g26 ? this._deltaBadge(d) : '—'}</td></tr>`;

        return `<div class="guide-card ${m.g26 ? '' : 'inactive'}" role="button" tabindex="0" aria-label="${r.name}" data-city="${r.city}" data-name="${safeName(r.name)}">` +
            `<div class="gc-stripe" style="background:${col}"></div>` +
            `<div class="gc-body">` +
            `<div class="gc-header">` +
            `${rank}` +
            `<div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div>` +
            `<span class="gc-name">${r.name}</span>` +
            `${badges}` +
            `<span class="city-pill" style="background:${col}18;color:${col}">${r.city}</span>` +
            `</div>` +
            `<table class="gc-cmp-table"><tbody>` +
            line('labels.freeT', r.freeTours) +
            line('labels.freeP', r.freePax) +
            line('labels.paidT', r.paidTours) +
            line('labels.paidP', r.paidPax) +
            line('labels.totalT', r.totalTours) +
            `</tbody></table>` +
            `</div></div>`;
    },

    flagsHtml(rows) {
        const list = (items) => items.slice(0, 5).map(r => `${r.name} (${pctLabel(r.totalPax, t('labels.badgeNew'))})`).join(', ')
            + (items.length > 5 ? ` +${items.length - 5}` : '');
        const down = flagDeclines(rows);
        const up = flagGainers(rows);
        if (!down.length && !up.length) return '';
        return `<div class="guide-flags">` +
            (down.length ? `<div class="guide-flag-line neg">▼ ${t('labels.flagDown')} (${down.length}): ${list(down)}</div>` : '') +
            (up.length ? `<div class="guide-flag-line pos">▲ ${t('labels.flagUp')} (${up.length}): ${list(up)}</div>` : '') +
            `</div>`;
    },

    renderAll() {
        this._syncMonthOptions();
        const merged = mergeGuides(guideStats25, guideStats26)
            .filter(m => CITIES.includes(m.city) && (this.activeCity === 'all' || m.city === this.activeCity));
        const byName = new Map(merged.map(m => [m.name, m]));
        const rows = buildGuideRows(merged, this.activeLang, this.activeMonths);
        const shown = rankGuides(filterByName(rows, this.guideQuery), this.activeSort);
        const ranked = this.activeSort === 'gain' || this.activeSort === 'drop';
        const cardFor = (r, i) => this.cardHtml(r, byName.get(r.name), { rank: ranked ? i + 1 : null });

        this._el('guide-flags').innerHTML = this.flagsHtml(rows);

        let html;
        if (!shown.length) {
            html = `<div class="guide-empty">${t('labels.noGuidesFound')}</div>`;
        } else if (this.activeSort === 'default') {
            html = '';
            CITIES.forEach(city => {
                const inCity = shown.filter(r => r.city === city);
                if (!inCity.length) return;
                html += `<section class="city-section" data-city="${city}">` +
                    `<div class="section-title ${CITY_CLS[city] || ''}">${city}</div>` +
                    `<div class="guide-grid">${inCity.map(cardFor).join('')}</div>` +
                    `</section>`;
            });
        } else {
            html = `<section class="city-section"><div class="guide-grid">${shown.map(cardFor).join('')}</div></section>`;
        }
        this._el('guide-sections').innerHTML = html;
    },

    filterCity(city) {
        this.activeCity = city;
        document.querySelectorAll('#page-gd .city-filter-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.city === city));
        this.renderAll();
    },
    filterLang(lang) { this.activeLang = lang; this.renderAll(); },
    filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },

    setGuideSort(value, btn) {
        this.activeSort = value;
        this._setActivePill('guide-sort-pills-gd', btn);
        this.renderAll();
    },

    setGuideQuery(value) {
        this.guideQuery = value;
        this.renderAll();
    },

    _buildHeader() {
        return `<div class="header">
            <div class="header-left">
                <h1>${t('labels.guides')} <span class="accent">25/26</span></h1>
                <p><span class="ytd-range-label">${getRangeLabel()}</span> 2025 vs. 2026 &middot; ${t('sections.productionByGuide')}</p>
            </div>
            <div class="header-right">
                <div id="date-pov-gd" class="mb-6"></div>
                <div class="header-badge">${t('sections.comparisonYtd')}</div>
            </div>
        </div>`;
    },

    _buildFilters() {
        const cityPills = ['all', ...CITIES].map(c => {
            const col = getCityColor(c);
            const label = c === 'all' ? t('labels.all') : c;
            const active = this.activeCity === c ? ' active' : '';
            const style = col ? ` style="--city-col:${col}"` : '';
            return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="PageGuides.filterCity('${c}')">${label}</button>`;
        }).join('');
        const pill = (value, key) =>
            `<button class="pill${this.activeSort === value ? ' active' : ''}" data-value="${value}" onclick="PageGuides.setGuideSort('${value}',this)">${t(key)}</button>`;

        return `<div class="main">
            <div class="filter-bar">
                <div class="city-pill-group">${cityPills}</div>
                <div class="filter-dropdowns">
                    <select class="filter-select" id="lang-filter-gd" onchange="PageGuides.filterLang(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        <option value="eng">🇬🇧 ENG</option>
                        <option value="esp">🇪🇸 ESP</option>
                        <option value="fra">🇫🇷 FRA</option>
                    </select>
                    <select class="filter-select" id="month-filter-gd" onchange="PageGuides.filterMonth(this.value)"></select>
                </div>
            </div>
            <div class="guide-tools">
                <div id="guide-sort-pills-gd" class="pill-group">
                    ${pill('default', 'labels.sortDefault')}${pill('name', 'labels.sortName')}${pill('gain', 'labels.sortGain')}${pill('drop', 'labels.sortDrop')}
                </div>
                <input type="text" id="guide-search-gd" class="guide-search" placeholder="${t('labels.searchGuide')}" oninput="PageGuides.setGuideQuery(this.value)">
            </div>
            <div id="guide-flags-gd"></div>
            <div id="guide-sections-gd"></div>
        </div>`;
    },

    rebuildStructure() {
        document.getElementById('page-gd').innerHTML = this._buildHeader() + this._buildFilters();

        this._el('lang-filter').value = this.activeLang;
        this._el('guide-search').value = this.guideQuery;
        const d = new Date(getGlobalDate());
        const fmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const datePov = this._el('date-pov');
        if (datePov) datePov.textContent = fmt;
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.rebuildStructure();
        this.renderAll();
    },

    // Stubs replaced in Task 4. Called by main.js on theme change.
    closeGuideDetail() {},
};

registerPage('PageGuides', PageGuides);
```

`parseGlobalDate` and `guideMonthlyTrend`, `sumRows`, `TABLE_METRICS`, `showPage` are imported now because Tasks 3 and 4 use them. Remove any still unused at the end of Task 4.

- [ ] **Step 8: Append CSS to `guides.css`**

```css
/* ── Guides tab ── */
.guide-tools { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; }
.guide-search {
    flex: 1 1 200px; max-width: 280px; padding: 8px 12px; font: inherit; font-size: 13px;
    color: var(--text); background: var(--card-bg);
    border: 1px solid var(--border-dark); border-radius: var(--radius);
}
.guide-flags { margin-bottom: 16px; font-size: 13px; }
.guide-flag-line { padding: 4px 0; }
.guide-flag-line.neg { color: #D4545A; }
.guide-flag-line.pos { color: var(--green); }
.guide-empty { padding: 32px; text-align: center; color: var(--text3); }
.gc-rank { font-size: 11px; font-weight: 600; color: var(--text3); }
.gc-badge {
    font-size: 10px; padding: 2px 6px; white-space: nowrap;
    color: var(--text2); border: 1px solid var(--border-dark); border-radius: var(--radius-sm);
}
.gc-badge-new { color: var(--green); border-color: var(--green); }
.guide-card[role="button"] { cursor: pointer; }
.guide-card:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
```

- [ ] **Step 9: Build and run tests**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: all pass. The old `.guide-card` tests on Tours 2025/2026 still pass because those sections are still there (Task 5 removes them).

- [ ] **Step 10: Commit (when Antun approves)**

```bash
git add src/shared.js src/main.js src/theme.js src/i18n.js src/pages/page-guides.js index.html guides.css tests/smoke.spec.js dist/app.js
git commit -m "Add Guides tab with filters, search, sort, rank, movers banner, badges"
```

(Include `dist/app.js` only if it is tracked in this repo.)

---

### Task 3: Table view with TOTAL row

**Files:**
- Modify: `src/pages/page-guides.js`
- Test: `tests/smoke.spec.js` (append)

**Interfaces:**
- Consumes: `sumRows`, `TABLE_METRICS`, `pctLabel` (imported in Task 2), the `rows` and `shown` arrays in `renderAll()`.
- Produces: `PageGuides.setGuideView(view)`, `PageGuides.guideTableHtml(shown, totalRow)`, ids `guide-view-cards-gd`, `guide-view-table-gd`, `guide-table-gd`. The TOTAL row has class `mpax-total`.

- [ ] **Step 1: Write the failing smoke tests**

Append inside the `Guides tab` describe block:

```js
    test('table view TOTAL equals the sum of guide rows', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        await expect(page.locator('#guide-table-gd')).toBeVisible();
        const r = await page.evaluate(() => {
            const rows = [...document.querySelectorAll('#guide-table-gd tbody tr:not(.mpax-total)')];
            const total = document.querySelector('#guide-table-gd tbody tr.mpax-total');
            const num = td => parseInt(td.textContent.replace(/[^\d]/g, ''), 10) || 0;
            // cells: 0 name, then per metric 4 cells ('25, '26, +/-, %). Column 1 = Free Tours '25, 2 = '26.
            const sum = i => rows.reduce((s, row) => s + num(row.children[i]), 0);
            return { rows: rows.length, s25: sum(1), t25: num(total.children[1]), s26: sum(2), t26: num(total.children[2]) };
        });
        expect(r.rows).toBeGreaterThan(1);
        expect(r.s25).toBe(r.t25);
        expect(r.s26).toBe(r.t26);
    });

    test('table TOTAL ignores the search filter', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        const totalBefore = await page.locator('#guide-table-gd tr.mpax-total').innerText();
        await page.fill('#guide-search-gd', '(zzzz-no-such-guide');
        await expect(page.locator('#guide-sections-gd .guide-empty')).toBeVisible();
        await page.fill('#guide-search-gd', '');
        expect(await page.locator('#guide-table-gd tr.mpax-total').innerText()).toBe(totalBefore);
    });

    test('switching back to cards restores the cards', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        await page.click('#guide-view-cards-gd');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
    });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run build && npx playwright test -g "table view|TOTAL ignores|switching back"`
Expected: FAIL (`#guide-view-table-gd` not found).

- [ ] **Step 3: Add the view toggle to `_buildFilters`**

Inside `.guide-tools`, after the search `<input>`, add:

```js
                <div class="pill-group" id="guide-view-pills-gd">
                    <button class="pill${this.guideView === 'cards' ? ' active' : ''}" id="guide-view-cards-gd" onclick="PageGuides.setGuideView('cards')">${t('labels.viewCards')}</button>
                    <button class="pill${this.guideView === 'table' ? ' active' : ''}" id="guide-view-table-gd" onclick="PageGuides.setGuideView('table')">${t('labels.viewTable')}</button>
                </div>
```

- [ ] **Step 4: Add table rendering and the view switch**

New methods in `PageGuides`, after `setGuideQuery`:

```js
    setGuideView(view) {
        this.guideView = view;
        this._el('guide-view-cards').classList.toggle('active', view === 'cards');
        this._el('guide-view-table').classList.toggle('active', view === 'table');
        this.renderAll();
    },

    _deltaCells(d) {
        const cls = d.delta > 0 ? 'pos' : d.delta < 0 ? 'neg' : 'neu';
        const sign = d.delta > 0 ? '+' : '';
        return `<td>${fmtN(d.v25)}</td><td>${fmtN(d.v26)}</td>` +
            `<td><span class="${cls}">${sign}${fmtN(d.delta)}</span></td>` +
            `<td><span class="${cls}">${pctLabel(d, t('labels.badgeNew'))}</span></td>`;
    },

    guideTableHtml(shown, totalRow) {
        const heads = { freeTours: 'labels.freeTours', freePax: 'labels.freePax', paidTours: 'labels.paidTours', paidPax: 'labels.paidPax', totalTours: 'labels.totalTours' };
        const groupHeads = TABLE_METRICS.map(k => `<th colspan="4" class="mpax-city-head">${t(heads[k])}</th>`).join('');
        const subHeads = TABLE_METRICS.map(() =>
            `<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">±</th><th class="mpax-sub-head">±%</th>`).join('');
        const body = shown.map(r =>
            `<tr><td class="mpax-month">${r.name}</td>${TABLE_METRICS.map(k => this._deltaCells(r[k])).join('')}</tr>`).join('');
        const foot = `<tr class="mpax-total"><td class="mpax-month">${t('labels.total')}</td>${TABLE_METRICS.map(k => this._deltaCells(totalRow[k])).join('')}</tr>`;
        return `<div class="chart-card"><div class="mpax-wrap"><table class="mpax-table" id="guide-table-gd">` +
            `<thead><tr><th class="mpax-month-head" rowspan="2">${t('labels.guide')}</th>${groupHeads}</tr><tr>${subHeads}</tr></thead>` +
            `<tbody>${body}${foot}</tbody></table></div>` +
            `<div class="mpax-note">${t('labels.guideTotalNote')}</div></div>`;
    },
```

In `renderAll()`, change the chain so a table branch sits between the empty state and the default grouping:

```js
        let html;
        if (!shown.length) {
            html = `<div class="guide-empty">${t('labels.noGuidesFound')}</div>`;
        } else if (this.guideView === 'table') {
            html = this.guideTableHtml(shown, sumRows(rows));
        } else if (this.activeSort === 'default') {
```

`sumRows(rows)` sums the city, language and month filtered set before the search filter, so TOTAL does not move while typing.

- [ ] **Step 5: Build and run tests**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: all pass. The table reuses `.mpax-table`, `.mpax-wrap`, `.mpax-total` and `.mpax-note`, so no new CSS. If a screenshot shows the 21 columns overflowing on a narrow window, `.mpax-wrap` already scrolls horizontally.

- [ ] **Step 6: Commit (when Antun approves)**

```bash
git add src/pages/page-guides.js tests/smoke.spec.js dist/app.js
git commit -m "Guides tab: table view with TOTAL row"
```

---

### Task 4: Detail modal (monthly trend, tour-type mix, monthly table) and `jumpToGuide`

The modal re-homes what the old Tours 2025 and Tours 2026 cards showed per guide (tour-type bars, monthly table) and adds the 2025 vs 2026 monthly trend chart. Everything in it uses the language filter but ignores the month filter. It always reads "2025 full year vs 2026 through the as-of date".

**Files:**
- Modify: `src/pages/page-cmp/charts.js` (new factory)
- Modify: `src/pages/page-guides.js`
- Modify: whichever files call `jumpToGuide` (found in Step 1)
- Modify: `guides.css`
- Test: `tests/smoke.spec.js` (append)

**Interfaces:**
- Consumes: `guideMonthlyTrend`, `guideMonthlyDetail`, `guideTypeMix`, `parseGlobalDate`, `MONTH_NAMES_HR`, `getCutoffMonth`, `getGlobalDate`, `showPage`, card attribute `data-name = safeName(name)`.
- Produces: `createGuideTrendChart(ctx, months, pax25, pax26, colors)`; `PageGuides.openGuideDetail(safeKey, trigger)`, `PageGuides.closeGuideDetail()` (replaces the Task 2 stub), `PageGuides.jumpToGuide(name)`, `PageGuides._typeMixHtml(mix)`, `PageGuides._monthlyTableHtml(detail)`; ids `guide-detail-backdrop-gd`, `guide-detail-modal-gd`, `guide-detail-name-gd`, `guide-detail-city-gd`, `guide-detail-close-gd`, `guide-detail-note-gd`, `guide-detail-types-gd`, `guide-detail-months-gd`, `guideTrendChart-gd`.

- [ ] **Step 1: Find every `jumpToGuide` caller**

Run: `grep -rn "jumpToGuide" src index.html tests`
Expected: the definitions in `page-2025.js` and `page-2026.js` (removed in Task 5), plus one or more callers, most likely in `src/pages/management/index.js` (guide names in Management > Guides). Write the list into the task notes. Every caller must call `PageGuides.jumpToGuide(name)` after this task.

- [ ] **Step 2: Write the failing smoke tests**

Append inside the `Guides tab` describe block:

```js
    test('card click opens the detail modal with a chart, Escape closes it', async ({ page }) => {
        await openGuideTab(page);
        const card = page.locator('#guide-sections-gd .guide-card').first();
        const name = await card.locator('.gc-name').innerText();
        await card.click();
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
        await expect(page.locator('#guide-detail-name-gd')).toHaveText(name);
        await hasChart(page, 'guideTrendChart-gd');
        await page.keyboard.press('Escape');
        await expect(page.locator('#guide-detail-modal-gd')).not.toBeVisible();
    });

    test('keyboard: Enter on a focused card opens the modal, close button returns focus', async ({ page }) => {
        await openGuideTab(page);
        const card = page.locator('#guide-sections-gd .guide-card').first();
        await card.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
        await page.click('#guide-detail-close-gd');
        await expect(page.locator('#guide-detail-modal-gd')).not.toBeVisible();
        await expect(card).toBeFocused();
    });

    test('modal still opens after a filter change re-renders the cards', async ({ page }) => {
        await openGuideTab(page);
        await page.selectOption('#lang-filter-gd', 'eng');
        await page.locator('#guide-sections-gd .guide-card').first().click();
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
    });

    test('modal shows the tour-type mix and a monthly table with a total row', async ({ page }) => {
        await openGuideTab(page);
        await page.locator('#guide-sections-gd .guide-card').first().click();
        await expect(page.locator('#guide-detail-months-gd table')).toBeVisible();
        await expect(page.locator('#guide-detail-months-gd tr.mpax-total')).toBeVisible();
        expect(await page.locator('#guide-detail-types-gd .type-bar-row').count()).toBeGreaterThan(0);
    });

    test('modal 2026 free tours total equals the card value', async ({ page }) => {
        await openGuideTab(page);
        const card = page.locator('#guide-sections-gd .guide-card').first();
        const cardValue = parseInt(await card.locator('.gc-cmp-table tr').first().locator('.v26').innerText(), 10);
        expect(Number.isNaN(cardValue)).toBe(false);
        await card.click();
        // total row cells: 0 label, 1-4 = 2025 (free t, free p, paid t, paid p), 5-8 = 2026. Cell 5 = 2026 free tours.
        const modalValue = await page.evaluate(() => {
            const cells = document.querySelector('#guide-detail-months-gd tr.mpax-total').children;
            return parseInt(cells[5].textContent.replace(/[^\d]/g, ''), 10);
        });
        expect(modalValue).toBe(cardValue);
    });

    test('jumpToGuide switches to the tab, clears filters and highlights the card', async ({ page }) => {
        await openGuideTab(page);
        const name = await page.locator('#guide-sections-gd .guide-card .gc-name').first().innerText();
        await page.click('#tab-cmp');
        await page.evaluate(n => window.PageGuides.jumpToGuide(n), name);
        await expect(page.locator('#page-gd')).toBeVisible();
        await expect(page.locator('#guide-search-gd')).toHaveValue('');
        await expect(page.locator('#guide-sections-gd .guide-card', { hasText: name }).first()).toBeVisible();
    });
```

If Step 1 found a real click path (for example a guide name link in Management > Guides), add a test that clicks it and asserts `#page-gd` becomes visible.

- [ ] **Step 3: Run to verify they fail**

Run: `npm run build && npx playwright test -g "detail modal|keyboard: Enter|modal still opens|jumpToGuide"`
Expected: FAIL (`#guide-detail-modal-gd` not found).

- [ ] **Step 3b: Add the modal note string**

In `src/i18n.js`, `en.labels` after `guideTotalNote`: `modalNote: '2025 full year vs 2026 through',`. In `hr.labels` after `guideTotalNote`: `modalNote: '2025 cijela godina naspram 2026 do',`. The modal reuses the existing keys `labels.tourType`, `labels.monthly`, `table.free`, `table.paid`.

- [ ] **Step 4: Add the chart factory to `src/pages/page-cmp/charts.js`**

Append at the end of the file:

```js
export function createGuideTrendChart(ctx, months, pax25, pax26, colors) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: '2025', data: pax25, borderColor: colors.y25, backgroundColor: colors.y25 + '33', borderWidth: 2, tension: 0.3, pointRadius: 3 },
                { label: '2026', data: pax26, borderColor: colors.y26, backgroundColor: colors.y26 + '33', borderWidth: 2, tension: 0.3, pointRadius: 3, spanGaps: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { beginAtZero: true, ticks: { color: colors.text3 }, grid: { color: colors.border } }
            }
        }
    });
}
```

- [ ] **Step 5: Wire the modal into `src/pages/page-guides.js`**

Add `import { createGuideTrendChart } from './page-cmp/charts.js';` to the imports.

State: add after `guideView: 'cards',`:

```js
    guideTrendChartInstance: null,
    _detailTrigger: null,
```

Add `getChartColors() { return _chartColors(); },` after `_el`.

Modal markup: in `_buildFilters()`, append inside the returned template, after the `#guide-sections-gd` div and before the final closing `</div>` of `.main`:

```js
            <div class="guide-detail-backdrop" id="guide-detail-backdrop-gd"></div>
            <div class="guide-detail-modal" id="guide-detail-modal-gd" role="dialog" aria-modal="true" aria-labelledby="guide-detail-name-gd">
                <button class="guide-detail-close" id="guide-detail-close-gd" aria-label="Close">&times;</button>
                <div class="guide-detail-head">
                    <h3 id="guide-detail-name-gd"></h3>
                    <span id="guide-detail-city-gd" class="guide-detail-city"></span>
                </div>
                <div class="guide-detail-note" id="guide-detail-note-gd"></div>
                <div class="guide-detail-chart-wrap"><canvas id="guideTrendChart-gd"></canvas></div>
                <div class="guide-detail-section-title">${t('labels.tourType')}</div>
                <div id="guide-detail-types-gd"></div>
                <div class="guide-detail-section-title">${t('labels.monthly')}</div>
                <div id="guide-detail-months-gd"></div>
            </div>
```

Methods: delete the Task 2 stub `closeGuideDetail() {},` and its comment, then add after `setGuideView`:

```js
    _typeMixHtml(mix) {
        if (!mix.length) return '';
        const maxT = Math.max(...mix.map(x => Math.max(x.t25, x.t26)), 1);
        const bar = (tours, pax, cls, year) =>
            `<div class="type-bar-row"><span class="type-lbl">${year}</span>` +
            `<div class="type-track"><div class="type-fill ${cls}" style="width:${(tours / maxT * 100).toFixed(0)}%"></div></div>` +
            `<span class="type-val">${tours}t &middot; ${pax}p</span></div>`;
        return mix.map(x =>
            `<div class="guide-type-group"><div class="guide-type-name">${x.type}</div>` +
            `${bar(x.t25, x.p25, 'y25', '2025')}${bar(x.t26, x.p26, 'y26', '2026')}</div>`).join('');
    },

    _monthlyTableHtml(detail) {
        const zero = { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 };
        const any = (s) => s && (s.freeTours || s.freePax || s.paidTours || s.paidPax);
        const cells = (s) => s
            ? `<td>${s.freeTours}</td><td>${s.freePax}</td><td>${s.paidTours}</td><td>${s.paidPax}</td>`
            : '<td>—</td><td>—</td><td>—</td><td>—</td>';
        const rows = detail.filter(r => any(r.y25) || any(r.y26));
        if (!rows.length) return '';
        const sum = (key) => detail.reduce((a, r) => {
            const s = r[key] || zero;
            return { freeTours: a.freeTours + s.freeTours, freePax: a.freePax + s.freePax, paidTours: a.paidTours + s.paidTours, paidPax: a.paidPax + s.paidPax };
        }, zero);
        const sub = `<th class="mpax-sub-head">${t('table.free')} t</th><th class="mpax-sub-head">${t('table.free')} p</th><th class="mpax-sub-head">${t('table.paid')} t</th><th class="mpax-sub-head">${t('table.paid')} p</th>`;
        return `<div class="mpax-wrap"><table class="mpax-table">` +
            `<thead><tr><th class="mpax-month-head" rowspan="2">${t('table.month')}</th><th colspan="4" class="mpax-city-head">2025</th><th colspan="4" class="mpax-city-head">2026</th></tr><tr>${sub}${sub}</tr></thead>` +
            `<tbody>${rows.map(r => `<tr><td class="mpax-month">${MONTH_NAMES_HR[r.month]}</td>${cells(r.y25)}${cells(r.y26)}</tr>`).join('')}` +
            `<tr class="mpax-total"><td class="mpax-month">${t('labels.total')}</td>${cells(sum('y25'))}${cells(sum('y26'))}</tr></tbody>` +
            `</table></div>`;
    },

    openGuideDetail(safeKey, trigger) {
        const m = mergeGuides(guideStats25, guideStats26).find(x => safeName(x.name) === safeKey);
        if (!m) return;
        this._detailTrigger = trigger;
        this._el('guide-detail-name').textContent = m.name;
        this._el('guide-detail-city').textContent = m.city;
        this._el('guide-detail-note').textContent = `${t('labels.modalNote')} ${getGlobalDate()}`;
        this._el('guide-detail-backdrop').classList.add('open');
        this._el('guide-detail-modal').classList.add('open');
        this._el('guide-detail-close').focus();

        const cutoffMonth = getCutoffMonth();
        const cutoffDay = parseGlobalDate().day;
        this._el('guide-detail-types').innerHTML = this._typeMixHtml(guideTypeMix(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay));
        this._el('guide-detail-months').innerHTML = this._monthlyTableHtml(guideMonthlyDetail(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay));

        const trend = guideMonthlyTrend(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay);
        if (this.guideTrendChartInstance) this.guideTrendChartInstance.destroy();
        this.guideTrendChartInstance = createGuideTrendChart(
            this._el('guideTrendChart').getContext('2d'),
            trend.map(x => MONTH_NAMES_HR[x.month]),
            trend.map(x => x.pax25),
            trend.map(x => x.pax26),
            this.getChartColors(),
        );
    },

    closeGuideDetail() {
        const modal = this._el('guide-detail-modal');
        if (!modal || !modal.classList.contains('open')) return;
        modal.classList.remove('open');
        this._el('guide-detail-backdrop').classList.remove('open');
        if (this.guideTrendChartInstance) { this.guideTrendChartInstance.destroy(); this.guideTrendChartInstance = null; }
        if (this._detailTrigger && document.contains(this._detailTrigger)) this._detailTrigger.focus();
        this._detailTrigger = null;
    },

    jumpToGuide(name) {
        this.activeCity = 'all';
        this.guideQuery = '';
        this.activeSort = 'default';
        this.guideView = 'cards';
        const wasInitialized = this._initialized;
        showPage('page-gd', document.getElementById('tab-gd'));
        if (wasInitialized) { this.rebuildStructure(); this.renderAll(); }
        requestAnimationFrame(() => {
            const card = document.querySelector(`#page-gd .guide-card[data-name="${CSS.escape(safeName(name))}"]`);
            if (!card) return;
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('guide-card-highlight');
            setTimeout(() => card.classList.remove('guide-card-highlight'), 1500);
        });
    },
```

`rebuildStructure()`: add `this.closeGuideDetail();` as its first line. It does nothing when the modal is closed and destroys the chart if a rebuild happens while it is open.

`init()`: add after `this.renderAll();` (the listeners sit on the persistent `#page-gd` element and on `document`, so they survive rebuilds):

```js
        const root = document.getElementById('page-gd');
        root.addEventListener('click', (e) => {
            const card = e.target.closest('.guide-card');
            if (card) { this.openGuideDetail(card.dataset.name, card); return; }
            if (e.target.id === 'guide-detail-backdrop-gd' || e.target.id === 'guide-detail-close-gd') this.closeGuideDetail();
        });
        root.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('guide-card')) {
                e.preventDefault();
                this.openGuideDetail(e.target.dataset.name, e.target);
            }
        });
        document.addEventListener('keydown', (e) => {
            const modal = this._el('guide-detail-modal');
            if (!modal || !modal.classList.contains('open')) return;
            if (e.key === 'Escape') this.closeGuideDetail();
            if (e.key === 'Tab') { e.preventDefault(); this._el('guide-detail-close').focus(); }
        });
```

The `.guide-card-highlight` CSS class already exists (the old `jumpToGuide` used it).

- [ ] **Step 6: Repoint the callers found in Step 1**

Replace `Page26.jumpToGuide(` (and `Page25.jumpToGuide(` if present) with `PageGuides.jumpToGuide(` in each caller. `window.PageGuides` is exposed in `main.js` (Task 2), so inline `onclick` strings work.

- [ ] **Step 7: Append CSS to `guides.css`**

```css
.guide-detail-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: none; z-index: 1000; }
.guide-detail-backdrop.open { display: block; }
.guide-detail-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: min(720px, calc(100vw - 32px)); padding: 24px; display: none; z-index: 1001;
    color: var(--text); background: var(--white);
    border: 1px solid var(--border-dark); border-radius: var(--radius);
}
.guide-detail-modal.open { display: block; }
.guide-detail-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.guide-detail-city { font-size: 12px; color: var(--text3); }
.guide-detail-modal { max-height: calc(100vh - 32px); overflow-y: auto; }
.guide-detail-note { font-size: 12px; color: var(--text3); margin: -8px 0 12px; }
.guide-detail-chart-wrap { position: relative; height: 260px; }
.guide-detail-section-title { margin: 20px 0 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text2); }
.guide-type-group { margin-bottom: 10px; }
.guide-type-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
.type-fill.y25 { background: var(--y25); }
.type-fill.y26 { background: var(--y26); }
.guide-detail-close {
    position: absolute; top: 8px; right: 12px; font-size: 24px; line-height: 1;
    color: var(--text2); background: none; border: none; cursor: pointer;
}
```

- [ ] **Step 8: Build and run tests**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: all pass. Remove any import in `page-guides.js` that is still unused.

- [ ] **Step 9: Commit (when Antun approves)**

```bash
git add src/pages/page-cmp/charts.js src/pages/page-guides.js guides.css tests/smoke.spec.js dist/app.js
git add -u src   # any repointed jumpToGuide callers
git commit -m "Guides tab: detail modal with monthly trend, jumpToGuide"
```

---

### Task 5: Remove the guide sections from Tours 2025, Tours 2026 and Comparison

The Guides tab now covers everything, so the old sections go. This also removes the per-guide tour-type bars, per-guide monthly tables and the old search box.

**Files:**
- Modify: `src/pages/page-2025.js`
- Modify: `src/pages/page-2026.js`
- Modify: `src/pages/page-cmp/index.js`
- Modify: `guides.css` (remove only proven-dead rules)
- Modify: `src/i18n.js` (remove only proven-dead keys)
- Test: `tests/smoke.spec.js` (rewrite the tests that assumed guide cards on these pages)

**Interfaces:**
- Consumes: the finished Guides tab.
- Produces: Tours 2025, Tours 2026 and Comparison without a guides section, each still wrapping its content in exactly one `<div class="main">`.

- [ ] **Step 1: Rewrite the smoke tests that assumed cards on these pages**

In `tests/smoke.spec.js`:

`Page 25`:
- `renders guide cards and charts`: rename to `renders charts`, delete the `.guide-card` line, keep the two `hasChart` lines.
- `city filter shows only cards from selected city`: replace with

```js
    test('city filter changes the KPIs', async ({ page }) => {
        await load(page);
        await openPage25(page);
        const allTours = await page.locator('#kv-free-tours-25').textContent();
        await page.click('#page-25 .city-filter-pill[data-city="Zagreb"]');
        await expect(page.locator('#kv-free-tours-25')).not.toHaveText(allTours);
    });
```

- `language filter updates cards`: rename to `language filter re-renders charts`, replace the card assertion with `await hasChart(page, 'cityChart-25');`.
- `month filter runs without error`: replace the last line (the `.guide-card` assertion) with `await hasChart(page, 'cityChart-25');`.

`Page 26`:
- `renders guide cards and charts`: rename to `renders charts`, delete the `.guide-card` line.
- `city filter shows only cards from selected city`: replace with the same KPI test as above using `#page-26`, `#kv-free-tours-26` and the click on `#page-26 .city-filter-pill[data-city="Zagreb"]`.

`Comparison tab`: append

```js
    test('no longer has a guides section', async ({ page }) => {
        await load(page);
        await expect(page.locator('#page-cmp .guide-card')).toHaveCount(0);
    });
```

Add a layout regression test (Review Focus 1):

```js
test.describe('Page layout after removing guide sections', () => {
    for (const [tab, page_] of [['#tab-25', '#page-25'], ['#tab-26', '#page-26'], ['#tab-cmp', '#page-cmp']]) {
        test(`${page_} keeps one .main wrapper and no guide cards`, async ({ page }) => {
            await load(page);
            await page.click(tab);
            await page.waitForFunction(sel => (document.querySelector(sel)?.children.length ?? 0) > 0, page_);
            await expect(page.locator(`${page_} > .main`)).toHaveCount(1);
            await expect(page.locator(`${page_} .guide-card`)).toHaveCount(0);
            // the last chart-bearing block must still be inside .main
            const inside = await page.evaluate(sel => {
                const main = document.querySelector(sel + ' > .main');
                return main.querySelectorAll('canvas').length > 0 && main.nextElementSibling === null;
            }, page_);
            expect(inside).toBe(true);
        });
    }
});
```

`#kv-free-tours-25` follows the pattern of `#kv-free-tours-26` in `page-2026.js` (`_el('kv-free-tours')` appends the suffix). Confirm the id in `page-2025.js` before running.

- [ ] **Step 2: Run to verify the new tests fail**

Run: `npm run build && npx playwright test -g "no longer has a guides section|keeps one .main wrapper"`
Expected: FAIL (guide cards still present).

- [ ] **Step 3: Remove the section from `page-2026.js`**

Delete: `searchTerm: '',`; the whole `renderCard(g) { ... },` method; in `renderAll()` the `const container...` through `container.innerHTML = html;` lines and the `this.applySearchFilter();` line, leaving:

```js
    renderAll() {
        this.updateKPIs();
        this.updateChart();
        this.renderCityBars();
        this.renderMonthlyTable();
        this.updatePaidTypeCharts();
    },
```

Delete the methods `applySearchFilter`, `filterGuideSearch`, `jumpToGuide`, `toggleMonthly`, and the `_buildGuides()` method. In `rebuildStructure()` replace `this._buildGuides();` with a string that closes the wrapper `_buildGuides` used to close:

```js
            this._buildPaidTours() +
            '</div>';
```

(`_buildFilters()` opens `<div class="main">` and never closes it. `_buildGuides()` closed it, so the replacement is mandatory.)

Then remove imports and helpers that no longer have a user. For each of `safeName`, `showPage`, `_scope`, `CSS` (global, nothing to remove), run `grep -n "<name>" src/pages/page-2026.js`; delete the import or method only when the grep shows no use besides its own definition or import.

- [ ] **Step 4: Remove the section from `page-2025.js`**

Same edits as Step 3. `renderAll()` currently reads `guideStats25.filter(...)` and `this.applySearchFilter()` (lines 118 to 139); after the edit it is the same five-call body. Apply the same `'</div>'` replacement in `rebuildStructure()` and the same grep-then-delete rule for imports and `_scope`. Its `renderCard` uses `Page25` in inline `onclick` strings, so deleting it also removes those references.

- [ ] **Step 5: Remove the section from `page-cmp/index.js`**

Delete: the `renderCard(m) { ... },` method; in `renderAll()` the `let html = '';` through `this._el('guide-sections').innerHTML = html;` lines; and the `_buildGuides()` method. `renderAll()` becomes:

```js
    renderAll() {
        this.updateKPIs();
        this.renderMonthlyTable();
        setTimeout(() => this.updateCharts(), 100);
    },
```

In `rebuildStructure()` replace `this._buildGuides();` with `'</div>';` (again closing `.main`).

Keep `buildMerged()`, `mergedGuides`, `filterLang` and `filterMonth`: `updateCharts()` still reads `this.mergedGuides` for the monthly and average charts. Only remove `fmtDelta`, `pctChange`, `safeName`, `toggleSection` and the `getCityColor` import if grep shows they have no other user in the file (`toggleSection` is used by the free and paid section headers, so it stays).

- [ ] **Step 6: Remove proven-dead CSS and i18n keys**

For each selector below run `grep -rn "<selector>" src index.html` after Steps 3 to 5 and delete its rule from `guides.css` only when nothing outside `guides.css` still references it: `.monthly-toggle`, `.mt-arrow`, `.monthly-table`, `.gc-types`, `.guide-search-input`, `.gc-stats`, `.gc-half`, `.gc-divider`, `.gc-stat-label`, `.gc-stat-num`, `.gc-stat-sub`. Do not remove `.guide-card`, `.guide-grid`, `.city-section`, `.gc-stripe`, `.gc-body`, `.gc-header`, `.gc-name`, `.gc-cmp-table`, `.avatar`, `.city-pill`, `.guide-card-highlight` (all still used by the Guides tab), or `.type-bar-row`, `.type-lbl`, `.type-track`, `.type-fill`, `.type-val` (the detail modal's tour-type bars reuse them).

Remove the i18n key `sections.guides` (both `en` and `hr`) only if grep shows no remaining `t('sections.guides')`. Keep `labels.monthly` (the modal uses it).

- [ ] **Step 7: Build and run everything**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: all pass, including the new layout test on all three pages.

- [ ] **Step 8: Commit (when Antun approves)**

```bash
git add src/pages/page-2025.js src/pages/page-2026.js src/pages/page-cmp/index.js guides.css src/i18n.js tests/smoke.spec.js dist/app.js
git commit -m "Remove guide sections from Tours 2025, Tours 2026 and Comparison"
```

---

### Task 6: Docs and verification against the brief

**Files:**
- Modify: `CLAUDE.md` (evidencija's own)

- [ ] **Step 1: Update `CLAUDE.md`**

- Overview: "Four tabs" becomes "Five tabs: full-year 2025, YTD 2026, a 2025-vs-2026 comparison, Guides, and a Management financial dashboard."
- Add rows to the file table:

```
| `src/pages/page-guides.js` | `PageGuides` renders the Guides tab (cards or table, sort, search, movers banner, detail modal). DOM ids use the `-gd` suffix. |
| `src/guide-table.js` | Pure per-guide row math: merge, deltas, TOTAL, search, ranking, movers flags, monthly trend. Unit tested in `tests/guide-table.test.js`. |
```

- In "File responsibilities", change the `index.html` row from "4 empty `.page` containers" to "5 empty `.page` containers".
- In "Filtering and date cutoff", add: `filteredStats(st, months, cutoff?)` takes an optional `{ month, day }`, used by `guideMonthlyTrend` to show 2025 as a full year.
- Add a line: the guides list lives only on the Guides tab. Tours 2025, Tours 2026 and Comparison no longer render guide cards. Keyboard: `4` Guides, `5` Management.

- [ ] **Step 2: Full automated run**

Run: `npm run build && npx vitest run && npx playwright test`
Expected: everything green.

- [ ] **Step 3: Visual check against the brief (not just tests)**

Serve the folder (`python3 -m http.server`) and use Playwright MCP to open `index.html`. Screenshot and compare each item:
1. Nav shows Tours 2025, Tours 2026, Comparison, Guides, Management. `?` overlay lists 4 Guides and 5 Management.
2. Tours 2025, Tours 2026 and Comparison end after their last chart or table, with no guide section and no layout gap, and the footer sits below.
3. Guides tab default view: cards grouped by city, same guides and numbers as the old Comparison cards.
4. Sort chips: PAX up shows `#1`, `#2` badges. The movers banner text matches the top and bottom cards.
5. Search a partial name: cards narrow. A nonsense query shows "No guides found".
6. Table view: 5 metric groups by 4 columns, TOTAL row, note visible, horizontal scroll on a narrow window.
7. Card click: modal with a 2025 full-year line and a 2026 line ending at the as-of month, a tour-type mix section (2025 and 2026 bars per type) and a monthly table with a total row. Compare one guide against its old Tours 2026 card from a pre-change build or screenshot: type counts and monthly rows should agree, except that the old bars and table ignored the as-of date and the modal respects it. Escape closes. Modal readable in dark mode and scrolls on a short window.
8. Dark mode: repeat 3, 6, 7.
9. Change "Data through" and the language and month filters: cards, banner, table and TOTAL update; month options follow the new date.
10. Cross-check: table TOTAL Free Tours '26 versus the "Total Free Tours" KPI on Comparison. A small gap is expected (see `guideTotalNote`). Report both numbers, investigate only if the gap is large.
11. Management > Guides: clicking a guide (if that is the `jumpToGuide` caller) lands on the Guides tab with the card highlighted.
12. Console: no errors anywhere.

- [ ] **Step 4: Commit (when Antun approves)**

```bash
git add CLAUDE.md
git commit -m "Document Guides tab and guide-table module"
```

---

## Self-Review

**Spec coverage:** Sort and rank, search, movers banner, badges, Total Tours: Tasks 1 and 2. Table with TOTAL: Task 3. Detail modal and trend: Task 4. Guides tab (new tab like Jura's): Task 2. Removal of guide sections from Tours 2025, Tours 2026 and Comparison: Task 5. Docs and visual verification: Task 6.

**Placeholder scan:** none. Every code step has code; the two grep-first steps (Task 4 step 1, Task 5 steps 3 to 6) are concrete commands with a stated decision rule because the callers and dead selectors could not be searched while writing the plan.

**Type consistency:** row keys (`freeTours`, `freePax`, `paidTours`, `paidPax`, `totalTours`, `totalPax`, `stopped`, `isNew`) are the same in `buildGuideRows`, `cardHtml`, `guideTableHtml`, `flagsHtml`. `TABLE_METRICS` matches the `heads` map. All `PageGuides` ids use `-gd` through `_el()`. `PageGuides.jumpToGuide` is the only name callers use after Task 4.

**Assumptions to confirm when reviewing:**
1. The old cards' tour-type bars and monthly tables are re-homed in the detail modal. The old ones ignored the as-of date (raw `byType` and `byMonth`); the modal applies it, so its 2026 numbers can be lower than the old card's when the as-of date is before the latest data.
2. The trend chart shows full-year 2025 against 2026 up to the as-of date (as in Jura's report), not a like-for-like cut.
3. The movers banner ignores the search box, and TOTAL ignores it too.
4. Default card order is now computed from the rows (city, then 2026 free tours, then 2025 free tours). The old order used `mergedGuides`. The only difference is guides with zero tours in the filtered view.
5. Management moves from key `4` to `5`.
6. The language toggle is not wired into `main.js` or `index.html` today, so `hr` strings are added for parity but cannot be exercised in the UI.
7. `dist/app.js` is committed in this repo (GitHub Pages). If not, drop it from the `git add` lines.
