/**
 * Japon 2026 – Trip Planner
 * app.js – ES Module, Firebase Firestore sync + localStorage fallback
 */

// ── Données statiques (itinéraire, phrases, voyageurs) ──────────────────────────
import { CAT_EMOJI, DAY_TYPE_CONFIG, TRIP, ALL_DAYS, SEED_ACTIVITIES, CATEGORIES, CITY_CAL_COLORS, PEOPLE, PHRASES } from './data.js';

// ── Firebase state ────────────────────────────────────────────────────────────
let firebaseApp = null;
let db = null;
let unsubscribe = null;
let unsubscribeExpenses = null;
let unsubscribePeople = null;


// ── App State ─────────────────────────────────────────────────────────────────
const state = {
  currentCity: 'tokyo1',
  currentDayIndex: 0,    // index within TRIP[currentCity].days
  activities: {},        // activityId → full activity record (single source of truth)
  expenses: {},          // expenseId → personal expense record (synced)
  peopleNames: {},       // personId → custom display name (synced)
  phrases: {},           // phraseId → {id, section, fr, jp, ro}
  dayPoints: {},         // dayId → { start, end } (lieux de départ / arrivée)
  isOnline: false,
  isTipsPage: false,
  isCalendarPage: false,
  isPhrasesPage: false,
  isBudgetPage: false,
  isMapPage: false,
  selectedCalendarDayId: null, // which day is selected in the calendar view
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAllDaysFlat() {
  return ALL_DAYS;
}

function isSpecialPage() {
  return state.isTipsPage || state.isCalendarPage || state.isPhrasesPage || state.isBudgetPage || state.isMapPage;
}

function getCurrentDay() {
  if (isSpecialPage()) return null;
  const cityDays = TRIP[state.currentCity].days;
  return cityDays[state.currentDayIndex] || cityDays[0];
}

function getGlobalDayIndex(day) {
  return ALL_DAYS.findIndex(d => d.id === day.id);
}

function getCityForDay(day) {
  return TRIP[day.city];
}

function isActivityChecked(actId) {
  return state.activities[actId]?.checked === true;
}

// Return the activities for a given day, sorted by order then creation time
function getDayActivities(dayId) {
  return Object.values(state.activities)
    .filter(a => a && a.dayId === dayId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

// Build the default state.activities map from the seed (used offline / first run)
function buildSeedState() {
  const map = {};
  SEED_ACTIVITIES.forEach(act => { map[act.id] = { ...act }; });
  return map;
}

function buildSeedPhrases() {
  const map = {};
  PHRASES.forEach((section, si) => {
    section.items.forEach((p, pi) => {
      const id = `ph_${si}_${pi}`;
      map[id] = { id, section: section.title, fr: p.fr, jp: p.jp, ro: p.ro };
    });
  });
  return map;
}

// Strip undefined and keep only persistable fields for Firestore
function toRecord(act) {
  return {
    dayId: act.dayId,
    name: act.name,
    priceEur: act.priceEur || 0,
    priceJpy: act.priceJpy || 0,
    category: act.category || 'visite',
    isPaid: act.isPaid === true,
    note: act.note || '',
    checked: act.checked === true,
    custom: act.custom === true,
    order: act.order ?? 0,
    createdAt: act.createdAt ?? 0,
    priority: act.priority || 'medium',
    reminder: act.reminder || null,
    location: act.location || '',
  };
}

// ── LocalStorage Persistence ──────────────────────────────────────────────────
// Stores the FULL activities map so that added / deleted activities persist
// locally when Firebase is not configured.
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('japon2026_activities_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        state.activities = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  // No saved data → start from the seed
  state.activities = buildSeedState();
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('japon2026_activities_v2', JSON.stringify(state.activities));
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

// Phrases – separate storage key
function loadPhrasesFromLocalStorage() {
  try {
    const raw = localStorage.getItem('japon2026_phrases_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        state.phrases = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error (phrases):', e);
  }
  state.phrases = buildSeedPhrases();
}

function savePhrasesToLocalStorage() {
  try {
    localStorage.setItem('japon2026_phrases_v1', JSON.stringify(state.phrases));
  } catch (e) {
    console.warn('LocalStorage write error (phrases):', e);
  }
}

// Expenses (personal budget) – separate storage key
function loadExpensesFromLocalStorage() {
  try {
    const raw = localStorage.getItem('japon2026_expenses_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        state.expenses = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error (expenses):', e);
  }
  state.expenses = {};
}

function saveExpensesToLocalStorage() {
  try {
    localStorage.setItem('japon2026_expenses_v1', JSON.stringify(state.expenses));
  } catch (e) {
    console.warn('LocalStorage write error (expenses):', e);
  }
}

function expenseToRecord(exp) {
  return {
    person: exp.person,
    label: exp.label || '',
    amountEur: exp.amountEur || 0,
    amountJpy: exp.amountJpy || 0,
    createdAt: exp.createdAt ?? 0,
  };
}

// People display names (editable + synced)
function getPersonName(personId) {
  const custom = state.peopleNames[personId];
  if (custom && custom.trim()) return custom;
  const def = PEOPLE.find(p => p.id === personId);
  return def ? def.name : personId;
}

function loadPeopleFromLocalStorage() {
  try {
    const raw = localStorage.getItem('japon2026_people_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') { state.peopleNames = parsed; return; }
    }
  } catch (e) {
    console.warn('LocalStorage read error (people):', e);
  }
  state.peopleNames = {};
}

function savePeopleToLocalStorage() {
  try {
    localStorage.setItem('japon2026_people_v1', JSON.stringify(state.peopleNames));
  } catch (e) {
    console.warn('LocalStorage write error (people):', e);
  }
}

// ── Day points (lieux de départ / arrivée par jour, synchronisés) ─────────────
function loadDayPointsFromLocalStorage() {
  try {
    const raw = localStorage.getItem('japon2026_daypoints_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') { state.dayPoints = parsed; return; }
    }
  } catch (e) {
    console.warn('LocalStorage read error (dayPoints):', e);
  }
  state.dayPoints = {};
}

function saveDayPointsToLocalStorage() {
  try {
    localStorage.setItem('japon2026_daypoints_v1', JSON.stringify(state.dayPoints));
  } catch (e) {
    console.warn('LocalStorage write error (dayPoints):', e);
  }
}

function getDayPoints(dayId) {
  const p = state.dayPoints[dayId] || {};
  return { start: p.start || '', end: p.end || '' };
}

async function setDayPoints(dayId, start, end) {
  const rec = { start: (start || '').trim(), end: (end || '').trim() };
  if (!rec.start && !rec.end) {
    delete state.dayPoints[dayId];
  } else {
    state.dayPoints[dayId] = rec;
  }
  renderBook();
  showToast('🚩 Départ / arrivée enregistrés !');
  await persistDayPoints(dayId, rec);
}

async function persistDayPoints(dayId, rec) {
  if (db) {
    try {
      const { doc, setDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      if (!rec.start && !rec.end) {
        await deleteDoc(doc(db, 'dayPoints', dayId));
      } else {
        await setDoc(doc(db, 'dayPoints', dayId), rec);
      }
    } catch (e) {
      console.error('Firestore write error (dayPoints):', e);
      saveDayPointsToLocalStorage();
    }
  } else {
    saveDayPointsToLocalStorage();
  }
}

async function renamePerson(personId) {
  const current = getPersonName(personId);
  const next = prompt('Nom de la personne :', current);
  if (next === null) return;                 // cancelled
  const name = next.trim();
  if (!name || name === current) return;

  state.peopleNames[personId] = name;
  renderBudgetPage();
  showToast('✏️ Nom modifié !');

  if (db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await setDoc(doc(db, 'people', personId), { name });
    } catch (e) {
      console.error('Firestore write error (people):', e);
      savePeopleToLocalStorage();
    }
  } else {
    savePeopleToLocalStorage();
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Sync Status ───────────────────────────────────────────────────────────────
function updateSyncStatus(status) {
  const dot = document.getElementById('syncDot');
  const label = document.getElementById('syncLabel');
  if (!dot || !label) return;
  dot.className = 'sync-dot ' + status;
  const labels = {
    online: 'Synchronisé',
    offline: 'Hors-ligne',
    connecting: 'Connexion…',
  };
  label.textContent = labels[status] || 'Hors-ligne';
  state.isOnline = status === 'online';
}

// ── Sakura Petals ─────────────────────────────────────────────────────────────
function spawnSakura() {
  const container = document.getElementById('sakuraBg');
  if (!container) return;
  const count = window.innerWidth < 600 ? 18 : 35;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'sakura-petal';
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.top = '-20px';
    const size = 10 + Math.random() * 12;
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    const duration = 7 + Math.random() * 9;
    const delay = Math.random() * 12;
    petal.style.animationDuration = duration + 's';
    petal.style.animationDelay = delay + 's';
    const pink = Math.floor(140 + Math.random() * 60);
    petal.style.background = `rgb(255, ${pink}, ${Math.floor(pink * 0.85)})`;
    petal.style.opacity = (0.65 + Math.random() * 0.35).toString();
    const sway = ((Math.random() - 0.5) * 80).toFixed(0) + 'px';
    petal.style.setProperty('--sway', sway);
    container.appendChild(petal);
  }
}

// ── Budget Rendering ──────────────────────────────────────────────────────────
function renderBudget() {
  let budPaid = 0;
  let budDone = 0;
  let budTotal = 0;

  Object.values(state.activities).forEach(act => {
    if (!act) return;
    const price = act.priceEur || 0;
    budTotal += price;
    if (act.isPaid) {
      budPaid += price;
    } else if (act.checked === true) {
      budDone += price;
    }
  });

  const fmt = (n) => n > 0 ? n + ' €' : '0 €';
  const elPaid  = document.getElementById('budPaid');
  const elDone  = document.getElementById('budDone');
  const elTotal = document.getElementById('budTotal');
  if (elPaid)  elPaid.textContent  = fmt(budPaid);
  if (elDone)  elDone.textContent  = fmt(budDone);
  if (elTotal) elTotal.textContent = fmt(budTotal);
}

// ── Activity Toggle (check / uncheck) ───────────────────────────────────────────
async function toggleActivity(actId, currentValue) {
  const act = state.activities[actId];
  if (!act) return;
  const newValue = !currentValue;

  // Optimistic UI update
  act.checked = newValue;

  const checkbox = document.querySelector(`[data-act-id="${actId}"]`);
  const item = document.querySelector(`[data-activity-item="${actId}"]`);
  if (checkbox) checkbox.classList.toggle('checked', newValue);
  if (item) item.classList.toggle('done', newValue);

  renderBudget();
  renderProgressOnly();
  showToast(newValue ? '✓ Marqué comme fait !' : '↩ Marqué comme à faire');

  await persistActivity(actId, act);
}

// ── Add an activity ─────────────────────────────────────────────────────────────
async function addActivity(dayId, data) {
  const id = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const siblings = getDayActivities(dayId);
  const maxOrder = siblings.reduce((m, a) => Math.max(m, a.order ?? 0), 0);

  const record = {
    id,
    dayId,
    name: data.name,
    priceEur: Number(data.priceEur) || 0,
    priceJpy: Number(data.priceJpy) || 0,
    category: data.category || 'visite',
    isPaid: data.isPaid === true,
    note: data.note || '',
    checked: false,
    custom: true,
    order: maxOrder + 1,
    createdAt: Date.now(),
    priority: data.priority || 'medium',
    reminder: data.reminder || null,
    location: data.location || '',
  };

  state.activities[id] = record;
  renderBook();
  renderBudget();
  showToast('➕ Activité ajoutée !');

  await persistActivity(id, record);
}

// ── Delete an activity ──────────────────────────────────────────────────────────
async function deleteActivity(actId) {
  const act = state.activities[actId];
  if (!act) return;
  if (!confirm(`Supprimer « ${act.name} » ?\nCette suppression sera visible par tout le groupe.`)) return;

  delete state.activities[actId];
  renderBook();
  renderBudget();
  showToast('🗑️ Activité supprimée');

  // Persist deletion
  if (db) {
    try {
      const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await deleteDoc(doc(db, 'activities', actId));
    } catch (e) {
      console.error('Firestore delete error:', e);
      saveToLocalStorage();
    }
  } else {
    saveToLocalStorage();
  }
}

// ── Persist a single activity (Firestore or localStorage) ───────────────────────
async function persistActivity(actId, act) {
  if (db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await setDoc(doc(db, 'activities', actId), toRecord(act));
    } catch (e) {
      console.error('Firestore write error:', e);
      saveToLocalStorage();
    }
  } else {
    saveToLocalStorage();
  }
}

// Update just the progress bar on the left page (after a check toggle)
function renderProgressOnly() {
  if (state.isCalendarPage) { renderCalendarPage(); return; }
  if (state.isTipsPage) return;
  const day = getCurrentDay();
  if (day) renderLeftPage(day);
}

// ── Left Page Render ──────────────────────────────────────────────────────────
function renderLeftPage(day) {
  const city = TRIP[day.city];
  const typeConfig = DAY_TYPE_CONFIG[day.type] || DAY_TYPE_CONFIG.normal;

  // Progress: checked activities vs total (uses the dynamic, synced list)
  const dayActs  = getDayActivities(day.id);
  const totalActs = dayActs.length;
  const doneActs  = dayActs.filter(a => a.checked === true).length;
  const pct = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0;

  // Trip day number
  const globalIdx = getGlobalDayIndex(day);
  const tripDay = globalIdx + 1;
  const totalDays = ALL_DAYS.length;

  let html = `
    <div class="day-header">
      <div class="day-weekday">${day.label.split(' ').slice(0, 2).join(' ')}</div>
      <div class="day-date">${day.label.split(' ').slice(2).join(' ')}</div>
      <span class="city-badge">${city.emoji} ${city.label}</span>
    </div>
  `;

  if (typeConfig.label) {
    html += `
      <div class="day-type-banner day-type-${day.type}" style="background:${typeConfig.bg};color:${typeConfig.color};">
        ${typeConfig.label}
      </div>
    `;
  }

  if (day.notes) {
    html += `<div class="day-notes">${day.notes.replace(/\n/g, '<br>')}</div>`;
  }

  html += `
    <div class="progress-bar-wrap">
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-label">${doneActs} / ${totalActs} activités • Jour ${tripDay}/${totalDays}</div>
    </div>
  `;

  const el = document.getElementById('leftContent');
  if (el) el.innerHTML = html;
}

// ── Right Page Render ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Google Maps helpers (itinéraire + transports) ─────────────────────────────
// Catégories considérées comme des « lieux » réels (carte pertinente)
const MAPPABLE_CATS = new Set(['visite', 'attraction', 'parc', 'shopping', 'repas', 'photo', 'hébergement', 'activité']);

function cityMapName(cityKey) {
  return cityKey === 'osaka' ? 'Osaka' : 'Tokyo';
}

function isMappable(act) {
  return !!((act.location && act.location.trim()) || MAPPABLE_CATS.has(act.category));
}

// Requête Maps : lieu précis si renseigné, sinon nom + ville pour lever l'ambiguïté
function actMapQuery(act, cityKey) {
  const loc = (act.location || '').trim();
  return loc || `${act.name}, ${cityMapName(cityKey)} Japon`;
}

function mapsSearchUrl(act, cityKey) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(actMapQuery(act, cityKey));
}

// Itinéraire enchaînant départ → lieux du jour → arrivée en transports en commun
function transitRouteUrl(acts, cityKey, startQ, endQ) {
  const pts = [];
  if (startQ && startQ.trim()) pts.push(startQ.trim());
  acts.filter(isMappable).forEach(a => pts.push(actMapQuery(a, cityKey)));
  if (endQ && endQ.trim()) pts.push(endQ.trim());

  if (pts.length === 0) return null;
  if (pts.length === 1) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(pts[0]);
  }
  const origin = encodeURIComponent(pts[0]);
  const dest   = encodeURIComponent(pts[pts.length - 1]);
  const mids   = pts.slice(1, -1).map(encodeURIComponent).join('%7C');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`;
  if (mids) url += `&waypoints=${mids}`;
  return url;
}

function mapBtnHtml(act, cityKey) {
  if (!isMappable(act)) return '';
  return `<button class="act-map-btn" data-map-url="${escapeHtml(mapsSearchUrl(act, cityKey))}" title="Voir sur la carte" aria-label="Carte : ${escapeHtml(act.name)}">📍</button>`;
}

function dayRouteBtnHtml(acts, cityKey, dayId) {
  const { start, end } = getDayPoints(dayId);
  const url = transitRouteUrl(acts, cityKey, start, end);
  if (!url) return '';
  return `<a class="day-route-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener">🗺️ Itinéraire du jour en transports</a>`;
}

// Bandeau « Départ / Arrivée » du jour (au-dessus de la liste d'activités)
function dayEndpointsHtml(dayId, cityKey) {
  const { start, end } = getDayPoints(dayId);
  const searchUrl = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${q}, ${cityMapName(cityKey)} Japon`);

  const row = (icon, label, value) => {
    if (!value) return '';
    return `<div class="endpoint-row">
      <span class="endpoint-ico">${icon}</span>
      <span class="endpoint-label">${label}</span>
      <button class="act-map-btn endpoint-map" data-map-url="${escapeHtml(searchUrl(value))}" title="Voir sur la carte">${escapeHtml(value)} 📍</button>
    </div>`;
  };

  const hasAny = start || end;
  return `<div class="day-endpoints">
    ${row('🚩', 'Départ', start)}
    ${row('🏁', 'Arrivée', end)}
    <button class="endpoint-edit-btn" data-edit-points="${dayId}">${hasAny ? '✏️ Modifier départ / arrivée' : '🚩 Ajouter un lieu de départ / arrivée'}</button>
  </div>`;
}

