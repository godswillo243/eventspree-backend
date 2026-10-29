import app from "./app";
import { env } from "./config/env";
import { db } from "./db/client";
import { sql } from "drizzle-orm";
import { dbCheck } from "./db/utils";

const start = () => {
  dbCheck();
  app.listen(env.PORT, () => {
    console.log("SERVER LISTENING ON PORT: " + env.PORT);
  });
};

start();
