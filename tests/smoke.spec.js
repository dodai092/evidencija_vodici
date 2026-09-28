const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.resolve(__dirname, '..', 'index.html')}`;

// Open the app and wait for the default tab (Comparison) to inject its content
async function load(page) {
    await page.goto(FILE_URL);
    await page.waitForLoadState('load');
    await page.waitForFunction(() => (document.getElementById('page-cmp')?.children.length ?? 0) > 0);
}

// Switch to the Page 25 tab and wait for it to lazy-init
async function openPage25(page) {
    await page.click('#tab-25');
    await page.waitForFunction(() => (document.getElementById('page-25')?.children.length ?? 0) > 0);
}

// Assert a Chart.js canvas has been drawn (Chart.js sets canvas.width > 0)
async function hasChart(page, canvasId) {
    const w = await page.evaluate(id => document.getElementById(id)?.width ?? 0, canvasId);
    expect(w, `canvas#${canvasId} should have width > 0`).toBeGreaterThan(0);
}

// ── Tab navigation ────────────────────────────────────────────────────────────

test.describe('Tab navigation', () => {
    test('all 5 main tabs switch pages', async ({ page }) => {
        await load(page);

        await expect(page.locator('#page-cmp')).toBeVisible();
        await expect(page.locator('#page-26')).not.toBeVisible();

        await page.click('#tab-26');
        await expect(page.locator('#page-26')).toBeVisible();
        await expect(page.locator('#page-cmp')).not.toBeVisible();

        await page.click('#tab-cmp');
        await expect(page.locator('#page-cmp')).toBeVisible();

        await page.click('#tab-gd');
        await expect(page.locator('#page-gd')).toBeVisible();

        await page.click('#tab-mgmt');
        await expect(page.locator('#page-mgmt')).toBeVisible();

        await page.click('#tab-25');
        await expect(page.locator('#page-25')).toBeVisible();
    });
});

// ── Page 25 ───────────────────────────────────────────────────────────────────

test.describe('Page 25 — Guides 2025', () => {
    test('renders charts', async ({ page }) => {
        await load(page);
        await openPage25(page);
        await hasChart(page, 'cityChart-25');
        await hasChart(page, 'avgFreePaxChart-25');
    });

    test('city filter changes the KPIs', async ({ page }) => {
        await load(page);
        await openPage25(page);
        const allTours = await page.locator('#kv-free-tours-25').textContent();
        await page.click('#page-25 .city-filter-pill[data-city="Zagreb"]');
        await expect(page.locator('#kv-free-tours-25')).not.toHaveText(allTours);
    });

    test('language filter re-renders charts', async ({ page }) => {
        await load(page);
        await openPage25(page);
        await page.selectOption('#lang-filter-25', 'eng');
        await hasChart(page, 'cityChart-25');
    });

    test('month filter runs without error', async ({ page }) => {
        await load(page);
        await openPage25(page);
        await page.selectOption('#month-filter-25', '3');
        await expect(page.locator('#page-25')).toBeVisible();
        await page.selectOption('#month-filter-25', 'all');
        await hasChart(page, 'cityChart-25');
    });
});

// ── Page 26 ───────────────────────────────────────────────────────────────────

test.describe('Page 26 — Guides 2026', () => {
    test('renders charts', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForFunction(() => (document.getElementById('page-26')?.children.length ?? 0) > 0);

        await hasChart(page, 'cityChart-26');
        await hasChart(page, 'avgFreePaxChart-26');
    });

    test('city filter changes the KPIs', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForFunction(() => (document.getElementById('page-26')?.children.length ?? 0) > 0);
        const allTours = await page.locator('#kv-free-tours-26').textContent();
        await page.click('#page-26 .city-filter-pill[data-city="Zagreb"]');
        await expect(page.locator('#kv-free-tours-26')).not.toHaveText(allTours);
    });

    test('date picker triggers re-render', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForFunction(() => (document.getElementById('page-26')?.children.length ?? 0) > 0);
        await page.fill('#cutoff-picker', '2026-03-15');
        await page.dispatchEvent('#cutoff-picker', 'change');
        await expect(page.locator('#page-26')).toBeVisible();
    });

    test('date picker defaults to the latest data day, not a stale hardcoded date', async ({ page }) => {
        await load(page);
        const value = await page.locator('#cutoff-picker').inputValue();
        expect(value).not.toBe('2026-05-06');
        expect(value).not.toBe('');
        expect(new Date(value).getTime()).toBeLessThanOrEqual(Date.now());
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

    test('no longer has a guides section', async ({ page }) => {
        await load(page);
        await expect(page.locator('#page-cmp .guide-card')).toHaveCount(0);
    });
});

