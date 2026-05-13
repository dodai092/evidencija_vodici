/* management.js — FreeSpirit Management Dashboard */

// ── Tab routing ───────────────────────────────────────────────────────────────

const MgmtPages = {
    overview:  { _init: false },
    channels:  { _init: false },
    ops:       { _init: false },
};

let _activeTab = 'overview';
let _activeCity = 'all';
let _sortCol = 'grossMargin';
let _sortDir = -1;

function mgmtShowTab(id, el) {
    document.querySelectorAll('.mgmt-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active','mgmt-tab-active'));
    document.getElementById('mgmt-' + id).classList.add('active');
    el.classList.add('active', 'mgmt-tab-active');
    _activeTab = id;
    if (!MgmtPages[id]._init) {
        if (id === 'overview')  initOverview();
        if (id === 'channels')  initChannels();
        if (id === 'ops')       initOps();
        MgmtPages[id]._init = true;
    }
}

// ── Data helpers ──────────────────────────────────────────────────────────────

const TOUR_LABELS = {
    best: 'Best of Zagreb', war: 'WW2 & Homeland War',
    private: 'Private', shared: 'Shared',
    christmas: 'Christmas', food: 'Food Tour',
    underground: 'Underground', street: 'Street Art',
    free: 'Free Tour',
};
function tourLabel(t) { return TOUR_LABELS[t] || t; }

function fmt(v, dec = 0) {
    return (v || 0).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtEur(v) {
    const n = v || 0;
    return (n < 0 ? '−€' : '€') + fmt(Math.abs(n));
}
function gmClass(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu'; }
function deltaClass(v) { return v > 0 ? 'delta-pos' : v < 0 ? 'delta-neg' : 'delta-neu'; }
function fmtDelta(v, prefix = '') {
    if (v === null || v === undefined) return '<span class="delta-neu">—</span>';
    const cls = deltaClass(v);
    const sign = v > 0 ? '+' : '';
    return `<span class="${cls}">${sign}${prefix}${fmt(Math.abs(v)) * (v < 0 ? -1 : 1) >= 0 ? fmt(v) : fmt(v)}</span>`;
}
function fmtDeltaEur(v) {
    if (v === null || v === undefined) return '<span class="delta-neu">—</span>';
    const cls = deltaClass(v);
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';
    return `<span class="${cls}">${sign}€${fmt(Math.abs(v))}</span>`;
}

// Build a lookup: name → guide for 2025
function build25Lookup() {
    const map = {};
    if (typeof guideStats25 !== 'undefined') {
        guideStats25.forEach(g => { map[g.name] = g; });
    }
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

function computeFilteredKpis(city) {
    const guides = guidesForCity(city);
    return guides.reduce((acc, g) => {
        acc.revenue      += g.mgmt.revenue;
        acc.vendorCost   += g.mgmt.vendorCost;
        acc.grossMargin  += g.mgmt.grossMargin;
        acc.freeTours    += g.stats.all.free.tours;
        acc.paidTours    += g.stats.all.paid.tours;
        acc.freePax      += g.stats.all.free.pax;
        acc.paidPax      += g.stats.all.paid.pax;
        return acc;
    }, { revenue: 0, vendorCost: 0, grossMargin: 0, freeTours: 0, paidTours: 0, freePax: 0, paidPax: 0 });
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

function makeBarChart(canvasId, labels, datasets, opts = {}) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const ax = axisDefaults();
    // If datasets is a plain array of values (legacy), wrap it
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

function makeDonutChart(canvasId, labels, values, colors) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    _charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: { ...tooltipDefaults() },
            },
        },
    });
}

function makeLineChart(canvasId, labels, datasets) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const ax = axisDefaults();
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
            scales: { x: ax, y: ax },
        },
    });
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function initOverview() {
    renderKpis(_activeCity);
    renderGuideTable();
}

