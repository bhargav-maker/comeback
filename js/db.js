let db;
export function openDB() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open('studyflow', 1);
    rq.onupgradeneeded = e => {
      const d = e.target.result;
      d.createObjectStore('blueprint', { keyPath: 'id' });
      d.createObjectStore('tasks',   { keyPath: 'id', autoIncrement: true });
      d.createObjectStore('sessions',{ keyPath: 'id', autoIncrement: true });
    };
    rq.onsuccess = () => { db = rq.result; res(db); };
    rq.onerror   = () => rej(rq.error);
  });
}
const store = (s, m = 'readonly') => db.transaction(s, m).objectStore(s);
export const dbGetAll = s => new Promise(r => store(s).getAll().onsuccess = e => r(e.target.result));
export const dbPut    = (s, v) => new Promise(r => store(s, 'readwrite').put(v).onsuccess = () => r());
export const dbAdd    = (s, v) => new Promise(r => store(s, 'readwrite').add(v).onsuccess = e => r(e.target.result));
export const dbDel    = (s, k) => new Promise(r => store(s, 'readwrite').delete(k).onsuccess = () => r());
export const dbClear  = s => new Promise(r => store(s, 'readwrite').clear().onsuccess = () => r());
