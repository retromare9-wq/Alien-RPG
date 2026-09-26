import {
  ATTRIBUTES, STRESS_RESPONSES, PANIC_RESPONSES, MAX_STRESS,
  skillsFor, skillByKey, responsePenalties, clamp,
  DERIVED, encumbrance, pointWarnings, strongestRolls,
  DEFAULT_ATTRIBUTE_POINTS, DEFAULT_SKILL_POINTS,
  resolveStressResponse, resolvePanic, STRESS_DURATION, PANIC_ENDS,
} from './rules.js';
import * as store from './store.js';
import { NPC_FIELDS } from './store.js';
import { openRoll, handleRollAction } from './roll.js';
import { RULES } from './ruletext.js';
import {
  equipmentView, filterEquipment, randomPick, openAssign, closePick, assignItem,
  itemEditView, saveItemForm, resetItem, equipmentDatalists, fillWeapon, fillArmor, fillGear,
} from './catalog.js';
import {
  locationsView, filterLocations, locationView, locationEditView, saveLocationForm, deleteLocation,
} from './places.js';
import { xenosView, xenoView, xenoEditView, saveXenoForm, xenoAction, addXeno } from './xenoview.js';
import { combatView, combatAction } from './combat.js';

const $main = document.getElementById('main');
export const ui = loadUi();

const settings = () => ({
  checkPoints: ui.checkPoints ?? true,
  attrPoints: ui.attrPoints ?? DEFAULT_ATTRIBUTE_POINTS,
  skillPoints: ui.skillPoints ?? DEFAULT_SKILL_POINTS,
});

// ---------- Hilfsfunktionen ----------

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

export const nl2br = (v) => esc(v).replace(/\n/g, '<br>');

function loadUi() {
  try {
    return { filter: 'all', open: {}, ...JSON.parse(localStorage.getItem('alien-rpg-ui') || '{}') };
  } catch {
    return { filter: 'all', open: {} };
  }
}

export function saveUi() {
  try {
    localStorage.setItem('alien-rpg-ui', JSON.stringify(ui));
  } catch { /* egal */ }
}

export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

export function section(key, title, body, { open = false, badge = '' } = {}) {
  const isOpen = ui.open[key] ?? open;
  return `<details class="card sec" data-sec="${key}" ${isOpen ? 'open' : ''}>
    <summary><span>${title}</span>${badge ? `<span class="badge">${badge}</span>` : ''}</summary>
    <div class="sec-body">${body}</div>
  </details>`;
}

const typeBadge = (c) => `<span class="type type-${c.type.toLowerCase()}">${c.type}</span>`;

function stepper(id, field, value, label, extra = '') {
  return `<div class="stepper">
    <span class="stepper-label">${label}</span>
    <button class="btn-round" data-act="stat" data-id="${id}" data-field="${field}" data-d="-1" aria-label="${label} verringern">−</button>
    <span class="stepper-value">${value}${extra}</span>
    <button class="btn-round" data-act="stat" data-id="${id}" data-field="${field}" data-d="1" aria-label="${label} erhöhen">+</button>
  </div>`;
}

function stressBoxes(c) {
  let boxes = '';
  for (let i = 1; i <= MAX_STRESS; i++) {
    boxes += `<button class="sbox ${i <= c.stress ? 'on' : ''}" data-act="stress-set" data-id="${c.id}" data-v="${i}" aria-label="Stress ${i}"></button>`;
  }
  return `<div class="stress-row">${boxes}</div>`;
}

function activeResponseChips(c) {
  const chips = [
    ...STRESS_RESPONSES.filter((r) => c.responses[r.key]).map((r) => `<span class="chip chip-stress" title="${esc(r.effect)}">${r.label}</span>`),
    ...PANIC_RESPONSES.filter((r) => c.panic[r.key]).map((r) => `<span class="chip chip-panic">${r.label}</span>`),
  ];
  if (c.fatigued) chips.unshift('<span class="chip chip-warn">Fatigued</span>');
  if (c.type === 'PC' && c.encumbrance.max !== '' && encumbrance(c) > Number(c.encumbrance.max)) chips.unshift('<span class="chip chip-warn">Over-encumbered</span>');
  if (c.health.current <= 0) chips.unshift('<span class="chip chip-warn">Broken</span>');
  return chips.join('');
}

function encHtml(c) {
  const cur = encumbrance(c);
  const max = Number(c.encumbrance.max);
  const over = c.encumbrance.max !== '' && cur > max;
  return `<span class="enc ${over ? 'over' : ''}">${cur} / ${esc(c.encumbrance.max) || '—'}${over ? ' · over-encumbered' : ''}</span>`;
}

function pointsHint(c) {
  const st = settings();
  if (c.type !== 'PC' || !st.checkPoints) return '';
  const warn = pointWarnings(c, st.attrPoints, st.skillPoints);
  return warn.length ? `<div class="points-warn">${warn.map((w) => `<p>${esc(w)}</p>`).join('')}</div>` : '';
}

const lastRollHtml = (c) => {
  const r = c.lastRoll;
  if (!r) return '';
  return `<div class="last-roll ${r.kind}">
    <div class="lr-head">
      <span class="lr-kind">${r.kind === 'panic' ? 'Panic Roll' : 'Stress Response'}</span>
      <button class="icon-btn small" data-act="clear-last" data-id="${c.id}" aria-label="Ergebnis ausblenden">✕</button>
    </div>
    <div class="resp-calc">D6 <b>${r.die}</b> + Stress <b>${r.stress}</b> − Resolve <b>${r.resolve}</b> = <b>${r.total}</b></div>
    <div class="resp-name">${esc(r.label)}</div>
    <p>${esc(r.effect)}</p>
    ${r.note ? `<p class="hint">${esc(r.note)}</p>` : ''}
    <p class="lr-dur"><b>Dauer:</b> ${esc(r.duration)}</p>
  </div>`;
};

// ---------- Ansichten ----------