// Ouvre les boutons carte (📍) d'un conteneur dans un nouvel onglet
function wireMapButtons(container) {
  container.querySelectorAll('.act-map-btn[data-map-url]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      window.open(btn.dataset.mapUrl, '_blank', 'noopener');
    });
  });
}

function renderRightPage(day) {
  const acts = getDayActivities(day.id);
  let html = `<div class="activities-header">Programme du jour</div>`;
  html += dayEndpointsHtml(day.id, day.city);

  if (acts.length === 0) {
    html += `<p class="no-activity">Aucune activité planifiée. Ajoutez-en une ci-dessous !</p>`;
  } else {
    html += `<ul class="activity-list">`;
    acts.forEach(act => {
      const checked = act.checked === true;
      const priceStr = act.priceEur > 0
        ? `<span class="act-price">${act.priceEur} €${act.priceJpy > 0 ? ' / ' + act.priceJpy.toLocaleString() + ' ¥' : ''}</span>`
        : '';
      const catEmoji = CAT_EMOJI[act.category] || '📌';
      const catStr = `<span class="act-cat">${catEmoji} ${escapeHtml(act.category)}</span>`;
      const paidStr = act.isPaid ? `<span class="act-paid-badge">✓ PAYÉ</span>` : '';
      const customStr = act.custom ? `<span class="act-custom-badge">ajouté</span>` : '';
      const noteStr = act.note ? `<div class="act-note">${escapeHtml(act.note)}</div>` : '';

      const prioColor = { high: '#C62828', medium: '#C9A84C', low: '#4CAF50' }[act.priority || 'medium'];
      const reminderStr = act.reminder ? `<span class="act-reminder-badge">🔔 ${escapeHtml(act.reminder)}</span>` : '';
      const priorityDot = `<span class="act-priority-dot" style="background:${prioColor}" title="Priorité: ${act.priority || 'medium'}"></span>`;
      html += `
        <li class="activity-item${checked ? ' done' : ''}" data-activity-item="${act.id}" data-priority="${act.priority || 'medium'}" draggable="true">
          <span class="drag-handle" aria-hidden="true">⠿</span>
          <div class="act-checkbox${checked ? ' checked' : ''}"
               data-act-id="${act.id}"
               role="checkbox"
               aria-checked="${checked}"
               tabindex="0"
               aria-label="Marquer : ${escapeHtml(act.name)}"></div>
          <div class="act-body" data-detail-id="${act.id}">
            <div class="act-name">${escapeHtml(act.name)}</div>
            <div class="act-meta">
              ${priorityDot}
              ${priceStr}
              ${catStr}
              ${paidStr}
              ${customStr}
              ${reminderStr}
            </div>
            ${noteStr}
          </div>
          <div class="act-actions">
            ${mapBtnHtml(act, day.city)}
            <button class="act-edit-btn" data-edit-id="${act.id}" title="Modifier" aria-label="Modifier : ${escapeHtml(act.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="act-delete-btn" data-del-id="${act.id}" title="Supprimer" aria-label="Supprimer : ${escapeHtml(act.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </li>
      `;
    });
    html += `</ul>`;
    html += dayRouteBtnHtml(acts, day.city, day.id);
  }

  // "Add activity" button
  html += `
    <button class="add-activity-btn" data-add-day="${day.id}">
      <span class="add-icon">＋</span> Ajouter une activité
    </button>
  `;

  const el = document.getElementById('rightContent');
  if (el) el.innerHTML = html;

  // Checkbox listeners
  document.querySelectorAll('.act-checkbox[data-act-id]').forEach(cb => {
    const actId = cb.dataset.actId;
    const handler = (e) => {
      e.preventDefault();
      toggleActivity(actId, cb.classList.contains('checked'));
    };
    cb.addEventListener('click', handler);
    cb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handler(e);
    });
  });

  // Edit listeners
  document.querySelectorAll('.act-edit-btn[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditModal(btn.dataset.editId);
    });
  });

  // Delete listeners
  document.querySelectorAll('.act-delete-btn[data-del-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteActivity(btn.dataset.delId);
    });
  });

  // Add-activity listener
  const addBtn = document.querySelector('.add-activity-btn[data-add-day]');
  if (addBtn) {
    addBtn.addEventListener('click', () => openAddModal(addBtn.dataset.addDay));
  }

  // Detail sheet listeners
  document.querySelectorAll('.act-body[data-detail-id]').forEach(body => {
    body.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailSheet(body.dataset.detailId);
    });
  });

  // Map (📍) listeners
  if (el) wireMapButtons(el);

  // Départ / arrivée
  if (el) el.querySelectorAll('.endpoint-edit-btn[data-edit-points]').forEach(btn => {
    btn.addEventListener('click', () => openDayPointModal(btn.dataset.editPoints));
  });

  // Drag & drop
  const rightContent = document.getElementById('rightContent');
  if (rightContent) initActivityDragDrop(rightContent);
}

