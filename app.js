const SERVICE_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50100406e';
const RX_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50200406e';
const TX_UUID = '9ecadc24-0ee5-a9e0-93f3-a3b50300406e';
const BLE_PROFILES = [{ service: SERVICE_UUID, rx: RX_UUID, tx: TX_UUID }, { service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', rx: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', tx: '6e400003-b5a3-f393-e0a9-e50e24dcca9e' }];
const STORAGE_KEY = 'slalom-timing-control-v4';

const AGE_GROUPS = [
  { id: 'g8', label: '8–9 лет', short: '8—9', min: 8, max: 9, male: 'мальчики', female: 'девочки' },
  { id: 'g10', label: '10–14 лет', short: '10—14', min: 10, max: 14, male: 'юноши', female: 'девушки' },
  { id: 'g15', label: '15–18 лет', short: '15—18', min: 15, max: 18, male: 'юноши', female: 'девушки' },
  { id: 'g19', label: '19+ лет', short: '19+', min: 19, max: 150, male: 'мужчины', female: 'женщины' }
];
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

function ageGroupForAge(age) { return AGE_GROUPS.slice().sort((a, b) => b.min - a.min).find((group) => Number(age) >= group.min && Number(age) <= group.max) || AGE_GROUPS[AGE_GROUPS.length - 1]; }
function normalizeGenderKey(value, age) {
  const text = String(value ?? '').trim().toLowerCase().replace(/ё/g, 'е');
  const female = /жен|дев|girl|female|woman|women|(^|[\s./_-])[ждf](?=$|[\s./_-])/i.test(text);
  const male = /муж|маль|юнош|boy|male|man|men|(^|[\s./_-])[мm](?=$|[\s./_-])/i.test(text);
  if (female) return Number(age) >= 19 ? 'women' : 'girls';
  if (male) return Number(age) >= 19 ? 'men' : 'boys';
  return Number(age) >= 19 ? 'men' : 'boys';
}
function genderLabel(key) { return ({ boys: 'мальчики', girls: 'девочки', men: 'мужчины', women: 'женщины' })[key] || key; }
function categoryDefinitions() { return AGE_GROUPS.flatMap((age) => [{ id: `${age.id}-${age.max >= 19 ? 'men' : 'boys'}`, ageId: age.id, gender: age.max >= 19 ? 'men' : 'boys', label: `${age.label} · ${age.male}`, short: `${age.short} · ${age.max >= 19 ? 'муж.' : age.male.slice(0, -2)}` }, { id: `${age.id}-${age.max >= 19 ? 'women' : 'girls'}`, ageId: age.id, gender: age.max >= 19 ? 'women' : 'girls', label: `${age.label} · ${age.female}`, short: `${age.short} · ${age.max >= 19 ? 'жен.' : age.female.slice(0, -2)}` }]); }
const CATEGORIES = categoryDefinitions();
function categoryById(id) { return CATEGORIES.find((category) => category.id === id) || CATEGORIES[0]; }
function categoryForAthlete(athlete) { const age = ageGroupForAge(athlete.age); const gender = normalizeGenderKey(athlete.gender, athlete.age); return categoryById(`${age.id}-${gender}`); }
function categoryLabelForAthlete(athlete) { return categoryForAthlete(athlete).label; }
function activeCategoryIds() { return CATEGORIES.filter((category) => athletesForCategory(category.id).length > 0 || state.enabledAgeGroups?.includes(category.ageId)).map((category) => category.id); }

function emptyCategoryState() { return { attempt: 1, attempts: { 1: {}, 2: {} }, rawAttempts: { 1: {}, 2: {} }, penalties: { 1: {}, 2: {} }, finalSize: 4, bracket: null, selectedMatchId: null, standings: [] }; }
function createCategoryStates() { return Object.fromEntries(CATEGORIES.map((category) => [category.id, emptyCategoryState()])); }
function createLane(categoryId = null) { return { categoryId, athleteId: null, time: null, penalties: 0, dq: false, falseStarts: 0, running: false, startedAt: null, error: null, queueHistory: [], pendingResult: null }; }
function firstActiveCategory(exclude = [], roster = DEMO_ROSTER) { const ids = CATEGORIES.filter((category) => roster.some((athlete) => categoryForAthlete(athlete).id === category.id)).map((category) => category.id); return ids.find((id) => !exclude.includes(id)) || ids[0] || CATEGORIES[0].id; }
function lanesForRoster(roster = DEMO_ROSTER) { const first = firstActiveCategory([], roster); const second = firstActiveCategory([first], roster); return [createLane(first), createLane(second === first ? CATEGORIES[1]?.id || CATEGORIES[0].id : second)]; }

function createInitialState() {
  const roster = [];
  const state = { eventName: 'Urban Flow Open', eventDate: new Date().toISOString().slice(0, 10), phase: 'qualification', roster, enabledAgeGroups: AGE_GROUPS.map((group) => group.id), categories: createCategoryStates(), lanes: lanesForRoster(roster), selectedFinalCategory: CATEGORIES[0].id, activity: [] };
  state.lanes.forEach((lane) => { lane.athleteId = state.roster.filter((athlete) => categoryForAthlete(athlete).id === lane.categoryId).sort((a, b) => Number(a.rating) - Number(b.rating))[0]?.id || null; });
  return state;
}

