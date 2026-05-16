import React from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Shows a banner when the user is in a trial period or their trial has expired.
 * Displays days remaining during trial, and an expiration message after.
 */
export const TrialBanner: React.FC = () => {
  const { subscription } = useSubscription();
  const { t } = useTranslation('subscription');

  if (!subscription) return null;

  const now = new Date();
  const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd) : null;

  // Only show for trialing subscriptions
  if (subscription.status !== 'trialing' && !trialEnd) return null;

  // Trial expired but subscription still active (grace period)
  if (trialEnd && trialEnd < now && subscription.status === 'active') {
    return (
      <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('trial.expiredTitle')}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{t('trial.expiredDescription')}</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={() => window.location.href = '/pricing'}
          >
            <Crown className="mr-1 h-3.5 w-3.5" />
            {t('trial.upgradeNow')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial active
  if (trialEnd && trialEnd > now) {
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysRemaining <= 3;

    return (
      <Alert className={`mb-4 ${isUrgent ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
        <Clock className="h-4 w-4" />
        <AlertTitle>
          {isUrgent
            ? t('trial.endingSoonTitle', { days: daysRemaining })
            : t('trial.activeTitle', { days: daysRemaining })}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {t('trial.activeDescription', {
              date: trialEnd.toLocaleDateString(),
              plan: subscription.planId,
            })}
          </span>
          <Button
            size="sm"
            variant="outline"
            className={`ml-4 ${isUrgent ? 'border-amber-300 text-amber-800 hover:bg-amber-100' : 'border-blue-200 text-blue-800 hover:bg-blue-100'}`}
            onClick={() => window.location.href = '/account/subscription'}
          >
            {t('trial.manageSubscription')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default TrialBanner;
