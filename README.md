# Produkcija Vodiča · FreeSpirit

Internal dashboard tracking guide production statistics for FreeSpirit travel agency. Deployed to GitHub Pages.

## Tabs

### Production Dashboard

| Tab | Content |
|-----|---------|
| **Vodiči 2025** | Full-year 2025 production per guide — free tours, paid tours, pax, monthly breakdown |
| **Vodiči 2026** | YTD 2026 production, updated monthly |
| **Usporedba** | Jan–May 2025 vs. 2026 side-by-side comparison with charts |
| **Management** | Financial analysis and operational insights — 5 sub-tabs |

Filters by city (Zagreb, Dubrovnik, Split, Zadar) and language (ENG, ESP, FRA) on each tab are independent. A date picker controls the as-of cutoff for partial-month data.

### Management sub-tabs

| Tab | Content |
|-----|---------|
| **P&L** | Revenue, costs, gross margin — KPIs, waterfall, monthly trend, billing methods |
| **Guides** | Per-guide financial performance — sortable table with 2026 vs 2025 comparison |
| **Channels** | OTA sources, commission analysis, direct vs. OTA trend, tour type breakdown |
| **Operational** | Group size efficiency, DOW/season patterns, payment methods, weekly trends |
| **Cities** | City comparison, tour type × city matrix, source distribution, language mix |

## Development

```bash
npm run build      # production bundle → dist/app.js
npm run dev        # watch mode (re-bundles on save)
```

Open `index.html` in a browser or use VS Code Live Server (port 5501). No linting step.

## Testing

```bash
npm test                          # JS unit tests (Vitest)
npm run test:watch                # watch mode

source venv/bin/activate
pytest tests/test_extract_guides.py -v   # Python extractor tests
```

CI runs both suites automatically on every push and pull request (GitHub Actions).

## Monthly data update

Source of truth is a local Excel file (`Copy of 1.1 Evidencija prodaje 26.xlsx`) not in this repo.

```bash
source venv/bin/activate
python3 scripts/extract_guides.py --year 2026 > data-2026.js
# Verify in browser, then:
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

To regenerate 2025 data (rarely needed):
```bash
python3 scripts/extract_guides.py --year 2025 > data-2025.js
```

## File structure

```
index.html                  Shell — 4 page containers + management sub-nav
guides.css                  All styles (CSS variables, dark mode, components)
data-2025.js                Generated — 2025 guide stats (full year, closed)
data-2026.js                Generated — 2026 guide stats (updated monthly)
src/
  main.js                   Entry point — boots theme/language, registers pages
  shared.js                 Constants, filteredStats(), showPage(), keyboard shortcuts
  i18n.js                   Translations and t() helper
  theme.js                  toggleTheme(), toggleLanguage()
  pages/
    page-2025.js            TY2025 tab
    page-2026.js            TY2026 tab
    page-cmp/index.js       Comparison tab + Chart.js
    management/index.js     Management tab — P&L, Guides, Channels, Ops, Cities
dist/
  app.js                    Bundled output (esbuild, IIFE) — not edited directly
scripts/
  extract_guides.py         Reads Excel, outputs data-2025.js / data-2026.js
tests/
  shared.test.js            JS unit tests (Vitest) — filteredStats, date helpers
  test_extract_guides.py    Python tests — extractor helpers + integration
.github/
  workflows/test.yml        CI — runs JS and Python tests on push/PR
```

## Tech

- **JS**: ES modules bundled with [esbuild](https://esbuild.github.io/). No framework.
- **Charts**: [Chart.js 4.4.1](https://www.chartjs.org/) from CDN.
- **Fonts**: [Google Fonts](https://fonts.google.com/) — Playfair Display, Montserrat, Inconsolata.
- **Data**: Python + openpyxl extracts from local Excel; outputs static JS files.
- **Tests**: [Vitest](https://vitest.dev/) for JS, [pytest](https://pytest.org/) for Python.
- **CI**: GitHub Actions.
