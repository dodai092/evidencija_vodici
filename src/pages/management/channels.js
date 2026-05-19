import { getGlobalDate, parseGlobalDate } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, gmClass,
    guidesForCity, filterMgmtByDate,
    makeBarChart, makeLineChart, getThemeColors,
} from './helpers.js';

const OTA_COLORS = ['#C49A8A','#8FA8BC','#9BB09B','#C4B48A','#B0AAEE','#A8C4C4','#C4A8B0'];

export function initChannels() {
    renderCommissionWaterfall();
    renderDirectOtaTrend();
    renderOtaSourceTable();
    renderTourTypeTable();
}

export function renderCommissionWaterfall() {
    const srcData = kpiTotals26.mgmt.bySource;
    const src25   = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt?.bySource || {} : {};

    const srcKeys = Object.keys(srcData)
        .filter(k => srcData[k].revenue > 0)
        .sort((a,b) => srcData[b].revenue - srcData[a].revenue);

    if (!srcKeys.length) return;

    const { green, red, c26 } = getThemeColors();

    makeBarChart('commission-wfall', srcKeys, [
        {
            label: t('management.grossMargin'),
            data: srcKeys.map(k => {
                const d = srcData[k]; return d.grossMargin;
            }),
            backgroundColor: srcKeys.map(k => srcData[k].grossMargin >= 0 ? green + 'cc' : red + 'cc'),
            borderRadius: 4, borderSkipped: false,
        },
        {
            label: t('management.commission'),
            data: srcKeys.map(k => -(srcData[k].commissionCost || 0)),
            backgroundColor: red + '88',
            borderRadius: 0, borderSkipped: false,
        },
        {
            label: t('management.vendorCost'),
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

export function renderDirectOtaTrend() {
    const has25 = typeof guideStats25 !== 'undefined';
    const MONTH_SHORT = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();

    const monthChannel26 = {};
    const monthChannel25 = {};

    function buildMonthChannelData(guides, monthChannelObj) {
        guides.forEach(g => {
            if (!g.mgmt?.byDay) return;
            Object.entries(g.mgmt.byDay).forEach(([dayKey, dayVal]) => {
                const [m, d] = dayKey.split('-').map(Number);
                if (m < cutoffMonth || (m === cutoffMonth && d <= cutoffDay)) {
                    if (!monthChannelObj[m]) monthChannelObj[m] = { web: 0, ota: 0 };
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
        { label: t('management.directRevenue') + ' 2025', data: allM.map(m => monthChannel25[String(m)]?.web || 0), borderColor: c25, borderDash: [5,3], backgroundColor: 'transparent', tension: 0.3 },
        { label: t('management.directRevenue') + ' 2026', data: allM.map(m => monthChannel26[String(m)]?.web || 0), borderColor: green, backgroundColor: green + '22', tension: 0.3, fill: true },
        { label: t('management.otaRevenue') + ' 2025', data: allM.map(m => monthChannel25[String(m)]?.ota || 0), borderColor: c25, borderDash: [2,2], backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5 },
        { label: t('management.otaRevenue') + ' 2026', data: allM.map(m => monthChannel26[String(m)]?.ota || 0), borderColor: '#C49A8A', backgroundColor: 'transparent', tension: 0.3, borderWidth: 1.5 },
    ]);
}

export function renderOtaSourceTable() {
    const srcData = kpiTotals26.mgmt.bySource;
    const srcData25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt?.bySource || {} : {};
    const srcKeys = Object.keys(srcData)
        .filter(k => k !== 'FST' && srcData[k].revenue > 0)
        .sort((a,b) => srcData[b].grossMargin - srcData[a].grossMargin);

    const el = document.getElementById('ota-source-table');
    if (!el) return;
    el.innerHTML = `<table class="mgmt-table">
        <thead><tr>
            <th>${t('management.sources')}</th>
            <th>${t('management.tours')} '26</th><th>${t('management.revenue')} '26</th>
            <th>${t('management.commission')}</th><th>${t('management.commissionPercent')}</th>
            <th>${t('management.vendorCost')}</th>
            <th>${t('management.grossMargin')} '26</th><th>${t('management.gmPercent')}</th>
            <th>${t('management.grossMargin')} '25</th><th>Δ GM</th>
            <th>Action</th>
        </tr></thead>
        <tbody>${srcKeys.map(k => {
            const d = srcData[k];
            const d25 = srcData25[k];
            const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
            const commpct = d.revenue > 0 ? ((d.commissionCost||0) / d.revenue * 100) : 0;
            const dgm = d25 ? d.grossMargin - d25.grossMargin : null;

            let action = '—';
            if (d.tours < 5) action = t('management.lowVolume');
            else if (commpct > 25) action = t('management.highCommission');
            else if (commpct < 15 && d.tours >= 20) action = t('management.keepPushing');
            else if (dgm !== null && dgm < -200) action = t('management.declining');

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

export function renderTourTypeTable() {
    const byType26 = kpiTotals26.mgmt.byTourType || {};
    const byType25 = typeof kpiTotals25 !== 'undefined' ? kpiTotals25.mgmt?.byTourType || {} : {};

    const typeKeys = Object.keys(byType26).sort((a,b) => (byType26[b].revenue||0) - (byType26[a].revenue||0));
    if (!typeKeys.length) return;

    const el = document.getElementById('tour-type-tbody');
    if (!el) return;
    el.innerHTML = typeKeys.map(tk => {
        const d = byType26[tk];
        const d25 = byType25[tk];
        const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100) : 0;
        const avgPax = d.tours > 0 ? (d.pax / d.tours) : 0;
        const avgUnit = d.pax > 0 ? (d.revenue / d.pax) : 0;
        const avgUnit25 = d25 && d25.pax > 0 ? (d25.revenue / d25.pax) : 0;
        const dUnit = d25 ? avgUnit - avgUnit25 : null;
        const dTours = d25 ? d.tours - d25.tours : null;
        return `<tr>
            <td><strong>${tk}</strong></td>
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

export function refreshChannels() {
    renderDirectOtaTrend();
}
