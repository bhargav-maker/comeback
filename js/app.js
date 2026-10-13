import { openDB, dbGetAll } from './db.js';
import { seedBlueprint, refreshVault } from './seed.js';
import { renderDashboard } from './dashboard.js';
import { initTasks, renderTasks } from './tasks.js';
import { initFocus, refreshSlotLinks } from './focusroom.js';
import { initNotify } from './notify.js';

const TABS = ['dashboard', 'tasks', 'focus'];

function showTab(name) {
  TABS.forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === name);
    document.querySelector(`.tab-btn[data-tab="${t}"]`).classList.toggle('active', t === name);
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'tasks' || name === 'focus')
    renderTasks().then(refreshSlotLinks);
  location.hash = name;
}

document.querySelectorAll('.tab-btn').forEach(b =>
  b.addEventListener('click', () => showTab(b.dataset.tab)));
document.addEventListener('sf:showtab', e => showTab(e.detail));

(async function boot() {
  await openDB();
  await seedBlueprint();
  await refreshVault(await dbGetAll('blueprint'));
  initTasks();
  initFocus();
  initNotify();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http'))
    navigator.serviceWorker.register('sw.js').catch(() => {});
  showTab(TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard');
})();
