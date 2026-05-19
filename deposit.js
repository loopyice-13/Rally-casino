const express = require("express");
const { getUserByToken, addDeposit } = require("../store");

module.exports = (upload) => {
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

  router.post("/", upload.single("screenshot"), async (req, res) => {
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const user = getUserByToken(token);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { amount, txId, senderName, senderPhone, note, momoNetwork, momoNumber, currency, hcaptchaToken } = req.body;

      if (!amount || !txId || !senderName || !senderPhone) {
        return res.status(400).json({ error: "All deposit fields are required." });
      }

      const ok = await verifyHcaptcha(hcaptchaToken);
      if (!ok) return res.status(400).json({ error: "Captcha verification failed." });

      if (!req.file) return res.status(400).json({ error: "Screenshot is required." });

      const deposit = {
        id: `dep_${Date.now()}`,
        amount: Number(amount),
        txId,
        senderName,
        senderPhone,
        note: note || "",
        momoNetwork,
        momoNumber,
        currency,
        screenshot: `/uploads/${req.file.filename}`,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      user.pending += Number(amount);
      addDeposit(user, deposit);

      res.json({ ok: true, deposit });
    } catch (err) {
      res.status(500).json({ error: "Deposit submission failed." });
    }
  });

  return router;
};
