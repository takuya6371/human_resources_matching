import { screen } from './moderation.js';
import { CASES, HINTS, SEQUENCES } from './bench-data.js';

const rows = CASES.map(c => {
  const r = screen(c.t);
  const blocked = r.verdict === 'block';
  return { ...c, r, blocked, correct: blocked === c.bad, escalated: r.needsModel };
});

/* Conversations. A sequence passes when it ends in the state it should:
   a hand-over gets blocked somewhere, ordinary talk never does. */
const seqRows = SEQUENCES.map(seq => {
  const seen = [];
  let blockedAt = -1;
  seq.turns.forEach((m, i) => {
    const r = screen(m, { recent: seen });
    if (r.verdict === 'block' && blockedAt < 0) blockedAt = i;
    seen.push(m);
  });
  return { ...seq, blockedAt, correct: (blockedAt >= 0) === seq.bad };
});
const seqPass = seqRows.filter(r => r.correct).length;

/* Hints: must not block, must escalate. Blocking would be a false positive on
   wording too vague to act on; ignoring would be the miss that matters. */
const hintRows = HINTS.map(h => {
  const r = screen(h.t);
  return { ...h, r, ok: r.verdict === 'review' && r.needsModel };
});
const hintPass = hintRows.filter(h => h.ok).length;

const bad = rows.filter(r => r.bad);
const good = rows.filter(r => !r.bad);
const caught = bad.filter(r => r.blocked).length;
const falsePos = good.filter(r => r.blocked).length;
const escalated = rows.filter(r => !r.blocked && r.escalated).length;

const recall = (caught / bad.length) * 100;
const fpRate = (falsePos / good.length) * 100;
const modelRate = (escalated / rows.length) * 100;
const pct = n => n.toFixed(1) + '%';

const card = (v, label, extra = '') =>
  `<div><b>${v}</b><span>${label}</span>${extra ? `<div class="delta">${extra}</div>` : ''}</div>`;

document.getElementById('out').innerHTML = `
  <div class="scorecard">
    ${card(pct(recall), 'caught by rules', `${caught} of ${bad.length} violations`)}
    ${card(pct(fpRate), 'false positives', `${falsePos} of ${good.length} benign`)}
    ${card(pct(modelRate), 'need a model call', `baseline 100%`)}
    ${card(pct(100 - modelRate), 'model calls avoided', `per 100 messages`)}
    ${card(seqPass + '/' + seqRows.length, 'conversations correct', 'across-message cases')}
    ${card(hintPass + '/' + hintRows.length, 'hints escalated', 'too vague to block, too pointed to ignore')}
  </div>
  <table>
    <thead><tr><th>Hint — must escalate, not block</th><th>Result</th></tr></thead>
    <tbody>${hintRows.map(h => `
      <tr><td class="msg">${esc(h.t)}<br><span style="color:var(--ink-faint)">${esc(h.note)}</span></td>
      <td class="${h.ok ? 'ok' : 'miss'}">${esc(h.r.verdict)}${h.ok ? '' : ' ✕'}</td></tr>`).join('')}
    </tbody>
  </table>
  <table>
    <thead><tr><th>Conversation</th><th>Expected</th><th>Result</th></tr></thead>
    <tbody>${seqRows.map(r => `
      <tr>
        <td class="msg">${esc(r.turns.join('  →  '))}<br><span style="color:var(--ink-faint)">${esc(r.note)}</span></td>
        <td>${r.bad ? 'block' : 'allow'}</td>
        <td class="${r.correct ? 'ok' : 'miss'}">${r.blockedAt >= 0 ? 'blocked at turn ' + (r.blockedAt + 1) : 'allowed'}${r.correct ? '' : ' ✕'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <table>
    <thead><tr><th>Message</th><th>Expected</th><th>Verdict</th><th>Caught on</th><th>Model?</th></tr></thead>
    <tbody>${rows.map(r => `
      <tr>
        <td class="msg">${esc(r.t)}</td>
        <td>${r.bad ? 'block' : 'allow'}</td>
        <td class="${r.correct ? 'ok' : 'miss'}">${r.blocked ? 'block' : 'allow'}${r.correct ? '' : ' ✕'}</td>
        <td>${esc(r.r.categories.join(', ') || '—')}</td>
        <td>${!r.blocked && r.escalated ? 'yes' : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;

function esc(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
console.log({ recall, fpRate, modelRate, seqPass, seqTotal: seqRows.length });
