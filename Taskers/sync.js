/**
 * sync.js — Firebase Authentication & Cloud Firestore Sync Engine
 * ================================================================
 * • Enables per-user account synchronization via Firebase Auth & Firestore.
 * • Works 24/7 on tiny.host (or any static host) without needing a local PC server!
 * • Syncs changes in real time across Laptop, Mobile Phone, and Web links.
 */

'use strict';

const SyncEngine = (() => {
  let eventSource     = null;
  let reconnectTimer  = null;
  let backoffMs       = 1_000;
  const MAX_BACKOFF   = 64_000;
  let currentStatus   = 'offline';
  let isAlive         = true;
  let firebaseAuth    = null;
  let firebaseDb      = null;
  let unsubscribeFs   = null;
  let currentUser     = null;

  function updateBadge(status, labelText = null) {
    currentStatus = status;
    const badge = document.getElementById('connection-status');
    if (!badge) return;

    badge.className = `conn-${status}`;
    const label = badge.querySelector('.conn-label');
    if (label) {
      const textMap = {
        online: 'Cloud Synced ☁️',
        connecting: 'Connecting…',
        offline: 'Offline (Local)'
      };
      label.textContent = labelText || textMap[status] || status;
    }

    window.dispatchEvent(new CustomEvent('sync-status-changed', { detail: { status } }));
  }

  // ── Initialize Firebase Auth & Firestore ─────────────────────────────────
  function initFirebase(config) {
    if (!window.firebase || !config || !config.apiKey) return false;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      firebaseAuth = firebase.auth();
      firebaseDb   = firebase.firestore();

      // Listen for Firebase Auth user state
      firebaseAuth.onAuthStateChanged((user) => {
        currentUser = user;
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user } }));

        if (user) {
          subscribeUserCloudData(user.uid);
        } else {
          if (unsubscribeFs) {
            unsubscribeFs();
            unsubscribeFs = null;
          }
          updateBadge('offline', 'Guest (Local)');
        }
      });

      return true;
    } catch (err) {
      console.warn('[SyncEngine] Firebase init notice:', err.message);
      return false;
    }
  }

  // Real-time listener for signed-in user's Firestore document
  function subscribeUserCloudData(uid) {
    if (unsubscribeFs) unsubscribeFs();
    if (!firebaseDb) return;

    updateBadge('connecting');

    unsubscribeFs = firebaseDb.collection('users').doc(uid).onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        updateBadge('online', 'Cloud Synced ☁️');
        window.dispatchEvent(new CustomEvent('firebase-data-updated', { detail: data }));
      } else {
        updateBadge('online', 'Cloud Ready ☁️');
      }
    }, (err) => {
      console.warn('[SyncEngine] Firestore listener notice:', err.message);
      updateBadge('offline');
    });
  }

  // Push user state to Firestore
  async function pushToFirebase(appData) {
    if (!firebaseDb || !currentUser) return false;
    try {
      await firebaseDb.collection('users').doc(currentUser.uid).set(appData, { merge: true });
      updateBadge('online', 'Cloud Synced ☁️');
      return true;
    } catch (err) {
      console.warn('[SyncEngine] Firestore push notice:', err.message);
      return false;
    }
  }

  // ── Firebase Auth Helper Methods ──────────────────────────────────────────
  async function signIn(email, password) {
    if (!firebaseAuth) throw new Error('Firebase Auth not initialized');
    return await firebaseAuth.signInWithEmailAndPassword(email, password);
  }

  async function signUp(email, password) {
    if (!firebaseAuth) throw new Error('Firebase Auth not initialized');
    return await firebaseAuth.createUserWithEmailAndPassword(email, password);
  }

  async function signOut() {
    if (!firebaseAuth) return;
    return await firebaseAuth.signOut();
  }

  function getCurrentUser() {
    return currentUser;
  }

  // ── Local Python Server SSE Fallback ──────────────────────────────────────
  function connectLocalServer() {
    if (!isAlive || location.protocol === 'file:') return;

    try {
      eventSource = new EventSource('/api/events');
    } catch (_) {
      return;
    }

    eventSource.addEventListener('data-updated', (e) => {
      let payload = {};
      try { payload = JSON.parse(e.data); } catch (_) {}
      window.dispatchEvent(new CustomEvent('data-updated', { detail: payload }));
    });

    eventSource.addEventListener('data-mutated', (e) => {
      let payload = {};
      try { payload = JSON.parse(e.data); } catch (_) {}
      window.dispatchEvent(new CustomEvent('data-updated', { detail: payload }));
    });
  }

  function init() {
    connectLocalServer();
    window.addEventListener('beforeunload', () => {
      isAlive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (unsubscribeFs) unsubscribeFs();
    });
  }

  return {
    init,
    initFirebase,
    pushToFirebase,
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    getStatus: () => currentStatus
  };
})();

document.addEventListener('DOMContentLoaded', () => SyncEngine.init());
