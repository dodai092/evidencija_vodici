import { CITY_COLS, CITY_CLS, CITIES, MONTH_NAMES_HR, filteredStats, safeName, fmtN, getCutoffMonth, registerPage } from '../shared.js';
import { t, titleAttr } from '../i18n.js';

export const Page25 = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    activePrivateType: 'all',
    activeSharedType: 'all',
    PRIVATE_TYPES: ['war PR', 'food PR', 'best', 'old', 'big'],
    SHARED_TYPES: ['war', 'food', 'best'],
    chartInstance: null,
    cityChartInstance: null,
    paidCityChartInstance: null,
    privatePaidChartInstance: null,
    sharedPaidChartInstance: null,
    _initialized: false,

    _el(id) { return document.getElementById(id + '-25'); },
    _scope(sel) { return document.querySelectorAll('#page-25 ' + sel); },

    getChartColors() {
        const isDark = document.body.classList.contains('dark-mode');
        return {
            text:   isDark ? '#eeeeee' : '#111111',
            text3:  isDark ? '#888888' : '#999999',
            border: isDark ? '#333333' : '#e8e8e8',
            accent: '#6366F1',
        };
    },

    _setActivePill(groupId, activeBtn) {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    },

    renderCard(g) {
        const st = g.stats[this.activeLang];
        const fs = filteredStats(st, this.activeMonths);
        const sid = 'p25_' + safeName(g.name);
        const col = CITY_COLS[g.city] || '#999';
        const init = g.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const isExternal = g.city === 'Unknown';

        const typeEntries = Object.entries(st.byType).sort((a, b) => b[1].tours - a[1].tours);
        const maxT = typeEntries.length > 0 ? typeEntries[0][1].tours : 1;
        const typeBarsHtml = typeEntries.length > 0
            ? '<div class="gc-types">' +
              typeEntries.map(([type, d]) =>
                  `<div class="type-bar-row">` +
                  `<span class="type-lbl">${type}</span>` +
                  `<div class="type-track"><div class="type-fill" style="width:${(d.tours/maxT*100).toFixed(0)}%;background:${col}"></div></div>` +
                  `<span class="type-val">${d.tours}t &middot; ${d.pax}p</span>` +
                  `</div>`
              ).join('') + '</div>'
            : '';

        const months = Object.keys(st.byMonth).map(Number).sort((a, b) => a - b);
        const monthRowsHtml = months.map(m => {
            const md = st.byMonth[m];
            return `<tr>` +
                `<td>${md.name}</td>` +
                `<td class="num free-col">${md.free.tours || 0}</td>` +
                `<td class="num">${md.free.pax || 0}</td>` +
                `<td class="num paid-col">${md.paid.tours || 0}</td>` +
                `<td class="num">${md.paid.pax || 0}</td>` +
                `</tr>`;
        }).join('');

        const cityDisplay = isExternal ? t('labels.external') : g.city;

        return `<div class="guide-card" data-city="${g.city}" data-name="${g.name}">` +
            `<div class="gc-stripe" style="background:${col}"></div>` +
            `<div class="gc-body">` +
            `<div class="gc-header">` +
            `<div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div>` +
            `<span class="gc-name">${g.name}</span>` +
            (isExternal ? `<span class="badge-ext">${t('labels.external')}</span>` : `<span class="city-pill" style="background:${col}18;color:${col}">${cityDisplay}</span>`) +
            `</div>` +
            `<div class="gc-stats">` +
            `<div class="gc-half">` +
            `<div class="gc-stat-label">${t('labels.freeTours')}</div>` +
            `<div class="gc-stat-num" style="color:var(--green)">${fs.freeTours}</div>` +
            `<div class="gc-stat-sub">${fs.freePax} pax</div>` +
            `</div>` +
            `<div class="gc-divider"></div>` +
            `<div class="gc-half" style="text-align:right">` +
            `<div class="gc-stat-label">${t('labels.paidTours')}</div>` +
            `<div class="gc-stat-num" style="color:${col}">${fs.paidTours}</div>` +
            `<div class="gc-stat-sub">${fs.paidPax} pax</div>` +
            `</div>` +
            `</div>` +
            `</div>` +
            `${typeBarsHtml}` +
            `<div class="monthly-toggle" onclick="Page25.toggleMonthly('${sid}')">` +
            `<span class="mt-arrow" id="mta-${sid}">&#9660;</span> ${t('labels.monthly')}` +
            `</div>` +
            `<div class="monthly-table" id="mt-${sid}">` +
            `<table>` +
            `<thead><tr>` +
            `<th>${t('table.month')}</th>` +
            `<th class="num" style="color:var(--green)">${t('table.free')} t</th>` +
            `<th class="num">${t('table.free')} p</th>` +
            `<th class="num" style="color:var(--teal)">$ t</th>` +
            `<th class="num">$ p</th>` +
            `</tr></thead>` +
            `<tbody>${monthRowsHtml}</tbody>` +
            `<tfoot><tr>` +
            `<td>${t('labels.total')}</td>` +
            `<td class="num free-col">${fs.freeTours}</td>` +
            `<td class="num">${fs.freePax}</td>` +
            `<td class="num paid-col">${fs.paidTours}</td>` +
            `<td class="num">${fs.paidPax}</td>` +
            `</tr></tfoot>` +
            `</table>` +
            `</div>` +
            `</div>`;
    },

    renderAll() {
        const container = this._el('guide-sections');
        let html = '';
        CITIES.forEach(city => {
            if (this.activeCity !== 'all' && this.activeCity !== city) return;
            const cityGuides = guideStats25.filter(g => g.city === city);
            if (cityGuides.length === 0) return;
            const cls = CITY_CLS[city] || '';
            html += `<section class="city-section" data-city="${city}">`;
            html += `<div class="section-title ${cls}">${city}</div>`;
            html += `<div class="guide-grid">`;
            html += cityGuides.map(g => this.renderCard(g)).join('');
            html += `</div></section>`;
        });
        container.innerHTML = html;
        this.updateKPIs();
        this.updateChart();
        this.renderCityBars();
        this.renderMonthlyTable();
        this.updatePaidTypeCharts();
    },

    renderCityBars() {
        const colors = this.getChartColors();
        const lang = this.activeLang;
        const citiesToShow = this.activeCity === 'all' ? CITIES : [this.activeCity];

        const freePaxByCity = {}, paidToursByCity = {};
        CITIES.forEach(c => { freePaxByCity[c] = 0; paidToursByCity[c] = 0; });
        guideStats25.forEach(g => {
            if (!CITIES.includes(g.city)) return;
            const fs = filteredStats(g.stats[lang], this.activeMonths);
            freePaxByCity[g.city] += fs.freePax;
            paidToursByCity[g.city] += fs.paidTours;
        });

        const makeBar = (canvasId, instanceKey, dataArr, yLabel, tooltipLabel) => {
            try {
                if (this[instanceKey]) this[instanceKey].destroy();
                const ctx = document.getElementById(canvasId)?.getContext('2d');
                if (!ctx) return;
                this[instanceKey] = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: citiesToShow,
                        datasets: [{ data: dataArr, backgroundColor: citiesToShow.map(c => CITY_COLS[c]), borderRadius: 4 }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => `${fmtN(i.raw)} ${tooltipLabel}` } } },
                        scales: {
                            x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                            y: { title: { display: true, text: yLabel, color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                        }
                    }
                });
            } catch(e) { console.error(e); }
        };

        makeBar('cityChart-25', 'cityChartInstance', citiesToShow.map(c => freePaxByCity[c]), t('table.pax'), 'pax');
        makeBar('paidCityChart-25', 'paidCityChartInstance', citiesToShow.map(c => paidToursByCity[c]), t('table.tours'), 'tours');
    },

    renderMonthlyTable() {
        const lang = this.activeLang;
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const months = this.activeMonths.length > 0 ? this.activeMonths : Array.from({length: 12}, (_, i) => i + 1);
        const citiesToShow = this.activeCity === 'all' ? CITIES : [this.activeCity];

        const data = months.map(m => {
            const row = { m };
            CITIES.forEach(city => {
                row[city] = guideStats25
                    .filter(g => g.city === city)
                    .reduce((s, g) => s + (g.stats[lang]?.byMonth?.[String(m)]?.free?.pax || 0), 0);
            });
            return row;
        });

        const totals = {};
        CITIES.forEach(c => { totals[c] = data.reduce((s, r) => s + r[c], 0); });

        const cityHeaders = citiesToShow.map(c =>
            `<th class="mpax-city-head ${CITY_CLS[c]}">${c}</th>`
        ).join('');
        const bodyRows = data.map(row => {
            const cells = citiesToShow.map(c => `<td>${row[c] ? fmtN(row[c]) : '—'}</td>`).join('');
            return `<tr><td class="mpax-month">${MONTH_NAMES[row.m]}</td>${cells}</tr>`;
        }).join('');
        const totalCells = citiesToShow.map(c => `<td>${fmtN(totals[c])}</td>`).join('');

        const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr('charts.freePaxByMonthAndCity')}>${t('charts.freePaxByMonthAndCity')}</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead><tr><th class="mpax-month-head">${t('table.month')}</th>${cityHeaders}</tr></thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t('labels.total')}</td>${totalCells}</tr>
                </tbody>
            </table>
            </div>
        </div>`;

        const el = document.getElementById('monthly-pax-table-25');
        if (el) el.innerHTML = html;
    },

    _getTypeMonthData(types) {
        const lang = this.activeLang;
        return Array.from({length: 12}, (_, i) => i + 1).map(mo => {
            let tours = 0, pax = 0;
            guideStats25
                .filter(g => this.activeCity === 'all' || g.city === this.activeCity)
                .forEach(g => {
                    const bmt = g.stats[lang]?.byMonthType?.[String(mo)];
                    if (!bmt) return;
                    types.forEach(tp => { const td = bmt[tp]; if (td) { tours += td.tours||0; pax += td.pax||0; } });
                });
            return { tours, pax };
        });
    },

    updatePaidTypeCharts() {
        const colors = this.getChartColors();
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const monthLabels = Array.from({length: 12}, (_, i) => MONTH_NAMES[i + 1]);

        const paxLabelPlugin = () => ({
            id: 'paxLabel25',
            afterDraw(chart) {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                ctx.save();
                ctx.font = "500 9px 'Montserrat',sans-serif";
                ctx.textAlign = 'center';
                ctx.fillStyle = colors.text3;
                const paxData = chart.data.datasets[0]._paxData || [];
                meta.data.forEach((bar, i) => {
                    const val = paxData[i];
                    if (!val) return;
                    ctx.fillText(`${val}p`, bar.x, bar.y - 4);
                });
                ctx.restore();
            }
        });

        const buildChart = (canvasId, instanceKey, types) => {
            const data = this._getTypeMonthData(types);
            try {
                if (this[instanceKey]) this[instanceKey].destroy();
                const ctx = document.getElementById(canvasId)?.getContext('2d');
                if (!ctx) return;
                this[instanceKey] = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: monthLabels,
                        datasets: [{
                            data: data.map(d => d.tours),
                            _paxData: data.map(d => d.pax),
                            backgroundColor: colors.accent,
                            borderRadius: 4,
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        layout: { padding: { top: 20 } },
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { afterLabel: item => { const p = item.dataset._paxData?.[item.dataIndex]; return p ? `${t('table.pax')}: ${p}` : ''; } } }
                        },
                        scales: {
                            x: { ticks: { color: colors.text3, font: { size: 11 } }, grid: { color: colors.border } },
                            y: { title: { display: true, text: t('sections.freeTours'), color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                        }
                    },
                    plugins: [paxLabelPlugin()]
                });
            } catch(e) { console.error(e); }
        };

        const buildTable = (containerId, types) => {
            const data = this._getTypeMonthData(types);
            const bodyRows = data.map((d, i) => {
                const avg = d.tours > 0 ? (d.pax / d.tours).toFixed(1) : '—';
                return `<tr>
                    <td class="mpax-month">${MONTH_NAMES[i + 1]}</td>
                    <td>${d.tours || '—'}</td><td>${d.pax || '—'}</td><td>${avg}</td>
                </tr>`;
            }).join('');
            const totT = data.reduce((s, d) => s + d.tours, 0);
            const totP = data.reduce((s, d) => s + d.pax, 0);
            const html = `<div class="mpax-wrap" style="margin-top:16px">
                <table class="mpax-table">
                    <thead><tr>
                        <th class="mpax-month-head">${t('table.month')}</th>
                        <th class="mpax-metric-head">${t('sections.freeTours')}</th>
                        <th class="mpax-metric-head">${t('table.pax')}</th>
                        <th class="mpax-metric-head">${t('labels.avgPaxPerTour')}</th>
                    </tr></thead>
                    <tbody>
                        ${bodyRows}
                        <tr class="mpax-total">
                            <td class="mpax-month">${t('labels.total')}</td>
                            <td>${totT || '—'}</td><td>${totP || '—'}</td>
                            <td>${totT > 0 ? (totP / totT).toFixed(1) : '—'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
            const el = document.getElementById(containerId);
            if (el) el.innerHTML = html;
        };

        const privateTypes = this.activePrivateType === 'all' ? this.PRIVATE_TYPES : [this.activePrivateType];
        const sharedTypes  = this.activeSharedType  === 'all' ? this.SHARED_TYPES  : [this.activeSharedType];

        buildChart('privatePaidChart-25', 'privatePaidChartInstance', privateTypes);
        buildTable('private-type-table-25', privateTypes);
        buildChart('sharedPaidChart-25', 'sharedPaidChartInstance', sharedTypes);
        buildTable('shared-type-table-25', sharedTypes);
    },

    filterPrivateType(type, btn) {
        this.activePrivateType = type;
        this._setActivePill('private-type-pills-25', btn);
        this.updatePaidTypeCharts();
    },

    filterSharedType(type, btn) {
        this.activeSharedType = type;
        this._setActivePill('shared-type-pills-25', btn);
        this.updatePaidTypeCharts();
    },

    updateChart() {
        const colors = this.getChartColors();
        const lang = this.activeLang;
        const months = Array.from({length: 12}, (_, i) => i + 1);
        const citiesToShow = this.activeCity === 'all' ? CITIES : [this.activeCity];
        const datasets = citiesToShow.map(city => {
            const guides = guideStats25.filter(g => g.city === city);
            const data = months.map(m => {
                let pax = 0, tours = 0;
                guides.forEach(g => {
                    const bm = g.stats[lang]?.byMonth?.[String(m)];
                    if (bm) { pax += bm.free.pax || 0; tours += bm.free.tours || 0; }
                });
                return tours > 0 ? +(pax / tours).toFixed(1) : null;
            });
            const col = CITY_COLS[city];
            return { label: city, data, borderColor: col, backgroundColor: col + '18', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 4, spanGaps: false };
        });

        const ctx = document.getElementById('avgFreePaxChart-25')?.getContext('2d');
        if (!ctx) return;
        if (this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: months.map(m => MONTH_NAMES_HR[m]), datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 12 } },
                    tooltip: { callbacks: { label: i => `${i.dataset.label}: ${i.raw} ${t('table.pax')}/tour` } }
                },
                scales: {
                    x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                    y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
                }
            }
        });
    },

    updateKPIs() {
        const filtered = guideStats25.filter(g => this.activeCity === 'all' || g.city === this.activeCity);
        const k = this.activeLang;
        let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
        filtered.forEach(g => {
            const fs = filteredStats(g.stats[k], this.activeMonths);
            freeTours += fs.freeTours;
            paidTours += fs.paidTours;
            freePax   += fs.freePax;
            paidPax   += fs.paidPax;
        });
        this._el('kv-guides').textContent    = filtered.length;
        this._el('kv-free').textContent      = fmtN(freePax);
        this._el('kv-free-pax').textContent  = freeTours + ' t';
        this._el('kv-avg-pax').textContent   = freeTours > 0 ? (freePax / freeTours).toFixed(1) : '—';
        this._el('kv-paid').textContent      = paidTours;
        this._el('kv-paid-pax').textContent  = fmtN(paidPax) + ' pax';
    },

    filterCity(city) { this.activeCity = city; this.renderAll(); },
    filterLang(lang) { this.activeLang = lang; this.renderAll(); },
    filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },

    toggleMonthly(sid) {
        const table = document.getElementById('mt-' + sid);
        const arrow = document.getElementById('mta-' + sid);
        if (!table) return;
        table.classList.toggle('open');
        if (arrow) arrow.classList.toggle('open');
    },

    _buildHeader() {
        return `<div class="header">
            <div class="header-left">
                <h1>Guides <span class="accent">2025</span></h1>
                <p>Tour production by guide &middot; Free vs. Paid &middot; <span class="ytd-range-label">Jan–May</span></p>
            </div>
            <div class="header-right">
                <div id="date-pov-25" class="mb-6"></div>
                <div class="header-badge">Travel Year 2025 &middot; Closed</div>
            </div>
        </div>`;
    },

    _buildFilters() {
        return `<div class="main">
            <div class="filter-area">
                <div class="filter-group">
                    <label for="city-filter-25">${t('labels.city')}</label>
                    <select class="filter-select" id="city-filter-25" onchange="Page25.filterCity(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        <option value="Zagreb">Zagreb</option>
                        <option value="Dubrovnik">Dubrovnik</option>
                        <option value="Split">Split</option>
                        <option value="Zadar">Zadar</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="lang-filter-25">${t('labels.language')}</label>
                    <select class="filter-select" id="lang-filter-25" onchange="Page25.filterLang(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        <option value="eng">🇬🇧 ENG</option>
                        <option value="esp">🇪🇸 ESP</option>
                        <option value="fra">🇫🇷 FRA</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="month-filter-25">${t('table.month')}</label>
                    <select class="filter-select" id="month-filter-25" onchange="Page25.filterMonth(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        ${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.freeToursPaxCount')}</div>
                    <div class="kpi-value" id="kv-free-25">—</div>
                    <div class="kpi-sub" id="kv-free-pax-25">— t</div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.avgPaxFreeTour')}</div>
                    <div class="kpi-value" id="kv-avg-pax-25">—</div>
                    <div class="kpi-sub">${t('labels.paxPerTour')}</div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t('labels.paidToursCount')}</div>
                    <div class="kpi-value" id="kv-paid-25">—</div>
                    <div class="kpi-sub" id="kv-paid-pax-25">— pax</div>
                </div>
                <div class="kpi hl-teal">
                    <div class="kpi-label">${t('labels.activeGuides')}</div>
                    <div class="kpi-value" id="kv-guides-25">—</div>
                    <div class="kpi-sub">${t('labels.in2025')}</div>
                </div>
            </div>`;
    },

    _buildFreeTours() {
        return `<div class="section-divider" onclick="toggleSection('free-section-body-25')">
                <span>${t('sections.freeTours')}</span>
                <span class="section-chevron">▾</span>
            </div>
            <div id="free-section-body-25" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.freePaxByCity25')}>${t('charts.freePaxByCity25')}</div>
                        <div class="chart-container"><canvas id="cityChart-25"></canvas></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.avgPaxPerTourMonth25')}>${t('charts.avgPaxPerTourMonth25')}</div>
                        <div class="chart-container"><canvas id="avgFreePaxChart-25"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div id="monthly-pax-table-25"></div>
                </div>
            </div>`;
    },

    _buildPaidTours() {
        return `<div class="section-divider" onclick="toggleSection('paid-section-body-25')">
                <span>${t('sections.paidTours')}</span>
                <span class="section-chevron">▾</span>
            </div>
            <div id="paid-section-body-25" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.paidToursByCity25')}>${t('charts.paidToursByCity25')}</div>
                        <div class="chart-container"><canvas id="paidCityChart-25"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr('charts.privatePaidTours25')}>${t('charts.privatePaidTours25')}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="private-type-pills-25" class="pill-group">
                                    <button class="pill active" onclick="Page25.filterPrivateType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('best',this)">best</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('old',this)">old</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('big',this)">big</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="privatePaidChart-25"></canvas></div>
                        <div id="private-type-table-25"></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr('charts.sharedPaidTours25')}>${t('charts.sharedPaidTours25')}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="shared-type-pills-25" class="pill-group">
                                    <button class="pill active" onclick="Page25.filterSharedType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="Page25.filterSharedType('war',this)">war</button>
                                    <button class="pill" onclick="Page25.filterSharedType('food',this)">food</button>
                                    <button class="pill" onclick="Page25.filterSharedType('best',this)">best</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="sharedPaidChart-25"></canvas></div>
                        <div id="shared-type-table-25"></div>
                    </div>
                </div>
            </div>`;
    },

    _buildGuides() {
        return `<div class="section-divider" onclick="toggleSection('guides-body-25')">
                <span>${t('labels.guides')}</span>
                <span class="section-chevron">▾</span>
            </div>
            <div id="guides-body-25" class="section-body">
                <div id="guide-sections-25"></div>
            </div>
        </div>`;
    },

    _destroyCharts() {
        [this.chartInstance, this.cityChartInstance, this.paidCityChartInstance,
         this.privatePaidChartInstance, this.sharedPaidChartInstance].forEach(chart => {
            if (chart) try { chart.destroy(); } catch(e) {}
        });
        this.chartInstance = null;
        this.cityChartInstance = null;
        this.paidCityChartInstance = null;
        this.privatePaidChartInstance = null;
        this.sharedPaidChartInstance = null;
    },

    rebuildStructure() {
        this._destroyCharts();
        document.getElementById('page-25').innerHTML =
            this._buildHeader() +
            this._buildFilters() +
            this._buildFreeTours() +
            this._buildPaidTours() +
            this._buildGuides();

        const d = new Date(window.GLOBAL_DATE);
        const fmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const datePov = this._el('date-pov');
        if (datePov) datePov.textContent = fmt;
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.rebuildStructure();
        this.renderAll();
    }
};

registerPage('Page25', Page25);
