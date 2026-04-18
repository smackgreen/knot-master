import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { PLAN_DETAILS } from '@/services/stripeService';
import i18n from '../i18n';

// Check if we should bypass subscription checks in development
const BYPASS_SUBSCRIPTION_CHECKS = import.meta.env.VITE_BYPASS_SUBSCRIPTION_CHECKS === 'true';

// Subscription types
export type SubscriptionPlan = 'free' | 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type BillingCycle = 'monthly' | 'yearly';

// Subscription interface
export interface Subscription {
  id: string;
  planId: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethodId?: string;
  billingCycle: BillingCycle;
  trialEnd?: string;
  priceId?: string;
}

// Payment method interface
export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
}

// Subscription context interface
interface SubscriptionContextType {
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  hasFeatureAccess: (feature: string) => boolean;
  isWithinPlanLimits: (resourceType: string, count: number) => boolean;
  refreshSubscription: () => Promise<void>;
  refreshPaymentMethods: () => Promise<void>;
}

// Create the context
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Provider props
interface SubscriptionProviderProps {
  children: ReactNode;
}

// Provider component
export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create a mock subscription for development
  const createMockSubscription = () => {
    // Create a mock "pro" subscription that expires in 1 year
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    return {
      id: 'mock-subscription-id',
      planId: 'pro' as SubscriptionPlan,
      status: 'active' as SubscriptionStatus,
      currentPeriodEnd: oneYearFromNow.toISOString(),
      cancelAtPeriodEnd: false,
      stripeCustomerId: 'mock-customer-id',
      stripeSubscriptionId: 'mock-subscription-id',
      paymentMethodId: 'mock-payment-method-id',
      billingCycle: 'monthly' as BillingCycle,
      priceId: 'price_pro_monthly',
    };
  };

  // Fetch subscription data
  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // If we're bypassing subscription checks in development, use a mock subscription
    if (BYPASS_SUBSCRIPTION_CHECKS) {
      setSubscription(createMockSubscription());
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSubscription({
          id: data.id,
          planId: data.plan_id,
          status: data.status,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end,
          stripeCustomerId: data.stripe_customer_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          paymentMethodId: data.payment_method_id,
          billingCycle: data.billing_cycle || 'monthly',
          trialEnd: data.trial_end,
          priceId: data.price_id,
        });
      } else {
        // If no subscription found, set to free plan
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error(i18n.t('subscription.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Create mock payment methods for development
  const createMockPaymentMethods = () => {
    return [{
      id: 'mock-payment-method-id',
      stripePaymentMethodId: 'pm_mock',
      cardBrand: 'visa',
      cardLast4: '4242',
      cardExpMonth: 12,
      cardExpYear: 2030,
      isDefault: true,
    }];
  };

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    if (!user) {
      setPaymentMethods([]);
      return;
    }

    // If we're bypassing subscription checks in development, use mock payment methods
    if (BYPASS_SUBSCRIPTION_CHECKS) {
      setPaymentMethods(createMockPaymentMethods());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setPaymentMethods(data.map(pm => ({
          id: pm.id,
          stripePaymentMethodId: pm.stripe_payment_method_id,
          cardBrand: pm.card_brand,
          cardLast4: pm.card_last4,
          cardExpMonth: pm.card_exp_month,
          cardExpYear: pm.card_exp_year,
          isDefault: pm.is_default,
        })));
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error(i18n.t('subscription.paymentMethodsError'));
    }
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscription();
    setIsLoading(false);
  };

  // Refresh payment methods
  const refreshPaymentMethods = async () => {
    await fetchPaymentMethods();
  };

  // Check if user has access to a feature
  const hasFeatureAccess = (feature: string): boolean => {
    // For local development, always grant access to all features if bypass is enabled
    if (BYPASS_SUBSCRIPTION_CHECKS) {
      return true;
    }

    // If loading or no user, deny access
    if (isLoading || !user) {
      return false;
    }

    // Get the current plan (default to free if no subscription)
    const currentPlan = subscription?.planId || 'free';

    // Get the plan details
    const planDetails = PLAN_DETAILS[currentPlan];

    // Check if the feature is available in the plan
    switch (feature) {
      case 'budgetTracking':
        return planDetails.features.budgetTracking;
      case 'invoicing':
        return planDetails.features.invoicing;
      case 'seatingCharts':
        return planDetails.features.seatingCharts;
      case 'mealPlanning':
        return planDetails.features.mealPlanning;
      case 'designSuggestions':
        return planDetails.features.designSuggestions;
      default:
        return false;
    }
  };

  // Check if user is within plan limits
  const isWithinPlanLimits = (resourceType: string, count: number): boolean => {
    // For local development, always return true for resource limits if bypass is enabled
    if (BYPASS_SUBSCRIPTION_CHECKS) {
      return true;
    }

    // If loading or no user, deny access
    if (isLoading || !user) {
      return false;
    }

    // Get the current plan (default to free if no subscription)
    const currentPlan = subscription?.planId || 'free';

    // Get the plan details
    const planDetails = PLAN_DETAILS[currentPlan];

    // Check if the count is within the plan limits
    switch (resourceType) {
      case 'clients':
        return count <= planDetails.features.maxClients;
      case 'vendors':
        return count <= planDetails.features.maxVendors;
      case 'guests':
        return count <= planDetails.features.maxGuests;
      default:
        return false;
    }
  };

  // Fetch data when user changes
  useEffect(() => {
    fetchSubscription();
    fetchPaymentMethods();
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      paymentMethods,
      isLoading,
      hasFeatureAccess,
      isWithinPlanLimits,
      refreshSubscription,
      refreshPaymentMethods,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook to use the subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
