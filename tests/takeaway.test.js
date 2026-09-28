import { describe, it, expect } from 'vitest';
import { comparisonTakeaway } from '../src/pages/page-cmp/takeaway.js';

describe('comparisonTakeaway', () => {
    it('splits the pax change into tour count and average group size', () => {
        expect(comparisonTakeaway({ fp25: 79341, fp26: 59922, ft25: 3720, ft26: 3564 }))
            .toBe('Free pax are 24% down on 2025 (59,922 vs 79,341): tours are 4% down, average group size is 21% down (16.8 vs 21.3).');
    });

    it('says flat when a change rounds to 0%', () => {
        expect(comparisonTakeaway({ fp25: 1000, fp26: 1001, ft25: 100, ft26: 100 }))
            .toBe('Free pax are flat on 2025 (1,001 vs 1,000): tours are flat, average group size is flat (10.0 vs 10.0).');
    });

    it('says up when 2026 is higher', () => {
        expect(comparisonTakeaway({ fp25: 1000, fp26: 1500, ft25: 100, ft26: 100 }))
            .toBe('Free pax are 50% up on 2025 (1,500 vs 1,000): tours are flat, average group size is 50% up (15.0 vs 10.0).');
    });

    it('drops the breakdown when there is no 2025 baseline', () => {
        expect(comparisonTakeaway({ fp25: 0, fp26: 500, ft25: 0, ft26: 30 }))
            .toBe('Free pax are 500 vs 0 in 2025.');
    });
});
