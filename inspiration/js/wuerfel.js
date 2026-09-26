// Reine Logik ohne Browser-Abhängigkeiten, damit sie sich testen lässt.

// Kategorien alphabetisch nach deutschen Regeln (Ü neben U, Groß/klein egal).
export function sortiereKategorien(kategorien) {
  return [...kategorien].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
}

// Zieht `anzahl` verschiedene Einträge. Einträge aus `ausschliessen` werden gemieden,
// solange genug andere übrig sind.
export function ziehe(eintraege, anzahl = 1, rng = Math.random, ausschliessen = []) {
  const gesperrt = new Set(ausschliessen);
  let pool = eintraege.filter((e) => !gesperrt.has(e));
  if (pool.length < anzahl) pool = [...eintraege];
  const ergebnis = [];
  while (ergebnis.length < anzahl && pool.length) {
    const i = Math.floor(rng() * pool.length);
    ergebnis.push(pool.splice(i, 1)[0]);
  }
  return ergebnis;
}

// Würfelt für jede gewählte Kategorie `anzahl` Werte.
export function wuerfleAlle(kategorien, namen, anzahl = 1, rng = Math.random) {
  return kategorien
    .filter((k) => namen.includes(k.name))
    .map((k) => ({ name: k.name, werte: ziehe(k.eintraege, anzahl, rng) }));
}
