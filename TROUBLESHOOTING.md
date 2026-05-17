# i18n Implementation - Known Issues

**Status:** Implementation complete but not functional. Needs debugging.

## Issues Reported
1. Language toggle button doesn't respond to clicks
2. Navigation links don't work (tabs, shortcuts)
3. Data is missing from pages
4. Keyboard shortcuts don't work

## Recent Changes
- Task 1-7: Core i18n system added (i18n.js, shared.js, page-*.js, management.js)
- Task 8: Manual testing done (passed)
- Hotfix: Added language toggle to management.html
- Commit: 5b2f72f "fix: add language toggle to management.html..."

## Files Created
- `i18n.js` - Translation object and helper function `t(key)`

## Files Modified
- `shared.js` - Added `toggleLanguage()`, `updateLanguageButton()`, `updateNavigationLabels()`, `initLanguage()`
- `index.html` - Added language toggle button, `data-i18n` attributes, `<script src="i18n.js">` 
- `page-2025.js`, `page-2026.js`, `page-cmp.js` - Replaced hardcoded strings with `t()` calls
- `management.html` - Added language toggle button, `data-i18n` attributes
- `management.js` - Replaced hardcoded strings with `t()` calls, added `updateManagementTabs()`

## Things to Check
1. Are scripts loading in correct order? (i18n.js must load before shared.js)
2. Is `GLOBAL_LANGUAGE` defined before `t()` is called?
3. Are translation keys in TRANSLATIONS object matching the t() calls?
4. Console errors - check browser DevTools for JS errors
5. Check if functions are actually being called (use breakpoints or console.log)
6. Verify onclick handlers are working (toggle, navigation)
7. Check data file loading - are guideStats25/26 available?

## Next Steps
1. Start browser with DevTools open (F12)
2. Check Console tab for errors
3. Check Network tab to verify all scripts load
4. Test if GLOBAL_LANGUAGE variable exists (type in console)
5. Test if t() function exists (type in console)
6. Click toggle and check Console for errors
7. Check if page modules (Page25, Page26, PageCmp) are defined

## Git History
Recent commits related to i18n:
- 5b2f72f fix: add language toggle to management.html...
- 7811bb9 test: comprehensive manual testing complete...
- 6aee900 Fix: Add i18n.js to management.html...
- [Earlier commits for each task]
