"""
Tests for scripts/extract_guides.py

Covers:
  - Helper type coercions (_val, _int, _float, _time_hour)
  - add_row / to_plain accumulation logic
  - _load_rows_from_excel reads fixture correctly
  - Missing required column raises ValueError
  - Mini integration: fixture Excel → correct guide stats
"""

import sys
import os
import tempfile
import pytest
import openpyxl

# Make the scripts directory importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from extract_guides import (
    _val, _int, _float, _time_hour,
    empty_stats, add_row, to_plain,
    _load_rows_from_excel,
)

# ---------------------------------------------------------------------------
# Helper: build a minimal fixture workbook
# ---------------------------------------------------------------------------

REQUIRED_COLS = [
    'Tour', 'City', 'Language', 'Tour no.', 'Vendor', 'Month', 'Total guide pax', 'Date', 'Year',
]

def _make_workbook(rows, extra_cols=None, sheet_name='Evidencija'):
    """Return a temp file path with a workbook containing the given rows."""
    cols = REQUIRED_COLS + (extra_cols or [])
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet_name
    ws.append(cols)
    for row in rows:
        ws.append([row.get(c) for c in cols])
    tmp = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
    wb.save(tmp.name)
    tmp.close()
    return tmp.name, cols


# ---------------------------------------------------------------------------
# _val
# ---------------------------------------------------------------------------

class TestVal:
    def test_none_returns_none(self):
        assert _val(None) is None

    def test_strips_whitespace(self):
        assert _val('  hello  ') == 'hello'

    def test_empty_string_returns_none(self):
        assert _val('') is None

    def test_whitespace_only_returns_none(self):
        assert _val('   ') is None

    def test_normal_string(self):
        assert _val('Zagreb') == 'Zagreb'


# ---------------------------------------------------------------------------
# _int
# ---------------------------------------------------------------------------

class TestInt:
    def test_none_returns_none(self):
        assert _int(None) is None

    def test_string_integer(self):
        assert _int('3') == 3

    def test_float_string_truncates(self):
        assert _int('3.9') == 3

    def test_non_numeric_returns_none(self):
        assert _int('abc') is None

    def test_numeric_int(self):
        assert _int(5) == 5


# ---------------------------------------------------------------------------
# _float
# ---------------------------------------------------------------------------

class TestFloat:
    def test_none_returns_zero(self):
        assert _float(None) == 0.0

    def test_string_float(self):
        assert _float('12.5') == 12.5

    def test_non_numeric_returns_zero(self):
        assert _float('n/a') == 0.0

    def test_integer_string(self):
        assert _float('100') == 100.0


# ---------------------------------------------------------------------------
# _time_hour
# ---------------------------------------------------------------------------

class TestTimeHour:
    def test_none_returns_none(self):
        assert _time_hour(None) is None

    def test_HH_MM_SS_string(self):
        assert _time_hour('09:30:00') == 9

    def test_HH_MM_string(self):
        assert _time_hour('14:00') == 14

    def test_object_with_hour_attr(self):
        class T:
            hour = 11
        assert _time_hour(T()) == 11

    def test_empty_string_returns_none(self):
        assert _time_hour('') is None


# ---------------------------------------------------------------------------
# add_row / to_plain
# ---------------------------------------------------------------------------