function normalizeRoster(roster) { return roster.map((athlete, index) => ({ ...athlete, id: athlete.id || `athlete-${Date.now()}-${index}`, age: Number(athlete.age), rating: Number(athlete.rating) || 0, gender: normalizeGenderKey(athlete.gender, athlete.age), birthDate: athlete.birthDate || `01.01.${new Date().getFullYear() - Number(athlete.age)}` })); }
function migrateState(saved) {
  const base = createInitialState();
  const roster = normalizeRoster(saved.roster || DEMO_ROSTER);
  const categories = createCategoryStates();
  if (saved.categories) {
    CATEGORIES.forEach((category) => { const old = saved.categories[category.id] || {}; categories[category.id] = { ...categories[category.id], ...old, attempts: { 1: {}, 2: {}, ...(old.attempts || {}) }, rawAttempts: { 1: {}, 2: {}, ...(old.rawAttempts || {}) }, penalties: { 1: {}, 2: {}, ...(old.penalties || {}) }, finalSize: FINAL_SIZES.includes(Number(old.finalSize)) ? Number(old.finalSize) : 4 }; });
  } else if (saved.groups) {
    AGE_GROUPS.forEach((age) => { const old = saved.groups[age.id]; if (!old) return; const target = categories[`${age.id}-boys`]; target.attempts = { 1: { ...(old.attempts?.[1] || {}) }, 2: { ...(old.attempts?.[2] || {}) } }; });
  }
  const savedLanes = Array.isArray(saved.lanes) && saved.lanes.length ? saved.lanes : base.lanes;
  const enabledAgeGroups = saved.enabledAgeGroups?.length ? saved.enabledAgeGroups : AGE_GROUPS.map((group) => group.id);
  const lanes = savedLanes.slice(0, 2).map((lane, index) => ({ ...createLane(lane.categoryId || base.lanes[index]?.categoryId || CATEGORIES[index].id), ...lane, running: false, startedAt: null }));
  while (lanes.length < 2) lanes.push(createLane(CATEGORIES[lanes.length].id));
  const next = { ...base, ...saved, roster, enabledAgeGroups, categories, selectedFinalCategory: saved.selectedFinalCategory || firstActiveCategory([], roster), lanes };
  return next;
}
let state;
try { state = migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch (error) { state = createInitialState(); }
let ble = { device: null, server: null, rx: null, tx: null, connected: false, buffer: '', reconnectTimer: null, reconnectAttempt: 0, manualDisconnect: false };
let timerHandle = null;
let toastHandle = null;
let pendingImport = null;

function persist(message = 'Сохранено только что') { state.eventName = $('#eventName')?.value || state.eventName; state.eventDate = $('#eventDate')?.value || state.eventDate; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); if ($('#saveStatus')) $('#saveStatus').textContent = message; }
function athletesForCategory(categoryId, sourceState = state) { return (sourceState.roster || []).filter((athlete) => categoryForAthlete(athlete).id === categoryId); }
function athleteById(id) { return state.roster.find((athlete) => athlete.id === id) || null; }
function categoryState(categoryId) { if (!state.categories[categoryId]) state.categories[categoryId] = emptyCategoryState(); return state.categories[categoryId]; }
function getTime(categoryId, athleteId, attempt) { return categoryState(categoryId).attempts?.[attempt]?.[athleteId] ?? null; }
function getPenalty(categoryId, athleteId, attempt) { return Number(categoryState(categoryId).penalties?.[attempt]?.[athleteId] || 0); }
function bestTime(categoryId, athleteId) { const values = [1, 2].map((attempt) => getPenalty(categoryId, athleteId, attempt) >= 5 ? null : getTime(categoryId, athleteId, attempt)).filter((value) => Number.isFinite(value)); return values.length ? Math.min(...values) : null; }
function formatTime(value) { return Number.isFinite(value) ? `${Number(value).toFixed(3)} s` : '—'; }
function formatClock(value) { return Number.isFinite(value) ? Number(value).toFixed(3) : '0.000'; }
function parseBirthDateValue(value) { if (value instanceof Date) return new Date(value.getTime()); if (typeof value === 'number' && Number.isFinite(value)) return new Date(Date.UTC(1899, 11, 30) + value * 86400000); const raw = String(value ?? '').trim(); if (!raw) return null; if (/^\d{4,6}(?:\.0+)?$/.test(raw)) return new Date(Date.UTC(1899, 11, 30) + Number(raw) * 86400000); const rus = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+.*)?$/); const parsed = rus ? new Date(Number(rus[3]), Number(rus[2]) - 1, Number(rus[1])) : new Date(raw); return Number.isNaN(parsed.getTime()) ? null : parsed; }
function normalizeBirthDate(value) { const parsed = parseBirthDateValue(value); return parsed ? `${String(parsed.getDate()).padStart(2, '0')}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${parsed.getFullYear()}` : String(value ?? '').trim(); }
function formatBirthDate(value) { if (!value) return 'дата не указана'; const parsed = parseBirthDateValue(value); return parsed ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed) : String(value); }
function ageFromBirthDate(value, referenceDate = state?.eventDate || new Date().toISOString().slice(0, 10)) { const birth = parseBirthDateValue(value); const reference = new Date(`${referenceDate}T12:00:00`); if (!birth || Number.isNaN(reference.getTime())) return NaN; let age = reference.getFullYear() - birth.getFullYear(); const birthdayPassed = reference.getMonth() > birth.getMonth() || (reference.getMonth() === birth.getMonth() && reference.getDate() >= birth.getDate()); if (!birthdayPassed) age -= 1; return age; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function showToast(text) { const toast = $('#toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(toastHandle); toastHandle = setTimeout(() => toast.classList.remove('show'), 2900); }
function addActivity(text) { state.activity = [{ at: Date.now(), text }, ...(state.activity || [])].slice(0, 20); persist(); }

function qualificationOrder(categoryId, attempt = categoryState(categoryId).attempt) {
  const baseOrder = athletesForCategory(categoryId).slice().sort((a, b) => Number(a.rating) - Number(b.rating) || a.name.localeCompare(b.name, 'ru'));
  if (attempt === 1) {
    const waiting = baseOrder.filter((athlete) => !Number.isFinite(getTime(categoryId, athlete.id, 1)));
    const finished = baseOrder.filter((athlete) => Number.isFinite(getTime(categoryId, athlete.id, 1))).sort((a, b) => getTime(categoryId, b.id, 1) - getTime(categoryId, a.id, 1) || a.name.localeCompare(b.name, 'ru'));
    return [...waiting, ...finished];
  }
  if (attempt === 2) {
    const waiting = baseOrder.filter((athlete) => !Number.isFinite(getTime(categoryId, athlete.id, 2)));
    const finished = baseOrder.filter((athlete) => Number.isFinite(getTime(categoryId, athlete.id, 2))).sort((a, b) => getTime(categoryId, b.id, 2) - getTime(categoryId, a.id, 2) || a.name.localeCompare(b.name, 'ru'));
    return [...waiting, ...finished];
  }
  const athletes = baseOrder;
  return athletes.sort((a, b) => { const aTime = getTime(categoryId, a.id, 1); const bTime = getTime(categoryId, b.id, 1); if (!Number.isFinite(aTime) && Number.isFinite(bTime)) return -1; if (Number.isFinite(aTime) && !Number.isFinite(bTime)) return 1; return (bTime ?? Infinity) - (aTime ?? Infinity) || Number(a.rating) - Number(b.rating); });
}
function reservedAthletes(categoryId, laneIndex) { return state.lanes.filter((lane, index) => index !== laneIndex && lane.categoryId === categoryId && lane.athleteId).map((lane) => lane.athleteId); }
function pendingForCategory(categoryId, laneIndex = -1, sourceState = state) { const category = categoryState(categoryId); if (category.attempt > 2) return []; const attempt = category.attempt; const reserved = sourceState === state ? reservedAthletes(categoryId, laneIndex) : []; return qualificationOrder(categoryId, attempt).filter((athlete) => !Number.isFinite(category.attempts[attempt][athlete.id]) && !reserved.includes(athlete.id)); }
function finishedCount(categoryId, attempt) { return athletesForCategory(categoryId).filter((athlete) => Number.isFinite(getTime(categoryId, athlete.id, attempt))).length; }
function categoryComplete(categoryId, attempt) { const total = athletesForCategory(categoryId).length; return total > 0 && finishedCount(categoryId, attempt) >= total; }
function autoAssignLanes() { state.lanes.forEach((lane, index) => { if (!lane.categoryId || lane.athleteId || categoryState(lane.categoryId).attempt > 2) return; lane.athleteId = pendingForCategory(lane.categoryId, index)[0]?.id || null; }); }
function prepareLaneForStart(index) { const lane = state.lanes[index]; if (!lane || state.phase !== 'qualification' || !lane.categoryId) return; const committed = commitLaneResult(index); const attempt = categoryState(lane.categoryId).attempt; const hasRecordedResult = lane.athleteId && attempt <= 2 && Number.isFinite(getTime(lane.categoryId, lane.athleteId, attempt)); if (!committed && !hasRecordedResult) return; const next = pendingForCategory(lane.categoryId, index).find((athlete) => athlete.id !== lane.athleteId) || null; lane.athleteId = next?.id || null; lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.error = null; lane.startedAt = null; }
function advanceCategoryIfComplete(categoryId) { const category = categoryState(categoryId); if (category.attempt === 1 && categoryComplete(categoryId, 1)) { category.attempt = 2; addActivity(`${categoryById(categoryId).label} · попытка 01 завершена, очередь 02 готова`); } if (category.attempt === 2 && categoryComplete(categoryId, 2)) { category.attempt = 3; addActivity(`${categoryById(categoryId).label} · квалификация завершена, финальный посев готов`); } }

function renderSummary() {
  const active = activeCategoryIds(); const ready = active.filter((id) => categoryState(id).attempt > 2).length;
  $('#eventName').value = state.eventName; $('#eventDate').value = state.eventDate; $('#queueMeta').textContent = `${active.length} ${active.length === 1 ? 'категория' : 'категорий'}`; $('#categoryMeta').textContent = `${ready} / ${active.length} финалов`; }

function laneCategoryPicker(lane, laneIndex) {
  const visibleAges = AGE_GROUPS.filter((age) => state.enabledAgeGroups?.includes(age.id) || ['girls', 'boys'].some((gender) => athletesForCategory(categoryById(`${age.id}-${age.max >= 19 ? (gender === 'girls' ? 'women' : 'men') : gender}`).id).length > 0));
  const columnStyle = `style="grid-template-columns: repeat(${Math.max(1, visibleAges.length)}, minmax(0, 1fr));"`;
  const renderGenderRow = (gender) => `<div class="lane-tab-row"><div class="lane-tabs" role="tablist" ${columnStyle}>${visibleAges.map((age) => { const ageGender = age.max >= 19 ? (gender === 'girls' ? 'women' : 'men') : gender; const category = categoryById(`${age.id}-${ageGender}`); const count = athletesForCategory(category.id).length; const genderLabel = gender === 'girls' ? age.female : age.male; const completed = categoryState(category.id).attempt > 2; return `<button class="lane-tab ${category.id === lane.categoryId ? 'active' : ''} ${completed ? 'completed' : ''}" ${completed ? 'disabled' : ''} data-lane-tab="${laneIndex}" data-category-id="${category.id}"><span class="lane-tab-gender">${escapeHtml(genderLabel)}</span><span class="lane-tab-age">${escapeHtml(age.label)}</span><small>${count}</small></button>`; }).join('')}</div></div>`;
  return `<div class="lane-group-picker" data-lane-picker="${laneIndex}">${renderGenderRow('girls')}${renderGenderRow('boys')}</div>`;
}
function openAddGroup() { $('#addGroupModal').classList.remove('hidden'); }
function closeAddGroup() { $('#addGroupModal').classList.add('hidden'); }
function addAgeGroup(ageId) { state.enabledAgeGroups = [...new Set([...(state.enabledAgeGroups || []), ageId])]; closeAddGroup(); persist(); renderAll(); showToast(`${ageGroupForAge(AGE_GROUPS.find((group) => group.id === ageId)?.min || 0).label} добавлена в выбор`); }
function setLaneCategory(index, categoryId) {
  const lane = state.lanes[index];
  if (categoryState(categoryId).attempt > 2) return showToast('Эта группа завершила квалификацию и доступна в разделе «Финалы»');
  if (lane.running || lane.pendingResult || Number.isFinite(lane.time)) return showToast('Сначала зафиксируйте результат или выполните сброс до 0.000');
  commitLaneResult(index); state.lanes[index].categoryId = categoryId; state.lanes[index].athleteId = null; state.lanes[index].time = null; state.lanes[index].penalties = 0; state.lanes[index].dq = false; state.lanes[index].falseStarts = 0; state.lanes[index].running = false; autoAssignLanes(); persist(); renderAll();
}
function commitLaneResult(index) {
  const lane = state.lanes[index]; const pending = lane?.pendingResult;
  if (!lane || !pending || !lane.categoryId || !lane.athleteId) return false;
  const category = categoryState(pending.categoryId || lane.categoryId); const attempt = pending.attempt;
  if (attempt > 2 || Number.isFinite(category.attempts[attempt]?.[lane.athleteId])) return false;
  category.rawAttempts ||= { 1: {}, 2: {} }; category.rawAttempts[attempt] ||= {};
  category.attempts[attempt][lane.athleteId] = pending.adjustedTime;
  category.rawAttempts[attempt][lane.athleteId] = pending.rawTime;
  category.penalties[attempt][lane.athleteId] = pending.dq ? 5 : pending.penalties;
  lane.pendingResult = null;
  addActivity(`${pending.source === 'ble' ? 'BLE / laser' : 'Ручной ввод'} · ${categoryById(pending.categoryId || lane.categoryId).label} · ${athleteById(lane.athleteId)?.name || ''} · ${pending.dq ? 'DQ' : formatTime(pending.adjustedTime)}`);
  advanceCategoryIfComplete(pending.categoryId || lane.categoryId);
  return true;
}
function recalculateLanePenalty(index) {
  const lane = state.lanes[index];
  if (lane?.pendingResult) {
    lane.pendingResult.penalties = lane.penalties;
    lane.pendingResult.dq = lane.dq;
    lane.pendingResult.adjustedTime = Number((lane.pendingResult.rawTime + (lane.dq ? 0 : lane.penalties * 0.2)).toFixed(3));
    lane.time = lane.dq ? null : lane.pendingResult.adjustedTime;
  }
  if (state.phase === 'qualification' && lane?.athleteId && lane.categoryId) {
    const category = categoryState(lane.categoryId); const attempt = [category.attempt, 1, 2].find((candidate) => candidate <= 2 && Number.isFinite(category.attempts[candidate]?.[lane.athleteId]));
    if (attempt) {
      category.rawAttempts ||= { 1: {}, 2: {} };
      category.rawAttempts[attempt] ||= {};
      const rawTime = category.rawAttempts[attempt][lane.athleteId] ?? category.attempts[attempt][lane.athleteId];
      category.rawAttempts[attempt][lane.athleteId] = rawTime;
      category.attempts[attempt][lane.athleteId] = Number((rawTime + (lane.dq ? 0 : lane.penalties * 0.2)).toFixed(3));
      category.penalties[attempt][lane.athleteId] = lane.penalties;
      lane.time = lane.dq ? null : category.attempts[attempt][lane.athleteId];
    }
  }
  persist(); renderAll();
}
function setLanePenalties(index, value) {
  const lane = state.lanes[index]; const numeric = Math.max(0, Math.min(5, Number(value) || 0)); lane.penalties = numeric; lane.dq = numeric >= 5; recalculateLanePenalty(index);
}
function setLaneDQ(index) {
  const lane = state.lanes[index]; lane.penalties = 5; lane.dq = true; recalculateLanePenalty(index);
}
function handleFalseStart(index, number) {
  const lane = state.lanes[index];
  if (!lane?.athleteId) return;
  if (number === 1 && lane.falseStarts === 1) { lane.falseStarts = 0; persist(); renderLanes(); return; }
  if (number === 2 && lane.falseStarts === 2) { lane.falseStarts = 0; lane.pendingResult = null; lane.penalties = 0; lane.dq = false; lane.time = null; persist(); renderLanes(); return; }
  if (lane.pendingResult) return;
  if (lane.falseStarts === 0) {
    lane.falseStarts = 1; persist(); renderLanes(); return;
  }
  lane.falseStarts = 2; lane.running = false; lane.startedAt = null; lane.time = null; lane.penalties = 5; lane.dq = true;
  const category = categoryState(lane.categoryId);
  lane.pendingResult = { categoryId: lane.categoryId, attempt: category.attempt, rawTime: 0, adjustedTime: 0, penalties: 5, dq: true, source: 'false-start' };
  persist(); renderLanes();
}
function promoteNextAthlete(index) {
  const lane = state.lanes[index];
  commitLaneResult(index);
  const skipped = new Set(lane.queueHistory || []);
  const next = pendingForCategory(lane.categoryId, index).find((athlete) => athlete.id !== lane.athleteId && !skipped.has(athlete.id));
  if (!next) { lane.athleteId = null; lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.running = false; lane.startedAt = null; lane.error = null; lane.queueHistory = []; persist(); renderAll(); return showToast('Результат сохранён'); }
  lane.queueHistory = Array.isArray(lane.queueHistory) ? lane.queueHistory : [];
  if (lane.athleteId) lane.queueHistory.push(lane.athleteId);
  lane.athleteId = next.id;
  lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.running = false; lane.startedAt = null; lane.error = null;
  persist(); renderAll();
}
function promotePreviousAthlete(index) {
  const lane = state.lanes[index];
  commitLaneResult(index);
  lane.queueHistory = Array.isArray(lane.queueHistory) ? lane.queueHistory : [];
  const previousId = lane.queueHistory.pop();
  if (!previousId) return showToast('Предыдущего спортсмена нет в истории пропуска');
  lane.athleteId = previousId;
  lane.time = null; lane.penalties = 0; lane.dq = false; lane.falseStarts = 0; lane.running = false; lane.startedAt = null; lane.error = null;
  persist(); renderAll();
}
function resultCell(categoryId, athleteId, attempt) {
  const value = getTime(categoryId, athleteId, attempt);
  const penalty = getPenalty(categoryId, athleteId, attempt);
  return penalty >= 5 ? 'DQ' : Number.isFinite(value) ? formatClock(value) : '—';
}
function waitingListHtml(lane, index) {
  const athletes = lane.categoryId ? qualificationOrder(lane.categoryId, categoryState(lane.categoryId).attempt) : [];
  const attempt = categoryState(lane.categoryId).attempt;
  return athletes.map((athlete, position) => { const completedAttempt = Number.isFinite(getTime(lane.categoryId, athlete.id, attempt)); return `<div class="queue-result-row ${completedAttempt ? 'attempt-complete' : ''}"><span class="queue-result-number">${athletes.length - position}</span><span>${escapeHtml(athlete.name)}</span><span>${escapeHtml(formatBirthDate(athlete.birthDate))}</span><span>${escapeHtml(athlete.region || athlete.city || '—')}</span><span>${resultCell(lane.categoryId, athlete.id, 1)}</span><span>${resultCell(lane.categoryId, athlete.id, 2)}</span><strong>${formatTime(bestTime(lane.categoryId, athlete.id))}</strong></div>`; }).join('');
}
function renderLanes() {
  const now = Date.now();
  $('#laneCards').innerHTML = state.lanes.map((lane, index) => {
    const runningTime = lane.running && Number.isFinite(lane.startedAt) ? (now - lane.startedAt) / 1000 : lane.time; const displayTime = lane.dq ? (lane.pendingResult?.source === 'false-start' ? 'DQ' : '—') : formatClock(runningTime); const nextCandidates = pendingForCategory(lane.categoryId, index).filter((candidate) => candidate.id !== lane.athleteId); const nextAthlete = nextCandidates[0];
    return `<div class="lane-card-wrap"><article class="lane-card ${lane.running ? 'active' : ''} ${Number.isFinite(lane.time) && !lane.running ? 'finished' : ''} ${lane.dq ? 'dq' : ''}"><div class="lane-top lane-group-toggle"><span class="lane-number">ДОРОЖКА ${index + 1}</span></div>${laneCategoryPicker(lane, index)}<div class="lane-athlete-name">${escapeHtml(athleteById(lane.athleteId)?.name || 'Следующий спортсмен')}</div><div class="lane-fs-controls"><button type="button" class="fs-button ${lane.falseStarts >= 1 ? 'active' : ''}" data-false-start="${index}" data-fs-number="1">FS</button><button type="button" class="fs-button ${lane.falseStarts >= 2 ? 'active' : ''}" data-false-start="${index}" data-fs-number="2">FS</button></div><div class="lane-timer-row"><div class="lane-timer-block"><strong class="lane-time">${displayTime}</strong></div><div class="penalty-panel"><input data-lane-penalties="${index}" type="text" inputmode="numeric" maxlength="2" value="${lane.dq ? 'DQ' : lane.penalties}" aria-label="Штрафы дорожки ${index + 1}" /></div></div><div class="lane-next-row"><button data-promote-prev="${index}" class="queue-arrow queue-arrow-prev" ${lane.queueHistory?.length ? '' : 'disabled'} aria-label="Предыдущий спортсмен">←</button><button data-promote-next="${index}" class="next-athlete-trigger" ${nextCandidates.length || lane.pendingResult ? '' : 'disabled'}><span>${nextCandidates.length ? 'СЛЕДУЮЩИЙ' : lane.pendingResult ? 'СОХРАНИТЬ' : 'НЕТ СЛЕДУЮЩЕГО'}</span><strong>${escapeHtml(nextAthlete?.name || (lane.pendingResult ? 'записать результат' : ''))}</strong><b>${nextCandidates.length ? '→' : lane.pendingResult ? '✓' : ''}</b></button><div class="manual-result"><input data-manual-time="${index}" type="text" inputmode="numeric" maxlength="6" placeholder="---" readonly aria-label="Ручное время дорожки ${index + 1}" /></div><div class="penalty-quick-controls"><div class="penalty-quick-row">${[1, 2, 3, 4].map((value) => `<button type="button" class="${lane.penalties === value && !lane.dq ? 'active' : ''}" data-quick-penalty="${index}" data-penalty-value="${value}">${value}</button>`).join('')}</div><button type="button" class="penalty-dq ${lane.dq ? 'active' : ''}" data-lane-dq="${index}">DQ</button></div></div></article><section class="lane-waiting"><div class="queue-result-header"><span>№</span><span>ФИО</span><span>ДАТА РОЖДЕНИЯ</span><span>РЕГИОН</span><span>ПОПЫТКА 01</span><span>ПОПЫТКА 02</span><span>ЛУЧШЕЕ</span></div><div class="waiting-list">${waitingListHtml(lane, index)}</div></section></div>`;
  }).join('');
  $$('[data-lane-tab]').forEach((button) => button.addEventListener('click', () => setLaneCategory(Number(button.dataset.laneTab), button.dataset.categoryId)));
  $$('[data-promote-next]').forEach((button) => button.addEventListener('click', () => promoteNextAthlete(Number(button.dataset.promoteNext))));
  $$('[data-promote-prev]').forEach((button) => button.addEventListener('click', () => promotePreviousAthlete(Number(button.dataset.promotePrev))));
  $$('[data-lane-penalties]').forEach((input) => { input.addEventListener('focus', () => { if (input.value === '0') input.value = ''; }); input.addEventListener('input', () => { const raw = input.value.toUpperCase(); input.value = raw.includes('D') ? 'DQ' : raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, 1); }); input.addEventListener('change', () => setLanePenalties(Number(input.dataset.lanePenalties), input.value === 'DQ' ? 5 : input.value)); });
  $$('[data-quick-penalty]').forEach((button) => button.addEventListener('click', () => { const index = Number(button.dataset.quickPenalty); const lane = state.lanes[index]; const value = Number(button.dataset.penaltyValue); setLanePenalties(index, lane.penalties === value && !lane.dq ? 0 : value); }));
  $$('[data-lane-dq]').forEach((button) => button.addEventListener('click', () => { const index = Number(button.dataset.laneDq); const lane = state.lanes[index]; if (lane.dq) setLanePenalties(index, 0); else setLaneDQ(index); }));
  $$('[data-false-start]').forEach((button) => button.addEventListener('click', () => { const index = Number(button.dataset.falseStart); const lane = state.lanes[index]; const number = Number(button.dataset.fsNumber); if ((number === 1 && lane.falseStarts <= 1) || (number === 2 && lane.falseStarts >= 1)) handleFalseStart(index, number); }));
  $$('[data-manual-time]').forEach((input) => { input.dataset.rawDigits = ''; input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { const index = Number(input.dataset.manualTime); const time = Number(input.value); if (!Number.isFinite(time) || time <= 0) return showToast('Введите время больше нуля'); applyLaneResult(index, time, 'manual'); input.value = ''; input.dataset.rawDigits = ''; return; } if (/^\d$/.test(event.key)) { event.preventDefault(); const digits = `${input.dataset.rawDigits || ''}${event.key}`.slice(0, 5); input.dataset.rawDigits = digits; const padded = digits.padStart(4, '0'); input.value = `${padded.slice(0, -3)}.${padded.slice(-3)}`; return; } if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); input.dataset.rawDigits = (input.dataset.rawDigits || '').slice(0, -1); const digits = input.dataset.rawDigits; if (!digits) { input.value = ''; return; } const padded = digits.padStart(4, '0'); input.value = `${padded.slice(0, -3)}.${padded.slice(-3)}`; } }); });
}
function renderGlobalQueue() { const lanes = state.lanes.map((lane, index) => { const category = categoryById(lane.categoryId); const next = lane.athleteId ? athleteById(lane.athleteId) : pendingForCategory(lane.categoryId, index)[0]; return `<div class="queue-lane"><span class="queue-lane-number">0${index + 1}</span><div><strong>${escapeHtml(category.label)}</strong><span>${next ? `на старте · ${escapeHtml(next.name)}` : 'нет спортсмена на старте'}</span></div><b>${categoryState(lane.categoryId).attempt > 2 ? 'FIN' : `0${categoryState(lane.categoryId).attempt}`}</b></div>`; }).join(''); const nextCategories = activeCategoryIds().filter((id) => !state.lanes.some((lane) => lane.categoryId === id)).slice(0, 4).map((id) => `<div class="queue-next"><span>следующая категория</span><strong>${escapeHtml(categoryById(id).label)}</strong><button data-queue-category="${id}" class="text-button">выбрать →</button></div>`).join(''); $('#globalQueue').innerHTML = lanes + (nextCategories || '<div class="queue-empty">Все активные категории уже назначены на дорожки.</div>'); $$('[data-queue-category]').forEach((button) => button.addEventListener('click', () => { const laneIndex = state.lanes.findIndex((lane) => categoryState(lane.categoryId).attempt > 2 || !lane.athleteId); const index = laneIndex >= 0 ? laneIndex : 0; state.lanes[index].categoryId = button.dataset.queueCategory; state.lanes[index].athleteId = null; autoAssignLanes(); persist(); renderAll(); })); }
function renderCategoryBoard() { const active = activeCategoryIds(); $('#categoryBoard').innerHTML = active.length ? active.map((id) => { const category = categoryById(id); const cat = categoryState(id); const total = athletesForCategory(id).length; const first = finishedCount(id, 1); const second = finishedCount(id, 2); const progress = cat.attempt > 2 ? 100 : Math.round(((first + second) / (total * 2)) * 100); const status = cat.attempt === 1 ? 'попытка 01' : cat.attempt === 2 ? 'попытка 02 · худшие → лучшие' : 'финалы готовы'; return `<div class="category-row ${cat.attempt > 2 ? 'ready' : ''}"><div class="category-row-title"><strong>${escapeHtml(category.label)}</strong><span>${status}</span></div><div class="category-progress"><i><b style="width:${progress}%"></b></i><small>${first}/${total} · ${second}/${total}</small></div><select data-final-size="${id}" aria-label="Размер финала ${category.label}">${FINAL_SIZES.map((size) => `<option value="${size}" ${Number(cat.finalSize) === size ? 'selected' : ''}>финал ${size}</option>`).join('')}</select><button data-open-finals="${id}" class="text-button">${cat.attempt > 2 ? 'открыть финалы →' : 'вести →'}</button></div>`; }).join('') : '<div class="queue-empty">Загрузите список спортсменов, чтобы увидеть категории.</div>'; $$('[data-final-size]').forEach((select) => select.addEventListener('change', () => { categoryState(select.dataset.finalSize).finalSize = Number(select.value); persist(); })); $$('[data-open-finals]').forEach((button) => button.addEventListener('click', () => { state.selectedFinalCategory = button.dataset.openFinals; state.phase = 'finals'; persist(); renderAll(); })); }

