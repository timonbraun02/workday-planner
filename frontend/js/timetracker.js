/* =========================================================
   TIMETRACKER.JS – Tab 2: Arbeitszeitrechner
   ========================================================= */

// ---- Dezimalzeit-Hilfsroutinen ----

/** Ist der Dezimalzeit-Modus aktiv? */
function isDecimalMode() {
    return document.getElementById('decimalTimeToggle').checked;
}

/** Dezimalzahl (z.B. 7,5 oder 7.5) → { h, m } */
function parseDecimalTime(val) {
    if (!val && val !== 0) return null;
    const str = String(val).replace(',', '.').trim();
    const num = parseFloat(str);
    if (isNaN(num) || num < 0) return null;
    const h = Math.floor(num) % 24;
    const m = Math.round((num - Math.floor(num)) * 60);
    return { h, m };
}

/** HH:MM-String (z.B. "07:30") → Dezimalstring (z.B. "7,5") – Locale-aware */
function timeToDecimalStr(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const decimal = h + m / 60;
    const lang = localStorage.getItem('wp_lang') || 'de';
    return decimal.toFixed(2).replace('.', lang === 'de' ? ',' : '.');
}

/** Dezimalstring → HH:MM-String */
function decimalStrToTime(decStr) {
    const parsed = parseDecimalTime(decStr);
    if (!parsed) return '';
    return `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`;
}

/** Gibt Minuten ab Mitternacht zurück – egal ob Dezimal- oder HH:MM-Eingabe */
function readTimeInput(id) {
    const val = document.getElementById(id).value;
    if (!val) return null;
    if (isDecimalMode()) {
        const parsed = parseDecimalTime(val);
        return parsed ? parsed.h * 60 + parsed.m : null;
    }
    const [h, m] = val.split(':').map(Number);
    return h * 60 + m;
}

