const API = "https://YOUR-BACKEND-DOMAIN.com/api";
const state = {
  user: JSON.parse(localStorage.getItem("cr_user") || "null"),
  token: localStorage.getItem("cr_token") || "",
  wallet: { balance: 0, bonus: 0 }
};

async function api(path, method="GET", body=null) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type":"application/json",
      ...(state.token ? { "Authorization": `Bearer ${state.token}` } : {})
    },
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function money(n){ return `GHS ${Number(n || 0).toFixed(2)}`; }

function setSession(user, token){
  state.user = user;
  state.token = token;
  localStorage.setItem("cr_user", JSON.stringify(user));
  localStorage.setItem("cr_token", token);
}

function clearSession(){
  state.user = null;
  state.token = "";
  localStorage.removeItem("cr_user");
  localStorage.removeItem("cr_token");
}

function toast(msg, good=true){
  let el = document.getElementById("toast");
  if(!el){
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:14px 18px;border-radius:14px;z-index:9999;box-shadow:0 20px 60px rgba(0,0,0,.4);font-weight:700;max-width:90vw;text-align:center";
    document.body.appendChild(el);
  }
  el.style.background = good ? "#0f2a1f" : "#34131a";
  el.style.color = "#fff";
  el.style.border = good ? "1px solid rgba(50,213,131,.25)" : "1px solid rgba(255,93,108,.25)";
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(window.__toast);
  window.__toast = setTimeout(()=> el.style.display = "none", 2800);
}

function paintShell(){
  const u = document.getElementById("userText");
  if (u) u.textContent = state.user ? state.user.username : "Guest";
  const bal = document.getElementById("balanceText");
  if (bal) bal.textContent = money(state.wallet.balance);
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (loginBtn) loginBtn.style.display = state.user ? "none" : "inline-flex";
  if (logoutBtn) logoutBtn.style.display = state.user ? "inline-flex" : "none";
}

async function refreshWallet() {
  if (!state.token) return;
  state.wallet = await api("/wallet");
  paintShell();
}

function requireAuth() {
  if (!state.token) location.href = "login.html";
}

function logout(){
  clearSession();
  location.href = "index.html";
}

async function signup(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  const data = await api("/auth/signup", "POST", payload);
  setSession(data.user, data.token);
  toast("Account created.");
  location.href = "lobby.html";
}

async function login(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = Object.fromEntries(fd.entries());
  const data = await api("/auth/login", "POST", payload);
  setSession(data.user, data.token);
  toast("Welcome back.");
  location.href = "lobby.html";
}

window.addEventListener("load", async ()=>{ paintShell(); if (state.token) try{ await refreshWallet(); } catch {} });