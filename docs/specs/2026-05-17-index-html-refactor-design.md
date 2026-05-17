# Design: Refactor index.html — Move Page-2025 to Self-Generating

**Date:** 2026-05-17  
**Scope:** Guides dashboard (evidencija)  
**Status:** Design phase

---

## Overview

The `index.html` file is 696 lines long and contains all page-specific DOM structure for three pages (2025, 2026, comparison). This violates the intended architecture where each page module owns its own structure.

**Goal:** Reduce index.html to a lightweight shell (~80 lines) by moving page structure generation into the page modules themselves. Start with page-2025 as a proof-of-concept, then replicate the pattern to page-2026 and page-cmp.

**Outcome:** Clearer ownership, easier maintenance, and a repeatable pattern for adding future pages.

---

## Current Architecture

### What Exists Today

| Layer | File | Responsibility |
|---|---|---|
| HTML | `index.html` | Nav shell + hard-coded page structure for all three pages (696 lines) |
| CSS | `guides.css` | All styles |
| JS – Shared | `shared.js` | Navigation logic (`showPage()`), theme toggle, date filtering |
| JS – Pages | `page-2025.js`, `page-2026.js`, `page-cmp.js` | Render content into pre-existing DOM elements |
| JS – Data | `data-2025.js`, `data-2026.js` | Generated guide statistics |

### Data Flow (Current)

```
HTML structure (index.html)
         ↓
JavaScript finds pre-existing elements by ID
         ↓
JavaScript populates content into those elements
```

### Problem

- **Mixed concerns:** index.html contains both nav shell and page-specific structure
- **Brittle selectors:** Page modules depend on specific IDs existing in index.html (e.g., `#free-section-body-25`, `#cityChart-25`)
- **Hard to change:** Adding/removing a page section requires editing both index.html and the page module
- **Maintenance burden:** Changes to page layout require hunting through 696 lines of markup

---

## Proposed Architecture

### What Changes

| Layer | File | Responsibility (After) |
|---|---|---|
| HTML | `index.html` | **Nav shell only** + three empty page containers (80 lines) |
| CSS | `guides.css` | All styles (unchanged) |
| JS – Shared | `shared.js` | Navigation logic (unchanged) |
| JS – Pages | `page-2025.js`, `page-2026.js`, `page-cmp.js` | **Generate own DOM structure** + render content |
| JS – Data | `data-2025.js`, `data-2026.js` | Generated guide statistics (unchanged) |

### Data Flow (After)

```
showPage('page-25') is called
         ↓
Page25.init() generates full HTML structure into the empty container
         ↓
Page25.renderAll() populates content into that structure
```

### What Stays the Same

- **Data files** — no changes
- **CSS** — no changes  
- **Navigation logic** — `showPage()` in shared.js works identically
- **Theme system** — toggle still works, charts still respond to theme changes
- **Page filtering/rendering methods** — `filterCity()`, `renderCard()`, etc. unchanged; they just target freshly-generated elements

---

## Implementation Strategy

### Phase 1: Validation (page-2025 in isolation)

**1.1 Create test page**
- File: `test-page-2025.html`
- Contents:
  - Minimal nav (theme toggle button, debug info)
  - Empty container: `<div id="page-25"></div>`
  - Script includes (in order): `guides.css`, `data-2025.js`, `shared.js`, `page-2025.js`
  - Console message on load: "Loaded with refactored page-2025.js"

**1.2 Refactor page-2025.js**

Add HTML builder methods:
```js
Page25 = {
  // ... existing properties ...
  
  _buildHeader() {
    // Returns: <div class="header">...</div>
    // Includes: heading, subtitle range label, date POV, badge
  },
  
  _buildFilters() {
    // Returns: <div class="filter-area">...</div>
    // Includes: City, Language, Month selects with correct options
  },
  
  _buildKpis() {
    // Returns: <div class="kpi-grid kpi-grid-4">...</div>
    // Includes: 4 KPI cards with correct IDs (kv-free-25, kv-paid-25, etc.)
  },
  
  _buildFreeTours() {
    // Returns: Free Tours section
    // Includes: section-divider, chart containers for city chart and avg pax
    // Includes: table container for monthly PAX
  },
  
  _buildPaidTours() {
    // Returns: Paid Tours section
    // Includes: paid city chart, private type pills + chart, shared type pills + chart
    // All with correct IDs matching current index.html
  },
  
  init() {
    if (this._initialized) return;
    this._initialized = true;
    
    const container = document.getElementById('page-25');
    container.innerHTML = 
      this._buildHeader() + 
      this._buildFilters() + 
      this._buildKpis() + 
      this._buildFreeTours() + 
      this._buildPaidTours();
    
    // Attach event listeners (if any inline onclick handlers remain)
    container.querySelectorAll('[onclick]').forEach(el => {
      // Re-bind if needed; most should work via event delegation
    });
    
    this.renderAll();
  },
};
```

