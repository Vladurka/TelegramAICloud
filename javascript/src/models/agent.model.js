import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apiId: {
      type: Number,
      required: true,
      unique: true,
    },
    apiHash: {
      type: String,
      required: true,
    },
    sessionString: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    typingTime: {
      type: Number,
      required: false,
    },
    reactionTime: {
      type: Number,
      required: false,
    },
    model: {
      type: String,
      required: true,
      enum: [
        "gpt-4o",
        "gpt-4o-mini",
        "o3",
        "o4-mini",
        "o4-mini-high",
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4.1-nano",
        "gpt-4.5",
      ],
    },
  },
  { timestamps: true }
);

export const Agent = mongoose.model("Agent", agentSchema);
