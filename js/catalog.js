// Equipment-Reiter: Katalog, Suche, Zufallsauswahl, Zuweisen an Charaktere, Bearbeiten.
import { CATEGORIES } from './data/equipment.js';
import * as store from './store.js';
import { esc, nl2br, section, toast, render, ui, saveUi } from './app.js';

const KIND_LABEL = { weapon: 'Weapon', armor: 'Armor', gear: 'Gear' };

// Zahl aus Modifier-Text: "+2" → 2, "−1" → -1, "" → 0
export const parseModifier = (m) => Number(String(m ?? '').replace('−', '-').replace('+', '')) || 0;

export function weaponSkill(item) {
  if (item.skill) return item.skill;
  return /^A\/A/.test(item.range || '') ? 'closeCombat' : 'rangedCombat';
}

function stats(it) {
  const rows = [
    ['Modifier', it.modifier], ['Damage', it.damage], ['Range', it.range], ['Ammo', it.ammo],
    ['Power', it.power], ['Armor Level', it.armor], ['Air Supply', it.air], ['Weight', it.weight], ['Cost', it.cost],
  ].filter(([, v]) => v !== undefined && v !== '');
  return `<dl class="kv eq-kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${it.effect ? `<p class="eq-effect">${nl2br(it.effect)}</p>` : ''}`;
}

export function itemCard(it, { highlight = false } = {}) {
  const tags = [
    it.source === 'Supplement' ? '<span class="tag">Supplement</span>' : '',
    it.edited ? '<span class="tag tag-edit">bearbeitet</span>' : '',
    it.custom ? '<span class="tag tag-edit">eigenes Item</span>' : '',
  ].join('');
  return `<div class="item eq-item ${highlight ? 'eq-random' : ''}" data-item="${esc(it.id)}">
    ${highlight ? '<div class="eq-random-label">🎲 Zufallsauswahl</div>' : ''}
    <div class="item-head">
      <b>${esc(it.name)}</b>
      <span class="eq-actions">
        <button class="btn-round small" data-act="eq-assign" data-item="${esc(it.id)}" aria-label="${esc(it.name)} einem Charakter geben">+</button>
        <a class="btn-round small" href="#/item/${encodeURIComponent(it.id)}" aria-label="${esc(it.name)} bearbeiten">✎</a>
      </span>
    </div>
    <div class="eq-tags"><span class="tag">${KIND_LABEL[it.kind]}</span>${tags}</div>
    ${stats(it)}
  </div>`;
}

export function equipmentView() {
  const items = store.equipment();
  const cats = [...CATEGORIES, ...new Set(items.map((i) => i.cat).filter((c) => !CATEGORIES.includes(c)))];
  const body = cats.map((cat) => {
    const list = items.filter((i) => i.cat === cat).sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) return '';
    const pickId = ui.randomPick?.[cat];
    const picked = pickId && list.find((i) => i.id === pickId);
    return section(`eq-${cat}`, esc(cat), `
      <button class="btn wide eq-roll" data-act="eq-random" data-cat="${esc(cat)}">🎲 Zufälliges Item aus ${esc(cat)}</button>
      ${picked ? itemCard(picked, { highlight: true }) : ''}
      ${list.map((i) => itemCard(i)).join('')}`, { badge: list.length, open: !!picked });
  }).join('');
  return `
    <input id="eq-search" type="search" placeholder="Equipment durchsuchen …" autocomplete="off">
    <div id="eq-list">${body}</div>
    <a class="btn btn-primary wide" href="#/item/new">+ Neues Item</a>`;
}

export function filterEquipment(q) {
  const term = q.trim().toLowerCase();
  for (const cat of document.querySelectorAll('#eq-list > details')) {
    let hits = 0;
    for (const el of cat.querySelectorAll('.eq-item:not(.eq-random)')) {
      const match = !term || el.textContent.toLowerCase().includes(term);
      el.hidden = !match;
      if (match) hits++;
    }
    cat.querySelector('.eq-roll').hidden = !!term;
    const rnd = cat.querySelector('.eq-random');
    if (rnd) rnd.hidden = !!term;
    cat.hidden = hits === 0;
    cat.open = term ? hits > 0 : (ui.open[cat.dataset.sec] ?? false);
  }
}

