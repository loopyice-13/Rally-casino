import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";

export const db = new sqlite3.Database("./casino.db");

export function initDb() {
  db.serialize(()=>{
    db.run(`CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      dob TEXT,
      phone TEXT,
      balance REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      kyc_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS deposits(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ref TEXT UNIQUE,
      amount REAL,
      currency TEXT,
      status TEXT DEFAULT 'pending',
      raw TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS withdrawals(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      method TEXT,
      account_name TEXT,
      account_number TEXT,
      reference TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS bets(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      game TEXT,
      stake REAL,
      payout REAL,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

export const q = (sql, params=[]) => new Promise((resolve, reject)=>{
  db.get(sql, params, function(err,row){ if(err) reject(err); else resolve(row); });
});

export const qall = (sql, params=[]) => new Promise((resolve, reject)=>{
  db.all(sql, params, function(err,rows){ if(err) reject(err); else resolve(rows); });
});

export const run = (sql, params=[]) => new Promise((resolve, reject)=>{
  db.run(sql, params, function(err){ if(err) reject(err); else resolve(this); });
});

export async function seedAdmin() {
  const admin = await q("SELECT * FROM users WHERE username=?", ["admin"]);
  if (!admin) {
    const hash = await bcrypt.hash("admin123", 10);
    await run(`INSERT INTO users(username,email,password,dob,phone,balance,bonus,kyc_status)
      VALUES(?,?,?,?,?,?,?,?)`, ["admin","admin@casino.local",hash,"1990-01-01","","0","0","verified"]);
  }
}