import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { PLAN_DETAILS } from '@/services/stripeService';

interface SubscriptionGuardProps {
  /** The feature key to check access for (e.g. 'budgetTracking', 'seatingCharts') */
  feature: string;
  /** The content to render if the user has access */
  children: ReactNode;
  /** If true, redirect to pricing page instead of showing upgrade UI */
  redirectToPricing?: boolean;
}

/**
 * Route-level guard that checks subscription status before rendering content.
 * If the user doesn't have the required feature, it either:
 * - Shows an upgrade prompt UI (default)
 * - Redirects to the pricing page (if redirectToPricing is true)
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  feature,
  children,
  redirectToPricing = false,
}) => {
  const { subscription, isLoading, hasFeatureAccess } = useSubscription();
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation('subscription');

  // Show loading while checking subscription
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user has access to the feature
  const hasAccess = hasFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // If redirect is requested, go to pricing
  if (redirectToPricing) {
    return <Navigate to="/pricing" replace />;
  }

  // Otherwise show the upgrade prompt
  const currentPlan = subscription?.planId || 'free';
  const requiredPlan = getRequiredPlan(feature);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{t('guard.title')}</CardTitle>
          <CardDescription>{t('guard.description', { feature: getFeatureDisplayName(feature) })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('guard.currentPlan')}</span>
              <span className="text-sm font-medium capitalize">{PLAN_DETAILS[currentPlan]?.name || 'Free'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('guard.requiredPlan')}</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                {PLAN_DETAILS[requiredPlan]?.name || requiredPlan}
              </span>
            </div>
          </div>

          <Button className="w-full" onClick={() => window.location.href = '/pricing'}>
            <Crown className="mr-2 h-4 w-4" />
            {t('guard.upgradeButton')}
          </Button>

          {subscription?.status === 'past_due' && (
            <p className="text-xs text-destructive">
              {t('guard.pastDueWarning')}
            </p>
          )}

          {subscription?.trialEnd && new Date(subscription.trialEnd) < new Date() && (
            <p className="text-xs text-amber-600">
              {t('guard.trialExpired')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Determine which plan is required for a given feature
 */
function getRequiredPlan(feature: string): string {
  if (PLAN_DETAILS.pro.features[feature as keyof typeof PLAN_DETAILS.pro.features]) {
    // Check if starter also has it
    if (PLAN_DETAILS.starter.features[feature as keyof typeof PLAN_DETAILS.starter.features]) {
      return 'starter';
    }
    return 'pro';
  }
  if (PLAN_DETAILS.starter.features[feature as keyof typeof PLAN_DETAILS.starter.features]) {
    return 'starter';
  }
  return 'pro';
}

/**
 * Get a human-readable display name for a feature key
 */
function getFeatureDisplayName(feature: string): string {
  const names: Record<string, string> = {
    budgetTracking: 'Budget Tracking',
    invoicing: 'Invoicing',
    seatingCharts: 'Seating Charts',
    mealPlanning: 'Meal Planning',
    designSuggestions: 'AI Design Suggestions',
    contracts: 'Contracts & E-Signatures',
    documents: 'Document Management',
    calendarScheduling: 'Calendar & Scheduling',
    analytics: 'Analytics & Reporting',
    resourceManagement: 'Resource Management',
  };
  return names[feature] || feature;
}

export default SubscriptionGuard;
