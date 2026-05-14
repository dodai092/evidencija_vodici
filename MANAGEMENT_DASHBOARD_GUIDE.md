# FreeSpirit Management Dashboard — Complete Guide

**Version:** 1.0  
**Last Updated:** May 2026  
**File:** `management.html`

---

## Table of Contents
1. [P&L Tab](#pl-tab)
2. [Guides Tab](#guides-tab)
3. [Channels Tab](#channels-tab)
4. [Operational Tab](#operational-tab)
5. [Cities Tab](#cities-tab)
6. [Data Source](#data-source)

---

## P&L Tab

### Overview
**Croatian Name:** Prihodak & Gubici (P&L)  
**Subtitle:** Revenue · Commission · Costs · Gross Margin — 2026 vs 2025

Shows the complete profit & loss picture with KPI cards, waterfall breakdown, monthly trends, and billing method comparison.

---

### KPI Cards

| KPI Card | Excel Column(s) | Value Shown | Notes |
|----------|---|---|---|
| **Net Revenue** | `Charged amount` (summed) | Gross revenue | Shows as €X.XXX; includes comparison vs 2025 |
| **Commission Paid** | `Commission cost` | OTA commissions | Shown as negative cost; % of revenue |
| **Vendor Cost** | `Vendor cost` | Guide fees paid | Direct cost to guides |
| **Gross Margin** | `Gross margin` | Revenue − Commission − Vendor | Primary profit metric |
| **Tour Cost** | `Tour cost` | Internal tour costs | Operations costs |
| **VAT Amount** | `VAT amount` | Sales tax paid | Informational |
| **Avg GM / Paid Tour** | `Gross margin` ÷ paid tours | Average margin per tour | Profitability per booking |
| **Active Guides** | Count of guides with activity | # of guides | Filtered by selected city |

**Features:**
- City filter pills (All, Zagreb, Dubrovnik, Split, Zadar)
- YoY delta display (€ difference + % change vs 2025)
- Sticky mini-KPI bar appears when scrolling past the main KPI grid

---

### Charts

#### 1. **P&L Breakdown — 2025 vs 2026** (Waterfall Bar Chart)

**Croatian Name:** Razrada P&L — 2025 vs 2026

**What it shows:** Side-by-side waterfall showing how revenue breaks down into individual cost categories and results in gross margin

**Components displayed (left to right):**
- Revenue (green positive bar)
- Commission cost (red negative bar)
- VAT (red negative bar)
- Vendor cost (red negative bar)
- Tour cost (red negative bar)
- Gross margin (green if positive, red if negative)

**Excel columns used:**
- `Charged amount` → Revenue
- `Commission cost` → Commission Cost
- `VAT amount` → VAT
- `Vendor cost` → Vendor Cost
- `Tour cost` → Tour Cost
- `Gross margin` → Gross Margin

**Time period:** Jan–May (or current month, auto-adjusts based on data cutoff)

**Below the chart:** Summary table with 2026 vs 2025 comparison showing absolute values and deltas

---

#### 2. **Revenue & GM by Month — 2025 vs 2026** (Line Chart)

**Croatian Name:** Prihod & Bruto Margina po Mjesecu — 2025 vs 2026

**What it shows:** Monthly trend lines tracking revenue and gross margin evolution across both years

**Four lines displayed:**
- **GM 2025** (dashed, 2025 color) — Gross margin for 2025
- **GM 2026** (solid with light fill, 2026 color) — Current year margin
- **Rev 2025** (thin dashed, 2025 color) — Revenue for 2025
- **Rev 2026** (thin solid, blue-gray) — Current year revenue

**Excel columns used:**
- `Gross margin` (monthly aggregation)
- `Charged amount` (monthly aggregation)

**Shows:** All months where data exists (typically Jan–May or later)

---

#### 3. **POS vs CPP — Revenue 2025 vs 2026** (Bar Chart)

**Section:** Direct Booking vs OTA (Billing Method)  
**Croatian Name:** POS vs OTA (CPP) — Prihod 2025 vs 2026

**What it shows:** Revenue comparison between two booking/billing methods:
- **POS** = Direct bookings (cash/card payments at venue)
- **CPP** = OTA bookings (bank transfers, booking platforms)

**Bars displayed (paired):**
- POS 2025 vs POS 2026
- CPP 2025 vs CPP 2026

**Excel columns used:**
- `Billing method` → POS or CPP classification
- `Charged amount` → Revenue for each method

**Additional detail (in tooltip):**
- Gross margin amount (€)
- Gross margin % for each method

**Below the chart:** Two stat cards showing:
- 2025 vs 2026 revenue for POS
- 2025 vs 2026 revenue for CPP
- GM% and delta for each

---

### Insight Callouts

Below the city filter pills: Real-time comparison highlights showing the 3 most significant YoY changes:
- Revenue growth/decline
- Gross margin improvement/drop
- Margin % change
- Commission rate change
- Avg GM/tour change

---

## Guides Tab

### Overview
**Croatian Name:** Učinkovitost Vodiča (Guide Performance)  
**Subtitle:** Per-guide financials · Commission · YoY comparison

Sortable table showing individual guide performance metrics with 2026 vs 2025 comparison.

---

### Table Structure

| Column | Formula / Source | Notes |
|--------|---|---|
| **#** | Row rank | Auto-numbering, changes with sort |
| **Guide** | Guide name | From `Vendor` column |
| **City** | `City` column | Zagreb, Dubrovnik, Split, Zadar |
| **Free** | Count of tours where `Tour` = 'free' | Free city tours |
| **Paid** | Count of tours where `Tour` ≠ 'free' | Shows delta vs 2025 |
| **Avg PAX** | `Total guide pax` ÷ Paid tours | Average group size |
| **Revenue** | `Charged amount` (summed) | Shows delta vs 2025 |
| **Commission** | `Commission cost` (summed) | Shown as negative €; only OTA |
| **Cost** | `Vendor cost` (summed) | Guide fees paid |
| **GM €** | `Gross margin` (summed) | Shows delta vs 2025 |
| **GM %** | (Gross margin ÷ Revenue) × 100 | Profitability ratio |
| **GM/tour** | Gross margin ÷ Paid tours | Average margin per booking |

**Features:**
- **Sortable:** Click any column header to sort ascending/descending
- **City filter:** Select city to see only guides in that city (top of page)
- **YoY deltas:** Smaller text showing €Δ and %Δ vs 2025 in Paid, Revenue, and GM columns
- **Color coding:** GM € and GM % show green for positive, red for negative

---

## Channels Tab

### Overview
**Croatian Name:** Kanali & Prihod (Channels & Revenue)  
**Subtitle:** Commission drain · Direct vs OTA trend · Source breakdown · Tour type financials

Three main sections analyzing booking channels, OTA sources, and tour type profitability.

---

### Section 1: Commission Waterfall by Source

#### Chart: Revenue → Commission → Vendor Cost → Gross Margin per Source

**Type:** Horizontal stacked bar chart  
**Croatian Name:** Razrada Komisije po Izvoru (Commission Breakdown by Source)

**What it shows:** For each OTA source, how much revenue is consumed by commission and vendor costs, leaving gross margin

**Bars displayed:** Ranked by revenue (highest to lowest)

**Excel columns used:**
- `Sales source` → Source classification (Viator, GetYourGuide, Klook, etc.)
- `Charged amount` → Revenue by source
- `Commission cost` → Commission drain
- `Vendor cost` → Vendor payments
- `Gross margin` → Remaining margin

**Colors:**
- Green = Gross margin (positive)
- Red = Gross margin (negative) or costs
- Blue = Vendor cost
- Red/darker = Commission cost

**Tooltip shows:** Revenue amount and resulting GM%

---

### Section 2: Direct Booking vs OTA Trend

#### Chart: Direct (Web) vs OTA Revenue by Month — 2025 vs 2026

**Type:** Line chart with multiple series  
**Croatian Name:** Izravna Rezervacija vs OTA Trend po Mjesecu

**What it shows:** Monthly revenue trends split between direct bookings and OTA channels

**Four lines:**
- **Direct Rev 2025** (dashed, 2025 color) — Web bookings 2025
- **Direct Rev 2026** (solid with fill, green) — Web bookings current year
- **OTA Rev 2025** (thin dashed, 2025 color) — OTA bookings 2025
- **OTA Rev 2026** (thin solid, brown) — OTA bookings current year

**Excel columns used:**
- `Billing method` → Direct (POS/web) vs OTA (CPP)
- `Charged amount` → Monthly revenue by channel

**Note:** Channel split is approximated from each guide's overall channel ratio applied to their monthly revenue

**Data accuracy:** ⚠️ Approximated; best used for trend, not exact source split

---

### Section 3: OTA Source Detail Table

**Type:** Detailed breakdown table of all OTA sources  
**Excludes:** FST (internal source)

| Column | Formula | Notes |
|--------|---|---|
| **Source** | Source name from `Sales source` | GetYourGuide, Viator, Klook, etc. |
| **Tours '26** | Count of tours from source | Paid tours only |
| **Revenue '26** | `Charged amount` (summed) | Net revenue from source |
| **Commission** | `Commission cost` (summed) | Shown as negative |
| **Comm%** | (Commission ÷ Revenue) × 100 | Percentage drain |
| **Vendor Cost** | `Vendor cost` (summed) | Fees paid to guides |
| **GM '26** | `Gross margin` (summed) | Profitability of source |
| **GM%** | (Gross margin ÷ Revenue) × 100 | Margin ratio |
| **GM '25** | Gross margin from 2025 | Prior year comparison |
| **Δ GM** | GM26 − GM25 | YoY change in margin |

**Sorted by:** Gross Margin (descending) — most profitable sources first

**Colors:** GM€ and GM% show green/red based on profitability

---

### Section 4: Tour Type — Financial Breakdown

**Type:** Detailed breakdown table of tour types  
**Shows:** Financial metrics per tour type (e.g., "Walking Tour", "Boat Tour", etc.)

| Column | Formula | Notes |
|--------|---|---|
| **Tour Type** | Tour name from dataset | From `Tour` column |
| **Tours '26** | Count of paid tours by type | Shows delta vs 2025 |
| **Avg PAX** | Total pax ÷ Tours | Average group size for type |
| **Avg Unit Price** | Revenue ÷ Total pax | Price per person |
| **Revenue** | `Charged amount` (summed) | Total revenue by type |
| **Commission** | `Commission cost` (summed) | Shown as negative |
| **GM €** | `Gross margin` (summed) | Total margin by type |
| **GM %** | (Gross margin ÷ Revenue) × 100 | Profitability ratio |

**Excel columns used:**
- `Tour` → Tour type classification
- `Charged amount` → Revenue
- `Commission cost` → Commission
- `Gross margin` → Margin
- `Total guide pax` → PAX

**Sorted by:** Revenue (highest to lowest)

---

## Operational Tab

### Overview
**Croatian Name:** Operativni Uvidi (Operational Insights)  
**Subtitle:** Group size efficiency · DOW · Season · Week trends

Seven charts analyzing operational patterns: the key driver of profitability is **group size** (guide PAX band).

---

### Chart 1: GM% by Guide Group Size — 2025 vs 2026

**Type:** Bar chart (paired, grouped)  
**Key finding:** Small groups (1–5 PAX) are losing money in 2026; large groups (11+ PAX) achieve 36.8% GM

**Excel columns used:**
- `Guide pax band` → 1-5, 6-10, 11+ classifications
- `Gross margin` ÷ `Charged amount` → GM%

**Bars:**
- **GM% 2025** (2025 color) — Prior year margin by group size
- **GM% 2026** (green if positive, red if negative) — Current year margin

**Tooltip shows:** Tour count, revenue, and margin amount for each band

**Insight:** Group size is the primary profitability lever

---

### Chart 2: Tour Count by Guide Group Size — 2025 vs 2026

**Type:** Bar chart (paired, grouped)  
**Key finding:** 63% of 2026 paid tours are small-group (1–5 PAX), up from 54% in 2025

**Excel columns used:**
- `Guide pax band` → Group size classification
- Count of tours

**Bars:**
- **Tours 2025** (2025 color)
- **Tours 2026** (2026 color)

**Insight:** Volume shift toward smaller, lower-margin bookings

---

### Chart 3: Tours by Day of Week — 2025 vs 2026

**Type:** Bar chart (paired, grouped)

**Excel columns used:**
- `Day` → Monday, Tuesday, etc.
- Count of tours

**Shows:** Which days of the week are busiest

**Bars:**
- **2025** (2025 color)
- **2026** (2026 color)

---

### Chart 4: Tours by Time Slot — 2025 vs 2026

**Type:** Bar chart (paired, grouped)

**Excel columns used:**
- `Time` → Hour of day (08:00, 09:00, etc.)
- Count of tours

**Shows:** Which time slots are most popular

**Bars:**
- **2025** (2025 color)
- **2026** (2026 color)

---

### Chart 5: Tours by Season — 2025 vs 2026

**Type:** Bar chart (paired, grouped)

**Excel columns used:**
- `Season` → low, mid, high, peak
- Count of tours

**Shows:** Seasonal distribution of bookings

**Bars:**
- **2025** (2025 color)
- **2026** (2026 color)

---

### Chart 6: Booking PAX Band — 2025 vs 2026

**Type:** Bar chart (paired, grouped)

**Excel columns used:**
- `Pax band` → 1-4, 5-10, 11-20, 21-30, 30+
- Count of tours by pax band

**Shows:** Distribution of booking sizes (customer-level, not guide-level)

**Note:** Different from guide PAX band — this is the original booking size

**Bars:**
- **2025** (2025 color)
- **2026** (2026 color)

---

### Chart 7: Revenue & Gross Margin by Month — 2025 vs 2026

**Type:** Line chart with two series

**Excel columns used:**
- `Charged amount` (monthly) → Revenue
- `Gross margin` (monthly) → GM

**Four lines:**
- **Revenue 2025** (dashed, 2025 color)
- **Revenue 2026** (solid with light fill, blue-gray)
- **GM 2025** (thin dashed, 2025 color)
- **GM 2026** (solid, green)

**Shows:** Monthly trend in revenue and margin

---

### Chart 8: Week-by-Week Trend (2026) — Tours / Revenue / GM

**Type:** Multi-axis line chart (dual Y-axes)

**Excel columns used:**
- `Week` → Week number (1–52)
- Count of tours (left axis)
- `Charged amount` (right axis, €)
- `Gross margin` (right axis, €)

**Three lines:**
- **Tours** (blue, left Y-axis) — Number of tours per week
- **Revenue** (brown, right Y-axis) — Revenue per week
- **Gross Margin** (green dashed, right Y-axis) — GM per week

**Shows:** 2026 week-by-week performance in detail (typically weeks 1–20 for YTD data)

---

### Section: Payment Method Impact

#### Stat Cards: Cash, Card, Bank Transfer

**Type:** Three KPI cards  
**Croatian Name:** Utjecaj Vrste Plaćanja

**Each card shows:**
- **Revenue** — Total revenue from that payment method (€)
- **GM%** — Gross margin % for that method, with YoY delta vs 2025
- **Tours** — Number of tours paid via that method

**Examples:**
- **Card:** €33,816 revenue, 13.9% GM (processing fees included)
- **Bank Transfer:** €1,393 revenue (typically low-volume, institutional)
- **Cash:** €995 revenue (minimal)

**Excel columns used:**
- `Payment method` → card, bank trf, cash
- `Charged amount`, `Gross margin` per method

---

#### Chart: Revenue by Payment Method — 2025 vs 2026

**Type:** Grouped bar chart  
**What it shows:** Revenue comparison by payment method across both years

**Bars displayed:**
- Card 2025 vs Card 2026
- Bank Transfer 2025 vs Bank Transfer 2026
- Cash 2025 vs Cash 2026

**Tooltip shows:** Gross margin amount (€) and GM% for each method

**Key insight:** Card processing is your primary revenue channel. Understand which tours drive card vs. bank transfer bookings.

---

## Cities Tab

### Overview
**Croatian Name:** Gradovi (City Performance)  
**Subtitle:** Revenue · Margin · Product mix by city

A strategic overview of how each city (Zagreb, Dubrovnik, Split, Zadar) contributes to overall performance. Four sections: overview cards, tour-type breakdown by city, booking source distribution, and language mix.

---

### Section 1: City Overview — 2026 YTD

**Type:** Four KPI cards (one per city)

**Each card shows:**
- **City name** — header
- **Revenue** (€) — Total revenue for city YTD
- **Gross Margin** — Amount (€) and percentage (%)
- **Commission Rate** (%) — OTA commission as % of revenue
- **Tours & PAX** — Paid tour count and total paid pax
- **YoY Change** — ∆ GM (delta vs 2025, color-coded green/red)

**Example (Zagreb):**
```
€87,450 revenue
GM: €24,620 (28.1%)
Commission: 22.3%
156 tours · 2,840 pax
∆ GM: +€3,200 (vs 2025)
```

**Use case:** Which city is your growth engine? Which needs attention?

---

### Section 2: Tour Type Performance by City

**Type:** Heatmap table  
**Croatian Name:** Vrsta Ture po Gradu

**Rows:** All tour types present in data (war, food, best, war PR, food PR, old, big, etc.)  
**Columns:** Zagreb, Dubrovnik, Split, Zadar, Total

**Cell contents:** Two lines per cell
- **First line:** Revenue (€)
- **Second line:** Gross Margin % (bold)

**Cell coloring (background heatmap):**
- **Green** → GM% ≥ 25% (healthy margin)
- **Amber** → GM% 10–25% (moderate margin)
- **Red** → GM% < 10% (thin margin or unprofitable)
- **Grey** → No data (tour type not offered in that city)

**Bottom row:** Totals row showing aggregated revenue and GM% per city and grand total

**Example insight:** War tours earn €12,340 (31.2% GM) in Split but only €4,200 (14.5% GM) in Zagreb — product-market fit varies by city.

**Use case:** Where should you promote each tour type? Which cities need product diversification?

---

### Section 3: Booking Source Distribution by City

**Type:** Detailed breakdown table  
**Croatian Name:** Izvor Rezervacija po Gradu

**Rows:** Top booking sources (FST, GYG, Viator, Airbnb, Civitatis, Musement, named individuals)  
**Columns:** Zagreb, Dubrovnik, Split, Zadar

**Cell contents:** Two lines per cell
- **First line:** Revenue (€)
- **Second line:** Commission % (background color reflects commission impact)

**Cell background coloring:**
- **Red-tinted** → Commission > 25% (high OTA drain)
- **Orange-tinted** → Commission 15–25% (moderate OTA cost)
- **Green-tinted** → Commission < 15% (low OTA cost, or direct/FST)

**Use case:** Which city relies too heavily on expensive OTA platforms? Where should you push direct bookings?

**Example:** GetYourGuide takes 30% commission in Dubrovnik but only 22% in Zadar — investigate pricing or customer sourcing differences.

---

### Section 4: Language Mix by City — Paid Tours

**Type:** Stacked horizontal bar chart  
**Croatian Name:** Jezična Razina po Gradu

**Note:** This section shows **production volume only** (tours and pax counts). Revenue breakdown by language is not available in the current data structure.

**Four bars (one per city):** Zagreb, Dubrovnik, Split, Zadar

**Bar segments:** Three colors representing language distribution
- **Blue** → English (eng) tours
- **Orange** → Spanish (esp) tours  
- **Light blue** → French (fra) tours

**Each segment shows:** Percentage of that city's paid tours in that language

**Tooltip on hover:** Exact tour count and pax count for that language in that city

**Example (Split):**
- 62% English (124 tours, 1,850 pax)
- 28% Spanish (56 tours, 890 pax)
- 10% French (20 tours, 310 pax)

**Use case:**
- Which languages should you hire guides in for each city?
- Are foreign language tours underrepresented or oversupplied?
- Where should you invest in additional language capacity?

---

## Data Source

### Excel File
**Location:** `Copy of 1.1 Evidencija prodaje 26.xlsx`  
**Status:** Local file (not in repo)

### Sheet Names
- **Evidencija** — 2026 data (current, used by all tabs)
- **Evidencija_25** — 2025 historical data

### Data Extraction Process

```bash
# Update 2026 data (most common)
source venv/bin/activate
python3 scripts/extract_guides.py --year 2026 > data-2026.js
git add data-2026.js
git commit -m "Update: guides data $(date +%Y-%m)"
git push

# Update 2025 data (rarely needed)
python3 scripts/extract_guides.py --year 2025 > data-2025.js
```

### Critical Columns in Excel

| Excel Column | Used In | Purpose |
|---|---|---|
| `Tour` | All tabs | Tour type classification (or 'free') |
| `City` | Guides, Operational | City: Zagreb, Dubrovnik, Split, Zadar |
| `Language` | Guides tab | Language code: eng, esp, fra |
| `Tour no.` | Data filter | Only processes Tour no. = 1 (de-duplication) |
| `Vendor` | Guides tab | Guide name (data key) |
| `Month` | All tabs | Month number (1–12) |
| `Total guide pax` | All tabs | Group size for reporting |
| `Charged amount` | All tabs, P&L | **Revenue** |
| `Vendor cost` | All tabs, P&L | **Vendor cost / Guide fees** |
| `Gross margin` | All tabs, P&L | **Gross margin** |
| `Commission cost` | Channels tab | **OTA commission drain** |
| `Tour cost` | P&L tab | Internal tour operating cost |
| `VAT amount` | P&L tab | Sales tax |
| `Payment processing fee` | Data structure | Processing costs |
| `Amount before tax` | Data structure | Pre-tax total |
| `Sales source` | Channels tab | OTA source (GetYourGuide, Viator, etc.) |
| `Sales channel` | Channels tab | Direct vs OTA classification (web, OTA, b2b) |
| `Billing method` | P&L, Channels tabs | POS (direct) vs CPP (OTA) |
| `Guide pax band` | Operational tab | 1-5, 6-10, 11+ (KEY PROFITABILITY DRIVER) |
| `Pax band` | Operational tab | Booking size: 1-4, 5-10, 11-20, 21-30, 30+ |
| `Day` | Operational tab | Day of week (Mon–Sun) |
| `Time` | Operational tab | Time of day (08:00, 09:00, etc.) |
| `Season` | Operational tab | low, mid, high, peak |
| `Week` | Operational tab | ISO week number (1–52) |
| `Date` | Data processing | Used to extract day-of-month cutoff |
| `Year` | Data filter | Year 2025 or 2026 (used to filter rows) |
| `Price type` | Data structure | Pricing strategy (if recorded) |

---

## Navigation & Features

### Keyboard Shortcuts
- **1** — Jump to P&L tab
- **2** — Jump to Guides tab
- **3** — Jump to Channels tab
- **4** — Jump to Operational tab
- **5** — Jump to Cities tab
- **T** — Toggle dark/light theme
- **D** — Focus on date picker (for YTD cutoff)
- **?** — Show shortcuts help overlay
- **Esc** — Close overlay

### City Filter
Available on **P&L** and **Guides** tabs:
- All cities
- Zagreb
- Dubrovnik
- Split
- Zadar

Re-renders all charts and tables when changed.

### Date Picker
Top-right of page:
- Controls **YTD cutoff** (which months are included in sums)
- Refreshes all tabs when changed
- Useful for viewing "as of" snapshots (e.g., May 15 vs May 31)

### Theme Toggle
Top-right button:
- Dark mode (default: matches system preference)
- Light mode
- Persists to `localStorage`

---

## Tips & Gotchas

### GM% by Guide PAX Band Shows Negative in 2026
Small groups (1–5 PAX) are unprofitable because:
- Low per-person revenue (reduced pricing or volume discounts)
- Fixed guide cost + operations overhead not covered
- **Recommendation:** Investigate dynamic pricing or minimum group sizes

### Channel Split Approximated
The **Direct vs OTA Trend** chart estimates channel breakdown using each guide's full-season ratio applied to monthly data. This is not 100% accurate for a given month but shows directional trends correctly.

### Filter & Sort Are Independent
- City filter (P&L, Guides) does NOT affect Channels or Operational tabs
- Sort on Guides tab only applies to that table view

### YoY Comparison Data
- If a guide didn't work in 2025, no comparison shown (—)
- If a source didn't exist in 2025, only 2026 data shown

### Sticky KPI Bar
On P&L tab, appears when you scroll past the main KPI grid and disappears when scrolling back. Use for quick reference while reviewing charts below.

---

## When to Update Data

1. **Weekly:** After Monday morning when prior week data is finalized
2. **Monthly:** After month-end close (usually 2–3 days into next month)
3. **Ad hoc:** When investigating a specific anomaly

**Who updates:** Data analyst or someone with Excel + Python access

**Process:** Run `extract_guides.py --year 2026`, review in browser, commit and push.

---

## Support / Questions

- **Data missing?** Check the Excel file headers match the script expectations (see "Critical Columns" section)
- **Chart looks wrong?** Verify data extraction succeeded and columns are not renamed
- **Theme not saving?** Browser may have cookies/storage disabled

---

**End of Guide**
