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

// ---------- Abgeleitete Werte ----------

export const deriveHealth = (a) => Math.ceil(((a.strength || 0) + (a.agility || 0)) / 2);
export const deriveResolve = (a) => Math.ceil(((a.wits || 0) + (a.empathy || 0)) / 2);
export const deriveEncumbranceMax = (a) => (a.strength || 0) * 2;

export const DERIVED = {
  health: deriveHealth,
  resolve: deriveResolve,
  encMax: deriveEncumbranceMax,
};

// Gewicht aus Freitext lesen: "1", "2", "0,5", "½", "1/2". Alles andere zählt 0.
export function parseWeight(text) {
  const t = String(text ?? '').trim().replace(',', '.').replace('½', '0.5').replace('¼', '0.25');
  if (!t) return 0;
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : 0;
  const n = parseFloat(t);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function encumbrance(c) {
  const sum = [...(c.gear || []), ...(c.weapons || [])].reduce((s, item) => s + parseWeight(item.weight), 0)
    + parseWeight(c.armor?.weight);
  return Math.round(sum * 100) / 100;
}

// ---------- Charaktererschaffung ----------

export const DEFAULT_ATTRIBUTE_POINTS = 14;
export const DEFAULT_SKILL_POINTS = 10;

// Liefert Hinweistexte, falls zu wenige / zu viele Punkte verteilt sind (leer = alles passt).
export function pointWarnings(c, attrBudget = DEFAULT_ATTRIBUTE_POINTS, skillBudget = DEFAULT_SKILL_POINTS) {
  const out = [];
  const check = (label, used, budget) => {
    if (used < budget) out.push(`${label}: ${used} von ${budget} Punkten verteilt, ${budget - used} ${budget - used === 1 ? 'fehlt' : 'fehlen'}.`);
    else if (used > budget) out.push(`${label}: ${used} von ${budget} Punkten verteilt, ${used - budget} zu viel.`);
  };
  check('Attribute', ATTRIBUTES.reduce((s, a) => s + (Number(c.attributes[a.key]) || 0), 0), attrBudget);
  check('Skills', SKILLS.reduce((s, k) => s + (Number(c.skills[k.key]) || 0), 0), skillBudget);
  return out;
}

// ---------- Stärkste Würfe ----------

// Die n Würfe mit den meisten Basiswürfeln. Skills ohne Stufe zählen nicht
// (da würfelt man einfach das Attribut); bei Gleichstand gewinnt der Skill.
export function strongestRolls(c, n = 2) {
  const options = [
    ...SKILLS.filter((s) => (c.skills[s.key] || 0) > 0).map((s) => ({ attr: s.attr, skill: s.key, label: s.label, isSkill: 1 })),
    ...ATTRIBUTES.map((a) => ({ attr: a.key, skill: null, label: a.label, isSkill: 0 })),
  ].map((o) => {
    const raw = (c.attributes[o.attr] || 0) + (o.skill ? c.skills[o.skill] || 0 : 0);
    const pen = responsePenalties(c.responses, o.attr).reduce((s, p) => s + p.value, 0);
    return { ...o, raw, dice: Math.max(MIN_BASE_DICE, raw + pen) };
  });
  options.sort((a, b) => b.raw - a.raw || b.isSkill - a.isSkill);
  return options.slice(0, n);
}

// ---------- Dauer der Stress Responses ----------

export const STRESS_DURATION = {
  keepingCool: '—',
  messUp: 'Nur diese Aktion',
  default: 'Bis der Stress abgebaut wird',
};

// ---------- Panik ----------

export const PANIC_ENDS = 'Panik endet, wenn jemand in Hör-/Funkreichweite einen Command-Wurf schafft, du Broken wirst oder ein Stretch vergeht.';

// `track`: Response wird auf dem Charakterbogen abgehakt (Checkbox).
export const PANIC_TABLE = [
  { key: 'keepingCool', label: 'Keeping Cool', min: -99, max: 0, effect: 'Keine Wirkung.', duration: '—' },
  { key: 'spooked', label: 'Spooked', min: 1, max: 1, stressDelta: 1, effect: 'Stress Level +1.', duration: 'Sofort' },
  { key: 'noisy', label: 'Noisy', min: 2, max: 2, effect: 'Gegner in der Nähe bemerken dich automatisch (SL entscheidet, wer).', duration: 'Sofort' },
  { key: 'twitchy', label: 'Twitchy', min: 3, max: 3, effect: 'Sofort Supply Roll für Luft, Munition oder Energie (SL wählt).', duration: 'Sofort' },
  { key: 'loseItem', label: 'Lose Item', min: 4, max: 4, effect: 'Waffe oder wichtiger Gegenstand weg (SL wählt). Im Kampf per Quick Action aufheben, sonst Observation-Wurf und Zeit.', duration: 'Sofort' },
  { key: 'paranoid', label: 'Paranoid', min: 5, max: 5, track: true, effect: 'Du kannst bei Würfen weder helfen noch Hilfe annehmen.', duration: 'Bis die Panik endet' },
  { key: 'hesitant', label: 'Hesitant', min: 6, max: 6, track: true, effect: 'Du bekommst automatisch Initiative 10.', duration: 'Bis die Panik endet' },
  { key: 'freeze', label: 'Freeze', min: 7, max: 7, track: true, effect: 'Du verlierst deinen nächsten Zug, bis dahin keine Interrupt-Aktionen.', duration: 'Bis zum Ende deines nächsten Zuges' },
  { key: 'seekCover', label: 'Seek Cover', min: 8, max: 8, track: true, stressDelta: -1, effect: 'Sofort volle Deckung in der Zone (Interrupt), Stress −1, nächster Zug verloren. In offener Zone stattdessen Scream.', duration: 'Bis zum Ende deines nächsten Zuges' },
  { key: 'scream', label: 'Scream', min: 9, max: 9, track: true, stressDelta: -1, effect: 'Nächster Zug verloren, Stress −1. Alle befreundeten PCs in der Zone würfeln sofort auf Panik.', duration: 'Bis zum Ende deines nächsten Zuges' },
  { key: 'flee', label: 'Flee', min: 10, max: 10, track: true, stressDelta: -1, effect: 'Sofort in eine Nachbarzone (Interrupt), Stress −1, Verbündete in der Startzone Stress +1. Weiter fliehen bis an einen sicheren Ort und dort bleiben. Kein Ausweg: Catatonic.', duration: 'Bis die Panik endet' },
  { key: 'frenzy', label: 'Frenzy', min: 11, max: 11, track: true, effect: 'Greift sofort die nächste Person oder Kreatur an, egal ob Freund. Befreundete PCs in der Zone würfeln auf Panik.', duration: 'Bis jemand Broken ist oder die Panik endet' },
  { key: 'catatonic', label: 'Catatonic', min: 12, max: 99, track: true, effect: 'Bricht zusammen, kann sich nicht bewegen, starrt oder brabbelt.', duration: 'Bis die Panik endet' },
];

export const lookupPanic = (total) => PANIC_TABLE.find((p) => total >= p.min && total <= p.max);

// Würfelt einen Panikwurf. Bereits aktive Panic Response → nächsthöhere Zeile.
export function resolvePanic(character, rng = Math.random) {
  const die = d6(rng);
  const stress = character.stress || 0;
  const resolve = character.resolve || 0;
  const total = die + stress - resolve;
  const panic = { ...(character.panic || {}) };
  let entry = lookupPanic(total);
  let bumped = false;
  while (entry.track && panic[entry.key] && entry !== PANIC_TABLE[PANIC_TABLE.length - 1]) {
    entry = PANIC_TABLE[PANIC_TABLE.indexOf(entry) + 1];
    bumped = true;
  }
  if (entry.track) panic[entry.key] = true;
  return {
    die, stress, resolve, total, response: entry, panic, bumped,
    stressDelta: entry.stressDelta || 0,
    trauma: total >= 9,
  };
}
