import { app } from "./app.js";
import { config } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
try {
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new Error("PORT inválido");
  const mode = await connectDatabase(config.mongoUri);
  const server = app.listen(config.port, "127.0.0.1", () => {
    console.log(`API: http://localhost:${config.port} | consistencia: ${mode}`);
    if (mode !== "transaction")
      console.warn(
        "Standalone: una sola instancia; usar replica set para atomicidad ante caídas.",
      );
  });
  server.on("error", async (error) => {
    console.error("No se pudo iniciar HTTP:", error.code);
    await disconnectDatabase();
    process.exitCode = 1;
  });
  const shutdown = () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch (error) {
  console.error(
    "No se pudo iniciar la API:",
    error.name,
    "(revisa MongoDB local y server/.env)",
  );
  await disconnectDatabase();
  process.exitCode = 1;
}
