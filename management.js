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
let _sortDir = -1; // -1 = desc

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
function fmtEur(v) { return '€' + fmt(v); }
function fmtPct(v) { return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'; }

function gmClass(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu'; }

function guidesForCity(city) {
    return guideStats26.filter(g => city === 'all' || g.city === city);
}

function guideYtd(guide) {
    // Sum all months present in mgmt (data only has completed months)
    const m = guide.mgmt;
    return {
        revenue:     m.revenue,
        vendorCost:  m.vendorCost,
        grossMargin: m.grossMargin,
        freeTours:   guide.stats.all.free.tours,
        paidTours:   guide.stats.all.paid.tours,
        freePax:     guide.stats.all.free.pax,
        paidPax:     guide.stats.all.paid.pax,
    };
}

function axisDefaults() {
    const s = getComputedStyle(document.body);
    const text2 = s.getPropertyValue('--text2').trim();
    const border = s.getPropertyValue('--border').trim();
    return {
        ticks: { color: text2, font: { family: 'Montserrat', size: 11 } },
        grid:  { color: border },
    };
}
function tooltipDefaults() {
    const s = getComputedStyle(document.body);
    return {
        backgroundColor: s.getPropertyValue('--card-bg').trim(),
        titleColor: s.getPropertyValue('--text').trim(),
        bodyColor: s.getPropertyValue('--text2').trim(),
        borderColor: s.getPropertyValue('--border-dark').trim(),
        borderWidth: 1,
    };
}

// ── Chart instances ───────────────────────────────────────────────────────────
let _charts = {};

function destroyChart(id) {
    if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function makeBarChart(canvasId, labels, values, colors, opts = {}) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const ax = axisDefaults();
    _charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderRadius: 4, borderSkipped: false }],
        },
        options: {
            indexAxis: opts.horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { ...tooltipDefaults(), callbacks: opts.tooltipCb || {} },
            },
            scales: {
                x: { ...ax, grid: opts.horizontal ? ax.grid : { display: false } },
                y: { ...ax, grid: opts.horizontal ? { display: false } : ax.grid },
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
            plugins: {
                legend: { labels: { color: ax.ticks.color, font: ax.ticks.font } },
                tooltip: { ...tooltipDefaults() },
            },
            scales: {
                x: ax,
                y: ax,
            },
        },
    });
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function initOverview() {
    renderKpis();
    renderGuideTable();
}

function renderKpis() {
    const kpi = kpiTotals26;
    const gm = kpi.grossMargin || 0;
    const rev = kpi.revenue || 0;
    const gmPct = rev > 0 ? (gm / rev * 100) : 0;
    const totalTours = kpi.freeTours + kpi.paidTours;
    const totalPax = kpi.freePax + kpi.paidPax;

    document.getElementById('kpi-revenue').textContent     = fmtEur(rev);
    document.getElementById('kpi-vcost').textContent       = fmtEur(kpi.vendorCost || 0);
    document.getElementById('kpi-gm').textContent          = fmtEur(gm);
    document.getElementById('kpi-gmpct').textContent       = gmPct.toFixed(1) + '%';
    document.getElementById('kpi-paid-tours').textContent  = fmt(kpi.paidTours);
    document.getElementById('kpi-total-pax').textContent   = fmt(totalPax);
    document.getElementById('kpi-guides').textContent      = fmt(kpi.guides);
    document.getElementById('kpi-free-tours').textContent  = fmt(kpi.freeTours);
}

function renderGuideTable() {
    const guides = guidesForCity(_activeCity);

    const rows = guides.map(g => {
        const y = guideYtd(g);
        const gmPct = y.revenue > 0 ? (y.grossMargin / y.revenue * 100) : 0;
        return { ...y, name: g.name, city: g.city, gmPct };
    });

    rows.sort((a, b) => _sortDir * (a[_sortCol] - b[_sortCol]));

    const tbody = document.getElementById('guide-tbody');
    tbody.innerHTML = rows.map((r, i) => `
        <tr>
            <td class="rank">${i + 1}</td>
            <td class="guide-name">${r.name}</td>
            <td><span class="city-dot" style="background:${CITY_COLS[r.city] || '#999'}"></span>${r.city}</td>
            <td>${fmt(r.freeTours)}</td>
            <td>${fmt(r.paidTours)}</td>
            <td>${fmt(r.freePax + r.paidPax)}</td>
            <td>${fmtEur(r.revenue)}</td>
            <td>${fmtEur(r.vendorCost)}</td>
            <td class="${gmClass(r.grossMargin)}">${fmtEur(r.grossMargin)}</td>
            <td class="${gmClass(r.gmPct)}">${r.gmPct.toFixed(1)}%</td>
        </tr>
    `).join('');
}

