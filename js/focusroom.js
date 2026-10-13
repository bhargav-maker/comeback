import { dbPut, dbAdd } from './db.js';
import { todayStr } from './seed.js';

const TCIRC = 2 * Math.PI * 104; // 653.45
let mode = 'pomodoro';           // 'pomodoro' | 'stopwatch'
let strict = false;
let running = false;
let endAt = 0;
let elapsed = 0;
let tick = null;
let audio = null;

export function initFocus() {
  loadState();
  buildSlotLinks();
  bindControls();
  draw();
  updateUI();
}

function bindControls() {
  const $ = id => document.getElementById(id);

  $('mode-toggle').addEventListener('click', () => {
    if (running) return;
    mode = mode === 'pomodoro' ? 'stopwatch' : 'pomodoro';
    $('mode-toggle').textContent = mode === 'pomodoro' ? '\u23F1 Pomodoro' : '\u23F2 Stopwatch';
    $('pomo-minutes').style.display = mode === 'pomodoro' ? 'block' : 'none';
    reset(); persist();
  });

  $('strict-toggle').addEventListener('click', () => {
    strict = !strict;
    $('strict-toggle').textContent = strict ? '\uD83D\uDD34 Strict' : '\uD83D\uDFE2 Normal';
    $('strict-toggle').classList.toggle('on', strict);
    $('pause-btn').hidden = strict;
    $('focus-status').textContent = strict
      ? 'STRICT: no pause. Switching tabs will trigger warnings.'
      : '';
    $('focus-status').classList.toggle('strict-banner', strict);
    persist();
  });

  $('pomo-minutes').addEventListener('change', () => { if (!running) { reset(); persist(); } });

  $('start-btn').addEventListener('click', start);
  $('pause-btn').addEventListener('click', pause);
  $('reset-btn').addEventListener('click', () => { reset(); persist(); });

  $('zen-btn').addEventListener('click', toggleZen);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) document.body.classList.remove('zen');
  });

  $('audio-btn').addEventListener('click', toggleAudio);

  const sp = $('scratchpad');
  sp.value = localStorage.getItem('sf_scratch') || '';
  sp.addEventListener('input', () => localStorage.setItem('sf_scratch', sp.value));

  /* Strict-mode tab-switch / close warnings */
  document.addEventListener('visibilitychange', () => {
    if (!strict || !running) return;
    if (document.hidden) document.title = '\u26A0 Return to StudyFlow!';
    else document.title = 'StudyFlow';
  });
  window.addEventListener('beforeunload', e => {
    if (strict && running) { e.preventDefault(); e.returnValue = ''; }
  });
}

function start() {
  if (running) return;
  if (mode === 'pomodoro') {
    const rem = remainingMs();
    if (rem <= 0) reset();
    endAt = Date.now() + (rem > 0 ? rem : durationMs());
  }
  running = true; loop(); persist(); updateUI();
}
function pause() {
  if (!running) return;
  running = false; clearInterval(tick);
  if (mode === 'pomodoro') elapsed = endAt - Date.now();
  persist(); updateUI();
}
function reset() {
  running = false; clearInterval(tick); elapsed = 0; endAt = 0;
  document.title = 'StudyFlow'; updateUI(); draw();
}
function loop() {
  clearInterval(tick);
  tick = setInterval(() => {
    if (mode === 'pomodoro' && Date.now() >= endAt) return finish();
    if (mode === 'stopwatch') elapsed += 250;
    draw(); persist();
  }, 250);
}
async function finish() {
  running = false; clearInterval(tick);
  beep();
  const secs = Math.round(durationMs() / 1000);
  await logSession(secs);
  document.getElementById('focus-status').textContent = 'Session complete - well done.';
  elapsed = 0; endAt = 0; persist(); updateUI(); draw();
}

function durationMs() {
  return Number(document.getElementById('pomo-minutes').value) * 60000;
}
function remainingMs() {
  if (mode === 'stopwatch') return 0;
  return running ? Math.max(0, endAt - Date.now()) : (elapsed > 0 ? elapsed : durationMs());
}