function renderKpis(city) {
    const k = computeFilteredKpis(city);
    const gmPct = k.revenue > 0 ? (k.grossMargin / k.revenue * 100) : 0;
    const avgGmPerPaid = k.paidTours > 0 ? (k.grossMargin / k.paidTours) : 0;
    const totalTours = k.freeTours + k.paidTours;
    const totalPax = k.freePax + k.paidPax;

    // 2025 comparisons
    const has25 = typeof kpiTotals25 !== 'undefined' && kpiTotals25.revenue > 0;
    let k25 = null;
    if (has25 && city === 'all') {
        k25 = kpiTotals25;
    } else if (has25 && city !== 'all') {
        // Aggregate 2025 for this city from per-guide data
        k25 = (guideStats25 || []).filter(g => g.city === city).reduce((acc, g) => {
            if (!g.mgmt) return acc;
            acc.revenue     += g.mgmt.revenue;
            acc.vendorCost  += g.mgmt.vendorCost;
            acc.grossMargin += g.mgmt.grossMargin;
            acc.paidTours   += g.stats.all.paid.tours;
            acc.freeTours   += g.stats.all.free.tours;
            acc.freePax     += g.stats.all.free.pax;
            acc.paidPax     += g.stats.all.paid.pax;
            return acc;
        }, { revenue: 0, vendorCost: 0, grossMargin: 0, paidTours: 0, freeTours: 0, freePax: 0, paidPax: 0 });
    }

    function deltaHtml(val26, val25, fmt25 = fmt) {
        if (!k25) return '';
        const d = val26 - val25;
        const pct = val25 !== 0 ? (d / Math.abs(val25) * 100) : null;
        const cls = d > 0 ? 'delta-pos' : d < 0 ? 'delta-neg' : 'delta-neu';
        const sign = d >= 0 ? '+' : '−';
        const pctStr = pct !== null ? ` (${d >= 0 ? '+' : ''}${pct.toFixed(1)}%)` : '';
        return `<div class="kpi-delta ${cls}">${sign}${fmt25(Math.abs(d))}${pctStr} vs 2025</div>`;
    }

    document.getElementById('kpi-revenue').textContent    = fmtEur(k.revenue);
    document.getElementById('kpi-revenue-sub').innerHTML  = `GM: ${gmPct.toFixed(1)}% of revenue` + deltaHtml(k.revenue, k25?.revenue || 0, v => '€' + fmt(v));

    document.getElementById('kpi-vcost').textContent      = fmtEur(k.vendorCost);
    document.getElementById('kpi-vcost-sub').innerHTML    = `${k.paidTours} paid tours` + deltaHtml(k.vendorCost, k25?.vendorCost || 0, v => '€' + fmt(v));

    document.getElementById('kpi-gm').textContent         = fmtEur(k.grossMargin);
    document.getElementById('kpi-gmpct').textContent      = gmPct.toFixed(1) + '% margin';
    document.getElementById('kpi-gm-delta').innerHTML     = deltaHtml(k.grossMargin, k25?.grossMargin || 0, v => '€' + fmt(v));

    document.getElementById('kpi-avg-gm').textContent     = fmtEur(avgGmPerPaid);
    document.getElementById('kpi-avg-gm-sub').textContent = 'avg gross margin per paid tour';

    document.getElementById('kpi-paid-tours').textContent = fmt(k.paidTours);
    document.getElementById('kpi-paid-sub').innerHTML     = `Free: ${fmt(k.freeTours)}` + deltaHtml(k.paidTours, k25?.paidTours || 0);

    document.getElementById('kpi-total-pax').textContent  = fmt(k.freePax + k.paidPax);
    document.getElementById('kpi-pax-sub').innerHTML      = `Paid PAX: ${fmt(k.paidPax)}` + deltaHtml(k.freePax + k.paidPax, (k25?.freePax || 0) + (k25?.paidPax || 0));

    document.getElementById('kpi-guides').textContent     = fmt(guidesForCity(city).length);
    document.getElementById('kpi-guides-sub').textContent = city === 'all' ? 'across all cities' : city;
}