export function randomPick(cat) {
  const list = store.equipment().filter((i) => i.cat === cat);
  if (!list.length) return;
  const it = list[Math.floor(Math.random() * list.length)];
  ui.randomPick = { ...(ui.randomPick || {}), [cat]: it.id };
  ui.open[`eq-${cat}`] = true;
  saveUi();
  render();
  document.querySelector(`[data-sec="eq-${CSS.escape(cat)}"] .eq-random`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ---------- Zuweisen ----------

const $pick = () => document.getElementById('pick-dialog');

export function openAssign(itemId) {
  const it = store.getItem(itemId);
  if (!it) return;
  const chars = store.sorted();
  $pick().innerHTML = `<div class="dlg">
    <div class="dlg-head"><h3>${esc(it.name)} geben an …</h3><button class="icon-btn" data-act="pick-close" aria-label="Schließen">✕</button></div>
    ${chars.length ? chars.map((c) => `<button class="pick-row" data-act="eq-assign-to" data-item="${esc(it.id)}" data-id="${c.id}">
      <span>${esc(c.name || 'Ohne Namen')}</span><span class="type type-${c.type.toLowerCase()}">${c.type}</span></button>`).join('')
      : '<p class="empty">Noch keine Charaktere angelegt.</p>'}
  </div>`;
  $pick().showModal();
}

export function closePick() {
  if ($pick().open) $pick().close();
}

export function assignItem(charId, itemId) {
  const it = store.getItem(itemId);
  const c = store.get(charId);
  if (!it || !c) return;
  let where = 'Gear';
  store.update(charId, (x) => {
    if (it.kind === 'weapon') {
      let row = x.weapons.find((w) => !w.name.trim());
      if (!row) { row = store.blankWeapon(); x.weapons.push(row); }
      Object.assign(row, fillWeapon(it));
      where = 'Weapons';
      return;
    }
    if (it.kind === 'armor' && (!x.armor.name.trim() || confirm(`${x.name || 'Der Charakter'} trägt bereits „${x.armor.name}“. Ersetzen? (Abbrechen = als Gear hinzufügen)`))) {
      Object.assign(x.armor, fillArmor(it));
      where = 'Armor';
      return;
    }
    let row = x.gear.find((g) => !g.name.trim());
    if (!row) { row = store.blankGear(); x.gear.push(row); }
    Object.assign(row, fillGear(it));
  });
  closePick();
  toast(`${it.name} → ${c.name || 'Charakter'} (${where})`);
}

export const fillWeapon = (it) => ({
  name: it.name, skill: weaponSkill(it), modifier: parseModifier(it.modifier),
  damage: it.damage || '', range: it.range || '', ammo: it.ammo || '', weight: it.weight || '',
});
export const fillArmor = (it) => ({ name: it.name, level: it.armor || '', weight: it.weight || '' });
export const fillGear = (it) => ({ name: it.name, airPower: it.air || it.power || '', weight: it.weight || '' });

// ---------- Bearbeiten ----------

const FIELDS = [
  ['modifier', 'Modifier'], ['damage', 'Damage'], ['range', 'Range'], ['ammo', 'Ammo'], ['power', 'Power'],
  ['armor', 'Armor Level'], ['air', 'Air Supply'], ['weight', 'Weight'], ['cost', 'Cost'],
];

export function itemEditView(id) {
  const isNew = id === 'new';
  const it = isNew ? { id: store.newItemId(), kind: 'gear', cat: 'Other Equipment', name: '', effect: '' } : store.getItem(decodeURIComponent(id));
  if (!it) return '<p class="empty">Item nicht gefunden. <a href="#/equipment">Zum Equipment</a></p>';
  const input = (k, label) => `<label class="field"><span>${label}</span><input name="${k}" value="${esc(it[k] ?? '')}"></label>`;
  const cats = [...new Set([...CATEGORIES, ...store.equipment().map((i) => i.cat)])];
  return `
    <form id="item-form" data-id="${esc(it.id)}" autocomplete="off">
      <h2>${isNew ? 'Neues Item' : `${esc(it.name)} bearbeiten`}</h2>
      <div class="card form-sec">
        ${input('name', 'Name')}
        <div class="field-row">
          <label class="field"><span>Kategorie</span>
            <input name="cat" list="eq-cats" value="${esc(it.cat)}" required>
            <datalist id="eq-cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
          </label>
          <label class="field"><span>Art</span>
            <select name="kind">${Object.entries(KIND_LABEL).map(([k, l]) => `<option value="${k}" ${it.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </label>
        </div>
        <label class="field"><span>Skill (nur Weapons)</span>
          <select name="skill">
            <option value="">automatisch</option>
            <option value="closeCombat" ${it.skill === 'closeCombat' ? 'selected' : ''}>Close Combat</option>
            <option value="rangedCombat" ${it.skill === 'rangedCombat' ? 'selected' : ''}>Ranged Combat</option>
          </select>
        </label>
        <div class="field-row">${FIELDS.map(([k, l]) => input(k, l)).join('')}</div>
        <label class="field"><span>Effect / Special</span><textarea name="effect" rows="4">${esc(it.effect || '')}</textarea></label>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Speichern</button>
        <a class="btn" href="#/equipment">Abbrechen</a>
      </div>
      ${it.edited ? `<button type="button" class="btn wide" data-act="eq-reset" data-item="${esc(it.id)}">Originalwerte wiederherstellen</button>` : ''}
      ${it.custom ? `<button type="button" class="btn btn-danger wide" data-act="eq-reset" data-item="${esc(it.id)}">Item löschen</button>` : ''}
    </form>`;
}

export function saveItemForm(form) {
  const base = store.getItem(form.dataset.id) || { id: form.dataset.id, source: 'Eigenes' };
  const it = { ...base };
  for (const el of form.elements) if (el.name) it[el.name] = el.value.trim();
  if (!it.skill) delete it.skill;
  store.saveItem(it);
  toast('Item gespeichert');
  location.hash = '#/equipment';
}

export function resetItem(id) {
  const it = store.getItem(id);
  if (!it) return;
  if (!confirm(it.custom ? `„${it.name}“ löschen?` : `Eigene Änderungen an „${it.name}“ verwerfen?`)) return;
  store.resetItem(id);
  toast(it.custom ? 'Item gelöscht' : 'Originalwerte wiederhergestellt');
  location.hash = '#/equipment';
}

// Datalists für die Autovervollständigung im Charakter-Formular.
export function equipmentDatalists() {
  const items = store.equipment();
  const opts = (list) => list.map((i) => `<option value="${esc(i.name)}">`).join('');
  return `<datalist id="dl-weapons">${opts(items.filter((i) => i.kind === 'weapon'))}</datalist>
    <datalist id="dl-armor">${opts(items.filter((i) => i.kind === 'armor'))}</datalist>
    <datalist id="dl-gear">${opts(items)}</datalist>`;
}
