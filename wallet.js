import express from "express";
import { auth } from "../middleware.js";
import { q } from "../db.js";

const router = express.Router();

router.get("/", auth, async (req,res)=>{
  const user = await q("SELECT id,username,email,balance,bonus,kyc_status FROM users WHERE id=?", [req.user.id]);
  res.json(user || { balance:0, bonus:0 });
});

export default router;