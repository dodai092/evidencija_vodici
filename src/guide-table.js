import { filteredStats, CITIES } from './shared.js';

const ZERO = { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 };
const ALL_METRICS = ['freeTours', 'freePax', 'paidTours', 'paidPax', 'totalTours', 'totalPax'];

export const TABLE_METRICS = ['freeTours', 'freePax', 'paidTours'];

export function mergeGuides(list25, list26) {
    const map = new Map();
    list25.forEach(g => map.set(g.name, { name: g.name, city: g.city, g25: g, g26: null }));
    list26.forEach(g => {
        const cur = map.get(g.name);
        if (cur) { cur.g26 = g; cur.city = g.city; }
        else map.set(g.name, { name: g.name, city: g.city, g25: null, g26: g });
    });
    return [...map.values()];
}

export function deltaRow(v25, v26) {
    const delta = v26 - v25;
    const pct = v25 <= 0 ? null : Math.round((delta / v25) * 1000) / 10;
    return { v25, v26, delta, pct };
}

export function pctLabel(d, newText = 'new') {
    if (d.pct === null) return d.v26 > 0 ? newText : '—';
    return `${d.delta > 0 ? '+' : ''}${d.pct}%`;
}

function statsOrZero(guide, lang, months, cutoff) {
    const st = guide && guide.stats[lang];
    return st ? filteredStats(st, months, cutoff) : ZERO;
}

export function buildGuideRows(merged, lang, months) {
    return merged.map(m => {
        const f25 = statsOrZero(m.g25, lang, months);
        const f26 = statsOrZero(m.g26, lang, months);
        // Activity is judged on all languages and all months up to the as-of date,
        // so neither the language nor the month filter flips a badge.
        const a25 = statsOrZero(m.g25, 'all', []);
        const a26 = statsOrZero(m.g26, 'all', []);
        const act25 = a25.freeTours + a25.paidTours;
        const act26 = a26.freeTours + a26.paidTours;
        return {
            name: m.name,
            city: m.city,
            stopped: act25 > 0 && act26 === 0,
            isNew: act25 === 0 && act26 > 0,
            freeTours: deltaRow(f25.freeTours, f26.freeTours),
            freePax: deltaRow(f25.freePax, f26.freePax),
            paidTours: deltaRow(f25.paidTours, f26.paidTours),
            paidPax: deltaRow(f25.paidPax, f26.paidPax),
            totalTours: deltaRow(f25.freeTours + f25.paidTours, f26.freeTours + f26.paidTours),
            totalPax: deltaRow(f25.freePax + f25.paidPax, f26.freePax + f26.paidPax),
        };
    });
}

export function sumRows(rows) {
    const total = { name: 'TOTAL' };
    ALL_METRICS.forEach(k => {
        total[k] = deltaRow(
            rows.reduce((s, r) => s + r[k].v25, 0),
            rows.reduce((s, r) => s + r[k].v26, 0),
        );
    });
    return total;
}

export function filterByName(rows, query) {
    const q = query.trim().toLowerCase();
    return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows;
}

const cityIndex = (c) => { const i = CITIES.indexOf(c); return i < 0 ? CITIES.length : i; };

export function rankGuides(rows, sort) {
    if (sort === 'name') return [...rows].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'freePax') return [...rows].sort((a, b) => b.freePax.v26 - a.freePax.v26 || a.name.localeCompare(b.name));
    if (sort === 'paid') return [...rows].sort((a, b) => b.paidTours.v26 - a.paidTours.v26 || a.name.localeCompare(b.name));
    return [...rows].sort((a, b) => cityIndex(a.city) - cityIndex(b.city) || a.name.localeCompare(b.name));
}

// 2025 is a full year. 2026 stops at the as-of date, so later months are null (chart gap).
export function guideMonthlyDetail(g25, g26, lang, cutoffMonth, cutoffDay) {
    const st25 = g25 && g25.stats[lang];
    const st26 = g26 && g26.stats[lang];
    return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return {
            month,
            y25: st25 ? filteredStats(st25, [month], { month: 12, day: 31 }) : ZERO,
            y26: st26 && month <= cutoffMonth ? filteredStats(st26, [month], { month: cutoffMonth, day: cutoffDay }) : null,
        };
    });
}

export function guideMonthlyTrend(g25, g26, lang, cutoffMonth, cutoffDay) {
    return guideMonthlyDetail(g25, g26, lang, cutoffMonth, cutoffDay).map(r => ({
        month: r.month,
        pax25: r.y25.freePax + r.y25.paidPax,
        pax26: r.y26 ? r.y26.freePax + r.y26.paidPax : null,
    }));
}

function typeTotals(st, cutoffMonth, cutoffDay) {
    const acc = {};
    const add = (map) => {
        if (!map) return;
        Object.entries(map).forEach(([type, v]) => {
            const a = acc[type] || (acc[type] = { tours: 0, pax: 0 });
            a.tours += v.tours || 0;
            a.pax += v.pax || 0;
        });
    };
    for (let m = 1; m <= 12; m++) {
        if (m < cutoffMonth) {
            add(st.byMonthType && st.byMonthType[String(m)]);
        } else if (m === cutoffMonth) {
            if (st.byDayType && Object.keys(st.byDayType).length > 0) {
                for (let d = 1; d <= cutoffDay; d++) add(st.byDayType[`${m}-${d}`]);
            } else {
                add(st.byMonthType && st.byMonthType[String(m)]);
            }
        }
    }
    return acc;
}

export function guideTypeMix(g25, g26, lang, cutoffMonth, cutoffDay) {
    const st25 = g25 && g25.stats[lang];
    const st26 = g26 && g26.stats[lang];
    const a = st25 ? typeTotals(st25, 12, 31) : {};
    const b = st26 ? typeTotals(st26, cutoffMonth, cutoffDay) : {};
    return [...new Set([...Object.keys(a), ...Object.keys(b)])]
        .map(type => ({
            type,
            t25: a[type] ? a[type].tours : 0, p25: a[type] ? a[type].pax : 0,
            t26: b[type] ? b[type].tours : 0, p26: b[type] ? b[type].pax : 0,
        }))
        .sort((x, y) => y.t26 - x.t26 || y.t25 - x.t25 || x.type.localeCompare(y.type));
}
