import React, { ReactNode } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  /**
   * The feature to check access for
   * Options: 'budgetTracking', 'invoicing', 'seatingCharts', 'mealPlanning', 'designSuggestions'
   */
  feature: string;
  
  /**
   * The content to render if the user has access to the feature
   */
  children: ReactNode;
  
  /**
   * Optional custom fallback content to render if the user doesn't have access
   */
  fallback?: ReactNode;
  
  /**
   * Whether to show a fallback UI or just hide the content
   * @default true
   */
  showFallback?: boolean;
}

/**
 * A component that gates access to features based on the user's subscription plan
 */
export const FeatureGate = ({
  feature,
  children,
  fallback,
  showFallback = true,
}: FeatureGateProps) => {
  const { hasFeatureAccess } = useSubscription();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Check if the user has access to the feature
  const hasAccess = hasFeatureAccess(feature);
  
  // If the user has access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // If no fallback should be shown, render nothing
  if (!showFallback) {
    return null;
  }
  
  // If a custom fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Otherwise, render the default fallback
  return (
    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-muted/50 text-center space-y-4">
      <Lock className="h-12 w-12 text-muted-foreground" />
      <div>
        <h3 className="text-lg font-medium">{t('subscription.featureGate.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subscription.featureGate.description')}
        </p>
      </div>
      <Button onClick={() => navigate('/pricing')}>
        {t('subscription.featureGate.upgradeButton')}
      </Button>
    </div>
  );
};

/**
 * A component that limits the number of resources based on the user's subscription plan
 */
export const ResourceLimitGate = ({
  resourceType,
  currentCount,
  children,
  fallback,
  showFallback = true,
}: {
  /**
   * The type of resource to check limits for
   * Options: 'clients', 'vendors', 'guests'
   */
  resourceType: string;
  
  /**
   * The current count of resources
   */
  currentCount: number;
  
  /**
   * The content to render if the user is within the limits
   */
  children: ReactNode;
  
  /**
   * Optional custom fallback content to render if the user is over the limit
   */
  fallback?: ReactNode;
  
  /**
   * Whether to show a fallback UI or just hide the content
   * @default true
   */
  showFallback?: boolean;
}) => {
  const { isWithinPlanLimits } = useSubscription();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Check if the user is within the limits
  const withinLimits = isWithinPlanLimits(resourceType, currentCount);
  
  // If the user is within the limits, render the children
  if (withinLimits) {
    return <>{children}</>;
  }
  
  // If no fallback should be shown, render nothing
  if (!showFallback) {
    return null;
  }
  
  // If a custom fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Otherwise, render the default fallback
  return (
    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-muted/50 text-center space-y-4">
      <Lock className="h-12 w-12 text-muted-foreground" />
      <div>
        <h3 className="text-lg font-medium">{t('subscription.resourceLimit.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subscription.resourceLimit.description', { resourceType })}
        </p>
      </div>
      <Button onClick={() => navigate('/pricing')}>
        {t('subscription.resourceLimit.upgradeButton')}
      </Button>
    </div>
  );
};
