# Migration: Private Repo + Vercel

When ready to go live, follow these steps in order.

---

## 1. Finish pending local changes

Before touching GitHub or Vercel, make sure all local changes are committed and pushed:

```bash
git add -A
git status   # review what's staged
git commit -m "..."
git push
```

Files that need to be included in this push (already changed locally):
- `extract_guides.py` — Google Sheets CSV support
- `.github/workflows/update-data.yml` — automated weekly update
- `.gitignore` — ignores .env, venv/, *.xlsx
- `.env.example` — documents SHEET_URL var
- `CLAUDE.md` — updated architecture docs

---

## 2. Make the repository private

GitHub repo → Settings → scroll to Danger Zone → **Change repository visibility → Private**.

This breaks GitHub Pages immediately (free plan). That's expected — Vercel replaces it.

---

## 3. Connect Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import from GitHub — authorize Vercel to access private repos if prompted
3. Select this repository
4. Framework Preset: **Other** (static site, no build step)
5. Build & Output settings — leave all blank (Vercel serves `index.html` from root)
6. Click **Deploy**

Vercel will auto-deploy on every push to `main` from this point on. No `vercel.json` needed.

---

## 4. Add SHEET_URL to GitHub Secrets

The GitHub Actions workflow needs this to regenerate `data-2026.js`.

Repo → Settings → Secrets and variables → Actions → **New repository secret**:
- Name: `SHEET_URL`
- Value: `https://docs.google.com/spreadsheets/d/1r2_u6kdsICNpYDMsM-c4rfiDLmPottZ1b4XJHlwcnYE/export?format=csv&gid=1997702556`

> Note: This URL is temporary (test sheet). Replace with the production sheet URL when ready.

---

## 5. Test the full automation loop

In GitHub: Actions tab → **Update guide data** → Run workflow (manual trigger).

Verify:
- Workflow completes without errors
- `data-2026.js` is committed if data changed
- Vercel picks up the push and deploys within ~1 minute
- Live site reflects updated data

---

## 6. Update the live URL

Once deployed, Vercel assigns a URL like `evidencija-xxx.vercel.app`. Optionally set a custom domain in Vercel → Project Settings → Domains.

Update any bookmarks or shared links that pointed to the old GitHub Pages URL.

---

## What does NOT change

- `index.html`, `guides.css`, `page-*.js`, `shared.js` — no edits needed for this migration
- GitHub Actions workflow — already configured correctly, works with private repos via `GITHUB_TOKEN`
- The weekly automation cadence — still runs every Monday 6am UTC + manual trigger

---

## Rollback

If something goes wrong before Vercel is set up, re-enable GitHub Pages temporarily:
Repo Settings → Pages → Source → Deploy from branch → `main` / `(root)`.
Then make the repo public again.
