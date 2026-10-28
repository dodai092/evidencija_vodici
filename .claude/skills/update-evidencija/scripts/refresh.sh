#!/usr/bin/env bash
# Backup, regenerate, compare, replace. Run from the repo root after evidencija.csv
# (or "1.1 Evidencija prodaje 26.xlsx" with --xlsx) is in place. Does not commit.
set -euo pipefail
S=.claude/skills/update-evidencija/scripts
cp data-2026.js ".backup-data-2026-$(date +%Y%m%d%H%M%S).js"
if [ "${1:-}" = "--xlsx" ]; then
  python3 $S/extract_guides.py --year 2026 > data-2026.js.new
else
  SHEET_URL="file://$PWD/evidencija.csv" python3 $S/extract_guides.py --year 2026 > data-2026.js.new
fi
python3 $S/compare_update.py data-2026.js data-2026.js.new || { rm -f data-2026.js.new; exit 1; }
mv data-2026.js.new data-2026.js
echo "Replaced data-2026.js. Now check in a browser, then commit and push."
