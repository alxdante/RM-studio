const SERVICE_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50100406e';
const RX_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50200406e';
const TX_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50300406e';
const STORAGE_KEY = 'slalom-timing-control-v1';

const GROUPS = [
  { id: 'g8', label: '8–9 лет', short: '8—9', min: 8, max: 9 },
  { id: 'g10', label: '10–14 лет', short: '10—14', min: 10, max: 14 },
  { id: 'g15', label: '15–18 лет', short: '15—18', min: 15, max: 18 },
  { id: 'g19', label: '19+ лет', short: '19+', min: 19, max: 150 }
];

const DEMO_ROSTER = [
  ['Алиса Морозова', 8, 'Москва', 'Roller Lab', 842],
  ['Тимур Алиев', 9, 'Казань', 'Vortex', 776],
  ['Ева Ким', 9, 'Москва', 'Flow Kids', 918],
  ['Марк Волков', 8, 'Сочи', 'South Wheels', 704],
  ['София Лебедева', 12, 'Санкт-Петербург', 'North Line', 956],
  ['Илья Миронов', 14, 'Казань', 'Vortex', 812],
  ['Полина Барышева', 13, 'Москва', 'Roller Lab', 889],
  ['Арсений Соколов', 11, 'Тула', 'Spin City', 745],
  ['Дарья Орлова', 16, 'Москва', 'Flow Team', 978],
  ['Никита Власов', 18, 'Санкт-Петербург', 'North Line', 901],
  ['Ксения Фёдорова', 17, 'Сочи', 'South Wheels', 838],
  ['Лев Андреев', 21, 'Москва', 'Roller Lab', 965],
  ['Анна Крылова', 25, 'Казань', 'Vortex', 884],
  ['Роман Зайцев', 32, 'Санкт-Петербург', 'North Line', 821]
].map(([name, age, city, club, rating], index) => ({
  id: `demo-${index + 1}`,
  name, age, city, club, rating, source: 'demo'
}));

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function emptyGroupState() {
  return { attempts: { 1: {}, 2: {} }, bracket: null, selectedMatchId: null, standings: [] };
}

function createInitialState() {
  const groups = {};
  GROUPS.forEach((group) => { groups[group.id] = emptyGroupState(); });
  return {
    eventName: 'Urban Flow Open',
    eventDate: new Date().toISOString().slice(0, 10),
    selectedGroup: 'g8',
    phase: 'qualification',
    attempt: 1,
    bracketSize: 4,
    roster: DEMO_ROSTER,
    groups,
    lanes: [{ athleteId: DEMO_ROSTER[0].id, time: null, running: false, startedAt: null, error: null }, { athleteId: DEMO_ROSTER[1].id, time: null, running: false, startedAt: null, error: null }],
    activity: [{ at: Date.now(), text: 'Демо-состав готов. Можно импортировать Excel.' }]
  };
}

let state = loadState();
let ble = { device: null, server: null, rx: null, tx: null, connected: false, buffer: '', reconnectTimer: null, reconnectAttempt: 0, manualDisconnect: false };
let timerHandle = null;
let toastHandle = null;
let pendingImport = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.roster && saved.groups) {
      saved.lanes = (saved.lanes || [{ athleteId: null, time: null, running: false }, { athleteId: null, time: null, running: false }]).map((lane) => ({ ...lane, running: false, startedAt: null }));
      saved.activity = saved.activity || [];
      return saved;
    }
  } catch (error) {
    console.warn('Не удалось восстановить состояние', error);
  }
  return createInitialState();
}

function persist(message = 'Сохранено только что') {
  state.eventName = $('#eventName')?.value || state.eventName;
  state.eventDate = $('#eventDate')?.value || state.eventDate;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const status = $('#saveStatus');
  if (status) status.textContent = message;
}

function groupForAge(age) {
  return GROUPS.find((group) => age >= group.min && age <= group.max) || GROUPS[3];
}

function athletesForGroup(groupId = state.selectedGroup) {
  return state.roster.filter((athlete) => groupForAge(Number(athlete.age)).id === groupId);
}

function athleteById(id) {
  return state.roster.find((athlete) => athlete.id === id) || null;
}

function groupState() {
  if (!state.groups[state.selectedGroup]) state.groups[state.selectedGroup] = emptyGroupState();
  return state.groups[state.selectedGroup];
}

function getTime(groupId, athleteId, attempt = state.attempt) {
  return state.groups[groupId]?.attempts?.[attempt]?.[athleteId] ?? null;
}

function bestTime(groupId, athleteId) {
  const values = [getTime(groupId, athleteId, 1), getTime(groupId, athleteId, 2)].filter((value) => Number.isFinite(value));
  return values.length ? Math.min(...values) : null;
}

function formatTime(value) {
  return Number.isFinite(value) ? `${Number(value).toFixed(3)} s` : '—';
}