test.describe('Page layout after removing guide sections', () => {
    for (const [tab, page_] of [['#tab-25', '#page-25'], ['#tab-26', '#page-26'], ['#tab-cmp', '#page-cmp']]) {
        test(`${page_} keeps one .main wrapper and no guide cards`, async ({ page }) => {
            await load(page);
            await page.click(tab);
            await page.waitForFunction(sel => (document.querySelector(sel)?.children.length ?? 0) > 0, page_);
            await expect(page.locator(`${page_} > .main`)).toHaveCount(1);
            await expect(page.locator(`${page_} .guide-card`)).toHaveCount(0);
            // the last chart-bearing block must still be inside .main
            const inside = await page.evaluate(sel => {
                const main = document.querySelector(sel + ' > .main');
                return main.querySelectorAll('canvas').length > 0 && main.nextElementSibling === null;
            }, page_);
            expect(inside).toBe(true);
        });
    }
});

// ── Management — P&L ─────────────────────────────────────────────────────────

test.describe('Management — P&L', () => {
    async function openMgmt(page) {
        await load(page);
        await page.click('#tab-mgmt');
        // kpi-gm is the slowest of the staggered count-up KPIs (240ms delay) — wait for it
        // specifically rather than kpi-revenue (0ms delay), or later reads race the animation.
        await page.waitForFunction(() => {
            const el = document.getElementById('kpi-gm');
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
        await page.click('.sort-hdr[data-col="paidTours"]');
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
        await hasChart(page, 'paxband-bar');
        await hasChart(page, 'guide-paxband-gm');
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

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

test.describe('Keyboard shortcuts', () => {
    test('1–5 switch main tabs', async ({ page }) => {
        await load(page);

        await page.keyboard.press('2');
        await expect(page.locator('#page-26')).toBeVisible();

        await page.keyboard.press('3');
        await expect(page.locator('#page-cmp')).toBeVisible();

        await page.keyboard.press('4');
        await expect(page.locator('#page-gd')).toBeVisible();

        await page.keyboard.press('5');
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

// ── Guides tab ────────────────────────────────────────────────────────────────

async function openGuideTab(page) {
    await load(page);
    await page.click('#tab-gd');
    await page.waitForFunction(() => document.querySelectorAll('#guide-sections-gd .guide-card').length > 0);
}

test.describe('Guides tab', () => {
    test('renders cards with a Total T row', async ({ page }) => {
        await openGuideTab(page);
        await expect(page.locator('#guide-sections-gd .guide-card').first().locator('.gc-cmp-table tr')).toHaveCount(5);
    });

    test('city filter shows only cards from the selected city', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#page-gd .city-filter-pill[data-city="Zagreb"]');
        const cards = await page.locator('#guide-sections-gd .guide-card').all();
        expect(cards.length).toBeGreaterThan(0);
        for (const card of cards) await expect(card).toHaveAttribute('data-city', 'Zagreb');
    });

    test('language and month filters re-render without error', async ({ page }) => {
        await openGuideTab(page);
        await page.selectOption('#lang-filter-gd', 'eng');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
        await page.selectOption('#month-filter-gd', '1');
        await page.selectOption('#month-filter-gd', 'all');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
    });

    test('search narrows cards and shows an empty state', async ({ page }) => {
        await openGuideTab(page);
        const cards = page.locator('#guide-sections-gd .guide-card');
        const before = await cards.count();
        expect(before).toBeGreaterThan(1);
        const firstName = await cards.first().locator('.gc-name').innerText();
        await page.fill('#guide-search-gd', firstName);
        const after = await cards.count();
        expect(after).toBeGreaterThan(0);
        expect(after).toBeLessThan(before);
        await page.fill('#guide-search-gd', '(zzzz-no-such-guide');
        await expect(page.locator('#guide-sections-gd .guide-empty')).toBeVisible();
    });

    test('sort chips rank cards by pax change', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-sort-pills-gd .pill[data-value="gain"]');
        await expect(page.locator('#guide-sections-gd .guide-card .gc-rank').first()).toHaveText('#1');
        await page.click('#guide-sort-pills-gd .pill[data-value="default"]');
        await expect(page.locator('#guide-sections-gd .gc-rank')).toHaveCount(0);
    });

    test('date picker change re-renders the tab', async ({ page }) => {
        await openGuideTab(page);
        await page.fill('#cutoff-picker', '2026-03-15');
        await page.dispatchEvent('#cutoff-picker', 'change');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
        await expect(page.locator('#month-filter-gd')).toHaveValue('all');
    });

    test('table view TOTAL equals the sum of guide rows', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        await expect(page.locator('#guide-table-gd')).toBeVisible();
        const r = await page.evaluate(() => {
            const rows = [...document.querySelectorAll('#guide-table-gd tbody tr:not(.mpax-total)')];
            const total = document.querySelector('#guide-table-gd tbody tr.mpax-total');
            const num = td => parseInt(td.textContent.replace(/[^\d]/g, ''), 10) || 0;
            // cells: 0 name, then per metric 4 cells ('25, '26, +/-, %). Column 1 = Free Tours '25, 2 = '26.
            const sum = i => rows.reduce((s, row) => s + num(row.children[i]), 0);
            return { rows: rows.length, s25: sum(1), t25: num(total.children[1]), s26: sum(2), t26: num(total.children[2]) };
        });
        expect(r.rows).toBeGreaterThan(1);
        expect(r.s25).toBe(r.t25);
        expect(r.s26).toBe(r.t26);
    });

    test('table TOTAL ignores the search filter', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        const totalBefore = await page.locator('#guide-table-gd tr.mpax-total').innerText();
        await page.fill('#guide-search-gd', '(zzzz-no-such-guide');
        await expect(page.locator('#guide-sections-gd .guide-empty')).toBeVisible();
        await page.fill('#guide-search-gd', '');
        expect(await page.locator('#guide-table-gd tr.mpax-total').innerText()).toBe(totalBefore);
    });

    test('switching back to cards restores the cards', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        await page.click('#guide-view-cards-gd');
        await expect(page.locator('#guide-sections-gd .guide-card').first()).toBeVisible();
    });

    test('table group headers are readable in light and dark mode', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        const contrast = () => page.evaluate(() => {
            const el = document.querySelector('#guide-table-gd thead tr:first-child th.mpax-city-head');
            const cs = getComputedStyle(el);
            return { bg: cs.backgroundColor, fg: cs.color };
        });
        for (const dark of [false, true]) {
            await page.evaluate(d => document.body.classList.toggle('dark-mode', d), dark);
            const { bg, fg } = await contrast();
            expect(bg, 'header needs its own background').not.toBe('rgba(0, 0, 0, 0)');
            expect(bg, 'header text must differ from its background').not.toBe(fg);
        }
    });

    test('table rows show the guide city', async ({ page }) => {
        await openGuideTab(page);
        await page.click('#guide-view-table-gd');
        await expect(page.locator('#guide-table-gd tbody tr').first().locator('.gd-city')).toBeVisible();
    });

    test('card click opens the detail modal with a chart, Escape closes it', async ({ page }) => {
        await openGuideTab(page);
        const card = page.locator('#guide-sections-gd .guide-card').first();
        const name = await card.locator('.gc-name').innerText();
        await card.click();
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
        await expect(page.locator('#guide-detail-name-gd')).toHaveText(name);
        await hasChart(page, 'guideTrendChart-gd');
        await page.keyboard.press('Escape');
        await expect(page.locator('#guide-detail-modal-gd')).not.toBeVisible();
    });

    test('keyboard: Enter on a focused card opens the modal, close button returns focus', async ({ page }) => {
        await openGuideTab(page);
        const card = page.locator('#guide-sections-gd .guide-card').first();
        await card.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
        await page.click('#guide-detail-close-gd');
        await expect(page.locator('#guide-detail-modal-gd')).not.toBeVisible();
        await expect(card).toBeFocused();
    });

    test('modal still opens after a filter change re-renders the cards', async ({ page }) => {
        await openGuideTab(page);
        await page.selectOption('#lang-filter-gd', 'eng');
        await page.locator('#guide-sections-gd .guide-card').first().click();
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
    });

    test('modal shows the tour-type mix and a monthly table with a total row', async ({ page }) => {
        await openGuideTab(page);
        await page.locator('#guide-sections-gd .guide-card').first().click();
        await expect(page.locator('#guide-detail-months-gd table')).toBeVisible();
        await expect(page.locator('#guide-detail-months-gd tr.mpax-total')).toBeVisible();
        expect(await page.locator('#guide-detail-types-gd .type-bar-row').count()).toBeGreaterThan(0);
    });

    test('modal 2026 free tours total equals the card value', async ({ page }) => {
        await openGuideTab(page);
        const card = page.locator('#guide-sections-gd .guide-card').first();
        const cardValue = parseInt(await card.locator('.gc-cmp-table tr').first().locator('.v26').innerText(), 10);
        expect(Number.isNaN(cardValue)).toBe(false);
        await card.click();
        // total row cells: 0 label, 1-4 = 2025 (free t, free p, paid t, paid p), 5-8 = 2026. Cell 5 = 2026 free tours.
        const modalValue = await page.evaluate(() => {
            const cells = document.querySelector('#guide-detail-months-gd tr.mpax-total').children;
            return parseInt(cells[5].textContent.replace(/[^\d]/g, ''), 10);
        });
        expect(modalValue).toBe(cardValue);
    });

    test('jumpToGuide switches to the tab, clears filters and highlights the card', async ({ page }) => {
        await openGuideTab(page);
        const name = await page.locator('#guide-sections-gd .guide-card .gc-name').first().innerText();
        await page.click('#tab-cmp');
        await page.evaluate(n => window.PageGuides.jumpToGuide(n), name);
        await expect(page.locator('#page-gd')).toBeVisible();
        await expect(page.locator('#guide-search-gd')).toHaveValue('');
        await expect(page.locator('#guide-sections-gd .guide-card', { hasText: name }).first()).toBeVisible();
    });

    test('modal stays inside the viewport when the page is scrolled', async ({ page }) => {
        await openGuideTab(page);
        const cards = page.locator('#guide-sections-gd .guide-card');
        await cards.nth(8).scrollIntoViewIfNeeded();
        await cards.nth(8).click();
        const box = await page.locator('#guide-detail-modal-gd').boundingBox();
        const vh = page.viewportSize().height;
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(vh);
    });

    test('chart text colour follows dark mode', async ({ page }) => {
        await openGuideTab(page);
        await page.evaluate(() => document.body.classList.add('dark-mode'));
        await page.locator('#guide-sections-gd .guide-card').first().click();
        const legend = await page.evaluate(() => window.PageGuides.guideTrendChartInstance.options.plugins.legend.labels.color);
        const bodyText = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--text').trim());
        expect(legend).toBe(bodyText);
    });

    test('switching tab with a number key closes the modal', async ({ page }) => {
        await openGuideTab(page);
        await page.locator('#guide-sections-gd .guide-card').first().click();
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
        await page.keyboard.press('1');
        await expect(page.locator('#page-25')).toBeVisible();
        await expect(page.locator('#guide-detail-modal-gd')).not.toBeVisible();
    });

    test('Management guide name link jumps to the Guides tab', async ({ page }) => {
        await load(page);
        await page.click('#tab-mgmt');
        await page.waitForFunction(() => document.getElementById('kpi-revenue')?.textContent !== '\u2014');
        await page.click('#tab-guides');
        await page.waitForFunction(() => (document.getElementById('guide-tbody')?.children.length ?? 0) > 0);
        const link = page.locator('#guide-tbody .guide-name-link').first();
        const name = (await link.innerText()).trim();
        await link.click();
        await expect(page.locator('#page-gd')).toBeVisible();
        await expect(page.locator('#guide-sections-gd .guide-card', { hasText: name }).first()).toBeVisible();
    });
});

// ── Jura theme ────────────────────────────────────────────────────────────────

function parseCssColor(s) {
    let m = s.match(/^rgba?\(([^)]+)\)/);
    if (m) {
        const [r, g, b] = m[1].split(/[ ,/]+/).map(Number);
        return [r, g, b];
    }
    m = s.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
    if (m) return [m[1], m[2], m[3]].map(x => Math.round(parseFloat(x) * 255));
    throw new Error(`unparsed color: ${s}`);
}
function luminance([r, g, b]) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}
const cssVar = (page, name) => page.evaluate(n => getComputedStyle(document.body).getPropertyValue(n).trim(), name);
// body and cards animate color changes for 0.3s; switch that off so computed styles are final on read
const setDark = (page, on) => page.evaluate(d => {
    if (!document.getElementById('no-transitions')) {
        const st = document.createElement('style');
        st.id = 'no-transitions';
        st.textContent = '*, *::before, *::after { transition: none !important; }';
        document.head.appendChild(st);
    }
    document.body.classList.toggle('dark-mode', d);
}, on);
const styleOf = (page, sel, prop) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);