// ── Tips Page Render ──────────────────────────────────────────────────────────
function renderTipsPage() {
  // Render in left content only; right content gets second column
  const leftEl  = document.getElementById('leftContent');
  const rightEl = document.getElementById('rightContent');
  if (!leftEl || !rightEl) return;

  const leftHtml = `
    <div style="font-family:'Noto Serif JP',serif;font-size:1.4rem;color:var(--red-dark);text-align:center;padding:8px 0 12px;border-bottom:2px solid var(--gold);margin-bottom:12px;">
      💡 Conseils Pratiques
      <div style="font-family:'Poppins',sans-serif;font-size:0.7rem;color:var(--ink-light);margin-top:4px;">Infos essentielles pour le Japon</div>
    </div>

    <div class="tips-section">
      <div class="tips-section-title">🎌 Coutumes & Étiquette</div>
      <ul class="tips-list">
        <li>Retirer ses chaussures avant d'entrer dans un ryokan, temple, ou maison</li>
        <li>Ne pas manger en marchant (sauf street food désignée)</li>
        <li>Se tenir à gauche dans les escalators (sauf à Osaka : à droite !)</li>
        <li>Pas de pourboire – c'est considéré comme impoli</li>
        <li>Parler doucement dans les transports en commun</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">🛒 Magasins Incontournables</div>
      <ul class="tips-list">
        <li><strong>Book-Off</strong> – Livres, manga, jeux d'occasion à prix mini</li>
        <li><strong>Daiso / 100¥ Shop</strong> – Tout à 100¥, qualité surprenante</li>
        <li><strong>Penguins Shop</strong> – Accessoires et gadgets japonais</li>
        <li><strong>Boutiques thématiques Akihabara</strong> – Anime, figures, cartes</li>
        <li><strong>Uniqlo Ginza</strong> – 12 étages, collaborations exclusives</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">📦 Exonération de Taxe (Tax-Free)</div>
      <div style="font-size:0.82rem;color:var(--ink);line-height:1.6;">
        Montrez votre <strong>passeport</strong> en caisse pour obtenir l'exonération de taxe (<strong>TVA 10%</strong>) pour tout achat de <strong>plus de 5 000 ¥</strong> dans les magasins éligibles. Chercher le logo <em>Tax-Free</em>.
      </div>
    </div>
  `;

  const rightHtml = `
    <div style="font-family:'Caveat',cursive;font-size:1.6rem;color:var(--ink);border-bottom:1px solid var(--cream-dark);padding-bottom:8px;margin-bottom:12px;">Souvenirs & Anime</div>

    <div class="tips-section">
      <div class="tips-section-title">🎴 Souvenirs Animé</div>
      <ul class="tips-list">
        <li><strong>Tamashii Store</strong> – Figurines haut de gamme S.H.Figuarts, Bandai</li>
        <li><strong>Animate</strong> – Chaîne nationale manga/anime/jeux</li>
        <li><strong>Akihabara Radio Kaikan</strong> – Figurines, cartes, cosplay</li>
        <li><strong>Jump Shop</strong> – Produits dérivés Shonen Jump officiels</li>
        <li><strong>Nakamura-ya (Asakusa)</strong> – Yukata et vêtements traditionnels</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">🗺️ Quartiers à Connaître</div>
      <ul class="tips-list">
        <li><strong>Akihabara</strong> – Électronique, anime, jeux, cosplay</li>
        <li><strong>Harajuku</strong> – Mode alternative, Takeshita Street</li>
        <li><strong>Shimokitazawa</strong> – Friperies, musique live, ambiance bobo</li>
        <li><strong>Shinjuku Kabukicho</strong> – Néons, vie nocturne</li>
        <li><strong>Yanaka</strong> – Vieux Tokyo authentique, cimetière, chats</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">🍜 Street Food à Goûter</div>
      <ul class="tips-list">
        <li><strong>Takoyaki</strong> – Billes de poulpe (Osaka spécialité)</li>
        <li><strong>Onigiri konbini</strong> – Riz farci, 7-Eleven / Lawson</li>
        <li><strong>Yakitori</strong> – Brochettes grillées en ruelle</li>
        <li><strong>Taiyaki</strong> – Poisson fourré à la crème / anko</li>
        <li><strong>Crepe Harajuku</strong> – Roulé avec topping insolite</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">💴 Paiement & Pratique</div>
      <ul class="tips-list">
        <li>Retrait au <strong>7-Eleven / Japan Post ATM</strong> – acceptent les cartes étrangères</li>
        <li>Beaucoup de petits commerces = <strong>cash uniquement</strong></li>
        <li><strong>IC Card</strong> (Suica/Pasmo) pour les transports – recharge partout</li>
        <li>Wifi : louer un <strong>pocket wifi</strong> ou eSIM depuis la France</li>
        <li>Télécharger <strong>Google Maps offline</strong> et <strong>Google Translate</strong> (appareil photo)</li>
      </ul>
    </div>
  `;

  leftEl.innerHTML  = leftHtml;
  rightEl.innerHTML = rightHtml;
}

// ── Calendar Page Render ──────────────────────────────────────────────────────
function renderCalendarPage() {
  const leftEl  = document.getElementById('leftContent');
  const rightEl = document.getElementById('rightContent');
  if (!leftEl || !rightEl) return;

  // date-string → [day, …] (handles Jul-17 / Jul-23 overlap days)
  const dateMap = {};
  ALL_DAYS.forEach(day => {
    if (!dateMap[day.date]) dateMap[day.date] = [];
    dateMap[day.date].push(day);
  });

  // July 1 2026 = Wednesday → offset 2 in a Mon-first week
  const firstOffset = 2;
  const daysInJuly  = 31;
  const weekHeaders = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

  let calHtml = `
    <div class="cal-title">
      <span class="cal-title-jp">カレンダー</span>
      Juillet 2026
    </div>
    <div class="cal-legend">
      ${Object.entries(CITY_CAL_COLORS).map(([city, color]) =>
        `<span class="cal-legend-dot" style="background:${color}"></span>${TRIP[city].emoji} ${TRIP[city].label}`
      ).join('')}
    </div>
    <div class="cal-grid">
      <div class="cal-week-headers">
        ${weekHeaders.map(h => `<div class="cal-wh">${h}</div>`).join('')}
      </div>
      <div class="cal-days">
  `;

  for (let i = 0; i < firstOffset; i++) {
    calHtml += `<div class="cal-cell empty"></div>`;
  }

  for (let d = 1; d <= daysInJuly; d++) {
    const dateStr = `2026-07-${String(d).padStart(2, '0')}`;
    const days    = dateMap[dateStr] || [];
    const isTrip  = days.length > 0;
    const isSelected = state.selectedCalendarDayId === dateStr;

    let bgColor = '', fgColor = '', dotsHtml = '';
    if (isTrip) {
      const lastDay = days[days.length - 1];
      bgColor = CITY_CAL_COLORS[lastDay.city];
      fgColor = '#fff';
      const allActs = days.flatMap(day => getDayActivities(day.id));
      if (allActs.length) {
        dotsHtml = `<div class="cal-dots">${
          allActs.slice(0, 5).map(act =>
            `<span class="cal-dot" style="background:${act.checked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.38)'}"></span>`
          ).join('')
        }</div>`;
      }
    }

    const cellClass = ['cal-cell', isTrip ? 'cal-cell--trip' : '', isSelected ? 'cal-cell--selected' : ''].filter(Boolean).join(' ');
    const cellStyle = isTrip ? `style="background:${bgColor};color:${fgColor};"` : '';
    const calDate  = isTrip ? `data-cal-date="${dateStr}"` : '';
    const tipDays  = days.map(d => d.label).join(' + ');

    calHtml += `
      <div class="${cellClass}" ${calDate} ${cellStyle} role="${isTrip ? 'button' : ''}" tabindex="${isTrip ? '0' : '-1'}"${isTrip ? ` title="${tipDays}"` : ''}>
        <span class="cal-day-num">${d}</span>
        ${dotsHtml}
      </div>`;
  }

  const totalCells = firstOffset + daysInJuly;
  const remainder  = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      calHtml += `<div class="cal-cell empty"></div>`;
    }
  }
  calHtml += `</div></div>`;
  leftEl.innerHTML = calHtml;

  // Right page
  if (state.selectedCalendarDayId && dateMap[state.selectedCalendarDayId]) {
    renderCalendarDayDetail(dateMap[state.selectedCalendarDayId], rightEl);
  } else {
    rightEl.innerHTML = `
      <div class="cal-prompt">
        <div class="cal-prompt-icon">📅</div>
        <div class="cal-prompt-text">Cliquez sur un jour du calendrier pour voir ses activités</div>
      </div>`;
  }

  // Click / keyboard listeners on trip day cells
  document.querySelectorAll('.cal-cell[data-cal-date]').forEach(cell => {
    const handler = () => {
      state.selectedCalendarDayId = cell.dataset.calDate;
      renderCalendarPage();
    };
    cell.addEventListener('click', handler);
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}

function renderCalendarDayDetail(days, container) {
  const allActs = days.flatMap(day => getDayActivities(day.id));
  const mainDay  = days[days.length - 1];
  const city     = TRIP[mainDay.city];
  const typeConfig = DAY_TYPE_CONFIG[mainDay.type] || DAY_TYPE_CONFIG.normal;

  let html = `
    <div class="cal-detail-header">
      <div class="cal-detail-date">${mainDay.label}${days.length > 1 ? '<span class="cal-detail-multi"> · 2 étapes</span>' : ''}</div>
      <span class="city-badge">${city.emoji} ${city.label}</span>
    </div>
  `;
  if (typeConfig.label) {
    html += `<div class="day-type-banner day-type-${mainDay.type}" style="background:${typeConfig.bg};color:${typeConfig.color};">${typeConfig.label}</div>`;
  }

  html += dayEndpointsHtml(mainDay.id, mainDay.city);

  if (allActs.length === 0) {
    html += `<p class="no-activity">Aucune activité planifiée. Ajoutez-en une ci-dessous !</p>`;
  } else {
    html += `<ul class="activity-list">`;
    allActs.forEach(act => {
      const checked  = act.checked === true;
      const priceStr = act.priceEur > 0
        ? `<span class="act-price">${act.priceEur} €${act.priceJpy > 0 ? ' / ' + act.priceJpy.toLocaleString() + ' ¥' : ''}</span>`
        : '';
      const catEmoji = CAT_EMOJI[act.category] || '📌';
      const catStr   = `<span class="act-cat">${catEmoji} ${escapeHtml(act.category)}</span>`;
      const paidStr  = act.isPaid ? `<span class="act-paid-badge">✓ PAYÉ</span>` : '';
      const noteStr  = act.note ? `<div class="act-note">${escapeHtml(act.note)}</div>` : '';
      const prioColorCal = { high: '#C62828', medium: '#C9A84C', low: '#4CAF50' }[act.priority || 'medium'];
      const remStrCal = act.reminder ? `<span class="act-reminder-badge">🔔 ${escapeHtml(act.reminder)}</span>` : '';
      const prioDotCal = `<span class="act-priority-dot" style="background:${prioColorCal}"></span>`;
      html += `
        <li class="activity-item${checked ? ' done' : ''}" data-activity-item="${act.id}" data-priority="${act.priority || 'medium'}" draggable="true">
          <span class="drag-handle" aria-hidden="true">⠿</span>
          <div class="act-checkbox${checked ? ' checked' : ''}" data-act-id="${act.id}" role="checkbox" aria-checked="${checked}" tabindex="0" aria-label="Marquer : ${escapeHtml(act.name)}"></div>
          <div class="act-body" data-detail-id="${act.id}">
            <div class="act-name">${escapeHtml(act.name)}</div>
            <div class="act-meta">${prioDotCal}${priceStr}${catStr}${paidStr}${remStrCal}</div>
            ${noteStr}
          </div>
          <div class="act-actions">
            ${mapBtnHtml(act, mainDay.city)}
            <button class="act-edit-btn" data-edit-id="${act.id}" title="Modifier" aria-label="Modifier : ${escapeHtml(act.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="act-delete-btn" data-del-id="${act.id}" title="Supprimer" aria-label="Supprimer : ${escapeHtml(act.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </li>`;
    });
    html += `</ul>`;
    html += dayRouteBtnHtml(allActs, mainDay.city, mainDay.id);
  }

  html += `
    <button class="add-activity-btn" data-add-day="${mainDay.id}">
      <span class="add-icon">＋</span> Ajouter une activité
    </button>`;
  container.innerHTML = html;

  container.querySelectorAll('.act-checkbox[data-act-id]').forEach(cb => {
    const actId = cb.dataset.actId;
    const handler = e => { e.preventDefault(); toggleActivity(actId, cb.classList.contains('checked')); };
    cb.addEventListener('click', handler);
    cb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(e); });
  });
  container.querySelectorAll('.act-edit-btn[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openEditModal(btn.dataset.editId); });
  });
  container.querySelectorAll('.act-delete-btn[data-del-id]').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); deleteActivity(btn.dataset.delId); });
  });
  const addBtn = container.querySelector('.add-activity-btn[data-add-day]');
  if (addBtn) addBtn.addEventListener('click', () => openAddModal(addBtn.dataset.addDay));

  container.querySelectorAll('.act-body[data-detail-id]').forEach(body => {
    body.addEventListener('click', e => { e.stopPropagation(); openDetailSheet(body.dataset.detailId); });
  });
  wireMapButtons(container);
  container.querySelectorAll('.endpoint-edit-btn[data-edit-points]').forEach(btn => {
    btn.addEventListener('click', () => openDayPointModal(btn.dataset.editPoints));
  });
  initActivityDragDrop(container);
}

