import { sendToQueue } from "../utils/rabbitmq.js";

export const createAgent = async (req, res) => {
  const { api_id, api_hash, session_string, prompt, reply_time } = req.body;

  if (!api_id || !api_hash || !session_string || !prompt || !reply_time) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const payload = {
      api_id,
      api_hash,
      session_string,
      prompt,
      reply_time,
    };

    await sendToQueue("create_agent", payload);
    res.json({ status: "queued", type: "create_agent" });
  } catch (err) {
    console.error("Failed to enqueue create_agent:", err);
    res.status(500).json({ error: "Failed to queue message" });
  }
};

export const deleteAgent = async (req, res) => {
  const { api_id } = req.body;

  if (!api_id) return res.status(400).json({ error: "api_id required" });

  try {
    await sendToQueue("delete_agent", { api_id });
    res.json({ status: "queued", type: "delete_agent" });
  } catch (err) {
    console.error("Failed to enqueue delete_agent:", err);
    res.status(500).json({ error: "Failed to queue message" });
  }
};
