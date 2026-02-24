/* =========================================================
   TIMETRACKER.JS – Tab 2: Arbeitszeitrechner
   ========================================================= */

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
    let endMinutes = eh * 60 + em;

    // Mitternachtsüberschreitung: z. B. 22:00 – 02:00
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
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

// Globale Exposition
window.setEndNow       = setEndNow;
window.formatMinutes   = formatMinutes;
window.zeitrechnerReset = zeitrechnerReset;