// ── Phrases Page Render ───────────────────────────────────────────────────────
function getPhraseSections() {
  const knownOrder = PHRASES.map(s => s.title);
  const bySection = {};
  for (const phrase of Object.values(state.phrases)) {
    if (!bySection[phrase.section]) bySection[phrase.section] = [];
    bySection[phrase.section].push(phrase);
  }
  for (const title of Object.keys(bySection)) {
    bySection[title].sort((a, b) => (a.id < b.id ? -1 : 1));
  }
  const ordered = [];
  for (const title of knownOrder) {
    if (bySection[title]) ordered.push({ title, items: bySection[title] });
  }
  for (const title of Object.keys(bySection)) {
    if (!knownOrder.includes(title)) ordered.push({ title, items: bySection[title] });
  }
  return ordered;
}

function renderPhraseSection(section) {
  let html = `<div class="phrase-section">
    <div class="phrase-section-title">${section.title}</div>
    <ul class="phrase-list">`;
  section.items.forEach(p => {
    const audioBtn = p.jp
      ? `<button class="phrase-audio-btn" data-phrase-audio="${escapeHtml(p.jp)}" aria-label="Écouter">🔊</button>`
      : '';
    html += `
      <li class="phrase-item" data-phrase-id="${p.id}">
        <div class="phrase-item-body">
          <div class="phrase-fr">${escapeHtml(p.fr)}</div>
          <div class="phrase-jp-row">
            <span class="phrase-jp">${escapeHtml(p.jp)}</span>
            ${audioBtn}
            <span class="phrase-ro">${escapeHtml(p.ro)}</span>
          </div>
        </div>
        <div class="phrase-item-actions">
          <button class="phrase-edit-btn" data-edit-phrase="${p.id}" aria-label="Modifier">✏️</button>
          <button class="phrase-delete-btn" data-del-phrase="${p.id}" aria-label="Supprimer">🗑️</button>
        </div>
      </li>`;
  });
  html += `</ul>
    <button class="phrase-add-row-btn" data-add-phrase-section="${escapeHtml(section.title)}">＋ Ajouter une phrase</button>
  </div>`;
  return html;
}

function renderPhrasesPage() {
  const leftEl  = document.getElementById('leftContent');
  const rightEl = document.getElementById('rightContent');
  if (!leftEl || !rightEl) return;

  const sections = getPhraseSections();
  const half = Math.ceil(sections.length / 2);

  let leftHtml = `
    <div class="phrases-head">
      <span class="phrases-head-jp">日本語フレーズ</span>
      💬 Phrases Courantes
      <div class="phrases-head-sub">À utiliser dans les commerces & au quotidien</div>
    </div>
  `;
  sections.slice(0, half).forEach(s => { leftHtml += renderPhraseSection(s); });

  let rightHtml = `<div class="phrases-head-right">Au quotidien 🗣️</div>`;
  sections.slice(half).forEach(s => { rightHtml += renderPhraseSection(s); });

  leftEl.innerHTML  = leftHtml;
  rightEl.innerHTML = rightHtml;

  document.querySelectorAll('.phrase-add-row-btn[data-add-phrase-section]').forEach(btn => {
    btn.addEventListener('click', () => openPhraseModal(null, btn.dataset.addPhraseSection));
  });
  document.querySelectorAll('.phrase-edit-btn[data-edit-phrase]').forEach(btn => {
    btn.addEventListener('click', () => openPhraseModal(btn.dataset.editPhrase));
  });
  document.querySelectorAll('.phrase-delete-btn[data-del-phrase]').forEach(btn => {
    btn.addEventListener('click', () => deletePhrase(btn.dataset.delPhrase));
  });
  document.querySelectorAll('.phrase-audio-btn[data-phrase-audio]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      speakJapanese(btn.dataset.phraseAudio, btn);
    });
  });
}

// ── Map Page Render (Carte & itinéraires) ─────────────────────────────────────
function renderMapPage() {
  const leftEl  = document.getElementById('leftContent');
  const rightEl = document.getElementById('rightContent');
  if (!leftEl || !rightEl) return;

  // Une carte par jour ayant au moins un lieu cartographiable
  const cards = [];
  ALL_DAYS.forEach(day => {
    const acts = getDayActivities(day.id).filter(isMappable);
    if (acts.length === 0) return;
    const city = TRIP[day.city];
    let card = `<div class="map-day">
      <div class="map-day-head">${city.emoji} <span>${escapeHtml(day.label)}</span></div>
      <ul class="map-place-list">`;
    acts.forEach(a => {
      card += `<li><button class="map-place act-map-btn" data-map-url="${escapeHtml(mapsSearchUrl(a, day.city))}">
        <span class="map-pin">📍</span><span class="map-place-name">${escapeHtml(a.name)}</span>
        <span class="map-go">›</span></button></li>`;
    });
    card += `</ul>`;
    card += dayRouteBtnHtml(acts, day.city);
    card += `</div>`;
    cards.push(card);
  });

  const tokyoUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Tokyo, Japon');
  const osakaUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Osaka, Japon');

  const half = Math.ceil(cards.length / 2);

  let leftHtml = `
    <div class="map-head">
      <span class="map-head-jp">地図とルート</span>
      🗺️ Carte & Itinéraires
      <div class="map-head-sub">Touchez un lieu pour l'ouvrir dans Google Maps · « Itinéraire » donne la ligne de train à prendre</div>
    </div>
    <div class="map-quick">
      <a class="map-quick-btn" href="${escapeHtml(tokyoUrl)}" target="_blank" rel="noopener">🗼 Tokyo sur la carte</a>
      <a class="map-quick-btn" href="${escapeHtml(osakaUrl)}" target="_blank" rel="noopener">🏯 Osaka sur la carte</a>
    </div>
    <div id="mapCanvas" class="map-canvas"></div>
    <div class="map-canvas-hint" id="mapCanvasHint">📍 Chargement des points sur la carte…</div>`;
  leftHtml += cards.slice(0, half).join('');

  let rightHtml = `<div class="map-head-right">Itinéraires par jour 🚆</div>`;
  const rightCards = cards.slice(half).join('');
  rightHtml += rightCards || `<p class="no-activity">Ajoutez des activités pour voir leurs itinéraires ici.</p>`;

  leftEl.innerHTML  = leftHtml;
  rightEl.innerHTML = rightHtml;

  wireMapButtons(leftEl);
  wireMapButtons(rightEl);

  // Collecte des lieux uniques (dédupliqués par requête) pour la minimap
  const seen = new Set();
  const places = [];
  ALL_DAYS.forEach(day => {
    getDayActivities(day.id).filter(isMappable).forEach(a => {
      const query = actMapQuery(a, day.city);
      if (seen.has(query)) return;
      seen.add(query);
      places.push({ name: a.name, query, mapUrl: mapsSearchUrl(a, day.city) });
    });
  });
  initMiniMap(places);
}

// ── Minimap interactive (Leaflet + OpenStreetMap) ─────────────────────────────
let miniMapInstance = null;

const GEO_CACHE_KEY = 'japon2026_geocache_v1';
function loadGeoCache() {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY)) || {}; } catch { return {}; }
}
function saveGeoCache(c) {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c)); } catch {}
}

async function geocodeQuery(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const data = await res.json();
  if (data && data[0]) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  return null;
}

function initMiniMap(places) {
  // Leaflet pas encore chargé → réessayer brièvement
  if (!window.L) {
    setTimeout(() => { if (state.isMapPage) initMiniMap(places); }, 400);
    return;
  }
  const el = document.getElementById('mapCanvas');
  if (!el) return;

  // Détruire une éventuelle instance précédente
  if (miniMapInstance) { try { miniMapInstance.remove(); } catch {} miniMapInstance = null; }

  const map = L.map(el, { scrollWheelZoom: false }).setView([35.68, 139.76], 11); // Tokyo
  miniMapInstance = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);
  setTimeout(() => { try { map.invalidateSize(); } catch {} }, 100);

  const hint = document.getElementById('mapCanvasHint');
  const cache = loadGeoCache();
  const bounds = [];
  let done = 0;

  (async () => {
    for (const p of places) {
      if (!state.isMapPage || miniMapInstance !== map) return; // l'utilisateur a changé d'onglet
      let g = cache[p.query];
      if (g === undefined) {
        try { g = await geocodeQuery(p.query); } catch { g = null; }
        if (g) { cache[p.query] = g; saveGeoCache(cache); }
        await new Promise(r => setTimeout(r, 1100)); // politesse Nominatim (1 req/s)
      }
      if (g) {
        const marker = L.marker([g.lat, g.lon]).addTo(map);
        marker.bindPopup(
          `<b>${escapeHtml(p.name)}</b><br>` +
          `<a href="${escapeHtml(p.mapUrl)}" target="_blank" rel="noopener">Ouvrir dans Google Maps ›</a>`
        );
        bounds.push([g.lat, g.lon]);
        if (bounds.length >= 1) {
          try { map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 }); } catch {}
        }
      }
      done++;
      if (hint) {
        hint.textContent = bounds.length
          ? `📍 ${bounds.length} lieu(x) placé(s) — touchez un point pour ouvrir l'itinéraire`
          : `📍 Localisation des lieux… (${done}/${places.length})`;
      }
    }
    if (hint && bounds.length === 0) hint.textContent = '⚠️ Aucun lieu n\'a pu être localisé (vérifiez votre connexion).';
  })();
}

