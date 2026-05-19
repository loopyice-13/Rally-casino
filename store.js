const crypto = require("crypto");

const users = new Map();
const deposits = new Map();

function uid() {
  return crypto.randomBytes(12).toString("hex");
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function getUserByUsername(username) {
  return users.get(String(username || "").toLowerCase()) || null;
}

function getUserByToken(token) {
  for (const user of users.values()) {
    if (user.token === token) return user;
  }
  return null;
}

function createUser({ username, email, phone, password }) {
  const key = String(username).toLowerCase();
  if (users.has(key)) return null;

  const user = {
    id: uid(),
    username,
    email,
    phone,
    password,
    balance: 0,
    pending: 0,
    token: makeToken(),
    deposits: []
  };

  users.set(key, user);
  return user;
}

function verifyUser(username, password) {
  const user = getUserByUsername(username);
  if (!user) return null;
  if (user.password !== password) return null;
  user.token = makeToken();
  return user;
}

function addDeposit(user, deposit) {
  deposits.set(deposit.id, deposit);
  user.deposits.unshift(deposit.id);
}

function listDeposits() {
  return [...deposits.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = {
  users,
  deposits,
  createUser,
  verifyUser,
  getUserByToken,
  getUserByUsername,
  addDeposit,
  listDeposits
};
