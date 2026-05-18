# Migration Progress: esbuild + ES Modules

**Plan:** `docs/superpowers/plans/2026-05-18-esbuild-es-modules.md`  
**Started:** 2026-05-18

---

## Steps

| # | Step | Status |
|---|------|--------|
| 1 | Bootstrap esbuild | ✅ Done |
| 2 | Convert `shared.js`, `i18n.js`, extract `theme.js` | ⏳ Pending |
| 3 | Convert `page-2025.js`, `page-2026.js` | ⏳ Pending |
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
