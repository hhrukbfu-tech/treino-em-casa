import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

// Preços dos planos (IDs do Stripe)
export const STRIPE_PRICES = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || '',
  annual: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID || '',
};
