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
    currentSubscriptionIds: {
      type: [String],
      required: false,
      set: (arr) => arr.map((str) => str.trim()),
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
