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
      trim: true,
    },
    sessionString: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
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
      enum: ["gpt-3.5-turbo"],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enu: ["active", "frozen"],
    },
  },
  { timestamps: true }
);

export const Agent = mongoose.model("Agent", agentSchema);
