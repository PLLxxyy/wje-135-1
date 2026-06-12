import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database.config";
import { logger } from "./utils/logger";

const port = Number(process.env.PORT || 3000);

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = app.listen(port, "0.0.0.0", () => {
    logger.info(`warehouse-stock backend listening on ${port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((error) => {
  logger.error("failed to bootstrap", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
