import { KATEGORIEN } from './listen.js';
import { sortiereKategorien, ziehe, wuerfleAlle } from './wuerfel.js';

const kategorien = sortiereKategorien(KATEGORIEN);
const PREFIX = 'inspiration.'; // eigene Schlüssel, damit Alien RPG nichts überschreibt
const MAX_VERLAUF = 20;

// ---------- Speicher (localStorage kann fehlen, z. B. im privaten Modus) ----------
function lade(key, fallback) {
  try { return JSON.parse(localStorage.getItem(PREFIX + key)) ?? fallback; } catch { return fallback; }
}
function speichere(key, wert) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(wert)); } catch { /* egal */ }
}

const state = {
  gewaehlt: lade('gewaehlt', []).filter((n) => kategorien.some((k) => k.name === n)),
  anzahl: lade('anzahl', 1),
  ergebnis: lade('ergebnis', []),
  verlauf: lade('verlauf', []),
};

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const eintraegeVon = (name) => kategorien.find((k) => k.name === name)?.eintraege ?? [];

// ---------- Anzeige ----------
function zeigeKategorien() {
  $('#kategorien').innerHTML = kategorien.map((k) => `
    <button class="kat" type="button" data-kat="${esc(k.name)}" aria-pressed="${state.gewaehlt.includes(k.name)}">
      ${esc(k.name)}
    </button>`).join('');
  zeigeWuerfelKnopf();
}

function zeigeWuerfelKnopf() {
  const n = state.gewaehlt.length;
  const knopf = $('#wuerfeln');
  knopf.disabled = n === 0;
  knopf.innerHTML = n === 0
    ? 'Kategorie wählen'
    : `Würfeln <small>${n} ${n === 1 ? 'Kategorie' : 'Kategorien'}</small>`;
  document.querySelectorAll('.seg').forEach((b) => b.classList.toggle('active', Number(b.dataset.anzahl) === state.anzahl));
}

function zeigeErgebnis() {
  const el = $('#ergebnis');
  if (!state.ergebnis.length) {
    el.innerHTML = '<p class="empty">Kategorien antippen und würfeln.</p>';
    return;
  }
  el.innerHTML = state.ergebnis.map((g, gi) => `
    <section class="card treffer">
      <button class="treffer-kopf" type="button" data-neu-kat="${gi}" aria-label="${esc(g.name)} komplett neu würfeln">
        <span>${esc(g.name)}</span><span class="neu" aria-hidden="true">↻</span>
      </button>
      <ul>
        ${g.werte.map((w, wi) => `
          <li>
            <span class="wert">${esc(w)}</span>
            <button class="btn-round" type="button" data-neu="${gi}:${wi}" aria-label="Nur diesen Wert neu würfeln">↻</button>
          </li>`).join('')}
      </ul>
    </section>`).join('');
}

function zeigeVerlauf() {
  const el = $('#verlauf-liste');
  $('#verlauf-zahl').textContent = state.verlauf.length;
  if (!state.verlauf.length) {
    el.innerHTML = '<p class="hint">Noch nichts gewürfelt.</p>';
    return;
  }
  el.innerHTML = state.verlauf.map((v) => `
    <div class="verlauf-eintrag">
      <small>${esc(v.zeit)}</small>
      ${v.gruppen.map((g) => `<div><b>${esc(g.name)}:</b> ${g.werte.map(esc).join(' · ')}</div>`).join('')}
    </div>`).join('') + '<button id="verlauf-leeren" class="btn btn-small" type="button">Verlauf leeren</button>';
}

// ---------- Aktionen ----------
function merkeImVerlauf() {
  const zeit = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  state.verlauf = [{ zeit, gruppen: state.ergebnis }, ...state.verlauf].slice(0, MAX_VERLAUF);
  speichere('verlauf', state.verlauf);
}

function sichern() {
  speichere('ergebnis', state.ergebnis);
  zeigeErgebnis();
  zeigeVerlauf();
}

function wuerfeln() {
  if (!state.gewaehlt.length) return;
  state.ergebnis = wuerfleAlle(kategorien, state.gewaehlt, state.anzahl);
  merkeImVerlauf();
  sichern();
  $('#ergebnis').classList.remove('neu-gewuerfelt');
  void $('#ergebnis').offsetWidth; // Animation neu starten
  $('#ergebnis').classList.add('neu-gewuerfelt');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Einzelwert oder ganze Kategorie neu würfeln; ersetzt den obersten Verlaufseintrag.
function aktualisiereLetztenVerlauf() {
  $('#ergebnis').classList.remove('neu-gewuerfelt'); // nur beim großen Wurf animieren
  if (state.verlauf.length) {
    state.verlauf[0] = { ...state.verlauf[0], gruppen: state.ergebnis };
    speichere('verlauf', state.verlauf);
  }
}

function neuEinzeln(gi, wi) {
  const g = state.ergebnis[gi];
  if (!g) return;
  const [neu] = ziehe(eintraegeVon(g.name), 1, Math.random, g.werte);
  if (!neu) return;
  state.ergebnis = state.ergebnis.map((x, i) => i !== gi ? x : { ...x, werte: x.werte.map((w, j) => j === wi ? neu : w) });
  aktualisiereLetztenVerlauf();
  sichern();
}

function neuKategorie(gi) {
  const g = state.ergebnis[gi];
  if (!g) return;
  const werte = ziehe(eintraegeVon(g.name), g.werte.length, Math.random, g.werte);
  state.ergebnis = state.ergebnis.map((x, i) => i !== gi ? x : { ...x, werte });
  aktualisiereLetztenVerlauf();
  sichern();
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.kat) {
    const name = t.dataset.kat;
    state.gewaehlt = state.gewaehlt.includes(name) ? state.gewaehlt.filter((n) => n !== name) : [...state.gewaehlt, name];
    speichere('gewaehlt', state.gewaehlt);
    t.setAttribute('aria-pressed', state.gewaehlt.includes(name));
    zeigeWuerfelKnopf();
  } else if (t.dataset.anzahl) {
    state.anzahl = Number(t.dataset.anzahl);
    speichere('anzahl', state.anzahl);
    zeigeWuerfelKnopf();
  } else if (t.dataset.neu) {
    const [gi, wi] = t.dataset.neu.split(':').map(Number);
    neuEinzeln(gi, wi);
  } else if (t.dataset.neuKat) {
    neuKategorie(Number(t.dataset.neuKat));
  } else if (t.id === 'wuerfeln') {
    wuerfeln();
  } else if (t.id === 'alle') {
    state.gewaehlt = kategorien.map((k) => k.name);
    speichere('gewaehlt', state.gewaehlt);
    zeigeKategorien();
  } else if (t.id === 'keine') {
    state.gewaehlt = [];
    speichere('gewaehlt', state.gewaehlt);
    zeigeKategorien();
  } else if (t.id === 'verlauf-leeren') {
    state.verlauf = [];
    speichere('verlauf', state.verlauf);
    zeigeVerlauf();
  }
});

zeigeKategorien();
zeigeErgebnis();
zeigeVerlauf();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
