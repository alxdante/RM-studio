const SERVICE_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50100406e';
const RX_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50200406e';
const TX_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50300406e';
const BLE_PROFILES = [{ service: SERVICE_UUID, rx: RX_UUID, tx: TX_UUID }, { service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', rx: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', tx: '6e400003-b5a3-f393-e0a9-e50e24dcca9e' }];
const STORAGE_KEY = 'slalom-timing-control-v4';
const THEME_KEY = 'slalom-timing-theme';

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const button = $('#themeToggle');
  if (button) { button.textContent = dark ? 'LIGHT' : 'DARK'; button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); }
}
function toggleTheme() { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem(THEME_KEY, next); applyTheme(next); }

const STANDARD_AGE_GROUPS = [
  { id: 'g8', label: '8–9 лет', short: '8—9', min: 8, max: 9, male: 'мальчики', female: 'девочки', standard: true },
  { id: 'g10', label: '10–14 лет', short: '10—14', min: 10, max: 14, male: 'юноши', female: 'девушки', standard: true },
  { id: 'g15', label: '15–18 лет', short: '15—18', min: 15, max: 18, male: 'юноши', female: 'девушки', standard: true },
  { id: 'g19', label: '19+ лет', short: '19+', min: 19, max: 150, male: 'мужчины', female: 'женщины', standard: true }
];
function storedAgeGroups() { if (typeof localStorage === 'undefined' || (typeof location !== 'undefined' && location.search.includes('factory-reset='))) return [...STANDARD_AGE_GROUPS]; try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (Array.isArray(saved?.ageGroups)) return saved.ageGroups; return [...STANDARD_AGE_GROUPS, ...(Array.isArray(saved?.customAgeGroups) ? saved.customAgeGroups : [])]; } catch (_) { return [...STANDARD_AGE_GROUPS]; } }
const AGE_GROUPS = storedAgeGroups();
const FINAL_SIZES = [4, 8, 16, 32, 64];
const DEMO_ROSTER = [
  ['Алиса Морозова', 8, 'девочки', 'Москва', 'Roller Lab', 842], ['Тимур Алиев', 9, 'мальчики', 'Казань', 'Vortex', 776],
  ['Ева Ким', 9, 'девочки', 'Москва', 'Flow Kids', 918], ['Марк Волков', 8, 'мальчики', 'Сочи', 'South Wheels', 704],
  ['София Лебедева', 12, 'девушки', 'Санкт-Петербург', 'North Line', 956], ['Илья Миронов', 14, 'юноши', 'Казань', 'Vortex', 812],
  ['Полина Барышева', 13, 'девушки', 'Москва', 'Roller Lab', 889], ['Арсений Соколов', 11, 'юноши', 'Тула', 'Spin City', 745],
  ['Дарья Орлова', 16, 'девушки', 'Москва', 'Flow Team', 978], ['Никита Власов', 18, 'юноши', 'Санкт-Петербург', 'North Line', 901],
  ['Ксения Фёдорова', 17, 'девушки', 'Сочи', 'South Wheels', 838], ['Лев Андреев', 21, 'мужчины', 'Москва', 'Roller Lab', 965],
  ['Анна Крылова', 25, 'женщины', 'Казань', 'Vortex', 884], ['Роман Зайцев', 32, 'мужчины', 'Санкт-Петербург', 'North Line', 821]
].map(([name, age, gender, city, club, rating], index) => ({ id: `demo-${index + 1}`, name, age, gender: normalizeGenderKey(gender, age), city, club, rating, source: 'demo' }));

const EXTRA_DEMO_NAMES = ['Артём Козлов','Михаил Егоров','Вера Панина','Иван Беляев','Лиза Романова','Данил Фомин','Нина Тихонова','Степан Комаров','Майя Громова','Пётр Нестеров','Лада Сафонова','Глеб Макаров','Мила Жукова','Олег Воронцов','Элина Котова','Ярослав Брагин','Злата Уварова','Матвей Лосев','Ирина Власова','Семён Дорофеев','Таисия Боброва','Родион Мельников','Агата Лукина','Филипп Гусев'];
const EXTRA_DEMO_AGES = [8,9,8,10,11,12,13,14,15,16,17,18,19,21,24,27,31,34,8,10,12,15,17,22];
DEMO_ROSTER.push(...EXTRA_DEMO_NAMES.map((name, index) => { const age = EXTRA_DEMO_AGES[index]; const female = index % 3 === 0; const gender = normalizeGenderKey(female ? 'девочки' : 'мальчики', age); return { id: `demo-extra-${index + 1}`, name, age, gender, city: 'Демо', club: index % 2 ? 'Flow Team' : 'Roller Lab', rating: 620 + index * 13, birthDate: `01.0${(index % 9) + 1}.${new Date().getFullYear() - age}`, source: 'demo' }; }));
DEMO_ROSTER.forEach((athlete, index) => { athlete.birthDate = athlete.birthDate || `01.${String((index % 9) + 1).padStart(2, '0')}.${new Date().getFullYear() - athlete.age}`; });

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function matchingAgeGroupForAge(age) { return sortedAgeGroups().sort((a, b) => Number(b.min) - Number(a.min)).find((group) => Number(age) >= group.min && Number(age) <= group.max) || null; }
function ageGroupForAge(age) { return matchingAgeGroupForAge(age) || sortedAgeGroups()[sortedAgeGroups().length - 1]; }
function normalizeGenderKey(value, age) {
  const text = String(value ?? '').trim().toLowerCase().replace(/ё/g, 'е');
  const female = /жен|дев|girl|female|woman|women|(^|[\s./_-])[ждf](?=$|[\s./_-])/i.test(text);
  const male = /муж|маль|юнош|boy|male|man|men|(^|[\s./_-])[мm](?=$|[\s./_-])/i.test(text);
  if (female) return Number(age) >= 19 ? 'women' : 'girls';
  if (male) return Number(age) >= 19 ? 'men' : 'boys';
  return Number(age) >= 19 ? 'men' : 'boys';
}
function genderLabel(key) { return ({ boys: 'мальчики', girls: 'девочки', men: 'мужчины', women: 'женщины' })[key] || key; }
function categoryDefinitionsForAge(age) { const adult = age.min >= 19; return [{ id: `${age.id}-${adult ? 'men' : 'boys'}`, ageId: age.id, gender: adult ? 'men' : 'boys', label: `${age.label} · ${age.male}`, short: `${age.short} · ${adult ? 'муж.' : age.male.slice(0, -2)}` }, { id: `${age.id}-${adult ? 'women' : 'girls'}`, ageId: age.id, gender: adult ? 'women' : 'girls', label: `${age.label} · ${age.female}`, short: `${age.short} · ${adult ? 'жен.' : age.female.slice(0, -2)}` }]; }
function categoryDefinitions() { return AGE_GROUPS.flatMap(categoryDefinitionsForAge); }
function sortedAgeGroups() { return [...AGE_GROUPS].sort((a, b) => Number(a.min) - Number(b.min) || Number(a.max) - Number(b.max) || a.label.localeCompare(b.label, 'ru')); }
const CATEGORIES = categoryDefinitions();
function categoryById(id) { return CATEGORIES.find((category) => category.id === id) || CATEGORIES[0]; }
function categoryForAthlete(athlete) { const age = ageGroupForAge(athlete.age); const gender = normalizeGenderKey(athlete.gender, athlete.age); return categoryById(`${age.id}-${gender}`); }
function categoryLabelForAthlete(athlete) { return categoryForAthlete(athlete).label; }
function activeCategoryIds() { const enabled = Array.isArray(state.enabledCategories) ? state.enabledCategories : CATEGORIES.filter((category) => state.enabledAgeGroups?.includes(category.ageId)).map((category) => category.id); return CATEGORIES.filter((category) => athletesForCategory(category.id).length > 0 || enabled.includes(category.id)).map((category) => category.id); }

function emptyCategoryState() { return { attempt: 1, attempts: { 1: {}, 2: {} }, rawAttempts: { 1: {}, 2: {} }, penalties: { 1: {}, 2: {} }, dq: { 1: {}, 2: {} }, falseStarts: { 1: {}, 2: {} }, finalSize: 4, bracket: null, selectedMatchId: null, selectedRaceIndex: 0, standings: [] }; }
function emptyFrsState() { return { serverUrl: '', eventId: null, writeToken: '', viewToken: '', revision: 0, pendingChanges: [], online: false }; }
function createCategoryStates() { return Object.fromEntries(CATEGORIES.map((category) => [category.id, emptyCategoryState()])); }
function createLane(categoryId = null) { return { categoryId, athleteId: null, time: null, penalties: 0, dq: false, falseStarts: 0, running: false, startedAt: null, error: null, queueHistory: [], pendingResult: null, reviewOnly: false, historyDqTime: null }; }
function firstActiveCategory(exclude = [], roster = DEMO_ROSTER) { const ids = CATEGORIES.filter((category) => roster.some((athlete) => categoryForAthlete(athlete).id === category.id)).map((category) => category.id); return ids.find((id) => !exclude.includes(id)) || ids[0] || CATEGORIES[0].id; }
function lanesForRoster(roster = DEMO_ROSTER) { const first = firstActiveCategory([], roster); const second = firstActiveCategory([first], roster); return [createLane(first), createLane(second === first ? CATEGORIES[1]?.id || CATEGORIES[0].id : second)]; }

function createInitialState() {
  const roster = [];
  const state = { eventName: 'Urban Flow Open', eventDate: new Date().toISOString().slice(0, 10), phase: 'qualification', roster, enabledAgeGroups: AGE_GROUPS.map((group) => group.id), enabledCategories: CATEGORIES.map((category) => category.id), ageGroups: [...AGE_GROUPS], customAgeGroups: AGE_GROUPS.filter((group) => !group.standard), categories: createCategoryStates(), lanes: lanesForRoster(roster), selectedFinalCategory: CATEGORIES[0].id, activity: [], raceLog: [], frs: emptyFrsState() };
  state.lanes.forEach((lane) => { lane.athleteId = state.roster.filter((athlete) => categoryForAthlete(athlete).id === lane.categoryId).sort((a, b) => Number(a.rating) - Number(b.rating))[0]?.id || null; });
  return state;
}

function normalizeRating(value) { const raw = String(value ?? '').trim().replace(/\s+/g, ''); if (!raw) return 0; const parsed = Number(raw.replace(',', '.')); return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0; }
function normalizeRoster(roster) { return roster.map((athlete, index) => ({ ...athlete, id: athlete.id || `athlete-${Date.now()}-${index}`, age: Number(athlete.age), rating: normalizeRating(athlete.rating), gender: normalizeGenderKey(athlete.gender, athlete.age), birthDate: athlete.birthDate || `01.01.${new Date().getFullYear() - Number(athlete.age)}` })); }
function migrateState(saved) {
  const base = createInitialState();
  const roster = normalizeRoster(saved.roster || DEMO_ROSTER);
  const categories = createCategoryStates();
  if (saved.categories) {
    CATEGORIES.forEach((category) => { const old = saved.categories[category.id] || {}; categories[category.id] = { ...categories[category.id], ...old, attempts: { 1: {}, 2: {}, ...(old.attempts || {}) }, rawAttempts: { 1: {}, 2: {}, ...(old.rawAttempts || {}) }, penalties: { 1: {}, 2: {}, ...(old.penalties || {}) }, dq: { 1: {}, 2: {}, ...(old.dq || {}) }, falseStarts: { 1: {}, 2: {}, ...(old.falseStarts || {}) }, finalSize: FINAL_SIZES.includes(Number(old.finalSize)) ? Number(old.finalSize) : 4 }; });
  } else if (saved.groups) {
    AGE_GROUPS.forEach((age) => { const old = saved.groups[age.id]; if (!old) return; const target = categories[`${age.id}-boys`]; target.attempts = { 1: { ...(old.attempts?.[1] || {}) }, 2: { ...(old.attempts?.[2] || {}) } }; });
  }
  Object.values(categories).forEach((category) => { category.dq ||= { 1: {}, 2: {} }; [1, 2].forEach((attempt) => { category.dq[attempt] ||= {}; Object.entries(category.penalties[attempt] || {}).forEach(([athleteId, value]) => { if (Number(value) >= 5) category.dq[attempt][athleteId] = true; }); }); });
  const savedLanes = Array.isArray(saved.lanes) && saved.lanes.length ? saved.lanes : base.lanes;
  const enabledAgeGroups = AGE_GROUPS.map((group) => group.id);
  const enabledCategories = CATEGORIES.map((category) => category.id);
  const lanes = savedLanes.slice(0, 2).map((lane, index) => ({ ...createLane(lane.categoryId || base.lanes[index]?.categoryId || CATEGORIES[index].id), ...lane, running: false, startedAt: null }));
  while (lanes.length < 2) lanes.push(createLane(CATEGORIES[lanes.length].id));
  const savedPhase = saved.phase === 'finals' ? 'finals' : 'qualification';
  const phaseLanes = saved.phaseLanes || { qualification: savedPhase === 'qualification' ? lanes : lanesForRoster(roster), finals: savedPhase === 'finals' ? lanes : [createLane(), createLane()] };
  const next = { ...base, ...saved, roster, enabledAgeGroups, enabledCategories, ageGroups: [...AGE_GROUPS], customAgeGroups: AGE_GROUPS.filter((group) => !group.standard), categories, selectedFinalCategory: saved.selectedFinalCategory || firstActiveCategory([], roster), lanes, phaseLanes, raceLog: Array.isArray(saved.raceLog) ? saved.raceLog : [], frs: { ...emptyFrsState(), ...(saved.frs || {}), pendingChanges: Array.isArray(saved.frs?.pendingChanges) ? saved.frs.pendingChanges : [] } };
  return next;
}
const isFactoryReset = typeof location !== 'undefined' && location.search.includes('factory-reset=');
let state;
try { state = isFactoryReset ? createInitialState() : migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch (error) { state = createInitialState(); }
if (isFactoryReset && typeof history !== 'undefined') history.replaceState(null, '', `${location.pathname}${location.hash}`);
function ensurePhaseLanes() { state.phaseLanes ||= { qualification: state.lanes || lanesForRoster(state.roster), finals: [createLane(), createLane()] }; state.phaseLanes.qualification ||= lanesForRoster(state.roster); state.phaseLanes.finals ||= [createLane(), createLane()]; state.lanes = state.phaseLanes[state.phase] || state.phaseLanes.qualification; }
ensurePhaseLanes();
let ble = { device: null, server: null, rx: null, tx: null, connected: false, buffer: '', reconnectTimer: null, reconnectAttempt: 0, manualDisconnect: false };
let pendingModeChange = null;
let bleState = {
  mode: null,
  raceDisable: false,
  qualificationDisable: false,
  errors: { 1: null, 2: null }
};
let timerHandle = null;
let toastHandle = null;
let pendingImport = null;
let xlsxLoader = null;

function ensureXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxLoader) return xlsxLoader;
  xlsxLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'xlsx.full.min.js';
    script.async = true;
    script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('XLSX library is unavailable'));
    script.onerror = () => reject(new Error('XLSX library failed to load'));
    document.head.append(script);
  });
  return xlsxLoader;
}

