// Xenos-Reiter: Liste, Detailseite mit Stats, Angriffstabelle und Beschreibung, Bearbeiten.
import { XENO_TYPES, ATTACKS, typeByKey, rollAttack } from './data/xenos.js';
import * as store from './store.js';
import { esc, nl2br, section, toast, render } from './app.js';

const STAGES = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const STAT_LABELS = [
  ['speed', 'Speed'], ['health', 'Health'], ['mobility', 'Mobility'],
  ['observation', 'Observation'], ['armor', 'Armor Level'], ['acid', 'Acid Splash'],
];

const diceOf = (v) => parseInt(v, 10) || 0;

export function healthStepper(x, compact = false) {
  return `<span class="stepper compact ${compact ? 'xs' : ''}">
    <button class="btn-round" data-act="xeno-health" data-id="${x.id}" data-d="-1" aria-label="Health verringern">−</button>
    <span class="stepper-value">${x.healthCurrent}<small>/${esc(x.stats.health)}</small></span>
    <button class="btn-round" data-act="xeno-health" data-id="${x.id}" data-d="1" aria-label="Health erhöhen">+</button>
  </span>`;
}

export const initInput = (kind, id, value, placeholder = 'Init') =>
  `<input class="init-input" data-init="${kind}" data-id="${id}" value="${esc(value)}" inputmode="numeric" placeholder="${placeholder}" aria-label="Initiative">`;

export function xenosView() {
  const list = store.xenos();
  const groups = STAGES.map((st) => {
    const rows = list.filter((x) => typeByKey(x.typeKey).stage === st);
    if (!rows.length) return '';
    return `<h3 class="stage-head">Stage ${st}</h3>${rows.map((x) => {
      const t = typeByKey(x.typeKey);
      return `<div class="card xeno-row ${x.healthCurrent <= 0 ? 'is-down' : ''}">
        <a class="xr-main" href="#/xeno/${x.id}">
          <span class="xr-name">${esc(x.name)}</span>
          ${x.name !== t.name ? `<span class="li-sub">${esc(t.name)}</span>` : ''}
        </a>
        ${healthStepper(x, true)}
        ${initInput('xeno', x.id, x.initiative)}
      </div>`;
    }).join('')}`;
  }).join('');
  return `
    ${groups}
    <div class="card form-sec">
      <label class="field"><span>Weiteren Xeno hinzufügen</span>
        <select id="xeno-add">
          <option value="">Typ wählen …</option>
          ${XENO_TYPES.map((t) => `<option value="${t.key}">Stage ${t.stage}: ${esc(t.name)}</option>`).join('')}
        </select>
      </label>
    </div>
    <p class="hint">Init: Initiative für den Combat-Reiter. Xenos mit Speed 2 oder mehr ziehen mehrere Karten, z. B. „3, 8“.</p>`;
}

function attackResultHtml(x) {
  const a = x.lastAttack;
  if (!a) return '';
  const t = typeByKey(x.typeKey);
  const row = ATTACKS[t.attacks]?.rows.find((r) => r.name === a.name);
  if (!row) return '';
  const sub = row.sub?.find((s) => a.subRoll >= s.min && a.subRoll <= s.max);
  return `<div class="attack-result">
    <div class="lr-head"><span class="lr-kind">Signature Attack · D6 = ${a.roll}</span>
      <button class="icon-btn small" data-act="xeno-clear-attack" data-id="${x.id}" aria-label="Ergebnis ausblenden">✕</button></div>
    <div class="resp-name">${esc(row.name)}</div>
    <p>${esc(row.text)}</p>
    ${sub ? `<p class="sub-roll"><b>Zweiter D6 = ${a.subRoll}:</b> ${esc(sub.text)}</p>` : ''}
    ${row.dice ? `<button class="btn btn-danger wide" data-act="xeno-dice" data-id="${x.id}" data-n="${row.dice}" data-label="${esc(row.name)}${row.damage ? ` (Damage ${esc(row.damage)})` : ''}">🎲 Angriff würfeln: ${row.dice} Base Dice</button>` : ''}
  </div>`;
}

