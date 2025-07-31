import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authAgentRouter from "./src/routes/auth-agent.route.js";
import agentRouter from "./src/routes/agent.route.js";
import subscriptionRouter from "./src/routes/subscription.route.js";

import { connectRabbitMQ } from "./src/lib/rabbitmq.js";
import { connectDB } from "./src/lib/db.js";
import { clerkMiddleware } from "@clerk/express";
import { stripeWebhook } from "./src/controllers/stripeWebhook.controller.js";
import { authCallback } from "./src/controllers/auth.controller.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://91.99.134.169:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());
app.use(clerkMiddleware());

app.post("/api/auth/callback", authCallback);

app.use("/api/auth-agent", authAgentRouter);
app.use("/api/agent", agentRouter);
app.use("/api/subscription", subscriptionRouter);

app.use((error, req, res, next) => {
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

export default app;

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  connectDB();
  connectRabbitMQ();
});