function renderGuideTable() {
    const guides = guidesForCity(_activeCity);

    const rows = guides.map(g => {
        const m = g.mgmt;
        const s = g.stats.all;
        const gmPct = m.revenue > 0 ? (m.grossMargin / m.revenue * 100) : 0;
        const avgGm = s.paid.tours > 0 ? (m.grossMargin / s.paid.tours) : 0;

        // 2025 data for this guide
        const g25 = get25(g.name);
        const paid25 = g25 ? g25.stats.all.paid.tours : null;
        const free25 = g25 ? g25.stats.all.free.tours : null;
        const pax25  = g25 ? (g25.stats.all.free.pax + g25.stats.all.paid.pax) : null;
        const rev25  = g25?.mgmt ? g25.mgmt.revenue : null;
        const gm25   = g25?.mgmt ? g25.mgmt.grossMargin : null;

        return {
            name: g.name, city: g.city,
            freeTours: s.free.tours, paidTours: s.paid.tours,
            totalPax: s.free.pax + s.paid.pax,
            revenue: m.revenue, vendorCost: m.vendorCost,
            grossMargin: m.grossMargin, gmPct, avgGm,
            paid25, free25, pax25, rev25, gm25,
        };
    });

    rows.sort((a, b) => _sortDir * (a[_sortCol] - b[_sortCol]));

    const tbody = document.getElementById('guide-tbody');
    tbody.innerHTML = rows.map((r, i) => {
        const dPaid = r.paid25 !== null ? r.paidTours - r.paid25 : null;
        const dGm   = r.gm25   !== null ? r.grossMargin - r.gm25 : null;
        const dRev  = r.rev25  !== null ? r.revenue - r.rev25 : null;

        function dd(v, eurSign = false) {
            if (v === null) return '<span class="delta-neu">—</span>';
            const cls = v > 0 ? 'delta-pos' : v < 0 ? 'delta-neg' : 'delta-neu';
            const sign = v > 0 ? '+' : '';
            return `<span class="${cls}">${sign}${eurSign ? '€' : ''}${fmt(v)}</span>`;
        }

        return `<tr>
            <td class="rank">${i + 1}</td>
            <td class="guide-name">${r.name}</td>
            <td><span class="city-dot" style="background:${CITY_COLS[r.city] || '#999'}"></span>${r.city}</td>
            <td>${fmt(r.freeTours)}</td>
            <td>${fmt(r.paidTours)}<br><small class="yoy">${dd(dPaid)}</small></td>
            <td>${fmt(r.totalPax)}</td>
            <td>${fmtEur(r.revenue)}<br><small class="yoy">${dd(dRev, true)}</small></td>
            <td>${fmtEur(r.vendorCost)}</td>
            <td class="${gmClass(r.grossMargin)}">${fmtEur(r.grossMargin)}<br><small class="yoy">${dd(dGm, true)}</small></td>
            <td class="${gmClass(r.gmPct)}">${r.gmPct.toFixed(1)}%</td>
            <td class="${gmClass(r.avgGm)}">${fmtEur(r.avgGm)}</td>
        </tr>`;
    }).join('');
}

