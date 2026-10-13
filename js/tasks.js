import { dbGetAll, dbAdd, dbPut, dbDel } from './db.js';
import { todayStr } from './seed.js';

let filter = 'all', query = '';

export async function renderTasks() {
  renderVault();
  const tasks = await dbGetAll('tasks');
  const today = todayStr();
  const list = document.getElementById('task-list');
  let rows = tasks.sort((a, b) => b.createdAt - a.createdAt);
  if (filter === 'pending') rows = rows.filter(t => !t.done);
  if (filter === 'done')    rows = rows.filter(t => t.done);
  if (filter === 'urgent')  rows = rows.filter(t => t.urgent && !t.done);
  if (filter === 'due')     rows = rows.filter(t => !t.done && t.due === today);
  if (query) rows = rows.filter(t => t.text.toLowerCase().includes(query));

  list.innerHTML = rows.length ? '' : '<li style="justify-content:center;color:var(--tx2)">Nothing here</li>';
  for (const t of rows) {
    const li = document.createElement('li');
    if (t.done) li.classList.add('done');
    li.innerHTML = `
      <input type="checkbox" ${t.done ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--ac)">
      <div style="flex:1"><div class="txt">${esc(t.text)}</div>
        <div class="meta">${t.urgent ? '<span class="badge u">URGENT</span> ' : ''}${t.due ? `<span class="badge d">DUE ${t.due === today ? 'TODAY' : t.due}</span>` : ''}</div>
      </div>
      <button class="del" title="Delete">&#10005;</button>`;
    li.querySelector('input').addEventListener('change', async e => { t.done = e.target.checked; await dbPut('tasks', t); renderTasks(); });
    li.querySelector('.del').addEventListener('click', async () => { await dbDel('tasks', t.id); renderTasks(); });
    list.appendChild(li);
  }
  window.__bpItems = await dbGetAll('blueprint');
}

/* Sunday Backlog Vault - hidden Mon-Sat, fills with this week's
   incomplete blueprint items. Cleared items count toward ring/streak. */
async function renderVault() {
  const vault = document.getElementById('vault');
  const box = document.getElementById('vault-list');
  const isSunday = new Date().getDay() === 0;
  vault.hidden = !isSunday;
  if (!isSunday) return;
  const items = await dbGetAll('blueprint');
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const ws = weekAgo.toISOString().slice(0, 10);
  const backlog = items.filter(i => i.isVaulted && i.status !== 'done' && i.date >= ws)
                       .sort((a, b) => a.date.localeCompare(b.date));
  box.innerHTML = backlog.length ? '' : '<div class="rest-day">Vault is empty - clean week!</div>';
  for (const it of backlog) {
    const el = document.createElement('div');
    el.className = 'slot';
    el.innerHTML = `
      <span class="tag ${it.slot === 'B' ? 'b' : ''}">SLOT ${it.slot}</span>
      <div class="info"><div>${it.title}</div><div class="sub">${it.subject} &middot; was due ${it.date}</div></div>
      <input type="checkbox" aria-label="Clear ${it.title}">`;
    el.querySelector('input').addEventListener('change', async e => {
      it.status = e.target.checked ? 'done' : 'pending';
      it.isVaulted = false;
      it.completedAt = e.target.checked ? Date.now() : null;
      await dbPut('blueprint', it);
      renderTasks();
    });
    box.appendChild(el);
  }
}

export function initTasks() {
  document.getElementById('task-form').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = document.getElementById('task-input');
    const text = inp.value.trim();
    if (!text) return;
    await dbAdd('tasks', {
      text, done: false, urgent: document.getElementById('flag-urgent').checked,
      due: document.getElementById('flag-due').checked ? todayStr() : null,
      createdAt: Date.now()
    });
    inp.value = '';
    document.getElementById('flag-due').checked = false;
    document.getElementById('flag-urgent').checked = false;
    renderTasks();
  });

  document.getElementById('task-search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); renderTasks(); });
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); filter = c.dataset.f; renderTasks();
  }));

  /* Smart voice capture - Web Speech API, graceful offline fallback */
  const mic = document.getElementById('mic-btn');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) mic.style.display = 'none';
  let rec = null;
  mic.addEventListener('click', () => {
    if (rec) { rec.stop(); return; }
    rec = new SR();
    rec.lang = 'en-IN'; rec.interimResults = false;
    mic.classList.add('listening');
    rec.onresult = e => { document.getElementById('task-input').value = e.results[0][0].transcript; };
    rec.onend = () => { mic.classList.remove('listening'); rec = null; };
    rec.onerror = () => { mic.classList.remove('listening'); rec = null;
      alert('Voice capture unavailable (offline or unsupported). Type instead.'); };
    try { rec.start(); } catch { rec = null; mic.classList.remove('listening'); }
  });
}

const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