function listView() {
  const list = store.sorted().filter((c) => ui.filter === 'all' || c.type === ui.filter);
  const filters = [['all', 'Alle'], ['PC', 'PCs'], ['NPC', 'NPCs']]
    .map(([v, l]) => `<button class="seg ${ui.filter === v ? 'active' : ''}" data-act="filter" data-v="${v}">${l}</button>`).join('');

  const items = list.map((c) => `
    <div class="card list-item">
      <a class="li-link" href="#/c/${c.id}">
      <div class="li-main">
        <div class="li-name">${esc(c.name || 'Ohne Namen')} ${typeBadge(c)}</div>
        <div class="li-sub">${esc(c.career || '—')}</div>
      </div>
      <div class="li-stats">
        ${c.hasStress ? `<span class="mini stress">S ${c.stress}</span>` : ''}
        <span class="mini ${c.health.current <= 0 ? 'down' : ''}">H ${c.health.current}/${c.health.max}</span>
      </div>
      </a>
      <input class="init-input" data-init="char" data-id="${c.id}" value="${esc(c.initiative)}" inputmode="numeric" placeholder="Init" aria-label="Initiative">
    </div>`).join('');

  return `
    <div class="segments">${filters}</div>
    ${items || '<p class="empty">Noch keine Charaktere. Lege unten einen an.</p>'}
    ${items ? '<p class="hint">Init: Initiative-Zahl eintragen, dann erscheint der Charakter im Combat-Reiter.</p>' : ''}
    <div class="new-row">
      <a class="btn btn-primary" href="#/new/PC">+ Neuer PC</a>
      <a class="btn" href="#/new/NPC">+ Neuer NPC</a>
    </div>`;
}

function attributesHtml(c) {
  return ATTRIBUTES.map((a) => {
    const av = c.attributes[a.key];
    const pen = responsePenalties(c.responses, a.key).reduce((s, p) => s + p.value, 0);
    const penTag = pen ? `<span class="pen">${pen}</span>` : '';
    const skills = skillsFor(a.key).map((s) => {
      const sv = c.skills[s.key];
      const total = Math.max(1, av + sv + pen);
      return `<button class="skill-row" data-act="roll" data-id="${c.id}" data-attr="${a.key}" data-skill="${s.key}">
        <span class="skill-name">${s.label}</span>
        <span class="skill-val">${sv}</span>
        <span class="dice-count">${total}${penTag}<i class="dicon"></i></span>
      </button>`;
    }).join('');
    return `<div class="attr">
      <button class="attr-head" data-act="roll" data-id="${c.id}" data-attr="${a.key}">
        <span class="attr-name">${a.label}</span>
        <span class="attr-val">${av}</span>
        <span class="dice-count">${Math.max(1, av + pen)}${penTag}<i class="dicon"></i></span>
      </button>
      ${skills}
    </div>`;
  }).join('');
}

function weaponsHtml(c) {
  const weapons = c.weapons.filter((w) => w.name.trim());
  if (!weapons.length) return '<p class="hint">Keine Weapons eingetragen.</p>';
  return weapons.map((w) => {
    const idx = c.weapons.indexOf(w);
    const sk = skillByKey(w.skill);
    return `<div class="item">
      <div class="item-head"><b>${esc(w.name)}</b>
        ${sk ? `<button class="btn btn-small" data-act="roll" data-id="${c.id}" data-attr="${sk.attr}" data-skill="${sk.key}" data-weapon="${idx}">🎲 ${sk.label}</button>` : ''}
      </div>
      <dl class="kv">
        <dt>Modifier</dt><dd>${w.modifier > 0 ? '+' : ''}${esc(w.modifier)}</dd>
        <dt>Damage</dt><dd>${esc(w.damage) || '—'}</dd>
        <dt>Range</dt><dd>${esc(w.range) || '—'}</dd>
        <dt>Ammo</dt><dd>${esc(w.ammo) || '—'}</dd>
        <dt>Weight</dt><dd>${esc(w.weight) || '—'}</dd>
      </dl>
    </div>`;
  }).join('');
}

function gearListHtml(c) {
  const gear = c.gear.filter((g) => g.name.trim());
  return gear.length
    ? `<ul class="gear">${gear.map((g) => `<li><span>${esc(g.name)}</span><small>${g.airPower ? `Air/Power ${esc(g.airPower)}` : ''}${g.weight ? ` · ${esc(g.weight)}` : ''}</small></li>`).join('')}</ul>`
    : '<p class="hint">Kein Gear eingetragen.</p>';
}

const armorText = (c) => `${esc(c.armor.name) || '—'}${c.armor.level !== '' ? ` · Armor Level ${esc(c.armor.level)}` : ''}${c.armor.weight !== '' ? ` · Weight ${esc(c.armor.weight)}` : ''}`;

function sheetHead(c) {
  return `<div class="sheet-head">
      <div>
        <h2>${esc(c.name || 'Ohne Namen')} ${typeBadge(c)}</h2>
        <div class="li-sub">${esc(c.career || '')}</div>
      </div>
      <a class="btn btn-small" href="#/edit/${c.id}">Bearbeiten</a>
    </div>`;
}

function npcSheet(c) {
  const id = c.id;
  const profile = NPC_FIELDS.map((f) => `<dt>${f.label}</dt><dd>${nl2br(c.npc[f.key]) || '—'}</dd>`).join('');
  return `
    ${sheetHead(c)}
    <div class="card status">
      <div class="status-grid">
        ${stepper(id, 'health', c.health.current, 'Health', `<small>/${c.health.max}</small>`)}
        <div class="stepper static"><span class="stepper-label">Armor Level</span><span class="stepper-value">${esc(c.armor.level) || '—'}</span></div>
      </div>
      <div class="chips">${activeResponseChips(c)}</div>
    </div>
    ${section('npc-skills', 'Attributes & Skills', `<p class="hint">Tippe auf ein Attribute oder einen Skill, um zu würfeln (NPCs: keine Stress Dice, kein Push).</p><div class="attrs">${attributesHtml(c)}</div>`, { open: true })}
    ${section('npc-profile', 'Persönlichkeit', `<dl class="kv kv-stack">${profile}</dl>`, { open: true })}
    ${section('npc-talents', 'Talents', `<p>${nl2br(c.talents) || '—'}</p>`)}
    ${section('npc-gear', 'Armor, Weapons & Gear', `
      <dl class="kv"><dt>Armor</dt><dd>${armorText(c)}</dd></dl>
      <h4>Weapons</h4>${weaponsHtml(c)}
      <h4>Gear</h4>${gearListHtml(c)}`)}
    ${section('notes', 'Notizen',
      `<textarea class="inline" rows="5" data-inline="notes" data-id="${id}" placeholder="Notizen …">${esc(c.notes)}</textarea>`)}
  `;
}

