/* =========================================================
   APP.JS – Shared: Dark Mode, Tab-Switching, ISO-Wochenschlüssel
   ========================================================= */

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

// Tab switching
function switchTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    if (tabName === 'advanced') {
        requestAnimationFrame(() => advDrawChart());
    }
}

// Globale Exposition
window.toggleDarkMode = toggleDarkMode;
window.getISOWeekKey  = getISOWeekKey;
window.switchTab      = switchTab;
