import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stripeCustomerId: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    currentSubscriptionId: {
      type: String,
      ref: "Subscription",
      required: false,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
