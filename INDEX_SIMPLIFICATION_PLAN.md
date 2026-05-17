# index.html Simplification Plan

**Current State:** 708 lines, 148 KB, 249 divs, 6 inline styles  
**Goal:** Reduce complexity, improve maintainability, eliminate duplication

---

## 1. REMAINING INLINE STYLES (6 instances)

### Line 20: Logo/Nav flex container
```html
<div style="display:flex;align-items:center;gap:0">
```
→ Replace with: `class="flex-row flex-gap-0"`

### Line 22: Logo image
```html
alt="Free Spirit" style="height:28px;display:block;flex-shrink:0;margin-right:8px"
```
→ Replace with: `class="img-nav"`

### Line 27: Management link
```html
style="text-decoration:none"
```
→ Replace with: `class="text-decoration-none"`

### Lines 64, 225, 378: Date POV containers (3x)
```html
<div id="date-pov-25" style="margin-bottom:6px"></div>
```
→ Replace with: `class="mb-6"` (need to add `.mb-6` utility class to guides.css)

**Action:** Add missing utility classes to guides.css, replace all 6 inline styles

---

## 2. KEYBOARD SHORTCUT HANDLER (Lines ~697-715)

### Current Pattern:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', (e) => {
        if (e.key === '1') { showPage(...); return; }
        if (e.key === '2') { showPage(...); return; }
        // ... 5 more if statements
    });
});
```

### Simplification Opportunity:
Extract to shared.js as `initKeyboardShortcuts()` with a lookup map:

```javascript
const KEYBOARD_SHORTCUTS = {
    '1': () => showPage('page-25', document.getElementById('tab-25')),
    '2': () => showPage('page-26', document.getElementById('tab-26')),
    '3': () => showPage('page-cmp', document.getElementById('tab-cmp')),
    '4': () => window.location.href = 'management.html',
    't': () => toggleTheme(),
    'd': () => document.getElementById('cutoff-picker')?.focus(),
    '?': () => toggleShortcutOverlay(),
    'Escape': () => closeShortcutOverlay(),
};

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const handler = KEYBOARD_SHORTCUTS[e.key];
        if (handler) {
            handler();
            e.preventDefault();
        }
    });
}
```

**Action:** Extract handler to shared.js, call `initKeyboardShortcuts()` from DOMContentLoaded

---

## 3. REPETITIVE PAGE STRUCTURE (Pages 25, 26, CMP)

### Current Pattern:
Three nearly identical page sections:
- `#page-25` (lines ~40-220)
- `#page-26` (lines ~221-376)
- `#page-cmp` (lines ~377-550)

Each has:
- `.header` with title, subtitle
- `.main` container
- `.filter-area` with city/lang/month dropdowns
- KPI cards (identical structure)
- Charts/tables

### Duplication Breakdown:
- **Header structure:** Repeated 3x (~15 lines each) = 45 lines
- **Filter area:** Repeated 3x (~25 lines each) = 75 lines
- **KPI cards:** Repeated 3x (~25 lines each) = 75 lines
- **Total duplication:** ~195 lines could be consolidated

### Consolidation Approach:
Instead of hardcoding page structures, use a data-driven approach:

```javascript
// In shared.js
const PAGE_CONFIG = {
    'page-25': {
        title: 'Guides',
        subtitle: 'Tour production by guide · Free vs. Paid · Jan–May',
        badge: 'Travel Year 2025 · Closed',
        class: 'y25',
        filters: ['city', 'lang', 'month'],
    },
    'page-26': {
        title: 'Guides',
        subtitle: 'Tour production by guide · Free vs. Paid · Jan–May',
        badge: 'Travel Year 2026 · Active',
        class: 'y26',
        filters: ['city', 'lang', 'month'],
    },
    'page-cmp': {
        title: 'Comparison',
        subtitle: '2025 vs 2026 year-to-date',
        badge: 'Jan–May comparison',
        class: 'cmp',
        filters: [],
    },
};

// Generate pages from config instead of hardcoding
```

