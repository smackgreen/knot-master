import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { PLAN_DETAILS } from '@/services/stripeService';

const Pricing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Handle subscription selection
  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      // Free plan doesn't need payment
      navigate('/app/dashboard');
    } else {
      // Navigate to subscription page with plan selection
      navigate(`/account/subscription?plan=${planId}`);
    }
  };

  // Check if the user is already subscribed to a plan
  const isCurrentPlan = (planId: string) => {
    return subscription?.planId === planId;
  };

  // Get the button text based on the plan and subscription status
  const getButtonText = (planId: string) => {
    if (isCurrentPlan(planId)) {
      return t('pricing.currentPlan');
    }
    
    if (planId === 'free') {
      return t('pricing.getStarted');
    }
    
    if (subscription?.planId === 'free') {
      return t('pricing.upgrade');
    }
    
    if (subscription?.planId === 'starter' && planId === 'pro') {
      return t('pricing.upgrade');
    }
    
    if (subscription?.planId === 'pro' && planId === 'starter') {
      return t('pricing.downgrade');
    }
    
    return t('pricing.subscribe');
  };

  return (
    <div className="container max-w-6xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('pricing.title')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2">
          <Label htmlFor="billing-cycle">{t('pricing.monthly')}</Label>
          <Switch
            id="billing-cycle"
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor="billing-cycle">
            {t('pricing.yearly')}
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {t('pricing.savePercent')}
            </span>
          </Label>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t('pricing.plans.free.name')}</CardTitle>
            <div className="mt-4">
              <span className="text-3xl font-bold">{t('pricing.free')}</span>
            </div>
            <CardDescription>{t('pricing.plans.free.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.free.features.clients', { count: PLAN_DETAILS.free.features.maxClients })} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.free.features.vendors', { count: PLAN_DETAILS.free.features.maxVendors })} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.free.features.guests', { count: PLAN_DETAILS.free.features.maxGuests })} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.free.features.tasks')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.free.features.budgetTracking')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.free.features.invoicing')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.free.features.seatingCharts')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.free.features.mealPlanning')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.free.features.designSuggestions')} 
              />
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={isCurrentPlan('free') ? 'outline' : 'default'}
              onClick={() => handleSelectPlan('free')}
              disabled={isCurrentPlan('free')}
            >
              {getButtonText('free')}
            </Button>
          </CardFooter>
        </Card>

        {/* Starter Plan */}
        <Card className="flex flex-col border-primary">
          <CardHeader>
            <div className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-full w-fit mb-2">
              {t('pricing.popular')}
            </div>
            <CardTitle>{t('pricing.plans.starter.name')}</CardTitle>
            <div className="mt-4">
              <span className="text-3xl font-bold">
                {billingCycle === 'monthly' 
                  ? `$${PLAN_DETAILS.starter.price}` 
                  : `$${PLAN_DETAILS.starter.yearlyPrice / 12}`}
              </span>
              <span className="text-muted-foreground ml-1">/ {t('pricing.month')}</span>
              {billingCycle === 'yearly' && (
                <div className="text-sm text-muted-foreground mt-1">
                  {t('pricing.billedYearly', { price: PLAN_DETAILS.starter.yearlyPrice })}
                </div>
              )}
            </div>
            <CardDescription>{t('pricing.plans.starter.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.starter.features.clients')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.starter.features.vendors')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.starter.features.guests', { count: PLAN_DETAILS.starter.features.maxGuests })} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.starter.features.tasks')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.starter.features.budgetTracking')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.starter.features.invoicing')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.starter.features.seatingCharts')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.starter.features.mealPlanning')} 
              />
              <FeatureItem 
                included={false} 
                text={t('pricing.plans.starter.features.designSuggestions')} 
              />
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={isCurrentPlan('starter') ? 'outline' : 'default'}
              onClick={() => handleSelectPlan('starter')}
              disabled={isCurrentPlan('starter')}
            >
              {getButtonText('starter')}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t('pricing.plans.pro.name')}</CardTitle>
            <div className="mt-4">
              <span className="text-3xl font-bold">
                {billingCycle === 'monthly' 
                  ? `$${PLAN_DETAILS.pro.price}` 
                  : `$${PLAN_DETAILS.pro.yearlyPrice / 12}`}
              </span>
              <span className="text-muted-foreground ml-1">/ {t('pricing.month')}</span>
              {billingCycle === 'yearly' && (
                <div className="text-sm text-muted-foreground mt-1">
                  {t('pricing.billedYearly', { price: PLAN_DETAILS.pro.yearlyPrice })}
                </div>
              )}
            </div>
            <CardDescription>{t('pricing.plans.pro.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.clients')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.vendors')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.guests')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.tasks')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.budgetTracking')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.invoicing')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.seatingCharts')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.mealPlanning')} 
              />
              <FeatureItem 
                included={true} 
                text={t('pricing.plans.pro.features.designSuggestions')} 
              />
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={isCurrentPlan('pro') ? 'outline' : 'default'}
              onClick={() => handleSelectPlan('pro')}
              disabled={isCurrentPlan('pro')}
            >
              {getButtonText('pro')}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('pricing.faq.title')}</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          <div>
            <h3 className="text-lg font-medium mb-2">{t('pricing.faq.q1')}</h3>
            <p className="text-muted-foreground">{t('pricing.faq.a1')}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">{t('pricing.faq.q2')}</h3>
            <p className="text-muted-foreground">{t('pricing.faq.a2')}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">{t('pricing.faq.q3')}</h3>
            <p className="text-muted-foreground">{t('pricing.faq.a3')}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">{t('pricing.faq.q4')}</h3>
            <p className="text-muted-foreground">{t('pricing.faq.a4')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature item component
const FeatureItem = ({ included, text }: { included: boolean; text: string }) => (
  <li className="flex items-start">
    <div className="mr-2 mt-1">
      {included ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
    <span className={included ? '' : 'text-muted-foreground'}>{text}</span>
  </li>
);

export default Pricing;