function formatClock(value) {
  return Number.isFinite(value) ? Number(value).toFixed(3) : '0.000';
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

function qualificationOrder(groupId = state.selectedGroup, attempt = state.attempt) {
  const athletes = athletesForGroup(groupId).slice();
  if (attempt === 1) {
    return athletes.sort((a, b) => Number(a.rating) - Number(b.rating) || a.name.localeCompare(b.name, 'ru'));
  }
  return athletes.sort((a, b) => {
    const aTime = getTime(groupId, a.id, 1);
    const bTime = getTime(groupId, b.id, 1);
    if (!Number.isFinite(aTime) && Number.isFinite(bTime)) return -1;
    if (Number.isFinite(aTime) && !Number.isFinite(bTime)) return 1;
    return (bTime ?? Infinity) - (aTime ?? Infinity) || Number(a.rating) - Number(b.rating);
  });
}

function qualificationRanking(groupId = state.selectedGroup) {
  return athletesForGroup(groupId).slice().sort((a, b) => {
    const aBest = bestTime(groupId, a.id);
    const bBest = bestTime(groupId, b.id);
    if (!Number.isFinite(aBest) && Number.isFinite(bBest)) return 1;
    if (Number.isFinite(aBest) && !Number.isFinite(bBest)) return -1;
    return (aBest ?? Infinity) - (bBest ?? Infinity) || Number(b.rating) - Number(a.rating);
  });
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => toast.classList.remove('show'), 2900);
}

function addActivity(text) {
  state.activity.unshift({ at: Date.now(), text });
  state.activity = state.activity.slice(0, 18);
  renderEventLog();
  persist();
}

function renderGroupNav() {
  $('#groupNav').innerHTML = GROUPS.map((group, index) => {
    const count = athletesForGroup(group.id).length;
    return `<button class="group-item ${state.selectedGroup === group.id ? 'active' : ''}" data-group="${group.id}"><span class="group-num">0${index + 1}</span><span>${group.label}</span><span class="group-size">${String(count).padStart(2, '0')}</span></button>`;
  }).join('');
  $$('#groupNav [data-group]').forEach((button) => button.addEventListener('click', () => selectGroup(button.dataset.group)));
}

function renderSummary() {
  $('#eventName').value = state.eventName;
  $('#eventDate').value = state.eventDate;
  $('#heroAthletes').textContent = String(state.roster.length).padStart(2, '0');
  $('#rosterTotal').textContent = String(state.roster.length).padStart(2, '0');
  $('#crumbGroup').textContent = GROUPS.find((group) => group.id === state.selectedGroup)?.label || '';
  $('#qualTitle').textContent = `Группа ${GROUPS.find((group) => group.id === state.selectedGroup)?.label || ''}`;
  $('#bracketSize').value = String(state.bracketSize || 4);
}

function renderRosterStats() {
  const max = Math.max(1, ...GROUPS.map((group) => athletesForGroup(group.id).length));
  $('#rosterGroupStats').innerHTML = GROUPS.map((group) => {
    const count = athletesForGroup(group.id).length;
    return `<div class="group-stat ${group.id === state.selectedGroup ? 'active' : ''}"><span>${group.short}</span><span class="bar"><i style="width:${Math.round((count / max) * 100)}%"></i></span><span class="count">${count}</span></div>`;
  }).join('');
}

