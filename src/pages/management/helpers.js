import { getGlobalDate } from '../../shared.js';

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmt(v, dec = 0) {
    return (v || 0).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export function fmtEur(v) {
    const n = v || 0;
    return (n < 0 ? '−€' : '€') + fmt(Math.abs(n));
}
export function gmClass(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu'; }
export function deltaClass(v) { return v > 0 ? 'delta-pos' : v < 0 ? 'delta-neg' : 'delta-neu'; }

export function dd(v, eurSign = false) {
    if (v === null || v === undefined) return '<span class="delta-neu">—</span>';
    const cls = deltaClass(v);
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';
    const abs = fmt(Math.abs(v));
    return `<span class="${cls}">${sign}${eurSign ? '€' : ''}${abs}</span>`;
}

// ── Data access helpers ───────────────────────────────────────────────────────

let _guide25 = null;
function _build25Lookup() {
    const map = {};
    if (typeof guideStats25 !== 'undefined') guideStats25.forEach(g => { map[g.name] = g; });
    return map;
}
export function get25(name) {
    if (!_guide25) _guide25 = _build25Lookup();
    return _guide25[name] || null;
}

export function guidesForCity(city) {
    return guideStats26.filter(g => city === 'all' || g.city === city);
}

// ── Aggregation ───────────────────────────────────────────────────────────────

export function _sumMgmtMonths(mgmt, cutoff) {
    const acc = { revenue:0, vendorCost:0, grossMargin:0, tourCost:0,
                  commissionCost:0, processingFee:0, vatAmount:0, amountBeforeTax:0 };
    for (let m = 1; m <= cutoff; m++) {
        const d = mgmt?.byMonth?.[String(m)] || {};
        acc.revenue         += d.revenue         || 0;
        acc.vendorCost      += d.vendorCost      || 0;
        acc.grossMargin     += d.grossMargin     || 0;
        acc.tourCost        += d.tourCost        || 0;
        acc.commissionCost  += d.commissionCost  || 0;
        acc.processingFee   += d.processingFee   || 0;
        acc.vatAmount       += d.vatAmount       || 0;
        acc.amountBeforeTax += d.amountBeforeTax || 0;
    }
    return acc;
}

export function filterMgmtByDate(mgmt, cutoffDate) {
    if (!mgmt || !cutoffDate) return { revenue:0, vendorCost:0, grossMargin:0, tourCost:0, commissionCost:0, processingFee:0, vatAmount:0, amountBeforeTax:0 };
    const [, monthStr, dayStr] = cutoffDate.split('-');
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay   = parseInt(dayStr);
    const acc = { revenue:0, vendorCost:0, grossMargin:0, tourCost:0, commissionCost:0, processingFee:0, vatAmount:0, amountBeforeTax:0 };
    if (!mgmt.byDay) return _sumMgmtMonths(mgmt, cutoffMonth);
    for (const [key, val] of Object.entries(mgmt.byDay)) {
        const [m, d] = key.split('-').map(Number);
        if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
            acc.revenue         += val.revenue         || 0;
            acc.vendorCost      += val.vendorCost      || 0;
            acc.grossMargin     += val.grossMargin     || 0;
            acc.tourCost        += val.tourCost        || 0;
            acc.commissionCost  += val.commissionCost  || 0;
            acc.processingFee   += val.processingFee   || 0;
            acc.vatAmount       += val.vatAmount       || 0;
            acc.amountBeforeTax += val.amountBeforeTax || 0;
        }
    }
    return acc;
}

export function filterStatsByDate(stats, cutoffDate) {
    if (!stats || !cutoffDate) return { freeTours: 0, paidTours: 0, freePax: 0, paidPax: 0 };
    const [, monthStr, dayStr] = cutoffDate.split('-');
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay   = parseInt(dayStr);
    let freeTours=0, paidTours=0, freePax=0, paidPax=0;
    if (stats.byDay) {
        for (const [key, val] of Object.entries(stats.byDay)) {
            const [m, d] = key.split('-').map(Number);
            if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
                freeTours += val.free?.tours || 0;
                paidTours += val.paid?.tours || 0;
                freePax   += val.free?.pax   || 0;
                paidPax   += val.paid?.pax   || 0;
            }
        }
    }
    return { freeTours, paidTours, freePax, paidPax };
}

