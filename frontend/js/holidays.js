/* =========================================================
   HOLIDAYS.JS – Feiertagsberechnung & Brückentage
   ========================================================= */

// Osterformel (Gauss)
function getEaster(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
}

function easterPlus(easter, days) {
    const d = new Date(easter);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().substring(0, 10);
}

function pad(n) { return String(n).padStart(2, '0'); }
function fixed(year, month, day) { return `${year}-${pad(month)}-${pad(day)}`; }

function getBussUndBettag(year) {
    const nov23 = new Date(Date.UTC(year, 10, 23));
    const dow = nov23.getUTCDay();
    const daysBack = dow === 3 ? 7 : (dow - 3 + 7) % 7;
    const d = new Date(Date.UTC(year, 10, 23 - daysBack));
    return d.toISOString().substring(0, 10);
}

// Zentrale Feiertagsdefinition – Single Source of Truth
// states: null = bundesweit, Array = nur diese Bundesländer
// from:   optionales Startjahr (inklusiv)
const GERMAN_HOLIDAYS = [
    { date: (y, e) => fixed(y, 1, 1),          name: 'Neujahr',                     states: null },
    { date: (y, e) => easterPlus(e, -2),        name: 'Karfreitag',                  states: null },
    { date: (y, e) => easterPlus(e, 0),         name: 'Ostersonntag',                states: ['BB'] },
    { date: (y, e) => easterPlus(e, 1),         name: 'Ostermontag',                 states: null },
    { date: (y, e) => fixed(y, 5, 1),           name: 'Tag der Arbeit',              states: null },
    { date: (y, e) => easterPlus(e, 39),        name: 'Christi Himmelfahrt',         states: null },
    { date: (y, e) => easterPlus(e, 49),        name: 'Pfingstsonntag',              states: ['BB'] },
    { date: (y, e) => easterPlus(e, 50),        name: 'Pfingstmontag',               states: null },
    { date: (y, e) => easterPlus(e, 60),        name: 'Fronleichnam',                states: ['BW','BY','HE','NW','RP','SL'] },
    { date: (y, e) => fixed(y, 8, 15),          name: 'Mariä Himmelfahrt',           states: ['BY','SL'] },
    { date: (y, e) => fixed(y, 9, 20),          name: 'Weltkindertag',               states: ['TH'], from: 2019 },
    { date: (y, e) => fixed(y, 10, 3),          name: 'Tag der Deutschen Einheit',   states: null },
    { date: (y, e) => fixed(y, 10, 31),         name: 'Reformationstag',             states: ['BB','HB','HH','MV','NI','SN','ST','SH','TH'] },
    { date: (y, e) => fixed(y, 11, 1),          name: 'Allerheiligen',               states: ['BW','BY','NW','RP','SL'] },
    { date: (y, e) => getBussUndBettag(y),      name: 'Buß- und Bettag',            states: ['SN'] },
    { date: (y, e) => fixed(y, 12, 25),         name: '1. Weihnachtstag',            states: null },
    { date: (y, e) => fixed(y, 12, 26),         name: '2. Weihnachtstag',            states: null },
    { date: (y, e) => fixed(y, 1, 6),           name: 'Heilige Drei Könige',         states: ['BW','BY','ST'] },
    { date: (y, e) => fixed(y, 3, 8),           name: 'Internationaler Frauentag',   states: ['BE','MV'] },
];

function getGermanHolidays(startYear, endYear, bundesland) {
    const set = new Set();
    const bl  = bundesland ? bundesland.toUpperCase() : null;
    for (let y = startYear; y <= endYear; y++) {
        const e = getEaster(y);
        for (const h of GERMAN_HOLIDAYS) {
            // Bundesland-Filter
            if (h.states !== null && (!bl || !h.states.includes(bl))) continue;
            // Jahr-Filter (z. B. Weltkindertag ab 2019)
            if (h.from !== undefined && y < h.from) continue;
            set.add(h.date(y, e));
        }
    }
    return set;
}

// Feiertags-Namen-Lookup (lazy per Jahr) -- nutzt GERMAN_HOLIDAYS als Single Source of Truth
const _holidayNameCache = {};
function buildHolidayNames(year, bundesland) {
    const key = `${year}-${bundesland || ''}`;
    if (_holidayNameCache[key]) return _holidayNameCache[key];
    const bl = bundesland ? bundesland.toUpperCase() : null;
    const e  = getEaster(year);
    const map = {};
    for (const h of GERMAN_HOLIDAYS) {
        // Alle bundesweiten + alle die fuer dieses Bundesland gelten in die Map aufnehmen
        // (Namen werden fuer Anzeige gebraucht, auch wenn man kein BL gewählt hat)
        if (h.states !== null && (!bl || !h.states.includes(bl))) continue;
        if (h.from !== undefined && year < h.from) continue;
        const dateStr = h.date(year, e);
        if (!map[dateStr]) map[dateStr] = h.name;
    }
    _holidayNameCache[key] = map;
    return map;
}