test.describe('Jura theme: foundation', () => {
    test('theme stylesheet loads after every other stylesheet', async ({ page }) => {
        await load(page);
        const hrefs = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href')));
        expect(hrefs[hrefs.length - 1]).toBe('jura-theme.css');
        expect(hrefs.some(h => h.includes('IBM+Plex+Sans'))).toBe(true);
    });

    test('light tokens: Plex font, Jura surface, text, radius and city hues', async ({ page }) => {
        await load(page);
        expect(await styleOf(page, 'body', 'fontFamily')).toContain('IBM Plex Sans');
        expect(await styleOf(page, 'body', 'backgroundColor')).toBe('rgb(255, 255, 255)');
        expect(await styleOf(page, 'body', 'color')).toBe('rgb(26, 26, 26)');
        expect(await cssVar(page, '--radius')).toBe('4px');
        expect([await cssVar(page, '--zagreb'), await cssVar(page, '--dubrovnik'), await cssVar(page, '--split'), await cssVar(page, '--zadar')])
            .toEqual(['#2a78d6', '#eb6834', '#1baf7a', '#eda100']);
        expect([await cssVar(page, '--y25'), await cssVar(page, '--y26')]).toEqual(['#4a3aa7', '#1a1a1a']);
    });

    test('dark tokens: Jura dark surface and text', async ({ page }) => {
        await load(page);
        await setDark(page, true);
        expect(await styleOf(page, 'body', 'backgroundColor')).toBe('rgb(18, 18, 18)');
        expect(await styleOf(page, 'body', 'color')).toBe('rgb(240, 240, 240)');
        expect(await styleOf(page, '.nav', 'backgroundColor')).toBe('rgb(18, 18, 18)');
        expect([await cssVar(page, '--y25'), await cssVar(page, '--y26')]).toEqual(['#7b6df0', '#f0f0f0']);
    });

    test('nav height equals --nav-h so sticky offsets line up', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        const navHeight = await page.locator('.nav').evaluate(el => el.getBoundingClientRect().height);
        expect(navHeight).toBe(parseFloat(await cssVar(page, '--nav-h')));
    });

    test('year line colors have 3:1 contrast against the page in both themes', async ({ page }) => {
        await load(page);
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const bg = parseCssColor(await styleOf(page, 'body', 'backgroundColor'));
            for (const v of ['--y25', '--y26']) {
                const hex = await cssVar(page, v);
                const rgbv = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
                expect(contrastRatio(rgbv, bg), `${v} on ${dark ? 'dark' : 'light'}`).toBeGreaterThanOrEqual(3);
            }
        }
    });
});

