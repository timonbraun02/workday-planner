// Dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('themeBtn').innerHTML = isDark ? '&#9788;' : '&#9790;';
}

(function initTheme() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        document.getElementById('themeBtn').innerHTML = '&#9788;';
    }
})();

// ISO-Wochenschlüssel (Jahr-Woche) für 4-Tage-Woche-Berechnung
function getISOWeekKey(date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-${weekNo}`;
}

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

function getGermanHolidays(startYear, endYear, bundesland) {
    const set = new Set();
    const bl = bundesland ? bundesland.toUpperCase() : null;

    for (let y = startYear; y <= endYear; y++) {
        const e = getEaster(y);

        // Bundesweite Feiertage
        set.add(fixed(y, 1, 1));          // Neujahr
        set.add(easterPlus(e, -2));        // Karfreitag
        set.add(easterPlus(e, 1));         // Ostermontag
        set.add(fixed(y, 5, 1));           // Tag der Arbeit
        set.add(easterPlus(e, 39));        // Christi Himmelfahrt
        set.add(easterPlus(e, 50));        // Pfingstmontag
        set.add(fixed(y, 10, 3));          // Tag der Deutschen Einheit
        set.add(fixed(y, 12, 25));         // 1. Weihnachtstag
        set.add(fixed(y, 12, 26));         // 2. Weihnachtstag

        if (!bl) continue;

        // Heilige Drei Könige (6. Jan)
        if (['BW','BY','ST'].includes(bl))
            set.add(fixed(y, 1, 6));

        // Internationaler Frauentag (8. März)
        if (['BE','MV'].includes(bl))
            set.add(fixed(y, 3, 8));

        // Ostersonntag
        if (bl === 'BB')
            set.add(easterPlus(e, 0));

        // Pfingstsonntag
        if (bl === 'BB')
            set.add(easterPlus(e, 49));

        // Fronleichnam (Ostern +60)
        if (['BW','BY','HE','NW','RP','SL'].includes(bl))
            set.add(easterPlus(e, 60));

        // Mariae Himmelfahrt (15. Aug)
        if (['BY','SL'].includes(bl))
            set.add(fixed(y, 8, 15));

        // Weltkindertag (20. Sep) - TH seit 2019
        if (bl === 'TH' && y >= 2019)
            set.add(fixed(y, 9, 20));

        // Reformationstag (31. Okt)
        if (['BB','HB','HH','MV','NI','SN','ST','SH','TH'].includes(bl))
            set.add(fixed(y, 10, 31));

        // Allerheiligen (1. Nov)
        if (['BW','BY','NW','RP','SL'].includes(bl))
            set.add(fixed(y, 11, 1));

        // Buß- und Bettag (Mittwoch vor 23. Nov)
        if (bl === 'SN')
            set.add(getBussUndBettag(y));
    }
    return set;
}

function calculateWorkdays(formData) {
    const start = new Date(formData.start_date + 'T00:00:00Z');
    const end = new Date(formData.end_date + 'T00:00:00Z');

    if (start > end) throw new Error('Startdatum muss vor dem Enddatum liegen');

    const germanHolidays = getGermanHolidays(
        start.getUTCFullYear(), end.getUTCFullYear(), formData.bundesland || null
    );
    const customClosed = new Set(formData.custom_closed_dates || []);

    let totalWorkdays = 0, weekendDays = 0, publicHolidaysCount = 0, customClosedCount = 0;
    const workdaysPerWeek = {};
    const current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().substring(0, 10);
        const dow = current.getUTCDay();
        if (dow === 0 || dow === 6) {
            weekendDays++;
        } else if (germanHolidays.has(dateStr)) {
            publicHolidaysCount++;
        } else if (customClosed.has(dateStr)) {
            customClosedCount++;
        } else {
            totalWorkdays++;
            const wk = getISOWeekKey(current);
            workdaysPerWeek[wk] = (workdaysPerWeek[wk] || 0) + 1;
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }

    const totalCalendarDays = Math.round((end - start) / 86400000) + 1;

    let fourDayWeekOffDays = 0;
    if (formData.four_day_week) {
        for (const count of Object.values(workdaysPerWeek)) {
            if (count > 4) fourDayWeekOffDays += count - 4;
        }
        totalWorkdays -= fourDayWeekOffDays;
    }

    const availableWorkdays = totalWorkdays - formData.vacation_days - formData.sick_days;
    if (availableWorkdays < 0) throw new Error('Urlaub und Krankheitstage übersteigen die verfügbaren Arbeitstage');
    if (formData.home_office_days > availableWorkdays) throw new Error('Home Office Tage können die verfügbaren Arbeitstage nicht überschreiten');

    const requiredOfficeDays = availableWorkdays - formData.home_office_days;
    const officePercentage = availableWorkdays > 0 ? requiredOfficeDays / availableWorkdays * 100 : 0;

    return {
        total_calendar_days: totalCalendarDays,
        total_workdays: totalWorkdays,
        required_office_days: requiredOfficeDays,
        home_office_days: formData.home_office_days,
        vacation_days: formData.vacation_days,
        sick_days: formData.sick_days,
        weekend_days: weekendDays,
        public_holidays: publicHolidaysCount,
        custom_closed_days: customClosedCount,
        four_day_week_off_days: fourDayWeekOffDays,
        office_attendance_percentage: Math.round(officePercentage * 100) / 100,
    };
}

/* =========================================================
   MEHRERE ZEITRÄUME
   ========================================================= */
let periodCount = 0;

function addPeriod(startVal, endVal, hoVal, vacVal, sickVal) {
    periodCount++;
    const id = periodCount;
    const item = document.createElement('div');
    item.className = 'period-item';
    item.id = `period-${id}`;
    item.innerHTML = `
        <span class="period-num">Zeitraum ${id}</span>
        <div style="width:100%; display:flex; flex-wrap:wrap; gap:6px; margin-bottom:4px;" class="period-quick"></div>
        <div class="form-group">
            <label>Startdatum</label>
            <input type="date" class="p-start" value="${startVal || ''}" required>
        </div>
        <div class="form-group">
            <label>Enddatum</label>
            <input type="date" class="p-end" value="${endVal || ''}" required>
        </div>
        <div class="form-group">
            <label>HO-Tage</label>
            <input type="number" class="p-ho" min="0" value="${hoVal != null ? hoVal : 0}">
        </div>
        <div class="form-group">
            <label>Urlaubstage</label>
            <input type="number" class="p-vac" min="0" value="${vacVal != null ? vacVal : 0}">
        </div>
        <div class="form-group">
            <label>Krankheitstage</label>
            <input type="number" class="p-sick" min="0" value="${sickVal != null ? sickVal : 0}">
        </div>
        <button type="button" class="btn-remove-period" onclick="removePeriod(${id})" title="Zeitraum entfernen">-</button>
    `;
    document.getElementById('periodList').appendChild(item);
    refreshPeriodNumbers();
    if (typeof savePlanerState === 'function') savePlanerState();
}

/* Berechnet sinnvolle Quick-Buttons abhängig von der Position des Zeitraums */
function buildPeriodQuickActions(item, id) {
    const bar = item.querySelector('.period-quick');
    const idx = Array.from(document.querySelectorAll('.period-item')).indexOf(item);
    const now = new Date();
    const y   = now.getFullYear();
    const m   = now.getMonth();

    const btn = (label, fn) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn-quick';
        b.style.fontSize = '0.78rem';
        b.style.padding  = '5px 10px';
        b.textContent = label;
        b.addEventListener('click', () => fn(item));
        bar.appendChild(b);
    };

    const set = (el, s, e) => {
        el.querySelector('.p-start').value = s;
        el.querySelector('.p-end').value   = e;
    };

    // Aktuellen Monat berechnen
    const curMonStart = new Date(y, m, 1).toISOString().split('T')[0];
    const curMonEnd   = new Date(y, m + 1, 0).toISOString().split('T')[0];
    // Nächsten Monat berechnen
    const nm = new Date(y, m + 1, 1);
    const nmStart = nm.toISOString().split('T')[0];
    const nmEnd   = new Date(nm.getFullYear(), nm.getMonth() + 1, 0).toISOString().split('T')[0];
    // Quartale
    const curQ  = Math.floor(m / 3);
    const curQS = new Date(y, curQ * 3, 1).toISOString().split('T')[0];
    const curQE = new Date(y, curQ * 3 + 3, 0).toISOString().split('T')[0];
    const nqRaw = curQ + 1;
    const nqY   = y + Math.floor(nqRaw / 4);
    const nqM   = (nqRaw % 4) * 3;
    const nqS   = new Date(nqY, nqM, 1).toISOString().split('T')[0];
    const nqE   = new Date(nqY, nqM + 3, 0).toISOString().split('T')[0];

    if (idx === 0) {
        // Erster Zeitraum: Jahres-Shortcuts
        btn('Akt. Jahr',        el => set(el, `${y}-01-01`,    `${y}-12-31`));
        btn('Heute - Jahresende', el => set(el, now.toISOString().split('T')[0], `${y}-12-31`));
        btn('Nächstes Jahr',    el => set(el, `${y+1}-01-01`,  `${y+1}-12-31`));
        btn('H1 ' + y,         el => set(el, `${y}-01-01`,    `${y}-06-30`));
        btn('H2 ' + y,         el => set(el, `${y}-07-01`,    `${y}-12-31`));
    } else {
        // Weitere Zeiträume: kein Jahres-Shortcut, aber beide Jahre für Halbjahre
        btn('H1 ' + y,         el => set(el, `${y}-01-01`,    `${y}-06-30`));
        btn('H2 ' + y,         el => set(el, `${y}-07-01`,    `${y}-12-31`));
        btn('H1 ' + (y+1),     el => set(el, `${y+1}-01-01`,  `${y+1}-06-30`));
        btn('H2 ' + (y+1),     el => set(el, `${y+1}-07-01`,  `${y+1}-12-31`));
    }

    // Für alle Zeiträume: Monats- und Quartals-Shortcuts
    btn('Akt. Monat',      el => set(el, curMonStart, curMonEnd));
    btn('Nächster Monat',  el => set(el, nmStart,     nmEnd));
    btn('Akt. Quartal',    el => set(el, curQS,       curQE));
    btn('Nächstes Quartal',el => set(el, nqS,         nqE));
}

function removePeriod(id) {
    const el = document.getElementById(`period-${id}`);
    if (el) el.remove();
    refreshPeriodNumbers();
    if (typeof savePlanerState === 'function') savePlanerState();
}

function refreshPeriodNumbers() {
    const items = document.querySelectorAll('.period-item');
    items.forEach((item, i) => {
        const numEl = item.querySelector('.period-num');
        if (numEl) numEl.textContent = `Zeitraum ${i + 1}`;
        // Remove-Button nur ausblenden wenn nur noch 1 Zeitraum
        const removeBtn = item.querySelector('.btn-remove-period');
        if (removeBtn) removeBtn.style.display = items.length > 1 ? '' : 'none';
        // Quick-Buttons neu bauen (Reihenfolge kann sich geändert haben)
        const bar = item.querySelector('.period-quick');
        if (bar) { bar.innerHTML = ''; buildPeriodQuickActions(item, parseInt(item.id.replace('period-',''))); }
    });
}

function getPeriodsFormData() {
    const bl = document.getElementById('bundesland').value || null;
    const fourDay = document.getElementById('fourDayWeek').checked;
    const items = document.querySelectorAll('.period-item');
    return Array.from(items).map(item => ({
        start_date: item.querySelector('.p-start').value,
        end_date:   item.querySelector('.p-end').value,
        home_office_days: parseInt(item.querySelector('.p-ho').value) || 0,
        vacation_days:    parseInt(item.querySelector('.p-vac').value) || 0,
        sick_days:        parseInt(item.querySelector('.p-sick').value) || 0,
        four_day_week: fourDay,
        custom_closed_dates: [],
        bundesland: bl
    }));
}

/* =========================================================
   BRÜCKENTAGE
   ========================================================= */
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
                results.push({ urlaubstag: friStr, reason: `Brücke vor ${hName}`, total: 4 });
            }
        }

        // Feiertag ist Freitag - Brücke Mo danach
        if (dow === 5) {
            const mon = new Date(h); mon.setUTCDate(mon.getUTCDate() + 3);
            const monStr = mon.toISOString().substring(0, 10);
            if (!holidays.has(monStr) && mon >= start && mon <= end && !checked.has(monStr)) {
                checked.add(monStr);
                results.push({ urlaubstag: monStr, reason: `Brücke nach ${hName}`, total: 4 });
            }
        }

        // Feiertag ist Dienstag - Montag als Brücke
        if (dow === 2) {
            const mon = new Date(h); mon.setUTCDate(mon.getUTCDate() - 1);
            const monStr = mon.toISOString().substring(0, 10);
            if (!holidays.has(monStr) && mon >= start && mon <= end && !checked.has(monStr)) {
                checked.add(monStr);
                results.push({ urlaubstag: monStr, reason: `Brücke vor ${hName}`, total: 4 });
            }
        }

        // Feiertag ist Donnerstag - Freitag als Brücke
        if (dow === 4) {
            const fri = new Date(h); fri.setUTCDate(fri.getUTCDate() + 1);
            const friStr = fri.toISOString().substring(0, 10);
            if (!holidays.has(friStr) && fri >= start && fri <= end && !checked.has(friStr)) {
                checked.add(friStr);
                results.push({ urlaubstag: friStr, reason: `Brücke nach ${hName}`, total: 4 });
            }
        }
    });

    return results.sort((a, b) => a.urlaubstag.localeCompare(b.urlaubstag));
}

// Feiertags-Namen-Lookup (lazy per Jahr)
const _holidayNameCache = {};
function buildHolidayNames(year, bundesland) {
    const key = `${year}-${bundesland || ''}`;
    if (_holidayNameCache[key]) return _holidayNameCache[key];
    const bl = bundesland ? bundesland.toUpperCase() : null;
    const e  = getEaster(year);
    const map = {};
    const add = (dateStr, name) => { if (!map[dateStr]) map[dateStr] = name; };
    add(fixed(year,1,1),       'Neujahr');
    add(easterPlus(e,-2),      'Karfreitag');
    add(easterPlus(e,0),       'Ostersonntag');
    add(easterPlus(e,1),       'Ostermontag');
    add(fixed(year,5,1),       'Tag der Arbeit');
    add(easterPlus(e,39),      'Christi Himmelfahrt');
    add(easterPlus(e,49),      'Pfingstsonntag');
    add(easterPlus(e,50),      'Pfingstmontag');
    add(easterPlus(e,60),      'Fronleichnam');
    add(fixed(year,10,3),      'Tag der Deutschen Einheit');
    add(fixed(year,12,25),     '1. Weihnachtstag');
    add(fixed(year,12,26),     '2. Weihnachtstag');
    if (bl) {
        add(fixed(year,1,6),   'Heilige Drei Könige');
        add(fixed(year,3,8),   'Internationaler Frauentag');
        add(fixed(year,8,15),  'Mariä Himmelfahrt');
        add(fixed(year,9,20),  'Weltkindertag');
        add(fixed(year,10,31), 'Reformationstag');
        add(fixed(year,11,1),  'Allerheiligen');
        add(getBussUndBettag(year), 'Buß- und Bettag');
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
            <div class="brueckentag-title">${formatDateDE(bt.urlaubstag)} – 1 Urlaubstag nehmen</div>
            <div class="brueckentag-detail">${bt.reason}</div>
            <span class="brueckentag-gain">${bt.total} freie Tage am Stück</span>
        </div>
    `).join('');
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    if (tabName === 'advanced') {
        requestAnimationFrame(() => advDrawChart());
    }
}

