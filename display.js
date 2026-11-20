const STORAGE_KEY = 'slalom-timing-control-v4';
const board = document.getElementById('displayBoard');
const stackedToggle = document.getElementById('stackedToggle');
const fullscreenToggle = document.getElementById('fullscreenToggle');

function updateStackedButton() {
  if (!stackedToggle) return;
  const active = document.body.classList.contains('stacked-layout');
  const icon = stackedToggle.querySelector('.layout-toggle-icon');
  if (icon) icon.textContent = '↻↺';
  stackedToggle.setAttribute('aria-label', active ? 'Расположить панели рядом' : 'Расположить панели вертикально');
  stackedToggle.title = active ? 'Расположить панели рядом' : 'Расположить панели вертикально';
}
function toggleStackedLayout() {
  document.body.classList.toggle('stacked-layout');
  updateStackedButton();
  requestAnimationFrame(() => { fitTimers(); fitDisplayLayout(); });
}
stackedToggle?.addEventListener('click', toggleStackedLayout);
updateStackedButton();

function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
function updateFullscreenButton() {
  if (!fullscreenToggle) return;
  const active = Boolean(fullscreenElement());
  fullscreenToggle.textContent = active ? '×' : '⛶';
  fullscreenToggle.setAttribute('aria-label', active ? 'Выйти из полноэкранного режима' : 'Открыть полноэкранный режим');
  fullscreenToggle.title = active ? 'Выйти из полноэкранного режима' : 'Открыть полноэкранный режим';
}
async function toggleFullscreen() {
  try {
    if (fullscreenElement()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      const root = document.documentElement;
      if (root.requestFullscreen) await root.requestFullscreen();
      else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
    }
  } catch (_) {
    fullscreenToggle?.blur();
  }
  updateFullscreenButton();
}
fullscreenToggle?.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
updateFullscreenButton();

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
    if (!box) return;
    const boxStyle = getComputedStyle(box);
    const available = Math.max(1, box.clientWidth - parseFloat(boxStyle.paddingLeft) - parseFloat(boxStyle.paddingRight) - 4);
    const availableHeight = Math.max(1, box.clientHeight - parseFloat(boxStyle.paddingTop) - parseFloat(boxStyle.paddingBottom) - 4);
    const base = Math.max(54, Math.min(260, box.clientWidth * 0.23));
    timer.style.fontSize = `${base}px`;
    const width = timer.getBoundingClientRect().width;
    const height = timer.getBoundingClientRect().height;
    const widthScale = width > available ? available / width : 1;
    const heightScale = height > availableHeight ? availableHeight / height : 1;
    timer.style.fontSize = `${Math.max(30, base * Math.min(widthScale, heightScale))}px`;
  });
}

function fitDisplayLayout() {
  const lanes = [...board.querySelectorAll('.display-lane')];
  if (!lanes.length) return;
  const stacked = document.body.classList.contains('stacked-layout');
  const boardStyle = getComputedStyle(board);
  const padding = (parseFloat(boardStyle.paddingLeft) || 0) + (parseFloat(boardStyle.paddingRight) || 0);
  const contentWidth = Math.max(1, board.clientWidth - padding);

  board.style.gridTemplateRows = '';
  board.style.rowGap = '';

  if (!stacked) {
    board.style.height = '';
    lanes.forEach((lane) => { lane.style.width = ''; lane.style.transform = ''; lane.style.transformOrigin = ''; });
    fitTimers();
    return;
  }

  board.style.height = 'calc(100vh - 68px)';
  const gap = parseFloat(boardStyle.rowGap) || 0;
  lanes.forEach((lane) => {
    lane.style.width = `${contentWidth}px`;
    lane.style.transform = 'none';
    lane.style.transformOrigin = 'center center';
  });
  fitTimers();
  const naturalHeights = lanes.map((lane) => lane.getBoundingClientRect().height);
  const availableHeight = Math.max(1, board.clientHeight - gap * (lanes.length - 1));
  const totalNaturalHeight = naturalHeights.reduce((sum, height) => sum + height, 0);
  const scale = Math.min(1, availableHeight / Math.max(1, totalNaturalHeight));
  board.style.gridTemplateRows = naturalHeights.map((height) => `${height * scale}px`).join(' ');
  board.style.rowGap = `${gap * scale}px`;
  lanes.forEach((lane) => { lane.style.transform = `scale(${scale})`; });
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
  fitDisplayLayout();
}

render();
window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) render(); });
setInterval(render, 100);
window.addEventListener('resize', () => { fitTimers(); fitDisplayLayout(); });
