import { dbGetAll, dbPut } from './db.js';
import { studyDays, todayStr } from './seed.js';

const CIRC = 2 * Math.PI * 54; // 339.29

export async function renderDashboard() {
  const items = await dbGetAll('blueprint');
  renderToday(items);
  renderRing(items);
  renderGrid(items);
  renderStreak(items);
}

function renderToday(items) {
  const box = document.getElementById('today-slots');
  const heading = document.getElementById('today-heading');
  const today = todayStr();
  const day = new Date().getDay();
  const todays = items.filter(i => i.date === today).sort((a, b) => a.slot.localeCompare(b.slot));

  if (day === 0) {
    heading.textContent = 'Sunday - Rest & Recovery';
    box.innerHTML = `<div class="rest-day">Protected rest day.<br>Open the <b>Tasks</b> tab to clear your Backlog Vault.</div>`;
    return;
  }
  if (!todays.length) {
    const days = studyDays();
    heading.textContent = new Date() < new Date(days[0] + 'T00:00:00') ? 'Blueprint starts Oct 19, 2026' : 'Blueprint complete';
    box.innerHTML = `<div class="rest-day">No blueprint items assigned today.</div>`;
    return;
  }
  heading.textContent = `Today's Blueprint - ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}`;
  box.innerHTML = '';
  for (const it of todays) {
    const el = document.createElement('div');
    el.className = 'slot' + (it.status === 'done' ? ' done' : '');
    el.innerHTML = `
      <span class="tag ${it.slot === 'B' ? 'b' : ''}">SLOT ${it.slot}</span>
      <div class="info"><div>${it.title}</div><div class="sub">${it.subject}</div></div>
      <input type="checkbox" ${it.status === 'done' ? 'checked' : ''} aria-label="Mark ${it.title} complete">`;
    el.querySelector('input').addEventListener('change', async e => {
      it.status = e.target.checked ? 'done' : 'pending';
      it.completedAt = e.target.checked ? Date.now() : null;
      await dbPut('blueprint', it);
      renderDashboard();
    });
    box.appendChild(el);
  }
}

function renderRing(items) {
  const done = items.filter(i => i.status === 'done').length;
  document.getElementById('ring-count').textContent = done;
  document.getElementById('ring-fg').style.strokeDashoffset = CIRC * (1 - done / 140);
}

function renderGrid(items) {
  const grid = document.getElementById('progress-grid');
  const today = todayStr();
  const byDate = {};
  for (const i of items) byDate[i.date] = (byDate[i.date] || 0) + (i.status === 'done' ? 1 : 0);
  grid.innerHTML = '';
  for (const d of studyDays()) {
    const n = byDate[d] || 0;
    const b = document.createElement('div');
    b.className = 'blk ' + (n === 2 ? 'g2' : n === 1 ? 'g1' : 'g0') + (d === today ? ' today' : '');
    b.title = `${d} - ${n}/2 done`;
    grid.appendChild(b);
  }
}

/* One missed study day breaks the streak. Sundays are not study days,
   so they never break it. Today-in-progress neither adds nor breaks. */
function renderStreak(items) {
  const today = todayStr();
  const byDate = {};
  for (const i of items) byDate[i.date] = (byDate[i.date] || 0) + (i.status === 'done' ? 1 : 0);
  let streak = 0;
  const days = studyDays();
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d > today) continue;
    if (byDate[d] === 2) streak++;
    else if (d < today) break;
  }
  document.getElementById('streak-count').textContent = streak;
}
