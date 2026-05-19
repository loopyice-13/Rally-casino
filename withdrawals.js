import express from "express";
import { auth, adminOnly } from "../middleware.js";
import { q, qall, run } from "../db.js";

const router = express.Router();

router.post("/request", auth, async (req,res)=>{
  const { amount, method, accountName, accountNumber, reference } = req.body;
  const amt = Number(amount);
  if (!amt || amt < 10) return res.status(400).json({error:"Minimum withdrawal is 10"});

  const user = await q("SELECT * FROM users WHERE id=?", [req.user.id]);
  if (!user || user.balance < amt) return res.status(400).json({error:"Insufficient balance"});

  const r = await run(`INSERT INTO withdrawals(user_id,amount,method,account_name,account_number,reference,status)
    VALUES(?,?,?,?,?,?,?)`, [req.user.id, amt, method, accountName, accountNumber, reference || "", "pending"]);

  res.json({ request: { id: r.lastID } });
});

router.get("/mine", auth, async (req,res)=>{
  const rows = await qall("SELECT * FROM withdrawals WHERE user_id=? ORDER BY id DESC", [req.user.id]);
  res.json(rows);
});

router.get("/admin/all", auth, adminOnly, async (req,res)=>{
  const rows = await qall(`SELECT w.*, u.username FROM withdrawals w JOIN users u ON w.user_id=u.id ORDER BY w.id DESC`);
  res.json(rows);
});

router.post("/admin/:id/approve", auth, adminOnly, async (req,res)=>{
  const item = await q("SELECT * FROM withdrawals WHERE id=?", [req.params.id]);
  if (!item || item.status !== "pending") return res.status(400).json({error:"Not found"});
  await run("UPDATE withdrawals SET status='approved' WHERE id=?", [item.id]);
  await run("UPDATE users SET balance = balance - ? WHERE id=?", [Number(item.amount), item.user_id]);
  res.json({ ok:true });
});

export default router;