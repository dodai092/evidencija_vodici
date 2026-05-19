import {
    PAGES,
    getGlobalDate,
    updateDateAsOf, showPage, toggleSection,
} from './shared.js';

import {
    toggleTheme, toggleLanguage,
    updateThemeButton, updateLanguageButton, updateNavigationLabels,
    initTheme, initLanguage,
    registerThemeChangeCallback, registerLanguageChangeCallback,
} from './theme.js';

import { Page25 } from './pages/page-2025.js';
import { Page26 } from './pages/page-2026.js';
import { PageCmp } from './pages/page-cmp/index.js';
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
PAGES.PageMgmt = PageMgmt;

// Page modules generate HTML strings with inline onclick/onchange attributes
// that reference these by name — they must be on window to be callable from the DOM.
window.Page25        = Page25;
window.Page26        = Page26;
window.toggleSection = toggleSection;

// ── Register callbacks (theme.js -> main.js to avoid circular dependency) ────

registerThemeChangeCallback(() => {
    mgmtUpdateCharts();
});

registerLanguageChangeCallback(() => {
    updateManagementTabs();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const shortcutOverlay = () => document.getElementById('shortcut-overlay');

function toggleShortcutOverlay() {
    const el = shortcutOverlay();
    if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ── Event wiring ──────────────────────────────────────────────────────────────

const PAGE_MAP = {
    'tab-25':   'page-25',
    'tab-26':   'page-26',
    'tab-cmp':  'page-cmp',
    'tab-mgmt': 'page-mgmt',
};

function initEventListeners() {
    // Main navigation tabs
    Object.entries(PAGE_MAP).forEach(([tabId, pageId]) => {
        const el = document.getElementById(tabId);
        if (el) el.addEventListener('click', () => showPage(pageId, el));
    });

    // Management sub-navigation tabs
    ['pl', 'guides', 'channels', 'ops', 'cities'].forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.addEventListener('click', () => mgmtShowTab(id, el));
    });

    // Controls
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('language-toggle')?.addEventListener('click', toggleLanguage);
    document.getElementById('cutoff-picker')?.addEventListener('change', e => updateDateAsOf(e.target.value));
    document.querySelector('.print-btn')?.addEventListener('click', () => window.print());

    // Management city filter pills (two static sets in index.html)
    document.querySelectorAll('.city-pill').forEach(el =>
        el.addEventListener('click', () => mgmtFilterCityPl(el.dataset.city)));

    // Sort headers in guide table (static thead in index.html)
    document.querySelectorAll('.sort-hdr').forEach(el =>
        el.addEventListener('click', () => mgmtSort(el.dataset.col)));

    // Shortcut overlay close button
    document.querySelector('.overlay-close')?.addEventListener('click', toggleShortcutOverlay);
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

function initKeyboardShortcuts() {
    const shortcuts = {
        '1': () => { const el = document.getElementById('tab-25');   if (el) showPage('page-25', el); },
        '2': () => { const el = document.getElementById('tab-26');   if (el) showPage('page-26', el); },
        '3': () => { const el = document.getElementById('tab-cmp');  if (el) showPage('page-cmp', el); },
        '4': () => { const el = document.getElementById('tab-mgmt'); if (el) showPage('page-mgmt', el); },
        't': () => toggleTheme(),
        'd': () => document.getElementById('cutoff-picker')?.focus(),
        '?': () => toggleShortcutOverlay(),
        'Escape': () => {
            const el = shortcutOverlay();
            if (el && el.style.display === 'block') el.style.display = 'none';
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
    updateLanguageButton();
    updateNavigationLabels();

    const picker = document.getElementById('cutoff-picker');
    if (picker) {
        picker.value = getGlobalDate();
        updateDateAsOf(picker.value);
    }

    Page25.init();

    initEventListeners();
    initKeyboardShortcuts();
});
