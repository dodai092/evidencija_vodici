# Implementation Plan: ES Modules + esbuild Refactor

**Spec:** `docs/superpowers/specs/2026-05-18-esbuild-es-modules-design.md`  
**Date:** 2026-05-18

## Assumptions

- Node.js is available (`node -v` works)
- App is tested by opening `index.html` in a browser (VS Code Live Server on port 5501)
- `data-2025.js` and `data-2026.js` stay as plain `<script>` tags — not bundled
- All inline HTML event handlers (`onclick="showPage(...)"`, `onclick="PageCmp.filterCity(...)"`, etc.) must remain working — `main.js` must assign these to `window.*` explicitly since esbuild `--format=iife` wraps the bundle in a local scope

## Success Criteria

- [ ] `npm run build` completes in under 1 second
- [ ] All three guide tabs (2025, 2026, Comparison) render and filter correctly
- [ ] Management tab renders inside `index.html`, identical to old `management.html`
- [ ] Language toggle, dark mode, date picker all work
- [ ] No file in `src/` exceeds 400 lines
- [ ] `management.html` and `management.js` are deleted
- [ ] `.bak` files and `test_i18n.js` are deleted

---

## Step 1 — Bootstrap esbuild

**Goal:** `npm run build` produces `dist/app.js`; app still works (nothing has moved yet).

### 1a. Create `package.json`

```json
{
  "scripts": {
    "build": "esbuild src/main.js --bundle --outfile=dist/app.js --format=iife",
    "dev":   "esbuild src/main.js --bundle --outfile=dist/app.js --format=iife --watch"
  },
  "devDependencies": {
    "esbuild": "^0.21.0"
  }
}
```

### 1b. Install esbuild

```bash
npm install
```

### 1c. Create `src/main.js` (stub — no real imports yet)

At this stage, `src/main.js` just re-exposes existing globals so the bundle isn't empty:

```js
// Stub entry point — real imports added in subsequent steps
// Globals (shared.js, page-*.js, etc.) are still loaded as <script> tags
// This file exists only to give esbuild an entry point
export {};
```

### 1d. Add `dist/` to `.gitignore`

Append `dist/` to `.gitignore`.

### 1e. Update `index.html` script tags

Replace the existing `<script src="shared.js">` etc. block at the bottom of `<body>` with:

```html
<script src="data-2025.js"></script>
<script src="data-2026.js"></script>
<!-- existing non-data scripts remain here until each is migrated -->
<script src="shared.js"></script>
<script src="i18n.js"></script>
<script src="page-2025.js"></script>
<script src="page-2026.js"></script>
<script src="page-cmp.js"></script>
<script src="dist/app.js"></script>
```

**Verify:** `npm run build` runs without error. Open `index.html` — all three tabs work.

---

## Step 2 — Convert `shared.js`, `i18n.js`, extract `theme.js`

**Goal:** These three modules come from `src/`. Old root-level files deleted.

### 2a. Create `src/shared.js`

Copy contents of `shared.js` (root). Add `export` in front of every `const`, `let`, and `function` declaration. Remove the `(function initTheme() {...})()` and `(function initLanguage() {...})()` IIFEs — these move to `src/theme.js` and `src/main.js` respectively.

Key exports: `CITY_COLS`, `CITY_CLS`, `CITIES`, `MONTH_NAMES_HR`, `CSS`, `PAGES`, `registerPage`, `GLOBAL_DATE`, `GLOBAL_LANGUAGE`, `filteredStats`, `showPage`, `safeName`, `fmtN`, `getCutoffMonth`, `parseGlobalDate`, `getRangeLabel`, `updateDateAsOf`, `toggleSection`, `initKeyboardShortcuts`, `KEYBOARD_SHORTCUTS`.

### 2b. Create `src/i18n.js`

Copy contents of `i18n.js` (root). Export `TRANSLATIONS` and `t`. No deps on other src files.

### 2c. Create `src/theme.js`

Extract from `shared.js`: `initTheme()` IIFE, `toggleTheme()`, `updateThemeButton()`, `toggleLanguage()`, `updateLanguageButton()`, `updateNavigationLabels()`.

