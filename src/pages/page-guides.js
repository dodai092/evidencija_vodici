import {
    CITIES, CITY_CLS, getCityColor, MONTH_NAMES_HR,
    fmtN, getCutoffMonth, getGlobalDate, getRangeLabel, parseGlobalDate,
    registerPage, safeName, showPage,
} from '../shared.js';
import { t } from '../i18n.js';
import {
    mergeGuides, buildGuideRows, sumRows, filterByName, rankGuides,
    pctLabel, TABLE_METRICS,
    guideMonthlyTrend, guideMonthlyDetail, guideTypeMix,
} from '../guide-table.js';
import { createGuideTrendChart } from './page-cmp/charts.js';

export const PageGuides = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    activeSort: 'default',
    guideQuery: '',
    guideView: 'cards',
    guideTrendChartInstance: null,
    _detailTrigger: null,
    _initialized: false,

    _el(id) { return document.getElementById(id + '-gd'); },
    // Read from body: the dark-mode variables are defined on body.dark-mode, not :root.
    getChartColors() {
        const cs = getComputedStyle(document.body);
        const tok = n => cs.getPropertyValue(n).trim();
        return { text: tok('--text'), text3: tok('--text3'), border: tok('--border'), y25: tok('--y25'), y26: tok('--y26') };
    },

    _setActivePill(groupId, activeBtn) {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    },

    // Month options depend on the as-of date, so they are rebuilt on every render.
    _syncMonthOptions() {
        const sel = this._el('month-filter');
        if (!sel) return;
        const current = this.activeMonths.length ? String(this.activeMonths[0]) : 'all';
        sel.innerHTML = `<option value="all">${t('labels.all')}</option>` +
            Array.from({ length: getCutoffMonth() }, (_, i) => `<option value="${i + 1}">${MONTH_NAMES_HR[i + 1]}</option>`).join('');
        sel.value = current;
    },

    _deltaBadge(d) {
        if (d.v25 === 0 && d.v26 === 0) return '<span class="dash">—</span>';
        if (d.pct === null) return `<span class="delta pos">${t('labels.badgeNew').toUpperCase()}</span>`;
        const cls = d.delta > 0 ? 'pos' : d.delta < 0 ? 'neg' : 'neu';
        const sym = d.delta > 0 ? '▲' : d.delta < 0 ? '▼' : '=';
        return `<span class="delta ${cls}">${sym}${fmtN(Math.abs(d.delta))} (${pctLabel(d)})</span>`;
    },

    cardHtml(r, m, extra = {}) {
        const col = getCityColor(r.city);
        const rank = extra.rank ? `<span class="gc-rank">#${extra.rank}</span>` : '';
        const badges =
            (r.isNew ? `<span class="gc-badge gc-badge-new">${t('labels.badgeNew')}</span>` : '') +
            (r.stopped ? `<span class="gc-badge">${t('labels.badgeInactive')}</span>` : '');
        const line = (labelKey, d) =>
            `<tr><td class="label">${t(labelKey)}</td>` +
            `<td class="v25">${m.g25 ? fmtN(d.v25) : '—'}</td>` +
            `<td class="v26">${m.g26 ? fmtN(d.v26) : '—'}</td>` +
            `<td class="delta">${m.g25 && m.g26 ? this._deltaBadge(d) : '—'}</td></tr>`;

        return `<div class="guide-card ${m.g26 ? '' : 'inactive'}" role="button" tabindex="0" aria-label="${r.name}" data-city="${r.city}" data-name="${safeName(r.name)}">` +
            `<div class="gc-stripe" style="background:${col}"></div>` +
            `<div class="gc-body">` +
            `<div class="gc-header">` +
            `${rank}` +
            `<span class="gc-name">${r.name}</span>` +
            `${badges}` +
            `</div>` +
            `<table class="gc-cmp-table"><tbody>` +
            line('labels.freeT', r.freeTours) +
            line('labels.freeP', r.freePax) +
            line('labels.paidT', r.paidTours) +
            `</tbody></table>` +
            `</div></div>`;
    },

    renderAll() {
        this._syncMonthOptions();
        const merged = mergeGuides(guideStats25, guideStats26)
            .filter(m => CITIES.includes(m.city) && (this.activeCity === 'all' || m.city === this.activeCity));
        const byName = new Map(merged.map(m => [m.name, m]));
        const rows = buildGuideRows(merged, this.activeLang, this.activeMonths);
        const shown = rankGuides(filterByName(rows, this.guideQuery), this.activeSort);
        const ranked = this.activeSort === 'freePax' || this.activeSort === 'paid';
        const cardFor = (r, i) => this.cardHtml(r, byName.get(r.name), { rank: ranked ? i + 1 : null });

        let html;
        if (!shown.length) {
            html = `<div class="guide-empty">${t('labels.noGuidesFound')}</div>`;
        } else if (this.guideView === 'table') {
            html = this.guideTableHtml(shown, sumRows(rows));
        } else if (this.activeSort === 'default') {
            html = '';
            CITIES.forEach(city => {
                const inCity = shown.filter(r => r.city === city);
                if (!inCity.length) return;
                html += `<section class="city-section" data-city="${city}">` +
                    `<div class="section-title ${CITY_CLS[city] || ''}">${city}</div>` +
                    `<div class="guide-grid">${inCity.map(cardFor).join('')}</div>` +
                    `</section>`;
            });
        } else {
            html = `<section class="city-section"><div class="guide-grid">${shown.map(cardFor).join('')}</div></section>`;
        }
        this._el('guide-sections').innerHTML = html;
    },

    filterCity(city) {
        this.activeCity = city;
        document.querySelectorAll('#page-gd .city-filter-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.city === city));
        this.renderAll();
    },
    filterLang(lang) {
        this.activeLang = lang;
        document.querySelectorAll('#page-gd .lang-pill').forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
        this.renderAll();
    },
    filterMonth(m)   { this.activeMonths = m === 'all' ? [] : [parseInt(m)]; this.renderAll(); },

    setGuideSort(value, btn) {
        this.activeSort = value;
        this._setActivePill('guide-sort-pills-gd', btn);
        this.renderAll();
    },

    setGuideQuery(value) {
        this.guideQuery = value;
        this.renderAll();
    },

    setGuideView(view) {
        this.guideView = view;
        this._el('guide-view-cards').classList.toggle('active', view === 'cards');
        this._el('guide-view-table').classList.toggle('active', view === 'table');
        this.renderAll();
    },

    _typeMixHtml(mix) {
        if (!mix.length) return '';
        const maxT = Math.max(...mix.map(x => Math.max(x.t25, x.t26)), 1);
        const bar = (tours, pax, cls, year) =>
            `<div class="type-bar-row"><span class="type-lbl">${year}</span>` +
            `<div class="type-track"><div class="type-fill ${cls}" style="width:${(tours / maxT * 100).toFixed(0)}%"></div></div>` +
            `<span class="type-val">${tours}t &middot; ${pax}p</span></div>`;
        return mix.map(x =>
            `<div class="guide-type-group"><div class="guide-type-name">${x.type}</div>` +
            `${bar(x.t25, x.p25, 'y25', '2025')}${bar(x.t26, x.p26, 'y26', '2026')}</div>`).join('');
    },

    _monthlyTableHtml(detail) {
        const zero = { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 };
        const any = (s) => s && (s.freeTours || s.freePax || s.paidTours || s.paidPax);
        const cells = (s) => s
            ? `<td>${s.freeTours}</td><td>${s.freePax}</td><td>${s.paidTours}</td><td>${s.paidPax}</td>`
            : '<td>—</td><td>—</td><td>—</td><td>—</td>';
        const rows = detail.filter(r => any(r.y25) || any(r.y26));
        if (!rows.length) return '';
        const sum = (key) => detail.reduce((a, r) => {
            const s = r[key] || zero;
            return { freeTours: a.freeTours + s.freeTours, freePax: a.freePax + s.freePax, paidTours: a.paidTours + s.paidTours, paidPax: a.paidPax + s.paidPax };
        }, zero);
        const sub = `<th class="mpax-sub-head">${t('table.free')} t</th><th class="mpax-sub-head">${t('table.free')} p</th><th class="mpax-sub-head">${t('table.paid')} t</th><th class="mpax-sub-head">${t('table.paid')} p</th>`;
        return `<div class="mpax-wrap"><table class="mpax-table">` +
            `<thead><tr><th class="mpax-month-head" rowspan="2">${t('table.month')}</th><th colspan="4" class="mpax-city-head">2025</th><th colspan="4" class="mpax-city-head">2026</th></tr><tr>${sub}${sub}</tr></thead>` +
            `<tbody>${rows.map(r => `<tr><td class="mpax-month">${MONTH_NAMES_HR[r.month]}</td>${cells(r.y25)}${cells(r.y26)}</tr>`).join('')}` +
            `<tr class="mpax-total"><td class="mpax-month">${t('labels.total')}</td>${cells(sum('y25'))}${cells(sum('y26'))}</tr></tbody>` +
            `</table></div>`;
    },

    openGuideDetail(safeKey, trigger) {
        const m = mergeGuides(guideStats25, guideStats26).find(x => safeName(x.name) === safeKey);
        if (!m) return;
        this._detailTrigger = trigger;
        this._el('guide-detail-name').textContent = m.name;
        this._el('guide-detail-city').textContent = m.city;
        this._el('guide-detail-note').textContent = `${t('labels.modalNote')} ${getGlobalDate()}`;
        this._el('guide-detail-backdrop').classList.add('open');
        this._el('guide-detail-modal').classList.add('open');
        this._el('guide-detail-close').focus();

        const cutoffMonth = getCutoffMonth();
        const cutoffDay = parseGlobalDate().day;
        this._el('guide-detail-types').innerHTML = this._typeMixHtml(guideTypeMix(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay));
        this._el('guide-detail-months').innerHTML = this._monthlyTableHtml(guideMonthlyDetail(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay));

        const trend = guideMonthlyTrend(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay);
        if (this.guideTrendChartInstance) this.guideTrendChartInstance.destroy();
        this.guideTrendChartInstance = createGuideTrendChart(
            this._el('guideTrendChart').getContext('2d'),
            trend.map(x => MONTH_NAMES_HR[x.month]),
            trend.map(x => x.pax25),
            trend.map(x => x.pax26),
            this.getChartColors(),
        );
    },

    closeGuideDetail() {
        const modal = this._el('guide-detail-modal');
        if (!modal || !modal.classList.contains('open')) return;
        modal.classList.remove('open');
        this._el('guide-detail-backdrop').classList.remove('open');
        if (this.guideTrendChartInstance) { this.guideTrendChartInstance.destroy(); this.guideTrendChartInstance = null; }
        if (this._detailTrigger && document.contains(this._detailTrigger)) this._detailTrigger.focus();
        this._detailTrigger = null;
    },

    jumpToGuide(name) {
        this.activeCity = 'all';
        this.guideQuery = '';
        this.activeSort = 'default';
        this.guideView = 'cards';
        const wasInitialized = this._initialized;
        showPage('page-gd', document.getElementById('tab-gd'));
        if (wasInitialized) { this.rebuildStructure(); this.renderAll(); }
        requestAnimationFrame(() => {
            const card = document.querySelector(`#page-gd .guide-card[data-name="${CSS.escape(safeName(name))}"]`);
            if (!card) return;
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('guide-card-highlight');
            setTimeout(() => card.classList.remove('guide-card-highlight'), 1500);
        });
    },

    _deltaCells(d) {
        const cls = d.delta > 0 ? 'pos' : d.delta < 0 ? 'neg' : 'neu';
        const sign = d.delta > 0 ? '+' : '';
        return `<td>${fmtN(d.v25)}</td><td>${fmtN(d.v26)}</td>` +
            `<td><span class="${cls}">${sign}${fmtN(d.delta)}</span></td>` +
            `<td><span class="${cls}">${pctLabel(d, t('labels.badgeNew'))}</span></td>`;
    },

    guideTableHtml(shown, totalRow) {
        const heads = { freeTours: 'labels.freeTours', freePax: 'labels.freePax', paidTours: 'labels.paidTours' };
        const groupHeads = TABLE_METRICS.map(k => `<th colspan="4" class="mpax-city-head gd-group-head">${t(heads[k])}</th>`).join('');
        const subHeads = TABLE_METRICS.map(() =>
            `<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">±</th><th class="mpax-sub-head">±%</th>`).join('');
        const body = shown.map(r =>
            `<tr><td class="mpax-month">${r.name} <span class="gd-city">${r.city}</span></td>${TABLE_METRICS.map(k => this._deltaCells(r[k])).join('')}</tr>`).join('');
        const foot = `<tr class="mpax-total"><td class="mpax-month">${t('labels.total')}</td>${TABLE_METRICS.map(k => this._deltaCells(totalRow[k])).join('')}</tr>`;
        return `<div class="chart-card"><div class="mpax-wrap"><table class="mpax-table" id="guide-table-gd">` +
            `<thead><tr><th class="mpax-month-head" rowspan="2">${t('labels.guide')}</th>${groupHeads}</tr><tr>${subHeads}</tr></thead>` +
            `<tbody>${body}${foot}</tbody></table></div>` +
            `<div class="mpax-note">${t('labels.guideTotalNote')}</div></div>`;
    },

    _buildHeader() {
        return `<div class="header">
            <div class="header-left">
                <h1>${t('labels.guides')} <span class="accent">25/26</span></h1>
                <p><span class="ytd-range-label">${getRangeLabel()}</span> 2025 vs. 2026 &middot; ${t('sections.productionByGuide')}</p>
            </div>
            <div class="header-right">
                <div id="date-pov-gd" class="mb-6"></div>
                <div class="header-badge">${t('sections.comparisonYtd')}</div>
            </div>
        </div>`;
    },

    _buildFilters() {
        const cityPills = ['all', ...CITIES].map(c => {
            const col = getCityColor(c);
            const label = c === 'all' ? t('labels.all') : c;
            const active = this.activeCity === c ? ' active' : '';
            const style = col ? ` style="--city-col:${col}"` : '';
            return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="PageGuides.filterCity('${c}')">${label}</button>`;
        }).join('');
        const pill = (value, key) =>
            `<button class="pill${this.activeSort === value ? ' active' : ''}" data-value="${value}" onclick="PageGuides.setGuideSort('${value}',this)">${t(key)}</button>`;

        return `<div class="main">
            <div class="filter-bar">
                <div class="city-pill-group">${cityPills}</div>
                <div class="filter-dropdowns">
                    <div class="city-pill-group lang-pill-group" id="lang-filter-gd" role="group" aria-label="${t('labels.language')}">
                        ${[['all', t('labels.all')], ['eng', 'ENG'], ['esp', 'ESP'], ['oth', 'OTH']].map(([v, label]) =>
                            `<button class="city-filter-pill lang-pill${this.activeLang === v ? ' active' : ''}" data-lang="${v}" onclick="PageGuides.filterLang('${v}')">${label}</button>`).join('')}
                    </div>
                    <div class="filter-field">
                        <label class="filter-label" for="month-filter-gd">${t('labels.mo')}</label>
                        <select class="filter-select" id="month-filter-gd" onchange="PageGuides.filterMonth(this.value)"></select>
                    </div>
                </div>
            </div>
            <div class="guide-tools">
                <div id="guide-sort-pills-gd" class="pill-group">
                    ${pill('default', 'labels.sortDefault')}${pill('name', 'labels.sortName')}${pill('freePax', 'labels.sortFreePax')}${pill('paid', 'labels.sortPaid')}
                </div>
                <input type="text" id="guide-search-gd" class="guide-search" placeholder="${t('labels.searchGuide')}" oninput="PageGuides.setGuideQuery(this.value)">
                <div class="pill-group" id="guide-view-pills-gd">
                    <button class="pill${this.guideView === 'cards' ? ' active' : ''}" id="guide-view-cards-gd" onclick="PageGuides.setGuideView('cards')">${t('labels.viewCards')}</button>
                    <button class="pill${this.guideView === 'table' ? ' active' : ''}" id="guide-view-table-gd" onclick="PageGuides.setGuideView('table')">${t('labels.viewTable')}</button>
                </div>
            </div>
            <div id="guide-sections-gd"></div>
        </div>`;
    },

    // Mounted on body, not inside the page: .page.active keeps a transform from its
    // entry animation, which would make it the containing block of position:fixed.
    _mountModal() {
        document.querySelectorAll('#guide-detail-backdrop-gd, #guide-detail-modal-gd').forEach(el => el.remove());
        document.body.insertAdjacentHTML('beforeend', `
            <div class="guide-detail-backdrop" id="guide-detail-backdrop-gd"></div>
            <div class="guide-detail-modal" id="guide-detail-modal-gd" role="dialog" aria-modal="true" aria-labelledby="guide-detail-name-gd">
                <button class="guide-detail-close" id="guide-detail-close-gd" aria-label="Close">&times;</button>
                <div class="guide-detail-head">
                    <h3 id="guide-detail-name-gd"></h3>
                    <span id="guide-detail-city-gd" class="guide-detail-city"></span>
                </div>
                <div class="guide-detail-note" id="guide-detail-note-gd"></div>
                <div class="guide-detail-chart-wrap"><canvas id="guideTrendChart-gd"></canvas></div>
                <div class="guide-detail-section-title">${t('labels.tourType')}</div>
                <div id="guide-detail-types-gd"></div>
                <div class="guide-detail-section-title">${t('labels.monthly')}</div>
                <div id="guide-detail-months-gd"></div>
            </div>
        `);
    },

    rebuildStructure() {
        this.closeGuideDetail();
        document.getElementById('page-gd').innerHTML = this._buildHeader() + this._buildFilters();
        this._mountModal();

        this._el('lang-filter').value = this.activeLang;
        this._el('guide-search').value = this.guideQuery;
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

        const root = document.getElementById('page-gd');
        root.addEventListener('click', (e) => {
            const card = e.target.closest('.guide-card');
            if (card) this.openGuideDetail(card.dataset.name, card);
        });
        document.addEventListener('click', (e) => {
            if (e.target.id === 'guide-detail-backdrop-gd' || e.target.id === 'guide-detail-close-gd') this.closeGuideDetail();
        });
        root.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('guide-card')) {
                e.preventDefault();
                this.openGuideDetail(e.target.dataset.name, e.target);
            }
        });
        document.addEventListener('keydown', (e) => {
            const modal = this._el('guide-detail-modal');
            if (!modal || !modal.classList.contains('open')) return;
            if (e.key === 'Escape' || /^[1-5]$/.test(e.key)) this.closeGuideDetail();
            if (e.key === 'Tab') { e.preventDefault(); this._el('guide-detail-close').focus(); }
        });
    },
};

registerPage('PageGuides', PageGuides);