test.describe('Jura theme: chrome', () => {
    test('active main tab is underlined in the text color, no uppercase', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        expect(await styleOf(page, '#tab-cmp', 'textTransform')).toBe('none');
        expect(await styleOf(page, '#tab-cmp', 'borderBottomColor')).toBe(await styleOf(page, 'body', 'color'));
        expect(await styleOf(page, '#tab-cmp', 'fontFamily')).toContain('IBM Plex Sans');
    });

    test('Management sub-tabs use the same plain tab style', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        await page.click('#tab-mgmt');
        expect(await styleOf(page, '#tab-pl', 'textTransform')).toBe('none');
        expect(await styleOf(page, '#tab-pl', 'borderBottomColor')).toBe(await styleOf(page, 'body', 'color'));
    });

    test('print button is outlined and plain', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        expect(await styleOf(page, '.print-btn', 'textTransform')).toBe('none');
        expect(await styleOf(page, '.print-btn', 'backgroundColor')).toBe('rgba(0, 0, 0, 0)');
    });

    test('page header is a compact title row without the badge', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#page-gd .header h1');
        expect(await styleOf(page, '#page-gd .header h1', 'fontSize')).toBe('20px');
        expect(await styleOf(page, '#page-gd .header h1', 'fontFamily')).toContain('IBM Plex Sans');
        expect(await styleOf(page, '#page-gd .header-badge', 'display')).toBe('none');
    });

    test('filter chips and selects use 4px corners', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#page-gd .city-filter-pill');
        expect(await styleOf(page, '#page-gd .city-filter-pill', 'borderRadius')).toBe('4px');
        expect(await styleOf(page, '#page-gd .pill', 'borderRadius')).toBe('4px');
        expect(await styleOf(page, '#lang-filter-gd', 'borderRadius')).toBe('4px');
        expect(await styleOf(page, '#page-gd .city-filter-pill', 'fontFamily')).toContain('IBM Plex Sans');
        expect(await styleOf(page, '#page-gd .pill', 'fontFamily')).toContain('IBM Plex Sans');
    });

    test('active city chip text has 4.5:1 contrast on its tint, light and dark', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.click('#page-gd .city-filter-pill[data-city="Zagreb"]');
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const sel = '#page-gd .city-filter-pill.active';
            const fg = parseCssColor(await styleOf(page, sel, 'color'));
            const bg = parseCssColor(await styleOf(page, sel, 'backgroundColor'));
            expect(contrastRatio(fg, bg), dark ? 'dark' : 'light').toBeGreaterThanOrEqual(4.5);
        }
    });

    test('phone layout keeps its bottom tab bar and 16px padding', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await load(page);
        expect(await styleOf(page, '.nav-tabs', 'position')).toBe('fixed');
        expect(await cssVar(page, '--pad')).toBe('16px');
    });

    test('all 5 bottom tabs stay within the 390px viewport', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await load(page);
        const rights = await page.$$eval('.nav-tab', els => els.slice(0, 5).map(el => el.getBoundingClientRect().right));
        for (const right of rights) {
            expect(right).toBeLessThanOrEqual(390);
        }
    });

    test('Comparison KPI headline numbers shrink on mobile like Tours 25/26 do', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await load(page);
        expect(await styleOf(page, '#kd-free-abs-cmp', 'fontSize')).toBe('26px');
        expect(await styleOf(page, '#kd-free-pct-cmp', 'fontSize')).toBe('18px');
        const cardRight = await page.locator('#kd-free-abs-cmp').evaluate(el => el.closest('.kpi').getBoundingClientRect().right);
        const pctRight = await page.locator('#kd-free-pct-cmp').evaluate(el => el.getBoundingClientRect().right);
        expect(pctRight).toBeLessThanOrEqual(cardRight);
    });

    test('no horizontal page overflow at 390px on Tours 2025/2026 and Comparison', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await load(page);
        for (const tab of ['#tab-25', '#tab-26', '#tab-cmp']) {
            await page.click(tab);
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
            expect(scrollWidth, tab).toBeLessThanOrEqual(390);
        }
    });
});