Imports: `{ CSS, PAGES, GLOBAL_LANGUAGE }` from `./shared.js`; `{ t }` from `./i18n.js`.

Export: `toggleTheme`, `toggleLanguage`, `initTheme`, `initLanguage`.

### 2d. Update `src/main.js`

```js
import { initKeyboardShortcuts, showPage, toggleSection, updateDateAsOf, PAGES } from './shared.js';
import { t } from './i18n.js';
import { toggleTheme, toggleLanguage, initTheme, initLanguage } from './theme.js';

// Run init
initTheme();
initLanguage();
initKeyboardShortcuts();

// Expose to inline HTML handlers
window.showPage = showPage;
window.toggleTheme = () => toggleTheme();
window.toggleLanguage = () => toggleLanguage();
window.toggleSection = toggleSection;
window.updateDateAsOf = updateDateAsOf;
window.t = t;
```

### 2e. Remove old script tags from `index.html`

Remove `<script src="shared.js">` and `<script src="i18n.js">` tags.  
Delete root-level `shared.js` and `i18n.js`.

**Verify:** Build succeeds. All tabs work. Dark mode, language toggle, date picker, keyboard shortcuts all function.

---

## Step 3 — Convert `page-2025.js` and `page-2026.js`

**Goal:** Both page modules come from `src/pages/`. Old root-level files deleted.

### 3a. Create `src/pages/page-2025.js`

Copy `page-2025.js` (root). Add imports at top:

```js
import { CITY_COLS, CITY_CLS, CITIES, filteredStats, safeName, fmtN, getCutoffMonth, GLOBAL_LANGUAGE, PAGES, registerPage } from '../shared.js';
import { t } from '../i18n.js';
```

Remove `const Page25 = {` — replace with `export const Page25 = {`.

At bottom: `registerPage('Page25', Page25);`

### 3b. Create `src/pages/page-2026.js`

Same pattern as 3a. Export `Page26`, call `registerPage('Page26', Page26)`.

### 3c. Update `src/main.js`

Add imports:
```js
import { Page25 } from './pages/page-2025.js';
import { Page26 } from './pages/page-2026.js';
```

Add window assignments:
```js
window.Page25 = Page25;
window.Page26 = Page26;
```

### 3d. Remove old script tags, delete old files

Remove `<script src="page-2025.js">` and `<script src="page-2026.js">` from `index.html`.  
Delete root-level `page-2025.js` and `page-2026.js`.

**Verify:** Build succeeds. Both 2025 and 2026 tabs render. City filter, language filter, month filter, chart all work.

---

## Step 4 — Split and convert `page-cmp.js`

**Goal:** `page-cmp.js` (1,370 lines) becomes three focused files under `src/pages/page-cmp/`.

### 4a. Identify split boundaries in `page-cmp.js`

- **`filters.js`**: `filterCity`, `filterLang`, `filterMonth`, `filterPrivateCity`, `filterPrivateType`, `filterSharedCity`, `filterSharedType`, `filterAvgType` (lines ~713–752) plus filter state (`activeCity`, `activeLang`, `activeMonths`, `activePrivateType`, `activeSharedType`, `PRIVATE_TYPES`, `SHARED_TYPES`).
- **`charts.js`**: `updateCharts()` method (line ~184) and all Chart.js instance setup inside it (~lines 184–710). Also `chartInstances` object.
- **`table.js`**: `_buildHeader`, `_buildKpisAndFilters`, `_buildFreeTours`, `_buildPaidTours`, `_buildGuideRows`, and all other `_build*` HTML builder methods (~lines 1043–1370).
- **`index.js`**: `PageCmp` object shell — `buildMerged`, `renderAll`, `rebuildStructure`, `init`. Imports and wires filters, charts, table.

### 4b. Create `src/pages/page-cmp/filters.js`

Export filter state constants and all `filter*` methods as standalone functions that accept `PageCmp` as a parameter, OR keep them as a `Filters` object that `PageCmp` delegates to.

Pattern:
```js
import { CITIES } from '../../shared.js';

export const filterState = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    activePrivateType: 'all',
    activeSharedType: 'all',
    PRIVATE_TYPES: ['war PR', 'food PR', 'best', 'old', 'big'],
    SHARED_TYPES: ['war', 'food', 'best'],
};

export function filterCity(state, city, onDone) { ... }
// etc.
```

