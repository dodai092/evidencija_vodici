# index.html Simplification - Quick Reference

## 🎯 QUICK WINS (Do First)

### 1. Add Missing Utility Classes to guides.css

Add this to the end of guides.css (before closing):

```css
.mb-6 { margin-bottom: 6px; }
```

### 2. Find & Replace Inline Styles in index.html

| Find | Replace With | Lines |
|------|--------------|-------|
| `style="display:flex;align-items:center;gap:0"` | `class="flex-row flex-gap-0"` | 20 |
| `style="height:28px;display:block;flex-shrink:0;margin-right:8px"` | `class="img-nav"` | 22 |
| `style="text-decoration:none"` | `class="text-decoration-none"` | 27 |
| `style="margin-bottom:6px"` | `class="mb-6"` | 64, 225, 378 (3x) |

**Time:** 2 minutes
**Result:** 100% removal of inline styles from index.html

---

## 📋 EXTRACT KEYBOARD SHORTCUTS

### Step 1: Add to shared.js (after CSS constant)

```javascript
// Keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = {
    '1': () => {
        const tab = document.getElementById('tab-25');
        if (tab) showPage('page-25', tab);
    },
    '2': () => {
        const tab = document.getElementById('tab-26');
        if (tab) showPage('page-26', tab);
    },
    '3': () => {
        const tab = document.getElementById('tab-cmp');
        if (tab) showPage('page-cmp', tab);
    },
    '4': () => {
        window.location.href = 'management.html';
    },
    't': () => toggleTheme(),
    'd': () => {
        const picker = document.getElementById('cutoff-picker');
        if (picker) picker.focus();
    },
    '?': () => toggleShortcutOverlay(),
    'Escape': () => {
        const overlay = document.getElementById('shortcut-overlay');
        if (overlay) overlay.style.display = 'none';
    },
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

### Step 2: Remove from index.html

Find and remove this entire section (currently around line 697-715):

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // ... keyboard handling code ...
    if (e.key === '1') { showPage('page-25', document.getElementById('tab-25')); return; }
    // ... etc
});
```

Replace with:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    initKeyboardShortcuts();
    // ... rest of DOMContentLoaded code
});
```

**Time:** 5 minutes
**Result:** ~15 lines removed, keyboard logic centralized

---

## 🔄 DYNAMIC FILTER GENERATION (Optional, More Complex)

### Approach: Use CITIES constant for dropdowns

Instead of:
```html
<select id="city-filter-25">
    <option value="all">All</option>
    <option value="Zagreb">Zagreb</option>
    <option value="Dubrovnik">Dubrovnik</option>
    <!-- ... -->
</select>
```

Use JavaScript to populate in page-2025.js:

```javascript
Page25 = {
    // ... existing code ...
    
    init() {
        this._initFilters();
        // ... rest of init
    },
    
    _initFilters() {
        const citySelect = this._el('city-filter');
        if (citySelect) {
            citySelect.innerHTML = '<option value="all">All</option>';
            CITIES.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });
        }
    },
    // ... rest of page
};
```

**Time:** 15 minutes (for all 3 pages)
**Result:** ~15 lines removed from HTML, uses DRY principle

---

## 📊 CURRENT SIMPLIFICATION OPPORTUNITIES

### Quick Wins Summary:
- **Remove inline styles:** 6 instances → ~10 minutes
- **Extract keyboard handler:** ~15 lines → ~5 minutes
- **Total time for quick wins:** ~15-20 minutes
- **Total lines saved:** ~30 lines

### Optional Improvements:
- Generate filter options dynamically: ~15-20 minutes, ~15 lines saved
- Event delegation for filters: ~20 minutes, cleaner HTML
- Template-based page generation: ~1-2 hours, ~150 lines saved (high risk)

---

## ✅ TESTING AFTER CHANGES

```javascript
// Run in browser console to verify
console.log('CITIES:', CITIES);
console.log('KEYBOARD_SHORTCUTS:', KEYBOARD_SHORTCUTS);
console.log('Page25 initialized:', Page25._initialized);
console.log('Page26 initialized:', Page26._initialized);
console.log('PageCmp initialized:', PageCmp._initialized);
```

---

## 📁 DEPENDENT FILES

When modifying index.html, these files are affected:
- `shared.js` - Provides showPage(), toggleTheme(), CITIES
- `page-2025.js` - Page25 object
- `page-2026.js` - Page26 object
- `page-cmp.js` - PageCmp object
- `guides.css` - Styles and utilities

---

## 🚨 THINGS TO WATCH

1. **Filter IDs must match:** `city-filter-25`, `lang-filter-25`, `month-filter-25`
   - These are hardcoded in page-2025.js in the `_el()` method
   - Don't rename them

2. **Tab IDs must match:** `tab-25`, `tab-26`, `tab-cmp`, `tab-mgmt`
   - These are hardcoded in keyboard shortcuts and showPage() function

3. **Test keyboard shortcuts** after extracting:
   - Press 1, 2, 3, 4, t, d, ?, Escape
   - All should work exactly as before

4. **Test filter changes** after simplification:
   - Change city, language, month dropdowns
   - Charts should update (no manual interaction)

---

## 💾 GIT COMMANDS FOR NEXT SESSION

```bash
# Check current status
git status

# Make changes, then:
git add index.html shared.js guides.css

# Commit with clear message
git commit -m "Simplify: Remove inline styles and extract keyboard shortcuts

- Replace 6 inline styles with utility classes (.flex-row, .mb-6, etc.)
- Extract keyboard shortcuts handler to shared.js (initKeyboardShortcuts)
- Add .mb-6 utility class to guides.css
- Consolidated event handling, improved maintainability

Result: -30 lines, 100% inline style removal, keyboard logic centralized"

# Push to GitHub
git push
```

---

## 📈 SUCCESS METRICS

After completing all quick wins:
- [ ] index.html: 708 → 680 lines (4% reduction)
- [ ] Zero inline styles in index.html
- [ ] Keyboard shortcuts in shared.js
- [ ] All tests pass
- [ ] No console errors
- [ ] Visual appearance unchanged
- [ ] All functionality preserved

---

**Ready to start?** Begin with the 6 inline style replacements (10 minutes) to build momentum! 🚀
