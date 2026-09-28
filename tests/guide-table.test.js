import { describe, it, expect, beforeAll } from 'vitest';
import { setGlobalDate, filteredStats } from '../src/shared.js';
import {
    mergeGuides, deltaRow, pctLabel, buildGuideRows, sumRows, filterByName, rankGuides,
    flagDeclines, flagGainers, guideMonthlyTrend, guideMonthlyDetail, guideTypeMix, TABLE_METRICS,
} from '../src/guide-table.js';

const mo = (ft, fp, pt, pp) => ({ free: { tours: ft, pax: fp }, paid: { tours: pt, pax: pp } });
const guide = (name, city, byMonth) => ({
    name, city,
    // byDay is omitted on purpose: real data never has an empty byDay, and shared.js
    // filteredStats treats a truthy-but-empty one as "present" (no byMonth fallback).
    stats: { all: { byMonth }, eng: { byMonth } },
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
    it('month filter does not flip the New or Inactive badges', () => {
        // March has no activity for anyone in the fixture, yet only Cvita is new and only Dario stopped.
        const mar = buildGuideRows(merged, 'all', [3]);
        expect(mar.map(r => [r.isNew, r.stopped])).toEqual([[false, false], [false, false], [true, false], [false, true]]);
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

describe('flag ordering', () => {
    // Small: 10 -> 1 pax (-90%, -9). Big: 200 -> 100 pax (-50%, -100). Gain mirrors it.
    const two = buildGuideRows([
        { name: 'Small', city: 'Zagreb', g25: guide('Small', 'Zagreb', { 1: mo(1, 10, 0, 0) }), g26: guide('Small', 'Zagreb', { 1: mo(1, 1, 0, 0) }) },
        { name: 'Big', city: 'Zagreb', g25: guide('Big', 'Zagreb', { 1: mo(1, 200, 0, 0) }), g26: guide('Big', 'Zagreb', { 1: mo(1, 100, 0, 0) }) },
        { name: 'SmallUp', city: 'Zagreb', g25: guide('SmallUp', 'Zagreb', { 1: mo(1, 10, 0, 0) }), g26: guide('SmallUp', 'Zagreb', { 1: mo(1, 40, 0, 0) }) },
        { name: 'BigUp', city: 'Zagreb', g25: guide('BigUp', 'Zagreb', { 1: mo(1, 100, 0, 0) }), g26: guide('BigUp', 'Zagreb', { 1: mo(1, 200, 0, 0) }) },
    ], 'all', []);
    it('orders declines and gains by absolute pax change, not percent', () => {
        expect(flagDeclines(two).map(r => r.name)).toEqual(['Big', 'Small']);
        expect(flagGainers(two).map(r => r.name)).toEqual(['BigUp', 'SmallUp']);
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
