import { sendToQueue } from "../lib/rabbitmq.js";
import { Agent } from "../models/agent.model.js";
import { User } from "../models/user.model.js";

export const createAgent = async (req, res) => {
  const { apiId, apiHash, sessionString, prompt, replyTime, clerkId } =
    req.body;

  if (
    !apiId ||
    !apiHash ||
    !sessionString ||
    !prompt ||
    !replyTime ||
    replyTime < 0 ||
    !clerkId
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const payload = {
      api_id: apiId,
      api_hash: apiHash,
      session_string: sessionString,
      prompt: prompt,
      reply_time: replyTime,
    };

    await sendToQueue("create_agent", payload);

    const user = await User.findOne({ clerkId: clerkId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await Agent.create({
      apiId,
      user: user._id,
    });
    res.json({ status: "queued", type: "create_agent" });
  } catch (err) {
    console.error("Failed to enqueue create_agent:", err);
    res.status(500).json({ error: "Failed to queue message" });
  }
};

export const deleteAgent = async (req, res) => {
  const { api_id, clerkId } = req.body;

  if (!api_id || !clerkId) {
    return res.status(400).json({ error: "api_id and clerkId are required" });
  }

  try {
    const user = await User.findOne({ clerkId: clerkId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const agent = await Agent.findOne({ apiId: api_id, user: user._id });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    await sendToQueue("delete_agent", { api_id });
    await Agent.deleteOne({ _id: agent._id });
    res.json({ status: "queued", type: "delete_agent" });
  } catch (err) {
    console.error("Failed to enqueue delete_agent:", err);
    res.status(500).json({ error: "Failed to queue message" });
  }
};
