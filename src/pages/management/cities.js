import { CITIES, getGlobalDate } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, deltaClass, gmClass,
    filterStatsByDate, computeFilteredKpis, computeCity25,
    makeBarChart, getThemeColors,
} from './helpers.js';

export function initCities() {
    renderCitiesTab();
}

export function renderCitiesTab() {
    const { c25, c26, green, red } = getThemeColors();

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
        { label: t('management.english'), data: engData, backgroundColor: '#6B92B9', borderRadius: 4, borderSkipped: false },
        { label: t('management.spanish'), data: espData, backgroundColor: '#D18C6D', borderRadius: 4, borderSkipped: false },
        { label: t('management.french'), data: fraData, backgroundColor: '#8FA8BC', borderRadius: 4, borderSkipped: false },
    ], {
        horizontal: true,
        showLegend: true,
        stacked: true,
        tooltipCb: {
            afterLabel: ctx => {
                const city = langLabels[ctx.dataIndex];
                const langs = langByCity[city];
                const langKey = ['eng', 'esp', 'fra'][ctx.datasetIndex];
                return `${langs[langKey].tours} tours · ${langs[langKey].pax} pax`;
            }
        }
    });
}

// Helper functions — not exported

function buildDimensionByCity(dimensionKey, fields) {
    const result = {};
    CITIES.forEach(city => { result[city] = {}; });

    guideStats26.forEach(g => {
        const city = g.city;
        if (!result[city]) result[city] = {};
        const dim = g.mgmt?.[dimensionKey];
        if (!dim) return;

        Object.entries(dim).forEach(([key, data]) => {
            if (!result[city][key]) {
                result[city][key] = Object.fromEntries(fields.map(f => [f, 0]));
            }
            fields.forEach(f => {
                result[city][key][f] += data[f] || 0;
            });
        });
    });

    return result;
}

function buildTourTypeByCity() {
    return buildDimensionByCity('byTourType', ['revenue', 'grossMargin', 'tours']);
}

function buildSourceByCity() {
    return buildDimensionByCity('bySource', ['revenue', 'commissionCost', 'tours']);
}

function buildLangByCity() {
    const result = {};
    ['Zagreb', 'Dubrovnik', 'Split', 'Zadar'].forEach(city => {
        result[city] = { eng: { tours: 0, pax: 0 }, esp: { tours: 0, pax: 0 }, fra: { tours: 0, pax: 0 } };
    });

    guideStats26.forEach(g => {
        const city = g.city;
        ['eng', 'esp', 'fra'].forEach(lang => {
            if (g.stats?.[lang]) {
                const langStats = filterStatsByDate(g.stats[lang], getGlobalDate());
                result[city][lang].tours += langStats.paidTours || 0;
                result[city][lang].pax += langStats.paidPax || 0;
            }
        });
    });

    return result;
}

export function refreshCities() {
    renderCitiesTab();
}
