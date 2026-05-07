const PageCmp = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    mergedGuides: [],
    cityChartInstance: null,
    monthlyChartInstance: null,
    paidChartInstance: null,
    cityMonthlyChartInstance: null,
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
        setTimeout(() => this.updateCharts(), 100);
    },

    updateKPIs() {
        const fc = this.mergedGuides.filter(m => this.activeCity === 'all' || m.city === this.activeCity);
        let g25 = 0, g26 = 0, ft25 = 0, ft26 = 0, pt25 = 0, pt26 = 0, fp25 = 0, fp26 = 0, pp25 = 0, pp26 = 0;
        fc.forEach(m => {
            if (m.g25) {
                g25++;
                const s25 = filteredStats(m.g25.stats[this.activeLang], this.activeMonths);
                ft25 += s25.freeTours; fp25 += s25.freePax; pt25 += s25.paidTours; pp25 += s25.paidPax;
            }
            if (m.g26) {
                g26++;
                const s26 = filteredStats(m.g26.stats[this.activeLang], this.activeMonths);
                ft26 += s26.freeTours; fp26 += s26.freePax; pt26 += s26.paidTours; pp26 += s26.paidPax;
            }
        });
        const allGuides = new Set([
            ...fc.filter(m => m.g25).map(m => m.name),
            ...fc.filter(m => m.g26).map(m => m.name)
        ]).size;

        this._el('kv-guides').textContent  = allGuides;
        this._el('kv-guides25').textContent = g25;
        this._el('kv-guides26').textContent = g26;
        this._el('kp-guides26').innerHTML  = this.pctChange(g25, g26);
        this._el('kv-free').textContent    = fmtN(Math.max(fp25, fp26));
        this._el('kv-free25').textContent  = fmtN(fp25);
        this._el('kv-free26').textContent  = fmtN(fp26);
        this._el('kp-free26').innerHTML    = this.pctChange(fp25, fp26);
        this._el('kv-paid').textContent    = Math.max(pt25, pt26);
        this._el('kv-paid25').textContent  = pt25;
        this._el('kv-paid26').textContent  = pt26;
        this._el('kp-paid26').innerHTML    = this.pctChange(pt25, pt26);
        this._el('kv-pax').textContent     = fmtN(Math.max(fp25, fp26));
        this._el('kv-pax25').textContent   = fmtN(fp25);
        this._el('kv-pax26').textContent   = fmtN(fp26);
        this._el('kp-pax26').innerHTML     = this.pctChange(fp25, fp26);
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
                    layout: { padding: { bottom: 45 } },
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
                    layout: { padding: { bottom: 45 } },
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

        const MONTH_NAMES = {1:'Sij',2:'Velj',3:'Ožu',4:'Tra',5:'Svi',6:'Lip',7:'Srp',8:'Kol',9:'Ruj',10:'Lis',11:'Stu',12:'Pro'};
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : getCutoffMonth();
        const selectedMonths = Array.from({length: maxMonth}, (_, i) => i + 1);
        const months = selectedMonths.map(m => MONTH_NAMES[m]);

        // Update chart title labels to reflect effective range
        const effectiveLabel = maxMonth === 1 ? MONTH_NAMES[1] : `Sij–${MONTH_NAMES[maxMonth]}`;
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
                    layout: { padding: { bottom: 45 } },
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
                    layout: { padding: { bottom: 45 } },
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

            const cityColors = { Zagreb:'#0277BA', Dubrovnik:'#D4545A', Split:'#8B5CF6', Zadar:'#F59E0B' };
            const datasets = [];
            CITIES.forEach(city => {
                const col = cityColors[city];
                datasets.push({
                    label: `${city} 2025`,
                    data: cumulative(cityMonthly25[city]),
                    borderColor: col, backgroundColor: col + '20',
                    borderDash: [5, 5], borderWidth: 1.5,
                    tension: 0.3, fill: false, pointRadius: 3
                });
                datasets.push({
                    label: `${city} 2026`,
                    data: cumulative(cityMonthly26[city]),
                    borderColor: col, backgroundColor: col + '40',
                    borderWidth: 2,
                    tension: 0.3, fill: false, pointRadius: 3
                });
            });

            if (this.cityMonthlyChartInstance) this.cityMonthlyChartInstance.destroy();
            const cmCtx = this._el('cityMonthlyChart').getContext('2d');
            this.cityMonthlyChartInstance = new Chart(cmCtx, {
                type: 'line',
                data: { labels: months, datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, labels: { color: colors.text, font: { size: 10, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 10 } }
                    },
                    scales: {
                        x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                        y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                    }
                }
            });
        } catch(e) { console.error("City Monthly Chart Error:", e); }
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
        const now = new Date().toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
        const datePov = this._el('date-pov');
        if (datePov) datePov.textContent = now;
        this.mergedGuides = this.buildMerged();
        this.renderAll();
    }
};
