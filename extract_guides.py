"""
Extract per-guide stats and print JS data for guides.html.

Usage:
  python3 extract_guides.py                          # 2026 data (helper_2026 sheet)
  python3 extract_guides.py --year 2025              # 2025 data (Evidencija sheet, rows 2-7022)
  python3 extract_guides.py --sheet helper_2026      # explicit sheet name
  python3 extract_guides.py --sheet Evidencija --year 2025
  python3 extract_guides.py --year 2026 > guides_data_2026.js
  python3 extract_guides.py --year 2025 > guides_data_2025.js
Column positions are detected automatically from the header row.
"""

import sys
import json
import openpyxl
from collections import defaultdict

EXCEL_FILE = 'Copy of 1.1 Evidencija prodaje 26.xlsx'

# Parse CLI args
args = sys.argv[1:]
YEAR   = None
SHEET  = None
i = 0
while i < len(args):
    if args[i] == '--year'  and i+1 < len(args): YEAR  = int(args[i+1]); i += 2
    elif args[i] == '--sheet' and i+1 < len(args): SHEET = args[i+1];      i += 2
    else: i += 1

# Defaults by year
if YEAR is None and SHEET is None:
    YEAR, SHEET = 2026, 'helper_2026'
elif YEAR == 2025 and SHEET is None:
    SHEET = 'Evidencija'
elif YEAR == 2026 and SHEET is None:
    SHEET = 'helper_2026'
elif SHEET is None:
    SHEET = 'helper_2026'

CITY_MAP = {'zg': 'Zagreb', 'du': 'Dubrovnik', 'st': 'Split', 'zd': 'Zadar'}
LANG_MAP = {'eng': 'eng', 'esp': 'esp', 'fra': 'fra'}
MONTH_NAMES = {1:'Sij',2:'Velj',3:'Ožu',4:'Tra',5:'Svi',6:'Lip',7:'Srp',8:'Kol',9:'Ruj',10:'Lis',11:'Stu',12:'Pro'}

# Canonical guide order (city → [names])
GUIDE_ORDER = [
    ('Zagreb', [
        'Darko Crnolatac', 'Luka Pelicarić', 'Vid Dorić', 'Diana Bolić',
        'Ivana Čakarić', 'Katarina Novoselac', 'Iva Pavlović', 'Nikolina Folnović',
        'Katija Crnčević', 'Kristina Božić', 'Ena Matacun', 'Nadir Ivanović',
    ]),
    ('Dubrovnik', [
        'Marin Kalauz', 'Pero Kusalo', 'Andrea Rendulić', 'Sara Žanetić',
        'Maja Musulin', 'Nikolina Vidojević', 'Ivo Miličić', 'Lorena Arias',
        'Nikolina Vukanović',
    ]),
    ('Split', [
        'Bruno Beara', 'Ivana Čagalj', 'Lorena Ćelić', 'Marija Močić',
        'Marina Krolo', 'Petra Lučev', 'Boris Čerina',
    ]),
    ('Zadar', [
        'Andrija Grubić', 'Iva Zaplatić', 'Matea Duka', 'Tonka Baričević',
    ]),
]

def empty_stats():
    return {
        'free':  {'tours': 0, 'pax': 0},
        'paid':  {'tours': 0, 'pax': 0},
        'byType': defaultdict(lambda: {'tours': 0, 'pax': 0}),
        'byMonth': defaultdict(lambda: {
            'free': {'tours': 0, 'pax': 0},
            'paid': {'tours': 0, 'pax': 0},
        }),
    }

def add_row(stats, is_free, tour_type, month, pax):
    kind = 'free' if is_free else 'paid'
    stats[kind]['tours'] += 1
    stats[kind]['pax'] += pax
    if not is_free:
        stats['byType'][tour_type]['tours'] += 1
        stats['byType'][tour_type]['pax'] += pax
    stats['byMonth'][month][kind]['tours'] += 1
    stats['byMonth'][month][kind]['pax'] += pax

def merge_stats(all_stats, lang_stats):
    """Merge lang_stats into all_stats (for 'all' lang accumulation)."""
    for kind in ('free', 'paid'):
        all_stats[kind]['tours'] += lang_stats[kind]['tours']
        all_stats[kind]['pax'] += lang_stats[kind]['pax']
    for t, v in lang_stats['byType'].items():
        all_stats['byType'][t]['tours'] += v['tours']
        all_stats['byType'][t]['pax'] += v['pax']
    for m, mv in lang_stats['byMonth'].items():
        for kind in ('free', 'paid'):
            all_stats['byMonth'][m][kind]['tours'] += mv[kind]['tours']
            all_stats['byMonth'][m][kind]['pax'] += mv[kind]['pax']