function persist(message = 'Сохранено только что') { ensurePhaseLanes(); state.phaseLanes[state.phase] = state.lanes; state.eventName = $('#eventName')?.value || state.eventName; state.eventDate = $('#eventDate')?.value || state.eventDate; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); if ($('#saveStatus')) $('#saveStatus').textContent = message; }
let frsSyncTimer = null; let frsFullSyncTimer = null;
function setFrsStatus(online, message = online ? 'online' : 'offline') { state.frs ||= emptyFrsState(); state.frs.online = online; const indicator = $('#frsOnlineStatus'); if (indicator) { indicator.textContent = message; indicator.classList.toggle('online', online); } }
function frsApiUrl(pathname) { return `${String(state.frs?.serverUrl || '').replace(/\/$/, '')}${pathname}`; }
function queueFrsChange(record) { if (!state.frs?.eventId || !state.frs.serverUrl || !record?.id) return; state.frs.pendingChanges ||= []; const index = state.frs.pendingChanges.findIndex((item) => item.id === record.id); if (index >= 0) state.frs.pendingChanges[index] = record; else state.frs.pendingChanges.push(record); scheduleFrsSync(); }
function scheduleFrsSync() { clearTimeout(frsSyncTimer); frsSyncTimer = setTimeout(() => syncFrsJournal().catch(() => setFrsStatus(false)), 350); }
async function syncFrsJournal({ full = false } = {}) { if (!state.frs?.eventId || !state.frs.serverUrl || !state.frs.writeToken || (!full && !state.frs.pendingChanges?.length)) return; const body = { eventName: state.eventName, raceLog: full ? state.raceLog : [], changes: full ? [] : state.frs.pendingChanges }; const response = await fetch(frsApiUrl(`/api/events/${encodeURIComponent(state.frs.eventId)}/sync`), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.frs.writeToken}` }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`FRS sync failed: ${response.status}`); const result = await response.json(); state.frs.revision = result.revision || state.frs.revision; state.frs.pendingChanges = []; setFrsStatus(true); persist('Синхронизировано с ФРС'); return result; }
async function connectFrsServer() { const serverUrl = String($('#frsServerUrl')?.value || '').trim().replace(/\/$/, ''); const writeToken = String($('#frsWriteToken')?.value || '').trim(); if (!serverUrl) return showToast('Укажите адрес сервера ФРС'); state.frs = { ...emptyFrsState(), ...state.frs, serverUrl, writeToken, online: false }; setFrsStatus(false, 'connecting'); const response = await fetch(frsApiUrl('/api/events/connect'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(writeToken ? { Authorization: `Bearer ${writeToken}` } : {}) }, body: JSON.stringify({ eventName: state.eventName, writeToken }) }); if (!response.ok) throw new Error(`FRS connect failed: ${response.status}`); const result = await response.json(); state.frs.eventId = result.eventId; state.frs.writeToken = result.writeToken || writeToken; state.frs.viewToken = result.viewToken || ''; state.frs.revision = result.revision || 0; $('#frsWriteToken').value = state.frs.writeToken; await syncFrsJournal({ full: true }); clearInterval(frsFullSyncTimer); frsFullSyncTimer = setInterval(() => syncFrsJournal({ full: true }).catch(() => setFrsStatus(false)), 5 * 60 * 1000); persist('Подключено к ФРС'); showToast('Сервер ФРС подключён'); }
function openFrsConnectModal() { $('#frsServerUrl').value = state.frs?.serverUrl || 'http://127.0.0.1:8787'; $('#frsWriteToken').value = state.frs?.writeToken || ''; $('#frsEventName').textContent = state.eventName; $('#frsConnectModal').classList.remove('hidden'); }
function closeFrsConnectModal() { $('#frsConnectModal').classList.add('hidden'); }
function appendRaceLog(entry) { state.raceLog ||= []; const source = entry.source || 'manual'; const existing = entry.raceKey ? latestRaceLog((item) => item.raceKey === entry.raceKey) : null; if (existing && source === 'manual') { Object.assign(existing, entry, { source, updatedAt: Date.now(), revision: existing.revision || 1 }); queueFrsChange(existing); return existing; } const record = { id: `race-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: Date.now(), ...entry, source, ...(existing && source === 'ble' ? { correction: true, correctionOf: existing.id } : {}) }; state.raceLog.push(record); if (state.raceLog.length > 5000) state.raceLog = state.raceLog.slice(-5000); queueFrsChange(record); return record; }
function latestRaceLog(filter) { return (state.raceLog || []).slice().reverse().find(filter) || null; }
function latestQualificationLog(categoryId, athleteId, attempt) { const superseded = new Set((state.raceLog || []).filter((entry) => entry.correctionOf && entry.correctionAction).map((entry) => entry.correctionOf)); return latestRaceLog((entry) => entry.phase === 'qualification' && !entry.correctionAction && !superseded.has(entry.id) && entry.categoryId === categoryId && entry.athleteId === athleteId && entry.attempt === attempt); }
function finalRaceStoredValue(categoryId, match, raceIndex, athleteId) { const side = match.athlete1 === athleteId ? 'time1' : 'time2'; const penaltyKey = side === 'time1' ? 'penalty1' : 'penalty2'; const falseStartKey = side === 'time1' ? 'falseStarts1' : 'falseStarts2'; const sourceKey = side === 'time1' ? 'source1' : 'source2'; const race = ensureMatchRaces(match)[raceIndex] || {}; const hasValue = race[side] !== null && race[side] !== undefined; return { value: hasValue ? race[side] : null, penalties: hasValue ? Number(race[penaltyKey] || 0) : 0, falseStarts: hasValue ? Number(race[falseStartKey] || 0) : 0, source: race[sourceKey] || '' }; }
function hasActiveTimers() {
  const phaseLanes = Object.values(state.phaseLanes || {});
  return phaseLanes.some((lanes) => Array.isArray(lanes) && lanes.some((lane) => lane?.running));
}
function phaseToBleMode(phase) { return phase === 'qualification' ? 'qualification' : 'race'; }
function phaseToBleCommand(phase) { return phase === 'qualification' ? 'Q' : 'R'; }
function currentModeDisabled() { return state.phase === 'qualification' ? bleState.qualificationDisable : bleState.raceDisable; }
function modeDisabledLabel() { return state.phase === 'qualification' ? 'qualification_disable' : 'race_disable'; }
function modeIsSynchronized() { return ble.connected && bleState.mode === phaseToBleMode(state.phase); }
function clearBleTelemetry() { ble.buffer = ''; bleState = { mode: null, raceDisable: false, qualificationDisable: false, errors: { 1: null, 2: null } }; renderLanes(); renderBle(); }
function switchPhase(phase, { notifyBle = true } = {}) {
  if (!['qualification', 'finals'].includes(phase) || phase === state.phase) return false;
  if (hasActiveTimers()) {
    showToast('Нельзя сменить режим: таймер запущен');
    return false;
  }
  ensurePhaseLanes();
  state.phaseLanes[state.phase] = state.lanes;
  state.phase = phase;
  if (phase === 'finals') {
    state.selectedFinalCategory = null;
    state.lanes = [createLane(), createLane()];
    state.phaseLanes.finals = state.lanes;
  } else {
    state.lanes = state.phaseLanes[phase];
  }
  pendingModeChange = null;
  persist();
  renderAll();
  if (notifyBle) sendBleModeCommand(phaseToBleCommand(phase));
  return true;
}
function athletesForCategory(categoryId, sourceState = state) { return (sourceState.roster || []).filter((athlete) => categoryForAthlete(athlete).id === categoryId); }
function athleteById(id) { return state.roster.find((athlete) => athlete.id === id) || null; }
function categoryState(categoryId) { if (!state.categories[categoryId]) state.categories[categoryId] = emptyCategoryState(); return state.categories[categoryId]; }
function getTime(categoryId, athleteId, attempt) { return categoryState(categoryId).attempts?.[attempt]?.[athleteId] ?? null; }
function getPenalty(categoryId, athleteId, attempt) { return Number(categoryState(categoryId).penalties?.[attempt]?.[athleteId] || 0); }
function isQualificationDQ(categoryId, athleteId, attempt) { return Boolean(categoryState(categoryId).dq?.[attempt]?.[athleteId]); }
function hasRecordedResult(categoryId, athleteId, attempt) { return Number.isFinite(getTime(categoryId, athleteId, attempt)) || isQualificationDQ(categoryId, athleteId, attempt); }
function bestTime(categoryId, athleteId) { const values = [1, 2].map((attempt) => isQualificationDQ(categoryId, athleteId, attempt) ? null : getTime(categoryId, athleteId, attempt)).filter((value) => Number.isFinite(value)); return values.length ? Math.min(...values) : null; }
function formatTime(value) { return Number.isFinite(value) ? `${Number(value).toFixed(3)} s` : '—'; }
function formatBestTime(value) { return Number.isFinite(value) ? Number(value).toFixed(3) : '—'; }
function formatClock(value) { return Number.isFinite(value) ? Number(value).toFixed(3) : '0.000'; }
function birthYearOnly(value) { const raw = String(value ?? '').trim(); const match = raw.match(/^(\d{4})(?:\.0+)?$/); const year = match ? Number(match[1]) : NaN; return year >= 1900 && year <= 2100 ? year : null; }
function parseBirthDateValue(value) { const yearOnly = birthYearOnly(value); if (yearOnly) return new Date(Date.UTC(yearOnly, 0, 1)); if (value instanceof Date) return new Date(value.getTime()); if (typeof value === 'number' && Number.isFinite(value)) return new Date(Date.UTC(1899, 11, 30) + value * 86400000); const raw = String(value ?? '').trim(); if (!raw) return null; if (/^\d{4,6}(?:\.0+)?$/.test(raw)) return new Date(Date.UTC(1899, 11, 30) + Number(raw) * 86400000); const rus = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+.*)?$/); const parsed = rus ? new Date(Number(rus[3]), Number(rus[2]) - 1, Number(rus[1])) : new Date(raw); return Number.isNaN(parsed.getTime()) ? null : parsed; }
function normalizeBirthDate(value) { const yearOnly = birthYearOnly(value); if (yearOnly) return String(yearOnly); const parsed = parseBirthDateValue(value); return parsed ? `${String(parsed.getDate()).padStart(2, '0')}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${parsed.getFullYear()}` : String(value ?? '').trim(); }
function formatBirthDate(value) { if (!value) return 'дата не указана'; const yearOnly = birthYearOnly(value); if (yearOnly) return String(yearOnly); const parsed = parseBirthDateValue(value); return parsed ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed) : String(value); }
function ageFromBirthDate(value, referenceDate = state?.eventDate || new Date().toISOString().slice(0, 10)) { const birth = parseBirthDateValue(value); const reference = new Date(`${referenceDate}T12:00:00`); if (!birth || Number.isNaN(reference.getTime())) return NaN; return reference.getFullYear() - birth.getFullYear(); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function showToast(text) { const toast = $('#toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(toastHandle); toastHandle = setTimeout(() => toast.classList.remove('show'), 2900); }
function addActivity(text) { state.activity = [{ at: Date.now(), text }, ...(state.activity || [])].slice(0, 20); persist(); }

function qualificationOrder(categoryId, attempt = categoryState(categoryId).attempt) {
  const baseOrder = athletesForCategory(categoryId).slice().sort((a, b) => Number(a.rating) - Number(b.rating) || a.name.localeCompare(b.name, 'ru'));
  if (attempt === 1) {
    const waiting = baseOrder.filter((athlete) => !hasRecordedResult(categoryId, athlete.id, 1));
    const finished = baseOrder.filter((athlete) => hasRecordedResult(categoryId, athlete.id, 1)).sort((a, b) => (isQualificationDQ(categoryId, b.id, 1) ? Infinity : getTime(categoryId, b.id, 1)) - (isQualificationDQ(categoryId, a.id, 1) ? Infinity : getTime(categoryId, a.id, 1)) || a.name.localeCompare(b.name, 'ru'));
    return [...waiting, ...finished];
  }
  if (attempt === 2) {
    const waiting = baseOrder.filter((athlete) => !hasRecordedResult(categoryId, athlete.id, 2)).sort((a, b) => getTime(categoryId, b.id, 1) - getTime(categoryId, a.id, 1) || Number(a.rating) - Number(b.rating) || a.name.localeCompare(b.name, 'ru'));
    const finished = baseOrder.filter((athlete) => hasRecordedResult(categoryId, athlete.id, 2)).sort((a, b) => { const aDQ = isQualificationDQ(categoryId, a.id, 2); const bDQ = isQualificationDQ(categoryId, b.id, 2); if (aDQ !== bDQ) return aDQ ? -1 : 1; if (aDQ && bDQ) return normalizeRating(a.rating) - normalizeRating(b.rating) || a.name.localeCompare(b.name, 'ru'); const aBest = bestTime(categoryId, a.id); const bBest = bestTime(categoryId, b.id); return (bBest ?? -Infinity) - (aBest ?? -Infinity) || normalizeRating(a.rating) - normalizeRating(b.rating) || a.name.localeCompare(b.name, 'ru'); });
    return [...waiting, ...finished];
  }
  return baseOrder.sort((a, b) => { const aBest = bestTime(categoryId, a.id); const bBest = bestTime(categoryId, b.id); if (!Number.isFinite(aBest) && Number.isFinite(bBest)) return -1; if (Number.isFinite(aBest) && !Number.isFinite(bBest)) return 1; return (bBest ?? -Infinity) - (aBest ?? -Infinity) || Number(a.rating) - Number(b.rating) || a.name.localeCompare(b.name, 'ru'); });
}
// When one category is assigned to both qualification lanes, keep the athlete
// already occupying the other lane out of this lane's candidates. This makes
// the shared category queue advance alternately instead of duplicating a start.
function reservedAthletes(categoryId, laneIndex) { return state.lanes.filter((lane, index) => index !== laneIndex && lane.categoryId === categoryId && lane.athleteId).map((lane) => lane.athleteId); }
function pendingForCategory(categoryId, laneIndex = -1, sourceState = state) { const category = categoryState(categoryId); if (category.attempt > 2) return []; const attempt = category.attempt; const reserved = sourceState === state ? reservedAthletes(categoryId, laneIndex) : []; return qualificationOrder(categoryId, attempt).filter((athlete) => !hasRecordedResult(categoryId, athlete.id, attempt) && !reserved.includes(athlete.id)); }
function nextAthleteForLane(index) { const lane = state.lanes[index]; if (!lane?.categoryId) return null; const skipped = new Set(lane.queueHistory || []); const candidates = pendingForCategory(lane.categoryId, index).filter((athlete) => athlete.id !== lane.athleteId && !skipped.has(athlete.id)); const reserved = new Set(state.lanes.filter((other, otherIndex) => otherIndex !== index && other.categoryId === lane.categoryId && other.athleteId).map((other) => other.athleteId)); for (let otherIndex = 0; otherIndex < index; otherIndex += 1) { const other = state.lanes[otherIndex]; if (other.categoryId !== lane.categoryId) continue; const otherSkipped = new Set(other.queueHistory || []); const otherNext = pendingForCategory(other.categoryId, otherIndex).find((athlete) => athlete.id !== other.athleteId && !otherSkipped.has(athlete.id) && !reserved.has(athlete.id)); if (otherNext) reserved.add(otherNext.id); } return candidates.find((athlete) => !reserved.has(athlete.id)) || null; }
function finishedCount(categoryId, attempt) { return athletesForCategory(categoryId).filter((athlete) => hasRecordedResult(categoryId, athlete.id, attempt)).length; }
function categoryComplete(categoryId, attempt) { const total = athletesForCategory(categoryId).length; return total > 0 && finishedCount(categoryId, attempt) >= total; }
function autoAssignLanes() { state.lanes.forEach((lane, index) => { if (!lane.categoryId || lane.athleteId || categoryState(lane.categoryId).attempt > 2) return; lane.athleteId = pendingForCategory(lane.categoryId, index)[0]?.id || null; }); }
function prepareLaneForStart(index) { const lane = state.lanes[index]; if (!lane) return; if (state.phase === 'finals') { const category = categoryState(state.selectedFinalCategory); const match = category.bracket?.matches?.find((item) => item.id === category.selectedMatchId); const race = match && ensureMatchRaces(match)[category.selectedRaceIndex]; if (match?.winnerId) { showToast('Пара завершена — выберите другую пару'); return false; } if (race && (race.time1 !== null || race.time2 !== null)) { showToast('Заезд уже начат — выберите следующий заезд после второго результата'); return false; } commitFinalLaneResult(index); return true; } if (state.phase !== 'qualification' || !lane.categoryId) return; if (categoryState(lane.categoryId).attempt > 2) { lane.athleteId = null; lane.time = null; lane.running = false; return; } const committed = commitLaneResult(index); const attempt = categoryState(lane.categoryId).attempt; const recorded = lane.athleteId && attempt <= 2 && hasRecordedResult(lane.categoryId, lane.athleteId, attempt); if (!committed && !recorded) return; const next = pendingForCategory(lane.categoryId, index).find((athlete) => athlete.id !== lane.athleteId) || null; lane.athleteId = next?.id || null; lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.error = null; lane.startedAt = null; }
function advanceCategoryIfComplete(categoryId) { const category = categoryState(categoryId); if (category.attempt === 1 && categoryComplete(categoryId, 1)) { category.attempt = 2; addActivity(`${categoryById(categoryId).label} · попытка 01 завершена, очередь 02 готова`); } if (category.attempt === 2 && categoryComplete(categoryId, 2)) { category.attempt = 3; addActivity(`${categoryById(categoryId).label} · квалификация завершена, финальный посев готов`); } }

function renderSummary() {
  const active = activeCategoryIds(); const ready = active.filter((id) => categoryState(id).attempt > 2).length;
  $('#eventName').value = state.eventName; $('#eventDate').value = state.eventDate; $('#queueMeta').textContent = `${active.length} ${active.length === 1 ? 'category' : 'categories'}`; $('#categoryMeta').textContent = `${ready} / ${active.length} KO`; }

function laneCategoryPicker(lane, laneIndex) {
  const isEnabled = (category) => Array.isArray(state.enabledCategories) ? state.enabledCategories.includes(category.id) : state.enabledAgeGroups?.includes(category.ageId);
  const visibleAges = sortedAgeGroups().filter((age) => categoryDefinitionsForAge(age).some((definition) => isEnabled(definition) || athletesForCategory(definition.id).length > 0));
  const renderGenderRow = (gender) => { const rowAges = visibleAges.filter((age) => { const ageGender = age.min >= 19 ? (gender === 'girls' ? 'women' : 'men') : gender; const category = categoryById(`${age.id}-${ageGender}`); return isEnabled(category) || athletesForCategory(category.id).length > 0; }); const columnStyle = `style="grid-template-columns: repeat(${Math.max(1, rowAges.length)}, minmax(0, 1fr));"`; return `<div class="lane-tab-row"><div class="lane-tabs" role="tablist" ${columnStyle}>${rowAges.map((age) => { const ageGender = age.min >= 19 ? (gender === 'girls' ? 'women' : 'men') : gender; const category = categoryById(`${age.id}-${ageGender}`); const count = athletesForCategory(category.id).length; const genderLabel = gender === 'girls' ? age.female : age.male; const completed = categoryState(category.id).attempt > 2; const finalsMode = state.phase === 'finals'; const selectable = finalsMode ? completed : true; return `<button class="lane-tab ${category.id === lane.categoryId || (finalsMode && category.id === state.selectedFinalCategory) ? 'active' : ''} ${completed ? 'completed' : ''} ${completed && !finalsMode ? 'viewable' : ''} ${finalsMode && !completed ? 'unavailable' : ''}" ${selectable ? '' : 'disabled'} data-lane-tab="${laneIndex}" data-category-id="${category.id}"><span class="lane-tab-gender">${escapeHtml(genderLabel)}</span><span class="lane-tab-age">${escapeHtml(age.label)}</span><small>${count}</small></button>`; }).join('')}</div></div>`; };
  return `<div class="lane-group-picker" data-lane-picker="${laneIndex}">${renderGenderRow('girls')}${renderGenderRow('boys')}</div>`;
}
function categoryHasAthletes(categoryId) { return athletesForCategory(categoryId).length > 0; }
function demoStartAllowed() {
  if (state.phase === 'finals') return !categoryState(state.selectedFinalCategory).bracket;
  if (state.phase !== 'qualification') return false;
  return !activeCategoryIds().some((categoryId) => athletesForCategory(categoryId).length > 0);
}
function renderAgeGroupEditor() { const host = $('#ageGroupEditorList'); if (!host) return; host.innerHTML = sortedAgeGroups().map((age) => { const definitions = categoryDefinitionsForAge(age); const total = definitions.reduce((sum, category) => sum + athletesForCategory(category.id).length, 0); const categories = definitions.map((category) => { const count = athletesForCategory(category.id).length; return `<div class="age-editor-category"><div><strong>${escapeHtml(category.label.split(' · ')[1])}</strong><small>${count} уч.</small></div></div>`; }).join(''); return `<article class="age-editor-row"><div class="age-editor-head"><div><strong>${escapeHtml(age.label)}</strong><small>группа · ${total} уч.</small></div><button type="button" class="text-button age-editor-remove" data-remove-age-group="${age.id}" ${total ? 'disabled' : ''}>Удалить группу</button></div><div class="age-editor-categories">${categories}</div></article>`; }).join(''); }
function openAddGroup() { renderAgeGroupEditor(); $('#addGroupModal').classList.remove('hidden'); }
function closeAddGroup() { $('#addGroupModal').classList.add('hidden'); }
function persistAgeGroupState() { state.ageGroups = [...AGE_GROUPS]; state.customAgeGroups = AGE_GROUPS.filter((group) => !group.standard); state.enabledCategories = (state.enabledCategories || []).filter((id) => CATEGORIES.some((category) => category.id === id)); state.enabledAgeGroups = AGE_GROUPS.map((group) => group.id); persist(); }
function removeAgeGroup(ageId) { const age = AGE_GROUPS.find((group) => group.id === ageId); if (!age) return; if (AGE_GROUPS.length <= 1) return showToast('Нельзя удалить последнюю возрастную группу'); const definitions = categoryDefinitionsForAge(age); if (definitions.some((category) => categoryHasAthletes(category.id))) return showToast('Нельзя удалить группу: в ней есть участники'); const ids = new Set(definitions.map((category) => category.id)); state.enabledCategories = (state.enabledCategories || []).filter((id) => !ids.has(id)); AGE_GROUPS.splice(AGE_GROUPS.indexOf(age), 1); ids.forEach((id) => { const categoryIndex = CATEGORIES.findIndex((category) => category.id === id); if (categoryIndex >= 0) CATEGORIES.splice(categoryIndex, 1); delete state.categories[id]; }); state.lanes.forEach((lane) => { if (ids.has(lane.categoryId)) Object.assign(lane, createLane()); }); if (ids.has(state.selectedFinalCategory)) state.selectedFinalCategory = CATEGORIES[0]?.id || null; persistAgeGroupState(); renderAgeGroupEditor(); renderAll(); showToast(`${age.label} удалена`); }
function addCustomAgeGroup() { const min = Number($('#ageGroupMin')?.value); const unlimited = $('#ageGroupUnlimited')?.checked; const max = unlimited ? 150 : Number($('#ageGroupMax')?.value); const genderMode = $('#ageGroupGender')?.value || 'both'; if (!Number.isInteger(min) || min < 1 || min > 150 || !Number.isInteger(max) || max < min || max > 150) return showToast('Укажите корректный диапазон возраста'); if (AGE_GROUPS.some((group) => group.min === min && group.max === max)) return showToast('Такая возрастная группа уже существует'); const adult = min >= 19; const id = `custom-${Date.now()}`; const group = { id, label: unlimited ? `${min}+ лет` : `${min}–${max} лет`, short: unlimited ? `${min}+` : `${min}—${max}`, min, max, male: adult ? 'мужчины' : 'мальчики', female: adult ? 'женщины' : 'девочки', standard: false }; AGE_GROUPS.push(group); const definitions = categoryDefinitionsForAge(group); CATEGORIES.push(...definitions); state.categories ||= {}; definitions.forEach((category) => { state.categories[category.id] = emptyCategoryState(); }); const selected = genderMode === 'male' ? definitions[0].id : genderMode === 'female' ? definitions[1].id : definitions.map((category) => category.id); state.enabledCategories = [...new Set([...(state.enabledCategories || []), ...selected])]; persistAgeGroupState(); $('#ageGroupMin').value = ''; $('#ageGroupMax').value = ''; $('#ageGroupUnlimited').checked = false; $('#ageGroupMax').disabled = false; renderAgeGroupEditor(); renderAll(); showToast(`${group.label} добавлена`); }
function setLaneCategory(index, categoryId) {
  const lane = state.lanes[index];
  if (state.phase === 'finals') { if (categoryState(categoryId).attempt <= 2) return showToast('Сначала завершите обе квалификационные попытки'); commitFinalLaneResult(index); state.selectedFinalCategory = categoryId; lane.categoryId = categoryId; lane.athleteId = null; lane.time = null; lane.pendingResult = null; lane.pendingFinalResult = null; lane.running = false; persist(); renderAll(); return; }
  if (lane.running || lane.pendingResult || Number.isFinite(lane.time)) return showToast('Сначала зафиксируйте результат или выполните сброс до 0.000');
  commitLaneResult(index); state.lanes[index].categoryId = categoryId; state.lanes[index].athleteId = null; state.lanes[index].time = null; state.lanes[index].penalties = 0; state.lanes[index].dq = false; state.lanes[index].falseStarts = 0; state.lanes[index].running = false; autoAssignLanes(); persist(); renderAll();
}
function commitLaneResult(index) {
  const lane = state.lanes[index]; const pending = lane?.pendingResult;
  if (!lane || !pending || !lane.categoryId || !lane.athleteId) return false;
  const category = categoryState(pending.categoryId || lane.categoryId); const attempt = pending.attempt;
  if (attempt > 2 || Number.isFinite(category.attempts[attempt]?.[lane.athleteId])) return false;
  category.rawAttempts ||= { 1: {}, 2: {} }; category.rawAttempts[attempt] ||= {};
  category.dq ||= { 1: {}, 2: {} }; category.dq[attempt] ||= {};
  category.falseStarts ||= { 1: {}, 2: {} }; category.falseStarts[attempt] ||= {};
  category.attempts[attempt][lane.athleteId] = pending.adjustedTime;
  category.rawAttempts[attempt][lane.athleteId] = pending.rawTime;
  category.penalties[attempt][lane.athleteId] = pending.penalties || 0;
  category.dq[attempt][lane.athleteId] = Boolean(pending.dq);
  category.falseStarts[attempt][lane.athleteId] = lane.falseStarts || 0;
  appendRaceLog({ phase: 'qualification', raceKey: `qualification|${pending.categoryId || lane.categoryId}|${lane.athleteId}|${attempt}`, categoryId: pending.categoryId || lane.categoryId, athleteId: lane.athleteId, attempt, rawTime: pending.rawTime, adjustedTime: pending.dq ? null : pending.adjustedTime, penalties: pending.penalties || 0, dq: pending.dq, source: pending.source, correction: Boolean(pending.correction) });
  lane.pendingResult = null;
  addActivity(`${pending.source === 'ble' ? 'BLE' : 'Ручной ввод'} · ${categoryById(pending.categoryId || lane.categoryId).label} · ${athleteById(lane.athleteId)?.name || ''} · ${pending.dq ? 'DQ' : formatTime(pending.adjustedTime)}`);
  advanceCategoryIfComplete(pending.categoryId || lane.categoryId);
  return true;
}
function recalculateLanePenalty(index) {
  const lane = state.lanes[index];
  if (lane?.reviewOnly) return;
  if (lane?.pendingResult) {
    lane.pendingResult.penalties = lane.penalties;
    lane.pendingResult.dq = lane.dq;
    lane.pendingResult.adjustedTime = Number((lane.pendingResult.rawTime + (lane.dq ? 0 : lane.penalties * 0.2)).toFixed(3));
    lane.time = lane.dq ? null : lane.pendingResult.adjustedTime;
  }
  if (state.phase === 'finals' && lane?.pendingFinalResult) {
    lane.pendingFinalResult.penalties = lane.penalties;
    lane.pendingFinalResult.dq = lane.dq;
    lane.pendingFinalResult.adjustedTime = lane.dq ? null : Number((lane.pendingFinalResult.rawTime + lane.penalties * 0.2).toFixed(3));
    lane.time = lane.dq ? null : lane.pendingFinalResult.adjustedTime;
  }
  if (state.phase === 'finals' && lane?.athleteId && !lane.pendingFinalResult) {
    const category = categoryState(state.selectedFinalCategory);
    const activeRaceKey = `${category.selectedMatchId}|${category.selectedRaceIndex}|${lane.athleteId}`;
    if (lane.finalRaceKey !== activeRaceKey) return;
    const match = category.bracket?.matches?.find((item) => item.id === category.selectedMatchId);
    if (match) {
      const side = match.athlete1 === lane.athleteId ? 'time1' : match.athlete2 === lane.athleteId ? 'time2' : null;
      const races = side ? ensureMatchRaces(match) : [];
      const selectedRaceIndex = Number.isInteger(category.selectedRaceIndex) && races[category.selectedRaceIndex] ? category.selectedRaceIndex : -1;
      const raceIndex = selectedRaceIndex >= 0 ? selectedRaceIndex : races.reduce((last, race, current) => race[side] !== null && race[side] !== undefined ? current : last, -1);
      if (side && raceIndex >= 0) {
        const rawTime = Number(lane.finalRawTime);
        races[raceIndex][side] = lane.dq ? 'DQ' : (Number.isFinite(rawTime) ? Number((rawTime + lane.penalties * 0.2).toFixed(3)) : races[raceIndex][side]);
        races[raceIndex][`penalty${side === 'time1' ? 1 : 2}`] = lane.dq ? 5 : lane.penalties;
        lane.time = lane.dq ? null : races[raceIndex][side];
        resolveMatch(state.selectedFinalCategory, match.id);
      }
    }
  }
  if (state.phase === 'qualification' && lane?.athleteId && lane.categoryId) {
    const category = categoryState(lane.categoryId); const attempt = [category.attempt, 1, 2].find((candidate) => candidate <= 2 && Number.isFinite(category.attempts[candidate]?.[lane.athleteId]));
    if (attempt) {
      category.rawAttempts ||= { 1: {}, 2: {} };
      category.rawAttempts[attempt] ||= {};
      category.dq ||= { 1: {}, 2: {} }; category.dq[attempt] ||= {};
      const rawTime = category.rawAttempts[attempt][lane.athleteId] ?? category.attempts[attempt][lane.athleteId];
      category.rawAttempts[attempt][lane.athleteId] = rawTime;
      category.attempts[attempt][lane.athleteId] = Number((rawTime + (lane.dq ? 0 : lane.penalties * 0.2)).toFixed(3));
      category.penalties[attempt][lane.athleteId] = lane.penalties;
      category.dq[attempt][lane.athleteId] = Boolean(lane.dq);
      lane.time = lane.dq ? null : category.attempts[attempt][lane.athleteId];
    }
  }
  persist(); renderAll();
}
function setLanePenalties(index, value) {
  const lane = state.lanes[index];
  if (lane?.reviewOnly) return showToast('Review mode: completed RUN is read-only'); const parsed = Number(value); const numeric = Number.isFinite(parsed) ? Math.min(25, Math.max(0, Math.floor(parsed))) : 0; lane.penalties = numeric; lane.dq = numeric >= 5; recalculateLanePenalty(index);
}
function setLaneDQ(index) {
  const lane = state.lanes[index];
  if (lane?.reviewOnly) return showToast('Review mode: completed RUN is read-only'); lane.dq = true;
  if (state.phase === 'finals' && recordFinalDQ(index)) return;
  recalculateLanePenalty(index);
}
// The race log is intentionally consulted only when a judge undoes a mistaken
// DQ. The previous non-DQ result must survive that correction and be restored.
function clearFinalDQ(index) {
  const lane = state.lanes[index];
  if (lane?.reviewOnly) return showToast('Review mode: completed RUN is read-only'); const category = categoryState(state.selectedFinalCategory); const match = category.bracket?.matches?.find((item) => item.id === category.selectedMatchId); if (!lane?.athleteId || !match) return;
  const raceIndex = Number.isInteger(category.selectedRaceIndex) ? category.selectedRaceIndex : finalRaceForAthlete(match, lane.athleteId); const side = match.athlete1 === lane.athleteId ? 'time1' : 'time2'; const penaltyKey = side === 'time1' ? 'penalty1' : 'penalty2'; const sourceKey = side === 'time1' ? 'source1' : 'source2'; const race = ensureMatchRaces(match)[raceIndex]; const previous = [...(state.raceLog || [])].reverse().find((entry) => entry.phase === 'finals' && entry.categoryId === state.selectedFinalCategory && entry.matchId === match.id && entry.raceIndex === raceIndex && entry.athleteId === lane.athleteId && !entry.dq && Number.isFinite(entry.rawTime));
  lane.dq = false; lane.penalties = 0; lane.pendingFinalResult = null;
  if (previous) { const penalties = Number(previous.penalties || 0); race[side] = Number.isFinite(previous.adjustedTime) ? previous.adjustedTime : Number((previous.rawTime + penalties * 0.2).toFixed(3)); race[penaltyKey] = penalties; race[side === 'time1' ? 'falseStarts1' : 'falseStarts2'] = Number(previous.falseStarts || 0); race[sourceKey] = previous.source || 'manual'; lane.finalRawTime = previous.rawTime; lane.penalties = penalties; lane.time = race[side]; } else { race[side] = null; race[penaltyKey] = 0; race[side === 'time1' ? 'falseStarts1' : 'falseStarts2'] = 0; race[sourceKey] = null; lane.finalRawTime = null; lane.time = null; }
  resolveMatch(state.selectedFinalCategory, match.id); persist(); renderAll();
}
function handleFalseStart(index, number) {
  const lane = state.lanes[index];
  if (lane?.reviewOnly) return showToast('Review mode: completed RUN is read-only');
  if (!lane?.athleteId) return;
  if (number === 1 && lane.falseStarts === 1) { lane.falseStarts = 0; persist(); renderLanes(); return; }
  if (number === 2 && lane.falseStarts === 2) { lane.falseStarts = 0; lane.pendingResult = null; lane.penalties = 0; lane.dq = false; lane.time = null; persist(); renderLanes(); return; }
  if (lane.pendingResult) return;
  if (lane.falseStarts === 0) {
    lane.falseStarts = 1; persist(); renderLanes(); return;
  }
  lane.falseStarts = 2; lane.running = false; lane.startedAt = null; lane.time = null; lane.penalties = state.phase === 'finals' ? 5 : 0; lane.dq = true;
  if (state.phase === 'finals') { const category = categoryState(state.selectedFinalCategory); lane.pendingFinalResult = { categoryId: state.selectedFinalCategory, matchId: category.selectedMatchId, raceIndex: category.selectedRaceIndex, athleteId: lane.athleteId, rawTime: null, adjustedTime: null, penalties: 0, falseStarts: 2, dq: true, source: 'false-start' }; persist(); renderLanes(); return; }
  const category = categoryState(lane.categoryId);
  lane.pendingResult = { categoryId: lane.categoryId, attempt: category.attempt, rawTime: 0, adjustedTime: 0, penalties: 0, dq: true, source: 'false-start' };
  persist(); renderLanes();
}
function promoteNextAthlete(index) {
  const lane = state.lanes[index];
  commitLaneResult(index);
  const skipped = new Set(lane.queueHistory || []);
  const next = nextAthleteForLane(index);
  if (!next) { lane.athleteId = null; lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.running = false; lane.startedAt = null; lane.error = null; lane.queueHistory = []; persist(); renderAll(); return showToast('Результат сохранён'); }
  lane.queueHistory = Array.isArray(lane.queueHistory) ? lane.queueHistory : [];
  if (lane.athleteId) lane.queueHistory.push(lane.athleteId);
  lane.athleteId = next.id;
  lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.running = false; lane.startedAt = null; lane.error = null;
  persist(); renderAll();
}
function promotePreviousAthlete(index) {
  const lane = state.lanes[index];
  const attempt = lane?.categoryId ? categoryState(lane.categoryId).attempt : null;
  commitLaneResult(index);
  lane.queueHistory = Array.isArray(lane.queueHistory) ? lane.queueHistory : [];
  let previousId = null;
  while (lane.queueHistory.length) {
    const candidateId = lane.queueHistory.pop();
    if (!Number.isInteger(attempt) || !hasRecordedResult(lane.categoryId, candidateId, attempt)) { previousId = candidateId; break; }
  }
  if (!previousId) { persist(); renderAll(); return showToast('Нет предыдущего спортсмена без записанного результата'); }
  lane.athleteId = previousId;
  lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.running = false; lane.startedAt = null; lane.error = null;
  persist(); renderAll();
}
function resultCell(categoryId, athleteId, attempt) {
  const value = getTime(categoryId, athleteId, attempt);
  return isQualificationDQ(categoryId, athleteId, attempt) ? 'DQ' : Number.isFinite(value) ? formatClock(value) : '—';
}
function finalWinsForAthlete(athleteId) { if (state.phase !== 'finals' || !state.selectedFinalCategory) return 0; const category = categoryState(state.selectedFinalCategory); const match = category.bracket?.matches?.find((item) => item.id === category.selectedMatchId); if (!match || !athleteId || ![match.athlete1, match.athlete2].includes(athleteId)) return 0; return ensureMatchRaces(match).reduce((wins, _, index) => { const value1 = finalRaceStoredValue(state.selectedFinalCategory, match, index, match.athlete1).value; const value2 = finalRaceStoredValue(state.selectedFinalCategory, match, index, match.athlete2).value; if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) return wins; return wins + (finalRaceWinner({ time1: value1, time2: value2 }, match.athlete1, match.athlete2) === athleteId ? 1 : 0); }, 0); }
function waitingListHtml(lane, index) {
  const athletes = lane.categoryId ? qualificationOrder(lane.categoryId, categoryState(lane.categoryId).attempt) : [];
  const attempt = categoryState(lane.categoryId).attempt;
  return athletes.map((athlete, position) => { const completedAttempt = hasRecordedResult(lane.categoryId, athlete.id, attempt); const currentAthlete = lane.athleteId === athlete.id; return `<div class="queue-result-row ${completedAttempt ? 'attempt-complete ' : ''}${currentAthlete ? 'lane-current-athlete' : ''}"><span class="queue-result-number">${athletes.length - position}</span><span>${escapeHtml(athlete.name)}</span><span>${escapeHtml(formatBirthDate(athlete.birthDate))}</span><span>${escapeHtml(athlete.region || athlete.city || '—')}</span><span class="queue-result-value">${resultCell(lane.categoryId, athlete.id, 1)}</span><span class="queue-result-value">${resultCell(lane.categoryId, athlete.id, 2)}</span><strong class="queue-result-value">${formatBestTime(bestTime(lane.categoryId, athlete.id))}</strong></div>`; }).join('');
}
const QUEUE_WIDTHS_KEY = 'rm-studio-queue-column-widths-v3';
const queueResizeLimits = { athlete: [126, 280], dob: [60, 140], region: [70, 220] };
const queueResizePairs = { athlete: ['athlete', 'dob'], dob: ['dob', null] };
let activeQueueResize = null;
function queueColumnWidths() { try { const saved = JSON.parse(localStorage.getItem(QUEUE_WIDTHS_KEY) || '{}'); return Object.fromEntries(['athlete', 'dob', 'region'].filter((column) => Number.isFinite(saved[column])).map((column) => [column, saved[column]])); } catch { return {}; } }
function applyQueueColumnWidths() { const widths = queueColumnWidths(); $$('.lane-waiting').forEach((waiting) => Object.entries(widths).forEach(([column, width]) => { if (Number.isFinite(width)) waiting.style.setProperty(`--queue-${column}-width`, `${width}px`); })); }
function updateQueueResizeLabels() { const widths = queueColumnWidths(); $$('.queue-resize-handle').forEach((handle) => { const [left, right] = queueResizePairs[handle.dataset.queueResize] || []; if (!Number.isFinite(widths[left])) return; handle.title = right && Number.isFinite(widths[right]) ? `${left.toUpperCase()} ↔ ${right.toUpperCase()}: ${Math.round(widths[left])} + ${Math.round(widths[right])} px` : `${left.toUpperCase()} ↔ REGION: ${Math.round(widths[left])} px`; }); }
function finishQueueResize() { if (!activeQueueResize) return; const widths = queueColumnWidths(); localStorage.setItem(QUEUE_WIDTHS_KEY, JSON.stringify(widths)); updateQueueResizeLabels(); const message = ['athlete', 'dob'].filter((column) => Number.isFinite(widths[column])).map((column) => `${column.toUpperCase()} ${Math.round(widths[column])}px`).join(' · '); showToast(`Column widths: ${message} · REGION fills the remaining space`); activeQueueResize = null; document.body.classList.remove('resizing-queue-columns'); }
function wireQueueResizers() { if (document.body.dataset.queueResizersWired) return; document.body.dataset.queueResizersWired = 'true'; document.addEventListener('pointerdown', (event) => { const handle = event.target.closest('.queue-resize-handle'); if (!handle) return; const header = handle.closest('.queue-result-header'); const waiting = handle.closest('.lane-waiting'); const cell = header?.children[Number(handle.dataset.queueColumnIndex)]; const rightCell = header?.children[Number(handle.dataset.queueColumnIndex) + 1]; const pair = queueResizePairs[handle.dataset.queueResize]; if (!header || !waiting || !cell || !pair || (pair[1] && !rightCell)) return; event.preventDefault(); activeQueueResize = { pair, startX: event.clientX, startLeftWidth: cell.getBoundingClientRect().width, startRightWidth: rightCell?.getBoundingClientRect().width || 0 }; document.body.classList.add('resizing-queue-columns'); }); document.addEventListener('pointermove', (event) => { if (!activeQueueResize) return; const [left, right] = activeQueueResize.pair; const [leftMin, leftMax] = queueResizeLimits[left]; let leftWidth = Math.max(leftMin, Math.min(leftMax, activeQueueResize.startLeftWidth + event.clientX - activeQueueResize.startX)); const widths = queueColumnWidths(); widths[left] = leftWidth; if (right) { const [rightMin, rightMax] = queueResizeLimits[right]; const total = activeQueueResize.startLeftWidth + activeQueueResize.startRightWidth; let rightWidth = total - leftWidth; if (rightWidth < rightMin) { rightWidth = rightMin; leftWidth = total - rightWidth; } if (rightWidth > rightMax) { rightWidth = rightMax; leftWidth = total - rightWidth; } widths[left] = leftWidth; widths[right] = rightWidth; } else delete widths.region; localStorage.setItem(QUEUE_WIDTHS_KEY, JSON.stringify(widths)); applyQueueColumnWidths(); updateQueueResizeLabels(); }); document.addEventListener('pointerup', finishQueueResize); document.addEventListener('pointercancel', finishQueueResize); }
function renderLanes() {
  const now = Date.now();
  const existingFinalsPanel = $('#finalsPanel'); const laneCardsHost = $('#laneCards'); if (existingFinalsPanel && laneCardsHost && existingFinalsPanel.parentElement === laneCardsHost) document.querySelector('.main-content')?.append(existingFinalsPanel);
  $('#laneCards').innerHTML = state.lanes.map((lane, index) => {
    const runningTime = lane.running && Number.isFinite(lane.startedAt) ? (now - lane.startedAt) / 1000 : lane.time; const displayTime = lane.dq ? (Number.isFinite(lane.historyDqTime) ? formatClock(lane.historyDqTime) : '--') : formatClock(runningTime); const nextAthlete = nextAthleteForLane(index); const nextCandidates = nextAthlete ? [nextAthlete] : []; const crownCount = finalWinsForAthlete(lane.athleteId); const crowns = crownCount ? `<span class="lane-win-crowns" aria-label="Duel wins: ${crownCount}">${'♛ '.repeat(crownCount).trim()}</span>` : ''; const timerDisabled = modeIsSynchronized() && currentModeDisabled(); const timerError = ble.connected && Boolean(bleState.errors[index + 1]); const timerReady = modeIsSynchronized() && !timerDisabled && !timerError; const timerStatus = `${timerReady ? ' timer-ready' : ''}${timerDisabled ? ' timer-disabled' : ''}${timerError ? ' timer-error' : ''}`; const timerLabel = timerError ? `ERROR LANE ${index + 1}` : timerDisabled ? 'DISABLED' : timerReady ? 'READY' : '';
    return `<div class="lane-card-wrap"><article class="lane-card ${lane.running ? 'active' : ''} ${Number.isFinite(lane.time) && !lane.running ? 'finished' : ''} ${lane.dq ? 'dq' : ''}${lane.reviewOnly ? ' review-only' : ''}"><div class="lane-top lane-group-toggle"><span class="lane-number">LANE ${index + 1}</span></div>${laneCategoryPicker(lane, index)}<div class="lane-athlete-name"><span class="lane-athlete-label">${escapeHtml(athleteById(lane.athleteId)?.name || 'Next skater')}</span></div><div class="lane-fs-controls"><button type="button" class="fs-button ${lane.falseStarts >= 1 ? 'active' : ''}" data-false-start="${index}" data-fs-number="1"${lane.reviewOnly ? ' disabled' : ''}>FS</button><button type="button" class="fs-button ${lane.falseStarts >= 2 ? 'active' : ''}" data-false-start="${index}" data-fs-number="2"${lane.reviewOnly ? ' disabled' : ''}>FS</button></div><div class="lane-timer-row"><div class="lane-timer-block${timerStatus}" title="${timerError ? escapeHtml(bleState.errors[index + 1]) : timerDisabled ? `${modeDisabledLabel()} = true` : ''}">${timerLabel ? `<span class="timer-state-label">${timerLabel}</span>` : ''}${crowns}<strong class="lane-time">${displayTime}</strong></div><div class="penalty-panel"><input data-lane-penalties="${index}" type="text" inputmode="numeric" maxlength="2" max="25" value="${lane.dq ? 'DQ' : lane.penalties}" aria-label="Penalties lane ${index + 1}"${lane.reviewOnly ? ' disabled' : ''} /></div></div><div class="lane-next-row"><button data-promote-prev="${index}" class="queue-arrow queue-arrow-prev" ${lane.queueHistory?.length ? '' : 'disabled'} aria-label="Previous skater">←</button><button data-promote-next="${index}" class="next-athlete-trigger" ${nextCandidates.length || lane.pendingResult ? '' : 'disabled'}><span>${nextCandidates.length ? 'NEXT' : lane.pendingResult ? 'SAVE' : 'NO NEXT'}</span><strong>${escapeHtml(nextAthlete?.name || (lane.pendingResult ? 'record result' : ''))}</strong><b>${nextCandidates.length ? '→' : lane.pendingResult ? '✓' : ''}</b></button><div class="manual-result"><input data-manual-time="${index}" type="text" inputmode="numeric" maxlength="6" placeholder="---" readonly aria-label="Manual time lane ${index + 1}" /></div><div class="penalty-quick-controls"><div class="penalty-quick-row">${[1, 2, 3, 4].map((value) => `<button type="button" class="${lane.penalties === value && !lane.dq ? 'active' : ''}" data-quick-penalty="${index}" data-penalty-value="${value}"${lane.reviewOnly ? ' disabled' : ''}>${value}</button>`).join('')}</div><button type="button" class="penalty-dq ${lane.dq ? 'active' : ''}" data-lane-dq="${index}"${lane.reviewOnly ? ' disabled' : ''}>DQ</button></div></div></article><section class="lane-waiting"><div class="queue-result-header"><span>№</span><span data-queue-column="athlete">ATHLETE<i class="queue-resize-handle" data-queue-resize="athlete" data-queue-column-index="1" aria-label="Resize ATHLETE column"></i></span><span data-queue-column="dob">DOB<i class="queue-resize-handle" data-queue-resize="dob" data-queue-column-index="2" aria-label="Resize DOB column"></i></span><span data-queue-column="region">REGION</span><span>TT1</span><span>TT2</span><span>BEST TT</span></div><div class="waiting-list">${waitingListHtml(lane, index)}</div></section></div>`;
  }).join('');
  applyQueueColumnWidths(); updateQueueResizeLabels();
  $$('[data-lane-tab]').forEach((button) => button.addEventListener('click', () => setLaneCategory(Number(button.dataset.laneTab), button.dataset.categoryId)));
  $$('[data-promote-next]').forEach((button) => button.addEventListener('click', () => promoteNextAthlete(Number(button.dataset.promoteNext))));
  $$('[data-promote-prev]').forEach((button) => button.addEventListener('click', () => promotePreviousAthlete(Number(button.dataset.promotePrev))));
  $$('[data-lane-penalties]').forEach((input) => { input.addEventListener('focus', () => { if (input.value === '0') input.value = ''; }); input.addEventListener('input', () => { const raw = input.value.toUpperCase(); input.value = raw.includes('D') ? 'DQ' : raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, 2); }); input.addEventListener('change', () => { const index = Number(input.dataset.lanePenalties); if (input.value === 'DQ') setLaneDQ(index); else setLanePenalties(index, input.value); }); });
  $$('[data-quick-penalty]').forEach((button) => button.addEventListener('click', () => { const index = Number(button.dataset.quickPenalty); const lane = state.lanes[index]; const value = Number(button.dataset.penaltyValue); setLanePenalties(index, lane.penalties === value && !lane.dq ? 0 : value); }));
  $$('[data-lane-dq]').forEach((button) => button.addEventListener('click', () => { const index = Number(button.dataset.laneDq); const lane = state.lanes[index]; if (state.phase === 'finals') { if (lane.dq) clearFinalDQ(index); else setLaneDQ(index); return; } if (lane.dq) { lane.dq = false; recalculateLanePenalty(index); } else setLaneDQ(index); }));
  $$('[data-false-start]').forEach((button) => button.addEventListener('click', () => { const index = Number(button.dataset.falseStart); const lane = state.lanes[index]; const number = Number(button.dataset.fsNumber); if ((number === 1 && lane.falseStarts <= 1) || (number === 2 && lane.falseStarts >= 1)) handleFalseStart(index, number); }));
  $$('[data-manual-time]').forEach((input) => { input.dataset.rawDigits = ''; input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { const index = Number(input.dataset.manualTime); const time = Number(input.value); if (!Number.isFinite(time) || time <= 0) return showToast('Введите время больше нуля'); applyLaneResult(index, time, 'manual'); input.value = ''; input.dataset.rawDigits = ''; return; } if (/^\d$/.test(event.key)) { event.preventDefault(); const digits = `${input.dataset.rawDigits || ''}${event.key}`.slice(0, 5); input.dataset.rawDigits = digits; const padded = digits.padStart(4, '0'); input.value = `${padded.slice(0, -3)}.${padded.slice(-3)}`; return; } if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); input.dataset.rawDigits = (input.dataset.rawDigits || '').slice(0, -1); const digits = input.dataset.rawDigits; if (!digits) { input.value = ''; return; } const padded = digits.padStart(4, '0'); input.value = `${padded.slice(0, -3)}.${padded.slice(-3)}`; } }); });
}
function renderGlobalQueue() { const lanes = state.lanes.map((lane, index) => { const category = categoryById(lane.categoryId); const next = lane.athleteId ? athleteById(lane.athleteId) : pendingForCategory(lane.categoryId, index)[0]; return `<div class="queue-lane"><span class="queue-lane-number">0${index + 1}</span><div><strong>${escapeHtml(category.label)}</strong><span>${next ? `at start · ${escapeHtml(next.name)}` : 'no skater at start'}</span></div><b>${categoryState(lane.categoryId).attempt > 2 ? 'KO' : `TT${categoryState(lane.categoryId).attempt}`}</b></div>`; }).join(''); const nextCategories = activeCategoryIds().filter((id) => !state.lanes.some((lane) => lane.categoryId === id)).slice(0, 4).map((id) => `<div class="queue-next"><span>next category</span><strong>${escapeHtml(categoryById(id).label)}</strong><button data-queue-category="${id}" class="text-button">select →</button></div>`).join(''); $('#globalQueue').innerHTML = lanes + (nextCategories || '<div class="queue-empty">All active categories are assigned to lanes.</div>'); $$('[data-queue-category]').forEach((button) => button.addEventListener('click', () => { const laneIndex = state.lanes.findIndex((lane) => categoryState(lane.categoryId).attempt > 2 || !lane.athleteId); const index = laneIndex >= 0 ? laneIndex : 0; state.lanes[index].categoryId = button.dataset.queueCategory; state.lanes[index].athleteId = null; autoAssignLanes(); persist(); renderAll(); })); }
function renderCategoryBoard() { const active = activeCategoryIds(); $('#categoryBoard').innerHTML = active.length ? active.map((id) => { const category = categoryById(id); const cat = categoryState(id); const total = athletesForCategory(id).length; const first = finishedCount(id, 1); const second = finishedCount(id, 2); const progress = cat.attempt > 2 ? 100 : Math.round(((first + second) / (total * 2)) * 100); const status = cat.attempt === 1 ? 'TT1' : cat.attempt === 2 ? 'TT2 · slowest → fastest' : 'KO ready'; return `<div class="category-row ${cat.attempt > 2 ? 'ready' : ''}"><div class="category-row-title"><strong>${escapeHtml(category.label)}</strong><span>${status}</span></div><div class="category-progress"><i><b style="width:${progress}%"></b></i><small>${first}/${total} · ${second}/${total}</small></div><select data-final-size="${id}" aria-label="KO size ${category.label}">${FINAL_SIZES.map((size) => `<option value="${size}" ${Number(cat.finalSize) === size ? 'selected' : ''}>KO size: ${size}</option>`).join('')}</select><button data-open-finals="${id}" class="text-button">${cat.attempt > 2 ? 'Open KO →' : 'Manage →'}</button></div>`; }).join('') : '<div class="queue-empty">Загрузите список спортсменов, чтобы увидеть категории.</div>'; $$('[data-final-size]').forEach((select) => select.addEventListener('change', () => { categoryState(select.dataset.finalSize).finalSize = Number(select.value); persist(); })); $$('[data-open-finals]').forEach((button) => button.addEventListener('click', () => { state.selectedFinalCategory = button.dataset.openFinals; switchPhase('finals'); })); }

