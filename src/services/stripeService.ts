import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Stripe API endpoint (Supabase Edge Function)
const STRIPE_API_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe`;

// Stripe price IDs for each plan
// These would be created in the Stripe dashboard
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  },
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
};

// Plan details
export const PLAN_DETAILS: Record<string, {
  name: string;
  price: number;
  yearlyPrice: number;
  features: {
    maxClients: number;
    maxVendors: number;
    maxGuests: number;
    budgetTracking: boolean;
    invoicing: boolean;
    seatingCharts: boolean;
    mealPlanning: boolean;
    designSuggestions: boolean;
    contracts: boolean;
    documents: boolean;
    calendarScheduling: boolean;
    analytics: boolean;
    resourceManagement: boolean;
  };
}> = {
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
      contracts: false,
      documents: false,
      calendarScheduling: false,
      analytics: false,
      resourceManagement: false,
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
      contracts: true,
      documents: true,
      calendarScheduling: true,
      analytics: false,
      resourceManagement: false,
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
      contracts: true,
      documents: true,
      calendarScheduling: true,
      analytics: true,
      resourceManagement: true,
    },
  },
};

/**
 * Get the current session's access token
 */
async function getAccessToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('User not authenticated');
  }
  return session.access_token;
}

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
    const accessToken = await getAccessToken();

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
        'Authorization': `Bearer ${accessToken}`,
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
    const accessToken = await getAccessToken();

    // Call the Stripe API endpoint
    const response = await fetch(`${STRIPE_API_ENDPOINT}/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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
    const accessToken = await getAccessToken();

    // Call the Stripe API endpoint
    const response = await fetch(`${STRIPE_API_ENDPOINT}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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
    const accessToken = await getAccessToken();

    // Call the Stripe API endpoint
    const response = await fetch(`${STRIPE_API_ENDPOINT}/reactivate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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

/**
 * Get billing history (invoices) for the current user
 * @returns Array of invoice objects
 */
export interface BillingInvoice {
  id: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  invoicePdf: string;
  hostedInvoiceUrl: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
}

export const getBillingHistory = async (): Promise<BillingInvoice[]> => {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${STRIPE_API_ENDPOINT}/billing-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch billing history');
    }

    const data = await response.json();
    return data.invoices || [];
  } catch (error) {
    console.error('Error fetching billing history:', error);
    toast.error('Failed to fetch billing history.');
    throw error;
  }
};