function renderQualificationTable() {
  const groupId = state.selectedGroup;
  const ordered = qualificationOrder(groupId, state.attempt);
  const finished = ordered.filter((athlete) => Number.isFinite(getTime(groupId, athlete.id, state.attempt))).length;
  const attemptLabel = state.attempt === 1 ? 'попытка 01' : 'попытка 02';
  $('#startListTitle').textContent = `Порядок выхода · ${attemptLabel}`;
  $('#startListMeta').textContent = `${finished} / ${ordered.length} готовы`;
  $('#athleteRows').innerHTML = ordered.length ? ordered.map((athlete, index) => {
    const a1 = getTime(groupId, athlete.id, 1);
    const a2 = getTime(groupId, athlete.id, 2);
    const best = bestTime(groupId, athlete.id);
    return `<tr data-athlete-row="${athlete.id}">
      <td>${String(index + 1).padStart(2, '0')}</td>
      <td><span class="athlete-name">${escapeHtml(athlete.name)}</span></td>
      <td><span class="club-name">${escapeHtml(athlete.city || '—')} / ${escapeHtml(athlete.club || '—')}</span></td>
      <td><span class="rating-chip">${Number(athlete.rating) || 0}</span></td>
      <td class="time-cell ${Number.isFinite(a1) ? '' : 'empty'}">${formatTime(a1)}</td>
      <td class="time-cell ${Number.isFinite(a2) ? '' : 'empty'}">${formatTime(a2)}</td>
      <td class="best-cell">${formatTime(best)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty-table">В этой группе пока нет участников. Импортируйте Excel или добавьте демо-состав.</td></tr>`;
}

function renderAttemptControls() {
  $$('.attempt-tab').forEach((button) => button.classList.toggle('active', Number(button.dataset.attempt) === state.attempt));
  $('#orderCaption').textContent = state.attempt === 1 ? 'По рейтингу · от низкого к высокому' : 'По результатам 01 · от худшего к лучшему';
  $('#advanceAttemptBtn').textContent = state.attempt === 1 ? 'Открыть попытку 02 →' : 'Вернуться к попытке 01 →';
}

function laneOptions(currentId) {
  const athletes = qualificationOrder(state.selectedGroup, state.attempt);
  const options = [`<option value="">Назначить спортсмена</option>`].concat(athletes.map((athlete) => `<option value="${athlete.id}" ${athlete.id === currentId ? 'selected' : ''}>${escapeHtml(athlete.name)}</option>`));
  return options.join('');
}

function renderLanes() {
  const now = Date.now();
  $('#laneCards').innerHTML = state.lanes.map((lane, index) => {
    const athlete = athleteById(lane.athleteId);
    const runningTime = lane.running && Number.isFinite(lane.startedAt) ? (now - lane.startedAt) / 1000 : lane.time;
    const status = lane.error ? 'ошибка' : lane.running ? 'в движении' : Number.isFinite(lane.time) ? 'финиш' : 'готов';
    return `<article class="lane-card ${lane.running ? 'active' : ''} ${lane.error ? 'error' : ''} ${Number.isFinite(lane.time) && !lane.running ? 'finished' : ''}">
      <div class="lane-top"><span class="lane-number">ДОРОЖКА 0${index + 1}</span><span>${status}</span></div>
      <div class="lane-athlete"><div><strong>${athlete ? escapeHtml(athlete.name) : 'Свободная дорожка'}</strong><span>${athlete ? `${athlete.age} лет · рейтинг ${athlete.rating}` : 'выберите участника'}</span></div><select data-lane-select="${index}" aria-label="Спортсмен на дорожке ${index + 1}">${laneOptions(lane.athleteId)}</select></div>
      <div><span class="lane-time">${formatClock(runningTime)}</span><span class="lane-state">${lane.error || (lane.running ? 'LIVE' : lane.time ? 'result' : 'standby')}</span></div>
      <div class="manual-result"><input data-manual-time="${index}" type="number" min="0.001" step="0.001" placeholder="время, с" aria-label="Ручное время дорожки ${index + 1}" /><button data-manual-submit="${index}" class="mini-submit">Внести</button></div>
    </article>`;
  }).join('');
  $$('[data-lane-select]').forEach((select) => select.addEventListener('change', () => {
    state.lanes[Number(select.dataset.laneSelect)].athleteId = select.value || null;
    state.lanes[Number(select.dataset.laneSelect)].time = null;
    state.lanes[Number(select.dataset.laneSelect)].error = null;
    persist();
    renderLanes();
  }));
  $$('[data-manual-submit]').forEach((button) => button.addEventListener('click', () => {
    const lane = Number(button.dataset.manualSubmit);
    const input = document.querySelector(`[data-manual-time="${lane}"]`);
    const time = Number(input.value);
    if (!Number.isFinite(time) || time <= 0) return showToast('Введите время больше нуля');
    applyLaneResult(lane, time, 'manual');
    input.value = '';
  }));
}

function renderEventLog() {
  const items = state.activity || [];
  $('#eventLog').innerHTML = items.length ? items.slice(0, 2).map((item) => `↳ ${formatDate(item.at)} · ${escapeHtml(item.text)}`).join('<br />') : '↳ журнал событий пуст';
}

function renderBle() {
  const online = ble.connected;
  $('#bleDot').classList.toggle('online', online);
  $('#bleBtnText').textContent = online ? 'BLE подключён' : 'Подключить BLE';
  $('#railBleStatus').textContent = online ? 'online' : 'offline';
  $('#railBleStatus').className = `status-pill ${online ? 'online' : 'offline'}`;
  $('#deviceName').textContent = ble.device?.name || 'ESP32-BLE-UART';
  $('#deviceHint').textContent = online ? 'Канал TX/RX активен' : 'Ожидает подключения';
  $('#disconnectBtn').disabled = !online;
}

function renderPanels() {
  $$('.phase-tab').forEach((button) => button.classList.toggle('active', button.dataset.phase === state.phase));
  $('#qualificationPanel').classList.toggle('hidden', state.phase !== 'qualification');
  $('#finalsPanel').classList.toggle('hidden', state.phase !== 'finals');
}

function renderAll() {
  renderSummary();
  renderGroupNav();
  renderRosterStats();
  renderAttemptControls();
  renderQualificationTable();
  renderLanes();
  renderEventLog();
  renderBle();
  renderPanels();
  renderBracket();
}

function selectGroup(groupId) {
  state.selectedGroup = groupId;
  state.phase = 'qualification';
  state.attempt = 1;
  const queue = qualificationOrder(groupId, 1);
  state.lanes = [{ athleteId: queue[0]?.id || null, time: null, running: false, startedAt: null, error: null }, { athleteId: queue[1]?.id || null, time: null, running: false, startedAt: null, error: null }];
  persist();
  renderAll();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function startLanes() {
  if (state.lanes.every((lane) => !lane.athleteId)) return showToast('Назначьте спортсменов на дорожки');
  const start = Date.now();
  state.lanes.forEach((lane) => { if (lane.athleteId) { lane.running = true; lane.startedAt = start; lane.time = null; lane.error = null; } });
  sendBleCommand('start');
  addActivity(`Старт · ${GROUPS.find((group) => group.id === state.selectedGroup)?.label} · попытка 0${state.attempt}`);
  renderLanes();
  startTicker();
}

function resetLanes() {
  state.lanes.forEach((lane) => { if (lane.running) lane.time = null; lane.running = false; lane.startedAt = null; lane.error = null; });
  sendBleCommand('reset');
  addActivity('Сброс активных дорожек');
  renderLanes();
}

function startTicker() {
  clearInterval(timerHandle);
  timerHandle = setInterval(() => {
    if (!state.lanes.some((lane) => lane.running)) return clearInterval(timerHandle);
    renderLanes();
  }, 70);
}

function applyLaneResult(laneIndex, time, source = 'ble') {
  const lane = state.lanes[laneIndex];
  if (!lane || !lane.athleteId) return showToast(`На дорожке ${laneIndex + 1} не выбран спортсмен`);
  lane.running = false;
  lane.startedAt = null;
  lane.time = Number(time);
  if (state.phase === 'qualification') {
    groupState().attempts[state.attempt][lane.athleteId] = Number(time);
    const athlete = athleteById(lane.athleteId);
    addActivity(`${source === 'ble' ? 'BLE' : 'Ручной ввод'} · ${athlete?.name || 'спортсмен'} · ${formatTime(time)}`);
  } else {
    const bracket = groupState().bracket;
    const match = bracket?.matches?.find((item) => item.id === groupState().selectedMatchId);
    if (match) {
      if (match.athlete1 === lane.athleteId) match.time1 = Number(time);
      if (match.athlete2 === lane.athleteId) match.time2 = Number(time);
      resolveMatch(match.id);
      addActivity(`Финал · ${athleteById(lane.athleteId)?.name || 'спортсмен'} · ${formatTime(time)}`);
    }
  }
  if (!state.lanes.some((item) => item.running)) clearInterval(timerHandle);
  persist();
  renderAll();
}

function parseBleLine(line) {
  let payload;
  try { payload = JSON.parse(line); } catch (error) { addActivity(`BLE · неизвестная строка: ${line.slice(0, 35)}`); return; }
  const type = payload.type;
  if (type === 'start') {
    const lanes = payload.lane == null ? [0, 1] : [Number(payload.lane) - 1];
    lanes.forEach((index) => { if (state.lanes[index] && state.lanes[index].athleteId) { state.lanes[index].running = true; state.lanes[index].startedAt = Date.now(); } });
    renderLanes();
  } else if (type === 'reset') {
    state.lanes.forEach((lane) => { lane.running = false; lane.startedAt = null; });
    renderLanes();
  } else if (type === 'qualification' || type === 'race') {
    const index = Number(payload.lane) - 1;
    if (index >= 0 && index < 2 && Number.isFinite(Number(payload.time))) applyLaneResult(index, Number(payload.time), 'ble');
  } else if (type === 'error') {
    const index = Number(payload.lane) - 1;
    if (index >= 0 && index < 2) { state.lanes[index].error = payload.active ? payload.name || 'ошибка' : null; renderLanes(); }
    addActivity(`BLE · ${payload.name || 'ошибка'} · ${payload.active ? 'активна' : 'снята'}`);
  }
}

function handleBleNotification(event) {
  const text = new TextDecoder().decode(event.target.value);
  ble.buffer += text;
  const lines = ble.buffer.split(/\r?\n/);
  ble.buffer = lines.pop() || '';
  lines.filter(Boolean).forEach(parseBleLine);
}

async function connectToBleDevice(device, isReconnect = false) {
  ble.device = device;
  ble.server = await device.gatt.connect();
  const service = await ble.server.getPrimaryService(SERVICE_UUID);
  ble.rx = await service.getCharacteristic(RX_UUID);
  ble.tx = await service.getCharacteristic(TX_UUID);
  await ble.tx.startNotifications();
  ble.tx.addEventListener('characteristicvaluechanged', handleBleNotification);
  ble.connected = true;
  ble.reconnectAttempt = 0;
  renderBle();
  addActivity(`BLE · ${isReconnect ? 'переподключено к' : 'подключено к'} ${device.name || 'ESP32-BLE-UART'}`);
  showToast(isReconnect ? 'BLE снова подключён' : 'BLE подключён. Канал готов к старту.');
}

function scheduleBleReconnect() {
  if (!ble.device || ble.manualDisconnect || ble.reconnectTimer || ble.reconnectAttempt >= 5) return;
  const delay = Math.min(8000, 900 * (2 ** ble.reconnectAttempt));
  ble.reconnectTimer = setTimeout(async () => {
    ble.reconnectTimer = null;
    ble.reconnectAttempt += 1;
    try { await connectToBleDevice(ble.device, true); }
    catch (error) { console.warn('BLE reconnect failed', error); renderBle(); scheduleBleReconnect(); }
  }, delay);
}

async function connectBle() {
  if (!navigator.bluetooth) return showToast('Web Bluetooth недоступен. Используйте Chrome или Edge на HTTPS.');
  try {
    clearTimeout(ble.reconnectTimer);
    ble.reconnectTimer = null;
    ble.reconnectAttempt = 0;
    ble.manualDisconnect = false;
    const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }], optionalServices: [SERVICE_UUID] });
    device.addEventListener('gattserverdisconnected', () => { ble.connected = false; ble.server = null; ble.rx = null; ble.tx = null; renderBle(); addActivity('BLE · устройство отключено, попытка переподключения запланирована'); scheduleBleReconnect(); });
    await connectToBleDevice(device);
  } catch (error) {
    console.warn(error);
    if (error?.name !== 'NotFoundError') showToast(`Не удалось подключить BLE: ${error.message || 'проверьте устройство'}`);
  }
}

