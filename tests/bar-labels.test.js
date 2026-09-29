import { describe, it, expect } from 'vitest';
import { placeBarLabels } from '../src/pages/page-cmp/bar-labels.js';

const measure = s => s.length * 6;
const overlaps = (a, b) => {
    const wa = measure(a.text), wb = measure(b.text);
    return Math.abs(a.x - b.x) < (wa + wb) / 2 && Math.abs(a.y - b.y) < 10;
};

describe('placeBarLabels', () => {
    it('leaves labels that do not collide where they are', () => {
        const out = placeBarLabels([{ x: 20, y: 100, text: '72p' }, { x: 80, y: 100, text: '12p' }], measure);
        expect(out).toEqual([{ x: 20, y: 100, text: '72p' }, { x: 80, y: 100, text: '12p' }]);
    });

    it('moves a colliding label up by one line', () => {
        const out = placeBarLabels([{ x: 20, y: 100, text: '562p' }, { x: 30, y: 100, text: '809p' }], measure);
        expect(out[0]).toEqual({ x: 20, y: 100, text: '562p' });
        expect(out[1]).toEqual({ x: 30, y: 89, text: '809p' });
    });

    it('drops a label that would need to go up more than two lines', () => {
        const stack = [0, 1, 2, 3].map(i => ({ x: 20 + i, y: 100, text: '100p' }));
        const out = placeBarLabels(stack, measure);
        expect(out.slice(0, 3).every(Boolean)).toBe(true);
        expect(out[3]).toBeNull();
    });

    it('keeps the input order and never leaves two placed labels overlapping', () => {
        const input = [{ x: 30, y: 90, text: '1022p' }, { x: 12, y: 95, text: '72p' }, { x: 22, y: 92, text: '63p' }, { x: 40, y: 100, text: '79p' }];
        const out = placeBarLabels(input, measure);
        expect(out).toHaveLength(4);
        expect(out[0].text).toBe('1022p');
        const placed = out.filter(Boolean);
        for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) expect(overlaps(placed[i], placed[j])).toBe(false);
    });
});
