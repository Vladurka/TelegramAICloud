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
  },
  { timestamps: true }
);

export const Agent = mongoose.model("Agent", agentSchema);
