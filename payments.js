import express from "express";
import fetch from "node-fetch";
import { auth } from "../middleware.js";
import { q, run } from "../db.js";

const router = express.Router();

router.post("/deposit", auth, async (req,res)=>{
  const { amount, email, name } = req.body;
  const value = Number(amount);
  if (!value || value < 10) return res.status(400).json({error:"Minimum deposit is 10"});
  const ref = `CR-${Date.now()}-${req.user.id}`;

  await run(`INSERT INTO deposits(user_id,ref,amount,currency,status,raw) VALUES(?,?,?,?,?,?)`,
    [req.user.id, ref, value, "GHS", "pending", JSON.stringify({ email, name })]);

  const body = {
    tx_ref: ref,
    amount: value,
    currency: "GHS",
    redirect_url: `${process.env.FRONTEND_URL}/deposit-success.html?ref=${encodeURIComponent(ref)}`,
    customer: { email, name },
    customizations: { title: "Casino Royale Wallet Top-up", description: "Deposit to wallet" }
  };

  const resp = await fetch(`${process.env.FLW_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": `Bearer ${process.env.FLW_SECRET_KEY}`
    },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  if (!resp.ok) return res.status(400).json({error: data.message || "Flutterwave error"});
  res.json({ checkout_url: data.data.link, ref });
});

router.post("/webhook", express.json({ type:"*/*" }), async (req,res)=>{
  const sig = req.headers["verif-hash"] || req.headers["flutterwave-signature"];
  if (process.env.FLW_WEBHOOK_HASH && sig !== process.env.FLW_WEBHOOK_HASH) {
    return res.status(401).send("invalid");
  }

  const payload = req.body;
  const txRef = payload?.data?.tx_ref || payload?.tx_ref || payload?.data?.txRef;
  if (!txRef) return res.status(200).send("ok");

  const dep = await q("SELECT * FROM deposits WHERE ref=?", [txRef]);
  if (!dep || dep.status === "successful") return res.status(200).send("ok");

  const verify = await fetch(`${process.env.FLW_BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, {
    headers: { "Authorization": `Bearer ${process.env.FLW_SECRET_KEY}` }
  });
  const vr = await verify.json();
  const tx = vr?.data;

  if (!tx || tx.status !== "successful") return res.status(200).send("ok");
  if (Number(tx.amount) !== Number(dep.amount)) return res.status(200).send("ok");
  if (tx.currency !== dep.currency) return res.status(200).send("ok");

  await run("UPDATE deposits SET status='successful' WHERE ref=?", [txRef]);
  await run("UPDATE users SET balance = balance + ? WHERE id=?", [Number(tx.amount), dep.user_id]);
  res.status(200).send("ok");
});

export default router;