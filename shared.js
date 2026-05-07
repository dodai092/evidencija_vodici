const CITY_COLS = { Zagreb:'#0277BA', Dubrovnik:'#D4545A', Split:'#8B5CF6', Zadar:'#F59E0B', Unknown:'#999999' };
const CITY_CLS  = { Zagreb:'zagreb', Dubrovnik:'dubrovnik', Split:'split', Zadar:'zadar', Unknown:'' };
const CITIES    = ['Zagreb','Dubrovnik','Split','Zadar'];
const MONTH_NAMES_HR = {1:'Sij',2:'Velj',3:'Ožu',4:'Tra',5:'Svi',6:'Lip',7:'Srp',8:'Kol',9:'Ruj',10:'Lis',11:'Stu',12:'Pro'};

let GLOBAL_DATE = '2026-05-06'; // Default

function safeName(n) { return n.replace(/[^a-zA-Z0-9]/g,'_'); }
function fmtN(v) { return Math.round(v).toLocaleString('hr-HR'); }

function getCutoffMonth() {
    return parseInt(GLOBAL_DATE.split('-')[1]);
}

function getRangeLabel() {
    const m = getCutoffMonth();
    if (m === 1) return 'Sij';
    return `Sij\u2013${MONTH_NAMES_HR[m]}`;
}

function updateDateAsOf(val) {
    GLOBAL_DATE = val;
    const d = new Date(val);
    const fmt = d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Update all headers
    document.querySelectorAll('[id^="date-pov-"]').forEach(el => el.textContent = fmt);
    document.querySelectorAll('.ytd-range-label').forEach(el => el.textContent = getRangeLabel());

    // Reset month dropdowns and filter state
    document.querySelectorAll('select[id^="month-filter-"]').forEach(sel => sel.value = 'all');
    Page25.activeMonths = [];
    Page26.activeMonths = [];
    if (typeof PageCmp !== 'undefined') PageCmp.activeMonths = [];

    // Refresh ALL initialized pages (not just active)
    if (Page25._initialized)  Page25.renderAll();
    if (Page26._initialized)  Page26.renderAll();
    if (PageCmp._initialized) {
        PageCmp.mergedGuides = PageCmp.buildMerged();
        PageCmp.renderAll();
    }
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

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButton();
    if (typeof PageCmp !== 'undefined' && PageCmp._initialized) {
        setTimeout(() => PageCmp.updateCharts(), 100);
    }
}

function updateThemeButton() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('title', document.body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode');
}

function showPage(id, tab) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active','y25','y26','cmp'));
    document.getElementById(id).classList.add('active');
    tab.classList.add('active');
    if (id === 'page-25')  tab.classList.add('y25');
    if (id === 'page-26')  tab.classList.add('y26');
    if (id === 'page-cmp') tab.classList.add('cmp');
    if (id === 'page-25'  && !Page25._initialized)  Page25.init();
    if (id === 'page-26'  && !Page26._initialized)   Page26.init();
    if (id === 'page-cmp' && !PageCmp._initialized)  PageCmp.init();
    else if (id === 'page-cmp') setTimeout(() => PageCmp.updateCharts(), 50);
}