function setFinalCategory(categoryId) { commitPendingFinalResults(); const cat = categoryState(categoryId); if (cat.attempt <= 2) return showToast('Сначала завершите обе квалификационные попытки'); state.selectedFinalCategory = categoryId; if (cat.bracket) { cat.selectedMatchId ||= cat.bracket.selectedMatchId; state.lanes = [createLane(categoryId), createLane(categoryId)]; state.phaseLanes.finals = state.lanes; persist(); renderAll(); return showToast('Готовая сетка открыта'); } const qualified = qualificationRanking(categoryId).filter((athlete) => Number.isFinite(bestTime(categoryId, athlete.id))); if (qualified.length < 2) return showToast('Нужно минимум 2 спортсмена с двумя квалификационными попытками'); const size = Number(window.prompt('Количество финалистов: 4, 8, 16, 32 или 64', String(cat.finalSize || 4))); if (![4, 8, 16, 32, 64].includes(size)) return showToast('Выберите только 4, 8, 16, 32 или 64'); cat.finalSize = size; cat.bracket = buildBracket(categoryId, size); cat.selectedMatchId = cat.bracket.selectedMatchId; state.lanes.forEach((lane) => { lane.categoryId = categoryId; lane.athleteId = null; lane.time = null; lane.pendingResult = null; lane.pendingFinalResult = null; lane.running = false; }); persist(); renderAll(); showToast(`Сетка ${size} участников собрана`); }
function resetFinalBracket() { const categoryId = state.selectedFinalCategory; const category = categoryState(categoryId); if (!category.bracket) return showToast('Финальная сетка уже пустая'); if (!confirm(`Сбросить финальную сетку категории «${categoryById(categoryId).label}»? Квалификационные результаты сохранятся.`)) return; state.raceLog = (state.raceLog || []).filter((entry) => !(entry.phase === 'finals' && entry.categoryId === categoryId)); category.bracket = null; category.selectedMatchId = null; category.standings = []; state.lanes = [createLane(categoryId), createLane(categoryId)]; state.phaseLanes.finals = state.lanes; persist(); renderAll(); showToast('Финальная сетка и её история сброшены. Выберите плитку категории, чтобы собрать её заново.'); }
function renderFinalGroupPanel() { const host = $('#finalsGroupPanel'); if (!host) return; const finalsPanel = $('#finalsPanel'); const workspace = document.querySelector('.workspace'); if (state.phase !== 'finals') { host.classList.add('hidden'); if (finalsPanel && finalsPanel.parentElement === host) document.querySelector('.main-content')?.append(finalsPanel); return; } host.classList.remove('hidden'); if (finalsPanel && workspace && finalsPanel.parentElement !== workspace) workspace.append(finalsPanel); const active = new Set(activeCategoryIds()); const ageOrder = new Map(sortedAgeGroups().map((group, index) => [group.id, index])); const tiles = CATEGORIES.filter((category) => active.has(category.id)).sort((a, b) => ageOrder.get(a.ageId) - ageOrder.get(b.ageId)).map((category) => { const completed = categoryState(category.id).attempt > 2; const selected = state.selectedFinalCategory === category.id; const count = athletesForCategory(category.id).length; const gender = genderLabel(category.gender); const age = AGE_GROUPS.find((group) => group.id === category.ageId); return `<button class="lane-tab ${selected ? 'active' : ''} ${completed ? 'completed' : ''}" ${completed ? '' : 'disabled'} data-final-category="${category.id}"><span class="lane-tab-gender">${escapeHtml(gender)}</span><span class="lane-tab-age">${escapeHtml(age?.label || category.label)}</span><small>${count}</small></button>`; }).join(''); const tileCount = Math.max(1, CATEGORIES.filter((category) => active.has(category.id)).length); host.innerHTML = `<div class="finals-group-strip"><div class="finals-group-tiles" style="grid-template-columns:repeat(${tileCount}, minmax(0, 1fr));">${tiles}</div></div>`; $$('[data-final-category]').forEach((button) => button.addEventListener('click', () => setFinalCategory(button.dataset.finalCategory))); }
function renderPanels() { $$('.phase-tab').forEach((button) => button.classList.toggle('active', button.dataset.phase === state.phase)); $('#qualificationPanel').classList.toggle('hidden', state.phase !== 'qualification'); $('#finalsPanel').classList.toggle('hidden', state.phase !== 'finals'); $('#laneCards').classList.toggle('finals-mode', state.phase === 'finals'); }
function renderBle() { const online = ble.connected; const reviewOnly = state.phase === 'finals' && state.lanes.length === 2 && state.lanes.every((lane) => lane.reviewOnly); const modeDisabled = currentModeDisabled(); $('#bleBtn').classList.toggle('connected', online); $('#bleBtnText').textContent = online ? 'BLE подключён' : 'Подключить BLE'; $('#disconnectBtn').disabled = !online; $('#startAllBtn').disabled = !online || reviewOnly || modeDisabled; $('#startAllBtn').title = modeDisabled ? `${modeDisabledLabel()} = true` : ''; $('#resetAllBtn').disabled = reviewOnly; }
function renderFinals() { if (!state.selectedFinalCategory) { $('#bracketBoard').innerHTML = '<div class="bracket-empty">Выберите группу, чтобы открыть финальную сетку.</div>'; return; } const active = activeCategoryIds(); const current = active.includes(state.selectedFinalCategory) ? state.selectedFinalCategory : active.find((id) => categoryState(id).attempt > 2) || active[0] || CATEGORIES[0].id; state.selectedFinalCategory = current; renderBracket(); }
function renderAll() { renderSummary(); renderLanes(); renderFinalGroupPanel(); renderGlobalQueue(); renderCategoryBoard(); renderPanels(); renderFinals(); renderBle(); renderListsSummary(); }

