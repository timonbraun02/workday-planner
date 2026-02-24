/* =========================================================
   I18N.JS – Internationalisierung (DE / EN)
   Muss als ERSTES Script geladen werden.
   ========================================================= */

const I18N = {
  de: {
    // Header
    headerTitle: 'Workday Planner',
    headerSubtitle: 'Optimiere deine Home Office Tage effizient',

    // Tabs
    tabPlaner: 'HO-Planer',
    tabZeitrechner: 'Arbeitszeitrechner',
    tabAdvanced: 'Monatsplanung',

    // Planer Form
    periodsTitle: 'Zeiträume',
    periodLabel: 'Zeitraum',
    bundeslandLabel: 'Bundesland (für alle Zeiträume)',
    bundeslandDefault: 'Nur bundesweite Feiertage',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    hoDays: 'HO-Tage',
    vacationDays: 'Urlaubstage',
    sickDays: 'Krankheitstage',
    removePeriod: 'Zeitraum entfernen',
    addPeriod: '+ Zeitraum hinzufügen',
    advancedOptions: 'Erweiterte Optionen',
    advancedOptionsHide: 'Erweiterte Optionen ausblenden',
    fourDayWeek: '4-Tage-Woche aktivieren',
    fourDayWeekHint: 'Pro Arbeitswoche wird ein Tag abgezogen. Sinnvoll wenn du z.B. freitags generell nicht arbeitest.',
    calculate: 'Berechnen',
    reset: 'Zurücksetzen',

    // Quick Actions
    quickTodayToYearEnd: 'Heute - Jahresende',
    quickCurrentYear: 'Akt. Jahr',
    quickNextYear: 'Nächstes Jahr',
    quickH1: 'H1',
    quickH2: 'H2',
    quickCurrentQuarter: 'Akt. Quartal',

    // Results
    resultTitle: 'Ergebnis',
    calendarDays: 'Kalendertage',
    totalWorkdays: 'Arbeitstage gesamt',
    weekendDays: 'Wochenendtage',
    publicHolidays: 'Feiertage',
    requiredOfficeDays: 'Erforderliche Bürotage',
    officePercentText: 'Das sind {0}% deiner verfügbaren Arbeitstage',
    officeDaysPerWeek: 'Bürotage pro Woche',
    officeDaysPerMonth: 'Bürotage pro Monat',
    weeksInPeriod: 'Wochen im Zeitraum',
    weeksWithDouble: 'Wochen mit 2× Büro',
    showDetails: 'Details anzeigen',
    hideDetails: 'Details ausblenden',
    transferBudget: 'HO-Tage in Monatsplanung übernehmen',
    days: 'Tage',
    weeks: 'Wochen',
    daysPerWeek: 'Tage / Woche',
    daysPerMonth: 'Tage / Monat',

    // Brückentage
    bridgeDaysTitle: 'Brückentage im Zeitraum',
    bridgeDaysHint: 'Mit einem Urlaubstag an diesen Tagen erreichst du eine besonders lange Freizeit:',
    bridgeDayAction: '1 Urlaubstag nehmen',
    bridgeBefore: 'Brücke vor',
    bridgeAfter: 'Brücke nach',
    bridgeFreeDays: '{0} freie Tage am Stück',

    // Zeitrechner
    timeCalcTitle: 'Arbeitszeit berechnen',
    workStart: 'Arbeitsbeginn',
    workEnd: 'Arbeitsende',
    now: 'Jetzt',
    breakMinutes: 'Pause (Minuten)',
    targetHours: 'Sollzeit (Stunden, optional)',
    targetPlaceholder: 'z.B. 8',
    grossTime: 'Brutto-Arbeitszeit',
    breakTime: 'Pause',
    netTime: 'Netto-Arbeitszeit',
    comparison: 'Soll-/Ist-Vergleich',
    comparisonTarget: 'Soll',
    comparisonActual: 'Ist',
    breakTooLong: 'Pause ist länger als die Arbeitszeit',
    warningBreak: 'Achtung: Bei mehr als 9h Arbeitszeit schreibt das Arbeitszeitgesetz mindestens 45 Minuten Pause vor (eingetragen: {0} min).',
    warningOvertime: 'Hinweis: Die Netto-Arbeitszeit überschreitet 10 Stunden – das ist nach ArbZG §3 nicht zulässig.',

    // Advanced / Monatsplanung
    advTitle: 'Monatsplanung',
    advDescription: 'Verteile deine HO- und Urlaubstage auf die einzelnen Monate des Jahres.',
    advHolidayHint: 'Feiertage werden anhand des Bundeslandes aus dem HO-Planer (Tab 1) berechnet.',
    advYear: 'Jahr',
    advBudget: 'Verfügbare HO-Tage (Jahresbudget)',
    advChipTotal: 'HO-Budget',
    advChipUsed: 'HO verplant',
    advChipRemaining: 'HO verbleibend',
    advChipVacation: 'Urlaub verplant',
    advVacBudget: 'Verfügbarer Urlaub (Jahresbudget)',
    advVacDangerOver: 'Zu viele Urlaubstage verplant! Du überschreitest dein Urlaubsbudget um {0} Tage.',
    advWarning90: 'Achtung: Du hast 90% deines HO-Budgets verplant!',
    advDangerOver: 'Zu viele Tage verplant! Du überschreitest dein Budget um {0} Tage.',
    advHoDays: 'HO-Tage',
    advVacation: 'Urlaub',
    advDaysOf: '{0}/{1} Tage',
    advReset: 'Zurücksetzen',

    // Errors
    errorStartBeforeEnd: 'Startdatum muss vor dem Enddatum liegen',
    errorVacSickExceed: 'Urlaub und Krankheitstage übersteigen die verfügbaren Arbeitstage',
    errorHOExceed: 'Home Office Tage können die verfügbaren Arbeitstage nicht überschreiten',
    errorFillDates: 'Bitte alle Zeiträume mit Start- und Enddatum befüllen',

    // Months
    monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    monthsFull: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  },
  en: {
    // Header
    headerTitle: 'Workday Planner',
    headerSubtitle: 'Optimize your home office days efficiently',

    // Tabs
    tabPlaner: 'HO Planner',
    tabZeitrechner: 'Time Calculator',
    tabAdvanced: 'Monthly Planning',

    // Planer Form
    periodsTitle: 'Periods',
    periodLabel: 'Period',
    bundeslandLabel: 'State (for all periods)',
    bundeslandDefault: 'Federal holidays only',
    startDate: 'Start date',
    endDate: 'End date',
    hoDays: 'HO days',
    vacationDays: 'Vacation days',
    sickDays: 'Sick days',
    removePeriod: 'Remove period',
    addPeriod: '+ Add period',
    advancedOptions: 'Advanced options',
    advancedOptionsHide: 'Hide advanced options',
    fourDayWeek: 'Enable 4-day week',
    fourDayWeekHint: 'One workday per week is deducted. Useful if you generally don\'t work on Fridays.',
    calculate: 'Calculate',
    reset: 'Reset',

    // Quick Actions
    quickTodayToYearEnd: 'Today - Year end',
    quickCurrentYear: 'Current year',
    quickNextYear: 'Next year',
    quickH1: 'H1',
    quickH2: 'H2',
    quickCurrentQuarter: 'Current quarter',

    // Results
    resultTitle: 'Result',
    calendarDays: 'Calendar days',
    totalWorkdays: 'Total workdays',
    weekendDays: 'Weekend days',
    publicHolidays: 'Public holidays',
    requiredOfficeDays: 'Required office days',
    officePercentText: 'That\'s {0}% of your available workdays',
    officeDaysPerWeek: 'Office days per week',
    officeDaysPerMonth: 'Office days per month',
    weeksInPeriod: 'Weeks in period',
    weeksWithDouble: 'Weeks with 2× office',
    showDetails: 'Show details',
    hideDetails: 'Hide details',
    transferBudget: 'Transfer HO days to monthly planning',
    days: 'days',
    weeks: 'weeks',
    daysPerWeek: 'days / week',
    daysPerMonth: 'days / month',

    // Bridge days
    bridgeDaysTitle: 'Bridge days in period',
    bridgeDaysHint: 'Take one vacation day on these dates for an extended break:',
    bridgeDayAction: 'Take 1 vacation day',
    bridgeBefore: 'Bridge before',
    bridgeAfter: 'Bridge after',
    bridgeFreeDays: '{0} consecutive days off',

    // Time calculator
    timeCalcTitle: 'Calculate working time',
    workStart: 'Work start',
    workEnd: 'Work end',
    now: 'Now',
    breakMinutes: 'Break (minutes)',
    targetHours: 'Target hours (optional)',
    targetPlaceholder: 'e.g. 8',
    grossTime: 'Gross working time',
    breakTime: 'Break',
    netTime: 'Net working time',
    comparison: 'Target/Actual comparison',
    comparisonTarget: 'Target',
    comparisonActual: 'Actual',
    breakTooLong: 'Break exceeds working time',
    warningBreak: 'Warning: For more than 9h of work, German labor law requires at least 45 minutes of break (entered: {0} min).',
    warningOvertime: 'Note: Net working time exceeds 10 hours – this is not permitted under ArbZG §3.',

    // Advanced / Monthly planning
    advTitle: 'Monthly Planning',
    advDescription: 'Distribute your HO and vacation days across the months of the year.',
    advHolidayHint: 'Holidays are calculated based on the state selected in the HO Planner (Tab 1).',
    advYear: 'Year',
    advBudget: 'Available HO days (annual budget)',
    advChipTotal: 'HO budget',
    advChipUsed: 'HO planned',
    advChipRemaining: 'HO remaining',
    advChipVacation: 'Vacation planned',
    advVacBudget: 'Available vacation days (annual budget)',
    advVacDangerOver: 'Too many vacation days planned! You exceed your vacation budget by {0} days.',
    advWarning90: 'Warning: You\'ve planned 90% of your HO budget!',
    advDangerOver: 'Too many days planned! You exceed your budget by {0} days.',
    advHoDays: 'HO days',
    advVacation: 'Vacation',
    advDaysOf: '{0}/{1} days',
    advReset: 'Reset',

    // Errors
    errorStartBeforeEnd: 'Start date must be before end date',
    errorVacSickExceed: 'Vacation and sick days exceed available workdays',
    errorHOExceed: 'Home office days cannot exceed available workdays',
    errorFillDates: 'Please fill in start and end dates for all periods',

    // Months
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthsFull: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  }
};