function sendBleCommand(command) {
  if (!ble.connected || !ble.rx) return;
  ble.rx.writeValue(new TextEncoder().encode(command)).catch((error) => { console.warn(error); showToast('Команду BLE не удалось отправить'); });
}

function disconnectBle() {
  ble.manualDisconnect = true;
  clearTimeout(ble.reconnectTimer);
  ble.reconnectTimer = null;
  if (ble.device?.gatt?.connected) ble.device.gatt.disconnect();
  ble.connected = false;
  renderBle();
}

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/ё/g, 'е').replace(/[\s_./-]+/g, '');
}

function findColumn(row, aliases) {
  const key = Object.keys(row).find((candidate) => aliases.includes(normalizeHeader(candidate)));
  return key ? row[key] : undefined;
}

function parseRosterRows(rows) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const nameKey = headers.find((candidate) => ['фио', 'имя', 'спортсмен', 'name', 'athlete', 'fullname'].includes(normalizeHeader(candidate)));
  const ageKey = headers.find((candidate) => ['возраст', 'лет', 'age'].includes(normalizeHeader(candidate)));
  const ratingKey = headers.find((candidate) => ['рейтинг', 'rating', 'rank', 'elo'].includes(normalizeHeader(candidate)));
  const cityKey = headers.find((candidate) => ['город', 'city'].includes(normalizeHeader(candidate)));
  const clubKey = headers.find((candidate) => ['клуб', 'команда', 'club', 'team'].includes(normalizeHeader(candidate)));
  const missing = [];
  if (!nameKey) missing.push('ФИО / Name');
  if (!ageKey) missing.push('Возраст / Age');
  if (!ratingKey) missing.push('Рейтинг / Rating');
  if (missing.length) return { roster: [], errors: [`Не найдены обязательные колонки: ${missing.join(', ')}`], headers };
  const errors = [];
  const roster = rows.map((row, index) => {
    const name = row[nameKey];
    const ageValue = row[ageKey];
    const ratingValue = row[ratingKey];
    const city = cityKey ? row[cityKey] : '';
    const club = clubKey ? row[clubKey] : '';
    const age = Number.parseInt(String(ageValue).replace(/[^0-9]/g, ''), 10);
    const rating = Number.parseInt(String(ratingValue).replace(/[^0-9]/g, ''), 10);
    if (!String(name || '').trim() || !Number.isFinite(age) || age < 1 || age > 120 || !Number.isFinite(rating)) {
      errors.push(`Строка ${index + 2}: проверьте ФИО, возраст и рейтинг`);
      return null;
    }
    return { id: `import-${Date.now()}-${index}`, name: String(name).trim(), age, rating: Number.isFinite(rating) ? rating : 0, city: String(city).trim(), club: String(club).trim(), source: 'import' };
  }).filter(Boolean);
  return { roster, errors, headers };
}

