import { screen } from './moderation.js';
import { TALENTS, COMPANIES, ADMIN, ALL_PEOPLE, personById, THREADS, PHRASEBOOK } from './data.js';
import { loadThreads, mutate, findThread, resetAll, watch, canSync } from './db.js';

/* ============================================================
   State
   ============================================================ */
const S = {
  me: 't-amara',
  thread: 'th-1',
  view: 'messages',
  threads: loadThreads(),
  log: [],                    // what the guardian did, newest first
  stats: { screened: 0, blockedByRules: 0, sentToModel: 0, blockedByModel: 0 },
  strikes: {},                // threadId -> attempts blocked before sending
};

/* Configuration, declared before anything reads it.

   These sat further down the file until a render read one of them. A `const`
   read before its declaration throws rather than returning undefined, so the
   first render() died, boot() never reached the line that registers the
   cross-tab listener, and live sync was silently dead while the page still
   looked perfectly fine. Configuration goes at the top. */

const GEMINI_KEY = (window.AFRITALENT_CHAT || {}).GEMINI_API_KEY || '';
const GEMINI_MODEL = (window.AFRITALENT_CHAT || {}).GEMINI_MODEL || 'gemini-3.6-flash';

/* ?mock=block answers the second tier without a key, so the model-catch step of
   a demo can be rehearsed offline. The guardian panel says when it is on. */
const MOCK = new URLSearchParams(location.search).get('mock');

/* Which engine is doing the translating. Shown in the guardian panel, because
   "is translation on?" should be answerable by looking rather than by sending a
   message and waiting to see what appears. */
let ENGINE = 'not used yet';
let lastFailure = '';

/* Whether tier 2 can actually answer. Shown in the panel, because "will it
   catch me if I improvise?" is a question worth being able to see. */
const SECOND_TIER = !!GEMINI_KEY;

const MODERATION_PROMPT = `You moderate messages between a job candidate and a recruiter on a hiring platform called AfriTalent.

Flag a message only when it shares or requests contact details of any kind, or proposes continuing the conversation away from AfriTalent, however indirectly ("somewhere easier", "you know where to find me").

Do not flag ordinary recruiting talk: salaries, dates, times, headcounts, technologies, company locations, visa questions, or arranging an interview. Numbers that are years, money, versions or quantities are not contact details.

The obvious cases are caught before you see them. You are here for wording that slips past a pattern match. Judge intent, not vocabulary.

Reply with JSON only: {"flag": boolean, "category": "contact"|"offplatform"|"none", "confidence": 0-1, "reason": "one short sentence"}`;

const $ = id => document.getElementById(id);
/* Two tabs writing in the same millisecond must not produce the same id. */
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : 'm' + Date.now() + Math.random().toString(36).slice(2));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const isJa = s => /[぀-ヿ一-龯]/.test(s);
const clock = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const iAmAdmin = () => S.me === 'admin';
/* An admin sees every conversation, not only the ones already in trouble —
   watching one go wrong is the point of having the tab open. */
const myThreads = () => iAmAdmin()
  ? S.threads
  : S.threads.filter(t => t.talent === S.me || t.company === S.me);
const threadById = id => S.threads.find(t => t.id === id);
const other = t => personById(t.talent === S.me ? t.company : t.talent);
/* For an admin there is no "other side" — show the pairing instead. */
const counterpart = t => iAmAdmin() ? personById(t.talent) : other(t);
const companyOf = t => personById(t.company);
const nameOf = p => p ? (p.roman ? `${p.name}（${p.roman}）` : p.name) : '';

/* ============================================================
   Boot
   ============================================================ */
