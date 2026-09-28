# Jura look and feel for evidencija: design

Date: 2026-09-28. Status: design approved in chat, spec awaiting review.

## Goal

Make the evidencija report look like `jura-guide-report`, so Tin's and Jura's reports read as one family. Look and feel only. No tab, filter, feature, DOM structure or page JS behaviour changes.

## Decisions (approved 2026-09-28)

- Approach A: one new stylesheet, `jura-theme.css`, loaded after `guides.css`. `guides.css` and `../shared/fs-core.css` are not edited (fs-core is shared with the monday and recap reports). Removing one `<link>` line switches the theme off.
- Palette: adopt Jura's, including its city hues and year colors. Every chart changes color, because charts read CSS variables.
- Page header: shrink to a compact title row. Nothing is deleted from the DOM, so `date-pov`, the range label and existing selectors keep working. The teal "Comparison YTD" badge is hidden.
- Out of scope: Bookings tab, guide notes, mobile bottom nav, any new data, any change to `fs-core.css`.

## Token mapping

`jura-theme.css` redefines these on `:root` and `body.dark-mode`. evidencija's own names are kept and given Jura's values, so no other file needs renaming.

| evidencija token | new value (light) | new value (dark) | Jura source |
|---|---|---|---|
| `--font-sans`, `--font-serif`, `--font-mono` | IBM Plex Sans stack, all three | same | `body` font |
| `--radius` | 4px | 4px | `--radius` |
| `--white` (page background) | `#ffffff` | `#121212` | `--bg` |
| `--smoke`, `--card-bg` | `#f5f5f5` | `#1e1e1e` | `--bg2` |
| `--border`, `--border-dark` | `#dddddd` | `#333333` | `--border` |
| `--text` | `#1a1a1a` | `#f0f0f0` | `--text` |
| `--text2` | `#4d4d4d` | `#c0c0c0` | none in Jura, chosen between text and text3 |
| `--text3` | `#767676` | `#a0a0a0` | `--text3` |
| `--zagreb` `--dubrovnik` `--split` `--zadar` | `#2a78d6` `#eb6834` `#1baf7a` `#eda100` | same | city hues |
| `--zagreb-pill` etc. (text on tinted fills) | Jura `-text` variants: `#2771ca` `#ce4914` `#15875e` `#916300` | `#3780d8` `#eb6834` `#1baf7a` `#eda100` | `--*-text` |
| `--y25` | `#4a3aa7` | `#4a3aa7` | `--y25` |
| `--y26` | `#1a1a1a` | `#f0f0f0` | `--y26` |
| `--delta-pos/neg/neu` | unchanged | unchanged | same values |

Note: `--white` is both the page background and the text color on filled pills in the current CSS. The theme layer overrides the affected rules (city head cells, active pills) explicitly instead of relying on the token.

Charts: `getChartColors()` and `getCityColor()` already read these variables, so chart colors follow with no JS. Chart font strings (`'Montserrat',sans-serif`) in `src/pages/page-cmp/charts.js` and the tour pages change to the Plex stack. `getChartColors` and `getCityColor` in `src/shared.js` also switch from reading `<html>` to reading `<body>`, because the dark tokens live on `body.dark-mode`. These are the only JS touched.

## Components restyled

- Font loading: add the Google Fonts `<link>` for IBM Plex Sans (400, 500, 600, 700) to `index.html`. The `fs-core.css` `@import` of Playfair, Montserrat and Inconsolata stays (shared file), so those still download.
- Nav: flat bar, 1px bottom border, 28px logo, tabs with a 2px underline on the active one, "Data through" date input and theme toggle in Jura's outlined 32px style. Print button kept, restyled plain.
- Page header: compact title row (h1 about 20px, weight 600), range and as-of text below in muted 13px, badge hidden.
- Filter bar: city and language pills become Jura chips (4px radius, active = filled text color, active city = 16% city tint). Selects and search input use Jura's 1px border and 4px radius.
- KPI cards and chart cards: 1px border, 4px radius, no shadow, label 11px uppercase muted, value 26px weight 600.
- Guide cards: remove the colored stripe. Card gets a 10% city tint, avatar becomes a 32px rounded-square, name 14px weight 600. Rank, New and Inactive badges use Jura's outlined 10px style.
- Tables (`.mpax-table`, Guides table, monthly tables): flat, 13px, 1px row borders, total row with a 2px top border, city columns tinted 12% (headers 22%), group head cells given a real background and text color.
- Detail modal, movers banner: Jura's flat modal and banner styling (border, 4px radius, `--bg2` banner lines).
- Page container: 1440px max width, 24px padding, matching Jura.
- Dark mode: Jura's dark surface and text values from the table above.

## Not changed

Page and tab structure, HTML, page JS behaviour, data files, tab keys, `fs-core.css`, the monday and recap reports, the Management tab layout (it gets the new tokens, fonts and component styling like everything else, and no structural change).

## Verification

- `npm run build`, vitest, and the full Playwright suite stay green. There is no DOM change, so no test should need editing. Any that do are a finding.
- Before and after screenshots of every tab (Tours 2025, Tours 2026, Comparison, Guides, Management with its five sub-tabs, the Guides detail modal), light and dark, each next to the matching Jura tab where one exists. Antun reviews these before anything is kept.
- Contrast check on text over city tints and on the group head cells in both themes.
- No console errors on any tab.
- Print stylesheet spot-check (Print / Save PDF still produces a clean page).

## Risks

- Specificity: `guides.css` is 2000 lines with many specific selectors. `jura-theme.css` loads last and matches selector specificity where needed. Overrides that need `!important` are a signal to recheck, not a default.
- Management tab was built around the old tokens (sticky KPI bar, sub-nav offsets use `--nav-h` of 60px). A nav height change needs `--nav-h` updated to match, or those offsets drift.
- Charts change color everywhere, including single-year charts on Tours 2025 and 2026. Some legends and delta overlays draw their own colors in JS and may need a follow-up check.
- Two font families still load from `fs-core.css`. Accepted cost of not editing the shared file.

## Follow-ups (separate work, already approved in chat)

Design 2: category hover tooltip with both years, default as-of date from the data, Comparison takeaway sentence, basis notes, sticky filter bars. Bounded changes, done test-first after this restyle, no plan document.

## Corrections made while writing the plan (2026-09-28)

- Dark `--y25` is `#7b6df0` (Jura's `#4a3aa7` is about 2:1 on `#121212`).
- Active city chip text is `var(--text)` on the 16 percent tint (Jura's hue-colored text measures about 4.0:1 in light mode).
- Table body cells are not tinted per city (Jura does it with per-cell classes, which would need markup changes).
- Nav, `--pad` and `--nav-h` rules are desktop-only (`min-width: 769px`), because evidencija already has a phone layout with a fixed bottom tab bar that must stay untouched.
