import { CITY_COLS, CITIES } from '../../shared.js';

// ── Theme helpers ─────────────────────────────────────────────────────────────

function axisDefaults() {
    const s = getComputedStyle(document.body);
    return {
        ticks: { color: s.getPropertyValue('--text2').trim(), font: { family: 'Montserrat', size: 11 } },
        grid:  { color: s.getPropertyValue('--border').trim() },
    };
}

function tooltipDefaults() {
    const s = getComputedStyle(document.body);
    return {
        backgroundColor: s.getPropertyValue('--card-bg').trim(),
        titleColor:  s.getPropertyValue('--text').trim(),
        bodyColor:   s.getPropertyValue('--text2').trim(),
        borderColor: s.getPropertyValue('--border-dark').trim(),
        borderWidth: 1,
    };
}

function themeColors() {
    const s = getComputedStyle(document.body);
    return {
        c25: s.getPropertyValue('--y25').trim(),
        c26: s.getPropertyValue('--y26').trim(),
    };
}

// ── Chart factories ───────────────────────────────────────────────────────────
// Each factory takes a canvas context and data parameters, returns a Chart instance.

export function createFreePaxCityChart(ctx, cityLabels, cityData25, cityData26, cityDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cityLabels,
            datasets: [
                { label: `${rangeLabel} 2025`, data: cityLabels.map(c => cityData25[c]), backgroundColor: cityLabels.map(c => CITY_COLS[c] + '80'), borderRadius: 4 },
                { label: `${rangeLabel} 2026`, data: cityLabels.map(c => cityData26[c]), backgroundColor: cityLabels.map(c => CITY_COLS[c]), borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { bottom: 45, right: 55 } },
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
            }
        },
        plugins: [cityDeltaPlugin]
    });
}

export function createPaidCityChart(ctx, cityLabels, paidCityData25, paidCityData26, cityDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cityLabels,
            datasets: [
                { label: `${rangeLabel} 2025`, data: cityLabels.map(c => paidCityData25[c]), backgroundColor: cityLabels.map(c => CITY_COLS[c] + '80'), borderRadius: 4 },
                { label: `${rangeLabel} 2026`, data: cityLabels.map(c => paidCityData26[c]), backgroundColor: cityLabels.map(c => CITY_COLS[c]), borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { bottom: 45, right: 55 } },
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
            }
        },
        plugins: [cityDeltaPlugin]
    });
}

export function createMonthlyFreePaxChart(ctx, months, cumMonthData25, cumMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: `${rangeLabel} 2025`, data: cumMonthData25, borderColor: colors.y25, backgroundColor: colors.y25 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 },
                { label: `${rangeLabel} 2026`, data: cumMonthData26, borderColor: colors.y26, backgroundColor: colors.y26 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { bottom: 45, right: 55 } },
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
            }
        },
        plugins: [deltaOverlay, monthDeltaPlugin]
    });
}

export function createMonthlyPaidChart(ctx, months, cumPaidMonthData25, cumPaidMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: `${rangeLabel} 2025`, data: cumPaidMonthData25, borderColor: colors.y25, backgroundColor: colors.y25 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 },
                { label: `${rangeLabel} 2026`, data: cumPaidMonthData26, borderColor: colors.y26, backgroundColor: colors.y26 + '33', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { bottom: 45, right: 55 } },
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
            }
        },
        plugins: [deltaOverlay, monthDeltaPlugin]
    });
}

export function createCityMonthlyChart(ctx, months, datasets, colors) {
    return new Chart(ctx, {
        type: 'line',
        data: { labels: months, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: colors.text,
                        font: { size: 10, family: "'Montserrat',sans-serif" },
                        boxWidth: 12, padding: 12,
                        filter: item => !item.text.includes('2025')
                    }
                }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
            }
        }
    });
}

export function createAvgFreePaxChart(ctx, months, avgFree25, avgFree26, colors, rangeLabel) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: `${rangeLabel} 2025`, data: avgFree25, borderColor: colors.y25, backgroundColor: colors.y25 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
                { label: `${rangeLabel} 2026`, data: avgFree26, borderColor: colors.y26, backgroundColor: colors.y26 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
                tooltip: { callbacks: { label: i => `${i.dataset.label}: ${i.raw} PAX/tour` } }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
            }
        }
    });
}

export function createPaidTypeChart(ctx, months, ds25, ds26, colors, secondaryLabelPlugin, yLabel) {
    return new Chart(ctx, {
        type: 'bar',
        data: { labels: months, datasets: [ds25, ds26] },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { top: 20, bottom: 30 } },
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
                tooltip: {
                    callbacks: {
                        afterLabel: (item) => {
                            const sec = item.datasetIndex === 0
                                ? ds25._secondaryData[item.dataIndex]
                                : ds26._secondaryData[item.dataIndex];
                            return sec ? `${item.datasetIndex === 0 ? (ds25._secondaryKey || 'pax') : (ds26._secondaryKey || 'pax') === 'pax' ? 'PAX' : 'Tours'}: ${sec}` : '';
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: colors.text3, font: { size: 11 } }, grid: { color: colors.border } },
                y: { title: { display: true, text: yLabel, color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
            }
        },
        plugins: [secondaryLabelPlugin]
    });
}

export function createWarAvgChart(ctx, months, getTypeAvg25, getTypeAvg26, colors, rangeLabel) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: `${rangeLabel} 2025`, data: getTypeAvg25, borderColor: colors.y25, backgroundColor: colors.y25 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
                { label: `${rangeLabel} 2026`, data: getTypeAvg26, borderColor: colors.y26, backgroundColor: colors.y26 + '22', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
                tooltip: { callbacks: { label: i => `${i.dataset.label}: ${i.raw} PAX/tour` } }
            },
            scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
            }
        }
    });
}

// ── Color update function ─────────────────────────────────────────────────────
// Called by updateCharts() in PageCmp when theme changes.
export function updateChartColors(chartInstances) {
    const ax = axisDefaults();
    const tt = tooltipDefaults();
    chartInstances.forEach(c => {
        if (!c) return;
        if (c.options.scales) {
            Object.values(c.options.scales).forEach(sc => {
                if (sc.ticks) sc.ticks.color = ax.ticks.color;
                if (sc.grid)  sc.grid.color  = ax.grid.color;
            });
        }
        if (c.options.plugins?.tooltip) Object.assign(c.options.plugins.tooltip, tt);
        if (c.options.plugins?.legend?.labels) c.options.plugins.legend.labels.color = ax.ticks.color;
        c.update();
    });
}
