import express from "express";
import type { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import helmet from "helmet";
import { dbCheck } from "./db/utils";
import { errorHandler } from "./middleware/error";
import authRoutes from "./mods/auth/auth.routes";
import { requestLogger } from "./middleware/request-logger";
import { getErrorResponse } from "./lib/utils";
import { sendTestEmail } from "./lib/email";

const app: Express = express();

app.disable("x-powered-by");

app.use(
  helmet({
    xPoweredBy: false,
    contentSecurityPolicy: false,
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }),
);

app.use(
  cors({
    credentials: true,
    origin: [env.CLIENT_URL],
  }),
);
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json());

app.use(requestLogger);

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Service working alright.",
  });
});

app.get("/health/db", async (req, res) => {
  const result = await dbCheck();

  if (result.status === "success") {
    res.status(200).json({
      message: "Database is working alright.",
      status: "healthy",
    });
  } else {
    res.status(500).json({
      message: "Error with database",
      status: "error",
    });
  }
});

app.post("/test/email", async (req, res) => {
  const { data, error } = await sendTestEmail(req.body.emails);

  if (error)
    return res.status(400).json({ message: "Error sending email", error });
  res.status(200).json({ message: "Email sent. Yay!", data });
});

app.use("/auth", authRoutes);

app.use(errorHandler);
app.use((req, res) => {
  res.status(404).json(getErrorResponse("Route not found.", "NOT_FOUND"));
});

export default app;
