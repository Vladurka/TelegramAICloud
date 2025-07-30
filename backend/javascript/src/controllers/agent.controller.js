import { sendToQueue } from "../lib/rabbitmq.js";
import { Agent } from "../models/agent.model.js";
import { User } from "../models/user.model.js";
import { MongoNetworkError, MongoServerError } from "mongodb";
import { RabbitMQNotConnectedError } from "../errors/RabbitMQNotConnectedError.js";
import { encryptAESGCM } from "../utils/hash.utils.js";
import { Subscription } from "../models/subscription.model.js";
import axios from "axios";
import { buildAgentPayloadForUpdate } from "../utils/agent.utils.js";

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
      status: "frozen",
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
      console.error("Failed to create subscription");
      return res.status(500).json({ error: "Failed to create subscription" });
    }
    return res.status(200).json({
      message: "Redirect to complete payment to unfreeze agent",
      url: response.data.url,
      status: "frozen",
    });
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

export const unfreezeAgent = async (req, res, next) => {
  try {
    const { apiId, clerkId, planType } = req.body;

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const agent = await Agent.findOne({
      apiId,
      user: user._id,
      status: "frozen",
    });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

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
      console.error("Failed to create subscription");
      return res.status(500).json({ error: "Failed to create subscription" });
    }
    return res.status(200).json({
      message: "Redirect to complete payment to unfreeze agent",
      url: response.data.url,
      status: "frozen",
    });
  } catch (err) {
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
    next(err);
  }
};

export const getAgentsByUser = async (req, res, next) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const agents = await Agent.find({ user: user._id }).select(
      "-_id apiId name status"
    );

    const agentsWithPlans = await Promise.all(
      agents.map(async (agent) => {
        const sub = await Subscription.findOne({
          containerId: agent.apiId,
          status: "active",
        }).select("planType -_id");
        return {
          ...agent.toObject(),
          planType: sub.planType,
        };
      })
    );

    return res.status(200).json({ agents: agentsWithPlans });
  } catch (err) {
    if (err.name === "MongoNetworkError") {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
    next(err);
  }
};

export const getAgentById = async (req, res, next) => {
  try {
    const { apiId, clerkId } = req.params;

    if (!apiId || isNaN(apiId) || !clerkId)
      return res.status(400).json({ error: "apiId and clerkId are required" });

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const agent = await Agent.findOne({ apiId, user: user._id }).select(
      "-_id name status prompt typingTime reactionTime model"
    );
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const sub = await Subscription.findOne({
      containerId: apiId,
      status: "active",
    }).select("planType -_id");

    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    const agentObj = agent.toObject();
    agentObj.planType = sub.planType;

    return res.status(200).json({ agent: agentObj });
  } catch (err) {
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
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
      const agentData = agent.toObject();
      delete agentData._id;
      await Agent.create(agentData);
      console.error("Failed to cancel subscription");
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
