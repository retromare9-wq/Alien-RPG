// Aufruf: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rollPool, pushPool, countSuccesses, countStressOnes, lookupStressResponse,
  applyStressResponse, resolveStressResponse, responsePenalties, stressGainOnPush, canPushAtAll,
  deriveHealth, deriveResolve, deriveEncumbranceMax, parseWeight, encumbrance, pointWarnings,
  strongestRolls, resolvePanic, lookupPanic,
} from '../js/rules.js';

// Liefert nacheinander feste Würfelwerte (1–6).
const fixed = (...values) => { let i = 0; return () => (values[i++ % values.length] - 1) / 6 + 0.01; };
const char = (over = {}) => ({ hasStress: true, stress: 0, resolve: 0, responses: {}, ...over });

test('Pool: Basis- und Stresswürfel, mindestens ein Basiswürfel', () => {
  const dice = rollPool(0, 2, fixed(3));
  assert.equal(dice.filter((d) => d.type === 'base').length, 1);
  assert.equal(dice.filter((d) => d.type === 'stress').length, 2);
});

test('Erfolge zählen 6er auf allen Würfeln, 1er nur auf Stresswürfeln', () => {
  const dice = rollPool(3, 2, fixed(6, 1, 2, 6, 1));
  assert.equal(countSuccesses(dice), 2);
  assert.equal(countStressOnes(dice), 1);
});

test('Pushen würfelt nur Würfel ohne 6 neu und fügt Stresswürfel hinzu', () => {
  const dice = [{ type: 'base', value: 6 }, { type: 'base', value: 3 }, { type: 'stress', value: 4 }];
  const pushed = pushPool(dice, 1, fixed(5));
  assert.equal(pushed.length, 4);
  assert.equal(pushed[0].value, 6);
  assert.equal(pushed[0].rerolled, false);
  assert.equal(pushed[1].value, 5);
  assert.equal(pushed[3].type, 'stress');
  assert.equal(pushed[3].added, true);
});

test('Jumpy: Pushen gibt +2 Stress; Deflated und NPCs können nicht pushen', () => {
  assert.equal(stressGainOnPush(char()), 1);
  assert.equal(stressGainOnPush(char({ responses: { jumpy: true } })), 2);
  assert.equal(canPushAtAll(char({ responses: { deflated: true } })), false);
  assert.equal(canPushAtAll(char({ hasStress: false })), false);
});

test('Tabelle: ≤0 Keeping Cool, 1–6 Responses, 7+ Mess Up', () => {
  assert.equal(lookupStressResponse(-3).key, 'keepingCool');
  assert.equal(lookupStressResponse(0).key, 'keepingCool');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => lookupStressResponse(n).key),
    ['jumpy', 'tunnelVision', 'aggravated', 'shakes', 'frantic', 'deflated']);
  assert.equal(lookupStressResponse(7).key, 'messUp');
  assert.equal(lookupStressResponse(12).key, 'messUp');
});

test('Stress Response: D6 + Stress − Resolve', () => {
  const r = resolveStressResponse(char({ stress: 4, resolve: 2 }), fixed(3));
  assert.equal(r.total, 5);
  assert.equal(r.response.key, 'frantic');
  assert.equal(r.responses.frantic, true);
  assert.equal(r.stressDelta, 0);
});

test('Bereits vorhandene Response gibt +1 Stress', () => {
  const r = applyStressResponse(char({ responses: { shakes: true } }), lookupStressResponse(4));
  assert.equal(r.stressDelta, 1);
});

test('Deflated entfernt Jumpy; Jumpy wird ignoriert solange Deflated', () => {
  const a = applyStressResponse(char({ responses: { jumpy: true } }), lookupStressResponse(6));
  assert.equal(a.responses.deflated, true);
  assert.equal(a.responses.jumpy, false);
  const b = applyStressResponse(char({ responses: { deflated: true } }), lookupStressResponse(1));
  assert.equal(b.responses.jumpy, undefined);
  assert.equal(b.stressDelta, 0);
});

test('Mess Up: Aktion scheitert, +1 Stress', () => {
  const r = applyStressResponse(char(), lookupStressResponse(9));
  assert.equal(r.actionFails, true);
  assert.equal(r.stressDelta, 1);
});

test('Abzüge: Tunnel Vision −2 auf Wits', () => {
  assert.deepEqual(responsePenalties({ tunnelVision: true, shakes: true }, 'wits'), [{ label: 'Tunnel Vision', value: -2 }]);
  assert.deepEqual(responsePenalties({}, 'wits'), []);
});

test('Abgeleitete Werte: aufgerundet', () => {
  const a = { strength: 3, agility: 4, wits: 5, empathy: 2 };
  assert.equal(deriveHealth(a), 4);
  assert.equal(deriveResolve(a), 4);
  assert.equal(deriveEncumbranceMax(a), 6);
});

test('Encumbrance aus Gear, Waffen und Armor', () => {
  assert.equal(parseWeight('½'), 0.5);
  assert.equal(parseWeight('0,5'), 0.5);
  assert.equal(parseWeight(''), 0);
  const c = { gear: [{ weight: '1' }, { weight: '½' }], weapons: [{ weight: '2' }], armor: { weight: '1' } };
  assert.equal(encumbrance(c), 4.5);
});

test('Punkteprüfung', () => {
  const c = { attributes: { strength: 4, agility: 4, wits: 3, empathy: 3 }, skills: { stamina: 3, comtech: 3, command: 4 } };
  assert.deepEqual(pointWarnings(c, 14, 10), []);
  c.attributes.strength = 3;
  c.skills.command = 5;
  assert.equal(pointWarnings(c, 14, 10).length, 2);
});

test('Stärkste Würfe: Skills vor gleich starkem Attribut, Skill 0 zählt nicht', () => {
  const c = {
    attributes: { strength: 5, agility: 2, wits: 4, empathy: 2 },
    skills: { observation: 2, stamina: 0 },
    responses: {},
  };
  const top = strongestRolls(c, 2);
  assert.deepEqual(top.map((t) => [t.label, t.dice]), [['Observation', 6], ['Strength', 5]]);
});

test('Panik: Tabelle, Stressänderung und nächsthöhere Response', () => {
  assert.equal(lookupPanic(0).key, 'keepingCool');
  assert.equal(lookupPanic(1).key, 'spooked');
  assert.equal(lookupPanic(15).key, 'catatonic');
  const r = resolvePanic(char({ stress: 5, resolve: 2, panic: {} }), fixed(4));
  assert.equal(r.total, 7);
  assert.equal(r.response.key, 'freeze');
  assert.equal(r.panic.freeze, true);
  const b = resolvePanic(char({ stress: 5, resolve: 2, panic: { freeze: true } }), fixed(4));
  assert.equal(b.response.key, 'seekCover');
  assert.equal(b.bumped, true);
  assert.equal(b.stressDelta, -1);
  const s = resolvePanic(char({ stress: 0, resolve: 0, panic: {} }), fixed(1));
  assert.equal(s.response.key, 'spooked');
  assert.equal(s.stressDelta, 1);
});
