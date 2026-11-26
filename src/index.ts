import app from "./app";
import { env } from "./config/env";
import { queryClient } from "./db/client";
import { dbCheck } from "./db/utils";
import { logger } from "./config/logger";

const startServer = async () => {
  try {
    const { status } = await dbCheck();

    if (status !== "success") {
      throw new Error("Database connection failed");
    }

    logger.info("Database connected");

    const server = app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(`SERVER LISTENING ON PORT: ${env.PORT}`);
    });

    const shutdown = () => {
      server.close(async () => {
        try {
          await queryClient.end();
          process.exit(0);
        } catch (error) {
          console.error(error);
          process.exit(1);
        }
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error(error);
    await queryClient.end();
    process.exit(1);
  }
};

startServer();
