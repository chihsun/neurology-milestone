import { auth, signOut } from './firebase.js';

export function bindAuthUI(user) {
  const label = document.getElementById('userLabel');
  if (label) label.textContent = user?.email || '';
  const btn = document.getElementById('logoutBtn');
  if (btn) btn.addEventListener('click', async () => {
    await signOut(auth);
    location.href = 'login.html';
  });
}
