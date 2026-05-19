const express = require('express');
const {
  createUser,
  findUserByUsername,
  authenticate,
  createSession,
  publicUser
} = require('../store');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { username, email, phone, password, confirmPassword } = req.body;

  if (!username || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (findUserByUsername(username)) {
    return res.status(400).json({ error: 'Username already exists.' });
  }

  const user = createUser({ username, email, phone, password });
  const token = createSession(user.id);

  res.json({ user: publicUser(user), token });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = authenticate(username, password);

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials.' });
  }

  const token = createSession(user.id);
  res.json({ user: publicUser(user), token });
});

module.exports = router;
