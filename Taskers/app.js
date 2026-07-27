/**
 * app.js — CBSE Class 9 Study Dashboard Core Logic
 * ====================================================
 * • Dual-checkbox tracking for Chapters:
 *   - Checkbox 1: `taught` (🏫 Taught in Class / School)
 *   - Checkbox 2: `revised` (🔄 Self-Study / Revision Completed)
 *   - Progress: 1 point for Taught + 1 point for Revised (100% complete when BOTH are checked!)
 * • Firebase Authentication & User Cloud Sync:
 *   - Sign in with same email on Mobile & PC -> syncs 24/7 anywhere in the world!
 *   - Compatible with tiny.host, Vercel, Netlify, or local index.html!
 *   - No 24/7 PC server required!
 * • Single-checkbox tracking for Weekly & Daily Tasks
 * • Daily Routine reset at midnight (calendar date check)
 * • SVG Ring math & Bar chart rendering
 * • XSS Prevention: All dynamic text injected via document.createElement + .textContent
 */

'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// Geometry & Constants
// ══════════════════════════════════════════════════════════════════════════════
const API               = '/api';
const LOCAL_STORAGE_KEY = 'studydash_cbse9_v4_data';
const SYLLABUS_R       = 68;
const WEEK_R           = 62;
const MINI_R           = 26;
const CIRCUM_SYLLABUS  = 2 * Math.PI * SYLLABUS_R; // ≈ 427.26
const CIRCUM_WEEK      = 2 * Math.PI * WEEK_R;     // ≈ 389.56
const CIRCUM_MINI      = 2 * Math.PI * MINI_R;     // ≈ 163.36

// ══════════════════════════════════════════════════════════════════════════════
// Firebase Cloud Configuration (Global Web Credentials for Cloud Sync)
// ══════════════════════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDemoKey_CBSEClass9_StudyDash2026",
  authDomain:        "studydash-cbse9.firebaseapp.com",
  projectId:         "studydash-cbse9",
  storageBucket:     "studydash-cbse9.appspot.com",
  messagingSenderId: "987654321012",
  appId:             "1:987654321012:web:cbse9studydash"
};

// ══════════════════════════════════════════════════════════════════════════════
// State Management
// ══════════════════════════════════════════════════════════════════════════════
let appData            = null;
let activeView         = 'dashboard';
let activeTmSubjectId  = null;
let clockIntervalId    = null;
let authMode           = 'signin'; // 'signin' | 'signup'

// Helpers
const $        = id  => document.getElementById(id);
const deepCopy = obj => JSON.parse(JSON.stringify(obj));
const nowUtc   = ()  => new Date().toISOString();

