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

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.NODE_ENV === "production"
        ? process.env.PROD_STRIPE_WEBHOOK_SECRET
        : process.env.DEV_STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Invalid webhook signature:", err.message);
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
    }

    return res.status(200).send("Webhook received");
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return res.status(500).send("Internal Server Error");
  }
};

async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.parent.subscription_details.subscription;

  if (!subscriptionId)
    throw new Error("❗Missing subscriptionId in payment success");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const metadata = subscription.metadata;

  const containerId = metadata.containerId;
  const stripeCustomerId = subscription.customer;
  const userId = metadata.user;
  const planType = metadata.planType;

  if (!containerId || !stripeCustomerId || !userId || !planType) {
    throw new Error("❗Missing metadata in payment success");
  }

  const startDate = new Date();
  const endDate = new Date(startDate);

  if (planType === "month") {
    endDate.setMonth(startDate.getMonth() + 1);
  } else if (planType === "year") {
    endDate.setFullYear(startDate.getFullYear() + 1);
  }

  const existing = await Subscription.findOne({
    stripeSubscriptionId: subscriptionId,
  });

  if (!existing) {
    await Subscription.create({
      user: userId,
      containerId,
      stripeSubscriptionId: subscription.id,
      planType,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      status: subscription.status,
    });
    console.log("📦 Created new subscription record");
  } else {
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: "active",
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      }
    );
    console.log("🔄 Updated existing subscription");
  }

  const user = await User.findOne({ stripeCustomerId });
  if (!user) throw new Error(`❗User with ${stripeCustomerId} not found`);

  user.currentSubscriptionIds = user.currentSubscriptionIds || [];
  if (!user.currentSubscriptionIds.includes(subscriptionId)) {
    user.currentSubscriptionIds.push(subscriptionId);
    await user.save();
    console.log("👤 Updated user's subscription IDs");
  }

  const agent = await Agent.findOneAndUpdate(
    { apiId: containerId },
    { status: "active" }
  );

  if (!agent) throw new Error(`❗Agent with ${containerId} not found`);

  const payload = buildAgentPayloadFromAgent(userId, agent);
  await startAgent(payload);

  console.log("✅ Agent started for container:", containerId);
}

async function handlePaymentFailed(invoice) {
  const containerId = invoice.metadata?.containerId;
  const stripeCustomerId = invoice.customer;

  if (!containerId || !stripeCustomerId) {
    throw new Error(
      "❗Missing containerId or stripeCustomerId in failed session"
    );
  }

  const exists = await Subscription.findOne({
    containerId,
    status: "active",
  });

  if (exists) {
    const user = await User.findOne({ stripeCustomerId: stripeCustomerId });
    if (!user) throw new Error(`❗User with ${stripeCustomerId} not found`);

    await Agent.findOneAndUpdate({ apiId: containerId }, { status: "frozen" });

    await axiosInstance.post("/subscription/cancel", {
      containerId,
      clerkId: user.clerkId,
    });

    console.log("🧊 Agent frozen and subscription canceled");
  }
}

async function handleSubscriptionCanceled(subscription) {
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
