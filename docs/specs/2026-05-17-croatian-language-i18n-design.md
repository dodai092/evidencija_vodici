# Croatian Language Support (i18n) Design

**Date:** 2026-05-17  
**Scope:** Add Croatian (Hrvatski) language support to both `index.html` (guides dashboard) and `management.html` (financial dashboard) with a persistent language toggle.

---

## Overview

The app will support two languages: English (default) and Croatian. Users can toggle between languages via a flag button in the navigation bar. The choice persists in `localStorage`. All UI text, labels, chart titles, and section headers are translatable; guide names, city names, month names, and tour types remain in English.

---

## Translation Scope

**Translated:**
- Navigation labels ("Guides 2025", "Guides 2026", "Comparison 25/26", "Management")
- UI labels ("Free Tours", "Paid Tours", "Free PAX", "Paid PAX", etc.)
- Filter labels and options ("Language", "City", "Mo.", "All", etc.)
- Chart titles and axis labels
- Section headers ("Free Tours", "Paid Tours")
- Button text ("Monthly")
- Table headers ("Mo.", "Free", "Paid", etc.)

**Not translated (remain English):**
- Guide names (e.g., "Ana", "Marko")
- City names (e.g., "Zagreb", "Dubrovnik")
- Month names ("Jan", "Feb", ..., "Dec")
- Tour types ("war PR", "food PR", "best", "old", "big", "war", "food", "shared")
- Date format and number formatting

---

## Architecture

### File Structure

**New file:**
- `i18n.js` — Translation object (`TRANSLATIONS`), language state (`GLOBAL_LANGUAGE`), and helper function (`t(key)`)

**Modified files:**
- `shared.js` — Add `toggleLanguage()`, `updateLanguageButton()`, initialize language from localStorage
- `index.html` — Add language toggle button (flag) next to theme toggle in nav; add `data-i18n` attributes to tab labels
- `page-2025.js` — Replace hardcoded strings with `t()` calls in all builder methods
- `page-2026.js` — Replace hardcoded strings with `t()` calls in all builder methods
- `page-cmp.js` — Replace hardcoded strings with `t()` calls in all builder methods
- `management.js` — Replace hardcoded strings with `t()` calls throughout

**Unchanged:**
- `guides.css` — Styling, no translation needed
- Data files (`data-2025.js`, `data-2026.js`) — No changes

---

## Translation Object Structure

### `i18n.js`

```javascript
const TRANSLATIONS = {
  en: {
    nav: {
      guides2025: 'Guides 2025',
      guides2026: 'Guides 2026',
      comparison: 'Comparison 25/26',
      management: 'Management',
    },
    labels: {
      freeTours: 'Free Tours',
      paidTours: 'Paid Tours',
      freePax: 'Free PAX',
      paidPax: 'Paid PAX',
      monthly: 'Monthly',
      external: 'External',
      // ... more as needed
    },
    filters: {
      language: 'Language',
      city: 'City',
      month: 'Mo.',
      all: 'All',
    },
    charts: {
      freePaxByCity: 'Free PAX by City',
      paidToursByCity: 'Paid Tours by City',
      cumulativeFreePax: 'Cumulative Free PAX Trend',
      cumulativePaidTours: 'Cumulative Paid Tours Trend',
      // ... more as needed
    },
    table: {
      month: 'Mo.',
      free: 'Free',
      paid: 'Paid',
      pax: 'PAX',
    },
    // ... sections for management.html labels
  },
  hr: {
    nav: {
      guides2025: 'Vodiči 2025',
      guides2026: 'Vodiči 2026',
      comparison: 'Usporedba 25/26',
      management: 'Upravljanje',
    },
    labels: {
      freeTours: 'Besplatne ture',
      paidTours: 'Plaćene ture',
      freePax: 'Besplatni PAX',
      paidPax: 'Plaćeni PAX',
      monthly: 'Mjesečno',
      external: 'Vanjski',
      // ... more as needed
    },
    filters: {
      language: 'Jezik',
      city: 'Grad',
      month: 'Mj.',
      all: 'Sve',
    },
    charts: {
      freePaxByCity: 'Besplatni PAX po gradu',
      paidToursByCity: 'Plaćene ture po gradu',
      cumulativeFreePax: 'Trend kumulativnog besplatnog PAX-a',
      cumulativePaidTours: 'Trend kumulativnih plaćenih tura',
      // ... more as needed
    },
    table: {
      month: 'Mj.',
      free: 'Bespl.',
      paid: 'Plaćene',
      pax: 'PAX',
    },
    // ... sections for management.html labels
  }
};

let GLOBAL_LANGUAGE = localStorage.getItem('language') || 'en';

function t(key) {
  const keys = key.split('.');
  let val = TRANSLATIONS[GLOBAL_LANGUAGE];
  for (const k of keys) {
    val = val?.[k];
  }
  return val || key; // Fallback: return key itself if translation missing
}
```

