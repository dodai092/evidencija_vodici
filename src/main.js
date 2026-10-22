import {
    PAGES,
    getGlobalDate,
    updateDateAsOf, showPage, toggleSection,
} from './shared.js';

import {
    toggleTheme,
    updateThemeButton, updateNavigationLabels,
    initTheme, initLanguage,
    registerThemeChangeCallback, registerLanguageChangeCallback,
} from './theme.js';

import { Page25 } from './pages/page-2025.js';
import { Page26 } from './pages/page-2026.js';
import { PageCmp } from './pages/page-cmp/index.js';
import { PageGuides } from './pages/page-guides.js';
import {
    mgmtShowTab, mgmtFilterCityPl, mgmtSort,
    mgmtUpdateCharts, updateManagementTabs,
    PageMgmt,
} from './pages/management/index.js';

// ── Boot ──────────────────────────────────────────────────────────────────────

initTheme();
initLanguage();

PAGES.Page25   = Page25;
PAGES.Page26   = Page26;
PAGES.PageCmp  = PageCmp;
PAGES.PageGuides = PageGuides;
PAGES.PageMgmt = PageMgmt;

// Page modules generate HTML strings with inline onclick/onchange attributes
// that reference these by name — they must be on window to be callable from the DOM.
window.Page25        = Page25;
window.Page26        = Page26;
window.PageCmp       = PageCmp;
window.PageGuides    = PageGuides;
window.toggleSection = toggleSection;

// ── Register callbacks (theme.js -> main.js to avoid circular dependency) ────

registerThemeChangeCallback(() => {
    PAGES.PageGuides.closeGuideDetail();
    mgmtUpdateCharts();
});

registerLanguageChangeCallback(() => {
    updateManagementTabs();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Sidebar open/closed is remembered. The phone top bar has no rail, so the state only matters on desktop.
function syncSidebarToggle() {
    const open = document.body.classList.contains('sidebar-open');
    const toggle = document.getElementById('sidebar-toggle');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Collapse sidebar' : 'Expand sidebar');
}

function toggleSidebar() {
    const open = document.body.classList.toggle('sidebar-open');
    try { localStorage.setItem('sidebar', open ? 'open' : 'closed'); } catch (e) {}
    syncSidebarToggle();
}

// The closed rail shows only the calendar tile, so its hover tooltip carries the date.
function renderAsOfText(value) {
    const text = document.getElementById('as-of-text');
    if (!text || !value) return;
    text.textContent = new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    text.closest('.date-field').dataset.tip = 'Data through ' + text.textContent;
}

const shortcutOverlay = () => document.getElementById('shortcut-overlay');

let _overlayPreviousFocus = null;

function toggleShortcutOverlay() {
    const el = shortcutOverlay();
    if (!el) return;
    const isOpen = el.style.display === 'block';
    if (isOpen) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        el.removeEventListener('keydown', _overlayTrapFocus);
        _overlayPreviousFocus?.focus();
        _overlayPreviousFocus = null;
    } else {
        _overlayPreviousFocus = document.activeElement;
        el.style.display = 'block';
        el.setAttribute('aria-hidden', 'false');
        el.addEventListener('keydown', _overlayTrapFocus);
        el.querySelector('.overlay-close')?.focus();
    }
}

function _overlayTrapFocus(e) {
    if (e.key === 'Escape') { toggleShortcutOverlay(); return; }
    if (e.key !== 'Tab') return;
    e.preventDefault();
    shortcutOverlay()?.querySelector('.overlay-close')?.focus();
}

// ── Event wiring ──────────────────────────────────────────────────────────────

function initEventListeners() {
    // Page navigation: the sidebar and the phone bottom bar both carry data-page buttons
    document.querySelectorAll('[data-page]').forEach(el =>
        el.addEventListener('click', () => showPage(el.dataset.page)));

    // Management sub-navigation tabs
    ['pl', 'guides', 'channels', 'ops', 'cities'].forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.addEventListener('click', () => mgmtShowTab(id, el));
    });

    // Controls
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('cutoff-picker')?.addEventListener('change', e => {
        updateDateAsOf(e.target.value);
        renderAsOfText(e.target.value);
    });
    document.getElementById('print-btn')?.addEventListener('click', () => window.print());

    // Management city filter pills (two static sets in index.html)
    document.querySelectorAll('.city-pill').forEach(el =>
        el.addEventListener('click', () => mgmtFilterCityPl(el.dataset.city)));

    // Sort headers in guide table (static thead in index.html)
    document.querySelectorAll('.sort-hdr').forEach(el => {
        el.addEventListener('click', () => mgmtSort(el.dataset.col));
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mgmtSort(el.dataset.col); }
        });
    });

    // Shortcut overlay close button
    document.querySelector('.overlay-close')?.addEventListener('click', toggleShortcutOverlay);

    // Arrow-key navigation for the sidebar page tabs
    const mainTabs = Array.from(document.querySelectorAll('.sidebar-nav .side-tab'));
    mainTabs.forEach((tab, i) => {
        tab.addEventListener('keydown', e => {
            let next;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = mainTabs[(i + 1) % mainTabs.length];
            if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   next = mainTabs[(i - 1 + mainTabs.length) % mainTabs.length];
            if (e.key === 'Home') next = mainTabs[0];
            if (e.key === 'End')  next = mainTabs[mainTabs.length - 1];
            if (next) { e.preventDefault(); next.focus(); next.click(); }
        });
    });

    // Arrow-key navigation for management sub-nav tabs
    const mgmtTabs = Array.from(document.querySelectorAll('.mgmt-subnav .nav-tab'));
    mgmtTabs.forEach((tab, i) => {
        tab.addEventListener('keydown', e => {
            let next;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = mgmtTabs[(i + 1) % mgmtTabs.length];
            if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   next = mgmtTabs[(i - 1 + mgmtTabs.length) % mgmtTabs.length];
            if (e.key === 'Home') next = mgmtTabs[0];
            if (e.key === 'End')  next = mgmtTabs[mgmtTabs.length - 1];
            if (next) { e.preventDefault(); next.focus(); next.click(); }
        });
    });
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

function initKeyboardShortcuts() {
    const shortcuts = {
        '1': () => showPage('page-25'),
        '2': () => showPage('page-26'),
        '3': () => showPage('page-cmp'),
        '4': () => showPage('page-gd'),
        '5': () => showPage('page-mgmt'),
        't': () => toggleTheme(),
        'd': () => document.getElementById('cutoff-picker')?.focus(),
        '?': () => toggleShortcutOverlay(),
        'Escape': () => {
            const el = shortcutOverlay();
            if (el && el.style.display === 'block') {
                el.style.display = 'none';
                el.setAttribute('aria-hidden', 'true');
            }
        },
    };
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const handler = shortcuts[e.key];
        if (handler) { handler(); e.preventDefault(); }
    });
}

// ── DOMContentLoaded — single init point ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    updateThemeButton(document.body.classList.contains('dark-mode'));
    updateNavigationLabels();

    const picker = document.getElementById('cutoff-picker');
    if (picker) {
        picker.value = getGlobalDate();
        updateDateAsOf(picker.value);
        renderAsOfText(picker.value);
        // The input is transparent over the whole tile, but a native date input only opens the picker from
        // its calendar indicator. Open the picker from any click on the tile.
        picker.closest('.date-field').addEventListener('click', () => {
            try { picker.showPicker(); } catch (err) { picker.focus(); }
        });
    }

    syncSidebarToggle();

    PageCmp.init();

    initEventListeners();
    initKeyboardShortcuts();
});
