import { CSS, PAGES, setGlobalLanguage, getGlobalLanguage } from './shared.js';
import { t } from './i18n.js';

// ── Callback hooks for theme/language changes ──────────────────────────────────
// Registered by main.js to avoid circular dependency

let _onThemeChange = null;
let _onLanguageChange = null;

export function registerThemeChangeCallback(callback) {
    _onThemeChange = callback;
}

export function registerLanguageChangeCallback(callback) {
    _onLanguageChange = callback;
}

export function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add(CSS.DARK_MODE);
        document.body.classList.add(CSS.DARK_MODE);
    }
}

export function initLanguage() {
    const stored = localStorage.getItem('language');
    if (stored) setGlobalLanguage(stored);
}

export function updateThemeButton(isDark) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

export function toggleTheme(onToggleComplete) {
    const isDark = document.body.classList.toggle(CSS.DARK_MODE);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButton(isDark);

    if (onToggleComplete) {
        setTimeout(onToggleComplete, 100);
    } else {
        setTimeout(() => {
            if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.updateChart();
            if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.updateChart();
            if (PAGES.PageCmp && PAGES.PageCmp._initialized) PAGES.PageCmp.updateCharts();
            if (_onThemeChange) _onThemeChange();
        }, 100);
    }
}

export function updateLanguageButton() {
    const lang = getGlobalLanguage();
    const btn = document.getElementById('language-toggle');
    if (btn) {
        btn.textContent = lang === 'en' ? '🇭🇷' : '🇬🇧';
        btn.setAttribute('title', lang === 'en'
            ? 'Promijeni na Hrvatski'
            : 'Switch to English');
    }
}

export function updateNavigationLabels() {
    const tabs = {
        'tab-25':  t('nav.guides2025'),
        'tab-26':  t('nav.guides2026'),
        'tab-cmp': t('nav.comparison'),
    };
    Object.entries(tabs).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
}

export function toggleLanguage(onToggleComplete) {
    const current = getGlobalLanguage();
    setGlobalLanguage(current === 'en' ? 'hr' : 'en');
    localStorage.setItem('language', getGlobalLanguage());
    updateLanguageButton();
    updateNavigationLabels();

    requestAnimationFrame(() => {
        if (PAGES.Page25 && PAGES.Page25._initialized) {
            PAGES.Page25.rebuildStructure();
            PAGES.Page25.renderAll();
        }
        if (PAGES.Page26 && PAGES.Page26._initialized) {
            PAGES.Page26.rebuildStructure();
            PAGES.Page26.renderAll();
        }
        if (PAGES.PageCmp && PAGES.PageCmp._initialized) {
            PAGES.PageCmp.rebuildStructure();
            PAGES.PageCmp.mergedGuides = PAGES.PageCmp.buildMerged();
            PAGES.PageCmp.renderAll();
            PAGES.PageCmp.updateCharts();
        }
        if (_onLanguageChange) _onLanguageChange();
        if (onToggleComplete) onToggleComplete();
    });
}
