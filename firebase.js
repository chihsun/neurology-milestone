import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc,
  query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  collection, addDoc, getDocs, deleteDoc, doc, getDoc, query, orderBy, serverTimestamp
};

export async function isAuthorized(uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, 'authorizedUsers', uid));
  return snap.exists();
}

export function waitForUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

export async function requireAuthorizedUser() {
  const user = await waitForUser();
  if (!user) {
    location.href = `login.html?next=${encodeURIComponent(location.pathname.split('/').pop() || 'index.html')}`;
    return null;
  }
  if (!(await isAuthorized(user.uid))) {
    await signOut(auth);
    location.href = 'login.html?error=unauthorized';
    return null;
  }
  return user;
}
