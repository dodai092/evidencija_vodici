const Page26 = {
    activeCity: 'all',
    activeLang: 'all',
    activeMonths: [],
    _initialized: false,

    _el(id) { return document.getElementById(id + '-26'); },
    _scope(sel) { return document.querySelectorAll('#page-26 ' + sel); },

    renderCard(g) {
        const st = g.stats[this.activeLang];
        const fs = filteredStats(st, this.activeMonths);
        const sid = 'p26_' + safeName(g.name);
        const col = CITY_COLS[g.city] || '#999';
        const init = g.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        const typeEntries = Object.entries(st.byType).sort((a, b) => b[1].tours - a[1].tours);
        const maxT = typeEntries.length > 0 ? typeEntries[0][1].tours : 1;
        const typeBarsHtml = typeEntries.length > 0
            ? '<div class="gc-types">' +
              typeEntries.map(([type, d]) =>
                  `<div class="type-bar-row">` +
                  `<span class="type-lbl">${type}</span>` +
                  `<div class="type-track"><div class="type-fill" style="width:${(d.tours/maxT*100).toFixed(0)}%;background:${col}"></div></div>` +
                  `<span class="type-val">${d.tours}t &middot; ${d.pax}p</span>` +
                  `</div>`
              ).join('') + '</div>'
            : '';

        const months = Object.keys(st.byMonth).map(Number).sort((a, b) => a - b);
        const monthRowsHtml = months.map(m => {
            const md = st.byMonth[m];
            return `<tr>` +
                `<td>${md.name}</td>` +
                `<td class="num free-col">${md.free.tours || 0}</td>` +
                `<td class="num">${md.free.pax || 0}</td>` +
                `<td class="num paid-col">${md.paid.tours || 0}</td>` +
                `<td class="num">${md.paid.pax || 0}</td>` +
                `</tr>`;
        }).join('');

        return `<div class="guide-card" data-city="${g.city}" data-name="${g.name}">` +
            `<div class="gc-stripe" style="background:${col}"></div>` +
            `<div class="gc-body">` +
            `<div class="gc-header">` +
            `<div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div>` +
            `<span class="gc-name">${g.name}</span>` +
            `<span class="city-pill" style="background:${col}18;color:${col}">${g.city}</span>` +
            `</div>` +
            `<div class="gc-stats">` +
            `<div class="gc-half">` +
            `<div class="gc-stat-label">Free ture</div>` +
            `<div class="gc-stat-num" style="color:var(--green)">${fs.freeTours}</div>` +
            `<div class="gc-stat-sub">${fs.freePax} pax</div>` +
            `</div>` +
            `<div class="gc-divider"></div>` +
            `<div class="gc-half" style="text-align:right">` +
            `<div class="gc-stat-label">$ Ture</div>` +
            `<div class="gc-stat-num" style="color:${col}">${fs.paidTours}</div>` +
            `<div class="gc-stat-sub">${fs.paidPax} pax</div>` +
            `</div>` +
            `</div>` +
            `</div>` +
            `${typeBarsHtml}` +
            `<div class="monthly-toggle" onclick="Page26.toggleMonthly('${sid}')">` +
            `<span class="mt-arrow" id="mta-${sid}">&#9660;</span> Mjese&#269;no` +
            `</div>` +
            `<div class="monthly-table" id="mt-${sid}">` +
            `<table>` +
            `<thead><tr>` +
            `<th>Mj.</th>` +
            `<th class="num" style="color:var(--green)">Free t</th>` +
            `<th class="num">Free p</th>` +
            `<th class="num" style="color:var(--teal)">$ t</th>` +
            `<th class="num">$ p</th>` +
            `</tr></thead>` +
            `<tbody>${monthRowsHtml}</tbody>` +
            `<tfoot><tr>` +
            `<td>Ukup.</td>` +
            `<td class="num free-col">${fs.freeTours}</td>` +
            `<td class="num">${fs.freePax}</td>` +
            `<td class="num paid-col">${fs.paidTours}</td>` +
            `<td class="num">${fs.paidPax}</td>` +
            `</tr></tfoot>` +
            `</table>` +
            `</div>` +
            `</div>`;
    },

    renderAll() {
        const container = this._el('guide-sections');
        let html = '';
        CITIES.forEach(city => {
            if (this.activeCity !== 'all' && this.activeCity !== city) return;
            const cityGuides = guideStats26.filter(g => g.city === city);
            if (cityGuides.length === 0) return;
            const cls = CITY_CLS[city] || '';
            html += `<section class="city-section" data-city="${city}">`;
            html += `<div class="section-title ${cls}">${city}</div>`;
            html += `<div class="guide-grid">`;
            html += cityGuides.map(g => this.renderCard(g)).join('');
            html += `</div></section>`;
        });
        container.innerHTML = html;
        this.updateKPIs();
    },

    updateKPIs() {
        const filtered = guideStats26.filter(g => this.activeCity === 'all' || g.city === this.activeCity);
        const k = this.activeLang;
        let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
        filtered.forEach(g => {
            const fs = filteredStats(g.stats[k], this.activeMonths);
            freeTours += fs.freeTours;
            paidTours += fs.paidTours;
            freePax   += fs.freePax;
            paidPax   += fs.paidPax;
        });
        this._el('kv-guides').textContent   = filtered.length;
        this._el('kv-free').textContent     = fmtN(freePax);
        this._el('kv-free-pax').textContent = freeTours + ' t';
        this._el('kv-paid').textContent     = paidTours;
        this._el('kv-paid-pax').textContent = fmtN(paidPax) + ' pax';
        this._el('kv-pax').textContent      = fmtN(freePax);
    },

    filterCity(city) {
        this.activeCity = city;
        this.renderAll();
    },

    filterLang(lang) {
        this.activeLang = lang;
        this.renderAll();
    },

    filterMonth(m) {
        this.activeMonths = m === 'all' ? [] : [parseInt(m)];
        this.renderAll();
    },

    toggleMonthly(sid) {
        const table = document.getElementById('mt-' + sid);
        const arrow = document.getElementById('mta-' + sid);
        if (!table) return;
        table.classList.toggle('open');
        if (arrow) arrow.classList.toggle('open');
    },

    init() {
        if (this._initialized) return;
        this._initialized = true;
        const d = new Date(GLOBAL_DATE);
        const fmt = d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
        const datePov = this._el('date-pov');
        if (datePov) datePov.textContent = fmt;
        this.renderAll();
    }
};