function sorted(arr) {
  return [...(arr || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

// ══════════════════════════════════════════════════════════════════════════════
// Client-Side Seed Data Builder (12 Subjects, 100 Topics with Taught & Revised)
// ══════════════════════════════════════════════════════════════════════════════
function buildClientSeed() {
  const now = nowUtc();

  const subjects = [
    { id: "s1",  name: "Physics",     order_index: 0,  color: "#7c3aed", abbr: "PHY" },
    { id: "s2",  name: "Chemistry",   order_index: 1,  color: "#0891b2", abbr: "CHE" },
    { id: "s3",  name: "Biology",     order_index: 2,  color: "#059669", abbr: "BIO" },
    { id: "s4",  name: "Mathematics", order_index: 3,  color: "#e11d48", abbr: "MAT" },
    { id: "s5",  name: "English",     order_index: 4,  color: "#9333ea", abbr: "ENG" },
    { id: "s6",  name: "Hindi",       order_index: 5,  color: "#c2410c", abbr: "HIN" },
    { id: "s7",  name: "Marathi",     order_index: 6,  color: "#4f46e5", abbr: "MAR" },
    { id: "s8",  name: "History",     order_index: 7,  color: "#d97706", abbr: "HIS" },
    { id: "s9",  name: "Geography",   order_index: 8,  color: "#2563eb", abbr: "GEO" },
    { id: "s10", name: "Civics",      order_index: 9,  color: "#dc2626", abbr: "CIV" },
    { id: "s11", name: "Economics",   order_index: 10, color: "#9f580a", abbr: "ECO" },
    { id: "s12", name: "IT",          order_index: 11, color: "#0d9488", abbr: "IT"  },
  ];

  const topicsRaw = [
    // Physics
    ["s1", "Describing Motion Around Us"],
    ["s1", "How Forces Affect Motion"],
    ["s1", "Work, Energy and Simple Machines"],
    ["s1", "Sound Waves: Characteristics and Applications"],
    // Chemistry
    ["s2", "Exploring Mixtures and Their Separation"],
    ["s2", "Journey Inside the Atom"],
    ["s2", "Atomic Foundations of Matter"],
    // Biology
    ["s3", "Exploration: Entering the World of Secondary Science"],
    ["s3", "Cell: The Building Blocks of Life"],
    ["s3", "Tissues in Action"],
    ["s3", "Reproduction: How Life Continues"],
    ["s3", "Patterns in Life: Diversity and Classification"],
    ["s3", "Earth as a System: Energy, Matter and Life"],
    // Mathematics
    ["s4", "Orienting Yourself: The Use of Coordinates"],
    ["s4", "Introduction to Linear Polynomials"],
    ["s4", "The World of Numbers"],
    ["s4", "Exploring Algebraic Identities"],
    ["s4", "I'm Up and Down, and Round and Round"],
    ["s4", "Measuring Space: Perimeter and Area"],
    ["s4", "Introduction to Probability"],
    ["s4", "Exploring Sequences and Progressions"],
    ["s4", "Introduction to Euclid's Geometry"],
    ["s4", "Lines and Angles"],
    ["s4", "Triangles: Congruence Theorems"],
    ["s4", "Quadrilaterals"],
    ["s4", "Linear Equations in Two Variables"],
    ["s4", "Mensuration – Surface Area and Volume"],
    ["s4", "Statistics"],
    // English
    ["s5", "How I Taught My Grandmother to Read"],
    ["s5", "The Pot Maker"],
    ["s5", "Winds of Change"],
    ["s5", "Vitamin-M"],
    ["s5", "The World of Limitless Possibilities"],
    ["s5", "Twin Melodies"],
    ["s5", "Carrier of Words"],
    ["s5", "Follow That Dream"],
    ["s5", "Grammar"],
    ["s5", "Writing Skills"],
    ["s5", "Reading Comprehension"],
    // Hindi
    ["s6", "Prose: दो बैलों की कथा"],
    ["s6", "Prose: क्या लिखूँ?"],
    ["s6", "Prose: संवादहीन"],
    ["s6", "Prose: ऐसी भी बातें होती हैं"],
    ["s6", "Prose: आखिरी चट्टान तक"],
    ["s6", "Prose: रीढ़ की हड्डी"],
    ["s6", "Prose: मैं और मेरा देश"],
    ["s6", "Poetry: रैदास के पद"],
    ["s6", "Poetry: राम-लक्ष्मण-परशुराम संवाद"],
    ["s6", "Poetry: भारति, जय, विजयकरे!"],
    ["s6", "Poetry: झाँसी की रानी"],
    ["s6", "Poetry: घर की याद"],
    ["s6", "Supp: निर्मल जीव सिंह 'सेवा'"],
    ["s6", "Supp: सब याद तुम्हारी आती हैं"],
    ["s6", "Grammar"],
    ["s6", "Writing Skills"],
    ["s6", "Reading Comprehension"],
    // Marathi
    ["s7", "सर्वात्मका शिवसुंदरा"],
    ["s7", "संतवाणी"],
    ["s7", "बेटा मी ऐकतो आहे"],
    ["s7", "जी.आय.पी. रेल्वे"],
    ["s7", "व्यायामाचे महत्त्व"],
    ["s7", "ऑलिंपिक वर्तुळाचा गोफ"],
    ["s7", "दिव्याच्या शोधामागचे दिव्य"],
    ["s7", "उजाड उघडे माळरानही"],
    ["s7", "कुलूप"],
    ["s7", "आभाळातल्या पाऊलवाटा"],
    ["s7", "पुन्हा एकदा"],
    ["s7", "टिपफूल"],
    ["s7", "माझे शिक्षक आणि संस्कार"],
    ["s7", "शब्दांचा खेळ"],
    ["s7", "Supplementary Reading"],
    ["s7", "Grammar"],
    ["s7", "Writing Skills"],
    ["s7", "Reading Comprehension"],
    // History
    ["s8", "Early Humans and Beginning of Civilisation"],
    ["s8", "State and Society (upto 1000 CE)"],
    ["s8", "Resistance and Resilience (1000 CE–1700 CE)"],
    ["s8", "India and the World-I (1900 BCE–1200 CE)"],
    // Geography
    ["s9", "Understanding Social Science"],
    ["s9", "Shaping of the Earth's Surface"],
    ["s9", "Atmosphere and Climate"],
    ["s9", "Oceans and Life"],
    ["s9", "Life on Earth"],
    // Civics
    ["s10", "Democracy"],
    ["s10", "Elections"],
    ["s10", "Authority"],
    // Economics
    ["s11", "Building Blocks in Economics"],
    ["s11", "The Price Puzzle: What Drives the Market"],
    ["s11", "From Ideas to Startups"],
    ["s11", "Smart Ways to Manage Your Finances"],
    // IT
    ["s12", "ES: Communication Skills-I"],
    ["s12", "ES: Self-Management Skills-I"],
    ["s12", "ES: ICT Skills-I"],
    ["s12", "ES: Entrepreneurial Skills-I"],
    ["s12", "ES: Green Skills-I"],
    ["s12", "SS: Introduction to IT–ITeS Industry"],
    ["s12", "SS: Data Entry & Keyboarding Skills"],
    ["s12", "SS: Digital Documentation"],
    ["s12", "SS: Electronic Spreadsheet"],
    ["s12", "SS: Digital Presentation"],
  ];

  const topics = topicsRaw.map(([sid, name], i) => ({
    id: `t${i + 1}`,
    subject_id: sid,
    name: name,
    taught: false,  // Checkbox 1: Taught in Class / School
    revised: false, // Checkbox 2: Self Study / Revision
    updated_at: now,
  }));

  const weeklyRaw = [
    ["s1", "Solve 20 numericals – Motion chapter"],
    ["s1", "Derive Force laws – write 3 times"],
    ["s2", "Separation techniques – diagram practice"],
    ["s2", "Atomic models comparison table"],
    ["s3", "Draw & label Cell diagram (plant + animal)"],
    ["s3", "Tissues – comparison chart"],
    ["s4", "Coordinate Geometry – 15 graph sums"],
    ["s4", "Polynomials – factor theorem 10 problems"],
    ["s4", "Lines & Angles theorem proofs – write twice"],
    ["s5", "Write summary: How I Taught My Grandmother"],
    ["s5", "Grammar exercises – tenses worksheet"],
    ["s6", "दो बैलों की कथा – प्रश्न उत्तर लिखो"],
    ["s6", "कविता पाठ – रैदास के पद याद करो"],
    ["s7", "पाठ 1 – प्रश्नोत्तर लेखन"],
    ["s7", "Nibandh: व्यायामाचे महत्त्व (300 words)"],
    ["s8", "Early Civilisations – timeline poster"],
    ["s8", "State & Society – notes + key dates"],
    ["s9", "Earth's surface – diagram labelling"],
    ["s9", "Climate zones – map work"],
    ["s10", "Democracy – MCQ practice (30 Qs)"],
    ["s10", "Authority chapter – short notes"],
    ["s11", "Economics vocab flashcards (20 terms)"],
    ["s11", "Price puzzle – case study analysis"],
    ["s12", "Create MS Word formatted document"],
    ["s12", "MS Excel – marks grade calculator sheet"],
  ];

  const weekly_tasks = weeklyRaw.map(([sid, task], i) => ({
    id: `w${i + 1}`,
    subject_id: sid,
    task: task,
    done: false,
    updated_at: now,
  }));

  const daily_tasks = [
    { id: "d1", task: "Morning Revision (30 min)",          done: false, updated_at: now },
    { id: "d2", task: "90-min Deep Work – Block 1",         done: false, updated_at: now },
    { id: "d3", task: "Solve 10 MCQs from weakest subject", done: false, updated_at: now },
    { id: "d4", task: "90-min Deep Work – Block 2",         done: false, updated_at: now },
    { id: "d5", task: "Evening Formula / Vocab Review",     done: false, updated_at: now },
    { id: "d6", task: "No Phone during study blocks 🚫",    done: false, updated_at: now },
    { id: "d7", task: "Drink 2L Water 💧",                  done: false, updated_at: now },
    { id: "d8", task: "Write tomorrow's study plan 📝",     done: false, updated_at: now },
    { id: "d9", task: "8 Hours Sleep 🌙",                   done: false, updated_at: now },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    subjects,
    topics,
    weekly_tasks,
    daily_tasks,
    _meta: {
      last_sync: null,
      last_date: todayStr,
      version: 4,
      created_at: now,
    }
  };
}

function checkClientDailyReset(data) {
  if (!data || !data.daily_tasks) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDate = data._meta?.last_date;

  if (lastDate !== todayStr) {
    const ts = nowUtc();
    data.daily_tasks.forEach(d => {
      d.done = false;
      d.updated_at = ts;
    });
    if (!data._meta) data._meta = {};
    data._meta.last_date = todayStr;
    saveToLocalStorage(data);
    return true;
  }
  return false;
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      (data.topics || []).forEach(t => {
        if (t.taught === undefined) t.taught = !!t.studied || !!t.done;
        if (t.revised === undefined) t.revised = !!t.mastered;
      });
      checkClientDailyReset(data);
      return data;
    }
  } catch (err) {
    console.warn('[app.js] LocalStorage read notice:', err);
  }
  const seed = buildClientSeed();
  saveToLocalStorage(seed);
  return seed;
}

function saveToLocalStorage(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[app.js] LocalStorage write notice:', err);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Toast Notification System
// ══════════════════════════════════════════════════════════════════════════════
function toast(message, type = 'info', durationMs = 2500) {
  const container = $('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;

  const txt = document.createElement('span');
  txt.textContent = message; // XSS safe
  el.appendChild(txt);

  container.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('show');
    });
  });

  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, durationMs);
}