function openImportPreview(fileName, parsed) {
  pendingImport = { fileName, roster: parsed.roster };
  $('#importModalMeta').textContent = `${fileName} · найдено ${parsed.roster.length} корректных строк${parsed.errors.length ? ` · пропущено ${parsed.errors.length}` : ''}`;
  $('#importErrors').classList.toggle('hidden', !parsed.errors.length);
  $('#importErrors').textContent = parsed.errors.slice(0, 5).join(' · ');
  $('#importPreviewRows').innerHTML = parsed.roster.slice(0, 12).map((athlete) => `<tr><td>${escapeHtml(athlete.name)}</td><td>${athlete.age}</td><td>${groupForAge(athlete.age).label}</td><td>${athlete.rating}</td><td>${escapeHtml(athlete.club || '—')}</td></tr>`).join('') || '<tr><td colspan="5">Нет корректных строк для импорта</td></tr>';
  $('#importModal').classList.remove('hidden');
}

function importWorkbook(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const workbook = XLSX.read(event.target.result, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const parsed = parseRosterRows(rows);
      if (!parsed.roster.length) return showToast(parsed.errors[0] || 'Не найдено корректных строк для импорта');
      openImportPreview(file.name, parsed);
    } catch (error) {
      console.error(error);
      showToast('Не удалось прочитать файл Excel');
    }
  };
  reader.readAsArrayBuffer(file);
}

function confirmImport() {
  if (!pendingImport?.roster?.length) return;
  const roster = pendingImport.roster;
  const fileName = pendingImport.fileName;
  state.roster = roster;
  state.groups = {};
  GROUPS.forEach((group) => { state.groups[group.id] = emptyGroupState(); });
  state.selectedGroup = groupForAge(roster[0].age).id;
  state.attempt = 1;
  state.phase = 'qualification';
  const queue = qualificationOrder(state.selectedGroup, 1);
  state.lanes = [{ athleteId: queue[0]?.id || null, time: null, running: false }, { athleteId: queue[1]?.id || null, time: null, running: false }];
  pendingImport = null;
  $('#importModal').classList.add('hidden');
  addActivity(`Импортировано ${roster.length} спортсменов из ${fileName}`);
  showToast(`Готово: ${roster.length} спортсменов загружено`);
  renderAll();
}

