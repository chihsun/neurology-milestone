import { auth, signInWithEmailAndPassword, signOut, isAuthorized } from './firebase.js';

const form = document.getElementById('loginForm');
const msg = document.getElementById('loginMessage');
const params = new URLSearchParams(location.search);
if (params.get('error') === 'unauthorized') {
  msg.textContent = '此帳號尚未被授權使用本系統。';
  msg.className = 'form-message error';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '登入中…';
  msg.className = 'form-message';
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      document.getElementById('email').value.trim(),
      document.getElementById('password').value
    );
    if (!(await isAuthorized(credential.user.uid))) {
      await signOut(auth);
      throw new Error('此帳號尚未被授權使用本系統。');
    }
    const next = params.get('next');
    location.href = next && /^[a-zA-Z0-9_.-]+$/.test(next) ? next : 'index.html';
  } catch (err) {
    console.error(err);
    msg.textContent = err.message === '此帳號尚未被授權使用本系統。'
      ? err.message
      : '登入失敗，請確認 Email、密碼與 Firebase 設定。';
    msg.className = 'form-message error';
  } finally {
    button.disabled = false;
  }
});
