const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.resolve(__dirname, '..', 'index.html')}`;

// Open the app and wait for Page25 to inject its content
async function load(page) {
    await page.goto(FILE_URL);
    await page.waitForLoadState('load');
    await page.waitForFunction(() => (document.getElementById('page-25')?.children.length ?? 0) > 0);
}

// Assert a Chart.js canvas has been drawn (Chart.js sets canvas.width > 0)
async function hasChart(page, canvasId) {
    const w = await page.evaluate(id => document.getElementById(id)?.width ?? 0, canvasId);
    expect(w, `canvas#${canvasId} should have width > 0`).toBeGreaterThan(0);
}

// ── Tab navigation ────────────────────────────────────────────────────────────

test.describe('Tab navigation', () => {
    test('all 4 main tabs switch pages', async ({ page }) => {
        await load(page);

        await expect(page.locator('#page-25')).toBeVisible();
        await expect(page.locator('#page-26')).not.toBeVisible();

        await page.click('#tab-26');
        await expect(page.locator('#page-26')).toBeVisible();
        await expect(page.locator('#page-25')).not.toBeVisible();

        await page.click('#tab-cmp');
        await expect(page.locator('#page-cmp')).toBeVisible();

        await page.click('#tab-mgmt');
        await expect(page.locator('#page-mgmt')).toBeVisible();

        await page.click('#tab-25');
        await expect(page.locator('#page-25')).toBeVisible();
    });
});

// ── Page 25 ───────────────────────────────────────────────────────────────────

test.describe('Page 25 — Guides 2025', () => {
    test('renders guide cards and charts', async ({ page }) => {
        await load(page);
        await expect(page.locator('#page-25 .guide-card').first()).toBeVisible();
        await hasChart(page, 'cityChart-25');
        await hasChart(page, 'avgFreePaxChart-25');
    });

    test('city filter shows only cards from selected city', async ({ page }) => {
        await load(page);
        await page.selectOption('#city-filter-25', 'Zagreb');
        const cards = await page.locator('#page-25 .guide-card').all();
        expect(cards.length).toBeGreaterThan(0);
        for (const card of cards) {
            await expect(card).toHaveAttribute('data-city', 'Zagreb');
        }
    });

    test('language filter updates cards', async ({ page }) => {
        await load(page);
        await page.selectOption('#lang-filter-25', 'eng');
        await expect(page.locator('#page-25 .guide-card').first()).toBeVisible();
    });

    test('month filter runs without error', async ({ page }) => {
        await load(page);
        await page.selectOption('#month-filter-25', '3');
        await expect(page.locator('#page-25')).toBeVisible();
        await page.selectOption('#month-filter-25', 'all');
        await expect(page.locator('#page-25 .guide-card').first()).toBeVisible();
    });
});

// ── Page 26 ───────────────────────────────────────────────────────────────────

test.describe('Page 26 — Guides 2026', () => {
    test('renders guide cards and charts', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForFunction(() => (document.getElementById('page-26')?.children.length ?? 0) > 0);

        await expect(page.locator('#page-26 .guide-card').first()).toBeVisible();
        await hasChart(page, 'cityChart-26');
        await hasChart(page, 'avgFreePaxChart-26');
    });

    test('city filter shows only cards from selected city', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForFunction(() => document.getElementById('city-filter-26'));
        await page.selectOption('#city-filter-26', 'Zagreb');
        const cards = await page.locator('#page-26 .guide-card').all();
        expect(cards.length).toBeGreaterThan(0);
        for (const card of cards) {
            await expect(card).toHaveAttribute('data-city', 'Zagreb');
        }
    });

    test('date picker triggers re-render', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForFunction(() => (document.getElementById('page-26')?.children.length ?? 0) > 0);
        await page.fill('#cutoff-picker', '2026-03-15');
        await page.dispatchEvent('#cutoff-picker', 'change');
        await expect(page.locator('#page-26')).toBeVisible();
    });
});

// ── Comparison tab ────────────────────────────────────────────────────────────

test.describe('Comparison tab', () => {
    test('renders charts', async ({ page }) => {
        await load(page);
        await page.click('#tab-cmp');
        await page.waitForFunction(() => (document.getElementById('page-cmp')?.children.length ?? 0) > 0);

        await hasChart(page, 'cityChart-cmp');
        await hasChart(page, 'monthlyChart-cmp');
        await hasChart(page, 'paidCityChart-cmp');
    });
});

// ── Management — P&L ─────────────────────────────────────────────────────────

test.describe('Management — P&L', () => {
    async function openMgmt(page) {
        await load(page);
        await page.click('#tab-mgmt');
        await page.waitForFunction(() => {
            const el = document.getElementById('kpi-revenue');
            return el && el.textContent !== '—';
        });
    }

    test('KPIs are populated', async ({ page }) => {
        await openMgmt(page);
        const revenue = await page.locator('#kpi-revenue').textContent();
        expect(revenue).not.toBe('—');
        const gm = await page.locator('#kpi-gm').textContent();
        expect(gm).not.toBe('—');
    });

    test('charts render', async ({ page }) => {
        await openMgmt(page);
        await hasChart(page, 'waterfall-bar');
        await hasChart(page, 'month-gm-line');
        await hasChart(page, 'billing-bar');
    });

    test('city pills change KPI values', async ({ page }) => {
        await openMgmt(page);
        const allRevenue = await page.locator('#kpi-revenue').textContent();
        await page.click('.city-pill[data-city="Zagreb"]');
        await page.waitForTimeout(150);
        const zagrebRevenue = await page.locator('#kpi-revenue').textContent();
        expect(zagrebRevenue).not.toBe(allRevenue);
    });
});

// ── Management — Guides ───────────────────────────────────────────────────────

