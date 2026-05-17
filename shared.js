const CITY_COLS = { Zagreb:'#8FA8BC', Dubrovnik:'#C49A8A', Split:'#9BB09B', Zadar:'#C4B48A', Unknown:'#999999' };
const CITY_CLS  = { Zagreb:'zagreb', Dubrovnik:'dubrovnik', Split:'split', Zadar:'zadar', Unknown:'' };
const CITIES    = ['Zagreb','Dubrovnik','Split','Zadar'];
const MONTH_NAMES_HR = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};

// CSS class names — single source of truth for navigation and tab styling
const CSS = {
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

const _today = new Date();
let GLOBAL_DATE = `${_today.getFullYear()}-${String(_today.getMonth()+1).padStart(2,'0')}-${String(_today.getDate()).padStart(2,'0')}`;

// Initialize dark mode from localStorage once at page load
(function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
    }
})();

function safeName(n) { return n.replace(/[^a-zA-Z0-9]/g,'_'); }
function fmtN(v) { return Math.round(v).toLocaleString('en-GB'); }

function getCutoffMonth() {
    return parseInt(GLOBAL_DATE.split('-')[1]);
}

function parseGlobalDate() {
    const [y, m, d] = GLOBAL_DATE.split('-');
    return { year: parseInt(y), month: parseInt(m), day: parseInt(d) };
}

function getRangeLabel() {
    const m = getCutoffMonth();
    if (m === 1) return 'Jan';
    return `Jan\u2013${MONTH_NAMES_HR[m]}`;
}

function updateDateAsOf(val) {
    GLOBAL_DATE = val;
    const d = new Date(val);
    const fmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Update all headers
    document.querySelectorAll('[id^="date-pov-"]').forEach(el => el.textContent = fmt);
    document.querySelectorAll('.ytd-range-label').forEach(el => el.textContent = getRangeLabel());

    // Reset month dropdowns and filter state
    document.querySelectorAll('select[id^="month-filter-"]').forEach(sel => sel.value = 'all');
    if (typeof Page25 !== 'undefined') Page25.activeMonths = [];
    if (typeof Page26 !== 'undefined') Page26.activeMonths = [];
    if (typeof PageCmp !== 'undefined') PageCmp.activeMonths = [];

    // Refresh ALL initialized pages (not just active)
    requestAnimationFrame(() => {
        if (typeof Page25 !== 'undefined' && Page25._initialized)  Page25.renderAll();
        if (typeof Page26 !== 'undefined' && Page26._initialized)  Page26.renderAll();
        if (typeof PageCmp !== 'undefined' && PageCmp._initialized) {
            PageCmp.mergedGuides = PageCmp.buildMerged();
            PageCmp.renderAll();
        }
    });
}

function filteredStats(st, months) {
    const cutoffMonth = getCutoffMonth();
    const cutoffDay   = parseInt(GLOBAL_DATE.split('-')[2]);
    const activeMonths = (months && months.length > 0)
        ? months
        : Array.from({length: cutoffMonth}, (_, i) => i + 1);

    return activeMonths.reduce((acc, m) => {
        if (m < cutoffMonth) {
            // Complete months — use byMonth aggregate
            const mo = st.byMonth[String(m)];
            if (mo) {
                acc.freeTours += mo.free.tours || 0;
                acc.freePax   += mo.free.pax   || 0;
                acc.paidTours += mo.paid.tours || 0;
                acc.paidPax   += mo.paid.pax   || 0;
            }
        } else if (m === cutoffMonth && st.byDay) {
            // Partial month — sum individual days up to cutoffDay
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
            // Fallback: byDay absent (old data) — use full month
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

function updateThemeButton(isDark) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

function toggleTheme(onToggleComplete) {
    const isDark = document.body.classList.toggle(CSS.DARK_MODE);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButton(isDark);

    if (onToggleComplete) {
        setTimeout(onToggleComplete, 100);
    } else {
        // Default: update all page charts if no callback provided
        setTimeout(() => {
            if (typeof Page25 !== 'undefined' && Page25._initialized) Page25.updateChart();
            if (typeof Page26 !== 'undefined' && Page26._initialized) Page26.updateChart();
            if (typeof PageCmp !== 'undefined' && PageCmp._initialized) PageCmp.updateCharts();
        }, 100);
    }
}

function toggleSection(id) {
    const body = document.getElementById(id);
    if (!body) return;
    const collapsed = body.classList.toggle('collapsed');
    const chevron = body.previousElementSibling?.querySelector('.section-chevron');
    if (chevron) chevron.textContent = collapsed ? '▸' : '▾';
}

function showPage(id, tab) {
    document.querySelectorAll(`.${CSS.PAGE}`).forEach(p => p.classList.remove(CSS.ACTIVE));
    document.querySelectorAll(`.${CSS.NAV_TAB}`).forEach(t => t.classList.remove(CSS.ACTIVE, CSS.NAV_Y25, CSS.NAV_Y26, CSS.NAV_CMP));
    document.getElementById(id).classList.add(CSS.ACTIVE);
    tab.classList.add(CSS.ACTIVE);
    if (id === 'page-25')  tab.classList.add(CSS.NAV_Y25);
    if (id === 'page-26')  tab.classList.add(CSS.NAV_Y26);
    if (id === 'page-cmp') tab.classList.add(CSS.NAV_CMP);
    if (id === 'page-25'  && !Page25._initialized)  Page25.init();
    if (id === 'page-26'  && !Page26._initialized)   Page26.init();
    if (id === 'page-cmp' && !PageCmp._initialized)  PageCmp.init();
    else if (id === 'page-cmp') setTimeout(() => PageCmp.updateCharts(), 50);
}