test.describe('Jura theme: cards', () => {
    test('KPI cards are flat with a plain 26px sans value', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForSelector('#page-26 .kpi.hl-green');
        expect(await styleOf(page, '#page-26 .kpi.hl-green', 'borderTopWidth')).toBe('1px');
        expect(await styleOf(page, '#page-26 .kpi-2y-val', 'fontSize')).toBe('26px');
        expect(await styleOf(page, '#page-26 .kpi-2y-val', 'fontFamily')).toContain('IBM Plex Sans');
        expect(await styleOf(page, '#page-cmp .kpi-delta-abs', 'fontSize')).toBe('26px');
    });

    test('chart cards have no shadow, also on hover', async ({ page }) => {
        await load(page);
        await page.locator('#page-cmp .chart-card').first().hover();
        expect(await styleOf(page, '#page-cmp .chart-card', 'boxShadow')).toBe('none');
    });

    test('guide cards drop the stripe, take a city tint and 4px corners', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-sections-gd .guide-card[data-city="Zagreb"]');
        const card = '#guide-sections-gd .guide-card[data-city="Zagreb"]';
        expect(await styleOf(page, `${card} .gc-stripe`, 'display')).toBe('none');
        expect(await styleOf(page, card, 'borderRadius')).toBe('4px');
        expect(await styleOf(page, card, 'backgroundColor')).not.toBe(await styleOf(page, 'body', 'backgroundColor'));
        expect(await styleOf(page, `${card} .avatar`, 'borderRadius')).toBe('4px');
    });

    test('guide card name and text stay readable on the tint in both themes', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-sections-gd .guide-card[data-city="Split"]');
        const card = '#guide-sections-gd .guide-card[data-city="Split"]';
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const fg = parseCssColor(await styleOf(page, `${card} .gc-name`, 'color'));
            const bg = parseCssColor(await styleOf(page, card, 'backgroundColor'));
            expect(contrastRatio(fg, bg), dark ? 'dark' : 'light').toBeGreaterThanOrEqual(4.5);
        }
    });

    test('movers banner lines are boxed and use the delta colors', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-flags-gd .guide-flag-line.neg');
        expect(await styleOf(page, '#guide-flags-gd .guide-flag-line', 'backgroundColor')).not.toBe('rgba(0, 0, 0, 0)');
        expect(await styleOf(page, '#guide-flags-gd .guide-flag-line.neg', 'color')).toBe('rgb(212, 84, 90)');
    });

    test('detail modal is flat with 4px corners and a hairline border', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.locator('#guide-sections-gd .guide-card').first().click();
        await expect(page.locator('#guide-detail-modal-gd')).toBeVisible();
        expect(await styleOf(page, '#guide-detail-modal-gd', 'borderRadius')).toBe('4px');
        expect(await styleOf(page, '#guide-detail-modal-gd', 'borderTopWidth')).toBe('1px');
    });
});

