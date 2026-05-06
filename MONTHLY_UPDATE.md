# Monthly Update Workflow — Vodiči Dashboard

## Overview

When new monthly data is entered in the Excel file, regenerating the dashboard takes two commands and a git push.

---

## Files involved

| File | Role |
|------|------|
| `Copy of 1.1 Evidencija prodaje 26.xlsx` | Source of truth — all tour data lives here |
| `extract_guides.py` | Reads the Excel file, outputs JS data |
| `data-2026.js` | Generated data file consumed by `index.html` |
| `index.html` | The site — never needs to be edited |

---

## Step-by-step

### 1. Enter data in the Excel file

Open `Copy of 1.1 Evidencija prodaje 26.xlsx` and add the new month's tour rows to the **`helper_2026`** sheet. Each row represents one tour booking with columns for guide name, city, language, tour type, month, and pax count.

### 2. Regenerate `data-2026.js`

From the `evidencija/` directory:

```bash
cd /path/to/evidencija

# Activate the virtual environment (first time only, or if not active)
source venv/bin/activate

# Extract and overwrite data-2026.js
python3 extract_guides.py --year 2026 > data-2026.js
```

This reads the `helper_2026` sheet and outputs a fresh `data-2026.js` with updated `guideStats26` and `kpiTotals26`.

> **Note:** The script detects column positions automatically from the header row, so column order in the sheet does not need to match exactly.

### 3. Verify locally

Open `index.html` in a browser and check:
- KPI numbers on the **Vodiči 2026** tab match the expected totals
- The new month appears in each guide's monthly breakdown (click "Mjesečno" to expand)
- The **Usporedba** tab reflects the updated data in charts and comparison tables

### 4. Push to GitHub Pages

```bash
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

GitHub Pages deploys automatically. The site is live within ~1 minute.

---

## What does NOT need to change

- `index.html` — never edit this for data updates
- `guides.css`, `shared.js`, `page-2025.js`, `page-2026.js`, `page-cmp.js` — logic files, edit only for feature changes
- `data-2025.js` — 2025 is a closed year; only update if correcting historical data

---

## If you add a new guide mid-season

If a new guide starts working in 2026 and they have no entry yet in `guideStats26`, the extraction script will create their entry automatically once their tours appear in the Excel sheet. No manual editing of `data-2026.js` is needed.

The **Usporedba** tab will show them as a new guide (no 2025 comparison row), grayed out if they have no data in the comparison window.

---

## Updating the comparison date range

The comparison tab currently shows **January–May** (months 1–5). To extend it to June after June data is available, edit the `ytd()` function in `page-cmp.js`:

```js
// Change this line:
for (let m = 1; m <= 5; m++) {
// To:
for (let m = 1; m <= 6; m++) {
```

Also update the subtitle in `index.html`:
```html
<!-- Change: -->
<p>Sij&ndash;Svi 2025 vs. 2026 &middot; ...</p>
<!-- To: -->
<p>Sij&ndash;Lip 2025 vs. 2026 &middot; ...</p>
```

---

## Troubleshooting

**`Column "X" not found`** — the header row in the sheet was renamed. Check column names in the Excel file and compare with what the error lists.

**Guide missing from output** — the guide's name in the Excel sheet may have a typo or extra space. Names must match exactly across rows.

**`ModuleNotFoundError: openpyxl`** — run `pip install openpyxl` inside the venv, or activate the venv with `source venv/bin/activate` before running the script.
