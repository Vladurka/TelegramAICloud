import { stripe } from "../lib/stripe.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { MongoNetworkError } from "mongodb";

export const createSubscription = async (req, res, next) => {
  const { clerkId, containerId, planType } = req.body;

  try {
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const url =
      process.env.NODE_ENV === "production"
        ? process.env.PROD_CLIENT_URL + "/agents"
        : process.env.DEV_CLIENT_URL + "/agents";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: user.stripeCustomerId,
      line_items: [
        {
          price:
            planType === "month"
              ? process.env.STRIPE_PRICE_ID_MONTH
              : process.env.STRIPE_PRICE_ID_YEAR,
          quantity: 1,
        },
      ],
      metadata: {
        containerId: containerId.toString(),
        planType: planType,
        user: user._id.toString(),
      },
      subscription_data: {
        metadata: {
          containerId: containerId.toString(),
          planType: planType,
          user: user._id.toString(),
        },
      },
      success_url: url,
      cancel_url: url,
    });

    res
      .status(201)
      .json({ message: "Subscription has been opened", url: session.url });
  } catch (err) {
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
    next(err);
  }
};

export const cancelSubscription = async (req, res, next) => {
  const { containerId, clerkId } = req.body;

  try {
    if (!containerId || !clerkId)
      return res
        .status(400)
        .json({ error: "containerId and clerkId are required" });

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const subscription = await Subscription.findOne({
      containerId,
      status: "active",
      user: user._id,
    });

    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });

    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    res.status(200).json({ message: "Subscription has been canceled" });
  } catch (err) {
    if (err instanceof MongoNetworkError) {
      return res.status(503).json({
        error: "Database connection error. Please try again later.",
      });
    }
    next(err);
  }
};
