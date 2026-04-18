import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, CreditCard, ExternalLink, CreditCard as CreditCardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { toast } from 'sonner';
import {
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscription as cancelStripeSubscription,
  reactivateSubscription as reactivateStripeSubscription,
  PLAN_DETAILS
} from '@/services/stripeService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const SubscriptionManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['subscription', 'pricing']);
  const { user } = useAuth();
  const { subscription, isLoading, refreshSubscription, paymentMethods } = useSubscription();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Get the plan from URL query params
  const queryParams = new URLSearchParams(location.search);
  const selectedPlan = queryParams.get('plan') as 'starter' | 'pro' | null;

  // Handle subscription checkout
  const handleSubscribe = async (planId: 'starter' | 'pro') => {
    if (!user) {
      navigate('/login?redirect=/account/subscription?plan=' + planId);
      return;
    }

    setProcessingPayment(true);
    try {
      // Create a checkout session with Stripe
      const checkoutUrl = await createCheckoutSession(planId, billingCycle);

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(t('subscription:subscribeError'));
      setProcessingPayment(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!subscription || !subscription.stripeSubscriptionId) return;

    setCancelingSubscription(true);
    try {
      // Cancel the subscription with Stripe
      await cancelStripeSubscription(subscription.stripeSubscriptionId);

      // Refresh the subscription data
      await refreshSubscription();

      toast.success(t('subscription:cancelSuccess'));
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error(t('subscription:cancelError'));
    } finally {
      setCancelingSubscription(false);
    }
  };

  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    if (!subscription || !subscription.stripeSubscriptionId) return;

    setProcessingPayment(true);
    try {
      // Reactivate the subscription with Stripe
      await reactivateStripeSubscription(subscription.stripeSubscriptionId);

      // Refresh the subscription data
      await refreshSubscription();

      toast.success(t('subscription:reactivateSuccess'));
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error(t('subscription:reactivateError'));
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle opening the customer portal
  const handleManagePayment = async () => {
    try {
      // Create a customer portal session with Stripe
      const portalUrl = await createCustomerPortalSession();

      // Redirect to Stripe Customer Portal
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      toast.error(t('subscription:portalError'));
    }
  };

  // Get the plan name
  const getPlanName = (planId: string) => {
    switch (planId) {
      case 'free':
        return t('pricing:plans.free.name');
      case 'starter':
        return t('pricing:plans.starter.name');
      case 'pro':
        return t('pricing:plans.pro.name');
      default:
        return planId;
    }
  };

  // Get the plan price
  const getPlanPrice = (planId: string, cycle: 'monthly' | 'yearly') => {
    const plan = PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS];
    if (!plan) return '';

    return cycle === 'monthly'
      ? `$${plan.price}/mo`
      : `$${plan.yearlyPrice}/yr`;
  };

  // Format a payment method for display
  const formatPaymentMethod = (pm: typeof paymentMethods[0]) => {
    return `${pm.cardBrand} •••• ${pm.cardLast4} (${pm.cardExpMonth}/${pm.cardExpYear})`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('subscription:title')}</h2>

      {subscription ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{t('subscription:currentPlan')}</CardTitle>
                <CardDescription>{t('subscription:managePlan')}</CardDescription>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                {subscription.status === 'active'
                  ? subscription.cancelAtPeriodEnd
                    ? t('subscription:cancelPending')
                    : t('subscription:active')
                  : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{getPlanName(subscription.planId)}</h3>
                <p className="text-sm text-muted-foreground">
                  {getPlanPrice(subscription.planId, subscription.billingCycle)}
                  {subscription.billingCycle === 'yearly' && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {t('subscription:yearlyDiscount')}
                    </span>
                  )}
                </p>
              </div>

              {paymentMethods.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">{t('subscription:paymentMethod')}</p>
                  <div className="flex items-center">
                    <CreditCardIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {formatPaymentMethod(paymentMethods[0])}
                    </span>
                  </div>
                </div>
              )}

              {subscription.status === 'active' && (
                <div>
                  <p className="text-sm">
                    {subscription.cancelAtPeriodEnd
                      ? t('subscription:expiresOn', { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })
                      : t('subscription:renewsOn', { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })}
                  </p>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('subscription:cancelAlert.title')}</AlertTitle>
                  <AlertDescription>
                    {t('subscription:cancelAlert.description', { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {subscription.planId !== 'free' && (
              <Button
                variant="outline"
                onClick={handleManagePayment}
                className="flex-1"
              >
                <CreditCardIcon className="mr-2 h-4 w-4" />
                {t('subscription:manageBilling')}
              </Button>
            )}

            {subscription.planId !== 'free' && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={cancelingSubscription}
                className="flex-1"
              >
                {cancelingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('subscription:cancelPlan')}
              </Button>
            )}

            {subscription.planId !== 'pro' && !subscription.cancelAtPeriodEnd && (
              <Button
                onClick={() => navigate('/pricing')}
                className="flex-1"
              >
                {t('subscription:upgradePlan')}
              </Button>
            )}

            {subscription.cancelAtPeriodEnd && (
              <Button
                onClick={handleReactivateSubscription}
                disabled={processingPayment}
                className="flex-1"
              >
                {processingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('subscription:reactivate')}
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : selectedPlan ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('subscription:subscribeTo', { plan: getPlanName(selectedPlan) })}</CardTitle>
            <CardDescription>
              {selectedPlan === 'starter'
                ? t('subscription:starterPlanDetails')
                : t('subscription:proPlanDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Label htmlFor="billing-cycle">{t('subscription:billingCycle.monthly')}</Label>
                <Switch
                  id="billing-cycle"
                  checked={billingCycle === 'yearly'}
                  onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                />
                <Label htmlFor="billing-cycle">
                  {t('subscription:billingCycle.yearly')}
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {t('subscription:yearlyDiscount')}
                  </span>
                </Label>
              </div>
            </div>

            <p className="font-medium text-xl mb-2">
              {getPlanPrice(selectedPlan, billingCycle)}
            </p>

            <p className="text-sm text-muted-foreground mb-4">
              {billingCycle === 'monthly'
                ? t('subscription:billedMonthly')
                : t('subscription:billedYearly')}
            </p>

            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertTitle>{t('subscription:securePayment.title')}</AlertTitle>
              <AlertDescription>
                {t('subscription:securePayment.description')}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={processingPayment}
            >
              {processingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('subscription:proceedToCheckout')}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">{t('subscription:noSubscription.title')}</h3>
          <p className="text-muted-foreground mb-6">{t('subscription:noSubscription.description')}</p>
          <Button onClick={() => navigate('/pricing')}>
            {t('subscription:viewPlans')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