function renderPanels() { $$('.phase-tab').forEach((button) => button.classList.toggle('active', button.dataset.phase === state.phase)); $('#qualificationPanel').classList.toggle('hidden', state.phase !== 'qualification'); $('#finalsPanel').classList.toggle('hidden', state.phase !== 'finals'); $('#laneCards').classList.toggle('finals-mode', state.phase === 'finals'); }
function renderBle() { const online = ble.connected; $('#bleBtn').classList.toggle('connected', online); $('#bleBtnText').textContent = online ? 'BLE подключён' : 'Подключить BLE'; $('#disconnectBtn').disabled = !online; $('#startAllBtn').disabled = !online; $('#resetAllBtn').disabled = false; }
function renderFinals() { const active = activeCategoryIds(); const current = active.includes(state.selectedFinalCategory) ? state.selectedFinalCategory : active.find((id) => categoryState(id).attempt > 2) || active[0] || CATEGORIES[0].id; state.selectedFinalCategory = current; $('#finalCategorySelect').innerHTML = (active.length ? active : CATEGORIES.map((category) => category.id)).map((id) => { const category = categoryById(id); const cat = categoryState(id); return `<option value="${id}" ${id === current ? 'selected' : ''}>${escapeHtml(category.label)} · ${athletesForCategory(id).length}${cat.attempt > 2 ? ' · готово' : ''}</option>`; }).join(''); const category = categoryById(current); const cat = categoryState(current); const total = athletesForCategory(current).length; const qualified = qualificationRanking(current).filter((athlete) => Number.isFinite(bestTime(current, athlete.id))).length; $('#finalsCategoryTitle').textContent = category ? `${category.label} · ${cat.attempt > 2 ? 'квалификация завершена' : 'квалификация ещё идёт'}` : 'Выберите категорию'; $('#bracketSize').value = String(cat.finalSize || 4); $('#finalsCategoryProgress').innerHTML = `<span>${qualified} из ${total} с лучшим временем</span><span>${cat.attempt > 2 ? 'Можно собирать посев' : `Ожидаем завершение попытки 0${cat.attempt}`}</span>`; renderBracket(); }
function renderAll() { renderSummary(); renderLanes(); renderGlobalQueue(); renderCategoryBoard(); renderPanels(); renderFinals(); renderBle(); renderListsSummary(); }

