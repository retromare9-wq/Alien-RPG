// Speicherung aller Charaktere lokal im Browser (localStorage).
import {
  ATTRIBUTES, SKILLS, STRESS_RESPONSES, PANIC_RESPONSES, MAX_STRESS, clamp,
  deriveHealth, deriveResolve, deriveEncumbranceMax,
} from './rules.js';
import { CATALOG } from './data/equipment.js';
import { LOCATIONS_SEED } from './data/locations.js';

const KEY = 'alien-rpg-characters-v1';
export const GEAR_ROWS = 10;
export const WEAPON_ROWS = 4;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const NPC_FIELDS = [
  { key: 'voice', label: 'Stimme' },
  { key: 'speech', label: 'Sprachmuster' },
  { key: 'temperament', label: 'Temperament' },
  { key: 'body', label: 'Körper' },
  { key: 'desire', label: 'Wunsch' },
  { key: 'fear', label: 'Angst' },
  { key: 'secret', label: 'Geheimnis' },
  { key: 'danger', label: 'Verhalten bei Gefahr' },
  { key: 'attitude', label: 'Haltung zu PCs' },
  { key: 'pressure', label: 'Verhalten bei Druck durch PCs' },
];

const flags = (list) => Object.fromEntries(list.map((r) => [r.key, false]));

export function blankWeapon() {
  return { name: '', skill: 'rangedCombat', modifier: 0, damage: '', range: '', ammo: '', weight: '' };
}

export function blankGear() {
  return { name: '', airPower: '', weight: '' };
}

export function newCharacter(type = 'PC') {
  const attributes = Object.fromEntries(ATTRIBUTES.map((a) => [a.key, 2]));
  const health = deriveHealth(attributes);
  return {
    id: uid(),
    type,
    hasStress: type === 'PC',
    name: '',
    career: '',
    appearance: '',
    agenda: '',
    buddy: '',
    rival: '',
    talents: '',
    xp: 0,
    storyPoints: 0,
    attributes,
    skills: Object.fromEntries(SKILLS.map((s) => [s.key, 0])),
    stress: 0,
    health: { current: health, max: health },
    fatigued: false,
    resolve: deriveResolve(attributes),
    radiation: 0,
    responses: flags(STRESS_RESPONSES),
    panic: flags(PANIC_RESPONSES),
    injuries: '',
    tinyItems: '',
    signatureItem: '',
    armor: { name: '', level: '', weight: '' },
    encumbrance: { max: deriveEncumbranceMax(attributes) },
    // true = Wert folgt automatisch der Regel-Formel, false = von Hand überschrieben
    auto: { health: true, resolve: true, encMax: true },
    lastRoll: null,
    cash: '',
    weapons: Array.from({ length: WEAPON_ROWS }, blankWeapon),
    gear: Array.from({ length: GEAR_ROWS }, blankGear),
    notes: '',
    npc: Object.fromEntries(NPC_FIELDS.map((f) => [f.key, ''])),
    updatedAt: Date.now(),
  };
}

// Fehlende Felder (z. B. aus älteren Exporten) mit Standardwerten auffüllen.
export function normalize(c) {
  const base = newCharacter(c.type === 'NPC' ? 'NPC' : 'PC');
  const out = { ...base, ...c };
  for (const k of ['attributes', 'skills', 'health', 'responses', 'panic', 'armor', 'encumbrance', 'npc']) {
    out[k] = { ...base[k], ...(c[k] || {}) };
  }
  out.weapons = (Array.isArray(c.weapons) ? c.weapons : []).map((w) => ({ ...blankWeapon(), ...w }));
  while (out.weapons.length < WEAPON_ROWS) out.weapons.push(blankWeapon());
  out.gear = (Array.isArray(c.gear) ? c.gear : []).map((g) => ({ ...blankGear(), ...g }));
  while (out.gear.length < GEAR_ROWS) out.gear.push(blankGear());
  out.hasStress = out.type === 'PC'; // NPCs haben laut Regeln kein Stress Level
  out.stress = out.hasStress ? clamp(Number(out.stress) || 0, 0, MAX_STRESS) : 0;
  delete out.encumbrance.current; // wird jetzt aus Gear und Waffen berechnet
  if (!c.auto) {
    // Ältere Charaktere: Auto nur dort, wo noch der Regelwert oder der alte Standardwert steht.
    const a = out.attributes;
    out.auto = {
      health: [deriveHealth(a), 2].includes(Number(out.health.max)),
      resolve: [deriveResolve(a), 0].includes(Number(out.resolve)),
      encMax: ['', String(deriveEncumbranceMax(a))].includes(String(out.encumbrance.max ?? '')),
    };
    applyDerived(out);
  } else {
    out.auto = { ...base.auto, ...c.auto };
  }
  out.id = out.id || uid();
  return out;
}

// Werte mit Auto-Flag aus den Attributen neu berechnen.
export function applyDerived(c) {
  const a = c.attributes;
  if (c.auto.health) {
    const max = deriveHealth(a);
    if (c.health.current === c.health.max || c.health.current > max) c.health.current = max;
    c.health.max = max;
  }
  if (c.auto.resolve) c.resolve = deriveResolve(a);
  if (c.auto.encMax) c.encumbrance.max = deriveEncumbranceMax(a);
  return c;
}

let cache = null;

export function all() {
  if (!cache) {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      cache = Array.isArray(raw) ? raw.map(normalize) : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(cache));
}

