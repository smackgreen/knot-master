import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

interface PlanFeature {
  name: string;
  included: boolean | string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
}

const PricingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['pricing']);
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: t('pricing:plans.free.name'),
      description: t('pricing:plans.free.description'),
      price: 0,
      buttonText: user ? t('pricing:currentPlan') : t('pricing:getStarted'),
      features: [
        { name: t('pricing:features.clientManagement'), included: t('pricing:limits.upTo', { count: 3 }) },
        { name: t('pricing:features.taskManagement'), included: t('pricing:basic') },
        { name: t('pricing:features.calendarView'), included: t('pricing:basic') },
        { name: t('pricing:features.vendorManagement'), included: t('pricing:limits.upTo', { count: 5 }) },
        { name: t('pricing:features.guestManagement'), included: t('pricing:limits.upTo', { count: 30 }) },
        { name: t('pricing:features.budgetTracking'), included: false },
        { name: t('pricing:features.invoicesQuotations'), included: false },
        { name: t('pricing:features.seatingCharts'), included: false },
        { name: t('pricing:features.mealPlanning'), included: false },
        { name: t('pricing:features.designSuggestions'), included: false },
      ],
    },
    {
      id: 'starter',
      name: t('pricing:plans.starter.name'),
      description: t('pricing:plans.starter.description'),
      price: 19.99,
      yearlyPrice: 199.99,
      popular: true,
      buttonText: t('pricing:subscribe'),
      features: [
        { name: t('pricing:features.clientManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.taskManagement'), included: t('pricing:advanced') },
        { name: t('pricing:features.calendarView'), included: t('pricing:full') },
        { name: t('pricing:features.vendorManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.guestManagement'), included: t('pricing:limits.upTo', { count: 150 }) },
        { name: t('pricing:features.budgetTracking'), included: true },
        { name: t('pricing:features.invoicesQuotations'), included: t('pricing:basic') },
        { name: t('pricing:features.seatingCharts'), included: t('pricing:basic') },
        { name: t('pricing:features.mealPlanning'), included: false },
        { name: t('pricing:features.designSuggestions'), included: false },
      ],
    },
    {
      id: 'pro',
      name: t('pricing:plans.pro.name'),
      description: t('pricing:plans.pro.description'),
      price: 39.99,
      yearlyPrice: 399.99,
      buttonText: t('pricing:subscribe'),
      features: [
        { name: t('pricing:features.clientManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.taskManagement'), included: t('pricing:advanced') },
        { name: t('pricing:features.calendarView'), included: t('pricing:full') },
        { name: t('pricing:features.vendorManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.guestManagement'), included: t('pricing:unlimited') },
        { name: t('pricing:features.budgetTracking'), included: t('pricing:advanced') },
        { name: t('pricing:features.invoicesQuotations'), included: t('pricing:advanced') },
        { name: t('pricing:features.seatingCharts'), included: t('pricing:advanced') },
        { name: t('pricing:features.mealPlanning'), included: true },
        { name: t('pricing:features.designSuggestions'), included: true },
      ],
    },
  ];

  const handleSubscribe = (planId: string) => {
    if (!user) {
      navigate('/signup?plan=' + planId);
    } else {
      navigate('/account/subscription?plan=' + planId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-12 bg-wedding-ivory text-center">
        <div className="container px-4 mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t('pricing:title')}
          </h1>
          <p className="text-lg mb-8 max-w-3xl mx-auto">
            {t('pricing:description')}
          </p>

          <div className="flex items-center justify-center space-x-2 mb-8">
            <Label htmlFor="billing-cycle">{t('pricing:monthly')}</Label>
            <Switch
              id="billing-cycle"
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-cycle" className="flex items-center gap-2">
              {t('pricing:yearly')}
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                {t('pricing:savePercent', { percent: 15 })}
              </span>
            </Label>
          </div>
        </div>
      </header>

      <main className="flex-1 py-16">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg relative' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                      {t('pricing:mostPopular')}
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      ${billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground ml-1">
                        /{billingCycle === 'yearly' ? t('pricing:year') : t('pricing:month')}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                        )}
                        <span>
                          {feature.name}
                          {typeof feature.included === 'string' && feature.included !== 'true' && (
                            <span className="text-muted-foreground ml-1">({feature.included})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={user && plan.buttonText === t('pricing:currentPlan')}
                  >
                    {plan.buttonText}
                    {plan.id !== 'free' && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('pricing:faq.title')}</h2>
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              <div>
                <h3 className="font-medium mb-2">{t('pricing:faq.q1')}</h3>
                <p className="text-muted-foreground">{t('pricing:faq.a1')}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('pricing:faq.q2')}</h3>
                <p className="text-muted-foreground">{t('pricing:faq.a2')}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('pricing:faq.q3')}</h3>
                <p className="text-muted-foreground">{t('pricing:faq.a3')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-8">
        <div className="container px-4 mx-auto text-center">
          <p className="text-muted-foreground">© {new Date().getFullYear()} Knot To It Wedding Planner CRM</p>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
