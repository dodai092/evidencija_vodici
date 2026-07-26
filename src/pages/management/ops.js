import { getGlobalDate } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, deltaClass,
    filterMgmtByDate,
    makeBarChart, makeLineChart, axisDefaults, getThemeColors,
} from './helpers.js';

const DOW_ORDER    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const PAXBAND_ORDER= ['1-4','5-10','11-20','21-30','30+'];
const GUIDE_PBAND_ORDER = ['1-5','6-10','11+'];
const MONTH_SHORT  = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

export function initOps() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    const { c25, c26, green, red } = getThemeColors();

    const gpb26 = mgmt26.byGuidePaxBand || {};
    const gpb25 = mgmt25?.byGuidePaxBand || {};
    const gpLabels = GUIDE_PBAND_ORDER.filter(k => gpb26[k] || gpb25[k]);

    makeBarChart('guide-paxband-gm', gpLabels, [
        {
            label: t('management.gmPercent') + ' 2025',
            data: gpLabels.map(k => {
                const d = gpb25[k]; return d && d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
            }),
            backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false,
        },
        {
            label: t('management.gmPercent') + ' 2026',
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
        {
            type: 'line',
            label: 'Breakeven (0%)',
            data: gpLabels.map(() => 0),
            borderColor: red + 'aa',
            borderDash: [5, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            order: 0,
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

    makeBarChart('guide-paxband-tours', gpLabels, [
        { label: t('management.tours') + ' 2025', data: gpLabels.map(k => gpb25[k]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: t('management.tours') + ' 2026', data: gpLabels.map(k => gpb26[k]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

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

    const pb26 = mgmt26.byPaxBand; const pb25 = mgmt25?.byPaxBand || {};
    const pbLabels = PAXBAND_ORDER.filter(k => pb26[k] || pb25[k]);
    makeBarChart('paxband-bar', pbLabels, [
        { label: '2025', data: pbLabels.map(k => pb25[k]?.tours || 0), backgroundColor: c25 + 'aa', borderRadius: 4, borderSkipped: false },
        { label: '2026', data: pbLabels.map(k => pb26[k]?.tours || 0), backgroundColor: c26 + 'aa', borderRadius: 4, borderSkipped: false },
    ], { showLegend: true });

    renderPaxBandActionPanel();

    const wk26 = mgmt26.byWeek;
    const wk25 = mgmt25?.byWeek || {};
    const wkNums = Object.keys(wk26).map(Number).sort((a,b)=>a-b);
    const ax = axisDefaults();
    const datasets = [
        { label: t('management.tours'), data: wkNums.map(w => wk26[String(w)].tours), borderColor: '#8FA8BC', backgroundColor: '#8FA8BC22', tension: 0.3, fill: true, yAxisID: 'yL' },
        { label: t('management.revenue'), data: wkNums.map(w => wk26[String(w)].revenue), borderColor: '#C49A8A', backgroundColor: 'transparent', tension: 0.3, yAxisID: 'yR' },
        { label: t('management.grossMargin'), data: wkNums.map(w => wk26[String(w)].grossMargin), borderColor: green, backgroundColor: 'transparent', tension: 0.3, borderDash: [4,3], yAxisID: 'yR' },
    ];
    if (Object.keys(wk25).length > 0) {
        datasets.push({
            label: t('management.revenue') + ' 2025',
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
        yL: { ...ax, position: 'left',  title: { display: true, text: t('management.tours'), color: ax.ticks.color } },
        yR: { ...ax, position: 'right', grid: { display: false }, title: { display: true, text: '€', color: ax.ticks.color } },
    });

    renderPaymentMethod();
}

export function renderPaymentMethod() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    const pm26 = mgmt26.byPaymentMethod || {};
    const pm25 = mgmt25?.byPaymentMethod || {};
    const { c25, c26 } = getThemeColors();

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

            const label = method === 'bank trf' ? t('management.bankTransfer') : t(`management.${method}`);
            container.innerHTML += `
                <div class="kpi-card">
                    <div class="kpi-label">${label}</div>
                    <div class="kpi-value">${fmtEur(d26.revenue)}</div>
                    <div class="kpi-sub">
                        GM%: <strong>${gm26.toFixed(1)}%</strong>
                        <span class="mgmt-kpi-delta ${deltaClass(gmDelta)}"> ${gmDelta > 0 ? '+' : ''}${gmDelta.toFixed(1)}%</span><br>
                        ${d26.tours} tours
                    </div>
                </div>
            `;
        });
    }

}

export function renderPaxBandActionPanel() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt : null;
    const gpb26 = mgmt26.byGuidePaxBand || {};
    const gpb25 = mgmt25?.byGuidePaxBand || {};

    const smallGroup26 = gpb26['1-5'] || { tours: 0, revenue: 0, grossMargin: 0 };
    const smallGroup25 = gpb25['1-5'] || { tours: 0, revenue: 0, grossMargin: 0 };

    const totalTours26 = Object.values(gpb26).reduce((sum, g) => sum + (g.tours || 0), 0);
    const totalTours25 = Object.values(gpb25).reduce((sum, g) => sum + (g.tours || 0), 0);

    const smallGroupPct26 = totalTours26 > 0 ? (smallGroup26.tours / totalTours26 * 100) : 0;
    const smallGroupPct25 = totalTours25 > 0 ? (smallGroup25.tours / totalTours25 * 100) : 0;
    const pctChange = smallGroupPct26 - smallGroupPct25;

    // Find the first PAX band with positive GM% in 2026
    let breakevenBand = null;
    for (const k of GUIDE_PBAND_ORDER) {
        const d = gpb26[k];
        if (d && d.revenue > 0 && d.grossMargin / d.revenue > 0) { breakevenBand = k; break; }
    }

    // Total margin lost on below-breakeven tours (negative GM only)
    const lossFromSmallGroups = smallGroup26.grossMargin < 0 ? Math.abs(smallGroup26.grossMargin) : 0;

    const el = document.getElementById('paxband-action-panel');
    if (el) {
        const breakevenNote = (smallGroup26.grossMargin < 0 && breakevenBand)
            ? `<div><strong>⚡ Action:</strong> Enforce a minimum of <strong>${breakevenBand.split('-')[0]} PAX</strong> per booking to guarantee positive margin on every tour</div>`
            : '';
        el.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 10px; color: var(--text);">${t('management.smallGroupProblem')}</div>
            <div style="color: var(--text2); line-height: 1.6; font-size: 11px;">
                <div><strong>📊 ${t('management.prevalence')}:</strong> ${smallGroupPct26.toFixed(0)}% of paid tours are 1–5 PAX (${smallGroup26.tours} ${t('management.tours')})</div>
                <div><strong>💰 ${t('management.marginLoss')}:</strong> €${fmt(lossFromSmallGroups)} net margin loss, 1–5 PAX band YTD (band average — doesn't capture individual below-breakeven tours)</div>
                <div><strong>📈 ${t('management.trend')}:</strong> ${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}pp ${t('management.vs2025')} — getting ${pctChange > 0 ? 'worse' : 'better'}</div>
                ${breakevenNote}
            </div>
        `;
    }
}

export function refreshOps() {
    renderPaymentMethod();
}