function startTicker() { clearInterval(timerHandle); timerHandle = setInterval(() => { if (!state.lanes.some((lane) => lane.running)) return clearInterval(timerHandle); renderLanes(); }, 70); }

function startAllLanes() {
  if (currentModeDisabled()) return showToast(`${modeDisabledLabel()} = true`);
  const demoStart = demoStartAllowed();
  let started = 0;
  state.lanes.forEach((lane, index) => {
    if (prepareLaneForStart(index) === false) return;
    if (!demoStart && !lane.athleteId) return;
    lane.running = true;
    lane.startedAt = Date.now();
    lane.time = null;
    lane.error = null;
    started += 1;
  });
  if (!started) { if (state.phase === 'finals') { const category = categoryState(state.selectedFinalCategory); const match = category.bracket?.matches?.find((item) => item.id === category.selectedMatchId); return showToast(match?.winnerId ? 'Выберите другую пару' : 'Выберите следующий заезд'); } return showToast('На дорожках нет спортсменов'); }
  sendBleCommand('start');
  addActivity(`Старт · запущено дорожек: ${started}`);
  persist();
  renderAll();
  startTicker();
}
function resetAllLanes() {
  clearInterval(timerHandle);
  state.lanes.forEach((lane) => {
    lane.running = false;
    lane.startedAt = null;
    lane.time = null;
    if (lane.falseStarts < 2) { lane.penalties = 0; lane.dq = false; } else { lane.penalties = 5; lane.dq = true; }
    lane.error = null;
  });
  sendBleCommand('reset');
  addActivity('Сброс · таймеры остановлены');
  persist();
  renderAll();
}