// ── Phrase Audio (Web Speech API) ─────────────────────────────────────────────
function speakJapanese(text, btn) {
  if (!text) return;
  if (!window.speechSynthesis) {
    showToast('🔇 La synthèse vocale n\'est pas supportée sur ce navigateur');
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP';
  utt.rate = 0.85;
  utt.pitch = 1;

  const reset = () => { if (btn) { btn.textContent = '🔊'; btn.disabled = false; } };
  utt.onend = reset;
  utt.onerror = (e) => { reset(); if (e.error !== 'interrupted') showToast('🔇 Voix japonaise non disponible sur cet appareil'); };

  if (btn) { btn.textContent = '🔈'; btn.disabled = true; }

  const doSpeak = () => {
    const voices = synth.getVoices();
    const jaVoice = voices.find(v => v.lang === 'ja-JP') || voices.find(v => v.lang.startsWith('ja'));
    if (jaVoice) utt.voice = jaVoice;
    synth.speak(utt);
  };

  // iOS Safari loads voices asynchronously – wait for them if not yet ready
  if (synth.getVoices().length > 0) {
    doSpeak();
  } else {
    synth.addEventListener('voiceschanged', doSpeak, { once: true });
    // Fallback: speak anyway after 300 ms if event never fires (some browsers)
    setTimeout(() => { if (btn?.disabled) doSpeak(); }, 300);
  }
}

// ── Phrase Modal ───────────────────────────────────────────────────────────────
function injectPhraseModal() {
  if (document.getElementById('phraseModal')) return;
  const sectionOptions = PHRASES.map(s =>
    `<option value="${escapeHtml(s.title)}">${escapeHtml(s.title)}</option>`
  ).join('');
  const modal = document.createElement('div');
  modal.className = 'add-modal';
  modal.id = 'phraseModal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="add-modal-backdrop" data-close-phrase></div>
    <div class="add-modal-box" role="dialog" aria-modal="true" aria-label="Phrase japonaise">
      <button class="add-modal-close" data-close-phrase aria-label="Fermer">✕</button>
      <h3 class="add-modal-title" id="phraseModalTitle">✨ Nouvelle phrase</h3>
      <form id="phraseForm" class="add-form" novalidate>
        <input type="hidden" id="phraseEditId" />
        <label class="add-label">Catégorie
          <select id="phraseSection" class="add-input">${sectionOptions}</select>
        </label>
        <label class="add-label">Français *
          <input type="text" id="phraseFr" class="add-input" required maxlength="120" placeholder="Ex : Où est la gare ?" />
        </label>
        <label class="add-label">日本語
          <input type="text" id="phraseJp" class="add-input" maxlength="120" placeholder="Ex : 駅はどこですか？" />
        </label>
        <label class="add-label">Romaji
          <input type="text" id="phraseRo" class="add-input" maxlength="120" placeholder="Ex : Eki wa doko desu ka?" />
        </label>
        <div class="add-actions">
          <button type="button" class="add-cancel" data-close-phrase>Annuler</button>
          <button type="submit" class="add-submit" id="phraseSubmit">Ajouter</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close-phrase]').forEach(el => {
    el.addEventListener('click', closePhraseModal);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closePhraseModal();
  });
  modal.querySelector('#phraseForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fr = document.getElementById('phraseFr').value.trim();
    if (!fr) { document.getElementById('phraseFr').focus(); return; }
    const data = {
      section: document.getElementById('phraseSection').value,
      fr,
      jp: document.getElementById('phraseJp').value.trim(),
      ro: document.getElementById('phraseRo').value.trim(),
    };
    const editId = document.getElementById('phraseEditId').value;
    if (editId) await updatePhrase(editId, data);
    else        await addPhrase(data);
    closePhraseModal();
  });
}

function openPhraseModal(phraseId, defaultSection) {
  const modal = document.getElementById('phraseModal');
  if (!modal) return;
  document.getElementById('phraseForm').reset();
  document.getElementById('phraseEditId').value = '';
  if (phraseId && state.phrases[phraseId]) {
    const p = state.phrases[phraseId];
    document.getElementById('phraseModalTitle').textContent = '✏️ Modifier la phrase';
    document.getElementById('phraseSubmit').textContent     = 'Enregistrer';
    document.getElementById('phraseEditId').value  = phraseId;
    document.getElementById('phraseSection').value = p.section;
    document.getElementById('phraseFr').value      = p.fr;
    document.getElementById('phraseJp').value      = p.jp;
    document.getElementById('phraseRo').value      = p.ro;
  } else {
    document.getElementById('phraseModalTitle').textContent = '✨ Nouvelle phrase';
    document.getElementById('phraseSubmit').textContent     = 'Ajouter';
    if (defaultSection) document.getElementById('phraseSection').value = defaultSection;
  }
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  setTimeout(() => document.getElementById('phraseFr')?.focus(), 50);
}

function closePhraseModal() {
  const modal = document.getElementById('phraseModal');
  if (!modal) return;
  modal.classList.remove('show');
  setTimeout(() => { modal.hidden = true; }, 200);
}

// ── Modal Départ / Arrivée du jour ────────────────────────────────────────────
function injectDayPointModal() {
  if (document.getElementById('dayPointModal')) return;
  const modal = document.createElement('div');
  modal.className = 'add-modal';
  modal.id = 'dayPointModal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="add-modal-backdrop" data-close-dp></div>
    <div class="add-modal-box" role="dialog" aria-modal="true" aria-label="Départ et arrivée du jour">
      <button class="add-modal-close" data-close-dp aria-label="Fermer">✕</button>
      <h3 class="add-modal-title">🚩 Départ & arrivée du jour</h3>
      <p class="dp-day-line" id="dpDayLine"></p>
      <form id="dpForm" class="add-form" novalidate>
        <input type="hidden" id="dpDayId" />
        <label class="add-label">🚩 Lieu de départ
          <input type="text" id="dpStart" class="add-input" maxlength="160" placeholder="Ex : Hôtel Tokyo Bay, ou une adresse" />
        </label>
        <label class="add-label">🏁 Lieu d'arrivée
          <input type="text" id="dpEnd" class="add-input" maxlength="160" placeholder="Ex : Hôtel, gare, restaurant du soir…" />
        </label>
        <span class="add-hint">Ces points encadrent l'itinéraire du jour : Google Maps calculera le trajet depuis le départ, en passant par les activités, jusqu'à l'arrivée.</span>
        <div class="add-actions">
          <button type="button" class="add-cancel" data-close-dp>Annuler</button>
          <button type="submit" class="add-submit">Enregistrer</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelectorAll('[data-close-dp]').forEach(el => el.addEventListener('click', closeDayPointModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeDayPointModal(); });

  modal.querySelector('#dpForm').addEventListener('submit', async e => {
    e.preventDefault();
    const dayId = document.getElementById('dpDayId').value;
    const start = document.getElementById('dpStart').value;
    const end   = document.getElementById('dpEnd').value;
    await setDayPoints(dayId, start, end);
    closeDayPointModal();
  });
}

function openDayPointModal(dayId) {
  const modal = document.getElementById('dayPointModal');
  if (!modal) return;
  const { start, end } = getDayPoints(dayId);
  const day = ALL_DAYS.find(d => d.id === dayId);
  document.getElementById('dpForm').reset();
  document.getElementById('dpDayId').value = dayId;
  document.getElementById('dpStart').value = start;
  document.getElementById('dpEnd').value   = end;
  const line = document.getElementById('dpDayLine');
  if (line && day) line.textContent = day.label;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  setTimeout(() => document.getElementById('dpStart')?.focus(), 50);
}

function closeDayPointModal() {
  const modal = document.getElementById('dayPointModal');
  if (!modal) return;
  modal.classList.remove('show');
  setTimeout(() => { modal.hidden = true; }, 200);
}

// ── Personal Budget (expenses) ──────────────────────────────────────────────────
async function addExpense(personId, data) {
  const id = 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const record = {
    id,
    person: personId,
    label: data.label || '',
    amountEur: Number(data.amountEur) || 0,
    amountJpy: Number(data.amountJpy) || 0,
    createdAt: Date.now(),
  };
  state.expenses[id] = record;
  renderBudgetPage();
  showToast('💰 Dépense ajoutée !');
  await persistExpense(id, record);
}

async function deleteExpense(expId) {
  const exp = state.expenses[expId];
  if (!exp) return;
  if (!confirm(`Supprimer cette dépense${exp.label ? ` « ${exp.label} »` : ''} ?`)) return;
  delete state.expenses[expId];
  renderBudgetPage();
  showToast('🗑️ Dépense supprimée');

  if (db) {
    try {
      const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await deleteDoc(doc(db, 'expenses', expId));
    } catch (e) {
      console.error('Firestore delete error (expense):', e);
      saveExpensesToLocalStorage();
    }
  } else {
    saveExpensesToLocalStorage();
  }
}

async function persistExpense(expId, exp) {
  if (db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await setDoc(doc(db, 'expenses', expId), expenseToRecord(exp));
    } catch (e) {
      console.error('Firestore write error (expense):', e);
      saveExpensesToLocalStorage();
    }
  } else {
    saveExpensesToLocalStorage();
  }
}

// ── Phrases CRUD ───────────────────────────────────────────────────────────────
async function persistPhrase(phraseId, phrase) {
  if (db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await setDoc(doc(db, 'phrases', phraseId), { section: phrase.section, fr: phrase.fr, jp: phrase.jp, ro: phrase.ro });
    } catch (e) {
      console.error('Firestore write error (phrase):', e);
      savePhrasesToLocalStorage();
    }
  } else {
    savePhrasesToLocalStorage();
  }
}

async function addPhrase(data) {
  const id = 'ph_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const phrase = { id, section: data.section, fr: data.fr, jp: data.jp || '', ro: data.ro || '' };
  state.phrases[id] = phrase;
  if (state.isPhrasesPage) renderPhrasesPage();
  showToast('✅ Phrase ajoutée !');
  await persistPhrase(id, phrase);
}

async function updatePhrase(phraseId, data) {
  const phrase = state.phrases[phraseId];
  if (!phrase) return;
  Object.assign(phrase, { section: data.section, fr: data.fr, jp: data.jp || '', ro: data.ro || '' });
  if (state.isPhrasesPage) renderPhrasesPage();
  showToast('✏️ Phrase modifiée !');
  await persistPhrase(phraseId, phrase);
}

async function deletePhrase(phraseId) {
  if (!confirm('Supprimer cette phrase ?')) return;
  delete state.phrases[phraseId];
  if (state.isPhrasesPage) renderPhrasesPage();
  showToast('🗑️ Phrase supprimée');
  if (db) {
    try {
      const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await deleteDoc(doc(db, 'phrases', phraseId));
    } catch (e) {
      console.error('Firestore delete error (phrase):', e);
      savePhrasesToLocalStorage();
    }
  } else {
    savePhrasesToLocalStorage();
  }
}

