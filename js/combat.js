// Combat-Reiter: alle Beteiligten nach Initiative sortiert, mit Health und Kampfwürfen.
import { typeByKey } from './data/xenos.js';
import { responsePenalties } from './rules.js';
import * as store from './store.js';
import { esc, render, ui, saveUi, toast } from './app.js';
import { healthStepper, initInput, attackBlock } from './xenoview.js';

const COMBAT_SKILLS = [
  { skill: 'closeCombat', attr: 'strength', label: 'Close Combat' },
  { skill: 'rangedCombat', attr: 'agility', label: 'Ranged Combat' },
  { skill: 'mobility', attr: 'agility', label: 'Mobility' },
];

// Alle Einträge: Charaktere einmal pro Zahl, Xenos einmal pro Initiative-Karte.
export function combatants() {
  const list = [];
  for (const c of store.all()) {
    const n = store.parseInitiative(c.initiative)[0];
    if (n) list.push({ kind: 'char', id: c.id, init: n, key: `char:${c.id}:${n}` });
  }
  for (const x of store.xenos()) {
    for (const n of store.parseInitiative(x.initiative)) list.push({ kind: 'xeno', id: x.id, init: n, key: `xeno:${x.id}:${n}` });
  }
  return list.sort((a, b) => a.init - b.init);
}

function charRow(e, active) {
  const c = store.get(e.id);
  const rolls = COMBAT_SKILLS.map((s) => {
    const pen = responsePenalties(c.responses, s.attr).reduce((sum, p) => sum + p.value, 0);
    const dice = Math.max(1, c.attributes[s.attr] + (c.skills[s.skill] || 0) + pen);
    return `<button class="top-roll" data-act="roll" data-id="${c.id}" data-attr="${s.attr}" data-skill="${s.skill}"><span>${s.label}</span><span class="dice-count">${dice}<i class="dicon"></i></span></button>`;
  }).join('');
  return `<div class="card cb-row ${active ? 'active' : ''} ${c.health.current <= 0 ? 'is-down' : ''}" data-key="${e.key}">
    <div class="cb-head">
      <span class="cb-init">${e.init}</span>
      <a class="cb-name" href="#/c/${c.id}">${esc(c.name || 'Ohne Namen')}</a>
      <span class="type type-${c.type.toLowerCase()}">${c.type}</span>
      ${initInput('char', c.id, c.initiative)}
    </div>
    <div class="cb-stats">
      <span class="stepper-label">Health</span>
      <span class="stepper compact xs">
        <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="health" data-d="-1" aria-label="Health verringern">−</button>
        <span class="stepper-value">${c.health.current}<small>/${c.health.max}</small></span>
        <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="health" data-d="1" aria-label="Health erhöhen">+</button>
      </span>
      ${c.hasStress ? `<span class="stepper-label">Stress</span>
      <span class="stepper compact xs">
        <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="stress" data-d="-1" aria-label="Stress verringern">−</button>
        <span class="stepper-value">${c.stress}</span>
        <button class="btn-round" data-act="stat" data-id="${c.id}" data-field="stress" data-d="1" aria-label="Stress erhöhen">+</button>
      </span>` : ''}
    </div>
    <div class="cb-rolls">${rolls}</div>
  </div>`;
}

function xenoRow(e, active) {
  const x = store.getXeno(e.id);
  const t = typeByKey(x.typeKey);
  const mob = parseInt(x.stats.mobility, 10) || 0;
  return `<div class="card cb-row xeno ${active ? 'active' : ''} ${x.healthCurrent <= 0 ? 'is-down' : ''}" data-key="${e.key}">
    <div class="cb-head">
      <span class="cb-init">${e.init}</span>
      <a class="cb-name" href="#/xeno/${x.id}">${esc(x.name)}</a>
      <span class="type type-xeno">Stage ${t.stage}</span>
      ${initInput('xeno', x.id, x.initiative)}
    </div>
    <div class="cb-stats">
      <span class="stepper-label">Health</span>${healthStepper(x, true)}
      <span class="cb-fact">Armor <b>${esc(x.stats.armor)}</b></span>
    </div>
    ${mob ? `<div class="cb-rolls"><button class="top-roll" data-act="xeno-dice" data-id="${x.id}" data-n="${mob}" data-label="Mobility"><span>Mobility</span><span class="dice-count">${mob}<i class="dicon"></i></span></button></div>` : ''}
    ${t.attacks ? attackBlock(x) : ''}
  </div>`;
}

export function combatView() {
  const list = combatants();
  if (!list.length) {
    return `<p class="empty">Noch niemand im Kampf.<br>Trage in der Crew- oder Xeno-Liste rechts eine Initiative-Zahl ein.</p>`;
  }
  const activeKey = list.some((e) => e.key === ui.combatTurn) ? ui.combatTurn : null;
  const rows = list.map((e) => (e.kind === 'char' ? charRow(e, e.key === activeKey) : xenoRow(e, e.key === activeKey))).join('');
  return `
    <div class="cb-bar">
      <button class="btn btn-primary" data-act="cb-next">${activeKey ? 'Nächster ▶' : 'Kampf starten ▶'}</button>
      <button class="btn" data-act="cb-end">Kampf beenden</button>
    </div>
    ${ui.combatRound ? `<p class="hint">Round ${ui.combatRound}</p>` : ''}
    ${rows}
    <p class="hint">Niedrigste Initiative handelt zuerst. Ein Tipp auf den Namen öffnet das vollständige Blatt.</p>`;
}

export function combatAction(act) {
  if (act === 'cb-next') {
    const list = combatants();
    if (!list.length) return true;
    const i = list.findIndex((e) => e.key === ui.combatTurn);
    if (i < 0 || i === list.length - 1) {
      ui.combatRound = i < 0 ? 1 : (ui.combatRound || 1) + 1;
      ui.combatTurn = list[0].key;
      if (i >= 0) toast(`Round ${ui.combatRound}`);
    } else {
      ui.combatTurn = list[i + 1].key;
    }
    saveUi();
    render();
    document.querySelector('.cb-row.active')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }
  if (act === 'cb-end') {
    if (!confirm('Kampf beenden und alle Initiative-Zahlen löschen?')) return true;
    store.clearInitiative();
    ui.combatTurn = null;
    ui.combatRound = 0;
    saveUi();
    render();
    return true;
  }
  return false;
}