// ══════════════════════════════════════════════════════════════════════════════
// Dynamic Clock & Hourly Greeting
// ══════════════════════════════════════════════════════════════════════════════
function startClock() {
  function tick() {
    const now   = new Date();
    const h     = now.getHours();
    const mm    = String(now.getMinutes()).padStart(2, '0');
    const ss    = String(now.getSeconds()).padStart(2, '0');
    const ampm  = h >= 12 ? 'PM' : 'AM';
    const h12   = (h % 12) || 12;

    const clockEl = $('clock');
    if (clockEl) {
      clockEl.textContent = `${h12}:${mm}:${ss} ${ampm}`;
    }

    const dateEl = $('clock-date');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
      });
    }

    const startDateEl = $('date-badge');
    if (startDateEl) {
      startDateEl.textContent = now.toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    }

    const greetingEl = $('greeting');
    if (greetingEl) {
      let g;
      if      (h >= 5  && h < 12) g = 'GOOD MORNING';
      else if (h >= 12 && h < 17) g = 'GOOD AFTERNOON';
      else if (h >= 17 && h < 21) g = 'GOOD EVENING';
      else                        g = 'GOOD NIGHT';
      greetingEl.textContent = g;
    }
  }

  tick();
  clockIntervalId = setInterval(tick, 1000);
}