test.describe('Jura theme: tables', () => {
    test('monthly table is flat: hairline row borders, 2px total row, 13px', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForSelector('#page-26 .mpax-table tr.mpax-total');
        expect(await styleOf(page, '#page-26 .mpax-table', 'fontSize')).toBe('13px');
        expect(await styleOf(page, '#page-26 .mpax-table td', 'borderLeftWidth')).toBe('0px');
        expect(await styleOf(page, '#page-26 .mpax-table tr.mpax-total td', 'borderTopWidth')).toBe('2px');
        expect(await styleOf(page, '#page-26 .mpax-table', 'fontFamily')).toContain('IBM Plex Sans');
    });

    test('city head cells keep 4.5:1 text contrast on their tint, light and dark', async ({ page }) => {
        await load(page);
        await page.click('#tab-26');
        await page.waitForSelector('#page-26 .mpax-city-head.zagreb');
        for (const city of ['zagreb', 'dubrovnik', 'split', 'zadar']) {
            for (const dark of [false, true]) {
                await setDark(page, dark);
                const sel = `#page-26 .mpax-city-head.${city}`;
                const fg = parseCssColor(await styleOf(page, sel, 'color'));
                const bg = parseCssColor(await styleOf(page, sel, 'backgroundColor'));
                expect(contrastRatio(fg, bg), `${city} ${dark ? 'dark' : 'light'}`).toBeGreaterThanOrEqual(4.5);
            }
        }
    });

    test('Guides table group heads stay readable after the retheme', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.click('#guide-view-table-gd');
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const sel = '#guide-table-gd thead tr:first-child th.mpax-city-head';
            const fg = parseCssColor(await styleOf(page, sel, 'color'));
            const bg = parseCssColor(await styleOf(page, sel, 'backgroundColor'));
            expect(contrastRatio(fg, bg), dark ? 'dark' : 'light').toBeGreaterThanOrEqual(4.5);
        }
    });
});

