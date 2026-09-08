import Stripe from 'stripe';

/**
 * Lazily-initialised Stripe SDK client.
 *
 * We avoid throwing at module-evaluation time so that `next build` can collect
 * page data even when STRIPE_SECRET_KEY is not yet populated in the
 * environment (e.g., CI or first-time setup).  The key is validated on first
 * actual use at runtime.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        '[AeroFlow Stripe] STRIPE_SECRET_KEY is not set in environment variables.'
      );
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}
