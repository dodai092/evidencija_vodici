(() => {
  // src/shared.js
  function getCityColor(city) {
    if (!city || city === "Unknown") return "#999999";
    return getComputedStyle(document.body).getPropertyValue("--" + city.toLowerCase()).trim() || "#999999";
  }
  function getChartColors() {
    const s = getComputedStyle(document.body);
    const tok = (n) => s.getPropertyValue(n).trim();
    return { text: tok("--text"), text3: tok("--text3"), border: tok("--border"), y25: tok("--y25"), y26: tok("--y26") };
  }
  var CITY_CLS = { Zagreb: "zagreb", Dubrovnik: "dubrovnik", Split: "split", Zadar: "zadar", Unknown: "" };
  var CITIES = ["Zagreb", "Dubrovnik", "Split", "Zadar"];
  var MONTH_NAMES_HR = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
  var CSS2 = {
    ACTIVE: "active",
    NAV_Y25: "y25",
    NAV_Y26: "y26",
    NAV_CMP: "cmp",
    PAGE: "page",
    MGMT_PAGE: "mgmt-page",
    NAV_TAB: "nav-tab",
    MGMT_TAB_ACTIVE: "mgmt-tab-active",
    DARK_MODE: "dark-mode"
  };
  var PAGES = {
    Page25: null,
    Page26: null,
    PageCmp: null,
    PageGuides: null,
    PageMgmt: null
  };
  function registerPage(name, page) {
    if (Object.prototype.hasOwnProperty.call(PAGES, name)) {
      PAGES[name] = page;
    }
  }
  function latestDataDate(guideStats, today) {
    let maxM = 0, maxD = 0;
    for (const g of guideStats) {
      for (const lang of Object.values(g.stats || {})) {
        for (const key of Object.keys(lang.byDay || {})) {
          const [m, d] = key.split("-").map(Number);
          if (m > maxM || m === maxM && d > maxD) {
            maxM = m;
            maxD = d;
          }
        }
      }
    }
    const cap = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const candidate = maxM === 0 ? cap : new Date(cap.getFullYear(), maxM - 1, maxD);
    const result = candidate > cap ? cap : candidate;
    return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, "0")}-${String(result.getDate()).padStart(2, "0")}`;
  }
  var _today = /* @__PURE__ */ new Date();
  var GLOBAL_DATE = typeof guideStats26 !== "undefined" ? latestDataDate(guideStats26, _today) : `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, "0")}-${String(_today.getDate()).padStart(2, "0")}`;
  var GLOBAL_LANGUAGE = "en";
  function getGlobalDate() {
    return GLOBAL_DATE;
  }
  function setGlobalLanguage(v) {
    GLOBAL_LANGUAGE = v;
  }
  function getGlobalLanguage() {
    return GLOBAL_LANGUAGE;
  }
  function safeName(n) {
    return n.replace(/[^a-zA-Z0-9]/g, "_");
  }
  function fmtN(v) {
    return Math.round(v).toLocaleString("en-GB");
  }
  function getCutoffMonth() {
    return parseInt(GLOBAL_DATE.split("-")[1]);
  }
  function parseGlobalDate() {
    const [y, m, d] = GLOBAL_DATE.split("-");
    return { year: parseInt(y), month: parseInt(m), day: parseInt(d) };
  }
  function getRangeLabel() {
    const m = getCutoffMonth();
    if (m === 1) return "Jan";
    return `Jan\u2013${MONTH_NAMES_HR[m]}`;
  }
  function updateDateAsOf(val) {
    GLOBAL_DATE = val;
    const d = new Date(val);
    const fmt2 = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    document.querySelectorAll('[id^="date-pov-"]').forEach((el) => el.textContent = fmt2);
    document.querySelectorAll(".ytd-range-label").forEach((el) => el.textContent = getRangeLabel());
    document.querySelectorAll('select[id^="month-filter-"]').forEach((sel) => sel.value = "all");
    Object.values(PAGES).forEach((page) => {
      if (page) page.activeMonths = [];
    });
    requestAnimationFrame(() => {
      if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.renderAll();
      if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.renderAll();
      if (PAGES.PageCmp && PAGES.PageCmp._initialized) {
        PAGES.PageCmp.mergedGuides = PAGES.PageCmp.buildMerged();
        PAGES.PageCmp.renderAll();
      }
      if (PAGES.PageGuides && PAGES.PageGuides._initialized) PAGES.PageGuides.renderAll();
      if (PAGES.PageMgmt?._initialized) PAGES.PageMgmt.renderAll();
    });
  }
  function filteredStats(st, months, cutoff) {
    const cutoffMonth = cutoff ? cutoff.month : getCutoffMonth();
    const cutoffDay = cutoff ? cutoff.day : parseInt(GLOBAL_DATE.split("-")[2]);
    const activeMonths = months && months.length > 0 ? months : Array.from({ length: cutoffMonth }, (_, i) => i + 1);
    return activeMonths.reduce((acc, m) => {
      if (m < cutoffMonth) {
        const mo = st.byMonth[String(m)];
        if (mo) {
          acc.freeTours += mo.free.tours || 0;
          acc.freePax += mo.free.pax || 0;
          acc.paidTours += mo.paid.tours || 0;
          acc.paidPax += mo.paid.pax || 0;
        }
      } else if (m === cutoffMonth && st.byDay) {
        for (let d = 1; d <= cutoffDay; d++) {
          const dy = st.byDay[`${m}-${d}`];
          if (dy) {
            acc.freeTours += dy.free.tours || 0;
            acc.freePax += dy.free.pax || 0;
            acc.paidTours += dy.paid.tours || 0;
            acc.paidPax += dy.paid.pax || 0;
          }
        }
      } else if (m === cutoffMonth) {
        const mo = st.byMonth[String(m)];
        if (mo) {
          acc.freeTours += mo.free.tours || 0;
          acc.freePax += mo.free.pax || 0;
          acc.paidTours += mo.paid.tours || 0;
          acc.paidPax += mo.paid.pax || 0;
        }
      }
      return acc;
    }, { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 });
  }
  function toggleSection(id) {
    const body = document.getElementById(id);
    if (!body) return;
    const collapsed = body.classList.toggle("collapsed");
    const chevron = body.previousElementSibling?.querySelector(".section-chevron");
    if (chevron) chevron.textContent = collapsed ? "\u25B8" : "\u25BE";
    body.previousElementSibling?.setAttribute("aria-expanded", String(!collapsed));
  }
  function showPage(id, tab) {
    document.querySelectorAll(`.${CSS2.PAGE}`).forEach((p) => p.classList.remove(CSS2.ACTIVE));
    document.querySelectorAll(`.nav-tabs .${CSS2.NAV_TAB}`).forEach((t2) => {
      t2.classList.remove(CSS2.ACTIVE, CSS2.NAV_Y25, CSS2.NAV_Y26, CSS2.NAV_CMP);
      t2.setAttribute("aria-selected", "false");
      t2.setAttribute("tabindex", "-1");
    });
    document.getElementById(id).classList.add(CSS2.ACTIVE);
    tab.classList.add(CSS2.ACTIVE);
    tab.setAttribute("aria-selected", "true");
    tab.setAttribute("tabindex", "0");
    if (id === "page-25") tab.classList.add(CSS2.NAV_Y25);
    if (id === "page-26") tab.classList.add(CSS2.NAV_Y26);
    if (id === "page-cmp") tab.classList.add(CSS2.NAV_CMP);
    const titles = {
      "page-25": "Guides 2025",
      "page-26": "Guides 2026",
      "page-cmp": "Comparison 25/26",
      "page-gd": "Guides",
      "page-mgmt": "Management"
    };
    document.title = `${titles[id] || "Guide Production"} \xB7 FreeSpirit`;
    if (id === "page-25" && PAGES.Page25 && !PAGES.Page25._initialized) PAGES.Page25.init();
    if (id === "page-26" && PAGES.Page26 && !PAGES.Page26._initialized) PAGES.Page26.init();
    if (id === "page-cmp" && PAGES.PageCmp && !PAGES.PageCmp._initialized) PAGES.PageCmp.init();
    else if (id === "page-cmp" && PAGES.PageCmp) setTimeout(() => PAGES.PageCmp.updateCharts(), 50);
    if (id === "page-gd" && PAGES.PageGuides) {
      if (!PAGES.PageGuides._initialized) PAGES.PageGuides.init();
      else PAGES.PageGuides.renderAll();
    }
    if (id === "page-mgmt" && PAGES.PageMgmt) {
      if (!PAGES.PageMgmt._initialized) PAGES.PageMgmt.init();
      else PAGES.PageMgmt.renderAll();
    }
  }

  // src/i18n.js
  var TRANSLATIONS = {
    en: {
      nav: {
        guides2025: "Tours 2025",
        guides2026: "Tours 2026",
        comparison: "Comparison 25/26",
        management: "Management"
      },
      labels: {
        freeTours: "Free Tours",
        paidTours: "Paid Tours",
        freePax: "Free PAX",
        paidPax: "Paid PAX",
        monthly: "Monthly",
        external: "External",
        avgPaxPerTour: "Avg PAX per Tour",
        searchGuide: "Search guide\u2026",
        city: "City",
        language: "Language",
        mo: "Month",
        all: "All",
        cumulative: "Cumulative",
        total: "Total",
        type: "Type",
        tourType: "Tour Type",
        guides: "Guides",
        activeGuides: "Active Guides",
        totalFreeTours: "Total Free Tours",
        in2025: "in 2025",
        in2026: "in 2026",
        freeToursPaxCount: "Free Tours \u2013 PAX Count",
        avgPaxFreeTour: "Avg PAX / Free Tour",
        paidToursCount: "Paid Tours \u2013 Count",
        paxPerTour: "pax per tour",
        byMonth: "by Month",
        travelYear2026: "Travel Year 2026",
        ytd: "YTD",
        partial: "Partial month",
        freeToursPaxCountYtd: "Free Tours \u2013 PAX Count YTD",
        avgPaxPerFreeTour: "Avg PAX / Free Tour",
        paidToursCountYtd: "Paid Tours \u2013 Count YTD",
        freeT: "Free t",
        freeP: "Free p",
        paidT: "Paid t",
        paidP: "Paid p",
        dataThrough: "data through",
        moreDetail: "More detail",
        totalTours: "Total Tours",
        totalT: "Total t",
        sortDefault: "By city",
        sortName: "Name",
        sortGain: "PAX \u2191",
        sortDrop: "PAX \u2193",
        badgeNew: "New",
        badgeInactive: "Inactive in 2026",
        flagDown: "Down over 30%",
        flagUp: "Up over 30%",
        noGuidesFound: "No guides found",
        viewCards: "Cards",
        viewTable: "Table",
        guide: "Guide",
        guideTotalNote: "Totals add up each listed guide, grouped by their home city. They can differ from the city-based figures on the other tabs.",
        modalNote: "2025 full year vs 2026 through"
      },
      charts: {
        freePaxByCity: "Free PAX by City",
        paidToursByCity: "Paid Tours by City",
        cumulativeFreePax: "Cumulative Free PAX Trend",
        cumulativePaidTours: "Cumulative Paid Tours Trend",
        avgFreePaxCmp: "Avg PAX per Free Tour",
        cityMonthlyCumulative: "Free PAX by City \u2014 Cumulative",
        privatePaidTours: "Private Paid Tours by Type",
        sharedPaidTours: "Shared Paid Tours by Type",
        avgPaxByType: "Avg PAX per Paid Tour Type",
        freePaxByMonthAndCity: "Free PAX by Month and City",
        freePaxByCity25: "Free PAX by City \u2014 2025",
        avgPaxPerTourMonth25: "Avg PAX per Free Tour \u2014 by month 2025",
        paidToursByCity25: "Paid Tours by City \u2014 2025",
        privatePaidTours25: "Paid Tours (Private) by Type \u2014 2025",
        sharedPaidTours25: "Paid Tours (Shared) by Type \u2014 2025",
        freePaxByCity26: "Free PAX by City \u2014 2026",
        avgPaxPerTourMonth26: "Avg PAX per Free Tour \u2014 by month 2026",
        paidToursByCity26: "Paid Tours by City \u2014 2026",
        privatePaidTours26: "Paid Tours (Private) by Type \u2014 2026",
        sharedPaidTours26: "Paid Tours (Shared) by Type \u2014 2026",
        freePaxByMonthAndCity25: "Free PAX by Month and City \u2014 2025",
        freePaxByMonthAndCity26: "Free PAX by Month and City \u2014 2026"
      },
      table: {
        month: "Month",
        free: "Free",
        paid: "Paid",
        pax: "PAX",
        tours: "Tours"
      },
      sections: {
        freeTours: "Free Tours",
        paidTours: "Paid Tours",
        byCity: "by City",
        byType: "by Type",
        guideComparison: "Tour Comparison",
        productionByGuide: "Production by guide",
        comparisonYtd: "Comparison YTD"
      },
      management: {
        profitAndLoss: "Profit & Loss",
        guides: "Guides",
        channels: "Channels",
        operational: "Operational",
        cities: "Cities",
        revenue: "Revenue",
        costs: "Costs",
        profit: "Profit",
        margin: "Margin",
        gmOfRevenue: "GM",
        ofRevenue: "of revenue",
        guideFeesPaid: "Guide fees paid",
        acrossAllCities: "across all cities",
        topGuidesMargin: "Top 10 Guides by Margin",
        guide: "Guide",
        gmEuro: "GM \u20AC",
        vs2025: "vs 2025",
        commission: "Commission",
        vat: "VAT",
        vendorCost: "Vendor Cost",
        tourCost: "Tour Cost",
        grossMargin: "Gross Margin",
        plBreakdown: "P&L Breakdown",
        plItem: "P&L Item",
        paxBand: "PAX Band",
        guidePaxBand: "Guide PAX Band",
        tours: "Tours",
        sources: "Sources",
        tourTypes: "Tour Types",
        pax: "PAX",
        dayOfWeek: "Day of Week",
        season: "Season",
        paymentMethods: "Payment Methods",
        directCashCard: "POS (Direct \u2014 Cash/Card)",
        otaBankTransfer: "CPP (OTA / Bank Transfer)",
        bankTransfer: "Bank Transfer",
        card: "Card",
        cash: "Cash",
        directRevenue: "Direct Revenue",
        otaRevenue: "OTA Revenue",
        english: "English",
        spanish: "Spanish",
        french: "French",
        smallGroupProblem: "Small Group Problem Summary",
        prevalence: "Prevalence",
        marginLoss: "Margin loss",
        trend: "Trend",
        commissionRate: "Commission rate",
        avgGmTour: "Avg GM/tour",
        yoy: "vs 2025",
        perPaidTour: "per paid tour",
        commissionPercent: "Commission %",
        gmPercent: "GM %",
        lowVolume: "\u2013 Low volume",
        highCommission: "\u26A0 High commission",
        keepPushing: "\u2713 Keep pushing",
        declining: "\u2193 Declining"
      }
    },
    hr: {
      nav: {
        guides2025: "Ture 2025",
        guides2026: "Ture 2026",
        comparison: "Usporedba 25/26",
        management: "Upravljanje"
      },
      labels: {
        freeTours: "Besplatne ture",
        paidTours: "Pla\u0107ene ture",
        freePax: "Besplatni PAX",
        paidPax: "Pla\u0107eni PAX",
        monthly: "Mjese\u010Dno",
        external: "Vanjski",
        avgPaxPerTour: "Prosje\u010Dan PAX po turi",
        searchGuide: "Pretra\u017Ei vodi\u010Da\u2026",
        city: "Grad",
        language: "Jezik",
        mo: "Mj.",
        all: "Sve",
        cumulative: "Kumulativno",
        total: "Ukupno",
        type: "Tip",
        tourType: "Tip ture",
        guides: "Vodi\u010Di",
        activeGuides: "Aktivni vodi\u010Di",
        totalFreeTours: "Ukupno besplatnih tura",
        in2025: "u 2025.",
        in2026: "u 2026.",
        freeToursPaxCount: "Besplatne ture \u2013 Broj PAX-a",
        avgPaxFreeTour: "Prosje\u010Dan PAX / Besplatna tura",
        paidToursCount: "Pla\u0107ene ture \u2013 Broj",
        paxPerTour: "pax po turi",
        byMonth: "po mjesecu",
        travelYear2026: "Putna godina 2026",
        ytd: "YTD",
        partial: "Dijelom mjesec",
        freeToursPaxCountYtd: "Besplatne ture \u2013 Broj PAX-a YTD",
        avgPaxPerFreeTour: "Prosje\u010Dan PAX / Besplatna tura",
        paidToursCountYtd: "Pla\u0107ene ture \u2013 Broj YTD",
        freeT: "Bespl. t",
        freeP: "Bespl. p",
        paidT: "Pla\u0107. t",
        paidP: "Pla\u0107. p",
        dataThrough: "podaci kroz",
        moreDetail: "Vi\u0161e detalja",
        totalTours: "Ukupno tura",
        totalT: "Ukupno t",
        sortDefault: "Po gradu",
        sortName: "Ime",
        sortGain: "PAX \u2191",
        sortDrop: "PAX \u2193",
        badgeNew: "Novo",
        badgeInactive: "Neaktivan u 2026.",
        flagDown: "Pad ve\u0107i od 30%",
        flagUp: "Rast ve\u0107i od 30%",
        noGuidesFound: "Nema prona\u0111enih vodi\u010Da",
        viewCards: "Kartice",
        viewTable: "Tablica",
        guide: "Vodi\u010D",
        guideTotalNote: "Zbrojevi obuhva\u0107aju svakog navedenog vodi\u010Da, grupirano po mati\u010Dnom gradu. Mogu se razlikovati od brojki po gradu na drugim karticama.",
        modalNote: "2025 cijela godina naspram 2026 do"
      },
      charts: {
        freePaxByCity: "Besplatni PAX po gradu",
        paidToursByCity: "Pla\u0107ene ture po gradu",
        cumulativeFreePax: "Trend kumulativnog besplatnog PAX-a",
        cumulativePaidTours: "Trend kumulativnih pla\u0107enih tura",
        avgFreePaxCmp: "Prosje\u010Dan PAX po besplatnoj turi",
        cityMonthlyCumulative: "Besplatni PAX po gradu \u2014 kumulativno",
        privatePaidTours: "Privatne pla\u0107ene ture po vrsti",
        sharedPaidTours: "Zajedni\u010Dke pla\u0107ene ture po vrsti",
        avgPaxByType: "Prosje\u010Dan PAX po vrsti pla\u0107ene ture",
        freePaxByMonthAndCity: "Besplatni PAX po mjesecu i gradu",
        freePaxByCity25: "Besplatni PAX po gradu \u2014 2025",
        avgPaxPerTourMonth25: "Prosje\u010Dan PAX po besplatnoj turi \u2014 po mjesecu 2025",
        paidToursByCity25: "Pla\u0107ene ture po gradu \u2014 2025",
        privatePaidTours25: "Pla\u0107ene ture (Privatne) po vrsti \u2014 2025",
        sharedPaidTours25: "Pla\u0107ene ture (Zajedni\u010Dke) po vrsti \u2014 2025",
        freePaxByCity26: "Besplatni PAX po gradu \u2014 2026",
        avgPaxPerTourMonth26: "Prosje\u010Dan PAX po besplatnoj turi \u2014 po mjesecu 2026",
        paidToursByCity26: "Pla\u0107ene ture po gradu \u2014 2026",
        privatePaidTours26: "Pla\u0107ene ture (Privatne) po vrsti \u2014 2026",
        sharedPaidTours26: "Pla\u0107ene ture (Zajedni\u010Dke) po vrsti \u2014 2026",
        freePaxByMonthAndCity25: "Besplatni PAX po mjesecu i gradu \u2014 2025",
        freePaxByMonthAndCity26: "Besplatni PAX po mjesecu i gradu \u2014 2026"
      },
      table: {
        month: "Mj.",
        free: "Bespl.",
        paid: "Pla\u0107ene",
        pax: "PAX",
        tours: "Ture"
      },
      sections: {
        freeTours: "Besplatne ture",
        paidTours: "Pla\u0107ene ture",
        byCity: "po gradu",
        byType: "po vrsti",
        guideComparison: "Usporedba tura",
        productionByGuide: "Proizvodnja po vo\u0111enju",
        comparisonYtd: "Usporedba YTD"
      },
      management: {
        profitAndLoss: "Dobit i gubitak",
        guides: "Vodi\u010Di",
        channels: "Kanali",
        operational: "Operativno",
        cities: "Gradovi",
        revenue: "Dohodak",
        costs: "Tro\u0161kovi",
        profit: "Dobit",
        margin: "Mar\u017Ea",
        gmOfRevenue: "GM",
        ofRevenue: "od dohotka",
        guideFeesPaid: "Honorari vodi\u010Da pla\u0107eni",
        acrossAllCities: "u svim gradovima",
        topGuidesMargin: "Top 10 Vodi\u010Da po Mar\u017Ei",
        guide: "Vodi\u010D",
        gmEuro: "GM \u20AC",
        vs2025: "vs 2025",
        commission: "Provizija",
        vat: "PDV",
        vendorCost: "Tro\u0161ak izvor\u0161itelja",
        tourCost: "Tro\u0161ak tureje",
        grossMargin: "Bruto mar\u017Ea",
        plBreakdown: "Analiza Dobit i Gubitka",
        plItem: "Stavka Dobit i Gubitka",
        paxBand: "PAX Band",
        guidePaxBand: "Vodi\u010D PAX Band",
        tours: "Ture",
        sources: "Izvori",
        tourTypes: "Vrste tura",
        pax: "PAX",
        dayOfWeek: "Dan u tjednu",
        season: "Sezona",
        paymentMethods: "Na\u010Dini pla\u0107anja",
        directCashCard: "POS (Direktno \u2014 Gotovina/Kartica)",
        otaBankTransfer: "CPP (OTA / Bankni transfer)",
        bankTransfer: "Bankni transfer",
        card: "Kartica",
        cash: "Gotovina",
        directRevenue: "Direktni dohodak",
        otaRevenue: "OTA dohodak",
        english: "Engleski",
        spanish: "\u0160panjolski",
        french: "Francuski",
        smallGroupProblem: "Sa\u017Eetak problema male grupe",
        prevalence: "Prevalencija",
        marginLoss: "Gubitak mar\u017Ee",
        trend: "Trend",
        commissionRate: "Stopa provizije",
        avgGmTour: "Prosje\u010Dan GM/tureja",
        yoy: "vs 2025",
        perPaidTour: "po pla\u0107enoj turi",
        commissionPercent: "Provizija %",
        gmPercent: "GM %",
        lowVolume: "\u2013 Nizak volumen",
        highCommission: "\u26A0 Visoka provizija",
        keepPushing: "\u2713 Nastavi gurati",
        declining: "\u2193 U padanju"
      }
    }
  };
  function t(key) {
    const keys = key.split(".");
    let val = TRANSLATIONS[GLOBAL_LANGUAGE];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
  }
  function tOpposite(key) {
    const keys = key.split(".");
    const oppositeLanguage = GLOBAL_LANGUAGE === "en" ? "hr" : "en";
    let val = TRANSLATIONS[oppositeLanguage];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
  }
  function titleAttr(key) {
    return ` title="${tOpposite(key)}"`;
  }

  // src/theme.js
  var _onThemeChange = null;
  var _onLanguageChange = null;
  function registerThemeChangeCallback(callback) {
    _onThemeChange = callback;
  }
  function registerLanguageChangeCallback(callback) {
    _onLanguageChange = callback;
  }
  function initTheme() {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add(CSS2.DARK_MODE);
      document.body.classList.add(CSS2.DARK_MODE);
    }
  }
  function initLanguage() {
    const stored = localStorage.getItem("language");
    if (stored) setGlobalLanguage(stored);
    document.documentElement.lang = getGlobalLanguage() === "hr" ? "hr" : "en";
  }
  function updateThemeButton(isDark) {
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
  function toggleTheme(onToggleComplete) {
    const isDark = document.body.classList.toggle(CSS2.DARK_MODE);
    document.documentElement.classList.toggle(CSS2.DARK_MODE, isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeButton(isDark);
    if (typeof onToggleComplete === "function") {
      setTimeout(onToggleComplete, 100);
    } else {
      setTimeout(() => {
        if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.renderAll();
        if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.renderAll();
        if (PAGES.PageCmp && PAGES.PageCmp._initialized) PAGES.PageCmp.updateCharts();
        if (_onThemeChange) _onThemeChange();
      }, 100);
    }
  }
  function updateNavigationLabels() {
    const tabs = {
      "tab-25": t("nav.guides2025"),
      "tab-26": t("nav.guides2026"),
      "tab-cmp": t("nav.comparison")
    };
    Object.entries(tabs).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = t(el.getAttribute("data-i18n"));
      if (val && val !== el.getAttribute("data-i18n")) el.textContent = val;
    });
  }

  // src/pages/page-2025.js
  var Page25 = {
    activeCity: "all",
    activeLang: "all",
    activeMonths: [],
    activePrivateType: "all",
    activeSharedType: "all",
    PRIVATE_TYPES: ["war PR", "food PR", "best", "old", "big"],
    SHARED_TYPES: ["war", "food", "best"],
    chartInstance: null,
    cityChartInstance: null,
    paidCityChartInstance: null,
    privatePaidChartInstance: null,
    sharedPaidChartInstance: null,
    _initialized: false,
    _el(id) {
      return document.getElementById(id + "-25");
    },
    getChartColors() {
      const c = getChartColors();
      return { ...c, accent: c.y25 };
    },
    _setActivePill(groupId, activeBtn) {
      const group = document.getElementById(groupId);
      if (!group) return;
      group.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      if (activeBtn) activeBtn.classList.add("active");
    },
    renderAll() {
      this.updateKPIs();
      this.updateChart();
      this.renderCityBars();
      this.renderMonthlyTable();
      this.updatePaidTypeCharts();
    },
    renderCityBars() {
      const colors = this.getChartColors();
      const lang = this.activeLang;
      const citiesToShow = this.activeCity === "all" ? CITIES : [this.activeCity];
      const freePaxByCity = {}, paidToursByCity = {};
      CITIES.forEach((c) => {
        const st = cityStats25[c]?.[lang];
        const fs = st ? filteredStats(st, this.activeMonths) : { freePax: 0, paidTours: 0 };
        freePaxByCity[c] = fs.freePax;
        paidToursByCity[c] = fs.paidTours;
      });
      const makeBar = (canvasId, instanceKey, dataArr, yLabel, tooltipLabel) => {
        try {
          if (this[instanceKey]) this[instanceKey].destroy();
          const ctx = document.getElementById(canvasId)?.getContext("2d");
          if (!ctx) return;
          this[instanceKey] = new Chart(ctx, {
            type: "bar",
            data: {
              labels: citiesToShow,
              datasets: [{ data: dataArr, backgroundColor: citiesToShow.map((c) => getCityColor(c)), borderRadius: 4 }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (i) => `${fmtN(i.raw)} ${tooltipLabel}` } } },
              scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { title: { display: true, text: yLabel, color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
              }
            }
          });
        } catch (e) {
          console.error(e);
        }
      };
      makeBar("cityChart-25", "cityChartInstance", citiesToShow.map((c) => freePaxByCity[c]), t("table.pax"), "pax");
      makeBar("paidCityChart-25", "paidCityChartInstance", citiesToShow.map((c) => paidToursByCity[c]), t("table.tours"), "tours");
    },
    renderMonthlyTable() {
      const lang = this.activeLang;
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const months = this.activeMonths.length > 0 ? this.activeMonths : Array.from({ length: 12 }, (_, i) => i + 1);
      const citiesToShow = this.activeCity === "all" ? CITIES : [this.activeCity];
      const data = months.map((m) => {
        const row = { m };
        CITIES.forEach((city) => {
          row[city] = cityStats25[city]?.[lang]?.byMonth?.[String(m)]?.free?.pax || 0;
        });
        return row;
      });
      const totals = {};
      CITIES.forEach((c) => {
        totals[c] = data.reduce((s, r) => s + r[c], 0);
      });
      const cityHeaders = citiesToShow.map(
        (c) => `<th class="mpax-city-head ${CITY_CLS[c]}">${c}</th>`
      ).join("");
      const bodyRows = data.map((row) => {
        const cells = citiesToShow.map((c) => `<td>${row[c] ? fmtN(row[c]) : "\u2014"}</td>`).join("");
        const rowTotal = citiesToShow.reduce((s, c) => s + (row[c] || 0), 0);
        return `<tr><td class="mpax-month">${MONTH_NAMES[row.m]}</td>${cells}<td><strong>${rowTotal ? fmtN(rowTotal) : "\u2014"}</strong></td></tr>`;
      }).join("");
      const totalCells = citiesToShow.map((c) => `<td>${fmtN(totals[c])}</td>`).join("");
      const overallTotal = citiesToShow.reduce((s, c) => s + totals[c], 0);
      const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr("charts.freePaxByMonthAndCity")}>${t("charts.freePaxByMonthAndCity")}</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead><tr><th class="mpax-month-head">${t("table.month")}</th>${cityHeaders}<th class="mpax-city-head">${t("labels.total")}</th></tr></thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t("labels.total")}</td>${totalCells}<td><strong>${fmtN(overallTotal)}</strong></td></tr>
                </tbody>
            </table>
            </div>
        </div>`;
      const el = document.getElementById("monthly-pax-table-25");
      if (el) el.innerHTML = html;
    },
    _getTypeMonthData(types) {
      const lang = this.activeLang;
      return Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => {
        let tours = 0, pax = 0;
        guideStats25.filter((g) => CITIES.includes(g.city) && (this.activeCity === "all" || g.city === this.activeCity)).forEach((g) => {
          const bmt = g.stats[lang]?.byMonthType?.[String(mo)];
          if (!bmt) return;
          types.forEach((tp) => {
            const td = bmt[tp];
            if (td) {
              tours += td.tours || 0;
              pax += td.pax || 0;
            }
          });
        });
        return { tours, pax };
      });
    },
    updatePaidTypeCharts() {
      const colors = this.getChartColors();
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const monthLabels = Array.from({ length: 12 }, (_, i) => MONTH_NAMES[i + 1]);
      const paxLabelPlugin = () => ({
        id: "paxLabel25",
        afterDraw(chart) {
          const ctx = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          ctx.save();
          ctx.font = "500 9px 'IBM Plex Sans',sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = colors.text3;
          const paxData = chart.data.datasets[0]._paxData || [];
          meta.data.forEach((bar, i) => {
            const val = paxData[i];
            if (!val) return;
            ctx.fillText(`${val}p`, bar.x, bar.y - 4);
          });
          ctx.restore();
        }
      });
      const buildChart = (canvasId, instanceKey, types) => {
        const data = this._getTypeMonthData(types);
        try {
          if (this[instanceKey]) this[instanceKey].destroy();
          const ctx = document.getElementById(canvasId)?.getContext("2d");
          if (!ctx) return;
          this[instanceKey] = new Chart(ctx, {
            type: "bar",
            data: {
              labels: monthLabels,
              datasets: [{
                data: data.map((d) => d.tours),
                _paxData: data.map((d) => d.pax),
                backgroundColor: colors.accent,
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: { top: 20 } },
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { afterLabel: (item) => {
                  const p = item.dataset._paxData?.[item.dataIndex];
                  return p ? `${t("table.pax")}: ${p}` : "";
                } } }
              },
              scales: {
                x: { ticks: { color: colors.text3, font: { size: 11 } }, grid: { color: colors.border } },
                y: { title: { display: true, text: t("sections.freeTours"), color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
              }
            },
            plugins: [paxLabelPlugin()]
          });
        } catch (e) {
          console.error(e);
        }
      };
      const buildTable = (containerId, types) => {
        const data = this._getTypeMonthData(types);
        const bodyRows = data.map((d, i) => {
          const avg = d.tours > 0 ? (d.pax / d.tours).toFixed(1) : "\u2014";
          return `<tr>
                    <td class="mpax-month">${MONTH_NAMES[i + 1]}</td>
                    <td>${d.tours || "\u2014"}</td><td>${d.pax || "\u2014"}</td><td>${avg}</td>
                </tr>`;
        }).join("");
        const totT = data.reduce((s, d) => s + d.tours, 0);
        const totP = data.reduce((s, d) => s + d.pax, 0);
        const html = `<div class="mpax-wrap" style="margin-top:16px">
                <table class="mpax-table">
                    <thead><tr>
                        <th class="mpax-month-head">${t("table.month")}</th>
                        <th class="mpax-metric-head">${t("sections.freeTours")}</th>
                        <th class="mpax-metric-head">${t("table.pax")}</th>
                        <th class="mpax-metric-head">${t("labels.avgPaxPerTour")}</th>
                    </tr></thead>
                    <tbody>
                        ${bodyRows}
                        <tr class="mpax-total">
                            <td class="mpax-month">${t("labels.total")}</td>
                            <td>${totT || "\u2014"}</td><td>${totP || "\u2014"}</td>
                            <td>${totT > 0 ? (totP / totT).toFixed(1) : "\u2014"}</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = html;
      };
      const privateTypes = this.activePrivateType === "all" ? this.PRIVATE_TYPES : [this.activePrivateType];
      const sharedTypes = this.activeSharedType === "all" ? this.SHARED_TYPES : [this.activeSharedType];
      buildChart("privatePaidChart-25", "privatePaidChartInstance", privateTypes);
      buildTable("private-type-table-25", privateTypes);
      buildChart("sharedPaidChart-25", "sharedPaidChartInstance", sharedTypes);
      buildTable("shared-type-table-25", sharedTypes);
    },
    filterPrivateType(type, btn) {
      this.activePrivateType = type;
      this._setActivePill("private-type-pills-25", btn);
      this.updatePaidTypeCharts();
    },
    filterSharedType(type, btn) {
      this.activeSharedType = type;
      this._setActivePill("shared-type-pills-25", btn);
      this.updatePaidTypeCharts();
    },
    updateChart() {
      const colors = this.getChartColors();
      const lang = this.activeLang;
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const citiesToShow = this.activeCity === "all" ? CITIES : [this.activeCity];
      const datasets = citiesToShow.map((city) => {
        const guides = guideStats25.filter((g) => g.city === city);
        const data = months.map((m) => {
          let pax = 0, tours = 0;
          guides.forEach((g) => {
            const bm = g.stats[lang]?.byMonth?.[String(m)];
            if (bm) {
              pax += bm.free.pax || 0;
              tours += bm.free.tours || 0;
            }
          });
          return tours > 0 ? +(pax / tours).toFixed(1) : null;
        });
        const col = getCityColor(city);
        return { label: city, data, borderColor: col, backgroundColor: col + "18", borderWidth: 2, fill: false, tension: 0.3, pointRadius: 4, spanGaps: false };
      });
      const ctx = document.getElementById("avgFreePaxChart-25")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(ctx, {
        type: "line",
        data: { labels: months.map((m) => MONTH_NAMES_HR[m]), datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 12 } },
            tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${i.raw} ${t("table.pax")}/tour` } }
          },
          scales: {
            x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
            y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
          }
        }
      });
    },
    updateKPIs() {
      const citiesToSum = this.activeCity === "all" ? CITIES : [this.activeCity];
      const k = this.activeLang;
      let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
      citiesToSum.forEach((city) => {
        const st = cityStats25[city]?.[k];
        if (!st) return;
        const fs = filteredStats(st, this.activeMonths);
        freeTours += fs.freeTours;
        paidTours += fs.paidTours;
        freePax += fs.freePax;
        paidPax += fs.paidPax;
      });
      this._el("kv-free-tours").textContent = fmtN(freeTours);
      this._el("kv-free").textContent = fmtN(freePax);
      this._el("kv-avg-pax").textContent = freeTours > 0 ? (freePax / freeTours).toFixed(1) : "\u2014";
      this._el("kv-paid").textContent = paidTours;
    },
    filterCity(city) {
      this.activeCity = city;
      document.querySelectorAll("#page-25 .city-filter-pill").forEach((p) => p.classList.toggle("active", p.dataset.city === city));
      this.renderAll();
    },
    filterLang(lang) {
      this.activeLang = lang;
      document.querySelectorAll("#page-25 .lang-pill").forEach((p) => p.classList.toggle("active", p.dataset.lang === lang));
      this.renderAll();
    },
    filterMonth(m) {
      this.activeMonths = m === "all" ? [] : [parseInt(m)];
      this.renderAll();
    },
    _buildHeader() {
      return `<div class="header">
            <div class="header-left">
                <h1>Tours <span class="accent">2025</span></h1>
                <p>Tour production by guide &middot; Free vs. Paid &middot; <span class="ytd-range-label">${getRangeLabel()}</span></p>
            </div>
            <div class="header-right">
                <div id="date-pov-25" class="mb-6"></div>
            </div>
        </div>`;
    },
    _buildFilters() {
      const cityPills = ["all", ...CITIES].map((c) => {
        const col = getCityColor(c);
        const label = c === "all" ? t("labels.all") : c;
        const active = this.activeCity === c ? " active" : "";
        const style = col ? ` style="--city-col:${col}"` : "";
        return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="Page25.filterCity('${c}')">${label}</button>`;
      }).join("");
      return `<div class="main">
            <div class="filter-bar">
                <div class="city-pill-group">${cityPills}</div>
                <div class="filter-dropdowns">
                    <div class="city-pill-group lang-pill-group" id="lang-filter-25" role="group" aria-label="${t("labels.language")}">
                        ${[["all", t("labels.all")], ["eng", "ENG"], ["esp", "ESP"], ["fra", "FRA"]].map(([v, label]) => `<button class="city-filter-pill lang-pill${this.activeLang === v ? " active" : ""}" data-lang="${v}" onclick="Page25.filterLang('${v}')">${label}</button>`).join("")}
                    </div>
                    <div class="filter-field">
                        <label class="filter-label" for="month-filter-25">${t("labels.mo")}</label>
                        <select class="filter-select" id="month-filter-25" onchange="Page25.filterMonth(this.value)">
                            <option value="all">${t("labels.all")}</option>
                            ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((n, i) => `<option value="${i + 1}">${n}</option>`).join("")}
                        </select>
                    </div>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.freeToursPaxCount")}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2025</div><div class="kpi-2y-val" id="kv-free-25">\u2014</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.avgPaxPerFreeTour")}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2025</div><div class="kpi-2y-val" id="kv-avg-pax-25">\u2014</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.totalFreeTours")}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2025</div><div class="kpi-2y-val" id="kv-free-tours-25">\u2014</div></div>
                    </div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t("labels.paidToursCount")}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2025</div><div class="kpi-2y-val" id="kv-paid-25">\u2014</div></div>
                    </div>
                </div>
            </div>`;
    },
    _buildFreeTours() {
      return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('free-section-body-25')">
                <span>${t("sections.freeTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </button>
            <div id="free-section-body-25" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.freePaxByCity25")}>${t("charts.freePaxByCity25")}</div>
                        <div class="chart-container"><canvas id="cityChart-25"></canvas></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.avgPaxPerTourMonth25")}>${t("charts.avgPaxPerTourMonth25")}</div>
                        <div class="chart-container"><canvas id="avgFreePaxChart-25"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div id="monthly-pax-table-25"></div>
                </div>
            </div>`;
    },
    _buildPaidTours() {
      return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('paid-section-body-25')">
                <span>${t("sections.paidTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </button>
            <div id="paid-section-body-25" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.paidToursByCity25")}>${t("charts.paidToursByCity25")}</div>
                        <div class="chart-container"><canvas id="paidCityChart-25"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.privatePaidTours25")}>${t("charts.privatePaidTours25")}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.type")}</span>
                                <div id="private-type-pills-25" class="pill-group">
                                    <button class="pill active" onclick="Page25.filterPrivateType('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('best',this)">best</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('old',this)">old</button>
                                    <button class="pill" onclick="Page25.filterPrivateType('big',this)">big</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="privatePaidChart-25"></canvas></div>
                        <div id="private-type-table-25"></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.sharedPaidTours25")}>${t("charts.sharedPaidTours25")}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.type")}</span>
                                <div id="shared-type-pills-25" class="pill-group">
                                    <button class="pill active" onclick="Page25.filterSharedType('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="Page25.filterSharedType('war',this)">war</button>
                                    <button class="pill" onclick="Page25.filterSharedType('food',this)">food</button>
                                    <button class="pill" onclick="Page25.filterSharedType('best',this)">best</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="sharedPaidChart-25"></canvas></div>
                        <div id="shared-type-table-25"></div>
                    </div>
                </div>
            </div>`;
    },
    _destroyCharts() {
      [
        this.chartInstance,
        this.cityChartInstance,
        this.paidCityChartInstance,
        this.privatePaidChartInstance,
        this.sharedPaidChartInstance
      ].forEach((chart) => {
        if (chart) try {
          chart.destroy();
        } catch (e) {
        }
      });
      this.chartInstance = null;
      this.cityChartInstance = null;
      this.paidCityChartInstance = null;
      this.privatePaidChartInstance = null;
      this.sharedPaidChartInstance = null;
    },
    rebuildStructure() {
      this._destroyCharts();
      document.getElementById("page-25").innerHTML = this._buildHeader() + this._buildFilters() + this._buildFreeTours() + this._buildPaidTours() + "</div>";
      const d = new Date(getGlobalDate());
      const fmt2 = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const datePov = this._el("date-pov");
      if (datePov) datePov.textContent = fmt2;
    },
    init() {
      if (this._initialized) return;
      this._initialized = true;
      this.rebuildStructure();
      this.renderAll();
    }
  };
  registerPage("Page25", Page25);

  // src/pages/page-2026.js
  var Page26 = {
    activeCity: "all",
    activeLang: "all",
    activeMonths: [],
    activePrivateType: "all",
    activeSharedType: "all",
    PRIVATE_TYPES: ["war PR", "food PR", "best", "old", "big"],
    SHARED_TYPES: ["war", "food", "best"],
    chartInstance: null,
    cityChartInstance: null,
    paidCityChartInstance: null,
    privatePaidChartInstance: null,
    sharedPaidChartInstance: null,
    _initialized: false,
    _el(id) {
      return document.getElementById(id + "-26");
    },
    getChartColors() {
      const c = getChartColors();
      return { ...c, accent: c.y26 };
    },
    _setActivePill(groupId, activeBtn) {
      const group = document.getElementById(groupId);
      if (!group) return;
      group.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      if (activeBtn) activeBtn.classList.add("active");
    },
    renderAll() {
      this.updateKPIs();
      this.updateChart();
      this.renderCityBars();
      this.renderMonthlyTable();
      this.updatePaidTypeCharts();
    },
    renderCityBars() {
      const colors = this.getChartColors();
      const lang = this.activeLang;
      const citiesToShow = this.activeCity === "all" ? CITIES : [this.activeCity];
      const freePaxByCity = {}, paidToursByCity = {};
      CITIES.forEach((c) => {
        const st = cityStats26[c]?.[lang];
        const fs = st ? filteredStats(st, this.activeMonths) : { freePax: 0, paidTours: 0 };
        freePaxByCity[c] = fs.freePax;
        paidToursByCity[c] = fs.paidTours;
      });
      const makeBar = (canvasId, instanceKey, dataArr, yLabel, tooltipLabel) => {
        try {
          if (this[instanceKey]) this[instanceKey].destroy();
          const ctx = document.getElementById(canvasId)?.getContext("2d");
          if (!ctx) return;
          this[instanceKey] = new Chart(ctx, {
            type: "bar",
            data: {
              labels: citiesToShow,
              datasets: [{ data: dataArr, backgroundColor: citiesToShow.map((c) => getCityColor(c)), borderRadius: 4 }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (i) => `${fmtN(i.raw)} ${tooltipLabel}` } } },
              scales: {
                x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
                y: { title: { display: true, text: yLabel, color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
              }
            }
          });
        } catch (e) {
          console.error(e);
        }
      };
      makeBar("cityChart-26", "cityChartInstance", citiesToShow.map((c) => freePaxByCity[c]), t("table.pax"), t("table.pax").toLowerCase());
      makeBar("paidCityChart-26", "paidCityChartInstance", citiesToShow.map((c) => paidToursByCity[c]), t("table.tours"), t("table.tours").toLowerCase());
    },
    renderMonthlyTable() {
      const lang = this.activeLang;
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const cutoffMonth = getCutoffMonth();
      const cutoffDay = parseInt(getGlobalDate().split("-")[2]);
      const months = this.activeMonths.length > 0 ? this.activeMonths : Array.from({ length: cutoffMonth }, (_, i) => i + 1);
      const citiesToShow = this.activeCity === "all" ? CITIES : [this.activeCity];
      const getCityPax = (city, m) => {
        const st = cityStats26[city]?.[lang];
        if (!st) return 0;
        if (m < cutoffMonth) return st.byMonth?.[String(m)]?.free?.pax || 0;
        if (m === cutoffMonth) {
          if (st.byDay) {
            let total = 0;
            for (let d = 1; d <= cutoffDay; d++) {
              total += st.byDay[`${m}-${d}`]?.free?.pax || 0;
            }
            return total;
          }
          return st.byMonth?.[String(m)]?.free?.pax || 0;
        }
        return 0;
      };
      const data = months.map((m) => {
        const isPartial = m === cutoffMonth && this.activeMonths.length === 0;
        const row = { m, isPartial };
        CITIES.forEach((city) => {
          row[city] = getCityPax(city, m);
        });
        return row;
      });
      const totals = {};
      CITIES.forEach((c) => {
        totals[c] = data.reduce((s, r) => s + r[c], 0);
      });
      const cityHeaders = citiesToShow.map(
        (c) => `<th class="mpax-city-head ${CITY_CLS[c]}">${c}</th>`
      ).join("");
      const bodyRows = data.map((row) => {
        const cells = citiesToShow.map((c) => `<td>${row[c] ? fmtN(row[c]) : "\u2014"}</td>`).join("");
        const rowTotal = citiesToShow.reduce((s, c) => s + (row[c] || 0), 0);
        const label = MONTH_NAMES[row.m] + (row.isPartial ? "<sup>*</sup>" : "");
        return `<tr><td class="mpax-month">${label}</td>${cells}<td><strong>${rowTotal ? fmtN(rowTotal) : "\u2014"}</strong></td></tr>`;
      }).join("");
      const totalCells = citiesToShow.map((c) => `<td>${fmtN(totals[c])}</td>`).join("");
      const overallTotal = citiesToShow.reduce((s, c) => s + totals[c], 0);
      const hasPartial = data.some((r) => r.isPartial);
      const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr("charts.freePaxByMonthAndCity26")}>${t("charts.freePaxByMonthAndCity26")}</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead><tr><th class="mpax-month-head">${t("table.month")}</th>${cityHeaders}<th class="mpax-city-head">${t("labels.total")}</th></tr></thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t("labels.total")}</td>${totalCells}<td><strong>${fmtN(overallTotal)}</strong></td></tr>
                </tbody>
            </table>
            </div>
            ${hasPartial ? `<div class="mpax-note">* ${t("labels.partial")} \u2014 data through ${getGlobalDate()}</div>` : ""}
        </div>`;
      const el = document.getElementById("monthly-pax-table-26");
      if (el) el.innerHTML = html;
    },
    _getTypeMonthData(types) {
      const lang = this.activeLang;
      const cutoffMonth = getCutoffMonth();
      const cutoffDay = parseInt(getGlobalDate().split("-")[2]);
      const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
      const fc = guideStats26.filter((g) => CITIES.includes(g.city) && (this.activeCity === "all" || g.city === this.activeCity));
      return Array.from({ length: maxMonth }, (_, i) => i + 1).map((mo) => {
        let tours = 0, pax = 0;
        if (mo < cutoffMonth) {
          fc.forEach((g) => {
            const bmt = g.stats[lang]?.byMonthType?.[String(mo)];
            if (!bmt) return;
            types.forEach((tp) => {
              const td = bmt[tp];
              if (td) {
                tours += td.tours || 0;
                pax += td.pax || 0;
              }
            });
          });
        } else if (mo === cutoffMonth) {
          for (let d = 1; d <= cutoffDay; d++) {
            const key = `${mo}-${d}`;
            fc.forEach((g) => {
              const bdt = g.stats[lang]?.byDayType?.[key];
              if (!bdt) return;
              types.forEach((tp) => {
                const td = bdt[tp];
                if (td) {
                  tours += td.tours || 0;
                  pax += td.pax || 0;
                }
              });
            });
          }
        }
        return { tours, pax };
      });
    },
    updatePaidTypeCharts() {
      const colors = this.getChartColors();
      const cutoffMonth = getCutoffMonth();
      const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const monthLabels = Array.from({ length: maxMonth }, (_, i) => MONTH_NAMES[i + 1]);
      const paxLabelPlugin = () => ({
        id: "paxLabel26",
        afterDraw(chart) {
          const ctx = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          ctx.save();
          ctx.font = "500 9px 'IBM Plex Sans',sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = colors.text3;
          const paxData = chart.data.datasets[0]._paxData || [];
          meta.data.forEach((bar, i) => {
            const val = paxData[i];
            if (!val) return;
            ctx.fillText(`${val}p`, bar.x, bar.y - 4);
          });
          ctx.restore();
        }
      });
      const buildChart = (canvasId, instanceKey, types) => {
        const data = this._getTypeMonthData(types);
        try {
          if (this[instanceKey]) this[instanceKey].destroy();
          const ctx = document.getElementById(canvasId)?.getContext("2d");
          if (!ctx) return;
          this[instanceKey] = new Chart(ctx, {
            type: "bar",
            data: {
              labels: monthLabels,
              datasets: [{
                data: data.map((d) => d.tours),
                _paxData: data.map((d) => d.pax),
                backgroundColor: colors.accent,
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: { top: 20 } },
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { afterLabel: (item) => {
                  const p = item.dataset._paxData?.[item.dataIndex];
                  return p ? `${t("table.pax")}: ${p}` : "";
                } } }
              },
              scales: {
                x: { ticks: { color: colors.text3, font: { size: 11 } }, grid: { color: colors.border } },
                y: { title: { display: true, text: t("table.tours"), color: colors.text3, font: { size: 10 } }, ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
              }
            },
            plugins: [paxLabelPlugin()]
          });
        } catch (e) {
          console.error(e);
        }
      };
      const buildTable = (containerId, types) => {
        const data = this._getTypeMonthData(types);
        const bodyRows = data.map((d, i) => {
          const avg = d.tours > 0 ? (d.pax / d.tours).toFixed(1) : "\u2014";
          return `<tr>
                    <td class="mpax-month">${MONTH_NAMES[i + 1]}</td>
                    <td>${d.tours || "\u2014"}</td><td>${d.pax || "\u2014"}</td><td>${avg}</td>
                </tr>`;
        }).join("");
        const totT = data.reduce((s, d) => s + d.tours, 0);
        const totP = data.reduce((s, d) => s + d.pax, 0);
        const html = `<div class="mpax-wrap" style="margin-top:16px">
                <table class="mpax-table">
                    <thead><tr>
                        <th class="mpax-month-head">${t("table.month")}</th>
                        <th class="mpax-metric-head">${t("table.tours")}</th>
                        <th class="mpax-metric-head">${t("table.pax")}</th>
                        <th class="mpax-metric-head">Avg ${t("table.pax")}</th>
                    </tr></thead>
                    <tbody>
                        ${bodyRows}
                        <tr class="mpax-total">
                            <td class="mpax-month">${t("labels.total")}</td>
                            <td>${totT || "\u2014"}</td><td>${totP || "\u2014"}</td>
                            <td>${totT > 0 ? (totP / totT).toFixed(1) : "\u2014"}</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = html;
      };
      const privateTypes = this.activePrivateType === "all" ? this.PRIVATE_TYPES : [this.activePrivateType];
      const sharedTypes = this.activeSharedType === "all" ? this.SHARED_TYPES : [this.activeSharedType];
      buildChart("privatePaidChart-26", "privatePaidChartInstance", privateTypes);
      buildTable("private-type-table-26", privateTypes);
      buildChart("sharedPaidChart-26", "sharedPaidChartInstance", sharedTypes);
      buildTable("shared-type-table-26", sharedTypes);
    },
    filterPrivateType(type, btn) {
      this.activePrivateType = type;
      this._setActivePill("private-type-pills-26", btn);
      this.updatePaidTypeCharts();
    },
    filterSharedType(type, btn) {
      this.activeSharedType = type;
      this._setActivePill("shared-type-pills-26", btn);
      this.updatePaidTypeCharts();
    },
    updateChart() {
      const colors = this.getChartColors();
      const cutoffMonth = getCutoffMonth();
      const cutoffDay = parseInt(getGlobalDate().split("-")[2]);
      const lang = this.activeLang;
      const months = Array.from({ length: cutoffMonth }, (_, i) => i + 1);
      const citiesToShow = this.activeCity === "all" ? CITIES : [this.activeCity];
      const datasets = citiesToShow.map((city) => {
        const guides = guideStats26.filter((g) => g.city === city);
        const data = months.map((m) => {
          let pax = 0, tours = 0;
          if (m < cutoffMonth) {
            guides.forEach((g) => {
              const bm = g.stats[lang]?.byMonth?.[String(m)];
              if (bm) {
                pax += bm.free.pax || 0;
                tours += bm.free.tours || 0;
              }
            });
          } else {
            for (let d = 1; d <= cutoffDay; d++) {
              const key = `${m}-${d}`;
              guides.forEach((g) => {
                const bd = g.stats[lang]?.byDay?.[key];
                if (bd) {
                  pax += bd.free.pax || 0;
                  tours += bd.free.tours || 0;
                }
              });
            }
          }
          return tours > 0 ? +(pax / tours).toFixed(1) : null;
        });
        const col = getCityColor(city);
        return { label: city, data, borderColor: col, backgroundColor: col + "18", borderWidth: 2, fill: false, tension: 0.3, pointRadius: 4, spanGaps: false };
      });
      const ctx = document.getElementById("avgFreePaxChart-26")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(ctx, {
        type: "line",
        data: { labels: months.map((m) => MONTH_NAMES_HR[m]), datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 12 } },
            tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${i.raw} ${t("table.pax")}/tour` } }
          },
          scales: {
            x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
            y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
          }
        }
      });
    },
    updateKPIs() {
      const citiesToSum = this.activeCity === "all" ? CITIES : [this.activeCity];
      const k = this.activeLang;
      let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
      citiesToSum.forEach((city) => {
        const st = cityStats26[city]?.[k];
        if (!st) return;
        const fs = filteredStats(st, this.activeMonths);
        freeTours += fs.freeTours;
        paidTours += fs.paidTours;
        freePax += fs.freePax;
        paidPax += fs.paidPax;
      });
      this._el("kv-free-tours").textContent = freeTours;
      this._el("kv-free").textContent = fmtN(freePax);
      this._el("kv-avg-pax").textContent = freeTours > 0 ? (freePax / freeTours).toFixed(1) : "\u2014";
      this._el("kv-paid").textContent = paidTours;
    },
    filterCity(city) {
      this.activeCity = city;
      document.querySelectorAll("#page-26 .city-filter-pill").forEach((p) => p.classList.toggle("active", p.dataset.city === city));
      this.renderAll();
    },
    filterLang(lang) {
      this.activeLang = lang;
      document.querySelectorAll("#page-26 .lang-pill").forEach((p) => p.classList.toggle("active", p.dataset.lang === lang));
      this.renderAll();
    },
    filterMonth(m) {
      this.activeMonths = m === "all" ? [] : [parseInt(m)];
      this.renderAll();
    },
    _buildHeader() {
      return `<div class="header">
            <div class="header-left">
                <h1>${t("table.tours")} <span class="accent">2026</span></h1>
                <p>Tour production by guide &middot; ${t("labels.freeTours")} vs. ${t("labels.paidTours")} &middot; <span class="ytd-range-label">${getRangeLabel()}</span></p>
            </div>
            <div class="header-right">
                <div id="date-pov-26" class="mb-6"></div>
                <div class="header-badge">${t("labels.travelYear2026")} &middot; ${t("labels.ytd")}</div>
            </div>
        </div>`;
    },
    _buildFilters() {
      const cityPills = ["all", ...CITIES].map((c) => {
        const col = getCityColor(c);
        const label = c === "all" ? t("labels.all") : c;
        const active = this.activeCity === c ? " active" : "";
        const style = col ? ` style="--city-col:${col}"` : "";
        return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="Page26.filterCity('${c}')">${label}</button>`;
      }).join("");
      return `<div class="main">
            <div class="filter-bar">
                <div class="city-pill-group">${cityPills}</div>
                <div class="filter-dropdowns">
                    <div class="city-pill-group lang-pill-group" id="lang-filter-26" role="group" aria-label="${t("labels.language")}">
                        ${[["all", t("labels.all")], ["eng", "ENG"], ["esp", "ESP"], ["fra", "FRA"]].map(([v, label]) => `<button class="city-filter-pill lang-pill${this.activeLang === v ? " active" : ""}" data-lang="${v}" onclick="Page26.filterLang('${v}')">${label}</button>`).join("")}
                    </div>
                    <div class="filter-field">
                        <label class="filter-label" for="month-filter-26">${t("labels.mo")}</label>
                        <select class="filter-select" id="month-filter-26" onchange="Page26.filterMonth(this.value)">
                            <option value="all">${t("labels.all")}</option>
                            ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].slice(0, getCutoffMonth()).map((n, i) => `<option value="${i + 1}">${n}</option>`).join("")}
                        </select>
                    </div>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.freeToursPaxCount")} YTD</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-free-26">\u2014</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.avgPaxPerFreeTour")}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-avg-pax-26">\u2014</div></div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.totalFreeTours")}</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-free-tours-26">\u2014</div></div>
                    </div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t("labels.paidToursCount")} YTD</div>
                    <div class="kpi-2y">
                        <div><div class="kpi-2y-label">2026</div><div class="kpi-2y-val" id="kv-paid-26">\u2014</div></div>
                    </div>
                </div>
            </div>`;
    },
    _buildFreeTours() {
      return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('free-section-body-26')">
                <span>${t("sections.freeTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </button>
            <div id="free-section-body-26" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.freePaxByCity26")}>${t("charts.freePaxByCity26")}</div>
                        <div class="chart-container"><canvas id="cityChart-26"></canvas></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.avgPaxPerTourMonth26")}>${t("charts.avgPaxPerTourMonth26")}</div>
                        <div class="chart-container"><canvas id="avgFreePaxChart-26"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div id="monthly-pax-table-26"></div>
                </div>
            </div>`;
    },
    _buildPaidTours() {
      return `<button type="button" class="section-divider" aria-expanded="true" onclick="toggleSection('paid-section-body-26')">
                <span>${t("sections.paidTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </button>
            <div id="paid-section-body-26" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.paidToursByCity26")}>${t("charts.paidToursByCity26")}</div>
                        <div class="chart-container"><canvas id="paidCityChart-26"></canvas></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.privatePaidTours26")}>${t("charts.privatePaidTours26")}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.type")}</span>
                                <div id="private-type-pills-26" class="pill-group">
                                    <button class="pill active" onclick="Page26.filterPrivateType('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('best',this)">best</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('old',this)">old</button>
                                    <button class="pill" onclick="Page26.filterPrivateType('big',this)">big</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="privatePaidChart-26"></canvas></div>
                        <div id="private-type-table-26"></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.sharedPaidTours26")}>${t("charts.sharedPaidTours26")}</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.type")}</span>
                                <div id="shared-type-pills-26" class="pill-group">
                                    <button class="pill active" onclick="Page26.filterSharedType('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="Page26.filterSharedType('war',this)">war</button>
                                    <button class="pill" onclick="Page26.filterSharedType('food',this)">food</button>
                                    <button class="pill" onclick="Page26.filterSharedType('best',this)">best</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container"><canvas id="sharedPaidChart-26"></canvas></div>
                        <div id="shared-type-table-26"></div>
                    </div>
                </div>
            </div>`;
    },
    _destroyCharts() {
      [
        this.chartInstance,
        this.cityChartInstance,
        this.paidCityChartInstance,
        this.privatePaidChartInstance,
        this.sharedPaidChartInstance
      ].forEach((chart) => {
        if (chart) try {
          chart.destroy();
        } catch (e) {
        }
      });
      this.chartInstance = null;
      this.cityChartInstance = null;
      this.paidCityChartInstance = null;
      this.privatePaidChartInstance = null;
      this.sharedPaidChartInstance = null;
    },
    rebuildStructure() {
      this._destroyCharts();
      document.getElementById("page-26").innerHTML = this._buildHeader() + this._buildFilters() + this._buildFreeTours() + this._buildPaidTours() + "</div>";
      const d = new Date(getGlobalDate());
      const fmt2 = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const datePov = this._el("date-pov");
      if (datePov) datePov.textContent = fmt2;
    },
    init() {
      if (this._initialized) return;
      this._initialized = true;
      this.rebuildStructure();
      this.renderAll();
    }
  };
  registerPage("Page26", Page26);

  // src/pages/page-cmp/takeaway.js
  function change(v25, v26) {
    const pct = Math.round(Math.abs(v26 - v25) / v25 * 100);
    if (pct === 0) return "flat";
    return `${pct}% ${v26 > v25 ? "up" : "down"}`;
  }
  function comparisonTakeaway({ fp25, fp26, ft25, ft26 }) {
    if (fp25 === 0 || ft25 === 0 || ft26 === 0) {
      return `Free pax are ${fmtN(fp26)} vs ${fmtN(fp25)} in 2025.`;
    }
    const avg25 = fp25 / ft25, avg26 = fp26 / ft26;
    return `Free pax are ${change(fp25, fp26)} on 2025 (${fmtN(fp26)} vs ${fmtN(fp25)}): tours are ${change(ft25, ft26)}, average group size is ${change(avg25, avg26)} (${avg26.toFixed(1)} vs ${avg25.toFixed(1)}).`;
  }

  // src/pages/page-cmp/charts.js
  function axisDefaults() {
    const s = getComputedStyle(document.body);
    return {
      ticks: { color: s.getPropertyValue("--text2").trim(), font: { family: "IBM Plex Sans", size: 11 } },
      grid: { color: s.getPropertyValue("--border").trim() }
    };
  }
  function tooltipDefaults() {
    const s = getComputedStyle(document.body);
    return {
      backgroundColor: s.getPropertyValue("--card-bg").trim(),
      titleColor: s.getPropertyValue("--text").trim(),
      bodyColor: s.getPropertyValue("--text2").trim(),
      footerColor: s.getPropertyValue("--text2").trim(),
      borderColor: s.getPropertyValue("--border-dark").trim(),
      borderWidth: 1
    };
  }
  function yearDeltaFooter(items) {
    if (!items || items.length < 2) return "";
    const v25 = items.find((i) => /2025/.test(i.label))?.value;
    const v26 = items.find((i) => /2026/.test(i.label))?.value;
    if (v25 == null || v26 == null) return "";
    const delta = v26 - v25;
    const sign = delta >= 0 ? "+" : "";
    const pct = v25 !== 0 ? ` (${sign}${Math.round(delta / v25 * 100)}%)` : "";
    return `2026 vs 2025: ${sign}${delta.toLocaleString("en-GB")}${pct}`;
  }
  function footerCallback(tooltipItems) {
    return yearDeltaFooter(tooltipItems.map((ti) => ({ label: ti.dataset.label, value: ti.raw })));
  }
  function createFreePaxCityChart(ctx, cityLabels, cityData25, cityData26, cityDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: cityLabels,
        datasets: [
          { label: `${rangeLabel} 2025`, data: cityLabels.map((c) => cityData25[c]), backgroundColor: cityLabels.map((c) => getCityColor(c) + "80"), borderRadius: 4 },
          { label: `${rangeLabel} 2026`, data: cityLabels.map((c) => cityData26[c]), backgroundColor: cityLabels.map((c) => getCityColor(c)), borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 45, right: 55 } },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { footer: footerCallback } }
        },
        scales: {
          x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
          y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
        }
      },
      plugins: [cityDeltaPlugin]
    });
  }
  function createPaidCityChart(ctx, cityLabels, paidCityData25, paidCityData26, cityDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: cityLabels,
        datasets: [
          { label: `${rangeLabel} 2025`, data: cityLabels.map((c) => paidCityData25[c]), backgroundColor: cityLabels.map((c) => getCityColor(c) + "80"), borderRadius: 4 },
          { label: `${rangeLabel} 2026`, data: cityLabels.map((c) => paidCityData26[c]), backgroundColor: cityLabels.map((c) => getCityColor(c)), borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 45, right: 55 } },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { footer: footerCallback } }
        },
        scales: {
          x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
          y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
        }
      },
      plugins: [cityDeltaPlugin]
    });
  }
  function createMonthlyFreePaxChart(ctx, months, cumMonthData25, cumMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: `${rangeLabel} 2025`, data: cumMonthData25, borderColor: colors.y25, backgroundColor: colors.y25 + "33", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 },
          { label: `${rangeLabel} 2026`, data: cumMonthData26, borderColor: colors.y26, backgroundColor: colors.y26 + "33", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 45, right: 55 } },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { footer: footerCallback } }
        },
        scales: {
          x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
          y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
        }
      },
      plugins: [deltaOverlay, monthDeltaPlugin]
    });
  }
  function createMonthlyPaidChart(ctx, months, cumPaidMonthData25, cumPaidMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: `${rangeLabel} 2025`, data: cumPaidMonthData25, borderColor: colors.y25, backgroundColor: colors.y25 + "33", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 },
          { label: `${rangeLabel} 2026`, data: cumPaidMonthData26, borderColor: colors.y26, backgroundColor: colors.y26 + "33", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 45, right: 55 } },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { footer: footerCallback } }
        },
        scales: {
          x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
          y: { ticks: { color: colors.text3 }, grid: { color: colors.border } }
        }
      },
      plugins: [deltaOverlay, monthDeltaPlugin]
    });
  }
  function createCityMonthlyChart(ctx, months, datasets, colors) {
    return new Chart(ctx, {
      type: "line",
      data: { labels: months, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: colors.text,
              font: { size: 10, family: "'IBM Plex Sans',sans-serif" },
              boxWidth: 12,
              padding: 12,
              filter: (item) => !item.text.includes("2025")
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
  function createAvgFreePaxChart(ctx, months, avgFree25, avgFree26, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: `${rangeLabel} 2025`, data: avgFree25, borderColor: colors.y25, backgroundColor: colors.y25 + "22", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
          { label: `${rangeLabel} 2026`, data: avgFree26, borderColor: colors.y26, backgroundColor: colors.y26 + "22", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${i.raw} PAX/tour`, footer: footerCallback } }
        },
        scales: {
          x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
          y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
        }
      }
    });
  }
  function createPaidTypeChart(ctx, months, ds25, ds26, colors, secondaryLabelPlugin, yLabel) {
    return new Chart(ctx, {
      type: "bar",
      data: { labels: months, datasets: [ds25, ds26] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20, bottom: 30 } },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: {
            callbacks: {
              afterLabel: (item) => {
                const sec = item.datasetIndex === 0 ? ds25._secondaryData[item.dataIndex] : ds26._secondaryData[item.dataIndex];
                return sec ? `${item.datasetIndex === 0 ? ds25._secondaryKey || "pax" : (ds26._secondaryKey || "pax") === "pax" ? "PAX" : "Tours"}: ${sec}` : "";
              },
              footer: footerCallback
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
  function createWarAvgChart(ctx, months, getTypeAvg25, getTypeAvg26, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: `${rangeLabel} 2025`, data: getTypeAvg25, borderColor: colors.y25, backgroundColor: colors.y25 + "22", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false },
          { label: `${rangeLabel} 2026`, data: getTypeAvg26, borderColor: colors.y26, backgroundColor: colors.y26 + "22", borderWidth: 2, fill: true, tension: 0.3, pointRadius: 4, spanGaps: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${i.raw} PAX/tour`, footer: footerCallback } }
        },
        scales: {
          x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
          y: { ticks: { color: colors.text3 }, grid: { color: colors.border }, beginAtZero: true }
        }
      }
    });
  }
  function updateChartColors(chartInstances) {
    const ax = axisDefaults();
    const tt = tooltipDefaults();
    chartInstances.forEach((c) => {
      if (!c) return;
      if (c.options.scales) {
        Object.values(c.options.scales).forEach((sc) => {
          if (sc.ticks) sc.ticks.color = ax.ticks.color;
          if (sc.grid) sc.grid.color = ax.grid.color;
        });
      }
      if (c.options.plugins?.tooltip) Object.assign(c.options.plugins.tooltip, tt);
      if (c.options.plugins?.legend?.labels) c.options.plugins.legend.labels.color = ax.ticks.color;
      c.update();
    });
  }
  function createGuideTrendChart(ctx, months, pax25, pax26, colors) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          { label: "2025", data: pax25, borderColor: colors.y25, backgroundColor: colors.y25 + "33", borderWidth: 2, tension: 0.3, pointRadius: 3 },
          { label: "2026", data: pax26, borderColor: colors.y26, backgroundColor: colors.y26 + "33", borderWidth: 2, tension: 0.3, pointRadius: 3, spanGaps: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'IBM Plex Sans',sans-serif" }, boxWidth: 12, padding: 16 } }
        },
        scales: {
          x: { ticks: { color: colors.text3 }, grid: { color: colors.border } },
          y: { beginAtZero: true, ticks: { color: colors.text3 }, grid: { color: colors.border } }
        }
      }
    });
  }

  // src/pages/page-cmp/index.js
  var PageCmp = {
    activeCity: "all",
    activeLang: "all",
    activeMonths: [],
    mergedGuides: [],
    cityChartInstance: null,
    paidCityChartInstance: null,
    monthlyChartInstance: null,
    paidChartInstance: null,
    cityMonthlyChartInstance: null,
    privatePaidChartInstance: null,
    sharedPaidChartInstance: null,
    warAvgChartInstance: null,
    avgFreePaxCmpChartInstance: null,
    activeAvgType: "all",
    ALL_PAID_TYPES: ["war", "food", "best", "war PR", "food PR", "old", "big", "food kuoni"],
    activePrivateCity: "all",
    activePrivateType: "all",
    activeSharedCity: "all",
    activeSharedType: "all",
    PRIVATE_TYPES: ["war PR", "food PR", "best", "old", "big", "food kuoni"],
    SHARED_TYPES: ["war", "food", "best"],
    _initialized: false,
    _el(id) {
      return document.getElementById(id + "-cmp");
    },
    fmtDelta(v25, v26) {
      if (v25 === 0 && v26 === 0) return '<span class="dash">\u2014</span>';
      if (v25 === 0) return '<span class="delta pos">NEW</span>';
      const d = v26 - v25;
      const p = (d / v25 * 100).toFixed(0);
      const sym = d > 0 ? "\u25B2" : d < 0 ? "\u25BC" : "=";
      const cls = d > 0 ? "pos" : d < 0 ? "neg" : "neu";
      const sign = d > 0 ? "+" : "";
      return `<span class="delta ${cls}">${sym}${Math.abs(d)} (${sign}${p}%)</span>`;
    },
    buildMerged() {
      const map = {};
      guideStats25.forEach((g) => {
        map[g.name] = { name: g.name, city: g.city, g25: g, g26: null };
      });
      guideStats26.forEach((g) => {
        if (map[g.name]) {
          map[g.name].g26 = g;
        } else {
          map[g.name] = { name: g.name, city: g.city, g25: null, g26: g };
        }
      });
      const result = Object.values(map);
      result.sort((a, b) => {
        if (a.city !== b.city) return CITIES.indexOf(a.city) - CITIES.indexOf(b.city);
        const a26 = a.g26 ? filteredStats(a.g26.stats[this.activeLang], this.activeMonths).freeTours : -1;
        const b26 = b.g26 ? filteredStats(b.g26.stats[this.activeLang], this.activeMonths).freeTours : -1;
        if (a26 >= 0 && b26 < 0) return -1;
        if (a26 < 0 && b26 >= 0) return 1;
        if (a26 >= 0 && b26 >= 0) return b26 - a26;
        const a25 = a.g25 ? filteredStats(a.g25.stats[this.activeLang], this.activeMonths).freeTours : -1;
        const b25 = b.g25 ? filteredStats(b.g25.stats[this.activeLang], this.activeMonths).freeTours : -1;
        return b25 - a25;
      });
      return result;
    },
    renderAll() {
      this.updateKPIs();
      this.renderMonthlyTable();
      setTimeout(() => this.updateCharts(), 100);
    },
    updateKPIs() {
      const citiesToSum = this.activeCity === "all" ? CITIES : [this.activeCity];
      let pt25 = 0, pt26 = 0, fp25 = 0, fp26 = 0, ft25 = 0, ft26 = 0;
      citiesToSum.forEach((city) => {
        const st25 = cityStats25[city]?.[this.activeLang];
        const st26 = cityStats26[city]?.[this.activeLang];
        if (st25) {
          const s25 = filteredStats(st25, this.activeMonths);
          fp25 += s25.freePax;
          pt25 += s25.paidTours;
          ft25 += s25.freeTours;
        }
        if (st26) {
          const s26 = filteredStats(st26, this.activeMonths);
          fp26 += s26.freePax;
          pt26 += s26.paidTours;
          ft26 += s26.freeTours;
        }
      });
      const setDelta = (absId, pctId, v25, v26, fmt2) => {
        const diff = v26 - v25;
        const cls = diff >= 0 ? "pos" : "neg";
        const pct = v25 === 0 ? "\u2014" : (diff >= 0 ? "+" : "-") + Math.abs(Math.round(diff / v25 * 100)) + "%";
        this._el(absId).innerHTML = `<span class="${cls}">${fmt2(Math.abs(diff))}</span>`;
        this._el(pctId).innerHTML = `<span class="${cls}">${pct}</span>`;
      };
      this._el("takeaway").textContent = comparisonTakeaway({ fp25, fp26, ft25, ft26 });
      setDelta("kd-free-abs", "kd-free-pct", fp25, fp26, fmtN);
      setDelta("kd-paid-abs", "kd-paid-pct", pt25, pt26, (v) => v);
      setDelta("kd-free-tours-abs", "kd-free-tours-pct", ft25, ft26, fmtN);
      this._el("kv-free25").textContent = fmtN(fp25);
      this._el("kv-free26").textContent = fmtN(fp26);
      this._el("kv-paid25").textContent = pt25;
      this._el("kv-paid26").textContent = pt26;
      this._el("kv-free-tours25").textContent = fmtN(ft25);
      this._el("kv-free-tours26").textContent = fmtN(ft26);
      const avg25 = ft25 > 0 ? (fp25 / ft25).toFixed(1) : "\u2014";
      const avg26 = ft26 > 0 ? (fp26 / ft26).toFixed(1) : "\u2014";
      this._el("kv-avg-pax25").textContent = avg25;
      this._el("kv-avg-pax26").textContent = avg26;
      setDelta("kd-avg-pax-abs", "kd-avg-pax-pct", ft25 > 0 ? fp25 / ft25 : 0, ft26 > 0 ? fp26 / ft26 : 0, (v) => v.toFixed(1));
    },
    getChartColors() {
      return getChartColors();
    },
    updateCharts() {
      const self = this;
      const fc = this.mergedGuides.filter((m) => CITIES.includes(m.city) && (this.activeCity === "all" || m.city === this.activeCity));
      const colors = this.getChartColors();
      const rangeLabel = getRangeLabel();
      const cityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      const cityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      const paidCityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      const paidCityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      CITIES.forEach((city) => {
        if (this.activeCity !== "all" && this.activeCity !== city) return;
        const st25 = cityStats25[city]?.[this.activeLang];
        const st26 = cityStats26[city]?.[this.activeLang];
        const s25 = st25 ? filteredStats(st25, this.activeMonths) : null;
        const s26 = st26 ? filteredStats(st26, this.activeMonths) : null;
        if (s25) {
          cityData25[city] = s25.freePax;
          paidCityData25[city] = s25.paidTours;
        }
        if (s26) {
          cityData26[city] = s26.freePax;
          paidCityData26[city] = s26.paidTours;
        }
      });
      const cityDeltaPlugin = {
        id: "cityDelta",
        afterDraw(chart) {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const ds0 = chart.data.datasets[0].data;
          const ds1 = chart.data.datasets[1].data;
          const chartColors = self.getChartColors();
          ctx.save();
          chart.data.labels.forEach((_, i) => {
            const v25 = ds0[i] || 0, v26 = ds1[i] || 0;
            const d = v26 - v25;
            const pct = v25 > 0 ? (d / v25 * 100).toFixed(0) : v26 > 0 ? "\u221E" : "0";
            const sign = d > 0 ? "+" : "";
            const arrow = d > 0 ? "\u25B2" : d < 0 ? "\u25BC" : "=";
            const color = d > 0 ? "#1D9E75" : d < 0 ? "#D4545A" : "#999";
            const x = xAxis.getPixelForValue(i);
            const y = xAxis.bottom + 12;
            ctx.fillStyle = chartColors.text3;
            ctx.font = "500 10px 'IBM Plex Sans',sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${fmtN(v25)} / ${fmtN(v26)}`, x, y);
            ctx.fillStyle = color;
            ctx.font = "bold 10px 'IBM Plex Sans',sans-serif";
            ctx.fillText(`${arrow} ${fmtN(Math.abs(d))} (${sign}${pct}%)`, x, y + 13);
          });
          ctx.restore();
        }
      };
      try {
        if (this.cityChartInstance) this.cityChartInstance.destroy();
        const cityCtx = this._el("cityChart").getContext("2d");
        this.cityChartInstance = createFreePaxCityChart(cityCtx, CITIES, cityData25, cityData26, cityDeltaPlugin, colors, rangeLabel);
      } catch (e) {
        console.error("City Chart Error:", e);
      }
      try {
        if (this.paidCityChartInstance) this.paidCityChartInstance.destroy();
        const paidCityCtx = this._el("paidCityChart").getContext("2d");
        this.paidCityChartInstance = createPaidCityChart(paidCityCtx, CITIES, paidCityData25, paidCityData26, cityDeltaPlugin, colors, rangeLabel);
      } catch (e) {
        console.error("Paid City Chart Error:", e);
      }
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : getCutoffMonth();
      const selectedMonths = Array.from({ length: maxMonth }, (_, i) => i + 1);
      const months = selectedMonths.map((m) => MONTH_NAMES[m]);
      const effectiveLabel = maxMonth === 1 ? MONTH_NAMES[1] : `${MONTH_NAMES[1]}\u2013${MONTH_NAMES[maxMonth]}`;
      document.querySelectorAll("#page-cmp .ytd-range-label").forEach((el) => el.textContent = effectiveLabel);
      const monthData25 = [], monthData26 = [];
      const paidMonthData25 = [], paidMonthData26 = [];
      const cutoffMonth = getCutoffMonth();
      const cutoffDay = parseInt(getGlobalDate().split("-")[2]);
      selectedMonths.forEach((i) => {
        let fd25 = 0, fd26 = 0, pd25 = 0, pd26 = 0;
        if (i < cutoffMonth) {
          fc.forEach((m) => {
            const mo25 = m.g25?.stats[this.activeLang]?.byMonth?.[String(i)];
            if (mo25) {
              fd25 += mo25.free.pax || 0;
              pd25 += mo25.paid.tours || 0;
            }
            const mo26 = m.g26?.stats[this.activeLang]?.byMonth?.[String(i)];
            if (mo26) {
              fd26 += mo26.free.pax || 0;
              pd26 += mo26.paid.tours || 0;
            }
          });
        } else if (i === cutoffMonth) {
          for (let d = 1; d <= cutoffDay; d++) {
            const key = `${i}-${d}`;
            fc.forEach((m) => {
              const bd25 = m.g25?.stats[this.activeLang]?.byDay?.[key];
              if (bd25) {
                fd25 += bd25.free.pax || 0;
                pd25 += bd25.paid.tours || 0;
              }
              const bd26 = m.g26?.stats[this.activeLang]?.byDay?.[key];
              if (bd26) {
                fd26 += bd26.free.pax || 0;
                pd26 += bd26.paid.tours || 0;
              }
            });
          }
        }
        monthData25.push(fd25);
        monthData26.push(fd26);
        paidMonthData25.push(pd25);
        paidMonthData26.push(pd26);
      });
      const cumulative = (arr) => arr.reduce((acc, val, i) => {
        acc[i] = (acc[i - 1] || 0) + val;
        return acc;
      }, []);
      const cumMonthData25 = cumulative(monthData25);
      const cumMonthData26 = cumulative(monthData26);
      const cumPaidMonthData25 = cumulative(paidMonthData25);
      const cumPaidMonthData26 = cumulative(paidMonthData26);
      const deltaOverlay = {
        id: "deltaOverlay",
        afterDraw(chart) {
          const ctx = chart.ctx;
          const { right, top } = chart.chartArea;
          const ds0 = chart.data.datasets[0].data;
          const ds1 = chart.data.datasets[1].data;
          const last0 = ds0[ds0.length - 1] || 0;
          const last1 = ds1[ds1.length - 1] || 0;
          if (last0 === 0 && last1 === 0) return;
          const d = last1 - last0;
          const pct = last0 > 0 ? (d / last0 * 100).toFixed(0) : last1 > 0 ? "\u221E" : "0";
          const sign = d >= 0 ? "+" : "";
          const arrow = d > 0 ? "\u25B2" : d < 0 ? "\u25BC" : "=";
          const color = d > 0 ? "#1D9E75" : d < 0 ? "#D4545A" : "#999";
          ctx.save();
          ctx.fillStyle = color;
          ctx.font = "bold 11px 'IBM Plex Sans',sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(`${arrow} ${fmtN(Math.abs(d))} (${sign}${pct}%)`, right - 8, top + 18);
          ctx.restore();
        }
      };
      const monthDeltaPlugin = {
        id: "monthDelta",
        afterDraw(chart) {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const ds0 = chart.data.datasets[0].data;
          const ds1 = chart.data.datasets[1].data;
          const chartColors = self.getChartColors();
          ctx.save();
          chart.data.labels.forEach((_, i) => {
            const v25 = ds0[i] || 0, v26 = ds1[i] || 0;
            const d = v26 - v25;
            const pct = v25 > 0 ? (d / v25 * 100).toFixed(0) : v26 > 0 ? "\u221E" : "0";
            const sign = d > 0 ? "+" : "";
            const arrow = d > 0 ? "\u25B2" : d < 0 ? "\u25BC" : "=";
            const color = d > 0 ? "#1D9E75" : d < 0 ? "#D4545A" : "#999";
            const x = xAxis.getPixelForValue(i);
            const y = xAxis.bottom + 12;
            ctx.fillStyle = chartColors.text3;
            ctx.font = "500 10px 'IBM Plex Sans',sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${fmtN(v25)} / ${fmtN(v26)}`, x, y);
            ctx.fillStyle = color;
            ctx.font = "bold 10px 'IBM Plex Sans',sans-serif";
            ctx.fillText(`${arrow} ${fmtN(Math.abs(d))} (${sign}${pct}%)`, x, y + 13);
          });
          ctx.restore();
        }
      };
      try {
        if (this.monthlyChartInstance) this.monthlyChartInstance.destroy();
        const monthCtx = this._el("monthlyChart").getContext("2d");
        this.monthlyChartInstance = createMonthlyFreePaxChart(monthCtx, months, cumMonthData25, cumMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel);
      } catch (e) {
        console.error("Monthly Chart Error:", e);
      }
      try {
        if (this.paidChartInstance) this.paidChartInstance.destroy();
        const paidCtx = this._el("paidChart").getContext("2d");
        this.paidChartInstance = createMonthlyPaidChart(paidCtx, months, cumPaidMonthData25, cumPaidMonthData26, deltaOverlay, monthDeltaPlugin, colors, rangeLabel);
      } catch (e) {
        console.error("Paid Chart Error:", e);
      }
      try {
        const cutoffDay2 = parseInt(getGlobalDate().split("-")[2]);
        const cityMonthly25 = {};
        const cityMonthly26 = {};
        CITIES.forEach((c) => {
          cityMonthly25[c] = [];
          cityMonthly26[c] = [];
        });
        selectedMonths.forEach((i) => {
          CITIES.forEach((city) => {
            let pax25 = 0, pax26 = 0;
            const st25 = cityStats25[city]?.[this.activeLang];
            const st26 = cityStats26[city]?.[this.activeLang];
            if (i < cutoffMonth) {
              const b25 = st25?.byMonth[String(i)];
              const b26 = st26?.byMonth[String(i)];
              if (b25) pax25 += b25.free?.pax || 0;
              if (b26) pax26 += b26.free?.pax || 0;
            } else {
              for (let d = 1; d <= cutoffDay2; d++) {
                const key = `${i}-${d}`;
                const d25 = st25?.byDay?.[key];
                const d26 = st26?.byDay?.[key];
                if (d25) pax25 += d25.free?.pax || 0;
                if (d26) pax26 += d26.free?.pax || 0;
              }
            }
            cityMonthly25[city].push(pax25);
            cityMonthly26[city].push(pax26);
          });
        });
        const cityColors = { Zagreb: "#8FA8BC", Dubrovnik: "#C49A8A", Split: "#9BB09B", Zadar: "#C4B48A" };
        const datasets = [];
        CITIES.forEach((city) => {
          const col = cityColors[city];
          datasets.push({
            label: `${city} 2025`,
            data: cumulative(cityMonthly25[city]),
            borderColor: col + "80",
            backgroundColor: "transparent",
            borderDash: [5, 5],
            borderWidth: 1.5,
            tension: 0.3,
            fill: false,
            pointRadius: 3,
            pointBackgroundColor: col + "80"
          });
          datasets.push({
            label: city,
            data: cumulative(cityMonthly26[city]),
            borderColor: col,
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: 3,
            pointBackgroundColor: col
          });
        });
        const badgesEl = document.getElementById("city-monthly-badges-cmp");
        if (badgesEl) {
          badgesEl.innerHTML = CITIES.map((city) => {
            const last25 = cumulative(cityMonthly25[city]).slice(-1)[0] || 0;
            const last26 = cumulative(cityMonthly26[city]).slice(-1)[0] || 0;
            const diff = last26 - last25;
            const pct = last25 > 0 ? Math.round(diff / last25 * 100) : last26 > 0 ? Infinity : 0;
            const cls = diff > 0 ? "pos" : diff < 0 ? "neg" : "neu";
            const arrow = diff > 0 ? "\u25B2" : diff < 0 ? "\u25BC" : "=";
            const sign = diff >= 0 ? "+" : "";
            const pctStr = pct === Infinity ? "+\u221E%" : `${sign}${pct}%`;
            const col = cityColors[city];
            return `<span class="city-monthly-badge" style="border-color:${col}"><span class="cmb-name" style="color:${col}">${city}</span><span class="cmb-delta ${cls}">${arrow} ${pctStr}</span></span>`;
          }).join("");
        }
        if (this.cityMonthlyChartInstance) this.cityMonthlyChartInstance.destroy();
        const cmCtx = this._el("cityMonthlyChart").getContext("2d");
        this.cityMonthlyChartInstance = createCityMonthlyChart(cmCtx, months, datasets, colors);
      } catch (e) {
        console.error("City Monthly Chart Error:", e);
      }
      try {
        const avgFree25 = [], avgFree26 = [];
        selectedMonths.forEach((i) => {
          let pax25 = 0, t25 = 0, pax26 = 0, t26 = 0;
          if (i < cutoffMonth) {
            fc.forEach((m) => {
              const b25 = m.g25?.stats[this.activeLang]?.byMonth?.[String(i)];
              if (b25) {
                pax25 += b25.free.pax || 0;
                t25 += b25.free.tours || 0;
              }
              const b26 = m.g26?.stats[this.activeLang]?.byMonth?.[String(i)];
              if (b26) {
                pax26 += b26.free.pax || 0;
                t26 += b26.free.tours || 0;
              }
            });
          } else if (i === cutoffMonth) {
            for (let d = 1; d <= cutoffDay; d++) {
              const key = `${i}-${d}`;
              fc.forEach((m) => {
                const d25 = m.g25?.stats[this.activeLang]?.byDay?.[key];
                if (d25) {
                  pax25 += d25.free.pax || 0;
                  t25 += d25.free.tours || 0;
                }
                const d26 = m.g26?.stats[this.activeLang]?.byDay?.[key];
                if (d26) {
                  pax26 += d26.free.pax || 0;
                  t26 += d26.free.tours || 0;
                }
              });
            }
          }
          avgFree25.push(t25 > 0 ? +(pax25 / t25).toFixed(1) : null);
          avgFree26.push(t26 > 0 ? +(pax26 / t26).toFixed(1) : null);
        });
        if (this.avgFreePaxCmpChartInstance) this.avgFreePaxCmpChartInstance.destroy();
        const afCtx = document.getElementById("avgFreePaxCmpChart-cmp")?.getContext("2d");
        if (afCtx) {
          this.avgFreePaxCmpChartInstance = createAvgFreePaxChart(afCtx, months, avgFree25, avgFree26, colors, rangeLabel);
        }
      } catch (e) {
        console.error("Avg free PAX cmp chart error:", e);
      }
      this.updatePaidTypeCharts();
      updateChartColors([
        this.cityChartInstance,
        this.paidCityChartInstance,
        this.monthlyChartInstance,
        this.paidChartInstance,
        this.cityMonthlyChartInstance,
        this.avgFreePaxCmpChartInstance,
        this.privatePaidChartInstance,
        this.sharedPaidChartInstance,
        this.warAvgChartInstance
      ]);
    },
    renderMonthlyTable() {
      const cutoffMonth = getCutoffMonth();
      const cutoffDay = parseInt(getGlobalDate().split("-")[2]);
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const months = this.activeMonths.length > 0 ? this.activeMonths : Array.from({ length: cutoffMonth }, (_, i) => i + 1);
      const getCityPax = (st, m) => {
        if (!st) return 0;
        if (m < cutoffMonth) {
          return st.byMonth?.[String(m)]?.free?.pax || 0;
        } else if (m === cutoffMonth) {
          if (st.byDay) {
            let tot = 0;
            for (let d = 1; d <= cutoffDay; d++) {
              const dy = st.byDay[`${m}-${d}`];
              if (dy) tot += dy.free?.pax || 0;
            }
            return tot;
          }
          return st.byMonth?.[String(m)]?.free?.pax || 0;
        }
        return 0;
      };
      const data = months.map((m) => {
        const isPartial = m === cutoffMonth && this.activeMonths.length === 0;
        const row = { m, isPartial };
        CITIES.forEach((city) => {
          const p25 = getCityPax(cityStats25[city]?.[this.activeLang], m);
          const p26 = getCityPax(cityStats26[city]?.[this.activeLang], m);
          row[city] = { p25, p26 };
        });
        return row;
      });
      const totals = {};
      CITIES.forEach((city) => {
        totals[city] = data.reduce((acc, r) => ({ p25: acc.p25 + r[city].p25, p26: acc.p26 + r[city].p26 }), { p25: 0, p26: 0 });
      });
      const fmtDelta = (p25, p26) => {
        const diff = p26 - p25;
        if (p25 === 0 && p26 === 0) return { d: '<span class="neu">\u2014</span>', p: '<span class="neu">\u2014</span>' };
        const cls = diff > 0 ? "pos" : diff < 0 ? "neg" : "neu";
        const sign = diff > 0 ? "+" : "";
        const pct = p25 > 0 ? Math.round(diff / p25 * 100) : diff > 0 ? "\u221E" : 0;
        return {
          d: `<span class="${cls}">${sign}${fmtN(diff)}</span>`,
          p: `<span class="${cls}">${sign}${pct}%</span>`
        };
      };
      const cityHeaders = CITIES.map(
        (c) => `<th colspan="4" class="mpax-city-head ${CITY_CLS[c]}">${c}</th>`
      ).join("");
      const subHeaders = CITIES.map(
        () => `<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">\xB1</th><th class="mpax-sub-head">\xB1%</th>`
      ).join("");
      const bodyRows = data.map((row) => {
        const cells = CITIES.map((city) => {
          const { p25, p26 } = row[city];
          const { d, p } = fmtDelta(p25, p26);
          return `<td>${p25 ? fmtN(p25) : "\u2014"}</td><td>${p26 ? fmtN(p26) : "\u2014"}</td><td>${d}</td><td>${p}</td>`;
        }).join("");
        const rowTotal25 = CITIES.reduce((s, c) => s + row[c].p25, 0);
        const rowTotal26 = CITIES.reduce((s, c) => s + row[c].p26, 0);
        const { d: td, p: tp } = fmtDelta(rowTotal25, rowTotal26);
        return `<tr><td class="mpax-month">${MONTH_NAMES[row.m]}${row.isPartial ? "<sup>*</sup>" : ""}</td>${cells}<td><strong>${rowTotal25 ? fmtN(rowTotal25) : "\u2014"}</strong></td><td><strong>${rowTotal26 ? fmtN(rowTotal26) : "\u2014"}</strong></td><td>${td}</td><td>${tp}</td></tr>`;
      }).join("");
      const totalCells = CITIES.map((city) => {
        const { p25, p26 } = totals[city];
        const { d, p } = fmtDelta(p25, p26);
        return `<td>${fmtN(p25)}</td><td>${fmtN(p26)}</td><td>${d}</td><td>${p}</td>`;
      }).join("");
      const grandTotal25 = CITIES.reduce((s, c) => s + totals[c].p25, 0);
      const grandTotal26 = CITIES.reduce((s, c) => s + totals[c].p26, 0);
      const { d: gtd, p: gtp } = fmtDelta(grandTotal25, grandTotal26);
      const hasPartial = data.some((r) => r.isPartial);
      const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr("charts.freePaxByMonthAndCity")}>${t("charts.freePaxByMonthAndCity")} \u2014 <span class="ytd-range-label">${getRangeLabel()}</span> 2025 vs. 2026</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead>
                    <tr><th class="mpax-month-head" rowspan="2">${t("labels.mo")}</th>${cityHeaders}<th colspan="4" class="mpax-city-head">${t("labels.total")}</th></tr>
                    <tr>${subHeaders}<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">\xB1</th><th class="mpax-sub-head">\xB1%</th></tr>
                </thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t("labels.total")}</td>${totalCells}<td><strong>${fmtN(grandTotal25)}</strong></td><td><strong>${fmtN(grandTotal26)}</strong></td><td>${gtd}</td><td>${gtp}</td></tr>
                </tbody>
            </table>
            </div>
            ${hasPartial ? `<div class="mpax-note">* ${t("labels.partial")} \u2014 ${t("labels.dataThrough")} ${getGlobalDate()}</div>` : ""}
        </div>`;
      const el = document.getElementById("monthly-pax-table-cmp");
      if (el) el.innerHTML = html;
    },
    filterPrivateCity(city, btn) {
      this.activePrivateCity = city;
      this._setActivePill("private-city-pills-cmp", btn);
      this.updatePaidTypeCharts();
    },
    filterSharedCity(city, btn) {
      this.activeSharedCity = city;
      this._setActivePill("shared-city-pills-cmp", btn);
      this.updatePaidTypeCharts();
    },
    filterTourType(type, btn) {
      this.activePrivateType = type === "all" || this.PRIVATE_TYPES.includes(type) ? type : "all";
      this.activeSharedType = type === "all" || this.SHARED_TYPES.includes(type) ? type : "all";
      this.activeAvgType = type;
      this._setActivePill("unified-type-pills-cmp", btn);
      this.updatePaidTypeCharts();
    },
    _setActivePill(groupId, activeBtn) {
      const group = document.getElementById(groupId);
      if (!group) return;
      group.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      if (activeBtn) activeBtn.classList.add("active");
    },
    _getTypeMonthData(city, types, primaryKey, year) {
      const cutoffMonth = getCutoffMonth();
      const cutoffDay = parseInt(getGlobalDate().split("-")[2]);
      const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
      const cityStats = year === 25 ? cityStats25 : cityStats26;
      const citiesToSum = city === "all" ? CITIES : [city];
      return Array.from({ length: maxMonth }, (_, i) => i + 1).map((mo) => {
        let primary = 0, secondary = 0;
        const secondaryKey = primaryKey === "tours" ? "pax" : "tours";
        if (mo < cutoffMonth) {
          citiesToSum.forEach((c) => {
            const st = cityStats[c]?.[this.activeLang];
            const bmt = st?.byMonthType?.[String(mo)];
            if (!bmt) return;
            types.forEach((tp) => {
              const td = bmt[tp];
              if (td) {
                primary += td[primaryKey] || 0;
                secondary += td[secondaryKey] || 0;
              }
            });
          });
        } else if (mo === cutoffMonth) {
          for (let d = 1; d <= cutoffDay; d++) {
            const key = `${mo}-${d}`;
            citiesToSum.forEach((c) => {
              const st = cityStats[c]?.[this.activeLang];
              const bdt = st?.byDayType?.[key];
              if (!bdt) return;
              types.forEach((tp) => {
                const td = bdt[tp];
                if (td) {
                  primary += td[primaryKey] || 0;
                  secondary += td[secondaryKey] || 0;
                }
              });
            });
          }
        }
        return { primary, secondary };
      });
    },
    renderPaidTypeTable(containerId, city, typeFilter, allTypes, primaryMetric) {
      const cutoffMonth = getCutoffMonth();
      const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const types = typeFilter === "all" ? allTypes : [typeFilter];
      const d25 = this._getTypeMonthData(city, types, "tours", 25);
      const d26 = this._getTypeMonthData(city, types, "tours", 26);
      const months = Array.from({ length: maxMonth }, (_, i) => i + 1);
      const fmtDelta = (v25, v26, isAvg) => {
        const diff = v26 - v25;
        if (v25 === 0 && v26 === 0) return { d: '<span class="neu">\u2014</span>', p: '<span class="neu">\u2014</span>' };
        const cls = diff > 0 ? "pos" : diff < 0 ? "neg" : "neu";
        const sign = diff > 0 ? "+" : "";
        const pct = v25 > 0 ? Math.round(diff / v25 * 100) : diff > 0 ? "\u221E" : 0;
        return isAvg ? { d: `<span class="${cls}">${sign}${diff.toFixed(1)}</span>`, p: `<span class="${cls}">${sign}${pct}%</span>` } : { d: `<span class="${cls}">${sign}${fmtN(diff)}</span>`, p: `<span class="${cls}">${sign}${pct}%</span>` };
      };
      const rows = months.map((m) => {
        const isPartial = m === cutoffMonth && this.activeMonths.length === 0;
        const t25 = d25[m - 1].primary, t26 = d26[m - 1].primary;
        const p25 = d25[m - 1].secondary, p26 = d26[m - 1].secondary;
        return {
          m,
          isPartial,
          t25,
          t26,
          p25,
          p26,
          avg25: t25 > 0 ? p25 / t25 : 0,
          avg26: t26 > 0 ? p26 / t26 : 0
        };
      });
      const totT25 = rows.reduce((s, r) => s + r.t25, 0);
      const totT26 = rows.reduce((s, r) => s + r.t26, 0);
      const totP25 = rows.reduce((s, r) => s + r.p25, 0);
      const totP26 = rows.reduce((s, r) => s + r.p26, 0);
      const totAvg25 = totT25 > 0 ? totP25 / totT25 : 0;
      const totAvg26 = totT26 > 0 ? totP26 / totT26 : 0;
      const toursPrimary = primaryMetric === "tours";
      const paxPrimary = primaryMetric === "pax";
      const groupHeaders = [
        `<th colspan="4" class="mpax-metric-head${toursPrimary ? " mpax-metric-primary" : ""}">${t("table.tours")}</th>`,
        `<th colspan="4" class="mpax-metric-head${paxPrimary ? " mpax-metric-primary" : ""}">${t("table.pax")}</th>`,
        `<th colspan="4" class="mpax-metric-head">${t("labels.avgPaxPerTour")}</th>`
      ].join("");
      const subRow = `<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">\xB1</th><th class="mpax-sub-head">\xB1%</th>`;
      const subHeaders = subRow + subRow + subRow;
      const makeRow = (label, t25, t26, p25, p26, avg25, avg26, isPartial, isTotal) => {
        const td = fmtDelta(t25, t26, false);
        const pd = fmtDelta(p25, p26, false);
        const ad = fmtDelta(avg25, avg26, true);
        const cls = isTotal ? ' class="mpax-total"' : "";
        const mLabel = isPartial ? `${label}<sup>*</sup>` : label;
        return `<tr${cls}>
                <td class="mpax-month">${mLabel}</td>
                <td>${t25 || "\u2014"}</td><td>${t26 || "\u2014"}</td><td>${td.d}</td><td>${td.p}</td>
                <td>${p25 || "\u2014"}</td><td>${p26 || "\u2014"}</td><td>${pd.d}</td><td>${pd.p}</td>
                <td>${avg25 > 0 ? avg25.toFixed(1) : "\u2014"}</td><td>${avg26 > 0 ? avg26.toFixed(1) : "\u2014"}</td><td>${ad.d}</td><td>${ad.p}</td>
            </tr>`;
      };
      const bodyRows = rows.map((r) => makeRow(MONTH_NAMES[r.m], r.t25, r.t26, r.p25, r.p26, r.avg25, r.avg26, r.isPartial, false)).join("");
      const totalRow = makeRow(t("labels.total"), totT25, totT26, totP25, totP26, totAvg25, totAvg26, false, true);
      const hasPartial = rows.some((r) => r.isPartial);
      const html = `<div class="mpax-wrap" style="margin-top:16px">
            <table class="mpax-table">
                <thead>
                    <tr><th class="mpax-month-head" rowspan="2">${t("labels.mo")}</th>${groupHeaders}</tr>
                    <tr>${subHeaders}</tr>
                </thead>
                <tbody>${bodyRows}${totalRow}</tbody>
            </table>
            ${hasPartial ? `<div class="mpax-note">* ${t("labels.partial")} \u2014 ${t("labels.dataThrough")} ${getGlobalDate()}</div>` : ""}
        </div>`;
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = html;
    },
    updatePaidTypeCharts() {
      const self = this;
      const colors = this.getChartColors();
      const MONTH_NAMES = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
      const cutoffMonth = getCutoffMonth();
      const maxMonth = this.activeMonths.length > 0 ? Math.max(...this.activeMonths) : cutoffMonth;
      const months = Array.from({ length: maxMonth }, (_, i) => MONTH_NAMES[i + 1]);
      const rangeLabel = getRangeLabel();
      const secondaryLabelPlugin = (secondaryKey) => ({
        id: "secondaryLabel",
        afterDraw(chart) {
          const ctx = chart.ctx;
          const meta0 = chart.getDatasetMeta(0);
          const meta1 = chart.getDatasetMeta(1);
          ctx.save();
          ctx.font = "500 9px 'IBM Plex Sans',sans-serif";
          ctx.textAlign = "center";
          const secData25 = chart.data.datasets[0]._secondaryData || [];
          const secData26 = chart.data.datasets[1]._secondaryData || [];
          [meta0.data, meta1.data].forEach((bars, di) => {
            const secArr = di === 0 ? secData25 : secData26;
            bars.forEach((bar, i) => {
              const val = secArr[i] || 0;
              if (val === 0) return;
              const label = secondaryKey === "pax" ? `${val}p` : `${val}t`;
              ctx.fillStyle = self.getChartColors().text3;
              ctx.fillText(label, bar.x, bar.y - 4);
            });
          });
          ctx.restore();
        }
      });
      const buildTypeChart = (canvasId, instanceKey, city, typeFilter, allTypes, primaryKey) => {
        const types = typeFilter === "all" ? allTypes : [typeFilter];
        const d25 = this._getTypeMonthData(city, types, primaryKey, 25);
        const d26 = this._getTypeMonthData(city, types, primaryKey, 26);
        const secondaryKey = primaryKey === "tours" ? "pax" : "tours";
        const ds25 = {
          label: `${rangeLabel} 2025`,
          data: d25.map((d) => d.primary),
          _secondaryData: d25.map((d) => d.secondary),
          backgroundColor: colors.y25 + "99",
          borderRadius: 4
        };
        const ds26 = {
          label: `${rangeLabel} 2026`,
          data: d26.map((d) => d.primary),
          _secondaryData: d26.map((d) => d.secondary),
          backgroundColor: colors.y26,
          borderRadius: 4
        };
        const yLabel = primaryKey === "tours" ? "Tours" : "PAX";
        try {
          if (this[instanceKey]) this[instanceKey].destroy();
          const ctx = document.getElementById(canvasId)?.getContext("2d");
          if (!ctx) return;
          this[instanceKey] = createPaidTypeChart(ctx, months, ds25, ds26, colors, secondaryLabelPlugin(secondaryKey), yLabel);
        } catch (e) {
          console.error("Type chart error:", e);
        }
      };
      buildTypeChart("privatePaidChart-cmp", "privatePaidChartInstance", this.activePrivateCity, this.activePrivateType, this.PRIVATE_TYPES, "tours");
      this.renderPaidTypeTable("private-type-table-cmp", this.activePrivateCity, this.activePrivateType, this.PRIVATE_TYPES, "tours");
      buildTypeChart("sharedPaidChart-cmp", "sharedPaidChartInstance", this.activeSharedCity, this.activeSharedType, this.SHARED_TYPES, "tours");
      this.renderPaidTypeTable("shared-type-table-cmp", this.activeSharedCity, this.activeSharedType, this.SHARED_TYPES, "pax");
      const typesToShow = this.activeAvgType === "all" ? this.ALL_PAID_TYPES : [this.activeAvgType];
      const getTypeAvg = (year, types) => this._getTypeMonthData(this.activeCity, types, "pax", year).map((d) => d.secondary > 0 ? +(d.primary / d.secondary).toFixed(1) : null);
      try {
        if (this.warAvgChartInstance) this.warAvgChartInstance.destroy();
        const warCtx = document.getElementById("warAvgChart-cmp")?.getContext("2d");
        if (warCtx) {
          this.warAvgChartInstance = createWarAvgChart(warCtx, months, getTypeAvg(25, typesToShow), getTypeAvg(26, typesToShow), colors, rangeLabel);
        }
      } catch (e) {
        console.error("Avg type chart error:", e);
      }
    },
    filterCity(city) {
      this.activeCity = city;
      document.querySelectorAll("#page-cmp .city-filter-pill").forEach((p) => p.classList.toggle("active", p.dataset.city === city));
      this.renderAll();
    },
    filterLang(lang) {
      this.activeLang = lang;
      document.querySelectorAll("#page-cmp .lang-pill").forEach((p) => p.classList.toggle("active", p.dataset.lang === lang));
      this.mergedGuides = this.buildMerged();
      this.renderAll();
    },
    filterMonth(m) {
      this.activeMonths = m === "all" ? [] : [parseInt(m)];
      this.mergedGuides = this.buildMerged();
      this.renderAll();
    },
    _buildHeader() {
      return `        <div class="header">
            <div class="header-left">
                <h1>${t("sections.guideComparison")}</h1>
                <p><span class="ytd-range-label">Jan\u2013Jun</span> 2025 vs. 2026 &middot; ${t("sections.productionByGuide")}</p>
            </div>
            <div class="header-right">
                <div id="date-pov-cmp" class="mb-6"></div>
                <div class="header-badge">${t("sections.comparisonYtd")}</div>
            </div>
        </div>`;
    },
    _buildKpisAndFilters() {
      return `        <div class="main">
            <p class="takeaway" id="takeaway-cmp"></p>
            <div class="filter-bar">
                <div class="city-pill-group">
                    ${["all", ...CITIES].map((c) => {
        const col = getCityColor(c);
        const label = c === "all" ? t("labels.all") : c;
        const active = this.activeCity === c ? " active" : "";
        const style = col ? ` style="--city-col:${col}"` : "";
        return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="PageCmp.filterCity('${c}')">${label}</button>`;
      }).join("")}
                </div>
                <div class="filter-dropdowns">
                    <div class="city-pill-group lang-pill-group" id="lang-filter-cmp" role="group" aria-label="${t("labels.language")}">
                        ${[["all", t("labels.all")], ["eng", "ENG"], ["esp", "ESP"], ["fra", "FRA"]].map(([v, label]) => `<button class="city-filter-pill lang-pill${this.activeLang === v ? " active" : ""}" data-lang="${v}" onclick="PageCmp.filterLang('${v}')">${label}</button>`).join("")}
                    </div>
                    <div class="filter-field">
                        <label class="filter-label" for="month-filter-cmp">${t("labels.mo")}</label>
                        <select class="filter-select" id="month-filter-cmp" onchange="PageCmp.filterMonth(this.value)">
                            <option value="all">${t("labels.all")}</option>
                            ${Array.from({ length: getCutoffMonth() }, (_, i) => i + 1).map((m) => `<option value="${m}">${m}</option>`).join("")}
                        </select>
                    </div>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.freeToursPaxCountYtd")}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-free-abs-cmp">\u2014</span>
                        <span class="kpi-delta-pct" id="kd-free-pct-cmp">\u2014</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-free25-cmp">\u2014</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-free26-cmp">\u2014</div>
                        </div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.avgPaxPerFreeTour")}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-avg-pax-abs-cmp">\u2014</span>
                        <span class="kpi-delta-pct" id="kd-avg-pax-pct-cmp">\u2014</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-avg-pax25-cmp">\u2014</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-avg-pax26-cmp">\u2014</div>
                        </div>
                    </div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.totalFreeTours")}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-free-tours-abs-cmp">\u2014</span>
                        <span class="kpi-delta-pct" id="kd-free-tours-pct-cmp">\u2014</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-free-tours25-cmp">\u2014</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-free-tours26-cmp">\u2014</div>
                        </div>
                    </div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t("labels.paidToursCountYtd")}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-paid-abs-cmp">\u2014</span>
                        <span class="kpi-delta-pct" id="kd-paid-pct-cmp">\u2014</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-paid25-cmp">\u2014</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-paid26-cmp">\u2014</div>
                        </div>
                    </div>
                </div>
            </div>

            `;
    },
    _buildFreeTours() {
      return `            <!-- \u2500\u2500 FREE TOURS SECTION \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
            <div class="section-divider" onclick="toggleSection('free-section-body')">
                <span>${t("sections.freeTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
            <div id="free-section-body" class="section-body">
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.freePaxByCity")}>${t("charts.freePaxByCity")}</div>
                        <div class="chart-container">
                            <canvas id="cityChart-cmp"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.avgFreePaxCmp")}>${t("charts.avgFreePaxCmp")} \u2014 <span class="ytd-range-label">Jan\u2013Jun</span> 2025 vs. 2026</div>
                        <div class="chart-container">
                            <canvas id="avgFreePaxCmpChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.cumulativeFreePax")}>${t("charts.cumulativeFreePax")} (<span class="ytd-range-label">Jan\u2013Jun</span>)</div>
                        <div class="chart-container">
                            <canvas id="monthlyChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.cityMonthlyCumulative")}>${t("charts.cityMonthlyCumulative")} (<span class="ytd-range-label">Jan\u2013Jun</span>)</div>
                        <div id="city-monthly-badges-cmp" class="city-monthly-badges"></div>
                        <div class="chart-container">
                            <canvas id="cityMonthlyChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div id="monthly-pax-table-cmp"></div>
                </div>
            </div>

