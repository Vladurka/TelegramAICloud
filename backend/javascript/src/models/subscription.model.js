import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  containerId: {
    type: Number,
    required: true,
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  planType: {
    type: String,
    required: true,
    enum: ["month", "year"],
    trim: true,
  },
  currentPeriodStart: {
    type: Date,
    required: true,
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    trim: true,
  },
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
