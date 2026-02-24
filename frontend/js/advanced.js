/* =========================================================
   ADVANCED.JS – Tab 3: Advanced HO Day Planer
   Abhängigkeiten: holidays.js (getGermanHolidays), app.js
   ========================================================= */

const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTHS_FULL = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

function getMonthsShort() {
    return (typeof t === 'function') ? t('monthsShort') : MONTHS_DE;
}
function getMonthsFull() {
    return (typeof t === 'function') ? t('monthsFull') : MONTHS_FULL;
}

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
// Budget bezieht sich nur auf HO-Tage; Urlaub wird separat angezeigt
function advGetUsed()    { return advGetUsedHO(); }
function advGetRem()     { return advGetBudget() - advGetUsed(); }

function advReset() {
    document.getElementById('advBudget').value = 130;
    document.getElementById('advYear').value   = new Date().getFullYear();
    advData.hoDays = new Array(12).fill(0);
    advData.vacDays = new Array(12).fill(0);
    localStorage.removeItem('wp_adv');
    advUpdateAll();
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
    const budget  = advGetBudget();
    const usedHO  = advGetUsedHO();
    const usedVac = advGetUsedVac();
    const rem     = budget - usedHO;
    const pct     = budget > 0 ? usedHO / budget : 0;

    // Chips: HO-Budget getrennt von Urlaub
    document.getElementById('advChipTotal').textContent = budget;
    document.getElementById('advChipUsed').textContent  = usedHO;
    document.getElementById('advChipRem').textContent   = rem;
    // Urlaubs-Chip (falls vorhanden)
    const vacChip = document.getElementById('advChipVac');
    if (vacChip) vacChip.textContent = usedVac;

    const remCard = document.getElementById('advChipRemCard');
    remCard.classList.remove('warning','danger');
    if (rem < 0)           remCard.classList.add('danger');
    else if (pct >= 0.9)   remCard.classList.add('warning');

    // Warnungen
    const warnDiv   = document.getElementById('advWarn');
    const dangerDiv = document.getElementById('advDanger');
    if (rem < 0) {
        dangerDiv.classList.add('show');
        const dangerText = document.getElementById('advDangerText');
        if (dangerText) dangerText.textContent = t('advDangerOver', Math.abs(rem));
        warnDiv.classList.remove('show');
    } else if (pct >= 0.9 && pct < 1) {
        warnDiv.textContent = t('advWarning90');
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
        subEl.textContent = t('advDaysOf', total, workdays);
    }

    // Chart neu zeichnen
    advDrawChart();
    saveAdvState();
}

function advWorkdaysInMonth(year, monthIdx) {
    const bl = document.getElementById('bundesland').value || null;
    const firstDay = new Date(Date.UTC(year, monthIdx, 1));
    const lastDay  = new Date(Date.UTC(year, monthIdx + 1, 0));
    const holidays = getGermanHolidays(year, year, bl);
    let count = 0;
    const daysInMonth = lastDay.getUTCDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dow     = new Date(Date.UTC(year, monthIdx, d)).getUTCDay();
        const dateStr = `${year}-${String(monthIdx + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (dow !== 0 && dow !== 6 && !holidays.has(dateStr)) count++;
    }
    return count;
}

function advBuildMonthCards() {
    const container = document.getElementById('advMonthControls');
    container.innerHTML = '';
    const tmpl = document.getElementById('tmpl-month-card');
    for (let i = 0; i < 12; i++) {
        const fragment = tmpl.content.cloneNode(true);
        const card = fragment.querySelector('.month-card');
        card.dataset.month = i;
        card.querySelector('.month-name').textContent = getMonthsFull()[i];
        card.querySelector('[data-role="ho"]').id  = `adv-ho-${i}`;
        card.querySelector('[data-role="vac"]').id = `adv-vac-${i}`;
        card.querySelector('.month-sub').id         = `adv-sub-${i}`;
        card.querySelectorAll('.btn-step').forEach(btn => btn.dataset.month = i);
        // Translate month-type labels
        const typeLabels = card.querySelectorAll('.month-type-label');
        if (typeLabels[0]) typeLabels[0].textContent = t('advHoDays');
        if (typeLabels[1]) typeLabels[1].textContent = t('advVacation');
        container.appendChild(fragment);
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
    const monthsShort = getMonthsShort();
    for (let i = 0; i < 12; i++) {
        ctx.fillText(monthsShort[i], xPos(i), PAD_T + chartH + 18);
    }

    // Achsentitel
    ctx.save();
    ctx.translate(13, PAD_T + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle  = colorText;
    ctx.font       = 'bold 11px system-ui';
    ctx.textAlign  = 'center';
    ctx.fillText(t('advHoDays'), 0, 0);
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
    ctx.fillText(t('advHoDays'), legX + 30, legY + 4);
    
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
    ctx.fillText(t('advVacation'), legX + 30, legY + 22);
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

// Event Delegation – Monats-Stepper
document.getElementById('advMonthControls').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-step');
    if (!btn) return;
    const monthIdx = parseInt(btn.dataset.month, 10);
    const type     = btn.dataset.type;
    const delta    = parseInt(btn.dataset.delta, 10);
    advChangeDay(monthIdx, type, delta);
});

// Event Listener – Advanced Reset
document.getElementById('btnAdvReset').addEventListener('click', advReset);

// Globale Exposition (nur was von anderen Modulen benötigt wird)
window.advUpdateAll = advUpdateAll;
window.advDrawChart = advDrawChart;
