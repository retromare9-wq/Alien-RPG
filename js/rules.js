// Regeln nach ALIEN RPG Evolved Edition (Core Rulebook, S. 42–44).
// Reine Funktionen ohne DOM-Zugriff, damit sie testbar bleiben.

export const MAX_STRESS = 10;
export const MIN_BASE_DICE = 1;

export const ATTRIBUTES = [
  { key: 'strength', label: 'Strength', de: 'Stärke' },
  { key: 'agility', label: 'Agility', de: 'Geschick' },
  { key: 'wits', label: 'Wits', de: 'Verstand' },
  { key: 'empathy', label: 'Empathy', de: 'Empathie' },
];

export const SKILLS = [
  { key: 'closeCombat', label: 'Close Combat', attr: 'strength' },
  { key: 'heavyMachinery', label: 'Heavy Machinery', attr: 'strength' },
  { key: 'stamina', label: 'Stamina', attr: 'strength' },
  { key: 'mobility', label: 'Mobility', attr: 'agility' },
  { key: 'piloting', label: 'Piloting', attr: 'agility' },
  { key: 'rangedCombat', label: 'Ranged Combat', attr: 'agility' },
  { key: 'comtech', label: 'Comtech', attr: 'wits' },
  { key: 'observation', label: 'Observation', attr: 'wits' },
  { key: 'survival', label: 'Survival', attr: 'wits' },
  { key: 'command', label: 'Command', attr: 'empathy' },
  { key: 'manipulation', label: 'Manipulation', attr: 'empathy' },
  { key: 'medicalAid', label: 'Medical Aid', attr: 'empathy' },
];

export const skillsFor = (attr) => SKILLS.filter((s) => s.attr === attr);
export const skillByKey = (key) => SKILLS.find((s) => s.key === key);
export const attrByKey = (key) => ATTRIBUTES.find((a) => a.key === key);

// Stress-Response-Tabelle (D6 + Stress Level − Resolve).
// `penaltyAttr`: Skill-Würfe auf diesem Attribut bekommen −2 Würfel.
export const STRESS_RESPONSES = [
  { key: 'jumpy', label: 'Jumpy', result: 1, effect: 'Beim Pushen +2 Stress statt +1.' },
  { key: 'tunnelVision', label: 'Tunnel Vision', result: 2, penaltyAttr: 'wits', effect: 'Alle Skill-Würfe auf Wits −2 Würfel.' },
  { key: 'aggravated', label: 'Aggravated', result: 3, penaltyAttr: 'empathy', effect: 'Alle Skill-Würfe auf Empathy −2 Würfel.' },
  { key: 'shakes', label: 'Shakes', result: 4, penaltyAttr: 'agility', effect: 'Alle Skill-Würfe auf Agility −2 Würfel.' },
  { key: 'frantic', label: 'Frantic', result: 5, penaltyAttr: 'strength', effect: 'Alle Skill-Würfe auf Strength −2 Würfel.' },
  { key: 'deflated', label: 'Deflated', result: 6, effect: 'Kann keine Würfe pushen. Entfernt Jumpy; weitere Jumpy-Ergebnisse werden ignoriert.' },
];

export const KEEPING_COOL = { key: 'keepingCool', label: 'Keeping Cool', effect: 'Keine Auswirkung.' };
export const MESS_UP = { key: 'messUp', label: 'Mess Up', effect: 'Die Aktion scheitert unabhängig von den Erfolgen, +1 Stress.' };

// Panik-Reaktionen vom Charakterbogen (nur zum Abhaken).
export const PANIC_RESPONSES = [
  { key: 'paranoid', label: 'Paranoid' },
  { key: 'hesitant', label: 'Hesitant' },
  { key: 'freeze', label: 'Freeze' },
  { key: 'seekCover', label: 'Seek Cover' },
  { key: 'scream', label: 'Scream' },
  { key: 'flee', label: 'Flee' },
  { key: 'frenzy', label: 'Frenzy' },
  { key: 'catatonic', label: 'Catatonic' },
];

export const PENALTY_PER_RESPONSE = 2;

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const d6 = (rng = Math.random) => Math.floor(rng() * 6) + 1;

// Würfelmodifikatoren aus aktiven Stress Responses für einen Wurf auf `attr`.
// Gilt nur für Skill-Würfe (inkl. Würfe ohne Skill-Stufe auf diesem Attribut).
export function responsePenalties(responses, attr) {
  return STRESS_RESPONSES
    .filter((r) => r.penaltyAttr === attr && responses?.[r.key])
    .map((r) => ({ label: r.label, value: -PENALTY_PER_RESPONSE }));
}

export function canPushAtAll(character) {
  if (!character.hasStress) return false;
  return !character.responses?.deflated;
}

export function stressGainOnPush(character) {
  return character.responses?.jumpy ? 2 : 1;
}

// Ein Würfel: { type: 'base'|'stress', value, rerolled }
export function rollPool(baseCount, stressCount, rng = Math.random) {
  const dice = [];
  for (let i = 0; i < Math.max(MIN_BASE_DICE, baseCount); i++) dice.push({ type: 'base', value: d6(rng), rerolled: false });
  for (let i = 0; i < Math.max(0, stressCount); i++) dice.push({ type: 'stress', value: d6(rng), rerolled: false });
  return dice;
}

export const countSuccesses = (dice) => dice.filter((d) => d.value === 6).length;
export const countStressOnes = (dice) => dice.filter((d) => d.type === 'stress' && d.value === 1).length;

// Pushen: alle Würfel ohne 6 neu würfeln, plus `extraStress` neue Stresswürfel.
export function pushPool(dice, extraStress, rng = Math.random) {
  const rerolled = dice.map((d) => (d.value === 6 ? { ...d, rerolled: false } : { ...d, value: d6(rng), rerolled: true }));
  for (let i = 0; i < extraStress; i++) rerolled.push({ type: 'stress', value: d6(rng), rerolled: true, added: true });
  return rerolled;
}

export function lookupStressResponse(total) {
  if (total <= 0) return KEEPING_COOL;
  if (total >= 7) return MESS_UP;
  return STRESS_RESPONSES.find((r) => r.result === total);
}

// Würfelt eine Stress Response und berechnet die Änderungen am Charakter.
// Gibt { die, total, response, stressDelta, responses, note, actionFails } zurück;
// der Aufrufer wendet `stressDelta` und `responses` auf den Charakter an.
export function resolveStressResponse(character, rng = Math.random) {
  const die = d6(rng);
  const stress = character.stress || 0;
  const resolve = character.resolve || 0;
  const total = die + stress - resolve;
  return { die, stress, resolve, total, ...applyStressResponse(character, lookupStressResponse(total)) };
}

export function applyStressResponse(character, response) {
  const responses = { ...(character.responses || {}) };
  let stressDelta = 0;
  let note = response.effect;
  let actionFails = false;

  if (response.key === 'keepingCool') {
    // nichts
  } else if (response.key === 'messUp') {
    stressDelta = 1;
    actionFails = true;
  } else if (response.key === 'jumpy' && responses.deflated) {
    note = 'Jumpy wird ignoriert, solange der Charakter Deflated ist.';
  } else if (responses[response.key]) {
    stressDelta = 1;
    note = `${response.label} ist bereits aktiv, deshalb stattdessen +1 Stress.`;
  } else {
    responses[response.key] = true;
    if (response.key === 'deflated' && responses.jumpy) {
      responses.jumpy = false;
      note += ' Jumpy wurde entfernt.';
    }
  }
  return { response, stressDelta, responses, note, actionFails };
}
