---
name: update-evidencija
description: Refresh the evidencija guides dashboard (data-2026.js) from the live "1.1 Evidencija prodaje 26" Google Sheet, check the numbers, and publish. Use when asked to update evidencija, refresh the guides dashboard, or sync the latest guide tours.
---

# Update evidencija

Pulls the live sheet, regenerates `data-2026.js`, checks the numbers, and pushes
to the public dashboard at https://dodai092.github.io/evidencija_vodici/.

Data only. No code changes, no rebuild. The dashboard works out its own
as-of date from the data.

## Before you start (once)

1. Google Drive connected in Claude (Settings → Connectors → Google Drive).
2. Python 3 installed. Then, from the repo root:

   ```
   pip3 install -r .claude/skills/update-evidencija/requirements.txt
   ```

3. A clone of the repo, with write access (ask Antun if `git push` fails):

   ```
   git clone https://github.com/dodai092/evidencija_vodici.git
   cd evidencija_vodici
   ```

Every command below runs from the repo root.

## 1. Pull the latest

```
git pull --ff-only
```

Download the sheet with the Drive connector, using this file id. Don't search
by title, since copies exist:

```
1qG6HWuHpTr4iOaoWc3E-ntgvevDPRjbDkTcvruO21vY
```

- Call `download_file_content` with that file id and
  `exportMimeType: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- The result is large and saves to a tool-result file. Decode its base64
  `content` field and write the bytes to `1.1 Evidencija prodaje 26.xlsx` in
  this folder. Use a short Python snippet (`json.load` the tool-result file,
  `base64.b64decode`, write bytes). Don't paste the base64 through the shell.
- If the file id returns an error, or the title is no longer
  "1.1 Evidencija prodaje 26", stop and tell Antun. Don't pick another file.

Back up the current data before anything else:

```
cp data-2026.js .backup-data-2026-$(date +%Y%m%d%H%M%S).js
```

## 2. Regenerate and compare

```
python3 .claude/skills/update-evidencija/scripts/extract_guides.py --year 2026 > data-2026.js.new
python3 .claude/skills/update-evidencija/scripts/compare_update.py data-2026.js data-2026.js.new
```

The compare step prints the KPI changes, guides added or removed, and the
as-of date. It exits with `STOP` if the guide count drops or a KPI total is
zero. If it stops, delete `data-2026.js.new`, keep the current data, and tell
Antun what it printed. Don't replace the file.

Only when the compare step says OK:

```
mv data-2026.js.new data-2026.js
```

If `extract_guides.py` errors, the most likely causes are below. Fix the cause
and run it again. Don't edit the script.

- `Column "X" not found`: a header in the sheet was renamed.
- A guide is missing: the name in the sheet has a typo or an extra space.
- `ModuleNotFoundError: openpyxl`: run the `pip3 install` line again.

## 3. Check in a browser

Serve the folder and open it:

```
python3 -m http.server 8811
```

Then open http://localhost:8811/ and check:

- **Tours 2026:** the KPI totals match the `kpiTotals26` values printed in step 2
  (guides, freeTours, paidTours, freePax, paidPax).
- **Tours 2025, Comparison and Management tabs:** each one loads and shows
  numbers, with no error in the browser console.

Stop the server (Ctrl+C) when you're done.

## 4. Publish

```
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push
```

Reload https://dodai092.github.io/evidencija_vodici/ after about a minute.

If `git push` is refused, don't retry. Tell Antun the commit hash.

## 5. Report

In chat, tell the user:

- The as-of date from step 2.
- The KPI changes from step 2.
- Any guide added or removed.
- Whether the browser check passed. If anything failed, say what.

Don't draft an email. Antun sends any updates.

## Not covered

`index.html`, `dist/`, the code in `src/`, and the 2025 data. Don't edit them
in this skill. Ask Antun.
