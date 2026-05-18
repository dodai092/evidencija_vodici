import {
    CITY_COLS, CITY_CLS, CITIES, MONTH_NAMES_HR, CSS,
    PAGES, registerPage,
    getGlobalDate, setGlobalDate, getGlobalLanguage, setGlobalLanguage,
    safeName, fmtN,
    getCutoffMonth, parseGlobalDate, getRangeLabel,
    updateDateAsOf, filteredStats,
    toggleSection, showPage,
    initKeyboardShortcuts,
} from './shared.js';

import { TRANSLATIONS, t, tOpposite, titleAttr } from './i18n.js';

import {
    initTheme, initLanguage,
    toggleTheme, toggleLanguage,
    updateThemeButton, updateLanguageButton, updateNavigationLabels,
} from './theme.js';

// ── Boot ──────────────────────────────────────────────────────────────────────

initTheme();
initLanguage();

// ── Window globals for inline HTML handlers and legacy <script> tags ──────────

// Mutable state: expose as getter/setter so reads in old script tags are live
Object.defineProperty(window, 'GLOBAL_DATE', {
    get: getGlobalDate,
    set: setGlobalDate,
    configurable: true,
    enumerable: true,
});
Object.defineProperty(window, 'GLOBAL_LANGUAGE', {
    get: getGlobalLanguage,
    set: setGlobalLanguage,
    configurable: true,
    enumerable: true,
});

// Reference types (objects/arrays): single reference, mutations are live
window.CITY_COLS  = CITY_COLS;
window.CITY_CLS   = CITY_CLS;
window.CITIES     = CITIES;
window.MONTH_NAMES_HR = MONTH_NAMES_HR;
window.CSS        = CSS;
window.PAGES      = PAGES;

// Functions: inline HTML handlers + legacy script dependencies
window.registerPage        = registerPage;
window.safeName            = safeName;
window.fmtN                = fmtN;
window.getCutoffMonth      = getCutoffMonth;
window.parseGlobalDate     = parseGlobalDate;
window.getRangeLabel       = getRangeLabel;
window.updateDateAsOf      = updateDateAsOf;
window.filteredStats       = filteredStats;
window.toggleSection       = toggleSection;
window.showPage            = showPage;

window.TRANSLATIONS        = TRANSLATIONS;
window.t                   = t;
window.tOpposite           = tOpposite;
window.titleAttr           = titleAttr;

window.toggleTheme         = toggleTheme;
window.toggleLanguage      = toggleLanguage;
window.updateThemeButton   = updateThemeButton;
window.updateLanguageButton = updateLanguageButton;
window.updateNavigationLabels = updateNavigationLabels;

// Used by KEYBOARD_SHORTCUTS 't' handler without circular import
window._toggleTheme        = toggleTheme;

import { Page25 } from './pages/page-2025.js';
import { Page26 } from './pages/page-2026.js';

window.Page25 = Page25;
window.Page26 = Page26;

// ── Post-load init ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    updateLanguageButton();
    updateNavigationLabels();
    initKeyboardShortcuts();
});