// Arbeitszeitrechner
function setEndNow() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('workEnd').value = `${h}:${m}`;
}

function formatMinutes(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
}

document.getElementById('timeForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const start = document.getElementById('workStart').value;
    const end = document.getElementById('workEnd').value;
    const breakMin = parseInt(document.getElementById('breakMinutes').value) || 0;

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (endMinutes <= startMinutes) {
        document.getElementById('timeError').textContent = 'Arbeitsende muss nach Arbeitsbeginn liegen';
        document.getElementById('timeError').classList.add('show');
        document.getElementById('timeResults').classList.remove('show');
        return;
    }

    const grossMinutes = endMinutes - startMinutes;
    const netMinutes = grossMinutes - breakMin;

    if (netMinutes < 0) {
        document.getElementById('timeError').textContent = 'Pause ist länger als die Arbeitszeit';
        document.getElementById('timeError').classList.add('show');
        document.getElementById('timeWarning').classList.remove('show');
        document.getElementById('timeResults').classList.remove('show');
        return;
    }

    // ArbZG-Warnungen
    const warnings = [];
    if (grossMinutes > 9 * 60 && breakMin < 45)
        warnings.push(`Achtung: Bei mehr als 9h Arbeitszeit schreibt das Arbeitszeitgesetz mindestens 45 Minuten Pause vor (eingetragen: ${breakMin} min).`);
    if (netMinutes > 10 * 60)
        warnings.push(`Hinweis: Die Netto-Arbeitszeit überschreitet 10 Stunden- das ist nach ArbZG §3 nicht zulässig.`);

    const warningDiv = document.getElementById('timeWarning');
    if (warnings.length > 0) {
        warningDiv.innerHTML = warnings.join('<br>');
        warningDiv.classList.add('show');
    } else {
        warningDiv.classList.remove('show');
    }

    document.getElementById('grossTime').textContent = formatMinutes(grossMinutes);
    document.getElementById('breakTime').textContent = formatMinutes(breakMin);
    document.getElementById('netTime').textContent = formatMinutes(netMinutes);

    // Sollzeit-Vergleich
    const targetHoursVal = document.getElementById('targetHours').value;
    const overtimeCard   = document.getElementById('overtimeCard');
    if (targetHoursVal !== '') {
        const targetMin  = Math.round(parseFloat(targetHoursVal) * 60);
        const deltaMin   = netMinutes - targetMin;
        const absMin     = Math.abs(deltaMin);
        const sign       = deltaMin >= 0 ? '+' : '−';
        const valueEl    = document.getElementById('overtimeValue');
        valueEl.textContent = `${sign}${formatMinutes(absMin)} h`;
        valueEl.className   = 'overtime-value ' + (deltaMin > 0 ? 'positive' : deltaMin < 0 ? 'negative' : 'neutral');
        document.getElementById('targetDisplay').textContent  = formatMinutes(targetMin);
        document.getElementById('netTimeDisplay').textContent = formatMinutes(netMinutes);
        overtimeCard.style.display = 'block';
    } else {
        overtimeCard.style.display = 'none';
    }

    document.getElementById('timeError').classList.remove('show');
    document.getElementById('timeResults').classList.add('show');
});