function boot() {
  // Each tab remembers who it is, so tab A stays the talent and tab B the
  // company across reloads.
  const saved = sessionStorage.getItem('afritalent_persona') || localStorage.getItem('afritalent_persona');
  if (saved && personById(saved)) S.me = saved;
  $('persona').innerHTML =
    `<optgroup label="Talent">${TALENTS.map(p =>
      `<option value="${p.id}">${esc(p.name)} · ${esc(p.title)}</option>`).join('')}</optgroup>` +
    `<optgroup label="Company">${COMPANIES.map(p =>
      `<option value="${p.id}">${esc(p.roman)} · ${esc(p.company)}</option>`).join('')}</optgroup>` +
    `<optgroup label="Platform"><option value="admin">${esc(ADMIN.name)}</option></optgroup>`;
  $('persona').value = S.me;
  $('persona').addEventListener('change', e => {
    S.me = e.target.value;
    sessionStorage.setItem('afritalent_persona', S.me);   // per tab
    localStorage.setItem('afritalent_persona', S.me);     // default for new tabs
    S.view = iAmAdmin() ? 'admin' : 'messages';
    const mine = myThreads();
    S.thread = mine[0]?.id || null;
    render();
  });
  $('adminlink').addEventListener('click', () => {
    S.view = S.view === 'admin' ? 'messages' : 'admin';
    render();
  });
  $('resetbtn')?.addEventListener('click', () => {
    if (!confirm('Reset the demo?\n\nEvery conversation goes back to how it started, in every tab.')) return;
    doReset();
  });

  // ?reset=1 does the same thing without a click, for when a stale cached copy
  // of this file has left the button inert.
  if (new URLSearchParams(location.search).get('reset') === '1') doReset();

  render();

  // The other tab wrote something: pick it up.
  watch(() => {
    S.threads = loadThreads();
    if (!S.threads.some(t => t.id === S.thread)) S.thread = myThreads()[0]?.id || null;
    render();
  });
}

function doReset() {
  S.threads = resetAll();
  S.strikes = {};
  S.log = [];
  S.stats = { screened: 0, blockedByRules: 0, sentToModel: 0, blockedByModel: 0 };
  S.view = iAmAdmin() ? S.view : 'messages';
  S.thread = myThreads()[0]?.id || null;
  render();
  // If the state already looked seeded, nothing on screen changes and the
  // button feels broken. Say that it happened.
  toast('Everything is back to how it started.');
}