function startTicker() { clearInterval(timerHandle); timerHandle = setInterval(() => { if (!state.lanes.some((lane) => lane.running)) return clearInterval(timerHandle); renderLanes(); }, 70); }

function startAllLanes() {
  let started = 0;
  state.lanes.forEach((lane, index) => {
    prepareLaneForStart(index);
    if (!lane.athleteId) return;
    lane.running = true;
    lane.startedAt = Date.now();
    lane.time = null;
    lane.error = null;
    started += 1;
  });
  if (!started) return showToast('На дорожках нет спортсменов');
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

function applyLaneResult(index, time, source = 'ble') {
  const lane = state.lanes[index];
  if (!lane || !lane.athleteId) return showToast(`На дорожке ${index + 1} не выбран спортсмен`);
  const result = Number(time);
  if (!Number.isFinite(result) || result <= 0) return showToast('Получено некорректное время');

  lane.running = false;
  lane.startedAt = null;
  const adjustedTime = Number((result + (lane.dq ? 0 : lane.penalties * 0.2)).toFixed(3));
  if (state.phase === 'qualification') {
    const category = categoryState(lane.categoryId);
    if (category.attempt > 2) return showToast('Эта категория уже завершила квалификацию');
    const attempt = category.attempt;
    if (lane.pendingResult || Number.isFinite(getTime(lane.categoryId, lane.athleteId, attempt))) {
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
    lane.time = lane.dq ? null : adjustedTime;
    lane.queueHistory = [];
    const cat = categoryState(state.selectedFinalCategory);
    const match = cat.bracket?.matches?.find((item) => item.id === cat.selectedMatchId);
    if (match) {
      const raceIndex = finalRaceForAthlete(match, lane.athleteId);
      if (raceIndex >= 0) { ensureMatchRaces(match)[raceIndex][match.athlete1 === lane.athleteId ? 'time1' : 'time2'] = lane.dq ? 'DQ' : adjustedTime; }
      resolveMatch(state.selectedFinalCategory, match.id);
      addActivity(`Финал · ${athleteById(lane.athleteId)?.name || ''} · ${lane.dq ? 'DQ' : formatTime(adjustedTime)}`);
    }
  }
  if (!state.lanes.some((item) => item.running)) clearInterval(timerHandle);
  persist();
  renderAll();
}
function parseBleLine(line) { let payload; try { payload = JSON.parse(line); } catch (error) { addActivity(`BLE · неизвестная строка: ${line.slice(0, 35)}`); return; } const type = payload.type; if (type === 'start') { const indices = payload.lane == null ? [0, 1] : [Number(payload.lane) - 1]; indices.forEach((index) => { if (!state.lanes[index]) return; prepareLaneForStart(index); if (state.lanes[index].athleteId) { state.lanes[index].running = true; state.lanes[index].startedAt = Date.now(); } }); persist(); renderLanes(); startTicker(); } else if (type === 'reset') { clearInterval(timerHandle); state.lanes.forEach((lane) => { lane.running = false; lane.startedAt = null; lane.time = null; if (lane.falseStarts < 2) { lane.penalties = 0; lane.dq = false; } else { lane.penalties = 5; lane.dq = true; } lane.error = null; }); persist(); renderLanes(); } else if (['qualification', 'race', 'laser', 'finish'].includes(type)) { const index = Number(payload.lane) - 1; const time = Number(payload.time ?? payload.result ?? payload.seconds); if (index >= 0 && index < 2 && Number.isFinite(time)) applyLaneResult(index, time, 'ble'); } }
function handleBleNotification(event) { const text = new TextDecoder().decode(event.target.value); ble.buffer += text; const lines = ble.buffer.split(/\r?\n/); ble.buffer = lines.pop() || ''; lines.filter(Boolean).forEach(parseBleLine); }
async function connectToBleDevice(device, isReconnect = false) { ble.device = device; $('#bleBtnText').textContent = 'Подключение…'; const connectPromise = device.gatt.connect(); const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('тайм-аут GATT-подключения')), 10000)); ble.server = await Promise.race([connectPromise, timeoutPromise]); let lastError; for (const profile of BLE_PROFILES) { try { const service = await ble.server.getPrimaryService(profile.service); ble.rx = await service.getCharacteristic(profile.rx); ble.tx = await service.getCharacteristic(profile.tx); break; } catch (error) { lastError = error; ble.rx = null; ble.tx = null; } } if (!ble.rx || !ble.tx) throw lastError || new Error('BLE service/characteristics not found'); await ble.tx.startNotifications(); ble.tx.addEventListener('characteristicvaluechanged', handleBleNotification); ble.connected = true; ble.reconnectAttempt = 0; renderBle(); addActivity(`BLE · ${isReconnect ? 'переподключено к' : 'подключено к'} ${device.name || 'ESP32-BLE-UART'}`); showToast(isReconnect ? 'BLE снова подключён' : 'BLE подключён. События laser готовы.'); }
function scheduleBleReconnect() { if (!ble.device || ble.manualDisconnect || ble.reconnectTimer || ble.reconnectAttempt >= 5) return; const delay = Math.min(8000, 900 * (2 ** ble.reconnectAttempt)); ble.reconnectTimer = setTimeout(async () => { ble.reconnectTimer = null; ble.reconnectAttempt += 1; try { await connectToBleDevice(ble.device, true); } catch (error) { renderBle(); scheduleBleReconnect(); } }, delay); }
async function connectBle() { if (!window.isSecureContext) { $('#bleBtnText').textContent = 'Требуется HTTPS'; return showToast('Откройте страницу через HTTPS'); } if (!navigator.bluetooth) { $('#bleBtnText').textContent = 'Нужен Chrome или Edge'; return showToast('Web Bluetooth недоступен. Откройте страницу в Chrome или Edge.'); } let deviceChosen = false; try { clearTimeout(ble.reconnectTimer); ble.reconnectTimer = null; ble.reconnectAttempt = 0; ble.manualDisconnect = false; const serviceFilters = BLE_PROFILES.map((profile) => ({ services: [profile.service] })); const device = await navigator.bluetooth.requestDevice({ filters: serviceFilters, optionalServices: BLE_PROFILES.map((profile) => profile.service) }); deviceChosen = true; $('#bleBtnText').textContent = 'Подключение…'; device.addEventListener('gattserverdisconnected', () => { ble.connected = false; ble.server = null; ble.rx = null; ble.tx = null; renderBle(); addActivity('BLE · устройство отключено, переподключение запланировано'); scheduleBleReconnect(); }); await connectToBleDevice(device); } catch (error) { if (error?.name === 'NotFoundError' && !deviceChosen) { showToast('Подходящее устройство хронометража не найдено'); return; } ble.connected = false; renderBle(); const message = error?.message || error?.name || 'неизвестная ошибка'; $('#bleBtnText').textContent = 'Ошибка BLE'; addActivity(`BLE · ошибка подключения: ${message}`); showToast(`Не удалось подключить BLE: ${message}`); } }
function sendBleCommand(command) { if (!ble.connected || !ble.rx) return; ble.rx.writeValue(new TextEncoder().encode(command)).catch(() => showToast('Команду BLE не удалось отправить')); }
function disconnectBle() { ble.manualDisconnect = true; clearTimeout(ble.reconnectTimer); ble.reconnectTimer = null; if (ble.device?.gatt?.connected) ble.device.gatt.disconnect(); ble.connected = false; renderBle(); }

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
  const ageKey = find(['возраст', 'возраст участника', 'лет', 'age', 'years', 'years old']);
  const ratingKey = find(['рейтинг', 'спортивный рейтинг', 'rating', 'rank', 'elo']);
  const genderKey = find(['пол', 'пол участника', 'мж', 'gender', 'sex']);
  const birthKey = find(['дата рождения', 'день рождения', 'дата рожд', 'датарожд', 'birth date', 'birthdate', 'birthday', 'dob']);
  const regionKey = find(['регион', 'субъект рф', 'субъект российской федерации', 'область', 'край', 'республика', 'region', 'oblast', 'area']);
  const cityKey = find(['город', 'населенный пункт', 'место проживания', 'city', 'town']);
  const clubKey = find(['клуб', 'команда', 'спортивная школа', 'club', 'team']);
  const errors = [];
  if (!nameKey && !(surnameKey && firstNameKey)) errors.push('Не найдена колонка ФИО / Name или отдельные колонки Фамилия + Имя');
  if (!ageKey && !birthKey) errors.push('Не найдена колонка Возраст / Age или Дата рождения / Birth date');
  if ((!nameKey && !(surnameKey && firstNameKey)) || (!ageKey && !birthKey)) return { roster: [], errors };
  const roster = rows.map((row, index) => {
    const rawBirthDate = birthKey ? row[birthKey] : '';
    const birthDate = normalizeBirthDate(rawBirthDate);
    const parsedAge = ageKey ? Number.parseInt(String(row[ageKey] ?? '').replace(/[^0-9]/g, ''), 10) : NaN;
    const age = Number.isFinite(parsedAge) ? parsedAge : ageFromBirthDate(rawBirthDate || birthDate);
    const rating = ratingKey ? Number.parseInt(String(row[ratingKey] ?? '').replace(/[^0-9]/g, ''), 10) || 0 : 0;
    const name = nameKey ? String(row[nameKey] ?? '').trim() : [row[surnameKey], row[firstNameKey], patronymicKey ? row[patronymicKey] : ''].map((value) => String(value ?? '').trim()).filter(Boolean).join(' ');
    if (!name || !Number.isFinite(age) || age < 1 || age > 120) {
      errors.push(`Строка ${index + 2}: проверьте ФИО, дату рождения и возраст`);
      return null;
    }
    return { id: `import-${Date.now()}-${index}`, name, age, rating, gender: normalizeGenderKey(genderKey ? row[genderKey] : '', age), birthDate, region: String(regionKey ? row[regionKey] ?? '' : cityKey ? row[cityKey] ?? '' : '').trim(), city: String(cityKey ? row[cityKey] ?? '' : '').trim(), club: String(clubKey ? row[clubKey] ?? '' : '').trim(), source: 'import' };
  }).filter(Boolean);
  if (!genderKey) errors.push('Колонка пола не найдена: строки без пола попадут в мужскую/юношескую категорию');
  return { roster, errors };
}
function openImportPreview(fileName, parsed) { pendingImport = { fileName, roster: parsed.roster }; const hasExistingRoster = state.roster.length > 0; $('#importModalMeta').textContent = `${fileName} · корректных строк: ${parsed.roster.length}${parsed.errors.length ? ` · замечаний: ${parsed.errors.length}` : ''}`; $('#importReplaceWarning').classList.toggle('hidden', !hasExistingRoster); $('#importReplaceWarning').textContent = hasExistingRoster ? `В системе уже есть ${state.roster.length} спортсменов. Импорт полностью заменит текущий состав, результаты и очереди. Старые данные будут потеряны.` : ''; $('#importErrors').classList.toggle('hidden', !parsed.errors.length); $('#importErrors').textContent = parsed.errors.slice(0, 7).join(' · '); $('#importPreviewRows').innerHTML = parsed.roster.slice(0, 15).map((athlete) => `<tr><td>${escapeHtml(athlete.name)}</td><td>${escapeHtml(formatBirthDate(athlete.birthDate))}</td><td>${escapeHtml(categoryById(categoryForAthlete(athlete).id).label.split(' · ')[1])}</td><td>${escapeHtml(categoryLabelForAthlete(athlete))}</td><td>${escapeHtml(athlete.region || athlete.city || '—')}</td></tr>`).join('') || '<tr><td colspan="5">Нет корректных строк</td></tr>'; $('#importModal').classList.remove('hidden'); }
function importWorkbook(file) { const reader = new FileReader(); reader.onload = (event) => { try { const workbook = XLSX.read(event.target.result, { type: 'array', cellDates: true }); const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }); const parsed = parseRosterRows(rows); if (!parsed.roster.length) return showToast(parsed.errors[0] || 'Не найдено корректных строк'); openImportPreview(file.name, parsed); } catch (error) { showToast('Не удалось прочитать файл Excel'); } }; reader.readAsArrayBuffer(file); }
function confirmImport() { if (!pendingImport?.roster?.length) return; if (state.roster.length && !confirm(`В системе уже есть ${state.roster.length} спортсменов. Импортировать новый список и удалить старый состав вместе с результатами?`)) return; const roster = normalizeRoster(pendingImport.roster); state = { eventName: state.eventName, eventDate: state.eventDate, phase: 'qualification', roster, enabledAgeGroups: [...new Set(roster.map((athlete) => ageGroupForAge(athlete.age).id))], categories: createCategoryStates(), lanes: [], selectedFinalCategory: null, activity: [] }; state.lanes = lanesForRoster(state.roster); autoAssignLanes(); state.selectedFinalCategory = firstActiveCategory([], state.roster); addActivity(`Импортировано ${state.roster.length} спортсменов из ${pendingImport.fileName}`); pendingImport = null; $('#importModal').classList.add('hidden'); closeListsModal(); renderAll(); showToast(`Загружено ${state.roster.length} спортсменов`); }
async function loadTestRosterOnStartup() { if (state.roster.length || (state.activity || []).length) return; try { const response = await fetch('test-roster.csv', { cache: 'no-store' }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const workbook = XLSX.read(await response.text(), { type: 'string' }); const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }); const parsed = parseRosterRows(rows); if (!parsed.roster.length) throw new Error(parsed.errors[0] || 'Пустой тестовый список'); state.roster = normalizeRoster(parsed.roster); state.enabledAgeGroups = [...new Set(state.roster.map((athlete) => ageGroupForAge(athlete.age).id))]; state.categories = createCategoryStates(); state.lanes = lanesForRoster(state.roster); autoAssignLanes(); state.selectedFinalCategory = firstActiveCategory([], state.roster); persist('Сохранено · тестовый состав'); renderAll(); showToast(`Загружен тестовый состав: ${state.roster.length} спортсменов`); } catch (error) { console.warn('Не удалось автоматически загрузить test-roster.csv', error); } }
function openListsModal() { renderListsSummary(); $('#listsModal').classList.remove('hidden'); }
function closeListsModal() { $('#listsModal').classList.add('hidden'); }
function renderListsSummary() { const count = $('#listsRosterCount'); if (count) count.textContent = String(state.roster.length); }
async function loadTestRosterForImport() { try { const response = await fetch('test-roster.csv', { cache: 'no-store' }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const workbook = XLSX.read(await response.text(), { type: 'string' }); const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }); const parsed = parseRosterRows(rows); if (!parsed.roster.length) return showToast(parsed.errors[0] || 'Тестовый список пуст'); openImportPreview('test-roster.csv', parsed); } catch (error) { showToast('Не удалось загрузить test-roster.csv'); } }
function exportRosterWorkbook() { if (!state.roster.length) return showToast('В текущем списке нет спортсменов'); const rows = state.roster.map((athlete) => { const category = categoryForAthlete(athlete); return { 'ФИО': athlete.name, 'Дата рождения': formatBirthDate(athlete.birthDate), 'Пол и категория': category.label.split(' · ')[1], 'Регион': athlete.region || athlete.city || '', 'Возраст': athlete.age, 'Категория': category.label, 'Попытка 1': getTime(category.id, athlete.id, 1) ?? '', 'Штраф 1': getPenalty(category.id, athlete.id, 1) || '', 'Попытка 2': getTime(category.id, athlete.id, 2) ?? '', 'Штраф 2': getPenalty(category.id, athlete.id, 2) || '', 'Лучшее время': bestTime(category.id, athlete.id) ?? '' }; }); const sheet = XLSX.utils.json_to_sheet(rows); sheet['!cols'] = [{ wch: 24 }, { wch: 15 }, { wch: 18 }, { wch: 24 }, { wch: 9 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 }]; const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Результаты'); const eventPart = (state.eventName || 'соревнование').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40); XLSX.writeFile(workbook, `${eventPart || 'соревнование'}_результаты.xlsx`); showToast('Excel-файл с результатами выгружен'); }
function resetSavedData() { if (!confirm('Очистить сохранённые данные и загрузить тестовый список заново?')) return; localStorage.removeItem(STORAGE_KEY); location.reload(); }
function cancelImport() { pendingImport = null; $('#importModal').classList.add('hidden'); }
function clearRoster() { if (!confirm('Очистить список спортсменов и результаты?')) return; state.roster = []; state.enabledAgeGroups = AGE_GROUPS.map((group) => group.id); state.categories = createCategoryStates(); state.lanes = [createLane(CATEGORIES[0].id), createLane(CATEGORIES[1].id)]; state.selectedFinalCategory = CATEGORIES[0].id; addActivity('Список спортсменов очищен'); renderAll(); }

function qualificationRanking(categoryId) { return athletesForCategory(categoryId).slice().sort((a, b) => { const aBest = bestTime(categoryId, a.id); const bBest = bestTime(categoryId, b.id); if (!Number.isFinite(aBest) && Number.isFinite(bBest)) return 1; if (Number.isFinite(aBest) && !Number.isFinite(bBest)) return -1; return (aBest ?? Infinity) - (bBest ?? Infinity) || Number(b.rating) - Number(a.rating); }); }
function roundLabel(size, round) { if (size === 4 && round === 0) return 'полуфинал'; if (round === Math.log2(size) - 1) return 'большой финал'; return `1/${2 ** (round + 1)} финала`; }
function buildBracket(categoryId, size) { const seeded = qualificationRanking(categoryId).filter((athlete) => Number.isFinite(bestTime(categoryId, athlete.id))).slice(0, size); const matches = []; const rounds = Math.log2(size); for (let index = 0; index < size / 2; index += 1) matches.push({ id: `r0m${index}`, round: 0, index, label: roundLabel(size, 0), athlete1: seeded[index]?.id || null, athlete2: seeded[size - index - 1]?.id || null, time1: null, time2: null, winnerId: null, loserId: null }); for (let round = 1; round < rounds; round += 1) for (let index = 0; index < size / (2 ** (round + 1)); index += 1) matches.push({ id: `r${round}m${index}`, round, index, label: roundLabel(size, round), athlete1: null, athlete2: null, time1: null, time2: null, winnerId: null, loserId: null }); matches.push({ id: 'small-final', round: rounds, index: 0, label: 'малый финал · 3—4', athlete1: null, athlete2: null, time1: null, time2: null, winnerId: null, loserId: null, isSmall: true }); const bracket = { size, matches, selectedMatchId: matches[0]?.id || null }; resolveAutoAdvances(bracket); return bracket; }
function getMatch(bracket, id) { return bracket.matches.find((match) => match.id === id); }
function emptyFinalRaces(count = 2) { return Array.from({ length: count }, () => ({ time1: null, time2: null })); }
function ensureMatchRaces(match) { if (!Array.isArray(match.races)) { match.races = []; if (match.time1 !== null || match.time2 !== null) match.races.push({ time1: match.time1 ?? null, time2: match.time2 ?? null }); } while (match.races.length < 2) match.races.push({ time1: null, time2: null }); return match.races; }
function finalRaceValue(value) { if (String(value).trim().toUpperCase() === 'DQ') return 'DQ'; const number = Number(value); return Number.isFinite(number) && number > 0 ? Number(number.toFixed(3)) : null; }
function finalRaceWinner(race, athlete1, athlete2) { const dq1 = race.time1 === 'DQ'; const dq2 = race.time2 === 'DQ'; if (dq1 && !dq2 && race.time2 !== null) return athlete2; if (dq2 && !dq1 && race.time1 !== null) return athlete1; if (Number.isFinite(race.time1) && Number.isFinite(race.time2)) return race.time1 <= race.time2 ? athlete1 : athlete2; return null; }
function resolveMatchWinner(match) { const races = ensureMatchRaces(match); const wins = { [match.athlete1]: 0, [match.athlete2]: 0 }; races.forEach((race) => { const winner = finalRaceWinner(race, match.athlete1, match.athlete2); if (winner) wins[winner] += 1; }); const winnerId = wins[match.athlete1] >= 2 ? match.athlete1 : wins[match.athlete2] >= 2 ? match.athlete2 : null; match.winnerId = winnerId; match.loserId = winnerId ? (winnerId === match.athlete1 ? match.athlete2 : match.athlete1) : null; if (!winnerId && races.length < 5 && races.every((race) => race.time1 !== null && race.time2 !== null)) races.push({ time1: null, time2: null }); return winnerId; }
function finalRaceForAthlete(match, athleteId) { return ensureMatchRaces(match).findIndex((race) => (athleteId === match.athlete1 ? race.time1 : race.time2) === null); }
function resolveAutoAdvances(bracket) { const finalRound = Math.log2(bracket.size) - 1; for (let round = 0; round <= finalRound; round += 1) bracket.matches.filter((match) => match.round === round).forEach((match) => { ensureMatchRaces(match); if (round > 0) { const feederA = getMatch(bracket, `r${round - 1}m${match.index * 2}`); const feederB = getMatch(bracket, `r${round - 1}m${match.index * 2 + 1}`); const athlete1 = feederA?.winnerId || null; const athlete2 = feederB?.winnerId || null; if (match.athlete1 !== athlete1 || match.athlete2 !== athlete2) { match.athlete1 = athlete1; match.athlete2 = athlete2; match.time1 = null; match.time2 = null; match.races = emptyFinalRaces(); match.winnerId = null; match.loserId = null; } } const only = match.athlete1 && !match.athlete2 ? match.athlete1 : !match.athlete1 && match.athlete2 ? match.athlete2 : null; if (only) { match.winnerId = only; match.loserId = null; } else if (match.athlete1 && match.athlete2) resolveMatchWinner(match); else { match.winnerId = null; match.loserId = null; } }); const small = getMatch(bracket, 'small-final'); const semis = bracket.matches.filter((match) => match.round === finalRound - 1); const loser1 = semis[0]?.loserId || null; const loser2 = semis[1]?.loserId || null; if (small && (small.athlete1 !== loser1 || small.athlete2 !== loser2)) { small.athlete1 = loser1; small.athlete2 = loser2; small.time1 = null; small.time2 = null; small.races = emptyFinalRaces(); small.winnerId = null; small.loserId = null; } if (small) { if (small.athlete1 && small.athlete2) resolveMatchWinner(small); else if (small.athlete1 || small.athlete2) small.winnerId = small.athlete1 || small.athlete2; } }

function updateStandings(categoryId) { const bracket = categoryState(categoryId).bracket; if (!bracket) return; const finalRound = Math.log2(bracket.size) - 1; const big = bracket.matches.find((match) => match.round === finalRound); const small = getMatch(bracket, 'small-final'); categoryState(categoryId).standings = [big?.winnerId, big?.loserId, small?.winnerId, small?.loserId].filter(Boolean); }
function resolveMatch(categoryId, matchId) { const bracket = categoryState(categoryId).bracket; const match = bracket && getMatch(bracket, matchId); if (!match) return; ensureMatchRaces(match); match.time1 = match.races[0].time1; match.time2 = match.races[0].time2; resolveAutoAdvances(bracket); updateStandings(categoryId); persist(); }

function renderMatch(categoryId, match) { const races = ensureMatchRaces(match); const a1 = athleteById(match.athlete1); const a2 = athleteById(match.athlete2); const selected = categoryState(categoryId).selectedMatchId === match.id; const completedRaces = races.filter((race) => race.time1 !== null || race.time2 !== null).length; const nextRace = Math.min(completedRaces, races.length - 1); const gridStyle = `style="grid-template-columns:minmax(120px,1fr) repeat(${races.length},64px)"`; const raceHeaders = races.map((_, index) => `<span>ЗАЕЗД ${index + 1}</span>`).join(''); const addRaceButton = races.length < 5 ? `<button data-add-race=\"${match.id}\">+ заезд</button>` : ''; const row = (athlete, side) => `<div class=\"match-athlete ${match.winnerId === athlete?.id ? 'winner' : ''}\" ${gridStyle}><strong>${athlete ? escapeHtml(athlete.name) : '— / bye'}</strong>${races.map((race, index) => `<input data-match-time=\"${match.id}:${index}:${side}\" type=\"text\" inputmode=\"decimal\" placeholder=\"—\" value=\"${race['time' + side] ?? ''}\" aria-label=\"Заезд ${index + 1}\" />`).join('')}</div>`; return `<article class=\"match-card ${match.isSmall || match.label === 'большой финал' ? 'final-match' : ''} ${selected ? 'selected' : ''}\" data-match=\"${match.id}\"><div class=\"match-title\"><span>${match.label}</span><span>${match.winnerId ? '2 победы' : (completedRaces + ' / ' + races.length + ' заездов')}</span></div><div class=\"match-race-head\" ${gridStyle}><span>УЧАСТНИК</span>${raceHeaders}</div>${row(a1, 1)}${row(a2, 2)}<div class=\"match-actions\"><button data-match-record=\"${match.id}\" ${!match.athlete1 || !match.athlete2 ? 'disabled' : ''}>Записать заезд ${nextRace + 1}</button>${addRaceButton}<button data-match-lane=\"${match.id}\">Выбрать для BLE →</button></div></article>`; }

function renderBracket() { const categoryId = state.selectedFinalCategory; const bracket = categoryState(categoryId).bracket; if (!bracket) { $('#bracketBoard').innerHTML = `<div class="bracket-empty">Сетка ещё не собрана. Когда категория завершит обе попытки, выберите размер финала и соберите посев.</div>`; $('#finalStandings').classList.add('hidden'); return; } const rounds = Math.log2(bracket.size); const columns = []; for (let round = 0; round < rounds; round += 1) { const matches = bracket.matches.filter((match) => match.round === round); columns.push(`<div class="bracket-column"><div class="round-label">${roundLabel(bracket.size, round)}</div>${matches.map((match) => renderMatch(categoryId, match)).join('')}</div>`); } columns.push(`<div class="bracket-column"><div class="round-label">малый финал</div>${renderMatch(categoryId, getMatch(bracket, 'small-final'))}</div>`); $('#bracketBoard').innerHTML = `<div class="bracket-grid">${columns.join('')}</div>`; const standings = categoryState(categoryId).standings || []; $('#finalStandings').classList.toggle('hidden', standings.length === 0); if (standings.length) $('#finalStandings').innerHTML = `<h4>Итоговый протокол · ${escapeHtml(categoryById(categoryId).label)}</h4><div class="standings-grid">${standings.map((id, index) => { const athlete = athleteById(id); return `<div class="standing-item"><b>${String(index + 1).padStart(2, '0')} место</b><span>${escapeHtml(athlete?.name || '—')}</span><small>${athlete ? formatTime(bestTime(categoryId, athlete.id)) : ''}</small></div>`; }).join('')}</div>`; $$('[data-match]').forEach((card) => card.addEventListener('click', (event) => { if (event.target.closest('input') || event.target.closest('button')) return; categoryState(categoryId).selectedMatchId = card.dataset.match; persist(); renderBracket(); })); $$('[data-add-race]').forEach((button) => button.addEventListener('click', () => { const match = getMatch(bracket, button.dataset.addRace); if (match && ensureMatchRaces(match).length < 5) { match.races.push({ time1: null, time2: null }); persist(); renderBracket(); } })); $$('[data-match-record]').forEach((button) => button.addEventListener('click', () => { const match = getMatch(bracket, button.dataset.matchRecord); const races = ensureMatchRaces(match); const raceIndex = races.findIndex((race) => race.time1 === null || race.time2 === null); if (raceIndex < 0) return showToast('Все заезды уже записаны'); const time1 = finalRaceValue(document.querySelector(`[data-match-time="${match.id}:${raceIndex}:1"]`)?.value); const time2 = finalRaceValue(document.querySelector(`[data-match-time="${match.id}:${raceIndex}:2"]`)?.value); if (!match.athlete1 || !match.athlete2) return showToast('В этой паре используется bye'); if (time1 === null || time2 === null) return showToast('Укажите оба результата заезда'); races[raceIndex] = { time1, time2 }; resolveMatch(categoryId, match.id); addActivity(`Пара ${match.label}, заезд ${raceIndex + 1} записан`); renderFinals(); })); $$('[data-match-lane]').forEach((button) => button.addEventListener('click', () => selectMatchForTiming(categoryId, button.dataset.matchLane))); }

function generateBracket() { const categoryId = state.selectedFinalCategory; const cat = categoryState(categoryId); const qualified = qualificationRanking(categoryId).filter((athlete) => Number.isFinite(bestTime(categoryId, athlete.id))); if (qualified.length < 2) return showToast('Нужно минимум 2 спортсмена с двумя квалификационными попытками'); cat.finalSize = Number($('#bracketSize').value); cat.bracket = buildBracket(categoryId, cat.finalSize); cat.selectedMatchId = cat.bracket.selectedMatchId; state.phase = 'finals'; persist(); renderAll(); showToast(`Сетка ${cat.finalSize} участников собрана`); }
function selectMatchForTiming(categoryId, matchId) { const match = getMatch(categoryState(categoryId).bracket, matchId); if (!match?.athlete1 || !match?.athlete2) return showToast('В этой паре bye — заезд не нужен'); state.selectedFinalCategory = categoryId; categoryState(categoryId).selectedMatchId = matchId; state.lanes = [createLane(categoryId), createLane(categoryId)]; state.lanes[0].athleteId = match.athlete1; state.lanes[1].athleteId = match.athlete2; state.phase = 'finals'; sendBleCommand('start'); state.lanes.forEach((lane) => { lane.running = true; lane.startedAt = Date.now(); }); addActivity(`BLE · выбрана пара ${match.label}`); persist(); renderAll(); startTicker(); }

function wireEvents() { $('#startAllBtn').addEventListener('click', startAllLanes); $('#resetAllBtn').addEventListener('click', resetAllLanes); $('#bleBtn').addEventListener('click', connectBle); $('#disconnectBtn').addEventListener('click', disconnectBle); $('#listsBtn').addEventListener('click', openListsModal); $('#closeListsBtn').addEventListener('click', closeListsModal); $('#rosterFileInput').addEventListener('change', () => { const file = $('#rosterFileInput').files?.[0]; if (file) importWorkbook(file); $('#rosterFileInput').value = ''; }); $('#exportRosterBtn').addEventListener('click', exportRosterWorkbook); $('#addGroupFromListsBtn').addEventListener('click', () => { closeListsModal(); openAddGroup(); }); $('#loadTestRosterBtn').addEventListener('click', loadTestRosterForImport); $('#clearRosterBtn').addEventListener('click', clearRoster); $('#resetStorageBtn').addEventListener('click', resetSavedData); $('#confirmImportBtn').addEventListener('click', confirmImport); $('#cancelImportBtn').addEventListener('click', cancelImport); $('#cancelImportBtnBottom').addEventListener('click', cancelImport); $('#closeAddGroupBtn').addEventListener('click', closeAddGroup); $$('[data-add-age-group]').forEach((button) => button.addEventListener('click', () => addAgeGroup(button.dataset.addAgeGroup))); $('#eventName').addEventListener('change', () => { state.eventName = $('#eventName').value; persist(); }); $('#eventDate').addEventListener('change', () => { state.eventDate = $('#eventDate').value; persist(); }); $$('.phase-tab').forEach((button) => button.addEventListener('click', () => { state.phase = button.dataset.phase; persist(); renderAll(); })); $('#finalCategorySelect').addEventListener('change', () => { state.selectedFinalCategory = $('#finalCategorySelect').value; persist(); renderAll(); }); $('#bracketSize').addEventListener('change', () => { categoryState(state.selectedFinalCategory).finalSize = Number($('#bracketSize').value); persist(); }); $('#generateBracketBtn').addEventListener('click', generateBracket); }

wireEvents();
renderAll();
loadTestRosterOnStartup();
setInterval(() => { if (state.lanes.some((lane) => lane.running)) renderLanes(); }, 500);
window.addEventListener('beforeunload', () => persist());