function mgmtFilterCity(city) {
    _activeCity = city;
    document.querySelectorAll('.city-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.city === city);
    });
    if (MgmtPages.overview._init) renderGuideTable();
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

// ── Channels & OTA tab ───────────────────────────────────────────────────────

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
    const chanLabels = chanKeys;
    const chanTours  = chanKeys.map(k => mgmt.byChannel[k].tours);
    const chanColors = chanKeys.map(k => CHANNEL_COLORS[k] || '#aaa');
    makeDonutChart('channel-donut', chanLabels, chanTours, chanColors);

    // Channel legend
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

    // OTA source bar
    const srcData = mgmt.bySource;
    const srcKeys = Object.keys(srcData)
        .filter(k => k !== 'FST' && srcData[k].revenue > 0)
        .sort((a,b) => srcData[b].revenue - srcData[a].revenue);
    makeBarChart('ota-bar', srcKeys,
        srcKeys.map(k => srcData[k].revenue),
        OTA_COLORS,
        { horizontal: true, tooltipCb: { label: ctx => `€${fmt(ctx.parsed.x)} · ${fmt(srcData[srcKeys[ctx.dataIndex]].tours)} tours` } }
    );

    // Tour type × channel matrix
    renderTypeChannelMatrix(mgmt);
}

function renderTypeChannelMatrix(mgmt) {
    // Build from per-guide byType per channel
    const channelKeys = ['web','OTA','b2b','free'];
    const typeMap = {}; // type → { channel → {tours, pax, revenue} }

    guideStats26.forEach(g => {
        if (!g.mgmt) return;
        Object.entries(g.mgmt.byChannel).forEach(([ch, cv]) => {
            // We don't have per-channel byType from the data — build from guide's byType and overall channel mix
        });
    });

    // Since we don't have byType×byChannel breakdown, use global byType for rows
    // and note channels in the header
    const byType = {};
    guideStats26.forEach(g => {
        Object.entries(g.stats.all.byType || {}).forEach(([type, v]) => {
            if (!byType[type]) byType[type] = { tours: 0, pax: 0 };
            byType[type].tours += v.tours;
            byType[type].pax   += v.pax;
        });
    });

    // Also get bySource breakdown globally
    const bySource = kpiTotals26.mgmt.bySource;
    const otaSources = Object.keys(bySource).filter(k => k !== 'FST').sort((a,b) => bySource[b].tours - bySource[a].tours);

    const rows = Object.entries(byType).sort((a,b) => b[1].tours - a[1].tours);
    const tbody = document.getElementById('type-channel-tbody');
    tbody.innerHTML = rows.map(([type, v]) => `
        <tr>
            <td>${tourLabel(type)}</td>
            <td>${fmt(v.tours)}</td>
            <td>${fmt(v.pax)}</td>
            <td>${v.tours > 0 ? (v.pax / v.tours).toFixed(1) : '—'}</td>
        </tr>
    `).join('');

    // OTA source detail table
    const otaEl = document.getElementById('ota-source-table');
    if (otaEl) {
        otaEl.innerHTML = `<table class="mgmt-table">
            <thead><tr><th>Source</th><th>Tours</th><th>PAX</th><th>Revenue</th><th>GM</th></tr></thead>
            <tbody>${otaSources.map(k => {
                const d = bySource[k];
                return `<tr>
                    <td>${k}</td>
                    <td>${fmt(d.tours)}</td>
                    <td>${fmt(d.pax)}</td>
                    <td>${fmtEur(d.revenue)}</td>
                    <td class="${gmClass(d.grossMargin)}">${fmtEur(d.grossMargin)}</td>
                </tr>`;
            }).join('')}</tbody>
        </table>`;
    }
}

// ── Operational tab ──────────────────────────────────────────────────────────