let toastTimer = null;
function toast(text) {
  let el = $('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}

/* ============================================================
   Render
   ============================================================ */
function render() {
  const me = personById(S.me);
  const badge = $('whoami');
  if (badge) {
    badge.textContent = me?.company || (me?.role === 'admin' ? 'AfriTalent' : (me?.place || ''));
    badge.classList.toggle('hidden', !badge.textContent);
  }
  const admin = S.view === 'admin';
  $('shell').classList.toggle('hidden', admin);
  $('adminview').classList.toggle('hidden', !admin);
  $('viewname').textContent = admin ? 'Trust & Safety' : 'Messages';
  $('adminlink').textContent = admin ? 'Back to messages' : 'Trust & Safety';
  if (admin) return renderAdmin();
  renderThreads();
  renderConversation();
  renderSide();
}

function renderThreads() {
  const list = myThreads();
  $('threadcount').textContent = list.length;
  if (!list.length) {
    $('threadlist').innerHTML = '<div class="empty">No conversations for this account.</div>';
    return;
  }
  $('threadlist').innerHTML = list.map(t => {
    const p = counterpart(t);
    const co = companyOf(t);
    const last = [...t.messages].reverse().find(x => !x.system);
    const locked = t.status === 'flagged';
    const pills = [
      locked ? '<span class="pill flag">flagged</span>' : '',
      t.supportRequested ? '<span class="pill support">support</span>' : '',
    ].join('');
    // An admin is looking at a pairing; everyone else is looking at a person.
    const title = iAmAdmin()
      ? `${esc(personById(t.talent).roman || personById(t.talent).name)} ${personById(t.talent).flag || ''} ` +
        `<span style="color:var(--ink-faint)">·</span> ${esc(co.roman)} ${co.flag || ''}`
      : `${esc(p.roman || p.name)} <span class="flag">${p.flag || ''}</span>`;
    return `<button class="thread ${t.id === S.thread ? 'on' : ''} ${locked ? 'locked' : ''}" data-t="${t.id}">
      <span class="av">${esc(p.initials)}</span>
      <span class="meta">
        <span class="nm">${title} ${pills}</span>
        <span class="sub"><span class="co">${esc(co.company)}</span></span>
        <span class="prev">${
          locked && !iAmAdmin() ? 'Hidden pending review'
          : last ? esc(last.text.slice(0, 60))
          : '<span style="opacity:.6">No messages yet</span>'}</span>
      </span>
    </button>`;
  }).join('');
  $('threadlist').querySelectorAll('.thread').forEach(b =>
    b.addEventListener('click', () => { S.thread = b.dataset.t; render(); }));
}

function renderConversation() {
  const t = threadById(S.thread);
  if (!t) { $('conv').innerHTML = '<div class="empty">Select a conversation.</div>'; return; }
  const p = counterpart(t);
  const co = companyOf(t);
  const talent = personById(t.talent);
  const locked = t.status === 'flagged';

  const head = iAmAdmin()
    ? `<div class="convhead">
        <span class="av">${esc(talent.initials)}</span>
        <div style="flex:1">
          <h2>${esc(talent.name)} ${talent.flag || ''}
            <span style="color:var(--ink-faint);font-weight:400"> and </span>
            ${esc(co.roman)} ${co.flag || ''} <span class="co">${esc(co.company)}</span></h2>
          <p>${t.messages.length} messages · ${esc(t.status === 'flagged' ? 'held for review' : 'live')}</p>
        </div>
        <span class="pill new">monitoring</span>
      </div>`
    : `<div class="convhead">
        <span class="av">${esc(p.initials)}</span>
        <div style="flex:1">
          <h2>${esc(nameOf(p))} ${p.flag || ''}${
            p.company ? ` <span class="co">${esc(p.company)}</span>` : ''}</h2>
          <p>${esc(p.company ? p.title : `${p.title} · ${p.place}`)}</p>
        </div>
        ${locked ? '' :
          `<button class="btn ghost sm" id="supportbtn" ${t.supportRequested ? 'disabled' : ''}>
            ${t.supportRequested ? 'Support joined' : 'Request support'}</button>`}
      </div>`;

  // Nobody should have to read the docs to find out a moderator is in the room.
  const presence = `<div class="sys watching">
      <span class="who">AfriTalent AI</span>
      ${iAmAdmin()
        ? 'Reading this conversation as it happens. Contact details and plans to move off AfriTalent are stopped before they send.'
        : 'I am in this conversation. I check every message for contact details and for plans to move ' +
          'off AfriTalent, and I stop them before they send. I do not read anything else, and nobody ' +
          'is watching your conversation unless something is flagged.'}
      ${iAmAdmin() ? '' : `<div class="tr jp" style="border:none;padding-left:0;margin-top:8px">
        このやり取りにはアフリタレントAIが常駐しています。連絡先の共有やプラットフォーム外への誘導は送信前に停止されます。</div>`}
    </div>`;

  const empty = t.messages.length ? '' : `<div class="sys">
      ${iAmAdmin()
        ? 'Nothing has been said in this conversation yet.'
        : 'No messages yet. Say hello — whatever you write is translated for the other side.'}
    </div>`;

  const body = `<div class="scroll"><div class="msgs" id="msgs">
      ${presence}
      ${t.messages.map(msgHtml).join('')}
      ${empty}
    </div></div>`;

  const foot = iAmAdmin()
    ? `<div class="composer"><div class="locked-note" style="border-color:var(--hairline)">
         <b style="color:var(--ink)">You are watching, not taking part.</b><br>
         Trust &amp; Safety accounts read every conversation live and cannot post into them.
         Use the Trust &amp; Safety view to release or clear a thread.
       </div></div>`
    : locked
    ? `<div class="composer"><div class="locked-note">
         <b>This conversation is on hold.</b><br>
         AfriTalent AI flagged a message for taking the conversation off the platform. Trust &amp; Safety
         are reviewing it, usually within a few hours. Neither side can send until that is done —
         nothing you have already sent has been deleted.
       </div></div>`
    : `<div class="composer">
         <div id="warnslot"></div>
         <div class="row">
           <textarea id="input" rows="1" placeholder="${
             personById(S.me).lang === 'ja' ? 'メッセージを入力…' : 'Write a message…'}"></textarea>
           <button class="btn" id="send">Send</button>
         </div>
         <p class="hint">Every message is translated for the other side. Contact details and plans to move
           off AfriTalent are blocked before they send.</p>
       </div>`;

  $('conv').innerHTML = head + body + foot;
  const box = $('msgs')?.parentElement;
  if (box) box.scrollTop = box.scrollHeight;

  resumeTranslations();
  $('conv').querySelectorAll('[data-retry]').forEach(b =>
    b.addEventListener('click', () => retryTranslation(b.dataset.retry)));
  $('supportbtn')?.addEventListener('click', requestSupport);
  const input = $('input');
  if (input) {
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 150) + 'px';
      liveWarn(input.value);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    input.focus();
  }
  $('send')?.addEventListener('click', send);
}

function msgHtml(msg) {
  if (msg.system) {
    return `<div class="sys ${esc(msg.system)}">
      <span class="who">${msg.system === 'support' ? 'AfriTalent support' : 'AfriTalent AI'}</span>
      ${esc(msg.text)}
      ${msg.translation ? `<div class="tr ${isJa(msg.translation) ? 'jp' : ''}" style="border:none;padding-left:0;margin-top:8px">${esc(msg.translation)}</div>` : ''}
    </div>`;
  }
  const mine = msg.from === S.me;
  const author = personById(msg.from);
  const ja = isJa(msg.text);
  const mineToTranslate = msg.from === S.me;
  const trPending = !msg.translation && !failed.has(msg.id) && (mineToTranslate || inFlight.has(msg.id));
  const trAbsent = !msg.translation && !trPending;
  return `<div class="msg ${mine ? 'mine' : ''}">
    <div class="bubble ${ja ? 'jp' : ''}">${esc(msg.text)}</div>
    <div class="tr ${msg.translation && isJa(msg.translation) ? 'jp' : ''}" data-tr="${msg.id}">${
        msg.translation ? `<span class="lbl">${isJa(msg.translation) ? '日本語' : 'English'}</span>${esc(msg.translation)}`
      : trAbsent ? `<span class="lbl">translation</span><button class="retry" data-retry="${msg.id}">${esc(lastFailure || 'could not translate')} · retry</button>`
      : `<span class="lbl">${ja ? 'English' : '日本語'}</span><span style="opacity:.6">translating…</span>`}
      </div>
    <div class="stamp">${esc(mine ? 'You' : (author?.roman || author?.name || ''))}${
      !mine && author?.company ? ` <span class="co">${esc(author.company)}</span>` : ''} · ${clock(msg.at)}</div>
  </div>`;
}

function renderSide() {
  const t = threadById(S.thread);
  const s = S.stats;
  const avoided = s.screened ? Math.round((1 - s.sentToModel / s.screened) * 100) : 100;
  $('guardstate').textContent = t?.status === 'flagged' ? 'thread held' : 'watching';
  $('sidepanel').innerHTML = `
    ${MOCK ? `<div class="block" style="border-left:3px solid var(--pending)">
      <h3 style="color:var(--pending)">Mock mode</h3>
      <p style="font-size:12.5px;color:var(--ink-soft);margin:0;line-height:1.55">
        <code>?mock=${esc(MOCK)}</code> is set, so the second tier answers without calling a model.
        Remove it from the URL to use the real endpoint.</p></div>` : ''}
    <div class="block">
      <h3>Session</h3>
      <div class="kv"><span>Messages</span><span>${canSync() ? 'shared across tabs' : 'this tab only'}</span></div>
      ${canSync() ? `<p style="font-size:12px;color:var(--ink-faint);margin:8px 0 0;line-height:1.5">
        Open a second tab, pick a different account, and the two talk to each other.
        Everything is kept until an admin clears it.</p>`
      : `<p style="font-size:12px;color:var(--seal);margin:8px 0 0;line-height:1.5">
        This browser is blocking site storage, so tabs cannot see each other.
        Turn off private browsing, or allow storage for this site.</p>`}
    </div>
    <div class="block">
      <h3>What it is doing</h3>
      <p style="font-size:13px;color:var(--ink-soft);margin:0 0 14px;line-height:1.6">
        Every message is checked against the platform rules before it sends. Anything the rules clear
        but that still reads like an attempt goes to the second tier. Everything else costs nothing.
      </p>
      <div class="kv"><span>Translation</span><span style="color:${
        /unavailable|no key/.test(ENGINE) ? 'var(--seal)' : ENGINE === 'not used yet' ? 'var(--ink-soft)' : 'var(--ok)'
      }">${esc(ENGINE)}</span></div>
      <div class="kv"><span>Rules</span><span style="color:var(--ok)">always on</span></div>
      <div class="kv"><span>Second tier</span><span style="color:${
        MOCK ? 'var(--pending)' : SECOND_TIER ? 'var(--ok)' : 'var(--seal)'}">${
        MOCK ? 'mocked' : SECOND_TIER ? 'armed' : 'not configured'}</span></div>
      ${SECOND_TIER || MOCK ? '' : `<p style="font-size:12px;color:var(--seal);margin:8px 0 0;line-height:1.5">
        Wording with no pattern in it — "you know what I mean" — will pass. Add a key to
        <code>chat-config.js</code>, or use <code>?mock=block</code>.</p>`}
    </div>
    <div class="block">
      <h3>This session</h3>
      <div class="kv"><span>Messages screened</span><span>${s.screened}</span></div>
      <div class="kv"><span>Stopped by rules</span><span>${s.blockedByRules}</span></div>
      <div class="kv"><span>Sent to the model</span><span>${s.sentToModel}</span></div>
      <div class="kv"><span>Caught by the model</span><span>${s.blockedByModel}</span></div>
      <div class="meter"><i style="width:${avoided}%"></i></div>
      <div class="kv"><span>Model calls avoided</span><span>${avoided}%</span></div>
    </div>
    <div class="block">
      <h3>Recent decisions</h3>
      ${S.log.length ? S.log.slice(0, 12).map(l => `
        <div class="log"><span class="v ${l.verdict}">${l.verdict}</span>
          <span class="t">${clock(l.at)}</span><br>${esc(l.text.slice(0, 70))}
          ${l.reason ? `<br><span style="color:var(--ink-faint)">${esc(l.reason)}</span>` : ''}
        </div>`).join('')
        : '<p style="font-size:12px;color:var(--ink-faint);margin:0">Nothing yet. Try sending a phone number.</p>'}
    </div>`;
}

function renderAdmin() {
  const cases = S.threads.filter(t => t.status === 'flagged' || t.supportRequested);
  $('adminview').innerHTML = `
    <h1 class="page" style="font-size:28px;margin:0 0 8px">Trust &amp; Safety</h1>
    <p class="lede" style="margin:0 0 28px">Conversations the guardian put on hold, and requests for a human
      intermediary. A held conversation is invisible to both sides until someone here decides.</p>
    ${cases.length ? cases.map(t => {
      const talent = personById(t.talent), company = personById(t.company);
      const held = t.status === 'flagged';
      return `<div class="case ${held ? 'open' : ''}">
        <h3>${esc(talent.name)} ${talent.flag} · ${esc(company.roman)} ${company.flag}</h3>
        <div class="sub">${esc(company.company)} · ${t.messages.length} messages ·
          ${held ? `held ${clock(t.flag?.at || Date.now())}` : 'support requested'}</div>
        ${held ? `
          <div><span class="pill flag">${esc(t.flag.by === 'model' ? 'caught by model' : 'caught by rules')}</span>
            <span class="pill flag">${esc(t.flag.category)}</span></div>
          <div class="quote">${esc(t.flag.quote)}</div>
          <p style="font-size:13px;color:var(--ink-soft);margin:0">${esc(t.flag.reason)}</p>
          <div class="acts">
            <button class="btn sm" data-release="${t.id}">Release conversation</button>
            <button class="btn ghost sm" data-warn="${t.id}">Release with a warning</button>
            <button class="btn ghost sm" data-wipe="${t.id}">Clear all messages</button>
          </div>` : `
          <p style="font-size:13px;color:var(--ink-soft);margin:0 0 12px">
            ${esc(talent.name)} asked for an intermediary. A team member is in the thread.</p>
          <div class="acts"><button class="btn ghost sm" data-wipe="${t.id}">Clear all messages</button></div>`}
      </div>`;
    }).join('') : '<div class="empty">Nothing needs attention.</div>'}`;

  $('adminview').querySelectorAll('[data-release]').forEach(b =>
    b.addEventListener('click', () => releaseThread(b.dataset.release, false)));
  $('adminview').querySelectorAll('[data-warn]').forEach(b =>
    b.addEventListener('click', () => releaseThread(b.dataset.warn, true)));
  $('adminview').querySelectorAll('[data-wipe]').forEach(b =>
    b.addEventListener('click', () => wipeThread(b.dataset.wipe)));
}

/* ============================================================
   Sending
   ============================================================ */
function recentFrom(t, who) {
  return t.messages.filter(m => m.from === who && !m.system).slice(-4).map(m => m.text);
}

function liveWarn(text) {
  const slot = $('warnslot');
  const input = $('input');
  if (!slot || !input) return;
  const t = threadById(S.thread);
  const r = screen(text, { recent: recentFrom(t, S.me) });
  const bad = r.verdict === 'block';
  input.classList.toggle('bad', bad);
  slot.innerHTML = bad
    ? `<div class="warn"><b>This will not send.</b> It looks like it contains ${esc(r.reason)}.
        Everything for this role stays on AfriTalent — that is what lets us step in if something goes wrong.
        If you need to arrange something directly, use <b>Request support</b>.</div>`
    : '';
  return r;
}

async function send() {
  const input = $('input');
  const text = input.value.trim();
  if (!text) return;
  const t = threadById(S.thread);
  if (!t || t.status === 'flagged') return;

  S.stats.screened++;
  const rules = screen(text, { recent: recentFrom(t, S.me) });

  // Tier 1 — stopped before it is ever delivered.
  if (rules.verdict === 'block') {
    S.stats.blockedByRules++;
    S.strikes[t.id] = (S.strikes[t.id] || 0) + 1;
    S.log.unshift({ verdict: 'block', at: Date.now(), text, reason: 'rules · ' + rules.reason });
    liveWarn(text);

    if (S.strikes[t.id] >= 3) {
      await holdThread(t, {
        by: 'rules', category: rules.categories[0] || 'contact', quote: text,
        reason: `Three attempts to share contact details in this conversation. Blocked each time; ` +
                `escalated on the third.`,
      });
      render();
      return;
    }
    renderSide();
    return;
  }

  // Delivered optimistically, then checked. Tier 2 only if the rules asked.
  const msg = { id: newId(), from: S.me, text, at: Date.now(), translation: undefined };
  t.messages.push(msg);
  input.value = '';
  input.style.height = 'auto';
  liveWarn('');
  renderConversation();
  renderThreads();

  // Persist, then adopt the row id so the translation lands on the same record
  // the other side is reading.
  S.threads = mutate(threads => { findThread(threads, t.id)?.messages.push(msg); });
  translate(msg, t);

  if (!rules.needsModel) {
    S.log.unshift({ verdict: 'clear', at: Date.now(), text, reason: 'rules · no signal' });
    renderSide();
    return;
  }

  S.stats.sentToModel++;
  S.log.unshift({ verdict: 'review', at: Date.now(), text, reason: 'sent to the model' });
  renderSide();

  const out = await callModerate(text);
  if (out.verdict === 'block') {
    S.stats.blockedByModel++;
    msg.blockedByModel = true;
    S.log.unshift({ verdict: 'block', at: Date.now(), text, reason: 'model · ' + (out.reason || 'off-platform') });
    await holdThread(t, { by: 'model', category: out.categories[0] || 'intent', quote: text,
      reason: out.reason || 'Proposes moving the conversation off AfriTalent.' });
    render();
  } else {
    S.log.unshift({
      verdict: out.modelUnavailable ? 'review' : 'clear', at: Date.now(), text,
      reason: out.modelUnavailable
        ? 'escalated, but the second tier is not configured — NOT checked'
        : 'second tier · no concern' });
    renderSide();
  }
}

async function holdThread(t, flag) {
  t.status = 'flagged';
  t.flag = { ...flag, at: Date.now() };
  const notice = {
    id: newId(), system: 'stop', at: Date.now(),
    text: `This conversation has been put on hold. A message looked like an attempt to move the ` +
          `conversation off AfriTalent, which the platform does not allow — it is how people lose ` +
          `the protection they signed up for. Trust & Safety have been notified and will review it.`,
    translation: `このやり取りは一時的に保留されました。プラットフォーム外へ移行しようとする内容が含まれていたためです。` +
                 `運営チームが確認いたします。`,
  };
  t.messages.push(notice);
  S.threads = mutate(threads => {
    const x = findThread(threads, t.id);
    if (!x) return;
    x.status = 'flagged'; x.flag = t.flag; x.messages.push(notice);
  });
}

async function releaseThread(id, withWarning) {
  const t = threadById(id);
  if (!t) return;
  t.status = 'open';
  t.flag = null;
  S.strikes[t.id] = 0;
  const notice = {
    id: newId(), system: 'support', at: Date.now(),
    text: withWarning
      ? 'Trust & Safety have reviewed this conversation and reopened it. Please keep everything about this role on AfriTalent — a second flag will pause the account, not just the thread.'
      : 'Trust & Safety have reviewed this conversation and reopened it. No further action needed.',
    translation: withWarning
      ? '運営チームの確認により、このやり取りを再開しました。今後もすべてのやり取りはプラットフォーム内でお願いいたします。'
      : '運営チームの確認により、このやり取りを再開しました。対応は不要です。',
  };
  t.messages.push(notice);
  S.threads = mutate(threads => {
    const x = findThread(threads, t.id);
    if (!x) return;
    x.status = 'open'; x.flag = null; x.messages.push(notice);
  });
  render();
}

/* Admin only: wipe a conversation. The thread stays, the messages go. */
async function wipeThread(id) {
  const t = threadById(id);
  if (!t) return;
  if (!confirm(`Clear every message in this conversation?\n\nThe thread stays open for both people. The messages cannot be recovered.`)) return;
  S.strikes[t.id] = 0;
  S.threads = mutate(threads => {
    const x = findThread(threads, t.id);
    if (!x) return;
    x.messages = []; x.status = 'open'; x.flag = null;
  });
  render();
}

async function requestSupport() {
  const t = threadById(S.thread);
  if (!t || t.supportRequested) return;
  t.supportRequested = true;
  const notice = {
    id: newId(), system: 'support', at: Date.now(),
    text: `${personById(S.me).roman || personById(S.me).name} asked for an AfriTalent intermediary. ` +
          `Someone from our team has joined and can see the conversation from here on. ` +
          `They can help with anything you would rather not raise directly.`,
    translation: `アフリタレントの担当者が参加しました。以降のやり取りを確認し、直接お話ししにくい事柄もサポートいたします。`,
  };
  t.messages.push(notice);
  S.threads = mutate(threads => {
    const x = findThread(threads, t.id);
    if (!x) return;
    x.supportRequested = true; x.messages.push(notice);
  });
  render();
}

/* ============================================================
   Translation — phrasebook first, then the endpoint, then quiet
   ============================================================ */
const trCache = new Map();

/* Translation is done by a tool, not a model.

   Chrome and Edge ship an on-device Translator: no key, no network, no tokens,
   and it answers in milliseconds. That is what runs here. The phrasebook covers
   stock phrases instantly, and a Gemini key — if one happens to be configured —
   is the last resort rather than the first.

   The property that matters is that every message ENDS somewhere. A translation
   that never resolves leaves "translating…" under a message for ever, which is
   what happened when a thread was held mid-flight: the view was repainted from
   storage where the field was still empty, and nothing ever went back for it.
   So the outcome — the text, or the fact that there is not one — is written to
   the shared copy, and anything still pending after a render is picked up. */

const inFlight = new Set();
const failed = new Set();      // this session only — never written to storage
const translators = new Map();

/* Which engine is actually doing the work. Shown in the guardian panel, because
   "is translation on?" should be answerable by looking rather than by sending a
   message and waiting to see. */
/* Every call is on a deadline. The on-device translator can sit there
   indefinitely — availability() alone never returned in testing — and a promise
   that never settles is what pinned "translating…" under a message. */
const deadline = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out')), ms)),
]);

