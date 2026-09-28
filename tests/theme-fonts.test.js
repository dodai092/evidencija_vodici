import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function jsFiles(dir) {
    return readdirSync(dir).flatMap(name => {
        const p = join(dir, name);
        return statSync(p).isDirectory() ? jsFiles(p) : p.endsWith('.js') ? [p] : [];
    });
}

describe('chart fonts', () => {
    it('no source file still names Montserrat', () => {
        const offenders = jsFiles(new URL('../src', import.meta.url).pathname)
            .filter(f => readFileSync(f, 'utf8').includes('Montserrat'));
        expect(offenders).toEqual([]);
    });
});
