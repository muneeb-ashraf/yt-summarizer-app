import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";
import Stripe from "stripe";
import { updateUserCredits } from "@/lib/prisma";
import { PLANS } from "@/utils/plans";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function getPlanSummariesLimit(planId: string): number {
  const plan = PLANS.find(p => p.id === planId);
  return plan?.summariesLimit || 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature")!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new NextResponse("Webhook signature verification failed", { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("No userId in session metadata");
          return new NextResponse("No userId in session metadata", { status: 400 });
        }

        // Get the subscription to determine the plan
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const price = await stripe.prices.retrieve(
          subscription.items.data[0].price.id
        );
        const product = await stripe.products.retrieve(price.product as string);
        const planId = product.metadata.plan || "pro"; // Default to pro if not specified

        // Update the user's subscription status in the database
        await updateUserCredits(userId, {
          stripeCustomerId: session.customer as string,
          subscriptionId: session.subscription as string,
          subscriptionStatus: "active",
          plan: planId,
          summariesLeft: getPlanSummariesLimit(planId),
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get the customer's user ID from your database
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = customer.metadata?.userId;

        if (!userId) {
          console.error("No userId in customer metadata");
          return new NextResponse("No userId in customer metadata", { status: 400 });
        }

        // Update the user's subscription status in the database
        const newStatus = subscription.status;
        const isActive = newStatus === "active";
        
        await updateUserCredits(userId, {
          subscriptionStatus: newStatus,
          subscriptionId: subscription.id,
          plan: isActive ? "free" : "free", // Reset to free plan if subscription is canceled
          summariesLeft: isActive ? getPlanSummariesLimit("free") : getPlanSummariesLimit("free"), // Reset to free plan limits
        });

        break;
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
} 