function cancelImport() {
  pendingImport = null;
  $('#importModal').classList.add('hidden');
}

function clearRoster() {
  if (!confirm('Очистить весь список спортсменов и результаты?')) return;
  state.roster = [];
  state.groups = {};
  GROUPS.forEach((group) => { state.groups[group.id] = emptyGroupState(); });
  state.lanes = [{ athleteId: null, time: null, running: false }, { athleteId: null, time: null, running: false }];
  state.phase = 'qualification';
  state.attempt = 1;
  addActivity('Список спортсменов очищен');
  renderAll();
}

function loadDemo() {
  state = createInitialState();
  persist('Сохранено · демо-состав');
  renderAll();
  showToast('Демо-состав загружен');
}

function buildBracket(groupId = state.selectedGroup, size = state.bracketSize) {
  const seeded = qualificationRanking(groupId).filter((athlete) => Number.isFinite(bestTime(groupId, athlete.id))).slice(0, size);
  const matches = [];
  const rounds = Math.log2(size);
  const pairings = Array.from({ length: size / 2 }, (_, index) => [seeded[index] || null, seeded[size - index - 1] || null]);
  pairings.forEach(([first, second], index) => matches.push({ id: `r0m${index}`, round: 0, index, label: rounds === 2 ? 'полуфинал' : '1/4 финала', athlete1: first?.id || null, athlete2: second?.id || null, time1: null, time2: null, winnerId: null, loserId: null }));
  for (let round = 1; round < rounds; round += 1) {
    const count = size / (2 ** (round + 1));
    for (let index = 0; index < count; index += 1) {
      matches.push({ id: `r${round}m${index}`, round, index, label: round === rounds - 1 ? 'большой финал' : 'полуфинал', athlete1: null, athlete2: null, time1: null, time2: null, winnerId: null, loserId: null });
    }
  }
  matches.push({ id: 'small-final', round: rounds, index: 0, label: 'малый финал · 3—4', athlete1: null, athlete2: null, time1: null, time2: null, winnerId: null, loserId: null, isSmall: true });
  const bracket = { size, matches, selectedMatchId: matches.find((item) => item.round === 0)?.id || null };
  resolveAutoByes(bracket);
  return bracket;
}

function getMatch(matches, id) { return matches.find((match) => match.id === id); }

function placeWinnerToNext(match, matches, size) {
  const finalRound = Math.log2(size) - 1;
  const nextId = match.isSmall || match.round >= finalRound ? null : `r${match.round + 1}m${Math.floor(match.index / 2)}`;
  if (nextId) {
    const next = getMatch(matches, nextId);
    if (next) next[match.index % 2 === 0 ? 'athlete1' : 'athlete2'] = match.winnerId;
  }
}

function resolveAutoByes(bracket) {
  const finalRound = Math.log2(bracket.size) - 1;
  for (let round = 0; round <= finalRound; round += 1) {
    bracket.matches.filter((match) => match.round === round).forEach((match) => {
      if (round > 0) {
        const feederA = getMatch(bracket.matches, `r${round - 1}m${match.index * 2}`);
        const feederB = getMatch(bracket.matches, `r${round - 1}m${match.index * 2 + 1}`);
        const nextAthlete1 = feederA?.winnerId || null;
        const nextAthlete2 = feederB?.winnerId || null;
        if (match.athlete1 !== nextAthlete1 || match.athlete2 !== nextAthlete2) {
          match.athlete1 = nextAthlete1;
          match.athlete2 = nextAthlete2;
          match.time1 = null;
          match.time2 = null;
          match.winnerId = null;
          match.loserId = null;
        }
      }
      const onlyAthlete = match.athlete1 && !match.athlete2 ? match.athlete1 : !match.athlete1 && match.athlete2 ? match.athlete2 : null;
      if (onlyAthlete) {
        match.winnerId = onlyAthlete;
        match.loserId = null;
        match.time1 = null;
        match.time2 = null;
      } else if (match.athlete1 && match.athlete2 && Number.isFinite(match.time1) && Number.isFinite(match.time2)) {
        match.winnerId = match.time1 <= match.time2 ? match.athlete1 : match.athlete2;
        match.loserId = match.winnerId === match.athlete1 ? match.athlete2 : match.athlete1;
      } else if (!match.athlete1 || !match.athlete2) {
        match.winnerId = null;
        match.loserId = null;
      } else if (!Number.isFinite(match.time1) || !Number.isFinite(match.time2)) {
        match.winnerId = null;
        match.loserId = null;
      }
      if (match.winnerId && round < finalRound) placeWinnerToNext(match, bracket.matches, bracket.size);
    });
  }
  const small = getMatch(bracket.matches, 'small-final');
  const semiMatches = bracket.matches.filter((match) => match.round === finalRound - 1);
  const smallAthlete1 = semiMatches[0]?.loserId || null;
  const smallAthlete2 = semiMatches[1]?.loserId || null;
  if (small && (small.athlete1 !== smallAthlete1 || small.athlete2 !== smallAthlete2)) {
    small.athlete1 = smallAthlete1;
    small.athlete2 = smallAthlete2;
    small.time1 = null;
    small.time2 = null;
    small.winnerId = null;
    small.loserId = null;
  }
  if (small) {
    const onlySmall = small.athlete1 && !small.athlete2 ? small.athlete1 : !small.athlete1 && small.athlete2 ? small.athlete2 : null;
    if (onlySmall) small.winnerId = onlySmall;
    else if (small.athlete1 && small.athlete2 && Number.isFinite(small.time1) && Number.isFinite(small.time2)) {
      small.winnerId = small.time1 <= small.time2 ? small.athlete1 : small.athlete2;
      small.loserId = small.winnerId === small.athlete1 ? small.athlete2 : small.athlete1;
    }
  }
}