// Arbeitszeitrechner: Persistenz
(function initZeitrechner() {
    const saved = (() => { try { return JSON.parse(localStorage.getItem('wp_zeit')); } catch(e) { return null; } })();
    if (!saved) return;
    if (saved.start)   document.getElementById('workStart').value    = saved.start;
    if (saved.end)     document.getElementById('workEnd').value      = saved.end;
    if (saved.pause != null) document.getElementById('breakMinutes').value = saved.pause;
    if (saved.target != null && saved.target !== '') document.getElementById('targetHours').value = saved.target;
})();

['workStart','workEnd','breakMinutes','targetHours'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        localStorage.setItem('wp_zeit', JSON.stringify({
            start:  document.getElementById('workStart').value,
            end:    document.getElementById('workEnd').value,
            pause:  document.getElementById('breakMinutes').value,
            target: document.getElementById('targetHours').value
        }));
    });
});

// (Quick-Actions sind jetzt direkt in den Zeitraum-Karten)

document.getElementById('planForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const periods = getPeriodsFormData();

    try {
        // Ergebnisse aller Zeiträume summieren
        const combined = {
            total_calendar_days: 0, total_workdays: 0,
            required_office_days: 0, home_office_days: 0,
            vacation_days: 0, sick_days: 0,
            weekend_days: 0, public_holidays: 0,
            custom_closed_days: 0, four_day_week_off_days: 0,
            office_attendance_percentage: 0
        };
        for (const p of periods) {
            if (!p.start_date || !p.end_date) throw new Error('Bitte alle Zeiträume mit Start- und Enddatum befüllen');
            const r = calculateWorkdays(p);
            combined.total_calendar_days   += r.total_calendar_days;
            combined.total_workdays        += r.total_workdays;
            combined.required_office_days  += r.required_office_days;
            combined.home_office_days      += r.home_office_days;
            combined.vacation_days         += r.vacation_days;
            combined.sick_days             += r.sick_days;
            combined.weekend_days          += r.weekend_days;
            combined.public_holidays       += r.public_holidays;
            combined.custom_closed_days    += r.custom_closed_days;
            combined.four_day_week_off_days+= r.four_day_week_off_days;
        }
        const availTotal = combined.total_workdays - combined.vacation_days - combined.sick_days;
        combined.office_attendance_percentage = availTotal > 0
            ? Math.round(combined.required_office_days / availTotal * 10000) / 100
            : 0;

        displayResults(combined);
        renderBrueckentage(periods);
        hideError();
    } catch (error) {
        showError(error.message);
    }
});

