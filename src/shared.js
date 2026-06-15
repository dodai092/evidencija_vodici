export function getCityColor(city) {
    if (!city || city === 'Unknown') return '#999999';
    return getComputedStyle(document.documentElement).getPropertyValue('--' + city.toLowerCase()).trim() || '#999999';
}

export function getChartColors() {
    const s = getComputedStyle(document.documentElement);
    const tok = n => s.getPropertyValue(n).trim();
    return { text: tok('--text'), text3: tok('--text3'), border: tok('--border'), y25: tok('--y25'), y26: tok('--y26') };
}
export const CITY_CLS  = { Zagreb:'zagreb', Dubrovnik:'dubrovnik', Split:'split', Zadar:'zadar', Unknown:'' };
export const CITIES    = ['Zagreb','Dubrovnik','Split','Zadar'];
export const MONTH_NAMES_HR = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

export const CSS = {
    ACTIVE: 'active',
    NAV_Y25: 'y25',
    NAV_Y26: 'y26',
    NAV_CMP: 'cmp',
    PAGE: 'page',
    MGMT_PAGE: 'mgmt-page',
    NAV_TAB: 'nav-tab',
    MGMT_TAB_ACTIVE: 'mgmt-tab-active',
    DARK_MODE: 'dark-mode',
};

export const PAGES = {
    Page25: null,
    Page26: null,
    PageCmp: null,
    PageMgmt: null,
};

export function registerPage(name, page) {
    if (Object.prototype.hasOwnProperty.call(PAGES, name)) {
        PAGES[name] = page;
    }
}

const _today = new Date();
export let GLOBAL_DATE = `${_today.getFullYear()}-${String(_today.getMonth()+1).padStart(2,'0')}-${String(_today.getDate()).padStart(2,'0')}`;
export let GLOBAL_LANGUAGE = 'en';

export function setGlobalDate(v)     { GLOBAL_DATE = v; }
export function getGlobalDate()      { return GLOBAL_DATE; }
export function setGlobalLanguage(v) { GLOBAL_LANGUAGE = v; }
export function getGlobalLanguage()  { return GLOBAL_LANGUAGE; }

export function safeName(n) { return n.replace(/[^a-zA-Z0-9]/g,'_'); }
export function fmtN(v) { return Math.round(v).toLocaleString('en-GB'); }

export function getCutoffMonth() {
    return parseInt(GLOBAL_DATE.split('-')[1]);
}

export function parseGlobalDate() {
    const [y, m, d] = GLOBAL_DATE.split('-');
    return { year: parseInt(y), month: parseInt(m), day: parseInt(d) };
}

export function getRangeLabel() {
    const m = getCutoffMonth();
    if (m === 1) return 'Jan';
    return `Jan–${MONTH_NAMES_HR[m]}`;
}

export function updateDateAsOf(val) {
    GLOBAL_DATE = val;
    const d = new Date(val);
    const fmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    document.querySelectorAll('[id^="date-pov-"]').forEach(el => el.textContent = fmt);
    document.querySelectorAll('.ytd-range-label').forEach(el => el.textContent = getRangeLabel());
    document.querySelectorAll('select[id^="month-filter-"]').forEach(sel => sel.value = 'all');
    Object.values(PAGES).forEach(page => {
        if (page) page.activeMonths = [];
    });

    requestAnimationFrame(() => {
        if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.renderAll();
        if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.renderAll();
        if (PAGES.PageCmp && PAGES.PageCmp._initialized) {
            PAGES.PageCmp.mergedGuides = PAGES.PageCmp.buildMerged();
            PAGES.PageCmp.renderAll();
        }
        if (PAGES.PageMgmt?._initialized) PAGES.PageMgmt.renderAll();
    });
}

export function filteredStats(st, months) {
    const cutoffMonth = getCutoffMonth();
    const cutoffDay   = parseInt(GLOBAL_DATE.split('-')[2]);
    const activeMonths = (months && months.length > 0)
        ? months
        : Array.from({length: cutoffMonth}, (_, i) => i + 1);

    return activeMonths.reduce((acc, m) => {
        if (m < cutoffMonth) {
            const mo = st.byMonth[String(m)];
            if (mo) {
                acc.freeTours += mo.free.tours || 0;
                acc.freePax   += mo.free.pax   || 0;
                acc.paidTours += mo.paid.tours || 0;
                acc.paidPax   += mo.paid.pax   || 0;
            }
        } else if (m === cutoffMonth && st.byDay) {
            for (let d = 1; d <= cutoffDay; d++) {
                const dy = st.byDay[`${m}-${d}`];
                if (dy) {
                    acc.freeTours += dy.free.tours || 0;
                    acc.freePax   += dy.free.pax   || 0;
                    acc.paidTours += dy.paid.tours || 0;
                    acc.paidPax   += dy.paid.pax   || 0;
                }
            }
        } else if (m === cutoffMonth) {
            const mo = st.byMonth[String(m)];
            if (mo) {
                acc.freeTours += mo.free.tours || 0;
                acc.freePax   += mo.free.pax   || 0;
                acc.paidTours += mo.paid.tours || 0;
                acc.paidPax   += mo.paid.pax   || 0;
            }
        }
        return acc;
    }, { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 });
}

export function toggleSection(id) {
    const body = document.getElementById(id);
    if (!body) return;
    const collapsed = body.classList.toggle('collapsed');
    const chevron = body.previousElementSibling?.querySelector('.section-chevron');
    if (chevron) chevron.textContent = collapsed ? '▸' : '▾';
    body.previousElementSibling?.setAttribute('aria-expanded', String(!collapsed));
}

export function showPage(id, tab) {
    document.querySelectorAll(`.${CSS.PAGE}`).forEach(p => p.classList.remove(CSS.ACTIVE));
    document.querySelectorAll(`.nav-tabs .${CSS.NAV_TAB}`).forEach(t => {
        t.classList.remove(CSS.ACTIVE, CSS.NAV_Y25, CSS.NAV_Y26, CSS.NAV_CMP);
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });
    document.getElementById(id).classList.add(CSS.ACTIVE);
    tab.classList.add(CSS.ACTIVE);
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    if (id === 'page-25')  tab.classList.add(CSS.NAV_Y25);
    if (id === 'page-26')  tab.classList.add(CSS.NAV_Y26);
    if (id === 'page-cmp') tab.classList.add(CSS.NAV_CMP);

    const titles = {
        'page-25': 'Guides 2025', 'page-26': 'Guides 2026',
        'page-cmp': 'Comparison 25/26', 'page-mgmt': 'Management',
    };
    document.title = `${titles[id] || 'Guide Production'} · FreeSpirit`;

    if (id === 'page-25'  && PAGES.Page25 && !PAGES.Page25._initialized)  PAGES.Page25.init();
    if (id === 'page-26'  && PAGES.Page26 && !PAGES.Page26._initialized)  PAGES.Page26.init();
    if (id === 'page-cmp' && PAGES.PageCmp && !PAGES.PageCmp._initialized)  PAGES.PageCmp.init();
    else if (id === 'page-cmp' && PAGES.PageCmp) setTimeout(() => PAGES.PageCmp.updateCharts(), 50);
    if (id === 'page-mgmt' && PAGES.PageMgmt) {
        if (!PAGES.PageMgmt._initialized) PAGES.PageMgmt.init();
        else PAGES.PageMgmt.renderAll();
    }
}