function mgmtFilterCity(city) {
    _activeCity = city;
    document.querySelectorAll('.city-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.city === city);
    });
    if (MgmtPages.overview._init) {
        renderKpis(city);
        renderGuideTable();
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

// ── Channels & OTA tab ────────────────────────────────────────────────────────

const CHANNEL_COLORS = {
    web:  '#8FA8BC',
    OTA:  '#C49A8A',
    b2b:  '#9BB09B',
    free: '#C4B48A',
};
const OTA_COLORS = ['#C49A8A','#8FA8BC','#9BB09B','#C4B48A','#B0AAEE'];

function initChannels() {
    const mgmt = kpiTotals26.mgmt;

    // Channel donut
    const chanKeys = Object.keys(mgmt.byChannel).sort((a,b) => mgmt.byChannel[b].tours - mgmt.byChannel[a].tours);
    const chanTours  = chanKeys.map(k => mgmt.byChannel[k].tours);
    const chanColors = chanKeys.map(k => CHANNEL_COLORS[k] || '#aaa');
    makeDonutChart('channel-donut', chanKeys, chanTours, chanColors);

    const totalTours = chanTours.reduce((s,v) => s+v, 0);
    document.getElementById('channel-legend').innerHTML = chanKeys.map((k,i) => {
        const d = mgmt.byChannel[k];
        const pct = totalTours > 0 ? (d.tours / totalTours * 100).toFixed(1) : '0.0';
        return `<div class="leg-row">
            <span class="leg-dot" style="background:${chanColors[i]}"></span>
            <span class="leg-label">${k}</span>
            <span class="leg-val">${fmt(d.tours)} tours</span>
            <span class="leg-pct">${pct}%</span>
            <span class="leg-rev">${fmtEur(d.revenue)}</span>
        </div>`;
    }).join('');

    // OTA source bar — sorted by GM
    const srcData = mgmt.bySource;
    const srcKeys = Object.keys(srcData)
        .filter(k => k !== 'FST' && srcData[k].revenue > 0)
        .sort((a,b) => srcData[b].grossMargin - srcData[a].grossMargin);

    makeBarChart('ota-bar', srcKeys,
        srcKeys.map(k => srcData[k].grossMargin),
        { colors: OTA_COLORS, horizontal: true,
          tooltipCb: { label: ctx => {
              const d = srcData[srcKeys[ctx.dataIndex]];
              return [`€${fmt(ctx.parsed.x)} GM`, `€${fmt(d.revenue)} rev · ${fmt(d.tours)} tours`];
          }}
        }
    );

    // 2025 vs 2026 channel comparison bar
    if (typeof kpiTotals25 !== 'undefined' && kpiTotals25.mgmt) {
        const mgmt25 = kpiTotals25.mgmt;
        const allChanKeys = [...new Set([...Object.keys(mgmt.byChannel), ...Object.keys(mgmt25.byChannel)])];
        const cmpLabels = allChanKeys.filter(k => mgmt.byChannel[k] || mgmt25.byChannel[k]);
        const s = getComputedStyle(document.body);
        makeBarChart('channel-cmp-bar', cmpLabels, [
            {
                label: '2025',
                data: cmpLabels.map(k => mgmt25.byChannel[k]?.tours || 0),
                backgroundColor: s.getPropertyValue('--y25').trim() + 'aa',
                borderRadius: 4, borderSkipped: false,
            },
            {
                label: '2026',
                data: cmpLabels.map(k => mgmt.byChannel[k]?.tours || 0),
                backgroundColor: s.getPropertyValue('--y26').trim() + 'aa',
                borderRadius: 4, borderSkipped: false,
            },
        ], { showLegend: true });
    }

    // OTA source detail table
    const otaEl = document.getElementById('ota-source-table');
    if (otaEl) {
        const otaSrc25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt?.bySource || {} : {};
        otaEl.innerHTML = `<table class="mgmt-table">
            <thead><tr>
                <th>Source</th>
                <th>Tours '26</th><th>Revenue '26</th><th>GM '26</th>
                <th>GM% '26</th>
                <th>Tours '25</th><th>GM '25</th><th>Δ GM</th>
            </tr></thead>
            <tbody>${srcKeys.map(k => {
                const d = srcData[k];
                const d25 = otaSrc25[k];
                const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
                const dgm = d25 ? d.grossMargin - d25.grossMargin : null;
                function dd(v) {
                    if (v === null) return '<span class="delta-neu">—</span>';
                    const cls = v > 0 ? 'delta-pos' : v < 0 ? 'delta-neg' : 'delta-neu';
                    return `<span class="${cls}">${v > 0 ? '+' : ''}€${fmt(v)}</span>`;
                }
                return `<tr>
                    <td><strong>${k}</strong></td>
                    <td>${fmt(d.tours)}</td>
                    <td>${fmtEur(d.revenue)}</td>
                    <td class="${gmClass(d.grossMargin)}">${fmtEur(d.grossMargin)}</td>
                    <td class="${gmClass(gmpct)}">${gmpct.toFixed(1)}%</td>
                    <td>${d25 ? fmt(d25.tours) : '—'}</td>
                    <td>${d25 ? fmtEur(d25.grossMargin) : '—'}</td>
                    <td>${dd(dgm)}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>`;
    }

    // Tour type table
    const byType26 = {};
    guideStats26.forEach(g => {
        Object.entries(g.stats.all.byType || {}).forEach(([type, v]) => {
            if (!byType26[type]) byType26[type] = { tours: 0, pax: 0 };
            byType26[type].tours += v.tours;
            byType26[type].pax   += v.pax;
        });
    });
    const byType25 = {};
    (guideStats25 || []).forEach(g => {
        Object.entries(g.stats.all.byType || {}).forEach(([type, v]) => {
            if (!byType25[type]) byType25[type] = { tours: 0, pax: 0 };
            byType25[type].tours += v.tours;
            byType25[type].pax   += v.pax;
        });
    });

    const typeRows = Object.entries(byType26).sort((a,b) => b[1].tours - a[1].tours);
    document.getElementById('type-channel-tbody').innerHTML = typeRows.map(([type, v]) => {
        const v25 = byType25[type];
        const dTours = v25 ? v.tours - v25.tours : null;
        function dd(val) {
            if (val === null) return '<span class="delta-neu">—</span>';
            const cls = val > 0 ? 'delta-pos' : val < 0 ? 'delta-neg' : 'delta-neu';
            return `<span class="${cls}">${val > 0 ? '+' : ''}${fmt(val)}</span>`;
        }
        return `<tr>
            <td>${tourLabel(type)}</td>
            <td>${fmt(v.tours)}</td>
            <td>${v25 ? fmt(v25.tours) : '—'}</td>
            <td>${dd(dTours)}</td>
            <td>${fmt(v.pax)}</td>
            <td>${v.tours > 0 ? (v.pax / v.tours).toFixed(1) : '—'}</td>
        </tr>`;
    }).join('');
}

// ── Operational tab ───────────────────────────────────────────────────────────

const DOW_ORDER    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SEASON_ORDER = ['low','mid','high','peak'];
const PAXBAND_ORDER= ['1-4','5-10','11-20','21-30','30+'];
const MONTH_SHORT  = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

function initOps() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    const s = getComputedStyle(document.body);
    const c25 = s.getPropertyValue('--y25').trim();
    const c26 = s.getPropertyValue('--y26').trim();

    // Day-of-week — 2025 vs 2026
    const dowData26 = mgmt26.byDow;
    const dowData25 = mgmt25?.byDow || {};
    const dowLabels = DOW_ORDER.filter(d => dowData26[d] || dowData25[d]);
    makeBarChart('dow-bar', dowLabels, [
        { label: '2025', data: dowLabels.map(d => dowData25[d]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: dowLabels.map(d => dowData26[d]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

    // Time slots — 2025 vs 2026
    const timeData26 = mgmt26.byTime;
    const timeData25 = mgmt25?.byTime || {};
    const timeKeys = [...new Set([...Object.keys(timeData26), ...Object.keys(timeData25)])].sort((a,b) => parseInt(a)-parseInt(b));
    makeBarChart('time-bar', timeKeys.map(h => `${h}:00`), [
        { label: '2025', data: timeKeys.map(h => timeData25[h]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: timeKeys.map(h => timeData26[h]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

    // Season
    const seasonData = mgmt26.bySeason;
    const seasonData25 = mgmt25?.bySeason || {};
    const seasonLabels = SEASON_ORDER.filter(s => seasonData[s] || seasonData25[s]);
    makeBarChart('season-bar', seasonLabels.map(s => s[0].toUpperCase() + s.slice(1)), [
        { label: '2025', data: seasonLabels.map(s => seasonData25[s]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: seasonLabels.map(s => seasonData[s]?.tours || 0),   backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

    // Pax band
    const paxData = mgmt26.byPaxBand;
    const paxData25 = mgmt25?.byPaxBand || {};
    const paxLabels = PAXBAND_ORDER.filter(p => paxData[p] || paxData25[p]);
    makeBarChart('paxband-bar', paxLabels, [
        { label: '2025', data: paxLabels.map(p => paxData25[p]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: paxLabels.map(p => paxData[p]?.tours || 0),   backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

    // Month-by-month revenue & GM trend comparison
    const monthData26 = mgmt26.byMonth;
    const monthData25 = mgmt25?.byMonth || {};
    const allMonths = [...new Set([...Object.keys(monthData26), ...Object.keys(monthData25)])].map(Number).sort((a,b) => a-b);
    const monthLabels = allMonths.map(m => MONTH_SHORT[m]);

    makeLineChart('month-line', monthLabels, [
        {
            label: 'Revenue 2025',
            data: allMonths.map(m => monthData25[String(m)]?.revenue || 0),
            borderColor: c25, backgroundColor: 'transparent',
            tension: 0.3, borderDash: [5,3],
        },
        {
            label: 'Revenue 2026',
            data: allMonths.map(m => monthData26[String(m)]?.revenue || 0),
            borderColor: c26, backgroundColor: c26 + '22',
            tension: 0.3, fill: true,
        },
        {
            label: 'GM 2025',
            data: allMonths.map(m => monthData25[String(m)]?.grossMargin || 0),
            borderColor: c25, backgroundColor: 'transparent',
            tension: 0.3, borderDash: [2,2], borderWidth: 1.5,
        },
        {
            label: 'GM 2026',
            data: allMonths.map(m => monthData26[String(m)]?.grossMargin || 0),
            borderColor: '#1D9E75', backgroundColor: 'transparent',
            tension: 0.3, borderWidth: 2,
        },
    ]);

    // Week-by-week trend 2026
    const weekData = mgmt26.byWeek;
    const weekNums = Object.keys(weekData).map(Number).sort((a,b) => a-b);
    makeLineChart('week-line', weekNums.map(w => 'Wk ' + w), [
        {
            label: 'Tours',
            data: weekNums.map(w => weekData[String(w)].tours),
            borderColor: '#8FA8BC', backgroundColor: '#8FA8BC22',
            tension: 0.3, fill: true, yAxisID: 'yL',
        },
        {
            label: 'Revenue',
            data: weekNums.map(w => weekData[String(w)].revenue),
            borderColor: '#C49A8A', backgroundColor: 'transparent',
            tension: 0.3, yAxisID: 'yR',
        },
        {
            label: 'Gross Margin',
            data: weekNums.map(w => weekData[String(w)].grossMargin),
            borderColor: '#1D9E75', backgroundColor: 'transparent',
            tension: 0.3, borderDash: [4,3], yAxisID: 'yR',
        },
    ]);
    if (_charts['week-line']) {
        const ax = axisDefaults();
        _charts['week-line'].options.scales = {
            x:  ax,
            yL: { ...ax, position: 'left',  title: { display: true, text: 'Tours', color: ax.ticks.color } },
            yR: { ...ax, position: 'right', grid: { display: false }, title: { display: true, text: '€', color: ax.ticks.color } },
        };
        _charts['week-line'].update();
    }
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function mgmtUpdateCharts() {
    Object.values(_charts).forEach(c => {
        const ax = axisDefaults();
        const tt = tooltipDefaults();
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

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('title', document.body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode');
    document.getElementById('footer-date').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    initOverview();
    MgmtPages.overview._init = true;
});
