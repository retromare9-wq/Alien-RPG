// Würfeldialog: Wurf vorbereiten, würfeln, pushen, Stress Response.
import {
  MAX_STRESS, attrByKey, skillByKey, responsePenalties, rollPool, pushPool,
  countSuccesses, countStressOnes, stressGainOnPush, resolveStressResponse, clamp,
} from './rules.js';
import * as store from './store.js';
import { esc, render, stressRecord } from './app.js';

const $dlg = document.getElementById('roll-dialog');
let s = null;

$dlg.addEventListener('click', (e) => {
  if (e.target === $dlg) close(); // Tipp auf den Hintergrund
});
$dlg.addEventListener('close', () => {
  s = null;
  render();
});

export function openRoll({ id, attr, skill, weapon }) {
  s = { id, attr, skill, weapon, adjust: 0, phase: 'setup' };
  draw();
  if (!$dlg.open) $dlg.showModal();
}

function close() {
  if ($dlg.open) $dlg.close();
}

const char = () => store.get(s.id);

function pool(c) {
  const a = attrByKey(s.attr);
  const parts = [{ label: a.label, value: c.attributes[s.attr] }];
  if (s.skill) parts.push({ label: skillByKey(s.skill).label, value: c.skills[s.skill] });
  parts.push(...responsePenalties(c.responses, s.attr));
  const w = s.weapon !== null ? c.weapons[s.weapon] : null;
  if (w && Number(w.modifier)) parts.push({ label: w.name, value: Number(w.modifier) });
  if (s.adjust) parts.push({ label: 'Anpassung', value: s.adjust });
  const base = Math.max(1, parts.reduce((sum, p) => sum + p.value, 0));
  const stress = c.hasStress ? c.stress : 0;
  return { parts, base, stress };
}

function title(c) {
  const a = attrByKey(s.attr).label;
  const sk = s.skill ? skillByKey(s.skill).label : null;
  const w = s.weapon !== null ? c.weapons[s.weapon]?.name : null;
  return `${esc(c.name || 'Ohne Namen')}: ${sk ? `${a} + ${sk}` : a}${w ? ` (${esc(w)})` : ''}`;
}

const signed = (v) => (v > 0 ? `+${v}` : `${v}`);

function diceHtml(dice) {
  return dice.map((d) => {
    const cls = ['die', d.type];
    if (d.value === 6) cls.push('success');
    if (d.type === 'stress' && d.value === 1) cls.push('bane');
    if (s.animate && (d.rerolled || !s.pushed)) cls.push('anim');
    if (d.added) cls.push('added');
    return `<span class="${cls.join(' ')}">${d.value === 6 ? '✦' : d.type === 'stress' && d.value === 1 ? '☣' : d.value}</span>`;
  }).join('');
}

function setupHtml(c) {
  const { parts, base, stress } = pool(c);
  return `
    <div class="breakdown">
      ${parts.map((p, i) => `<span class="${p.value < 0 ? 'neg' : ''}">${i ? signed(p.value) : p.value} ${esc(p.label)}</span>`).join('')}
    </div>
    <div class="pool">
      <div class="pool-col">
        <span class="pool-label">Basiswürfel</span>
        <div class="stepper compact">
          <button class="btn-round" data-act="dlg-base" data-d="-1" ${base <= 1 ? 'disabled' : ''} aria-label="Basiswürfel verringern">−</button>
          <span class="pool-num base">${base}</span>
          <button class="btn-round" data-act="dlg-base" data-d="1" aria-label="Basiswürfel erhöhen">+</button>
        </div>
      </div>
      <div class="pool-col">
        <span class="pool-label">Stresswürfel</span>
        <span class="pool-num stress">${stress}</span>
      </div>
      <div class="pool-col">
        <span class="pool-label">Gesamt</span>
        <span class="pool-num total">${base + stress}</span>
      </div>
    </div>
    ${c.hasStress ? '' : '<p class="hint">NPC ohne Stress Level: keine Stresswürfel, kein Pushen.</p>'}
    <div class="dlg-actions">
      <button class="btn btn-primary wide big" data-act="dlg-roll">🎲 Würfeln</button>
      <button class="btn wide" data-act="dlg-close">Abbrechen</button>
    </div>`;
}

