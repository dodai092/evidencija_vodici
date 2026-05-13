"""
Append new guide tour rows to data-2026.js without touching existing data.
Only adds rows for dates not yet present in byDay for each guide/language.
"""

import json
import re
import sys
import openpyxl
from collections import defaultdict

EXCEL_FILE = 'Copy of 1.1 Evidencija prodaje 26.xlsx'
DATA_FILE  = 'data-2026.js'
SHEET      = 'helper_2026'

CITY_MAP   = {'zg': 'Zagreb', 'du': 'Dubrovnik', 'st': 'Split', 'zd': 'Zadar'}
LANG_MAP   = {'eng': 'eng', 'esp': 'esp', 'fra': 'fra'}
MONTH_NAMES= {1:'Sij',2:'Velj',3:'Ožu',4:'Tra',5:'Svi',6:'Lip',7:'Srp',8:'Kol',9:'Ruj',10:'Lis',11:'Stu',12:'Pro'}

# ── 1. Load existing JS data ───────────────────────────────────────────────
with open(DATA_FILE) as f:
    raw = f.read()

m = re.search(r'const kpiTotals26\s*=\s*(\{.*?\});', raw, re.DOTALL)
kpi = json.loads(m.group(1))

m = re.search(r'const guideStats26\s*=\s*(\[.*\]);', raw, re.DOTALL)
guides = json.loads(m.group(1))

# Index guides by name for fast lookup
guide_index = {g['name']: g for g in guides}

# ── 2. Load Excel rows ─────────────────────────────────────────────────────
wb = openpyxl.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
ws = wb[SHEET]
all_rows = list(ws.iter_rows(values_only=True))

data_rows = [
    r for r in all_rows[1:]
    if r[0] is not None and hasattr(r[0], 'month')
]

# ── 3. Determine which day-keys already exist per guide+lang ───────────────
def existing_days(guide_obj):
    """Return set of (lang, day_key) already recorded in byDay."""
    seen = set()
    for lang, lstats in guide_obj['stats'].items():
        if lang == 'all':
            continue
        for dk in lstats.get('byDay', {}):
            seen.add((lang, dk))
    return seen

# ── 4. Build new rows grouped by guide ────────────────────────────────────
# new_data[guide_name][lang][day_key] = list of rows
new_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
new_guides_needed = {}  # name -> city

for r in data_rows:
    date, tour_type, city_code, lang_code, guide_name, pax = \
        r[0], r[2], r[3], r[4], r[7], r[10]

    if guide_name is None:
        continue
    lang = LANG_MAP.get(lang_code)
    if lang is None:
        continue
    city = CITY_MAP.get(city_code, 'Unknown')
    day_key = f"{date.month}-{date.day}"
    pax = int(pax) if pax is not None else 0

    # Check if this guide+lang+day already exists
    if guide_name in guide_index:
        existing = existing_days(guide_index[guide_name])
        if (lang, day_key) in existing:
            continue  # already have data for this guide/lang/day — skip
    else:
        new_guides_needed[guide_name] = city

    new_data[guide_name][lang][day_key].append({
        'tour_type': tour_type,
        'pax': pax,
        'month': date.month,
        'day': date.day,
    })

print(f"New guides to create: {list(new_guides_needed.keys())}", file=sys.stderr)
total_new_rows = sum(
    len(rows)
    for gd in new_data.values()
    for ld in gd.values()
    for rows in ld.values()
)
print(f"Total new rows to append: {total_new_rows}", file=sys.stderr)

# ── 5. Helper: empty stats skeleton ───────────────────────────────────────
def empty_lang_stats():
    return {
        'free':    {'tours': 0, 'pax': 0},
        'paid':    {'tours': 0, 'pax': 0},
        'byType':  {},
        'byMonth': {},
        'byDay':   {},
        'byDayType': {},
    }

def empty_guide(name, city):
    return {
        'name': name,
        'city': city,
        'stats': {
            'eng': empty_lang_stats(),
            'esp': empty_lang_stats(),
            'fra': empty_lang_stats(),
            'all': empty_lang_stats(),
        }
    }

# ── 6. Apply new rows ──────────────────────────────────────────────────────
delta_free_tours = 0
delta_paid_tours = 0
delta_free_pax   = 0
delta_paid_pax   = 0
new_guide_names  = set()

