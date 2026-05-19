const express = require('express');
const { getUserByToken, addTransaction } = require('../store');

const router = express.Router();

router.post('/', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    amount,
    method,
    accountName,
    accountNumber,
    network,
    note
  } = req.body;

  if (!amount || !method || !accountName || !accountNumber) {
    return res.status(400).json({ error: 'All withdrawal fields are required.' });
  }

  const amountValue = Number(amount);
  const createdAt = new Date().toISOString();

  const withdrawal = {
    id: `wd_${Date.now()}`,
    username: user.username,
    amount: amountValue,
    method,
    accountName,
    accountNumber,
    network: network || '',
    note: note || '',
    status: 'pending',
    createdAt
  };

  addTransaction({
    userId: user.id,
    type: 'withdrawal',
    amount: amountValue,
    status: 'pending',
    reference: withdrawal.id,
    createdAt,
    meta: withdrawal
  });

  res.json({ ok: true, withdrawal });
});

module.exports = router;1
