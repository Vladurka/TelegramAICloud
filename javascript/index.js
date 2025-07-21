import { connectRabbitMQ } from "./src/utils/rabbitmq.js";
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

await connectRabbitMQ();

app.use("/api/auth-agent", authAgentRouter);
app.use("/api/agent", agentRouter);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