function commitFinalLaneResult(index) {
  const lane = state.lanes[index]; const pending = lane?.pendingFinalResult;
  if (!pending) return false;
  if (!pending.dq && !Number.isFinite(pending.adjustedTime)) return false;
  const category = categoryState(pending.categoryId); const match = category.bracket?.matches?.find((item) => item.id === pending.matchId);
  if (!match) return false;
  const raceIndex = Number.isInteger(pending.raceIndex) ? pending.raceIndex : finalRaceForAthlete(match, pending.athleteId);
  if (raceIndex < 0) return false;
  const side = match.athlete1 === pending.athleteId ? 'time1' : 'time2';
  const race = ensureMatchRaces(match)[raceIndex];
  race[side] = pending.dq ? 'DQ' : pending.adjustedTime;
  race[`penalty${side === 'time1' ? 1 : 2}`] = pending.penalties || 0;
  race[`falseStarts${side === 'time1' ? 1 : 2}`] = pending.falseStarts || 0;
  race[`source${side === 'time1' ? 1 : 2}`] = pending.source;
  appendRaceLog({ phase: 'finals', raceKey: `finals|${pending.categoryId}|${pending.matchId}|${raceIndex}|${pending.athleteId}`, categoryId: pending.categoryId, athleteId: pending.athleteId, matchId: pending.matchId, raceIndex, rawTime: pending.rawTime, adjustedTime: pending.dq ? null : pending.adjustedTime, penalties: pending.penalties || 0, falseStarts: pending.falseStarts || 0, dq: pending.dq, source: pending.source });
  lane.pendingFinalResult = null; lane.finalRawTime = pending.dq ? null : pending.rawTime; lane.time = pending.dq ? null : pending.adjustedTime;
  resolveMatch(pending.categoryId, match.id);
  addActivity(`Финал · ${athleteById(pending.athleteId)?.name || ''} · ${pending.dq ? 'DQ' : formatTime(pending.adjustedTime)}`);
  return true;
}
function commitPendingFinalResults(render = true) { state.lanes.forEach((_, index) => commitFinalLaneResult(index)); persist(); if (render) renderAll(); }
function recordFinalDQ(index) {
  const lane = state.lanes[index];
  if (!lane?.athleteId) return false;
  const category = categoryState(state.selectedFinalCategory);
  const match = category.bracket?.matches?.find((item) => item.id === category.selectedMatchId);
  if (!match) return false;
  const raceIndex = Number.isInteger(category.selectedRaceIndex) ? category.selectedRaceIndex : finalRaceForAthlete(match, lane.athleteId);
  if (raceIndex < 0) return false;
  if (match.winnerId) return showToast('Пара уже завершена — выберите другую плитку');
  lane.pendingFinalResult = { categoryId: state.selectedFinalCategory, matchId: match.id, raceIndex: category.selectedRaceIndex, athleteId: lane.athleteId, rawTime: null, adjustedTime: null, penalties: lane.penalties || 0, falseStarts: lane.falseStarts || 0, dq: true, source: 'manual-dq' };
  lane.running = false; lane.startedAt = null; lane.time = null; lane.finalRawTime = null;
  commitFinalLaneResult(index); persist(); renderAll();
  return true;
}
function applyLaneResult(index, time, source = 'ble') {
  const lane = state.lanes[index];
  if (lane?.reviewOnly) return showToast('Review mode: completed RUN is read-only');
  if (!lane) return showToast(`Дорожка ${index + 1} не найдена`);
  const result = Number(time);
  if (!Number.isFinite(result) || result <= 0) return showToast('Получено некорректное время');

  lane.running = false;
  lane.startedAt = null;
  if (!lane.athleteId) {
    lane.time = Number(result.toFixed(3));
    lane.error = null;
    persist();
    renderAll();
    addActivity(`Демо · дорожка ${index + 1} · ${formatTime(lane.time)}`);
    return;
  }
  const adjustedTime = Number((result + (lane.dq ? 0 : lane.penalties * 0.2)).toFixed(3));
  if (state.phase === 'qualification') {
    const category = categoryState(lane.categoryId);
    if (category.attempt > 2) return showToast('Эта категория уже завершила квалификацию');
    const attempt = category.attempt;
    if (lane.pendingResult) {
      lane.pendingResult.rawTime = result;
      lane.pendingResult.penalties = lane.penalties;
      lane.pendingResult.dq = lane.dq;
      lane.pendingResult.adjustedTime = Number((result + (lane.dq ? 0 : lane.penalties * 0.2)).toFixed(3));
      if (source === 'manual' && lane.pendingResult.source === 'ble') { lane.pendingResult.source = 'manual'; lane.pendingResult.correction = true; }
      lane.time = lane.dq ? null : lane.pendingResult.adjustedTime;
      persist();
      renderAll();
      return;
    }
    if (Number.isFinite(getTime(lane.categoryId, lane.athleteId, attempt))) {
      lane.time = null;
      prepareLaneForStart(index);
      persist();
      renderAll();
      return showToast('Результат этого спортсмена уже записан и не может быть перезаписан');
    }
    lane.time = lane.dq ? null : adjustedTime;
    lane.queueHistory = [];
    lane.pendingResult = { categoryId: lane.categoryId, attempt, rawTime: result, adjustedTime, penalties: lane.penalties, dq: lane.dq, source };
  } else {
    lane.finalRawTime = result;
    lane.time = lane.dq ? null : adjustedTime;
    lane.queueHistory = [];
    const cat = categoryState(state.selectedFinalCategory);
    const match = cat.bracket?.matches?.find((item) => item.id === cat.selectedMatchId);
    if (match?.winnerId) return showToast('Пара уже завершена — выберите другую плитку');
    if (match) {
      lane.pendingFinalResult = { categoryId: state.selectedFinalCategory, matchId: match.id, raceIndex: categoryState(state.selectedFinalCategory).selectedRaceIndex, athleteId: lane.athleteId, rawTime: result, adjustedTime: lane.dq ? null : adjustedTime, penalties: lane.penalties, falseStarts: lane.falseStarts || 0, dq: lane.dq, source };
      commitFinalLaneResult(index);
    }
  }
  if (!state.lanes.some((item) => item.running)) clearInterval(timerHandle);
  persist();
  renderAll();
}
function parseBleLine(line) {
  let payload;
  try { payload = JSON.parse(line); }
  catch (error) { return; }
  const type = payload.type;
  if (type === 'mode') {
    const nextMode = payload.mode === 'qualification' || payload.mode === 'race' ? payload.mode : null;
    const nextRaceDisable = typeof payload.race_disable === 'boolean' ? payload.race_disable : bleState.raceDisable;
    const nextQualificationDisable = typeof payload.qualification_disable === 'boolean' ? payload.qualification_disable : bleState.qualificationDisable;
    const stateChanged = bleState.mode !== nextMode || bleState.raceDisable !== nextRaceDisable || bleState.qualificationDisable !== nextQualificationDisable;
    bleState.mode = nextMode || bleState.mode;
    bleState.raceDisable = nextRaceDisable;
    bleState.qualificationDisable = nextQualificationDisable;
    const nextPhase = payload.mode === 'qualification' ? 'qualification' : payload.mode === 'race' ? 'finals' : null;
    if (!nextPhase) { if (stateChanged) { renderLanes(); renderBle(); } return; }
    if (nextPhase === state.phase) { if (stateChanged) { renderLanes(); renderBle(); } return; }
    if (!switchPhase(nextPhase, { notifyBle: false })) {
      sendBleModeCommand(phaseToBleCommand(state.phase));
    }
  } else if (type === 'mode_rejected') {
    pendingModeChange = null;
  } else if (type === 'error') {
    const lane = Number(payload.lane);
    if (lane !== 1 && lane !== 2) return;
    if (payload.active === false) {
      bleState.errors[lane] = null;
    } else {
      bleState.errors[lane] = String(payload.name || 'Аппаратная ошибка');
    }
    renderLanes();
  } else if (type === 'start') {
    if (currentModeDisabled()) return showToast(`Старт заблокирован: ${modeDisabledLabel()} = true`);
    const indices = payload.lane == null ? [0, 1] : [Number(payload.lane) - 1];
    const demoStart = demoStartAllowed();
    indices.forEach((index) => { if (!state.lanes[index] || prepareLaneForStart(index) === false || (!demoStart && !state.lanes[index].athleteId)) return; state.lanes[index].running = true; state.lanes[index].startedAt = Date.now(); });
    persist(); renderLanes(); startTicker();
  } else if (type === 'reset') {
    clearInterval(timerHandle);
    state.lanes.forEach((lane) => { lane.running = false; lane.startedAt = null; lane.time = null; if (lane.falseStarts < 2) { lane.penalties = 0; lane.dq = false; } else { lane.penalties = 5; lane.dq = true; } lane.error = null; });
    persist(); renderLanes();
  } else if (['qualification', 'race', 'laser', 'finish'].includes(type)) {
    const index = Number(payload.lane) - 1;
    const time = Number(payload.time ?? payload.result ?? payload.seconds);
    if (index >= 0 && index < 2 && Number.isFinite(time)) applyLaneResult(index, time, 'ble');
  }
}
function handleBleNotification(event) { const text = new TextDecoder().decode(event.target.value); ble.buffer += text; const lines = ble.buffer.split(/\r?\n/); ble.buffer = lines.pop() || ''; lines.filter(Boolean).forEach(parseBleLine); }
async function connectToBleDevice(device, isReconnect = false) { ble.device = device; $('#bleBtnText').textContent = 'Подключение…'; const connectPromise = device.gatt.connect(); const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('тайм-аут GATT-подключения')), 10000)); ble.server = await Promise.race([connectPromise, timeoutPromise]); let lastError; for (const profile of BLE_PROFILES) { try { const service = await ble.server.getPrimaryService(profile.service); ble.rx = await service.getCharacteristic(profile.rx); ble.tx = await service.getCharacteristic(profile.tx); break; } catch (error) { lastError = error; ble.rx = null; ble.tx = null; } } if (!ble.rx || !ble.tx) throw lastError || new Error('BLE service/characteristics not found'); await ble.tx.startNotifications(); ble.tx.addEventListener('characteristicvaluechanged', handleBleNotification); ble.connected = true; ble.reconnectAttempt = 0; renderBle(); }
function scheduleBleReconnect() { if (!ble.device || ble.manualDisconnect || ble.reconnectTimer || ble.reconnectAttempt >= 5) return; const delay = Math.min(8000, 900 * (2 ** ble.reconnectAttempt)); ble.reconnectTimer = setTimeout(async () => { ble.reconnectTimer = null; ble.reconnectAttempt += 1; try { await connectToBleDevice(ble.device, true); } catch (error) { renderBle(); scheduleBleReconnect(); } }, delay); }
async function connectBle() { if (!window.isSecureContext) { $('#bleBtnText').textContent = 'Требуется HTTPS'; return showToast('Откройте страницу через HTTPS'); } if (!navigator.bluetooth) { $('#bleBtnText').textContent = 'Нужен Chrome или Edge'; return showToast('Web Bluetooth недоступен. Откройте страницу в Chrome или Edge.'); } let deviceChosen = false; try { clearTimeout(ble.reconnectTimer); ble.reconnectTimer = null; ble.reconnectAttempt = 0; ble.manualDisconnect = false; const serviceFilters = BLE_PROFILES.map((profile) => ({ services: [profile.service] })); const device = await navigator.bluetooth.requestDevice({ filters: serviceFilters, optionalServices: BLE_PROFILES.map((profile) => profile.service) }); deviceChosen = true; $('#bleBtnText').textContent = 'Подключение…'; device.addEventListener('gattserverdisconnected', () => { ble.connected = false; ble.server = null; ble.rx = null; ble.tx = null; clearBleTelemetry(); scheduleBleReconnect(); }); await connectToBleDevice(device); } catch (error) { if (error?.name === 'NotFoundError' && !deviceChosen) { showToast('Подходящее устройство хронометража не найдено'); return; } ble.connected = false; clearBleTelemetry(); const message = error?.message || error?.name || 'неизвестная ошибка'; $('#bleBtnText').textContent = 'Ошибка BLE'; showToast(`Не удалось подключить BLE: ${message}`); } }
function sendBleModeCommand(command) { if (!ble.connected || !ble.rx) return; const data = new TextEncoder().encode(command); const writeWithResponse = typeof ble.rx.writeValueWithResponse === 'function' ? ble.rx.writeValueWithResponse(data) : null; const firstWrite = writeWithResponse || ble.rx.writeValue(data); Promise.resolve(firstWrite).catch(() => typeof ble.rx.writeValue === 'function' ? ble.rx.writeValue(data).catch(() => {}) : undefined); }
function sendBleCommand(command) { if (!ble.connected || !ble.rx) return; const data = new TextEncoder().encode(command); const write = typeof ble.rx.writeValueWithResponse === 'function' ? ble.rx.writeValueWithResponse(data) : ble.rx.writeValue(data); Promise.resolve(write).catch(() => typeof ble.rx.writeValue === 'function' ? ble.rx.writeValue(data).catch(() => {}) : undefined); }
function disconnectBle() { ble.manualDisconnect = true; clearTimeout(ble.reconnectTimer); ble.reconnectTimer = null; if (ble.device?.gatt?.connected) ble.device.gatt.disconnect(); ble.connected = false; clearBleTelemetry(); }

