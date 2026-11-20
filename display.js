const STORAGE_KEY = 'slalom-timing-control-v4';
const board = document.getElementById('displayBoard');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function formatTime(value) {
  if (!Number.isFinite(value)) return '0.000';
  if (value < 60) return value.toFixed(3);
  const minutes = Math.floor(value / 60);
  return `${minutes}:${(value - minutes * 60).toFixed(2).padStart(5, '0')}`;
}

function timerValue(lane, now) {
  if (lane.error) return 'ERR';
  if (lane.dq) return '--';
  const value = lane.running && Number.isFinite(lane.startedAt)
    ? (now - lane.startedAt) / 1000
    : lane.time;
  return formatTime(value);
}

function fitTimers() {
  board.querySelectorAll('.timer').forEach((timer) => {
    const box = timer.closest('.lane-box');
    const available = Math.max(1, box.clientWidth - 12);
    const base = Math.max(54, Math.min(260, box.clientWidth * 0.23));
    timer.style.fontSize = `${base}px`;
    const width = timer.getBoundingClientRect().width;
    if (width > available) timer.style.fontSize = `${Math.max(30, base * available / width)}px`;
  });
}

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function render() {
  const state = loadState();
  const roster = Array.isArray(state.roster) ? state.roster : [];
  const lanes = Array.isArray(state.lanes) ? state.lanes.slice(0, 2) : [];
  const now = Date.now();
  board.innerHTML = lanes.map((lane, index) => {
    const athlete = roster.find((item) => item.id === lane.athleteId);
    const nextAthlete = roster.find((item) => item.id === lane.displayNextAthleteId);
    const penalty = lane.penalties >= 5 ? lane.penalties : lane.dq ? 'DQ' : Number(lane.penalties || 0);
    const statusClass = lane.error ? ' error' : lane.running ? ' active' : '';
    return `<section class="display-lane"><div class="current-athlete"><strong class="current-athlete-name">${escapeHtml(athlete?.name || '—')}</strong></div><div class="lane-box${statusClass}"><span class="lane-label">LANE ${index + 1}</span><strong class="timer">${timerValue(lane, now)}</strong></div><div class="penalty-container"><strong class="penalty-value"><span class="penalty-label">PENALTIES</span><span class="penalty-number">${penalty}</span></strong></div><div class="next-athlete"><span class="next-athlete-label">Next skater</span><strong class="next-athlete-name">${escapeHtml(nextAthlete?.name || '—')}</strong></div></section>`;
  }).join('');
  fitTimers();
}

render();
window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) render(); });
setInterval(render, 100);
window.addEventListener('resize', fitTimers);