test.describe('Jura theme: charts', () => {
    test('comparison charts use the Plex font and the new year colors', async ({ page }) => {
        await load(page);
        await page.waitForFunction(() => window.Chart && Chart.getChart('cityChart-cmp'));
        const r = await page.evaluate(() => {
            const chart = Chart.getChart('monthlyChart-cmp');
            const cs = getComputedStyle(document.body);
            return {
                legendFont: chart.options.plugins.legend.labels.font.family,
                line25: chart.data.datasets[0].borderColor,
                line26: chart.data.datasets[1].borderColor,
                y25: cs.getPropertyValue('--y25').trim(),
                y26: cs.getPropertyValue('--y26').trim(),
            };
        });
        expect(r.legendFont).toContain('IBM Plex Sans');
        expect(r.line25).toBe(r.y25);
        expect(r.line26).toBe(r.y26);
    });

    test('charts built in dark mode read the dark year colors', async ({ page }) => {
        await load(page);
        await page.waitForFunction(() => window.Chart && Chart.getChart('monthlyChart-cmp'));
        await page.evaluate(() => {
            document.body.classList.add('dark-mode');
            window.PageCmp.renderAll();
        });
        await page.waitForFunction(
            () => Chart.getChart('monthlyChart-cmp')?.data.datasets[1].borderColor === '#f0f0f0',
            null, { timeout: 5000 });
    });

    test('hovering a two-year chart shows both years and the change in the tooltip footer', async ({ page }) => {
        await load(page);
        await page.waitForFunction(() => window.Chart && Chart.getChart('cityChart-cmp'));
        const r = await page.evaluate(() => {
            const chart = Chart.getChart('cityChart-cmp');
            chart.tooltip.setActiveElements([{ datasetIndex: 0, index: 0 }, { datasetIndex: 1, index: 0 }], { x: 0, y: 0 });
            chart.update();
            return { body: chart.tooltip.body.map(b => b.lines[0]), footer: chart.tooltip.footer };
        });
        expect(r.body[0]).toContain('2025');
        expect(r.body[1]).toContain('2026');
        expect(r.footer.join(' ')).toMatch(/2026 vs 2025: [+-][\d,]+ \([+-]\d+%\)/);
    });

    test('tooltip footer color matches body text, not the white default, in both themes', async ({ page }) => {
        await load(page);
        await page.waitForFunction(() => window.Chart && Chart.getChart('cityChart-cmp'));
        for (const dark of [false, true]) {
            await setDark(page, dark);
            const colors = await page.evaluate(() => {
                const chart = Chart.getChart('cityChart-cmp');
                const t = chart.options.plugins.tooltip;
                return { footer: t.footerColor, body: t.bodyColor };
            });
            expect(colors.footer, dark ? 'dark' : 'light').toBe(colors.body);
            expect(colors.footer).not.toBe('#fff');
        }
    });
});

