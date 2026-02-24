/* =========================================================
   PLANNER.JS – Tab 1: HO-Planer
   Abhängigkeiten: holidays.js (getGermanHolidays, renderBrueckentage),
                   app.js (getISOWeekKey)
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
        <button type="button" class="btn-remove-period" data-period-id="${id}" title="Zeitraum entfernen">-</button>
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
        work_weeks: Object.keys(workdaysPerWeek).length,
    };
}

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
            office_attendance_percentage: 0, work_weeks: 0
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
            combined.work_weeks            += r.work_weeks;
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

    const totalWorkWeeks = data.work_weeks || 0;
    const weeksWithDouble = Math.min(totalWorkWeeks, Math.max(0, data.required_office_days - totalWorkWeeks));
    document.getElementById('totalWeeks').textContent = totalWorkWeeks;
    document.getElementById('weeksWithDouble').textContent = weeksWithDouble;

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
document.getElementById('bundesland').addEventListener('change', () => {
    savePlanerState();
    // Advanced Tab: Arbeitstage pro Monat neu berechnen wenn Bundesland geändert
    advUpdateAll();
});
document.getElementById('fourDayWeek').addEventListener('change', savePlanerState);

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

// Event Delegation – Zeitraum entfernen
document.getElementById('periodList').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-period');
    if (!btn) return;
    const item = btn.closest('.period-item');
    if (item) {
        item.remove();
        refreshPeriodNumbers();
        if (typeof savePlanerState === 'function') savePlanerState();
    }
});

// Event Listener – Zeitraum hinzufügen
document.getElementById('btnAddPeriod').addEventListener('click', () => addPeriod());

// Event Listener – Planer zurücksetzen
document.getElementById('btnPlanerReset').addEventListener('click', planerReset);
