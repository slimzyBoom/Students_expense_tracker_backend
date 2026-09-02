import app from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
connectDatabase()
  .then(() =>
    app.listen(env.PORT, () => logger.info(`API listening on ${env.PORT}`)),
  )
  .catch((error) => {
    logger.error("Database connection failed", error);
    process.exit(1);
  });