function advanceMatch(match, matches) {
  const bracket = groupState().bracket;
  const finalRound = Math.log2(bracket.size) - 1;
  placeWinnerToNext(match, matches, bracket.size);
  const semiRound = finalRound - 1;
  if (match.round === semiRound && match.loserId) {
    const small = getMatch(matches, 'small-final');
    if (small) small[match.index % 2 === 0 ? 'athlete1' : 'athlete2'] = match.loserId;
  }
}

function updateFinalStandings(bracket) {
  const finalRound = Math.log2(bracket.size) - 1;
  const bigFinal = bracket.matches.find((item) => item.round === finalRound);
  const smallFinal = bracket.matches.find((item) => item.id === 'small-final');
  groupState().standings = [bigFinal?.winnerId, bigFinal?.loserId, smallFinal?.winnerId, smallFinal?.loserId].filter(Boolean);
}

function resolveMatch(matchId) {
  const bracket = groupState().bracket;
  const match = bracket?.matches?.find((item) => item.id === matchId);
  if (!match || !match.athlete1 || !match.athlete2) {
    if (match?.athlete1 || match?.athlete2) { resolveAutoByes(bracket); updateFinalStandings(bracket); persist(); }
    return;
  }
  if (!Number.isFinite(match.time1) || !Number.isFinite(match.time2)) return;
  resolveAutoByes(bracket);
  updateFinalStandings(bracket);
  persist();
}

function matchLabel(match) { return match.label || `раунд ${match.round + 1}`; }

function renderMatch(match) {
  const a1 = athleteById(match.athlete1);
  const a2 = athleteById(match.athlete2);
  const finalClass = match.id === 'small-final' || match.label === 'большой финал' ? 'final-match' : '';
  return `<article class="match-card ${finalClass} ${groupState().selectedMatchId === match.id ? 'selected' : ''}" data-match="${match.id}">
    <div class="match-title"><span>${matchLabel(match)}</span><span>${match.id === 'small-final' ? '3—4' : match.id === `r${Math.log2((groupState().bracket?.size || 4)) - 1}m0` ? '1—2' : 'race'}</span></div>
    <div class="match-athlete ${match.winnerId === match.athlete1 ? 'winner' : ''}"><span>${a1 ? escapeHtml(a1.name) : '— / bye'}</span><small>${Number.isFinite(match.time1) ? formatClock(match.time1) : ''}</small></div>
    <div class="match-athlete ${match.winnerId === match.athlete2 ? 'winner' : ''}"><span>${a2 ? escapeHtml(a2.name) : '— / bye'}</span><small>${Number.isFinite(match.time2) ? formatClock(match.time2) : ''}</small></div>
    <div class="match-actions"><input data-match-time="${match.id}:1" type="number" min="0.001" step="0.001" placeholder="lane 1" value="${Number.isFinite(match.time1) ? match.time1 : ''}" /><input data-match-time="${match.id}:2" type="number" min="0.001" step="0.001" placeholder="lane 2" value="${Number.isFinite(match.time2) ? match.time2 : ''}" /><button data-match-record="${match.id}">Записать</button></div>
    <div class="match-actions"><button data-match-lane="${match.id}">Выбрать для BLE →</button></div>
  </article>`;
}

