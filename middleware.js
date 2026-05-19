import jwt from "jsonwebtoken";
import { q } from "./db.js";

export function auth(req,res,next){
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({error:"Unauthorized"});
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({error:"Invalid token"});
  }
}

export async function adminOnly(req,res,next){
  const u = await q("SELECT * FROM users WHERE id=?", [req.user.id]);
  if (!u || u.username !== "admin") return res.status(403).json({error:"Forbidden"});
  next();
}