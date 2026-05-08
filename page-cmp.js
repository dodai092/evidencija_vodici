const PageCmp = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    mergedGuides: [],
    cityChartInstance: null,
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
        const col = CITY_COLS[m.city] || '#999';
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
            `<tr><td class="label">Free t</td><td class="v25">${ytd25 ? ytd25.freeTours : '—'}</td>` +
            `<td class="v26">${ytd26 ? ytd26.freeTours : '—'}</td>` +
            `<td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.freeTours, ytd26.freeTours) : '—'}</td></tr>` +
            `<tr><td class="label">Free p</td><td class="v25">${ytd25 ? ytd25.freePax : '—'}</td>` +
            `<td class="v26">${ytd26 ? ytd26.freePax : '—'}</td>` +
            `<td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.freePax, ytd26.freePax) : '—'}</td></tr>` +
            `<tr><td class="label">$ t</td><td class="v25">${ytd25 ? ytd25.paidTours : '—'}</td>` +
            `<td class="v26">${ytd26 ? ytd26.paidTours : '—'}</td>` +
            `<td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.paidTours, ytd26.paidTours) : '—'}</td></tr>` +
            `<tr><td class="label">$ p</td><td class="v25">${ytd25 ? ytd25.paidPax : '—'}</td>` +
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
        let g25 = 0, g26 = 0, pt25 = 0, pt26 = 0, fp25 = 0, fp26 = 0;
        fc.forEach(m => {
            if (m.g25) {
                g25++;
                const s25 = filteredStats(m.g25.stats[this.activeLang], this.activeMonths);
                fp25 += s25.freePax; pt25 += s25.paidTours;
            }
            if (m.g26) {
                g26++;
                const s26 = filteredStats(m.g26.stats[this.activeLang], this.activeMonths);
                fp26 += s26.freePax; pt26 += s26.paidTours;
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
        setDelta('kd-guides-abs', 'kd-guides-pct', g25, g26, v => v);

        this._el('kv-free25').textContent   = fmtN(fp25);
        this._el('kv-free26').textContent   = fmtN(fp26);
        this._el('kv-paid25').textContent   = pt25;
        this._el('kv-paid26').textContent   = pt26;
        this._el('kv-guides25').textContent = g25;
        this._el('kv-guides26').textContent = g26;

        // Avg PAX per free tour KPI
        let ft25 = 0, ft26 = 0;
        fc.forEach(m => {
            if (m.g25) { const s = filteredStats(m.g25.stats[this.activeLang], this.activeMonths); ft25 += s.freeTours; }
            if (m.g26) { const s = filteredStats(m.g26.stats[this.activeLang], this.activeMonths); ft26 += s.freeTours; }
        });
        const avg25 = ft25 > 0 ? (fp25 / ft25).toFixed(1) : '—';
        const avg26 = ft26 > 0 ? (fp26 / ft26).toFixed(1) : '—';
        this._el('kv-avg-pax25').textContent = avg25;
        this._el('kv-avg-pax26').textContent = avg26;
        setDelta('kd-avg-pax-abs', 'kd-avg-pax-pct', ft25 > 0 ? fp25/ft25 : 0, ft26 > 0 ? fp26/ft26 : 0, v => v.toFixed(1));
    },

    getChartColors() {
        const isDark = document.body.classList.contains('dark-mode');
        return {
            text:   isDark ? '#eeeeee' : '#111111',
            text3:  isDark ? '#888888' : '#999999',
            border: isDark ? '#333333' : '#e8e8e8',
            y25: '#6366F1',
            y26: '#1D9E75',
        };
    },

    updateCharts() {
        const fc = this.mergedGuides.filter(m => this.activeCity === 'all' || m.city === this.activeCity);
        const colors = this.getChartColors();
        const rangeLabel = getRangeLabel();

        const cityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
        const cityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
        const paidCityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
        const paidCityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };

        fc.forEach(m => {
            const s25 = m.g25 ? filteredStats(m.g25.stats[this.activeLang], this.activeMonths) : null;
            const s26 = m.g26 ? filteredStats(m.g26.stats[this.activeLang], this.activeMonths) : null;
            if (s25) {
                cityData25[m.city] += s25.freePax;
                paidCityData25[m.city] += s25.paidTours;
            }
            if (s26) {
                cityData26[m.city] += s26.freePax;
                paidCityData26[m.city] += s26.paidTours;
            }
        });

        const cityDeltaPlugin = {
            id: 'cityDelta',
            afterDraw(chart) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const ds0 = chart.data.datasets[0].data;
                const ds1 = chart.data.datasets[1].data;
                const chartColors = PageCmp.getChartColors();
                ctx.save();
                chart.data.labels.forEach((_, i) => {
                    const v25 = ds0[i] || 0, v26 = ds1[i] || 0;
                    const d = v26 - v25;
                    const pct = v25 > 0 ? ((d/v25)*100).toFixed(0) : (v26 > 0 ? '\u221E' : '0');
                    const sign = d > 0 ? '+' : '';
                    const arrow = d > 0 ? '\u25B2' : d < 0 ? '\u25BC' : '=';
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
            this.cityChartInstance = new Chart(cityCtx, {
                type: 'bar',
                data: {
                    labels: CITIES,
                    datasets: [
                        { label: `${rangeLabel} 2025`, data: CITIES.map(c => cityData25[c]), backgroundColor: colors.y25, borderRadius: 4 },
                        { label: `${rangeLabel} 2026`, data: CITIES.map(c => cityData26[c]), backgroundColor: colors.y26, borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { bottom: 45, right: 55 } },
                    plugins: { 
                        legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
                    },
                    scales: {
                        x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                        y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
                    }
                },
                plugins: [cityDeltaPlugin]
            });
        } catch(e) { console.error("City Chart Error:", e); }

        try {
            if (this.paidCityChartInstance) this.paidCityChartInstance.destroy();
            const paidCityCtx = this._el('paidCityChart').getContext('2d');
            this.paidCityChartInstance = new Chart(paidCityCtx, {
                type: 'bar',
                data: {
                    labels: CITIES,
                    datasets: [
                        { label: `${rangeLabel} 2025`, data: CITIES.map(c => paidCityData25[c]), backgroundColor: colors.y25, borderRadius: 4 },
                        { label: `${rangeLabel} 2026`, data: CITIES.map(c => paidCityData26[c]), backgroundColor: colors.y26, borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { bottom: 45, right: 55 } },
                    plugins: { 
                        legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
                    },
                    scales: {
                        x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                        y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
                    }
                },
                plugins: [cityDeltaPlugin]
            });
        } catch(e) { console.error("Paid City Chart Error:", e); }

        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : getCutoffMonth();
        const selectedMonths = Array.from({length: maxMonth}, (_, i) => i + 1);
        const months = selectedMonths.map(m => MONTH_NAMES[m]);

        // Update chart title labels to reflect effective range
        const effectiveLabel = maxMonth === 1 ? MONTH_NAMES[1] : `${MONTH_NAMES[1]}–${MONTH_NAMES[maxMonth]}`;
        document.querySelectorAll('#page-cmp .ytd-range-label').forEach(el => el.textContent = effectiveLabel);
        const monthData25 = [], monthData26 = [];
        const paidMonthData25 = [], paidMonthData26 = [];

        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(GLOBAL_DATE.split('-')[2]);

        selectedMonths.forEach(i => {
            let fd25 = 0, fd26 = 0, pd25 = 0, pd26 = 0;

            if (i < cutoffMonth) {
                // Complete month — read byMonth aggregate
                fc.forEach(m => {
                    const mo25 = m.g25?.stats[this.activeLang]?.byMonth?.[String(i)];
                    if (mo25) { fd25 += mo25.free.pax || 0; pd25 += mo25.paid.tours || 0; }
                    const mo26 = m.g26?.stats[this.activeLang]?.byMonth?.[String(i)];
                    if (mo26) { fd26 += mo26.free.pax || 0; pd26 += mo26.paid.tours || 0; }
                });
            } else if (i === cutoffMonth) {
                // Partial month — sum byDay entries for days 1 through cutoffDay
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
                const pct = last0 > 0 ? ((d/last0)*100).toFixed(0) : (last1 > 0 ? '\u221E' : '0');
                const sign = d >= 0 ? '+' : '';
                const arrow = d > 0 ? '\u25B2' : d < 0 ? '\u25BC' : '=';
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
                const chartColors = PageCmp.getChartColors();
                ctx.save();
                chart.data.labels.forEach((_, i) => {
                    const v25 = ds0[i] || 0, v26 = ds1[i] || 0;
                    const d = v26 - v25;
                    const pct = v25 > 0 ? ((d/v25)*100).toFixed(0) : (v26 > 0 ? '\u221E' : '0');
                    const sign = d > 0 ? '+' : '';
                    const arrow = d > 0 ? '\u25B2' : d < 0 ? '\u25BC' : '=';
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
            this.monthlyChartInstance = new Chart(monthCtx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        { label: `${rangeLabel} 2025`, data: cumMonthData25, borderColor: colors.y25, backgroundColor: colors.y25 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 },
                        { label: `${rangeLabel} 2026`, data: cumMonthData26, borderColor: colors.y26, backgroundColor: colors.y26 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { bottom: 45, right: 55 } },
                    plugins: { 
                        legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
                    },
                    scales: {
                        x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                        y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
                    }
                },
                plugins: [deltaOverlay, monthDeltaPlugin]
            });
        } catch(e) { console.error("Monthly Chart Error:", e); }

        try {
            if (this.paidChartInstance) this.paidChartInstance.destroy();
            const paidCtx = this._el('paidChart').getContext('2d');
            this.paidChartInstance = new Chart(paidCtx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        { label: `${rangeLabel} 2025`, data: cumPaidMonthData25, borderColor: colors.y25, backgroundColor: colors.y25 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 },
                        { label: `${rangeLabel} 2026`, data: cumPaidMonthData26, borderColor: colors.y26, backgroundColor: colors.y26 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { bottom: 45, right: 55 } },
                    plugins: { 
                        legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
                    },
                    scales: {
                        x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                        y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
                    }
                },
                plugins: [deltaOverlay, monthDeltaPlugin]
            });
        } catch(e) { console.error("Paid Chart Error:", e); }

        try {
            const cutoffDay = parseInt(GLOBAL_DATE.split('-')[2]);
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

            // Build summary badges
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
            this.cityMonthlyChartInstance = new Chart(cmCtx, {
                type: 'line',
                data: { labels: months, datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: colors.text,
                                font: { size: 10, family: "'Montserrat',sans-serif" },
                                boxWidth: 12, padding: 12,
                                filter: item => !item.text.includes('2025')
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                        y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                    }
                }
            });
        } catch(e) { console.error("City Monthly Chart Error:", e); }

        // Avg PAX per free tour by month: 2025 vs 2026
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
                this.avgFreePaxCmpChartInstance = new Chart(afCtx, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [
                            { label: `${rangeLabel} 2025`, data: avgFree25, borderColor: colors.y25, backgroundColor: colors.y25 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
                            { label: `${rangeLabel} 2026`, data: avgFree26, borderColor: colors.y26, backgroundColor: colors.y26 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
                            tooltip: { callbacks: { label: i => `${i.dataset.label}: ${i.raw} PAX/tour` } }
                        },
                        scales: {
                            x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                            y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                        }
                    }
                });
            }
        } catch(e) { console.error('Avg free PAX cmp chart error:', e); }

        this.updatePaidTypeCharts();
    },

    renderMonthlyTable() {
        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(GLOBAL_DATE.split('-')[2]);
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

        const months = this.activeMonths.length > 0
            ? this.activeMonths
            : Array.from({length: cutoffMonth}, (_, i) => i + 1);

        const getPax = (guide, lang, m) => {
            const st = guide?.stats?.[lang];
            if (!st) return 0;
            if (m < cutoffMonth) {
                return st.byMonth?.[String(m)]?.free?.pax || 0;
            } else if (m === cutoffMonth) {
                if (st.byDay) {
                    let t = 0;
                    for (let d = 1; d <= cutoffDay; d++) {
                        const dy = st.byDay[`${m}-${d}`];
                        if (dy) t += dy.free?.pax || 0;
                    }
                    return t;
                }
                return st.byMonth?.[String(m)]?.free?.pax || 0;
            }
            return 0;
        };

        const data = months.map(m => {
            const isPartial = m === cutoffMonth && this.activeMonths.length === 0;
            const row = { m, isPartial };
            CITIES.forEach(city => {
                let p25 = 0, p26 = 0;
                this.mergedGuides.filter(g => g.city === city).forEach(mg => {
                    if (mg.g25) p25 += getPax(mg.g25, this.activeLang, m);
                    if (mg.g26) p26 += getPax(mg.g26, this.activeLang, m);
                });
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
            return `<tr><td class="mpax-month">${MONTH_NAMES[row.m]}${row.isPartial ? '<sup>*</sup>' : ''}</td>${cells}</tr>`;
        }).join('');

        const totalCells = CITIES.map(city => {
            const { p25, p26 } = totals[city];
            const { d, p } = fmtDelta(p25, p26);
            return `<td>${fmtN(p25)}</td><td>${fmtN(p26)}</td><td>${d}</td><td>${p}</td>`;
        }).join('');

        const hasPartial = data.some(r => r.isPartial);

        const html = `<div class="chart-card">
            <div class="chart-card-title">Free PAX by Month and City — <span class="ytd-range-label">${getRangeLabel()}</span> 2025 vs. 2026</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead>
                    <tr><th class="mpax-month-head" rowspan="2">Mo.</th>${cityHeaders}</tr>
                    <tr>${subHeaders}</tr>
                </thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">Total</td>${totalCells}</tr>
                </tbody>
            </table>
            </div>
            ${hasPartial ? `<div class="mpax-note">* Partial month — data through ${GLOBAL_DATE}</div>` : ''}
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
        const cutoffDay   = parseInt(GLOBAL_DATE.split('-')[2]);
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
                    types.forEach(t => {
                        const td = bmt[t];
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
                        types.forEach(t => {
                            const td = bdt[t];
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
            `<th colspan="4" class="mpax-metric-head${toursPrimary ? ' mpax-metric-primary' : ''}">Tours</th>`,
            `<th colspan="4" class="mpax-metric-head${paxPrimary   ? ' mpax-metric-primary' : ''}">PAX</th>`,
            `<th colspan="4" class="mpax-metric-head">Avg PAX</th>`,
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
        const totalRow = makeRow('Total', totT25, totT26, totP25, totP26, totAvg25, totAvg26, false, true);
        const hasPartial = rows.some(r => r.isPartial);

        const html = `<div class="mpax-wrap" style="margin-top:16px">
            <table class="mpax-table">
                <thead>
                    <tr><th class="mpax-month-head" rowspan="2">Mo.</th>${groupHeaders}</tr>
                    <tr>${subHeaders}</tr>
                </thead>
                <tbody>${bodyRows}${totalRow}</tbody>
            </table>
            ${hasPartial ? `<div class="mpax-note">* Partial month — data through ${GLOBAL_DATE}</div>` : ''}
        </div>`;

        const el = document.getElementById(containerId);
        if (el) el.innerHTML = html;
    },

    updatePaidTypeCharts() {
        const colors   = this.getChartColors();
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const cutoffMonth = getCutoffMonth();
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
        const months   = Array.from({length: maxMonth}, (_, i) => MONTH_NAMES[i + 1]);

        const rangeLabel = getRangeLabel();
        const cutoffDay  = parseInt(GLOBAL_DATE.split('-')[2]);

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
                        ctx.fillStyle = PageCmp.getChartColors().text3;
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
                backgroundColor: colors.y25,
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
                this[instanceKey] = new Chart(ctx, {
                    type: 'bar',
                    data: { labels: months, datasets: [ds25, ds26] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        layout: { padding: { top: 20, bottom: 30 } },
                        plugins: {
                            legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
                            tooltip: {
                                callbacks: {
                                    afterLabel: (item) => {
                                        const sec = item.datasetIndex === 0
                                            ? ds25._secondaryData[item.dataIndex]
                                            : ds26._secondaryData[item.dataIndex];
                                        return sec ? `${secondaryKey === 'pax' ? 'PAX' : 'Tours'}: ${sec}` : '';
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { ticks: { color: colors.text3, font: { size: 11 } }, grid: { color: colors.border } },
                            y: { title: { display: true, text: yLabel, color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                        }
                    },
                    plugins: [secondaryLabelPlugin(secondaryKey)]
                });
            } catch(e) { console.error('Type chart error:', e); }
        };

        buildTypeChart('privatePaidChart-cmp', 'privatePaidChartInstance', this.activePrivateCity, this.activePrivateType, this.PRIVATE_TYPES, 'tours');
        this.renderPaidTypeTable('private-type-table-cmp', this.activePrivateCity, this.activePrivateType, this.PRIVATE_TYPES, 'tours');

        buildTypeChart('sharedPaidChart-cmp', 'sharedPaidChartInstance', this.activeSharedCity, this.activeSharedType, this.SHARED_TYPES, 'tours');
        this.renderPaidTypeTable('shared-type-table-cmp', this.activeSharedCity, this.activeSharedType, this.SHARED_TYPES, 'pax');

        // Average PAX per paid tour type by month (2025 vs 2026)
        const fc = this.mergedGuides.filter(m => this.activeCity === 'all' || m.city === this.activeCity);
        const typesToShow = this.activeAvgType === 'all' ? this.ALL_PAID_TYPES : [this.activeAvgType];

        const getTypeAvg = (year, types) => Array.from({length: maxMonth}, (_, i) => i + 1).map(mo => {
            let pax = 0, tours = 0;
            if (mo < cutoffMonth) {
                fc.forEach(m => {
                    const g = year === 25 ? m.g25 : m.g26;
                    const bmt = g?.stats[this.activeLang]?.byMonthType?.[String(mo)];
                    if (!bmt) return;
                    types.forEach(t => { const d = bmt[t]; if (d) { pax += d.pax || 0; tours += d.tours || 0; } });
                });
            } else if (mo === cutoffMonth) {
                for (let d = 1; d <= cutoffDay; d++) {
                    const key = `${mo}-${d}`;
                    fc.forEach(m => {
                        const g = year === 25 ? m.g25 : m.g26;
                        const bdt = g?.stats[this.activeLang]?.byDayType?.[key];
                        if (!bdt) return;
                        types.forEach(t => { const td = bdt[t]; if (td) { pax += td.pax || 0; tours += td.tours || 0; } });
                    });
                }
            }
            return tours > 0 ? +(pax / tours).toFixed(1) : null;
        });

        try {
            if (this.warAvgChartInstance) this.warAvgChartInstance.destroy();
            const warCtx = document.getElementById('warAvgChart-cmp')?.getContext('2d');
            if (warCtx) {
                this.warAvgChartInstance = new Chart(warCtx, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [
                            { label: `${rangeLabel} 2025`, data: getTypeAvg(25, typesToShow), borderColor: colors.y25, backgroundColor: colors.y25 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
                            { label: `${rangeLabel} 2026`, data: getTypeAvg(26, typesToShow), borderColor: colors.y26, backgroundColor: colors.y26 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
                            tooltip: { callbacks: { label: i => `${i.dataset.label}: ${i.raw} PAX/tour` } }
                        },
                        scales: {
                            x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                            y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                        }
                    }
                });
            }
        } catch(e) { console.error('Avg type chart error:', e); }
    },

    filterCity(city) {
        this.activeCity = city;
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

    init() {
        if (this._initialized) return;
        this._initialized = true;
        const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const datePov = this._el('date-pov');
        if (datePov) datePov.textContent = now;
        this.mergedGuides = this.buildMerged();
        this.renderAll();
    }
};
