import { getGlobalDate, CITY_COLS } from '../../shared.js';
import { t } from '../../i18n.js';
import {
    fmt, fmtEur, dd, gmClass,
    get25, guidesForCity,
    filterMgmtByDate, filterStatsByDate,
} from './helpers.js';

// Sort state — scoped to this module
let _sortCol = 'grossMargin';
let _sortDir = -1;

export function initGuides(city) {
    renderGuideTable(city);
}

function _build25RankMap(city) {
    if (typeof guideStats25 === 'undefined') return {};
    const guides25 = city === 'all' ? guideStats25 : guideStats25.filter(g => g.city === city);
    const ranked = guides25
        .filter(g => g.mgmt)
        .map(g => ({ name: g.name, gm: filterMgmtByDate(g.mgmt, getGlobalDate()).grossMargin }))
        .sort((a, b) => b.gm - a.gm);
    const map = {};
    ranked.forEach((g, i) => { map[g.name] = i + 1; });
    return map;
}

export function renderGuideTable(city) {
    const guides = guidesForCity(city);
    const rank25Map = _build25RankMap(city);

    const rows = guides.map(g => {
        const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
        const sts = filterStatsByDate(g.stats.all, getGlobalDate());
        const m = fin;
        const gmPct = m.revenue > 0 ? (m.grossMargin / m.revenue * 100) : 0;
        const avgGm = sts.paidTours > 0 ? (m.grossMargin / sts.paidTours) : 0;
        const avgPax = sts.paidTours > 0 ? (sts.paidPax / sts.paidTours) : 0;
        const comm = m.commissionCost || 0;
        const commPct = m.revenue > 0 ? (comm / m.revenue * 100) : 0;

        const g25 = get25(g.name);
        const fin25 = g25?.mgmt ? filterMgmtByDate(g25.mgmt, getGlobalDate()) : null;
        const sts25 = g25 ? filterStatsByDate(g25.stats.all, getGlobalDate()) : null;
        const paid25 = sts25 ? sts25.paidTours : null;
        const rev25  = fin25 ? fin25.revenue : null;
        const gm25   = fin25 ? fin25.grossMargin : null;

        return {
            name: g.name, city: g.city,
            freeTours: sts.freeTours, paidTours: sts.paidTours,
            avgPax, revenue: m.revenue, vendorCost: m.vendorCost,
            commissionCost: comm, commPct,
            grossMargin: m.grossMargin, gmPct, avgGm,
            paid25, rev25, gm25,
            rank25: rank25Map[g.name] ?? null,
        };
    });

    rows.sort((a, b) => _sortDir * (a[_sortCol] - b[_sortCol]));

    const tbody = document.getElementById('guide-tbody');
    tbody.innerHTML = rows.map((r, i) => {
        const dPaid = r.paid25 !== null ? r.paidTours - r.paid25 : null;
        const dGm   = r.gm25   !== null ? r.grossMargin - r.gm25 : null;
        const dRev  = r.rev25  !== null ? r.revenue - r.rev25 : null;
        let rowClass = 'row-healthy';
        if (r.gmPct < 10 || (dGm !== null && dGm < -500)) rowClass = 'row-poor';
        else if (r.gmPct < 20) rowClass = 'row-warn';
        let commClass = 'neu';
        if (r.commPct > 25) commClass = 'neg';
        else if (r.commPct >= 15) commClass = 'neu';
        else commClass = 'pos';
        const rank26 = i + 1;
        const rankDelta = r.rank25 !== null ? r.rank25 - rank26 : null;
        let rankHtml = '—';
        if (rankDelta !== null && rankDelta !== 0) {
            rankHtml = `<span style="color:${rankDelta > 0 ? 'var(--green)' : 'var(--red)'}">${rankDelta > 0 ? '▲' : '▼'}${Math.abs(rankDelta)}</span>`;
        } else if (rankDelta === 0) {
            rankHtml = '=';
        }
        return `<tr class="${rowClass}">
            <td class="rank">${rank26}</td>
            <td style="text-align:center;font-size:11px">${rankHtml}</td>
            <td class="guide-name">${r.name}</td>
            <td><span class="city-dot" style="background:${CITY_COLS[r.city] || '#999'}"></span>${r.city}</td>
            <td>${fmt(r.freeTours)}</td>
            <td>${fmt(r.paidTours)}<br><small class="yoy">${dd(dPaid)}</small></td>
            <td>${r.avgPax > 0 ? r.avgPax.toFixed(1) : '—'}</td>
            <td>${fmtEur(r.revenue)}<br><small class="yoy">${dd(dRev, true)}</small></td>
            <td class="neg">${r.commissionCost > 0 ? fmtEur(-r.commissionCost) : '—'}</td>
            <td class="${commClass}">${r.commPct > 0 ? r.commPct.toFixed(1) + '%' : '—'}</td>
            <td>${fmtEur(r.vendorCost)}</td>
            <td class="${gmClass(r.grossMargin)}">${fmtEur(r.grossMargin)}<br><small class="yoy">${dd(dGm, true)}</small></td>
            <td class="${gmClass(r.gmPct)}">${r.gmPct.toFixed(1)}%</td>
            <td class="${gmClass(r.avgGm)}">${fmtEur(r.avgGm)}</td>
        </tr>`;
    }).join('');

    const legendEl = document.getElementById('guide-legend');
    if (legendEl) {
        legendEl.innerHTML = `
            <span style="margin-right: 24px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(29,158,117,0.2); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM ≥ 20% & growing
            </span>
            <span style="margin-right: 24px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(186,117,23,0.1); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM 10–20%
            </span>
            <span>
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(212,84,90,0.15); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM < 10% or declining
            </span>
        `;
    }
}

// Sort handler — reads active city pill from DOM and re-renders
export function mgmtSort(col) {
    if (_sortCol === col) _sortDir *= -1;
    else { _sortCol = col; _sortDir = -1; }
    document.querySelectorAll('.sort-hdr').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.col === col) th.classList.add(_sortDir === -1 ? 'sorted-desc' : 'sorted-asc');
    });
    // Read active city from DOM
    const activePill = document.querySelector('.city-pill.active');
    const activeCity = activePill?.dataset.city || 'all';
    renderGuideTable(activeCity);
}

export function refreshGuides(city) {
    renderGuideTable(city);
}