function sheetView(id) {
  const c = store.get(id);
  if (!c) return notFound();
  if (c.type === 'NPC') return npcSheet(c);

  const status = `
    <div class="card status">
      <div class="status-head"><span class="label">Stress Level</span>
        <span class="stepper compact">
          <button class="btn-round" data-act="stat" data-id="${id}" data-field="stress" data-d="-1" aria-label="Stress verringern">−</button>
          <span class="stepper-value big">${c.stress}</span>
          <button class="btn-round" data-act="stat" data-id="${id}" data-field="stress" data-d="1" aria-label="Stress erhöhen">+</button>
        </span>
      </div>
      ${stressBoxes(c)}
      <div class="status-grid">
        ${stepper(id, 'health', c.health.current, 'Health', `<small>/${c.health.max}</small>`)}
        ${stepper(id, 'radiation', c.radiation, 'Radiation')}
        <div class="stepper static"><span class="stepper-label">Resolve</span><span class="stepper-value">${c.resolve}</span></div>
        <button class="toggle ${c.fatigued ? 'on' : ''}" data-act="toggle-fatigued" data-id="${id}">Fatigued</button>
      </div>
      <div class="chips">${activeResponseChips(c)}</div>
    </div>`;

  const respList = (group, list) => list.map((r) => `
    <label class="check">
      <input type="checkbox" data-act="toggle-response" data-id="${id}" data-group="${group}" data-key="${r.key}" ${c[group][r.key] ? 'checked' : ''}>
      <span><b>${r.label}</b>${r.effect ? `<small>${esc(r.effect)}</small>` : ''}</span>
    </label>`).join('');

  const weaponCount = c.weapons.filter((w) => w.name.trim()).length;
  const gearHtml = `
    <dl class="kv">
      <dt>Armor</dt><dd>${armorText(c)}</dd>
      <dt>Encumbrance</dt><dd>${encHtml(c)}</dd>
      <dt>Cash</dt><dd>${esc(c.cash) || '—'}</dd>
      <dt>Signature Item</dt><dd>${esc(c.signatureItem) || '—'}</dd>
      <dt>Tiny Items</dt><dd>${nl2br(c.tinyItems) || '—'}</dd>
    </dl>
    <h4>Gear</h4>
    ${gearListHtml(c)}`;

  const personal = `
    <dl class="kv">
      <dt>Appearance</dt><dd>${nl2br(c.appearance) || '—'}</dd>
      <dt>Personal Agenda</dt><dd>${nl2br(c.agenda) || '—'}</dd>
      <dt>Buddy</dt><dd>${esc(c.buddy) || '—'}</dd>
      <dt>Rival</dt><dd>${esc(c.rival) || '—'}</dd>
      <dt>Talents</dt><dd>${nl2br(c.talents) || '—'}</dd>
      <dt>Experience Points</dt><dd>${esc(c.xp)}</dd>
      <dt>Story Points</dt><dd>${esc(c.storyPoints)}</dd>
    </dl>`;

  const activeCount = STRESS_RESPONSES.filter((r) => c.responses[r.key]).length + PANIC_RESPONSES.filter((r) => c.panic[r.key]).length;

  return `
    ${sheetHead(c)}
    ${status}
    ${section('skills', 'Attributes & Skills', `${pointsHint(c)}<p class="hint">Tippe auf ein Attribute oder einen Skill, um zu würfeln.</p><div class="attrs">${attributesHtml(c)}</div>`, { open: true })}
    ${section('responses', 'Stress & Panic Responses',
      `<h4>Stress Responses</h4>${respList('responses', STRESS_RESPONSES)}<h4>Panic Responses</h4>${respList('panic', PANIC_RESPONSES)}`,
      { badge: activeCount || '' })}
    ${section('injuries', 'Critical Injuries & Mental Trauma',
      `<textarea class="inline" rows="4" data-inline="injuries" data-id="${id}" placeholder="Critical Injuries, Mental Trauma …">${esc(c.injuries)}</textarea>`)}
    ${section('weapons', 'Weapons', weaponsHtml(c), { badge: weaponCount || '' })}
    ${section('gear', 'Armor, Gear & Items', gearHtml)}
    ${section('personal', 'Personal Agenda & Talents', personal)}
    ${section('notes', 'Notizen',
      `<textarea class="inline" rows="5" data-inline="notes" data-id="${id}" placeholder="Notizen …">${esc(c.notes)}</textarea>`)}
  `;
}

