# Unit Testing Design

**Date:** 2026-05-18
**Scope:** Pure function unit tests for `src/shared.js`

## Problem

Silent logic bugs — wrong numbers shown in the dashboard with no error or warning. The `filteredStats` function has three branching paths (complete month, partial month with day-level data, partial month fallback) and is the highest-risk function in the codebase.

## Approach

Vitest as test runner. ESM-native, no config file needed, one dev dependency, works alongside the existing esbuild pipeline without interference.

## Setup

```
npm install -D vitest
```

Add to `package.json` scripts:
```json
"test":       "vitest run",
"test:watch": "vitest"
```

No `vitest.config.js` needed — Vitest discovers `*.test.js` files automatically and handles ES modules natively.

## File Structure

```
evidencija/
  tests/
    shared.test.js
  package.json
```

## Test Coverage

One file: `tests/shared.test.js`

### Simple utilities (no state)

| Function | Cases |
|---|---|
| `safeName(n)` | spaces → underscore, special chars stripped, alphanumeric preserved |
| `fmtN(v)` | rounding (1.6 → 2), large numbers formatted with commas, zero |

### Date-dependent functions (use `setGlobalDate` before each test)

| Function | Cases |
|---|---|
| `getCutoffMonth()` | returns correct month integer from various date strings |
| `parseGlobalDate()` | extracts year, month, day correctly |
| `getRangeLabel()` | returns `'Jan'` when month is 1, `'Jan–May'` for month 5, etc. |

### `filteredStats(st, months)` — primary target

Three branches to cover:

1. **Complete months** (`m < cutoffMonth`): sums `byMonth` aggregates for each selected month
2. **Partial current month with `byDay`**: sums only `byDay` entries up to `cutoffDay`, ignores later days
3. **Partial current month without `byDay`** (fallback): uses full `byMonth` entry for that month
4. **Month filter** (`months` param): only sums months in the provided array, ignores others
5. **Missing month data**: handles absent `byMonth` entries gracefully (no crash, zero contribution)

State is set per-test using `setGlobalDate(value)` — no mocking required.

## What is NOT covered

- DOM rendering functions (`makeBars`, `makeOwners`, `makeTable`, etc.) — require a browser or jsdom, low ROI for now
- Chart.js integrations — require canvas
- Page modules (`Page25`, `Page26`, etc.) — DOM-coupled, separate concern
- Python extractor (`extract_guides.py`) — separate scope, would need its own test suite

## Running Tests

```bash
npm test           # single run
npm run test:watch # watch mode during development
```