function normalizeHeader(value) { return String(value ?? '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/ё/g, 'е').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ''); }
function parseRosterRows(rows) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const normalizedHeaders = headers.map((header) => [header, normalizeHeader(header)]);
  const find = (aliases) => {
    const normalizedAliases = aliases.map(normalizeHeader).filter(Boolean);
    const exact = normalizedHeaders.find(([, header]) => normalizedAliases.includes(header));
    if (exact) return exact[0];
    const partial = normalizedHeaders.find(([, header]) => normalizedAliases.some((alias) => header.includes(alias) || alias.includes(header)));
    return partial?.[0];
  };
  const nameKey = find(['фио', 'фамилия имя', 'фамилия имя отчество', 'имя спортсмена', 'спортсмен', 'участник', 'name', 'full name', 'full_name', 'athlete', 'participant']);
  const surnameKey = find(['фамилия', 'last name', 'surname']);
  const firstNameKey = find(['имя', 'first name', 'given name']);
  const patronymicKey = find(['отчество', 'middle name', 'patronymic']);
  const ratingKey = find(['рейтинг', 'спортивный рейтинг', 'rating', 'rank', 'elo']);
  const genderKey = find(['пол', 'пол участника', 'мж', 'gender', 'sex']);
  const birthKey = find(['дата рождения', 'год рождения', 'день рождения', 'дата рожд', 'год рожд', 'датарожд', 'birth date', 'birth year', 'year of birth', 'birthdate', 'birthday', 'dob']);
  const regionKey = find(['регион', 'субъект рф', 'субъект российской федерации', 'область', 'край', 'республика', 'region', 'oblast', 'area']);
  const cityKey = find(['город', 'населенный пункт', 'место проживания', 'city', 'town']);
  const clubKey = find(['клуб', 'команда', 'спортивная школа', 'club', 'team']);
  const errors = [];
  const ageGroupWarnings = [];
  if (!nameKey && !(surnameKey && firstNameKey)) errors.push('Не найдена колонка ФИО / Name или отдельные колонки Фамилия + Имя');
  if (!birthKey) errors.push('Не найдена обязательная колонка Дата или год рождения / Birth date or birth year');
  if ((!nameKey && !(surnameKey && firstNameKey)) || !birthKey) return { roster: [], errors };
  const roster = rows.map((row, index) => {
    const rawBirthDate = birthKey ? row[birthKey] : '';
    const birthDate = normalizeBirthDate(rawBirthDate);
    const age = ageFromBirthDate(rawBirthDate || birthDate);
    const rating = ratingKey ? normalizeRating(row[ratingKey]) : 0;
    const name = nameKey ? String(row[nameKey] ?? '').trim() : [row[surnameKey], row[firstNameKey], patronymicKey ? row[patronymicKey] : ''].map((value) => String(value ?? '').trim()).filter(Boolean).join(' ');
    if (!name || !Number.isFinite(age) || age < 1 || age > 120) {
      errors.push(`Строка ${index + 2}: проверьте ФИО и год рождения`);
      return null;
    }
    if (!matchingAgeGroupForAge(age)) {
      ageGroupWarnings.push({ age, name });
      return null;
    }
    return { id: `import-${Date.now()}-${index}`, name, age, rating, gender: normalizeGenderKey(genderKey ? row[genderKey] : '', age), birthDate, region: String(regionKey ? row[regionKey] ?? '' : cityKey ? row[cityKey] ?? '' : '').trim(), city: String(cityKey ? row[cityKey] ?? '' : '').trim(), club: String(clubKey ? row[clubKey] ?? '' : '').trim(), source: 'import' };
  }).filter(Boolean);
  if (!genderKey) errors.push('Колонка пола не найдена: строки без пола попадут в мужскую/юношескую категорию');
  return { roster, errors, ageGroupWarnings };
}
function formatAgeGroupWarnings(warnings) { const grouped = new Map(); warnings.forEach(({ age, name }) => { if (!grouped.has(age)) grouped.set(age, []); grouped.get(age).push(name); }); const details = [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([age, names]) => { const shown = names.slice(0, 2).join(', '); const extra = names.length > 2 ? ` и ещё ${names.length - 2}` : ''; const countLabel = names.length === 1 ? 'участник' : names.length < 5 ? 'участника' : 'участников'; return `${age} лет — ${names.length} ${countLabel}${shown ? `: ${shown}${extra}` : ''}`; }); return details.length ? `Нет возрастных групп для ${details.join('; ')}. Сначала создайте подходящие группы и повторите импорт.` : ''; }
function openImportPreview(fileName, parsed) { const ageWarning = formatAgeGroupWarnings(parsed.ageGroupWarnings || []); const issues = [...(parsed.errors || []), ...(ageWarning ? [ageWarning] : [])]; const hasAgeGroupWarnings = (parsed.ageGroupWarnings || []).length > 0; pendingImport = { fileName, roster: parsed.roster }; const hasExistingRoster = state.roster.length > 0; $('#importModalMeta').textContent = `${fileName} · корректных строк: ${parsed.roster.length}${issues.length ? ` · замечаний: ${issues.length}` : ''}`; $('#importReplaceWarning').classList.toggle('hidden', !hasExistingRoster); $('#importReplaceWarning').textContent = hasExistingRoster ? `В системе уже есть ${state.roster.length} спортсменов. Импорт полностью заменит текущий состав, результаты и очереди. Старые данные будут потеряны.` : ''; $('#importErrors').classList.toggle('hidden', !issues.length); $('#importErrors').classList.toggle('import-errors', !hasAgeGroupWarnings); $('#importErrors').classList.toggle('import-warning', hasAgeGroupWarnings); $('#importErrors').textContent = issues.slice(0, 7).join(' · '); $('#importPreviewRows').innerHTML = parsed.roster.map((athlete, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(athlete.name)}</td><td>${escapeHtml(formatBirthDate(athlete.birthDate))}</td><td>${escapeHtml(categoryById(categoryForAthlete(athlete).id).label.split(' · ')[1])}</td><td>${escapeHtml(categoryLabelForAthlete(athlete))}</td><td>${escapeHtml(athlete.region || athlete.city || '—')}</td><td>${athlete.rating > 0 ? escapeHtml(String(athlete.rating)) : ''}</td></tr>`).join('') || '<tr><td colspan="7">Нет корректных строк</td></tr>'; $('#importModal').classList.remove('hidden'); }
function importWorkbook(file) { ensureXlsx().then(() => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = resolve; reader.onerror = reject; reader.readAsArrayBuffer(file); })).then((event) => { try { const workbook = XLSX.read(event.target.result, { type: 'array', cellDates: true }); const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }); const parsed = parseRosterRows(rows); if (!parsed.roster.length && !parsed.ageGroupWarnings?.length) return showToast(parsed.errors[0] || 'Не найдено корректных строк'); openImportPreview(file.name, parsed); } catch (error) { showToast('Не удалось прочитать файл Excel'); } }).catch(() => showToast('Не удалось загрузить библиотеку Excel')); }
function confirmImport() { if (!pendingImport?.roster?.length) return; if (state.roster.length && !confirm(`В системе уже есть ${state.roster.length} спортсменов. Импортировать новый список и удалить старый состав вместе с результатами?`)) return; const roster = normalizeRoster(pendingImport.roster); const enabledCategories = [...new Set(roster.map((athlete) => categoryForAthlete(athlete).id))]; state = { eventName: state.eventName, eventDate: state.eventDate, phase: 'qualification', roster, enabledAgeGroups: [...new Set(roster.map((athlete) => ageGroupForAge(athlete.age).id))], enabledCategories, ageGroups: [...AGE_GROUPS], customAgeGroups: AGE_GROUPS.filter((group) => !group.standard), categories: createCategoryStates(), lanes: [], phaseLanes: null, selectedFinalCategory: null, activity: [], frs: { ...emptyFrsState(), ...(state.frs || {}), pendingChanges: [] } }; state.lanes = lanesForRoster(state.roster); state.phaseLanes = { qualification: state.lanes, finals: [createLane(), createLane()] }; autoAssignLanes(); state.selectedFinalCategory = firstActiveCategory([], state.roster); addActivity(`Импортировано ${state.roster.length} спортсменов из ${pendingImport.fileName}`); pendingImport = null; $('#importModal').classList.add('hidden'); closeListsModal(); renderAll(); if (state.frs?.eventId) syncFrsJournal({ full: true }).catch(() => setFrsStatus(false)); showToast(`Загружено ${state.roster.length} спортсменов`); }
function openListsModal() { renderListsSummary(); $('#listsModal').classList.remove('hidden'); }
function closeListsModal() { $('#listsModal').classList.add('hidden'); }
function renderListsSummary() { const count = $('#listsRosterCount'); if (count) count.textContent = String(state.roster.length); }
function qualificationLogEntries() { const superseded = new Set((state.raceLog || []).filter((entry) => entry.correctionOf && entry.correctionAction).map((entry) => entry.correctionOf)); return (state.raceLog || []).filter((entry) => entry.phase === 'qualification' && !entry.correctionAction && !superseded.has(entry.id)).slice().reverse(); }
function openCorrectionsModal() { closeListsModal(); renderCorrections(); $('#correctionsModal').classList.remove('hidden'); }
function closeCorrectionsModal() { $('#correctionsModal').classList.add('hidden'); }
function backToListsFromCorrections() { closeCorrectionsModal(); openListsModal(); }
function backToListsFromAddGroup() { closeAddGroup(); openListsModal(); }
function formatBirthDateInput(event) { const input = event.target; const digits = String(input.value || '').replace(/\D/g, '').slice(0, 8); input.value = digits.length > 4 ? `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}.${digits.slice(2)}` : digits; }
function addAthleteFromCorrections() {
  const name = String($('#addAthleteName')?.value || '').trim(); const rawBirthDate = String($('#addAthleteBirthDate')?.value || '').trim(); const gender = String($('#addAthleteGender')?.value || ''); const region = String($('#addAthleteRegion')?.value || '').trim(); const ratingInput = $('#addAthleteRating')?.value; const rating = normalizeRating(ratingInput);
  const birthDate = /^\d{2}\.\d{2}\.\d{4}$/.test(rawBirthDate) ? normalizeBirthDate(rawBirthDate) : ''; const age = birthDate ? ageFromBirthDate(birthDate) : NaN;
  if (!name || !birthDate || !Number.isInteger(age) || age < 1 || age > 150 || !gender || !region) return showToast('Заполните ФИО, дату рождения в формате ДД.ММ.ГГГГ, пол и регион');
  const ageGroup = matchingAgeGroupForAge(age); if (!ageGroup) return showToast('Для этого возраста нет подходящей группы');
  const athlete = { id: `athlete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, age, gender: normalizeGenderKey(gender, age), rating, birthDate, region, city: region, club: '', source: 'manual' };
  state.roster.push(athlete); const categoryId = categoryForAthlete(athlete).id; state.enabledAgeGroups = [...new Set([...(state.enabledAgeGroups || []), ageGroup.id])]; state.enabledCategories = [...new Set([...(state.enabledCategories || []), categoryId])]; autoAssignLanes(); persist('Спортсмен добавлен'); renderCorrections(); renderAll(); $('#addAthleteForm').reset(); showToast(`Спортсмен «${name}» добавлен в соревнование`);
}
function finalBracketMatchesForAthlete(athleteId) { return CATEGORIES.flatMap((category) => { const bracket = categoryState(category.id).bracket; return bracket ? bracket.matches.filter((match) => match.athlete1 === athleteId || match.athlete2 === athleteId).map((match) => ({ categoryId: category.id, bracket, match })) : []; }); }
function markAthleteFinalDQ(athleteId) {
  const athlete = athleteById(athleteId); const matches = finalBracketMatchesForAthlete(athleteId); if (!athlete || !matches.length) return;
  if (!confirm(`Отметить спортсмена «${athlete.name}» как DQ во всех его финальных заездах?`)) return;
  matches.forEach(({ categoryId, bracket, match }) => { const side = match.athlete1 === athleteId ? '1' : '2'; const races = ensureMatchRaces(match); races.forEach((race, raceIndex) => { race[`time${side}`] = 'DQ'; race[`penalty${side}`] = 5; race[`falseStarts${side}`] = 0; const raceKey = `finals|${categoryId}|${match.id}|${raceIndex}|${athleteId}`; const existing = latestRaceLog((entry) => entry.raceKey === raceKey); if (!existing || !existing.dq) appendRaceLog({ phase: 'finals', raceKey, categoryId, athleteId, matchId: match.id, raceIndex, rawTime: null, adjustedTime: null, penalties: 5, falseStarts: 0, dq: true, source: 'manual-dq' }); }); match.time1 = races[0]?.time1 ?? null; match.time2 = races[0]?.time2 ?? null; recalculateBracket(bracket, categoryId); updateStandings(categoryId); });
  persist('Спортсмен отмечен как DQ во всех финалах'); renderCorrections(); renderAll(); showToast(`Спортсмен «${athlete.name}» отмечен как DQ во всех финальных заездах`);
}
function renderCorrections() {
  const rosterHost = $('#correctionsRosterRows');
  if (rosterHost) {
    const query = String($('#correctionsAthleteSearch')?.value || '').trim().toLocaleLowerCase('ru-RU');
    const roster = state.roster.filter((athlete) => query && athlete.name.toLocaleLowerCase('ru-RU').includes(query)).sort((a, b) => categoryLabelForAthlete(a).localeCompare(categoryLabelForAthlete(b), 'ru') || a.name.localeCompare(b.name, 'ru'));
    rosterHost.innerHTML = !query ? '<tr><td colspan="6" class="queue-empty">Введите ФИО, чтобы найти спортсмена.</td></tr>' : roster.length ? roster.map((athlete) => { const category = categoryForAthlete(athlete); const tt = (attempt) => isQualificationDQ(category.id, athlete.id, attempt) ? 'DQ' : (getTime(category.id, athlete.id, attempt) ?? '—'); const inFinals = finalBracketMatchesForAthlete(athlete.id).length > 0; const action = inFinals ? `<button type="button" class="text-button" data-final-dq="${escapeHtml(athlete.id)}">DQ во всех финальных заездах</button>` : `<button type="button" class="text-button correction-delete" data-roster-delete="${escapeHtml(athlete.id)}">Удалить из соревнования</button>`; return `<tr><td>${escapeHtml(category.label)}</td><td>${escapeHtml(athlete.name)}</td><td>${tt(1)}</td><td>${tt(2)}</td><td>${bestTime(category.id, athlete.id) ?? '—'}</td><td>${action}</td></tr>`; }).join('') : '<tr><td colspan="6" class="queue-empty">Спортсмен не найден.</td></tr>';
  }
  const host = $('#correctionsRows'); if (!host) return;
  const entries = qualificationLogEntries();
  host.innerHTML = entries.length ? entries.map((entry) => {
    const athlete = athleteById(entry.athleteId); const category = categoryById(entry.categoryId); const candidates = athletesForCategory(entry.categoryId).filter((item) => item.id !== entry.athleteId && !hasRecordedResult(entry.categoryId, item.id, entry.attempt));
    const result = entry.dq ? '' : (entry.adjustedTime ?? '');
    return `<tr><td>${escapeHtml(category?.label || entry.categoryId)}</td><td>${entry.attempt || '—'}</td><td>${escapeHtml(athlete?.name || entry.athleteId)}</td><td><input class="correction-value-input" data-correction-result="${escapeHtml(entry.id)}" type="number" min="0.001" step="0.001" value="${result}" placeholder="DQ" /></td><td><input class="correction-value-input correction-penalty-input" data-correction-penalty="${escapeHtml(entry.id)}" type="number" min="0" max="25" step="1" value="${entry.penalties || 0}" /></td><td><button type="button" class="text-button" data-correction-save="${escapeHtml(entry.id)}">Сохранить</button><select data-correction-target="${escapeHtml(entry.id)}"><option value="">Выбрать спортсмена</option>${candidates.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select><button type="button" class="text-button" data-correction-replace="${escapeHtml(entry.id)}" ${candidates.length ? '' : 'disabled'}>Заменить</button><button type="button" class="text-button correction-delete" data-correction-delete="${escapeHtml(entry.id)}">Удалить</button></td></tr>`;
  }).join('') : '<tr><td colspan="6" class="queue-empty">В журнале квалификации пока нет записей.</td></tr>';
}
function correctionEntryById(id) { return (state.raceLog || []).find((entry) => entry.id === id && entry.phase === 'qualification' && !entry.correctionAction) || null; }
function qualificationHasFinalBracket(categoryId) { return Boolean(categoryState(categoryId).bracket); }
function recomputeQualificationAttempt(categoryId) { const category = categoryState(categoryId); category.attempt = categoryComplete(categoryId, 1) ? (categoryComplete(categoryId, 2) ? 3 : 2) : 1; }
function clearQualificationValue(categoryId, athleteId, attempt) { const category = categoryState(categoryId); for (const key of ['attempts', 'rawAttempts', 'penalties', 'dq', 'falseStarts']) { if (category[key]?.[attempt]) delete category[key][attempt][athleteId]; } }
function recordCorrection(entry, action, extra = {}) { const correction = { id: `correction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: Date.now(), phase: 'qualification', correctionAction: action, correctionOf: entry.id, categoryId: entry.categoryId, attempt: entry.attempt, source: 'correction', ...extra }; state.raceLog.push(correction); }
function editQualificationResult(entryId) {
  const entry = correctionEntryById(entryId); if (!entry) return;
  if (qualificationHasFinalBracket(entry.categoryId)) return showToast('Для категории уже создана финальная сетка.');
  const resultInput = $(`[data-correction-result="${entryId}"]`); const penaltyInput = $(`[data-correction-penalty="${entryId}"]`);
  const penalties = Math.min(25, Math.max(0, Math.floor(Number(penaltyInput?.value || 0)))); const result = Number(resultInput?.value); const dq = penalties >= 5;
  if (!dq && (!Number.isFinite(result) || result <= 0)) return showToast('Введите корректное время или штраф 5 для DQ');
  const adjustedTime = dq ? null : Number(result.toFixed(3)); const rawTime = dq ? 0 : Number((adjustedTime - penalties * 0.2).toFixed(3)); const category = categoryState(entry.categoryId); category.attempts[entry.attempt][entry.athleteId] = dq ? 0 : adjustedTime; category.rawAttempts[entry.attempt][entry.athleteId] = rawTime; category.penalties[entry.attempt][entry.athleteId] = penalties; category.dq[entry.attempt][entry.athleteId] = dq;
  entry.adjustedTime = adjustedTime; entry.rawTime = rawTime; entry.penalties = penalties; entry.dq = dq; entry.updatedAt = Date.now();
  recomputeQualificationAttempt(entry.categoryId); persist('Результат исправлен'); renderCorrections(); renderAll();
}
function replaceQualificationResult(entryId) {
  const entry = correctionEntryById(entryId); const targetId = $(`[data-correction-target="${entryId}"]`)?.value; if (!entry || !targetId) return showToast('Выберите спортсмена для замены');
  if (qualificationHasFinalBracket(entry.categoryId)) return showToast('Для категории уже создана финальная сетка. Корректировки финалов будут добавлены отдельно.');
  if (!confirm('Перенести этот результат на выбранного спортсмена? Исходная запись останется в журнале.')) return;
  const category = categoryState(entry.categoryId); if (hasRecordedResult(entry.categoryId, targetId, entry.attempt)) return showToast('У выбранного спортсмена уже есть результат этой попытки');
  category.attempts[entry.attempt][targetId] = entry.adjustedTime ?? null; category.rawAttempts[entry.attempt][targetId] = entry.rawTime ?? null; category.penalties[entry.attempt][targetId] = Number(entry.penalties || 0); category.dq[entry.attempt][targetId] = Boolean(entry.dq); category.falseStarts[entry.attempt][targetId] = Number(entry.falseStarts || 0); clearQualificationValue(entry.categoryId, entry.athleteId, entry.attempt); recordCorrection(entry, 'replace', { fromAthleteId: entry.athleteId, athleteId: targetId, adjustedTime: entry.adjustedTime, rawTime: entry.rawTime, penalties: entry.penalties || 0, dq: Boolean(entry.dq), falseStarts: entry.falseStarts || 0 }); state.raceLog.push({ id: `corrected-result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: Date.now(), phase: 'qualification', raceKey: `qualification|${entry.categoryId}|${targetId}|${entry.attempt}`, categoryId: entry.categoryId, athleteId: targetId, attempt: entry.attempt, rawTime: entry.rawTime, adjustedTime: entry.adjustedTime, penalties: entry.penalties || 0, dq: Boolean(entry.dq), falseStarts: entry.falseStarts || 0, source: 'correction', correctionOf: entry.id }); state.lanes.forEach((lane) => { if (lane.categoryId === entry.categoryId && lane.athleteId === entry.athleteId) Object.assign(lane, createLane(entry.categoryId)); }); recomputeQualificationAttempt(entry.categoryId); autoAssignLanes(); persist('Результат перенесён'); renderCorrections(); renderAll(); showToast('Результат перенесён на выбранного спортсмена');
}
function deleteQualificationResult(entryId) {
  const entry = correctionEntryById(entryId); if (!entry) return; if (qualificationHasFinalBracket(entry.categoryId)) return showToast('Для категории уже создана финальная сетка. Корректировки финалов будут добавлены отдельно.'); if (!confirm('Удалить этот результат? Спортсмен снова сможет пройти эту попытку. Запись останется в журнале.')) return; clearQualificationValue(entry.categoryId, entry.athleteId, entry.attempt); recordCorrection(entry, 'delete', { athleteId: entry.athleteId }); state.lanes.forEach((lane) => { if (lane.categoryId === entry.categoryId && lane.athleteId === entry.athleteId) Object.assign(lane, createLane(entry.categoryId)); }); recomputeQualificationAttempt(entry.categoryId); autoAssignLanes(); persist('Результат удалён для повторного старта'); renderCorrections(); renderAll(); showToast('Результат удалён, спортсмен снова доступен в очереди');
}
function removeAthleteFromCompetition(athleteId) {
  const athlete = athleteById(athleteId); if (!athlete) return;
  const categoryId = categoryForAthlete(athlete).id;
  if (finalBracketMatchesForAthlete(athleteId).length) return showToast('Удаление запрещено: спортсмен уже включён в финальную сетку. Для неявки используйте DQ во всех финальных заездах.');
  if (!confirm(`Удалить спортсмена «${athlete.name}» из текущего соревнования? Его результаты и записи журнала будут удалены.`)) return;
  state.roster = state.roster.filter((item) => item.id !== athleteId);
  clearQualificationValue(categoryId, athleteId, 1); clearQualificationValue(categoryId, athleteId, 2);
  state.raceLog = (state.raceLog || []).filter((entry) => entry.athleteId !== athleteId && entry.fromAthleteId !== athleteId);
  const category = categoryState(categoryId); category.selectedMatchId = null; category.selectedRaceIndex = 0; category.standings = [];
  state.lanes.forEach((lane, index) => { if (lane.athleteId === athleteId) Object.assign(state.lanes[index], createLane(lane.categoryId)); });
  recomputeQualificationAttempt(categoryId); autoAssignLanes(); persist('Спортсмен удалён из соревнования'); renderCorrections(); renderAll(); showToast(`Спортсмен «${athlete.name}» удалён из соревнования`);
}