export function computeKpisForGuides(guides) {
    return guides.reduce((acc, g) => {
        if (!g.mgmt) return acc;
        const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
        const sts = filterStatsByDate(g.stats.all, getGlobalDate());
        acc.revenue         += fin.revenue;
        acc.vendorCost      += fin.vendorCost;
        acc.grossMargin     += fin.grossMargin;
        acc.tourCost        += fin.tourCost;
        acc.commissionCost  += fin.commissionCost;
        acc.processingFee   += fin.processingFee;
        acc.vatAmount       += fin.vatAmount;
        acc.amountBeforeTax += fin.amountBeforeTax;
        acc.freeTours  += sts.freeTours;  acc.paidTours += sts.paidTours;
        acc.freePax    += sts.freePax;    acc.paidPax   += sts.paidPax;
        return acc;
    }, { revenue:0, vendorCost:0, grossMargin:0, tourCost:0, commissionCost:0,
         processingFee:0, vatAmount:0, amountBeforeTax:0,
         freeTours:0, paidTours:0, freePax:0, paidPax:0 });
}

// Memoized — cache key is `${cutoffDate}-${city}`. Call clearKpiCache() on date change.
let _kpiCache = {};
export function computeFilteredKpis(city) {
    const key = `${getGlobalDate()}-${city}`;
    if (!_kpiCache[key]) _kpiCache[key] = computeKpisForGuides(guidesForCity(city));
    return _kpiCache[key];
}
export function clearKpiCache() { _kpiCache = {}; }

export function computeCity25(city) {
    if (typeof guideStats25 === 'undefined') return null;
    const src = city === 'all' ? guideStats25 : guideStats25.filter(g => g.city === city);
    return computeKpisForGuides(src);
}

export function buildMonthlyFromDays(guides, cutoffMonth, cutoffDay, fields = ['revenue', 'grossMargin']) {
    const init = () => Object.fromEntries(fields.map(f => [f, 0]));
    const result = {};
    for (let m = 1; m <= cutoffMonth; m++) result[m] = init();
    guides.forEach(g => {
        if (!g.mgmt?.byDay) return;
        for (const [key, val] of Object.entries(g.mgmt.byDay)) {
            const [m, d] = key.split('-').map(Number);
            if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
                fields.forEach(f => { result[m][f] += val[f] || 0; });
            }
        }
    });
    return result;
}

// ── Chart theming ─────────────────────────────────────────────────────────────

export function axisDefaults() {
    const s = getComputedStyle(document.body);
    return {
        ticks: { color: s.getPropertyValue('--text2').trim(), font: { family: 'Montserrat', size: 11 } },
        grid:  { color: s.getPropertyValue('--border').trim() },
    };
}
export function tooltipDefaults() {
    const s = getComputedStyle(document.body);
    return {
        backgroundColor: s.getPropertyValue('--card-bg').trim(),
        titleColor:      s.getPropertyValue('--text').trim(),
        bodyColor:       s.getPropertyValue('--text2').trim(),
        borderColor:     s.getPropertyValue('--border-dark').trim(),
        borderWidth: 1,
    };
}
export function getThemeColors() {
    const s = getComputedStyle(document.body);
    return {
        c25:   s.getPropertyValue('--y25').trim(),
        c26:   s.getPropertyValue('--y26').trim(),
        green: s.getPropertyValue('--green').trim(),
        red:   s.getPropertyValue('--delta-neg').trim() || '#D4545A',
    };
}

// ── Chart registry + builders ─────────────────────────────────────────────────
// All management Chart.js instances are stored here so mgmtUpdateCharts can iterate them.

export const _charts = {};

export function destroyChart(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

export function makeBarChart(canvasId, labels, datasets, opts = {}) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const ax = axisDefaults();
    const dsets = Array.isArray(datasets) && typeof datasets[0] === 'object' && datasets[0].data !== undefined
        ? datasets
        : [{ data: datasets, backgroundColor: opts.colors || '#8FA8BC', borderRadius: 4, borderSkipped: false }];
    _charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: dsets },
        options: {
            indexAxis: opts.horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: opts.showLegend || false, labels: { color: ax.ticks.color, font: ax.ticks.font } },
                tooltip: { ...tooltipDefaults(), callbacks: opts.tooltipCb || {} },
            },
            scales: {
                x: { ...ax, grid: opts.horizontal ? ax.grid : { display: false }, stacked: opts.stacked || false },
                y: { ...ax, grid: opts.horizontal ? { display: false } : ax.grid, stacked: opts.stacked || false },
            },
        },
    });
}

export function makeLineChart(canvasId, labels, datasets, extraScales = null) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const ax = axisDefaults();
    const scales = extraScales || { x: ax, y: ax };
    _charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: ax.ticks.color, font: ax.ticks.font } },
                tooltip: { ...tooltipDefaults() },
            },
            scales,
        },
    });
}