function draw() {
  const $ = id => document.getElementById(id);
  let frac, label;
  if (mode === 'pomodoro') {
    const rem = remainingMs();
    frac = rem / durationMs();
    const s = Math.ceil(rem / 1000);
    label = `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  } else {
    frac = 1;
    const s = Math.floor(elapsed / 1000);
    label = `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }
  $('timer-display').textContent = label;
  $('timer-fg').style.strokeDashoffset = TCIRC * (1 - Math.min(1, Math.max(0, frac)));
}

function updateUI() {
  const $ = id => document.getElementById(id);
  $('start-btn').textContent = running ? '... Running' : '\u25B6 Start';
  $('start-btn').disabled = running;
  $('pause-btn').hidden = strict;
  if (strict) $('focus-status').textContent = running
    ? 'DEEP LOCKDOWN - finish the timer.'
    : 'STRICT armed: the next session cannot be paused.';
}

/* persistence & auto-resume after accidental close */
function persist() {
  localStorage.setItem('sf_focus', JSON.stringify({ mode, strict, running, endAt, elapsed,
    minutes: document.getElementById('pomo-minutes').value }));
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('sf_focus'));
    if (!s) return;
    mode = s.mode; strict = s.strict; elapsed = s.elapsed || 0;
    document.getElementById('pomo-minutes').value = s.minutes || 25;
    document.getElementById('pomo-minutes').style.display = mode === 'pomodoro' ? 'block' : 'none';
    document.getElementById('mode-toggle').textContent = mode === 'pomodoro' ? '\u23F1 Pomodoro' : '\u23F2 Stopwatch';
    const st = document.getElementById('strict-toggle');
    st.textContent = strict ? '\uD83D\uDD34 Strict' : '\uD83D\uDFE2 Normal';
    st.classList.toggle('on', strict);
    document.getElementById('pause-btn').hidden = strict;
    if (s.running) {
      if (mode === 'pomodoro' && s.endAt > Date.now()) { endAt = s.endAt; running = true; loop(); }
      else if (mode === 'stopwatch') { running = true; loop(); }
    }
  } catch {}
}

/* slot linking */
function buildSlotLinks() {
  const sel = document.getElementById('slot-link');
  const items = (window.__bpItems || []).filter(i => i.date === todayStr());
  sel.innerHTML = '<option value="">- Link today\u2019s Slot A / B -</option>';
  for (const it of items) {
    const o = document.createElement('option');
    o.value = it.id;
    o.textContent = `Slot ${it.slot}: ${it.title}${it.status === 'done' ? ' \u2713' : ''}`;
    sel.appendChild(o);
  }
  sel.addEventListener('change', async () => {
    const it = (window.__bpItems || []).find(i => i.id === sel.value);
    if (it && it.status !== 'done' &&
        confirm(`Mark "${it.title}" complete after this session?`)) {
      it.status = 'done'; it.completedAt = Date.now();
      await dbPut('blueprint', it);
      sel.options[sel.selectedIndex].textContent += ' \u2713';
    }
  });
}
export const refreshSlotLinks = buildSlotLinks;

async function logSession(secs) {
  const sel = document.getElementById('slot-link');
  const it = (window.__bpItems || []).find(i => i.id === sel.value);
  await dbAdd('sessions', {
    itemId: it ? it.id : null, subject: it ? it.subject : null,
    mode, strict, seconds: secs, at: Date.now()
  });
}

/* Zen mode (Fullscreen API) */
function toggleZen() {
  if (document.fullscreenElement) { document.exitFullscreen(); document.body.classList.remove('zen'); }
  else {
    document.documentElement.requestFullscreen().catch(() => {});
    document.body.classList.add('zen');
    document.dispatchEvent(new CustomEvent('sf:showtab', { detail: 'focus' }));
  }
}

/* Procedural brown noise - zero files, fully offline */
function toggleAudio() {
  const btn = document.getElementById('audio-btn');
  if (audio) { audio.stop(); audio = null; btn.textContent = '\uD83D\uDD07 Audio'; btn.classList.remove('on'); return; }
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
  const gain = ctx.createGain(); gain.gain.value = 0.5;
  src.connect(lp).connect(gain).connect(ctx.destination);
  src.start();
  audio = { stop: () => { src.stop(); ctx.close(); } };
  btn.textContent = '\uD83D\uDD0A Audio'; btn.classList.add('on');
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g).connect(ctx.destination); o.frequency.value = 880;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    o.start(); o.stop(ctx.currentTime + 1.2);
  } catch {}
}
