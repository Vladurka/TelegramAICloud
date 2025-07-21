import { connectRabbitMQ } from "./src/lib/rabbitmq.js";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from "@clerk/express";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authAgentRouter from "./src/routes/auth-agent.route.js";
import agentRouter from "./src/routes/agent.route.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/auth-agent", authAgentRouter);
app.use("/api/agent", agentRouter);

app.use((error, req, res, next) => {
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  connectDB();
  connectRabbitMQ();
});