// ══════════════════════════════════════════════════════════════════════════════
// SVG Ring Helper
// ══════════════════════════════════════════════════════════════════════════════
function setRingOffset(elId, pct, circumference) {
  const el = $(elId);
  if (!el) return;
  const clamped = Math.min(100, Math.max(0, pct));
  const offset  = circumference * (1 - clamped / 100);
  el.style.strokeDasharray  = `${circumference}`;
  el.style.strokeDashoffset = `${offset}`;
}

function buildMiniSvgRing(pct, color) {
  const NS   = 'http://www.w3.org/2000/svg';
  const svg  = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '70');
  svg.setAttribute('height', '70');
  svg.setAttribute('viewBox', '0 0 70 70');

  const bg = document.createElementNS(NS, 'circle');
  bg.setAttribute('class', 'ring-track');
  bg.setAttribute('cx', '35');
  bg.setAttribute('cy', '35');
  bg.setAttribute('r',  `${MINI_R}`);
  bg.setAttribute('stroke-width', '6');

  const fill = document.createElementNS(NS, 'circle');
  fill.setAttribute('class', 'ring-fill');
  fill.setAttribute('cx', '35');
  fill.setAttribute('cy', '35');
  fill.setAttribute('r',  `${MINI_R}`);
  fill.setAttribute('stroke-width', '6');
  fill.style.stroke = color || '#7c3aed';

  const offset = CIRCUM_MINI * (1 - Math.min(100, Math.max(0, pct)) / 100);
  fill.style.strokeDasharray  = `${CIRCUM_MINI}`;
  fill.style.strokeDashoffset = `${offset}`;

  svg.appendChild(bg);
  svg.appendChild(fill);
  return svg;
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Dashboard Rendering
// ══════════════════════════════════════════════════════════════════════════════
function renderDashboard() {
  renderSyllabusRing();
  renderWeekRing();
  renderBarChart();
  renderSubjectCards();
  renderDailyPills();
}

function renderSyllabusRing() {
  const topics = appData.topics || [];
  const total  = topics.length;

  let earnedPoints = 0;
  let fullyDone    = 0;

  topics.forEach(t => {
    if (t.taught)  earnedPoints += 1;
    if (t.revised) earnedPoints += 1;
    if (t.taught && t.revised) fullyDone += 1;
  });

  const totalPoints = total * 2;
  const pct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  setRingOffset('syllabus-ring-fill', pct, CIRCUM_SYLLABUS);

  const pctTxt = $('syllabus-pct-text');
  if (pctTxt) pctTxt.textContent = `${pct}%`;

  const ratioTxt = $('syllabus-ratio-text');
  if (ratioTxt) ratioTxt.textContent = `${fullyDone}/${total} fully revised`;
}

function renderWeekRing() {
  const weekly = appData.weekly_tasks || [];
  const total  = weekly.length;
  const done   = weekly.filter(w => w.done).length;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

  setRingOffset('week-ring-fill', pct, CIRCUM_WEEK);

  const pctTxt = $('week-pct-text');
  if (pctTxt) pctTxt.textContent = `${pct}%`;

  const ratioTxt = $('week-ratio-text');
  if (ratioTxt) ratioTxt.textContent = `${done}/${total} tasks`;
}

function renderBarChart() {
  const container = $('bar-cols-container');
  const labelsRow = $('bar-labels-container');
  if (!container || !labelsRow) return;

  while (container.firstChild) container.removeChild(container.firstChild);
  while (labelsRow.firstChild) labelsRow.removeChild(labelsRow.firstChild);

  const subjects = sorted(appData.subjects || []);
  const topics   = appData.topics || [];

  subjects.forEach(subj => {
    const subjTopics = topics.filter(t => t.subject_id === subj.id);
    const total      = subjTopics.length;

    let points = 0;
    subjTopics.forEach(t => {
      if (t.taught)  points += 1;
      if (t.revised) points += 1;
    });

    const maxPoints = total * 2;
    const pct       = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

    const col = document.createElement('div');
    col.className = 'bar-col';
    col.title     = `${subj.name}: ${pct}% completion`;

    const pctTxt = document.createElement('div');
    pctTxt.className = 'bar-pct-text';
    pctTxt.style.setProperty('--bar-h', `${pct}%`);
    pctTxt.textContent = pct > 0 ? `${pct}%` : '';
    col.appendChild(pctTxt);

    const track = document.createElement('div');
    track.className = 'bar-track';

    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.height = `${pct}%`;
    fill.style.background = `linear-gradient(to top, ${subj.color || '#7c3aed'}aa 0%, #f2f2f2 100%)`;

    track.appendChild(fill);
    col.appendChild(track);
    container.appendChild(col);

    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = subj.abbr || subj.name.slice(0, 3).toUpperCase();
    labelsRow.appendChild(label);
  });
}

