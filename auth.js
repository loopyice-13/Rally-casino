const express = require("express");
const { createUser, verifyUser } = require("../store");

const router = express.Router();

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
    const { username, email, phone, password, confirmPassword, hcaptchaToken } = req.body;

    if (!username || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const ok = await verifyHcaptcha(hcaptchaToken);
    if (!ok) return res.status(400).json({ error: "Captcha verification failed." });

    const user = createUser({ username, email, phone, password });
    if (!user) return res.status(400).json({ error: "Username already exists." });

    res.json({
      token: user.token,
      user: { username: user.username, email: user.email, phone: user.phone }
    });
  } catch {
    res.status(500).json({ error: "Signup failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password, hcaptchaToken } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const ok = await verifyHcaptcha(hcaptchaToken);
    if (!ok) return res.status(400).json({ error: "Captcha verification failed." });

    const user = verifyUser(username, password);
    if (!user) return res.status(400).json({ error: "Invalid login details." });

    res.json({
      token: user.token,
      user: { username: user.username, email: user.email, phone: user.phone }
    });
  } catch {
    res.status(500).json({ error: "Login failed." });
  }
});

module.exports = router;
