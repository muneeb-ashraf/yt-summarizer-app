import type { Express } from "express";
import Stripe from "stripe";
import { supabase, getUser } from "./lib/supabase";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const SUBSCRIPTION_PRICES = {
  pro: "price_mock_pro",
  enterprise: "price_mock_enterprise"
};

export function setupStripeRoutes(app: Express) {
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { plan, userId } = req.body;

      if (!userId || !plan) {
        return res.status(400).send("Missing userId or plan");
      }

      // Get the user to update their stripe customer id if needed
      const { data: user } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      let customerId = user?.stripe_customer_id;

      // Create or get Stripe customer
      if (!customerId) {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();

        const customer = await stripe.customers.create({
          email: userData?.email,
          metadata: {
            supabase_user_id: userId
          }
        });

        customerId = customer.id;

        // Update user with Stripe customer ID
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES],
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/subscription`,
        subscription_data: {
          metadata: {
            supabase_user_id: userId,
          },
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Handle Stripe webhook
  app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const payload = req.rawBody;

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        sig || '',
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.supabase_user_id;
          const planId = subscription.items.data[0].price.id;

          let plan = 'free';
          if (planId === SUBSCRIPTION_PRICES.pro) plan = 'pro';
          if (planId === SUBSCRIPTION_PRICES.enterprise) plan = 'enterprise';

          await supabase
            .from('users')
            .update({ subscription: plan })
            .eq('id', userId);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          const deletedUserId = deletedSubscription.metadata.supabase_user_id;

          await supabase
            .from('users')
            .update({ subscription: 'free' })
            .eq('id', deletedUserId);
          break;
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
}