# Monthly Update Workflow — Vodiči Dashboard

## Overview

When new monthly data is entered in the Excel file, regenerating the dashboard takes a few commands and a git push.

---

## Files involved

| File | Role |
|------|------|
| `1.1 Evidencija prodaje 26.xlsx` | Source of truth — all tour data lives here |
| `scripts/extract_guides.py` | Reads the Excel file, outputs JS data |
| `data-2026.js` | Generated data file consumed by `index.html` |
| `dist/app.js` | Bundled JS app — built from `src/`. `data-2026.js` is loaded as a separate `<script>` tag, not bundled, so a data-only update does **not** require a rebuild |
| `index.html` | The site shell — never needs to be edited for data updates |

---

## Step-by-step

### 1. Get the latest data into the Excel file

Two ways, depending on the session:

- **In a Claude session with the Google Drive connector available (fastest):** ask Claude to pull the live sheet — it calls `get_file_metadata`/`download_file_content` on the sheet's Drive file ID with `exportMimeType: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and overwrites `1.1 Evidencija prodaje 26.xlsx` with the result. See `docs/adr/0002-authenticated-drive-pull-for-guide-data.md` — this works because the connector is authenticated as a user the sheet is shared with, unlike the anonymous CSV export ADR 0001 ruled out.
- **Otherwise (fallback):** open `1.1 Evidencija prodaje 26.xlsx` and add the new month's tour rows to the **`Evidencija`** sheet manually, or have whoever owns the Google Sheet export it and drop it at that path. Each row represents one tour booking with columns for guide name, city, language, tour type, month, and pax count.

### 2. Regenerate `data-2026.js`

From the `evidencija/` directory:

```bash
# Activate the virtual environment (first time only, or if not active)
source venv/bin/activate

# Extract and overwrite data-2026.js
python3 scripts/extract_guides.py --year 2026 > data-2026.js
```

This reads the `Evidencija` sheet and outputs a fresh `data-2026.js` with updated `guideStats26` and `kpiTotals26`.

> **Note:** The script detects column positions automatically from the header row, so column order in the sheet does not need to match exactly.

> **There's also a GitHub Actions workflow** ("Update guide data", `.github/workflows/update-data.yml`) that can run this same extraction remotely and push the result, reading the sheet via a `SHEET_URL` secret instead of the local Excel file. As of this writing that secret is **not set** on this repo (`gh secret list` returns none) — triggering that workflow today would fail. The steps above (local Excel, manual run) are the process that actually works. If a `SHEET_URL` secret is ever added, this note should be revisited.

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
- `guides.css`, `src/shared.js`, `src/pages/page-2025.js`, `src/pages/page-2026.js`, `src/pages/page-cmp/index.js` — logic files, edit only for feature changes
- `data-2025.js` — 2025 is a closed year; only update if correcting historical data

---

## If you add a new guide mid-season

If a new guide starts working in 2026 and they have no entry yet in `guideStats26`, the extraction script will create their entry automatically once their tours appear in the Excel sheet. No manual editing of `data-2026.js` is needed.

The **Usporedba** tab will show them as a new guide (no 2025 comparison row), grayed out if they have no data in the comparison window.

---

## The comparison date range

The Comparison tab's range (shown as e.g. "Jan–Jun" or "Jan–Aug") and its month dropdown are computed automatically from the "as-of" date cutoff (or the active month filter, if one is set) every time the tab renders — there is nothing to edit here as new months land. The `Jan–Jun` text hardcoded in `index.html`'s `<span class="ytd-range-label">` elements is only a placeholder shown before JS first runs; `page-cmp/index.js` overwrites it on render. A data-only update (Steps 1–4 above) is enough to extend the comparison range — no `src/` edit or rebuild required for this.

---

## Troubleshooting

**`Column "X" not found`** — the header row in the sheet was renamed. Check column names in the Excel file and compare with what the error lists.

**Guide missing from output** — the guide's name in the Excel sheet may have a typo or extra space. Names must match exactly across rows.

**`ModuleNotFoundError: openpyxl`** — run `pip install openpyxl` inside the venv, or activate the venv with `source venv/bin/activate` before running the script.

**Site is blank on GitHub Pages** — only relevant after a `src/` code change: `dist/app.js` was not rebuilt/committed. Run `npm run build`, then `git add dist/app.js` and push. Not applicable to data-only updates.
