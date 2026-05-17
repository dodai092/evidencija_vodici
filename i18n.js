const TRANSLATIONS = {
  en: {
    nav: {
      guides2025: 'Guides 2025',
      guides2026: 'Guides 2026',
      comparison: 'Comparison 25/26',
      management: 'Management',
    },
    labels: {
      freeTours: 'Free Tours',
      paidTours: 'Paid Tours',
      freePax: 'Free PAX',
      paidPax: 'Paid PAX',
      monthly: 'Monthly',
      external: 'External',
      avgPaxPerTour: 'Avg PAX per Tour',
      city: 'City',
      language: 'Language',
      mo: 'Mo.',
      all: 'All',
      cumulative: 'Cumulative',
    },
    charts: {
      freePaxByCity: 'Free PAX by City',
      paidToursByCity: 'Paid Tours by City',
      cumulativeFreePax: 'Cumulative Free PAX Trend',
      cumulativePaidTours: 'Cumulative Paid Tours Trend',
      avgFreePaxCmp: 'Avg PAX per Free Tour',
      cityMonthlyCumulative: 'Free PAX by City — Cumulative',
      privatePaidTours: 'Private Paid Tours by Type',
      sharedPaidTours: 'Shared Paid Tours by Type',
      avgPaxByType: 'Avg PAX per Paid Tour Type',
    },
    table: {
      month: 'Mo.',
      free: 'Free',
      paid: 'Paid',
      pax: 'PAX',
    },
    sections: {
      freeTours: 'Free Tours',
      paidTours: 'Paid Tours',
      byCity: 'by City',
      byType: 'by Type',
    },
    management: {
      profitAndLoss: 'Profit & Loss',
      guides: 'Guides',
      channels: 'Channels',
      operational: 'Operational',
      cities: 'Cities',
      revenue: 'Revenue',
      costs: 'Costs',
      profit: 'Profit',
      margin: 'Margin',
    },
  },
  hr: {
    nav: {
      guides2025: 'Vodiči 2025',
      guides2026: 'Vodiči 2026',
      comparison: 'Usporedba 25/26',
      management: 'Upravljanje',
    },
    labels: {
      freeTours: 'Besplatne ture',
      paidTours: 'Plaćene ture',
      freePax: 'Besplatni PAX',
      paidPax: 'Plaćeni PAX',
      monthly: 'Mjesečno',
      external: 'Vanjski',
      avgPaxPerTour: 'Prosječan PAX po turi',
      city: 'Grad',
      language: 'Jezik',
      mo: 'Mj.',
      all: 'Sve',
      cumulative: 'Kumulativno',
    },
    charts: {
      freePaxByCity: 'Besplatni PAX po gradu',
      paidToursByCity: 'Plaćene ture po gradu',
      cumulativeFreePax: 'Trend kumulativnog besplatnog PAX-a',
      cumulativePaidTours: 'Trend kumulativnih plaćenih tura',
      avgFreePaxCmp: 'Prosječan PAX po besplatnoj turi',
      cityMonthlyCumulative: 'Besplatni PAX po gradu — kumulativno',
      privatePaidTours: 'Privatne plaćene ture po vrsti',
      sharedPaidTours: 'Zajedničke plaćene ture po vrsti',
      avgPaxByType: 'Prosječan PAX po vrsti plaćene ture',
    },
    table: {
      month: 'Mj.',
      free: 'Bespl.',
      paid: 'Plaćene',
      pax: 'PAX',
    },
    sections: {
      freeTours: 'Besplatne ture',
      paidTours: 'Plaćene ture',
      byCity: 'po gradu',
      byType: 'po vrsti',
    },
    management: {
      profitAndLoss: 'Dobit i gubitak',
      guides: 'Vodiči',
      channels: 'Kanali',
      operational: 'Operativno',
      cities: 'Gradovi',
      revenue: 'Dohodak',
      costs: 'Troškovi',
      profit: 'Dobit',
      margin: 'Marža',
    },
  }
};

let GLOBAL_LANGUAGE = localStorage.getItem('language') || 'en';

function t(key) {
  const keys = key.split('.');
  let val = TRANSLATIONS[GLOBAL_LANGUAGE];
  for (const k of keys) {
    val = val?.[k];
  }
  return val || key;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateLanguageButton === 'function') updateLanguageButton();
  if (typeof updateNavigationLabels === 'function') updateNavigationLabels();
});