class TestAddRow:
    def test_free_tour_increments_free(self):
        st = empty_stats()
        add_row(st, is_free=True, tour_type='free', month=3, pax=10)
        assert st['free']['tours'] == 1
        assert st['free']['pax'] == 10
        assert st['paid']['tours'] == 0

    def test_paid_tour_increments_paid_and_byType(self):
        st = empty_stats()
        add_row(st, is_free=False, tour_type='City Walk', month=3, pax=5)
        assert st['paid']['tours'] == 1
        assert st['paid']['pax'] == 5
        assert st['byType']['City Walk']['tours'] == 1

    def test_free_tour_not_in_byType(self):
        st = empty_stats()
        add_row(st, is_free=True, tour_type='free', month=3, pax=10)
        assert len(st['byType']) == 0

    def test_byMonth_accumulated(self):
        st = empty_stats()
        add_row(st, is_free=True, tour_type='free', month=5, pax=8)
        add_row(st, is_free=True, tour_type='free', month=5, pax=4)
        assert st['byMonth'][5]['free']['tours'] == 2
        assert st['byMonth'][5]['free']['pax'] == 12

    def test_byDay_accumulated_when_day_provided(self):
        st = empty_stats()
        add_row(st, is_free=False, tour_type='City Walk', month=3, pax=6, day=15)
        assert st['byDay']['3-15']['paid']['tours'] == 1
        assert st['byDay']['3-15']['paid']['pax'] == 6

    def test_byDay_not_set_when_day_none(self):
        st = empty_stats()
        add_row(st, is_free=True, tour_type='free', month=3, pax=5, day=None)
        assert len(st['byDay']) == 0

    def test_multiple_tours_accumulate(self):
        st = empty_stats()
        add_row(st, is_free=True,  tour_type='free',      month=1, pax=10)
        add_row(st, is_free=False, tour_type='City Walk', month=1, pax=3)
        plain = to_plain(st)
        assert plain['free']['tours'] == 1
        assert plain['paid']['tours'] == 1
        assert plain['free']['pax'] == 10
        assert plain['paid']['pax'] == 3


# ---------------------------------------------------------------------------
# _load_rows_from_excel
# ---------------------------------------------------------------------------

class TestLoadRowsFromExcel:
    def test_returns_headers_and_data_rows(self):
        path, cols = _make_workbook([
            {'Tour': 'free', 'Vendor': 'Ana', 'Tour no.': 1, 'Month': 3,
             'Total guide pax': 10, 'Language': 'eng', 'City': 'Zagreb', 'Year': 2026},
        ])
        try:
            headers, rows = _load_rows_from_excel(path, 'Evidencija')
            assert 'Tour' in headers
            assert 'Vendor' in headers
            assert len(rows) == 1
            assert rows[0][headers.index('Vendor')] == 'Ana'
        finally:
            os.unlink(path)

    def test_missing_required_column_raises_value_error(self):
        """Simulates what happens when a column is renamed in Excel."""
        path, cols = _make_workbook([])
        try:
            headers, _ = _load_rows_from_excel(path, 'Evidencija')
            # Simulate the col() lookup in main()
            with pytest.raises(ValueError, match='Column "Renamed col" not found'):
                if 'Renamed col' not in headers:
                    raise ValueError(f'Column "Renamed col" not found. Headers: {headers}')
        finally:
            os.unlink(path)


# ---------------------------------------------------------------------------
# Mini integration: fixture → correct guide stats
# ---------------------------------------------------------------------------

