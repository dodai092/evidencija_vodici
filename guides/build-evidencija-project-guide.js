// Builds the standalone "whole project" guide for evidencija.
// Usage: node build.js <outPath> <en|hr>

const fs = require("fs");
const { Document, Packer } = require("docx");
const H = require("./docx-helpers");
const {
  h1, h2, body, note, bullet, numberedStep, codeBlock, twoColTable, titlePage, tocPage,
} = H;

const outPath = process.argv[2];
const lang = process.argv[3] || "en";

const DATA_SHAPE = `{
  name: "Guide Name",
  city: "Zagreb",            // Zagreb | Dubrovnik | Split | Zadar | Unknown
  stats: {
    eng: {
      free: { tours, pax },
      paid: { tours, pax },
      byType: { [typeName]: { tours, pax } },
      byMonth: { [1..12]: { name, free: {tours,pax}, paid: {tours,pax} } },
      byDay:   { ["m-d"]: { free, paid } }   // 2026 only — enables partial-month cutoff
    },
    esp: { /* same shape */ },
    fra: { /* same shape */ },
    all: { /* aggregate across languages */ },
  },
  mgmt: { /* revenue, vendorCost, grossMargin, byDay, bySource, ... */ }
}`;

const T = {
  en: {
    orgName: "Free Spirit Tours",
    title: "Evidencija",
    subtitle: "Guide Production Dashboard — Project Guide",
    meta: [
      "Standalone technical overview for a new maintainer: architecture, data pipeline, all four tabs, deployment",
      "Written to stand on its own — no other project files travel with this document",
      "Croatian version: evidencija-project-guide-hr.docx",
    ],
    toc: "Contents",

    hWhat: "What this is",
    pWhat1: "Evidencija is an internal business-intelligence dashboard tracking tour-guide production for Free Spirit Tours: how many tours each guide ran, how many people they carried, how those tours performed financially. It's a static site — plain HTML, CSS and JavaScript, no backend and no live database. All the numbers are pre-computed into two generated JavaScript data files that the browser loads directly; there is nothing to query at view time beyond in-browser filtering and re-aggregation.",
    pWhat2: "It's one of three related reports Free Spirit Tours runs (the others cover sales pipeline and monthly tour recap), sharing a small CSS/JS foundation for navigation, theming and KPI-card styling. Evidencija is the deepest and most actively developed of the three — it outgrew the shared foundation's rendering helpers and has its own module architecture (see Architecture below).",
    pWhat3: "The primary user is a single director-level owner who checks it regularly — weekly or more — to answer questions like \"how is this guide doing this year vs. last\" or \"what does this month's margin look like.\" The design deliberately favors density over hand-holding: an expert user who already knows the business, not a general audience.",

    hArch: "Architecture",
    pArch1: "No backend, no database, no server-side code. The whole thing is a static bundle of files that could be hosted from literally any static file host — currently GitHub Pages (see Deployment).",
    tblTechHeaders: ["Piece", "What it is"],
    tblTechRows: [
      ["JavaScript", "Plain ES modules, bundled with esbuild into a single IIFE file (dist/app.js, ~208kb). No framework (no React/Vue/etc.)."],
      ["Charts", "Chart.js 4.4.1, loaded from a CDN — not bundled."],
      ["Data extraction", "Python 3 + openpyxl, run manually or via CI, reads the source Excel/Sheet and writes plain JS data files."],
      ["Fonts", "Google Fonts — Playfair Display (display), Montserrat (UI), Inconsolata (data/numbers)."],
      ["Tests", "Vitest for the JS (filteredStats, date helpers, management helpers); pytest for the Python extractor."],
      ["CI", "GitHub Actions runs both test suites on every push and pull request."],
    ],
    hArchFiles: "File responsibilities",
    tblFilesHeaders: ["File / folder", "Role"],
    tblFilesRows: [
      ["index.html", "The page shell — four empty tab containers plus the Management sub-nav HTML. Never edited for a data update."],
      ["guides.css", "All evidencija-specific styling: layout, filter bar, date picker, guide cards, management dashboard, colors."],
      ["data-2025.js / data-2026.js", "Generated data files — not hand-edited. Loaded as separate <script> tags, not bundled into dist/app.js, so a data-only update needs no rebuild."],
      ["src/main.js", "Entry point — boots theme/language, exposes page objects as window globals, wires keyboard shortcuts and tab navigation."],
      ["src/shared.js", "Shared constants (CITIES, PAGES registry), filteredStats() (the central date-cutoff filtering logic), showPage(), updateDateAsOf()."],
      ["src/i18n.js", "Croatian/English UI string translations and the t() helper."],
      ["src/theme.js", "Dark/light theme toggle, persisted to localStorage."],
      ["src/pages/page-2025.js, page-2026.js", "Render logic for the two single-year tabs."],
      ["src/pages/page-cmp/index.js", "Render logic and Chart.js instances for the year-over-year Comparison tab."],
      ["src/pages/management/index.js", "All 5 Management sub-tabs — by far the largest module."],
      ["scripts/extract_guides.py", "Reads the Excel workbook (or a Google Sheets CSV export, see Deployment), writes data-2025.js / data-2026.js."],
      ["dist/app.js", "The built bundle actually loaded by index.html. Built with npm run build; only needs rebuilding after a src/ change, never for a data-only update."],
    ],
    hArchPattern: "The page-module pattern",
    pArchPattern: "Each tab is a plain JS object with a lazy-init pattern: it does nothing until the user actually visits that tab, then initializes once and re-renders on every subsequent filter or date change.",
    hArchData: "Data shape",
    pArchData: "Every guide's data — in both data-2025.js and data-2026.js — follows this shape:",

    hPipeline: "The data pipeline — from Excel to the page",
    pPipeline1: "The source of truth is a local Excel workbook, “1.1 Evidencija prodaje 26.xlsx”, kept outside the repository entirely — whoever maintains the data holds this file locally, not in git or Drive. Each row is one tour booking; columns include guide name, city, language, tour type, month, pax count, and (for the Management tab) the full set of financial fields (charged amount, commission, vendor cost, gross margin, etc.).",
    pPipeline2: "scripts/extract_guides.py reads the “Evidencija” sheet (2026, the live year) or “Evidencija_25” sheet (2025, closed/historical), auto-detecting each column's position from its header text rather than a fixed column order — so reordering columns in the sheet doesn't break extraction, only renaming a header does. It prints a ready-to-use JavaScript file to stdout, which is redirected straight into data-2026.js or data-2025.js.",
    pPipeline3: "This is a manual, on-demand step today, not a live sync — the dashboard only knows what was in the workbook the last time someone ran the script. See “Updating the monthly data” below for the exact process, and “Deployment” for a documented-but-not-yet-active plan to automate this.",

    hUpdate: "Updating the monthly data",
    pUpdate: "This is the recurring maintenance task: get a new month's bookings from the Excel workbook into the live dashboard.",
    stepsUpdate: [
      "Open “1.1 Evidencija prodaje 26.xlsx” and add the new month's tour rows to the “Evidencija” sheet.",
      "From the evidencija/ directory: activate the Python virtual environment (source venv/bin/activate) and run python3 scripts/extract_guides.py --year 2026 > data-2026.js. This overwrites data-2026.js with fresh guideStats26/kpiTotals26 built from the sheet as it now stands.",
      "Open index.html in a browser and verify: the new month's numbers show up in a guide's monthly breakdown, the KPI totals on the 2026 tab look right, and the Usporedba (Comparison) tab reflects the update.",
      "Commit and push: git add data-2026.js, git commit, git push. The live site (currently GitHub Pages) redeploys automatically.",
    ],
    noteUpdateRange: "The Usporedba tab's displayed date range (“Jan–Jun”, “Jan–Aug”, etc.) and its month dropdown recompute themselves automatically from the current date on every page load — there is nothing to edit in the code as new months land.",
    noteUpdateNewGuide: "A guide with no prior entry gets one automatically the first time their tours appear in the sheet — nothing to hand-edit in the data file. They'll show up in Usporedba as a new guide with no 2025 comparison row.",
    tblUpdateErrHeaders: ["Symptom", "Likely cause / fix"],
    tblUpdateErrRows: [
      ["Column \"X\" not found", "A header in the Excel sheet was renamed — check the sheet's header row against what the error message lists."],
      ["A guide is missing from the output", "A typo or extra space in that guide's name in the Excel sheet — names must match exactly, row to row."],
      ["ModuleNotFoundError: openpyxl", "The virtual environment isn't active — run source venv/bin/activate first."],
      ["Site is blank after a code (not data) change", "dist/app.js wasn't rebuilt. Run npm run build, then commit dist/app.js too — a src/ change needs a rebuild; a data-only update does not."],
    ],

    hTabs: "The four tabs",
    pTabsIntro: "City (Zagreb, Dubrovnik, Split, Zadar) and language (ENG, ESP, FRA) filters are available on the production tabs; each tab's filters are independent of the others. A date picker in the top navigation controls the “as-of” cutoff used everywhere — complete months are summed as whole months, the current partial month is summed day-by-day up to the chosen cutoff date.",

    hTab25: "Vodiči 2025",
    pTab25: "Full-year 2025 production per guide: free tours, paid tours, pax counts, and a per-guide monthly breakdown (expand “Mjesečno” on any guide's card). 2025 is a closed year — this tab's underlying data only changes if historical data needs correcting.",

    hTab26: "Vodiči 2026",
    pTab26: "The same shape as the 2025 tab, but for the current year, updated monthly via the process above. This is the tab that actually changes month to month.",

    hTabCmp: "Usporedba (Comparison)",
    pTabCmp: "Side-by-side 2025-vs-2026 charts and tables — cumulative free pax, paid tours, average pax per tour, all filterable by city and (on the Paid Tours section) by tour type via one sticky filter that drives all three of that section's charts at once. The date range shown always matches however much of the current year has data, computed automatically.",

    hTabMgmt: "Management",
    pTabMgmt: "A financial and operational view, organized into 5 sub-tabs, all reading from the same mgmt object inside each guide's data entry.",
    tblMgmtHeaders: ["Sub-tab", "What it covers"],
    tblMgmtRows: [
      ["P&L", "Revenue, commission, vendor cost, gross margin — KPI cards with 2025 comparison, a waterfall chart breaking revenue down into costs and margin, a monthly revenue/margin trend, and a direct-booking-vs-OTA billing comparison."],
      ["Guides", "A sortable per-guide financial table — tours, revenue, commission, cost, gross margin (€ and %), with 2025-vs-2026 deltas on the key columns."],
      ["Channels", "Where revenue comes from and what it costs to get it: a commission waterfall by OTA source, a direct-vs-OTA revenue trend over time, a detailed OTA source table, and a tour-type financial breakdown."],
      ["Operational", "Non-financial operating patterns that still drive profitability — group size (guide pax band) vs. margin, tours by day-of-week/time-slot/season, a week-by-week trend, and revenue by payment method."],
      ["Cities", "How Zagreb, Dubrovnik, Split and Zadar compare — per-city KPI cards, a tour-type-by-city margin heatmap, booking-source distribution by city, and a language mix per city."],
    ],
    noteMgmt: "Every number on every Management sub-tab traces back to the same handful of Excel columns (charged amount, commission cost, vendor cost, gross margin, tour cost, VAT amount) attached to each tour row in the source workbook — there's no separate financial data source to keep in sync.",

    hFilters: "Filters, navigation and shortcuts",
    pFilters1: "City and language filters apply independently per tab — changing the city filter on Guides doesn't affect Channels or Operational. The date-as-of picker in the nav re-renders every tab that's already been visited, including Management. Dark mode persists across visits via the browser's localStorage.",
    tblKeysHeaders: ["Key", "Action"],
    tblKeysRows: [
      ["1 / 2 / 3 / 4", "Jump to the 2025 / 2026 / Comparison / Management tab"],
      ["T", "Toggle dark/light theme"],
      ["D", "Focus the date-as-of picker"],
      ["?", "Show the shortcuts overlay"],
      ["Esc", "Close the shortcuts overlay"],
      ["Arrow keys / Home / End (while a tab is focused)", "Move focus between the main tabs, or between Management's sub-tabs"],
    ],
    noteFiltersDisabled: "None of this works while typing in a text field, or with Ctrl/Cmd/Alt held down — the shortcuts only fire on a bare keypress outside an input.",

    hIntegrity: "A key data-integrity rule: city totals",
    pIntegrity1: "Every guide has a home city — the one their card is grouped under in the guide list — but a guide can actually run a tour in a different city than the one they're assigned to. An early version of this dashboard summed city-level charts by grouping guides by their home city, which silently mis-attributed or dropped pax from any tour run outside a guide's home city.",
    pIntegrity2: "The fix: a separate cityStats structure, built directly from each row's own City column in the source data, independent of which guide ran the tour. Every city-scoped total — KPI cards, city charts, city filters — reads from cityStats, never from guideStats grouped by a guide's home-city field. This report's scope is strictly the 4 tracked cities; any row whose city maps to something else (e.g. Pula, Rovinj) is consistently excluded from every city-scoped total, so a headline “all cities” number always equals the sum of the city breakdown.",

    hDeploy: "Deployment",
    pDeployCurrent: "As of this writing, the live site is hosted on GitHub Pages, deployed from a public GitHub repository. A push to the main branch (including a data-only update) redeploys automatically, typically within a couple of minutes. GitHub Actions runs the JS and Python test suites on every push and pull request.",
    hDeployPlanned: "Planned, not yet active: private repo + Vercel + automated sync",
    pDeployPlanned1: "There's a documented migration plan to move the site to a privately-hosted GitHub repo deployed via Vercel, paired with a GitHub Actions workflow (already present in the repo, “Update guide data”) that would regenerate the data file automatically by reading the source spreadsheet from a Google Sheets CSV export URL, instead of a locally-held Excel file.",
    noteDeployNotLive: "This is a plan, not the current state. Confirmed directly: the repository is still public, no SHEET_URL secret is configured for that workflow, and the workflow itself only supports a manual trigger from the GitHub UI — it has no scheduled/automatic run built into it today. Triggering it as-is would fail for lack of a data source. The manual process in “Updating the monthly data” above is what actually runs the dashboard right now.",

    hGlossary: "Glossary — Croatian dashboard terms",
    tblGlossaryHeaders: ["Term (as shown in the UI)", "Meaning"],
    tblGlossaryRows: [
      ["Vodiči", "Guides"],
      ["Usporedba", "Comparison"],
      ["Mjesečno", "Monthly (the expandable per-guide breakdown)"],
      ["Prihodak & Gubici (P&L)", "Profit & Loss"],
      ["Učinkovitost Vodiča", "Guide Performance"],
      ["Kanali & Prihod", "Channels & Revenue"],
      ["Operativni Uvidi", "Operational Insights"],
      ["Gradovi", "Cities"],
      ["Free / Paid ture", "Free (walking) tours vs. paid tours"],
      ["Pax", "Number of people/participants"],
    ],
  },
  hr: {
    orgName: "Free Spirit Tours",
    title: "Evidencija",
    subtitle: "Dashboard produkcije vodiča — vodič kroz projekt",
    meta: [
      "Samostalan tehnički pregled za novog održavatelja: arhitektura, data pipeline, sva četiri taba, deployment",
      "Napisano da stoji samostalno — nijedna druga datoteka projekta ne putuje uz ovaj dokument",
      "Engleska verzija: evidencija-project-guide-en.docx",
    ],
    toc: "Sadržaj",

    hWhat: "Što je ovo",
    pWhat1: "Evidencija je interni business-intelligence dashboard koji prati produkciju turističkih vodiča za Free Spirit Tours: koliko je tura svaki vodič odradio, koliko je ljudi vodio, kako su te ture prošle financijski. Ovo je statični site — obični HTML, CSS i JavaScript, bez backenda i bez žive baze podataka. Svi brojevi unaprijed su izračunati u dvije generirane JavaScript data datoteke koje preglednik izravno učitava; nema ničega za upit u trenutku gledanja osim filtriranja i ponovnog zbrajanja u pregledniku.",
    pWhat2: "Ovo je jedan od tri povezana izvještaja koje Free Spirit Tours vodi (ostala dva pokrivaju prodajni pipeline i mjesečni recap tura), koji dijele mali CSS/JS temelj za navigaciju, temu i stil KPI kartica. Evidencija je najdublji i najaktivnije razvijan od sva tri — prerastao je pomoćne funkcije dijeljenog temelja i ima vlastitu modularnu arhitekturu (vidi Arhitektura ispod).",
    pWhat3: "Primarni korisnik je jedan vlasnik/direktor koji ga redovito provjerava — tjedno ili češće — kako bi odgovorio na pitanja poput \"kako ovaj vodič stoji ove godine u odnosu na prošlu\" ili \"kako izgleda marža ovog mjeseca\". Dizajn namjerno favorizira gustoću informacija nad vođenjem za ruku: pretpostavljen je stručan korisnik koji već poznaje posao, ne opća publika.",

    hArch: "Arhitektura",
    pArch1: "Nema backenda, nema baze podataka, nema server-side koda. Cijela stvar je statični paket datoteka koji bi se doslovno mogao hostati na bilo kojem statičkom file hostu — trenutno GitHub Pages (vidi Deployment).",
    tblTechHeaders: ["Dio", "Što je to"],
    tblTechRows: [
      ["JavaScript", "Obični ES moduli, spojeni esbuildom u jednu IIFE datoteku (dist/app.js, ~208kb). Bez frameworka (bez React/Vue/itd.)."],
      ["Grafovi", "Chart.js 4.4.1, učitan s CDN-a — nije bundlean."],
      ["Ekstrakcija podataka", "Python 3 + openpyxl, pokreće se ručno ili preko CI-ja, čita izvorni Excel/Sheet i piše obične JS data datoteke."],
      ["Fontovi", "Google Fonts — Playfair Display (display), Montserrat (UI), Inconsolata (podaci/brojevi)."],
      ["Testovi", "Vitest za JS (filteredStats, date helperi, management helperi); pytest za Python ekstraktor."],
      ["CI", "GitHub Actions pokreće oba test suita na svaki push i pull request."],
    ],
    hArchFiles: "Uloge datoteka",
    tblFilesHeaders: ["Datoteka / folder", "Uloga"],
    tblFilesRows: [
      ["index.html", "Ljuska stranice — četiri prazna kontejnera taba plus HTML za Management pod-navigaciju. Nikad se ne uređuje za ažuriranje podataka."],
      ["guides.css", "Sav evidencija-specifičan styling: layout, traka filtera, date picker, kartice vodiča, management dashboard, boje."],
      ["data-2025.js / data-2026.js", "Generirane data datoteke — ne uređuju se ručno. Učitane kao zasebni <script> tagovi, ne bundlane u dist/app.js, pa ažuriranje samo podataka ne zahtijeva rebuild."],
      ["src/main.js", "Ulazna točka — pokreće temu/jezik, izlaže page objekte kao window globale, spaja tipkovničke prečace i navigaciju tabova."],
      ["src/shared.js", "Dijeljene konstante (CITIES, PAGES registar), filteredStats() (centralna logika filtriranja po datumu cutoffa), showPage(), updateDateAsOf()."],
      ["src/i18n.js", "Hrvatski/engleski prijevodi UI stringova i t() helper."],
      ["src/theme.js", "Prebacivanje tamne/svijetle teme, spremljeno u localStorage."],
      ["src/pages/page-2025.js, page-2026.js", "Render logika za dva taba jedne godine."],
      ["src/pages/page-cmp/index.js", "Render logika i Chart.js instance za Usporedba (godina-na-godinu) tab."],
      ["src/pages/management/index.js", "Svih 5 Management pod-tabova — daleko najveći modul."],
      ["scripts/extract_guides.py", "Čita Excel workbook (ili Google Sheets CSV export, vidi Deployment), piše data-2025.js / data-2026.js."],
      ["dist/app.js", "Izgrađeni bundle koji index.html stvarno učitava. Gradi se s npm run build; treba rebuild samo nakon promjene u src/, nikad za ažuriranje samo podataka."],
    ],
    hArchPattern: "Page-module obrazac",
    pArchPattern: "Svaki tab je obični JS objekt s lazy-init obrascem: ne radi ništa dok korisnik stvarno ne posjeti taj tab, zatim se inicijalizira jednom i ponovno renderira na svaku sljedeću promjenu filtera ili datuma.",
    hArchData: "Oblik podataka",
    pArchData: "Podaci svakog vodiča — i u data-2025.js i u data-2026.js — prate ovaj oblik:",

    hPipeline: "Data pipeline — od Excela do stranice",
    pPipeline1: "Izvor istine je lokalni Excel workbook, “1.1 Evidencija prodaje 26.xlsx”, koji se drži potpuno izvan repozitorija — tko god održava podatke drži ovu datoteku lokalno, ne u gitu ni na Driveu. Svaki redak je jedna rezervacija ture; stupci uključuju ime vodiča, grad, jezik, vrstu ture, mjesec, broj putnika, i (za Management tab) cijeli set financijskih polja (naplaćeni iznos, provizija, trošak dobavljača, bruto marža, itd.).",
    pPipeline2: "scripts/extract_guides.py čita sheet “Evidencija” (2026, aktivna godina) ili sheet “Evidencija_25” (2025, zatvorena/povijesna), automatski prepoznajući poziciju svakog stupca po tekstu zaglavlja, a ne po fiksnom redoslijedu — pa promjena redoslijeda stupaca u sheetu ne kvari ekstrakciju, samo preimenovanje zaglavlja to čini. Ispisuje spremnu JavaScript datoteku na stdout, koja se izravno preusmjerava u data-2026.js ili data-2025.js.",
    pPipeline3: "Ovo je danas ručni, on-demand korak, ne živa sinkronizacija — dashboard zna samo ono što je bilo u workbooku zadnji put kad je netko pokrenuo skriptu. Vidi “Ažuriranje mjesečnih podataka” ispod za točan proces, i “Deployment” za dokumentiran, ali još neaktivan plan da se ovo automatizira.",

    hUpdate: "Ažuriranje mjesečnih podataka",
    pUpdate: "Ovo je ponavljajući zadatak održavanja: prenijeti nove mjesečne rezervacije iz Excel workbooka u živi dashboard.",
    stepsUpdate: [
      "Otvoriti “1.1 Evidencija prodaje 26.xlsx” i dodati retke novog mjeseca u sheet “Evidencija”.",
      "Iz direktorija evidencija/: aktivirati Python virtualno okruženje (source venv/bin/activate) i pokrenuti python3 scripts/extract_guides.py --year 2026 > data-2026.js. Ovo prepisuje data-2026.js svježim guideStats26/kpiTotals26 izgrađenim iz sheeta u trenutnom stanju.",
      "Otvoriti index.html u pregledniku i provjeriti: brojevi novog mjeseca pojavljuju se u mjesečnom pregledu vodiča, KPI ukupni brojevi na 2026 tabu izgledaju točno, i Usporedba tab odražava ažuriranje.",
      "Commitati i pushati: git add data-2026.js, git commit, git push. Živi site (trenutno GitHub Pages) se automatski redeploya.",
    ],
    noteUpdateRange: "Prikazani raspon datuma na Usporedba tabu (“Jan–Jun”, “Jan–Aug”, itd.) i njegov padajući izbornik mjeseci sami se automatski preračunavaju iz trenutnog datuma pri svakom učitavanju stranice — nema ničega za uređivati u kodu kako novi mjeseci stižu.",
    noteUpdateNewGuide: "Vodič bez prijašnjeg unosa automatski dobiva jedan prvi put kad se njegove ture pojave u sheetu — ništa se ne uređuje ručno u data datoteci. Pojavit će se u Usporedbi kao novi vodič bez retka usporedbe za 2025.",
    tblUpdateErrHeaders: ["Simptom", "Vjerojatan uzrok / rješenje"],
    tblUpdateErrRows: [
      ["Column \"X\" not found", "Zaglavlje u Excel sheetu je preimenovano — provjeriti redak zaglavlja sheeta u odnosu na ono što poruka greške navodi."],
      ["Vodič nedostaje u izlazu", "Tipfeler ili suvišan razmak u imenu tog vodiča u Excel sheetu — imena moraju točno odgovarati, redak po redak."],
      ["ModuleNotFoundError: openpyxl", "Virtualno okruženje nije aktivno — prvo pokrenuti source venv/bin/activate."],
      ["Site je prazan nakon promjene koda (ne podataka)", "dist/app.js nije rebuildan. Pokrenuti npm run build, zatim commitati i dist/app.js — promjena u src/ treba rebuild; ažuriranje samo podataka ne treba."],
    ],

    hTabs: "Četiri taba",
    pTabsIntro: "Filteri po gradu (Zagreb, Dubrovnik, Split, Zadar) i jeziku (ENG, ESP, FRA) dostupni su na produkcijskim tabovima; filteri svakog taba neovisni su o ostalima. Date picker u gornjoj navigaciji kontrolira “as-of” cutoff korišten posvuda — potpuni mjeseci zbrajaju se kao cijeli mjeseci, trenutni nepotpuni mjesec zbraja se dan po dan do odabranog datuma cutoffa.",

    hTab25: "Vodiči 2025",
    pTab25: "Produkcija cijele 2025. godine po vodiču: free ture, plaćene ture, broj putnika, i mjesečni pregled po vodiču (proširiti “Mjesečno” na bilo kojoj kartici vodiča). 2025. je zatvorena godina — podaci ovog taba mijenjaju se samo ako treba ispraviti povijesne podatke.",

    hTab26: "Vodiči 2026",
    pTab26: "Isti oblik kao tab 2025, ali za trenutnu godinu, ažuriran mjesečno gornjim procesom. Ovo je tab koji se stvarno mijenja iz mjeseca u mjesec.",

    hTabCmp: "Usporedba",
    pTabCmp: "Grafovi i tablice 2025-naspram-2026 jedno pored drugog — kumulativni free pax, plaćene ture, prosječan pax po turi, sve filtrirano po gradu i (u sekciji Paid Tours) po vrsti ture preko jednog sticky filtera koji pokreće sva tri grafa te sekcije odjednom. Prikazani raspon datuma uvijek odgovara koliko god trenutna godina ima podataka, izračunato automatski.",

    hTabMgmt: "Management",
    pTabMgmt: "Financijski i operativni pogled, organiziran u 5 pod-tabova, svi čitaju iz istog mgmt objekta unutar podatkovnog unosa svakog vodiča.",
    tblMgmtHeaders: ["Pod-tab", "Što pokriva"],
    tblMgmtRows: [
      ["P&L", "Prihod, provizija, trošak dobavljača, bruto marža — KPI kartice s usporedbom za 2025., waterfall graf koji razlaže prihod na troškove i maržu, mjesečni trend prihoda/marže, i usporedba izravne rezervacije naspram OTA naplate."],
      ["Guides", "Sortabilna financijska tablica po vodiču — ture, prihod, provizija, trošak, bruto marža (€ i %), s deltama 2025-naspram-2026 na ključnim stupcima."],
      ["Channels", "Odakle dolazi prihod i koliko košta doći do njega: waterfall provizije po OTA izvoru, trend izravno-naspram-OTA prihoda kroz vrijeme, detaljna tablica OTA izvora, i financijska raspodjela po vrsti ture."],
      ["Operational", "Ne-financijski operativni obrasci koji ipak pokreću profitabilnost — veličina grupe (guide pax band) naspram marže, ture po danu u tjednu/vremenskom slotu/sezoni, tjedni trend, i prihod po načinu plaćanja."],
      ["Cities", "Kako se Zagreb, Dubrovnik, Split i Zadar uspoređuju — KPI kartice po gradu, heatmapa marže vrsta-ture-po-gradu, distribucija izvora rezervacija po gradu, i jezična raspodjela po gradu."],
    ],
    noteMgmt: "Svaki broj na svakom Management pod-tabu vodi natrag do iste šačice Excel stupaca (naplaćeni iznos, trošak provizije, trošak dobavljača, bruto marža, trošak ture, iznos PDV-a) pridruženih svakom retku ture u izvornom workbooku — nema zasebnog financijskog izvora podataka koji treba držati sinkroniziranim.",

    hFilters: "Filteri, navigacija i prečaci",
    pFilters1: "Filteri po gradu i jeziku primjenjuju se neovisno po tabu — promjena filtera grada na Guides ne utječe na Channels ili Operational. Date-as-of picker u navigaciji ponovno renderira svaki tab koji je već posjećen, uključujući Management. Tamni način rada zadržava se kroz posjete preko localStorage preglednika.",
    tblKeysHeaders: ["Tipka", "Radnja"],
    tblKeysRows: [
      ["1 / 2 / 3 / 4", "Skoči na tab 2025 / 2026 / Usporedba / Management"],
      ["T", "Prebaci tamnu/svijetlu temu"],
      ["D", "Fokusiraj date-as-of picker"],
      ["?", "Prikaži overlay s prečacima"],
      ["Esc", "Zatvori overlay s prečacima"],
      ["Strelice / Home / End (dok je tab fokusiran)", "Pomakni fokus između glavnih tabova, ili između Management pod-tabova"],
    ],
    noteFiltersDisabled: "Ništa od ovoga ne radi dok se tipka u tekstualno polje, ili dok je Ctrl/Cmd/Alt pritisnut — prečaci se aktiviraju samo na goli pritisak tipke izvan inputa.",

    hIntegrity: "Ključno pravilo integriteta podataka: gradski ukupni iznosi",
    pIntegrity1: "Svaki vodič ima matični grad — onaj pod kojim je grupirana njegova kartica u popisu vodiča — ali vodič stvarno može voditi turu u drugom gradu od onog kojem je dodijeljen. Ranija verzija ovog dashboarda zbrajala je grafove na razini grada grupiranjem vodiča po matičnom gradu, što je tiho pogrešno pripisivalo ili gubilo pax s bilo koje ture izvedene izvan vodičevog matičnog grada.",
    pIntegrity2: "Rješenje: zasebna cityStats struktura, izgrađena izravno iz vlastitog stupca City svakog retka u izvornim podacima, neovisno o tome koji je vodič vodio turu. Svaki ukupni iznos na razini grada — KPI kartice, gradski grafovi, gradski filteri — čita iz cityStats, nikad iz guideStats grupiranog po vodičevom polju matičnog grada. Opseg ovog izvještaja strogo je 4 praćena grada; svaki redak čiji grad odgovara nečemu drugom (npr. Pula, Rovinj) dosljedno je isključen iz svakog ukupnog iznosa na razini grada, pa headline broj “svi gradovi” uvijek odgovara zbroju gradske raspodjele.",

    hDeploy: "Deployment",
    pDeployCurrent: "U trenutku pisanja, živi site hostan je na GitHub Pages, deployan iz javnog GitHub repozitorija. Push na main granu (uključujući ažuriranje samo podataka) automatski redeploya, tipično unutar par minuta. GitHub Actions pokreće JS i Python test suite na svaki push i pull request.",
    hDeployPlanned: "Planirano, još neaktivno: privatni repo + Vercel + automatska sinkronizacija",
    pDeployPlanned1: "Postoji dokumentiran plan migracije za premještanje sitea na privatno hostan GitHub repo deployan preko Vercela, uparen s GitHub Actions workflowom (već prisutnim u repozitoriju, “Update guide data”) koji bi automatski regenerirao data datoteku čitajući izvorni spreadsheet iz Google Sheets CSV export URL-a, umjesto lokalno pohranjene Excel datoteke.",
    noteDeployNotLive: "Ovo je plan, ne trenutno stanje. Izravno potvrđeno: repozitorij je i dalje javan, nijedan SHEET_URL secret nije konfiguriran za taj workflow, a sam workflow podržava samo ručno pokretanje iz GitHub sučelja — nema ugrađeno zakazano/automatsko pokretanje danas. Pokretanje u trenutnom stanju ne bi uspjelo zbog nedostatka izvora podataka. Ručni proces u “Ažuriranje mjesečnih podataka” iznad je ono što stvarno pokreće dashboard trenutno.",

    hGlossary: "Rječnik — hrvatski pojmovi na dashboardu",
    tblGlossaryHeaders: ["Pojam (kako se prikazuje u UI-u)", "Značenje"],
    tblGlossaryRows: [
      ["Vodiči", "Guides / turistički vodiči"],
      ["Usporedba", "Comparison / usporedba godina"],
      ["Mjesečno", "Monthly — proširivi pregled po vodiču"],
      ["Prihodak & Gubici (P&L)", "Profit & Loss / dobit i gubitak"],
      ["Učinkovitost Vodiča", "Guide Performance / učinak vodiča"],
      ["Kanali & Prihod", "Channels & Revenue / kanali i prihod"],
      ["Operativni Uvidi", "Operational Insights / operativni uvidi"],
      ["Gradovi", "Cities / gradovi"],
      ["Free / Paid ture", "Besplatne (walking) ture naspram plaćenih tura"],
      ["Pax", "Broj ljudi/putnika"],
    ],
  },
};