### 4c. Create `src/pages/page-cmp/charts.js`

Extract `updateCharts()` and chart instance references.

```js
import { filteredStats, CITY_COLS, CITIES } from '../../shared.js';
import { t } from '../../i18n.js';

export function updateCharts(pageRef) { ... }
export const chartInstances = { ... };
```

### 4d. Create `src/pages/page-cmp/table.js`

Extract all `_build*` HTML generator methods.

```js
import { t } from '../../i18n.js';
import { filteredStats, CITY_COLS, getRangeLabel } from '../../shared.js';

export function buildHeader(state) { ... }
export function buildKpisAndFilters(state) { ... }
// etc.
```

### 4e. Create `src/pages/page-cmp/index.js`

```js
import { filterState, filterCity, ... } from './filters.js';
import { updateCharts, chartInstances } from './charts.js';
import { buildHeader, buildKpisAndFilters, ... } from './table.js';
import { registerPage, PAGES } from '../../shared.js';

export const PageCmp = {
    ...filterState,
    chartInstances,
    _initialized: false,
    buildMerged() { ... },
    renderAll() { ... },
    rebuildStructure() { ... },
    init() { ... },
    updateCharts() { updateCharts(this); },
    filterCity(city) { filterCity(this, city, () => this.renderAll()); },
    // etc.
};

registerPage('PageCmp', PageCmp);
```

### 4f. Update `src/main.js`

Replace `page-cmp.js` import with:
```js
import { PageCmp } from './pages/page-cmp/index.js';
window.PageCmp = PageCmp;
```

### 4g. Remove old script tag, delete old file

Remove `<script src="page-cmp.js">` from `index.html`.  
Delete root-level `page-cmp.js`.

**Verify:** Build succeeds. Comparison tab renders. All chart filters (city, lang, month, private/shared type) work. Language and theme toggle update charts correctly.

---

## Step 5 — Split `management.js`

**Goal:** `management.js` (1,558 lines) split into 6 files under `src/pages/management/`. Old file remains as a `<script>` tag until Step 6 removes it.

### 5a. Create `src/pages/management/index.js`

Extracts: `MgmtPages` registry, `mgmtShowTab`, shared formatters (`fmt`, `fmtEur`, `dd`, `gmClass`, `deltaClass`), `build25Lookup`, `build26Lookup`, date filter logic, chart helper functions (`makeChart`, `makeLineChart`, etc.).

```js
import { CSS } from '../../shared.js';
import { t } from '../../i18n.js';

export const MgmtPages = { pl: {_init:false}, guides: {_init:false}, ... };
export let _activeTab = 'pl';
export function mgmtShowTab(id, el) { ... }
export function fmt(v, dec=0) { ... }
export function fmtEur(v) { ... }
export function dd(v, eurSign=false) { ... }
// chart helpers, data helpers
```

### 5b. Create `src/pages/management/pl.js`

Extracts `initPl()` (lines 288–703) and all P&L-specific helpers.

```js
import { fmt, fmtEur, dd } from './index.js';
import { t } from '../../i18n.js';

export function initPl() { ... }
```

### 5c. Create `src/pages/management/guides.js`

Extracts `initGuides()` (lines 706–801).

### 5d. Create `src/pages/management/channels.js`

Extracts `initChannels()` (lines 806–983).

### 5e. Create `src/pages/management/ops.js`

Extracts `initOps()` (lines 992–1139).

### 5f. Create `src/pages/management/cities.js`

Extracts `initCities()` (lines 1257–1456) plus city-specific helpers (lines 1140–1254).

### 5g. Update `src/main.js`

```js
import { MgmtPages, mgmtShowTab, updateManagementTabs } from './pages/management/index.js';
window.MgmtPages = MgmtPages;
window.mgmtShowTab = mgmtShowTab;
window.updateManagementTabs = updateManagementTabs;
```

**Verify:** Build succeeds. (Full management verification happens in Step 6 after HTML merge.)

---

## Step 6 — Merge `management.html` into `index.html`