function overviewView() {
  const list = store.sorted().filter((c) => ui.filter === 'all' || c.type === ui.filter);
  const filters = [['all', 'Alle'], ['PC', 'PCs'], ['NPC', 'NPCs']]
    .map(([v, l]) => `<button class="seg ${ui.filter === v ? 'active' : ''}" data-act="filter" data-v="${v}">${l}</button>`).join('');

  const healthCell = (c) => `<div class="ov-cell">
      <span class="stepper-label">Health</span>
      <span class="stepper compact">
        <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="health" data-d="-1" aria-label="Health verringern">−</button>
        <span class="stepper-value">${c.health.current}<small>/${c.health.max}</small></span>
        <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="health" data-d="1" aria-label="Health erhöhen">+</button>
      </span>
      <div class="meter health"><div style="width:${c.health.max ? clamp(c.health.current / c.health.max, 0, 1) * 100 : 0}%"></div></div>
    </div>`;

  const rows = list.map((c) => {
    const broken = c.health.current <= 0;
    const top = strongestRolls(c, 2).map((o) => `
      <button class="top-roll" data-act="roll" data-id="${c.id}" data-attr="${o.attr}" ${o.skill ? `data-skill="${o.skill}"` : ''}>
        <span>${o.label}</span><span class="dice-count">${o.dice}<i class="dicon"></i></span>
      </button>`).join('');
    const head = `<div class="ov-head">
        <a href="#/c/${c.id}" class="ov-name">${esc(c.name || 'Ohne Namen')}</a>${typeBadge(c)}
      </div>
      ${c.career ? `<div class="li-sub ov-career">${esc(c.career)}</div>` : ''}`;

    if (c.type === 'NPC') {
      return `
      <div class="card ov ${broken ? 'is-down' : ''}">
        ${head}
        <div class="ov-grid">
          ${healthCell(c)}
          <div class="ov-cell"><span class="stepper-label">Armor Level</span><span class="stepper-value">${esc(c.armor.level) || '—'}</span><small class="muted">${esc(c.armor.name)}</small></div>
        </div>
        <div class="top-rolls">${top}</div>
        ${c.npc.temperament ? `<p class="ov-temper"><b>Temperament:</b> ${esc(c.npc.temperament)}</p>` : ''}
        <div class="chips">${activeResponseChips(c)}</div>
      </div>`;
    }

    const anyPanic = PANIC_RESPONSES.some((r) => c.panic[r.key]);
    return `
    <div class="card ov ${broken ? 'is-down' : ''}">
      ${head}
      <div class="ov-grid">
        <div class="ov-cell">
          <span class="stepper-label">Stress</span>
          <span class="stepper compact">
            <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="stress" data-d="-1" aria-label="Stress verringern">−</button>
            <span class="stepper-value">${c.stress}</span>
            <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="stress" data-d="1" aria-label="Stress erhöhen">+</button>
          </span>
          <div class="meter"><div style="width:${c.stress * 10}%"></div></div>
          <div class="resp-btns">
            <button class="btn btn-tiny btn-stress" data-act="quick-stress" data-id="${c.id}" ${broken ? 'disabled' : ''}>Stress Response</button>
            <button class="btn btn-tiny btn-panic" data-act="quick-panic" data-id="${c.id}" ${broken ? 'disabled' : ''}>Panic Roll</button>
          </div>
        </div>
        ${healthCell(c)}
      </div>
      ${broken ? '<p class="hint">Broken: kein weiterer Stress, keine Panic Rolls.</p>' : ''}
      ${lastRollHtml(c)}
      <div class="top-rolls">${top}</div>
      <div class="ov-facts">
        <span>Resolve <b>${c.resolve}</b></span>
        <span>Armor Level <b>${esc(c.armor.level) || '—'}</b></span>
      </div>
      <div class="chips">${activeResponseChips(c)}${anyPanic ? `<button class="chip chip-btn" data-act="end-panic" data-id="${c.id}">Panic beenden</button>` : ''}</div>
    </div>`;
  }).join('');

  return `<div class="segments">${filters}</div>${rows || '<p class="empty">Keine Charaktere vorhanden.</p>'}`;
}