/**
 * Gibt den übersetzten String für den gegebenen Key zurück.
 * Platzhalter {0}, {1}, ... werden durch die übergebenen args ersetzt.
 */
function t(key, ...args) {
  const lang = localStorage.getItem('wp_lang') || 'de';
  let str = (I18N[lang] && I18N[lang][key] != null) ? I18N[lang][key] : (I18N['de'][key] != null ? I18N['de'][key] : key);
  if (typeof str !== 'string') return str; // arrays (monthsShort etc.) direkt zurückgeben
  args.forEach((arg, i) => { str = str.replace(`{${i}}`, arg); });
  return str;
}

/**
 * Wendet die aktuelle Sprache auf den gesamten DOM an.
 * Setzt textContent für [data-i18n], placeholder für [data-i18n-placeholder],
 * title für [data-i18n-title].
 */
function applyLanguage() {
  const lang = localStorage.getItem('wp_lang') || 'de';

  // Statische Text-Elemente
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  // Placeholder-Attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Title-Attribute
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });

  // Lang-Toggle Button aktualisieren
  const btn = document.getElementById('langBtn');
  if (btn) {
    if (lang === 'de') {
      btn.innerHTML = '<span class="lang-active">DE</span> | <span class="lang-inactive">EN</span>';
    } else {
      btn.innerHTML = '<span class="lang-inactive">DE</span> | <span class="lang-active">EN</span>';
    }
  }

  // Office-Percent-Text aktualisieren (dynamisch gerendert von displayResults)
  const officePercentEl = document.getElementById('officePercentText');
  if (officePercentEl) {
    const strongEl = officePercentEl.querySelector('strong');
    if (strongEl) {
      const pct = strongEl.textContent;
      officePercentEl.innerHTML = t('officePercentText', `<strong id="officePercentage">${pct}</strong>`);
    }
  }

  // HTML lang-Attribut aktualisieren
  document.documentElement.lang = lang;

  // Dynamisch geklonte Period-Items aktualisieren
  document.querySelectorAll('.period-item').forEach((item, i) => {
    const numEl = item.querySelector('.period-num');
    if (numEl) numEl.textContent = `${t('periodLabel')} ${i + 1}`;
    const btnRemove = item.querySelector('.btn-remove-period');
    if (btnRemove) btnRemove.title = t('removePeriod');
    const lblStart = item.querySelector('.p-label-start');
    if (lblStart) lblStart.textContent = t('startDate');
    const lblEnd = item.querySelector('.p-label-end');
    if (lblEnd) lblEnd.textContent = t('endDate');
    const lblHo = item.querySelector('.p-label-ho');
    if (lblHo) lblHo.textContent = t('hoDays');
    const lblVac = item.querySelector('.p-label-vac');
    if (lblVac) lblVac.textContent = t('vacationDays');
    const lblSick = item.querySelector('.p-label-sick');
    if (lblSick) lblSick.textContent = t('sickDays');
  });

  // Quick-Action-Buttons in Period-Items neu aufbauen
  if (typeof buildPeriodQuickActions === 'function') {
    document.querySelectorAll('.period-item').forEach(item => {
      const bar = item.querySelector('.period-quick');
      if (bar) {
        bar.innerHTML = '';
        const id = parseInt(item.id.replace('period-', ''), 10);
        buildPeriodQuickActions(item, id);
      }
    });
  }

  // Details-Toggle Text aktualisieren
  const detailsBtn = document.getElementById('btnDetailsToggle');
  if (detailsBtn) {
    const detailsOpen = document.getElementById('resultsDetails');
    if (detailsOpen) {
      detailsBtn.textContent = detailsOpen.classList.contains('open') ? t('hideDetails') : t('showDetails');
    }
  }

  // Advanced Options Toggle Text aktualisieren
  const advOptBtn = document.getElementById('btnAdvancedOptions');
  if (advOptBtn) {
    const advOptContent = document.getElementById('advancedOptionsContent');
    const lbl = advOptBtn.querySelector('span');
    if (lbl && advOptContent) {
      lbl.textContent = advOptContent.classList.contains('open') ? t('advancedOptionsHide') : t('advancedOptions');
    }
  }

  // Month-Card Labels aktualisieren
  document.querySelectorAll('.month-card').forEach((card, i) => {
    const monthNameEl = card.querySelector('.month-name');
    if (monthNameEl && typeof t === 'function') {
      const monthsFull = t('monthsFull');
      if (Array.isArray(monthsFull) && monthsFull[i]) monthNameEl.textContent = monthsFull[i];
    }
    const labels = card.querySelectorAll('.month-type-label');
    if (labels[0]) labels[0].textContent = t('advHoDays');
    if (labels[1]) labels[1].textContent = t('advVacation');
  });

  // Brückentage neu rendern (reason-Texte hängen von der Sprache ab)
  if (typeof renderBrueckentage === 'function' && typeof lastCalculatedPeriods !== 'undefined' && lastCalculatedPeriods) {
    renderBrueckentage(lastCalculatedPeriods);
  }

  // Advanced: Chips, Warnungen, Monats-Sub-Labels und Chart neu rendern
  if (typeof advUpdateAll === 'function') {
    advUpdateAll();
  } else if (typeof advDrawChart === 'function') {
    advDrawChart();
  }
}

// Event Listener für den Sprach-Toggle
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('langBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = localStorage.getItem('wp_lang') || 'de';
      const next = current === 'de' ? 'en' : 'de';
      localStorage.setItem('wp_lang', next);
      applyLanguage();
    });
  }
});

// Init: Sprache beim Laden anwenden
(function initLang() {
  if (!localStorage.getItem('wp_lang')) {
    localStorage.setItem('wp_lang', 'de');
  }
  // applyLanguage wird nach DOMContentLoaded aufgerufen, damit alle Elemente existieren
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLanguage);
  } else {
    applyLanguage();
  }
})();

// Globale Exposition
window.t = t;
window.applyLanguage = applyLanguage;
window.I18N = I18N;