The key structure uses dot notation (e.g., `t('nav.guides2025')`) to organize translations by context.

---

## Implementation Details

### Language Toggle in shared.js

```javascript
function toggleLanguage() {
  GLOBAL_LANGUAGE = GLOBAL_LANGUAGE === 'en' ? 'hr' : 'en';
  localStorage.setItem('language', GLOBAL_LANGUAGE);
  updateLanguageButton();
  updateNavigationLabels(); // Update nav tab labels via data-i18n

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
```

### Page Builder Integration

In `page-2025.js`, `page-2026.js`, `page-cmp.js`, and `management.js`, replace hardcoded strings:

**Before:**
```javascript
`<div class="gc-stat-label">Free Tours</div>` +
`<label for="lang-filter-25">Language</label>` +
```

**After:**
```javascript
`<div class="gc-stat-label">${t('labels.freeTours')}</div>` +
`<label for="lang-filter-25">${t('filters.language')}</label>` +
```

Chart titles passed to Chart.js:
```javascript
const datasets = [{
  label: t('charts.freePaxByCity'),
  // ...
}];
```

### Navigation HTML in index.html

Add language toggle button and `data-i18n` attributes:
```html
<div class="nav-tabs">
  <div id="tab-25" class="nav-tab active y25" data-i18n="nav.guides2025" onclick="showPage('page-25',this)"></div>
  <div id="tab-26" class="nav-tab" data-i18n="nav.guides2026" onclick="showPage('page-26',this)"></div>
  <div id="tab-cmp" class="nav-tab cmp" data-i18n="nav.comparison" onclick="showPage('page-cmp',this)"></div>
</div>

<button id="language-toggle" class="toggle-btn" onclick="toggleLanguage()" title="...">🇭🇷</button>
```

On page load, `updateNavigationLabels()` populates these tabs with translated text.

---

## Initialization

In `i18n.js`, after defining `TRANSLATIONS` and `t()`:

```javascript
// On page load, initialize language from localStorage
document.addEventListener('DOMContentLoaded', () => {
  GLOBAL_LANGUAGE = localStorage.getItem('language') || 'en';
  updateLanguageButton();
  updateNavigationLabels();
});
```

Alternatively, call these in `shared.js` initialization.

---

## Edge Cases

### Chart.js Re-rendering
When `toggleLanguage()` is called, it triggers `renderAll()` on all initialized pages. The page builders destroy and recreate Chart.js instances with new language strings. No special handling needed — charts are re-created from scratch.

### Management.html Tabs
`management.js` also calls builder functions that generate HTML. These will use `t()` and re-render on language toggle, same pattern as the guide pages.

### Fallback Behavior
If a translation key is missing (e.g., typo or incomplete translation object), `t(key)` returns the key itself as a fallback. This makes missing translations visible for debugging.

---

## Testing Strategy

**Manual testing (in-browser):**

1. Load `index.html`, verify English is the default language
2. Click the language toggle (flag button in nav) → all visible text should switch to Croatian
3. Navigate to each tab (2025, 2026, Comparison) → verify all sections and charts are in Croatian
4. Reload the page → verify Croatian remains active (from localStorage)
5. Click toggle again → verify English is restored and persists on reload
6. Open `management.html` and repeat steps 2–5
7. Verify that guide names, city names, month names, and tour types remain in English
8. Test filter dropdowns — labels should be Croatian, but option values (cities, types) stay English

No automated tests are required; this is UI translation verification.

---

## Rollout

1. Create `i18n.js` with complete translation object
2. Modify `shared.js` to add language toggle and initialization functions
3. Update `index.html` with toggle button and `data-i18n` attributes on nav tabs
4. Update `page-2025.js`, `page-2026.js`, `page-cmp.js` to use `t()` for all UI strings
5. Update `management.js` to use `t()` for all UI strings
6. Manual browser testing to verify all pages and charts translate correctly
7. Commit and deploy

---

## Translation Keys Reference

(Partial list; full list will be populated during implementation)

### Navigation
- `nav.guides2025`, `nav.guides2026`, `nav.comparison`, `nav.management`

### Labels
- `labels.freeTours`, `labels.paidTours`, `labels.freePax`, `labels.paidPax`, `labels.monthly`, `labels.external`

### Filters
- `filters.language`, `filters.city`, `filters.month`, `filters.all`

### Charts
- `charts.freePaxByCity`, `charts.paidToursByCity`, `charts.cumulativeFreePax`, `charts.cumulativePaidTours`, etc.

### Table
- `table.month`, `table.free`, `table.paid`, `table.pax`

Full list will be compiled during implementation based on a complete scan of all UI strings.
