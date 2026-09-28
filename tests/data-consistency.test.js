import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const CITIES = ['Zagreb', 'Dubrovnik', 'Split', 'Zadar'];

function load(file, year) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    return new Function(`${src}; return { guides: guideStats${year}, cities: cityStats${year} };`)();
}

describe.each([[25, 'data-2025.js'], [26, 'data-2026.js']])('guide totals tie to city totals (20%i)', (year, file) => {
    const { guides, cities } = load(file, year);
    for (const key of ['tours', 'pax']) {
        it(`free ${key} of guides in tracked cities equal the city totals`, () => {
            const byGuide = guides.filter(g => CITIES.includes(g.city)).reduce((a, g) => a + g.stats.all.free[key], 0);
            const byCity = CITIES.reduce((a, c) => a + (cities[c] ? cities[c].all.free[key] : 0), 0);
            expect(byGuide).toBe(byCity);
        });
    }
});