function editView(id, newType, draft = null) {
  const isNew = !id;
  const c = draft || (isNew ? store.newCharacter(newType) : store.get(id));
  if (!c) return notFound();
  const isPC = c.type === 'PC';

  const text = (name, label, value, attrs = '') => `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value)}" ${attrs}></label>`;
  const num = (name, label, value, min = 0, max = 99) => `<label class="field num"><span>${label}</span><input type="number" inputmode="numeric" name="${name}" value="${esc(value)}" min="${min}" max="${max}"></label>`;
  const derived = (key, name, label, value, max) => {
    const rule = DERIVED[key](c.attributes);
    const isAuto = c.auto[key];
    return `<label class="field num"><span>${label}</span>
      <input type="number" inputmode="numeric" name="${name}" value="${esc(value)}" min="0" max="${max}" data-derive="${key}" data-auto="${isAuto ? '1' : ''}">
      <small class="rule-hint ${isAuto ? 'is-auto' : ''}">Regel: <b class="rule-val">${rule}</b><span class="auto-tag"> · automatisch</span></small>
    </label>`;
  };
  const area = (name, label, value, rows = 3) => `<label class="field"><span>${label}</span><textarea name="${name}" rows="${rows}">${esc(value)}</textarea></label>`;

  const attrFields = ATTRIBUTES.map((a) => `
    <fieldset class="attr-edit">
      <legend>${a.label}</legend>
      ${num(`attributes.${a.key}`, 'Value', c.attributes[a.key], 1, 10)}
      ${skillsFor(a.key).map((s) => num(`skills.${s.key}`, s.label, c.skills[s.key], 0, 5)).join('')}
    </fieldset>`).join('');

  const weaponFields = c.weapons.map((w, i) => `
    <fieldset class="row-edit">
      <legend>Weapon ${i + 1}</legend>
      ${text(`weapons.${i}.name`, 'Name', w.name, `list="dl-weapons" data-autofill="weapon" data-row="${i}"`)}
      <label class="field"><span>Skill</span>
        <select name="weapons.${i}.skill">
          ${['closeCombat', 'rangedCombat', 'heavyMachinery'].map((k) => `<option value="${k}" ${w.skill === k ? 'selected' : ''}>${skillByKey(k).label}</option>`).join('')}
        </select>
      </label>
      <div class="field-row">
        ${num(`weapons.${i}.modifier`, 'Modifier', w.modifier, -10, 10)}
        ${text(`weapons.${i}.damage`, 'Damage', w.damage)}
      </div>
      <div class="field-row">
        ${text(`weapons.${i}.range`, 'Range', w.range)}
        ${text(`weapons.${i}.ammo`, 'Ammo', w.ammo)}
        ${text(`weapons.${i}.weight`, 'Weight', w.weight)}
      </div>
    </fieldset>`).join('');

  const gearFields = c.gear.map((g, i) => `
    <div class="field-row gear-edit">
      ${text(`gear.${i}.name`, `${i + 1}.`, g.name, `list="dl-gear" data-autofill="gear" data-row="${i}"`)}
      ${text(`gear.${i}.airPower`, 'Air/Power', g.airPower)}
      ${text(`gear.${i}.weight`, 'Weight', g.weight)}
    </div>`).join('');

  const armorFields = `
    ${text('armor.name', 'Armor', c.armor.name, 'list="dl-armor" data-autofill="armor"')}
    <div class="field-row">
      ${text('armor.level', 'Armor Level', c.armor.level, 'inputmode="numeric"')}
      ${text('armor.weight', 'Weight', c.armor.weight)}
    </div>`;

  const actions = `
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Speichern</button>
        <a class="btn" href="${isNew ? '#/' : `#/c/${c.id}`}">Abbrechen</a>
      </div>
      ${isNew ? '' : `<button type="button" class="btn btn-danger wide" data-act="delete" data-id="${c.id}">Charakter löschen</button>`}`;

  const head = `
      <h2>${isNew ? `Neuer ${c.type}` : `${esc(c.name || 'Charakter')} bearbeiten`}</h2>
      <div class="card form-sec">
        <label class="field"><span>Typ</span>
          <select name="type" data-retype>
            <option value="PC" ${isPC ? 'selected' : ''}>PC (Spielercharakter)</option>
            <option value="NPC" ${!isPC ? 'selected' : ''}>NPC</option>
          </select>
        </label>
        ${text('name', 'Name', c.name, 'required')}
        ${text('career', 'Career', c.career)}
      </div>
      <p class="hint">Tipp: Namen von Weapons, Armor und Gear werden aus der Equipment-Liste vorgeschlagen; die Werte füllen sich dann automatisch.</p>`;

  if (!isPC) {
    return `
    <form id="edit-form" data-id="${isNew ? '' : c.id}" data-type="NPC" autocomplete="off">
      ${equipmentDatalists()}
      ${head}
      <div class="card form-sec"><h3>Attributes & Skills</h3>${attrFields}</div>
      <div class="card form-sec">
        <h3>Health</h3>
        <div class="field-row">
          ${num('health.current', 'Health', c.health.current, 0, 20)}
          ${derived('health', 'health.max', 'Max Health', c.health.max, 20)}
        </div>
      </div>
      <div class="card form-sec"><h3>Persönlichkeit</h3>
        ${NPC_FIELDS.map((f) => area(`npc.${f.key}`, f.label, c.npc[f.key], 2)).join('')}
      </div>
      <div class="card form-sec"><h3>Talents</h3>${area('talents', 'Talents', c.talents, 3)}</div>
      <div class="card form-sec"><h3>Armor & Gear</h3>${armorFields}<h4>Gear</h4>${gearFields}</div>
      <div class="card form-sec"><h3>Weapons</h3>${weaponFields}</div>
      <div class="card form-sec">${area('notes', 'Notizen', c.notes, 4)}</div>
      ${actions}
    </form>`;
  }

  return `
    <form id="edit-form" data-id="${isNew ? '' : c.id}" data-type="PC" autocomplete="off">
      ${equipmentDatalists()}
      ${head}
      <div class="card form-sec"><h3>Attributes & Skills</h3><div id="points-live">${pointsHint(c)}</div>${attrFields}</div>

      <div class="card form-sec">
        <h3>Health & Stress</h3>
        <div class="field-row">
          ${num('health.current', 'Health', c.health.current, 0, 20)}
          ${derived('health', 'health.max', 'Max Health', c.health.max, 20)}
        </div>
        <p class="hint">Max Health = (Strength + Agility) ÷ 2, Resolve = (Wits + Empathy) ÷ 2, jeweils aufgerundet. Max Encumbrance = Strength × 2. Die Werte passen sich automatisch an, solange du sie nicht von Hand änderst.</p>
        <div class="field-row">
          ${num('stress', 'Stress Level', c.stress, 0, MAX_STRESS)}
          ${derived('resolve', 'resolve', 'Resolve', c.resolve, 20)}
          ${num('radiation', 'Radiation', c.radiation, 0, 99)}
        </div>
        <label class="check"><input type="checkbox" name="fatigued" ${c.fatigued ? 'checked' : ''}><span><b>Fatigued</b></span></label>
        <div class="field-row">
          ${num('xp', 'Experience Points', c.xp, 0, 999)}
          ${num('storyPoints', 'Story Points', c.storyPoints, 0, 99)}
        </div>
      </div>

      <div class="card form-sec">
        <h3>Personal Agenda & Talents</h3>
        ${area('appearance', 'Appearance', c.appearance)}
        ${area('agenda', 'Personal Agenda', c.agenda)}
        ${text('buddy', 'Buddy', c.buddy)}
        ${text('rival', 'Rival', c.rival)}
        ${area('talents', 'Talents', c.talents, 4)}
      </div>

      <div class="card form-sec">
        <h3>Armor & Gear</h3>
        ${armorFields}
        <div class="field-row">
          <div class="field"><span>Encumbrance</span><div id="enc-live" class="enc-box">${encHtml(c)}</div></div>
          ${derived('encMax', 'encumbrance.max', 'Max Encumbrance', c.encumbrance.max, 99)}
          ${text('cash', 'Cash', c.cash)}
        </div>
        <p class="hint">Encumbrance wird aus den Weight-Werten von Gear, Weapons und Armor berechnet (z. B. 1, 2, ½ oder 0,5).</p>
        ${text('signatureItem', 'Signature Item', c.signatureItem)}
        ${area('tinyItems', 'Tiny Items', c.tinyItems)}
        <h4>Gear</h4>
        ${gearFields}
      </div>

      <div class="card form-sec"><h3>Weapons</h3>${weaponFields}</div>

      <div class="card form-sec">
        ${area('injuries', 'Critical Injuries & Mental Trauma', c.injuries, 3)}
        ${area('notes', 'Notizen', c.notes, 4)}
      </div>
      ${actions}
    </form>`;
}

function dataView() {
  const n = store.all().length;
  return `
    <h2>Daten & Backup</h2>
    <div class="card form-sec">
      <p>Alle Charaktere (${n}), Orte und eigene Equipment-Änderungen liegen nur lokal auf diesem Gerät im Browser-Speicher. Mach regelmäßig ein Backup, vor allem bevor du Browserdaten löschst.</p>
      <button class="btn btn-primary wide" data-act="export">Backup exportieren (Datei)</button>
      <button class="btn wide" data-act="copy-backup">Backup als Text kopieren</button>
      <textarea id="backup-text" rows="4" readonly hidden></textarea>
      <label class="btn wide file-btn">Backup importieren (Datei)
        <input type="file" accept="application/json,.json,text/plain,.txt" data-act="import" hidden>
      </label>
      <details class="paste-import">
        <summary>Backup aus kopiertem Text importieren</summary>
        <textarea id="paste-backup" rows="4" placeholder="Backup-Text hier einfügen …"></textarea>
        <button class="btn wide" data-act="paste-import">Text importieren</button>
      </details>
      <p class="hint">Beim Import werden Einträge mit gleicher ID überschrieben, neue kommen dazu. Nichts wird gelöscht.</p>
    </div>
    <div class="card form-sec">
      <h3>Punkteprüfung</h3>
      <p class="hint">Zeigt auf dem Charakterbogen von PCs einen Hinweis, wenn zu wenige oder zu viele Punkte auf Attribute bzw. Skills verteilt sind. Nach Steigerungen durch Erfahrung am besten ausschalten.</p>
      <label class="check"><input type="checkbox" data-setting="checkPoints" ${settings().checkPoints ? 'checked' : ''}><span><b>Punkteprüfung aktiv</b></span></label>
      <div class="field-row">
        <label class="field num"><span>Attribute Points</span><input type="number" inputmode="numeric" min="0" max="40" data-setting="attrPoints" value="${settings().attrPoints}"></label>
        <label class="field num"><span>Skill Points</span><input type="number" inputmode="numeric" min="0" max="60" data-setting="skillPoints" value="${settings().skillPoints}"></label>
      </div>
    </div>`;
}

function rulesView() {
  const cats = RULES.map((cat) => section(`rules-${cat.key}`, cat.title, cat.topics.map((t) => `
    <details class="rule-topic">
      <summary>${t.title}</summary>
      <div class="rule-body">${t.html}</div>
    </details>`).join(''), { badge: cat.topics.length })).join('');
  return `
    <input id="rule-search" type="search" placeholder="Regeln durchsuchen …" autocomplete="off">
    <div id="rules">${cats}</div>
    <p class="hint">Zusammenfassung der ALIEN RPG Evolved Edition. Im Zweifel gilt das Regelbuch.</p>`;
}

let searching = false;
function filterRules(q) {
  const term = q.trim().toLowerCase();
  searching = true;
  for (const cat of document.querySelectorAll('#rules > details')) {
    let hits = 0;
    for (const topic of cat.querySelectorAll('.rule-topic')) {
      const match = !term || topic.textContent.toLowerCase().includes(term);
      topic.hidden = !match;
      topic.open = !!term && match;
      if (match) hits++;
    }
    cat.hidden = hits === 0;
    cat.open = term ? hits > 0 : (ui.open[cat.dataset.sec] ?? false);
  }
  setTimeout(() => { searching = false; });
}

const notFound = () => '<p class="empty">Charakter nicht gefunden. <a href="#/">Zur Liste</a></p>';

// ---------- Router ----------

export function render() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
  const [view, arg] = parts;
  let html;
  let tab = 'list';
  let title = 'Crew';
  let back = null;

  switch (view) {
    case 'c': html = sheetView(arg); title = 'Charakterbogen'; back = '#/'; break;
    case 'edit': html = editView(arg); title = 'Bearbeiten'; back = `#/c/${arg}`; break;
    case 'new': html = editView(null, arg === 'NPC' ? 'NPC' : 'PC'); title = 'Neuer Charakter'; back = '#/'; break;
    case 'overview': html = overviewView(); tab = 'overview'; title = 'Übersicht'; break;
    case 'data': html = dataView(); tab = 'data'; title = 'Daten'; back = '#/'; break;
    case 'rules': html = rulesView(); tab = 'rules'; title = 'Regeln'; break;
    case 'equipment': html = equipmentView(); tab = 'equipment'; title = 'Equipment'; break;
    case 'item': html = itemEditView(arg); tab = 'equipment'; title = 'Item bearbeiten'; back = '#/equipment'; break;
    case 'xenos': html = xenosView(); tab = 'xenos'; title = 'Xenos'; break;
    case 'xeno': html = xenoView(arg); tab = 'xenos'; title = 'Xeno'; back = '#/xenos'; break;
    case 'xeno-edit': html = xenoEditView(arg); tab = 'xenos'; title = 'Xeno bearbeiten'; back = `#/xeno/${arg}`; break;
    case 'combat': html = combatView(); tab = 'combat'; title = 'Combat'; break;
    case 'locations': html = locationsView(); tab = 'locations'; title = 'Orte'; break;
    case 'loc': html = locationView(arg); tab = 'locations'; title = 'Ort'; back = '#/locations'; break;
    case 'loc-edit': html = locationEditView(arg); tab = 'locations'; title = 'Ort bearbeiten'; back = arg === 'new' ? '#/locations' : `#/loc/${arg}`; break;
    default: html = listView();
  }

  $main.innerHTML = html;
  document.getElementById('title').textContent = title;
  const $back = document.getElementById('back');
  $back.hidden = !back;
  if (back) $back.href = back;
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
}

