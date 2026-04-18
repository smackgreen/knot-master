import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Stripe API endpoint (Supabase Edge Function)
const STRIPE_API_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe`;

// Stripe price IDs for each plan
// These would be created in the Stripe dashboard
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: 'price_starter_monthly', // Replace with actual Stripe price ID
    yearly: 'price_starter_yearly',   // Replace with actual Stripe price ID
  },
  pro: {
    monthly: 'price_pro_monthly',     // Replace with actual Stripe price ID
    yearly: 'price_pro_yearly',       // Replace with actual Stripe price ID
  },
};

// Plan details
export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    features: {
      maxClients: 3,
      maxVendors: 5,
      maxGuests: 30,
      budgetTracking: false,
      invoicing: false,
      seatingCharts: false,
      mealPlanning: false,
      designSuggestions: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 19.99,
    yearlyPrice: 199.99,
    features: {
      maxClients: Infinity,
      maxVendors: Infinity,
      maxGuests: 150,
      budgetTracking: true,
      invoicing: true,
      seatingCharts: false,
      mealPlanning: false,
      designSuggestions: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 39.99,
    yearlyPrice: 399.99,
    features: {
      maxClients: Infinity,
      maxVendors: Infinity,
      maxGuests: Infinity,
      budgetTracking: true,
      invoicing: true,
      seatingCharts: true,
      mealPlanning: true,
      designSuggestions: true,
    },
  },
};

/**
 * Create a Stripe Checkout session for subscription
 * @param planId The subscription plan ID (starter, pro)
 * @param billingCycle The billing cycle (monthly, yearly)
 * @returns The Stripe Checkout URL
 */
export const createCheckoutSession = async (
  planId: 'starter' | 'pro',
  billingCycle: 'monthly' | 'yearly'
): Promise<string> => {
  try {
    const session = supabase.auth.session();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Get the price ID based on plan and billing cycle
    const priceId = STRIPE_PRICE_IDS[planId][billingCycle];
    if (!priceId) {
      throw new Error('Invalid plan or billing cycle');
    }

    // Call the Stripe API endpoint
    const response = await fetch(`${STRIPE_API_ENDPOINT}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        planId,
        billingCycle,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    toast.error('Failed to create checkout session. Please try again.');
    throw error;
  }
};

/**
 * Create a Stripe Customer Portal session
 * @returns The Stripe Customer Portal URL
 */
export const createCustomerPortalSession = async (): Promise<string> => {
  try {
    const session = supabase.auth.session();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Call the Stripe API endpoint
    const response = await fetch(`${STRIPE_API_ENDPOINT}/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create customer portal session');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    toast.error('Failed to access billing portal. Please try again.');
    throw error;
  }
};

/**
 * Cancel a subscription
 * @param subscriptionId The subscription ID
 * @returns Whether the cancellation was successful
 */
export const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    const session = supabase.auth.session();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Call the Stripe API endpoint
    const response = await fetch(`${STRIPE_API_ENDPOINT}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    toast.error('Failed to cancel subscription. Please try again.');
    throw error;
  }
};

/**
 * Reactivate a canceled subscription
 * @param subscriptionId The subscription ID
 * @returns Whether the reactivation was successful
 */
export const reactivateSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    const session = supabase.auth.session();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Call the Stripe API endpoint
    const response = await fetch(`${STRIPE_API_ENDPOINT}/reactivate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reactivate subscription');
    }

    return true;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    toast.error('Failed to reactivate subscription. Please try again.');
    throw error;
  }
};
