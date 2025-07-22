import { sendToQueue } from "../lib/rabbitmq.js";
import { Agent } from "../models/agent.model.js";
import { User } from "../models/user.model.js";

export const createOrUpdateAgent = async (req, res, next) => {
  const { apiId, apiHash, sessionString, prompt, typingTime, clerkId } =
    req.body;

  if (
    !apiId ||
    !apiHash ||
    !sessionString ||
    !prompt ||
    typingTime == null ||
    isNaN(Number(typingTime)) ||
    Number(typingTime) < 0 ||
    !clerkId
  ) {
    return res
      .status(400)
      .json({ error: "Missing or invalid required fields" });
  }

  try {
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const payload = {
      api_id: apiId,
      api_hash: apiHash,
      session_string: sessionString,
      prompt,
      typing_time: Number(typingTime),
    };

    await sendToQueue("create_or_update_agent", payload);

    if (!(await Agent.exists({ apiId, user: user._id }))) {
      await Agent.create({
        apiId,
        user: user._id,
      });
    }

    res.json({ status: "queued", type: "create_or_update_agent" });
  } catch (err) {
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
    await Agent.deleteOne({ _id: agent._id });

    res.json({ status: "queued", type: "delete_agent" });
  } catch (err) {
    next(err);
  }
};