const S = T[lang];

function genericTable(headers, dataRows, widths) {
  const { Table, TableRow, TableCell, WidthType, ShadingType, Paragraph: P, TextRun: TR } = H;
  const headerRow = new TableRow({
    children: headers.map((t, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: H.ACCENT },
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new P({ children: [new TR({ text: t, bold: true, color: "FFFFFF", size: 18 })] })],
    })),
  });
  const rows = dataRows.map((r) => new TableRow({
    children: r.map((cell, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new P({ children: [new TR({ text: cell, size: 17 })] })],
    })),
  }));
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...rows] });
}

function stepsList(steps) {
  return steps.map((s, i) => numberedStep(i + 1, s));
}

const children = [
  ...titlePage(S.orgName, S.title, S.subtitle, S.meta),
  ...tocPage(S.toc),

  h1(S.hWhat),
  body(S.pWhat1),
  body(S.pWhat2),
  body(S.pWhat3),

  h1(S.hArch),
  body(S.pArch1),
  genericTable(S.tblTechHeaders, S.tblTechRows, [2600, 6800]),

  h2(S.hArchFiles),
  genericTable(S.tblFilesHeaders, S.tblFilesRows, [2800, 6600]),

  h2(S.hArchPattern),
  body(S.pArchPattern),

  h2(S.hArchData),
  body(S.pArchData),
  codeBlock(DATA_SHAPE, { size: 16 }),

  h1(S.hPipeline),
  body(S.pPipeline1),
  body(S.pPipeline2),
  body(S.pPipeline3),

  h1(S.hUpdate),
  body(S.pUpdate),
  ...stepsList(S.stepsUpdate),
  note(S.noteUpdateRange),
  note(S.noteUpdateNewGuide),
  genericTable(S.tblUpdateErrHeaders, S.tblUpdateErrRows, [3400, 6000]),

  h1(S.hTabs),
  body(S.pTabsIntro),

  h2(S.hTab25),
  body(S.pTab25),

  h2(S.hTab26),
  body(S.pTab26),

  h2(S.hTabCmp),
  body(S.pTabCmp),

  h2(S.hTabMgmt),
  body(S.pTabMgmt),
  genericTable(S.tblMgmtHeaders, S.tblMgmtRows, [1800, 7600]),
  note(S.noteMgmt),

  h1(S.hFilters),
  body(S.pFilters1),
  genericTable(S.tblKeysHeaders, S.tblKeysRows, [3400, 6000]),
  note(S.noteFiltersDisabled),

  h1(S.hIntegrity),
  body(S.pIntegrity1),
  body(S.pIntegrity2),

  h1(S.hDeploy),
  body(S.pDeployCurrent),
  h2(S.hDeployPlanned),
  body(S.pDeployPlanned1),
  note(S.noteDeployNotLive),

  h1(S.hGlossary),
  genericTable(S.tblGlossaryHeaders, S.tblGlossaryRows, [3400, 6000]),
];

const doc = new Document({
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 } } },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Wrote", outPath);
});