const DOW_ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SEASON_ORDER = ['low','mid','high','peak'];
const PAXBAND_ORDER = ['1-4','5-10','11-20','21-30','30+'];
const MONTH_SHORT = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

function initOps() {
    const mgmt = kpiTotals26.mgmt;

    // Day-of-week
    const dowData = mgmt.byDow;
    const dowLabels = DOW_ORDER.filter(d => dowData[d]);
    makeBarChart('dow-bar', dowLabels,
        dowLabels.map(d => dowData[d].tours),
        dowLabels.map(d => d === 'Sat' || d === 'Sun' ? '#C49A8A' : '#8FA8BC'),
        { tooltipCb: { label: ctx => `${ctx.parsed.y} tours · ${fmt(dowData[dowLabels[ctx.dataIndex]].pax)} PAX` } }
    );

    // Time slots
    const timeData = mgmt.byTime;
    const timeLabels = Object.keys(timeData).sort((a,b) => parseInt(a) - parseInt(b));
    const timeDisplay = timeLabels.map(h => `${h}:00`);
    makeBarChart('time-bar', timeDisplay,
        timeLabels.map(h => timeData[h].tours),
        ['#9BB09B','#8FA8BC','#C49A8A','#C4B48A','#B0AAEE'],
        { tooltipCb: { label: ctx => `${ctx.parsed.y} tours · ${fmt(timeData[timeLabels[ctx.dataIndex]].pax)} PAX` } }
    );

    // Season
    const seasonData = mgmt.bySeason;
    const seasonLabels = SEASON_ORDER.filter(s => seasonData[s]);
    makeBarChart('season-bar', seasonLabels.map(s => s[0].toUpperCase() + s.slice(1)),
        seasonLabels.map(s => seasonData[s].tours),
        ['#85B7EB','#8FA8BC','#C49A8A','#D4537E'],
        { tooltipCb: { label: ctx => `${ctx.parsed.y} tours · ${fmt(seasonData[seasonLabels[ctx.dataIndex]].pax)} PAX` } }
    );

    // Pax band
    const paxData = mgmt.byPaxBand;
    const paxLabels = PAXBAND_ORDER.filter(p => paxData[p]);
    makeBarChart('paxband-bar', paxLabels,
        paxLabels.map(p => paxData[p].tours),
        '#9BB09B',
        { tooltipCb: { label: ctx => `${ctx.parsed.y} tours · ${fmt(paxData[paxLabels[ctx.dataIndex]].pax)} PAX` } }
    );

    // Week-by-week trend line
    const weekData = mgmt.byWeek;
    const weekNums = Object.keys(weekData).map(Number).sort((a,b) => a-b);
    const weekLabels = weekNums.map(w => 'Wk ' + w);
    const s = getComputedStyle(document.body);
    makeLineChart('week-line', weekLabels, [
        {
            label: 'Tours',
            data: weekNums.map(w => weekData[String(w)].tours),
            borderColor: '#8FA8BC',
            backgroundColor: '#8FA8BC22',
            tension: 0.3,
            fill: true,
            yAxisID: 'yL',
        },
        {
            label: 'Revenue',
            data: weekNums.map(w => weekData[String(w)].revenue),
            borderColor: '#C49A8A',
            backgroundColor: 'transparent',
            tension: 0.3,
            yAxisID: 'yR',
        },
        {
            label: 'Gross Margin',
            data: weekNums.map(w => weekData[String(w)].grossMargin),
            borderColor: '#1D9E75',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderDash: [4,3],
            yAxisID: 'yR',
        },
    ]);

    // Fix week chart to have dual y-axes
    if (_charts['week-line']) {
        const ax = axisDefaults();
        _charts['week-line'].options.scales = {
            x:  ax,
            yL: { ...ax, position: 'left', title: { display: true, text: 'Tours', color: ax.ticks.color } },
            yR: { ...ax, position: 'right', grid: { display: false }, title: { display: true, text: '€', color: ax.ticks.color } },
        };
        _charts['week-line'].update();
    }
}

// ── Theme update ─────────────────────────────────────────────────────────────

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
        c.update();
    });
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('title', document.body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode');

    const picker = document.getElementById('cutoff-picker');
    if (picker) picker.value = GLOBAL_DATE;

    initOverview();
    MgmtPages.overview._init = true;

    document.getElementById('footer-date').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
});
