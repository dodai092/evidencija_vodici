// Text drawn under the comparison charts: "2025 / 2026" counts and the change.
// Chooses the richest layout that fits the width of one x slot, so labels never overprint.

function delta({ v25, v26 }, fmt) {
    const d = v26 - v25;
    const pct = v25 > 0 ? ((d / v25) * 100).toFixed(0) : (v26 > 0 ? '∞' : '0');
    return {
        d,
        pct,
        sign: d > 0 ? '+' : '',
        arrow: d > 0 ? '▲' : d < 0 ? '▼' : '=',
        color: d > 0 ? '#1D9E75' : d < 0 ? '#D4545A' : '#999',
    };
}

export function planDeltaLabels(items, slotWidth, measure, fmt) {
    const full = items.map(it => {
        const { d, pct, sign, arrow, color } = delta(it, fmt);
        return { line1: `${fmt(it.v25)} / ${fmt(it.v26)}`, line2: `${arrow} ${fmt(Math.abs(d))} (${sign}${pct}%)`, color };
    });
    const widest = ls => Math.max(0, ...ls.flatMap(l => [l.line1, l.line2]).filter(Boolean).map(measure));
    if (widest(full) <= slotWidth) return { step: 1, labels: full };

    const compact = items.map(it => {
        const { pct, arrow, color } = delta(it, fmt);
        return { line1: null, line2: `${arrow}${pct === '∞' ? '∞' : Math.abs(pct) + '%'}`, color };
    });
    const w = widest(compact);
    return { step: w <= slotWidth ? 1 : Math.ceil(w / slotWidth), labels: compact };
}

export function drawDeltaLabels(chart, textColor, fmt) {
    const { ctx, scales: { x: xAxis } } = chart;
    const [ds0, ds1] = [chart.data.datasets[0].data, chart.data.datasets[1].data];
    const items = chart.data.labels.map((_, i) => ({ v25: ds0[i] || 0, v26: ds1[i] || 0 }));
    const n = items.length;
    const slot = n > 1 ? Math.abs(xAxis.getPixelForValue(1) - xAxis.getPixelForValue(0)) : xAxis.width;
    ctx.save();
    ctx.font = "bold 10px 'IBM Plex Sans',sans-serif";
    const { step, labels } = planDeltaLabels(items, slot - 4, s => ctx.measureText(s).width, fmt);
    ctx.textAlign = 'center';
    labels.forEach((l, i) => {
        if (i % step) return;
        const x = xAxis.getPixelForValue(i);
        const y = xAxis.bottom + 12;
        if (l.line1) {
            ctx.fillStyle = textColor;
            ctx.font = "500 10px 'IBM Plex Sans',sans-serif";
            ctx.fillText(l.line1, x, y);
        }
        ctx.fillStyle = l.color;
        ctx.font = "bold 10px 'IBM Plex Sans',sans-serif";
        ctx.fillText(l.line2, x, l.line1 ? y + 13 : y);
    });
    ctx.restore();
}
