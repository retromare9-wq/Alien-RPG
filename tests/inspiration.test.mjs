// Aufruf: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KATEGORIEN } from '../inspiration/js/listen.js';
import { sortiereKategorien, ziehe, wuerfleAlle } from '../inspiration/js/wuerfel.js';

test('Inspiration: jede Kategorie hat Einträge, keine doppelt', () => {
  const namen = new Set();
  for (const k of KATEGORIEN) {
    assert.ok(k.name && !namen.has(k.name), `Name fehlt oder doppelt: ${k.name}`);
    namen.add(k.name);
    assert.ok(k.eintraege.length > 0, `${k.name} ist leer`);
    const doppelt = k.eintraege.filter((e, i) => k.eintraege.indexOf(e) !== i);
    assert.deepEqual(doppelt, [], `${k.name} hat doppelte Einträge`);
    for (const e of k.eintraege) assert.ok(typeof e === 'string' && e.trim(), `${k.name}: leerer Eintrag`);
  }
});

test('Inspiration: Kategorien alphabetisch mit Umlauten', () => {
  const sortiert = sortiereKategorien([{ name: 'Küche' }, { name: 'Büro' }, { name: 'Bar' }, { name: 'Labor' }, { name: 'Kantine' }]);
  assert.deepEqual(sortiert.map((k) => k.name), ['Bar', 'Büro', 'Kantine', 'Küche', 'Labor']);
});

test('Inspiration: ziehen ohne Wiederholung, Ausschluss wird respektiert', () => {
  const liste = ['a', 'b', 'c', 'd'];
  const werte = ziehe(liste, 3, () => 0);
  assert.equal(new Set(werte).size, 3);
  assert.deepEqual(ziehe(liste, 1, () => 0, ['a', 'b', 'c']), ['d']);
  // Mehr verlangt als vorhanden: liefert alles, ohne Endlosschleife
  assert.equal(ziehe(['x', 'y'], 5).length, 2);
  // Alles ausgeschlossen: trotzdem ein Wert
  assert.equal(ziehe(['x'], 1, Math.random, ['x']).length, 1);
});

test('Inspiration: mehrere Kategorien gleichzeitig würfeln', () => {
  const erg = wuerfleAlle(KATEGORIEN, ['Bar', 'Gerüche'], 2);
  assert.deepEqual(erg.map((g) => g.name).sort(), ['Bar', 'Gerüche']);
  for (const g of erg) assert.equal(g.werte.length, 2);
});