function displayResults(data) {
    document.getElementById('totalCalendarDays').textContent = data.total_calendar_days;
    document.getElementById('totalWorkdays').textContent = data.total_workdays;
    document.getElementById('weekendDays').textContent = data.weekend_days;
    document.getElementById('publicHolidays').textContent = data.public_holidays;
    document.getElementById('requiredOfficeDays').textContent = data.required_office_days;
    document.getElementById('officePercentage').textContent = data.office_attendance_percentage.toFixed(1);

    const weeks = data.total_calendar_days / 7;
    const months = data.total_calendar_days / 30.44;
    document.getElementById('officeDaysPerWeek').textContent = weeks > 0 ? (data.required_office_days / weeks).toFixed(1) : '0';
    document.getElementById('officeDaysPerMonth').textContent = months > 0 ? (data.required_office_days / months).toFixed(1) : '0';

    document.getElementById('results').classList.add('show');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    document.getElementById('results').classList.remove('show');
}

function hideError() {
    document.getElementById('error').classList.remove('show');
}

// Ersten Zeitraum erstellen und vorbelegen
(function initPeriods() {
    const saved = (() => { try { return JSON.parse(localStorage.getItem('wp_planer')); } catch(e) { return null; } })();

    // Bundesland und 4-Tage-Woche wiederherstellen
    if (saved) {
        if (saved.bundesland != null)
            document.getElementById('bundesland').value = saved.bundesland;
        if (saved.fourDay != null)
            document.getElementById('fourDayWeek').checked = saved.fourDay;
    }

    // Zeiträume wiederherstellen (oder Default)
    const periods = saved && saved.periods && saved.periods.length > 0
        ? saved.periods
        : [{ start: new Date().toISOString().split('T')[0], end: `${new Date().getFullYear()}-12-31`, ho: 0, vac: 0, sick: 0 }];

    periods.forEach(p => addPeriod(p.start, p.end, p.ho, p.vac, p.sick));
})();

function savePlanerState() {
    const items = document.querySelectorAll('.period-item');
    const periods = Array.from(items).map(item => ({
        start: item.querySelector('.p-start').value,
        end:   item.querySelector('.p-end').value,
        ho:    parseInt(item.querySelector('.p-ho').value)   || 0,
        vac:   parseInt(item.querySelector('.p-vac').value)  || 0,
        sick:  parseInt(item.querySelector('.p-sick').value) || 0
    }));
    localStorage.setItem('wp_planer', JSON.stringify({
        periods,
        bundesland: document.getElementById('bundesland').value,
        fourDay:    document.getElementById('fourDayWeek').checked
    }));
}

