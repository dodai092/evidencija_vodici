import { getRangeLabel } from '../../shared.js';
import { t } from '../../i18n.js';
import { _charts, clearKpiCache, axisDefaults, tooltipDefaults } from './helpers.js';
import { initPl, renderPlKpis, refreshPl } from './pl.js';
import { initGuides, renderGuideTable, mgmtSort as _mgmtSort, refreshGuides } from './guides.js';
import { initChannels, renderCommissionWaterfall, renderDirectOtaTrend, renderOtaSourceTable, renderTourTypeTable, refreshChannels } from './channels.js';
import { initOps, refreshOps } from './ops.js';
import { initCities, refreshCities } from './cities.js';

// ── Router state ──────────────────────────────────────────────────────────────

const MgmtPages = {
    pl:       { _init: false },
    guides:   { _init: false },
    channels: { _init: false },
    ops:      { _init: false },
    cities:   { _init: false },
};

let _activeTab  = 'pl';
let _activeCity = 'all';

// ── Tab routing ───────────────────────────────────────────────────────────────

export function mgmtShowTab(id, el) {
    document.querySelectorAll(`.mgmt-page`).forEach(p => p.classList.remove('active'));
    document.querySelectorAll(`.mgmt-subnav .nav-tab`).forEach(tp => tp.classList.remove('active', 'mgmt-tab-active'));
    document.getElementById('mgmt-' + id).classList.add('active');
    el.classList.add('active', 'mgmt-tab-active');
    _activeTab = id;

    if (id !== 'pl') {
        const bar = document.getElementById('sticky-kpi-bar');
        if (bar) bar.style.display = 'none';
    }

    if (!MgmtPages[id]._init) {
        if (id === 'pl')       initPl(_activeCity);
        if (id === 'guides')   initGuides(_activeCity);
        if (id === 'channels') initChannels();
        if (id === 'ops')      initOps();
        if (id === 'cities')   initCities();
        MgmtPages[id]._init = true;
    }
}

// ── City filter ───────────────────────────────────────────────────────────────

export function mgmtFilterCityPl(city) {
    _activeCity = city;
    document.querySelectorAll('.city-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.city === city);
    });
    clearKpiCache();
    if (MgmtPages.pl._init)     renderPlKpis(city);
    if (MgmtPages.guides._init) renderGuideTable(city);
}

// ── Sort (re-export from guides.js) ──────────────────────────────────────────

export const mgmtSort = _mgmtSort;

// ── Date change refresh ───────────────────────────────────────────────────────

export function mgmtRefreshAll() {
    clearKpiCache();
    if (MgmtPages.pl._init)       refreshPl(_activeCity);
    if (MgmtPages.guides._init)   refreshGuides(_activeCity);
    if (MgmtPages.channels._init) refreshChannels();
    if (MgmtPages.ops._init)      refreshOps();
    if (MgmtPages.cities._init)   refreshCities();
}

// ── Theme update ──────────────────────────────────────────────────────────────

export function mgmtUpdateCharts() {
    const ax = axisDefaults();
    const tt = tooltipDefaults();
    Object.values(_charts).forEach(c => {
        if (c.options.scales) {
            Object.values(c.options.scales).forEach(sc => {
                if (sc.ticks) sc.ticks.color = ax.ticks.color;
                if (sc.grid)  sc.grid.color  = ax.grid.color;
            });
        }
        if (c.options.plugins?.tooltip) Object.assign(c.options.plugins.tooltip, tt);
        if (c.options.plugins?.legend?.labels) c.options.plugins.legend.labels.color = ax.ticks.color;
        c.update();
    });
}

// ── Language update ───────────────────────────────────────────────────────────

export function updateManagementTabs() {
    const tabs = {
        'tab-pl':       t('management.profitAndLoss'),
        'tab-guides':   t('management.guides'),
        'tab-channels': t('management.channels'),
        'tab-ops':      t('management.operational'),
        'tab-cities':   t('management.cities'),
    };
    Object.entries(tabs).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });

    if (_activeTab === 'pl'       && MgmtPages.pl._init)       renderPlKpis(_activeCity);
    else if (_activeTab === 'guides'   && MgmtPages.guides._init)   renderGuideTable(_activeCity);
    else if (_activeTab === 'channels' && MgmtPages.channels._init) { renderCommissionWaterfall(); renderDirectOtaTrend(); renderOtaSourceTable(); renderTourTypeTable(); }
    else if (_activeTab === 'ops'      && MgmtPages.ops._init)      refreshOps();
    else if (_activeTab === 'cities'   && MgmtPages.cities._init)   refreshCities();
}

// ── Page object ───────────────────────────────────────────────────────────────

export const PageMgmt = {
    _initialized: false,
    init() {
        const footerDate = document.getElementById('footer-date');
        if (footerDate) footerDate.textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const tabEl = document.getElementById('tab-pl');
        if (tabEl) mgmtShowTab('pl', tabEl);
        this._initialized = true;
    },
    renderAll() {
        mgmtRefreshAll();
    },
};
