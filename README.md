# Produkcija Vodiča · FreeSpirit

Internal dashboard tracking guide production statistics for FreeSpirit travel agency.

## Tabs

| Tab | Content |
|-----|---------|
| **Vodiči 2025** | Full-year 2025 production per guide — free tours, paid tours, pax, monthly breakdown |
| **Vodiči 2026** | YTD 2026 production, updated monthly |
| **Usporedba** | Jan–May 2025 vs. 2026 side-by-side comparison with charts |

Filters by city (Zagreb, Dubrovnik, Split, Zadar) and language (ENG, ESP, FRA) on each tab are independent.

## Files

```
index.html        Main site — three tabs, shared nav
guides.css        All styles
shared.js         Shared constants and tab-switching logic
page-2025.js      TY2025 tab rendering
page-2026.js      TY2026 tab rendering
page-cmp.js       Comparison tab rendering + Chart.js
data-2025.js      2025 guide data (static — full year closed)
data-2026.js      2026 guide data — updated each month
extract_guides.py Reads local Excel file, regenerates data-2026.js
MONTHLY_UPDATE.md Step-by-step update instructions
```

## Monthly update

See [MONTHLY_UPDATE.md](MONTHLY_UPDATE.md) for the full workflow. Short version:

```bash
python3 extract_guides.py --year 2026 > data-2026.js
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

The Excel source file is kept locally and is not in this repository.

## Tech

Static HTML — no build step, no framework. [Chart.js 4.4.1](https://www.chartjs.org/) loaded from CDN for the comparison charts. [Google Fonts](https://fonts.google.com/) for typography (Playfair Display, Montserrat, Inconsolata).