function renderSubjectCards() {
  const container = $('subject-grid-container');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  const subjects = sorted(appData.subjects || []);
  subjects.forEach(subj => {
    container.appendChild(buildSubjectCard(subj));
  });
}

function buildSubjectCard(subj) {
  const card = document.createElement('article');
  card.className = 'subject-card';
  card.style.setProperty('--accent', subj.color || '#7c3aed');

  const topics = (appData.topics || []).filter(t => t.subject_id === subj.id);
  const weekly = (appData.weekly_tasks || []).filter(w => w.subject_id === subj.id);

  let points = 0;
  let fullyDoneCount = 0;
  topics.forEach(t => {
    if (t.taught)  points += 1;
    if (t.revised) points += 1;
    if (t.taught && t.revised) fullyDoneCount += 1;
  });

  const maxPoints = topics.length * 2;
  const pct       = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

  const head = document.createElement('div');
  head.className = 'card-head';

  const info = document.createElement('div');
  info.className = 'card-head-info';

  const name = document.createElement('h3');
  name.className = 'card-subject-name';
  name.textContent = subj.name;

  const ratio = document.createElement('div');
  ratio.className = 'card-ratio';
  ratio.textContent = `${fullyDoneCount}/${topics.length} Fully Revised`;

  info.appendChild(name);
  info.appendChild(ratio);

  const ringWrap = document.createElement('div');
  ringWrap.className = 'card-ring-wrap';
  const miniSvg = buildMiniSvgRing(pct, subj.color);
  const pctTxt  = document.createElement('div');
  pctTxt.className = 'card-ring-pct';
  pctTxt.textContent = `${pct}%`;

  ringWrap.appendChild(miniSvg);
  ringWrap.appendChild(pctTxt);

  head.appendChild(info);
  head.appendChild(ringWrap);
  card.appendChild(head);

  // Section 1: "📚 Chapters" (DUAL CHECKBOX: TEACH & REVISED)
  const secChapters = document.createElement('div');
  secChapters.className = 'card-section';

  const lblRow = document.createElement('div');
  lblRow.className = 'card-section-label-row';

  const lblChap = document.createElement('span');
  lblChap.className = 'card-section-label';
  lblChap.textContent = '📚 Chapters Syllabus';

  const colLabels = document.createElement('div');
  colLabels.className = 'cb-column-labels';

  const colTeach = document.createElement('span');
  colTeach.className = 'cb-col-tag cb-col-teach';
  colTeach.textContent = '🏫 Teach';
  colTeach.title = 'Taught in School / Class';

  const colRev = document.createElement('span');
  colRev.className = 'cb-col-tag cb-col-revised';
  colRev.textContent = '🔄 Revised';
  colRev.title = 'Revised in Self-Study';

  colLabels.appendChild(colTeach);
  colLabels.appendChild(colRev);

  lblRow.appendChild(lblChap);
  lblRow.appendChild(colLabels);
  secChapters.appendChild(lblRow);

  const ulChap = document.createElement('ul');
  ulChap.className = 'card-list';

  if (topics.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'list-empty';
    empty.textContent = 'No chapters added yet';
    ulChap.appendChild(empty);
  } else {
    topics.forEach(t => {
      ulChap.appendChild(buildChapterRow(t));
    });
  }
  secChapters.appendChild(ulChap);
  card.appendChild(secChapters);

  // Section 2: "📅 Weekly Tasks"
  const secWeekly = document.createElement('div');
  secWeekly.className = 'card-section';

  const lblWeekRow = document.createElement('div');
  lblWeekRow.className = 'card-section-label-row';

  const lblWeek = document.createElement('span');
  lblWeek.className = 'card-section-label';
  lblWeek.textContent = '📅 Weekly Tasks';

  lblWeekRow.appendChild(lblWeek);
  secWeekly.appendChild(lblWeekRow);

  const ulWeek = document.createElement('ul');
  ulWeek.className = 'card-list';

  if (weekly.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'list-empty';
    empty.textContent = 'No tasks for this week';
    ulWeek.appendChild(empty);
  } else {
    weekly.forEach(w => {
      ulWeek.appendChild(buildWeeklyRow(w));
    });
  }
  secWeekly.appendChild(ulWeek);
  card.appendChild(secWeekly);

  return card;
}

