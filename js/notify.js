/* 5:00 PM check-in fires while the app is open (true offline scheduled
   push is not possible without a server). */
export function initNotify() {
  const ask = () => {
    if ('Notification' in window && Notification.permission === 'default')
      Notification.requestPermission();
    document.removeEventListener('click', ask);
  };
  document.addEventListener('click', ask);

  setInterval(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const key = now.toISOString().slice(0, 10);
    if (now.getHours() >= 17 && localStorage.getItem('sf_notified') !== key) {
      new Notification('StudyFlow', { body: "5 PM check-in - are today's 2 blueprint items done?" });
      localStorage.setItem('sf_notified', key);
    }
  }, 30000);
}