function raceSourceLabel(source) { return source === 'ble' ? 'BLE' : source === 'manual' ? 'Ручной ввод' : ''; }
function exportRaceLogWorkbook() { const entries = state.raceLog || []; if (!entries.length) return showToast('Журнал заездов пока пуст'); ensureXlsx().then(() => { const rows = entries.map((entry) => ({ 'Дата и время': new Date(entry.at).toLocaleString('ru-RU'), 'Этап': entry.phase === 'qualification' ? 'Квалификация' : 'Финалы', 'Категория': categoryById(entry.categoryId).label, 'Спортсмен': athleteById(entry.athleteId)?.name || entry.athleteId || '', 'Попытка': entry.attempt || '', 'Матч': entry.matchId || '', 'Заезд': entry.raceIndex == null ? '' : Number(entry.raceIndex) + 1, 'Исходное время': entry.rawTime ?? '', 'Итоговое время': entry.dq ? 'DQ' : (entry.adjustedTime ?? ''), 'Штрафы': entry.penalties || 0, 'Источник': raceSourceLabel(entry.source), 'Исправление BLE': entry.correction ? 'Да' : '', 'Исправлена запись': entry.correctionOf || '' })); const sheet = XLSX.utils.json_to_sheet(rows); sheet['!cols'] = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.min(28, Math.max(12, key.length + 2)) })); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Журнал заездов'); const eventPart = (state.eventName || 'соревнование').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40); XLSX.writeFile(workbook, `${eventPart || 'соревнование'}_журнал_заездов.xlsx`); showToast('Журнал заездов выгружен'); }).catch(() => showToast('Не удалось загрузить библиотеку Excel')); }
function finalProtocolRoundLabel(bracket, match) { if (match.id === 'small-final') return 'CF'; const finalRound = Math.log2(bracket.size) - 1; if (match.round === finalRound) return 'F'; if (match.round === finalRound - 1) return 'SF'; const stageSize = 2 ** (finalRound - match.round + 1); return stageSize === 8 ? 'QF' : `R${stageSize}`; }
function finalProtocolMatches() { const columns = []; CATEGORIES.forEach((category) => { const bracket = categoryState(category.id).bracket; if (!bracket) return; bracket.matches.forEach((match) => { const label = finalProtocolRoundLabel(bracket, match); const pair = match.id === 'small-final' || label === 'F' ? '' : `${match.index + 1}`; ensureMatchRaces(match).forEach((_, raceIndex) => { const shortLabel = `${label}${pair}-R${raceIndex + 1}`; columns.push({ categoryId: category.id, matchId: match.id, raceIndex, key: shortLabel, sourceKey: `${shortLabel} Source`, penaltyKey: `${shortLabel} Pen`, falseStartKey: `${shortLabel} FS` }); }); }); }); return columns; }
function finalProtocolValue(value) { return value === 'DQ' ? 'DQ' : Number.isFinite(value) ? value : ''; }
function exportFinalProtocolWorkbook() { if (!state.roster.length) return showToast('В текущем списке нет спортсменов'); ensureXlsx().then(() => { const finalColumns = finalProtocolMatches(); const rows = state.roster.map((athlete) => { const category = categoryForAthlete(athlete); const bracket = categoryState(category.id).bracket; const attempt1Log = latestQualificationLog(category.id, athlete.id, 1); const attempt2Log = latestQualificationLog(category.id, athlete.id, 2); const row = { Athlete: athlete.name, DOB: formatBirthDate(athlete.birthDate), Gender: category.label.split(' · ')[1], Region: athlete.region || athlete.city || '', Age: athlete.age, Category: category.label, 'TT1': isQualificationDQ(category.id, athlete.id, 1) ? 'DQ' : (getTime(category.id, athlete.id, 1) ?? ''), 'TT1 Source': raceSourceLabel(attempt1Log?.source), 'TT1 Pen': getPenalty(category.id, athlete.id, 1) || '', 'TT2': isQualificationDQ(category.id, athlete.id, 2) ? 'DQ' : (getTime(category.id, athlete.id, 2) ?? ''), 'TT2 Source': raceSourceLabel(attempt2Log?.source), 'TT2 Pen': getPenalty(category.id, athlete.id, 2) || '', 'Best TT': bestTime(category.id, athlete.id) ?? '' }; const finalValues = []; finalColumns.forEach((column) => { const match = bracket && column.categoryId === category.id ? getMatch(bracket, column.matchId) : null; const side = match?.athlete1 === athlete.id ? 'time1' : match?.athlete2 === athlete.id ? 'time2' : null; const stored = side ? finalRaceStoredValue(category.id, match, column.raceIndex, athlete.id) : null; const value = stored?.value ?? null; row[column.key] = finalProtocolValue(value); row[column.sourceKey] = raceSourceLabel(stored?.source); row[column.penaltyKey] = stored?.penalties || ''; row[column.falseStartKey] = stored?.falseStarts || ''; if (side && value !== null && value !== undefined) finalValues.push(value); }); const numericFinalValues = finalValues.filter((value) => Number.isFinite(value)); row['Best KO Time'] = numericFinalValues.length ? Math.min(...numericFinalValues) : finalValues.includes('DQ') ? 'DQ' : ''; return row; }); const sheet = XLSX.utils.json_to_sheet(rows); sheet['!cols'] = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.min(30, Math.max(12, key.length + 2)) })); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Final Protocol'); const eventPart = (state.eventName || 'competition').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40); XLSX.writeFile(workbook, `${eventPart || 'competition'}_final_protocol.xlsx`); showToast('Final protocol exported'); }).catch(() => showToast('Не удалось загрузить библиотеку Excel')); }
function closeQualificationExportModal() { $('#qualificationExportModal').classList.add('hidden'); }
function backToListsFromQualificationExport() { closeQualificationExportModal(); openListsModal(); }
function openQualificationExportModal() { if (!state.roster.length) return showToast('В текущем списке нет спортсменов'); closeListsModal(); const host = $('#qualificationExportGroups'); const ageOrder = new Map(sortedAgeGroups().map((group, index) => [group.id, index])); const categories = CATEGORIES.filter((category) => activeCategoryIds().includes(category.id)).sort((a, b) => ageOrder.get(a.ageId) - ageOrder.get(b.ageId) || a.label.localeCompare(b.label, 'ru')); host.innerHTML = categories.map((category) => { const count = athletesForCategory(category.id).length; return `<label class="qualification-export-option"><input type="checkbox" value="${category.id}" /><span><strong>${escapeHtml(category.label)}</strong><small>${count} уч.</small></span></label>`; }).join(''); $('#qualificationExportModal').classList.remove('hidden'); }
function exportSelectedQualification() { const selectedCategoryIds = $$('#qualificationExportGroups input[type="checkbox"]:checked').map((input) => input.value); if (!selectedCategoryIds.length) return showToast('Выберите хотя бы одну группу для выгрузки'); closeQualificationExportModal(); exportRosterWorkbook(selectedCategoryIds); }
function qualificationExportGroupLabel(athlete) { const category = categoryForAthlete(athlete); const age = AGE_GROUPS.find((group) => group.id === category.ageId); const shortAge = (age?.short || String(athlete.age)).replace('—', '-'); return `${shortAge} ${category.label.split(' · ')[1]}`; }
function exportRosterWorkbook(selectedCategoryIds = activeCategoryIds()) { if (!state.roster.length) return showToast('В текущем списке нет спортсменов'); const selected = new Set(selectedCategoryIds); const roster = state.roster.filter((athlete) => selected.has(categoryForAthlete(athlete)?.id)); if (!roster.length) return showToast('В выбранных группах нет спортсменов'); ensureXlsx().then(() => { const rows = roster.map((athlete) => { const category = categoryForAthlete(athlete); const falseStarts = categoryState(category.id).falseStarts || {}; const result = (attempt) => isQualificationDQ(category.id, athlete.id, attempt) ? 'DQ' : (getTime(category.id, athlete.id, attempt) ?? ''); const penalty = (attempt) => getPenalty(category.id, athlete.id, attempt) || ''; return { 'Спортсмен': athlete.name, 'Группа': qualificationExportGroupLabel(athlete), 'TT1': result(1), 'Штраф 1': penalty(1), 'ФС 1': falseStarts[1]?.[athlete.id] || '', 'TT2': result(2), 'Штраф 2': penalty(2), 'ФС 2': falseStarts[2]?.[athlete.id] || '', 'Лучшее': bestTime(category.id, athlete.id) ?? '' }; }); const sheet = XLSX.utils.json_to_sheet(rows); sheet['!cols'] = [{ wch: 30 }, { wch: 19 }, { wch: 10 }, { wch: 10 }, { wch: 7 }, { wch: 10 }, { wch: 10 }, { wch: 7 }, { wch: 11 }]; sheet['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToWidth: 1, fitToHeight: 0, scale: 80 }; sheet['!margins'] = { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }; sheet['!printOptions'] = { gridLines: false }; sheet['!autofilter'] = { ref: `A1:I${rows.length + 1}` }; const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Квалификация'); const eventPart = (state.eventName || 'соревнование').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40); XLSX.writeFile(workbook, `${eventPart || 'соревнование'}_квалификация.xlsx`); showToast('Результаты квалификации выгружены'); }).catch(() => showToast('Не удалось загрузить библиотеку Excel')); }
function resetSavedData() { if (!confirm('Очистить сохранённые данные и вернуть заводские настройки?')) return; localStorage.clear(); sessionStorage.clear(); const separator = location.pathname.includes('?') ? '&' : '?'; location.replace(`${location.pathname}${separator}factory-reset=${Date.now()}${location.hash}`); }
function cancelImport() { pendingImport = null; $('#importModal').classList.add('hidden'); }
function backToListsFromImport() { cancelImport(); openListsModal(); }
function clearRoster() {
  if (!confirm('Очистить список спортсменов и результаты?')) return;
  state.roster = [];
  state.enabledAgeGroups = AGE_GROUPS.map((group) => group.id);
  state.enabledCategories = CATEGORIES.map((category) => category.id);
  state.categories = createCategoryStates();
  state.phase = 'qualification';
  state.lanes = lanesForRoster([]);
  state.phaseLanes = { qualification: state.lanes, finals: [createLane(), createLane()] };
  state.selectedFinalCategory = CATEGORIES[0].id;
  state.activity = [];
  state.raceLog = [];
  persist('Список и результаты очищены');
  renderAll();
  showToast('Список, результаты и финальные сетки очищены');
}

