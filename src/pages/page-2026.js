import { getCityColor, getChartColors as _chartColors, CITY_CLS, CITIES, MONTH_NAMES_HR, filteredStats, paidFiltered, fmtN, getCutoffMonth, getGlobalDate, getRangeLabel, registerPage } from '../shared.js';
import { t, titleAttr } from '../i18n.js';

export const Page26 = {
    activeCity: 'all',
    activeLang: 'all',
    activeTab: 'free',
    activeKind: 'all',
    activeMonths: [],
    activePrivateType: 'all',
    activeSharedType: 'all',
    PRIVATE_TYPES: ['war PR', 'food PR', 'best', 'old', 'big', 'food kuoni'],
    SHARED_TYPES: ['war', 'food'],
    chartInstance: null,
    cityChartInstance: null,
    paidCityChartInstance: null,
    privatePaidChartInstance: null,
    sharedPaidChartInstance: null,
    _initialized: false,

    _el(id) { return document.getElementById(id + '-26'); },

    getChartColors() {
        const c = _chartColors();
        return { ...c, accent: c.y26 };
    },

    _setActivePill(groupId, activeBtn) {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    },

    renderAll() {
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
        CITIES.forEach(c => {
            const st = cityStats26[c]?.[lang];
            const fs = st ? filteredStats(st, this.activeMonths) : { freePax: 0, paidTours: 0 };
            freePaxByCity[c] = fs.freePax;
            paidToursByCity[c] = st ? paidFiltered(st, this.activeMonths, this.kindTypes()).tours : 0;
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
                        datasets: [{ data: dataArr, backgroundColor: citiesToShow.map(c => getCityColor(c)), borderRadius: 4 }]
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

        makeBar('cityChart-26', 'cityChartInstance', citiesToShow.map(c => freePaxByCity[c]), t('table.pax'), t('table.pax').toLowerCase());
        makeBar('paidCityChart-26', 'paidCityChartInstance', citiesToShow.map(c => paidToursByCity[c]), t('table.tours'), t('table.tours').toLowerCase());
    },

    renderMonthlyTable() {
        const lang = this.activeLang;
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(getGlobalDate().split('-')[2]);
        const months = this.activeMonths.length > 0 ? this.activeMonths : Array.from({length: cutoffMonth}, (_, i) => i + 1);
        const citiesToShow = this.activeCity === 'all' ? CITIES : [this.activeCity];

        const getCityPax = (city, m) => {
            const st = cityStats26[city]?.[lang];
            if (!st) return 0;
            if (m < cutoffMonth) return st.byMonth?.[String(m)]?.free?.pax || 0;
            if (m === cutoffMonth) {
                if (st.byDay) {
                    let total = 0;
                    for (let d = 1; d <= cutoffDay; d++) { total += st.byDay[`${m}-${d}`]?.free?.pax || 0; }
                    return total;
                }
                return st.byMonth?.[String(m)]?.free?.pax || 0;
            }
            return 0;
        };

        const data = months.map(m => {
            const isPartial = m === cutoffMonth && this.activeMonths.length === 0;
            const row = { m, isPartial };
            CITIES.forEach(city => {
                row[city] = getCityPax(city, m);
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
            const rowTotal = citiesToShow.reduce((s, c) => s + (row[c] || 0), 0);
            const label = MONTH_NAMES[row.m] + (row.isPartial ? '<sup>*</sup>' : '');
            return `<tr><td class="mpax-month">${label}</td>${cells}<td><strong>${rowTotal ? fmtN(rowTotal) : '—'}</strong></td></tr>`;
        }).join('');
        const totalCells = citiesToShow.map(c => `<td>${fmtN(totals[c])}</td>`).join('');
        const overallTotal = citiesToShow.reduce((s, c) => s + totals[c], 0);
        const hasPartial = data.some(r => r.isPartial);

        const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr('charts.freePaxByMonthAndCity26')}>${t('charts.freePaxByMonthAndCity26')}</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead><tr><th class="mpax-month-head">${t('table.month')}</th>${cityHeaders}<th class="mpax-city-head">${t('labels.total')}</th></tr></thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t('labels.total')}</td>${totalCells}<td><strong>${fmtN(overallTotal)}</strong></td></tr>
                </tbody>
            </table>
            </div>
            ${hasPartial ? `<div class="mpax-note">* ${t('labels.partial')} — data through ${getGlobalDate()}</div>` : ''}
        </div>`;

        const el = document.getElementById('monthly-pax-table-26');
        if (el) el.innerHTML = html;
    },

    _getTypeMonthData(types) {
        const lang = this.activeLang;
        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(getGlobalDate().split('-')[2]);
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
        const fc = guideStats26.filter(g => CITIES.includes(g.city) && (this.activeCity === 'all' || g.city === this.activeCity));

        return Array.from({length: maxMonth}, (_, i) => i + 1).map(mo => {
            let tours = 0, pax = 0;
            if (mo < cutoffMonth) {
                fc.forEach(g => {
                    const bmt = g.stats[lang]?.byMonthType?.[String(mo)];
                    if (!bmt) return;
                    types.forEach(tp => { const td = bmt[tp]; if (td) { tours += td.tours||0; pax += td.pax||0; } });
                });
            } else if (mo === cutoffMonth) {
                for (let d = 1; d <= cutoffDay; d++) {
                    const key = `${mo}-${d}`;
                    fc.forEach(g => {
                        const bdt = g.stats[lang]?.byDayType?.[key];
                        if (!bdt) return;
                        types.forEach(tp => { const td = bdt[tp]; if (td) { tours += td.tours||0; pax += td.pax||0; } });
                    });
                }
            }
            return { tours, pax };
        });
    },

    updatePaidTypeCharts() {
        const colors = this.getChartColors();
        const cutoffMonth = getCutoffMonth();
        const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
        const MONTH_NAMES = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
        const monthLabels = Array.from({length: maxMonth}, (_, i) => MONTH_NAMES[i + 1]);

        const paxLabelPlugin = () => ({
            id: 'paxLabel26',
            afterDraw(chart) {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                ctx.save();
                ctx.font = "500 9px 'IBM Plex Sans',sans-serif";
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
                            y: { title: { display: true, text: t('table.tours'), color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
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
                        <th class="mpax-metric-head">${t('table.tours')}</th>
                        <th class="mpax-metric-head">${t('table.pax')}</th>
                        <th class="mpax-metric-head">Avg ${t('table.pax')}</th>
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

        buildChart('privatePaidChart-26', 'privatePaidChartInstance', privateTypes);
        buildTable('private-type-table-26', privateTypes);
        buildChart('sharedPaidChart-26', 'sharedPaidChartInstance', sharedTypes);
        buildTable('shared-type-table-26', sharedTypes);
    },

    filterPrivateType(type, btn) {
        this.activePrivateType = type;
        this._setActivePill('private-type-pills-26', btn);
        this.updatePaidTypeCharts();
    },

    filterSharedType(type, btn) {
        this.activeSharedType = type;
        this._setActivePill('shared-type-pills-26', btn);
        this.updatePaidTypeCharts();
    },

    updateChart() {
        const colors = this.getChartColors();
        const cutoffMonth = getCutoffMonth();
        const cutoffDay   = parseInt(getGlobalDate().split('-')[2]);
        const lang = this.activeLang;
        const months = Array.from({length: cutoffMonth}, (_, i) => i + 1);
        const citiesToShow = this.activeCity === 'all' ? CITIES : [this.activeCity];

        const datasets = citiesToShow.map(city => {
            const guides = guideStats26.filter(g => g.city === city);
            const data = months.map(m => {
                let pax = 0, tours = 0;
                if (m < cutoffMonth) {
                    guides.forEach(g => {
                        const bm = g.stats[lang]?.byMonth?.[String(m)];
                        if (bm) { pax += bm.free.pax || 0; tours += bm.free.tours || 0; }
                    });
                } else {
                    for (let d = 1; d <= cutoffDay; d++) {
                        const key = `${m}-${d}`;
                        guides.forEach(g => {
                            const bd = g.stats[lang]?.byDay?.[key];
                            if (bd) { pax += bd.free.pax || 0; tours += bd.free.tours || 0; }
                        });
                    }
                }
                return tours > 0 ? +(pax / tours).toFixed(1) : null;
            });
            const col = getCityColor(city);
            return { label: city, data, borderColor: col, backgroundColor: col + '18', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 4, spanGaps: false };
        });

        const ctx = document.getElementById('avgFreePaxChart-26')?.getContext('2d');
        if (!ctx) return;
        if (this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: months.map(m => MONTH_NAMES_HR[m]), datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 12 } },
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
        const citiesToSum = this.activeCity === 'all' ? CITIES : [this.activeCity];
        const paid = this.activeTab === 'paid';
        let pax = 0, tours = 0;
        citiesToSum.forEach(city => {
            const st = cityStats26[city]?.[this.activeLang];
            if (!st) return;
            if (paid) {
                const ps = paidFiltered(st, this.activeMonths, this.kindTypes());
                pax += ps.pax; tours += ps.tours;
            } else {
                const fs = filteredStats(st, this.activeMonths);
                pax += fs.freePax; tours += fs.freeTours;
            }
        });
        this._el('kv-pax').textContent     = fmtN(pax);
        this._el('kv-avg-pax').textContent = tours > 0 ? (pax / tours).toFixed(1) : '—';
        this._el('kv-tours').textContent   = fmtN(tours);
    },

    filterCity(city) {
        this.activeCity = city;
        document.querySelectorAll('#page-26 .city-filter-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.city === city));
        this.renderAll();
    },
    filterLang(lang) {
        this.activeLang = lang;
        document.querySelectorAll('#page-26 .lang-pill').forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
        this.renderAll();
    },
    kindTypes() {
        return this.activeKind === 'private' ? this.PRIVATE_TYPES
             : this.activeKind === 'shared'  ? this.SHARED_TYPES : null;
    },

    filterTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('#page-26 .view-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.getElementById('free-section-body-26').hidden = tab !== 'free';
        document.getElementById('paid-section-body-26').hidden = tab !== 'paid';
        document.getElementById('kind-filter-26').hidden = tab !== 'paid';
        // every free tour is English or Spanish, so Oth only exists on Paid
        document.querySelector('#page-26 .lang-pill[data-lang="oth"]').hidden = tab === 'free';
        if (tab === 'free' && this.activeLang === 'oth') {
            this.activeLang = 'all';
            document.querySelectorAll('#page-26 .lang-pill').forEach(p => p.classList.toggle('active', p.dataset.lang === 'all'));
        }
        this._positionTabs();
        this.renderAll();
    },

    filterKind(kind) {
        this.activeKind = kind;
        document.querySelectorAll('#page-26 .kind-pill').forEach(p => p.classList.toggle('active', p.dataset.kind === kind));
        this._syncKindUi();
        this.renderAll();
    },

    // Private/Shared hides the by-type card of the other kind
    _syncKindUi() {
        document.getElementById('private-card-26').hidden = this.activeKind === 'shared';
        document.getElementById('shared-card-26').hidden = this.activeKind === 'private';
    },

    // the filter bar pins under the Free/Paid tabs, so it needs their height
    _positionTabs() {
        const tabs = document.getElementById('view-tabs-26');
        if (tabs) document.getElementById('page-26').style.setProperty('--view-tabs-h', tabs.offsetHeight + 'px');
    },

    filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },

    _buildHeader() {
        return `<div class="header">
            <div class="header-left">
                <h1>${t('table.tours')} <span class="accent">2026</span></h1>
                <p><span class="ytd-range-label">${getRangeLabel()}</span></p>
            </div>
            <div class="header-right">
                <div id="date-pov-26" class="mb-6"></div>
                <div class="header-badge">${t('labels.travelYear2026')} &middot; ${t('labels.ytd')}</div>
            </div>
        </div>`;
    },

    _buildFilters() {
        const cityPills = ['all', ...CITIES].map(c => {
            const col = getCityColor(c);
            const label = c === 'all' ? t('labels.all') : c;
            const active = this.activeCity === c ? ' active' : '';
            const style = col ? ` style="--city-col:${col}"` : '';
            return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="Page26.filterCity('${c}')">${label}</button>`;
        }).join('');

        return `<div class="main">
            <div class="city-pill-group view-tabs" id="view-tabs-26" role="tablist">
                <button class="city-filter-pill view-tab${this.activeTab === 'free' ? ' active' : ''}" data-tab="free" role="tab" onclick="Page26.filterTab('free')">${t('labels.freeTours')}</button>
                <button class="city-filter-pill view-tab${this.activeTab === 'paid' ? ' active' : ''}" data-tab="paid" role="tab" onclick="Page26.filterTab('paid')">${t('labels.paidTours')}</button>
            </div>
            <div class="filter-bar">
                <div class="city-pill-group">${cityPills}</div>
                <div class="filter-dropdowns">
                    <div class="city-pill-group lang-pill-group" id="lang-filter-26" role="group" aria-label="${t('labels.language')}">
                        ${[['all', t('labels.all')], ['eng', 'Eng'], ['esp', 'Esp'], ['oth', 'Oth']].map(([v, label]) =>
                            `<button class="city-filter-pill lang-pill${this.activeLang === v ? ' active' : ''}" data-lang="${v}"${v === 'oth' && this.activeTab === 'free' ? ' hidden' : ''} onclick="Page26.filterLang('${v}')">${label}</button>`).join('')}
                    </div>
                    <div class="filter-field">
                        <label class="filter-label" for="month-filter-26">${t('labels.mo')}</label>
                        <select class="filter-select" id="month-filter-26" onchange="Page26.filterMonth(this.value)">
                            <option value="all">${t('labels.all')}</option>
                            ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].slice(0, getCutoffMonth()).map((n,i)=>`<option value="${i+1}">${n}</option>`).join('')}
                        </select>
                    </div>
                    <div class="city-pill-group kind-pill-group" id="kind-filter-26" role="group"${this.activeTab === 'paid' ? '' : ' hidden'}>
                        ${[['all', t('labels.all')], ['private', t('labels.privateTours')], ['shared', t('labels.sharedTours')]].map(([v, label]) =>
                            `<button class="city-filter-pill kind-pill${this.activeKind === v ? ' active' : ''}" data-kind="${v}" onclick="Page26.filterKind('${v}')">${label}</button>`).join('')}
                    </div>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-3">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.kpiTotalTours')}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-tours-26">—</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.kpiAvgPaxPerTour')}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-avg-pax-26">—</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.kpiPaxCountYtd')}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-pax-26">—</div></div>
                    </div>
                </div>
            </div>`;
    },

    _buildFreeTours() {
        return `<div id="free-section-body-26" class="section-body"${this.activeTab === 'free' ? '' : ' hidden'}>
                <div class="charts-row">
                    <div id="monthly-pax-table-26"></div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.freePaxByCity26')}>${t('charts.freePaxByCity26')}</div>
                        <div class="chart-container"><canvas id="cityChart-26"></canvas></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.avgPaxPerTourMonth26')}>${t('charts.avgPaxPerTourMonth26')}</div>
                        <div class="chart-container"><canvas id="avgFreePaxChart-26"></canvas></div>
                    </div>
                </div>
            </div>`;
    },

    _buildPaidTours() {
        return `<div id="paid-section-body-26" class="section-body"${this.activeTab === 'paid' ? '' : ' hidden'}>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.paidToursByCity26')}>${t('charts.paidToursByCity26')}</div>
                        <div class="chart-container"><canvas id="paidCityChart-26"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card" id="private-card-26">
                        <div class="chart-card-title"${titleAttr('charts.privatePaidTours26')}>${t('charts.privatePaidTours26')}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="private-type-pills-26" class="pill-group">
                                    <button class="pill active" onclick="Page26.filterPrivateType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('best',this)">best</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('old',this)">old</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('big',this)">big</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('food kuoni',this)">food kuoni</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="privatePaidChart-26"></canvas></div>
                        <div id="private-type-table-26"></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card" id="shared-card-26">
                        <div class="chart-card-title"${titleAttr('charts.sharedPaidTours26')}>${t('charts.sharedPaidTours26')}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="shared-type-pills-26" class="pill-group">
                                    <button class="pill active" onclick="Page26.filterSharedType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="Page26.filterSharedType('war',this)">war</button>
                                    <button class="pill" onclick="Page26.filterSharedType('food',this)">food</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="sharedPaidChart-26"></canvas></div>
                        <div id="shared-type-table-26"></div>
                    </div>
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
        document.getElementById('page-26').innerHTML =
            this._buildHeader() +
            this._buildFilters() +
            this._buildFreeTours() +
            this._buildPaidTours() +
            '</div>';

        const d = new Date(getGlobalDate());
        const fmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const datePov = this._el('date-pov');
        if (datePov) datePov.textContent = fmt;
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.rebuildStructure();
        this._syncKindUi();
        this._positionTabs();
        window.addEventListener('resize', () => this._positionTabs());
        this.renderAll();
    }
};

registerPage('Page26', Page26);
