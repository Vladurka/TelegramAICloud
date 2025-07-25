import { stripe } from "../lib/stripe.js";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { sendToQueue } from "../lib/rabbitmq.js";
import { Subscription } from "../models/subscription.model.js";
import { Agent } from "../models/agent.model.js";
import { buildAgentPayloadFromAgent } from "../utils/agent.utils.js";
import { startAgent } from "./agent.controller.js";

dotenv.config();

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
    console.error("❌ Invalid webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        console.log("▶️ Handling checkout.session.completed");
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "payment_intent.payment_failed":
        console.log("▶️ Handling payment_intent.payment_failed");
        await handleCheckoutSessionFailed(event.data.object);
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

async function handleCheckoutSessionCompleted(session) {
  const { containerId, planType, user: userId } = session.metadata || {};
  const stripeCustomerId = session.customer;
  const subscriptionId = session.subscription;

  console.log(session.metadata);

  if (!containerId || !stripeCustomerId || !userId || !planType) {
    throw new Error("❗ Missing required session metadata");
  }

  if (!subscriptionId) throw new Error("❗Missing subscription ID");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const startDate = new Date();
  const endDate = new Date(startDate);

  if (planType === "month") {
    endDate.setMonth(startDate.getMonth() + 1);
  } else if (planType === "year") {
    endDate.setFullYear(startDate.getFullYear() + 1);
  }

  await Subscription.create({
    user: userId,
    containerId,
    stripeSubscriptionId: subscription.id,
    planType,
    currentPeriodStart: startDate,
    currentPeriodEnd: endDate,
    status: subscription.status,
  });

  const user = await User.findOne({ stripeCustomerId });

  if (!user) throw new Error(`❗User with ${stripeCustomerId} not found`);

  if (!user.currentSubscriptionIds.includes(subscriptionId))
    user.currentSubscriptionIds.push(subscriptionId);

  await user.save();

  const agent = await Agent.findOneAndUpdate(
    { apiId: containerId },
    { status: "active" }
  );

  if (!agent) throw new Error(`❗Agent with ${containerId} not found`);

  const payload = buildAgentPayloadFromAgent(userId, agent);
  await startAgent(payload);

  console.log("✅ Subscription started for container:", containerId);
}

async function handleCheckoutSessionFailed(session) {
  console.log("⚠️ Handling failed session:", session);

  const containerId = session.metadata?.containerId;
  const stripeCustomerId = session.customer;

  if (!containerId || !stripeCustomerId) {
    throw new Error(
      "❗ Missing containerId or stripeCustomerId in failed session"
    );
  }

  await Agent.findOneAndUpdate({ apiId: containerId }, { status: "frozen" });

  console.log("✅ Subscription marked as failed for container:", containerId);
}

async function handlePaymentFailed(invoice) {
  console.log("⚠️ Handling failed payment:", invoice);

  const containerId = invoice.metadata?.containerId;
  const stripeCustomerId = invoice.customer;

  if (!containerId || !stripeCustomerId) {
    throw new Error(
      "❗Missing containerId or stripeCustomerId in failed session"
    );
  }

  await Agent.findOneAndUpdate({ apiId: containerId }, { status: "frozen" });

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: invoice.subscription },
    {
      status: "failed",
    }
  );

  await sendToQueue("stop_agent", { api_id: containerId });

  console.log("✅ Subscription marked as failed for container:", containerId);
}

async function handleSubscriptionCanceled(subscription) {
  console.log("⚠️ Handling canceled subscription:", subscription);

  const containerId = subscription.metadata?.containerId;
  const stripeCustomerId = subscription.customer;

  if (!containerId || !stripeCustomerId) {
    throw new Error(
      "❗ Missing containerId or stripeCustomerId in canceled subscription"
    );
  }

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: subscription.status || "canceled",
    }
  );

  await sendToQueue("delete_agent", { api_id: Number(containerId) });

  console.log("✅ Subscription marked as canceled for container:", containerId);
}
