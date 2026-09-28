import { describe, it, expect } from 'vitest';
import { yearDeltaFooter } from '../src/pages/page-cmp/charts.js';

describe('yearDeltaFooter', () => {
    it('shows the 2026 vs 2025 delta and percent change', () => {
        const items = [
            { label: 'Jan–Sep 2025', value: 100 },
            { label: 'Jan–Sep 2026', value: 120 },
        ];
        expect(yearDeltaFooter(items)).toBe('2026 vs 2025: +20 (+20%)');
    });

    it('shows a negative delta without a leading +', () => {
        const items = [
            { label: 'Jan–Sep 2025', value: 100 },
            { label: 'Jan–Sep 2026', value: 80 },
        ];
        expect(yearDeltaFooter(items)).toBe('2026 vs 2025: -20 (-20%)');
    });

    it('formats large deltas with a thousands separator', () => {
        const items = [
            { label: '2025', value: 1000 },
            { label: '2026', value: 2500 },
        ];
        expect(yearDeltaFooter(items)).toBe('2026 vs 2025: +1,500 (+150%)');
    });

    it('omits the percent when 2025 is zero', () => {
        const items = [
            { label: '2025', value: 0 },
            { label: '2026', value: 5 },
        ];
        expect(yearDeltaFooter(items)).toBe('2026 vs 2025: +5');
    });

    it('returns an empty string when fewer than 2 items are hovered', () => {
        expect(yearDeltaFooter([{ label: '2025', value: 10 }])).toBe('');
        expect(yearDeltaFooter([])).toBe('');
    });

    it('returns an empty string when a year is missing a value (gap in spanGaps: false data)', () => {
        const items = [
            { label: '2025', value: null },
            { label: '2026', value: 10 },
        ];
        expect(yearDeltaFooter(items)).toBe('');
    });
});