for guide_name, lang_days in new_data.items():
    # Ensure guide exists
    if guide_name not in guide_index:
        city = new_guides_needed[guide_name]
        g = empty_guide(guide_name, city)
        guides.append(g)
        guide_index[guide_name] = g
        new_guide_names.add(guide_name)

    g = guide_index[guide_name]

    for lang, days in lang_days.items():
        ls = g['stats'][lang]
        al = g['stats']['all']

        for day_key, rows in days.items():
            # Initialise byDay entry if missing
            for stats in (ls, al):
                if day_key not in stats['byDay']:
                    stats['byDay'][day_key] = {
                        'free': {'tours': 0, 'pax': 0},
                        'paid': {'tours': 0, 'pax': 0},
                    }

            for row in rows:
                tt   = row['tour_type']
                pax  = row['pax']
                mon  = row['month']
                is_free = (tt == 'free')
                bucket  = 'free' if is_free else 'paid'

                # ── lang stats ──
                ls[bucket]['tours'] += 1
                ls[bucket]['pax']   += pax
                ls['byDay'][day_key][bucket]['tours'] += 1
                ls['byDay'][day_key][bucket]['pax']   += pax

                # byMonth
                mk = str(mon)
                if mk not in ls['byMonth']:
                    ls['byMonth'][mk] = {
                        'name': MONTH_NAMES[mon],
                        'free': {'tours': 0, 'pax': 0},
                        'paid': {'tours': 0, 'pax': 0},
                    }
                ls['byMonth'][mk][bucket]['tours'] += 1
                ls['byMonth'][mk][bucket]['pax']   += pax

                # byType (paid only)
                if not is_free:
                    if tt not in ls['byType']:
                        ls['byType'][tt] = {'tours': 0, 'pax': 0}
                    ls['byType'][tt]['tours'] += 1
                    ls['byType'][tt]['pax']   += pax
                    if day_key not in ls['byDayType']:
                        ls['byDayType'][day_key] = {}
                    if tt not in ls['byDayType'][day_key]:
                        ls['byDayType'][day_key][tt] = {'tours': 0, 'pax': 0}
                    ls['byDayType'][day_key][tt]['tours'] += 1
                    ls['byDayType'][day_key][tt]['pax']   += pax

                # ── 'all' aggregate ──
                al[bucket]['tours'] += 1
                al[bucket]['pax']   += pax
                al['byDay'][day_key][bucket]['tours'] += 1
                al['byDay'][day_key][bucket]['pax']   += pax

                mk_al = str(mon)
                if mk_al not in al['byMonth']:
                    al['byMonth'][mk_al] = {
                        'name': MONTH_NAMES[mon],
                        'free': {'tours': 0, 'pax': 0},
                        'paid': {'tours': 0, 'pax': 0},
                    }
                al['byMonth'][mk_al][bucket]['tours'] += 1
                al['byMonth'][mk_al][bucket]['pax']   += pax

                if not is_free:
                    if tt not in al['byType']:
                        al['byType'][tt] = {'tours': 0, 'pax': 0}
                    al['byType'][tt]['tours'] += 1
                    al['byType'][tt]['pax']   += pax
                    if day_key not in al['byDayType']:
                        al['byDayType'][day_key] = {}
                    if tt not in al['byDayType'][day_key]:
                        al['byDayType'][day_key][tt] = {'tours': 0, 'pax': 0}
                    al['byDayType'][day_key][tt]['tours'] += 1
                    al['byDayType'][day_key][tt]['pax']   += pax

                # ── global kpi delta ──
                if is_free:
                    delta_free_tours += 1
                    delta_free_pax   += pax
                else:
                    delta_paid_tours += 1
                    delta_paid_pax   += pax

# ── 7. Update kpiTotals26 ─────────────────────────────────────────────────
kpi['freeTours'] += delta_free_tours
kpi['paidTours'] += delta_paid_tours
kpi['freePax']   += delta_free_pax
kpi['paidPax']   += delta_paid_pax
kpi['guides']    += len(new_guide_names)

print(f"KPI delta: +{delta_free_tours} free tours, +{delta_paid_tours} paid tours, "
      f"+{delta_free_pax} free pax, +{delta_paid_pax} paid pax", file=sys.stderr)
print(f"New KPI totals: {kpi}", file=sys.stderr)

# ── 8. Write back ──────────────────────────────────────────────────────────
kpi_js    = json.dumps(kpi, ensure_ascii=False, indent=2)
guides_js = json.dumps(guides, ensure_ascii=False, indent=2)

output = f"const kpiTotals26 = {kpi_js};\n\nconst guideStats26 = {guides_js};\n"

with open(DATA_FILE, 'w') as f:
    f.write(output)

print(f"Done. data-2026.js updated.", file=sys.stderr)
