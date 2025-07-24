import { stripe } from "../lib/stripe.js";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { sendToQueue } from "../lib/rabbitmq.js";
import { Subscription } from "../models/subscription.model.js";

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

  if (!containerId || !stripeCustomerId || !userId || !planType) {
    throw new Error("❗ Missing required session metadata");
  }

  if (!subscriptionId) {
    throw new Error("❗ Missing subscription ID in session");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await Subscription.create({
    user: userId,
    containerId,
    stripeSubscriptionId: subscription.id,
    planType,
    currentPeriodStart: new Date(session.created * 1000),
    currentPeriodEnd: new Date(session.expires_at * 1000),
    status: subscription.status,
  });
  console.log("✅ Subscription saved to DB");

  const user = await User.findOne({ stripeCustomerId });
  if (!user) {
    throw new Error(
      `❗ User with stripeCustomerId ${stripeCustomerId} not found`
    );
  }

  user.currentSubscriptionId = subscription.id;
  await user.save();
  console.log("✅ User updated with currentSubscriptionId");
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

  const user = await User.findOne({ stripeCustomerId });
  if (!user) {
    throw new Error(
      `❗ User with stripeCustomerId ${stripeCustomerId} not found`
    );
  }

  await sendToQueue("stop_agent", { api_id: containerId });
  user.currentSubscriptionId = null;
  await user.save();

  console.log("❌ Subscription marked as failed for container:", containerId);
}