// ---------- Aktionen ----------

function changeStat(id, field, d) {
  store.update(id, (c) => {
    if (field === 'stress') c.stress = clamp(c.stress + d, 0, MAX_STRESS);
    if (field === 'health') c.health.current = clamp(c.health.current + d, 0, Math.max(c.health.max, 0));
    if (field === 'radiation') c.radiation = Math.max(0, c.radiation + d);
  });
  render();
}

// Ergebnis einer Stress Response als Eintrag für die Übersicht.
export function stressRecord(r) {
  return {
    kind: 'stress', die: r.die, stress: r.stress, resolve: r.resolve, total: r.total,
    label: r.response.label,
    effect: r.response.effect,
    note: r.note !== r.response.effect ? r.note : '',
    duration: STRESS_DURATION[r.response.key] || STRESS_DURATION.default,
    at: Date.now(),
  };
}

function quickStress(id) {
  store.update(id, (c) => {
    const r = resolveStressResponse(c);
    c.responses = r.responses;
    c.stress = clamp(c.stress + r.stressDelta, 0, MAX_STRESS);
    c.lastRoll = stressRecord(r);
  });
  navigator.vibrate?.([80, 60, 80]);
  render();
}

function quickPanic(id) {
  store.update(id, (c) => {
    const r = resolvePanic(c);
    c.panic = r.panic;
    c.stress = clamp(c.stress + r.stressDelta, 0, MAX_STRESS);
    const notes = [];
    if (r.bumped) notes.push('Das Ergebnis war bereits aktiv, deshalb die nächsthöhere Response.');
    if (r.response.track) notes.push(PANIC_ENDS);
    if (r.trauma) notes.push('Panic Roll 9+: Nach der Sitzung Empathy-Wurf (kein Push) gegen Mental Trauma.');
    c.lastRoll = {
      kind: 'panic', die: r.die, stress: r.stress, resolve: r.resolve, total: r.total,
      label: r.response.label, effect: r.response.effect, duration: r.response.duration,
      note: notes.join(' '), at: Date.now(),
    };
  });
  navigator.vibrate?.([120, 60, 120]);
  render();
}

