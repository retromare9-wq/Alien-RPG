// Aufruf: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rollPool, pushPool, countSuccesses, countStressOnes, lookupStressResponse,
  applyStressResponse, resolveStressResponse, responsePenalties, stressGainOnPush, canPushAtAll,
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
