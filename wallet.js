const express = require("express");
const { getUserByToken } = require("../store");

const router = express.Router();

router.get("/", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  res.json({
    balance: user.balance,
    pending: user.pending
  });
});

module.exports = router;
