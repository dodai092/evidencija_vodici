import {
    CITIES, getCityColor, getChartColors as _chartColors, CITY_CLS,
    fmtN, filteredStats, getCutoffMonth, getGlobalDate, getRangeLabel,
    toggleSection, registerPage, safeName,
} from '../../shared.js';
import { t, titleAttr } from '../../i18n.js';
import {
    createFreePaxCityChart, createPaidCityChart,
    createMonthlyFreePaxChart, createMonthlyPaidChart,
    createCityMonthlyChart, createAvgFreePaxChart,
    createPaidTypeChart, createWarAvgChart,
    updateChartColors,
} from './charts.js';

export const PageCmp = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    mergedGuides: [],
    cityChartInstance: null,
    paidCityChartInstance: null,
    monthlyChartInstance: null,
    paidChartInstance: null,
    cityMonthlyChartInstance: null,
    privatePaidChartInstance: null,
    sharedPaidChartInstance: null,
    warAvgChartInstance: null,
    avgFreePaxCmpChartInstance: null,
    activeAvgType: 'all',
    ALL_PAID_TYPES: ['war', 'food', 'best', 'war PR', 'food PR', 'old', 'big'],
    activePrivateCity: 'all',
    activePrivateType: 'all',
    activeSharedCity: 'all',
    activeSharedType: 'all',
    PRIVATE_TYPES: ['war PR', 'food PR', 'best', 'old', 'big'],
    SHARED_TYPES: ['war', 'food', 'best'],
    _initialized: false,

    _el(id) { return document.getElementById(id + '-cmp'); },
    _scope(sel) { return document.querySelectorAll('#page-cmp ' + sel); },

    fmtDelta(v25, v26) {
        if (v25 === 0 && v26 === 0) return '<span class="dash">—</span>';
        if (v25 === 0) return '<span class="delta pos">NEW</span>';
        const d = v26 - v25;
        const p = ((d / v25) * 100).toFixed(0);
        const sym = d > 0 ? '▲' : d < 0 ? '▼' : '=';
        const cls = d > 0 ? 'pos' : d < 0 ? 'neg' : 'neu';
        const sign = d > 0 ? '+' : '';
        return `<span class="delta ${cls}">${sym}${Math.abs(d)} (${sign}${p}%)</span>`;
    },

    pctChange(v25, v26) {
        if (v25 === 0 && v26 === 0) return '—';
        if (v25 === 0) return '+∞%';
        const p = ((v26 - v25) / v25 * 100).toFixed(0);
        const cls = v26 > v25 ? 'pos' : v26 < v25 ? 'neg' : 'neu';
        const sign = v26 >= v25 ? '+' : '';
        return `<span class="kpi-pct ${cls}">${sign}${p}%</span>`;
    },

    buildMerged() {
        const map = {};
        guideStats25.forEach(g => {
            map[g.name] = { name: g.name, city: g.city, g25: g, g26: null };
        });
        guideStats26.forEach(g => {
            if (map[g.name]) {
                map[g.name].g26 = g;
            } else {
                map[g.name] = { name: g.name, city: g.city, g25: null, g26: g };
            }
        });
        const result = Object.values(map);
        result.sort((a, b) => {
            if (a.city !== b.city) return CITIES.indexOf(a.city) - CITIES.indexOf(b.city);
            const a26 = a.g26 ? filteredStats(a.g26.stats[this.activeLang], this.activeMonths).freeTours : -1;
            const b26 = b.g26 ? filteredStats(b.g26.stats[this.activeLang], this.activeMonths).freeTours : -1;
            if (a26 >= 0 && b26 < 0) return -1;
            if (a26 < 0 && b26 >= 0) return 1;
            if (a26 >= 0 && b26 >= 0) return b26 - a26;
            const a25 = a.g25 ? filteredStats(a.g25.stats[this.activeLang], this.activeMonths).freeTours : -1;
            const b25 = b.g25 ? filteredStats(b.g25.stats[this.activeLang], this.activeMonths).freeTours : -1;
            return b25 - a25;
        });
        return result;
    },

    renderCard(m) {
        const st25 = m.g25 ? m.g25.stats[this.activeLang] : null;
        const st26 = m.g26 ? m.g26.stats[this.activeLang] : null;
        const ytd25 = st25 ? filteredStats(st25, this.activeMonths) : null;
        const ytd26 = st26 ? filteredStats(st26, this.activeMonths) : null;
        const col = getCityColor(m.city);
        const init = m.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const inactive = !m.g26;

        return `<div class="guide-card ${inactive ? 'inactive' : ''}" data-city="${m.city}" data-name="${safeName(m.name)}">` +
            `<div class="gc-stripe" style="background:${col}"></div>` +
            `<div class="gc-body">` +
            `<div class="gc-header">` +
            `<div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div>` +
            `<span class="gc-name">${m.name}</span>` +
            `<span class="city-pill" style="background:${col}18;color:${col}">${m.city}</span>` +
            `</div>` +
            `<table class="gc-cmp-table"><tbody>` +
            `<tr><td class="label">${t('labels.freeT')}</td><td class="v25">${ytd25 ? ytd25.freeTours : '—'}</td>` +
            `<td class="v26">${ytd26 ? ytd26.freeTours : '—'}</td>` +
            `<td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.freeTours, ytd26.freeTours) : '—'}</td></tr>` +
            `<tr><td class="label">${t('labels.freeP')}</td><td class="v25">${ytd25 ? ytd25.freePax : '—'}</td>` +
            `<td class="v26">${ytd26 ? ytd26.freePax : '—'}</td>` +
            `<td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.freePax, ytd26.freePax) : '—'}</td></tr>` +
            `<tr><td class="label">${t('labels.paidT')}</td><td class="v25">${ytd25 ? ytd25.paidTours : '—'}</td>` +
            `<td class="v26">${ytd26 ? ytd26.paidTours : '—'}</td>` +
            `<td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.paidTours, ytd26.paidTours) : '—'}</td></tr>` +
            `<tr><td class="label">${t('labels.paidP')}</td><td class="v25">${ytd25 ? ytd25.paidPax : '—'}</td>` +
            `<td class="v26">${ytd26 ? ytd26.paidPax : '—'}</td>` +
            `<td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.paidPax, ytd26.paidPax) : '—'}</td></tr>` +
            `</tbody></table>` +
            `</div></div>`;
    },

    renderAll() {
        let html = '';
        const fc = this.mergedGuides.filter(m => this.activeCity === 'all' || m.city === this.activeCity);
        CITIES.forEach(city => {
            const cg = fc.filter(m => m.city === city);
            if (!cg.length) return;
            html += `<section class="city-section" data-city="${city}">` +
                `<div class="section-title ${CITY_CLS[city] || ''}">${city}</div>` +
                `<div class="guide-grid">${cg.map(m => this.renderCard(m)).join('')}</div>` +
                `</section>`;
        });
        this._el('guide-sections').innerHTML = html;
        this.updateKPIs();
        this.renderMonthlyTable();
        setTimeout(() => this.updateCharts(), 100);
    },

    updateKPIs() {
        const fc = this.mergedGuides.filter(m => this.activeCity === 'all' || m.city === this.activeCity);
        let pt25 = 0, pt26 = 0, fp25 = 0, fp26 = 0, ft25 = 0, ft26 = 0;
        fc.forEach(m => {
            if (m.g25) {
                const s25 = filteredStats(m.g25.stats[this.activeLang], this.activeMonths);
                fp25 += s25.freePax; pt25 += s25.paidTours; ft25 += s25.freeTours;
            }
            if (m.g26) {
                const s26 = filteredStats(m.g26.stats[this.activeLang], this.activeMonths);
                fp26 += s26.freePax; pt26 += s26.paidTours; ft26 += s26.freeTours;
            }
        });

        const setDelta = (absId, pctId, v25, v26, fmt) => {
            const diff = v26 - v25;
            const cls = diff >= 0 ? 'pos' : 'neg';
            const pct = v25 === 0 ? '—' : (diff >= 0 ? '+' : '-') + Math.abs(Math.round((diff / v25) * 100)) + '%';
            this._el(absId).innerHTML = `<span class="${cls}">${fmt(Math.abs(diff))}</span>`;
            this._el(pctId).innerHTML = `<span class="${cls}">${pct}</span>`;
        };

        setDelta('kd-free-abs', 'kd-free-pct', fp25, fp26, fmtN);
        setDelta('kd-paid-abs', 'kd-paid-pct', pt25, pt26, v => v);
        setDelta('kd-free-tours-abs', 'kd-free-tours-pct', ft25, ft26, fmtN);

        this._el('kv-free25').textContent        = fmtN(fp25);
        this._el('kv-free26').textContent        = fmtN(fp26);
        this._el('kv-paid25').textContent        = pt25;
        this._el('kv-paid26').textContent        = pt26;
        this._el('kv-free-tours25').textContent  = fmtN(ft25);
        this._el('kv-free-tours26').textContent  = fmtN(ft26);

        const avg25 = ft25 > 0 ? (fp25 / ft25).toFixed(1) : '—';
        const avg26 = ft26 > 0 ? (fp26 / ft26).toFixed(1) : '—';
        this._el('kv-avg-pax25').textContent = avg25;
        this._el('kv-avg-pax26').textContent = avg26;
        setDelta('kd-avg-pax-abs', 'kd-avg-pax-pct', ft25 > 0 ? fp25/ft25 : 0, ft26 > 0 ? fp26/ft26 : 0, v => v.toFixed(1));
    },

    getChartColors() { return _chartColors(); },

    updateCharts() {
        const self = this;
        const fc = this.mergedGuides.filter(m => this.activeCity === 'all' || m.city === this.activeCity);
        const colors = this.getChartColors();
        const rangeLabel = getRangeLabel();

        const cityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
        const cityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
        const paidCityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
        const paidCityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };

        CITIES.forEach(city => {
            if (this.activeCity !== 'all' && this.activeCity !== city) return;
            const st25 = cityStats25[city]?.[this.activeLang];
            const st26 = cityStats26[city]?.[this.activeLang];
            const s25 = st25 ? filteredStats(st25, this.activeMonths) : null;
            const s26 = st26 ? filteredStats(st26, this.activeMonths) : null;
            if (s25) { cityData25[city] = s25.freePax; paidCityData25[city] = s25.paidTours; }
            if (s26) { cityData26[city] = s26.freePax; paidCityData26[city] = s26.paidTours; }
        });

        const cityDeltaPlugin = {
            id: 'cityDelta',
            afterDraw(chart) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const ds0 = chart.data.datasets[0].data;
                const ds1 = chart.data.datasets[1].data;
                const chartColors = self.getChartColors();
                ctx.save();
                chart.data.labels.forEach((_, i) => {
                    const v25 = ds0[i] || 0, v26 = ds1[i] || 0;
                    const d = v26 - v25;
                    const pct = v25 > 0 ? ((d/v25)*100).toFixed(0) : (v26 > 0 ? '∞' : '0');
                    const sign = d > 0 ? '+' : '';
                    const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '=';
                    const color = d > 0 ? '#1D9E75' : d < 0 ? '#D4545A' : '#999';
                    const x = xAxis.getPixelForValue(i);
                    const y = xAxis.bottom + 12;

                    ctx.fillStyle = chartColors.text3;
                    ctx.font = "500 10px 'Montserrat',sans-serif";
                    ctx.textAlign = 'center';
                    ctx.fillText(`${fmtN(v25)} / ${fmtN(v26)}`, x, y);

                    ctx.fillStyle = color;
                    ctx.font = "bold 10px 'Montserrat',sans-serif";
                    ctx.fillText(`${arrow} ${fmtN(Math.abs(d))} (${sign}${pct}%)`, x, y + 13);
                });
                ctx.restore();
            }
        };

        try {
            if (this.cityChartInstance) this.cityChartInstance.destroy();
            const cityCtx = this._el('cityChart').getContext('2d');
            this.cityChartInstance = createFreePaxCityChart(cityCtx, CITIES, cityData25, cityData26, cityDeltaPlugin, colors, rangeLabel);
        } catch(e) { console.error("City Chart Error:", e); }

        try {
            if (this.paidCityChartInstance) this.paidCityChartInstance.destroy();
            const paidCityCtx = this._el('paidCityChart').getContext('2d');
            this.paidCityChartInstance = createPaidCityChart(paidCityCtx, CITIES, paidCityData25, paidCityData26, cityDeltaPlugin, colors, rangeLabel);
        } catch(e) { console.error("Paid City Chart Error:", e); }

        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : getCutoffMonth();
        const selectedMonths = Array.from({length: maxMonth}, (_, i) => i + 1);
        const months = selectedMonths.map(m => MONTH_NAMES[m]);

        const effectiveLabel = maxMonth === 1 ? MONTH_NAMES[1] : `${MONTH_NAMES[1]}–${MONTH_NAMES[maxMonth]}`;
        document.querySelectorAll('#page-cmp .ytd-range-label').forEach(el => el.textContent = effectiveLabel);
        const monthData25 = [], monthData26 = [];
        const paidMonthData25 = [], paidMonthData26 = [];

        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(getGlobalDate().split('-')[2]);

        selectedMonths.forEach(i => {
            let fd25 = 0, fd26 = 0, pd25 = 0, pd26 = 0;

            if (i < cutoffMonth) {
                fc.forEach(m => {
                    const mo25 = m.g25?.stats[this.activeLang]?.byMonth?.[String(i)];
                    if (mo25) { fd25 += mo25.free.pax || 0; pd25 += mo25.paid.tours || 0; }
                    const mo26 = m.g26?.stats[this.activeLang]?.byMonth?.[String(i)];
                    if (mo26) { fd26 += mo26.free.pax || 0; pd26 += mo26.paid.tours || 0; }
                });
            } else if (i === cutoffMonth) {
                for (let d = 1; d <= cutoffDay; d++) {
                    const key = `${i}-${d}`;
                    fc.forEach(m => {
                        const bd25 = m.g25?.stats[this.activeLang]?.byDay?.[key];
                        if (bd25) { fd25 += bd25.free.pax || 0; pd25 += bd25.paid.tours || 0; }
                        const bd26 = m.g26?.stats[this.activeLang]?.byDay?.[key];
                        if (bd26) { fd26 += bd26.free.pax || 0; pd26 += bd26.paid.tours || 0; }
                    });
                }
            }

            monthData25.push(fd25);
            monthData26.push(fd26);
            paidMonthData25.push(pd25);
            paidMonthData26.push(pd26);
        });

        const cumulative = (arr) => arr.reduce((acc, val, i) => { acc[i] = (acc[i - 1] || 0) + val; return acc; }, []);
        const cumMonthData25 = cumulative(monthData25);
        const cumMonthData26 = cumulative(monthData26);
        const cumPaidMonthData25 = cumulative(paidMonthData25);
        const cumPaidMonthData26 = cumulative(paidMonthData26);

        const deltaOverlay = {
            id: 'deltaOverlay',
            afterDraw(chart) {
                const ctx = chart.ctx;
                const { right, top } = chart.chartArea;
                const ds0 = chart.data.datasets[0].data;
                const ds1 = chart.data.datasets[1].data;
                const last0 = ds0[ds0.length - 1] || 0;
                const last1 = ds1[ds1.length - 1] || 0;
                if (last0 === 0 && last1 === 0) return;
                const d = last1 - last0;
                const pct = last0 > 0 ? ((d/last0)*100).toFixed(0) : (last1 > 0 ? '∞' : '0');
                const sign = d >= 0 ? '+' : '';
                const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '=';
                const color = d > 0 ? '#1D9E75' : d < 0 ? '#D4545A' : '#999';
                ctx.save();
                ctx.fillStyle = color;
                ctx.font = "bold 11px 'Montserrat',sans-serif";
                ctx.textAlign = 'right';
                ctx.fillText(`${arrow} ${fmtN(Math.abs(d))} (${sign}${pct}%)`, right - 8, top + 18);
                ctx.restore();
            }
        };

        const monthDeltaPlugin = {
            id: 'monthDelta',
            afterDraw(chart) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const ds0 = chart.data.datasets[0].data;
                const ds1 = chart.data.datasets[1].data;
                const chartColors = self.getChartColors();
                ctx.save();
                chart.data.labels.forEach((_, i) => {
                    const v25 = ds0[i] || 0, v26 = ds1[i] || 0;
                    const d = v26 - v25;
                    const pct = v25 > 0 ? ((d/v25)*100).toFixed(0) : (v26 > 0 ? '∞' : '0');
                    const sign = d > 0 ? '+' : '';
                    const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '=';
                    const color = d > 0 ? '#1D9E75' : d < 0 ? '#D4545A' : '#999';
                    const x = xAxis.getPixelForValue(i);
                    const y = xAxis.bottom + 12;

                    ctx.fillStyle = chartColors.text3;
                    ctx.font = "500 10px 'Montserrat',sans-serif";
                    ctx.textAlign = 'center';
                    ctx.fillText(`${fmtN(v25)} / ${fmtN(v26)}`, x, y);

                    ctx.fillStyle = color;
                    ctx.font = "bold 10px 'Montserrat',sans-serif";
                    ctx.fillText(`${arrow} ${fmtN(Math.abs(d))} (${sign}${pct}%)`, x, y + 13);
                });
                ctx.restore();
            }
        };

        try {
            if (this.monthlyChartInstance) this.monthlyChartInstance.destroy();
            const monthCtx = this._el('monthlyChart').getContext('2d');
            this.monthlyChartInstance = createMonthlyFreePaxChart(monthCtx, months, cumMonthData25, cumMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel);
        } catch(e) { console.error("Monthly Chart Error:", e); }

        try {
            if (this.paidChartInstance) this.paidChartInstance.destroy();
            const paidCtx = this._el('paidChart').getContext('2d');
            this.paidChartInstance = createMonthlyPaidChart(paidCtx, months, cumPaidMonthData25, cumPaidMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel);
        } catch(e) { console.error("Paid Chart Error:", e); }

        try {
            const cutoffDay = parseInt(getGlobalDate().split('-')[2]);
            const cityMonthly25 = {};
            const cityMonthly26 = {};
            CITIES.forEach(c => { cityMonthly25[c] = []; cityMonthly26[c] = []; });

            selectedMonths.forEach(i => {
                CITIES.forEach(city => {
                    let pax25 = 0, pax26 = 0;
                    fc.filter(m => m.city === city).forEach(m => {
                        if (i < cutoffMonth) {
                            const b25 = m.g25 && m.g25.stats[this.activeLang].byMonth[String(i)];
                            const b26 = m.g26 && m.g26.stats[this.activeLang].byMonth[String(i)];
                            if (b25) pax25 += (b25.free?.pax || 0);
                            if (b26) pax26 += (b26.free?.pax || 0);
                        } else {
                            for (let d = 1; d <= cutoffDay; d++) {
                                const key = `${i}-${d}`;
                                const d25 = m.g25 && m.g25.stats[this.activeLang].byDay?.[key];
                                const d26 = m.g26 && m.g26.stats[this.activeLang].byDay?.[key];
                                if (d25) pax25 += (d25.free?.pax || 0);
                                if (d26) pax26 += (d26.free?.pax || 0);
                            }
                        }
                    });
                    cityMonthly25[city].push(pax25);
                    cityMonthly26[city].push(pax26);
                });
            });

            const cityColors = { Zagreb:'#8FA8BC', Dubrovnik:'#C49A8A', Split:'#9BB09B', Zadar:'#C4B48A' };
            const datasets = [];
            CITIES.forEach(city => {
                const col = cityColors[city];
                datasets.push({
                    label: `${city} 2025`,
                    data: cumulative(cityMonthly25[city]),
                    borderColor: col + '80', backgroundColor: 'transparent',
                    borderDash: [5, 5], borderWidth: 1.5,
                    tension: 0.3, fill: false, pointRadius: 3,
                    pointBackgroundColor: col + '80'
                });
                datasets.push({
                    label: city,
                    data: cumulative(cityMonthly26[city]),
                    borderColor: col, backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3, fill: false, pointRadius: 3,
                    pointBackgroundColor: col
                });
            });

            const badgesEl = document.getElementById('city-monthly-badges-cmp');
            if (badgesEl) {
                badgesEl.innerHTML = CITIES.map(city => {
                    const last25 = cumulative(cityMonthly25[city]).slice(-1)[0] || 0;
                    const last26 = cumulative(cityMonthly26[city]).slice(-1)[0] || 0;
                    const diff = last26 - last25;
                    const pct = last25 > 0 ? Math.round((diff / last25) * 100) : (last26 > 0 ? Infinity : 0);
                    const cls  = diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'neu';
                    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '=';
                    const sign  = diff >= 0 ? '+' : '';
                    const pctStr = pct === Infinity ? '+∞%' : `${sign}${pct}%`;
                    const col = cityColors[city];
                    return `<span class="city-monthly-badge" style="border-color:${col}">` +
                        `<span class="cmb-name" style="color:${col}">${city}</span>` +
                        `<span class="cmb-delta ${cls}">${arrow} ${pctStr}</span>` +
                        `</span>`;
                }).join('');
            }

            if (this.cityMonthlyChartInstance) this.cityMonthlyChartInstance.destroy();
            const cmCtx = this._el('cityMonthlyChart').getContext('2d');
            this.cityMonthlyChartInstance = createCityMonthlyChart(cmCtx, months, datasets, colors);
        } catch(e) { console.error("City Monthly Chart Error:", e); }

        try {
            const avgFree25 = [], avgFree26 = [];
            selectedMonths.forEach(i => {
                let pax25 = 0, t25 = 0, pax26 = 0, t26 = 0;
                if (i < cutoffMonth) {
                    fc.forEach(m => {
                        const b25 = m.g25?.stats[this.activeLang]?.byMonth?.[String(i)];
                        if (b25) { pax25 += b25.free.pax || 0; t25 += b25.free.tours || 0; }
                        const b26 = m.g26?.stats[this.activeLang]?.byMonth?.[String(i)];
                        if (b26) { pax26 += b26.free.pax || 0; t26 += b26.free.tours || 0; }
                    });
                } else if (i === cutoffMonth) {
                    for (let d = 1; d <= cutoffDay; d++) {
                        const key = `${i}-${d}`;
                        fc.forEach(m => {
                            const d25 = m.g25?.stats[this.activeLang]?.byDay?.[key];
                            if (d25) { pax25 += d25.free.pax || 0; t25 += d25.free.tours || 0; }
                            const d26 = m.g26?.stats[this.activeLang]?.byDay?.[key];
                            if (d26) { pax26 += d26.free.pax || 0; t26 += d26.free.tours || 0; }
                        });
                    }
                }
                avgFree25.push(t25 > 0 ? +(pax25 / t25).toFixed(1) : null);
                avgFree26.push(t26 > 0 ? +(pax26 / t26).toFixed(1) : null);
            });

            if (this.avgFreePaxCmpChartInstance) this.avgFreePaxCmpChartInstance.destroy();
            const afCtx = document.getElementById('avgFreePaxCmpChart-cmp')?.getContext('2d');
            if (afCtx) {
                this.avgFreePaxCmpChartInstance = createAvgFreePaxChart(afCtx, months, avgFree25, avgFree26, colors, rangeLabel);
            }
        } catch(e) { console.error('Avg free PAX cmp chart error:', e); }

        this.updatePaidTypeCharts();

        // Update theme colors on all chart instances
        updateChartColors([
            this.cityChartInstance,
            this.paidCityChartInstance,
            this.monthlyChartInstance,
            this.paidChartInstance,
            this.cityMonthlyChartInstance,
            this.avgFreePaxCmpChartInstance,
            this.privatePaidChartInstance,
            this.sharedPaidChartInstance,
            this.warAvgChartInstance,
        ]);
    },

    renderMonthlyTable() {
        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(getGlobalDate().split('-')[2]);
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

        const months = this.activeMonths.length > 0
            ? this.activeMonths
            : Array.from({length: cutoffMonth}, (_, i) => i + 1);

        const getCityPax = (st, m) => {
            if (!st) return 0;
            if (m < cutoffMonth) {
                return st.byMonth?.[String(m)]?.free?.pax || 0;
            } else if (m === cutoffMonth) {
                if (st.byDay) {
                    let tot = 0;
                    for (let d = 1; d <= cutoffDay; d++) {
                        const dy = st.byDay[`${m}-${d}`];
                        if (dy) tot += dy.free?.pax || 0;
                    }
                    return tot;
                }
                return st.byMonth?.[String(m)]?.free?.pax || 0;
            }
            return 0;
        };

        const data = months.map(m => {
            const isPartial = m === cutoffMonth && this.activeMonths.length === 0;
            const row = { m, isPartial };
            CITIES.forEach(city => {
                const p25 = getCityPax(cityStats25[city]?.[this.activeLang], m);
                const p26 = getCityPax(cityStats26[city]?.[this.activeLang], m);
                row[city] = { p25, p26 };
            });
            return row;
        });

        const totals = {};
        CITIES.forEach(city => {
            totals[city] = data.reduce((acc, r) => ({ p25: acc.p25 + r[city].p25, p26: acc.p26 + r[city].p26 }), { p25: 0, p26: 0 });
        });

        const fmtDelta = (p25, p26) => {
            const diff = p26 - p25;
            if (p25 === 0 && p26 === 0) return { d: '<span class="neu">—</span>', p: '<span class="neu">—</span>' };
            const cls  = diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'neu';
            const sign = diff > 0 ? '+' : '';
            const pct  = p25 > 0 ? Math.round((diff / p25) * 100) : (diff > 0 ? '∞' : 0);
            return {
                d: `<span class="${cls}">${sign}${fmtN(diff)}</span>`,
                p: `<span class="${cls}">${sign}${pct}%</span>`,
            };
        };

        const cityHeaders = CITIES.map(c =>
            `<th colspan="4" class="mpax-city-head ${CITY_CLS[c]}">${c}</th>`
        ).join('');

        const subHeaders = CITIES.map(() =>
            `<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">±</th><th class="mpax-sub-head">±%</th>`
        ).join('');

        const bodyRows = data.map(row => {
            const cells = CITIES.map(city => {
                const { p25, p26 } = row[city];
                const { d, p } = fmtDelta(p25, p26);
                return `<td>${p25 ? fmtN(p25) : '—'}</td><td>${p26 ? fmtN(p26) : '—'}</td><td>${d}</td><td>${p}</td>`;
            }).join('');
            const rowTotal25 = CITIES.reduce((s, c) => s + row[c].p25, 0);
            const rowTotal26 = CITIES.reduce((s, c) => s + row[c].p26, 0);
            const { d: td, p: tp } = fmtDelta(rowTotal25, rowTotal26);
            return `<tr><td class="mpax-month">${MONTH_NAMES[row.m]}${row.isPartial ? '<sup>*</sup>' : ''}</td>${cells}<td><strong>${rowTotal25 ? fmtN(rowTotal25) : '—'}</strong></td><td><strong>${rowTotal26 ? fmtN(rowTotal26) : '—'}</strong></td><td>${td}</td><td>${tp}</td></tr>`;
        }).join('');

        const totalCells = CITIES.map(city => {
            const { p25, p26 } = totals[city];
            const { d, p } = fmtDelta(p25, p26);
            return `<td>${fmtN(p25)}</td><td>${fmtN(p26)}</td><td>${d}</td><td>${p}</td>`;
        }).join('');
        const grandTotal25 = CITIES.reduce((s, c) => s + totals[c].p25, 0);
        const grandTotal26 = CITIES.reduce((s, c) => s + totals[c].p26, 0);
        const { d: gtd, p: gtp } = fmtDelta(grandTotal25, grandTotal26);

        const hasPartial = data.some(r => r.isPartial);

        const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr('charts.freePaxByMonthAndCity')}>${t('charts.freePaxByMonthAndCity')} — <span class="ytd-range-label">${getRangeLabel()}</span> 2025 vs. 2026</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead>
                    <tr><th class="mpax-month-head" rowspan="2">${t('labels.mo')}</th>${cityHeaders}<th colspan="4" class="mpax-city-head">${t('labels.total')}</th></tr>
                    <tr>${subHeaders}<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">±</th><th class="mpax-sub-head">±%</th></tr>
                </thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t('labels.total')}</td>${totalCells}<td><strong>${fmtN(grandTotal25)}</strong></td><td><strong>${fmtN(grandTotal26)}</strong></td><td>${gtd}</td><td>${gtp}</td></tr>
                </tbody>
            </table>
            </div>
            ${hasPartial ? `<div class="mpax-note">* ${t('labels.partial')} — ${t('labels.dataThrough')} ${getGlobalDate()}</div>` : ''}
        </div>`;

        const el = document.getElementById('monthly-pax-table-cmp');
        if (el) el.innerHTML = html;
    },

    filterPrivateCity(city, btn) {
        this.activePrivateCity = city;
        this._setActivePill('private-city-pills-cmp', btn);
        this.updatePaidTypeCharts();
    },

    filterPrivateType(type, btn) {
        this.activePrivateType = type;
        this._setActivePill('private-type-pills-cmp', btn);
        this.updatePaidTypeCharts();
    },

    filterSharedCity(city, btn) {
        this.activeSharedCity = city;
        this._setActivePill('shared-city-pills-cmp', btn);
        this.updatePaidTypeCharts();
    },

    filterSharedType(type, btn) {
        this.activeSharedType = type;
        this._setActivePill('shared-type-pills-cmp', btn);
        this.updatePaidTypeCharts();
    },

    filterAvgType(type, btn) {
        this.activeAvgType = type;
        this._setActivePill('avg-type-pills-cmp', btn);
        this.updatePaidTypeCharts();
    },

    _setActivePill(groupId, activeBtn) {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    },

    _getTypeMonthData(city, types, primaryKey, year) {
        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(getGlobalDate().split('-')[2]);
        const maxMonth    = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
        const fc = this.mergedGuides.filter(m => city === 'all' || m.city === city);

        return Array.from({length: maxMonth}, (_, i) => i + 1).map(mo => {
            let primary = 0, secondary = 0;
            const secondaryKey = primaryKey === 'tours' ? 'pax' : 'tours';

            if (mo < cutoffMonth) {
                fc.forEach(m => {
                    const g = year === 25 ? m.g25 : m.g26;
                    if (!g) return;
                    const bmt = g.stats[this.activeLang]?.byMonthType?.[String(mo)];
                    if (!bmt) return;
                    types.forEach(tp => {
                        const td = bmt[tp];
                        if (td) { primary += td[primaryKey] || 0; secondary += td[secondaryKey] || 0; }
                    });
                });
            } else if (mo === cutoffMonth) {
                for (let d = 1; d <= cutoffDay; d++) {
                    const key = `${mo}-${d}`;
                    fc.forEach(m => {
                        const g = year === 25 ? m.g25 : m.g26;
                        if (!g) return;
                        const bdt = g.stats[this.activeLang]?.byDayType?.[key];
                        if (!bdt) return;
                        types.forEach(tp => {
                            const td = bdt[tp];
                            if (td) { primary += td[primaryKey] || 0; secondary += td[secondaryKey] || 0; }
                        });
                    });
                }
            }
            return { primary, secondary };
        });
    },

    renderPaidTypeTable(containerId, city, typeFilter, allTypes, primaryMetric) {
        const cutoffMonth = getCutoffMonth();
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

        const types = typeFilter === 'all' ? allTypes : [typeFilter];
        const d25 = this._getTypeMonthData(city, types, 'tours', 25);
        const d26 = this._getTypeMonthData(city, types, 'tours', 26);
        const months = Array.from({length: maxMonth}, (_, i) => i + 1);

        const fmtDelta = (v25, v26, isAvg) => {
            const diff = v26 - v25;
            if (v25 === 0 && v26 === 0) return { d: '<span class="neu">—</span>', p: '<span class="neu">—</span>' };
            const cls  = diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'neu';
            const sign = diff > 0 ? '+' : '';
            const pct  = v25 > 0 ? Math.round((diff / v25) * 100) : (diff > 0 ? '∞' : 0);
            return isAvg
                ? { d: `<span class="${cls}">${sign}${diff.toFixed(1)}</span>`, p: `<span class="${cls}">${sign}${pct}%</span>` }
                : { d: `<span class="${cls}">${sign}${fmtN(diff)}</span>`,       p: `<span class="${cls}">${sign}${pct}%</span>` };
        };

        const rows = months.map(m => {
            const isPartial = m === cutoffMonth && this.activeMonths.length === 0;
            const t25 = d25[m - 1].primary,  t26 = d26[m - 1].primary;
            const p25 = d25[m - 1].secondary, p26 = d26[m - 1].secondary;
            return { m, isPartial, t25, t26, p25, p26,
                avg25: t25 > 0 ? p25 / t25 : 0,
                avg26: t26 > 0 ? p26 / t26 : 0 };
        });

        const totT25 = rows.reduce((s, r) => s + r.t25, 0);
        const totT26 = rows.reduce((s, r) => s + r.t26, 0);
        const totP25 = rows.reduce((s, r) => s + r.p25, 0);
        const totP26 = rows.reduce((s, r) => s + r.p26, 0);
        const totAvg25 = totT25 > 0 ? totP25 / totT25 : 0;
        const totAvg26 = totT26 > 0 ? totP26 / totT26 : 0;

        const toursPrimary = primaryMetric === 'tours';
        const paxPrimary   = primaryMetric === 'pax';

        const groupHeaders = [
            `<th colspan="4" class="mpax-metric-head${toursPrimary ? ' mpax-metric-primary' : ''}">${t('table.tours')}</th>`,
            `<th colspan="4" class="mpax-metric-head${paxPrimary   ? ' mpax-metric-primary' : ''}">${t('table.pax')}</th>`,
            `<th colspan="4" class="mpax-metric-head">${t('labels.avgPaxPerTour')}</th>`,
        ].join('');

        const subRow = `<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">±</th><th class="mpax-sub-head">±%</th>`;
        const subHeaders = subRow + subRow + subRow;

        const makeRow = (label, t25, t26, p25, p26, avg25, avg26, isPartial, isTotal) => {
            const td = fmtDelta(t25, t26, false);
            const pd = fmtDelta(p25, p26, false);
            const ad = fmtDelta(avg25, avg26, true);
            const cls = isTotal ? ' class="mpax-total"' : '';
            const mLabel = isPartial ? `${label}<sup>*</sup>` : label;
            return `<tr${cls}>
                <td class="mpax-month">${mLabel}</td>
                <td>${t25 || '—'}</td><td>${t26 || '—'}</td><td>${td.d}</td><td>${td.p}</td>
                <td>${p25 || '—'}</td><td>${p26 || '—'}</td><td>${pd.d}</td><td>${pd.p}</td>
                <td>${avg25 > 0 ? avg25.toFixed(1) : '—'}</td><td>${avg26 > 0 ? avg26.toFixed(1) : '—'}</td><td>${ad.d}</td><td>${ad.p}</td>
            </tr>`;
        };

        const bodyRows = rows.map(r => makeRow(MONTH_NAMES[r.m], r.t25, r.t26, r.p25, r.p26, r.avg25, r.avg26, r.isPartial, false)).join('');
        const totalRow = makeRow(t('labels.total'), totT25, totT26, totP25, totP26, totAvg25, totAvg26, false, true);
        const hasPartial = rows.some(r => r.isPartial);

        const html = `<div class="mpax-wrap" style="margin-top:16px">
            <table class="mpax-table">
                <thead>
                    <tr><th class="mpax-month-head" rowspan="2">${t('labels.mo')}</th>${groupHeaders}</tr>
                    <tr>${subHeaders}</tr>
                </thead>
                <tbody>${bodyRows}${totalRow}</tbody>
            </table>
            ${hasPartial ? `<div class="mpax-note">* ${t('labels.partial')} — ${t('labels.dataThrough')} ${getGlobalDate()}</div>` : ''}
        </div>`;

        const el = document.getElementById(containerId);
        if (el) el.innerHTML = html;
    },

    updatePaidTypeCharts() {
        const self = this;
        const colors   = this.getChartColors();
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const cutoffMonth = getCutoffMonth();
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
        const months   = Array.from({length: maxMonth}, (_, i) => MONTH_NAMES[i + 1]);

        const rangeLabel = getRangeLabel();
        const cutoffDay  = parseInt(getGlobalDate().split('-')[2]);

        const secondaryLabelPlugin = (secondaryKey) => ({
            id: 'secondaryLabel',
            afterDraw(chart) {
                const ctx = chart.ctx;
                const meta0 = chart.getDatasetMeta(0);
                const meta1 = chart.getDatasetMeta(1);
                ctx.save();
                ctx.font = "500 9px 'Montserrat',sans-serif";
                ctx.textAlign = 'center';
                const secData25 = chart.data.datasets[0]._secondaryData || [];
                const secData26 = chart.data.datasets[1]._secondaryData || [];
                [meta0.data, meta1.data].forEach((bars, di) => {
                    const secArr = di === 0 ? secData25 : secData26;
                    bars.forEach((bar, i) => {
                        const val = secArr[i] || 0;
                        if (val === 0) return;
                        const label = secondaryKey === 'pax' ? `${val}p` : `${val}t`;
                        ctx.fillStyle = self.getChartColors().text3;
                        ctx.fillText(label, bar.x, bar.y - 4);
                    });
                });
                ctx.restore();
            }
        });

        const buildTypeChart = (canvasId, instanceKey, city, typeFilter, allTypes, primaryKey) => {
            const types = typeFilter === 'all' ? allTypes : [typeFilter];
            const d25 = this._getTypeMonthData(city, types, primaryKey, 25);
            const d26 = this._getTypeMonthData(city, types, primaryKey, 26);
            const secondaryKey = primaryKey === 'tours' ? 'pax' : 'tours';

            const ds25 = {
                label: `${rangeLabel} 2025`,
                data: d25.map(d => d.primary),
                _secondaryData: d25.map(d => d.secondary),
                backgroundColor: colors.y25 + '99',
                borderRadius: 4,
            };
            const ds26 = {
                label: `${rangeLabel} 2026`,
                data: d26.map(d => d.primary),
                _secondaryData: d26.map(d => d.secondary),
                backgroundColor: colors.y26,
                borderRadius: 4,
            };

            const yLabel = primaryKey === 'tours' ? 'Tours' : 'PAX';

            try {
                if (this[instanceKey]) this[instanceKey].destroy();
                const ctx = document.getElementById(canvasId)?.getContext('2d');
                if (!ctx) return;
                this[instanceKey] = createPaidTypeChart(ctx, months, ds25, ds26, colors, secondaryLabelPlugin(secondaryKey), yLabel);
            } catch(e) { console.error('Type chart error:', e); }
        };

        buildTypeChart('privatePaidChart-cmp', 'privatePaidChartInstance', this.activePrivateCity, this.activePrivateType, this.PRIVATE_TYPES, 'tours');
        this.renderPaidTypeTable('private-type-table-cmp', this.activePrivateCity, this.activePrivateType, this.PRIVATE_TYPES, 'tours');

        buildTypeChart('sharedPaidChart-cmp', 'sharedPaidChartInstance', this.activeSharedCity, this.activeSharedType, this.SHARED_TYPES, 'tours');
        this.renderPaidTypeTable('shared-type-table-cmp', this.activeSharedCity, this.activeSharedType, this.SHARED_TYPES, 'pax');

        const fc = this.mergedGuides.filter(m => this.activeCity === 'all' || m.city === this.activeCity);
        const typesToShow = this.activeAvgType === 'all' ? this.ALL_PAID_TYPES : [this.activeAvgType];

        const getTypeAvg = (year, types) => Array.from({length: maxMonth}, (_, i) => i + 1).map(mo => {
            let pax = 0, tours = 0;
            if (mo < cutoffMonth) {
                fc.forEach(m => {
                    const g = year === 25 ? m.g25 : m.g26;
                    const bmt = g?.stats[this.activeLang]?.byMonthType?.[String(mo)];
                    if (!bmt) return;
                    types.forEach(tp => { const d = bmt[tp]; if (d) { pax += d.pax || 0; tours += d.tours || 0; } });
                });
            } else if (mo === cutoffMonth) {
                for (let d = 1; d <= cutoffDay; d++) {
                    const key = `${mo}-${d}`;
                    fc.forEach(m => {
                        const g = year === 25 ? m.g25 : m.g26;
                        const bdt = g?.stats[this.activeLang]?.byDayType?.[key];
                        if (!bdt) return;
                        types.forEach(tp => { const td = bdt[tp]; if (td) { pax += td.pax || 0; tours += td.tours || 0; } });
                    });
                }
            }
            return tours > 0 ? +(pax / tours).toFixed(1) : null;
        });

        try {
            if (this.warAvgChartInstance) this.warAvgChartInstance.destroy();
            const warCtx = document.getElementById('warAvgChart-cmp')?.getContext('2d');
            if (warCtx) {
                this.warAvgChartInstance = createWarAvgChart(warCtx, months, getTypeAvg(25, typesToShow), getTypeAvg(26, typesToShow), colors, rangeLabel);
            }
        } catch(e) { console.error('Avg type chart error:', e); }
    },

    filterCity(city) {
        this.activeCity = city;
        document.querySelectorAll('#page-cmp .city-filter-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.city === city));
        this.renderAll();
    },

    filterLang(lang) {
        this.activeLang = lang;
        this.mergedGuides = this.buildMerged();
        this.renderAll();
    },

    filterMonth(m) {
        this.activeMonths = m === 'all' ? [] : [parseInt(m)];
        this.mergedGuides = this.buildMerged();
        this.renderAll();
    },

    _buildHeader() {
        return `        <div class="header">
            <div class="header-left">
                <h1>${t('sections.guideComparison')}</h1>
                <p><span class="ytd-range-label">Jan–Jun</span> 2025 vs. 2026 &middot; ${t('sections.productionByGuide')}</p>
            </div>
            <div class="header-right">
                <div id="date-pov-cmp" class="mb-6"></div>
                <div class="header-badge">${t('sections.comparisonYtd')}</div>
            </div>
        </div>`;
    },

    _buildKpisAndFilters() {
        return `        <div class="main">
            <div class="filter-bar">
                <div class="city-pill-group">
                    ${['all', ...CITIES].map(c => {
                        const col = getCityColor(c);
                        const label = c === 'all' ? t('labels.all') : c;
                        const active = this.activeCity === c ? ' active' : '';
                        const style = col ? ` style="--city-col:${col}"` : '';
                        return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="PageCmp.filterCity('${c}')">${label}</button>`;
                    }).join('')}
                </div>
                <div class="filter-dropdowns">
                    <select class="filter-select" id="lang-filter-cmp" onchange="PageCmp.filterLang(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        <option value="eng">🇬🇧 ENG</option>
                        <option value="esp">🇪🇸 ESP</option>
                        <option value="fra">🇫🇷 FRA</option>
                    </select>
                    <select class="filter-select" id="month-filter-cmp" onchange="PageCmp.filterMonth(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.freeToursPaxCountYtd')}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-free-abs-cmp">—</span>
                        <span class="kpi-delta-pct" id="kd-free-pct-cmp">—</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-free25-cmp">—</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-free26-cmp">—</div>
                        </div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.avgPaxPerFreeTour')}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-avg-pax-abs-cmp">—</span>
                        <span class="kpi-delta-pct" id="kd-avg-pax-pct-cmp">—</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-avg-pax25-cmp">—</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-avg-pax26-cmp">—</div>
                        </div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.totalFreeTours')}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-free-tours-abs-cmp">—</span>
                        <span class="kpi-delta-pct" id="kd-free-tours-pct-cmp">—</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-free-tours25-cmp">—</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-free-tours26-cmp">—</div>
                        </div>
                    </div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t('labels.paidToursCountYtd')}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-paid-abs-cmp">—</span>
                        <span class="kpi-delta-pct" id="kd-paid-pct-cmp">—</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-paid25-cmp">—</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-paid26-cmp">—</div>
                        </div>
                    </div>
                </div>
            </div>

            `;
    },

    _buildFreeTours() {
        return `            <!-- ── FREE TOURS SECTION ──────────────────────────── -->
            <div class="section-divider" onclick="toggleSection('free-section-body')">
                <span>${t('sections.freeTours')}</span>
                <span class="section-chevron">▾</span>
            </div>
            <div id="free-section-body" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.freePaxByCity')}>${t('charts.freePaxByCity')}</div>
                        <div class="chart-container">
                            <canvas id="cityChart-cmp"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.avgFreePaxCmp')}>${t('charts.avgFreePaxCmp')} — <span class="ytd-range-label">Jan–Jun</span> 2025 vs. 2026</div>
                        <div class="chart-container">
                            <canvas id="avgFreePaxCmpChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.cumulativeFreePax')}>${t('charts.cumulativeFreePax')} (<span class="ytd-range-label">Jan–Jun</span>)</div>
                        <div class="chart-container">
                            <canvas id="monthlyChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.cityMonthlyCumulative')}>${t('charts.cityMonthlyCumulative')} (<span class="ytd-range-label">Jan–Jun</span>)</div>
                        <div id="city-monthly-badges-cmp" class="city-monthly-badges"></div>
                        <div class="chart-container">
                            <canvas id="cityMonthlyChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div id="monthly-pax-table-cmp"></div>
                </div>
            </div>