test.describe('Jura theme: print', () => {
    test('print hides the nav and keeps cards unbroken', async ({ page }) => {
        await load(page);
        await page.click('#tab-gd');
        await page.waitForSelector('#guide-sections-gd .guide-card');
        await page.emulateMedia({ media: 'print' });
        expect(await styleOf(page, '.nav', 'display')).toBe('none');
        expect(await styleOf(page, '#guide-sections-gd .guide-card', 'breakInside')).toBe('avoid');
    });
});

test.describe('Jura theme: theme toggle', () => {
    for (const tab of ['25', '26']) {
        test(`Tours 20${tab} charts rebuild their grid colors when the theme is toggled`, async ({ page }) => {
            await load(page);
            await page.click(`#tab-${tab}`);
            await page.waitForFunction(id => window.Chart && Chart.getChart(id), `cityChart-${tab}`);
            const grids = () => page.evaluate(t => [...document.querySelectorAll(`#page-${t} canvas`)]
                .map(c => Chart.getChart(c)).filter(Boolean)
                .flatMap(ch => Object.values(ch.options.scales || {}).map(s => s.grid?.color)).filter(Boolean), tab);
            const light = await grids();
            expect(light.length).toBeGreaterThan(0);
            await page.click('#theme-toggle');
            await page.waitForTimeout(400);
            const dark = await grids();
            expect(dark.length).toBe(light.length);
            for (const c of dark) expect(light).not.toContain(c);
        });
    }
});

test.describe('Jura theme: review fixes', () => {
    test('phone layout metrics are identical with and without the theme', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await load(page);
        await page.click('#tab-cmp');
        await page.waitForSelector('#page-cmp .kpi');
        const sels = ['.header', '.header-left h1', '.header-badge', '.main', '#page-cmp .kpi-grid', '#page-cmp .kpi',
            '#page-cmp .chart-card', '.date-picker-ui', '.print-btn', '.city-filter-pill', '.filter-select', '.theme-toggle-icon'];
        const props = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap', 'display', 'alignItems', 'fontSize', 'marginBottom'];
        const measure = () => page.evaluate(([ss, pp]) => Object.fromEntries(ss.map(s => {
            const el = document.querySelector(s); const c = el && getComputedStyle(el);
            return [s, c ? Object.fromEntries(pp.map(p => [p, c[p]])) : null];
        })), [sels, props]);
        const withTheme = await measure();
        await page.evaluate(() => document.querySelector('link[href="jura-theme.css"]').disabled = true);
        const without = await measure();
        expect(withTheme).toEqual(without);
    });

    test('toggling dark to light also clears the html flash-guard class', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await load(page);
        expect(await styleOf(page, 'body', 'backgroundColor')).toBe('rgb(18, 18, 18)');
        await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
        await page.click('#theme-toggle');
        await page.waitForFunction(() => !document.body.classList.contains('dark-mode'));
        expect(await styleOf(page, 'body', 'backgroundColor')).toBe('rgb(255, 255, 255)');
        expect(await styleOf(page, 'body', 'color')).toBe('rgb(26, 26, 26)');
    });
});
