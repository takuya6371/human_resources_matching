/* ============================================================
   Storage — no backend, no account, no deployment.
   ------------------------------------------------------------
   The whole conversation lives in localStorage, and tabs tell
   each other when it changes. Open two tabs side by side, pick a
   different account in each, and they are talking to each other.

   Two channels, because one of them is always available:
     BroadcastChannel  instant, same browser, same origin
     storage event     fires in OTHER tabs whenever localStorage
                       is written — the fallback that has worked
                       since long before BroadcastChannel existed

   Every write is read-modify-write against localStorage rather
   than a save of whatever this tab had in memory, so two people
   typing at once append rather than overwrite each other.
   ============================================================ */
import { THREADS } from './data.js';

const KEY = 'afritalent_chat_v1';
const TICK = KEY + '_tick';
export const SYNCED = true;

const seed = () => THREADS.map(t => ({ ...t, messages: t.messages.map(m => ({ ...m })) }));

function readState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return Array.isArray(s?.threads) ? s : null;
  } catch (_) { return null; }
}

function writeState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(TICK, String(Date.now()));   // wakes other tabs
  } catch (e) { console.error('could not save', e); }
  bc?.postMessage('changed');
  return state.threads;
}

const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('afritalent-chat') : null;

/** True when this browser can actually sync two tabs. */
export const canSync = () => {
  try {
    localStorage.setItem('__t', '1');
    localStorage.removeItem('__t');
    return true;
  } catch (_) { return false; }
};

export function loadThreads() {
  const s = readState();
  if (s) return s.threads;
  return writeState({ threads: seed() });
}

/** Read the shared copy, change it, write it back. Returns the new threads. */
export function mutate(fn) {
  const s = readState() || { threads: seed() };
  fn(s.threads);
  return writeState(s);
}

export const findThread = (threads, id) => threads.find(t => t.id === id);

export function resetAll() {
  // Write the fresh state directly rather than clearing and re-reading. Clearing
  // first leaves a window in which another tab's listener wakes, finds nothing,
  // and helpfully seeds it from its own copy — which is how a reset ended up
  // restoring the state it was supposed to remove.
  return writeState({ threads: seed() });
}

/** Called in the other tab whenever this one writes. */
export function watch(onChange) {
  bc?.addEventListener('message', onChange);
  window.addEventListener('storage', e => {
    if (e.key === KEY || e.key === TICK) onChange();
  });
}
