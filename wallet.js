const express = require('express');
const { getUserByToken, listTransactionsForUser, addTransaction } = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    balance: user.balance,
    pending: user.pending,
    username: user.username
  });
});

router.get('/transactions', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type = 'all', status = 'all', limit = '10', cursor = '0' } = req.query;
  let items = listTransactionsForUser(user.id);

  if (type !== 'all') {
    items = items.filter(t => t.type === type);
  }

  if (status !== 'all') {
    items = items.filter(t => t.status === status);
  }

  const start = Number(cursor) || 0;
  const take = Math.max(1, Math.min(Number(limit) || 10, 50));
  const page = items.slice(start, start + take);
  const nextCursor = start + page.length < items.length ? String(start + page.length) : null;

  res.json({
    items: page,
    nextCursor,
    total: items.length
  });
});

router.post('/activity', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, amount, status = 'completed', reference = '', note = '', meta = {} } = req.body;

  if (!type || !amount) {
    return res.status(400).json({ error: 'Type and amount are required.' });
  }

  const value = Number(amount);

  if (type === 'game_win') {
    user.balance += value;
  }

  if (type === 'game_loss') {
    user.balance -= value;
  }

  const tx = {
    userId: user.id,
    type,
    amount: value,
    status,
    reference,
    createdAt: new Date().toISOString(),
    meta: { note, ...meta }
  };

  addTransaction(tx);

  res.json({ ok: true, transaction: tx });
});

module.exports = router;