**Potential savings:** 150-200 lines of HTML (20-25% reduction)

**Risk Level:** MEDIUM (requires careful refactoring to maintain functionality)

---

## 4. HARDCODED FILTER OPTIONS

### Current:
```html
<select class="filter-select" id="city-filter-25">
    <option value="all">All</option>
    <option value="Zagreb">Zagreb</option>
    <option value="Dubrovnik">Dubrovnik</option>
    <option value="Split">Split</option>
    <option value="Zadar">Zadar</option>
</select>
```

Repeated 3 times (pages 25, 26, cmp) = 3 × 5 options = 15 duplicate option lines

### Consolidation:
Use CITIES constant from shared.js to generate options dynamically:

```javascript
// In shared.js - already exists
const CITIES = ['Zagreb','Dubrovnik','Split','Zadar'];

// Generate in JavaScript instead of hardcoding
```

**Savings:** ~15 lines of HTML

---

## 5. ONCLICK HANDLERS (Could Use Event Delegation)

### Current:
```html
<select class="filter-select" id="city-filter-25" onchange="Page25.filterCity(this.value)">
<select class="filter-select" id="lang-filter-25" onchange="Page25.filterLang(this.value)">
<select class="filter-select" id="month-filter-25" onchange="Page25.filterMonth(this.value)">
<!-- Repeated 3x for pages 25, 26, cmp -->
```

### Issue:
Multiple inline event handlers scattered throughout HTML

### Alternative:
Event delegation in page objects:

```javascript
// In page-2025.js
_scope('select[id*="-filter-"]').forEach(sel => {
    sel.addEventListener('change', (e) => {
        const [scope, type] = e.target.id.match(/filter-(\w+)/).slice(1);
        this[`filter${type.charAt(0).toUpperCase() + type.slice(1)}`](e.target.value);
    });
});
```

**Benefit:** Cleaner HTML, centralized event handling, easier to debug

---

## 6. RESPONSIVE CLASSES (Could Be Simplified)

### Current:
Multiple responsive breakpoints mixed throughout styles and HTML

### Check:
- How many media queries are page-specific?
- Can common responsive patterns be extracted to utilities?

**Action:** Audit guides.css responsive section for consolidation

---

## SIMPLIFICATION PRIORITY

### High Impact, Low Risk:
1. ✅ Replace 6 inline styles with utility classes (`mb-6`, others)
2. ✅ Extract keyboard shortcuts handler to shared.js

### Medium Impact, Medium Risk:
3. Generate filter options dynamically from CITIES constant
4. Use event delegation instead of inline onchange handlers

### High Impact, High Risk (Do Later):
5. Template/data-driven page generation
6. Consolidate repetitive page structures

---

## FILES TO MODIFY (Next Session)

| File | Changes | Risk | Benefit |
|------|---------|------|---------|
| `index.html` | Remove 6 inline styles, 15 filter option lines, keyboard handler | LOW | -30 lines |
| `shared.js` | Add keyboard shortcuts handler, KEYBOARD_SHORTCUTS map | LOW | Cleaner code |
| `guides.css` | Add `.mb-6` utility class | VERY LOW | Complete utilities set |

---

## BEFORE/AFTER METRICS

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| index.html lines | 708 | ~650-680 | 20-55 lines |
| Inline styles | 6 | 0 | 100% |
| Hardcoded filter options | 15 | 0 | 100% |
| DOMContentLoaded complexity | High | Low | ~20 lines |
| Duplication | Moderate | Reduced | ~30-50 lines |

---

## TESTING CHECKLIST (After Changes)

- [ ] All filter dropdowns work (city, language, month)
- [ ] Keyboard shortcuts (1, 2, 3, 4, t, d, ?, Escape) work
- [ ] Page switching works smoothly
- [ ] Theme toggle works on all pages
- [ ] Date picker works
- [ ] Responsive design on mobile
- [ ] No console errors
- [ ] Charts render correctly