test.describe('Management — Guides tab', () => {
    async function openGuides(page) {
        await load(page);
        await page.click('#tab-mgmt');
        await page.waitForFunction(() => document.getElementById('kpi-revenue')?.textContent !== '—');
        await page.click('#tab-guides');
        await page.waitForFunction(() => (document.getElementById('guide-tbody')?.children.length ?? 0) > 0);
    }

    test('table has rows', async ({ page }) => {
        await openGuides(page);
        const rows = await page.locator('#guide-tbody tr').count();
        expect(rows).toBeGreaterThan(0);
    });

    test('sort headers re-order rows without error', async ({ page }) => {
        await openGuides(page);
        const rowsBefore = await page.locator('#guide-tbody tr').count();
        await page.click('.sort-hdr[data-col="freeTours"]');
        await page.waitForTimeout(100);
        await page.click('.sort-hdr[data-col="revenue"]');
        await page.waitForTimeout(100);
        const rowsAfter = await page.locator('#guide-tbody tr').count();
        expect(rowsAfter).toBe(rowsBefore);
    });

    test('city filter reduces rows', async ({ page }) => {
        await openGuides(page);
        const allRows = await page.locator('#guide-tbody tr').count();
        await page.locator('#mgmt-guides .city-pill[data-city="Zagreb"]').click();
        await page.waitForTimeout(100);
        const filteredRows = await page.locator('#guide-tbody tr').count();
        expect(filteredRows).toBeGreaterThan(0);
        expect(filteredRows).toBeLessThan(allRows);
    });
});

// ── Management — Channels, Ops, Cities ───────────────────────────────────────

test.describe('Management — Channels / Ops / Cities', () => {
    test.beforeEach(async ({ page }) => {
        await load(page);
        await page.click('#tab-mgmt');
        await page.waitForFunction(() => document.getElementById('kpi-revenue')?.textContent !== '—');
    });

    test('Channels tab loads with charts', async ({ page }) => {
        await page.click('#tab-channels');
        await page.waitForFunction(() => document.getElementById('mgmt-channels')?.classList.contains('active'));
        await hasChart(page, 'commission-wfall');
        await hasChart(page, 'direct-ota-line');
    });

    test('Ops tab loads with charts', async ({ page }) => {
        await page.click('#tab-ops');
        await page.waitForFunction(() => document.getElementById('mgmt-ops')?.classList.contains('active'));
        await hasChart(page, 'dow-bar');
        await hasChart(page, 'season-bar');
        await hasChart(page, 'paxband-bar');
    });

    test('Cities tab loads with city cards', async ({ page }) => {
        await page.click('#tab-cities');
        await page.waitForFunction(() => (document.getElementById('city-cards-container')?.children.length ?? 0) > 0);
        const cards = await page.locator('#city-cards-container > *').count();
        expect(cards).toBeGreaterThan(0);
    });
});

// ── Theme toggle ──────────────────────────────────────────────────────────────

test.describe('Theme toggle', () => {
    test('toggles dark-mode class on body', async ({ page }) => {
        await load(page);
        const before = await page.evaluate(() => document.body.classList.contains('dark-mode'));
        await page.click('#theme-toggle');
        const after = await page.evaluate(() => document.body.classList.contains('dark-mode'));
        expect(after).toBe(!before);

        await page.click('#theme-toggle');
        const restored = await page.evaluate(() => document.body.classList.contains('dark-mode'));
        expect(restored).toBe(before);
    });
});

// ── Language toggle ───────────────────────────────────────────────────────────

test.describe('Language toggle', () => {
    test('switches nav text EN ↔ HR', async ({ page }) => {
        await load(page);
        await expect(page.locator('#tab-25')).toHaveText('Guides 2025');

        await page.click('#language-toggle');
        await page.waitForFunction(() => document.getElementById('tab-25')?.textContent === 'Vodiči 2025');
        await expect(page.locator('#tab-25')).toHaveText('Vodiči 2025');

        await page.click('#language-toggle');
        await page.waitForFunction(() => document.getElementById('tab-25')?.textContent === 'Guides 2025');
        await expect(page.locator('#tab-25')).toHaveText('Guides 2025');
    });
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

test.describe('Keyboard shortcuts', () => {
    test('1–4 switch main tabs', async ({ page }) => {
        await load(page);

        await page.keyboard.press('2');
        await expect(page.locator('#page-26')).toBeVisible();

        await page.keyboard.press('3');
        await expect(page.locator('#page-cmp')).toBeVisible();

        await page.keyboard.press('4');
        await expect(page.locator('#page-mgmt')).toBeVisible();

        await page.keyboard.press('1');
        await expect(page.locator('#page-25')).toBeVisible();
    });

    test('t toggles dark mode', async ({ page }) => {
        await load(page);
        const before = await page.evaluate(() => document.body.classList.contains('dark-mode'));
        await page.keyboard.press('t');
        const after = await page.evaluate(() => document.body.classList.contains('dark-mode'));
        expect(after).toBe(!before);
    });

    test('? opens overlay, Escape closes it', async ({ page }) => {
        await load(page);
        await page.keyboard.press('?');
        await page.waitForFunction(() => document.getElementById('shortcut-overlay')?.style.display === 'block');
        const open = await page.evaluate(() => document.getElementById('shortcut-overlay')?.style.display);
        expect(open).toBe('block');

        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.getElementById('shortcut-overlay')?.style.display !== 'block');
        const closed = await page.evaluate(() => document.getElementById('shortcut-overlay')?.style.display);
        expect(closed).not.toBe('block');
    });

    test('d focuses the date picker', async ({ page }) => {
        await load(page);
        await page.keyboard.press('d');
        const focused = await page.evaluate(() => document.activeElement?.id);
        expect(focused).toBe('cutoff-picker');
    });
});