function readForm(form) {
  const id = form.dataset.id;
  const c = id && store.get(id) ? structuredClone(store.get(id)) : store.newCharacter(form.dataset.type);
  if (id) c.id = id;
  for (const el of form.elements) {
    if (!el.name) continue;
    const path = el.name.split('.');
    let target = c;
    for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
    const key = path[path.length - 1];
    if (el.dataset.derive) c.auto[el.dataset.derive] = el.dataset.auto === '1';
    if (el.type === 'checkbox') target[key] = el.checked;
    else if (el.type === 'number') target[key] = el.value === '' ? 0 : Number(el.value);
    else target[key] = el.value;
  }
  c.hasStress = c.type === 'PC';
  c.stress = c.hasStress ? clamp(c.stress, 0, MAX_STRESS) : 0;
  c.health.current = clamp(c.health.current, 0, Math.max(c.health.max, 0));
  return c;
}

// Backup sichern. Android teilt keine .json-Dateien, deshalb als .txt teilen
// (Inhalt bleibt JSON). Klappt das nicht, normaler Download mit sichtbarer Rückmeldung.
async function download(filename, text) {
  const txtName = filename.replace(/\.json$/, '.txt');
  const candidates = [
    new File([text], filename, { type: 'application/json' }),
    new File([text], txtName, { type: 'text/plain' }),
  ];
  const file = candidates.find((f) => navigator.canShare?.({ files: [f] }));
  if (file) {
    try {
      await navigator.share({ files: [file], title: file.name });
      toast('Backup geteilt');
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return; // Teilen-Menü bewusst geschlossen
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  toast('Backup gespeichert – siehe Ordner „Downloads“');
}

// Fallback, der immer geht: Backup als Text in die Zwischenablage.
async function copyBackup() {
  const text = store.exportJson();
  try {
    await navigator.clipboard.writeText(text);
    toast('Backup kopiert – z. B. in eine Notiz oder Mail einfügen');
  } catch {
    const box = document.getElementById('backup-text');
    box.value = text;
    box.hidden = false;
    box.select();
    toast('Text markiert – bitte manuell kopieren');
  }
}

function runImport(text) {
  try {
    const { added, updated, locs } = store.importJson(text);
    toast(`Import: ${added} neu, ${updated} aktualisiert${locs ? `, ${locs} Orte` : ''}`);
    render();
  } catch (err) {
    alert(`Import fehlgeschlagen: ${err.message}`);
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const { act, id } = el.dataset;
  if (act.startsWith('dlg-')) return handleRollAction(act, el);
  if (el.tagName === 'INPUT') return; // Checkboxen/Dateien laufen über 'change'
  if (act.startsWith('xeno-') && xenoAction(act, el)) return;
  if (act.startsWith('cb-') && combatAction(act)) return;

  switch (act) {
    case 'filter':
      ui.filter = el.dataset.v;
      saveUi();
      render();
      break;
    case 'stat':
      changeStat(id, el.dataset.field, Number(el.dataset.d));
      break;
    case 'stress-set': {
      const v = Number(el.dataset.v);
      store.update(id, (c) => { c.stress = c.stress === v ? v - 1 : v; });
      render();
      break;
    }
    case 'quick-stress':
      quickStress(id);
      break;
    case 'quick-panic':
      quickPanic(id);
      break;
    case 'clear-last':
      store.update(id, (c) => { c.lastRoll = null; });
      render();
      break;
    case 'end-panic':
      store.update(id, (c) => { PANIC_RESPONSES.forEach((r) => { c.panic[r.key] = false; }); });
      toast('Panic beendet');
      render();
      break;
    case 'toggle-fatigued':
      store.update(id, (c) => { c.fatigued = !c.fatigued; });
      render();
      break;
    case 'roll':
      openRoll({
        id,
        attr: el.dataset.attr,
        skill: el.dataset.skill || null,
        weapon: el.dataset.weapon !== undefined ? Number(el.dataset.weapon) : null,
      });
      break;
    case 'delete': {
      const c = store.get(id);
      if (c && confirm(`„${c.name || 'Ohne Namen'}“ wirklich löschen?`)) {
        store.remove(id);
        location.hash = '#/';
        toast('Charakter gelöscht');
      }
      break;
    }
    case 'eq-random':
      randomPick(el.dataset.cat);
      break;
    case 'eq-assign':
      openAssign(el.dataset.item);
      break;
    case 'eq-assign-to':
      assignItem(id, el.dataset.item);
      break;
    case 'pick-close':
      closePick();
      break;
    case 'eq-reset':
      resetItem(el.dataset.item);
      break;
    case 'loc-delete':
      deleteLocation(id);
      break;
    case 'export':
      download(`alien-rpg-backup-${new Date().toISOString().slice(0, 10)}.json`, store.exportJson());
      break;
    case 'copy-backup':
      copyBackup();
      break;
    case 'paste-import': {
      const text = document.getElementById('paste-backup').value.trim();
      if (text) runImport(text);
      else toast('Erst Backup-Text einfügen');
      break;
    }
    default:
  }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.act === 'toggle-response') {
    store.update(el.dataset.id, (c) => { c[el.dataset.group][el.dataset.key] = el.checked; });
    render();
  } else if (el.dataset.init) {
    const nums = store.parseInitiative(el.value);
    const value = el.dataset.init === 'xeno' ? nums.join(', ') : String(nums[0] ?? '');
    if (el.dataset.init === 'xeno') store.updateXeno(el.dataset.id, (x) => { x.initiative = value; });
    else store.update(el.dataset.id, (c) => { c.initiative = value; });
    el.value = value;
    toast(value ? `Initiative ${value}: im Combat` : 'Aus dem Combat entfernt');
    if (location.hash.startsWith('#/combat')) render();
  } else if (el.id === 'xeno-add') {
    addXeno(el.value);
  } else if (el.dataset.inlineXeno) {
    store.updateXeno(el.dataset.id, (x) => { x[el.dataset.inlineXeno] = el.value; });
    toast('Gespeichert');
  } else if (el.dataset.setting) {
    const k = el.dataset.setting;
    ui[k] = el.type === 'checkbox' ? el.checked : Math.max(0, Number(el.value) || 0);
    saveUi();
    toast('Gespeichert');
  } else if (el.dataset.inline) {
    store.update(el.dataset.id, (c) => { c[el.dataset.inline] = el.value; });
    toast('Gespeichert');
  } else if (el.dataset.act === 'import' && el.files?.[0]) {
    runImport(await el.files[0].text());
  }
});

// Formular live nachrechnen: Regelwerte, Encumbrance, Punkte-Hinweis.
function refreshForm(form, target) {
  const input = (name) => form.elements.namedItem(name);
  if (target?.name === 'type') {
    // Formular für den anderen Typ neu aufbauen, Eingaben bleiben erhalten.
    const draft = readForm(form);
    draft.type = target.value;
    $main.innerHTML = editView(form.dataset.id || null, draft.type, draft);
    return;
  }

  const attrs = Object.fromEntries(ATTRIBUTES.map((a) => [a.key, Number(input(`attributes.${a.key}`).value) || 0]));
  for (const el of form.querySelectorAll('[data-derive]')) {
    const rule = DERIVED[el.dataset.derive](attrs);
    if (el === target) {
      el.dataset.auto = Number(el.value) === rule ? '1' : '';
    } else if (el.dataset.auto === '1' && Number(el.value) !== rule) {
      if (el.name === 'health.max') {
        const cur = input('health.current');
        if (Number(cur.value) === Number(el.value) || Number(cur.value) > rule) cur.value = rule;
      }
      el.value = rule;
    }
    const hint = el.parentElement.querySelector('.rule-hint');
    hint.querySelector('.rule-val').textContent = rule;
    hint.classList.toggle('is-auto', el.dataset.auto === '1');
  }

  const c = readForm(form);
  const enc = form.querySelector('#enc-live');
  if (enc) enc.innerHTML = encHtml(c);
  const pts = form.querySelector('#points-live');
  if (pts) pts.innerHTML = pointsHint(c);
}

// Namen aus der Equipment-Liste: passende Werte automatisch eintragen.
function autofill(form, el) {
  const kind = el.dataset.autofill;
  const it = store.findItem(el.value, kind === 'weapon' ? ['weapon'] : kind === 'armor' ? ['armor'] : null);
  if (!it) return false;
  const set = (name, v) => { const f = form.elements.namedItem(name); if (f) f.value = v; };
  const i = el.dataset.row;
  const vals = kind === 'weapon' ? fillWeapon(it) : kind === 'armor' ? fillArmor(it) : fillGear(it);
  const prefix = kind === 'weapon' ? `weapons.${i}.` : kind === 'armor' ? 'armor.' : `gear.${i}.`;
  for (const [k, v] of Object.entries(vals)) set(prefix + k, v);
  toast(`${it.name}: Werte übernommen`);
  return true;
}

document.addEventListener('input', (e) => {
  const form = e.target.closest('#edit-form');
  if (form) {
    if (e.target.dataset.autofill && e.target.value) autofill(form, e.target);
    refreshForm(form, e.target);
  }
  if (e.target.id === 'rule-search') filterRules(e.target.value);
  if (e.target.id === 'eq-search') filterEquipment(e.target.value);
  if (e.target.id === 'loc-search') filterLocations(e.target.value);
});

document.addEventListener('submit', (e) => {
  if (e.target.id === 'item-form') { e.preventDefault(); saveItemForm(e.target); return; }
  if (e.target.id === 'loc-form') { e.preventDefault(); saveLocationForm(e.target); return; }
  if (e.target.id === 'xeno-form') { e.preventDefault(); saveXenoForm(e.target); return; }
  if (e.target.id !== 'edit-form') return;
  e.preventDefault();
  const c = store.save(readForm(e.target));
  toast('Gespeichert');
  location.hash = `#/c/${c.id}`;
});

// Auf/Zu-Zustand der Abschnitte merken (toggle-Events blubbern nicht, daher capture).
document.addEventListener('toggle', (e) => {
  const key = e.target.dataset?.sec;
  if (!key || searching) return;
  ui.open[key] = e.target.open;
  saveUi();
}, true);

window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
});

render();
navigator.storage?.persist?.().catch(() => {});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