function getPersonExpenses(personId) {
  return Object.values(state.expenses)
    .filter(e => e && e.person === personId)
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

function renderBudgetPage() {
  const leftEl  = document.getElementById('leftContent');
  const rightEl = document.getElementById('rightContent');
  if (!leftEl || !rightEl) return;

  // Per-person totals
  const totals = {};
  let grandTotal = 0;
  PEOPLE.forEach(p => {
    const sum = getPersonExpenses(p.id).reduce((s, e) => s + (e.amountEur || 0), 0);
    totals[p.id] = sum;
    grandTotal += sum;
  });
  const avg = PEOPLE.length ? grandTotal / PEOPLE.length : 0;
  const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString('fr-FR') + ' €';

  // ── Left page: summary ──
  let leftHtml = `
    <div class="budget-head">
      <span class="budget-head-jp">個人予算</span>
      💰 Budget Personnel
      <div class="budget-head-sub">Dépenses individuelles du voyage</div>
    </div>
    <div class="budget-total-card">
      <div class="budget-total-label">Total du groupe</div>
      <div class="budget-total-val">${fmt(grandTotal)}</div>
      <div class="budget-total-avg">Moyenne / pers. : ${fmt(avg)}</div>
    </div>
    <div class="budget-summary-list">
  `;
  PEOPLE.forEach(p => {
    const pct = grandTotal > 0 ? Math.round((totals[p.id] / grandTotal) * 100) : 0;
    leftHtml += `
      <div class="budget-summary-row">
        <div class="budget-summary-name"><span class="budget-pers-dot" style="background:${p.color}"></span>${p.emoji} ${escapeHtml(getPersonName(p.id))}</div>
        <div class="budget-summary-bar"><div class="budget-summary-fill" style="width:${pct}%;background:${p.color}"></div></div>
        <div class="budget-summary-amt">${fmt(totals[p.id])}</div>
      </div>`;
  });
  leftHtml += `</div>`;
  leftEl.innerHTML = leftHtml;

  // ── Right page: a card per person with their expenses ──
  let rightHtml = `<div class="budget-cards">`;
  PEOPLE.forEach(p => {
    const exps = getPersonExpenses(p.id);
    rightHtml += `
      <div class="budget-card" style="border-top:3px solid ${p.color}">
        <div class="budget-card-head">
          <span class="budget-card-name">
            ${p.emoji} ${escapeHtml(getPersonName(p.id))}
            <button class="budget-name-edit" data-rename="${p.id}" title="Modifier le nom" aria-label="Modifier le nom">✏️</button>
          </span>
          <span class="budget-card-total" style="color:${p.color}">${fmt(totals[p.id])}</span>
        </div>
        <ul class="budget-exp-list">`;
    if (exps.length === 0) {
      rightHtml += `<li class="budget-exp-empty">Aucune dépense</li>`;
    } else {
      exps.forEach(e => {
        const jpy = e.amountJpy > 0 ? `<span class="budget-exp-jpy">${e.amountJpy.toLocaleString()} ¥</span>` : '';
        rightHtml += `
          <li class="budget-exp-item">
            <span class="budget-exp-label">${escapeHtml(e.label || 'Dépense')}</span>
            <span class="budget-exp-amt">${(e.amountEur || 0).toLocaleString('fr-FR')} €${jpy}</span>
            <button class="budget-exp-del" data-del-exp="${e.id}" title="Supprimer" aria-label="Supprimer la dépense">✕</button>
          </li>`;
      });
    }
    rightHtml += `
        </ul>
        <button class="budget-add-btn" data-add-exp="${p.id}" style="color:${p.color};border-color:${p.color}">
          ＋ Ajouter une dépense
        </button>
      </div>`;
  });
  rightHtml += `</div>`;
  rightEl.innerHTML = rightHtml;

  // Listeners
  rightEl.querySelectorAll('.budget-add-btn[data-add-exp]').forEach(btn => {
    btn.addEventListener('click', () => openExpenseModal(btn.dataset.addExp));
  });
  rightEl.querySelectorAll('.budget-exp-del[data-del-exp]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); deleteExpense(btn.dataset.delExp); });
  });
  rightEl.querySelectorAll('.budget-name-edit[data-rename]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); renamePerson(btn.dataset.rename); });
  });
}

// ── Book Render ───────────────────────────────────────────────────────────────
function renderBook() {
  if (state.isCalendarPage) {
    renderCalendarPage();
    document.getElementById('navDay').textContent  = 'Calendrier';
    document.getElementById('navPage').textContent = 'Juillet 2026';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }

  if (state.isPhrasesPage) {
    renderPhrasesPage();
    document.getElementById('navDay').textContent  = 'Phrases';
    document.getElementById('navPage').textContent = 'Japonais utile';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }

  if (state.isMapPage) {
    renderMapPage();
    document.getElementById('navDay').textContent  = 'Carte';
    document.getElementById('navPage').textContent = 'Lieux & itinéraires';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }

  if (state.isBudgetPage) {
    renderBudgetPage();
    document.getElementById('navDay').textContent  = 'Budget';
    document.getElementById('navPage').textContent = 'Dépenses perso';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }

  if (state.isTipsPage) {
    renderTipsPage();
    document.getElementById('navDay').textContent  = 'Conseils';
    document.getElementById('navPage').textContent = 'Infos pratiques';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }

  const day = getCurrentDay();
  if (!day) return;

  renderLeftPage(day);
  renderRightPage(day);

  const globalIdx = getGlobalDayIndex(day);
  document.getElementById('navDay').textContent  = day.label;
  document.getElementById('navPage').textContent = `Page ${globalIdx + 1} / ${ALL_DAYS.length}`;

  // Update city nav active state
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.city === state.currentCity);
  });
}

// ── Page Animation ────────────────────────────────────────────────────────────
function animatePages(direction) {
  const leftPage  = document.getElementById('leftPage');
  const rightPage = document.getElementById('rightPage');
  if (!leftPage || !rightPage) return;

  const inClass = direction === 'forward' ? 'slide-in-forward' : 'slide-in-backward';

  // Remove any existing animation classes
  leftPage.classList.remove('slide-in-forward', 'slide-in-backward');
  rightPage.classList.remove('slide-in-forward', 'slide-in-backward');

  // Force reflow
  void leftPage.offsetWidth;
  void rightPage.offsetWidth;

  leftPage.classList.add(inClass);
  rightPage.classList.add(inClass);

  setTimeout(() => {
    leftPage.classList.remove(inClass);
    rightPage.classList.remove(inClass);
  }, 400);
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigate(direction) {
  // Calendar, phrases and budget pages have no prev/next navigation
  if (state.isCalendarPage || state.isPhrasesPage || state.isBudgetPage || state.isMapPage) return;
  if (state.isTipsPage) {
    // From tips, go back to last day
    state.isTipsPage = false;
    animatePages(direction === 'prev' ? 'backward' : 'forward');
    renderBook();
    return;
  }

  const cityDays = TRIP[state.currentCity].days;
  const newIndex = state.currentDayIndex + (direction === 'next' ? 1 : -1);

  if (direction === 'next') {
    if (newIndex >= cityDays.length) {
      // Move to next city
      const cityKeys = ['tokyo1', 'osaka', 'tokyo2'];
      const cityIdx = cityKeys.indexOf(state.currentCity);
      if (cityIdx < cityKeys.length - 1) {
        state.currentCity = cityKeys[cityIdx + 1];
        state.currentDayIndex = 0;
        animatePages('forward');
        renderBook();
      }
    } else {
      state.currentDayIndex = newIndex;
      animatePages('forward');
      renderBook();
    }
  } else {
    if (newIndex < 0) {
      // Move to previous city
      const cityKeys = ['tokyo1', 'osaka', 'tokyo2'];
      const cityIdx = cityKeys.indexOf(state.currentCity);
      if (cityIdx > 0) {
        state.currentCity = cityKeys[cityIdx - 1];
        state.currentDayIndex = TRIP[state.currentCity].days.length - 1;
        animatePages('backward');
        renderBook();
      }
    } else {
      state.currentDayIndex = newIndex;
      animatePages('backward');
      renderBook();
    }
  }

  updateNavButtons();
}

function updateNavButtons() {
  if (isSpecialPage()) return;
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (!prevBtn || !nextBtn) return;

  const cityKeys = ['tokyo1', 'osaka', 'tokyo2'];
  const cityIdx  = cityKeys.indexOf(state.currentCity);

  const isFirst = cityIdx === 0 && state.currentDayIndex === 0;
  const lastCity = TRIP[cityKeys[cityKeys.length - 1]];
  const isLast  = cityIdx === cityKeys.length - 1 && state.currentDayIndex === lastCity.days.length - 1;

  prevBtn.disabled = isFirst;
  nextBtn.disabled = isLast;
}

function setCity(cityId) {
  // Reset special page flags
  state.isTipsPage     = false;
  state.isCalendarPage = false;
  state.isPhrasesPage  = false;
  state.isBudgetPage   = false;
  state.isMapPage      = false;

  const bookContainer = document.getElementById('bookContainer');
  const SPECIAL = ['tips', 'calendar', 'phrases', 'budget', 'map'];

  if (SPECIAL.includes(cityId)) {
    if (cityId === 'tips')     state.isTipsPage     = true;
    if (cityId === 'calendar') state.isCalendarPage = true;
    if (cityId === 'phrases')  state.isPhrasesPage  = true;
    if (cityId === 'budget')   state.isBudgetPage   = true;
    if (cityId === 'map')      state.isMapPage      = true;
    bookContainer?.classList.add('special-mode');
    document.querySelectorAll('.city-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.city === cityId);
    });
    animatePages('forward');
    renderBook();
  } else {
    bookContainer?.classList.remove('special-mode');
    state.currentCity = cityId;
    state.currentDayIndex = 0;
    document.querySelectorAll('.city-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.city === cityId);
    });
    animatePages('forward');
    renderBook();
    updateNavButtons();
  }
}

// ── Update an existing activity ─────────────────────────────────────────────────
async function updateActivity(actId, data) {
  const act = state.activities[actId];
  if (!act) return;

  act.name     = data.name;
  act.priceEur = Number(data.priceEur) || 0;
  act.priceJpy = Number(data.priceJpy) || 0;
  act.category = data.category || act.category;
  act.isPaid   = data.isPaid === true;
  act.note     = data.note || '';
  act.priority = data.priority || act.priority || 'medium';
  act.reminder = data.reminder || null;
  act.location = data.location || '';

  // Handle date / day change
  if (data.dayId && data.dayId !== act.dayId) {
    act.dayId = data.dayId;
  }

  renderBook();
  renderBudget();
  showToast('✏️ Activité modifiée !');

  await persistActivity(actId, act);
}

function openEditModal(actId) {
  const act = state.activities[actId];
  if (!act) return;

  const modal = document.getElementById('addModal');
  if (!modal) return;

  // Switch to edit mode
  document.getElementById('addForm').reset();
  document.getElementById('addDayId').value    = act.dayId;
  document.getElementById('addMode').value     = 'edit';
  document.getElementById('editActId').value   = actId;
  document.getElementById('addName').value     = act.name;
  document.getElementById('addPriceEur').value = act.priceEur || '';
  document.getElementById('addPriceJpy').value = act.priceJpy || '';
  document.getElementById('addCategory').value = act.category || 'visite';
  document.getElementById('addNote').value     = act.note || '';
  if (document.getElementById('addLocation')) document.getElementById('addLocation').value = act.location || '';
  document.getElementById('addPaid').checked   = act.isPaid === true;
  if (document.getElementById('addPriority')) document.getElementById('addPriority').value = act.priority || 'medium';
  if (document.getElementById('addReminder')) document.getElementById('addReminder').value = act.reminder || '';

  const daySelectWrap = document.getElementById('addDaySelectWrap');
  const daySelect     = document.getElementById('addDaySelect');
  if (daySelectWrap) daySelectWrap.style.display = '';
  if (daySelect)     daySelect.value = act.dayId;

  modal.querySelector('.add-modal-title').textContent  = '✏️ Modifier l\'activité';
  modal.querySelector('.add-submit').textContent        = 'Sauvegarder';

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  setTimeout(() => document.getElementById('addName')?.focus(), 50);
}

