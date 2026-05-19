import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { q, run } from "../db.js";

const router = express.Router();

router.post("/signup", async (req,res)=>{
  const { username, email, password, dob, phone } = req.body;
  if (!username || !email || !password || !dob) return res.status(400).json({error:"Missing fields"});
  const years = new Date().getFullYear() - new Date(dob).getFullYear();
  if (years < 18) return res.status(400).json({error:"Must be 18+"});
  const exists = await q("SELECT id FROM users WHERE username=? OR email=?", [username,email]);
  if (exists) return res.status(400).json({error:"User already exists"});
  const hash = await bcrypt.hash(password, 10);
  const r = await run(`INSERT INTO users(username,email,password,dob,phone,balance,bonus,kyc_status)
    VALUES(?,?,?,?,?,?,?,?)`, [username,email,hash,dob,phone||"",0,0,"pending"]);
  const user = { id:r.lastID, username, email, balance:0, bonus:0, kyc_status:"pending" };
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn:"7d" });
  res.json({ user, token });
});

router.post("/login", async (req,res)=>{
  const { username, password } = req.body;
  const user = await q("SELECT * FROM users WHERE username=?", [username]);
  if (!user) return res.status(400).json({error:"Invalid credentials"});
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({error:"Invalid credentials"});
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn:"7d" });
  res.json({
    user: { id:user.id, username:user.username, email:user.email, balance:user.balance, bonus:user.bonus, kyc_status:user.kyc_status },
    token
  });
});

export default router;