**Goal:** Management content becomes `page-mgmt` tab in `index.html`. `management.html` and `management.js` are deleted.

### 6a. Add nav tab to `index.html`

In the `<nav>` section, add after the Comparison tab:
```html
<button id="tab-mgmt" class="nav-tab" onclick="showPage('page-mgmt', this)">
  <span id="tab-mgmt-label">Management</span>
</button>
```

### 6b. Add page container to `index.html`

After `<div id="page-cmp" class="page">`, add:
```html
<div id="page-mgmt" class="page"></div>
```

### 6c. Register `PageMgmt` module in `src/pages/management/index.js`

Add a `PageMgmt` object with `_initialized`, `init()`, `renderAll()` pattern (same as Page25/26). `init()` inserts the management HTML structure (currently in `management.html`) into `#page-mgmt`.

### 6d. Copy management HTML structure from `management.html`

Extract the inner HTML of `<div id="mgmt-container">` (or equivalent) from `management.html` and make it the template string returned by `PageMgmt._buildStructure()`.

### 6e. Update keyboard shortcut `'4'`

In `src/shared.js`, change:
```js
'4': () => { window.location.href = 'management.html'; },
```
to:
```js
'4': () => { const tab = document.getElementById('tab-mgmt'); if (tab) showPage('page-mgmt', tab); },
```

### 6f. Remove `<script src="management.js">` from `index.html`

Also remove the "Management" nav link that pointed to `management.html`.

### 6g. Delete `management.html` and `management.js`

```bash
git rm management.html management.js
```

**Verify:** Management tab appears in nav. All 5 sub-tabs (P&L, Guides, Channels, Operational, Cities) render and function. Charts draw correctly. Date filter, dark mode, language toggle work in management tab.

---

## Step 7 — Cleanup

**Goal:** Remove all leftover files, update docs.

### 7a. Delete leftover files

```bash
git rm index.html.bak management.html.bak test_i18n.js
```

### 7b. Update `.gitignore`

`dist/` should already be in `.gitignore` from Step 1d. Verify.

### 7c. Update `CLAUDE.md`

Replace the "Architecture" section to describe the new `src/` layout and `npm run build` / `npm run dev` commands. Remove references to old root-level JS files.

### 7d. Final commit

```bash
git add -A
git commit -m "refactor: complete esbuild + ES modules migration"
```

**Verify all success criteria:**
- [ ] `npm run build` < 1 second
- [ ] All three guide tabs work
- [ ] Management tab works (all 5 sub-tabs)
- [ ] Language toggle, dark mode, date picker work
- [ ] No `src/` file > 400 lines (`wc -l src/**/*.js src/pages/**/*.js`)
- [ ] `management.html`, `management.js`, `.bak` files, `test_i18n.js` gone

---

## Notes

### `window.*` assignments required in `main.js`

Because `--format=iife` wraps the bundle in a local function, all names used in inline HTML handlers (`onclick="..."`) must be explicitly assigned to `window`. Complete list:

```js
window.showPage = showPage;
window.toggleTheme = toggleTheme;
window.toggleLanguage = toggleLanguage;
window.toggleSection = toggleSection;
window.updateDateAsOf = updateDateAsOf;
window.toggleShortcutOverlay = toggleShortcutOverlay;
window.Page25 = Page25;
window.Page26 = Page26;
window.PageCmp = PageCmp;
window.PageMgmt = PageMgmt;
window.mgmtShowTab = mgmtShowTab;
window.updateManagementTabs = updateManagementTabs;
window.t = t;
```

Missing any of these will cause `ReferenceError` in the browser console on click.

### Data globals

`guideStats25`, `kpiTotals25`, `guideStats26`, `kpiTotals26` are loaded by data script tags before `dist/app.js`. Inside the IIFE they are referenced as bare globals — this works because they're on `window` before the IIFE executes. No special handling needed.

### `GLOBAL_DATE` and `GLOBAL_LANGUAGE` mutability

These are `let` bindings in `src/shared.js`. Since ES modules are live bindings, modules that import them will always see the current value when they read the variable. Functions that mutate them (`updateDateAsOf`, `toggleLanguage`) must import the variable reference correctly — or export setter functions.
