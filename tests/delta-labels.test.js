import { describe, it, expect } from 'vitest';
import { planDeltaLabels } from '../src/pages/page-cmp/delta-labels.js';

const fmt = v => Math.round(v).toLocaleString('en-GB');
const measure = s => s.length * 6;
const items = [{ v25: 27011, v26: 19799 }, { v25: 68, v26: 134 }, { v25: 50, v26: 50 }];

describe('planDeltaLabels', () => {
    it('keeps both lines when the slot is wide enough', () => {
        const { step, labels } = planDeltaLabels(items, 200, measure, fmt);
        expect(step).toBe(1);
        expect(labels[0]).toEqual({ line1: '27,011 / 19,799', line2: '▼ 7,212 (-27%)', color: '#D4545A' });
        expect(labels[1]).toEqual({ line1: '68 / 134', line2: '▲ 66 (+97%)', color: '#1D9E75' });
        expect(labels[2]).toEqual({ line1: '50 / 50', line2: '= 0 (0%)', color: '#999' });
    });

    it('drops the counts line and keeps only the percent when the slot is narrow', () => {
        const { step, labels } = planDeltaLabels(items, 40, measure, fmt);
        expect(step).toBe(1);
        expect(labels.map(l => l.line1)).toEqual([null, null, null]);
        expect(labels.map(l => l.line2)).toEqual(['▼27%', '▲97%', '=0%']);
    });

    it('draws every nth label when even the percent does not fit', () => {
        const { step } = planDeltaLabels(items, 20, measure, fmt);
        expect(step).toBe(2);
    });

    it('never plans a label wider than the space it gets', () => {
        for (const slot of [15, 20, 30, 40, 60, 90, 120, 200]) {
            const { step, labels } = planDeltaLabels(items, slot, measure, fmt);
            for (const l of labels) {
                for (const line of [l.line1, l.line2]) {
                    if (line) expect(measure(line)).toBeLessThanOrEqual(slot * step);
                }
            }
        }
    });
});
