import { sendToQueue } from "../lib/rabbitmq.js";
import { Agent } from "../models/agent.model.js";
import { User } from "../models/user.model.js";
import { MongoNetworkError, MongoServerError } from "mongodb";
import { buildAgentPayloadForUpdate } from "../utils/agent.utils.js";
import { RabbitMQNotConnectedError } from "../errors/RabbitMQNotConnectedError.js";
import { encryptAESGCM } from "../utils/hash.utils.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const createAgent = async (req, res, next) => {
  try {
    const {
      clerkId,
      apiId,
      name,
      apiHash,
      sessionString,
      prompt,
      typingTime,
      reactionTime,
      model,
      planType,
    } = req.body;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    await Agent.create({
      user: user._id,
      apiId: apiId,
      apiHash: apiHash,
      sessionString: encryptAESGCM(sessionString),
      name: name.trim(),
      prompt: prompt.trim(),
      typingTime: typingTime ?? 0,
      reactionTime: reactionTime ?? 0,
      model: model.trim(),
      status: "draft",
    });

    let response;
    try {
      response = await axios.post(
        `${process.env.SERVER_URL}/subscription/create`,
        {
          clerkId: clerkId,
          containerId: apiId,
          planType: planType,
        }
      );
    } catch (err) {
      return res.status(500).json({ error: "Failed to create subscription" });
    }

    const url = response.data.url;

    return res.status(200).json({ "Pay to start": url, status: "draft" });
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      return res.status(400).json({ error: "Agent already exists" });
    }
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
    if (err instanceof RabbitMQNotConnectedError) {
      return res.status(503).json({
        error: "RabbitMQ is not connected. Please try again later.",
      });
    }
    next(err);
  }
};

export const startAgent = async (payload) => {
  const agent = await Agent.findOne({ apiId: payload.api_id });
  agent.status = "active";
  agent.save();

  await sendToQueue("create_or_update_agent", payload);
};

export const getAgentsByUser = async (req, res, next) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const agents = await Agent.find({ user: user._id }).select(
      "-_id apiId name prompt typingTime reactionTime model status"
    );
    return res.status(200).json(agents);
  } catch (err) {
    next(err);
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
  }
};

export const updateAgent = async (req, res, next) => {
  try {
    const { clerkId, apiId, name, prompt, typingTime, reactionTime, model } =
      req.body;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const agent = await Agent.findOne({ apiId, user: user._id });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const payload = buildAgentPayloadForUpdate(user._id, req.body, agent);

    await Agent.updateOne(
      { _id: agent._id },
      {
        name: payload.name,
        prompt: payload.prompt,
        typingTime: payload.typing_time,
        reactionTime: payload.reaction_time,
        model: payload.model,
      }
    );

    await sendToQueue("create_or_update_agent", payload);

    return res.json({ status: "queued", type: "create_or_update_agent" });
  } catch (err) {
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
    if (err instanceof RabbitMQNotConnectedError) {
      return res.status(503).json({
        error: "RabbitMQ is not connected. Please try again later.",
      });
    }
    next(err);
  }
};

export const deleteAgent = async (req, res, next) => {
  const { apiId, clerkId } = req.body;

  if (!apiId || !clerkId) {
    return res.status(400).json({ error: "apiId and clerkId are required" });
  }

  try {
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const agent = await Agent.findOne({ apiId, user: user._id });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    await Agent.deleteOne({ _id: agent._id });

    try {
      await axios.post(`${process.env.SERVER_URL}/subscription/cancel`, {
        containerId: apiId,
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }

    res.json({ status: "deleted", subscription: "canceled" });
  } catch (err) {
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
    if (err instanceof RabbitMQNotConnectedError) {
      return res.status(503).json({
        error: "RabbitMQ is not connected. Please try again later.",
      });
    }
    next(err);
  }
};