async function browserTranslator(from, to) {
  const key = from + '>' + to;
  if (translators.has(key)) return translators.get(key);
  if (typeof Translator === 'undefined') { translators.set(key, null); return null; }
  try {
    const state = await deadline(
      Translator.availability({ sourceLanguage: from, targetLanguage: to }), 2500, 'availability');
    if (state === 'unavailable') { translators.set(key, null); return null; }
    const t = await deadline(
      Translator.create({ sourceLanguage: from, targetLanguage: to }), 8000, 'create');
    translators.set(key, t);
    return t;
  } catch (_) {
    translators.set(key, null);
    return null;
  }
}

async function translate(msg) {
  if (!msg || msg.translation || inFlight.has(msg.id) || failed.has(msg.id)) return;
  inFlight.add(msg.id);
  try {
    const to = isJa(msg.text) ? 'en' : 'ja';
    const from = to === 'en' ? 'ja' : 'en';
    const cacheKey = to + '|' + msg.text;

    let out = PHRASEBOOK[msg.text.trim().toLowerCase()] || trCache.get(cacheKey) || '';
    let via = out ? 'phrasebook' : '';

    if (!out) {
      const tool = await browserTranslator(from, to);
      if (tool) {
        try {
          out = (await deadline(tool.translate(msg.text), 8000, 'translate')).trim();
          if (out) via = 'on-device';
        } catch (_) {}
      }
    }
    let failure = '';
    if (!out && GEMINI_KEY) {
      const g = await geminiTranslate(msg.text, to);
      if (g.text) { out = g.text; via = g.model; }
      // 429 is "you are out of quota today", which is a completely different
      // thing from "this browser cannot translate" — and the only one of the
      // two the reader can do something about.
      else if (g.status === 429) failure = 'quota exceeded — try again later';
      else if (g.status) failure = 'translation service returned ' + g.status;
    }

    if (out) {
      msg.translation = out;
      trCache.set(cacheKey, out);
      storeTranslation(msg.id, out);      // only successes are written down
      if (via && via !== 'phrasebook') setEngine(via);
    } else {
      // A failure is a fact about right now, not about the message. Keeping it
      // in memory means a reload — or a key added afterwards — tries again,
      // instead of the message being marked untranslatable for ever.
      failed.add(msg.id);
      lastFailure = failure || (GEMINI_KEY ? 'unavailable' : 'no key, no on-device translator');
      setEngine(lastFailure);
    }
    paintTranslation(msg);
  } finally {
    inFlight.delete(msg.id);
  }
}

