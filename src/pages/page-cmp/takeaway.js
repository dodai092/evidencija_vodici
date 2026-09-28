import { fmtN } from '../../shared.js';

function change(v25, v26) {
    const pct = Math.round(Math.abs(v26 - v25) / v25 * 100);
    if (pct === 0) return 'flat';
    return `${pct}% ${v26 > v25 ? 'up' : 'down'}`;
}

// Free pax = tours x average group size, so say which of the two moved.
export function comparisonTakeaway({ fp25, fp26, ft25, ft26 }) {
    if (fp25 === 0 || ft25 === 0 || ft26 === 0) {
        return `Free pax are ${fmtN(fp26)} vs ${fmtN(fp25)} in 2025.`;
    }
    const avg25 = fp25 / ft25, avg26 = fp26 / ft26;
    return `Free pax are ${change(fp25, fp26)} on 2025 (${fmtN(fp26)} vs ${fmtN(fp25)}): `
        + `tours are ${change(ft25, ft26)}, `
        + `average group size is ${change(avg25, avg26)} (${avg26.toFixed(1)} vs ${avg25.toFixed(1)}).`;
}