**Constraints:**
- All generated IDs must match current index.html exactly (so `_el()` and `_scope()` still work)
- All classes must match current index.html exactly (CSS assumes specific structure)
- Inline `onclick` attributes can stay or be replaced with event listeners (user preference)

**1.3 Test in browser**
- Open `test-page-2025.html` in browser
- Verify all functionality:
  - ✓ Page renders on load (no white space, no console errors)
  - ✓ Header, filters, KPIs visible and styled correctly
  - ✓ Free Tours section expands/collapses
  - ✓ Paid Tours section expands/collapses
  - ✓ City filter works (updates chart and table)
  - ✓ Language filter works
  - ✓ Month filter works
  - ✓ Type pills work (private types, shared types)
  - ✓ Charts render (free PAX, paid tours, type charts)
  - ✓ Theme toggle works (colors update, charts update)
  - ✓ Print layout works correctly
  - ✓ Responsive design (test on mobile/tablet if possible)

**1.4 Commit test page**
```bash
git add test-page-2025.html
git commit -m "Test: Add standalone test page for refactored Page25"
```

---

### Phase 2: Live Deployment (swap into index.html)

**2.1 Replace page-2025.js**
- Overwrite current `page-2025.js` with the refactored version
- No other file changes yet

**2.2 Clean index.html**
- Remove the entire `<div id="page-25">...</div>` section (~120 lines)
- Replace with empty placeholder: `<div id="page-25"></div>`
- Verify index.html is now ~80–100 lines total

**2.3 Test in live dashboard**
- Open `index.html` in browser
- Verify page-2025 still works exactly as before (same steps as Phase 1.3)
- Verify navigation between pages still works
- Verify page-2026 and page-cmp still load (they're untouched)

**2.4 Clean up and commit**
```bash
git rm test-page-2025.html
git add page-2025.js index.html
git commit -m "Refactor: Move page-2025 structure generation to page-2025.js"
```

---

### Phase 3: Replicate for page-2026 and page-cmp (Future)

Once page-2025 is stable, the pattern repeats:

1. Create `test-page-2026.html` (copy test-page-2025.html, swap `data-2026.js` and `page-2026.js`)
2. Refactor `page-2026.js` using identical helper-method pattern
3. Test thoroughly (all filters, charts, interactions)
4. Validate in live index.html
5. Delete test page and merge

Same process for `page-cmp`.

---

## File Changes Summary

### Files Created
- `test-page-2025.html` (temporarily, for validation only)

### Files Modified
- `page-2025.js` — Add `_buildHeader()`, `_buildFilters()`, `_buildKpis()`, `_buildFreeTours()`, `_buildPaidTours()` methods; update `init()`
- `index.html` — Remove `<div id="page-25">...</div>` section; replace with `<div id="page-25"></div>`

### Files Unchanged
- `guides.css`
- `shared.js`
- `data-2025.js`, `data-2026.js`
- `page-2026.js`, `page-cmp.js` (Phase 2; will be refactored in Phase 3)

---

## Success Criteria

After Phase 2 completes:

- ✓ `index.html` is 80–100 lines (down from 696)
- ✓ All page-2025 functionality works identically (filters, charts, theme, print)
- ✓ No console errors in browser DevTools
- ✓ Navigation between all three pages works
- ✓ page-2026 and page-cmp still work (untouched)
- ✓ Code follows existing patterns in page-2025.js (small, focused methods)

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Generated HTML doesn't match current structure exactly | Test page catches this; validation phase validates all selectors |
| Theme system breaks (colors don't update) | `getChartColors()` and CSS variables unchanged; test verifies toggle |
| Charts don't render in newly generated elements | Charts initialized after DOM is generated; test verifies all chart types |
| Responsive design breaks | Test page includes mobile/tablet viewport testing |
| Print layout breaks | Test page validates print (Ctrl+P → Print Preview) |

---

## Notes on HTML Structure Preservation

The refactored `page-2025.js` must generate HTML with **identical**:
- Element IDs (e.g., `#kv-free-25`, `#cityChart-25`)
- CSS classes (e.g., `.kpi-grid`, `.chart-card`, `.section-divider`)
- DOM nesting (chart containers must be inside `.chart-card`, etc.)

This ensures:
- All CSS rules apply correctly
- All JavaScript selectors (`_el()`, `_scope()`) still work
- All event listeners (`onclick` handlers) still fire

The easiest approach: copy the exact HTML from index.html into template strings in the builder methods, then adjust IDs and content as needed. This ensures structure parity.

---

## Next Steps

1. ✓ Design approved (this document)
2. → Implement Phase 1 (create test page, refactor page-2025.js)
3. → Test and validate (all functionality works)
4. → Implement Phase 2 (deploy to live, clean up index.html)
5. → Verify live functionality
6. → Commit and review
7. → (Future) Repeat for page-2026 and page-cmp
