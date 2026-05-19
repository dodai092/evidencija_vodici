import { getGlobalDate, parseGlobalDate, getRangeLabel } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, gmClass,
    get25, guidesForCity,
    filterMgmtByDate, filterStatsByDate,
    computeFilteredKpis, computeCity25,
    makeBarChart, makeLineChart, axisDefaults, tooltipDefaults, getThemeColors,
    buildMonthlyFromDays,
} from './helpers.js';

// ── P&L tab ───────────────────────────────────────────────────────────────────

export function initPl(city) {
    renderPlKpis(city);
    renderWaterfall();
    renderMonthTrend();
    renderBillingTrend();

    _positionStickyBar();
    window.addEventListener('resize', _positionStickyBar, { passive: true });

    const kpiGrid = document.querySelector('#mgmt-pl .kpi-grid');
    if (kpiGrid && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver(([entry]) => {
            const isPlActive = document.querySelector('#mgmt-pl')?.classList.contains('active');
            if (!isPlActive) return;
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

export function renderPlKpis(city) {
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
    document.getElementById('kpi-revenue-sub').innerHTML  = `${t('management.gmOfRevenue')}: ${gmPct.toFixed(1)}% ${t('management.ofRevenue')}` + kpiDelta(k.revenue, k25?.revenue);

    document.getElementById('kpi-commission').textContent   = fmtEur(k.commissionCost);
    document.getElementById('kpi-commission-sub').innerHTML = `${commPct.toFixed(1)}% ${t('management.ofRevenue')}` + kpiDelta(k.commissionCost, k25?.commissionCost);

    document.getElementById('kpi-vcost').textContent      = fmtEur(k.vendorCost);
    document.getElementById('kpi-vcost-sub').innerHTML    = t('management.guideFeesPaid') + kpiDelta(k.vendorCost, k25?.vendorCost);

    document.getElementById('kpi-gm').textContent         = fmtEur(k.grossMargin);
    document.getElementById('kpi-gmpct').innerHTML        = `<span class="${gmClass(gmPct)}">${gmPct.toFixed(1)}% ${t('management.margin')}</span>`;
    document.getElementById('kpi-gm-delta').innerHTML     = kpiDelta(k.grossMargin, k25?.grossMargin);

    document.getElementById('kpi-tour-cost').textContent  = fmtEur(k.tourCost);
    document.getElementById('kpi-vat').textContent        = fmtEur(k.vatAmount);
    document.getElementById('kpi-avg-gm').textContent     = fmtEur(avgGm);
    document.getElementById('kpi-avg-gm-sub').textContent = `${t('management.perPaidTour')} (${fmt(k.paidTours)} ${t('management.tours')})`;
    document.getElementById('kpi-guides').textContent     = fmt(guidesForCity(city).length);
    document.getElementById('kpi-guides-sub').textContent = city === 'all' ? t('management.acrossAllCities') : city;

    document.getElementById('kpi-tour-cost-delta').innerHTML = kpiDelta(k.tourCost, k25?.tourCost);
    const avgGm25 = k25 && k25.paidTours > 0 ? k25.grossMargin / k25.paidTours : null;
    document.getElementById('kpi-avg-gm-delta').innerHTML = kpiDelta(avgGm, avgGm25);

    const rangeLabel = getRangeLabel ? getRangeLabel() : '';
    const sBar = document.getElementById('sticky-kpi-bar');
    if (sBar) {
        document.getElementById('skpi-revenue').textContent    = fmtEur(k.revenue);
        document.getElementById('skpi-commission').textContent = fmtEur(k.commissionCost);
        document.getElementById('skpi-gm').textContent         = fmtEur(k.grossMargin);
        document.getElementById('skpi-gmpct').textContent      = gmPct.toFixed(1) + '% GM';
        document.getElementById('skpi-period').textContent     = rangeLabel + ' 2026';
    }

    renderInsightCallouts(k, k25);
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

    const rows = guides.map(g => {
        const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
        const sts = filterStatsByDate(g.stats.all, getGlobalDate());
        const gmPct = fin.revenue > 0 ? (fin.grossMargin / fin.revenue * 100) : 0;
        const g25 = get25(g.name);
        const fin25 = g25?.mgmt ? filterMgmtByDate(g25.mgmt, getGlobalDate()) : null;
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

    rows.sort((a, b) => b.grossMargin - a.grossMargin);
    const top10 = rows.slice(0, 10);

    el.innerHTML = `<div style="padding: 16px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px;">
        <div style="font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 12px;">${t('management.topGuidesMargin')}</div>
        <table class="mgmt-table" style="font-size: 11px;">
            <thead><tr>
                <th>${t('management.guide')}</th>
                <th>${t('management.revenue')}</th>
                <th>${t('management.gmEuro')}</th>
                <th>${t('management.gmPercent')}</th>
                <th>${t('management.vs2025')}</th>
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

export function renderWaterfall() {
    const has25 = typeof guideStats25 !== 'undefined';

    const guides26 = guideStats26.filter(g => g.mgmt);
    const guides25 = has25 ? guideStats25.filter(g => g.mgmt) : [];

    const t26 = guides26.reduce((acc, g) => {
        const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
        acc.revenue         += fin.revenue;
        acc.commissionCost  += fin.commissionCost;
        acc.vatAmount       += fin.vatAmount;
        acc.vendorCost      += fin.vendorCost;
        acc.tourCost        += fin.tourCost;
        acc.grossMargin     += fin.grossMargin;
        return acc;
    }, { revenue:0, commissionCost:0, vatAmount:0, vendorCost:0, tourCost:0, grossMargin:0 });

    let t25 = null;
    if (has25) {
        t25 = guides25.reduce((acc, g) => {
            const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
            acc.revenue         += fin.revenue;
            acc.commissionCost  += fin.commissionCost;
            acc.vatAmount       += fin.vatAmount;
            acc.vendorCost      += fin.vendorCost;
            acc.tourCost        += fin.tourCost;
            acc.grossMargin     += fin.grossMargin;
            return acc;
        }, { revenue:0, commissionCost:0, vatAmount:0, vendorCost:0, tourCost:0, grossMargin:0 });
    }

    const labels = [t('management.revenue'), t('management.commission'), t('management.vat'), t('management.vendorCost'), t('management.tourCost'), t('management.grossMargin')];
    const { c25, c26, red: cNeg } = getThemeColors();

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
    if (titleEl) titleEl.textContent = `${t('management.plBreakdown')} — ${rangeLabel} 2025 vs 2026`;

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
                <th>${t('management.plItem')}</th>
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

export function renderMonthTrend() {
    const has25 = typeof guideStats25 !== 'undefined';
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();

    const m26 = buildMonthlyFromDays(guideStats26, cutoffMonth, cutoffDay);
    const m25 = has25 ? buildMonthlyFromDays(guideStats25, cutoffMonth, cutoffDay) : {};

    const allM = Array.from({length: cutoffMonth}, (_, i) => i + 1);
    const MONTH_SHORT = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
    const { c25, c26 } = getThemeColors();
    makeLineChart('month-gm-line', allM.map(m => MONTH_SHORT[m]), [
        { label: t('management.grossMargin') + ' 2025', data: allM.map(m => m25[m]?.grossMargin || 0), borderColor: c25, backgroundColor: 'transparent', tension: 0.3, borderDash: [5,3] },
        { label: t('management.grossMargin') + ' 2026', data: allM.map(m => m26[m]?.grossMargin || 0), borderColor: c26, backgroundColor: c26 + '22', tension: 0.3, fill: true },
        { label: t('management.revenue') + ' 2025', data: allM.map(m => m25[m]?.revenue || 0), borderColor: c25, backgroundColor: 'transparent', tension: 0.3, borderDash: [2,2], borderWidth: 1.5 },
        { label: t('management.revenue') + ' 2026', data: allM.map(m => m26[m]?.revenue || 0), borderColor: '#8FA8BC', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5 },
    ]);
}

export function renderBillingTrend() {
    const has25 = typeof guideStats25 !== 'undefined';

    function aggregateBillingByDate(guides) {
        const billing = {POS: {revenue: 0, grossMargin: 0}, CPP: {revenue: 0, grossMargin: 0}};
        guides.forEach(g => {
            if (!g.mgmt || !g.mgmt.byBillingMethod) return;
            const fullRevenue = g.mgmt.revenue || 0;
            if (fullRevenue === 0) return;
            const filtered = filterMgmtByDate(g.mgmt, getGlobalDate());
            const ratio = filtered.revenue / fullRevenue;
            for (const [method, data] of Object.entries(g.mgmt.byBillingMethod)) {
                if (!billing[method]) billing[method] = {revenue: 0, grossMargin: 0};
                billing[method].revenue += (data.revenue || 0) * ratio;
                billing[method].grossMargin += (data.grossMargin || 0) * ratio;
            }
        });
        return billing;
    }

    const billing26 = aggregateBillingByDate(guideStats26);
    const billing25 = has25 ? aggregateBillingByDate(guideStats25) : {};

    const labels = ['POS', 'CPP'];
    const { c25, c26 } = getThemeColors();

    makeBarChart('billing-bar', labels, [
        { label: '2025 ' + t('management.revenue'), data: labels.map(k => billing25[k]?.revenue || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026 ' + t('management.revenue'), data: labels.map(k => billing26[k]?.revenue || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
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
                        <div style="font-size:10px;color:var(--text3)">2025 ${t('management.revenue')}</div>
                        <div style="font-family:var(--font-mono);font-size:15px">${fmtEur(d25.revenue)}</div>
                        <div style="font-size:10px;color:var(--text3)">GM: ${gm25pct.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div style="font-size:10px;color:var(--text3)">2026 ${t('management.revenue')}</div>
                        <div style="font-family:var(--font-mono);font-size:15px">${fmtEur(d26.revenue)}</div>
                        <div style="font-size:14px;font-weight:600;color:var(--text);margin:4px 0">GM: <span class="${gmClass(gm26pct)}" style="font-size:16px;font-weight:700">${gm26pct.toFixed(1)}%</span></div>
                        <div style="font-size:10px">${dd(revDelta, true)} ${t('management.vs2025')}</div>
                    </div>
                </div>
            </div>`;
        }
        el.innerHTML = bstat(t('management.directCashCard'), billing25['POS']||{revenue:0,grossMargin:0}, billing26['POS']||{revenue:0,grossMargin:0})
                     + bstat(t('management.otaBankTransfer'), billing25['CPP']||{revenue:0,grossMargin:0}, billing26['CPP']||{revenue:0,grossMargin:0});
    }
}

export function refreshPl(city) {
    renderPlKpis(city);
    renderWaterfall();
    renderMonthTrend();
    renderBillingTrend();
}
