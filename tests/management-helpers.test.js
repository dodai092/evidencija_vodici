import { describe, it, expect } from 'vitest';
import { findBiggestNegativeMover } from '../src/pages/management/helpers.js';

describe('findBiggestNegativeMover', () => {
    it('returns the entry with the most negative GM delta', () => {
        const entries = [
            { name: 'A', revenue26: 10000, gm26: 1000, revenue25: 10000, gm25: 1200 },  // delta -200
            { name: 'B', revenue26: 20000, gm26: 500,  revenue25: 20000, gm25: 5000 },  // delta -4500
            { name: 'C', revenue26: 5000,  gm26: 800,  revenue25: 5000,  gm25: 600 },   // delta +200
        ];
        const result = findBiggestNegativeMover(entries);
        expect(result.name).toBe('B');
        expect(result.delta).toBe(-4500);
    });

    it('excludes entries below the minimum revenue floor in both years', () => {
        const entries = [
            { name: 'Tiny', revenue26: 50, gm26: 10, revenue25: 60, gm25: 400 },   // delta -390, but revenue < 500 both years
            { name: 'Real', revenue26: 8000, gm26: 700, revenue25: 8000, gm25: 900 }, // delta -200
        ];
        const result = findBiggestNegativeMover(entries);
        expect(result.name).toBe('Real');
    });

    it('includes an entry if EITHER year is above the revenue floor', () => {
        const entries = [
            { name: 'FadingOut', revenue26: 100, gm26: -50, revenue25: 9000, gm25: 3000 }, // delta -3050, revenue25 >= 500
        ];
        const result = findBiggestNegativeMover(entries);
        expect(result.name).toBe('FadingOut');
    });

    it('returns null when no entry has a negative delta', () => {
        const entries = [
            { name: 'A', revenue26: 10000, gm26: 1200, revenue25: 10000, gm25: 1000 },
        ];
        expect(findBiggestNegativeMover(entries)).toBeNull();
    });

    it('returns null for an empty list', () => {
        expect(findBiggestNegativeMover([])).toBeNull();
    });
});