function buildChapterRow(topic) {
  const li = document.createElement('li');
  li.className = 'chapter-row';

  const pair = document.createElement('div');
  pair.className = 'cb-pair';

  // Checkbox 1: Teach
  const cbTeach = document.createElement('input');
  cbTeach.type = 'checkbox';
  cbTeach.className = 'cb-topic cb-teach';
  cbTeach.checked = !!topic.taught;
  cbTeach.title = 'Checkbox 1: Mark Taught in School / Class 🏫';
  cbTeach.dataset.id = topic.id;
  cbTeach.dataset.field = 'taught';
  cbTeach.dataset.entity = 'topic';

  // Checkbox 2: Revised
  const cbRev = document.createElement('input');
  cbRev.type = 'checkbox';
  cbRev.className = 'cb-topic cb-revised';
  cbRev.checked = !!topic.revised;
  cbRev.title = 'Checkbox 2: Mark Revised in Self-Study 🔄';
  cbRev.dataset.id = topic.id;
  cbRev.dataset.field = 'revised';
  cbRev.dataset.entity = 'topic';

  pair.appendChild(cbTeach);
  pair.appendChild(cbRev);

  const label = document.createElement('span');
  label.className = 'chapter-label';
  label.textContent = topic.name;

  const badge = document.createElement('span');
  badge.className = 'badge-state';

  if (topic.taught && topic.revised) {
    label.classList.add('label-done');
    badge.className += ' badge-done-both';
    badge.textContent = '✅ Completed';
  } else if (topic.revised) {
    badge.className += ' badge-revised-only';
    badge.textContent = '🔄 Revised';
  } else if (topic.taught) {
    badge.className += ' badge-teach-only';
    badge.textContent = '🏫 Taught';
  }

  if (badge.textContent) {
    label.appendChild(badge);
  }

  li.appendChild(pair);
  li.appendChild(label);
  return li;
}

function buildWeeklyRow(task) {
  const li = document.createElement('li');
  li.className = 'weekly-row';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'cb-weekly';
  cb.checked = !!task.done;
  cb.dataset.id = task.id;
  cb.dataset.field = 'done';
  cb.dataset.entity = 'weekly_task';

  const label = document.createElement('span');
  label.className = `weekly-label${task.done ? ' done' : ''}`;
  label.textContent = task.task;

  li.appendChild(cb);
  li.appendChild(label);
  return li;
}

