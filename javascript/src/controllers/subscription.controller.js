import { stripe } from "../lib/stripe.js";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

export const openSubscription = async (req, res) => {
  const { clerkId, containerId, planType } = req.body;

  const user = await User.findOne({ clerkId });
  if (!user) return res.status(404).json({ error: "User not found" });

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
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
  });

  res
    .status(201)
    .json({ message: "Subscription has been opened", url: session.url });
};
