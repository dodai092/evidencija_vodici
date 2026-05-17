/* management.js — FreeSpirit Management Dashboard */

// ── Tab routing ───────────────────────────────────────────────────────────────

const MgmtPages = {
    pl:       { _init: false },
    guides:   { _init: false },
    channels: { _init: false },
    ops:      { _init: false },
    cities:   { _init: false },
};

let _activeTab = 'pl';
let _activeCity = 'all';
let _sortCol = 'grossMargin';
let _sortDir = -1;

function mgmtShowTab(id, el) {
    document.querySelectorAll('.mgmt-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active','mgmt-tab-active'));
    document.getElementById('mgmt-' + id).classList.add('active');
    el.classList.add('active', 'mgmt-tab-active');
    _activeTab = id;
    // Hide sticky bar when leaving P&L tab
    if (id !== 'pl') {
        const bar = document.getElementById('sticky-kpi-bar');
        if (bar) bar.style.display = 'none';
    }
    if (!MgmtPages[id]._init) {
        if (id === 'pl')       initPl();
        if (id === 'guides')   initGuides();
        if (id === 'channels') initChannels();
        if (id === 'ops')      initOps();
        if (id === 'cities')   initCities();
        MgmtPages[id]._init = true;
    }
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function fmt(v, dec = 0) {
    return (v || 0).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtEur(v) {
    const n = v || 0;
    return (n < 0 ? '−€' : '€') + fmt(Math.abs(n));
}
function gmClass(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu'; }
function deltaClass(v) { return v > 0 ? 'delta-pos' : v < 0 ? 'delta-neg' : 'delta-neu'; }

function dd(v, eurSign = false) {
    if (v === null || v === undefined) return '<span class="delta-neu">—</span>';
    const cls = deltaClass(v);
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';
    const abs = fmt(Math.abs(v));
    return `<span class="${cls}">${sign}${eurSign ? '€' : ''}${abs}</span>`;
}

function build25Lookup() {
    const map = {};
    if (typeof guideStats25 !== 'undefined') guideStats25.forEach(g => { map[g.name] = g; });
    return map;
}
let _guide25 = null;
function get25(name) {
    if (!_guide25) _guide25 = build25Lookup();
    return _guide25[name] || null;
}

function guidesForCity(city) {
    return guideStats26.filter(g => city === 'all' || g.city === city);
}

function mgmtCutoffMonth() {
    return parseInt(GLOBAL_DATE.split('-')[1]);
}

function _sumMgmtMonths(mgmt, cutoff) {
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

function _sumStatMonths(statsAll, cutoff) {
    let freeTours=0, paidTours=0, freePax=0, paidPax=0;
    Object.entries(statsAll?.byMonth || {}).forEach(([mStr, mv]) => {
        if (parseInt(mStr) <= cutoff) {
            freeTours += mv.free.tours; paidTours += mv.paid.tours;
            freePax   += mv.free.pax;  paidPax   += mv.paid.pax;
        }
    });
    return { freeTours, paidTours, freePax, paidPax };
}

function filterMgmtByDate(mgmt, cutoffDate) {
    if (!mgmt || !cutoffDate) return { revenue:0, vendorCost:0, grossMargin:0, tourCost:0, commissionCost:0, processingFee:0, vatAmount:0, amountBeforeTax:0 };

    const [year, monthStr, dayStr] = cutoffDate.split('-');
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay = parseInt(dayStr);

    const acc = { revenue:0, vendorCost:0, grossMargin:0, tourCost:0, commissionCost:0, processingFee:0, vatAmount:0, amountBeforeTax:0 };
    if (!mgmt.byDay) return acc;

    for (const [key, val] of Object.entries(mgmt.byDay)) {
        const [m, d] = key.split('-').map(Number);
        if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
            acc.revenue += val.revenue || 0;
            acc.vendorCost += val.vendorCost || 0;
            acc.grossMargin += val.grossMargin || 0;
            acc.tourCost += val.tourCost || 0;
            acc.commissionCost += val.commissionCost || 0;
            acc.processingFee += val.processingFee || 0;
            acc.vatAmount += val.vatAmount || 0;
            acc.amountBeforeTax += val.amountBeforeTax || 0;
        }
    }
    return acc;
}

function filterStatsByDate(stats, cutoffDate) {
    if (!stats || !cutoffDate) return { freeTours: 0, paidTours: 0, freePax: 0, paidPax: 0 };

    const [year, monthStr, dayStr] = cutoffDate.split('-');
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay = parseInt(dayStr);

    let freeTours=0, paidTours=0, freePax=0, paidPax=0;

    if (stats.byDay) {
        for (const [key, val] of Object.entries(stats.byDay)) {
            const [m, d] = key.split('-').map(Number);
            if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
                freeTours += val.free?.tours || 0;
                paidTours += val.paid?.tours || 0;
                freePax += val.free?.pax || 0;
                paidPax += val.paid?.pax || 0;
            }
        }
    }
    return { freeTours, paidTours, freePax, paidPax };
}

function computeKpisForGuides(guides) {
    return guides.reduce((acc, g) => {
        if (!g.mgmt) return acc;
        const fin = filterMgmtByDate(g.mgmt, GLOBAL_DATE);
        const sts = filterStatsByDate(g.stats.all, GLOBAL_DATE);
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

function computeFilteredKpis(city) {
    return computeKpisForGuides(guidesForCity(city));
}

function computeCity25(city) {
    if (typeof guideStats25 === 'undefined') return null;
    const src = city === 'all' ? guideStats25 : guideStats25.filter(g => g.city === city);
    return computeKpisForGuides(src);
}

function buildMonthlyFromDays(guides, cutoffMonth, cutoffDay, fields = ['revenue', 'grossMargin']) {
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

// ── Chart helpers ─────────────────────────────────────────────────────────────

let _charts = {};

function destroyChart(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function axisDefaults() {
    const s = getComputedStyle(document.body);
    return {
        ticks: { color: s.getPropertyValue('--text2').trim(), font: { family: 'Montserrat', size: 11 } },
        grid:  { color: s.getPropertyValue('--border').trim() },
    };
}
function tooltipDefaults() {
    const s = getComputedStyle(document.body);
    return {
        backgroundColor: s.getPropertyValue('--card-bg').trim(),
        titleColor:  s.getPropertyValue('--text').trim(),
        bodyColor:   s.getPropertyValue('--text2').trim(),
        borderColor: s.getPropertyValue('--border-dark').trim(),
        borderWidth: 1,
    };
}

function getThemeColors() {
    const s = getComputedStyle(document.body);
    return {
        c25:   s.getPropertyValue('--y25').trim(),
        c26:   s.getPropertyValue('--y26').trim(),
        green: s.getPropertyValue('--green').trim(),
        red:   s.getPropertyValue('--delta-neg').trim() || '#D4545A',
    };
}

function makeBarChart(canvasId, labels, datasets, opts = {}) {
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

function makeLineChart(canvasId, labels, datasets, extraScales = null) {
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

// ── P&L tab ───────────────────────────────────────────────────────────────────

function initPl() {
    renderPlKpis(_activeCity);
    renderWaterfall();
    renderMonthTrend();
    renderBillingTrend();

    // Sticky KPI bar — appears when the KPI grid scrolls out of view
    _positionStickyBar();
    window.addEventListener('resize', _positionStickyBar, { passive: true });

    const kpiGrid = document.querySelector('#mgmt-pl .kpi-grid');
    if (kpiGrid && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver(([entry]) => {
            if (_activeTab !== 'pl') return;
            const bar = document.getElementById('sticky-kpi-bar');
            if (bar) bar.style.display = entry.isIntersecting ? 'none' : 'flex';
        }, { threshold: 0 });
        obs.observe(kpiGrid);
    }
}

function _positionStickyBar() {
    const nav = document.querySelector('.nav');
    const bar = document.getElementById('sticky-kpi-bar');
    if (nav && bar) bar.style.top = nav.offsetHeight + 'px';
}

function renderPlKpis(city) {
    const k = computeFilteredKpis(city);
    const k25 = computeCity25(city);
    const gmPct = k.revenue > 0 ? (k.grossMargin / k.revenue * 100) : 0;
    const commPct = k.revenue > 0 ? (k.commissionCost / k.revenue * 100) : 0;
    const avgGm = k.paidTours > 0 ? (k.grossMargin / k.paidTours) : 0;

    function kpiDelta(val26, val25) {
        if (!k25 || !val25) return '';
        const d = val26 - val25;
        const pct = val25 !== 0 ? (d / Math.abs(val25) * 100) : null;
        const cls = d > 0 ? 'delta-pos' : d < 0 ? 'delta-neg' : 'delta-neu';
        const sign = d >= 0 ? '+' : '−';
        const pctStr = pct !== null ? ` (${d >= 0 ? '+' : ''}${pct.toFixed(1)}%)` : '';
        return `<div class="kpi-delta ${cls}">${sign}€${fmt(Math.abs(d))}${pctStr} vs 2025</div>`;
    }

    document.getElementById('kpi-revenue').textContent    = fmtEur(k.revenue);
    document.getElementById('kpi-revenue-sub').innerHTML  = `GM: ${gmPct.toFixed(1)}% of revenue` + kpiDelta(k.revenue, k25?.revenue);

    document.getElementById('kpi-commission').textContent   = fmtEur(k.commissionCost);
    document.getElementById('kpi-commission-sub').innerHTML = `${commPct.toFixed(1)}% of revenue` + kpiDelta(k.commissionCost, k25?.commissionCost);

    document.getElementById('kpi-vcost').textContent      = fmtEur(k.vendorCost);
    document.getElementById('kpi-vcost-sub').innerHTML    = `Guide fees paid` + kpiDelta(k.vendorCost, k25?.vendorCost);

    document.getElementById('kpi-gm').textContent         = fmtEur(k.grossMargin);
    document.getElementById('kpi-gmpct').innerHTML        = `<span class="${gmClass(gmPct)}">${gmPct.toFixed(1)}% margin</span>`;
    document.getElementById('kpi-gm-delta').innerHTML     = kpiDelta(k.grossMargin, k25?.grossMargin);

    document.getElementById('kpi-tour-cost').textContent  = fmtEur(k.tourCost);
    document.getElementById('kpi-vat').textContent        = fmtEur(k.vatAmount);
    document.getElementById('kpi-avg-gm').textContent     = fmtEur(avgGm);
    document.getElementById('kpi-avg-gm-sub').textContent = `per paid tour (${fmt(k.paidTours)} tours)`;
    document.getElementById('kpi-guides').textContent     = fmt(guidesForCity(city).length);
    document.getElementById('kpi-guides-sub').textContent = city === 'all' ? 'across all cities' : city;

    // Secondary KPI deltas
    document.getElementById('kpi-tour-cost-delta').innerHTML = kpiDelta(k.tourCost, k25?.tourCost);
    const avgGm25 = k25 && k25.paidTours > 0 ? k25.grossMargin / k25.paidTours : null;
    document.getElementById('kpi-avg-gm-delta').innerHTML = kpiDelta(avgGm, avgGm25);

    // Sticky mini-KPI bar values
    const rangeLabel = getRangeLabel ? getRangeLabel() : '';
    const sBar = document.getElementById('sticky-kpi-bar');
    if (sBar) {
        document.getElementById('skpi-revenue').textContent    = fmtEur(k.revenue);
        document.getElementById('skpi-commission').textContent = fmtEur(k.commissionCost);
        document.getElementById('skpi-gm').textContent         = fmtEur(k.grossMargin);
        document.getElementById('skpi-gmpct').textContent      = gmPct.toFixed(1) + '% GM';
        document.getElementById('skpi-period').textContent     = rangeLabel + ' 2026';
    }

    // Insight callouts
    renderInsightCallouts(k, k25);

    // Guide drilldown
    renderPlGuideDrilldown(city);
}

function renderInsightCallouts(k, k25) {
    const el = document.getElementById('insight-strip');
    if (!el || !k25) { if (el) el.innerHTML = ''; return; }

    const gmPct26 = k.revenue > 0 ? k.grossMargin / k.revenue * 100 : 0;
    const gmPct25 = k25.revenue > 0 ? k25.grossMargin / k25.revenue * 100 : 0;
    const commPct26 = k.revenue > 0 ? k.commissionCost / k.revenue * 100 : 0;
    const commPct25 = k25.revenue > 0 ? k25.commissionCost / k25.revenue * 100 : 0;
    const avgGm26 = k.paidTours > 0 ? k.grossMargin / k.paidTours : 0;
    const avgGm25 = k25.paidTours > 0 ? k25.grossMargin / k25.paidTours : 0;

    const candidates = [
        {
            label: 'Revenue',
            val: k.revenue - k25.revenue,
            fmt: v => (v >= 0 ? '+' : '−') + '€' + fmt(Math.abs(v)),
            pct: k25.revenue !== 0 ? (k.revenue - k25.revenue) / Math.abs(k25.revenue) * 100 : null,
            positive: true,
        },
        {
            label: 'Gross Margin',
            val: k.grossMargin - k25.grossMargin,
            fmt: v => (v >= 0 ? '+' : '−') + '€' + fmt(Math.abs(v)),
            pct: k25.grossMargin !== 0 ? (k.grossMargin - k25.grossMargin) / Math.abs(k25.grossMargin) * 100 : null,
            positive: true,
        },
        {
            label: 'GM%',
            val: gmPct26 - gmPct25,
            fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'pp margin',
            pct: null,
            positive: true,
        },
        {
            label: 'Commission rate',
            val: commPct26 - commPct25,
            fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'pp of rev',
            pct: null,
            positive: false,
        },
        {
            label: 'Avg GM/tour',
            val: avgGm26 - avgGm25,
            fmt: v => (v >= 0 ? '+' : '−') + '€' + fmt(Math.abs(v)) + '/tour',
            pct: null,
            positive: true,
        },
    ];

    candidates.sort((a, b) => Math.abs(b.pct ?? b.val) - Math.abs(a.pct ?? a.val));
    const top = candidates.slice(0, 3);

    el.innerHTML = top.map(c => {
        const isGood = c.positive ? c.val >= 0 : c.val <= 0;
        const cls = isGood ? 'insight-pos' : 'insight-neg';
        const arrow = isGood ? '▲' : '▼';
        const pctStr = c.pct !== null ? ` (${c.pct >= 0 ? '+' : ''}${c.pct.toFixed(1)}%)` : '';
        return `<span class="insight-pill ${cls}">${arrow} ${c.label} ${c.fmt(c.val)}${pctStr} vs 2025</span>`;
    }).join('');
}

function renderPlGuideDrilldown(city) {
    const guides = guidesForCity(city);
    const el = document.getElementById('pl-guide-drilldown');
    if (!el || guides.length === 0) return;

    // Build guide financials
    const rows = guides.map(g => {
        const fin = filterMgmtByDate(g.mgmt, GLOBAL_DATE);
        const sts = filterStatsByDate(g.stats.all, GLOBAL_DATE);
        const gmPct = fin.revenue > 0 ? (fin.grossMargin / fin.revenue * 100) : 0;
        const g25 = get25(g.name);
        const fin25 = g25?.mgmt ? filterMgmtByDate(g25.mgmt, GLOBAL_DATE) : null;
        const dGm = fin25 ? fin.grossMargin - fin25.grossMargin : null;
        return {
            name: g.name,
            city: g.city,
            revenue: fin.revenue,
            grossMargin: fin.grossMargin,
            gmPct,
            dGm,
        };
    });

    // Sort by GM descending, take top 10
    rows.sort((a, b) => b.grossMargin - a.grossMargin);
    const top10 = rows.slice(0, 10);

    // Render compact table
    el.innerHTML = `<div style="padding: 16px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px;">
        <div style="font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 12px;">Top 10 Guides by Margin</div>
        <table class="mgmt-table" style="font-size: 11px;">
            <thead><tr>
                <th>Guide</th>
                <th>Revenue</th>
                <th>GM €</th>
                <th>GM%</th>
                <th>vs 2025</th>
            </tr></thead>
            <tbody>
                ${top10.map(r => {
                    let rowClass = 'row-healthy';
                    if (r.gmPct < 10 || (r.dGm !== null && r.dGm < -500)) rowClass = 'row-poor';
                    else if (r.gmPct < 20) rowClass = 'row-warn';
                    return `<tr class="${rowClass}">
                        <td><strong>${r.name}</strong></td>
                        <td>${fmtEur(r.revenue)}</td>
                        <td class="${gmClass(r.grossMargin)}">${fmtEur(r.grossMargin)}</td>
                        <td class="${gmClass(r.gmPct)}">${r.gmPct.toFixed(1)}%</td>
                        <td>${dd(r.dGm, true)}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}

function renderWaterfall() {
    const has25 = typeof guideStats25 !== 'undefined';

    // Compute 2026 totals filtered by date
    const t26 = guideStats26.reduce((acc, g) => {
        const fin = filterMgmtByDate(g.mgmt, GLOBAL_DATE);
        acc.revenue         += fin.revenue;
        acc.commissionCost  += fin.commissionCost;
        acc.vatAmount       += fin.vatAmount;
        acc.vendorCost      += fin.vendorCost;
        acc.tourCost        += fin.tourCost;
        acc.grossMargin     += fin.grossMargin;
        return acc;
    }, { revenue:0, commissionCost:0, vatAmount:0, vendorCost:0, tourCost:0, grossMargin:0 });

    // Compute 2025 totals filtered by date
    let t25 = null;
    if (has25) {
        t25 = guideStats25.reduce((acc, g) => {
            if (!g.mgmt) return acc;
            const fin = filterMgmtByDate(g.mgmt, GLOBAL_DATE);
            acc.revenue         += fin.revenue;
            acc.commissionCost  += fin.commissionCost;
            acc.vatAmount       += fin.vatAmount;
            acc.vendorCost      += fin.vendorCost;
            acc.tourCost        += fin.tourCost;
            acc.grossMargin     += fin.grossMargin;
            return acc;
        }, { revenue:0, commissionCost:0, vatAmount:0, vendorCost:0, tourCost:0, grossMargin:0 });
    }

    const labels = ['Revenue', 'Commission', 'VAT', 'Vendor Cost', 'Tour Cost', 'Gross Margin'];
    const { c25, c26, red: cNeg } = getThemeColors();

    function barColors(t) {
        return [
            t.revenue >= 0 ? c26 : cNeg,
            cNeg,
            cNeg,
            cNeg,
            cNeg,
            t.grossMargin >= 0 ? c26 : cNeg,
        ];
    }

    const vals26 = [t26.revenue, -t26.commissionCost, -t26.vatAmount, -t26.vendorCost, -t26.tourCost, t26.grossMargin];
    const MONTH_NAMES_SHORT = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
    const { month: cutoffMonth } = parseGlobalDate();
    const rangeLabel = cutoffMonth === 1 ? 'Jan' : `Jan–${MONTH_NAMES_SHORT[cutoffMonth]}`;
    const datasets = [
        {
            label: `2026 ${rangeLabel}`,
            data: vals26,
            backgroundColor: vals26.map(v => v >= 0 ? c26 + 'cc' : cNeg + 'cc'),
            borderRadius: 4, borderSkipped: false,
        },
    ];
    if (t25) {
        const vals25 = [t25.revenue, -t25.commissionCost, -t25.vatAmount, -t25.vendorCost, -t25.tourCost, t25.grossMargin];
        datasets.unshift({
            label: `2025 ${rangeLabel}`,
            data: vals25,
            backgroundColor: vals25.map(v => v >= 0 ? c25 + 'aa' : cNeg + '66'),
            borderRadius: 4, borderSkipped: false,
        });
    }

    makeBarChart('waterfall-bar', labels, datasets, { showLegend: true,
        tooltipCb: { label: ctx => `${ctx.dataset.label}: €${fmt(Math.abs(ctx.parsed.y))}` }
    });

    const titleEl = document.getElementById('waterfall-chart-title');
    if (titleEl) titleEl.textContent = `P&L Breakdown — ${rangeLabel} 2025 vs 2026`;

    // Summary table below chart
    const el = document.getElementById('waterfall-summary');
    if (el) {
        const rows = [
            ['Revenue',       t26.revenue,        t25 ? t25.revenue        : null, true],
            ['Commission',    -t26.commissionCost, t25 ? -t25.commissionCost : null, false],
            ['VAT',           -t26.vatAmount,      t25 ? -t25.vatAmount      : null, false],
            ['Vendor Cost',   -t26.vendorCost,     t25 ? -t25.vendorCost     : null, false],
            ['Tour Cost',     -t26.tourCost,       t25 ? -t25.tourCost       : null, false],
            ['Gross Margin',  t26.grossMargin,     t25 ? t25.grossMargin     : null, true],
        ];
        const hasPrior = !!t25;
        el.innerHTML = `<table class="mgmt-table">
            <thead><tr>
                <th>P&amp;L Item</th>
                <th>2026 ${rangeLabel}</th>
                ${hasPrior ? `<th>2025 ${rangeLabel}</th><th>Δ €</th><th>Δ %</th>` : ''}
            </tr></thead>
            <tbody>${rows.map(([label, v26, v25, isPos]) => {
                const hasDelta = hasPrior && v25 !== null;
                const d = hasDelta ? v26 - v25 : null;
                const pct = hasDelta && v25 !== 0 ? (d / Math.abs(v25) * 100) : null;
                const cls = d !== null ? (d > 0 ? (isPos ? 'pos' : 'neg') : d < 0 ? (isPos ? 'neg' : 'pos') : 'neu') : '';
                return `<tr>
                    <td><strong>${label}</strong></td>
                    <td class="${gmClass(v26)}">${fmtEur(v26)}</td>
                    ${hasDelta ? `
                    <td>${fmtEur(v25)}</td>
                    <td class="${cls}">${d >= 0 ? '+' : '−'}€${fmt(Math.abs(d))}</td>
                    <td class="${cls}">${pct !== null ? (d >= 0 ? '+' : '') + pct.toFixed(1) + '%' : '—'}</td>` : ''}
                </tr>`;
            }).join('')}</tbody>
        </table>`;
    }
}

function renderMonthTrend() {
    const has25 = typeof guideStats25 !== 'undefined';
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();

    // Build monthly aggregates from day-level data with date filtering
    const m26 = buildMonthlyFromDays(guideStats26, cutoffMonth, cutoffDay);
    const m25 = has25 ? buildMonthlyFromDays(guideStats25, cutoffMonth, cutoffDay) : {};

    const allM = Array.from({length: cutoffMonth}, (_, i) => i + 1);
    const MONTH_SHORT = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
    const { c25, c26 } = getThemeColors();
    makeLineChart('month-gm-line', allM.map(m => MONTH_SHORT[m]), [
        { label: 'GM 2025', data: allM.map(m => m25[m]?.grossMargin || 0), borderColor: c25, backgroundColor: 'transparent', tension: 0.3, borderDash: [5,3] },
        { label: 'GM 2026', data: allM.map(m => m26[m]?.grossMargin || 0), borderColor: c26, backgroundColor: c26 + '22', tension: 0.3, fill: true },
        { label: 'Rev 2025', data: allM.map(m => m25[m]?.revenue || 0), borderColor: c25, backgroundColor: 'transparent', tension: 0.3, borderDash: [2,2], borderWidth: 1.5 },
        { label: 'Rev 2026', data: allM.map(m => m26[m]?.revenue || 0), borderColor: '#8FA8BC', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5 },
    ]);
}

function renderBillingTrend() {
    const has25 = typeof guideStats25 !== 'undefined';
    const { month: cutoffMonth } = parseGlobalDate();

    function aggregateBillingByDate(guides) {
        const billing = {POS: {revenue: 0, grossMargin: 0}, CPP: {revenue: 0, grossMargin: 0}};
        guides.forEach(g => {
            if (!g.mgmt || !g.mgmt.byBillingMethod) return;
            for (const [method, data] of Object.entries(g.mgmt.byBillingMethod)) {
                if (!billing[method]) billing[method] = {revenue: 0, grossMargin: 0};
                // Approximate by taking the proportion of filtered data to full data
                const fullTotal = filterMgmtByDate(g.mgmt, '9999-12-31');
                const filteredTotal = filterMgmtByDate(g.mgmt, GLOBAL_DATE);
                if (fullTotal.revenue > 0) {
                    const ratio = filteredTotal.revenue / fullTotal.revenue;
                    billing[method].revenue += (data.revenue || 0) * ratio;
                    billing[method].grossMargin += (data.grossMargin || 0) * ratio;
                }
            }
        });
        return billing;
    }

    const billing26 = aggregateBillingByDate(guideStats26);
    const billing25 = has25 ? aggregateBillingByDate(guideStats25) : {};

    const labels = ['POS', 'CPP'];
    const { c25, c26 } = getThemeColors();

    makeBarChart('billing-bar', labels, [
        { label: '2025 Revenue', data: labels.map(k => billing25[k]?.revenue || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026 Revenue', data: labels.map(k => billing26[k]?.revenue || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true,
         tooltipCb: { afterLabel: ctx => {
            const key = labels[ctx.dataIndex];
            const src = ctx.datasetIndex === 0 ? billing25 : billing26;
            const d = src[key] || {};
            const gm = d.grossMargin || 0;
            const rev = d.revenue || 0;
            const pct = rev > 0 ? (gm / rev * 100).toFixed(1) : '—';
            return `GM: €${fmt(gm)} (${pct}%)`;
         }}
    });

    // POS vs CPP stat boxes
    const el = document.getElementById('billing-stats');
    if (el) {
        function bstat(label, d25, d26) {
            const gm26pct = d26.revenue > 0 ? (d26.grossMargin / d26.revenue * 100) : 0;
            const gm25pct = d25.revenue > 0 ? (d25.grossMargin / d25.revenue * 100) : 0;
            const revDelta = d26.revenue - d25.revenue;
            return `<div class="chart-card" style="padding:16px 20px">
                <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text2);margin-bottom:8px">${label}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div>
                        <div style="font-size:10px;color:var(--text3)">2025 Revenue</div>
                        <div style="font-family:var(--font-mono);font-size:15px">${fmtEur(d25.revenue)}</div>
                        <div style="font-size:10px;color:var(--text3)">GM: ${gm25pct.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div style="font-size:10px;color:var(--text3)">2026 Revenue</div>
                        <div style="font-family:var(--font-mono);font-size:15px">${fmtEur(d26.revenue)}</div>
                        <div style="font-size:14px;font-weight:600;color:var(--text);margin:4px 0">GM: <span class="${gmClass(gm26pct)}" style="font-size:16px;font-weight:700">${gm26pct.toFixed(1)}%</span></div>
                        <div style="font-size:10px">${dd(revDelta, true)} vs 2025</div>
                    </div>
                </div>
            </div>`;
        }
        el.innerHTML = bstat('POS (Direct — Cash/Card)', billing25['POS']||{revenue:0,grossMargin:0}, billing26['POS']||{revenue:0,grossMargin:0})
                     + bstat('CPP (OTA / Bank Transfer)', billing25['CPP']||{revenue:0,grossMargin:0}, billing26['CPP']||{revenue:0,grossMargin:0});
    }
}

function mgmtFilterCityPl(city) {
    _activeCity = city;
    document.querySelectorAll('.city-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.city === city);
    });
    if (MgmtPages.pl._init) renderPlKpis(city);
    if (MgmtPages.guides._init) renderGuideTable();
}

// ── Guides tab ────────────────────────────────────────────────────────────────

function initGuides() {
    renderGuideTable();
}

function renderGuideTable() {
    const guides = guidesForCity(_activeCity);

    const rows = guides.map(g => {
        const fin = filterMgmtByDate(g.mgmt, GLOBAL_DATE);
        const sts = filterStatsByDate(g.stats.all, GLOBAL_DATE);
        const m = fin;
        const gmPct = m.revenue > 0 ? (m.grossMargin / m.revenue * 100) : 0;
        const avgGm = sts.paidTours > 0 ? (m.grossMargin / sts.paidTours) : 0;
        const avgPax = sts.paidTours > 0 ? (sts.paidPax / sts.paidTours) : 0;
        const comm = m.commissionCost || 0;
        const commPct = m.revenue > 0 ? (comm / m.revenue * 100) : 0;

        const g25 = get25(g.name);
        const fin25 = g25?.mgmt ? filterMgmtByDate(g25.mgmt, GLOBAL_DATE) : null;
        const sts25 = g25 ? filterStatsByDate(g25.stats.all, GLOBAL_DATE) : null;
        const paid25 = sts25 ? sts25.paidTours : null;
        const rev25  = fin25 ? fin25.revenue : null;
        const gm25   = fin25 ? fin25.grossMargin : null;

        return {
            name: g.name, city: g.city,
            freeTours: sts.freeTours, paidTours: sts.paidTours,
            avgPax, revenue: m.revenue, vendorCost: m.vendorCost,
            commissionCost: comm, commPct,
            grossMargin: m.grossMargin, gmPct, avgGm,
            paid25, rev25, gm25,
        };
    });

    rows.sort((a, b) => _sortDir * (a[_sortCol] - b[_sortCol]));

    const tbody = document.getElementById('guide-tbody');
    tbody.innerHTML = rows.map((r, i) => {
        const dPaid = r.paid25 !== null ? r.paidTours - r.paid25 : null;
        const dGm   = r.gm25   !== null ? r.grossMargin - r.gm25 : null;
        const dRev  = r.rev25  !== null ? r.revenue - r.rev25 : null;
        // Row health class: green if GM > 20% and growing, amber if 10–20%, red if < 10% or declining
        let rowClass = 'row-healthy';
        if (r.gmPct < 10 || (dGm !== null && dGm < -500)) rowClass = 'row-poor';
        else if (r.gmPct < 20) rowClass = 'row-warn';
        // Commission color: red if > 25%, amber if 15–25%, green if < 15%
        let commClass = 'neu';
        if (r.commPct > 25) commClass = 'neg';
        else if (r.commPct >= 15) commClass = 'neu';
        else commClass = 'pos';
        return `<tr class="${rowClass}">
            <td class="rank">${i + 1}</td>
            <td class="guide-name">${r.name}</td>
            <td><span class="city-dot" style="background:${CITY_COLS[r.city] || '#999'}"></span>${r.city}</td>
            <td>${fmt(r.freeTours)}</td>
            <td>${fmt(r.paidTours)}<br><small class="yoy">${dd(dPaid)}</small></td>
            <td>${r.avgPax > 0 ? r.avgPax.toFixed(1) : '—'}</td>
            <td>${fmtEur(r.revenue)}<br><small class="yoy">${dd(dRev, true)}</small></td>
            <td class="neg">${r.commissionCost > 0 ? fmtEur(-r.commissionCost) : '—'}</td>
            <td class="${commClass}">${r.commPct > 0 ? r.commPct.toFixed(1) + '%' : '—'}</td>
            <td>${fmtEur(r.vendorCost)}</td>
            <td class="${gmClass(r.grossMargin)}">${fmtEur(r.grossMargin)}<br><small class="yoy">${dd(dGm, true)}</small></td>
            <td class="${gmClass(r.gmPct)}">${r.gmPct.toFixed(1)}%</td>
            <td class="${gmClass(r.avgGm)}">${fmtEur(r.avgGm)}</td>
        </tr>`;
    }).join('');

    // Render legend
    const legendEl = document.getElementById('guide-legend');
    if (legendEl) {
        legendEl.innerHTML = `
            <span style="margin-right: 24px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(29,158,117,0.2); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM ≥ 20% & growing
            </span>
            <span style="margin-right: 24px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(186,117,23,0.1); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM 10–20%
            </span>
            <span>
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(212,84,90,0.15); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM < 10% or declining
            </span>
        `;
    }
}

function mgmtSort(col) {
    if (_sortCol === col) _sortDir *= -1;
    else { _sortCol = col; _sortDir = -1; }
    document.querySelectorAll('.sort-hdr').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.col === col) th.classList.add(_sortDir === -1 ? 'sorted-desc' : 'sorted-asc');
    });
    renderGuideTable();
}

// ── Channels tab ──────────────────────────────────────────────────────────────

const OTA_COLORS = ['#C49A8A','#8FA8BC','#9BB09B','#C4B48A','#B0AAEE','#A8C4C4','#C4A8B0'];

function initChannels() {
    renderCommissionWaterfall();
    renderDirectOtaTrend();
    renderOtaSourceTable();
    renderTourTypeTable();
}

function renderCommissionWaterfall() {
    const srcData = kpiTotals26.mgmt.bySource;
    const src25   = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt?.bySource || {} : {};

    const srcKeys = Object.keys(srcData)
        .filter(k => srcData[k].revenue > 0)
        .sort((a,b) => srcData[b].revenue - srcData[a].revenue);

    if (!srcKeys.length) return;

    const { green, red, c26 } = getThemeColors();

    // Stacked bar: Revenue | −Commission | −VendorCost | = GM
    makeBarChart('commission-wfall', srcKeys, [
        {
            label: 'Gross Margin',
            data: srcKeys.map(k => {
                const d = srcData[k]; return d.grossMargin;
            }),
            backgroundColor: srcKeys.map(k => srcData[k].grossMargin >= 0 ? green + 'cc' : red + 'cc'),
            borderRadius: 4, borderSkipped: false,
        },
        {
            label: 'Commission',
            data: srcKeys.map(k => -(srcData[k].commissionCost || 0)),
            backgroundColor: red + '88',
            borderRadius: 0, borderSkipped: false,
        },
        {
            label: 'Vendor Cost',
            data: srcKeys.map(k => -srcData[k].vendorCost),
            backgroundColor: '#8FA8BC88',
            borderRadius: 0, borderSkipped: false,
        },
    ], {
        showLegend: true, stacked: true, horizontal: true,
        tooltipCb: {
            afterTitle: ctx => {
                const k = srcKeys[ctx[0].dataIndex];
                const d = srcData[k];
                const pct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : '—';
                return `Revenue: €${fmt(d.revenue)} → GM: ${pct}%`;
            }
        }
    });
}

function renderDirectOtaTrend() {
    const has25 = typeof guideStats25 !== 'undefined';
    const MONTH_SHORT = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();

    // Build per-month channel data from per-guide, filtered by date
    const monthChannel26 = {};
    const monthChannel25 = {};

    function buildMonthChannelData(guides, monthChannelObj) {
        guides.forEach(g => {
            if (!g.mgmt?.byDay) return;
            Object.entries(g.mgmt.byDay).forEach(([dayKey, dayVal]) => {
                const [m, d] = dayKey.split('-').map(Number);
                if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
                    if (!monthChannelObj[m]) monthChannelObj[m] = { web: 0, ota: 0 };
                    // approximate: distribute by guide's overall channel ratio
                    const gTotal = g.mgmt.revenue || 1;
                    const webRatio = (g.mgmt.byChannel?.web?.revenue || 0) / gTotal;
                    const otaRatio = ((g.mgmt.byChannel?.OTA?.revenue || 0) + (g.mgmt.byChannel?.b2b?.revenue || 0)) / gTotal;
                    monthChannelObj[m].web += (dayVal.revenue || 0) * webRatio;
                    monthChannelObj[m].ota += (dayVal.revenue || 0) * otaRatio;
                }
            });
        });
    }

    buildMonthChannelData(guideStats26, monthChannel26);
    if (has25) buildMonthChannelData(guideStats25, monthChannel25);

    const allM = Array.from({length: cutoffMonth}, (_, i) => i + 1);

    const { c25, c26, green } = getThemeColors();

    makeLineChart('direct-ota-line', allM.map(m => MONTH_SHORT[m]), [
        { label: 'Direct Rev 2025', data: allM.map(m => monthChannel25[String(m)]?.web || 0), borderColor: c25, borderDash: [5,3], backgroundColor: 'transparent', tension: 0.3 },
        { label: 'Direct Rev 2026', data: allM.map(m => monthChannel26[String(m)]?.web || 0), borderColor: green, backgroundColor: green + '22', tension: 0.3, fill: true },
        { label: 'OTA Rev 2025', data: allM.map(m => monthChannel25[String(m)]?.ota || 0), borderColor: c25, borderDash: [2,2], backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5 },
        { label: 'OTA Rev 2026', data: allM.map(m => monthChannel26[String(m)]?.ota || 0), borderColor: '#C49A8A', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5 },
    ]);
}

function renderOtaSourceTable() {
    const srcData = kpiTotals26.mgmt.bySource;
    const srcData25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt?.bySource || {} : {};
    const srcKeys = Object.keys(srcData)
        .filter(k => k !== 'FST' && srcData[k].revenue > 0)
        .sort((a,b) => srcData[b].grossMargin - srcData[a].grossMargin);

    const el = document.getElementById('ota-source-table');
    if (!el) return;
    el.innerHTML = `<table class="mgmt-table">
        <thead><tr>
            <th>Source</th>
            <th>Tours '26</th><th>Revenue '26</th>
            <th>Commission</th><th>Comm%</th>
            <th>Vendor Cost</th>
            <th>GM '26</th><th>GM%</th>
            <th>GM '25</th><th>Δ GM</th>
            <th>Action</th>
        </tr></thead>
        <tbody>${srcKeys.map(k => {
            const d = srcData[k];
            const d25 = srcData25[k];
            const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
            const commpct = d.revenue > 0 ? ((d.commissionCost||0) / d.revenue * 100) : 0;
            const dgm = d25 ? d.grossMargin - d25.grossMargin : null;

            // Action lever logic
            let action = '—';
            if (d.tours < 5) action = '– Low volume';
            else if (commpct > 25) action = '⚠ High commission';
            else if (commpct < 15 && d.tours >= 20) action = '✓ Keep pushing';
            else if (dgm !== null && dgm < -200) action = '↓ Declining';

            return `<tr>
                <td><strong>${k}</strong></td>
                <td>${fmt(d.tours)}</td>
                <td>${fmtEur(d.revenue)}</td>
                <td class="neg">${d.commissionCost > 0 ? fmtEur(-d.commissionCost) : '—'}</td>
                <td>${commpct > 0 ? commpct.toFixed(1) + '%' : '—'}</td>
                <td>${fmtEur(d.vendorCost)}</td>
                <td class="${gmClass(d.grossMargin)}">${fmtEur(d.grossMargin)}</td>
                <td class="${gmClass(gmpct)}">${gmpct.toFixed(1)}%</td>
                <td>${d25 ? fmtEur(d25.grossMargin) : '—'}</td>
                <td>${dd(dgm, true)}</td>
                <td style="font-size:11px;color:var(--text2)">${action}</td>
            </tr>`;
        }).join('')}</tbody>
    </table>`;
}

function renderTourTypeTable() {
    const byType26 = kpiTotals26.mgmt.byTourType || {};
    const byType25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt?.byTourType || {} : {};

    const typeKeys = Object.keys(byType26).sort((a,b) => (byType26[b].revenue||0) - (byType26[a].revenue||0));
    if (!typeKeys.length) return;

    const el = document.getElementById('tour-type-tbody');
    if (!el) return;
    el.innerHTML = typeKeys.map(t => {
        const d = byType26[t];
        const d25 = byType25[t];
        const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
        const avgPax = d.tours > 0 ? (d.pax / d.tours) : 0;
        const avgUnit = d.pax > 0 ? (d.revenue / d.pax) : 0;
        const avgUnit25 = d25 && d25.pax > 0 ? (d25.revenue / d25.pax) : 0;
        const dUnit = d25 ? avgUnit - avgUnit25 : null;
        const dTours = d25 ? d.tours - d25.tours : null;
        return `<tr>
            <td><strong>${t}</strong></td>
            <td>${fmt(d.tours)}<br><small class="yoy">${dd(dTours)}</small></td>
            <td>${avgPax > 0 ? avgPax.toFixed(1) : '—'}</td>
            <td>${avgUnit > 0 ? fmtEur(avgUnit) : '—'}</td>
            <td>${avgUnit25 > 0 ? fmtEur(avgUnit25) : '—'}<br><small class="yoy">${dd(dUnit, true)}</small></td>
            <td>${fmtEur(d.revenue)}</td>
            <td class="neg">${d.commissionCost > 0 ? fmtEur(-d.commissionCost) : '—'}</td>
            <td class="${gmClass(d.grossMargin)}">${fmtEur(d.grossMargin)}</td>
            <td class="${gmClass(gmpct)}">${gmpct.toFixed(1)}%</td>
        </tr>`;
    }).join('');
}

// ── Operational tab ───────────────────────────────────────────────────────────

const DOW_ORDER    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SEASON_ORDER = ['low','mid','high','peak'];
const PAXBAND_ORDER= ['1-4','5-10','11-20','21-30','30+'];
const GUIDE_PBAND_ORDER = ['1-5','6-10','11+'];
const MONTH_SHORT  = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

function initOps() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    const { c25, c26, green, red } = getThemeColors();

    // Guide PAX band — GM% (THE KEY CHART)
    const gpb26 = mgmt26.byGuidePaxBand || {};
    const gpb25 = mgmt25?.byGuidePaxBand || {};
    const gpLabels = GUIDE_PBAND_ORDER.filter(k => gpb26[k] || gpb25[k]);

    makeBarChart('guide-paxband-gm', gpLabels, [
        {
            label: 'GM% 2025',
            data: gpLabels.map(k => {
                const d = gpb25[k]; return d && d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
            }),
            backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false,
        },
        {
            label: 'GM% 2026',
            data: gpLabels.map(k => {
                const d = gpb26[k]; return d && d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
            }),
            backgroundColor: gpLabels.map(k => {
                const d = gpb26[k]; if (!d || !d.revenue) return c26 + 'aa';
                const gm = d.grossMargin / d.revenue * 100;
                return gm >= 0 ? green + 'cc' : red + 'cc';
            }),
            borderRadius: 4, borderSkipped: false,
        },
    ], {
        showLegend: true,
        tooltipCb: {
            afterLabel: ctx => {
                const k = gpLabels[ctx.dataIndex];
                const d = ctx.datasetIndex === 0 ? gpb25[k] : gpb26[k];
                if (!d) return '';
                return `${fmt(d.tours)} tours · €${fmt(d.revenue)} rev · €${fmt(d.grossMargin)} GM`;
            }
        }
    });

    // Guide PAX band — tours count
    makeBarChart('guide-paxband-tours', gpLabels, [
        { label: 'Tours 2025', data: gpLabels.map(k => gpb25[k]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: 'Tours 2026', data: gpLabels.map(k => gpb26[k]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

    // Day-of-week
    const dow26 = mgmt26.byDow; const dow25 = mgmt25?.byDow || {};
    const dowLabels = DOW_ORDER.filter(d => dow26[d] || dow25[d]);
    makeBarChart('dow-bar', dowLabels, [
        { label: '2025', data: dowLabels.map(d => dow25[d]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: dowLabels.map(d => dow26[d]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], {
        showLegend: true,
        tooltipCb: {
            afterLabel: ctx => {
                const d = ctx.datasetIndex === 0 ? dow25[dowLabels[ctx.dataIndex]] : dow26[dowLabels[ctx.dataIndex]];
                if (!d) return '';
                const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : '—';
                return `Revenue: €${fmt(d.revenue || 0)}\nGM%: ${gmpct}%`;
            }
        }
    });

    // Time slots
    const time26 = mgmt26.byTime; const time25 = mgmt25?.byTime || {};
    const timeKeys = [...new Set([...Object.keys(time26), ...Object.keys(time25)])].sort((a,b) => parseInt(a)-parseInt(b));
    makeBarChart('time-bar', timeKeys.map(h => `${h}:00`), [
        { label: '2025', data: timeKeys.map(h => time25[h]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: timeKeys.map(h => time26[h]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], {
        showLegend: true,
        tooltipCb: {
            afterLabel: ctx => {
                const d = ctx.datasetIndex === 0 ? time25[timeKeys[ctx.dataIndex]] : time26[timeKeys[ctx.dataIndex]];
                if (!d) return '';
                const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : '—';
                return `Revenue: €${fmt(d.revenue || 0)}\nGM%: ${gmpct}%`;
            }
        }
    });

    // Season
    const sea26 = mgmt26.bySeason; const sea25 = mgmt25?.bySeason || {};
    const seaLabels = SEASON_ORDER.filter(k => sea26[k] || sea25[k]);
    makeBarChart('season-bar', seaLabels.map(k => k[0].toUpperCase() + k.slice(1)), [
        { label: '2025', data: seaLabels.map(k => sea25[k]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: seaLabels.map(k => sea26[k]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], {
        showLegend: true,
        tooltipCb: {
            afterLabel: ctx => {
                const d = ctx.datasetIndex === 0 ? sea25[seaLabels[ctx.dataIndex]] : sea26[seaLabels[ctx.dataIndex]];
                if (!d) return '';
                const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : '—';
                return `Revenue: €${fmt(d.revenue || 0)}\nGM%: ${gmpct}%`;
            }
        }
    });

    // Booking PAX band (booking volume)
    const pb26 = mgmt26.byPaxBand; const pb25 = mgmt25?.byPaxBand || {};
    const pbLabels = PAXBAND_ORDER.filter(k => pb26[k] || pb25[k]);
    makeBarChart('paxband-bar', pbLabels, [
        { label: '2025', data: pbLabels.map(k => pb25[k]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: pbLabels.map(k => pb26[k]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

    // Month revenue & GM trend — extracted so date picker can refresh it
    renderOpsMonthLine();

    // PAX band action panel
    renderPaxBandActionPanel();

    // Week trend
    const wk26 = mgmt26.byWeek;
    const wk25 = mgmt25?.byWeek || {};
    const wkNums = Object.keys(wk26).map(Number).sort((a,b)=>a-b);
    const ax = axisDefaults();
    const datasets = [
        { label: 'Tours', data: wkNums.map(w => wk26[String(w)].tours), borderColor: '#8FA8BC', backgroundColor: '#8FA8BC22', tension: 0.3, fill: true, yAxisID: 'yL' },
        { label: 'Revenue', data: wkNums.map(w => wk26[String(w)].revenue), borderColor: '#C49A8A', backgroundColor: 'transparent', tension: 0.3, yAxisID: 'yR' },
        { label: 'Gross Margin', data: wkNums.map(w => wk26[String(w)].grossMargin), borderColor: green, backgroundColor: 'transparent', tension: 0.3, borderDash: [4,3], yAxisID: 'yR' },
    ];
    if (Object.keys(wk25).length > 0) {
        datasets.push({
            label: 'Revenue 2025',
            data: wkNums.map(w => wk25[String(w)]?.revenue || 0),
            borderColor: c25,
            backgroundColor: 'transparent',
            tension: 0.3,
            borderDash: [5,3],
            borderWidth: 1.5,
            yAxisID: 'yR',
        });
    }
    makeLineChart('week-line', wkNums.map(w => 'Wk ' + w), datasets, {
        x:  ax,
        yL: { ...ax, position: 'left',  title: { display: true, text: 'Tours', color: ax.ticks.color } },
        yR: { ...ax, position: 'right', grid: { display: false }, title: { display: true, text: '€', color: ax.ticks.color } },
    });

    // Payment method section
    renderPaymentMethod();
}

// ── Helper: Build tour type × city aggregation ─────────────────────────────────

function buildTourTypeByCity() {
    const result = {};
    ['Zagreb', 'Dubrovnik', 'Split', 'Zadar'].forEach(city => {
        result[city] = {};
    });

    guideStats26.forEach(g => {
        const city = g.city;
        if (!result[city]) result[city] = {};
        if (!g.mgmt?.byTourType) return;

        Object.entries(g.mgmt.byTourType).forEach(([type, data]) => {
            if (!result[city][type]) {
                result[city][type] = { revenue: 0, grossMargin: 0, tours: 0 };
            }
            result[city][type].revenue += data.revenue || 0;
            result[city][type].grossMargin += data.grossMargin || 0;
            result[city][type].tours += data.tours || 0;
        });
    });

    return result;
}

// ── Helper: Build source × city aggregation ────────────────────────────────────

function buildSourceByCity() {
    const result = {};
    ['Zagreb', 'Dubrovnik', 'Split', 'Zadar'].forEach(city => {
        result[city] = {};
    });

    guideStats26.forEach(g => {
        const city = g.city;
        if (!result[city]) result[city] = {};
        if (!g.mgmt?.bySource) return;

        Object.entries(g.mgmt.bySource).forEach(([source, data]) => {
            if (!result[city][source]) {
                result[city][source] = { revenue: 0, commissionCost: 0, tours: 0 };
            }
            result[city][source].revenue += data.revenue || 0;
            result[city][source].commissionCost += data.commissionCost || 0;
            result[city][source].tours += data.tours || 0;
        });
    });

    return result;
}

// ── Helper: Build language × city aggregation ──────────────────────────────────

function buildLangByCity() {
    const result = {};
    ['Zagreb', 'Dubrovnik', 'Split', 'Zadar'].forEach(city => {
        result[city] = { eng: { tours: 0, pax: 0 }, esp: { tours: 0, pax: 0 }, fra: { tours: 0, pax: 0 } };
    });

    guideStats26.forEach(g => {
        const city = g.city;
        ['eng', 'esp', 'fra'].forEach(lang => {
            if (g.stats?.[lang]) {
                const langStats = filterStatsByDate(g.stats[lang], GLOBAL_DATE);
                result[city][lang].tours += langStats.paidTours || 0;
                result[city][lang].pax += langStats.paidPax || 0;
            }
        });
    });

    return result;
}

// ── Payment Method Rendering ───────────────────────────────────────────────────

function renderPaymentMethod() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    const pm26 = mgmt26.byPaymentMethod || {};
    const pm25 = mgmt25?.byPaymentMethod || {};
    const { c25, c26 } = getThemeColors();

    // Payment method stat boxes
    const container = document.getElementById('payment-stats-container');
    if (container) {
        container.innerHTML = '';
        const methods = ['card', 'bank trf', 'cash'];
        methods.forEach(method => {
            const d26 = pm26[method] || { revenue: 0, grossMargin: 0, tours: 0 };
            const d25 = pm25?.[method] || { revenue: 0, grossMargin: 0 };
            const gm26 = d26.revenue > 0 ? (d26.grossMargin / d26.revenue * 100) : 0;
            const gm25 = d25.revenue > 0 ? (d25.grossMargin / d25.revenue * 100) : 0;
            const gmDelta = gm26 - gm25;

            const label = method === 'bank trf' ? 'Bank Transfer' : method.charAt(0).toUpperCase() + method.slice(1);
            container.innerHTML += `
                <div class="kpi-card">
                    <div class="kpi-label">${label}</div>
                    <div class="kpi-value">${fmtEur(d26.revenue)}</div>
                    <div class="kpi-sub">
                        GM%: <strong>${gm26.toFixed(1)}%</strong>
                        <span class="kpi-delta ${deltaClass(gmDelta)}"> ${gmDelta > 0 ? '+' : ''}${gmDelta.toFixed(1)}%</span><br>
                        ${d26.tours} tours
                    </div>
                </div>
            `;
        });
    }

    // Payment method bar chart
    const methods = ['card', 'bank trf', 'cash'];
    makeBarChart('payment-bar', methods.map(m => m.charAt(0).toUpperCase() + m.slice(1).replace(' trf', ' Trf')), [
        { label: '2025', data: methods.map(m => pm25?.[m]?.revenue || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: methods.map(m => pm26?.[m]?.revenue || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], {
        showLegend: true,
        tooltipCb: {
            afterLabel: ctx => {
                const method = methods[ctx.dataIndex];
                const d = ctx.datasetIndex === 0 ? pm25?.[method] : pm26?.[method];
                if (!d) return '';
                const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : '—';
                return `Gross Margin: €${fmt(d.grossMargin || 0)}\nGM%: ${gmpct}%`;
            }
        }
    });
}

// ── Cities Tab ─────────────────────────────────────────────────────────────────

function initCities() {
    renderCitiesTab();
}

function renderCitiesTab() {
    const CITIES = ['Zagreb', 'Dubrovnik', 'Split', 'Zadar'];
    const { c25, c26, green, red } = getThemeColors();

    // 1. City overview cards
    let cardsHtml = '';
    CITIES.forEach(city => {
        const k26 = computeFilteredKpis(city);
        const k25 = computeCity25(city);
        const gm26 = k26.revenue > 0 ? (k26.grossMargin / k26.revenue * 100) : 0;
        const gm25 = k25?.revenue > 0 ? (k25.grossMargin / k25.revenue * 100) : 0;
        const gmDelta = k26.grossMargin - (k25?.grossMargin || 0);
        const commRate26 = k26.revenue > 0 ? (k26.commissionCost / k26.revenue * 100) : 0;

        cardsHtml += `
            <div class="kpi-card">
                <div class="kpi-label">${city}</div>
                <div class="kpi-value">${fmtEur(k26.revenue)}</div>
                <div class="kpi-sub">
                    GM: <strong>${fmtEur(k26.grossMargin)}</strong> (${gm26.toFixed(1)}%)<br>
                    Commission: ${commRate26.toFixed(1)}% · ${k26.paidTours} tours · ${k26.paidPax} pax
                    <div class="kpi-delta ${deltaClass(gmDelta)}" style="margin-top:4px">∆ GM: ${gmDelta > 0 ? '+' : ''}${fmtEur(gmDelta)}</div>
                </div>
            </div>
        `;
    });
    const cardContainer = document.getElementById('city-cards-container');
    if (cardContainer) cardContainer.innerHTML = cardsHtml;

    // 2. Tour type × city matrix
    const ttByCity = buildTourTypeByCity();
    const allTourTypes = new Set();
    Object.values(ttByCity).forEach(cityData => {
        Object.keys(cityData).forEach(type => allTourTypes.add(type));
    });
    const tourTypes = Array.from(allTourTypes).sort();

    let ttHtml = '<thead><tr><th>Tour Type</th>';
    CITIES.forEach(city => ttHtml += `<th>${city}</th>`);
    ttHtml += '<th>Total</th></tr></thead><tbody>';

    let cityTotals = {};
    CITIES.forEach(city => { cityTotals[city] = { revenue: 0, grossMargin: 0 }; });

    tourTypes.forEach(type => {
        ttHtml += '<tr>';
        ttHtml += `<td class="guide-name">${type}</td>`;
        let typeTotal = { revenue: 0, grossMargin: 0 };
        CITIES.forEach(city => {
            const data = ttByCity[city]?.[type] || { revenue: 0, grossMargin: 0 };
            const gm = data.revenue > 0 ? (data.grossMargin / data.revenue * 100) : 0;
            const bgHue = gm >= 25 ? 120 : gm >= 10 ? 45 : 0;
            const bgSat = gm > 0 ? 60 : 0;
            const bgLight = gm > 0 ? 85 : 95;
            const bgColor = `hsl(${bgHue}, ${bgSat}%, ${bgLight}%)`;
            ttHtml += `<td class="pos" style="background: ${bgColor}">€${fmt(data.revenue)}<br><strong>${gm.toFixed(1)}%</strong></td>`;
            cityTotals[city].revenue += data.revenue;
            cityTotals[city].grossMargin += data.grossMargin;
            typeTotal.revenue += data.revenue;
            typeTotal.grossMargin += data.grossMargin;
        });
        const typeGm = typeTotal.revenue > 0 ? (typeTotal.grossMargin / typeTotal.revenue * 100) : 0;
        ttHtml += `<td class="pos" style="font-weight:600">€${fmt(typeTotal.revenue)}<br>${typeGm.toFixed(1)}%</td>`;
        ttHtml += '</tr>';
    });

    // Add totals row
    ttHtml += '<tr style="border-top: 2px solid var(--border); font-weight: 600">';
    ttHtml += '<td>Total</td>';
    CITIES.forEach(city => {
        const gm = cityTotals[city].revenue > 0 ? (cityTotals[city].grossMargin / cityTotals[city].revenue * 100) : 0;
        ttHtml += `<td class="pos">€${fmt(cityTotals[city].revenue)}<br>${gm.toFixed(1)}%</td>`;
    });
    const grandTotal = Object.values(cityTotals).reduce((a, v) => a + v.revenue, 0);
    const grandGm = grandTotal > 0 ? (Object.values(cityTotals).reduce((a, v) => a + v.grossMargin, 0) / grandTotal * 100) : 0;
    ttHtml += `<td class="pos">€${fmt(grandTotal)}<br>${grandGm.toFixed(1)}%</td>`;
    ttHtml += '</tr>';

    ttHtml += '</tbody>';
    const ttTable = document.getElementById('tourtype-city-table');
    if (ttTable) ttTable.innerHTML = ttHtml;

    // 3. Source × city breakdown
    const srcByCity = buildSourceByCity();
    const allSources = new Set();
    Object.values(srcByCity).forEach(cityData => {
        Object.keys(cityData).forEach(src => allSources.add(src));
    });
    const sources = Array.from(allSources).sort();

    let srcHtml = '<thead><tr><th>Source / City</th>';
    CITIES.forEach(city => srcHtml += `<th>${city}</th>`);
    srcHtml += '</tr></thead><tbody>';

    sources.forEach(source => {
        srcHtml += '<tr>';
        srcHtml += `<td class="guide-name">${source}</td>`;
        CITIES.forEach(city => {
            const data = srcByCity[city]?.[source] || { revenue: 0, commissionCost: 0, tours: 0 };
            const commRate = data.revenue > 0 ? (data.commissionCost / data.revenue * 100) : 0;
            const commColor = commRate > 25 ? red + '44' : commRate > 15 ? '#BA7517' + '44' : green + '22';
            srcHtml += `<td style="background: ${commColor}">€${fmt(data.revenue)}<br>${commRate.toFixed(1)}% comm</td>`;
        });
        srcHtml += '</tr>';
    });

    srcHtml += '</tbody>';
    const srcTable = document.getElementById('source-city-table');
    if (srcTable) srcTable.innerHTML = srcHtml;

    // 4. Language mix bar chart
    const langByCity = buildLangByCity();
    const langLabels = CITIES;
    const engData = [];
    const espData = [];
    const fraData = [];

    CITIES.forEach(city => {
        const langs = langByCity[city];
        const total = (langs.eng.tours || 0) + (langs.esp.tours || 0) + (langs.fra.tours || 0);
        engData.push(total > 0 ? (langs.eng.tours / total * 100) : 0);
        espData.push(total > 0 ? (langs.esp.tours / total * 100) : 0);
        fraData.push(total > 0 ? (langs.fra.tours / total * 100) : 0);
    });

    makeBarChart('lang-mix-chart', langLabels, [
        { label: 'English', data: engData, backgroundColor: '#6B92B9', borderRadius: 4, borderSkipped: false },
        { label: 'Spanish', data: espData, backgroundColor: '#D18C6D', borderRadius: 4, borderSkipped: false },
        { label: 'French', data: fraData, backgroundColor: '#8FA8BC', borderRadius: 4, borderSkipped: false },
    ], {
        horizontal: true,
        showLegend: true,
        stacked: true,
        tooltipCb: {
            afterLabel: ctx => {
                const city = langLabels[ctx.dataIndex];
                const langs = langByCity[city];
                const langName = ['English', 'Spanish', 'French'][ctx.datasetIndex];
                const langKey = ['eng', 'esp', 'fra'][ctx.datasetIndex];
                return `${langs[langKey].tours} tours · ${langs[langKey].pax} pax`;
            }
        }
    });
}

function renderOpsMonthLine() {
    const has25 = typeof guideStats25 !== 'undefined';
    const { c25, green } = getThemeColors();
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();

    // Build monthly aggregates from day-level data with date filtering
    const m26 = buildMonthlyFromDays(guideStats26, cutoffMonth, cutoffDay);
    const m25 = has25 ? buildMonthlyFromDays(guideStats25, cutoffMonth, cutoffDay) : {};

    const allM = Array.from({length: cutoffMonth}, (_, i) => i + 1);
    const MONTH_SHORT = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
    makeLineChart('month-line', allM.map(m => MONTH_SHORT[m]), [
        { label: 'Revenue 2025', data: allM.map(m => m25[m]?.revenue || 0), borderColor: c25, backgroundColor: 'transparent', tension: 0.3, borderDash: [5,3] },
        { label: 'Revenue 2026', data: allM.map(m => m26[m]?.revenue || 0), borderColor: '#8FA8BC', backgroundColor: '#8FA8BC22', tension: 0.3, fill: true },
        { label: 'GM 2025', data: allM.map(m => m25[m]?.grossMargin || 0), borderColor: c25, backgroundColor: 'transparent', tension: 0.3, borderDash: [2,2], borderWidth: 1.5 },
        { label: 'GM 2026', data: allM.map(m => m26[m]?.grossMargin || 0), borderColor: green, backgroundColor: 'transparent', tension: 0.3, borderWidth: 2 },
    ]);
}

function renderPaxBandActionPanel() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    const gpb26 = mgmt26.byGuidePaxBand || {};
    const gpb25 = mgmt25?.byGuidePaxBand || {};

    // Calculate small group metrics
    const smallGroup26 = gpb26['1-5'] || { tours: 0, revenue: 0, grossMargin: 0 };
    const smallGroup25 = gpb25['1-5'] || { tours: 0, revenue: 0, grossMargin: 0 };

    const totalTours26 = Object.values(gpb26).reduce((sum, g) => sum + (g.tours || 0), 0);
    const totalTours25 = Object.values(gpb25).reduce((sum, g) => sum + (g.tours || 0), 0);

    const smallGroupPct26 = totalTours26 > 0 ? (smallGroup26.tours / totalTours26 * 100) : 0;
    const smallGroupPct25 = totalTours25 > 0 ? (smallGroup25.tours / totalTours25 * 100) : 0;
    const pctChange = smallGroupPct26 - smallGroupPct25;

    // Loss estimate: revenue at 0% margin (breakeven)
    const lossFromSmallGroups = smallGroup26.grossMargin < 0 ? Math.abs(smallGroup26.grossMargin) : 0;

    const el = document.getElementById('paxband-action-panel');
    if (el) {
        el.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 10px; color: var(--text);">Small Group Problem Summary</div>
            <div style="color: var(--text2); line-height: 1.6; font-size: 11px;">
                <div><strong>📊 Prevalence:</strong> ${smallGroupPct26.toFixed(0)}% of paid tours are 1–5 PAX (${smallGroup26.tours} tours)</div>
                <div><strong>💰 Margin loss:</strong> €${fmt(lossFromSmallGroups)} total from small groups</div>
                <div><strong>📈 Trend:</strong> ${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}pp vs 2025 — getting ${pctChange > 0 ? 'worse' : 'better'}</div>
            </div>
        `;
    }
}

// ── Date filter ───────────────────────────────────────────────────────────────

function mgmtRefreshAll() {
    if (MgmtPages.pl._init) {
        renderPlKpis(_activeCity);
        renderWaterfall();
        renderMonthTrend();
        renderBillingTrend();
    }
    if (MgmtPages.guides._init) renderGuideTable();
    if (MgmtPages.channels._init) renderDirectOtaTrend();
    if (MgmtPages.ops._init) {
        renderOpsMonthLine();
        renderPaymentMethod();
    }
    if (MgmtPages.cities._init) renderCitiesTab();
}

function updateMgmtDate(val) {
    GLOBAL_DATE = val;
    mgmtRefreshAll();
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function mgmtUpdateCharts() {
    const ax = axisDefaults();
    const tt = tooltipDefaults();
    Object.values(_charts).forEach(c => {
        if (c.options.scales) {
            Object.values(c.options.scales).forEach(sc => {
                if (sc.ticks) sc.ticks.color = ax.ticks.color;
                if (sc.grid)  sc.grid.color  = ax.grid.color;
            });
        }
        if (c.options.plugins?.tooltip) Object.assign(c.options.plugins.tooltip, tt);
        if (c.options.plugins?.legend?.labels) c.options.plugins.legend.labels.color = ax.ticks.color;
        c.update();
    });
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

function toggleShortcutOverlay() {
    const el = document.getElementById('shortcut-overlay');
    if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('title', document.body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode');
    document.getElementById('footer-date').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const picker = document.getElementById('mgmt-date-picker');
    if (picker) { picker.value = GLOBAL_DATE; }

    initPl();
    MgmtPages.pl._init = true;

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const tabMap = { '1': 'pl', '2': 'guides', '3': 'channels', '4': 'ops', '5': 'cities' };
        if (tabMap[e.key]) {
            const tabEl = document.getElementById('tab-' + tabMap[e.key]);
            if (tabEl) mgmtShowTab(tabMap[e.key], tabEl);
            return;
        }
        if (e.key === 't') { toggleMgmtTheme(); return; }
        if (e.key === 'd') { document.getElementById('mgmt-date-picker')?.focus(); return; }
        if (e.key === '?') { toggleShortcutOverlay(); return; }
        if (e.key === 'Escape') {
            const overlay = document.getElementById('shortcut-overlay');
            if (overlay && overlay.style.display === 'block') overlay.style.display = 'none';
        }
    });
});