function qualificationRanking(categoryId) { return athletesForCategory(categoryId).slice().sort((a, b) => { const aBest = bestTime(categoryId, a.id); const bBest = bestTime(categoryId, b.id); if (!Number.isFinite(aBest) && Number.isFinite(bBest)) return 1; if (Number.isFinite(aBest) && !Number.isFinite(bBest)) return -1; return (aBest ?? Infinity) - (bBest ?? Infinity) || Number(b.rating) - Number(a.rating); }); }
function roundLabel(size, round) { const finalRound = Math.log2(size) - 1; if (round === finalRound) return 'Final'; if (round === finalRound - 1) return 'Semi-Final'; const stageSize = 2 ** (finalRound - round + 1); return stageSize === 8 ? 'Quarter-Final' : `Round of ${stageSize}`; }
function buildBracket(categoryId, size) { const seeded = qualificationRanking(categoryId).filter((athlete) => Number.isFinite(bestTime(categoryId, athlete.id))).slice(0, size); const matches = []; const rounds = Math.log2(size); for (let index = 0; index < size / 2; index += 1) matches.push({ id: `r0m${index}`, round: 0, index, label: roundLabel(size, 0), athlete1: seeded[index]?.id || null, athlete2: seeded[size - index - 1]?.id || null, time1: null, time2: null, winnerId: null, loserId: null }); for (let round = 1; round < rounds; round += 1) for (let index = 0; index < size / (2 ** (round + 1)); index += 1) matches.push({ id: `r${round}m${index}`, round, index, label: roundLabel(size, round), athlete1: null, athlete2: null, time1: null, time2: null, winnerId: null, loserId: null }); matches.push({ id: 'small-final', round: rounds, index: 0, label: 'Consolation Final', athlete1: null, athlete2: null, time1: null, time2: null, winnerId: null, loserId: null, isSmall: true }); const bracket = { size, matches, selectedMatchId: matches[0]?.id || null }; resolveAutoAdvances(bracket, categoryId); return bracket; }
function getMatch(bracket, id) { return bracket.matches.find((match) => match.id === id); }
function emptyFinalRaces(count = 2) { return Array.from({ length: count }, () => ({ time1: null, time2: null, penalty1: 0, penalty2: 0, falseStarts1: 0, falseStarts2: 0, source1: null, source2: null })); }
function ensureMatchRaces(match) {
  if (!Array.isArray(match.races)) {
    match.races = [];
    if (match.time1 !== null || match.time2 !== null) match.races.push({ time1: match.time1 ?? null, time2: match.time2 ?? null, penalty1: 0, penalty2: 0, falseStarts1: 0, falseStarts2: 0, source1: null, source2: null });
  }
  while (match.races.length < 2) match.races.push({ time1: null, time2: null, penalty1: 0, penalty2: 0, falseStarts1: 0, falseStarts2: 0, source1: null, source2: null });
  match.races.forEach((race) => { race.penalty1 ??= 0; race.penalty2 ??= 0; race.falseStarts1 ??= 0; race.falseStarts2 ??= 0; race.source1 ??= null; race.source2 ??= null; });

  // Keep historical race buttons and timer values available after a bracket
  // recalculation. This restores only missing race data; it never recalculates
  // the bracket and never overwrites a value already present in match.races.
  const logged = new Map();
  (state.raceLog || [])
    .filter((entry) => entry.phase === 'finals' && entry.matchId === match.id && Number.isInteger(entry.raceIndex) && (entry.athleteId === match.athlete1 || entry.athleteId === match.athlete2))
    .forEach((entry) => logged.set(`${entry.raceIndex}|${entry.athleteId}`, entry));
  const maxLoggedRace = [...logged.values()].reduce((max, entry) => Math.max(max, entry.raceIndex), -1);
  while (match.races.length <= maxLoggedRace) match.races.push({ time1: null, time2: null, penalty1: 0, penalty2: 0, falseStarts1: 0, falseStarts2: 0, source1: null, source2: null });
  logged.forEach((entry) => {
    const race = match.races[entry.raceIndex];
    if (!race) return;
    const side = entry.athleteId === match.athlete1 ? '1' : entry.athleteId === match.athlete2 ? '2' : null;
    if (!side || race[`time${side}`] !== null && race[`time${side}`] !== undefined) return;
    race[`time${side}`] = entry.dq ? 'DQ' : entry.adjustedTime;
    race[`penalty${side}`] = Number(entry.penalties || 0);
    race[`falseStarts${side}`] = Number(entry.falseStarts || 0);
    race[`source${side}`] = entry.source || null;
  });
  return match.races;
}
function finalRaceWinner(race, athlete1, athlete2) {
  const dq1 = race.time1 === 'DQ';
  const dq2 = race.time2 === 'DQ';
  if (dq1 && dq2) return null;
  if (dq1 && race.time2 !== null) return athlete2;
  if (dq2 && race.time1 !== null) return athlete1;
  if (Number.isFinite(race.time1) && Number.isFinite(race.time2)) return race.time1 <= race.time2 ? athlete1 : athlete2;
  return null;
}
function resolveMatchWinner(match, categoryId) {
  const races = ensureMatchRaces(match);
  const wins = { [match.athlete1]: 0, [match.athlete2]: 0 };
  races.forEach((race) => { const winner = finalRaceWinner(race, match.athlete1, match.athlete2); if (winner) wins[winner] += 1; });
  const allRacesComplete = races.every((race) => race.time1 !== null && race.time2 !== null);
  const athlete1DqAllRaces = Boolean(match.athlete1 && match.athlete2 && races.length && races.every((race) => race.time1 === 'DQ'));
  const athlete2DqAllRaces = Boolean(match.athlete1 && match.athlete2 && races.length && races.every((race) => race.time2 === 'DQ'));
  let winnerId = athlete1DqAllRaces && !athlete2DqAllRaces ? match.athlete2 : athlete2DqAllRaces && !athlete1DqAllRaces ? match.athlete1 : wins[match.athlete1] >= 2 ? match.athlete1 : wins[match.athlete2] >= 2 ? match.athlete2 : null;
  if (!winnerId && races.length === 5 && allRacesComplete && categoryId) {
    const qualificationTime1 = bestTime(categoryId, match.athlete1);
    const qualificationTime2 = bestTime(categoryId, match.athlete2);
    if (Number.isFinite(qualificationTime1) && Number.isFinite(qualificationTime2) && qualificationTime1 !== qualificationTime2) winnerId = qualificationTime1 < qualificationTime2 ? match.athlete1 : match.athlete2;
  }
  match.winnerId = winnerId;
  match.loserId = winnerId ? (winnerId === match.athlete1 ? match.athlete2 : match.athlete1) : null;
  if (!winnerId && allRacesComplete && races.length < 5) races.push({ time1: null, time2: null, penalty1: 0, penalty2: 0, falseStarts1: 0, falseStarts2: 0, source1: null, source2: null });
  return winnerId;
}
function finalRaceForAthlete(match, athleteId) { return ensureMatchRaces(match).findIndex((race) => (athleteId === match.athlete1 ? race.time1 : race.time2) === null); }
function matchReadyForAdvance(match) { return !match || Boolean(match.winnerId) || (!match.athlete1 && !match.athlete2); }
function resolveAutoAdvances(bracket, categoryId) {
  const finalRound = Math.log2(bracket.size) - 1;
  for (let round = 0; round <= finalRound; round += 1) bracket.matches.filter((match) => match.round === round).forEach((match) => {
    ensureMatchRaces(match);
    if (round > 0) {
      const feederA = getMatch(bracket, `r${round - 1}m${match.index * 2}`);
      const feederB = getMatch(bracket, `r${round - 1}m${match.index * 2 + 1}`);
      const feederAReady = matchReadyForAdvance(feederA);
      const feederBReady = matchReadyForAdvance(feederB);
      const athlete1 = feederAReady ? feederA?.winnerId || null : null;
      const athlete2 = feederBReady ? feederB?.winnerId || null : null;
      if (match.athlete1 !== athlete1 || match.athlete2 !== athlete2) {
        match.athlete1 = athlete1; match.athlete2 = athlete2; match.time1 = null; match.time2 = null; match.races = emptyFinalRaces(); match.winnerId = null; match.loserId = null;
      }
      if (!feederAReady || !feederBReady) {
        match.winnerId = null; match.loserId = null;
        return;
      }
    }
    const only = match.athlete1 && !match.athlete2 ? match.athlete1 : !match.athlete1 && match.athlete2 ? match.athlete2 : null;
    if (only) { match.winnerId = only; match.loserId = null; } else if (match.athlete1 && match.athlete2) resolveMatchWinner(match, categoryId); else { match.winnerId = null; match.loserId = null; }
  });
  const small = getMatch(bracket, 'small-final');
  const semis = bracket.matches.filter((match) => match.round === finalRound - 1);
  const semi1Ready = matchReadyForAdvance(semis[0]);
  const semi2Ready = matchReadyForAdvance(semis[1]);
  const loser1 = semi1Ready && semis[0]?.loserId && semis[0].loserId !== semis[0].winnerId ? semis[0].loserId : null;
  const loser2 = semi2Ready && semis[1]?.loserId && semis[1].loserId !== semis[1].winnerId ? semis[1].loserId : null;
  if (small && (small.athlete1 !== loser1 || small.athlete2 !== loser2)) { small.athlete1 = loser1; small.athlete2 = loser2; small.time1 = null; small.time2 = null; small.races = emptyFinalRaces(); small.winnerId = null; small.loserId = null; }
  if (small && (!semi1Ready || !semi2Ready)) { small.winnerId = null; small.loserId = null; return; }
  if (small) { if (small.athlete1 && small.athlete2) resolveMatchWinner(small, categoryId); else if (small.athlete1 || small.athlete2) small.winnerId = small.athlete1 || small.athlete2; }
}
function recalculateBracket(bracket, categoryId) { if (!bracket) return; for (let pass = 0; pass < Math.max(2, Math.log2(bracket.size)); pass += 1) resolveAutoAdvances(bracket, categoryId); }
function syncBracketBeforeRender(categoryId) { const bracket = categoryState(categoryId).bracket; if (!bracket) return; bracket.matches.forEach((match) => { match.label = match.id === 'small-final' ? 'Consolation Final' : roundLabel(bracket.size, match.round); }); }

function updateStandings(categoryId) { const bracket = categoryState(categoryId).bracket; if (!bracket) return; const finalRound = Math.log2(bracket.size) - 1; const big = bracket.matches.find((match) => match.round === finalRound); const small = getMatch(bracket, 'small-final'); categoryState(categoryId).standings = [big?.winnerId, big?.loserId, small?.winnerId, small?.loserId].filter(Boolean); }
function resolveMatch(categoryId, matchId) { const bracket = categoryState(categoryId).bracket; const match = bracket && getMatch(bracket, matchId); if (!match) return; ensureMatchRaces(match); match.time1 = match.races[0].time1; match.time2 = match.races[0].time2; recalculateBracket(bracket, categoryId); updateStandings(categoryId); persist(); }

function renderMatch(categoryId, match) { const races = ensureMatchRaces(match); const a1 = athleteById(match.athlete1); const a2 = athleteById(match.athlete2); const category = categoryState(categoryId); const selected = category.selectedMatchId === match.id; const gridStyle = `style="grid-template-columns:minmax(120px,1fr) repeat(${races.length},64px)"`; const raceHeaders = races.map((_, index) => `<button type="button" class="match-race-button ${category.selectedMatchId === match.id && category.selectedRaceIndex === index ? 'active' : ''}" data-final-race="${match.id}" data-race-index="${index}">RUN ${index + 1}</button>`).join(''); const row = (athlete, side) => `<div class="match-athlete ${match.winnerId === athlete?.id ? 'winner' : ''}" ${gridStyle}><strong class="${match.winnerId === athlete?.id ? 'winner-name' : ''}">${athlete ? escapeHtml(athlete.name) : '— / bye'}</strong>${races.map((race, index) => { const value = athlete ? finalRaceStoredValue(categoryId, match, index, athlete.id).value : null; const opponentValue = athlete?.id === match.athlete1 ? finalRaceStoredValue(categoryId, match, index, match.athlete2).value : finalRaceStoredValue(categoryId, match, index, match.athlete1).value; const raceWinner = athlete && opponentValue !== null && opponentValue !== undefined && value !== null && value !== undefined ? finalRaceWinner({ time1: athlete.id === match.athlete1 ? value : opponentValue, time2: athlete.id === match.athlete2 ? value : opponentValue }, match.athlete1, match.athlete2) : null; return `<span class="match-race-value ${raceWinner === athlete?.id ? 'race-winner' : ''}">${value ?? '—'}</span>`; }).join('')}</div>`; return `<article class="match-card ${match.isSmall ? 'final-match' : ''} ${selected ? 'selected' : ''}" data-match="${match.id}"><div class="match-title"><span>${match.label}</span></div><div class="match-race-head" ${gridStyle}><span>ATHLETE</span>${raceHeaders}</div>${row(a1, 1)}${row(a2, 2)}</article>`; }
function renderBracket() { const categoryId = state.selectedFinalCategory; syncBracketBeforeRender(categoryId); const bracket = categoryState(categoryId).bracket; if (!bracket) { $('#bracketBoard').innerHTML = `<div class="bracket-empty">Сетка ещё не собрана. Когда категория завершит обе попытки, выберите размер финала и соберите сетку.</div>`; return; } const rounds = Math.log2(bracket.size); const columns = []; for (let round = 0; round < rounds; round += 1) { const matches = bracket.matches.filter((match) => match.round === round); if (round === rounds - 1) columns.push(`<div class="bracket-column">${renderMatch(categoryId, getMatch(bracket, 'small-final'))}</div>`); columns.push(`<div class="bracket-column">${matches.map((match) => renderMatch(categoryId, match)).join('')}</div>`); } $('#bracketBoard').innerHTML = `<div class="bracket-grid">${columns.join('')}</div>`; const board = $('#bracketBoard'); board.querySelectorAll('[data-final-race]').forEach((raceButton) => raceButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); selectFinalRaceForTiming(categoryId, raceButton.dataset.finalRace, Number(raceButton.dataset.raceIndex)); })); board.onclick = (event) => { if (event.target.closest('[data-final-race]')) return; const card = event.target.closest('[data-match]'); if (card && board.contains(card)) selectMatchForTiming(categoryId, card.dataset.match); }; }


function finalLaneAthletes(match, raceIndex) { return raceIndex % 2 === 1 ? [match.athlete2, match.athlete1] : [match.athlete1, match.athlete2]; }
function selectFinalRaceForTiming(categoryId, matchId, raceIndex) {
  const category = categoryState(categoryId);
  if (state.phase === 'finals' && state.lanes.some((lane) => lane.running || lane.pendingFinalResult)) return showToast('Сначала завершите текущий RUN');
  const match = getMatch(category.bracket, matchId);
  const index = Number(raceIndex);
  const races = match ? ensureMatchRaces(match) : [];
  if (!match?.athlete1 || !match?.athlete2) return showToast('В этой паре bye — заезд не нужен');
  if (!Number.isInteger(index) || !races[index]) return showToast('Этот заезд ещё не создан');
  category.selectedMatchId = matchId;
  category.selectedRaceIndex = index;
  state.selectedFinalCategory = categoryId;
  if (state.phase !== 'finals') { state.phaseLanes[state.phase] = state.lanes; state.phase = 'finals'; }
  state.lanes = [createLane(categoryId), createLane(categoryId)];
  state.phaseLanes.finals = state.lanes;
  const reviewOnly = races[index].time1 !== null && races[index].time1 !== undefined && races[index].time2 !== null && races[index].time2 !== undefined;
  finalLaneAthletes(match, index).forEach((athleteId, laneIndex) => {
    const lane = state.lanes[laneIndex];
    const stored = finalRaceStoredValue(categoryId, match, index, athleteId);
    const historyEntry = [...(state.raceLog || [])].reverse().find((entry) => entry.phase === 'finals' && entry.categoryId === categoryId && entry.matchId === match.id && entry.raceIndex === index && entry.athleteId === athleteId && Number.isFinite(entry.rawTime));
    lane.athleteId = athleteId;
    lane.penalties = stored.penalties;
    lane.dq = stored.value === 'DQ';
    lane.time = Number.isFinite(stored.value) ? stored.value : null;
    lane.finalRawTime = Number.isFinite(stored.value) ? Number((stored.value - stored.penalties * 0.2).toFixed(3)) : null;
    lane.finalRaceKey = `${match.id}|${index}|${athleteId}`;
    lane.reviewOnly = reviewOnly;
    lane.historyDqTime = reviewOnly && stored.value === 'DQ' ? historyEntry?.rawTime ?? null : null;
  });
  addActivity(`Selected Run ${index + 1} · ${match.label}`);
  persist();
  renderAll();
}
function selectMatchForTiming(categoryId, matchId) { commitPendingFinalResults(false); const match = getMatch(categoryState(categoryId).bracket, matchId); if (!match?.athlete1 || !match?.athlete2) return showToast('В этой паре bye — заезд не нужен'); const races = ensureMatchRaces(match); const unfinishedIndex = races.findIndex((race) => race.time1 === null || race.time2 === null); const raceIndex = unfinishedIndex >= 0 ? unfinishedIndex : Math.max(0, races.length - 1); selectFinalRaceForTiming(categoryId, matchId, raceIndex); }

  function wireEvents() { $('#startAllBtn').addEventListener('click', startAllLanes); $('#resetAllBtn').addEventListener('click', resetAllLanes); $('#bleBtn').addEventListener('click', connectBle); $('#disconnectBtn').addEventListener('click', disconnectBle); $('#themeToggle').addEventListener('click', toggleTheme); $('#listsBtn').addEventListener('click', openListsModal); $('#closeListsBtn').addEventListener('click', closeListsModal); $('#rosterFileInput').addEventListener('change', () => { const file = $('#rosterFileInput').files?.[0]; if (file) importWorkbook(file); $('#rosterFileInput').value = ''; }); $('#exportRosterBtn').addEventListener('click', openQualificationExportModal); $('#exportProtocolBtn').addEventListener('click', exportFinalProtocolWorkbook); $('#cancelQualificationExportBtn').addEventListener('click', closeQualificationExportModal); $('#backToListsFromExportBtn').addEventListener('click', backToListsFromQualificationExport); $('#cancelQualificationExportBtnBottom').addEventListener('click', closeQualificationExportModal); $('#confirmQualificationExportBtn').addEventListener('click', exportSelectedQualification); $('#exportRaceLogBtn').addEventListener('click', exportRaceLogWorkbook); $('#openCorrectionsBtn').addEventListener('click', openCorrectionsModal); $('#backToListsFromCorrectionsBtn').addEventListener('click', backToListsFromCorrections); $('#closeCorrectionsBtn').addEventListener('click', closeCorrectionsModal); $('#closeCorrectionsBtnBottom').addEventListener('click', closeCorrectionsModal); $('#correctionsRows').addEventListener('click', (event) => { const save = event.target.closest('[data-correction-save]'); const replace = event.target.closest('[data-correction-replace]'); const remove = event.target.closest('[data-correction-delete]'); if (save) editQualificationResult(save.dataset.correctionSave); if (replace) replaceQualificationResult(replace.dataset.correctionReplace); if (remove) deleteQualificationResult(remove.dataset.correctionDelete); }); $('#addGroupFromListsBtn').addEventListener('click', () => { closeListsModal(); openAddGroup(); }); $('#clearRosterBtn').addEventListener('click', clearRoster); $('#resetStorageBtn').addEventListener('click', resetSavedData); $('#resetFinalBracketBtn').addEventListener('click', resetFinalBracket); $('#confirmImportBtn').addEventListener('click', confirmImport); $('#cancelImportBtn').addEventListener('click', cancelImport); $('#backToListsFromImportBtn').addEventListener('click', backToListsFromImport); $('#cancelImportBtnBottom').addEventListener('click', cancelImport); $('#closeAddGroupBtn').addEventListener('click', closeAddGroup); $('#backToListsFromAddGroupBtn').addEventListener('click', backToListsFromAddGroup); $('#ageGroupEditorList').addEventListener('click', (event) => { const remove = event.target.closest('[data-remove-age-group]'); if (remove) removeAgeGroup(remove.dataset.removeAgeGroup); }); $('#ageGroupForm').addEventListener('submit', (event) => { event.preventDefault(); addCustomAgeGroup(); }); $('#ageGroupUnlimited').addEventListener('change', () => { $('#ageGroupMax').disabled = $('#ageGroupUnlimited').checked; }); $('#eventName').addEventListener('change', () => { state.eventName = $('#eventName').value; persist(); }); $('#eventDate').addEventListener('change', () => { state.eventDate = $('#eventDate').value; persist(); }); $$('.phase-tab').forEach((button) => button.addEventListener('click', () => switchPhase(button.dataset.phase))); }
  function wireFrsEvents() { $('#frsConnectBtn').addEventListener('click', () => { closeListsModal(); openFrsConnectModal(); }); $('#closeFrsConnectBtn').addEventListener('click', closeFrsConnectModal); $('#cancelFrsConnectBtn').addEventListener('click', closeFrsConnectModal); $('#confirmFrsConnectBtn').addEventListener('click', () => connectFrsServer().catch((error) => { setFrsStatus(false); showToast(`Ошибка ФРС: ${error.message}`); })); }
  function wireRosterCorrectionEvents() { $('#correctionsRosterRows').addEventListener('click', (event) => { const remove = event.target.closest('[data-roster-delete]'); const dq = event.target.closest('[data-final-dq]'); if (remove) removeAthleteFromCompetition(remove.dataset.rosterDelete); if (dq) markAthleteFinalDQ(dq.dataset.finalDq); }); $('#correctionsAthleteSearch').addEventListener('input', renderCorrections); $('#addAthleteBirthDate').addEventListener('input', formatBirthDateInput); $('#addAthleteForm').addEventListener('submit', (event) => { event.preventDefault(); addAthleteFromCorrections(); }); }

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
wireQueueResizers();
wireEvents();
wireFrsEvents();
wireRosterCorrectionEvents();
renderAll();
setFrsStatus(Boolean(state.frs?.online), state.frs?.online ? 'online' : 'offline');
setInterval(() => { if (state.lanes.some((lane) => lane.running)) renderLanes(); }, 500);
window.addEventListener('beforeunload', () => persist());
