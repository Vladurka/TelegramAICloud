import { sendToQueue } from "../lib/rabbitmq.js";
import { Agent } from "../models/agent.model.js";
import { User } from "../models/user.model.js";
import { MongoNetworkError } from "mongodb";
import { RabbitMQNotConnectedError } from "../errors/RabbitMQNotConnectedError.js";
import { encryptAESGCM } from "../utils/hash.utils.js";
import { Subscription } from "../models/subscription.model.js";
import { axiosInstance } from "../lib/axios.js";
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

    const agent = await Agent.create({
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

    if (process.env.NODE_ENV !== "test") {
      let response;
      try {
        response = await axiosInstance.post("/subscription/create", {
          clerkId: clerkId,
          containerId: apiId,
          planType: planType,
        });
      } catch (err) {
        console.error("Failed to create subscription");
        await Agent.deleteOne({ _id: agent._id });
        return res.status(500).json({ error: "Failed to create subscription" });
      }
      return res.status(200).json({
        message: "Redirect to complete payment to unfreeze agent",
        url: response.data.url,
        status: "frozen",
      });
    }

    return res.status(200).json({
      message: "Test agent created successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
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

    if (process.env.NODE_ENV !== "test") {
      let response;
      try {
        response = await axiosInstance.post("/subscription/create", {
          clerkId: clerkId,
          containerId: apiId,
          planType: planType,
        });
      } catch (err) {
        console.error("Failed to create subscription");
        return res.status(500).json({ error: "Failed to create subscription" });
      }

      return res.status(200).json({
        message: "Redirect to complete payment to unfreeze agent",
        url: response.data.url,
        status: "frozen",
      });
    }

    return res.status(200).json({
      message: "Test agent unfreeze request received successfully",
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

    if (!clerkId) {
      return res.status(400).json({ error: "clerkId is required" });
    }

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
        if (!sub) return agent;
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

    if (!sub) return res.status(200).json({ agent: agent });

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
    const { clerkId, apiId } = req.body;

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

    if (process.env.NODE_ENV !== "test") {
      await sendToQueue("create_or_update_agent", payload);
    }

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

    let subscriptionStatus = "skipped (test env)";
    if (process.env.NODE_ENV !== "test") {
      try {
        await axiosInstance.post("/subscription/cancel", {
          containerId: apiId,
          clerkId,
        });
        subscriptionStatus = "canceled";
      } catch (err) {
        const agentData = agent.toObject();
        delete agentData._id;
        await Agent.create(agentData);
        console.error("Failed to cancel subscription");
        return res.status(500).json({ error: "Failed to cancel subscription" });
      }
    }

    return res.json({ status: "deleted", subscription: subscriptionStatus });
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
