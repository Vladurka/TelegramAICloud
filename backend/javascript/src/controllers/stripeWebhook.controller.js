import { stripe } from "../lib/stripe.js";
import { User } from "../models/user.model.js";
import { sendToQueue } from "../lib/rabbitmq.js";
import { Subscription } from "../models/subscription.model.js";
import { Agent } from "../models/agent.model.js";
import {
  buildAgentPayloadFromAgent,
  startAgent,
} from "../utils/agent.utils.js";
import { axiosInstance } from "../lib/axios.js";
import mongoose from "mongoose";

// Stripe Webhook Handler
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  console.log("📩 Incoming webhook");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook verified:", event.type);
  } catch (err) {
    console.error("❌ Invalid webhook signature:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded":
        console.log("▶️ Handling invoice.payment_succeeded");
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        console.log("▶️ Handling invoice.payment_failed");
        await handlePaymentFailed(event.data.object);
        break;

      case "customer.subscription.deleted":
        console.log("▶️ Handling customer.subscription.deleted");
        await handleSubscriptionCanceled(event.data.object);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return res.status(200).send("Webhook received");
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return res.status(500).send("Internal Server Error");
  }
};

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const subscriptionId = invoice?.subscription;

    if (!subscriptionId) {
      throw new Error("❗Missing subscriptionId in payment success");
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const metadata = subscription.metadata || {};

    const containerId = metadata.containerId;
    const userId = metadata.user;
    const planType = metadata.planType;
    const stripeCustomerId = subscription.customer;

    if (!containerId || !userId || !planType || !stripeCustomerId) {
      throw new Error("❗Missing metadata in payment success");
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (planType === "month") endDate.setMonth(startDate.getMonth() + 1);
    else if (planType === "year")
      endDate.setFullYear(startDate.getFullYear() + 1);

    const existing = await Subscription.findOne(
      { stripeSubscriptionId: subscriptionId },
      null,
      { session }
    );

    if (!existing) {
      await Subscription.create(
        [
          {
            user: userId,
            containerId: Number(containerId),
            stripeSubscriptionId: subscription.id,
            planType,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
            status: subscription.status,
          },
        ],
        { session }
      );
      console.log("📦 Created new subscription record");
    } else {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
          status: "active",
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
        },
        { session }
      );
      console.log("🔄 Updated existing subscription");
    }

    const user = await User.findOne({ stripeCustomerId }, null, { session });
    if (!user) throw new Error(`❗User with ${stripeCustomerId} is not found`);

    if (!user.currentSubscriptionIds.includes(subscriptionId)) {
      user.currentSubscriptionIds.push(subscriptionId);
      await user.save({ session });
      console.log("👤 Updated user's subscription IDs");
    }

    const agent = await Agent.findOneAndUpdate(
      { apiId: Number(containerId) },
      { status: "active" },
      { session }
    );
    if (!agent) throw new Error(`❗Agent with ${containerId} is not found`);

    const payload = buildAgentPayloadFromAgent(userId, agent);
    await startAgent(payload);
    console.log("✅ Agent started for container:", containerId);

    await session.commitTransaction();
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    await axiosInstance.post("/subscription/cancel", {
      containerId: invoice.metadata?.containerId,
      clerkId: invoice.metadata?.user,
    });

    console.error("❌ Error during payment success handling:", error);
    throw error;
  } finally {
    session.endSession();
  }
}

async function handlePaymentFailed(invoice) {
  console.log("⚠️ Handling failed payment:", invoice);

  const containerId = invoice.metadata?.containerId;
  const userId = invoice.metadata?.user;
  const stripeCustomerId = invoice.customer;

  if (!containerId || !stripeCustomerId || !userId) {
    throw new Error("❗Missing data in failed session");
  }

  const exists = await Subscription.findOne({
    containerId: Number(containerId),
    status: "active",
    user: userId,
  });

  if (exists) {
    await Agent.findOneAndUpdate(
      { apiId: Number(containerId) },
      { status: "frozen" }
    );

    const user = await User.findById(userId);
    if (!user) throw new Error(`❗User with ID ${userId} is not found`);

    await axiosInstance.post("/subscription/cancel", {
      containerId,
      clerkId: user.clerkId,
    });

    console.log("🧊 Agent frozen and subscription canceled");
  }
}

async function handleSubscriptionCanceled(subscription) {
  console.log("⚠️ Handling canceled subscription:", subscription);

  const containerId = subscription.metadata?.containerId;
  const stripeCustomerId = subscription.customer;

  if (!containerId || !stripeCustomerId) {
    throw new Error(
      "❗Missing containerId or stripeCustomerId in canceled subscription"
    );
  }

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    { status: subscription.status || "canceled" }
  );

  await sendToQueue("delete_agent", { api_id: Number(containerId) });

  console.log("✅ Subscription marked as canceled for container:", containerId);
}
