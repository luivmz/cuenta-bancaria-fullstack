import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import accounts from "./routes/accounts.js";
import { config } from "./config/env.js";
import { database } from "./config/database.js";
import { errorHandler } from "./middleware/errors.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: "10kb" }));
app.get("/api/health", async (req, res) => {
  let ready = mongoose.connection.readyState === 1 && !database.halted;
  if (ready) {
    try {
      await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 2000 });
    } catch {
      ready = false;
    }
  }
  res.status(ready ? 200 : 503).json({
    data: {
      status: ready ? "ok" : "unavailable",
      consistency: database.transactions
        ? "transaction"
        : "compensating-single-process",
    },
  });
});
app.use("/api/cuenta", accounts);
app.use((req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Ruta no encontrada." } }),
);
app.use(errorHandler);