function renderBracket() {
  const bracket = groupState().bracket;
  if (!bracket) {
    $('#bracketBoard').innerHTML = `<div class="bracket-empty">Сетка ещё не собрана. Завершите квалификацию или соберите предварительный посев из доступных результатов.</div>`;
    $('#finalStandings').classList.add('hidden');
    return;
  }
  const rounds = Math.log2(bracket.size);
  const columns = [];
  for (let round = 0; round < rounds; round += 1) {
    const matches = bracket.matches.filter((match) => match.round === round);
    columns.push(`<div class="bracket-column"><div class="round-label">${round === rounds - 1 ? 'большой финал' : matches[0]?.label || ''}</div>${matches.map(renderMatch).join('')}</div>`);
  }
  columns.push(`<div class="bracket-column"><div class="round-label">малый финал</div>${renderMatch(bracket.matches.find((match) => match.id === 'small-final'))}</div>`);
  $('#bracketBoard').innerHTML = `<div class="bracket-grid">${columns.join('')}</div>`;
  const standings = groupState().standings || [];
  $('#finalStandings').classList.toggle('hidden', standings.length === 0);
  if (standings.length) $('#finalStandings').innerHTML = `<h4>Итоговый протокол</h4><div class="standings-grid">${standings.map((id, index) => { const athlete = athleteById(id); return `<div class="standing-item"><b>${String(index + 1).padStart(2, '0')} место</b><span>${escapeHtml(athlete?.name || '—')}</span><small>${athlete ? `${athlete.age} лет · ${formatTime(bestTime(state.selectedGroup, athlete.id))}` : ''}</small></div>`; }).join('')}</div>`;
  $$('[data-match]').forEach((card) => card.addEventListener('click', (event) => {
    if (event.target.closest('input') || event.target.closest('button')) return;
    groupState().selectedMatchId = card.dataset.match;
    persist(); renderBracket();
  }));
  $$('[data-match-record]').forEach((button) => button.addEventListener('click', () => {
    const match = getMatch(bracket.matches, button.dataset.matchRecord);
    const time1 = Number(document.querySelector(`[data-match-time="${match.id}:1"]`)?.value);
    const time2 = Number(document.querySelector(`[data-match-time="${match.id}:2"]`)?.value);
    if (!match.athlete1 || !match.athlete2) return showToast('В этой паре нужен проход по bye или два участника');
    if (!Number.isFinite(time1) || !Number.isFinite(time2) || time1 <= 0 || time2 <= 0) return showToast('Укажите оба времени заезда');
    match.time1 = time1; match.time2 = time2; resolveMatch(match.id); addActivity(`Пара ${matchLabel(match)} записана`); renderBracket();
  }));
  $$('[data-match-lane]').forEach((button) => button.addEventListener('click', () => {
    const match = getMatch(bracket.matches, button.dataset.matchLane);
    groupState().selectedMatchId = match.id;
    state.lanes = [{ athleteId: match.athlete1, time: null, running: false }, { athleteId: match.athlete2, time: null, running: false }];
    sendBleCommand('start');
    state.lanes.forEach((lane) => { if (lane.athleteId) { lane.running = true; lane.startedAt = Date.now(); } });
    addActivity(`BLE · выбран ${matchLabel(match)}`);
    showToast(`Пара ${matchLabel(match)} выбрана. Старт отправлен в BLE.`);
    persist(); renderBracket();
  }));
}

function generateBracket() {
  const available = qualificationRanking().filter((athlete) => Number.isFinite(bestTime(state.selectedGroup, athlete.id)));
  if (available.length < 2) return showToast('Нужно минимум 2 спортсмена с результатом квалификации');
  state.bracketSize = Number($('#bracketSize').value);
  groupState().bracket = buildBracket(state.selectedGroup, state.bracketSize);
  state.phase = 'finals';
  persist(); renderAll();
  showToast(`Сетка ${state.bracketSize === 4 ? '1/4' : '1/8'} финала собрана`);
}

function switchAttempt() {
  state.attempt = state.attempt === 1 ? 2 : 1;
  const queue = qualificationOrder(state.selectedGroup, state.attempt);
  state.lanes = [{ athleteId: queue[0]?.id || null, time: null, running: false }, { athleteId: queue[1]?.id || null, time: null, running: false }];
  persist(); renderAll();
}

function wireEvents() {
  $('#importBtn').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (event) => { if (event.target.files[0]) importWorkbook(event.target.files[0]); event.target.value = ''; });
  $('#bleBtn').addEventListener('click', connectBle);
  $('#disconnectBtn').addEventListener('click', disconnectBle);
  $('#startBtn').addEventListener('click', startLanes);
  $('#resetBtn').addEventListener('click', resetLanes);
  $('#advanceAttemptBtn').addEventListener('click', switchAttempt);
  $('#generateBracketBtn').addEventListener('click', generateBracket);
  $('#clearRosterBtn').addEventListener('click', clearRoster);
  $('#demoBtn').addEventListener('click', loadDemo);
  $('#confirmImportBtn').addEventListener('click', confirmImport);
  $('#cancelImportBtn').addEventListener('click', cancelImport);
  $('#cancelImportBtnBottom').addEventListener('click', cancelImport);
  $('#eventName').addEventListener('change', () => { state.eventName = $('#eventName').value; persist(); });
  $('#eventDate').addEventListener('change', () => { state.eventDate = $('#eventDate').value; persist(); });
  $$('.phase-tab').forEach((button) => button.addEventListener('click', () => { state.phase = button.dataset.phase; persist(); renderPanels(); renderBracket(); }));
  $$('.attempt-tab').forEach((button) => button.addEventListener('click', () => { if (state.attempt !== Number(button.dataset.attempt)) switchAttempt(); }));
  $('#bracketSize').addEventListener('change', () => { state.bracketSize = Number($('#bracketSize').value); persist(); });
}

wireEvents();
renderAll();
setInterval(() => { if (state.lanes.some((lane) => lane.running)) renderLanes(); }, 500);
window.addEventListener('beforeunload', () => persist());