function getHolidayName(dateStr, holidaySet, bundesland) {
    const year = parseInt(dateStr.substring(0,4));
    const names = buildHolidayNames(year, bundesland);
    return names[dateStr] || formatDateDE(dateStr);
}

function formatDateDE(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
}

function findBrueckentage(startDateStr, endDateStr, bundesland) {
    const start = new Date(startDateStr + 'T00:00:00Z');
    const end   = new Date(endDateStr   + 'T00:00:00Z');
    const holidays = getGermanHolidays(
        start.getUTCFullYear(), end.getUTCFullYear(), bundesland || null
    );

    const results = [];
    const checked = new Set();

    // Für jeden Feiertag im Zeitraum prüfen
    holidays.forEach(hStr => {
        const h = new Date(hStr + 'T00:00:00Z');
        if (h < start || h > end) return;

        const dow = h.getUTCDay(); // 0=So, 1=Mo...5=Fr, 6=Sa
        if (dow === 0 || dow === 6) return; // Feiertag am WE bringt nichts

        const hName = getHolidayName(hStr, holidays, bundesland);

        // Feiertag ist Montag - Brücke Fr davor
        if (dow === 1) {
            const fri = new Date(h); fri.setUTCDate(fri.getUTCDate() - 3);
            const friStr = fri.toISOString().substring(0, 10);
            if (!holidays.has(friStr) && fri >= start && fri <= end && !checked.has(friStr)) {
                checked.add(friStr);
                results.push({ urlaubstag: friStr, reason: `${t('bridgeBefore')} ${hName}`, total: 4 });
            }
        }

        // Feiertag ist Freitag - Brücke Mo danach
        if (dow === 5) {
            const mon = new Date(h); mon.setUTCDate(mon.getUTCDate() + 3);
            const monStr = mon.toISOString().substring(0, 10);
            if (!holidays.has(monStr) && mon >= start && mon <= end && !checked.has(monStr)) {
                checked.add(monStr);
                results.push({ urlaubstag: monStr, reason: `${t('bridgeAfter')} ${hName}`, total: 4 });
            }
        }

        // Feiertag ist Dienstag - Montag als Brücke
        if (dow === 2) {
            const mon = new Date(h); mon.setUTCDate(mon.getUTCDate() - 1);
            const monStr = mon.toISOString().substring(0, 10);
            if (!holidays.has(monStr) && mon >= start && mon <= end && !checked.has(monStr)) {
                checked.add(monStr);
                results.push({ urlaubstag: monStr, reason: `${t('bridgeBefore')} ${hName}`, total: 4 });
            }
        }

        // Feiertag ist Donnerstag - Freitag als Brücke
        if (dow === 4) {
            const fri = new Date(h); fri.setUTCDate(fri.getUTCDate() + 1);
            const friStr = fri.toISOString().substring(0, 10);
            if (!holidays.has(friStr) && fri >= start && fri <= end && !checked.has(friStr)) {
                checked.add(friStr);
                results.push({ urlaubstag: friStr, reason: `${t('bridgeAfter')} ${hName}`, total: 4 });
            }
        }
    });

    return results.sort((a, b) => a.urlaubstag.localeCompare(b.urlaubstag));
}

function renderBrueckentage(allPeriods) {
    const bl = document.getElementById('bundesland').value || null;
    const allBT = [];
    allPeriods.forEach(p => {
        if (!p.start_date || !p.end_date) return;
        findBrueckentage(p.start_date, p.end_date, bl).forEach(bt => {
            if (!allBT.find(x => x.urlaubstag === bt.urlaubstag))
                allBT.push(bt);
        });
    });

    const section = document.getElementById('brueckentageSection');
    const list    = document.getElementById('brueckentageList');
    if (allBT.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    list.innerHTML = allBT.map(bt => `
        <div class="brueckentag-card">
            <div class="brueckentag-title">${formatDateDE(bt.urlaubstag)} – ${t('bridgeDayAction')}</div>
            <div class="brueckentag-detail">${bt.reason}</div>
            <span class="brueckentag-gain">${t('bridgeFreeDays', bt.total)}</span>
        </div>
    `).join('');
}

// Globale Exposition
window.getEaster          = getEaster;
window.easterPlus         = easterPlus;
window.pad                = pad;
window.fixed              = fixed;
window.getBussUndBettag   = getBussUndBettag;
window.GERMAN_HOLIDAYS    = GERMAN_HOLIDAYS;
window.getGermanHolidays  = getGermanHolidays;
window.buildHolidayNames  = buildHolidayNames;
window.getHolidayName     = getHolidayName;
window.formatDateDE       = formatDateDE;
window.findBrueckentage   = findBrueckentage;
window.renderBrueckentage = renderBrueckentage;
