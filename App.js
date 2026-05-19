const APP = {
  siteName: 'Rally Casino',
  currency: 'GHS',
  momoNetwork: 'TELECEL',
  momoNumber: '0209716172',
  otherCurrencyText: 'Will be added soon',
  apiBase: 'http://localhost:3000',
  maxUploadMB: 5,
  hcaptchaSiteKey: '9414097e-f742-4dd0-9950-c944e564e766'
};

const state = {
  user: JSON.parse(localStorage.getItem('rally_user') || 'null'),
  token: localStorage.getItem('rally_token') || '',
  wallet: { balance: 0, pending: 0 }
};

function money(v) {
  return `${APP.currency} ${Number(v || 0).toFixed(2)}`;
}

function setSession(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem('rally_user', JSON.stringify(user));
  localStorage.setItem('rally_token', token);
  paintShell();
}

function clearSession() {
  state.user = null;
  state.token = '';
  localStorage.removeItem('rally_user');
  localStorage.removeItem('rally_token');
  paintShell();
}

async function api(path, method = 'GET', body = null) {
  const options = { method, headers: {} };

  if (body && !(body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    options.body = body;
  }

  if (state.token) {
    options.headers['Authorization'] = `Bearer ${state.token}`;
  }

  const response = await fetch(`${APP.apiBase}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(message, isError = false) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = `
      position:fixed;left:50%;bottom:24px;transform:translateX(-50%);
      z-index:99999;padding:14px 18px;border-radius:14px;max-width:90vw;
      font-weight:700;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.38);
      display:none;
    `;
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.display = 'block';
  el.style.background = isError ? 'rgba(255,93,108,.14)' : 'rgba(50,213,131,.14)';
  el.style.border = isError ? '1px solid rgba(255,93,108,.28)' : '1px solid rgba(50,213,131,.25)';
  el.style.color = isError ? '#ffd0d6' : '#d4ffe5';

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.style.display = 'none';
  }, 2600);
}

function paintShell() {
  document.querySelectorAll('[data-site-name]').forEach(el => el.textContent = APP.siteName);
  document.querySelectorAll('[data-currency]').forEach(el => el.textContent = APP.currency);
  document.querySelectorAll('[data-momo-number]').forEach(el => el.textContent = APP.momoNumber);
  document.querySelectorAll('[data-momo-network]').forEach(el => el.textContent = APP.momoNetwork);
  document.querySelectorAll('[data-other-currency]').forEach(el => el.textContent = APP.otherCurrencyText);

  const userText = document.getElementById('userText');
  if (userText) userText.textContent = state.user ? state.user.username : 'Guest';

  const balanceText = document.getElementById('balanceText');
  if (balanceText) balanceText.textContent = money(state.wallet.balance);

  const pendingText = document.getElementById('pendingText');
  if (pendingText) pendingText.textContent = money(state.wallet.pending);

  const homeBalance = document.getElementById('homeBalance');
  if (homeBalance) homeBalance.textContent = money(state.wallet.balance);

  const userText2 = document.getElementById('userText2');
  if (userText2) userText2.textContent = state.user ? state.user.username : 'Guest';
}

function requireAuth() {
  if (!state.token) location.href = 'login.html';
}

async function refreshWallet() {
  if (!state.token) {
    state.wallet = { balance: 0, pending: 0 };
    paintShell();
    return;
  }

  try {
    const data = await api('/api/wallet');
    state.wallet = {
      balance: Number(data.balance || 0),
      pending: Number(data.pending || 0)
    };
    paintShell();
  } catch (err) {
    toast('Could not load wallet.', true);
  }
}

function logout() {
  clearSession();
  toast('Logged out successfully.');
  location.href = 'index.html';
}

function getCaptchaToken() {
  return wi