export function attackBlock(x) {
  const t = typeByKey(x.typeKey);
  const table = ATTACKS[t.attacks];
  if (!table) return '<p class="hint">Keine Signature-Attack-Tabelle für diesen Typ.</p>';
  const rows = table.rows.map((r) => `
    <tr><td class="n">${r.min === r.max ? r.min : r.max >= 99 ? `${r.min}+` : `${r.min}–${r.max}`}</td>
    <td><b>${esc(r.name)}</b>: ${esc(r.text)}
      ${r.sub ? `<table class="rt sub">${r.sub.map((s) => `<tr><td class="n">${s.min}–${s.max}</td><td>${esc(s.text)}</td></tr>`).join('')}</table>` : ''}
    </td></tr>`).join('');
  return `
    <div class="attack-bar">
      <details class="card sec attack-table">
        <summary><span>${esc(table.title)}</span></summary>
        <div class="sec-body"><table class="rt">${rows}</table></div>
      </details>
      <button class="btn btn-danger attack-roll" data-act="xeno-attack" data-id="${x.id}" aria-label="Zufälligen Angriff würfeln">🎲</button>
    </div>
    ${attackResultHtml(x)}`;
}

export function xenoView(id) {
  const x = store.getXeno(id);
  if (!x) return '<p class="empty">Xeno nicht gefunden. <a href="#/xenos">Zu den Xenos</a></p>';
  const t = typeByKey(x.typeKey);
  const stat = ([k, label]) => {
    if (k === 'health') return `<div class="xstat xstat-health"><span class="stepper-label">Health</span>${healthStepper(x)}</div>`;
    const v = x.stats[k];
    const rollable = (k === 'mobility' || k === 'observation') && diceOf(v) > 0;
    return rollable
      ? `<button class="xstat rollable" data-act="xeno-dice" data-id="${x.id}" data-n="${diceOf(v)}" data-label="${label}"><span class="stepper-label">${label}</span><span class="stepper-value">${esc(v)}</span><i class="dicon"></i></button>`
      : `<div class="xstat"><span class="stepper-label">${label}</span><span class="stepper-value">${esc(v)}</span></div>`;
  };
  return `
    <div class="sheet-head">
      <div>
        <h2>${esc(x.name)} <span class="type type-xeno">Stage ${t.stage}</span></h2>
        <div class="li-sub">${x.name !== t.name ? esc(t.name) : 'Xenomorph'}</div>
      </div>
      <div class="head-btns">
        <a class="btn btn-small" href="#/xeno-edit/${x.id}">Bearbeiten</a>
        <button class="btn btn-small" data-act="xeno-copy" data-id="${x.id}">Kopie</button>
      </div>
    </div>
    <div class="card xstats">${STAT_LABELS.map(stat).join('')}</div>
    <div class="init-line"><span class="stepper-label">Initiative</span>${initInput('xeno', x.id, x.initiative, 'z. B. 3, 8')}</div>
    ${attackBlock(x)}
    ${t.specials.length ? `<div class="card specials"><h3>Spezialregeln</h3><ul>${t.specials.map((s) => `<li>${s}</li>`).join('')}</ul></div>` : ''}
    ${section('xeno-desc', 'Beschreibung', t.summary, { open: true })}
    ${section('xeno-notes', 'Notizen', `<textarea class="inline" rows="4" data-inline-xeno="notes" data-id="${x.id}" placeholder="Notizen …">${esc(x.notes)}</textarea>`)}`;
}

export function xenoEditView(id) {
  const x = store.getXeno(id);
  if (!x) return '<p class="empty">Xeno nicht gefunden.</p>';
  const t = typeByKey(x.typeKey);
  return `
    <form id="xeno-form" data-id="${x.id}" autocomplete="off">
      <h2>${esc(x.name)} bearbeiten</h2>
      <div class="card form-sec">
        <label class="field"><span>Name</span><input name="name" value="${esc(x.name)}" required></label>
        <div class="field-row">
          ${STAT_LABELS.map(([k, label]) => `<label class="field"><span>${label}${k === 'health' ? ' (max)' : ''}</span><input name="stats.${k}" value="${esc(x.stats[k])}"></label>`).join('')}
        </div>
        <p class="hint">Regelbuch-Werte ${esc(t.name)}: ${STAT_LABELS.map(([k, l]) => `${l} ${esc(t.stats[k])}`).join(' · ')}</p>
        <label class="field"><span>Notizen</span><textarea name="notes" rows="4">${esc(x.notes)}</textarea></label>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Speichern</button>
        <a class="btn" href="#/xeno/${x.id}">Abbrechen</a>
      </div>
      <button type="button" class="btn wide" data-act="xeno-defaults" data-id="${x.id}">Regelbuch-Werte wiederherstellen</button>
      <button type="button" class="btn btn-danger wide" data-act="xeno-delete" data-id="${x.id}">Xeno löschen</button>
    </form>`;
}

