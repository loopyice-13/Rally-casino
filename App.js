const APP = {
  siteName: "Rally Casino",
  currency: "GHS",
  momoNetwork: "TELECEL",
  momoNumber: "0209716172",
  otherCurrencyText: "Will be added soon",
  apiBase: "",
  maxUploadMB: 5
};

const state = {
  user: JSON.parse(localStorage.getItem("rally_user") || "null"),
  token: localStorage.getItem("rally_token") || "",
  wallet: {
    balance: 0,
    pending: 0
  }
};

function money(value) {
  return `${APP.currency} ${Number(value || 0).toFixed(2)}`;
}

function setSession(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem("rally_user", JSON.stringify(user));
  localStorage.setItem("rally_token", token);
  paintShell();
}

function clearSession() {
  state.user = null;
  state.token = "";
  localStorage.removeItem("rally_user");
  localStorage.removeItem("rally_token");
  paintShell();
}

async function api(path, method = "GET", body = null) {
  const options = {
    method,
    headers: {}
  };

  if (body && !(body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    options.body = body;
  }

  if (state.token) {
    options.headers["Authorization"] = `Bearer ${state.token}`;
  }

  const response = await fetch(`${APP.apiBase}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function toast(message, isError = false) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText = `
      position:fixed;
      left:50%;
      bottom:24px;
      transform:translateX(-50%);
      z-index:99999;
      padding:14px 18px;
      border-radius:14px;
      max-width:90vw;
      font-weight:700;
      text-align:center;
      box-shadow:0 18px 50px rgba(0,0,0,.38);
      display:none;
    `;
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.display = "block";
  el.style.background = isError ? "rgba(255,93,108,.14)" : "rgba(50,213,131,.14)";
  el.style.border = isError ? "1px solid rgba(255,93,108,.28)" : "1px solid rgba(50,213,131,.25)";
  el.style.color = isError ? "#ffd0d6" : "#d4ffe5";

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.style.display = "none";
  }, 2600);
}

function paintShell() {
  const nameEls = document.querySelectorAll("[data-site-name]");
  nameEls.forEach(el => el.textContent = APP.siteName);

  const currencyEls = document.querySelectorAll("[data-currency]");
  currencyEls.forEach(el => el.textContent = APP.currency);

  const momoEls = document.querySelectorAll("[data-momo-number]");
  momoEls.forEach(el => el.textContent = APP.momoNumber);

  const networkEls = document.querySelectorAll("[data-momo-network]");
  networkEls.forEach(el => el.textContent = APP.momoNetwork);

  const otherEls = document.querySelectorAll("[data-other-currency]");
  otherEls.forEach(el => el.textContent = APP.otherCurrencyText);

  const userText = document.getElementById("userText");
  if (userText) userText.textContent = state.user ? state.user.username : "Guest";

  const balanceText = document.getElementById("balanceText");
  if (balanceText) balanceText.textContent = money(state.wallet.balance);

  const pendingText = document.getElementById("pendingText");
  if (pendingText) pendingText.textContent = money(state.wallet.pending);

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) loginBtn.style.display = state.user ? "none" : "inline-flex";
  if (logoutBtn) logoutBtn.style.display = state.user ? "inline-flex" : "none";
}

function requireAuth() {
  if (!state.token) {
    location.href = "login.html";
  }
}

async function refreshWallet() {
  if (!state.token) {
    state.wallet = { balance: 0, pending: 0 };
    paintShell();
    return;
  }

  try {
    const data = await api("/api/wallet");
    state.wallet = {
      balance: Number(data.balance || 0),
      pending: Number(data.pending || 0)
    };
    paintShell();
  } catch (err) {
    console.error(err);
    toast("Could not load wallet.", true);
  }
}

function logout() {
  clearSession();
  toast("Logged out successfully.");
  location.href = "index.html";
}

async function signup(e) {
  e.preventDefault();

  const form = e.target;
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());

  try {
    const data = await api("/api/auth/signup", "POST", payload);
    setSession(data.user, data.token);
    toast("Account created successfully.");
    location.href = "index.html";
  } catch (err) {
    toast(err.message, true);
  }
}

async function login(e) {
  e.preventDefault();

  const form = e.target;
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());

  try {
    const data = await api("/api/auth/login", "POST", payload);
    setSession(data.user, data.token);
    toast("Welcome back.");
    location.href = "index.html";
  } catch (err) {
    toast(err.message, true);
  }
}

function formatCurrencyInput(input) {
  input.addEventListener("input", () => {
    const value = input.value.replace(/[^d.]/g, "");
    input.value = value;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  paintShell();
  await refreshWallet();

  document.querySelectorAll("[data-format-currency]").forEach(el => formatCurrencyInput(el));
});
