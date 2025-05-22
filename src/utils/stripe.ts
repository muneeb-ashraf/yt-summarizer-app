import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

export type StripeProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  summariesLimit: number;
};

export const PLANS: StripeProduct[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out the service',
    price: 0,
    summariesLimit: 3,
    features: [
      '3 video summaries per month',
      'Basic summary quality',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for content creators',
    price: 9.99,
    summariesLimit: 20,
    features: [
      '20 video summaries per month',
      'Enhanced summary quality',
      'Priority support',
      'Custom summary formats',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and businesses',
    price: 29.99,
    summariesLimit: 50,
    features: [
      '50 video summaries per month',
      'Premium summary quality',
      '24/7 priority support',
      'Custom summary formats',
      'API access',
      'Team management',
    ],
  },
];

export async function createCheckoutSession(priceId: string, userId: string) {
  // Don't create a Stripe session for free plan
  if (priceId === 'free') {
    return null;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    customer_email: userId, // Assuming userId is the email
    metadata: {
      userId,
    },
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return session;
} 