`;
    },
    _buildPaidTours() {
      return `            <!-- \u2500\u2500 PAID TOURS SECTION \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
            <div class="section-divider" onclick="toggleSection('paid-section-body')">
                <span>${t("sections.paidTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
            <div id="paid-section-body" class="section-body">
                <div class="type-filter-row sticky-type-filter" id="tour-type-sticky-cmp">
                    <span class="type-filter-label">${t("sections.paidTours")}</span>
                    <div id="unified-type-pills-cmp" class="pill-group">
                        <button class="pill active" data-value="all" onclick="PageCmp.filterTourType('all',this)">${t("labels.all")}</button>
                        <button class="pill" data-value="war" onclick="PageCmp.filterTourType('war',this)">war</button>
                        <button class="pill" data-value="food" onclick="PageCmp.filterTourType('food',this)">food</button>
                        <button class="pill" data-value="best" onclick="PageCmp.filterTourType('best',this)">best</button>
                        <button class="pill" data-value="war PR" onclick="PageCmp.filterTourType('war PR',this)">war PR</button>
                        <button class="pill" data-value="food PR" onclick="PageCmp.filterTourType('food PR',this)">food PR</button>
                        <button class="pill" data-value="old" onclick="PageCmp.filterTourType('old',this)">old</button>
                        <button class="pill" data-value="big" onclick="PageCmp.filterTourType('big',this)">big</button>
                        <button class="pill" data-value="food kuoni" onclick="PageCmp.filterTourType('food kuoni',this)">food kuoni</button>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.paidToursByCity")}>${t("charts.paidToursByCity")}</div>
                        <div class="chart-container">
                            <canvas id="paidCityChart-cmp"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.cumulativePaidTours")}>${t("charts.cumulativePaidTours")} (<span class="ytd-range-label">Jan\u2013Jun</span>)</div>
                        <div class="chart-container">
                            <canvas id="paidChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.privatePaidTours")}>${t("charts.privatePaidTours")} \u2014 <span class="ytd-range-label">Jan\u2013Jun</span> 2025 vs. 2026</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.city")}</span>
                                <div id="private-city-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterPrivateCity('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Zagreb',this)">Zagreb</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Dubrovnik',this)">Dubrovnik</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Split',this)">Split</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateCity('Zadar',this)">Zadar</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="privatePaidChart-cmp"></canvas>
                        </div>
                        <div id="private-type-table-cmp"></div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.avgPaxByType")}>${t("charts.avgPaxByType")} \u2014 <span class="ytd-range-label">Jan\u2013Jun</span> 2025 vs. 2026</div>
                        <div class="chart-container">
                            <canvas id="warAvgChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.sharedPaidTours")}>${t("charts.sharedPaidTours")} \u2014 <span class="ytd-range-label">Jan\u2013Jun</span> 2025 vs. 2026</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.city")}</span>
                                <div id="shared-city-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterSharedCity('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Zagreb',this)">Zagreb</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Dubrovnik',this)">Dubrovnik</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Split',this)">Split</button>
                                    <button class="pill" onclick="PageCmp.filterSharedCity('Zadar',this)">Zadar</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="sharedPaidChart-cmp"></canvas>
                        </div>
                        <div id="shared-type-table-cmp"></div>
                    </div>
                </div>
            </div>