`;
    },

    _buildPaidTours() {
        return `            <!-- ── PAID TOURS SECTION ──────────────────────────── -->
            <div class="section-divider" onclick="toggleSection('paid-section-body')">
                <span>${t('sections.paidTours')}</span>
                <span class="section-chevron">▾</span>
            </div>
            <div id="paid-section-body" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.paidToursByCity')}>${t('charts.paidToursByCity')}</div>
                        <div class="chart-container">
                            <canvas id="paidCityChart-cmp"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.cumulativePaidTours')}>${t('charts.cumulativePaidTours')} (<span class="ytd-range-label">Jan–Jun</span>)</div>
                        <div class="chart-container">
                            <canvas id="paidChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr('charts.privatePaidTours')}>${t('charts.privatePaidTours')} — <span class="ytd-range-label">Jan–Jun</span> 2025 vs. 2026</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.city')}</span>
                                <div id="private-city-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterPrivateCity('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Zagreb',this)">Zagreb</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Dubrovnik',this)">Dubrovnik</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Split',this)">Split</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Zadar',this)">Zadar</button>
                                </div>
                            </div>
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="private-type-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterPrivateType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('best',this)">best</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('old',this)">old</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('big',this)">big</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="privatePaidChart-cmp"></canvas>
                        </div>
                        <div id="private-type-table-cmp"></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr('charts.avgPaxByType')}>${t('charts.avgPaxByType')} — <span class="ytd-range-label">Jan–Jun</span> 2025 vs. 2026</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="avg-type-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterAvgType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('war',this)">war</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('food',this)">food</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('best',this)">best</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('old',this)">old</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('big',this)">big</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="warAvgChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr('charts.sharedPaidTours')}>${t('charts.sharedPaidTours')} — <span class="ytd-range-label">Jan–Jun</span> 2025 vs. 2026</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.city')}</span>
                                <div id="shared-city-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterSharedCity('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Zagreb',this)">Zagreb</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Dubrovnik',this)">Dubrovnik</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Split',this)">Split</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Zadar',this)">Zadar</button>
                                </div>
                            </div>
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="shared-type-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterSharedType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="PageCmp.filterSharedType('war',this)">war</button>
                                    <button class="pill" onclick="PageCmp.filterSharedType('food',this)">food</button>
                                    <button class="pill" onclick="PageCmp.filterSharedType('best',this)">best</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="sharedPaidChart-cmp"></canvas>
                        </div>
                        <div id="shared-type-table-cmp"></div>
                    </div>
                </div>
            </div>