// ── Add-Activity Modal ────────────────────────────────────────────────────────────
function injectModal() {
  if (document.getElementById('addModal')) return;
  const catOptions = CATEGORIES
    .map(c => `<option value="${c}">${CAT_EMOJI[c] || '📌'} ${c}</option>`)
    .join('');
  const dayOptions = ALL_DAYS.map(day => {
    const cityLabel = TRIP[day.city].label;
    return `<option value="${day.id}">${day.label} – ${cityLabel}</option>`;
  }).join('');

  const modal = document.createElement('div');
  modal.className = 'add-modal';
  modal.id = 'addModal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="add-modal-backdrop" data-close-modal></div>
    <div class="add-modal-box" role="dialog" aria-modal="true" aria-label="Ajouter une activité">
      <button class="add-modal-close" data-close-modal aria-label="Fermer">✕</button>
      <h3 class="add-modal-title">➕ Nouvelle activité</h3>
      <form id="addForm" class="add-form" novalidate>
        <input type="hidden" id="addDayId" />
        <input type="hidden" id="addMode" value="add" />
        <input type="hidden" id="editActId" />
        <label class="add-label">Nom de l'activité *
          <input type="text" id="addName" class="add-input" required maxlength="80" placeholder="Ex : Musée Ghibli" />
        </label>
        <label class="add-label">📍 Adresse exacte (pour la carte)
          <input type="text" id="addLocation" class="add-input" maxlength="160" placeholder="Ex : 1 Chome-1-2 Oshiage, Sumida City, Tokyo" />
          <span class="add-hint">Adresse complète ou nom précis du lieu → place le point exact sur la carte. Laisse vide pour utiliser le nom de l'activité.</span>
        </label>
        <div class="add-row">
          <label class="add-label">Prix (€)
            <input type="number" id="addPriceEur" class="add-input" min="0" step="0.5" placeholder="0" />
          </label>
          <label class="add-label">Prix (¥)
            <input type="number" id="addPriceJpy" class="add-input" min="0" step="100" placeholder="0" />
          </label>
        </div>
        <label class="add-label">Catégorie
          <select id="addCategory" class="add-input">${catOptions}</select>
        </label>
        <label class="add-label">Note (optionnel)
          <input type="text" id="addNote" class="add-input" maxlength="120" placeholder="Horaire, détail…" />
        </label>
        <label class="add-label">Priorité
          <select id="addPriority" class="add-input">
            <option value="medium">🟡 Moyenne</option>
            <option value="high">🔴 Haute</option>
            <option value="low">🟢 Basse</option>
          </select>
        </label>
        <label class="add-label">Rappel (heure facultatif)
          <input type="time" id="addReminder" class="add-input" />
        </label>
        <label class="add-checkbox-row">
          <input type="checkbox" id="addPaid" /> Déjà payé / réservé
        </label>
        <div id="addDaySelectWrap" style="display:none;">
          <label class="add-label">Déplacer vers le jour
            <select id="addDaySelect" class="add-input">${dayOptions}</select>
          </label>
        </div>
        <div class="add-actions">
          <button type="button" class="add-cancel" data-close-modal>Annuler</button>
          <button type="submit" class="add-submit">Ajouter</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Close handlers
  modal.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeAddModal);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeAddModal();
  });

  // Submit handler
  const form = modal.querySelector('#addForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('addName').value.trim();
    if (!name) { document.getElementById('addName').focus(); return; }

    const mode   = document.getElementById('addMode').value;
    const data   = {
      name,
      priceEur: document.getElementById('addPriceEur').value,
      priceJpy: document.getElementById('addPriceJpy').value,
      category: document.getElementById('addCategory').value,
      note: document.getElementById('addNote').value.trim(),
      isPaid: document.getElementById('addPaid').checked,
      priority: document.getElementById('addPriority')?.value || 'medium',
      reminder: document.getElementById('addReminder')?.value || null,
      location: document.getElementById('addLocation')?.value.trim() || '',
    };

    if (mode === 'edit') {
      const newDayId = document.getElementById('addDaySelect')?.value;
      if (newDayId) data.dayId = newDayId;
      updateActivity(document.getElementById('editActId').value, data);
    } else {
      addActivity(document.getElementById('addDayId').value, data);
    }
    closeAddModal();
  });
}

function openAddModal(dayId) {
  const modal = document.getElementById('addModal');
  if (!modal) return;
  document.getElementById('addForm').reset();
  document.getElementById('addDayId').value = dayId;
  const daySelectWrap = document.getElementById('addDaySelectWrap');
  if (daySelectWrap) daySelectWrap.style.display = 'none';
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  setTimeout(() => document.getElementById('addName')?.focus(), 50);
}

function closeAddModal() {
  const modal = document.getElementById('addModal');
  if (!modal) return;
  modal.classList.remove('show');
  setTimeout(() => {
    modal.hidden = true;
    const modeEl = document.getElementById('addMode');
    if (modeEl) modeEl.value = 'add';
    const daySelectWrap = document.getElementById('addDaySelectWrap');
    if (daySelectWrap) daySelectWrap.style.display = 'none';
    modal.querySelector('.add-modal-title').textContent = '➕ Nouvelle activité';
    modal.querySelector('.add-submit').textContent       = 'Ajouter';
  }, 200);
}

// ── Expense Modal ──────────────────────────────────────────────────────────────────
function injectExpenseModal() {
  if (document.getElementById('expModal')) return;

  const modal = document.createElement('div');
  modal.className = 'add-modal';
  modal.id = 'expModal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="add-modal-backdrop" data-close-exp></div>
    <div class="add-modal-box" role="dialog" aria-modal="true" aria-label="Ajouter une dépense">
      <button class="add-modal-close" data-close-exp aria-label="Fermer">✕</button>
      <h3 class="add-modal-title">💰 Nouvelle dépense</h3>
      <p class="exp-person-line" id="expPersonLine"></p>
      <form id="expForm" class="add-form" novalidate>
        <input type="hidden" id="expPersonId" />
        <label class="add-label">Description *
          <input type="text" id="expLabel" class="add-input" required maxlength="80" placeholder="Ex : Souvenirs, ramen, train…" />
        </label>
        <div class="add-row">
          <label class="add-label">Montant (€)
            <input type="number" id="expAmtEur" class="add-input" min="0" step="0.5" placeholder="0" />
          </label>
          <label class="add-label">Montant (¥)
            <input type="number" id="expAmtJpy" class="add-input" min="0" step="100" placeholder="0" />
          </label>
        </div>
        <div class="add-actions">
          <button type="button" class="add-cancel" data-close-exp>Annuler</button>
          <button type="submit" class="add-submit">Ajouter</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll('[data-close-exp]').forEach(el => {
    el.addEventListener('click', closeExpenseModal);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeExpenseModal();
  });

  modal.querySelector('#expForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const label = document.getElementById('expLabel').value.trim();
    if (!label) { document.getElementById('expLabel').focus(); return; }
    addExpense(document.getElementById('expPersonId').value, {
      label,
      amountEur: document.getElementById('expAmtEur').value,
      amountJpy: document.getElementById('expAmtJpy').value,
    });
    closeExpenseModal();
  });
}

function openExpenseModal(personId) {
  const modal = document.getElementById('expModal');
  if (!modal) return;
  const person = PEOPLE.find(p => p.id === personId);
  document.getElementById('expForm').reset();
  document.getElementById('expPersonId').value = personId;
  const line = document.getElementById('expPersonLine');
  if (line && person) line.textContent = `Pour ${person.emoji} ${getPersonName(personId)}`;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  setTimeout(() => document.getElementById('expLabel')?.focus(), 50);
}

function closeExpenseModal() {
  const modal = document.getElementById('expModal');
  if (!modal) return;
  modal.classList.remove('show');
  setTimeout(() => { modal.hidden = true; }, 200);
}

// ── Firebase Setup ────────────────────────────────────────────────────────────
async function setupFirebase(config) {
  updateSyncStatus('connecting');
  try {
    const { initializeApp }  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getFirestore, collection, doc, onSnapshot, setDoc, getDocs, writeBatch }
      = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    firebaseApp = initializeApp(config);
    db = getFirestore(firebaseApp);

    // Seed if empty
    await seedDatabase(db, getDocs, collection, doc, writeBatch, setDoc);

    // Subscribe to realtime updates
    subscribeToUpdates(db, collection, onSnapshot);
    subscribeToExpenses(db, collection, onSnapshot);
    subscribeToPeople(db, collection, onSnapshot);
    subscribeToPhrasesUpdates(db, collection, onSnapshot);
    subscribeToDayPoints(db, collection, onSnapshot);

    updateSyncStatus('online');
    showToast('🔥 Synchronisation Firebase active');
  } catch (e) {
    console.error('Firebase setup error:', e);
    updateSyncStatus('offline');
    db = null;
  }
}

async function seedDatabase(db, getDocs, collection, doc, writeBatch, setDoc) {
  try {
    const [actSnap, phraseSnap] = await Promise.all([
      getDocs(collection(db, 'activities')),
      getDocs(collection(db, 'phrases')),
    ]);

    const batch = writeBatch(db);
    let needsCommit = false;

    if (actSnap.empty) {
      SEED_ACTIVITIES.forEach(act => {
        batch.set(doc(db, 'activities', act.id), toRecord(act));
      });
      needsCommit = true;
    }

    if (phraseSnap.empty) {
      Object.values(buildSeedPhrases()).forEach(p => {
        batch.set(doc(db, 'phrases', p.id), { section: p.section, fr: p.fr, jp: p.jp, ro: p.ro });
      });
      needsCommit = true;
    }

    if (needsCommit) await batch.commit();
  } catch (e) {
    console.error('Seed error:', e);
  }
}

