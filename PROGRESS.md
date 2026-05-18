# Migration Progress: esbuild + ES Modules

**Plan:** `docs/superpowers/plans/2026-05-18-esbuild-es-modules.md`  
**Started:** 2026-05-18

---

## Steps

| # | Step | Status |
|---|------|--------|
| 1 | Bootstrap esbuild | ✅ Done |
| 2 | Convert `shared.js`, `i18n.js`, extract `theme.js` | ✅ Done |
| 3 | Convert `page-2025.js`, `page-2026.js` | 🔄 In progress |
| 4 | Split `page-cmp.js` → 3 sub-modules | ⏳ Pending |
| 5 | Split `management.js` → 5 tab files | ⏳ Pending |
| 6 | Merge `management.html` as tab in `index.html` | ⏳ Pending |
| 7 | Cleanup + update `CLAUDE.md` | ⏳ Pending |

---

## Step 1 — Bootstrap esbuild

**Goal:** `npm run build` produces `dist/app.js`; app still works (nothing has moved yet).

- [x] Create `package.json` (esbuild ^0.25.0, no vulnerabilities)
- [x] Run `npm install` — 0 vulnerabilities
- [x] Create `src/main.js` (stub export)
- [x] Create `src/` directory structure (`pages/page-cmp/`, `pages/management/`)
- [x] Add `dist/` and `node_modules/` to `.gitignore`
- [x] Update `index.html` script tags — added `dist/app.js` at end
- [x] Verify: `npm run build` completes in 2ms ⚡, `dist/app.js` is 15 bytes

**Result:** App unchanged, build pipeline wired. Ready for Step 2.

## Step 2 — Convert `shared.js`, `i18n.js`, extract `theme.js`

**Goal:** Three modules live in `src/`. Old root-level files deleted.

- [x] Create `src/shared.js` — all exports, added `getGlobalDate`/`setGlobalDate`/`getGlobalLanguage`/`setGlobalLanguage` getters/setters
- [x] Create `src/i18n.js` — `TRANSLATIONS`, `t`, `tOpposite`, `titleAttr`; imports live `GLOBAL_LANGUAGE` from shared
- [x] Create `src/theme.js` — `initTheme`, `initLanguage`, `toggleTheme`, `toggleLanguage`, `updateLanguageButton`, `updateNavigationLabels`
- [x] Update `src/main.js` — imports all three modules, runs init, exposes `window.*` globals including `Object.defineProperty` for live `GLOBAL_DATE`/`GLOBAL_LANGUAGE` reads from legacy script tags
- [x] Remove `<script src="i18n.js">` and `<script src="shared.js">` from `index.html`
- [x] `git rm shared.js i18n.js`
- [x] Verify: `npm run build` → 21.8kb in 1ms ⚡

**Result:** `shared.js` and `i18n.js` fully migrated. `theme.js` extracted as new module. Root files deleted.
