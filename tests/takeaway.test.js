import { describe, it, expect } from 'vitest';
import { comparisonTakeaway } from '../src/pages/page-cmp/takeaway.js';

describe('comparisonTakeaway', () => {
    it('says down for free pax and up for paid tours, with rounded percents and both values', () => {
        expect(comparisonTakeaway({ fp25: 79341, fp26: 59922, pt25: 100, pt26: 112 }))
            .toBe('Free pax are 24% down on 2025 (59,922 vs 79,341); paid tours are 12% up (112 vs 100).');
    });

    it('says flat when the change rounds to 0%', () => {
        expect(comparisonTakeaway({ fp25: 1000, fp26: 1001, pt25: 50, pt26: 50 }))
            .toBe('Free pax are flat on 2025 (1,001 vs 1,000); paid tours are flat (50 vs 50).');
    });

    it('drops the percent when there is no 2025 baseline', () => {
        expect(comparisonTakeaway({ fp25: 0, fp26: 500, pt25: 0, pt26: 3 }))
            .toBe('Free pax are 500 vs 0 in 2025; paid tours are 3 vs 0.');
    });
});
