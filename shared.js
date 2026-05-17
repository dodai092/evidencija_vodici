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

// Page registry — formal definition of available page modules
const PAGES = {
    Page25: null,
    Page26: null,
    PageCmp: null,
};

// Initialize page registry (pages will register themselves when loaded)
function registerPage(name, page) {
    if (PAGES.hasOwnProperty(name)) {
        PAGES[name] = page;
    }
}

const _today = new Date();
let GLOBAL_DATE = `${_today.getFullYear()}-${String(_today.getMonth()+1).padStart(2,'0')}-${String(_today.getDate()).padStart(2,'0')}`;
let GLOBAL_LANGUAGE = 'en';

// Initialize dark mode from localStorage once at page load
(function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
    }
})();

// Initialize language from localStorage once at page load
(function initLanguage() {
    GLOBAL_LANGUAGE = localStorage.getItem('language') || 'en';
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
    Object.values(PAGES).forEach(page => {
        if (page) page.activeMonths = [];
    });

    // Refresh ALL initialized pages (not just active)
    requestAnimationFrame(() => {
        if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.renderAll();
        if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.renderAll();
        if (PAGES.PageCmp && PAGES.PageCmp._initialized) {
            PAGES.PageCmp.mergedGuides = PAGES.PageCmp.buildMerged();
            PAGES.PageCmp.renderAll();
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
            if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.updateChart();
            if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.updateChart();
            if (PAGES.PageCmp && PAGES.PageCmp._initialized) PAGES.PageCmp.updateCharts();
        }, 100);
    }
}

function toggleLanguage() {
    GLOBAL_LANGUAGE = GLOBAL_LANGUAGE === 'en' ? 'hr' : 'en';
    localStorage.setItem('language', GLOBAL_LANGUAGE);
    updateLanguageButton();
    updateNavigationLabels();

    // Re-render all initialized pages
    requestAnimationFrame(() => {
        if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.renderAll();
        if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.renderAll();
        if (PAGES.PageCmp && PAGES.PageCmp._initialized) {
            PAGES.PageCmp.mergedGuides = PAGES.PageCmp.buildMerged();
            PAGES.PageCmp.renderAll();
            PAGES.PageCmp.updateCharts();
        }
    });
}

function updateLanguageButton() {
    const btn = document.getElementById('language-toggle');
    if (btn) {
        btn.textContent = GLOBAL_LANGUAGE === 'en' ? '🇭🇷' : '🇬🇧';
        btn.setAttribute('title', GLOBAL_LANGUAGE === 'en'
            ? 'Promijeni na Hrvatski'
            : 'Switch to English');
    }
}

function updateNavigationLabels() {
    const tabs = {
        'tab-25': t('nav.guides2025'),
        'tab-26': t('nav.guides2026'),
        'tab-cmp': t('nav.comparison'),
    };
    Object.entries(tabs).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
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
    if (id === 'page-25'  && PAGES.Page25 && !PAGES.Page25._initialized)  PAGES.Page25.init();
    if (id === 'page-26'  && PAGES.Page26 && !PAGES.Page26._initialized)  PAGES.Page26.init();
    if (id === 'page-cmp' && PAGES.PageCmp && !PAGES.PageCmp._initialized)  PAGES.PageCmp.init();
    else if (id === 'page-cmp' && PAGES.PageCmp) setTimeout(() => PAGES.PageCmp.updateCharts(), 50);
}

const KEYBOARD_SHORTCUTS = {
    '1': () => {
        const tab = document.getElementById('tab-25');
        if (tab) showPage('page-25', tab);
    },
    '2': () => {
        const tab = document.getElementById('tab-26');
        if (tab) showPage('page-26', tab);
    },
    '3': () => {
        const tab = document.getElementById('tab-cmp');
        if (tab) showPage('page-cmp', tab);
    },
    '4': () => {
        window.location.href = 'management.html';
    },
    't': () => toggleTheme(),
    'd': () => {
        const picker = document.getElementById('cutoff-picker');
        if (picker) picker.focus();
    },
    '?': () => toggleShortcutOverlay(),
    'Escape': () => {
        const overlay = document.getElementById('shortcut-overlay');
        if (overlay && overlay.style.display === 'block') overlay.style.display = 'none';
    },
};

function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const handler = KEYBOARD_SHORTCUTS[e.key];
        if (handler) {
            handler();
            e.preventDefault();
        }
    });
}