function setEngine(v) {
  if (ENGINE === v) return;
  ENGINE = v;
  renderSide();
}

function storeTranslation(id, value) {
  S.threads = mutate(threads => {
    for (const th of threads) {
      const m = th.messages.find(x => x.id === id);
      if (m) { m.translation = value; return; }
    }
  });
}

/* Only the tab that sent a message translates it. Every tab doing it meant
   three clients racing on the same message, three times the API calls, and a
   late writer overwriting a translation another tab had already stored. The
   others simply render what is saved.

   The exception is a message whose sender never managed it: anyone reading can
   press retry, which is what the link under it is for. */
function resumeTranslations() {
  const t = threadById(S.thread);
  if (!t) return;
  t.messages.forEach(m => {
    if (m.system) return;
    if (m.translation) { failed.delete(m.id); return; }   // somebody got it
    if (m.from !== S.me) return;                          // not ours to do
    if (inFlight.has(m.id) || failed.has(m.id)) return;
    translate(m);
  });
}

/** Let someone click a failed line to try it again. */
function retryTranslation(id) {
  const t = threadById(S.thread);
  const m = t?.messages.find(x => x.id === id);
  if (!m) return;
  failed.delete(m.id);
  m.translation = undefined;
  translate(m);
  paintTranslation(m);
}

