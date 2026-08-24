---
status: accepted, supersedes ADR-0001
---

# Guide data updates can pull live from Google Drive via an authenticated connector

ADR 0001 kept the process manual because anonymous CSV export from the Google Sheet returns HTTP 401 — the sheet owner declined to make it public and no service account existed. On 2026-08-24 we updated the report using Claude's authenticated Google Drive connector instead: `get_file_metadata`/`download_file_content` on the sheet's file ID, requesting `exportMimeType: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, which returns the live sheet as a base64-encoded `.xlsx` without needing public/link sharing. This works because the connector is authenticated as a user (antun@dodai.io) the sheet is already shared with — it's a different access path than the anonymous CSV export or a dedicated service account that ADR 0001 evaluated.

The downloaded `.xlsx` still replaces the local `1.1 Evidencija prodaje 26.xlsx`, and `scripts/extract_guides.py --year 2026` still runs against it unchanged — only the "how does the fresh export get onto disk" step changed. `SHEET_URL`/CI automation remains dead in practice as ADR 0001 describes; this ADR only applies to interactive sessions where the Drive connector is available.