function renderDailyPills() {
  const container = $('daily-pills-container');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  const daily = appData.daily_tasks || [];

  daily.forEach(d => {
    const pill = document.createElement('div');
    pill.className = `daily-pill${d.done ? ' done' : ''}`;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'cb-daily';
    cb.checked = !!d.done;
    cb.dataset.id = d.id;
    cb.dataset.field = 'done';
    cb.dataset.entity = 'daily_task';

    const label = document.createElement('span');
    label.className = 'daily-pill-label';
    label.textContent = d.task;

    pill.appendChild(cb);
    pill.appendChild(label);
    container.appendChild(pill);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Task Manager (Admin CRUD Panel)
// ══════════════════════════════════════════════════════════════════════════════
function renderTaskManager() {
  renderTmDailyList();
  renderTmSubjectTabs();
  renderTmAcademicLists();
}

function renderTmDailyList() {
  const ul = $('tm-daily-list');
  if (!ul) return;
  while (ul.firstChild) ul.removeChild(ul.firstChild);

  const daily = appData.daily_tasks || [];

  daily.forEach(d => {
    const li = document.createElement('li');
    li.className = 'tm-item';

    const text = document.createElement('span');
    text.className = 'tm-item-text';
    text.textContent = d.task;

    const delBtn = document.createElement('button');
    delBtn.className = 'tm-del-btn';
    delBtn.textContent = 'Delete';
    delBtn.dataset.id = d.id;
    delBtn.dataset.entity = 'daily_task';
    delBtn.dataset.action = 'remove';

    li.appendChild(text);
    li.appendChild(delBtn);
    ul.appendChild(li);
  });
}

function renderTmSubjectTabs() {
  const container = $('tm-subj-tabs');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  const subjects = sorted(appData.subjects || []);

  if (!activeTmSubjectId && subjects.length > 0) {
    activeTmSubjectId = subjects[0].id;
  }

  subjects.forEach(subj => {
    const btn = document.createElement('button');
    btn.className = `tm-subj-tab${subj.id === activeTmSubjectId ? ' active' : ''}`;
    btn.textContent = subj.name;
    btn.dataset.subjectId = subj.id;
    btn.addEventListener('click', () => {
      activeTmSubjectId = subj.id;
      renderTmSubjectTabs();
      renderTmAcademicLists();
    });
    container.appendChild(btn);
  });
}

function renderTmAcademicLists() {
  const topicUl  = $('tm-topic-list');
  const weeklyUl = $('tm-weekly-list');
  if (!topicUl || !weeklyUl) return;

  while (topicUl.firstChild) topicUl.removeChild(topicUl.firstChild);
  while (weeklyUl.firstChild) weeklyUl.removeChild(weeklyUl.firstChild);

  if (!activeTmSubjectId) return;

  const topics = (appData.topics || []).filter(t => t.subject_id === activeTmSubjectId);
  const weekly = (appData.weekly_tasks || []).filter(w => w.subject_id === activeTmSubjectId);

  if (topics.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'list-empty';
    empty.textContent = 'No chapters found for this subject.';
    topicUl.appendChild(empty);
  } else {
    topics.forEach(t => {
      const li = document.createElement('li');
      li.className = 'tm-item';

      const text = document.createElement('span');
      text.className = 'tm-item-text';
      text.textContent = t.name;

      const delBtn = document.createElement('button');
      delBtn.className = 'tm-del-btn';
      delBtn.textContent = 'Delete';
      delBtn.dataset.id = t.id;
      delBtn.dataset.entity = 'topic';
      delBtn.dataset.action = 'remove';

      li.appendChild(text);
      li.appendChild(delBtn);
      topicUl.appendChild(li);
    });
  }

  if (weekly.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'list-empty';
    empty.textContent = 'No weekly tasks found for this subject.';
    weeklyUl.appendChild(empty);
  } else {
    weekly.forEach(w => {
      const li = document.createElement('li');
      li.className = 'tm-item';

      const text = document.createElement('span');
      text.className = 'tm-item-text';
      text.textContent = w.task;

      const delBtn = document.createElement('button');
      delBtn.className = 'tm-del-btn';
      delBtn.textContent = 'Delete';
      delBtn.dataset.id = w.id;
      delBtn.dataset.entity = 'weekly_task';
      delBtn.dataset.action = 'remove';

      li.appendChild(text);
      li.appendChild(delBtn);
      weeklyUl.appendChild(li);
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Unified Mutation Engine (LocalStorage + Firebase Cloud)
// ══════════════════════════════════════════════════════════════════════════════
async function mutate(mutation) {
  const { action = 'update', entity, id, field, value } = mutation;
  const tableKey = entity === 'topic' ? 'topics' : `${entity}s`;

  // 1. Optimistic local mutation
  if (action === 'update') {
    const list = appData[tableKey] || [];
    const item = list.find(r => r.id === id);
    if (item) {
      item[field] = value;
      item.updated_at = nowUtc();
    }
  } else if (action === 'remove') {
    appData[tableKey] = (appData[tableKey] || []).filter(r => r.id !== id);
  }

  // 2. LocalStorage persistence
  saveToLocalStorage(appData);

  // 3. UI Render
  renderAll();

  // 4. Firebase Cloud doc push
  if (window.SyncEngine && SyncEngine.pushToFirebase) {
    SyncEngine.pushToFirebase(appData);
  }

  // 5. Toast Feedback
  if (action === 'remove') {
    toast('🗑️ Item deleted', 'success');
  } else if (action === 'add') {
    toast('✅ Item added', 'success');
  } else if (field === 'taught') {
    toast(value ? '🏫 Marked as Taught in Class!' : '🏫 Taught unchecked', 'success');
  } else if (field === 'revised') {
    toast(value ? '🔄 Marked as Revised in Self-Study!' : '🔄 Revised unchecked', 'success');
  } else if (field === 'done') {
    toast(value ? '✅ Task completed!' : '○ Task unchecked', 'success');
  }
}

async function addDailyRoutine() {
  const input = $('tm-daily-input');
  const text = input ? input.value.trim() : '';
  if (!text) {
    toast('⚠️ Please enter a routine task description', 'warning');
    return;
  }

  const newItem = {
    id: `d_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    task: text,
    done: false,
    updated_at: nowUtc(),
  };

  if (!appData.daily_tasks) appData.daily_tasks = [];
  appData.daily_tasks.push(newItem);
  saveToLocalStorage(appData);
  input.value = '';
  renderAll();
  toast('✅ Daily routine added', 'success');

  if (window.SyncEngine && SyncEngine.pushToFirebase) {
    SyncEngine.pushToFirebase(appData);
  }
}

async function addChapter() {
  const input = $('tm-topic-input');
  const text = input ? input.value.trim() : '';
  if (!text) {
    toast('⚠️ Please enter a chapter title', 'warning');
    return;
  }
  if (!activeTmSubjectId) {
    toast('⚠️ Please select a subject first', 'warning');
    return;
  }

  const newItem = {
    id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    subject_id: activeTmSubjectId,
    name: text,
    taught: false,
    revised: false,
    updated_at: nowUtc(),
  };

  if (!appData.topics) appData.topics = [];
  appData.topics.push(newItem);
  saveToLocalStorage(appData);
  input.value = '';
  renderAll();
  toast('✅ Chapter added', 'success');

  if (window.SyncEngine && SyncEngine.pushToFirebase) {
    SyncEngine.pushToFirebase(appData);
  }
}

async function addWeeklyTask() {
  const input = $('tm-weekly-input');
  const text = input ? input.value.trim() : '';
  if (!text) {
    toast('⚠️ Please enter a task description', 'warning');
    return;
  }
  if (!activeTmSubjectId) {
    toast('⚠️ Please select a subject first', 'warning');
    return;
  }

  const newItem = {
    id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    subject_id: activeTmSubjectId,
    task: text,
    done: false,
    updated_at: nowUtc(),
  };

  if (!appData.weekly_tasks) appData.weekly_tasks = [];
  appData.weekly_tasks.push(newItem);
  saveToLocalStorage(appData);
  input.value = '';
  renderAll();
  toast('✅ Weekly task added', 'success');

  if (window.SyncEngine && SyncEngine.pushToFirebase) {
    SyncEngine.pushToFirebase(appData);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Authentication & Account UI Handlers
// ══════════════════════════════════════════════════════════════════════════════
function setupAuthUI() {
  const modal       = $('auth-modal');
  const openBtn     = $('auth-modal-btn');
  const closeBtn    = $('auth-modal-close');
  const tabSignin   = $('auth-tab-signin');
  const tabSignup   = $('auth-tab-signup');
  const submitBtn   = $('auth-submit-btn');
  const signoutBtn  = $('signout-btn');
  const errorMsg    = $('auth-error-msg');
  const emailInput  = $('auth-email');
  const passInput   = $('auth-password');
  const userBadge   = $('account-user-email');

  // Open Modal
  openBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'flex';
  });

  // Close Modal
  closeBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  // Switch Auth Tabs
  tabSignin?.addEventListener('click', () => {
    authMode = 'signin';
    tabSignin.classList.add('active');
    tabSignup.classList.remove('active');
    if (submitBtn) submitBtn.textContent = 'Sign In to Sync';
    if (errorMsg) errorMsg.style.display = 'none';
  });

  tabSignup?.addEventListener('click', () => {
    authMode = 'signup';
    tabSignup.classList.add('active');
    tabSignin.classList.remove('active');
    if (submitBtn) submitBtn.textContent = 'Create Free Account';
    if (errorMsg) errorMsg.style.display = 'none';
  });

  // Submit Form (Sign In or Sign Up)
  $('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput?.value.trim();
    const pass  = passInput?.value.trim();

    if (!email || !pass) return;

    if (errorMsg) errorMsg.style.display = 'none';

    try {
      if (authMode === 'signin') {
        await SyncEngine.signIn(email, pass);
        toast('🔓 Signed in successfully!', 'success');
      } else {
        await SyncEngine.signUp(email, pass);
        toast('🎉 Account created! Sync active.', 'success');
      }
      if (modal) modal.style.display = 'none';
      if (passInput) passInput.value = '';
    } catch (err) {
      if (errorMsg) {
        errorMsg.textContent = err.message || 'Authentication failed. Please check credentials.';
        errorMsg.style.display = 'block';
      }
    }
  });

  // Sign Out
  signoutBtn?.addEventListener('click', async () => {
    await SyncEngine.signOut();
    toast('👋 Signed out of account', 'info');
  });

  // Firebase Auth State Listener
  window.addEventListener('auth-state-changed', (e) => {
    const user = e.detail?.user;
    if (user) {
      if (userBadge) userBadge.textContent = user.email || 'User Account';
      if (openBtn) openBtn.style.display = 'none';
      if (signoutBtn) signoutBtn.style.display = 'inline-block';
    } else {
      if (userBadge) userBadge.textContent = 'Guest (Local)';
      if (openBtn) openBtn.style.display = 'inline-block';
      if (signoutBtn) signoutBtn.style.display = 'none';
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// View Switching & Global Setup
// ══════════════════════════════════════════════════════════════════════════════
function switchView(viewName) {
  activeView = viewName;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  document.querySelectorAll('.view').forEach(v => {
    const isActive = v.id === `view-${viewName}`;
    v.classList.toggle('active', isActive);
  });

  renderAll();
}

function renderAll() {
  if (!appData) return;
  if (activeView === 'dashboard') {
    renderDashboard();
  } else if (activeView === 'tasks') {
    renderTaskManager();
  }
}

function setupEventListeners() {
  $('tab-btn-dashboard')?.addEventListener('click', () => switchView('dashboard'));
  $('tab-btn-tasks')?.addEventListener('click', () => switchView('tasks'));

  document.addEventListener('change', async e => {
    const target = e.target;
    if (target && target.type === 'checkbox' && target.dataset.entity && target.dataset.id) {
      await mutate({
        action: 'update',
        entity: target.dataset.entity,
        id: target.dataset.id,
        field: target.dataset.field,
        value: target.checked
      });
    }
  });

  document.addEventListener('click', async e => {
    const delBtn = e.target.closest('[data-action="remove"]');
    if (delBtn) {
      await mutate({
        action: 'remove',
        entity: delBtn.dataset.entity,
        id: delBtn.dataset.id
      });
    }
  });

  $('tm-daily-add-btn')?.addEventListener('click', addDailyRoutine);
  $('tm-daily-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addDailyRoutine();
  });

  $('tm-topic-add-btn')?.addEventListener('click', addChapter);
  $('tm-topic-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addChapter();
  });

  $('tm-weekly-add-btn')?.addEventListener('click', addWeeklyTask);
  $('tm-weekly-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addWeeklyTask();
  });

  window.addEventListener('firebase-data-updated', (e) => {
    if (e.detail && e.detail.topics) {
      appData = e.detail;
      saveToLocalStorage(appData);
      renderAll();
    }
  });

  setupAuthUI();
}

async function fetchAndRender() {
  appData = loadFromLocalStorage();
  renderAll();

  if (window.SyncEngine && SyncEngine.initFirebase) {
    SyncEngine.initFirebase(FIREBASE_CONFIG);
  }
}

// Entry Point
document.addEventListener('DOMContentLoaded', async () => {
  startClock();
  setupEventListeners();
  await fetchAndRender();
  console.info('[StudyHub] Zero-Maintenance Cloud App initialized: Login model active for tiny.host / web hosting.');
});
