export type StripeProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  summariesLimit: number;
  stripePriceId: string;
};

export const PLANS: StripeProduct[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out the service',
    price: 0,
    summariesLimit: 3,
    stripePriceId: '',
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
    stripePriceId: 'price_1RRfrIIoaOwPno5ESgGnCIj6',
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
    stripePriceId: 'price_1RRfrmIoaOwPno5Eq2efx6DA',
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