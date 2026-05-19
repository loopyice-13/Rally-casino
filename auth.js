const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const users = new Map();

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function verifyHcaptcha(token) {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams();
  body.append("response", token);
  body.append("secret", secret);

  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = await response.json();
  return !!data.success;
}

router.post("/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
      confirmPassword,
      hcaptchaToken
    } = req.body;

    if (!username || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const captchaOk = await verifyHcaptcha(hcaptchaToken);
    if (!captchaOk) {
      return res.status(400).json({ error: "Captcha verification failed." });
    }

    const key = username.toLowerCase();
    if (users.has(key)) {
      return res.status(400).json({ error: "Username already exists." });
    }

    const token = makeToken();
    users.set(key, {
      username,
      email,
      phone,
      password,
      balance: 0,
      pending: 0,
      deposits: [],
      token
    });

    res.json({
      token,
      user: { username, email, phone }
    });
  } catch (err) {
    res.status(500).json({ error: "Signup failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password, hcaptchaToken } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const captchaOk = await verifyHcaptcha(hcaptchaToken);
    if (!captchaOk) {
      return res.status(400).json({ error: "Captcha verification failed." });
    }

    const key = username.toLowerCase();
    const user = users.get(key);

    if (!user || user.password !== password) {
      return res.status(400).json({ error: "Invalid login details." });
    }

    user.token = makeToken();
    users.set(key, user);

    res.json({
      token: user.token,
      user: { username: user.username, email: user.email, phone: user.phone }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed." });
  }
});

module.exports = router;
