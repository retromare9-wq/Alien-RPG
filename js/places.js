// Orte-Reiter: Liste nach Abteilung, Detailansicht, Bearbeiten, neue Orte.
import * as store from './store.js';
import { esc, nl2br, section, toast, ui } from './app.js';

const TEXT_FIELDS = [
  ['look', 'Aussehen'], ['smell', 'Geruch'], ['sound', 'Geräusch'],
  ['finds', 'Funde'], ['interaction', 'Interaktion'], ['notes', 'Notizen für die GM'],
];

const byCode = (a, b) => (parseInt(a.mapCode, 10) || 999) - (parseInt(b.mapCode, 10) || 999) || a.name.localeCompare(b.name, 'de');

const flagChips = (l) => [
  `<span class="chip ${l.cluttered ? 'chip-flag' : 'chip-open'}">${l.cluttered ? 'Cluttered' : 'Open'}</span>`,
  l.terminal ? '<span class="chip chip-flag">Terminal</span>' : '',
  l.camera ? '<span class="chip chip-flag">Kamera</span>' : '',
].join('');

export function locationsView() {
  const list = store.locations();
  const depts = [...new Set(list.map((l) => l.department || 'Ohne Abteilung'))];
  const body = depts.map((d) => {
    const rows = list.filter((l) => (l.department || 'Ohne Abteilung') === d).sort(byCode);
    return section(`loc-${d}`, esc(d), rows.map((l) => `
      <a class="loc-row" href="#/loc/${l.id}">
        <span class="loc-code">${esc(l.mapCode) || '–'}</span>
        <span class="loc-name">${esc(l.name || 'Ohne Namen')}</span>
        <span class="loc-flags">${l.cluttered ? '<i title="Cluttered">C</i>' : ''}${l.terminal ? '<i title="Terminal">T</i>' : ''}${l.camera ? '<i title="Kamera">K</i>' : ''}</span>
        <span class="loc-search" hidden>${esc([l.look, l.smell, l.sound, l.finds, l.interaction, l.notes].join(' '))}</span>
      </a>`).join(''), { badge: rows.length });
  }).join('');
  return `
    <input id="loc-search" type="search" placeholder="Orte durchsuchen …" autocomplete="off">
    <div id="loc-list">${body || '<p class="empty">Noch keine Orte.</p>'}</div>
    <a class="btn btn-primary wide" href="#/loc-edit/new">+ Neuer Ort</a>
    <p class="hint">C = Cluttered, T = Terminal, K = Kamera</p>`;
}

export function filterLocations(q) {
  const term = q.trim().toLowerCase();
  for (const dept of document.querySelectorAll('#loc-list > details')) {
    let hits = 0;
    for (const row of dept.querySelectorAll('.loc-row')) {
      const match = !term || row.textContent.toLowerCase().includes(term);
      row.hidden = !match;
      if (match) hits++;
    }
    dept.hidden = hits === 0;
    dept.open = term ? hits > 0 : (ui.open[dept.dataset.sec] ?? false);
  }
}

export function locationView(id) {
  const l = store.getLocation(id);
  if (!l) return '<p class="empty">Ort nicht gefunden. <a href="#/locations">Zu den Orten</a></p>';
  const blocks = TEXT_FIELDS.filter(([k]) => l[k]).map(([k, label]) => `
    <div class="card loc-block ${k === 'notes' ? 'loc-notes' : ''}">
      <h3>${label}</h3>
      <p>${nl2br(l[k])}</p>
    </div>`).join('');
  return `
    <div class="sheet-head">
      <div>
        <h2>${esc(l.name || 'Ohne Namen')}</h2>
        <div class="li-sub">${esc(l.department)}${l.mapCode ? ` · Map-Code ${esc(l.mapCode)}` : ''}</div>
      </div>
      <a class="btn btn-small" href="#/loc-edit/${l.id}">Bearbeiten</a>
    </div>
    <div class="chips loc-chips">${flagChips(l)}</div>
    ${blocks || '<p class="hint">Noch keine Beschreibung.</p>'}`;
}

export function locationEditView(id) {
  const isNew = id === 'new';
  const l = isNew ? store.blankLocation() : store.getLocation(id);
  if (!l) return '<p class="empty">Ort nicht gefunden.</p>';
  const depts = [...new Set(store.locations().map((x) => x.department).filter(Boolean))];
  const check = (k, label, hint = '') => `<label class="check"><input type="checkbox" name="${k}" ${l[k] ? 'checked' : ''}><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</span></label>`;
  return `
    <form id="loc-form" data-id="${l.id}" data-new="${isNew ? '1' : ''}" autocomplete="off">
      <h2>${isNew ? 'Neuer Ort' : `${esc(l.name)} bearbeiten`}</h2>
      <div class="card form-sec">
        <label class="field"><span>Ort</span><input name="name" value="${esc(l.name)}" required></label>
        <label class="field"><span>Abteilung</span>
          <input name="department" list="dl-depts" value="${esc(l.department)}">
          <datalist id="dl-depts">${depts.map((d) => `<option value="${esc(d)}">`).join('')}</datalist>
        </label>
        <label class="field"><span>Map-Code</span><input name="mapCode" value="${esc(l.mapCode)}" inputmode="numeric"></label>
        ${check('cluttered', 'Cluttered', 'Ohne Häkchen ist der Ort Open.')}
        ${check('terminal', 'Terminal')}
        ${check('camera', 'Kamera')}
      </div>
      <div class="card form-sec">
        ${TEXT_FIELDS.map(([k, label]) => `<label class="field"><span>${label}</span><textarea name="${k}" rows="${k === 'look' || k === 'finds' ? 5 : 3}">${esc(l[k])}</textarea></label>`).join('')}
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Speichern</button>
        <a class="btn" href="${isNew ? '#/locations' : `#/loc/${l.id}`}">Abbrechen</a>
      </div>
      ${isNew ? '' : `<button type="button" class="btn btn-danger wide" data-act="loc-delete" data-id="${l.id}">Ort löschen</button>`}
    </form>`;
}

export function saveLocationForm(form) {
  const l = form.dataset.new ? { ...store.blankLocation(), id: form.dataset.id } : { ...store.getLocation(form.dataset.id) };
  for (const el of form.elements) {
    if (!el.name) continue;
    l[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
  }
  store.saveLocation(l);
  toast('Ort gespeichert');
  location.hash = `#/loc/${l.id}`;
}

export function deleteLocation(id) {
  const l = store.getLocation(id);
  if (l && confirm(`„${l.name}“ wirklich löschen?`)) {
    store.removeLocation(id);
    toast('Ort gelöscht');
    location.hash = '#/locations';
  }
}