/** Schreibt eine Zeit in das Eingabefeld – Format je nach Modus */
function writeTimeInput(id, hours, minutes) {
    const el = document.getElementById(id);
    if (isDecimalMode()) {
        const decimal = hours + minutes / 60;
        const lang = localStorage.getItem('wp_lang') || 'de';
        el.value = decimal.toFixed(2).replace('.', lang === 'de' ? ',' : '.');
    } else {
        el.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
}

// ---- Toggle-Logik: Eingabefelder umschalten ----

function applyDecimalMode() {
    const decimal = isDecimalMode();
    const startEl = document.getElementById('workStart');
    const endEl   = document.getElementById('workEnd');

    if (decimal) {
        // Aktuelle Werte konvertieren
        const startVal = startEl.value;
        const endVal   = endEl.value;

        startEl.type = 'text';
        startEl.inputMode = 'decimal';
        startEl.placeholder = t('decimalPlaceholder');
        startEl.removeAttribute('pattern');

        endEl.type = 'text';
        endEl.inputMode = 'decimal';
        endEl.placeholder = t('decimalPlaceholder');
        endEl.removeAttribute('pattern');

        if (startVal) startEl.value = timeToDecimalStr(startVal);
        if (endVal)   endEl.value   = timeToDecimalStr(endVal);
    } else {
        // Aktuelle Werte konvertieren
        const startVal = startEl.value;
        const endVal   = endEl.value;

        startEl.type = 'time';
        startEl.removeAttribute('inputMode');
        startEl.removeAttribute('placeholder');
        startEl.removeAttribute('pattern');

        endEl.type = 'time';
        endEl.removeAttribute('inputMode');
        endEl.removeAttribute('placeholder');
        endEl.removeAttribute('pattern');

        if (startVal) startEl.value = decimalStrToTime(startVal);
        if (endVal)   endEl.value   = decimalStrToTime(endVal);
    }

    // Persistenz
    localStorage.setItem('wp_zeit_decimal', decimal ? '1' : '0');
}

// ---- Kernfunktionen ----

function setEndNow() {
    const now = new Date();
    writeTimeInput('workEnd', now.getHours(), now.getMinutes());
}

function setEndWorkday() {
    const startMin = readTimeInput('workStart');
    const targetHoursVal = document.getElementById('targetHours').value;
    if (startMin == null || targetHoursVal === '') return;
    const targetMin = Math.round(parseFloat(targetHoursVal) * 60);
    const breakMin = parseInt(document.getElementById('breakMinutes').value) || 0;
    const endTotalMin = startMin + targetMin + breakMin;
    const eh = Math.floor(endTotalMin / 60) % 24;
    const em = endTotalMin % 60;
    writeTimeInput('workEnd', eh, em);
}

function formatMinutes(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
}

document.getElementById('timeForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const startMinutes = readTimeInput('workStart');
    const endMinutesRaw = readTimeInput('workEnd');
    const breakMin = parseInt(document.getElementById('breakMinutes').value) || 0;

    if (startMinutes == null || endMinutesRaw == null) return;

    let endMinutes = endMinutesRaw;

    // Mitternachtsüberschreitung: z. B. 22:00 – 02:00
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
    }

    const grossMinutes = endMinutes - startMinutes;
    const netMinutes = grossMinutes - breakMin;

    if (netMinutes < 0) {
        document.getElementById('timeError').textContent = t('breakTooLong');
        document.getElementById('timeError').classList.add('show');
        document.getElementById('timeWarning').classList.remove('show');
        document.getElementById('timeResults').classList.remove('show');
        return;
    }

    // ArbZG-Warnungen
    const warnings = [];
    if (grossMinutes > 9 * 60 && breakMin < 45)
        warnings.push(t('warningBreak', breakMin));
    if (netMinutes > 10 * 60)
        warnings.push(t('warningOvertime'));

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

function zeitrechnerReset() {
    localStorage.removeItem('wp_zeit');
    document.getElementById('decimalTimeToggle').checked = false;
    localStorage.setItem('wp_zeit_decimal', '0');
    applyDecimalMode();
    document.getElementById('workStart').value    = '';
    document.getElementById('workEnd').value      = '';
    document.getElementById('breakMinutes').value = '45';
    document.getElementById('targetHours').value  = '';
    document.getElementById('timeResults').classList.remove('show');
    document.getElementById('timeError').classList.remove('show');
    document.getElementById('timeWarning').classList.remove('show');
    document.getElementById('overtimeCard').style.display = 'none';
}

// Arbeitszeitrechner: Persistenz
(function initZeitrechner() {
    // Dezimalmodus wiederherstellen (VOR dem Laden der Werte)
    const decSaved = localStorage.getItem('wp_zeit_decimal');
    if (decSaved === '1') {
        document.getElementById('decimalTimeToggle').checked = true;
        applyDecimalMode();
    }

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

// Dezimalzeit-Toggle Event
document.getElementById('decimalTimeToggle').addEventListener('change', applyDecimalMode);

/** Normalisiert Dezimaleingaben beim Verlassen des Feldes (z.B. "6" → "6,00") */
function normalizeDecimalInput(e) {
    if (!isDecimalMode()) return;
    const val = e.target.value.trim();
    if (!val) return;
    const parsed = parseDecimalTime(val);
    if (!parsed) return;
    const decimal = parsed.h + parsed.m / 60;
    const lang = localStorage.getItem('wp_lang') || 'de';
    e.target.value = decimal.toFixed(2).replace('.', lang === 'de' ? ',' : '.');
}
document.getElementById('workStart').addEventListener('blur', normalizeDecimalInput);
document.getElementById('workEnd').addEventListener('blur', normalizeDecimalInput);

// Globale Exposition
window.formatMinutes   = formatMinutes;

// Event Listeners
document.getElementById('btnSetEndNow').addEventListener('click', setEndNow);
document.getElementById('btnSetEndWorkday').addEventListener('click', setEndWorkday);
document.getElementById('btnZeitrechnerReset').addEventListener('click', zeitrechnerReset);