export function saveXenoForm(form) {
  const x = structuredClone(store.getXeno(form.dataset.id));
  const wasFull = x.healthCurrent >= diceOf(x.stats.health);
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.name.startsWith('stats.')) x.stats[el.name.slice(6)] = el.value.trim();
    else x[el.name] = el.value;
  }
  const max = diceOf(x.stats.health);
  x.healthCurrent = wasFull ? max : Math.min(x.healthCurrent, max);
  store.saveXeno(x);
  toast('Gespeichert');
  location.hash = `#/xeno/${x.id}`;
}

// ---------- Aktionen ----------

export function xenoAction(act, el) {
  const id = el.dataset.id;
  switch (act) {
    case 'xeno-health':
      store.updateXeno(id, (x) => {
        x.healthCurrent = Math.max(0, Math.min(diceOf(x.stats.health), x.healthCurrent + Number(el.dataset.d)));
      });
      render();
      return true;
    case 'xeno-attack': {
      const x = store.getXeno(id);
      const r = rollAttack(x.typeKey);
      if (!r) return true;
      store.updateXeno(id, (y) => { y.lastAttack = { roll: r.roll, name: r.row.name, subRoll: r.subRoll }; });
      navigator.vibrate?.(60);
      render();
      return true;
    }
    case 'xeno-clear-attack':
      store.updateXeno(id, (x) => { x.lastAttack = null; });
      render();
      return true;
    case 'xeno-dice':
      openDice(store.getXeno(id)?.name || '', el.dataset.label, Number(el.dataset.n));
      return true;
    case 'xeno-copy': {
      const c = store.copyXeno(id);
      toast(`${c.name} angelegt`);
      location.hash = `#/xeno/${c.id}`;
      return true;
    }
    case 'xeno-defaults': {
      const x = store.getXeno(id);
      if (!confirm('Stats auf die Regelbuch-Werte zurücksetzen?')) return true;
      store.updateXeno(id, (y) => { y.stats = { ...typeByKey(x.typeKey).stats }; y.healthCurrent = diceOf(y.stats.health); });
      toast('Regelbuch-Werte wiederhergestellt');
      location.hash = `#/xeno/${id}`;
      return true;
    }
    case 'xeno-delete': {
      const x = store.getXeno(id);
      if (x && confirm(`„${x.name}“ löschen?`)) {
        store.removeXeno(id);
        toast('Xeno gelöscht');
        location.hash = '#/xenos';
      }
      return true;
    }
    default:
      return false;
  }
}

export function addXeno(typeKey) {
  if (!typeKey) return;
  const t = typeByKey(typeKey);
  const exists = store.xenos().some((x) => x.typeKey === typeKey);
  const x = exists ? store.copyXeno(store.xenos().find((y) => y.typeKey === typeKey).id) : store.saveXeno(store.newXeno(typeKey));
  toast(`${x.name} hinzugefügt`);
  location.hash = `#/xeno/${x.id}`;
  return t;
}

// ---------- Einfacher Würfelwurf für Xenos (keine Stress Dice, kein Push) ----------

const $pick = () => document.getElementById('pick-dialog');

export function openDice(who, label, n) {
  const dice = Array.from({ length: Math.max(1, n) }, () => Math.floor(Math.random() * 6) + 1);
  const hits = dice.filter((d) => d === 6).length;
  $pick().innerHTML = `<div class="dlg">
    <div class="dlg-head"><h3>${esc(who)}: ${esc(label)}</h3><button class="icon-btn" data-act="pick-close" aria-label="Schließen">✕</button></div>
    <div class="dice">${dice.map((d) => `<span class="die base anim ${d === 6 ? 'success' : ''}">${d === 6 ? '✦' : d}</span>`).join('')}</div>
    <div class="verdict ${hits ? 'ok' : 'fail'}">${hits ? `${hits} ${hits === 1 ? 'Success' : 'Successes'}` : 'Failure'}</div>
    <p class="hint center">${n} Base Dice · Xenos würfeln ohne Stress Dice und pushen nie.</p>
    <div class="dlg-actions"><button class="btn wide" data-act="pick-close">Schließen</button></div>
  </div>`;
  if (!$pick().open) $pick().showModal();
  navigator.vibrate?.(40);
}
