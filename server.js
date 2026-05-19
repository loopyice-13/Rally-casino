require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const depositRoutesFactory = require("./routes/deposits");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^w.-]/g, "_").replace(/s+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG, PNG, or WEBP images are allowed."), ok);
  }
});

app.use(cors({ origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "Rally Casino API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/deposits", depositRoutesFactory(upload));

app.use((err, _req, res, _next) => {
  if (!err) return res.status(500).json({ error: "Unknown error" });
  res.status(400).json({ error: err.message || "Request failed" });
});

app.listen(PORT, () => console.log(`Rally Casino backend running on ${PORT}`));
