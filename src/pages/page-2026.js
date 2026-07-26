import { getCityColor, getChartColors as _chartColors, CITY_CLS, CITIES, MONTH_NAMES_HR, filteredStats, safeName, fmtN, getCutoffMonth, getGlobalDate, registerPage, showPage } from '../shared.js';
import { t, titleAttr } from '../i18n.js';

export const Page26 = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    activePrivateType: 'all',
    activeSharedType: 'all',
    searchTerm: '',
    PRIVATE_TYPES: ['war PR', 'food PR', 'best', 'old', 'big'],
    SHARED_TYPES: ['war', 'food', 'best'],
    chartInstance: null,
    cityChartInstance: null,
    paidCityChartInstance: null,
    privatePaidChartInstance: null,
    sharedPaidChartInstance: null,
    _initialized: false,

    _el(id) { return document.getElementById(id + '-26'); },
    _scope(sel) { return document.querySelectorAll('#page-26 ' + sel); },

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

    renderCard(g) {
        const st = g.stats[this.activeLang];
        const fs = filteredStats(st, this.activeMonths);
        const sid = 'p26_' + safeName(g.name);
        const col = getCityColor(g.city);
        const init = g.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

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

        return `<div class="guide-card" data-city="${g.city}" data-name="${g.name}">` +
            `<div class="gc-stripe" style="background:${col}"></div>` +
            `<div class="gc-body">` +
            `<div class="gc-header">` +
            `<div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div>` +
            `<span class="gc-name">${g.name}</span>` +
            `<span class="city-pill" style="background:${col}18;color:${col}">${g.city}</span>` +
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
            `<button type="button" class="monthly-toggle" aria-expanded="false" onclick="Page26.toggleMonthly('${sid}')">` +
            `<span class="mt-arrow" id="mta-${sid}">&#9660;</span> ${t('labels.monthly')}` +
            `</button>` +
            `<div class="monthly-table" id="mt-${sid}">` +
            `<table>` +
            `<thead><tr>` +
            `<th>${t('table.month')}</th>` +
            `<th class="num" style="color:var(--green)">${t('table.free')} t</th>` +
            `<th class="num">${t('table.free')} p</th>` +
            `<th class="num" style="color:var(--teal)">${t('table.paid')} t</th>` +
            `<th class="num">${t('table.paid')} p</th>` +
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
            const cityGuides = guideStats26.filter(g => g.city === city);
            if (cityGuides.length === 0) return;
            const cls = CITY_CLS[city] || '';
            html += `<section class="city-section" data-city="${city}">`;
            html += `<div class="section-title ${cls}">${city}</div>`;
            html += `<div class="guide-grid">`;
            html += cityGuides.map(g => this.renderCard(g)).join('');
            html += `</div></section>`;
        });
        container.innerHTML = html;
        this.applySearchFilter();
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
            paidToursByCity[c] = fs.paidTours;
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
        const citiesToSum = this.activeCity === 'all' ? CITIES : [this.activeCity];
        const k = this.activeLang;
        let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
        citiesToSum.forEach(city => {
            const st = cityStats26[city]?.[k];
            if (!st) return;
            const fs = filteredStats(st, this.activeMonths);
            freeTours += fs.freeTours;
            paidTours += fs.paidTours;
            freePax   += fs.freePax;
            paidPax   += fs.paidPax;
        });
        this._el('kv-free-tours').textContent = freeTours;
        this._el('kv-free').textContent       = fmtN(freePax);
        this._el('kv-avg-pax').textContent    = freeTours > 0 ? (freePax / freeTours).toFixed(1) : '—';
        this._el('kv-paid').textContent       = paidTours;
    },

    filterCity(city) {
        this.activeCity = city;
        document.querySelectorAll('#page-26 .city-filter-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.city === city));
        this.renderAll();
    },
    filterLang(lang) { this.activeLang = lang; this.renderAll(); },
    filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },

    applySearchFilter() {
        const term = (this.searchTerm || '').toLowerCase();
        this._scope('.guide-card').forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            card.style.display = !term || name.includes(term) ? '' : 'none';
        });
    },
    filterGuideSearch(term) {
        this.searchTerm = term;
        this.applySearchFilter();
    },
    jumpToGuide(name) {
        const tabEl = document.getElementById('tab-26');
        if (tabEl) showPage('page-26', tabEl);
        this.activeCity = 'all';
        this.searchTerm = '';
        const searchInput = this._el('guide-search');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('#page-26 .city-filter-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.city === 'all'));
        this.renderAll();
        requestAnimationFrame(() => {
            const card = document.querySelector(`#page-26 .guide-card[data-name="${CSS.escape(name)}"]`);
            if (!card) return;
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('guide-card-highlight');
            setTimeout(() => card.classList.remove('guide-card-highlight'), 1500);
        });
    },

    toggleMonthly(sid) {
        const table = document.getElementById('mt-' + sid);
        const arrow = document.getElementById('mta-' + sid);
        if (!table) return;
        const open = table.classList.toggle('open');
        if (arrow) arrow.classList.toggle('open');
        table.previousElementSibling?.setAttribute('aria-expanded', String(open));
    },

    _buildHeader() {
        return `<div class="header">
            <div class="header-left">
                <h1>${t('table.tours')} <span class="accent">2026</span></h1>
                <p>Tour production by guide &middot; ${t('labels.freeTours')} vs. ${t('labels.paidTours')} &middot; <span class="ytd-range-label">${t('labels.ytdRange')}</span></p>
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
            <div class="filter-bar">
                <div class="city-pill-group">${cityPills}</div>
                <div class="filter-dropdowns">
                    <select class="filter-select" id="lang-filter-26" onchange="Page26.filterLang(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        <option value="eng">🇬🇧 ENG</option>
                        <option value="esp">🇪🇸 ESP</option>
                        <option value="fra">🇫🇷 FRA</option>
                    </select>
                    <select class="filter-select" id="month-filter-26" onchange="Page26.filterMonth(this.value)">
                        <option value="all">${t('labels.all')}</option>
                        ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].slice(0, getCutoffMonth()).map((n,i)=>`<option value="${i+1}">${n}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.freeToursPaxCount')} YTD</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-free-26">—</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.avgPaxPerFreeTour')}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-avg-pax-26">—</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t('labels.totalFreeTours')}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-free-tours-26">—</div></div>
                    </div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t('labels.paidToursCount')} YTD</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-paid-26">—</div></div>
                    </div>
                </div>
            </div>`;
    },

    _buildFreeTours() {
        return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('free-section-body-26')">
                <span>${t('sections.freeTours')}</span>
                <span class="section-chevron">▾</span>
            </button>
            <div id="free-section-body-26" class="section-body">
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
                <div class="charts-row">
                    <div id="monthly-pax-table-26"></div>
                </div>
            </div>`;
    },

    _buildPaidTours() {
        return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('paid-section-body-26')">
                <span>${t('sections.paidTours')}</span>
                <span class="section-chevron">▾</span>
            </button>
            <div id="paid-section-body-26" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr('charts.paidToursByCity26')}>${t('charts.paidToursByCity26')}</div>
                        <div class="chart-container"><canvas id="paidCityChart-26"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
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
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="privatePaidChart-26"></canvas></div>
                        <div id="private-type-table-26"></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr('charts.sharedPaidTours26')}>${t('charts.sharedPaidTours26')}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t('labels.type')}</span>
                                <div id="shared-type-pills-26" class="pill-group">
                                    <button class="pill active" onclick="Page26.filterSharedType('all',this)">${t('labels.all')}</button>
                                    <button class="pill" onclick="Page26.filterSharedType('war',this)">war</button>
                                    <button class="pill" onclick="Page26.filterSharedType('food',this)">food</button>
                                    <button class="pill" onclick="Page26.filterSharedType('best',this)">best</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="sharedPaidChart-26"></canvas></div>
                        <div id="shared-type-table-26"></div>
                    </div>
                </div>
            </div>`;
    },

    _buildGuides() {
        return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('guides-body-26')">
                <span>${t('labels.guides')}</span>
                <span class="section-chevron">▾</span>
            </button>
            <div id="guides-body-26" class="section-body">
                <input type="text" id="guide-search-26" class="guide-search-input"
                       placeholder="${t('labels.searchGuide')}"
                       oninput="Page26.filterGuideSearch(this.value)">
                <div id="guide-sections-26"></div>
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
            this._buildGuides();

        const d = new Date(getGlobalDate());
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

registerPage('Page26', Page26);