function resultHtml(c) {
  const successes = countSuccesses(s.dice);
  const ones = countStressOnes(s.dice);
  const fails = s.response?.actionFails;
  const canPush = c.hasStress && !c.responses.deflated && !s.pushed && ones === 0 && !s.initialOnes;
  const gain = Math.min(stressGainOnPush(c), MAX_STRESS - c.stress);

  let headline;
  if (fails) headline = '<div class="verdict fail">MESS UP<small>Die Aktion scheitert</small></div>';
  else if (successes) headline = `<div class="verdict ok">${successes} ${successes === 1 ? 'Erfolg' : 'Erfolge'}</div>`;
  else headline = '<div class="verdict fail">Kein Erfolg</div>';

  const info = [];
  if (s.pushed) info.push(`Gepusht: Stress ${signed(s.pushGain)} → ${s.stressAfterPush}.`);
  if (ones) info.push(`<b class="bane-text">☣ ${ones}× 1 auf ${ones === 1 ? 'Stresswürfel' : 'Stresswürfeln'}: Stress Response!</b>`);
  else if (c.hasStress) info.push('Keine 1 auf Stresswürfeln.');

  let actions = '';
  if (ones && !s.response) {
    actions += `<button class="btn btn-danger wide big" data-act="dlg-response">Stress Response würfeln<small>D6 + Stress ${c.stress} − Resolve ${c.resolve}</small></button>`;
  } else if (canPush && gain > 0) {
    actions += `<button class="btn btn-warn wide big" data-act="dlg-push">Pushen<small>Stress ${signed(gain)} (${c.stress} → ${c.stress + gain}), ${gain} ${gain === 1 ? 'Stresswürfel' : 'Stresswürfel'} mehr, Würfel ohne 6 neu würfeln</small></button>`;
  } else if (!s.pushed && !ones && c.hasStress) {
    const why = c.responses.deflated ? 'Deflated: Pushen nicht möglich.' : gain <= 0 ? 'Stress Level ist bereits auf dem Maximum.' : '';
    if (why) info.push(why);
  } else if (!c.hasStress) {
    info.push('NPCs pushen nie.');
  }

  let resp = '';
  if (s.response) {
    const r = s.response;
    resp = `<div class="response">
      <div class="resp-calc">D6 <b>${r.die}</b> + Stress <b>${r.stress}</b> − Resolve <b>${r.resolve}</b> = <b>${r.total}</b></div>
      <div class="resp-name">${esc(r.response.label)}</div>
      <p>${esc(r.note)}</p>
      ${r.stressDelta ? `<p class="hint">Stress ${signed(r.stressDelta)} → ${c.stress}</p>` : ''}
    </div>`;
  }

  return `
    <div class="dice">${diceHtml(s.dice)}</div>
    ${headline}
    <div class="info">${info.map((i) => `<p>${i}</p>`).join('')}</div>
    ${resp}
    <div class="dlg-actions">
      ${actions}
      <button class="btn wide" data-act="dlg-again">Neuer Wurf</button>
      <button class="btn wide" data-act="dlg-close">Schließen</button>
    </div>`;
}

function draw() {
  const c = char();
  if (!c) return close();
  $dlg.innerHTML = `
    <div class="dlg">
      <div class="dlg-head"><h3>${title(c)}</h3><button class="icon-btn" data-act="dlg-close" aria-label="Schließen">✕</button></div>
      ${s.phase === 'setup' ? setupHtml(c) : resultHtml(c)}
    </div>`;
  s.animate = false;
}

const buzz = (ms) => navigator.vibrate?.(ms);

export function handleRollAction(act, el) {
  if (!s && act !== 'dlg-close') return;
  const c = s && char();
  switch (act) {
    case 'dlg-close':
      close();
      return;
    case 'dlg-base': {
      const { base } = pool(c);
      const d = Number(el.dataset.d);
      if (base + d >= 1) s.adjust += d;
      break;
    }
    case 'dlg-roll': {
      const { base, stress } = pool(c);
      s.dice = rollPool(base, stress);
      s.initialOnes = countStressOnes(s.dice) > 0;
      s.pushed = false;
      s.response = null;
      s.phase = 'result';
      s.animate = true;
      buzz(40);
      break;
    }
    case 'dlg-push': {
      const gain = Math.min(stressGainOnPush(c), MAX_STRESS - c.stress);
      if (gain <= 0 || s.pushed) return;
      const after = store.update(c.id, (x) => { x.stress = clamp(x.stress + gain, 0, MAX_STRESS); });
      s.dice = pushPool(s.dice, gain);
      s.pushed = true;
      s.pushGain = gain;
      s.stressAfterPush = after.stress;
      s.animate = true;
      buzz(60);
      break;
    }
    case 'dlg-response': {
      if (s.response) return;
      const r = resolveStressResponse(c);
      store.update(c.id, (x) => {
        x.responses = r.responses;
        x.stress = clamp(x.stress + r.stressDelta, 0, MAX_STRESS);
        x.lastRoll = stressRecord(r);
      });
      s.response = r;
      buzz([80, 60, 80]);
      break;
    }
    case 'dlg-again':
      s.phase = 'setup';
      break;
    default:
      return;
  }
  draw();
}
