const crypto = require('crypto');

const users = [];
const sessions = new Map();
const transactions = [];

function uid(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function createUser({ username, email, phone, password }) {
  const user = {
    id: uid('usr'),
    username,
    email,
    phone,
    password,
    balance: 0,
    pending: 0,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return user;
}

function findUserByUsername(username) {
  return users.find(u => u.username === username) || null;
}

function findUserById(id) {
  return users.find(u => u.id === id) || null;
}

function authenticate(username, password) {
  return users.find(u => u.username === username && u.password === password) || null;
}

function createSession(userId) {
  const token = uid('tok');
  sessions.set(token, userId);
  return token;
}

function getUserByToken(token) {
  if (!token) return null;
  const userId = sessions.get(token);
  return findUserById(userId);
}

function addTransaction(tx) {
  transactions.unshift({
    id: uid('tx'),
    ...tx
  });
}

function listTransactionsForUser(userId) {
  return transactions.filter(t => t.userId === userId);
}

module.exports = {
  users,
  sessions,
  transactions,
  uid,
  publicUser,
  createUser,
  findUserByUsername,
  findUserById,
  authenticate,
  createSession,
  getUserByToken,
  addTransaction,
  listTransactionsForUser
};