function subscribeToUpdates(db, collection, onSnapshot) {
  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(
    collection(db, 'activities'),
    (snap) => {
      // Rebuild the whole activities map from the cloud (handles add + delete)
      const fresh = {};
      snap.forEach(docSnap => {
        fresh[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      state.activities = fresh;

      // Mirror to localStorage as an offline cache
      saveToLocalStorage();

      // Full re-render so added / deleted activities appear for everyone
      renderBudget();
      renderBook();
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      updateSyncStatus('offline');
      db = null;
    }
  );
}

function subscribeToExpenses(db, collection, onSnapshot) {
  if (unsubscribeExpenses) unsubscribeExpenses();

  unsubscribeExpenses = onSnapshot(
    collection(db, 'expenses'),
    (snap) => {
      const fresh = {};
      snap.forEach(docSnap => {
        fresh[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      state.expenses = fresh;
      saveExpensesToLocalStorage();
      // Re-render the budget page if it's showing
      if (state.isBudgetPage) renderBudgetPage();
    },
    (error) => {
      console.error('Firestore subscription error (expenses):', error);
    }
  );
}

function subscribeToPeople(db, collection, onSnapshot) {
  if (unsubscribePeople) unsubscribePeople();

  unsubscribePeople = onSnapshot(
    collection(db, 'people'),
    (snap) => {
      const fresh = {};
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.name) fresh[docSnap.id] = data.name;
      });
      state.peopleNames = fresh;
      savePeopleToLocalStorage();
      if (state.isBudgetPage) renderBudgetPage();
    },
    (error) => {
      console.error('Firestore subscription error (people):', error);
    }
  );
}


function subscribeToPhrasesUpdates(db, collection, onSnapshot) {
  onSnapshot(
    collection(db, 'phrases'),
    (snap) => {
      const fresh = {};
      snap.forEach(docSnap => {
        fresh[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      if (Object.keys(fresh).length > 0) {
        state.phrases = fresh;
        savePhrasesToLocalStorage();
        if (state.isPhrasesPage) renderPhrasesPage();
      }
    },
    (error) => {
      console.error('Firestore subscription error (phrases):', error);
    }
  );
}

function subscribeToDayPoints(db, collection, onSnapshot) {
  onSnapshot(
    collection(db, 'dayPoints'),
    (snap) => {
      const fresh = {};
      snap.forEach(docSnap => {
        const d = docSnap.data();
        fresh[docSnap.id] = { start: d.start || '', end: d.end || '' };
      });
      state.dayPoints = fresh;
      saveDayPointsToLocalStorage();
      renderBook();
    },
    (error) => {
      console.error('Firestore subscription error (dayPoints):', error);
    }
  );
}

// ── Scroll-aware header ───────────────────────────────────────────────────────
function initScrollHeader() {
  let lastScrollY = window.scrollY;
  const header = document.querySelector('.app-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastScrollY && y > 80) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }
    lastScrollY = Math.max(0, y);
  }, { passive: true });
}

// ── Tab reordering ────────────────────────────────────────────────────────────
function saveTabOrder() {
  const nav = document.querySelector('.city-nav');
  if (!nav) return;
  const order = Array.from(nav.querySelectorAll('.city-btn')).map(b => b.dataset.city);
  try { localStorage.setItem('japon2026_tab_order_v1', JSON.stringify(order)); } catch(e) {}
}

function applyTabOrder() {
  const nav = document.querySelector('.city-nav');
  if (!nav) return;
  try {
    const raw = localStorage.getItem('japon2026_tab_order_v1');
    if (!raw) return;
    const order = JSON.parse(raw);
    const buttons = Array.from(nav.querySelectorAll('.city-btn'));
    const ordered = order.map(id => buttons.find(b => b.dataset.city === id)).filter(Boolean);
    buttons.filter(b => !order.includes(b.dataset.city)).forEach(b => ordered.push(b));
    ordered.forEach(b => nav.appendChild(b));
  } catch(e) {}
}

function initTabReorder() {
  applyTabOrder();
  const nav = document.querySelector('.city-nav');
  if (!nav) return;
  let tabDragSrc = null;

  nav.querySelectorAll('.city-btn').forEach(btn => {
    btn.setAttribute('draggable', 'true');

    btn.addEventListener('dragstart', e => {
      tabDragSrc = btn;
      btn.classList.add('tab-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    btn.addEventListener('dragend', () => {
      btn.classList.remove('tab-dragging');
      nav.querySelectorAll('.city-btn').forEach(b => b.classList.remove('tab-drag-over'));
      saveTabOrder();
    });
    btn.addEventListener('dragover', e => {
      e.preventDefault();
      if (tabDragSrc && tabDragSrc !== btn) {
        nav.querySelectorAll('.city-btn').forEach(b => b.classList.remove('tab-drag-over'));
        btn.classList.add('tab-drag-over');
      }
    });
    btn.addEventListener('dragleave', () => btn.classList.remove('tab-drag-over'));
    btn.addEventListener('drop', e => {
      e.preventDefault();
      if (tabDragSrc && tabDragSrc !== btn) {
        const items = Array.from(nav.querySelectorAll('.city-btn'));
        const si = items.indexOf(tabDragSrc);
        const ti = items.indexOf(btn);
        if (si < ti) btn.after(tabDragSrc);
        else btn.before(tabDragSrc);
      }
    });
  });
}

// ── Activity drag & drop reordering ──────────────────────────────────────────
function initActivityDragDrop(container) {
  let actDragSrc = null;

  function clearDragState() {
    if (actDragSrc) actDragSrc.classList.remove('dragging');
    container.querySelectorAll('.activity-item').forEach(i => i.classList.remove('drag-over'));
    actDragSrc = null;
  }

  function getItemAtY(clientY) {
    for (const item of container.querySelectorAll('.activity-item')) {
      if (item === actDragSrc) continue;
      const r = item.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return item;
    }
    return null;
  }

  function onTouchMove(e) {
    if (!actDragSrc) return;
    e.preventDefault();
    const touch = e.touches[0];
    const target = getItemAtY(touch.clientY);
    container.querySelectorAll('.activity-item').forEach(i => i.classList.remove('drag-over'));
    if (target) target.classList.add('drag-over');
  }

  function onTouchEnd(e) {
    if (!actDragSrc) return;
    const touch = e.changedTouches[0];
    const target = getItemAtY(touch.clientY);
    const src = actDragSrc;
    clearDragState();
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
    if (target) reorderActivities(src.dataset.activityItem, target.dataset.activityItem);
  }

  container.querySelectorAll('.activity-item[draggable]').forEach(item => {
    // ── Desktop (mouse) drag ──
    item.addEventListener('dragstart', e => {
      actDragSrc = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', clearDragState);
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (actDragSrc && actDragSrc !== item) {
        container.querySelectorAll('.activity-item').forEach(i => i.classList.remove('drag-over'));
        item.classList.add('drag-over');
      }
    });
    item.addEventListener('dragleave', e => {
      if (!item.contains(e.relatedTarget)) item.classList.remove('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (actDragSrc && actDragSrc !== item) {
        reorderActivities(actDragSrc.dataset.activityItem, item.dataset.activityItem);
      }
    });

    // ── Mobile (touch) drag – initiated via drag handle ──
    const handle = item.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();
        actDragSrc = item;
        item.classList.add('dragging');
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
        document.addEventListener('touchcancel', onTouchEnd);
      }, { passive: false });
    }
  });
}

async function reorderActivities(srcId, tgtId) {
  const srcAct = state.activities[srcId];
  const tgtAct = state.activities[tgtId];
  if (!srcAct || !tgtAct || srcAct.dayId !== tgtAct.dayId) return;

  const dayActs = getDayActivities(srcAct.dayId);
  const si = dayActs.findIndex(a => a.id === srcId);
  const ti = dayActs.findIndex(a => a.id === tgtId);
  if (si === -1 || ti === -1) return;

  const [moved] = dayActs.splice(si, 1);
  dayActs.splice(ti, 0, moved);
  dayActs.forEach((a, i) => { a.order = i; });

  renderBook();
  saveToLocalStorage();
  showToast('↕️ Ordre mis à jour');
  for (const a of dayActs) await persistActivity(a.id, a);
}

// ── Activity detail bottom sheet ──────────────────────────────────────────────
const PRIORITY_LABELS = { high: 'Haute', medium: 'Moyenne', low: 'Basse' };
const PRIORITY_COLORS = { high: '#C62828', medium: '#C9A84C', low: '#4CAF50' };
const PRIORITY_EMOJIS = { high: '🔴', medium: '🟡', low: '🟢' };

function injectDetailSheet() {
  if (document.getElementById('detailSheet')) return;
  const sheet = document.createElement('div');
  sheet.id = 'detailSheet';
  sheet.className = 'detail-sheet';
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="detail-sheet-backdrop" id="detailBackdrop"></div>
    <div class="detail-sheet-box" role="dialog" aria-modal="true" aria-label="Détails de l\'activité">
      <div class="detail-drag-handle"></div>
      <button class="detail-close" id="detailClose" aria-label="Fermer">✕</button>
      <div class="detail-priority-bar" id="detailPriorityBar"></div>
      <h3 class="detail-title" id="detailTitle"></h3>
      <div class="detail-meta" id="detailMeta"></div>
      <div class="detail-note" id="detailNote" style="display:none"></div>
      <div class="detail-actions">
        <button class="detail-edit-btn" id="detailEditBtn">✏️ Modifier</button>
        <button class="detail-del-btn" id="detailDelBtn">🗑️ Supprimer</button>
      </div>
    </div>
  `;
  document.body.appendChild(sheet);

  const closeSheet = () => {
    sheet.classList.remove('show');
    setTimeout(() => { sheet.hidden = true; }, 300);
  };
  document.getElementById('detailBackdrop').addEventListener('click', closeSheet);
  document.getElementById('detailClose').addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

  document.getElementById('detailEditBtn').addEventListener('click', () => {
    const id = sheet.dataset.actId;
    closeSheet();
    setTimeout(() => openEditModal(id), 50);
  });
  document.getElementById('detailDelBtn').addEventListener('click', () => {
    closeSheet();
    deleteActivity(sheet.dataset.actId);
  });
}

function openDetailSheet(actId) {
  const act = state.activities[actId];
  if (!act) return;
  const sheet = document.getElementById('detailSheet');
  if (!sheet) return;

  sheet.dataset.actId = actId;
  const prio = act.priority || 'medium';
  const color = PRIORITY_COLORS[prio];
  const day = ALL_DAYS.find(d => d.id === act.dayId);

  document.getElementById('detailPriorityBar').style.background = color;
  document.getElementById('detailTitle').textContent = act.name;

  let metaHtml = '';
  if (day) metaHtml += `<span class="detail-meta-item">📅 ${escapeHtml(day.label.split(' ').slice(0, 3).join(' '))}</span>`;
  if (act.priceEur > 0) metaHtml += `<span class="detail-meta-item">💶 ${act.priceEur} €</span>`;
  if (act.priceJpy > 0) metaHtml += `<span class="detail-meta-item">💴 ${act.priceJpy.toLocaleString()} ¥</span>`;
  metaHtml += `<span class="detail-meta-item">${CAT_EMOJI[act.category] || '📌'} ${escapeHtml(act.category)}</span>`;
  metaHtml += `<span class="detail-meta-item priority-badge" style="background:${color}22;color:${color}">${PRIORITY_EMOJIS[prio]} Priorité ${PRIORITY_LABELS[prio]}</span>`;
  if (act.isPaid) metaHtml += `<span class="detail-meta-item paid-badge">✓ PAYÉ</span>`;
  if (act.reminder) metaHtml += `<span class="detail-meta-item">🔔 ${escapeHtml(act.reminder)}</span>`;

  document.getElementById('detailMeta').innerHTML = metaHtml;
  const noteEl = document.getElementById('detailNote');
  noteEl.textContent = act.note || '';
  noteEl.style.display = act.note ? 'block' : 'none';

  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('show'));
}

// ── Reminder scheduling ───────────────────────────────────────────────────────
function scheduleReminders() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  ALL_DAYS.filter(d => d.date === todayStr).forEach(day => {
    getDayActivities(day.id).forEach(act => {
      if (!act.reminder || act.checked) return;
      const [h, m] = act.reminder.split(':').map(Number);
      const t = new Date(now);
      t.setHours(h, m, 0, 0);
      const diff = t - now;
      if (diff > 0 && diff < 12 * 60 * 60 * 1000) {
        setTimeout(() => {
          showToast(`🔔 Rappel : ${act.name}`, 6000);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Japon 2026', { body: act.name });
          }
        }, diff);
      }
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Load local state first for instant UI
  loadFromLocalStorage();
  loadExpensesFromLocalStorage();
  loadPeopleFromLocalStorage();
  loadPhrasesFromLocalStorage();
  loadDayPointsFromLocalStorage();

  // Setup event listeners
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => setCity(btn.dataset.city));
  });

  document.getElementById('prevBtn')?.addEventListener('click', () => navigate('prev'));
  document.getElementById('nextBtn')?.addEventListener('click', () => navigate('next'));

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate('next');
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate('prev');
  });

  // Logo → retour calendrier
  const logo = document.getElementById('logoHome');
  if (logo) {
    logo.addEventListener('click', () => setCity('calendar'));
    logo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') setCity('calendar'); });
  }

  // Bouton Carte du header
  const headerMapBtn = document.getElementById('headerMapBtn');
  if (headerMapBtn) headerMapBtn.addEventListener('click', () => setCity('map'));

  // Spawn sakura
  spawnSakura();

  // Inject the add-activity modal
  injectModal();
  injectExpenseModal();
  injectDetailSheet();
  injectPhraseModal();
  injectDayPointModal();

  // Smart scroll-hide header
  initScrollHeader();

  // Tab drag reorder
  initTabReorder();

  // Initial render
  renderBook();
  renderBudget();
  updateNavButtons();

  // Schedule any reminders for today
  scheduleReminders();

  // Request notification permission on next interaction
  document.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, { once: true });

  // Try Firebase
  try {
    const configModule = await import('./firebase-config.js');
    if (configModule.IS_CONFIGURED && configModule.firebaseConfig) {
      await setupFirebase(configModule.firebaseConfig);
    } else {
      updateSyncStatus('offline');
      showToast('Mode hors-ligne – configurez Firebase pour la sync');
      // Show setup overlay after a delay
      setTimeout(() => {
        const overlay = document.getElementById('setupOverlay');
        if (overlay) overlay.hidden = false;
      }, 2000);
    }
  } catch (e) {
    // firebase-config.js not found → offline mode
    updateSyncStatus('offline');
    console.info('firebase-config.js not found – running in offline mode');
    // Optionally show setup overlay
    // setTimeout(() => { document.getElementById('setupOverlay').hidden = false; }, 1500);
  }
}

// ── Start ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
