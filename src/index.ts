import app from "./app";
import { env } from "./config/env";
import { queryClient } from "./db/client";
import { dbCheck } from "./db/utils";
import { logger } from "./config/logger";

const { status } = await dbCheck();
if (status === "success") logger.info("Database connected");
const server = app.listen(env.PORT, () => {
  logger.info("SERVER LISTENING ON PORT: " + env.PORT);
});

const shutdown = () =>
  server.close(() => queryClient.end().then(() => process.exit(0)));

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