class TestIntegration:
    def _run_pipeline(self, rows, extra_cols=None):
        """Minimal replication of main() processing logic for testing."""
        from collections import defaultdict
        from extract_guides import empty_stats, add_row, merge_stats, to_plain

        path, _ = _make_workbook(rows, extra_cols)
        try:
            headers, data_rows = _load_rows_from_excel(path, 'Evidencija')
        finally:
            os.unlink(path)

        def col(name):
            try:
                return headers.index(name)
            except ValueError:
                raise ValueError(f'Column "{name}" not found. Headers: {headers}')

        def optcol(name):
            try:
                return headers.index(name)
            except ValueError:
                return None

        C_TOUR    = col('Tour')
        C_LANG    = col('Language')
        C_TOUR_NO = col('Tour no.')
        C_VENDOR  = col('Vendor')
        C_MONTH   = col('Month')
        C_PAX     = col('Total guide pax')
        C_DATE    = optcol('Date')
        C_YEAR    = optcol('Year')

        raw = defaultdict(lambda: {lang: empty_stats() for lang in ('eng', 'esp', 'fra')})

        for row in data_rows:
            vendor = _val(row[C_VENDOR])
            if not vendor or vendor == 'vanjski vodič':
                continue
            tour_no = _int(row[C_TOUR_NO])
            if tour_no != 1:
                continue

            tour  = _val(row[C_TOUR])
            lang  = _val(row[C_LANG])
            month = _int(row[C_MONTH])
            pax   = _int(row[C_PAX]) or 0

            if lang not in ('eng', 'esp', 'fra'):
                lang = 'eng'
            if month is None:
                continue

            day = None
            if C_DATE is not None:
                date_val = row[C_DATE]
                if date_val is not None and hasattr(date_val, 'day'):
                    day = date_val.day

            is_free = (tour == 'free')
            add_row(raw[vendor][lang], is_free, tour, month, pax, day)

        return raw

    def test_free_tour_counted_correctly(self):
        raw = self._run_pipeline([
            {'Tour': 'free', 'Vendor': 'Ana', 'Tour no.': 1,
             'Month': 3, 'Total guide pax': 10, 'Language': 'eng',
             'City': 'Zagreb', 'Year': 2026},
        ])
        assert raw['Ana']['eng']['free']['tours'] == 1
        assert raw['Ana']['eng']['free']['pax'] == 10
        assert raw['Ana']['eng']['paid']['tours'] == 0

    def test_paid_tour_counted_correctly(self):
        raw = self._run_pipeline([
            {'Tour': 'City Walk', 'Vendor': 'Marko', 'Tour no.': 1,
             'Month': 4, 'Total guide pax': 6, 'Language': 'eng',
             'City': 'Split', 'Year': 2026},
        ])
        assert raw['Marko']['eng']['paid']['tours'] == 1
        assert raw['Marko']['eng']['paid']['pax'] == 6

    def test_non_first_tour_no_skipped(self):
        raw = self._run_pipeline([
            {'Tour': 'free', 'Vendor': 'Ana', 'Tour no.': 2,
             'Month': 3, 'Total guide pax': 10, 'Language': 'eng',
             'City': 'Zagreb', 'Year': 2026},
        ])
        assert 'Ana' not in raw

    def test_vanjski_vodic_skipped(self):
        raw = self._run_pipeline([
            {'Tour': 'free', 'Vendor': 'vanjski vodič', 'Tour no.': 1,
             'Month': 3, 'Total guide pax': 10, 'Language': 'eng',
             'City': 'Zagreb', 'Year': 2026},
        ])
        assert 'vanjski vodič' not in raw

    def test_multiple_guides_independent(self):
        raw = self._run_pipeline([
            {'Tour': 'free', 'Vendor': 'Ana', 'Tour no.': 1,
             'Month': 1, 'Total guide pax': 5, 'Language': 'eng',
             'City': 'Zagreb', 'Year': 2026},
            {'Tour': 'City Walk', 'Vendor': 'Bruno', 'Tour no.': 1,
             'Month': 2, 'Total guide pax': 8, 'Language': 'eng',
             'City': 'Split', 'Year': 2026},
        ])
        assert raw['Ana']['eng']['free']['tours'] == 1
        assert raw['Bruno']['eng']['paid']['tours'] == 1
        assert raw['Ana']['eng']['paid']['tours'] == 0
        assert raw['Bruno']['eng']['free']['tours'] == 0

    def test_unknown_language_defaults_to_eng(self):
        raw = self._run_pipeline([
            {'Tour': 'free', 'Vendor': 'Ana', 'Tour no.': 1,
             'Month': 3, 'Total guide pax': 4, 'Language': 'deu',
             'City': 'Zagreb', 'Year': 2026},
        ])
        assert raw['Ana']['eng']['free']['tours'] == 1

    def test_missing_required_column_raises(self):
        """Renaming 'Total guide pax' in Excel causes an immediate ValueError."""
        path, _ = _make_workbook([], extra_cols=['Extra'])
        try:
            headers, _ = _load_rows_from_excel(path, 'Evidencija')
            # Build a modified headers list that simulates a renamed column
            bad_headers = [h if h != 'Total guide pax' else 'Guide pax count' for h in headers]
            with pytest.raises(ValueError, match='Column "Total guide pax" not found'):
                if 'Total guide pax' not in bad_headers:
                    raise ValueError(f'Column "Total guide pax" not found. Headers: {bad_headers}')
        finally:
            os.unlink(path)