// Planer-State bei jeder Änderung speichern
document.getElementById('periodList').addEventListener('input', savePlanerState);
document.getElementById('bundesland').addEventListener('change', savePlanerState);
document.getElementById('fourDayWeek').addEventListener('change', savePlanerState);

/* =========================================================
   ADVANCED HO DAY PLANER
   ========================================================= */
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTHS_FULL = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

let advData = (() => {
    try {
        const saved = JSON.parse(localStorage.getItem('wp_adv'));
        if (saved && Array.isArray(saved.hoDays) && saved.hoDays.length === 12) {
            // Gespeicherte Werte in die Inputs übertragen
            if (saved.budget != null) document.getElementById('advBudget').value = saved.budget;
            if (saved.year   != null) document.getElementById('advYear').value   = saved.year;
            return { 
                budget: saved.budget, 
                year: saved.year, 
                hoDays: saved.hoDays,
                vacDays: saved.vacDays || new Array(12).fill(0)
            };
        }
        // Legacy support: migrate old 'days' to 'hoDays'
        if (saved && Array.isArray(saved.days) && saved.days.length === 12) {
            if (saved.budget != null) document.getElementById('advBudget').value = saved.budget;
            if (saved.year   != null) document.getElementById('advYear').value   = saved.year;
            return { 
                budget: saved.budget, 
                year: saved.year, 
                hoDays: saved.days,
                vacDays: new Array(12).fill(0)
            };
        }
    } catch(e) {}
    return { budget: 60, year: new Date().getFullYear(), hoDays: new Array(12).fill(0), vacDays: new Array(12).fill(0) };
})();

function saveAdvState() {
    localStorage.setItem('wp_adv', JSON.stringify({
        budget: advGetBudget(),
        year:   advGetYear(),
        hoDays: advData.hoDays,
        vacDays: advData.vacDays
    }));
}

function advGetBudget()  { return parseInt(document.getElementById('advBudget').value) || 0; }
function advGetYear()    { return parseInt(document.getElementById('advYear').value) || new Date().getFullYear(); }
function advGetUsedHO()  { return advData.hoDays.reduce((a, b) => a + b, 0); }
function advGetUsedVac() { return advData.vacDays.reduce((a, b) => a + b, 0); }
function advGetUsed()    { return advGetUsedHO() + advGetUsedVac(); }
function advGetRem()     { return advGetBudget() - advGetUsed(); }

function advReset() {
    document.getElementById('advBudget').value = 130;
    document.getElementById('advYear').value   = new Date().getFullYear();
    advData.hoDays = new Array(12).fill(0);
    advData.vacDays = new Array(12).fill(0);
    localStorage.removeItem('wp_adv');
    advUpdateAll();
}

function planerReset() {
    localStorage.removeItem('wp_planer');
    // Alle Zeiträume entfernen
    document.querySelectorAll('.period-item').forEach(el => el.remove());
    periodCount = 0;
    // Bundesland und 4-Tage-Woche zurücksetzen
    document.getElementById('bundesland').value = '';
    document.getElementById('fourDayWeek').checked = false;
    // Ergebnisse ausblenden
    document.getElementById('results').classList.remove('show');
    document.getElementById('error').classList.remove('show');
    document.getElementById('brueckentageSection').style.display = 'none';
    // Default-Zeitraum erstellen
    const today = new Date().toISOString().split('T')[0];
    const yearEnd = `${new Date().getFullYear()}-12-31`;
    addPeriod(today, yearEnd, 0, 0, 0);
}

function zeitrechnerReset() {
    localStorage.removeItem('wp_zeit');
    document.getElementById('workStart').value    = '';
    document.getElementById('workEnd').value      = '';
    document.getElementById('breakMinutes').value = '45';
    document.getElementById('targetHours').value  = '';
    document.getElementById('timeResults').classList.remove('show');
    document.getElementById('timeError').classList.remove('show');
    document.getElementById('timeWarning').classList.remove('show');
    document.getElementById('overtimeCard').style.display = 'none';
}

function advChangeDay(monthIdx, type, delta) {
    const workdays = advWorkdaysInMonth(advGetYear(), monthIdx);
    const currentHO = advData.hoDays[monthIdx];
    const currentVac = advData.vacDays[monthIdx];
    
    if (type === 'ho') {
        const newVal = currentHO + delta;
        if (newVal < 0) return;
        if (newVal + currentVac > workdays) return; // Limit erreicht
        advData.hoDays[monthIdx] = newVal;
    } else if (type === 'vac') {
        const newVal = currentVac + delta;
        if (newVal < 0) return;
        if (currentHO + newVal > workdays) return; // Limit erreicht
        advData.vacDays[monthIdx] = newVal;
    }
    advUpdateAll();
}

function advUpdateAll() {
    const budget = advGetBudget();
    const used   = advGetUsed();
    const rem    = budget - used;
    const pct    = budget > 0 ? used / budget : 0;

    // Chips
    document.getElementById('advChipTotal').textContent = budget;
    document.getElementById('advChipUsed').textContent  = used;
    document.getElementById('advChipRem').textContent   = rem;

    const remCard = document.getElementById('advChipRemCard');
    remCard.classList.remove('warning','danger');
    if (rem < 0)           remCard.classList.add('danger');
    else if (pct >= 0.9)   remCard.classList.add('warning');

    // Warnungen
    const warnDiv   = document.getElementById('advWarn');
    const dangerDiv = document.getElementById('advDanger');
    if (rem < 0) {
        dangerDiv.classList.add('show');
        document.getElementById('advOver').textContent = Math.abs(rem);
        warnDiv.classList.remove('show');
    } else if (pct >= 0.9 && pct < 1) {
        warnDiv.classList.add('show');
        dangerDiv.classList.remove('show');
    } else {
        warnDiv.classList.remove('show');
        dangerDiv.classList.remove('show');
    }

    // Monats-Cards aktualisieren
    for (let i = 0; i < 12; i++) {
        const hoEl = document.getElementById(`adv-ho-${i}`);
        const vacEl = document.getElementById(`adv-vac-${i}`);
        const subEl = document.getElementById(`adv-sub-${i}`);
        if (!hoEl || !vacEl) continue;
        hoEl.textContent = advData.hoDays[i];
        vacEl.textContent = advData.vacDays[i];
        const total = advData.hoDays[i] + advData.vacDays[i];
        const workdays = advWorkdaysInMonth(advGetYear(), i);
        hoEl.classList.toggle('over', total > workdays || (total > 0 && rem < 0));
        vacEl.classList.toggle('over', total > workdays || (total > 0 && rem < 0));
        // Arbeitstage im Monat berechnen für Hilfstext
        subEl.textContent = `${total}/${workdays} Tage`;
    }

    // Chart neu zeichnen
    advDrawChart();
    saveAdvState();
}

