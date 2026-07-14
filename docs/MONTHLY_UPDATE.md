# Monthly Update Workflow — Vodiči Dashboard

## Overview

When new monthly data is entered in the Excel file, regenerating the dashboard takes a few commands and a git push.

---

## Files involved

| File | Role |
|------|------|
| `Copy of 1.1 Evidencija prodaje 26 new.xlsx` | Source of truth — all tour data lives here |
| `scripts/extract_guides.py` | Reads the Excel file, outputs JS data |
| `data-2026.js` | Generated data file consumed by `index.html` |
| `dist/app.js` | Bundled JS app — must be rebuilt and committed after any source change |
| `index.html` | The site shell — never needs to be edited for data updates |

---

## Step-by-step

### 1. Enter data in the Excel file

Open `Copy of 1.1 Evidencija prodaje 26 new.xlsx` and add the new month's tour rows to the **`helper_2026`** sheet. Each row represents one tour booking with columns for guide name, city, language, tour type, month, and pax count.

### 2. Regenerate `data-2026.js`

From the `evidencija/` directory:

```bash
# Activate the virtual environment (first time only, or if not active)
source venv/bin/activate

# Extract and overwrite data-2026.js
python3 scripts/extract_guides.py --year 2026 > data-2026.js
```

This reads the `helper_2026` sheet and outputs a fresh `data-2026.js` with updated `guideStats26` and `kpiTotals26`.

> **Note:** The script detects column positions automatically from the header row, so column order in the sheet does not need to match exactly.

### 3. Verify locally

Open `index.html` in a browser and check:
- KPI numbers on the **Vodiči 2026** tab match the expected totals
- The new month appears in each guide's monthly breakdown (click "Mjesečno" to expand)
- The **Usporedba** tab reflects the updated data in charts and comparison tables

### 4. Rebuild the bundle

```bash
npm run build
```

This regenerates `dist/app.js` from the source files in `src/`. The built file must be committed — GitHub Pages serves it directly.

### 5. Push to GitHub Pages

```bash
git add data-2026.js dist/app.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

GitHub Pages deploys automatically. The site is live within ~1 minute.

---

## What does NOT need to change

- `index.html` — never edit this for data updates
- `guides.css`, `src/shared.js`, `src/pages/page-2025.js`, `src/pages/page-2026.js`, `src/pages/page-cmp/index.js` — logic files, edit only for feature changes
- `data-2025.js` — 2025 is a closed year; only update if correcting historical data

---

## If you add a new guide mid-season

If a new guide starts working in 2026 and they have no entry yet in `guideStats26`, the extraction script will create their entry automatically once their tours appear in the Excel sheet. No manual editing of `data-2026.js` is needed.

The **Usporedba** tab will show them as a new guide (no 2025 comparison row), grayed out if they have no data in the comparison window.

---

## Updating the comparison date range

The comparison tab currently shows **January–May** (months 1–5). To extend it to June after June data is available, edit `src/pages/page-cmp/index.js`:

1. In the `_buildHeader()` method, update the subtitle text:
```html
<!-- Change: -->
<p><span class="ytd-range-label">Jan–May</span> 2025 vs. 2026 &middot; ...</p>
<!-- To: -->
<p><span class="ytd-range-label">Jan–Jun</span> 2025 vs. 2026 &middot; ...</p>
```

2. If you're also adding June data processing, look for any month loops (`m <= 5`) and update them to `m <= 6`.

3. After editing, run `npm run build` and commit `dist/app.js` along with the source change.

---

## Troubleshooting

**`Column "X" not found`** — the header row in the sheet was renamed. Check column names in the Excel file and compare with what the error lists.

**Guide missing from output** — the guide's name in the Excel sheet may have a typo or extra space. Names must match exactly across rows.

**`ModuleNotFoundError: openpyxl`** — run `pip install openpyxl` inside the venv, or activate the venv with `source venv/bin/activate` before running the script.

**Site is blank on GitHub Pages** — `dist/app.js` was not committed. Run `npm run build`, then `git add dist/app.js` and push.
