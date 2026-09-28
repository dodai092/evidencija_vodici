import { fmtN } from '../../shared.js';

function change(v25, v26) {
    const pct = Math.round(Math.abs(v26 - v25) / v25 * 100);
    if (pct === 0) return 'flat';
    return `${pct}% ${v26 > v25 ? 'up' : 'down'}`;
}

export function comparisonTakeaway({ fp25, fp26, pt25, pt26 }) {
    if (fp25 === 0 || pt25 === 0) {
        return `Free pax are ${fmtN(fp26)} vs ${fmtN(fp25)} in 2025; paid tours are ${fmtN(pt26)} vs ${fmtN(pt25)}.`;
    }
    return `Free pax are ${change(fp25, fp26)} on 2025 (${fmtN(fp26)} vs ${fmtN(fp25)}); `
        + `paid tours are ${change(pt25, pt26)} (${fmtN(pt26)} vs ${fmtN(pt25)}).`;
}
