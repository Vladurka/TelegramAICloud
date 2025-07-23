import { sendToQueue } from "../lib/rabbitmq.js";
import { Agent } from "../models/agent.model.js";
import { User } from "../models/user.model.js";
import { RabbitMQNotConnectedError } from "../errors/RabbitMQNotConnectedError.js";
import { MongoNetworkError, MongoServerError } from "mongodb";

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
    } = req.body;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const payload = {
      user_id: user._id,
      api_id: apiId,
      name,
      api_hash: apiHash,
      session_string: sessionString,
      prompt,
      typing_time: typingTime,
      reaction_time: reactionTime,
      model,
    };

    await Agent.create({
      user: user._id,
      apiId: apiId,
      apiHash: apiHash,
      sessionString: sessionString,
      name: name.trim(),
      prompt: prompt.trim(),
      typingTime: typingTime ?? 0,
      reactionTime: reactionTime ?? 0,
      model: model.trim(),
    });

    await sendToQueue("create_or_update_agent", payload);

    return res
      .status(200)
      .json({ status: "queued", type: "create_or_update_agent" });
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      return res.status(404).json({ error: "Agent already exists" });
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

export const updateAgent = async (req, res, next) => {
  try {
    const { clerkId, apiId, name, prompt, typingTime, reactionTime, model } =
      req.body;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const agent = await Agent.findOne({ apiId, user: user._id });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const payload = {
      user_id: user._id,
      api_id: apiId,
      api_hash: agent.apiHash,
      session_string: agent.sessionString,
      name: name?.trim() || agent.name,
      prompt: prompt?.trim() || agent.prompt,
      typing_time: typingTime ?? agent.typingTime,
      reaction_time: reactionTime ?? agent.reactionTime,
      model: model?.trim() || agent.model,
    };

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

    await sendToQueue("delete_agent", { api_id: apiId });

    const result = await Agent.deleteOne({ _id: agent._id });

    if (result.deletedCount <= 0) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json({ status: "queued", type: "delete_agent" });
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
    if (err) next(err);
  }
};
