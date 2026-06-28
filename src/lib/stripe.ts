import Stripe from "stripe";

// Lazy Stripe client — only instantiated at request time, not at module load.
// This prevents build errors when STRIPE_SECRET_KEY is not set.
let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    _stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  }
  return _stripe;
}

export const PRICE_ID = () => {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id) throw new Error("STRIPE_PRICE_ID is not set.");
  return id;
};

export const APP_URL = () =>
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