`;
    },
    _destroyCharts() {
      [
        this.cityChartInstance,
        this.paidCityChartInstance,
        this.monthlyChartInstance,
        this.paidChartInstance,
        this.cityMonthlyChartInstance,
        this.privatePaidChartInstance,
        this.sharedPaidChartInstance,
        this.warAvgChartInstance,
        this.avgFreePaxCmpChartInstance
      ].forEach((chart) => {
        if (chart) try {
          chart.destroy();
        } catch (e) {
        }
      });
      this.cityChartInstance = null;
      this.paidCityChartInstance = null;
      this.monthlyChartInstance = null;
      this.paidChartInstance = null;
      this.cityMonthlyChartInstance = null;
      this.privatePaidChartInstance = null;
      this.sharedPaidChartInstance = null;
      this.warAvgChartInstance = null;
      this.avgFreePaxCmpChartInstance = null;
    },
    rebuildStructure() {
      this._destroyCharts();
      document.getElementById("page-cmp").innerHTML = this._buildHeader() + this._buildKpisAndFilters() + this._buildFreeTours() + this._buildPaidTours() + "</div>";
      const now = (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const datePov = this._el("date-pov");
      if (datePov) datePov.textContent = now;
    },
    _positionTourTypeSticky() {
      const nav = document.querySelector(".nav");
      const divider = document.getElementById("paid-section-body")?.previousElementSibling;
      const bar = document.getElementById("tour-type-sticky-cmp");
      if (nav && divider && bar) {
        bar.style.top = nav.offsetHeight + divider.offsetHeight + "px";
      }
    },
    init() {
      if (this._initialized) return;
      this._initialized = true;
      this.rebuildStructure();
      this.mergedGuides = this.buildMerged();
      this.renderAll();
      this._positionTourTypeSticky();
      window.addEventListener("resize", () => this._positionTourTypeSticky());
    }
  };
  registerPage("PageCmp", PageCmp);

  // src/guide-table.js
  var ZERO = { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 };
  var ALL_METRICS = ["freeTours", "freePax", "paidTours", "paidPax", "totalTours", "totalPax"];
  var TABLE_METRICS = ["freeTours", "freePax", "paidTours", "paidPax", "totalTours"];
  function mergeGuides(list25, list26) {
    const map = /* @__PURE__ */ new Map();
    list25.forEach((g) => map.set(g.name, { name: g.name, city: g.city, g25: g, g26: null }));
    list26.forEach((g) => {
      const cur = map.get(g.name);
      if (cur) {
        cur.g26 = g;
        cur.city = g.city;
      } else map.set(g.name, { name: g.name, city: g.city, g25: null, g26: g });
    });
    return [...map.values()];
  }
  function deltaRow(v25, v26) {
    const delta = v26 - v25;
    const pct = v25 <= 0 ? null : Math.round(delta / v25 * 1e3) / 10;
    return { v25, v26, delta, pct };
  }
  function pctLabel(d, newText = "new") {
    if (d.pct === null) return d.v26 > 0 ? newText : "\u2014";
    return `${d.delta > 0 ? "+" : ""}${d.pct}%`;
  }
  function statsOrZero(guide, lang, months, cutoff) {
    const st = guide && guide.stats[lang];
    return st ? filteredStats(st, months, cutoff) : ZERO;
  }
  function buildGuideRows(merged, lang, months) {
    return merged.map((m) => {
      const f25 = statsOrZero(m.g25, lang, months);
      const f26 = statsOrZero(m.g26, lang, months);
      const a25 = statsOrZero(m.g25, "all", []);
      const a26 = statsOrZero(m.g26, "all", []);
      const act25 = a25.freeTours + a25.paidTours;
      const act26 = a26.freeTours + a26.paidTours;
      return {
        name: m.name,
        city: m.city,
        stopped: act25 > 0 && act26 === 0,
        isNew: act25 === 0 && act26 > 0,
        freeTours: deltaRow(f25.freeTours, f26.freeTours),
        freePax: deltaRow(f25.freePax, f26.freePax),
        paidTours: deltaRow(f25.paidTours, f26.paidTours),
        paidPax: deltaRow(f25.paidPax, f26.paidPax),
        totalTours: deltaRow(f25.freeTours + f25.paidTours, f26.freeTours + f26.paidTours),
        totalPax: deltaRow(f25.freePax + f25.paidPax, f26.freePax + f26.paidPax)
      };
    });
  }
  function sumRows(rows) {
    const total = { name: "TOTAL" };
    ALL_METRICS.forEach((k) => {
      total[k] = deltaRow(
        rows.reduce((s, r) => s + r[k].v25, 0),
        rows.reduce((s, r) => s + r[k].v26, 0)
      );
    });
    return total;
  }
  function filterByName(rows, query) {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
  }
  var cityIndex = (c) => {
    const i = CITIES.indexOf(c);
    return i < 0 ? CITIES.length : i;
  };
  function rankGuides(rows, sort) {
    if (sort === "name") return [...rows].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "gain") return [...rows].sort((a, b) => b.totalPax.delta - a.totalPax.delta);
    if (sort === "drop") return [...rows].sort((a, b) => a.totalPax.delta - b.totalPax.delta);
    return [...rows].sort((a, b) => cityIndex(a.city) - cityIndex(b.city) || b.freeTours.v26 - a.freeTours.v26 || b.freeTours.v25 - a.freeTours.v25 || a.name.localeCompare(b.name));
  }
  function flagDeclines(rows, threshold = -30) {
    return rows.filter((r) => r.totalPax.v25 > 0 && r.totalPax.v26 > 0 && r.totalPax.pct <= threshold).sort((a, b) => a.totalPax.delta - b.totalPax.delta);
  }
  function flagGainers(rows, threshold = 30) {
    return rows.filter((r) => r.totalPax.v25 > 0 && r.totalPax.v26 > 0 && r.totalPax.pct >= threshold).sort((a, b) => b.totalPax.delta - a.totalPax.delta);
  }
  function guideMonthlyDetail(g25, g26, lang, cutoffMonth, cutoffDay) {
    const st25 = g25 && g25.stats[lang];
    const st26 = g26 && g26.stats[lang];
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month,
        y25: st25 ? filteredStats(st25, [month], { month: 12, day: 31 }) : ZERO,
        y26: st26 && month <= cutoffMonth ? filteredStats(st26, [month], { month: cutoffMonth, day: cutoffDay }) : null
      };
    });
  }
  function guideMonthlyTrend(g25, g26, lang, cutoffMonth, cutoffDay) {
    return guideMonthlyDetail(g25, g26, lang, cutoffMonth, cutoffDay).map((r) => ({
      month: r.month,
      pax25: r.y25.freePax + r.y25.paidPax,
      pax26: r.y26 ? r.y26.freePax + r.y26.paidPax : null
    }));
  }
  function typeTotals(st, cutoffMonth, cutoffDay) {
    const acc = {};
    const add = (map) => {
      if (!map) return;
      Object.entries(map).forEach(([type, v]) => {
        const a = acc[type] || (acc[type] = { tours: 0, pax: 0 });
        a.tours += v.tours || 0;
        a.pax += v.pax || 0;
      });
    };
    for (let m = 1; m <= 12; m++) {
      if (m < cutoffMonth) {
        add(st.byMonthType && st.byMonthType[String(m)]);
      } else if (m === cutoffMonth) {
        if (st.byDayType && Object.keys(st.byDayType).length > 0) {
          for (let d = 1; d <= cutoffDay; d++) add(st.byDayType[`${m}-${d}`]);
        } else {
          add(st.byMonthType && st.byMonthType[String(m)]);
        }
      }
    }
    return acc;
  }
  function guideTypeMix(g25, g26, lang, cutoffMonth, cutoffDay) {
    const st25 = g25 && g25.stats[lang];
    const st26 = g26 && g26.stats[lang];
    const a = st25 ? typeTotals(st25, 12, 31) : {};
    const b = st26 ? typeTotals(st26, cutoffMonth, cutoffDay) : {};
    return [.../* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])].map((type) => ({
      type,
      t25: a[type] ? a[type].tours : 0,
      p25: a[type] ? a[type].pax : 0,
      t26: b[type] ? b[type].tours : 0,
      p26: b[type] ? b[type].pax : 0
    })).sort((x, y) => y.t26 - x.t26 || y.t25 - x.t25 || x.type.localeCompare(y.type));
  }

  // src/pages/page-guides.js
  var PageGuides = {
    activeCity: "all",
    activeLang: "all",
    activeMonths: [],
    activeSort: "default",
    guideQuery: "",
    guideView: "cards",
    guideTrendChartInstance: null,
    _detailTrigger: null,
    _initialized: false,
    _el(id) {
      return document.getElementById(id + "-gd");
    },
    // Read from body: the dark-mode variables are defined on body.dark-mode, not :root.
    getChartColors() {
      const cs = getComputedStyle(document.body);
      const tok = (n) => cs.getPropertyValue(n).trim();
      return { text: tok("--text"), text3: tok("--text3"), border: tok("--border"), y25: tok("--y25"), y26: tok("--y26") };
    },
    _setActivePill(groupId, activeBtn) {
      const group = document.getElementById(groupId);
      if (!group) return;
      group.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      if (activeBtn) activeBtn.classList.add("active");
    },
    // Month options depend on the as-of date, so they are rebuilt on every render.
    _syncMonthOptions() {
      const sel = this._el("month-filter");
      if (!sel) return;
      const current = this.activeMonths.length ? String(this.activeMonths[0]) : "all";
      sel.innerHTML = `<option value="all">${t("labels.all")}</option>` + Array.from({ length: getCutoffMonth() }, (_, i) => `<option value="${i + 1}">${MONTH_NAMES_HR[i + 1]}</option>`).join("");
      sel.value = current;
    },
    _deltaBadge(d) {
      if (d.v25 === 0 && d.v26 === 0) return '<span class="dash">\u2014</span>';
      if (d.pct === null) return `<span class="delta pos">${t("labels.badgeNew").toUpperCase()}</span>`;
      const cls = d.delta > 0 ? "pos" : d.delta < 0 ? "neg" : "neu";
      const sym = d.delta > 0 ? "\u25B2" : d.delta < 0 ? "\u25BC" : "=";
      return `<span class="delta ${cls}">${sym}${fmtN(Math.abs(d.delta))} (${pctLabel(d)})</span>`;
    },
    cardHtml(r, m, extra = {}) {
      const col = getCityColor(r.city);
      const init = r.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
      const rank = extra.rank ? `<span class="gc-rank">#${extra.rank}</span>` : "";
      const badges = (r.isNew ? `<span class="gc-badge gc-badge-new">${t("labels.badgeNew")}</span>` : "") + (r.stopped ? `<span class="gc-badge">${t("labels.badgeInactive")}</span>` : "");
      const line = (labelKey, d) => `<tr><td class="label">${t(labelKey)}</td><td class="v25">${m.g25 ? fmtN(d.v25) : "\u2014"}</td><td class="v26">${m.g26 ? fmtN(d.v26) : "\u2014"}</td><td class="delta">${m.g25 && m.g26 ? this._deltaBadge(d) : "\u2014"}</td></tr>`;
      return `<div class="guide-card ${m.g26 ? "" : "inactive"}" role="button" tabindex="0" aria-label="${r.name}" data-city="${r.city}" data-name="${safeName(r.name)}"><div class="gc-stripe" style="background:${col}"></div><div class="gc-body"><div class="gc-header">${rank}<div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div><span class="gc-name">${r.name}</span>${badges}<span class="city-pill" style="background:${col}18;color:${col}">${r.city}</span></div><table class="gc-cmp-table"><tbody>` + line("labels.freeT", r.freeTours) + line("labels.freeP", r.freePax) + line("labels.paidT", r.paidTours) + line("labels.paidP", r.paidPax) + line("labels.totalT", r.totalTours) + `</tbody></table></div></div>`;
    },
    flagsHtml(rows) {
      const list = (items) => items.slice(0, 5).map((r) => `${r.name} (${pctLabel(r.totalPax, t("labels.badgeNew"))})`).join(", ") + (items.length > 5 ? ` +${items.length - 5}` : "");
      const down = flagDeclines(rows);
      const up = flagGainers(rows);
      if (!down.length && !up.length) return "";
      return `<div class="guide-flags">` + (down.length ? `<div class="guide-flag-line neg">\u25BC ${t("labels.flagDown")} (${down.length}): ${list(down)}</div>` : "") + (up.length ? `<div class="guide-flag-line pos">\u25B2 ${t("labels.flagUp")} (${up.length}): ${list(up)}</div>` : "") + `</div>`;
    },
    renderAll() {
      this._syncMonthOptions();
      const merged = mergeGuides(guideStats25, guideStats26).filter((m) => CITIES.includes(m.city) && (this.activeCity === "all" || m.city === this.activeCity));
      const byName = new Map(merged.map((m) => [m.name, m]));
      const rows = buildGuideRows(merged, this.activeLang, this.activeMonths);
      const shown = rankGuides(filterByName(rows, this.guideQuery), this.activeSort);
      const ranked = this.activeSort === "gain" || this.activeSort === "drop";
      const cardFor = (r, i) => this.cardHtml(r, byName.get(r.name), { rank: ranked ? i + 1 : null });
      this._el("guide-flags").innerHTML = this.flagsHtml(rows);
      let html;
      if (!shown.length) {
        html = `<div class="guide-empty">${t("labels.noGuidesFound")}</div>`;
      } else if (this.guideView === "table") {
        html = this.guideTableHtml(shown, sumRows(rows));
      } else if (this.activeSort === "default") {
        html = "";
        CITIES.forEach((city) => {
          const inCity = shown.filter((r) => r.city === city);
          if (!inCity.length) return;
          html += `<section class="city-section" data-city="${city}"><div class="section-title ${CITY_CLS[city] || ""}">${city}</div><div class="guide-grid">${inCity.map(cardFor).join("")}</div></section>`;
        });
      } else {
        html = `<section class="city-section"><div class="guide-grid">${shown.map(cardFor).join("")}</div></section>`;
      }
      this._el("guide-sections").innerHTML = html;
    },
    filterCity(city) {
      this.activeCity = city;
      document.querySelectorAll("#page-gd .city-filter-pill").forEach((p) => p.classList.toggle("active", p.dataset.city === city));
      this.renderAll();
    },
    filterLang(lang) {
      this.activeLang = lang;
      document.querySelectorAll("#page-gd .lang-pill").forEach((p) => p.classList.toggle("active", p.dataset.lang === lang));
      this.renderAll();
    },
    filterMonth(m) {
      this.activeMonths = m === "all" ? [] : [parseInt(m)];
      this.renderAll();
    },
    setGuideSort(value, btn) {
      this.activeSort = value;
      this._setActivePill("guide-sort-pills-gd", btn);
      this.renderAll();
    },
    setGuideQuery(value) {
      this.guideQuery = value;
      this.renderAll();
    },
    setGuideView(view) {
      this.guideView = view;
      this._el("guide-view-cards").classList.toggle("active", view === "cards");
      this._el("guide-view-table").classList.toggle("active", view === "table");
      this.renderAll();
    },
    _typeMixHtml(mix) {
      if (!mix.length) return "";
      const maxT = Math.max(...mix.map((x) => Math.max(x.t25, x.t26)), 1);
      const bar = (tours, pax, cls, year) => `<div class="type-bar-row"><span class="type-lbl">${year}</span><div class="type-track"><div class="type-fill ${cls}" style="width:${(tours / maxT * 100).toFixed(0)}%"></div></div><span class="type-val">${tours}t &middot; ${pax}p</span></div>`;
      return mix.map((x) => `<div class="guide-type-group"><div class="guide-type-name">${x.type}</div>${bar(x.t25, x.p25, "y25", "2025")}${bar(x.t26, x.p26, "y26", "2026")}</div>`).join("");
    },
    _monthlyTableHtml(detail) {
      const zero = { freeTours: 0, freePax: 0, paidTours: 0, paidPax: 0 };
      const any = (s) => s && (s.freeTours || s.freePax || s.paidTours || s.paidPax);
      const cells = (s) => s ? `<td>${s.freeTours}</td><td>${s.freePax}</td><td>${s.paidTours}</td><td>${s.paidPax}</td>` : "<td>\u2014</td><td>\u2014</td><td>\u2014</td><td>\u2014</td>";
      const rows = detail.filter((r) => any(r.y25) || any(r.y26));
      if (!rows.length) return "";
      const sum = (key) => detail.reduce((a, r) => {
        const s = r[key] || zero;
        return { freeTours: a.freeTours + s.freeTours, freePax: a.freePax + s.freePax, paidTours: a.paidTours + s.paidTours, paidPax: a.paidPax + s.paidPax };
      }, zero);
      const sub = `<th class="mpax-sub-head">${t("table.free")} t</th><th class="mpax-sub-head">${t("table.free")} p</th><th class="mpax-sub-head">${t("table.paid")} t</th><th class="mpax-sub-head">${t("table.paid")} p</th>`;
      return `<div class="mpax-wrap"><table class="mpax-table"><thead><tr><th class="mpax-month-head" rowspan="2">${t("table.month")}</th><th colspan="4" class="mpax-city-head">2025</th><th colspan="4" class="mpax-city-head">2026</th></tr><tr>${sub}${sub}</tr></thead><tbody>${rows.map((r) => `<tr><td class="mpax-month">${MONTH_NAMES_HR[r.month]}</td>${cells(r.y25)}${cells(r.y26)}</tr>`).join("")}<tr class="mpax-total"><td class="mpax-month">${t("labels.total")}</td>${cells(sum("y25"))}${cells(sum("y26"))}</tr></tbody></table></div>`;
    },
    openGuideDetail(safeKey, trigger) {
      const m = mergeGuides(guideStats25, guideStats26).find((x) => safeName(x.name) === safeKey);
      if (!m) return;
      this._detailTrigger = trigger;
      this._el("guide-detail-name").textContent = m.name;
      this._el("guide-detail-city").textContent = m.city;
      this._el("guide-detail-note").textContent = `${t("labels.modalNote")} ${getGlobalDate()}`;
      this._el("guide-detail-backdrop").classList.add("open");
      this._el("guide-detail-modal").classList.add("open");
      this._el("guide-detail-close").focus();
      const cutoffMonth = getCutoffMonth();
      const cutoffDay = parseGlobalDate().day;
      this._el("guide-detail-types").innerHTML = this._typeMixHtml(guideTypeMix(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay));
      this._el("guide-detail-months").innerHTML = this._monthlyTableHtml(guideMonthlyDetail(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay));
      const trend = guideMonthlyTrend(m.g25, m.g26, this.activeLang, cutoffMonth, cutoffDay);
      if (this.guideTrendChartInstance) this.guideTrendChartInstance.destroy();
      this.guideTrendChartInstance = createGuideTrendChart(
        this._el("guideTrendChart").getContext("2d"),
        trend.map((x) => MONTH_NAMES_HR[x.month]),
        trend.map((x) => x.pax25),
        trend.map((x) => x.pax26),
        this.getChartColors()
      );
    },
    closeGuideDetail() {
      const modal = this._el("guide-detail-modal");
      if (!modal || !modal.classList.contains("open")) return;
      modal.classList.remove("open");
      this._el("guide-detail-backdrop").classList.remove("open");
      if (this.guideTrendChartInstance) {
        this.guideTrendChartInstance.destroy();
        this.guideTrendChartInstance = null;
      }
      if (this._detailTrigger && document.contains(this._detailTrigger)) this._detailTrigger.focus();
      this._detailTrigger = null;
    },
    jumpToGuide(name) {
      this.activeCity = "all";
      this.guideQuery = "";
      this.activeSort = "default";
      this.guideView = "cards";
      const wasInitialized = this._initialized;
      showPage("page-gd", document.getElementById("tab-gd"));
      if (wasInitialized) {
        this.rebuildStructure();
        this.renderAll();
      }
      requestAnimationFrame(() => {
        const card = document.querySelector(`#page-gd .guide-card[data-name="${CSS.escape(safeName(name))}"]`);
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("guide-card-highlight");
        setTimeout(() => card.classList.remove("guide-card-highlight"), 1500);
      });
    },
    _deltaCells(d) {
      const cls = d.delta > 0 ? "pos" : d.delta < 0 ? "neg" : "neu";
      const sign = d.delta > 0 ? "+" : "";
      return `<td>${fmtN(d.v25)}</td><td>${fmtN(d.v26)}</td><td><span class="${cls}">${sign}${fmtN(d.delta)}</span></td><td><span class="${cls}">${pctLabel(d, t("labels.badgeNew"))}</span></td>`;
    },
    guideTableHtml(shown, totalRow) {
      const heads = { freeTours: "labels.freeTours", freePax: "labels.freePax", paidTours: "labels.paidTours", paidPax: "labels.paidPax", totalTours: "labels.totalTours" };
      const groupHeads = TABLE_METRICS.map((k) => `<th colspan="4" class="mpax-city-head gd-group-head">${t(heads[k])}</th>`).join("");
      const subHeads = TABLE_METRICS.map(() => `<th class="mpax-sub-head">'25</th><th class="mpax-sub-head">'26</th><th class="mpax-sub-head">\xB1</th><th class="mpax-sub-head">\xB1%</th>`).join("");
      const body = shown.map((r) => `<tr><td class="mpax-month">${r.name} <span class="gd-city">${r.city}</span></td>${TABLE_METRICS.map((k) => this._deltaCells(r[k])).join("")}</tr>`).join("");
      const foot = `<tr class="mpax-total"><td class="mpax-month">${t("labels.total")}</td>${TABLE_METRICS.map((k) => this._deltaCells(totalRow[k])).join("")}</tr>`;
      return `<div class="chart-card"><div class="mpax-wrap"><table class="mpax-table" id="guide-table-gd"><thead><tr><th class="mpax-month-head" rowspan="2">${t("labels.guide")}</th>${groupHeads}</tr><tr>${subHeads}</tr></thead><tbody>${body}${foot}</tbody></table></div><div class="mpax-note">${t("labels.guideTotalNote")}</div></div>`;
    },
    _buildHeader() {
      return `<div class="header">
            <div class="header-left">
                <h1>${t("labels.guides")} <span class="accent">25/26</span></h1>
                <p><span class="ytd-range-label">${getRangeLabel()}</span> 2025 vs. 2026 &middot; ${t("sections.productionByGuide")}</p>
            </div>
            <div class="header-right">
                <div id="date-pov-gd" class="mb-6"></div>
                <div class="header-badge">${t("sections.comparisonYtd")}</div>
            </div>
        </div>`;
    },
    _buildFilters() {
      const cityPills = ["all", ...CITIES].map((c) => {
        const col = getCityColor(c);
        const label = c === "all" ? t("labels.all") : c;
        const active = this.activeCity === c ? " active" : "";
        const style = col ? ` style="--city-col:${col}"` : "";
        return `<button class="city-filter-pill${active}" data-city="${c}"${style} onclick="PageGuides.filterCity('${c}')">${label}</button>`;
      }).join("");
      const pill = (value, key) => `<button class="pill${this.activeSort === value ? " active" : ""}" data-value="${value}" onclick="PageGuides.setGuideSort('${value}',this)">${t(key)}</button>`;
      return `<div class="main">
            <div class="filter-bar">
                <div class="city-pill-group">${cityPills}</div>
                <div class="filter-dropdowns">
                    <div class="city-pill-group lang-pill-group" id="lang-filter-gd" role="group" aria-label="${t("labels.language")}">
                        ${[["all", t("labels.all")], ["eng", "ENG"], ["esp", "ESP"], ["fra", "FRA"]].map(([v, label]) => `<button class="city-filter-pill lang-pill${this.activeLang === v ? " active" : ""}" data-lang="${v}" onclick="PageGuides.filterLang('${v}')">${label}</button>`).join("")}
                    </div>
                    <div class="filter-field">
                        <label class="filter-label" for="month-filter-gd">${t("labels.mo")}</label>
                        <select class="filter-select" id="month-filter-gd" onchange="PageGuides.filterMonth(this.value)"></select>
                    </div>
                </div>
            </div>
            <div class="guide-tools">
                <div id="guide-sort-pills-gd" class="pill-group">
                    ${pill("default", "labels.sortDefault")}${pill("name", "labels.sortName")}${pill("gain", "labels.sortGain")}${pill("drop", "labels.sortDrop")}
                </div>
                <input type="text" id="guide-search-gd" class="guide-search" placeholder="${t("labels.searchGuide")}" oninput="PageGuides.setGuideQuery(this.value)">
                <div class="pill-group" id="guide-view-pills-gd">
                    <button class="pill${this.guideView === "cards" ? " active" : ""}" id="guide-view-cards-gd" onclick="PageGuides.setGuideView('cards')">${t("labels.viewCards")}</button>
                    <button class="pill${this.guideView === "table" ? " active" : ""}" id="guide-view-table-gd" onclick="PageGuides.setGuideView('table')">${t("labels.viewTable")}</button>
                </div>
            </div>
            <div id="guide-flags-gd"></div>
            <div id="guide-sections-gd"></div>
        </div>`;
    },
    // Mounted on body, not inside the page: .page.active keeps a transform from its
    // entry animation, which would make it the containing block of position:fixed.
    _mountModal() {
      document.querySelectorAll("#guide-detail-backdrop-gd, #guide-detail-modal-gd").forEach((el) => el.remove());
      document.body.insertAdjacentHTML("beforeend", `
            <div class="guide-detail-backdrop" id="guide-detail-backdrop-gd"></div>
            <div class="guide-detail-modal" id="guide-detail-modal-gd" role="dialog" aria-modal="true" aria-labelledby="guide-detail-name-gd">
                <button class="guide-detail-close" id="guide-detail-close-gd" aria-label="Close">&times;</button>
                <div class="guide-detail-head">
                    <h3 id="guide-detail-name-gd"></h3>
                    <span id="guide-detail-city-gd" class="guide-detail-city"></span>
                </div>
                <div class="guide-detail-note" id="guide-detail-note-gd"></div>
                <div class="guide-detail-chart-wrap"><canvas id="guideTrendChart-gd"></canvas></div>
                <div class="guide-detail-section-title">${t("labels.tourType")}</div>
                <div id="guide-detail-types-gd"></div>
                <div class="guide-detail-section-title">${t("labels.monthly")}</div>
                <div id="guide-detail-months-gd"></div>
            </div>
        `);
    },
    rebuildStructure() {
      this.closeGuideDetail();
      document.getElementById("page-gd").innerHTML = this._buildHeader() + this._buildFilters();
      this._mountModal();
      this._el("lang-filter").value = this.activeLang;
      this._el("guide-search").value = this.guideQuery;
      const d = new Date(getGlobalDate());
      const fmt2 = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const datePov = this._el("date-pov");
      if (datePov) datePov.textContent = fmt2;
    },
    init() {
      if (this._initialized) return;
      this._initialized = true;
      this.rebuildStructure();
      this.renderAll();
      const root = document.getElementById("page-gd");
      root.addEventListener("click", (e) => {
        const card = e.target.closest(".guide-card");
        if (card) this.openGuideDetail(card.dataset.name, card);
      });
      document.addEventListener("click", (e) => {
        if (e.target.id === "guide-detail-backdrop-gd" || e.target.id === "guide-detail-close-gd") this.closeGuideDetail();
      });
      root.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("guide-card")) {
          e.preventDefault();
          this.openGuideDetail(e.target.dataset.name, e.target);
        }
      });
      document.addEventListener("keydown", (e) => {
        const modal = this._el("guide-detail-modal");
        if (!modal || !modal.classList.contains("open")) return;
        if (e.key === "Escape" || /^[1-5]$/.test(e.key)) this.closeGuideDetail();
        if (e.key === "Tab") {
          e.preventDefault();
          this._el("guide-detail-close").focus();
        }
      });
    }
  };
  registerPage("PageGuides", PageGuides);

  // src/pages/management/helpers.js
  function fmt(v, dec = 0) {
    return (v || 0).toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtEur(v) {
    const n = v || 0;
    return (n < 0 ? "\u2212\u20AC" : "\u20AC") + fmt(Math.abs(n));
  }
  function gmClass(v) {
    return v > 0 ? "pos" : v < 0 ? "neg" : "neu";
  }
  function deltaClass(v) {
    return v > 0 ? "delta-pos" : v < 0 ? "delta-neg" : "delta-neu";
  }
  function dd(v, eurSign = false) {
    if (v === null || v === void 0) return '<span class="delta-neu">\u2014</span>';
    const cls = deltaClass(v);
    const sign = v > 0 ? "+" : v < 0 ? "\u2212" : "";
    const abs = fmt(Math.abs(v));
    return `<span class="${cls}">${sign}${eurSign ? "\u20AC" : ""}${abs}</span>`;
  }
  var _guide25 = null;
  function _build25Lookup() {
    const map = {};
    if (typeof guideStats25 !== "undefined") guideStats25.forEach((g) => {
      map[g.name] = g;
    });
    return map;
  }
  function get25(name) {
    if (!_guide25) _guide25 = _build25Lookup();
    return _guide25[name] || null;
  }
  function guidesForCity(city) {
    return guideStats26.filter((g) => city === "all" || g.city === city);
  }
  function _sumMgmtMonths(mgmt, cutoff) {
    const acc = {
      revenue: 0,
      vendorCost: 0,
      grossMargin: 0,
      tourCost: 0,
      commissionCost: 0,
      processingFee: 0,
      vatAmount: 0,
      amountBeforeTax: 0
    };
    for (let m = 1; m <= cutoff; m++) {
      const d = mgmt?.byMonth?.[String(m)] || {};
      acc.revenue += d.revenue || 0;
      acc.vendorCost += d.vendorCost || 0;
      acc.grossMargin += d.grossMargin || 0;
      acc.tourCost += d.tourCost || 0;
      acc.commissionCost += d.commissionCost || 0;
      acc.processingFee += d.processingFee || 0;
      acc.vatAmount += d.vatAmount || 0;
      acc.amountBeforeTax += d.amountBeforeTax || 0;
    }
    return acc;
  }
  function filterMgmtByDate(mgmt, cutoffDate) {
    if (!mgmt || !cutoffDate) return { revenue: 0, vendorCost: 0, grossMargin: 0, tourCost: 0, commissionCost: 0, processingFee: 0, vatAmount: 0, amountBeforeTax: 0 };
    const [, monthStr, dayStr] = cutoffDate.split("-");
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay = parseInt(dayStr);
    const acc = { revenue: 0, vendorCost: 0, grossMargin: 0, tourCost: 0, commissionCost: 0, processingFee: 0, vatAmount: 0, amountBeforeTax: 0 };
    if (!mgmt.byDay) return _sumMgmtMonths(mgmt, cutoffMonth);
    for (const [key, val] of Object.entries(mgmt.byDay)) {
      const [m, d] = key.split("-").map(Number);
      if (m < cutoffMonth || m === cutoffMonth && d <= cutoffDay) {
        acc.revenue += val.revenue || 0;
        acc.vendorCost += val.vendorCost || 0;
        acc.grossMargin += val.grossMargin || 0;
        acc.tourCost += val.tourCost || 0;
        acc.commissionCost += val.commissionCost || 0;
        acc.processingFee += val.processingFee || 0;
        acc.vatAmount += val.vatAmount || 0;
        acc.amountBeforeTax += val.amountBeforeTax || 0;
      }
    }
    return acc;
  }
  function filterStatsByDate(stats, cutoffDate) {
    if (!stats || !cutoffDate) return { freeTours: 0, paidTours: 0, freePax: 0, paidPax: 0 };
    const [, monthStr, dayStr] = cutoffDate.split("-");
    const cutoffMonth = parseInt(monthStr);
    const cutoffDay = parseInt(dayStr);
    let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
    if (!stats.byDay) {
      for (let m = 1; m <= cutoffMonth; m++) {
        const bm = stats.byMonth?.[String(m)] || {};
        freeTours += bm.free?.tours || 0;
        paidTours += bm.paid?.tours || 0;
        freePax += bm.free?.pax || 0;
        paidPax += bm.paid?.pax || 0;
      }
      return { freeTours, paidTours, freePax, paidPax };
    }
    for (const [key, val] of Object.entries(stats.byDay)) {
      const [m, d] = key.split("-").map(Number);
      if (m < cutoffMonth || m === cutoffMonth && d <= cutoffDay) {
        freeTours += val.free?.tours || 0;
        paidTours += val.paid?.tours || 0;
        freePax += val.free?.pax || 0;
        paidPax += val.paid?.pax || 0;
      }
    }
    return { freeTours, paidTours, freePax, paidPax };
  }
  function computeKpisForGuides(guides) {
    return guides.reduce((acc, g) => {
      if (!g.mgmt) return acc;
      const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
      const sts = filterStatsByDate(g.stats.all, getGlobalDate());
      acc.revenue += fin.revenue;
      acc.vendorCost += fin.vendorCost;
      acc.grossMargin += fin.grossMargin;
      acc.tourCost += fin.tourCost;
      acc.commissionCost += fin.commissionCost;
      acc.processingFee += fin.processingFee;
      acc.vatAmount += fin.vatAmount;
      acc.amountBeforeTax += fin.amountBeforeTax;
      acc.freeTours += sts.freeTours;
      acc.paidTours += sts.paidTours;
      acc.freePax += sts.freePax;
      acc.paidPax += sts.paidPax;
      return acc;
    }, {
      revenue: 0,
      vendorCost: 0,
      grossMargin: 0,
      tourCost: 0,
      commissionCost: 0,
      processingFee: 0,
      vatAmount: 0,
      amountBeforeTax: 0,
      freeTours: 0,
      paidTours: 0,
      freePax: 0,
      paidPax: 0
    });
  }
  var _kpiCache = {};
  function computeFilteredKpis(city) {
    const key = `${getGlobalDate()}-${city}`;
    if (!_kpiCache[key]) _kpiCache[key] = computeKpisForGuides(guidesForCity(city));
    return _kpiCache[key];
  }
  function clearKpiCache() {
    _kpiCache = {};
  }
  function computeCity25(city) {
    if (typeof guideStats25 === "undefined") return null;
    const src = city === "all" ? guideStats25 : guideStats25.filter((g) => g.city === city);
    return computeKpisForGuides(src);
  }
  function buildMonthlyFromDays(guides, cutoffMonth, cutoffDay, fields = ["revenue", "grossMargin"]) {
    const init = () => Object.fromEntries(fields.map((f) => [f, 0]));
    const result = {};
    for (let m = 1; m <= cutoffMonth; m++) result[m] = init();
    guides.forEach((g) => {
      if (!g.mgmt) return;
      if (g.mgmt.byDay) {
        for (const [key, val] of Object.entries(g.mgmt.byDay)) {
          const [m, d] = key.split("-").map(Number);
          if (m < cutoffMonth || m === cutoffMonth && d <= cutoffDay) {
            fields.forEach((f) => {
              result[m][f] += val[f] || 0;
            });
          }
        }
      } else if (g.mgmt.byMonth) {
        for (const [mStr, val] of Object.entries(g.mgmt.byMonth)) {
          const m = Number(mStr);
          if (m <= cutoffMonth) fields.forEach((f) => {
            result[m][f] += val[f] || 0;
          });
        }
      }
    });
    return result;
  }
  function findBiggestNegativeMover(entries, minRevenue = 500) {
    return entries.filter((e) => e.revenue26 >= minRevenue || e.revenue25 >= minRevenue).map((e) => ({ ...e, delta: e.gm26 - e.gm25 })).filter((e) => e.delta < 0).sort((a, b) => a.delta - b.delta)[0] || null;
  }
  function renderInsightCallouts(k, k25, elId = "insight-strip") {
    const el = document.getElementById(elId);
    if (!el || !k25) {
      if (el) el.innerHTML = "";
      return;
    }
    const gmPct26 = k.revenue > 0 ? k.grossMargin / k.revenue * 100 : 0;
    const gmPct25 = k25.revenue > 0 ? k25.grossMargin / k25.revenue * 100 : 0;
    const commPct26 = k.revenue > 0 ? k.commissionCost / k.revenue * 100 : 0;
    const commPct25 = k25.revenue > 0 ? k25.commissionCost / k25.revenue * 100 : 0;
    const avgGm26 = k.paidTours > 0 ? k.grossMargin / k.paidTours : 0;
    const avgGm25 = k25.paidTours > 0 ? k25.grossMargin / k25.paidTours : 0;
    const candidates = [
      {
        label: "Revenue",
        val: k.revenue - k25.revenue,
        fmt: (v) => (v >= 0 ? "+" : "\u2212") + "\u20AC" + fmt(Math.abs(v)),
        pct: k25.revenue !== 0 ? (k.revenue - k25.revenue) / Math.abs(k25.revenue) * 100 : null,
        positive: true
      },
      {
        label: "Gross Margin",
        val: k.grossMargin - k25.grossMargin,
        fmt: (v) => (v >= 0 ? "+" : "\u2212") + "\u20AC" + fmt(Math.abs(v)),
        pct: k25.grossMargin !== 0 ? (k.grossMargin - k25.grossMargin) / Math.abs(k25.grossMargin) * 100 : null,
        positive: true
      },
      {
        label: "GM%",
        val: gmPct26 - gmPct25,
        fmt: (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "pp margin",
        pct: null,
        positive: true
      },
      {
        label: "Commission rate",
        val: commPct26 - commPct25,
        fmt: (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "pp of rev",
        pct: null,
        positive: false
      },
      {
        label: "Avg GM/tour",
        val: avgGm26 - avgGm25,
        fmt: (v) => (v >= 0 ? "+" : "\u2212") + "\u20AC" + fmt(Math.abs(v)) + "/tour",
        pct: null,
        positive: true
      }
    ];
    const top = candidates.filter((c) => ["Revenue", "Gross Margin", "GM%"].includes(c.label));
    el.innerHTML = top.map((c) => {
      const isGood = c.positive ? c.val >= 0 : c.val <= 0;
      const cls = isGood ? "insight-pos" : "insight-neg";
      const arrow = isGood ? "\u25B2" : "\u25BC";
      const pctStr = c.pct !== null ? ` (${c.pct >= 0 ? "+" : ""}${c.pct.toFixed(1)}%)` : "";
      return `<span class="insight-pill ${cls}">${arrow} ${c.label} ${c.fmt(c.val)}${pctStr} vs 2025</span>`;
    }).join("");
  }
  function axisDefaults2() {
    const s = getComputedStyle(document.body);
    return {
      ticks: { color: s.getPropertyValue("--text2").trim(), font: { family: "IBM Plex Sans", size: 11 } },
      grid: { color: s.getPropertyValue("--border").trim() }
    };
  }
  function tooltipDefaults2() {
    const s = getComputedStyle(document.body);
    return {
      backgroundColor: s.getPropertyValue("--card-bg").trim(),
      titleColor: s.getPropertyValue("--text").trim(),
      bodyColor: s.getPropertyValue("--text2").trim(),
      borderColor: s.getPropertyValue("--border-dark").trim(),
      borderWidth: 1
    };
  }
  function getThemeColors() {
    const s = getComputedStyle(document.body);
    return {
      c25: s.getPropertyValue("--y25").trim(),
      c26: s.getPropertyValue("--y26").trim(),
      green: s.getPropertyValue("--green").trim(),
      red: s.getPropertyValue("--delta-neg").trim() || "#D4545A"
    };
  }
  var _charts = {};
  function destroyChart(id) {
    if (_charts[id]) {
      _charts[id].destroy();
      delete _charts[id];
    }
  }
  function makeBarChart(canvasId, labels, datasets, opts = {}) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;
    const ax = axisDefaults2();
    const dsets = Array.isArray(datasets) && typeof datasets[0] === "object" && datasets[0].data !== void 0 ? datasets : [{ data: datasets, backgroundColor: opts.colors || "#8FA8BC", borderRadius: 4, borderSkipped: false }];
    _charts[canvasId] = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: dsets },
      options: {
        indexAxis: opts.horizontal ? "y" : "x",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: opts.showLegend || false, labels: { color: ax.ticks.color, font: ax.ticks.font } },
          tooltip: { ...tooltipDefaults2(), callbacks: opts.tooltipCb || {} }
        },
        scales: {
          x: { ...ax, grid: opts.horizontal ? ax.grid : { display: false }, stacked: opts.stacked || false },
          y: { ...ax, grid: opts.horizontal ? { display: false } : ax.grid, stacked: opts.stacked || false }
        }
      }
    });
  }
  function makeLineChart(canvasId, labels, datasets, extraScales = null) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;
    const ax = axisDefaults2();
    const scales = extraScales || { x: ax, y: ax };
    _charts[canvasId] = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { labels: { color: ax.ticks.color, font: ax.ticks.font } },
          tooltip: { ...tooltipDefaults2() }
        },
        scales
      }
    });
  }
  function countUp(el, endValue, formatter, delayMs = 0) {
    const duration = 650;
    const absEnd = Math.abs(endValue);
    const sign = endValue < 0 ? -1 : 1;
    const startAt = performance.now() + delayMs;
    function tick(now) {
      if (now < startAt) {
        requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatter(Math.round(sign * absEnd * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // src/pages/management/pl.js
  var _kpiFirstRender = true;
  function _isoWeek(dateStr) {
    const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
    const thu = new Date(d);
    thu.setDate(d.getDate() + (4 - (d.getDay() || 7)));
    const yearStart = new Date(thu.getFullYear(), 0, 1);
    return Math.ceil(((thu - yearStart) / 864e5 + 1) / 7);
  }
  function renderWeekFlash() {
    const el = document.getElementById("week-flash");
    if (!el) return;
    const wk = _isoWeek(getGlobalDate());
    const wkStr = String(wk);
    const _d = /* @__PURE__ */ new Date(getGlobalDate() + "T00:00:00");
    _d.setDate(_d.getDate() - (_d.getDay() + 6) % 7);
    const _sun = new Date(_d);
    _sun.setDate(_d.getDate() + 6);
    const _M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateRangeLabel = `${_d.getDate()} ${_M[_d.getMonth()]} \u2013 ${_sun.getDate()} ${_M[_sun.getMonth()]}`;
    const w26 = kpiTotals26.mgmt.byWeek?.[wkStr];
    const w25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt?.byWeek?.[wkStr] : null;
    if (!w26) {
      el.innerHTML = `<span class="week-chip-title">Week ${wk} \xB7 ${dateRangeLabel} \u2014 no data</span>`;
      return;
    }
    const gmPct = w26.revenue > 0 ? (w26.grossMargin / w26.revenue * 100).toFixed(1) : "\u2014";
    const revDelta = w25 ? w26.revenue - w25.revenue : null;
    const gmDelta = w25 ? w26.grossMargin - w25.grossMargin : null;
    function chip(label, val, delta, isCurrency) {
      let dHtml = "";
      if (delta !== null) {
        const sign = delta >= 0 ? "+" : "\u2212";
        const dFmt = isCurrency ? `\u20AC${fmt(Math.abs(delta))}` : fmt(Math.abs(delta));
        dHtml = ` <span class="${delta >= 0 ? "delta-pos" : "delta-neg"}">${sign}${dFmt} vs '25</span>`;
      }
      return `<div class="week-chip"><span class="week-chip-label">${label}</span><span class="week-chip-val">${val}</span>${dHtml}</div>`;
    }
    el.innerHTML = `<span class="week-chip-title">Week ${wk} \xB7 ${dateRangeLabel}</span>` + chip("Tours", fmt(w26.tours), w25 ? w26.tours - w25.tours : null, false) + chip("Revenue", fmtEur(w26.revenue), revDelta, true) + chip("GM", fmtEur(w26.grossMargin) + ` (${gmPct}%)`, gmDelta, true);
  }
  function initPl(city) {
    renderWeekFlash();
    renderPlKpis(city);
    renderWaterfall();
    renderMonthTrend();
    renderBillingTrend();
    _positionStickyBar();
    window.addEventListener("resize", _positionStickyBar, { passive: true });
    const kpiGrid = document.querySelector("#mgmt-pl .kpi-grid");
    if (kpiGrid && "IntersectionObserver" in window) {
      const obs = new IntersectionObserver(([entry]) => {
        const isPlActive = document.querySelector("#mgmt-pl")?.classList.contains("active");
        if (!isPlActive) return;
        const bar = document.getElementById("sticky-kpi-bar");
        if (bar) bar.style.display = entry.isIntersecting ? "none" : "flex";
      }, { threshold: 0 });
      obs.observe(kpiGrid);
    }
  }
  function _positionStickyBar() {
    const nav = document.querySelector(".nav");
    const bar = document.getElementById("sticky-kpi-bar");
    if (nav && bar) bar.style.top = nav.offsetHeight + "px";
  }
  function renderPlKpis(city) {
    const k = computeFilteredKpis(city);
    const k25 = computeCity25(city);
    const gmPct = k.revenue > 0 ? k.grossMargin / k.revenue * 100 : 0;
    const commPct = k.revenue > 0 ? k.commissionCost / k.revenue * 100 : 0;
    const avgGm = k.paidTours > 0 ? k.grossMargin / k.paidTours : 0;
    function kpiDelta(val26, val25) {
      if (!k25 || !val25) return "";
      const d = val26 - val25;
      const pct = val25 !== 0 ? d / Math.abs(val25) * 100 : null;
      const cls = d > 0 ? "delta-pos" : d < 0 ? "delta-neg" : "delta-neu";
      const sign = d >= 0 ? "+" : "\u2212";
      const pctStr = pct !== null ? ` (${d >= 0 ? "+" : ""}${pct.toFixed(1)}%)` : "";
      return `<div class="mgmt-kpi-delta ${cls}">${sign}\u20AC${fmt(Math.abs(d))}${pctStr} vs 2025</div>`;
    }
    const _animate = _kpiFirstRender;
    if (_kpiFirstRender) _kpiFirstRender = false;
    function setVal(id, value, formatter, delay = 0) {
      const el = document.getElementById(id);
      if (!el) return;
      if (_animate) countUp(el, value, formatter, delay);
      else el.textContent = formatter(value);
    }
    setVal("kpi-revenue", k.revenue, fmtEur, 0);
    document.getElementById("kpi-revenue-sub").innerHTML = `${t("management.gmOfRevenue")}: ${gmPct.toFixed(1)}% ${t("management.ofRevenue")}` + kpiDelta(k.revenue, k25?.revenue);
    setVal("kpi-commission", k.commissionCost, fmtEur, 80);
    document.getElementById("kpi-commission-sub").innerHTML = `${commPct.toFixed(1)}% ${t("management.ofRevenue")}` + kpiDelta(k.commissionCost, k25?.commissionCost);
    setVal("kpi-vcost", k.vendorCost, fmtEur, 160);
    document.getElementById("kpi-vcost-sub").innerHTML = t("management.guideFeesPaid") + kpiDelta(k.vendorCost, k25?.vendorCost);
    setVal("kpi-gm", k.grossMargin, fmtEur, 240);
    document.getElementById("kpi-gmpct").innerHTML = `<span class="${gmClass(gmPct)}">${gmPct.toFixed(1)}% ${t("management.margin")}</span>`;
    document.getElementById("kpi-gm-delta").innerHTML = kpiDelta(k.grossMargin, k25?.grossMargin);
    document.getElementById("kpi-tour-cost").textContent = fmtEur(k.tourCost);
    document.getElementById("kpi-vat").textContent = fmtEur(k.vatAmount);
    setVal("kpi-avg-gm", avgGm, fmtEur, 320);
    document.getElementById("kpi-avg-gm-sub").textContent = `${t("management.perPaidTour")} (${fmt(k.paidTours)} ${t("management.tours")})`;
    document.getElementById("kpi-guides").textContent = fmt(guidesForCity(city).length);
    document.getElementById("kpi-guides-sub").textContent = city === "all" ? t("management.acrossAllCities") : city;
    document.getElementById("kpi-tour-cost-delta").innerHTML = kpiDelta(k.tourCost, k25?.tourCost);
    const avgGm25 = k25 && k25.paidTours > 0 ? k25.grossMargin / k25.paidTours : null;
    document.getElementById("kpi-avg-gm-delta").innerHTML = kpiDelta(avgGm, avgGm25);
    const rangeLabel = getRangeLabel();
    const sBar = document.getElementById("sticky-kpi-bar");
    if (sBar) {
      document.getElementById("skpi-revenue").textContent = fmtEur(k.revenue);
      document.getElementById("skpi-commission").textContent = fmtEur(k.commissionCost);
      document.getElementById("skpi-gm").textContent = fmtEur(k.grossMargin);
      document.getElementById("skpi-gmpct").textContent = gmPct.toFixed(1) + "% GM";
      document.getElementById("skpi-period").textContent = rangeLabel + " 2026";
    }
    renderInsightCallouts(k, k25);
    renderPlGuideDrilldown(city);
  }
  function renderPlGuideDrilldown(city) {
    const guides = guidesForCity(city);
    const el = document.getElementById("pl-guide-drilldown");
    if (!el || guides.length === 0) return;
    const rows = guides.map((g) => {
      const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
      const sts = filterStatsByDate(g.stats.all, getGlobalDate());
      const gmPct = fin.revenue > 0 ? fin.grossMargin / fin.revenue * 100 : 0;
      const g25 = get25(g.name);
      const fin25 = g25?.mgmt ? filterMgmtByDate(g25.mgmt, getGlobalDate()) : null;
      const dGm = fin25 ? fin.grossMargin - fin25.grossMargin : null;
      return {
        name: g.name,
        city: g.city,
        revenue: fin.revenue,
        grossMargin: fin.grossMargin,
        gmPct,
        dGm
      };
    });
    rows.sort((a, b) => b.grossMargin - a.grossMargin);
    const top10 = rows.slice(0, 10);
    el.innerHTML = `<div style="padding: 16px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px;">
        <div style="font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 12px;">${t("management.topGuidesMargin")}</div>
        <table class="mgmt-table" style="font-size: 11px;">
            <thead><tr>
                <th>${t("management.guide")}</th>
                <th>${t("management.revenue")}</th>
                <th>${t("management.gmEuro")}</th>
                <th>${t("management.gmPercent")}</th>
                <th>${t("management.vs2025")}</th>
            </tr></thead>
            <tbody>
                ${top10.map((r) => {
      let rowClass = "row-healthy";
      if (r.gmPct < 10 || r.dGm !== null && r.dGm < -500) rowClass = "row-poor";
      else if (r.gmPct < 20) rowClass = "row-warn";
      return `<tr class="${rowClass}">
                        <td><strong>${r.name}</strong></td>
                        <td>${fmtEur(r.revenue)}</td>
                        <td class="${gmClass(r.grossMargin)}">${fmtEur(r.grossMargin)}</td>
                        <td class="${gmClass(r.gmPct)}">${r.gmPct.toFixed(1)}%</td>
                        <td>${dd(r.dGm, true)}</td>
                    </tr>`;
    }).join("")}
            </tbody>
        </table>
    </div>`;
  }
  function renderWaterfall() {
    const has25 = typeof guideStats25 !== "undefined";
    const guides26 = guideStats26.filter((g) => g.mgmt);
    const guides25 = has25 ? guideStats25.filter((g) => g.mgmt) : [];
    const t26 = guides26.reduce((acc, g) => {
      const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
      acc.revenue += fin.revenue;
      acc.commissionCost += fin.commissionCost;
      acc.vatAmount += fin.vatAmount;
      acc.vendorCost += fin.vendorCost;
      acc.tourCost += fin.tourCost;
      acc.grossMargin += fin.grossMargin;
      return acc;
    }, { revenue: 0, commissionCost: 0, vatAmount: 0, vendorCost: 0, tourCost: 0, grossMargin: 0 });
    let t25 = null;
    if (has25) {
      t25 = guides25.reduce((acc, g) => {
        const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
        acc.revenue += fin.revenue;
        acc.commissionCost += fin.commissionCost;
        acc.vatAmount += fin.vatAmount;
        acc.vendorCost += fin.vendorCost;
        acc.tourCost += fin.tourCost;
        acc.grossMargin += fin.grossMargin;
        return acc;
      }, { revenue: 0, commissionCost: 0, vatAmount: 0, vendorCost: 0, tourCost: 0, grossMargin: 0 });
    }
    const labels = [t("management.revenue"), t("management.commission"), t("management.vat"), t("management.vendorCost"), t("management.tourCost"), t("management.grossMargin")];
    const { c25, c26, red: cNeg } = getThemeColors();
    const vals26 = [t26.revenue, -t26.commissionCost, -t26.vatAmount, -t26.vendorCost, -t26.tourCost, t26.grossMargin];
    const MONTH_NAMES_SHORT = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
    const { month: cutoffMonth } = parseGlobalDate();
    const rangeLabel = cutoffMonth === 1 ? "Jan" : `Jan\u2013${MONTH_NAMES_SHORT[cutoffMonth]}`;
    const datasets = [
      {
        label: `2026 ${rangeLabel}`,
        data: vals26,
        backgroundColor: vals26.map((v) => v >= 0 ? c26 + "cc" : cNeg + "cc"),
        borderRadius: 4,
        borderSkipped: false
      }
    ];
    if (t25) {
      const vals25 = [t25.revenue, -t25.commissionCost, -t25.vatAmount, -t25.vendorCost, -t25.tourCost, t25.grossMargin];
      datasets.unshift({
        label: `2025 ${rangeLabel}`,
        data: vals25,
        backgroundColor: vals25.map((v) => v >= 0 ? c25 + "aa" : cNeg + "66"),
        borderRadius: 4,
        borderSkipped: false
      });
    }
    makeBarChart("waterfall-bar", labels, datasets, {
      showLegend: true,
      tooltipCb: { label: (ctx) => `${ctx.dataset.label}: \u20AC${fmt(Math.abs(ctx.parsed.y))}` }
    });
    const titleEl = document.getElementById("waterfall-chart-title");
    if (titleEl) titleEl.textContent = `${t("management.plBreakdown")} \u2014 ${rangeLabel} 2025 vs 2026`;
    const el = document.getElementById("waterfall-summary");
    if (el) {
      const rows = [
        ["Revenue", t26.revenue, t25 ? t25.revenue : null, true],
        ["Commission", -t26.commissionCost, t25 ? -t25.commissionCost : null, false],
        ["VAT", -t26.vatAmount, t25 ? -t25.vatAmount : null, false],
        ["Vendor Cost", -t26.vendorCost, t25 ? -t25.vendorCost : null, false],
        ["Tour Cost", -t26.tourCost, t25 ? -t25.tourCost : null, false],
        ["Gross Margin", t26.grossMargin, t25 ? t25.grossMargin : null, true]
      ];
      const hasPrior = !!t25;
      el.innerHTML = `<table class="mgmt-table">
            <thead><tr>
                <th>${t("management.plItem")}</th>
                <th>2026 ${rangeLabel}</th>
                ${hasPrior ? `<th>2025 ${rangeLabel}</th><th>\u0394 \u20AC</th><th>\u0394 %</th>` : ""}
            </tr></thead>
            <tbody>${rows.map(([label, v26, v25, isPos]) => {
        const hasDelta = hasPrior && v25 !== null;
        const d = hasDelta ? v26 - v25 : null;
        const pct = hasDelta && v25 !== 0 ? d / Math.abs(v25) * 100 : null;
        const cls = d !== null ? d > 0 ? isPos ? "pos" : "neg" : d < 0 ? isPos ? "neg" : "pos" : "neu" : "";
        return `<tr>
                    <td><strong>${label}</strong></td>
                    <td class="${gmClass(v26)}">${fmtEur(v26)}</td>
                    ${hasDelta ? `
                    <td>${fmtEur(v25)}</td>
                    <td class="${cls}">${d >= 0 ? "+" : "\u2212"}\u20AC${fmt(Math.abs(d))}</td>
                    <td class="${cls}">${pct !== null ? (d >= 0 ? "+" : "") + pct.toFixed(1) + "%" : "\u2014"}</td>` : ""}
                </tr>`;
      }).join("")}</tbody>
        </table>`;
    }
  }
  function renderMonthTrend() {
    const has25 = typeof guideStats25 !== "undefined";
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();
    const m26 = buildMonthlyFromDays(guideStats26, cutoffMonth, cutoffDay);
    const m25 = has25 ? buildMonthlyFromDays(guideStats25, cutoffMonth, cutoffDay) : {};
    const allM = Array.from({ length: cutoffMonth }, (_, i) => i + 1);
    const MONTH_SHORT = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
    const { c25, c26 } = getThemeColors();
    makeLineChart("month-gm-line", allM.map((m) => MONTH_SHORT[m]), [
      { label: t("management.grossMargin") + " 2025", data: allM.map((m) => m25[m]?.grossMargin || 0), borderColor: c25, backgroundColor: "transparent", tension: 0.3, borderDash: [5, 3] },
      { label: t("management.grossMargin") + " 2026", data: allM.map((m) => m26[m]?.grossMargin || 0), borderColor: c26, backgroundColor: c26 + "22", tension: 0.3, fill: true },
      { label: t("management.revenue") + " 2025", data: allM.map((m) => m25[m]?.revenue || 0), borderColor: c25, backgroundColor: "transparent", tension: 0.3, borderDash: [2, 2], borderWidth: 1.5 },
      { label: t("management.revenue") + " 2026", data: allM.map((m) => m26[m]?.revenue || 0), borderColor: "#8FA8BC", backgroundColor: "transparent", tension: 0.3, borderWidth: 1.5 }
    ]);
  }
  function renderBillingTrend() {
    const has25 = typeof guideStats25 !== "undefined";
    function aggregateBillingByDate(guides) {
      const billing = { POS: { revenue: 0, grossMargin: 0 }, CPP: { revenue: 0, grossMargin: 0 } };
      guides.forEach((g) => {
        if (!g.mgmt || !g.mgmt.byBillingMethod) return;
        const fullRevenue = g.mgmt.revenue || 0;
        if (fullRevenue === 0) return;
        const filtered = filterMgmtByDate(g.mgmt, getGlobalDate());
        const ratio = filtered.revenue / fullRevenue;
        for (const [method, data] of Object.entries(g.mgmt.byBillingMethod)) {
          if (!billing[method]) billing[method] = { revenue: 0, grossMargin: 0 };
          billing[method].revenue += (data.revenue || 0) * ratio;
          billing[method].grossMargin += (data.grossMargin || 0) * ratio;
        }
      });
      return billing;
    }
    const billing26 = aggregateBillingByDate(guideStats26);
    const billing25 = has25 ? aggregateBillingByDate(guideStats25) : {};
    const labels = ["POS", "CPP"];
    const { c25, c26 } = getThemeColors();
    makeBarChart("billing-bar", labels, [
      { label: "2025 " + t("management.revenue"), data: labels.map((k) => billing25[k]?.revenue || 0), backgroundColor: c25 + "aa", borderRadius: 4, borderSkipped: false },
      { label: "2026 " + t("management.revenue"), data: labels.map((k) => billing26[k]?.revenue || 0), backgroundColor: c26 + "aa", borderRadius: 4, borderSkipped: false }
    ], {
      showLegend: true,
      tooltipCb: { afterLabel: (ctx) => {
        const key = labels[ctx.dataIndex];
        const src = ctx.datasetIndex === 0 ? billing25 : billing26;
        const d = src[key] || {};
        const gm = d.grossMargin || 0;
        const rev = d.revenue || 0;
        const pct = rev > 0 ? (gm / rev * 100).toFixed(1) : "\u2014";
        return `GM: \u20AC${fmt(gm)} (${pct}%)`;
      } }
    });
  }
  function refreshPl(city) {
    renderWeekFlash();
    renderPlKpis(city);
    renderWaterfall();
    renderMonthTrend();
    renderBillingTrend();
  }

  // src/pages/management/guides.js
  var _sortCol = "grossMargin";
  var _sortDir = -1;
  function initGuides(city) {
    renderGuideTable(city);
  }
  function _build25RankMap(city) {
    if (typeof guideStats25 === "undefined") return {};
    const guides25 = city === "all" ? guideStats25 : guideStats25.filter((g) => g.city === city);
    const ranked = guides25.filter((g) => g.mgmt).map((g) => ({ name: g.name, gm: filterMgmtByDate(g.mgmt, getGlobalDate()).grossMargin })).sort((a, b) => b.gm - a.gm);
    const map = {};
    ranked.forEach((g, i) => {
      map[g.name] = i + 1;
    });
    return map;
  }
  function renderGuideTable(city) {
    const guides = guidesForCity(city);
    const rank25Map = _build25RankMap(city);
    const rows = guides.map((g) => {
      const fin = filterMgmtByDate(g.mgmt, getGlobalDate());
      const sts = filterStatsByDate(g.stats.all, getGlobalDate());
      const m = fin;
      const gmPct = m.revenue > 0 ? m.grossMargin / m.revenue * 100 : 0;
      const avgGm = sts.paidTours > 0 ? m.grossMargin / sts.paidTours : 0;
      const avgPax = sts.paidTours > 0 ? sts.paidPax / sts.paidTours : 0;
      const comm = m.commissionCost || 0;
      const commPct = m.revenue > 0 ? comm / m.revenue * 100 : 0;
      const g25 = get25(g.name);
      const fin25 = g25?.mgmt ? filterMgmtByDate(g25.mgmt, getGlobalDate()) : null;
      const sts25 = g25 ? filterStatsByDate(g25.stats.all, getGlobalDate()) : null;
      const paid25 = sts25 ? sts25.paidTours : null;
      const rev25 = fin25 ? fin25.revenue : null;
      const gm25 = fin25 ? fin25.grossMargin : null;
      return {
        name: g.name,
        city: g.city,
        paidTours: sts.paidTours,
        avgPax,
        revenue: m.revenue,
        vendorCost: m.vendorCost,
        commissionCost: comm,
        commPct,
        grossMargin: m.grossMargin,
        gmPct,
        avgGm,
        paid25,
        rev25,
        gm25,
        rank25: rank25Map[g.name] ?? null
      };
    });
    rows.sort((a, b) => _sortDir * (a[_sortCol] - b[_sortCol]));
    const tbody = document.getElementById("guide-tbody");
    tbody.innerHTML = rows.map((r, i) => {
      const dPaid = r.paid25 !== null ? r.paidTours - r.paid25 : null;
      const dGm = r.gm25 !== null ? r.grossMargin - r.gm25 : null;
      const dRev = r.rev25 !== null ? r.revenue - r.rev25 : null;
      let rowClass = "row-healthy";
      if (r.gmPct < 10 || dGm !== null && dGm < -500) rowClass = "row-poor";
      else if (r.gmPct < 20) rowClass = "row-warn";
      let commClass = "neu";
      if (r.commPct > 25) commClass = "neg";
      else if (r.commPct >= 15) commClass = "neu";
      else commClass = "pos";
      const rank26 = i + 1;
      const rankDelta = r.rank25 !== null ? r.rank25 - rank26 : null;
      let rankHtml = "\u2014";
      if (rankDelta !== null && rankDelta !== 0) {
        rankHtml = `<span style="color:${rankDelta > 0 ? "var(--green)" : "var(--red)"}">${rankDelta > 0 ? "\u25B2" : "\u25BC"}${Math.abs(rankDelta)}</span>`;
      } else if (rankDelta === 0) {
        rankHtml = "=";
      }
      return `<tr class="${rowClass}">
            <td class="rank">${rank26}</td>
            <td style="text-align:center;font-size:11px">${rankHtml}</td>
            <td class="guide-name"><a href="#" class="guide-name-link" onclick="PageGuides.jumpToGuide('${r.name.replace(/'/g, "\\'")}'); return false;">${r.name}</a></td>
            <td><span class="city-dot" style="background:${getCityColor(r.city)}"></span>${r.city}</td>
            <td>${fmt(r.paidTours)}<br><small class="yoy">${dd(dPaid)}</small></td>
            <td>${r.avgPax > 0 ? r.avgPax.toFixed(1) : "\u2014"}</td>
            <td>${fmtEur(r.revenue)}<br><small class="yoy">${dd(dRev, true)}</small></td>
            <td class="neg">${r.commissionCost > 0 ? fmtEur(-r.commissionCost) : "\u2014"}</td>
            <td class="${commClass}">${r.commPct > 0 ? r.commPct.toFixed(1) + "%" : "\u2014"}</td>
            <td>${fmtEur(r.vendorCost)}</td>
            <td class="${gmClass(r.grossMargin)}">${fmtEur(r.grossMargin)}<br><small class="yoy">${dd(dGm, true)}</small></td>
            <td class="${gmClass(r.gmPct)}">${r.gmPct.toFixed(1)}%</td>
            <td class="${gmClass(r.avgGm)}">${fmtEur(r.avgGm)}</td>
        </tr>`;
    }).join("");
    const legendEl = document.getElementById("guide-legend");
    if (legendEl) {
      legendEl.innerHTML = `
            <span style="margin-right: 24px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(29,158,117,0.2); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM \u2265 20% & growing
            </span>
            <span style="margin-right: 24px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(186,117,23,0.1); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM 10\u201320%
            </span>
            <span>
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(212,84,90,0.15); border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
                GM < 10% or declining
            </span>
        `;
    }
  }
  function mgmtSort(col) {
    if (_sortCol === col) _sortDir *= -1;
    else {
      _sortCol = col;
      _sortDir = -1;
    }
    document.querySelectorAll(".sort-hdr").forEach((th) => {
      th.classList.remove("sorted-asc", "sorted-desc");
      th.setAttribute("aria-sort", "none");
      if (th.dataset.col === col) {
        th.classList.add(_sortDir === -1 ? "sorted-desc" : "sorted-asc");
        th.setAttribute("aria-sort", _sortDir === -1 ? "descending" : "ascending");
      }
    });
    const activePill = document.querySelector(".city-pill.active");
    const activeCity = activePill?.dataset.city || "all";
    renderGuideTable(activeCity);
  }
  function refreshGuides(city) {
    renderGuideTable(city);
  }

  // src/pages/management/channels.js
  function initChannels() {
    renderBiggestMoverChannel();
    renderCommissionWaterfall();
    renderDirectOtaTrend();
    renderOtaSourceTable();
    renderTourTypeTable();
  }
  function renderCommissionWaterfall() {
    const srcData = kpiTotals26.mgmt.bySource;
    const src25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt?.bySource || {} : {};
    const srcKeys = Object.keys(srcData).filter((k) => srcData[k].revenue > 0).sort((a, b) => srcData[b].revenue - srcData[a].revenue);
    if (!srcKeys.length) return;
    const { green, red, c26 } = getThemeColors();
    makeBarChart("commission-wfall", srcKeys, [
      {
        label: t("management.grossMargin"),
        data: srcKeys.map((k) => {
          const d = srcData[k];
          return d.grossMargin;
        }),
        backgroundColor: srcKeys.map((k) => srcData[k].grossMargin >= 0 ? green + "cc" : red + "cc"),
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: t("management.commission"),
        data: srcKeys.map((k) => -(srcData[k].commissionCost || 0)),
        backgroundColor: red + "88",
        borderRadius: 0,
        borderSkipped: false
      },
      {
        label: t("management.vendorCost"),
        data: srcKeys.map((k) => -srcData[k].vendorCost),
        backgroundColor: "#8FA8BC88",
        borderRadius: 0,
        borderSkipped: false
      }
    ], {
      showLegend: true,
      stacked: true,
      horizontal: true,
      tooltipCb: {
        afterTitle: (ctx) => {
          const k = srcKeys[ctx[0].dataIndex];
          const d = srcData[k];
          const pct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : "\u2014";
          return `Revenue: \u20AC${fmt(d.revenue)} \u2192 GM: ${pct}%`;
        }
      }
    });
  }
  function renderBiggestMoverChannel() {
    const el = document.getElementById("biggest-mover-channels");
    if (!el) return;
    const src26 = kpiTotals26.mgmt.bySource || {};
    const src25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt?.bySource || {} : {};
    const names = /* @__PURE__ */ new Set([...Object.keys(src26), ...Object.keys(src25)]);
    const entries = Array.from(names).map((name) => ({
      name,
      revenue26: src26[name]?.revenue || 0,
      gm26: src26[name]?.grossMargin || 0,
      revenue25: src25[name]?.revenue || 0,
      gm25: src25[name]?.grossMargin || 0
    }));
    const mover = findBiggestNegativeMover(entries);
    if (!mover) {
      el.innerHTML = "";
      return;
    }
    const commPct26 = mover.revenue26 > 0 ? (src26[mover.name]?.commissionCost || 0) / mover.revenue26 * 100 : 0;
    el.innerHTML = `<strong>\u26A1 Biggest swing:</strong> ${mover.name} gross margin ${dd(mover.delta, true)} vs 2025 (${fmtEur(mover.gm25)} \u2192 ${fmtEur(mover.gm26)}), on ${fmtEur(mover.revenue26)} revenue at ${commPct26.toFixed(1)}% commission.`;
  }
  function renderDirectOtaTrend() {
    const has25 = typeof guideStats25 !== "undefined";
    const MONTH_SHORT = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();
    const monthChannel26 = {};
    const monthChannel25 = {};
    function buildMonthChannelData(guides, monthChannelObj) {
      guides.forEach((g) => {
        if (!g.mgmt?.byMonth) return;
        const gTotal = g.mgmt.revenue || 1;
        const webRatio = (g.mgmt.byChannel?.web?.revenue || 0) / gTotal;
        const otaRatio = ((g.mgmt.byChannel?.OTA?.revenue || 0) + (g.mgmt.byChannel?.b2b?.revenue || 0)) / gTotal;
        for (const [mStr, mVal] of Object.entries(g.mgmt.byMonth)) {
          const m = Number(mStr);
          if (m > cutoffMonth) continue;
          if (!monthChannelObj[m]) monthChannelObj[m] = { web: 0, ota: 0 };
          monthChannelObj[m].web += (mVal.revenue || 0) * webRatio;
          monthChannelObj[m].ota += (mVal.revenue || 0) * otaRatio;
        }
      });
    }
    buildMonthChannelData(guideStats26, monthChannel26);
    if (has25) buildMonthChannelData(guideStats25, monthChannel25);
    const allM = Array.from({ length: cutoffMonth }, (_, i) => i + 1);
    const { c25, c26, green } = getThemeColors();
    makeLineChart("direct-ota-line", allM.map((m) => MONTH_SHORT[m]), [
      { label: t("management.directRevenue") + " 2025", data: allM.map((m) => monthChannel25[String(m)]?.web || 0), borderColor: c25, borderDash: [5, 3], backgroundColor: "transparent", tension: 0.3 },
      { label: t("management.directRevenue") + " 2026", data: allM.map((m) => monthChannel26[String(m)]?.web || 0), borderColor: green, backgroundColor: green + "22", tension: 0.3, fill: true },
      { label: t("management.otaRevenue") + " 2025", data: allM.map((m) => monthChannel25[String(m)]?.ota || 0), borderColor: c25, borderDash: [2, 2], backgroundColor: "transparent", tension: 0.3, borderWidth: 1.5 },
      { label: t("management.otaRevenue") + " 2026", data: allM.map((m) => monthChannel26[String(m)]?.ota || 0), borderColor: "#C49A8A", backgroundColor: "transparent", tension: 0.3, borderWidth: 1.5 }
    ]);
  }
  function renderOtaSourceTable() {
    const srcData = kpiTotals26.mgmt.bySource;
    const srcData25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt?.bySource || {} : {};
    const srcKeys = Object.keys(srcData).filter((k) => k !== "FST" && srcData[k].revenue > 0).sort((a, b) => srcData[b].grossMargin - srcData[a].grossMargin);
    const el = document.getElementById("ota-source-table");
    if (!el) return;
    el.innerHTML = `<table class="mgmt-table">
        <thead><tr>
            <th>${t("management.sources")}</th>
            <th>${t("management.tours")} '26</th><th>${t("management.revenue")} '26</th>
            <th>${t("management.commission")}</th><th>${t("management.commissionPercent")}</th>
            <th>${t("management.vendorCost")}</th>
            <th>${t("management.grossMargin")} '26</th><th>${t("management.gmPercent")}</th>
            <th>${t("management.grossMargin")} '25</th><th>\u0394 GM</th>
        </tr></thead>
        <tbody>${srcKeys.map((k) => {
      const d = srcData[k];
      const d25 = srcData25[k];
      const gmpct = d.revenue > 0 ? d.grossMargin / d.revenue * 100 : 0;
      const commpct = d.revenue > 0 ? (d.commissionCost || 0) / d.revenue * 100 : 0;
      const dgm = d25 ? d.grossMargin - d25.grossMargin : null;
      return `<tr>
                <td><strong>${k}</strong></td>
                <td>${fmt(d.tours)}</td>
                <td>${fmtEur(d.revenue)}</td>
                <td class="neg">${d.commissionCost > 0 ? fmtEur(-d.commissionCost) : "\u2014"}</td>
                <td>${commpct > 0 ? commpct.toFixed(1) + "%" : "\u2014"}</td>
                <td>${fmtEur(d.vendorCost)}</td>
                <td class="${gmClass(d.grossMargin)}">${fmtEur(d.grossMargin)}</td>
                <td class="${gmClass(gmpct)}">${gmpct.toFixed(1)}%</td>
                <td>${d25 ? fmtEur(d25.grossMargin) : "\u2014"}</td>
                <td>${dd(dgm, true)}</td>
            </tr>`;
    }).join("")}</tbody>
    </table>`;
  }
  function renderTourTypeTable() {
    const byType26 = kpiTotals26.mgmt.byTourType || {};
    const byType25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt?.byTourType || {} : {};
    const typeKeys = Object.keys(byType26).sort((a, b) => (byType26[b].revenue || 0) - (byType26[a].revenue || 0));
    if (!typeKeys.length) return;
    const el = document.getElementById("tour-type-tbody");
    if (!el) return;
    el.innerHTML = typeKeys.map((tk) => {
      const d = byType26[tk];
      const d25 = byType25[tk];
      const gmpct = d.revenue > 0 ? d.grossMargin / d.revenue * 100 : 0;
      const avgPax = d.tours > 0 ? d.pax / d.tours : 0;
      const avgUnit = d.pax > 0 ? d.revenue / d.pax : 0;
      const avgUnit25 = d25 && d25.pax > 0 ? d25.revenue / d25.pax : 0;
      const dUnit = d25 ? avgUnit - avgUnit25 : null;
      const dTours = d25 ? d.tours - d25.tours : null;
      return `<tr>
            <td><strong>${tk}</strong></td>
            <td>${fmt(d.tours)}<br><small class="yoy">${dd(dTours)}</small></td>
            <td>${avgPax > 0 ? avgPax.toFixed(1) : "\u2014"}</td>
            <td>${avgUnit > 0 ? fmtEur(avgUnit) : "\u2014"}</td>
            <td>${avgUnit25 > 0 ? fmtEur(avgUnit25) : "\u2014"}</td>
            <td>${dd(dUnit, true)}</td>
            <td>${fmtEur(d.revenue)}</td>
            <td class="neg">${d.commissionCost > 0 ? fmtEur(-d.commissionCost) : "\u2014"}</td>
            <td class="${gmClass(d.grossMargin)}">${fmtEur(d.grossMargin)}</td>
            <td class="${gmClass(gmpct)}">${gmpct.toFixed(1)}%</td>
        </tr>`;
    }).join("");
  }
  function refreshChannels() {
    renderBiggestMoverChannel();
    renderDirectOtaTrend();
  }

  // src/pages/management/ops.js
  var DOW_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var PAXBAND_ORDER = ["1-4", "5-10", "11-20", "21-30", "30+"];
  var GUIDE_PBAND_ORDER = ["1-5", "6-10", "11+"];
  function initOps() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt : null;
    const { c25, c26, green, red } = getThemeColors();
    const gpb26 = mgmt26.byGuidePaxBand || {};
    const gpb25 = mgmt25?.byGuidePaxBand || {};
    const gpLabels = GUIDE_PBAND_ORDER.filter((k) => gpb26[k] || gpb25[k]);
    makeBarChart("guide-paxband-gm", gpLabels, [
      {
        label: t("management.gmPercent") + " 2025",
        data: gpLabels.map((k) => {
          const d = gpb25[k];
          return d && d.revenue > 0 ? d.grossMargin / d.revenue * 100 : 0;
        }),
        backgroundColor: c25 + "aa",
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: t("management.gmPercent") + " 2026",
        data: gpLabels.map((k) => {
          const d = gpb26[k];
          return d && d.revenue > 0 ? d.grossMargin / d.revenue * 100 : 0;
        }),
        backgroundColor: gpLabels.map((k) => {
          const d = gpb26[k];
          if (!d || !d.revenue) return c26 + "aa";
          const gm = d.grossMargin / d.revenue * 100;
          return gm >= 0 ? green + "cc" : red + "cc";
        }),
        borderRadius: 4,
        borderSkipped: false
      },
      {
        type: "line",
        label: "Breakeven (0%)",
        data: gpLabels.map(() => 0),
        borderColor: red + "aa",
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 0
      }
    ], {
      showLegend: true,
      tooltipCb: {
        afterLabel: (ctx) => {
          const k = gpLabels[ctx.dataIndex];
          const d = ctx.datasetIndex === 0 ? gpb25[k] : gpb26[k];
          if (!d) return "";
          return `${fmt(d.tours)} tours \xB7 \u20AC${fmt(d.revenue)} rev \xB7 \u20AC${fmt(d.grossMargin)} GM`;
        }
      }
    });
    makeBarChart("guide-paxband-tours", gpLabels, [
      { label: t("management.tours") + " 2025", data: gpLabels.map((k) => gpb25[k]?.tours || 0), backgroundColor: c25 + "aa", borderRadius: 4, borderSkipped: false },
      { label: t("management.tours") + " 2026", data: gpLabels.map((k) => gpb26[k]?.tours || 0), backgroundColor: c26 + "aa", borderRadius: 4, borderSkipped: false }
    ], { showLegend: true });
    const dow26 = mgmt26.byDow;
    const dow25 = mgmt25?.byDow || {};
    const dowLabels = DOW_ORDER.filter((d) => dow26[d] || dow25[d]);
    makeBarChart("dow-bar", dowLabels, [
      { label: "2025", data: dowLabels.map((d) => dow25[d]?.tours || 0), backgroundColor: c25 + "aa", borderRadius: 4, borderSkipped: false },
      { label: "2026", data: dowLabels.map((d) => dow26[d]?.tours || 0), backgroundColor: c26 + "aa", borderRadius: 4, borderSkipped: false }
    ], {
      showLegend: true,
      tooltipCb: {
        afterLabel: (ctx) => {
          const d = ctx.datasetIndex === 0 ? dow25[dowLabels[ctx.dataIndex]] : dow26[dowLabels[ctx.dataIndex]];
          if (!d) return "";
          const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : "\u2014";
          return `Revenue: \u20AC${fmt(d.revenue || 0)}
GM%: ${gmpct}%`;
        }
      }
    });
    const pb26 = mgmt26.byPaxBand;
    const pb25 = mgmt25?.byPaxBand || {};
    const pbLabels = PAXBAND_ORDER.filter((k) => pb26[k] || pb25[k]);
    makeBarChart("paxband-bar", pbLabels, [
      { label: "2025", data: pbLabels.map((k) => pb25[k]?.tours || 0), backgroundColor: c25 + "aa", borderRadius: 4, borderSkipped: false },
      { label: "2026", data: pbLabels.map((k) => pb26[k]?.tours || 0), backgroundColor: c26 + "aa", borderRadius: 4, borderSkipped: false }
    ], { showLegend: true });
    renderPaxBandActionPanel();
    const wk26 = mgmt26.byWeek;
    const wk25 = mgmt25?.byWeek || {};
    const wkNums = Object.keys(wk26).map(Number).sort((a, b) => a - b);
    const ax = axisDefaults2();
    const datasets = [
      { label: t("management.tours"), data: wkNums.map((w) => wk26[String(w)].tours), borderColor: "#8FA8BC", backgroundColor: "#8FA8BC22", tension: 0.3, fill: true, yAxisID: "yL" },
      { label: t("management.revenue"), data: wkNums.map((w) => wk26[String(w)].revenue), borderColor: "#C49A8A", backgroundColor: "transparent", tension: 0.3, yAxisID: "yR" },
      { label: t("management.grossMargin"), data: wkNums.map((w) => wk26[String(w)].grossMargin), borderColor: green, backgroundColor: "transparent", tension: 0.3, borderDash: [4, 3], yAxisID: "yR" }
    ];
    if (Object.keys(wk25).length > 0) {
      datasets.push({
        label: t("management.revenue") + " 2025",
        data: wkNums.map((w) => wk25[String(w)]?.revenue || 0),
        borderColor: c25,
        backgroundColor: "transparent",
        tension: 0.3,
        borderDash: [5, 3],
        borderWidth: 1.5,
        yAxisID: "yR"
      });
    }
    makeLineChart("week-line", wkNums.map((w) => "Wk " + w), datasets, {
      x: ax,
      yL: { ...ax, position: "left", title: { display: true, text: t("management.tours"), color: ax.ticks.color } },
      yR: { ...ax, position: "right", grid: { display: false }, title: { display: true, text: "\u20AC", color: ax.ticks.color } }
    });
    renderPaymentMethod();
  }
  function renderPaymentMethod() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt : null;
    const pm26 = mgmt26.byPaymentMethod || {};
    const pm25 = mgmt25?.byPaymentMethod || {};
    const { c25, c26 } = getThemeColors();
    const container = document.getElementById("payment-stats-container");
    if (container) {
      container.innerHTML = "";
      const methods = ["card", "bank trf", "cash"];
      methods.forEach((method) => {
        const d26 = pm26[method] || { revenue: 0, grossMargin: 0, tours: 0 };
        const d25 = pm25?.[method] || { revenue: 0, grossMargin: 0 };
        const gm26 = d26.revenue > 0 ? d26.grossMargin / d26.revenue * 100 : 0;
        const gm25 = d25.revenue > 0 ? d25.grossMargin / d25.revenue * 100 : 0;
        const gmDelta = gm26 - gm25;
        const label = method === "bank trf" ? t("management.bankTransfer") : t(`management.${method}`);
        container.innerHTML += `
                <div class="kpi-card">
                    <div class="kpi-label">${label}</div>
                    <div class="kpi-value">${fmtEur(d26.revenue)}</div>
                    <div class="kpi-sub">
                        GM%: <strong>${gm26.toFixed(1)}%</strong>
                        <span class="mgmt-kpi-delta ${deltaClass(gmDelta)}"> ${gmDelta > 0 ? "+" : ""}${gmDelta.toFixed(1)}%</span><br>
                        ${d26.tours} tours
                    </div>
                </div>
            `;
      });
    }
  }
  function renderPaxBandActionPanel() {
    const mgmt26 = kpiTotals26.mgmt;
    const mgmt25 = typeof kpiTotals25 !== "undefined" ? kpiTotals25.mgmt : null;
    const gpb26 = mgmt26.byGuidePaxBand || {};
    const gpb25 = mgmt25?.byGuidePaxBand || {};
    const smallGroup26 = gpb26["1-5"] || { tours: 0, revenue: 0, grossMargin: 0 };
    const smallGroup25 = gpb25["1-5"] || { tours: 0, revenue: 0, grossMargin: 0 };
    const totalTours26 = Object.values(gpb26).reduce((sum, g) => sum + (g.tours || 0), 0);
    const totalTours25 = Object.values(gpb25).reduce((sum, g) => sum + (g.tours || 0), 0);
    const smallGroupPct26 = totalTours26 > 0 ? smallGroup26.tours / totalTours26 * 100 : 0;
    const smallGroupPct25 = totalTours25 > 0 ? smallGroup25.tours / totalTours25 * 100 : 0;
    const pctChange = smallGroupPct26 - smallGroupPct25;
    let breakevenBand = null;
    for (const k of GUIDE_PBAND_ORDER) {
      const d = gpb26[k];
      if (d && d.revenue > 0 && d.grossMargin / d.revenue > 0) {
        breakevenBand = k;
        break;
      }
    }
    const lossFromSmallGroups = smallGroup26.grossMargin < 0 ? Math.abs(smallGroup26.grossMargin) : 0;
    const el = document.getElementById("paxband-action-panel");
    if (el) {
      const breakevenNote = smallGroup26.grossMargin < 0 && breakevenBand ? `<div><strong>\u26A1 Action:</strong> Enforce a minimum of <strong>${breakevenBand.split("-")[0]} PAX</strong> per booking to guarantee positive margin on every tour</div>` : "";
      el.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 10px; color: var(--text);">${t("management.smallGroupProblem")}</div>
            <div style="color: var(--text2); line-height: 1.6; font-size: 11px;">
                <div><strong>\u{1F4CA} ${t("management.prevalence")}:</strong> ${smallGroupPct26.toFixed(0)}% of paid tours are 1\u20135 PAX (${smallGroup26.tours} ${t("management.tours")})</div>
                <div><strong>\u{1F4B0} ${t("management.marginLoss")}:</strong> \u20AC${fmt(lossFromSmallGroups)} net margin loss, 1\u20135 PAX band YTD (band average \u2014 doesn't capture individual below-breakeven tours)</div>
                <div><strong>\u{1F4C8} ${t("management.trend")}:</strong> ${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}pp ${t("management.vs2025")} \u2014 getting ${pctChange > 0 ? "worse" : "better"}</div>
                ${breakevenNote}
            </div>
        `;
    }
  }
  function refreshOps() {
    renderPaymentMethod();
  }

  // src/pages/management/cities.js
  function initCities() {
    renderCitiesTab();
  }
  function renderCitiesTab() {
    let cardsHtml = "";
    CITIES.forEach((city) => {
      const k26 = computeFilteredKpis(city);
      const k25 = computeCity25(city);
      const gm26 = k26.revenue > 0 ? k26.grossMargin / k26.revenue * 100 : 0;
      const gm25 = k25?.revenue > 0 ? k25.grossMargin / k25.revenue * 100 : 0;
      const gmDelta = k26.grossMargin - (k25?.grossMargin || 0);
      const commRate26 = k26.revenue > 0 ? k26.commissionCost / k26.revenue * 100 : 0;
      cardsHtml += `
            <div class="kpi-card">
                <div class="kpi-label">${city}</div>
                <div class="kpi-value">${fmtEur(k26.revenue)}</div>
                <div class="kpi-sub">
                    GM: <strong>${fmtEur(k26.grossMargin)}</strong> (${gm26.toFixed(1)}%)<br>
                    Commission: ${commRate26.toFixed(1)}% \xB7 ${k26.paidTours} tours \xB7 ${k26.paidPax} pax
                    <div class="mgmt-kpi-delta ${deltaClass(gmDelta)}" style="margin-top:4px">\u2206 GM: ${gmDelta > 0 ? "+" : ""}${fmtEur(gmDelta)}</div>
                </div>
            </div>
        `;
    });
    const cardContainer = document.getElementById("city-cards-container");
    if (cardContainer) cardContainer.innerHTML = cardsHtml;
    const ttByCity = buildTourTypeByCity();
    const allTourTypes = /* @__PURE__ */ new Set();
    Object.values(ttByCity).forEach((cityData) => {
      Object.keys(cityData).forEach((type) => allTourTypes.add(type));
    });
    const tourTypes = Array.from(allTourTypes).sort();
    let ttHtml = "<thead><tr><th>Tour Type</th>";
    CITIES.forEach((city) => ttHtml += `<th>${city}</th>`);
    ttHtml += "<th>Total</th></tr></thead><tbody>";
    let cityTotals = {};
    CITIES.forEach((city) => {
      cityTotals[city] = { revenue: 0, grossMargin: 0 };
    });
    tourTypes.forEach((type) => {
      ttHtml += "<tr>";
      ttHtml += `<td class="guide-name">${type}</td>`;
      let typeTotal = { revenue: 0, grossMargin: 0 };
      CITIES.forEach((city) => {
        const data = ttByCity[city]?.[type] || { revenue: 0, grossMargin: 0 };
        const gm = data.revenue > 0 ? data.grossMargin / data.revenue * 100 : 0;
        const gmCls = gm >= 25 ? "tt-gm-high" : gm >= 10 ? "tt-gm-mid" : gm > 0 ? "tt-gm-low" : "";
        ttHtml += `<td class="${gmCls}">\u20AC${fmt(data.revenue)}<br><strong>${gm.toFixed(1)}%</strong></td>`;
        cityTotals[city].revenue += data.revenue;
        cityTotals[city].grossMargin += data.grossMargin;
        typeTotal.revenue += data.revenue;
        typeTotal.grossMargin += data.grossMargin;
      });
      const typeGm = typeTotal.revenue > 0 ? typeTotal.grossMargin / typeTotal.revenue * 100 : 0;
      ttHtml += `<td class="pos" style="font-weight:600">\u20AC${fmt(typeTotal.revenue)}<br>${typeGm.toFixed(1)}%</td>`;
      ttHtml += "</tr>";
    });
    ttHtml += '<tr style="border-top: 2px solid var(--border); font-weight: 600">';
    ttHtml += "<td>Total</td>";
    CITIES.forEach((city) => {
      const gm = cityTotals[city].revenue > 0 ? cityTotals[city].grossMargin / cityTotals[city].revenue * 100 : 0;
      ttHtml += `<td class="pos">\u20AC${fmt(cityTotals[city].revenue)}<br>${gm.toFixed(1)}%</td>`;
    });
    const grandTotal = Object.values(cityTotals).reduce((a, v) => a + v.revenue, 0);
    const grandGm = grandTotal > 0 ? Object.values(cityTotals).reduce((a, v) => a + v.grossMargin, 0) / grandTotal * 100 : 0;
    ttHtml += `<td class="pos">\u20AC${fmt(grandTotal)}<br>${grandGm.toFixed(1)}%</td>`;
    ttHtml += "</tr>";
    ttHtml += "</tbody>";
    const ttTable = document.getElementById("tourtype-city-table");
    if (ttTable) ttTable.innerHTML = ttHtml;
    const srcByCity = buildSourceByCity();
    const allSources = /* @__PURE__ */ new Set();
    Object.values(srcByCity).forEach((cityData) => {
      Object.keys(cityData).forEach((src) => allSources.add(src));
    });
    const sources = Array.from(allSources).sort();
    let srcHtml = "<thead><tr><th>Source / City</th>";
    CITIES.forEach((city) => srcHtml += `<th>${city}</th>`);
    srcHtml += "</tr></thead><tbody>";
    sources.forEach((source) => {
      srcHtml += "<tr>";
      srcHtml += `<td class="guide-name">${source}</td>`;
      CITIES.forEach((city) => {
        const data = srcByCity[city]?.[source] || { revenue: 0, commissionCost: 0, tours: 0 };
        const commRate = data.revenue > 0 ? data.commissionCost / data.revenue * 100 : 0;
        const commCls = commRate > 25 ? "tt-gm-low" : commRate > 15 ? "tt-gm-mid" : "tt-gm-high";
        srcHtml += `<td class="${commCls}">\u20AC${fmt(data.revenue)}<br>${commRate.toFixed(1)}% comm</td>`;
      });
      srcHtml += "</tr>";
    });
    srcHtml += "</tbody>";
    const srcTable = document.getElementById("source-city-table");
    if (srcTable) srcTable.innerHTML = srcHtml;
    const langByCity = buildLangByCity();
    const langLabels = CITIES;
    const engData = [];
    const espData = [];
    const fraData = [];
    CITIES.forEach((city) => {
      const langs = langByCity[city];
      const total = (langs.eng.tours || 0) + (langs.esp.tours || 0) + (langs.fra.tours || 0);
      engData.push(total > 0 ? langs.eng.tours / total * 100 : 0);
      espData.push(total > 0 ? langs.esp.tours / total * 100 : 0);
      fraData.push(total > 0 ? langs.fra.tours / total * 100 : 0);
    });
    makeBarChart("lang-mix-chart", langLabels, [
      { label: t("management.english"), data: engData, backgroundColor: "#6B92B9", borderRadius: 4, borderSkipped: false },
      { label: t("management.spanish"), data: espData, backgroundColor: "#D18C6D", borderRadius: 4, borderSkipped: false },
      { label: t("management.french"), data: fraData, backgroundColor: "#8FA8BC", borderRadius: 4, borderSkipped: false }
    ], {
      horizontal: true,
      showLegend: true,
      stacked: true,
      tooltipCb: {
        afterLabel: (ctx) => {
          const city = langLabels[ctx.dataIndex];
          const langs = langByCity[city];
          const langKey = ["eng", "esp", "fra"][ctx.datasetIndex];
          return `${langs[langKey].tours} tours \xB7 ${langs[langKey].pax} pax`;
        }
      }
    });
  }
  function buildDimensionByCity(dimensionKey, fields) {
    const result = {};
    CITIES.forEach((city) => {
      result[city] = {};
    });
    guideStats26.forEach((g) => {
      const city = g.city;
      if (!result[city]) result[city] = {};
      const dim = g.mgmt?.[dimensionKey];
      if (!dim) return;
      Object.entries(dim).forEach(([key, data]) => {
        if (!result[city][key]) {
          result[city][key] = Object.fromEntries(fields.map((f) => [f, 0]));
        }
        fields.forEach((f) => {
          result[city][key][f] += data[f] || 0;
        });
      });
    });
    return result;
  }
  function buildTourTypeByCity() {
    return buildDimensionByCity("byTourType", ["revenue", "grossMargin", "tours"]);
  }
  function buildSourceByCity() {
    return buildDimensionByCity("bySource", ["revenue", "commissionCost", "tours"]);
  }
  function buildLangByCity() {
    const result = {};
    CITIES.forEach((city) => {
      result[city] = { eng: { tours: 0, pax: 0 }, esp: { tours: 0, pax: 0 }, fra: { tours: 0, pax: 0 } };
    });
    CITIES.forEach((city) => {
      ["eng", "esp", "fra"].forEach((lang) => {
        const cityLangStats = cityStats26[city]?.[lang];
        if (cityLangStats) {
          const filtered = filterStatsByDate(cityLangStats, getGlobalDate());
          result[city][lang].tours += filtered.paidTours || 0;
          result[city][lang].pax += filtered.paidPax || 0;
        }
      });
    });
    return result;
  }
  function refreshCities() {
    renderCitiesTab();
  }

  // src/pages/management/index.js
  var MgmtPages = {
    pl: { _init: false },
    guides: { _init: false },
    channels: { _init: false },
    ops: { _init: false },
    cities: { _init: false }
  };
  var _activeTab = "pl";
  var _activeCity = "all";
  function mgmtShowTab(id, el) {
    document.querySelectorAll(`.mgmt-page`).forEach((p) => p.classList.remove("active"));
    document.querySelectorAll(`.mgmt-subnav .nav-tab`).forEach((tp) => {
      tp.classList.remove("active", "mgmt-tab-active");
      tp.setAttribute("aria-selected", "false");
      tp.setAttribute("tabindex", "-1");
    });
    document.getElementById("mgmt-" + id).classList.add("active");
    el.classList.add("active", "mgmt-tab-active");
    el.setAttribute("aria-selected", "true");
    el.setAttribute("tabindex", "0");
    _activeTab = id;
    const subTitles = { pl: "P&L", guides: "Guides", channels: "Channels", ops: "Operational", cities: "Cities" };
    document.title = `${subTitles[id] || "Management"} \xB7 Management \xB7 FreeSpirit`;
    if (id !== "pl") {
      const bar = document.getElementById("sticky-kpi-bar");
      if (bar) bar.style.display = "none";
    }
    if (!MgmtPages[id]._init) {
      if (id === "pl") initPl(_activeCity);
      if (id === "guides") initGuides(_activeCity);
      if (id === "channels") initChannels();
      if (id === "ops") initOps();
      if (id === "cities") initCities();
      MgmtPages[id]._init = true;
    }
  }
  function mgmtFilterCityPl(city) {
    _activeCity = city;
    document.querySelectorAll(".city-pill").forEach((p) => {
      p.classList.toggle("active", p.dataset.city === city);
    });
    clearKpiCache();
    if (MgmtPages.pl._init) renderPlKpis(city);
    if (MgmtPages.guides._init) renderGuideTable(city);
  }
  var mgmtSort2 = mgmtSort;
  function mgmtRefreshAll() {
    clearKpiCache();
    if (MgmtPages.pl._init) refreshPl(_activeCity);
    if (MgmtPages.guides._init) refreshGuides(_activeCity);
    if (MgmtPages.channels._init) refreshChannels();
    if (MgmtPages.ops._init) refreshOps();
    if (MgmtPages.cities._init) refreshCities();
  }
  function mgmtUpdateCharts() {
    const ax = axisDefaults2();
    const tt = tooltipDefaults2();
    Object.values(_charts).forEach((c) => {
      if (c.options.scales) {
        Object.values(c.options.scales).forEach((sc) => {
          if (sc.ticks) sc.ticks.color = ax.ticks.color;
          if (sc.grid) sc.grid.color = ax.grid.color;
        });
      }
      if (c.options.plugins?.tooltip) Object.assign(c.options.plugins.tooltip, tt);
      if (c.options.plugins?.legend?.labels) c.options.plugins.legend.labels.color = ax.ticks.color;
      c.update();
    });
  }
  function updateManagementTabs() {
    const tabs = {
      "tab-pl": t("management.profitAndLoss"),
      "tab-guides": t("management.guides"),
      "tab-channels": t("management.channels"),
      "tab-ops": t("management.operational"),
      "tab-cities": t("management.cities")
    };
    Object.entries(tabs).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
    if (_activeTab === "pl" && MgmtPages.pl._init) renderPlKpis(_activeCity);
    else if (_activeTab === "guides" && MgmtPages.guides._init) renderGuideTable(_activeCity);
    else if (_activeTab === "channels" && MgmtPages.channels._init) {
      renderCommissionWaterfall();
      renderDirectOtaTrend();
      renderOtaSourceTable();
      renderTourTypeTable();
    } else if (_activeTab === "ops" && MgmtPages.ops._init) refreshOps();
    else if (_activeTab === "cities" && MgmtPages.cities._init) refreshCities();
  }
  var PageMgmt = {
    _initialized: false,
    init() {
      if (this._initialized) return;
      const footerDate = document.getElementById("footer-date");
      if (footerDate) footerDate.textContent = (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const tabEl = document.getElementById("tab-pl");
      if (tabEl) mgmtShowTab("pl", tabEl);
      this._initialized = true;
    },
    renderAll() {
      mgmtRefreshAll();
    }
  };

  // src/main.js
  initTheme();
  initLanguage();
  PAGES.Page25 = Page25;
  PAGES.Page26 = Page26;
  PAGES.PageCmp = PageCmp;
  PAGES.PageGuides = PageGuides;
  PAGES.PageMgmt = PageMgmt;
  window.Page25 = Page25;
  window.Page26 = Page26;
  window.PageCmp = PageCmp;
  window.PageGuides = PageGuides;
  window.toggleSection = toggleSection;
  registerThemeChangeCallback(() => {
    PAGES.PageGuides.closeGuideDetail();
    mgmtUpdateCharts();
  });
  registerLanguageChangeCallback(() => {
    updateManagementTabs();
  });
  var shortcutOverlay = () => document.getElementById("shortcut-overlay");
  var _overlayPreviousFocus = null;
  function toggleShortcutOverlay() {
    const el = shortcutOverlay();
    if (!el) return;
    const isOpen = el.style.display === "block";
    if (isOpen) {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
      el.removeEventListener("keydown", _overlayTrapFocus);
      _overlayPreviousFocus?.focus();
      _overlayPreviousFocus = null;
    } else {
      _overlayPreviousFocus = document.activeElement;
      el.style.display = "block";
      el.setAttribute("aria-hidden", "false");
      el.addEventListener("keydown", _overlayTrapFocus);
      el.querySelector(".overlay-close")?.focus();
    }
  }
  function _overlayTrapFocus(e) {
    if (e.key === "Escape") {
      toggleShortcutOverlay();
      return;
    }
    if (e.key !== "Tab") return;
    e.preventDefault();
    shortcutOverlay()?.querySelector(".overlay-close")?.focus();
  }
  var PAGE_MAP = {
    "tab-25": "page-25",
    "tab-26": "page-26",
    "tab-cmp": "page-cmp",
    "tab-gd": "page-gd",
    "tab-mgmt": "page-mgmt"
  };
  function initEventListeners() {
    Object.entries(PAGE_MAP).forEach(([tabId, pageId]) => {
      const el = document.getElementById(tabId);
      if (el) el.addEventListener("click", () => showPage(pageId, el));
    });
    ["pl", "guides", "channels", "ops", "cities"].forEach((id) => {
      const el = document.getElementById("tab-" + id);
      if (el) el.addEventListener("click", () => mgmtShowTab(id, el));
    });
    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("cutoff-picker")?.addEventListener("change", (e) => updateDateAsOf(e.target.value));
    document.getElementById("cutoff-picker")?.addEventListener("click", (e) => e.target.showPicker?.());
    document.querySelector(".print-btn")?.addEventListener("click", () => window.print());
    document.querySelectorAll(".city-pill").forEach((el) => el.addEventListener("click", () => mgmtFilterCityPl(el.dataset.city)));
    document.querySelectorAll(".sort-hdr").forEach((el) => {
      el.addEventListener("click", () => mgmtSort2(el.dataset.col));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          mgmtSort2(el.dataset.col);
        }
      });
    });
    document.querySelector(".overlay-close")?.addEventListener("click", toggleShortcutOverlay);
    const mainTabs = Array.from(document.querySelectorAll(".nav-tabs .nav-tab"));
    mainTabs.forEach((tab, i) => {
      tab.addEventListener("keydown", (e) => {
        let next;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = mainTabs[(i + 1) % mainTabs.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = mainTabs[(i - 1 + mainTabs.length) % mainTabs.length];
        if (e.key === "Home") next = mainTabs[0];
        if (e.key === "End") next = mainTabs[mainTabs.length - 1];
        if (next) {
          e.preventDefault();
          next.focus();
          next.click();
        }
      });
    });
    const mgmtTabs = Array.from(document.querySelectorAll(".mgmt-subnav .nav-tab"));
    mgmtTabs.forEach((tab, i) => {
      tab.addEventListener("keydown", (e) => {
        let next;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = mgmtTabs[(i + 1) % mgmtTabs.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = mgmtTabs[(i - 1 + mgmtTabs.length) % mgmtTabs.length];
        if (e.key === "Home") next = mgmtTabs[0];
        if (e.key === "End") next = mgmtTabs[mgmtTabs.length - 1];
        if (next) {
          e.preventDefault();
          next.focus();
          next.click();
        }
      });
    });
  }
  function initKeyboardShortcuts() {
    const shortcuts = {
      "1": () => {
        const el = document.getElementById("tab-25");
        if (el) showPage("page-25", el);
      },
      "2": () => {
        const el = document.getElementById("tab-26");
        if (el) showPage("page-26", el);
      },
      "3": () => {
        const el = document.getElementById("tab-cmp");
        if (el) showPage("page-cmp", el);
      },
      "4": () => {
        const el = document.getElementById("tab-gd");
        if (el) showPage("page-gd", el);
      },
      "5": () => {
        const el = document.getElementById("tab-mgmt");
        if (el) showPage("page-mgmt", el);
      },
      "t": () => toggleTheme(),
      "d": () => document.getElementById("cutoff-picker")?.focus(),
      "?": () => toggleShortcutOverlay(),
      "Escape": () => {
        const el = shortcutOverlay();
        if (el && el.style.display === "block") {
          el.style.display = "none";
          el.setAttribute("aria-hidden", "true");
        }
      }
    };
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const handler = shortcuts[e.key];
      if (handler) {
        handler();
        e.preventDefault();
      }
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    updateThemeButton(document.body.classList.contains("dark-mode"));
    updateNavigationLabels();
    const picker = document.getElementById("cutoff-picker");
    if (picker) {
      picker.value = getGlobalDate();
      updateDateAsOf(picker.value);
    }
    PageCmp.init();
    initEventListeners();
    initKeyboardShortcuts();
  });
})();
