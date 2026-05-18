# ES Modules + esbuild Refactor

**Date:** 2026-05-18  
**Status:** Approved

## Problem

The codebase has accumulated debt across all files simultaneously:
- `page-cmp.js` — 1,370 lines, no internal boundaries
- `management.js` — 1,558 lines, no internal boundaries
- `guides.css` — 1,888 lines
- Everything runs in global scope — no real encapsulation, changes are unpredictable
- `management.html` is a separate page, fragmenting the UX

The result: hard to find things, hard to change things safely, hard to onboard anyone.

## Goal

Introduce esbuild + ES modules so the codebase has real module boundaries. Large files get split into focused sub-modules. `management.html` gets merged into `index.html` as a 4th tab.

## Non-goals

- No framework (stays vanilla JS + Chart.js)
- No CSS build step (guides.css stays as-is)
- No changes to data pipeline (`data-2025.js`, `data-2026.js` stay as generated script tags)
- No new features

## Directory Structure

```
src/
  main.js              ← entry point, imports and initializes everything
  shared.js            ← constants, filteredStats(), showPage(), keyboard shortcuts
  i18n.js              ← translations + t()
  theme.js             ← toggleTheme(), dark mode init
  pages/
    page-2025.js       ← Page25 module
    page-2026.js       ← Page26 module
    page-cmp/
      index.js         ← PageCmp entry, wires sub-modules
      charts.js        ← all Chart.js instances (~400 lines)
      table.js         ← comparison table rendering (~400 lines)
      filters.js       ← filter state + pill logic (~200 lines)
    management/
      index.js         ← MgmtPages registry, tab routing, shared helpers
      pl.js            ← P&L tab
      guides.js        ← Guides tab
      channels.js      ← Channels tab
      ops.js           ← Ops tab
      cities.js        ← Cities tab

dist/
  app.js               ← esbuild output (gitignored)

index.html             ← loads data-2025.js, data-2026.js, then dist/app.js
guides.css             ← unchanged
data-2025.js           ← generated, outside esbuild
data-2026.js           ← generated, outside esbuild
scripts/               ← Python scripts, unchanged
```

`management.html` and `management.js` are deleted after migration. Management content becomes `page-mgmt` in `index.html`.

## Build Setup

**`package.json`:**
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

- `--format=iife` wraps the bundle so it doesn't pollute global scope while still reading `guideStats25`/`guideStats26` globals from the data script tags
- `npm run dev` watches and rebuilds on save — manual browser refresh still needed
- `dist/app.js` is gitignored

**`index.html` script order:**
```html
<script src="data-2025.js"></script>
<script src="data-2026.js"></script>
<script src="dist/app.js"></script>
```

## Module Boundaries

### `src/shared.js`
Exports: `CITY_COLS`, `CITY_CLS`, `CITIES`, `MONTH_NAMES_HR`, `CSS`, `PAGES`, `registerPage`, `GLOBAL_DATE`, `GLOBAL_LANGUAGE`, `filteredStats`, `showPage`, `safeName`, `fmtN`, helper date functions, keyboard shortcuts.

### `src/i18n.js`
Exports: `TRANSLATIONS`, `t()`. No deps on other src modules.

### `src/theme.js`
Exports: `toggleTheme`, `updateThemeButton`. Imports from `shared.js`.

### `src/pages/page-2025.js` / `page-2026.js`
Each exports a single `Page25` / `Page26` object. Imports from `shared.js`, `i18n.js`.

### `src/pages/page-cmp/`
- `filters.js` — exports filter state, pill handlers. Imports shared.
- `charts.js` — exports chart init and update functions. Imports shared, i18n.
- `table.js` — exports table render functions. Imports shared, i18n.
- `index.js` — exports `PageCmp`. Imports and wires the three sub-modules.

### `src/pages/management/`
- `index.js` — exports `MgmtPages`, `mgmtShowTab`, shared formatters (`fmt`, `fmtEur`, `dd`). Imports shared, i18n.
- `pl.js` — exports `initPl`. Imports management/index.js, i18n.
- `guides.js` — exports `initGuides`. Same pattern.
- `channels.js` — exports `initChannels`. Same pattern.
- `ops.js` — exports `initOps`. Same pattern.
- `cities.js` — exports `initCities`. Same pattern.

### `src/main.js`
Imports all page modules, calls `registerPage()`, sets up `window.showPage`, `window.toggleTheme`, etc. for inline HTML event handlers, then initializes the default tab.

## HTML Changes

`index.html` gains a 4th tab:
```html
<button id="tab-mgmt" class="nav-tab" onclick="showPage('page-mgmt', this)">Management</button>
```
And a 4th page container:
```html
<div id="page-mgmt" class="page"></div>
```

The keyboard shortcut `'4'` (currently `window.location.href = 'management.html'`) becomes `showPage('page-mgmt', ...)`.

## Migration Steps

Each step leaves the app fully working before moving to the next.

1. **Bootstrap** — create `package.json`, install esbuild, create `src/main.js` that just re-exports the existing globals. Verify `npm run build` produces `dist/app.js` and app works.
2. **Convert shared + i18n + theme** — move `shared.js`, `i18n.js` into `src/`, extract theme into `src/theme.js`, wire imports in `main.js`.
3. **Convert page-2025 and page-2026** — straightforward, already self-contained.
4. **Split page-cmp** — extract `filters.js`, `charts.js`, `table.js` from `page-cmp.js`, wire through `page-cmp/index.js`.
5. **Split management** — extract one tab file at a time from `management.js`.
6. **Merge management.html** — add `page-mgmt` tab to `index.html`, delete `management.html` and `management.js`.
7. **Cleanup** — delete `.bak` files, `test_i18n.js`, update `CLAUDE.md`, add `dist/` to `.gitignore`.

## Success Criteria

- `npm run build` completes in under 1 second
- All three guide tabs work correctly
- Management tab works identically to the old `management.html` page
- No file in `src/` exceeds 400 lines
- Language toggle, dark mode, date picker all function correctly
- `dist/app.js` is the only script tag needed (besides data files)