`;
    },

    _buildGuides() {
        return `            <div class="section-divider" onclick="toggleSection('guides-body-cmp')">
                <span>${t('sections.guides')}</span>
                <span class="section-chevron">▾</span>
            </div>
            <div id="guides-body-cmp" class="section-body">
                <div id="guide-sections-cmp"></div>
            </div>
        </div>`;
    },

    _destroyCharts() {
        [this.cityChartInstance, this.paidCityChartInstance, this.monthlyChartInstance, this.paidChartInstance,
         this.cityMonthlyChartInstance, this.privatePaidChartInstance, this.sharedPaidChartInstance,
         this.warAvgChartInstance, this.avgFreePaxCmpChartInstance].forEach(chart => {
            if (chart) try { chart.destroy(); } catch(e) {}
        });
        this.cityChartInstance = null;
        this.paidCityChartInstance = null;
        this.monthlyChartInstance = null;
        this.paidChartInstance = null;
        this.cityMonthlyChartInstance = null;
        this.privatePaidChartInstance = null;
        this.sharedPaidChartInstance = null;
        this.warAvgChartInstance = null;
        this.avgFreePaxCmpChartInstance = null;
    },

    rebuildStructure() {
        this._destroyCharts();
        document.getElementById('page-cmp').innerHTML =
            this._buildHeader() +
            this._buildKpisAndFilters() +
            this._buildFreeTours() +
            this._buildPaidTours() +
            this._buildGuides();

        const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const datePov = this._el('date-pov');
        if (datePov) datePov.textContent = now;
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.rebuildStructure();
        this.mergedGuides = this.buildMerged();
        this.renderAll();
    }
};

registerPage('PageCmp', PageCmp);
