import type { Express } from "express";
import Stripe from "stripe";
import { supabase } from "./lib/supabase";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const SUBSCRIPTION_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
};

export function setupStripeRoutes(app: Express) {
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { plan, userId } = req.body;

      if (!userId || !plan) {
        return res.status(400).send("Missing userId or plan");
      }

      if (!SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES]) {
        return res.status(400).send("Invalid subscription plan");
      }

      // Get the user to update their stripe customer id if needed
      const { data: user } = await supabase
        .from('users')
        .select('stripe_customer_id, email')
        .eq('id', userId)
        .single();

      let customerId = user?.stripe_customer_id;

      // Create or get Stripe customer
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email,
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

    if (!sig) {
      console.error('Missing stripe-signature header');
      return res.status(400).send('Missing stripe-signature header');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      console.log('Webhook event received:', event.type, 'Event ID:', event.id);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.supabase_user_id;
          const planId = subscription.items.data[0].price.id;

          let plan = 'free';
          if (planId === SUBSCRIPTION_PRICES.pro) plan = 'pro';
          if (planId === SUBSCRIPTION_PRICES.enterprise) plan = 'enterprise';

          console.log(`Updating subscription for user ${userId} to ${plan}`, 'Plan ID:', planId);

          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              subscription: plan,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
            return res.status(500).json({ error: 'Error updating subscription' });
          }

          console.log(`Successfully updated subscription for user ${userId} to ${plan}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.supabase_user_id;

          console.log(`Reverting subscription to free for user ${userId}`);

          const { error: deleteError } = await supabase
            .from('users')
            .update({ 
              subscription: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (deleteError) {
            console.error('Error updating subscription:', deleteError);
            return res.status(500).json({ error: 'Error updating subscription' });
          }

          console.log(`Successfully reverted subscription for user ${userId} to free`);
          break;
        }
      }

      res.json({ received: true, type: event.type });
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
}