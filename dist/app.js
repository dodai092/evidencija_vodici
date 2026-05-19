(() => {
  // src/shared.js
  var CITY_COLS = { Zagreb: "#8FA8BC", Dubrovnik: "#C49A8A", Split: "#9BB09B", Zadar: "#C4B48A", Unknown: "#999999" };
  var CITY_CLS = { Zagreb: "zagreb", Dubrovnik: "dubrovnik", Split: "split", Zadar: "zadar", Unknown: "" };
  var CITIES = ["Zagreb", "Dubrovnik", "Split", "Zadar"];
  var MONTH_NAMES_HR = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
  var CSS = {
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
    PageMgmt: null
  };
  function registerPage(name, page) {
    if (Object.prototype.hasOwnProperty.call(PAGES, name)) {
      PAGES[name] = page;
    }
  }
  var _today = /* @__PURE__ */ new Date();
  var GLOBAL_DATE = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, "0")}-${String(_today.getDate()).padStart(2, "0")}`;
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
      if (PAGES.PageMgmt?._initialized) PAGES.PageMgmt.renderAll();
    });
  }
  function filteredStats(st, months) {
    const cutoffMonth = getCutoffMonth();
    const cutoffDay = parseInt(GLOBAL_DATE.split("-")[2]);
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
  }
  function showPage(id, tab) {
    document.querySelectorAll(`.${CSS.PAGE}`).forEach((p) => p.classList.remove(CSS.ACTIVE));
    document.querySelectorAll(`.nav-tabs .${CSS.NAV_TAB}`).forEach((t2) => t2.classList.remove(CSS.ACTIVE, CSS.NAV_Y25, CSS.NAV_Y26, CSS.NAV_CMP));
    document.getElementById(id).classList.add(CSS.ACTIVE);
    tab.classList.add(CSS.ACTIVE);
    if (id === "page-25") tab.classList.add(CSS.NAV_Y25);
    if (id === "page-26") tab.classList.add(CSS.NAV_Y26);
    if (id === "page-cmp") tab.classList.add(CSS.NAV_CMP);
    if (id === "page-25" && PAGES.Page25 && !PAGES.Page25._initialized) PAGES.Page25.init();
    if (id === "page-26" && PAGES.Page26 && !PAGES.Page26._initialized) PAGES.Page26.init();
    if (id === "page-cmp" && PAGES.PageCmp && !PAGES.PageCmp._initialized) PAGES.PageCmp.init();
    else if (id === "page-cmp" && PAGES.PageCmp) setTimeout(() => PAGES.PageCmp.updateCharts(), 50);
    if (id === "page-mgmt" && PAGES.PageMgmt) {
      if (!PAGES.PageMgmt._initialized) PAGES.PageMgmt.init();
      else PAGES.PageMgmt.renderAll();
    }
  }

  // src/i18n.js
  var TRANSLATIONS = {
    en: {
      nav: {
        guides2025: "Guides 2025",
        guides2026: "Guides 2026",
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
        city: "City",
        language: "Language",
        mo: "Mo.",
        all: "All",
        cumulative: "Cumulative",
        total: "Total",
        type: "Type",
        guides: "Guides",
        activeGuides: "Active Guides",
        in2025: "in 2025",
        in2026: "in 2026",
        freeToursPaxCount: "Free Tours \u2013 PAX Count",
        avgPaxFreeTour: "Avg PAX / Free Tour",
        paidToursCount: "Paid Tours \u2013 Count",
        paxPerTour: "pax per tour",
        byMonth: "by Month",
        ytdRange: "Jan\u2013May",
        travelYear2026: "Travel Year 2026",
        ytd: "YTD",
        partial: "Partial month",
        freeToursPaxCountYtd: "Free Tours \u2013 PAX Count YTD",
        avgPaxPerFreeTour: "Avg PAX / Free Tour",
        paidToursCountYtd: "Paid Tours \u2013 Count YTD",
        freeT: "Free t",
        freeP: "Free p",
        paidT: "$ t",
        paidP: "$ p",
        dataThrough: "data through"
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
        month: "Mo.",
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
        guides: "Guides",
        guideComparison: "Guide Comparison",
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
        guides2025: "Vodi\u010Di 2025",
        guides2026: "Vodi\u010Di 2026",
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
        city: "Grad",
        language: "Jezik",
        mo: "Mj.",
        all: "Sve",
        cumulative: "Kumulativno",
        total: "Ukupno",
        type: "Tip",
        guides: "Vodi\u010Di",
        activeGuides: "Aktivni vodi\u010Di",
        in2025: "u 2025.",
        in2026: "u 2026.",
        freeToursPaxCount: "Besplatne ture \u2013 Broj PAX-a",
        avgPaxFreeTour: "Prosje\u010Dan PAX / Besplatna tura",
        paidToursCount: "Pla\u0107ene ture \u2013 Broj",
        paxPerTour: "pax po turi",
        byMonth: "po mjesecu",
        ytdRange: "Jan\u2013Maj",
        travelYear2026: "Putna godina 2026",
        ytd: "YTD",
        partial: "Dijelom mjesec",
        freeToursPaxCountYtd: "Besplatne ture \u2013 Broj PAX-a YTD",
        avgPaxPerFreeTour: "Prosje\u010Dan PAX / Besplatna tura",
        paidToursCountYtd: "Pla\u0107ene ture \u2013 Broj YTD",
        freeT: "Bespl. t",
        freeP: "Bespl. p",
        paidT: "$ t",
        paidP: "$ p",
        dataThrough: "podaci kroz"
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
        guides: "Vodi\u010Di",
        guideComparison: "Usporedba vodi\u010Da",
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
      document.documentElement.classList.add(CSS.DARK_MODE);
      document.body.classList.add(CSS.DARK_MODE);
    }
  }
  function initLanguage() {
    const stored = localStorage.getItem("language");
    if (stored) setGlobalLanguage(stored);
  }
  function updateThemeButton(isDark) {
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
  function toggleTheme(onToggleComplete) {
    const isDark = document.body.classList.toggle(CSS.DARK_MODE);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeButton(isDark);
    if (onToggleComplete) {
      setTimeout(onToggleComplete, 100);
    } else {
      setTimeout(() => {
        if (PAGES.Page25 && PAGES.Page25._initialized) PAGES.Page25.updateChart();
        if (PAGES.Page26 && PAGES.Page26._initialized) PAGES.Page26.updateChart();
        if (PAGES.PageCmp && PAGES.PageCmp._initialized) PAGES.PageCmp.updateCharts();
        if (_onThemeChange) _onThemeChange();
      }, 100);
    }
  }
  function updateLanguageButton() {
    const lang = getGlobalLanguage();
    const btn = document.getElementById("language-toggle");
    if (btn) {
      btn.textContent = lang === "en" ? "\u{1F1ED}\u{1F1F7}" : "\u{1F1EC}\u{1F1E7}";
      btn.setAttribute("title", lang === "en" ? "Promijeni na Hrvatski" : "Switch to English");
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
  }
  function toggleLanguage(onToggleComplete) {
    const current = getGlobalLanguage();
    setGlobalLanguage(current === "en" ? "hr" : "en");
    localStorage.setItem("language", getGlobalLanguage());
    updateLanguageButton();
    updateNavigationLabels();
    requestAnimationFrame(() => {
      if (PAGES.Page25 && PAGES.Page25._initialized) {
        PAGES.Page25.rebuildStructure();
        PAGES.Page25.renderAll();
      }
      if (PAGES.Page26 && PAGES.Page26._initialized) {
        PAGES.Page26.rebuildStructure();
        PAGES.Page26.renderAll();
      }
      if (PAGES.PageCmp && PAGES.PageCmp._initialized) {
        PAGES.PageCmp.rebuildStructure();
        PAGES.PageCmp.mergedGuides = PAGES.PageCmp.buildMerged();
        PAGES.PageCmp.renderAll();
        PAGES.PageCmp.updateCharts();
      }
      if (_onLanguageChange) _onLanguageChange();
      if (onToggleComplete) onToggleComplete();
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
    _scope(sel) {
      return document.querySelectorAll("#page-25 " + sel);
    },
    getChartColors() {
      const isDark = document.body.classList.contains("dark-mode");
      return {
        text: isDark ? "#eeeeee" : "#111111",
        text3: isDark ? "#888888" : "#999999",
        border: isDark ? "#333333" : "#e8e8e8",
        accent: "#6366F1"
      };
    },
    _setActivePill(groupId, activeBtn) {
      const group = document.getElementById(groupId);
      if (!group) return;
      group.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      if (activeBtn) activeBtn.classList.add("active");
    },
    renderCard(g) {
      const st = g.stats[this.activeLang];
      const fs = filteredStats(st, this.activeMonths);
      const sid = "p25_" + safeName(g.name);
      const col = CITY_COLS[g.city] || "#999";
      const init = g.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
      const isExternal = g.city === "Unknown";
      const typeEntries = Object.entries(st.byType).sort((a, b) => b[1].tours - a[1].tours);
      const maxT = typeEntries.length > 0 ? typeEntries[0][1].tours : 1;
      const typeBarsHtml = typeEntries.length > 0 ? '<div class="gc-types">' + typeEntries.map(
        ([type, d]) => `<div class="type-bar-row"><span class="type-lbl">${type}</span><div class="type-track"><div class="type-fill" style="width:${(d.tours / maxT * 100).toFixed(0)}%;background:${col}"></div></div><span class="type-val">${d.tours}t &middot; ${d.pax}p</span></div>`
      ).join("") + "</div>" : "";
      const months = Object.keys(st.byMonth).map(Number).sort((a, b) => a - b);
      const monthRowsHtml = months.map((m) => {
        const md = st.byMonth[m];
        return `<tr><td>${md.name}</td><td class="num free-col">${md.free.tours || 0}</td><td class="num">${md.free.pax || 0}</td><td class="num paid-col">${md.paid.tours || 0}</td><td class="num">${md.paid.pax || 0}</td></tr>`;
      }).join("");
      const cityDisplay = isExternal ? t("labels.external") : g.city;
      return `<div class="guide-card" data-city="${g.city}" data-name="${g.name}"><div class="gc-stripe" style="background:${col}"></div><div class="gc-body"><div class="gc-header"><div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div><span class="gc-name">${g.name}</span>` + (isExternal ? `<span class="badge-ext">${t("labels.external")}</span>` : `<span class="city-pill" style="background:${col}18;color:${col}">${cityDisplay}</span>`) + `</div><div class="gc-stats"><div class="gc-half"><div class="gc-stat-label">${t("labels.freeTours")}</div><div class="gc-stat-num" style="color:var(--green)">${fs.freeTours}</div><div class="gc-stat-sub">${fs.freePax} pax</div></div><div class="gc-divider"></div><div class="gc-half" style="text-align:right"><div class="gc-stat-label">${t("labels.paidTours")}</div><div class="gc-stat-num" style="color:${col}">${fs.paidTours}</div><div class="gc-stat-sub">${fs.paidPax} pax</div></div></div></div>${typeBarsHtml}<div class="monthly-toggle" onclick="Page25.toggleMonthly('${sid}')"><span class="mt-arrow" id="mta-${sid}">&#9660;</span> ${t("labels.monthly")}</div><div class="monthly-table" id="mt-${sid}"><table><thead><tr><th>${t("table.month")}</th><th class="num" style="color:var(--green)">${t("table.free")} t</th><th class="num">${t("table.free")} p</th><th class="num" style="color:var(--teal)">$ t</th><th class="num">$ p</th></tr></thead><tbody>${monthRowsHtml}</tbody><tfoot><tr><td>${t("labels.total")}</td><td class="num free-col">${fs.freeTours}</td><td class="num">${fs.freePax}</td><td class="num paid-col">${fs.paidTours}</td><td class="num">${fs.paidPax}</td></tr></tfoot></table></div></div>`;
    },
    renderAll() {
      const container = this._el("guide-sections");
      let html = "";
      CITIES.forEach((city) => {
        if (this.activeCity !== "all" && this.activeCity !== city) return;
        const cityGuides = guideStats25.filter((g) => g.city === city);
        if (cityGuides.length === 0) return;
        const cls = CITY_CLS[city] || "";
        html += `<section class="city-section" data-city="${city}">`;
        html += `<div class="section-title ${cls}">${city}</div>`;
        html += `<div class="guide-grid">`;
        html += cityGuides.map((g) => this.renderCard(g)).join("");
        html += `</div></section>`;
      });
      container.innerHTML = html;
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
        freePaxByCity[c] = 0;
        paidToursByCity[c] = 0;
      });
      guideStats25.forEach((g) => {
        if (!CITIES.includes(g.city)) return;
        const fs = filteredStats(g.stats[lang], this.activeMonths);
        freePaxByCity[g.city] += fs.freePax;
        paidToursByCity[g.city] += fs.paidTours;
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
              datasets: [{ data: dataArr, backgroundColor: citiesToShow.map((c) => CITY_COLS[c]), borderRadius: 4 }]
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
          row[city] = guideStats25.filter((g) => g.city === city).reduce((s, g) => s + (g.stats[lang]?.byMonth?.[String(m)]?.free?.pax || 0), 0);
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
        return `<tr><td class="mpax-month">${MONTH_NAMES[row.m]}</td>${cells}</tr>`;
      }).join("");
      const totalCells = citiesToShow.map((c) => `<td>${fmtN(totals[c])}</td>`).join("");
      const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr("charts.freePaxByMonthAndCity")}>${t("charts.freePaxByMonthAndCity")}</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead><tr><th class="mpax-month-head">${t("table.month")}</th>${cityHeaders}</tr></thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t("labels.total")}</td>${totalCells}</tr>
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
        guideStats25.filter((g) => this.activeCity === "all" || g.city === this.activeCity).forEach((g) => {
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
          ctx.font = "500 9px 'Montserrat',sans-serif";
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
        const col = CITY_COLS[city];
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
            legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 12 } },
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
      const filtered = guideStats25.filter((g) => this.activeCity === "all" || g.city === this.activeCity);
      const k = this.activeLang;
      let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
      filtered.forEach((g) => {
        const fs = filteredStats(g.stats[k], this.activeMonths);
        freeTours += fs.freeTours;
        paidTours += fs.paidTours;
        freePax += fs.freePax;
        paidPax += fs.paidPax;
      });
      this._el("kv-guides").textContent = filtered.length;
      this._el("kv-free").textContent = fmtN(freePax);
      this._el("kv-free-pax").textContent = freeTours + " t";
      this._el("kv-avg-pax").textContent = freeTours > 0 ? (freePax / freeTours).toFixed(1) : "\u2014";
      this._el("kv-paid").textContent = paidTours;
      this._el("kv-paid-pax").textContent = fmtN(paidPax) + " pax";
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
      this.activeMonths = m === "all" ? [] : [parseInt(m)];
      this.renderAll();
    },
    toggleMonthly(sid) {
      const table = document.getElementById("mt-" + sid);
      const arrow = document.getElementById("mta-" + sid);
      if (!table) return;
      table.classList.toggle("open");
      if (arrow) arrow.classList.toggle("open");
    },
    _buildHeader() {
      return `<div class="header">
            <div class="header-left">
                <h1>Guides <span class="accent">2025</span></h1>
                <p>Tour production by guide &middot; Free vs. Paid &middot; <span class="ytd-range-label">Jan\u2013May</span></p>
            </div>
            <div class="header-right">
                <div id="date-pov-25" class="mb-6"></div>
                <div class="header-badge">Travel Year 2025 &middot; Closed</div>
            </div>
        </div>`;
    },
    _buildFilters() {
      return `<div class="main">
            <div class="filter-area">
                <div class="filter-group">
                    <label for="city-filter-25">${t("labels.city")}</label>
                    <select class="filter-select" id="city-filter-25" onchange="Page25.filterCity(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="Zagreb">Zagreb</option>
                        <option value="Dubrovnik">Dubrovnik</option>
                        <option value="Split">Split</option>
                        <option value="Zadar">Zadar</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="lang-filter-25">${t("labels.language")}</label>
                    <select class="filter-select" id="lang-filter-25" onchange="Page25.filterLang(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="eng">\u{1F1EC}\u{1F1E7} ENG</option>
                        <option value="esp">\u{1F1EA}\u{1F1F8} ESP</option>
                        <option value="fra">\u{1F1EB}\u{1F1F7} FRA</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="month-filter-25">${t("table.month")}</label>
                    <select class="filter-select" id="month-filter-25" onchange="Page25.filterMonth(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}
                    </select>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.freeToursPaxCount")}</div>
                    <div class="kpi-value" id="kv-free-25">\u2014</div>
                    <div class="kpi-sub" id="kv-free-pax-25">\u2014 t</div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.avgPaxFreeTour")}</div>
                    <div class="kpi-value" id="kv-avg-pax-25">\u2014</div>
                    <div class="kpi-sub">${t("labels.paxPerTour")}</div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t("labels.paidToursCount")}</div>
                    <div class="kpi-value" id="kv-paid-25">\u2014</div>
                    <div class="kpi-sub" id="kv-paid-pax-25">\u2014 pax</div>
                </div>
                <div class="kpi hl-teal">
                    <div class="kpi-label">${t("labels.activeGuides")}</div>
                    <div class="kpi-value" id="kv-guides-25">\u2014</div>
                    <div class="kpi-sub">${t("labels.in2025")}</div>
                </div>
            </div>`;
    },
    _buildFreeTours() {
      return `<div class="section-divider" onclick="toggleSection('free-section-body-25')">
                <span>${t("sections.freeTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
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
      return `<div class="section-divider" onclick="toggleSection('paid-section-body-25')">
                <span>${t("sections.paidTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
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
    _buildGuides() {
      return `<div class="section-divider" onclick="toggleSection('guides-body-25')">
                <span>${t("labels.guides")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
            <div id="guides-body-25" class="section-body">
                <div id="guide-sections-25"></div>
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
      document.getElementById("page-25").innerHTML = this._buildHeader() + this._buildFilters() + this._buildFreeTours() + this._buildPaidTours() + this._buildGuides();
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
    _scope(sel) {
      return document.querySelectorAll("#page-26 " + sel);
    },
    getChartColors() {
      const isDark = document.body.classList.contains("dark-mode");
      return {
        text: isDark ? "#eeeeee" : "#111111",
        text3: isDark ? "#888888" : "#999999",
        border: isDark ? "#333333" : "#e8e8e8",
        accent: "#1D9E75"
      };
    },
    _setActivePill(groupId, activeBtn) {
      const group = document.getElementById(groupId);
      if (!group) return;
      group.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      if (activeBtn) activeBtn.classList.add("active");
    },
    renderCard(g) {
      const st = g.stats[this.activeLang];
      const fs = filteredStats(st, this.activeMonths);
      const sid = "p26_" + safeName(g.name);
      const col = CITY_COLS[g.city] || "#999";
      const init = g.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
      const typeEntries = Object.entries(st.byType).sort((a, b) => b[1].tours - a[1].tours);
      const maxT = typeEntries.length > 0 ? typeEntries[0][1].tours : 1;
      const typeBarsHtml = typeEntries.length > 0 ? '<div class="gc-types">' + typeEntries.map(
        ([type, d]) => `<div class="type-bar-row"><span class="type-lbl">${type}</span><div class="type-track"><div class="type-fill" style="width:${(d.tours / maxT * 100).toFixed(0)}%;background:${col}"></div></div><span class="type-val">${d.tours}t &middot; ${d.pax}p</span></div>`
      ).join("") + "</div>" : "";
      const months = Object.keys(st.byMonth).map(Number).sort((a, b) => a - b);
      const monthRowsHtml = months.map((m) => {
        const md = st.byMonth[m];
        return `<tr><td>${md.name}</td><td class="num free-col">${md.free.tours || 0}</td><td class="num">${md.free.pax || 0}</td><td class="num paid-col">${md.paid.tours || 0}</td><td class="num">${md.paid.pax || 0}</td></tr>`;
      }).join("");
      return `<div class="guide-card" data-city="${g.city}" data-name="${g.name}"><div class="gc-stripe" style="background:${col}"></div><div class="gc-body"><div class="gc-header"><div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div><span class="gc-name">${g.name}</span><span class="city-pill" style="background:${col}18;color:${col}">${g.city}</span></div><div class="gc-stats"><div class="gc-half"><div class="gc-stat-label">${t("labels.freeTours")}</div><div class="gc-stat-num" style="color:var(--green)">${fs.freeTours}</div><div class="gc-stat-sub">${fs.freePax} pax</div></div><div class="gc-divider"></div><div class="gc-half" style="text-align:right"><div class="gc-stat-label">${t("labels.paidTours")}</div><div class="gc-stat-num" style="color:${col}">${fs.paidTours}</div><div class="gc-stat-sub">${fs.paidPax} pax</div></div></div></div>${typeBarsHtml}<div class="monthly-toggle" onclick="Page26.toggleMonthly('${sid}')"><span class="mt-arrow" id="mta-${sid}">&#9660;</span> ${t("labels.monthly")}</div><div class="monthly-table" id="mt-${sid}"><table><thead><tr><th>${t("table.month")}</th><th class="num" style="color:var(--green)">${t("table.free")} t</th><th class="num">${t("table.free")} p</th><th class="num" style="color:var(--teal)">$ t</th><th class="num">$ p</th></tr></thead><tbody>${monthRowsHtml}</tbody><tfoot><tr><td>${t("labels.total")}</td><td class="num free-col">${fs.freeTours}</td><td class="num">${fs.freePax}</td><td class="num paid-col">${fs.paidTours}</td><td class="num">${fs.paidPax}</td></tr></tfoot></table></div></div>`;
    },
    renderAll() {
      const container = this._el("guide-sections");
      let html = "";
      CITIES.forEach((city) => {
        if (this.activeCity !== "all" && this.activeCity !== city) return;
        const cityGuides = guideStats26.filter((g) => g.city === city);
        if (cityGuides.length === 0) return;
        const cls = CITY_CLS[city] || "";
        html += `<section class="city-section" data-city="${city}">`;
        html += `<div class="section-title ${cls}">${city}</div>`;
        html += `<div class="guide-grid">`;
        html += cityGuides.map((g) => this.renderCard(g)).join("");
        html += `</div></section>`;
      });
      container.innerHTML = html;
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
        freePaxByCity[c] = 0;
        paidToursByCity[c] = 0;
      });
      guideStats26.forEach((g) => {
        if (!CITIES.includes(g.city)) return;
        const fs = filteredStats(g.stats[lang], this.activeMonths);
        freePaxByCity[g.city] += fs.freePax;
        paidToursByCity[g.city] += fs.paidTours;
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
              datasets: [{ data: dataArr, backgroundColor: citiesToShow.map((c) => CITY_COLS[c]), borderRadius: 4 }]
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
      const getPax = (g, m) => {
        const st = g.stats[lang];
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
          row[city] = guideStats26.filter((g) => g.city === city).reduce((s, g) => s + getPax(g, m), 0);
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
        const label = MONTH_NAMES[row.m] + (row.isPartial ? "<sup>*</sup>" : "");
        return `<tr><td class="mpax-month">${label}</td>${cells}</tr>`;
      }).join("");
      const totalCells = citiesToShow.map((c) => `<td>${fmtN(totals[c])}</td>`).join("");
      const hasPartial = data.some((r) => r.isPartial);
      const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr("charts.freePaxByMonthAndCity26")}>${t("charts.freePaxByMonthAndCity26")}</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead><tr><th class="mpax-month-head">${t("table.month")}</th>${cityHeaders}</tr></thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">Total</td>${totalCells}</tr>
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
      const fc = guideStats26.filter((g) => this.activeCity === "all" || g.city === this.activeCity);
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
          ctx.font = "500 9px 'Montserrat',sans-serif";
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
        const col = CITY_COLS[city];
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
            legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 12 } },
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
      const filtered = guideStats26.filter((g) => this.activeCity === "all" || g.city === this.activeCity);
      const k = this.activeLang;
      let freeTours = 0, paidTours = 0, freePax = 0, paidPax = 0;
      filtered.forEach((g) => {
        const fs = filteredStats(g.stats[k], this.activeMonths);
        freeTours += fs.freeTours;
        paidTours += fs.paidTours;
        freePax += fs.freePax;
        paidPax += fs.paidPax;
      });
      this._el("kv-guides").textContent = filtered.length;
      this._el("kv-free").textContent = fmtN(freePax);
      this._el("kv-free-pax").textContent = freeTours + " t";
      this._el("kv-avg-pax").textContent = freeTours > 0 ? (freePax / freeTours).toFixed(1) : "\u2014";
      this._el("kv-paid").textContent = paidTours;
      this._el("kv-paid-pax").textContent = fmtN(paidPax) + " pax";
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
      this.activeMonths = m === "all" ? [] : [parseInt(m)];
      this.renderAll();
    },
    toggleMonthly(sid) {
      const table = document.getElementById("mt-" + sid);
      const arrow = document.getElementById("mta-" + sid);
      if (!table) return;
      table.classList.toggle("open");
      if (arrow) arrow.classList.toggle("open");
    },
    _buildHeader() {
      return `<div class="header">
            <div class="header-left">
                <h1>${t("labels.guides")} <span class="accent">2026</span></h1>
                <p>Tour production by guide &middot; ${t("labels.freeTours")} vs. ${t("labels.paidTours")} &middot; <span class="ytd-range-label">${t("labels.ytdRange")}</span></p>
            </div>
            <div class="header-right">
                <div id="date-pov-26" class="mb-6"></div>
                <div class="header-badge">${t("labels.travelYear2026")} &middot; ${t("labels.ytd")}</div>
            </div>
        </div>`;
    },
    _buildFilters() {
      return `<div class="main">
            <div class="filter-area">
                <div class="filter-group">
                    <label for="city-filter-26">${t("labels.city")}</label>
                    <select class="filter-select" id="city-filter-26" onchange="Page26.filterCity(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="Zagreb">Zagreb</option>
                        <option value="Dubrovnik">Dubrovnik</option>
                        <option value="Split">Split</option>
                        <option value="Zadar">Zadar</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="lang-filter-26">${t("labels.language")}</label>
                    <select class="filter-select" id="lang-filter-26" onchange="Page26.filterLang(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="eng">\u{1F1EC}\u{1F1E7} ENG</option>
                        <option value="esp">\u{1F1EA}\u{1F1F8} ESP</option>
                        <option value="fra">\u{1F1EB}\u{1F1F7} FRA</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="month-filter-26">${t("table.month")}</label>
                    <select class="filter-select" id="month-filter-26" onchange="Page26.filterMonth(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
            </div>

            <div class="kpi-grid kpi-grid-4">
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.freeToursPaxCount")} YTD</div>
                    <div class="kpi-value" id="kv-free-26">\u2014</div>
                    <div class="kpi-sub" id="kv-free-pax-26">\u2014 t</div>
                </div>
                <div class="kpi hl-green">
                    <div class="kpi-label">${t("labels.avgPaxFreeTour")}</div>
                    <div class="kpi-value" id="kv-avg-pax-26">\u2014</div>
                    <div class="kpi-sub">${t("labels.paxPerTour")}</div>
                </div>
                <div class="kpi hl-blue">
                    <div class="kpi-label">${t("labels.paidToursCount")} YTD</div>
                    <div class="kpi-value" id="kv-paid-26">\u2014</div>
                    <div class="kpi-sub" id="kv-paid-pax-26">\u2014 pax</div>
                </div>
                <div class="kpi hl-teal">
                    <div class="kpi-label">${t("labels.activeGuides")}</div>
                    <div class="kpi-value" id="kv-guides-26">\u2014</div>
                    <div class="kpi-sub">${t("labels.in2026")}</div>
                </div>
            </div>`;
    },
    _buildFreeTours() {
      return `<div class="section-divider" onclick="toggleSection('free-section-body-26')">
                <span>${t("sections.freeTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
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
      return `<div class="section-divider" onclick="toggleSection('paid-section-body-26')">
                <span>${t("sections.paidTours")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
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
    _buildGuides() {
      return `<div class="section-divider" onclick="toggleSection('guides-body-26')">
                <span>${t("labels.guides")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
            <div id="guides-body-26" class="section-body">
                <div id="guide-sections-26"></div>
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
      document.getElementById("page-26").innerHTML = this._buildHeader() + this._buildFilters() + this._buildFreeTours() + this._buildPaidTours() + this._buildGuides();
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

  // src/pages/page-cmp/charts.js
  function axisDefaults() {
    const s = getComputedStyle(document.body);
    return {
      ticks: { color: s.getPropertyValue("--text2").trim(), font: { family: "Montserrat", size: 11 } },
      grid: { color: s.getPropertyValue("--border").trim() }
    };
  }
  function tooltipDefaults() {
    const s = getComputedStyle(document.body);
    return {
      backgroundColor: s.getPropertyValue("--card-bg").trim(),
      titleColor: s.getPropertyValue("--text").trim(),
      bodyColor: s.getPropertyValue("--text2").trim(),
      borderColor: s.getPropertyValue("--border-dark").trim(),
      borderWidth: 1
    };
  }
  function createFreePaxCityChart(ctx, cityLabels, cityData25, cityData26, cityDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: cityLabels,
        datasets: [
          { label: `${rangeLabel} 2025`, data: cityLabels.map((c) => cityData25[c]), backgroundColor: cityLabels.map((c) => CITY_COLS[c] + "80"), borderRadius: 4 },
          { label: `${rangeLabel} 2026`, data: cityLabels.map((c) => cityData26[c]), backgroundColor: cityLabels.map((c) => CITY_COLS[c]), borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
  function createPaidCityChart(ctx, cityLabels, paidCityData25, paidCityData26, cityDeltaPlugin, colors, rangeLabel) {
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: cityLabels,
        datasets: [
          { label: `${rangeLabel} 2025`, data: cityLabels.map((c) => paidCityData25[c]), backgroundColor: cityLabels.map((c) => CITY_COLS[c] + "80"), borderRadius: 4 },
          { label: `${rangeLabel} 2026`, data: cityLabels.map((c) => paidCityData26[c]), backgroundColor: cityLabels.map((c) => CITY_COLS[c]), borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
              font: { size: 10, family: "'Montserrat',sans-serif" },
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
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${i.raw} PAX/tour` } }
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
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: {
            callbacks: {
              afterLabel: (item) => {
                const sec = item.datasetIndex === 0 ? ds25._secondaryData[item.dataIndex] : ds26._secondaryData[item.dataIndex];
                return sec ? `${item.datasetIndex === 0 ? ds25._secondaryKey || "pax" : (ds26._secondaryKey || "pax") === "pax" ? "PAX" : "Tours"}: ${sec}` : "";
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
        plugins: {
          legend: { display: true, labels: { color: colors.text, font: { size: 11, family: "'Montserrat',sans-serif" }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${i.raw} PAX/tour` } }
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
    ALL_PAID_TYPES: ["war", "food", "best", "war PR", "food PR", "old", "big"],
    activePrivateCity: "all",
    activePrivateType: "all",
    activeSharedCity: "all",
    activeSharedType: "all",
    PRIVATE_TYPES: ["war PR", "food PR", "best", "old", "big"],
    SHARED_TYPES: ["war", "food", "best"],
    _initialized: false,
    _el(id) {
      return document.getElementById(id + "-cmp");
    },
    _scope(sel) {
      return document.querySelectorAll("#page-cmp " + sel);
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
    pctChange(v25, v26) {
      if (v25 === 0 && v26 === 0) return "\u2014";
      if (v25 === 0) return "+\u221E%";
      const p = ((v26 - v25) / v25 * 100).toFixed(0);
      const cls = v26 > v25 ? "pos" : v26 < v25 ? "neg" : "neu";
      const sign = v26 >= v25 ? "+" : "";
      return `<span class="kpi-pct ${cls}">${sign}${p}%</span>`;
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
    renderCard(m) {
      const st25 = m.g25 ? m.g25.stats[this.activeLang] : null;
      const st26 = m.g26 ? m.g26.stats[this.activeLang] : null;
      const ytd25 = st25 ? filteredStats(st25, this.activeMonths) : null;
      const ytd26 = st26 ? filteredStats(st26, this.activeMonths) : null;
      const col = CITY_COLS[m.city] || "#999";
      const init = m.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
      const inactive = !m.g26;
      return `<div class="guide-card ${inactive ? "inactive" : ""}" data-city="${m.city}" data-name="${safeName(m.name)}"><div class="gc-stripe" style="background:${col}"></div><div class="gc-body"><div class="gc-header"><div class="avatar" style="background:${col}18;color:${col};border:1px solid ${col}40">${init}</div><span class="gc-name">${m.name}</span><span class="city-pill" style="background:${col}18;color:${col}">${m.city}</span></div><table class="gc-cmp-table"><tbody><tr><td class="label">${t("labels.freeT")}</td><td class="v25">${ytd25 ? ytd25.freeTours : "\u2014"}</td><td class="v26">${ytd26 ? ytd26.freeTours : "\u2014"}</td><td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.freeTours, ytd26.freeTours) : "\u2014"}</td></tr><tr><td class="label">${t("labels.freeP")}</td><td class="v25">${ytd25 ? ytd25.freePax : "\u2014"}</td><td class="v26">${ytd26 ? ytd26.freePax : "\u2014"}</td><td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.freePax, ytd26.freePax) : "\u2014"}</td></tr><tr><td class="label">${t("labels.paidT")}</td><td class="v25">${ytd25 ? ytd25.paidTours : "\u2014"}</td><td class="v26">${ytd26 ? ytd26.paidTours : "\u2014"}</td><td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.paidTours, ytd26.paidTours) : "\u2014"}</td></tr><tr><td class="label">${t("labels.paidP")}</td><td class="v25">${ytd25 ? ytd25.paidPax : "\u2014"}</td><td class="v26">${ytd26 ? ytd26.paidPax : "\u2014"}</td><td class="delta">${ytd25 && ytd26 ? this.fmtDelta(ytd25.paidPax, ytd26.paidPax) : "\u2014"}</td></tr></tbody></table></div></div>`;
    },
    renderAll() {
      let html = "";
      const fc = this.mergedGuides.filter((m) => this.activeCity === "all" || m.city === this.activeCity);
      CITIES.forEach((city) => {
        const cg = fc.filter((m) => m.city === city);
        if (!cg.length) return;
        html += `<section class="city-section" data-city="${city}"><div class="section-title ${CITY_CLS[city] || ""}">${city}</div><div class="guide-grid">${cg.map((m) => this.renderCard(m)).join("")}</div></section>`;
      });
      this._el("guide-sections").innerHTML = html;
      this.updateKPIs();
      this.renderMonthlyTable();
      setTimeout(() => this.updateCharts(), 100);
    },
    updateKPIs() {
      const fc = this.mergedGuides.filter((m) => this.activeCity === "all" || m.city === this.activeCity);
      let g25 = 0, g26 = 0, pt25 = 0, pt26 = 0, fp25 = 0, fp26 = 0;
      fc.forEach((m) => {
        if (m.g25) {
          g25++;
          const s25 = filteredStats(m.g25.stats[this.activeLang], this.activeMonths);
          fp25 += s25.freePax;
          pt25 += s25.paidTours;
        }
        if (m.g26) {
          g26++;
          const s26 = filteredStats(m.g26.stats[this.activeLang], this.activeMonths);
          fp26 += s26.freePax;
          pt26 += s26.paidTours;
        }
      });
      const setDelta = (absId, pctId, v25, v26, fmt2) => {
        const diff = v26 - v25;
        const cls = diff >= 0 ? "pos" : "neg";
        const pct = v25 === 0 ? "\u2014" : (diff >= 0 ? "+" : "-") + Math.abs(Math.round(diff / v25 * 100)) + "%";
        this._el(absId).innerHTML = `<span class="${cls}">${fmt2(Math.abs(diff))}</span>`;
        this._el(pctId).innerHTML = `<span class="${cls}">${pct}</span>`;
      };
      setDelta("kd-free-abs", "kd-free-pct", fp25, fp26, fmtN);
      setDelta("kd-paid-abs", "kd-paid-pct", pt25, pt26, (v) => v);
      setDelta("kd-guides-abs", "kd-guides-pct", g25, g26, (v) => v);
      this._el("kv-free25").textContent = fmtN(fp25);
      this._el("kv-free26").textContent = fmtN(fp26);
      this._el("kv-paid25").textContent = pt25;
      this._el("kv-paid26").textContent = pt26;
      this._el("kv-guides25").textContent = g25;
      this._el("kv-guides26").textContent = g26;
      let ft25 = 0, ft26 = 0;
      fc.forEach((m) => {
        if (m.g25) {
          const s = filteredStats(m.g25.stats[this.activeLang], this.activeMonths);
          ft25 += s.freeTours;
        }
        if (m.g26) {
          const s = filteredStats(m.g26.stats[this.activeLang], this.activeMonths);
          ft26 += s.freeTours;
        }
      });
      const avg25 = ft25 > 0 ? (fp25 / ft25).toFixed(1) : "\u2014";
      const avg26 = ft26 > 0 ? (fp26 / ft26).toFixed(1) : "\u2014";
      this._el("kv-avg-pax25").textContent = avg25;
      this._el("kv-avg-pax26").textContent = avg26;
      setDelta("kd-avg-pax-abs", "kd-avg-pax-pct", ft25 > 0 ? fp25 / ft25 : 0, ft26 > 0 ? fp26 / ft26 : 0, (v) => v.toFixed(1));
    },
    getChartColors() {
      const isDark = document.body.classList.contains("dark-mode");
      return {
        text: isDark ? "#eeeeee" : "#111111",
        text3: isDark ? "#888888" : "#999999",
        border: isDark ? "#333333" : "#e8e8e8",
        y25: "#6366F1",
        y26: "#1D9E75"
      };
    },
    updateCharts() {
      const self = this;
      const fc = this.mergedGuides.filter((m) => this.activeCity === "all" || m.city === this.activeCity);
      const colors = this.getChartColors();
      const rangeLabel = getRangeLabel();
      const cityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      const cityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      const paidCityData25 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      const paidCityData26 = { Zagreb: 0, Dubrovnik: 0, Split: 0, Zadar: 0 };
      fc.forEach((m) => {
        const s25 = m.g25 ? filteredStats(m.g25.stats[this.activeLang], this.activeMonths) : null;
        const s26 = m.g26 ? filteredStats(m.g26.stats[this.activeLang], this.activeMonths) : null;
        if (s25) {
          cityData25[m.city] += s25.freePax;
          paidCityData25[m.city] += s25.paidTours;
        }
        if (s26) {
          cityData26[m.city] += s26.freePax;
          paidCityData26[m.city] += s26.paidTours;
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
            ctx.font = "500 10px 'Montserrat',sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${fmtN(v25)} / ${fmtN(v26)}`, x, y);
            ctx.fillStyle = color;
            ctx.font = "bold 10px 'Montserrat',sans-serif";
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
          ctx.font = "bold 11px 'Montserrat',sans-serif";
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
            ctx.font = "500 10px 'Montserrat',sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${fmtN(v25)} / ${fmtN(v26)}`, x, y);
            ctx.fillStyle = color;
            ctx.font = "bold 10px 'Montserrat',sans-serif";
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
            fc.filter((m) => m.city === city).forEach((m) => {
              if (i < cutoffMonth) {
                const b25 = m.g25 && m.g25.stats[this.activeLang].byMonth[String(i)];
                const b26 = m.g26 && m.g26.stats[this.activeLang].byMonth[String(i)];
                if (b25) pax25 += b25.free?.pax || 0;
                if (b26) pax26 += b26.free?.pax || 0;
              } else {
                for (let d = 1; d <= cutoffDay2; d++) {
                  const key = `${i}-${d}`;
                  const d25 = m.g25 && m.g25.stats[this.activeLang].byDay?.[key];
                  const d26 = m.g26 && m.g26.stats[this.activeLang].byDay?.[key];
                  if (d25) pax25 += d25.free?.pax || 0;
                  if (d26) pax26 += d26.free?.pax || 0;
                }
              }
            });
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
      const getPax = (guide, lang, m) => {
        const st = guide?.stats?.[lang];
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
          let p25 = 0, p26 = 0;
          this.mergedGuides.filter((g) => g.city === city).forEach((mg) => {
            if (mg.g25) p25 += getPax(mg.g25, this.activeLang, m);
            if (mg.g26) p26 += getPax(mg.g26, this.activeLang, m);
          });
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
        return `<tr><td class="mpax-month">${MONTH_NAMES[row.m]}${row.isPartial ? "<sup>*</sup>" : ""}</td>${cells}</tr>`;
      }).join("");
      const totalCells = CITIES.map((city) => {
        const { p25, p26 } = totals[city];
        const { d, p } = fmtDelta(p25, p26);
        return `<td>${fmtN(p25)}</td><td>${fmtN(p26)}</td><td>${d}</td><td>${p}</td>`;
      }).join("");
      const hasPartial = data.some((r) => r.isPartial);
      const html = `<div class="chart-card">
            <div class="chart-card-title"${titleAttr("charts.freePaxByMonthAndCity")}>${t("charts.freePaxByMonthAndCity")} \u2014 <span class="ytd-range-label">${getRangeLabel()}</span> 2025 vs. 2026</div>
            <div class="mpax-wrap">
            <table class="mpax-table">
                <thead>
                    <tr><th class="mpax-month-head" rowspan="2">${t("labels.mo")}</th>${cityHeaders}</tr>
                    <tr>${subHeaders}</tr>
                </thead>
                <tbody>
                    ${bodyRows}
                    <tr class="mpax-total"><td class="mpax-month">${t("labels.total")}</td>${totalCells}</tr>
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
    filterPrivateType(type, btn) {
      this.activePrivateType = type;
      this._setActivePill("private-type-pills-cmp", btn);
      this.updatePaidTypeCharts();
    },
    filterSharedCity(city, btn) {
      this.activeSharedCity = city;
      this._setActivePill("shared-city-pills-cmp", btn);
      this.updatePaidTypeCharts();
    },
    filterSharedType(type, btn) {
      this.activeSharedType = type;
      this._setActivePill("shared-type-pills-cmp", btn);
      this.updatePaidTypeCharts();
    },
    filterAvgType(type, btn) {
      this.activeAvgType = type;
      this._setActivePill("avg-type-pills-cmp", btn);
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
      const fc = this.mergedGuides.filter((m) => city === "all" || m.city === city);
      return Array.from({ length: maxMonth }, (_, i) => i + 1).map((mo) => {
        let primary = 0, secondary = 0;
        const secondaryKey = primaryKey === "tours" ? "pax" : "tours";
        if (mo < cutoffMonth) {
          fc.forEach((m) => {
            const g = year === 25 ? m.g25 : m.g26;
            if (!g) return;
            const bmt = g.stats[this.activeLang]?.byMonthType?.[String(mo)];
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
            fc.forEach((m) => {
              const g = year === 25 ? m.g25 : m.g26;
              if (!g) return;
              const bdt = g.stats[this.activeLang]?.byDayType?.[key];
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
      const cutoffDay = parseInt(getGlobalDate().split("-")[2]);
      const secondaryLabelPlugin = (secondaryKey) => ({
        id: "secondaryLabel",
        afterDraw(chart) {
          const ctx = chart.ctx;
          const meta0 = chart.getDatasetMeta(0);
          const meta1 = chart.getDatasetMeta(1);
          ctx.save();
          ctx.font = "500 9px 'Montserrat',sans-serif";
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
      const fc = this.mergedGuides.filter((m) => this.activeCity === "all" || m.city === this.activeCity);
      const typesToShow = this.activeAvgType === "all" ? this.ALL_PAID_TYPES : [this.activeAvgType];
      const getTypeAvg = (year, types) => Array.from({ length: maxMonth }, (_, i) => i + 1).map((mo) => {
        let pax = 0, tours = 0;
        if (mo < cutoffMonth) {
          fc.forEach((m) => {
            const g = year === 25 ? m.g25 : m.g26;
            const bmt = g?.stats[this.activeLang]?.byMonthType?.[String(mo)];
            if (!bmt) return;
            types.forEach((tp) => {
              const d = bmt[tp];
              if (d) {
                pax += d.pax || 0;
                tours += d.tours || 0;
              }
            });
          });
        } else if (mo === cutoffMonth) {
          for (let d = 1; d <= cutoffDay; d++) {
            const key = `${mo}-${d}`;
            fc.forEach((m) => {
              const g = year === 25 ? m.g25 : m.g26;
              const bdt = g?.stats[this.activeLang]?.byDayType?.[key];
              if (!bdt) return;
              types.forEach((tp) => {
                const td = bdt[tp];
                if (td) {
                  pax += td.pax || 0;
                  tours += td.tours || 0;
                }
              });
            });
          }
        }
        return tours > 0 ? +(pax / tours).toFixed(1) : null;
      });
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
      this.renderAll();
    },
    filterLang(lang) {
      this.activeLang = lang;
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
                <p><span class="ytd-range-label">Jan\u2013May</span> 2025 vs. 2026 &middot; ${t("sections.productionByGuide")}</p>
            </div>
            <div class="header-right">
                <div id="date-pov-cmp" class="mb-6"></div>
                <div class="header-badge">${t("sections.comparisonYtd")}</div>
            </div>
        </div>`;
    },
    _buildKpisAndFilters() {
      return `        <div class="main">
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
                <div class="kpi hl-teal">
                    <div class="kpi-label">${t("labels.activeGuides")}</div>
                    <div class="kpi-delta">
                        <span class="kpi-delta-abs" id="kd-guides-abs-cmp">\u2014</span>
                        <span class="kpi-delta-pct" id="kd-guides-pct-cmp">\u2014</span>
                    </div>
                    <div class="kpi-2y">
                        <div>
                            <div class="kpi-2y-label">2025</div>
                            <div class="kpi-2y-val" id="kv-guides25-cmp">\u2014</div>
                        </div>
                        <div>
                            <div class="kpi-2y-label">2026</div>
                            <div class="kpi-2y-val" id="kv-guides26-cmp">\u2014</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="filter-area">
                <div class="filter-group">
                    <label for="city-filter-cmp">${t("labels.city")}</label>
                    <select class="filter-select" id="city-filter-cmp" onchange="PageCmp.filterCity(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="Zagreb">Zagreb</option>
                        <option value="Dubrovnik">Dubrovnik</option>
                        <option value="Split">Split</option>
                        <option value="Zadar">Zadar</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="lang-filter-cmp">${t("labels.language")}</label>
                    <select class="filter-select" id="lang-filter-cmp" onchange="PageCmp.filterLang(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="eng">\u{1F1EC}\u{1F1E7} ENG</option>
                        <option value="esp">\u{1F1EA}\u{1F1F8} ESP</option>
                        <option value="fra">\u{1F1EB}\u{1F1F7} FRA</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="month-filter-cmp">${t("labels.mo")}</label>
                    <select class="filter-select" id="month-filter-cmp" onchange="PageCmp.filterMonth(this.value)">
                        <option value="all">${t("labels.all")}</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
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
                        <div class="chart-card-title"${titleAttr("charts.avgFreePaxCmp")}>${t("charts.avgFreePaxCmp")} \u2014 <span class="ytd-range-label">Jan\u2013May</span> 2025 vs. 2026</div>
                        <div class="chart-container">
                            <canvas id="avgFreePaxCmpChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.cumulativeFreePax")}>${t("charts.cumulativeFreePax")} (<span class="ytd-range-label">Jan\u2013May</span>)</div>
                        <div class="chart-container">
                            <canvas id="monthlyChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.cityMonthlyCumulative")}>${t("charts.cityMonthlyCumulative")} (<span class="ytd-range-label">Jan\u2013May</span>)</div>
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
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.paidToursByCity")}>${t("charts.paidToursByCity")}</div>
                        <div class="chart-container">
                            <canvas id="paidCityChart-cmp"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title"${titleAttr("charts.cumulativePaidTours")}>${t("charts.cumulativePaidTours")} (<span class="ytd-range-label">Jan\u2013May</span>)</div>
                        <div class="chart-container">
                            <canvas id="paidChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.privatePaidTours")}>${t("charts.privatePaidTours")} \u2014 <span class="ytd-range-label">Jan\u2013May</span> 2025 vs. 2026</div>
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
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.type")}</span>
                                <div id="private-type-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterPrivateType('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('best',this)">best</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('old',this)">old</button>
                                    <button class="pill" onclick="PageCmp.filterPrivateType('big',this)">big</button>
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
                        <div class="chart-card-title"${titleAttr("charts.avgPaxByType")}>${t("charts.avgPaxByType")} \u2014 <span class="ytd-range-label">Jan\u2013May</span> 2025 vs. 2026</div>
                        <div class="type-chart-filters">
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.type")}</span>
                                <div id="avg-type-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterAvgType('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('war',this)">war</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('food',this)">food</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('best',this)">best</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('war PR',this)">war PR</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('food PR',this)">food PR</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('old',this)">old</button>
                                    <button class="pill" onclick="PageCmp.filterAvgType('big',this)">big</button>
                                </div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="warAvgChart-cmp"></canvas>
                        </div>
                    </div>
                </div>
                <div class="charts-row">
                    <div class="chart-card type-chart-card">
                        <div class="chart-card-title"${titleAttr("charts.sharedPaidTours")}>${t("charts.sharedPaidTours")} \u2014 <span class="ytd-range-label">Jan\u2013May</span> 2025 vs. 2026</div>
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
                            <div class="type-filter-row">
                                <span class="type-filter-label">${t("labels.type")}</span>
                                <div id="shared-type-pills-cmp" class="pill-group">
                                    <button class="pill active" onclick="PageCmp.filterSharedType('all',this)">${t("labels.all")}</button>
                                    <button class="pill" onclick="PageCmp.filterSharedType('war',this)">war</button>
                                    <button class="pill" onclick="PageCmp.filterSharedType('food',this)">food</button>
                                    <button class="pill" onclick="PageCmp.filterSharedType('best',this)">best</button>
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
    _buildGuides() {
      return `            <div class="section-divider" onclick="toggleSection('guides-body-cmp')">
                <span>${t("sections.guides")}</span>
                <span class="section-chevron">\u25BE</span>
            </div>
            <div id="guides-body-cmp" class="section-body">
                <div id="guide-sections-cmp"></div>
            </div>
        </div>`;
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
      document.getElementById("page-cmp").innerHTML = this._buildHeader() + this._buildKpisAndFilters() + this._buildFreeTours() + this._buildPaidTours() + this._buildGuides();
      const now = (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const datePov = this._el("date-pov");
      if (datePov) datePov.textContent = now;
    },
    init() {
      if (this._initialized) return;
      this._initialized = true;
      this.rebuildStructure();
      this.mergedGuides = this.buildMerged();
      this.renderAll();
    }
  };
  registerPage("PageCmp", PageCmp);

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
      if (!g.mgmt?.byDay) return;
      for (const [key, val] of Object.entries(g.mgmt.byDay)) {
        const [m, d] = key.split("-").map(Number);
        if (m < cutoffMonth || m === cutoffMonth && d <= cutoffDay) {
          fields.forEach((f) => {
            result[m][f] += val[f] || 0;
          });
        }
      }
    });
    return result;
  }
  function axisDefaults2() {
    const s = getComputedStyle(document.body);
    return {
      ticks: { color: s.getPropertyValue("--text2").trim(), font: { family: "Montserrat", size: 11 } },
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

  // src/pages/management/pl.js
  function initPl(city) {
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
      return `<div class="kpi-delta ${cls}">${sign}\u20AC${fmt(Math.abs(d))}${pctStr} vs 2025</div>`;
    }
    document.getElementById("kpi-revenue").textContent = fmtEur(k.revenue);
    document.getElementById("kpi-revenue-sub").innerHTML = `${t("management.gmOfRevenue")}: ${gmPct.toFixed(1)}% ${t("management.ofRevenue")}` + kpiDelta(k.revenue, k25?.revenue);
    document.getElementById("kpi-commission").textContent = fmtEur(k.commissionCost);
    document.getElementById("kpi-commission-sub").innerHTML = `${commPct.toFixed(1)}% ${t("management.ofRevenue")}` + kpiDelta(k.commissionCost, k25?.commissionCost);
    document.getElementById("kpi-vcost").textContent = fmtEur(k.vendorCost);
    document.getElementById("kpi-vcost-sub").innerHTML = t("management.guideFeesPaid") + kpiDelta(k.vendorCost, k25?.vendorCost);
    document.getElementById("kpi-gm").textContent = fmtEur(k.grossMargin);
    document.getElementById("kpi-gmpct").innerHTML = `<span class="${gmClass(gmPct)}">${gmPct.toFixed(1)}% ${t("management.margin")}</span>`;
    document.getElementById("kpi-gm-delta").innerHTML = kpiDelta(k.grossMargin, k25?.grossMargin);
    document.getElementById("kpi-tour-cost").textContent = fmtEur(k.tourCost);
    document.getElementById("kpi-vat").textContent = fmtEur(k.vatAmount);
    document.getElementById("kpi-avg-gm").textContent = fmtEur(avgGm);
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
  function renderInsightCallouts(k, k25) {
    const el = document.getElementById("insight-strip");
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
    candidates.sort((a, b) => Math.abs(b.pct ?? b.val) - Math.abs(a.pct ?? a.val));
    const top = candidates.slice(0, 3);
    el.innerHTML = top.map((c) => {
      const isGood = c.positive ? c.val >= 0 : c.val <= 0;
      const cls = isGood ? "insight-pos" : "insight-neg";
      const arrow = isGood ? "\u25B2" : "\u25BC";
      const pctStr = c.pct !== null ? ` (${c.pct >= 0 ? "+" : ""}${c.pct.toFixed(1)}%)` : "";
      return `<span class="insight-pill ${cls}">${arrow} ${c.label} ${c.fmt(c.val)}${pctStr} vs 2025</span>`;
    }).join("");
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
    const MONTH_SHORT2 = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
    const { c25, c26 } = getThemeColors();
    makeLineChart("month-gm-line", allM.map((m) => MONTH_SHORT2[m]), [
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
    const el = document.getElementById("billing-stats");
    if (el) {
      let bstat = function(label, d25, d26) {
        const gm26pct = d26.revenue > 0 ? d26.grossMargin / d26.revenue * 100 : 0;
        const gm25pct = d25.revenue > 0 ? d25.grossMargin / d25.revenue * 100 : 0;
        const revDelta = d26.revenue - d25.revenue;
        return `<div class="chart-card" style="padding:16px 20px">
                <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text2);margin-bottom:8px">${label}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div>
                        <div style="font-size:10px;color:var(--text3)">2025 ${t("management.revenue")}</div>
                        <div style="font-family:var(--font-mono);font-size:15px">${fmtEur(d25.revenue)}</div>
                        <div style="font-size:10px;color:var(--text3)">GM: ${gm25pct.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div style="font-size:10px;color:var(--text3)">2026 ${t("management.revenue")}</div>
                        <div style="font-family:var(--font-mono);font-size:15px">${fmtEur(d26.revenue)}</div>
                        <div style="font-size:14px;font-weight:600;color:var(--text);margin:4px 0">GM: <span class="${gmClass(gm26pct)}" style="font-size:16px;font-weight:700">${gm26pct.toFixed(1)}%</span></div>
                        <div style="font-size:10px">${dd(revDelta, true)} ${t("management.vs2025")}</div>
                    </div>
                </div>
            </div>`;
      };
      el.innerHTML = bstat(t("management.directCashCard"), billing25["POS"] || { revenue: 0, grossMargin: 0 }, billing26["POS"] || { revenue: 0, grossMargin: 0 }) + bstat(t("management.otaBankTransfer"), billing25["CPP"] || { revenue: 0, grossMargin: 0 }, billing26["CPP"] || { revenue: 0, grossMargin: 0 });
    }
  }
  function refreshPl(city) {
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
  function renderGuideTable(city) {
    const guides = guidesForCity(city);
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
        freeTours: sts.freeTours,
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
        gm25
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
      return `<tr class="${rowClass}">
            <td class="rank">${i + 1}</td>
            <td class="guide-name">${r.name}</td>
            <td><span class="city-dot" style="background:${CITY_COLS[r.city] || "#999"}"></span>${r.city}</td>
            <td>${fmt(r.freeTours)}</td>
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
      if (th.dataset.col === col) th.classList.add(_sortDir === -1 ? "sorted-desc" : "sorted-asc");
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
  function renderDirectOtaTrend() {
    const has25 = typeof guideStats25 !== "undefined";
    const MONTH_SHORT2 = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();
    const monthChannel26 = {};
    const monthChannel25 = {};
    function buildMonthChannelData(guides, monthChannelObj) {
      guides.forEach((g) => {
        if (!g.mgmt?.byDay) return;
        Object.entries(g.mgmt.byDay).forEach(([dayKey, dayVal]) => {
          const [m, d] = dayKey.split("-").map(Number);
          if (m < cutoffMonth || m === cutoffMonth && d <= cutoffDay) {
            if (!monthChannelObj[m]) monthChannelObj[m] = { web: 0, ota: 0 };
            const gTotal = g.mgmt.revenue || 1;
            const webRatio = (g.mgmt.byChannel?.web?.revenue || 0) / gTotal;
            const otaRatio = ((g.mgmt.byChannel?.OTA?.revenue || 0) + (g.mgmt.byChannel?.b2b?.revenue || 0)) / gTotal;
            monthChannelObj[m].web += (dayVal.revenue || 0) * webRatio;
            monthChannelObj[m].ota += (dayVal.revenue || 0) * otaRatio;
          }
        });
      });
    }
    buildMonthChannelData(guideStats26, monthChannel26);
    if (has25) buildMonthChannelData(guideStats25, monthChannel25);
    const allM = Array.from({ length: cutoffMonth }, (_, i) => i + 1);
    const { c25, c26, green } = getThemeColors();
    makeLineChart("direct-ota-line", allM.map((m) => MONTH_SHORT2[m]), [
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
            <th>Action</th>
        </tr></thead>
        <tbody>${srcKeys.map((k) => {
      const d = srcData[k];
      const d25 = srcData25[k];
      const gmpct = d.revenue > 0 ? d.grossMargin / d.revenue * 100 : 0;
      const commpct = d.revenue > 0 ? (d.commissionCost || 0) / d.revenue * 100 : 0;
      const dgm = d25 ? d.grossMargin - d25.grossMargin : null;
      let action = "\u2014";
      if (d.tours < 5) action = t("management.lowVolume");
      else if (commpct > 25) action = t("management.highCommission");
      else if (commpct < 15 && d.tours >= 20) action = t("management.keepPushing");
      else if (dgm !== null && dgm < -200) action = t("management.declining");
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
                <td style="font-size:11px;color:var(--text2)">${action}</td>
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
            <td>${avgUnit25 > 0 ? fmtEur(avgUnit25) : "\u2014"}<br><small class="yoy">${dd(dUnit, true)}</small></td>
            <td>${fmtEur(d.revenue)}</td>
            <td class="neg">${d.commissionCost > 0 ? fmtEur(-d.commissionCost) : "\u2014"}</td>
            <td class="${gmClass(d.grossMargin)}">${fmtEur(d.grossMargin)}</td>
            <td class="${gmClass(gmpct)}">${gmpct.toFixed(1)}%</td>
        </tr>`;
    }).join("");
  }
  function refreshChannels() {
    renderDirectOtaTrend();
  }

  // src/pages/management/ops.js
  var DOW_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var SEASON_ORDER = ["low", "mid", "high", "peak"];
  var PAXBAND_ORDER = ["1-4", "5-10", "11-20", "21-30", "30+"];
  var GUIDE_PBAND_ORDER = ["1-5", "6-10", "11+"];
  var MONTH_SHORT = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };
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
    const time26 = mgmt26.byTime;
    const time25 = mgmt25?.byTime || {};
    const timeKeys = [.../* @__PURE__ */ new Set([...Object.keys(time26), ...Object.keys(time25)])].sort((a, b) => parseInt(a) - parseInt(b));
    makeBarChart("time-bar", timeKeys.map((h) => `${h}:00`), [
      { label: "2025", data: timeKeys.map((h) => time25[h]?.tours || 0), backgroundColor: c25 + "aa", borderRadius: 4, borderSkipped: false },
      { label: "2026", data: timeKeys.map((h) => time26[h]?.tours || 0), backgroundColor: c26 + "aa", borderRadius: 4, borderSkipped: false }
    ], {
      showLegend: true,
      tooltipCb: {
        afterLabel: (ctx) => {
          const d = ctx.datasetIndex === 0 ? time25[timeKeys[ctx.dataIndex]] : time26[timeKeys[ctx.dataIndex]];
          if (!d) return "";
          const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : "\u2014";
          return `Revenue: \u20AC${fmt(d.revenue || 0)}
GM%: ${gmpct}%`;
        }
      }
    });
    const sea26 = mgmt26.bySeason;
    const sea25 = mgmt25?.bySeason || {};
    const seaLabels = SEASON_ORDER.filter((k) => sea26[k] || sea25[k]);
    makeBarChart("season-bar", seaLabels.map((k) => k[0].toUpperCase() + k.slice(1)), [
      { label: "2025", data: seaLabels.map((k) => sea25[k]?.tours || 0), backgroundColor: c25 + "aa", borderRadius: 4, borderSkipped: false },
      { label: "2026", data: seaLabels.map((k) => sea26[k]?.tours || 0), backgroundColor: c26 + "aa", borderRadius: 4, borderSkipped: false }
    ], {
      showLegend: true,
      tooltipCb: {
        afterLabel: (ctx) => {
          const d = ctx.datasetIndex === 0 ? sea25[seaLabels[ctx.dataIndex]] : sea26[seaLabels[ctx.dataIndex]];
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
    renderOpsMonthLine();
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
  function renderOpsMonthLine() {
    const has25 = typeof guideStats25 !== "undefined";
    const { c25, green } = getThemeColors();
    const { month: cutoffMonth, day: cutoffDay } = parseGlobalDate();
    const m26 = buildMonthlyFromDays(guideStats26, cutoffMonth, cutoffDay);
    const m25 = has25 ? buildMonthlyFromDays(guideStats25, cutoffMonth, cutoffDay) : {};
    const allM = Array.from({ length: cutoffMonth }, (_, i) => i + 1);
    makeLineChart("month-line", allM.map((m) => MONTH_SHORT[m]), [
      { label: t("management.revenue") + " 2025", data: allM.map((m) => m25[m]?.revenue || 0), borderColor: c25, backgroundColor: "transparent", tension: 0.3, borderDash: [5, 3] },
      { label: t("management.revenue") + " 2026", data: allM.map((m) => m26[m]?.revenue || 0), borderColor: "#8FA8BC", backgroundColor: "#8FA8BC22", tension: 0.3, fill: true },
      { label: t("management.grossMargin") + " 2025", data: allM.map((m) => m25[m]?.grossMargin || 0), borderColor: c25, backgroundColor: "transparent", tension: 0.3, borderDash: [2, 2], borderWidth: 1.5 },
      { label: t("management.grossMargin") + " 2026", data: allM.map((m) => m26[m]?.grossMargin || 0), borderColor: green, backgroundColor: "transparent", tension: 0.3, borderWidth: 2 }
    ]);
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
      const methods2 = ["card", "bank trf", "cash"];
      methods2.forEach((method) => {
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
                        <span class="kpi-delta ${deltaClass(gmDelta)}"> ${gmDelta > 0 ? "+" : ""}${gmDelta.toFixed(1)}%</span><br>
                        ${d26.tours} tours
                    </div>
                </div>
            `;
      });
    }
    const methods = ["card", "bank trf", "cash"];
    makeBarChart("payment-bar", methods.map((m) => m === "bank trf" ? t("management.bankTransfer") : t(`management.${m}`)), [
      { label: "2025", data: methods.map((m) => pm25?.[m]?.revenue || 0), backgroundColor: c25 + "aa", borderRadius: 4, borderSkipped: false },
      { label: "2026", data: methods.map((m) => pm26?.[m]?.revenue || 0), backgroundColor: c26 + "aa", borderRadius: 4, borderSkipped: false }
    ], {
      showLegend: true,
      tooltipCb: {
        afterLabel: (ctx) => {
          const method = methods[ctx.dataIndex];
          const d = ctx.datasetIndex === 0 ? pm25?.[method] : pm26?.[method];
          if (!d) return "";
          const gmpct = d.revenue > 0 ? (d.grossMargin / d.revenue * 100).toFixed(1) : "\u2014";
          return `Gross Margin: \u20AC${fmt(d.grossMargin || 0)}
GM%: ${gmpct}%`;
        }
      }
    });
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
    const lossFromSmallGroups = smallGroup26.grossMargin < 0 ? Math.abs(smallGroup26.grossMargin) : 0;
    const el = document.getElementById("paxband-action-panel");
    if (el) {
      el.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 10px; color: var(--text);">${t("management.smallGroupProblem")}</div>
            <div style="color: var(--text2); line-height: 1.6; font-size: 11px;">
                <div><strong>\u{1F4CA} ${t("management.prevalence")}:</strong> ${smallGroupPct26.toFixed(0)}% of paid tours are 1\u20135 PAX (${smallGroup26.tours} ${t("management.tours")})</div>
                <div><strong>\u{1F4B0} ${t("management.marginLoss")}:</strong> \u20AC${fmt(lossFromSmallGroups)} total from small groups</div>
                <div><strong>\u{1F4C8} ${t("management.trend")}:</strong> ${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}pp ${t("management.vs2025")} \u2014 getting ${pctChange > 0 ? "worse" : "better"}</div>
            </div>
        `;
    }
  }
  function refreshOps() {
    renderOpsMonthLine();
    renderPaymentMethod();
  }

  // src/pages/management/cities.js
  function initCities() {
    renderCitiesTab();
  }
  function renderCitiesTab() {
    const { c25, c26, green, red } = getThemeColors();
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
                    <div class="kpi-delta ${deltaClass(gmDelta)}" style="margin-top:4px">\u2206 GM: ${gmDelta > 0 ? "+" : ""}${fmtEur(gmDelta)}</div>
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
        const bgHue = gm >= 25 ? 120 : gm >= 10 ? 45 : 0;
        const bgSat = gm > 0 ? 60 : 0;
        const bgLight = gm > 0 ? 85 : 95;
        const bgColor = `hsl(${bgHue}, ${bgSat}%, ${bgLight}%)`;
        ttHtml += `<td class="pos" style="background: ${bgColor}">\u20AC${fmt(data.revenue)}<br><strong>${gm.toFixed(1)}%</strong></td>`;
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
        const commColor = commRate > 25 ? red + "44" : commRate > 15 ? "#BA751744" : green + "22";
        srcHtml += `<td style="background: ${commColor}">\u20AC${fmt(data.revenue)}<br>${commRate.toFixed(1)}% comm</td>`;
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
    ["Zagreb", "Dubrovnik", "Split", "Zadar"].forEach((city) => {
      result[city] = { eng: { tours: 0, pax: 0 }, esp: { tours: 0, pax: 0 }, fra: { tours: 0, pax: 0 } };
    });
    guideStats26.forEach((g) => {
      const city = g.city;
      ["eng", "esp", "fra"].forEach((lang) => {
        if (g.stats?.[lang]) {
          const langStats = filterStatsByDate(g.stats[lang], getGlobalDate());
          result[city][lang].tours += langStats.paidTours || 0;
          result[city][lang].pax += langStats.paidPax || 0;
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
    document.querySelectorAll(`.mgmt-subnav .nav-tab`).forEach((tp) => tp.classList.remove("active", "mgmt-tab-active"));
    document.getElementById("mgmt-" + id).classList.add("active");
    el.classList.add("active", "mgmt-tab-active");
    _activeTab = id;
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
  PAGES.PageMgmt = PageMgmt;
  window.Page25 = Page25;
  window.Page26 = Page26;
  window.toggleSection = toggleSection;
  registerThemeChangeCallback(() => {
    mgmtUpdateCharts();
  });
  registerLanguageChangeCallback(() => {
    updateManagementTabs();
  });
  var shortcutOverlay = () => document.getElementById("shortcut-overlay");
  function toggleShortcutOverlay() {
    const el = shortcutOverlay();
    if (el) el.style.display = el.style.display === "block" ? "none" : "block";
  }
  var PAGE_MAP = {
    "tab-25": "page-25",
    "tab-26": "page-26",
    "tab-cmp": "page-cmp",
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
    document.getElementById("language-toggle")?.addEventListener("click", toggleLanguage);
    document.getElementById("cutoff-picker")?.addEventListener("change", (e) => updateDateAsOf(e.target.value));
    document.querySelector(".print-btn")?.addEventListener("click", () => window.print());
    document.querySelectorAll(".city-pill").forEach((el) => el.addEventListener("click", () => mgmtFilterCityPl(el.dataset.city)));
    document.querySelectorAll(".sort-hdr").forEach((el) => el.addEventListener("click", () => mgmtSort2(el.dataset.col)));
    document.querySelector(".overlay-close")?.addEventListener("click", toggleShortcutOverlay);
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
        const el = document.getElementById("tab-mgmt");
        if (el) showPage("page-mgmt", el);
      },
      "t": () => toggleTheme(),
      "d": () => document.getElementById("cutoff-picker")?.focus(),
      "?": () => toggleShortcutOverlay(),
      "Escape": () => {
        const el = shortcutOverlay();
        if (el && el.style.display === "block") el.style.display = "none";
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
    updateLanguageButton();
    updateNavigationLabels();
    const picker = document.getElementById("cutoff-picker");
    if (picker) {
      picker.value = getGlobalDate();
      updateDateAsOf(picker.value);
    }
    Page25.init();
    initEventListeners();
    initKeyboardShortcuts();
  });
})();