def to_plain(stats):
    """Convert defaultdicts to plain dicts for JSON serialisation."""
    months_present = sorted(stats['byMonth'].keys())
    return {
        'free': stats['free'],
        'paid': stats['paid'],
        'byType': {k: dict(v) for k, v in stats['byType'].items()},
        'byMonth': {
            m: {
                'name': MONTH_NAMES.get(m, str(m)),
                'free': dict(stats['byMonth'][m]['free']),
                'paid': dict(stats['byMonth'][m]['paid']),
            }
            for m in months_present
        },
    }

def main():
    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
    ws = wb[SHEET]

    # Detect column positions from header row
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    def col(name):
        try: return headers.index(name)
        except ValueError: raise ValueError(f'Column "{name}" not found in sheet "{SHEET}". Headers: {headers}')

    C_TOUR    = col('Tour')
    C_CITY    = col('City')
    C_LANG    = col('Language')
    C_TOUR_NO = col('Tour no.')
    C_VENDOR  = col('Vendor')
    C_MONTH   = col('Month')
    C_PAX     = col('Total guide pax')
    C_YEAR    = col('Year') if 'Year' in headers else None

    # raw[vendor][lang] = stats
    raw = defaultdict(lambda: {lang: empty_stats() for lang in ('eng', 'esp', 'fra')})

    for row in ws.iter_rows(min_row=2, values_only=True):
        vendor = row[C_VENDOR]
        if not vendor or vendor == 'vanjski vodič':
            continue
        tour_no = row[C_TOUR_NO]
        if tour_no != 1.0:
            continue

        # Year filter: skip rows not matching the target year (when column exists)
        if C_YEAR is not None and YEAR is not None:
            row_year = row[C_YEAR]
            if row_year and int(row_year) != YEAR:
                continue

        tour = row[C_TOUR]
        lang = row[C_LANG]
        month = int(row[C_MONTH]) if row[C_MONTH] else None
        pax = int(row[C_PAX]) if row[C_PAX] else 0

        if lang not in ('eng', 'esp', 'fra'):
            lang = 'eng'  # fallback
        if month is None:
            continue

        is_free = (tour == 'free')
        add_row(raw[vendor][lang], is_free, tour, month, pax)

    # Build output list following canonical order
    result = []
    seen = set()

    for city, names in GUIDE_ORDER:
        for name in names:
            if name not in raw:
                continue
            seen.add(name)
            all_s = empty_stats()
            lang_stats = {}
            for lang in ('eng', 'esp', 'fra'):
                ls = raw[name][lang]
                merge_stats(all_s, ls)
                lang_stats[lang] = to_plain(ls)
            lang_stats['all'] = to_plain(all_s)
            result.append({
                'name': name,
                'city': city,
                'stats': lang_stats,
            })

    # Append any guides not in canonical list (shouldn't happen, but safety net)
    for name in raw:
        if name in seen:
            continue
        all_s = empty_stats()
        lang_stats = {}
        for lang in ('eng', 'esp', 'fra'):
            ls = raw[name][lang]
            merge_stats(all_s, ls)
            lang_stats[lang] = to_plain(ls)
        lang_stats['all'] = to_plain(all_s)
        result.append({'name': name, 'city': 'Unknown', 'stats': lang_stats})

    # KPI totals (across all guides, all langs)
    total_free_tours = sum(g['stats']['all']['free']['tours'] for g in result)
    total_paid_tours = sum(g['stats']['all']['paid']['tours'] for g in result)
    total_free_pax   = sum(g['stats']['all']['free']['pax']   for g in result)
    total_paid_pax   = sum(g['stats']['all']['paid']['pax']   for g in result)
    total_guides     = len(result)

    kpi = {
        'guides': total_guides,
        'freeTours': total_free_tours,
        'paidTours': total_paid_tours,
        'freePax': total_free_pax,
        'paidPax': total_paid_pax,
    }

    # Output JS
    def js(obj):
        return json.dumps(obj, ensure_ascii=False, indent=2)

    print(f'const kpiTotals = {js(kpi)};')
    print()
    print(f'const guideStats = {js(result)};')

if __name__ == '__main__':
    main()