---

## NOTES FOR NEXT SESSION

- **CITIES constant** already exists in shared.js (line 3) - use it!
- **CSS utilities** mostly complete - just add `.mb-6`
- **Page objects** (Page25, Page26, PageCmp) handle all logic - HTML is just structure
- **No breaking changes** - all changes are refactoring only
- **Git history** available if needed to reference original patterns

---

**Status:** Ready for implementation
**Estimated Time:** 30-45 minutes for high-priority fixes (quick wins)
**Complexity Level:** LOW-MEDIUM (mostly find-and-replace)

---

## 🚨 LESSONS LEARNED (from today's CSS consolidation)

### Critical Gotchas to Avoid:

1. **CSS Merge Data Loss**
   - When merging CSS files, indentation matters
   - **What happened:** Extracted lines 15-445 with indentation, lost original CSS variables
   - **Fix:** Always extract clean (unindented) CSS, preserve original structure
   - **For index.html:** Use sed with care, preview first with `sed -n 'X,Yp'`

2. **Large Files Are Difficult to Edit**
   - index.html is 708 lines — can't use Read tool to view whole file
   - **Solution:** Use `sed -n '50,60p' index.html` to preview sections
   - **Always:** Use `grep -n "pattern"` to find line numbers first

3. **Sed Operations Are Destructive**
   - Once you use `sed -i ''`, changes are permanent
   - **Safety:** Always run without `-i` flag first to preview
   - **Backup:** Create `.bak` file before making changes
   - **Recovery:** `git restore filename` to revert

4. **Block Removal Affects Adjacent Elements**
   - When removing `<style>` block (lines 14-447), the `</head>` tag also got deleted
   - **Lesson:** Verify context lines before running deletion
   - **Solution:** Check with `sed -n '13,450p'` to see surrounding content

5. **String Replacements Can Be Fragile**
   - Tried chaining multiple sed commands → FAILED
   - **What works:** Run each sed command on separate lines
   - **Better:** Use `-e` flag for multiple expressions: `sed -i '' -e 's/a/b/g' -e 's/c/d/g'`

6. **HTML Structure Assumptions**
   - Don't assume HTML structure is obvious — it changes over time
   - **Check:** Verify IDs and selectors match before using in JavaScript
   - **Example:** If you change `id="city-filter-25"`, page-2025.js breaks (uses `_el('city-filter')`)

---

## 📋 PRE-FLIGHT CHECKLIST (Before Starting Session)

- [ ] Read this plan + quick reference
- [ ] Review gotchas section above
- [ ] Understand that inline styles are the quick win
- [ ] Know the 6 style replacements (see quick reference table)
- [ ] Have guides.css open to add `.mb-6` class
- [ ] Understand keyboard shortcut extraction is optional (but recommended)
- [ ] Know you can always `git restore filename` if something breaks
- [ ] Plan to commit after each major change

---

## 🔄 WORKFLOW FOR NEXT SESSION

1. **Make one change at a time**
   - Replace inline styles (takes 2 min each)
   - Test in browser (30 sec)
   - Commit (1 min)
   - **Total:** 3 min per change, only 6 changes needed

2. **Test immediately after each commit**
   - Hard refresh browser (Cmd+Shift+R)
   - Verify all filters work
   - Check nothing broke

3. **If something breaks**
   - Don't panic: `git restore filename`
   - Start over, smaller steps
   - Ask what went wrong

4. **Commit frequently**
   - Don't try to do everything in one commit
   - Each change = one commit
   - Easier to roll back if needed

---

## 📊 SUCCESS INDICATORS

You'll know you're done when:
- ✅ All 6 inline styles replaced with classes
- ✅ index.html has 0 style= attributes
- ✅ `.mb-6` class added to guides.css
- ✅ Keyboard shortcuts still work (1,2,3,4,t,d,?,Esc)
- ✅ All filters work (city, language, month)
- ✅ Page switching works
- ✅ Theme toggle works
- ✅ No console errors