export const get = (id) => all().find((c) => c.id === id);

export function save(character) {
  const list = all();
  character.updatedAt = Date.now();
  const i = list.findIndex((c) => c.id === character.id);
  if (i >= 0) list[i] = character;
  else list.push(character);
  persist();
  return character;
}

export function update(id, fn) {
  const c = get(id);
  if (!c) return null;
  fn(c);
  return save(c);
}

export function remove(id) {
  cache = all().filter((c) => c.id !== id);
  persist();
}

export function sorted(list = all()) {
  return [...list].sort((a, b) => (a.type === b.type ? (a.name || '').localeCompare(b.name || '', 'de') : a.type === 'PC' ? -1 : 1));
}

// ---------- Locations ----------

const LOC_KEY = 'alien-rpg-locations-v1';
let locCache = null;

export function blankLocation() {
  return {
    id: uid(), name: '', department: '', mapCode: '',
    cluttered: false, terminal: false, camera: false,
    look: '', smell: '', sound: '', finds: '', interaction: '', notes: '',
  };
}

export function locations() {
  if (!locCache) {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(LOC_KEY) || 'null'); } catch { raw = null; }
    if (Array.isArray(raw)) {
      locCache = raw.map((l) => ({ ...blankLocation(), ...l }));
    } else {
      // Erster Start: Ortsliste aus den Raumbeschreibungen übernehmen.
      locCache = LOCATIONS_SEED.map((l) => ({ ...blankLocation(), ...l }));
      persistLocations();
    }
  }
  return locCache;
}

function persistLocations() {
  localStorage.setItem(LOC_KEY, JSON.stringify(locCache));
}

export const getLocation = (id) => locations().find((l) => l.id === id);

export function saveLocation(loc) {
  const list = locations();
  const i = list.findIndex((l) => l.id === loc.id);
  if (i >= 0) list[i] = loc;
  else list.push(loc);
  persistLocations();
  return loc;
}

export function removeLocation(id) {
  locCache = locations().filter((l) => l.id !== id);
  persistLocations();
}

// ---------- Equipment ----------
// Katalog aus dem Code, eigene Änderungen und neue Items liegen lokal.

const EQ_KEY = 'alien-rpg-equipment-v1';
let eqCache = null;

function eqState() {
  if (!eqCache) {
    try { eqCache = JSON.parse(localStorage.getItem(EQ_KEY) || 'null'); } catch { eqCache = null; }
    if (!eqCache || typeof eqCache !== 'object') eqCache = {};
    eqCache.edits ||= {};
    eqCache.custom ||= [];
  }
  return eqCache;
}

function persistEquipment() {
  localStorage.setItem(EQ_KEY, JSON.stringify(eqCache));
}

export function equipment() {
  const st = eqState();
  return [...CATALOG.map((it) => (st.edits[it.id] ? { ...it, ...st.edits[it.id], edited: true } : it)), ...st.custom.map((it) => ({ ...it, custom: true }))];
}

export const getItem = (id) => equipment().find((it) => it.id === id);

export function saveItem(item) {
  const st = eqState();
  const clean = { ...item };
  delete clean.edited;
  delete clean.custom;
  if (CATALOG.some((it) => it.id === clean.id)) st.edits[clean.id] = clean;
  else {
    const i = st.custom.findIndex((it) => it.id === clean.id);
    if (i >= 0) st.custom[i] = clean;
    else st.custom.push(clean);
  }
  persistEquipment();
  return clean;
}

// Katalog-Item: eigene Änderungen verwerfen. Eigenes Item: löschen.
export function resetItem(id) {
  const st = eqState();
  delete st.edits[id];
  st.custom = st.custom.filter((it) => it.id !== id);
  persistEquipment();
}

export const newItemId = () => `custom-${uid()}`;

// Sucht einen Katalog-Eintrag passend zum eingegebenen Namen (ohne Groß-/Kleinschreibung).
export function findItem(name, kinds = null) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  return equipment().find((it) => it.name.toLowerCase() === n && (!kinds || kinds.includes(it.kind))) || null;
}

// ---------- Backup ----------

export function exportJson() {
  return JSON.stringify({
    app: 'alien-rpg-characters', version: 2, exportedAt: new Date().toISOString(),
    characters: all(), locations: locations(), equipment: eqState(),
  }, null, 2);
}

// Import: vorhandene Charaktere mit gleicher ID werden überschrieben, neue hinzugefügt.
export function importJson(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.characters || [];
  if (!Array.isArray(list)) throw new Error('Keine Charakterliste in der Datei gefunden.');
  let locs = 0;
  if (Array.isArray(data.locations)) {
    for (const l of data.locations) saveLocation({ ...blankLocation(), ...l });
    locs = data.locations.length;
  }
  if (data.equipment && typeof data.equipment === 'object') {
    const st = eqState();
    Object.assign(st.edits, data.equipment.edits || {});
    for (const it of data.equipment.custom || []) {
      const i = st.custom.findIndex((x) => x.id === it.id);
      if (i >= 0) st.custom[i] = it;
      else st.custom.push(it);
    }
    persistEquipment();
  }
  const current = all();
  let added = 0;
  let updated = 0;
  for (const raw of list) {
    const c = normalize(raw);
    const i = current.findIndex((x) => x.id === c.id);
    if (i >= 0) {
      current[i] = c;
      updated++;
    } else {
      current.push(c);
      added++;
    }
  }
  persist();
  return { added, updated, locs };
}