/* Models share a project quota but not a per-model one, so a rate-limited
   flagship does not mean the account is out. Fall through the list rather than
   failing the message. */
const TRANSLATE_MODELS = [GEMINI_MODEL, 'gemini-3.1-flash-lite', 'gemini-3-flash-preview'];

async function geminiTranslate(text, to) {
  const target = to === 'en' ? 'English' : 'Japanese';
  let lastStatus = 0;

  for (const model of TRANSLATE_MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GEMINI_KEY },
        body: JSON.stringify({
          model, temperature: 0.1, max_completion_tokens: 600, reasoning_effort: 'low',
          messages: [
            { role: 'system', content: `Translate into ${target}. One turn of a conversation between a ` +
              `job candidate and a recruiter. Natural and business-polite — in Japanese use です・ます. ` +
              `Translate only: no notes, no romaji, no quotation marks.` },
            { role: 'user', content: text.slice(0, 1500) },
          ],
        }),
        signal: AbortSignal.timeout(25000),
      });
      lastStatus = r.status;
      if (r.status === 429 || r.status === 404) continue;   // try the next model
      if (!r.ok) break;
      const out = ((await r.json()).choices?.[0]?.message?.content || '').trim();
      if (out) return { text: out, model };
    } catch (_) { /* try the next one */ }
  }
  return { text: '', status: lastStatus };
}