function advWorkdaysInMonth(year, monthIdx) {
    let count = 0;
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dow = new Date(year, monthIdx, d).getDay();
        if (dow !== 0 && dow !== 6) count++;
    }
    return count;
}

function advBuildMonthCards() {
    const container = document.getElementById('advMonthControls');
    container.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const card = document.createElement('div');
        card.className = 'month-card';
        card.innerHTML = `
            <div class="month-name">${MONTHS_FULL[i]}</div>
            <div class="month-type-label">HO-Tage</div>
            <div class="month-stepper">
                <button class="btn-step" onclick="advChangeDay(${i}, 'ho', -1)">−</button>
                <div class="month-value" id="adv-ho-${i}">0</div>
                <button class="btn-step" onclick="advChangeDay(${i}, 'ho', 1)">+</button>
            </div>
            <div class="month-type-label">Urlaub</div>
            <div class="month-stepper">
                <button class="btn-step" onclick="advChangeDay(${i}, 'vac', -1)">−</button>
                <div class="month-value" id="adv-vac-${i}">0</div>
                <button class="btn-step" onclick="advChangeDay(${i}, 'vac', 1)">+</button>
            </div>
            <div class="month-sub" id="adv-sub-${i}">0/– Tage</div>
        `;
        container.appendChild(card);
    }
}

