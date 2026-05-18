import { describe, it, expect, beforeEach } from 'vitest';
import {
    safeName,
    fmtN,
    getCutoffMonth,
    parseGlobalDate,
    getRangeLabel,
    filteredStats,
    setGlobalDate,
} from '../src/shared.js';

// ---------------------------------------------------------------------------
// safeName
// ---------------------------------------------------------------------------
describe('safeName', () => {
    it('replaces spaces with underscores', () => {
        expect(safeName('Ana Maria')).toBe('Ana_Maria');
    });

    it('replaces special characters with underscores', () => {
        expect(safeName('Marko Ć.')).toBe('Marko___');
    });

    it('leaves alphanumeric characters unchanged', () => {
        expect(safeName('Guide123')).toBe('Guide123');
    });
});

// ---------------------------------------------------------------------------
// fmtN
// ---------------------------------------------------------------------------
describe('fmtN', () => {
    it('rounds to nearest integer', () => {
        expect(fmtN(1.6)).toBe('2');
    });

    it('formats thousands with comma separator', () => {
        expect(fmtN(1500)).toBe('1,500');
    });

    it('handles zero', () => {
        expect(fmtN(0)).toBe('0');
    });

    it('rounds down correctly', () => {
        expect(fmtN(4.4)).toBe('4');
    });
});

// ---------------------------------------------------------------------------
// getCutoffMonth
// ---------------------------------------------------------------------------
describe('getCutoffMonth', () => {
    it('returns month as integer from date string', () => {
        setGlobalDate('2026-05-18');
        expect(getCutoffMonth()).toBe(5);
    });

    it('returns 1 for January', () => {
        setGlobalDate('2026-01-10');
        expect(getCutoffMonth()).toBe(1);
    });

    it('returns 12 for December', () => {
        setGlobalDate('2025-12-31');
        expect(getCutoffMonth()).toBe(12);
    });
});

// ---------------------------------------------------------------------------
// parseGlobalDate
// ---------------------------------------------------------------------------
describe('parseGlobalDate', () => {
    it('extracts year, month, and day as integers', () => {
        setGlobalDate('2026-05-18');
        expect(parseGlobalDate()).toEqual({ year: 2026, month: 5, day: 18 });
    });

    it('parses single-digit month and day correctly', () => {
        setGlobalDate('2026-03-07');
        expect(parseGlobalDate()).toEqual({ year: 2026, month: 3, day: 7 });
    });
});

// ---------------------------------------------------------------------------
// getRangeLabel
// ---------------------------------------------------------------------------
describe('getRangeLabel', () => {
    it('returns just "Jan" when cutoff is month 1', () => {
        setGlobalDate('2026-01-15');
        expect(getRangeLabel()).toBe('Jan');
    });

    it('returns "Jan–May" for month 5', () => {
        setGlobalDate('2026-05-18');
        expect(getRangeLabel()).toBe('Jan–May');
    });

    it('returns "Jan–Dec" for month 12', () => {
        setGlobalDate('2026-12-01');
        expect(getRangeLabel()).toBe('Jan–Dec');
    });
});

// ---------------------------------------------------------------------------
// filteredStats
// ---------------------------------------------------------------------------

// Shared fixture: guide stats with byMonth and byDay populated
const makeStats = () => ({
    byMonth: {
        '1': { free: { tours: 10, pax: 100 }, paid: { tours: 2, pax: 20 } },
        '2': { free: { tours: 8,  pax: 80  }, paid: { tours: 1, pax: 10 } },
        '3': { free: { tours: 6,  pax: 60  }, paid: { tours: 3, pax: 30 } },
    },
    byDay: {
        '3-1':  { free: { tours: 2, pax: 20 }, paid: { tours: 1, pax: 10 } },
        '3-5':  { free: { tours: 1, pax: 10 }, paid: { tours: 0, pax: 0  } },
        '3-15': { free: { tours: 3, pax: 30 }, paid: { tours: 2, pax: 20 } },
    },
});

describe('filteredStats', () => {
    beforeEach(() => {
        setGlobalDate('2026-03-10');
    });

    it('sums complete months (< cutoff month) from byMonth', () => {
        // cutoff = March (3), so Jan+Feb are complete
        const result = filteredStats(makeStats(), []);
        // Jan: free 10+100pax, paid 2+20pax; Feb: free 8+80pax, paid 1+10pax
        // March partial via byDay up to day 10: days 3-1 and 3-5 only
        expect(result.freeTours).toBe(10 + 8 + 2 + 1);   // Jan + Feb + Mar day1 + Mar day5
        expect(result.freePax).toBe(100 + 80 + 20 + 10);
        expect(result.paidTours).toBe(2 + 1 + 1 + 0);
        expect(result.paidPax).toBe(20 + 10 + 10 + 0);
    });

    it('partial current month uses byDay up to cutoffDay, excludes later days', () => {
        setGlobalDate('2026-03-10');
        const result = filteredStats(makeStats(), [3]);
        // Only days 1 and 5 are <= 10; day 15 is excluded
        expect(result.freeTours).toBe(2 + 1);
        expect(result.freePax).toBe(20 + 10);
        expect(result.paidTours).toBe(1 + 0);
        expect(result.paidPax).toBe(10 + 0);
    });

    it('partial current month falls back to byMonth when byDay is absent', () => {
        setGlobalDate('2026-03-10');
        const stats = makeStats();
        delete stats.byDay;
        const result = filteredStats(stats, [3]);
        // Fallback: uses byMonth['3']
        expect(result.freeTours).toBe(6);
        expect(result.freePax).toBe(60);
        expect(result.paidTours).toBe(3);
        expect(result.paidPax).toBe(30);
    });

    it('month filter limits which months are summed', () => {
        const result = filteredStats(makeStats(), [1]);
        // Only January — complete month
        expect(result.freeTours).toBe(10);
        expect(result.freePax).toBe(100);
        expect(result.paidTours).toBe(2);
        expect(result.paidPax).toBe(20);
    });

    it('returns zeros for a missing byMonth entry', () => {
        const stats = makeStats();
        delete stats.byMonth['1'];
        const result = filteredStats(stats, [1]);
        expect(result).toEqual({ freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 });
    });
});