function paintTranslation(msg) {
  const el = document.querySelector(`[data-tr="${msg.id}"]`);
  if (!el) return;
  if (!msg.translation) {
    el.classList.remove('jp');
    el.innerHTML = failed.has(msg.id)
      ? `<span class="lbl">translation</span><button class="retry" data-retry="${msg.id}">${esc(lastFailure || 'could not translate')} · retry</button>`
      : `<span class="lbl">translation</span><span style="opacity:.6">translating…</span>`;
    const b = el.querySelector('[data-retry]');
    if (b) b.addEventListener('click', () => retryTranslation(msg.id));
    return;
  }
  el.classList.toggle('jp', isJa(msg.translation));
  el.innerHTML = `<span class="lbl">${isJa(msg.translation) ? '日本語' : 'English'}</span>${esc(msg.translation)}`;
}


async function callModerate(text) {
  if (MOCK === 'block') {
    await new Promise(r => setTimeout(r, 700));
    return { verdict: 'block', by: 'model', categories: ['intent'],
             reason: 'Mock second tier (?mock=block): treated as an attempt to move off-platform.' };
  }
  if (MOCK === 'clear') return { verdict: 'clear', by: 'model', categories: [] };
  if (!GEMINI_KEY) return { verdict: 'clear', by: 'rules-only', categories: [], modelUnavailable: true };

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GEMINI_KEY },
      body: JSON.stringify({
        model: GEMINI_MODEL, temperature: 0, max_completion_tokens: 400, reasoning_effort: 'low',
        messages: [
          { role: 'system', content: MODERATION_PROMPT },
          { role: 'user', content: String(text).slice(0, 1200) },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const out = JSON.parse((await r.json()).choices?.[0]?.message?.content || '{}');
    return {
      verdict: out.flag ? 'block' : 'clear',
      by: 'model',
      categories: out.flag ? [out.category === 'contact' ? 'contact' : 'intent'] : [],
      reason: out.reason || '',
    };
  } catch (e) {
    // Fail open: the rules already cleared this message, and dropping a
    // candidate's words because a moderation call timed out is the worse harm.
    return { verdict: 'clear', by: 'rules-only', categories: [], modelUnavailable: true,
             error: String(e.message || e).slice(0, 120) };
  }
}

boot();