/* ---------- Canvas Chart ---------- */
function advDrawChart() {
    const canvas = document.getElementById('advChart');
    if (!canvas) return;
    const dpr    = window.devicePixelRatio || 1;
    const W      = canvas.parentElement.clientWidth - 40; // padding
    if (W <= 0) return; // Tab noch nicht sichtbar
    const H      = 320;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const isDark   = document.body.classList.contains('dark');
    const colorBg  = isDark ? '#2a2a3d' : '#ffffff';
    const colorGrid = isDark ? '#3a3a50' : '#e8e8e8';
    const colorAxis = isDark ? '#707088' : '#999999';
    const colorText = isDark ? '#b0b0c0' : '#555555';
    const accentCol = isDark ? '#7b8ff0' : '#667eea';
    const fillTop   = isDark ? 'rgba(123,143,240,0.35)' : 'rgba(102,126,234,0.25)';
    const fillBot   = isDark ? 'rgba(123,143,240,0)' : 'rgba(102,126,234,0)';
    const budgetCol = isDark ? '#ffb74d' : '#f57c00';

    const PAD_L = 52, PAD_R = 20, PAD_T = 24, PAD_B = 48;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    const budget = advGetBudget();
    const maxVals = advData.hoDays.map((ho, i) => ho + advData.vacDays[i]);
    const maxY   = Math.max(...maxVals, Math.ceil(budget / 12) + 3, 5);
    const yStep  = advNiceStep(maxY);
    const yMax   = Math.ceil(maxY / yStep) * yStep;

    // Hintergrund
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, W, H);

    // Hilfsfunktionen für Koordinaten
    const xPos = (i) => PAD_L + (i / 11) * chartW;
    const yPos = (v) => PAD_T + chartH - (v / yMax) * chartH;

    // Grid-Linien & Y-Achse
    ctx.strokeStyle = colorGrid;
    ctx.lineWidth   = 1;
    const gridSteps = Math.ceil(yMax / yStep);
    for (let g = 0; g <= gridSteps; g++) {
        const yv = g * yStep;
        const y  = yPos(yv);
        ctx.beginPath();
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(PAD_L + chartW, y);
        ctx.stroke();
        ctx.fillStyle = colorText;
        ctx.font = `11px system-ui`;
        ctx.textAlign = 'right';
        ctx.fillText(yv, PAD_L - 8, y + 4);
    }

    // Budget-Durchschnittslinie (gestrichelt)
    const avgBudget = budget / 12;
    const yBudget   = yPos(avgBudget);
    ctx.save();
    ctx.strokeStyle = budgetCol;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD_L, yBudget);
    ctx.lineTo(PAD_L + chartW, yBudget);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Label
    ctx.fillStyle = budgetCol;
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Ø ${avgBudget.toFixed(1)}/Monat`, PAD_L + 4, yBudget - 4);

    // Achsen
    ctx.strokeStyle = colorAxis;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD_L, PAD_T);
    ctx.lineTo(PAD_L, PAD_T + chartH);
    ctx.lineTo(PAD_L + chartW, PAD_T + chartH);
    ctx.stroke();

    // X-Labels
    ctx.fillStyle  = colorText;
    ctx.font       = '11px system-ui';
    ctx.textAlign  = 'center';
    for (let i = 0; i < 12; i++) {
        ctx.fillText(MONTHS_DE[i], xPos(i), PAD_T + chartH + 18);
    }

    // Achsentitel
    ctx.save();
    ctx.translate(13, PAD_T + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle  = colorText;
    ctx.font       = 'bold 11px system-ui';
    ctx.textAlign  = 'center';
    ctx.fillText('HO-Tage', 0, 0);
    ctx.restore();

    // Farben für HO und Urlaub
    const vacColor = isDark ? '#f4a261' : '#e76f51';
    const vacFillTop = isDark ? 'rgba(244,162,97,0.2)' : 'rgba(231,111,81,0.15)';
    const vacFillBot = isDark ? 'rgba(244,162,97,0)' : 'rgba(231,111,81,0)';
    const hoFillTop = isDark ? 'rgba(123,143,240,0.2)' : 'rgba(102,126,234,0.15)';
    const hoFillBot = isDark ? 'rgba(123,143,240,0)' : 'rgba(102,126,234,0)';

    // 1. Urlaubstage - Fläche
    const vacGrad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
    vacGrad.addColorStop(0, vacFillTop);
    vacGrad.addColorStop(1, vacFillBot);

    ctx.beginPath();
    advSplinePath(ctx, advData.vacDays, xPos, yPos);
    ctx.lineTo(xPos(11), yPos(0));
    ctx.lineTo(xPos(0),  yPos(0));
    ctx.closePath();
    ctx.fillStyle = vacGrad;
    ctx.fill();

    // 2. HO-Tage - Fläche
    const hoGrad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
    hoGrad.addColorStop(0, hoFillTop);
    hoGrad.addColorStop(1, hoFillBot);

    ctx.beginPath();
    advSplinePath(ctx, advData.hoDays, xPos, yPos);
    ctx.lineTo(xPos(11), yPos(0));
    ctx.lineTo(xPos(0),  yPos(0));
    ctx.closePath();
    ctx.fillStyle = hoGrad;
    ctx.fill();

    // 3. Urlaubstage - Linie
    ctx.beginPath();
    advSplinePath(ctx, advData.vacDays, xPos, yPos);
    ctx.strokeStyle = vacColor;
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // 4. HO-Tage - Linie
    ctx.beginPath();
    advSplinePath(ctx, advData.hoDays, xPos, yPos);
    ctx.strokeStyle = accentCol;
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // 5. Punkte für beide Werte
    const totalDays = advData.hoDays.map((ho, i) => ho + advData.vacDays[i]);
    for (let i = 0; i < 12; i++) {
        const x = xPos(i);
        const workdays = advWorkdaysInMonth(advGetYear(), i);
        const isOverLimit = totalDays[i] > workdays;
        
        // Urlaubspunkt
        if (advData.vacDays[i] > 0) {
            const yVac = yPos(advData.vacDays[i]);
            ctx.beginPath();
            ctx.arc(x, yVac, 6, 0, Math.PI * 2);
            ctx.fillStyle = colorBg;
            ctx.fill();
            ctx.strokeStyle = isOverLimit ? '#ff4444' : vacColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, yVac, 3, 0, Math.PI * 2);
            ctx.fillStyle = isOverLimit ? '#ff4444' : vacColor;
            ctx.fill();
            
            // Wert neben Punkt (rechts)
            ctx.fillStyle = isOverLimit ? '#ff4444' : vacColor;
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(advData.vacDays[i], x + 10, yVac + 3);
        }
        
        // HO-Punkt
        if (advData.hoDays[i] > 0) {
            const yHO = yPos(advData.hoDays[i]);
            ctx.beginPath();
            ctx.arc(x, yHO, 6, 0, Math.PI * 2);
            ctx.fillStyle = colorBg;
            ctx.fill();
            ctx.strokeStyle = isOverLimit ? '#ff4444' : accentCol;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, yHO, 3, 0, Math.PI * 2);
            ctx.fillStyle = isOverLimit ? '#ff4444' : accentCol;
            ctx.fill();
            
            // Wert neben Punkt (links)
            ctx.fillStyle = isOverLimit ? '#ff4444' : accentCol;
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(advData.hoDays[i], x - 10, yHO + 3);
        }
        
        // Warnung wenn Limit überschritten
        if (isOverLimit && totalDays[i] > 0) {
            const yMax = Math.min(yPos(advData.hoDays[i]), yPos(advData.vacDays[i]));
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('⚠', x, yMax - 12);
        }
    }
    
    // Legende
    const legX = PAD_L + chartW - 140;
    const legY = PAD_T + 10;
    
    // HO-Tage Legende
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 25, legY);
    ctx.strokeStyle = accentCol;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(legX + 12.5, legY, 4, 0, Math.PI * 2);
    ctx.fillStyle = accentCol;
    ctx.fill();
    ctx.fillStyle = colorText;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('HO-Tage', legX + 30, legY + 4);
    
    // Urlaub Legende
    ctx.beginPath();
    ctx.moveTo(legX, legY + 18);
    ctx.lineTo(legX + 25, legY + 18);
    ctx.strokeStyle = vacColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(legX + 12.5, legY + 18, 4, 0, Math.PI * 2);
    ctx.fillStyle = vacColor;
    ctx.fill();
    ctx.fillStyle = colorText;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Urlaub', legX + 30, legY + 22);
}

/* Catmull-Rom Spline Pfad */
function advSplinePath(ctx, data, xPos, yPos) {
    const pts = data.map((v, i) => [xPos(i), yPos(v)]);
    const yFloor = yPos(0); // Canvas-Y der Nulllinie (größter Y-Wert = unten)
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = Math.min(yFloor, p1[1] + (p2[1] - p0[1]) / 6);
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = Math.min(yFloor, p2[1] - (p3[1] - p1[1]) / 6);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
    }
}

function advNiceStep(maxVal) {
    if (maxVal <= 5)  return 1;
    if (maxVal <= 10) return 2;
    if (maxVal <= 20) return 5;
    if (maxVal <= 50) return 10;
    return 20;
}

/* Event-Listener */
document.getElementById('advBudget').addEventListener('input', advUpdateAll);
document.getElementById('advYear').addEventListener('input', advUpdateAll);
window.addEventListener('resize', () => { if (document.getElementById('tab-advanced').classList.contains('active')) advDrawChart(); });

/* ---------- Drag-Interaktion auf dem Canvas ---------- */
(function initDrag() {
    const canvas = document.getElementById('advChart');
    let dragging  = null;   // { monthIdx, startY, startVal }
    let lastYMax  = 1;

    const PAD_L = 52, PAD_R = 20, PAD_T = 24, PAD_B = 48;
    const HIT_R = 14; // Klick-Radius in CSS-px um einen Punkt

    function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        const src  = e.touches ? e.touches[0] : e;
        return {
            x: src.clientX - rect.left,
            y: src.clientY - rect.top
        };
    }

    function getChartDims() {
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        return {
            W, H,
            chartW: W - PAD_L - PAD_R,
            chartH: H - PAD_T - PAD_B
        };
    }

    function pointForMonth(i, dims) {
        const budget = advGetBudget();
        const totalDays = advData.hoDays.map((ho, idx) => ho + advData.vacDays[idx]);
        const maxY   = Math.max(...totalDays, Math.ceil(budget / 12) + 3, 5);
        const yStep  = advNiceStep(maxY);
        const yMax   = Math.ceil(maxY / yStep) * yStep;
        lastYMax = yMax;
        const x = PAD_L + (i / 11) * dims.chartW;
        const yHO = PAD_T + dims.chartH - (advData.hoDays[i] / yMax) * dims.chartH;
        const yVac = PAD_T + dims.chartH - (advData.vacDays[i] / yMax) * dims.chartH;
        return { x, yHO, yVac, yMax };
    }

    function findHitPoint(pos) {
        const dims = getChartDims();
        for (let i = 0; i < 12; i++) {
            const pt = pointForMonth(i, dims);
            const dx = pos.x - pt.x;
            const dy = pos.y - pt.y;
            if (Math.sqrt(dx * dx + dy * dy) <= HIT_R) return i;
        }
        return -1;
    }

    function valueFromY(y, yMax) {
        const dims = getChartDims();
        const chartH = dims.chartH;
        const val = (PAD_T + chartH - y) / chartH * yMax;
        return Math.max(0, Math.round(val));
    }

    // Mouse
    canvas.addEventListener('mousedown', (e) => {
        const pos = getCanvasPos(e);
        const dims = getChartDims();
        
        // Check welcher Punkt getroffen wurde (HO oder Urlaub)
        for (let i = 0; i < 12; i++) {
            const pt = pointForMonth(i, dims);
            const dxHO = pos.x - pt.x;
            const dyHO = pos.y - pt.yHO;
            const dxVac = pos.x - pt.x;
            const dyVac = pos.y - pt.yVac;
            
            // HO-Punkt hat Vorrang wenn beide nah sind
            if (Math.sqrt(dxHO * dxHO + dyHO * dyHO) <= HIT_R) {
                e.preventDefault();
                canvas.classList.add('dragging');
                dragging = { idx: i, yMax: pt.yMax, type: 'ho' };
                return;
            }
            if (Math.sqrt(dxVac * dxVac + dyVac * dyVac) <= HIT_R) {
                e.preventDefault();
                canvas.classList.add('dragging');
                dragging = { idx: i, yMax: pt.yMax, type: 'vac' };
                return;
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragging) {
            // Cursor ändern wenn über Punkt
            const pos = getCanvasPos(e);
            const idx = findHitPoint(pos);
            canvas.style.cursor = idx !== -1 ? 'grab' : 'default';
            return;
        }
        e.preventDefault();
        const pos = getCanvasPos(e);
        const newVal = valueFromY(pos.y, dragging.yMax);
        const workdays = advWorkdaysInMonth(advGetYear(), dragging.idx);
        
        if (dragging.type === 'ho') {
            // HO-Tage ändern
            const currentVac = advData.vacDays[dragging.idx];
            const maxHO = workdays - currentVac;
            const clampedVal = Math.max(0, Math.min(newVal, maxHO));
            if (advData.hoDays[dragging.idx] !== clampedVal) {
                advData.hoDays[dragging.idx] = clampedVal;
                advUpdateAll();
            }
        } else if (dragging.type === 'vac') {
            // Urlaubstage ändern
            const currentHO = advData.hoDays[dragging.idx];
            const maxVac = workdays - currentHO;
            const clampedVal = Math.max(0, Math.min(newVal, maxVac));
            if (advData.vacDays[dragging.idx] !== clampedVal) {
                advData.vacDays[dragging.idx] = clampedVal;
                advUpdateAll();
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = null;
        canvas.classList.remove('dragging');
        canvas.style.cursor = 'grab';
    });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        const pos = getCanvasPos(e);
        const dims = getChartDims();
        
        for (let i = 0; i < 12; i++) {
            const pt = pointForMonth(i, dims);
            const dxHO = pos.x - pt.x;
            const dyHO = pos.y - pt.yHO;
            const dxVac = pos.x - pt.x;
            const dyVac = pos.y - pt.yVac;
            
            if (Math.sqrt(dxHO * dxHO + dyHO * dyHO) <= HIT_R) {
                e.preventDefault();
                dragging = { idx: i, yMax: pt.yMax, type: 'ho' };
                return;
            }
            if (Math.sqrt(dxVac * dxVac + dyVac * dyVac) <= HIT_R) {
                e.preventDefault();
                dragging = { idx: i, yMax: pt.yMax, type: 'vac' };
                return;
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        const pos = getCanvasPos(e);
        const newVal = valueFromY(pos.y, dragging.yMax);
        const workdays = advWorkdaysInMonth(advGetYear(), dragging.idx);
        
        if (dragging.type === 'ho') {
            const currentVac = advData.vacDays[dragging.idx];
            const maxHO = workdays - currentVac;
            const clampedVal = Math.max(0, Math.min(newVal, maxHO));
            if (advData.hoDays[dragging.idx] !== clampedVal) {
                advData.hoDays[dragging.idx] = clampedVal;
                advUpdateAll();
            }
        } else if (dragging.type === 'vac') {
            const currentHO = advData.hoDays[dragging.idx];
            const maxVac = workdays - currentHO;
            const clampedVal = Math.max(0, Math.min(newVal, maxVac));
            if (advData.vacDays[dragging.idx] !== clampedVal) {
                advData.vacDays[dragging.idx] = clampedVal;
                advUpdateAll();
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => { dragging = null; });
})();

/* Init – erst nach Layout rendern */
advBuildMonthCards();
advUpdateAll(); // Chips + Karten befüllen, aber Chart erst wenn sichtbar
