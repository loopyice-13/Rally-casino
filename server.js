import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { initDb, seedAdmin } from "./db.js";
import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import paymentRoutes from "./routes/payments.js";
import withdrawalRoutes from "./routes/withdrawals.js";
import gameRoutes from "./routes/games.js";

initDb();
await seedAdmin();

const app = express();
app.use(cors({ origin:true, credentials:true }));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

app.get("/health", (_,res)=>res.send("ok"));
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/games", gameRoutes);

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`Server running on ${port}`));