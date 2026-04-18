import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubscription } from '@/context/SubscriptionContext';
import { CreditCard, Crown, AlertTriangle } from 'lucide-react';
import { PLAN_DETAILS } from '@/services/stripeService';

export const SubscriptionStatusIndicator = () => {
  const { t } = useTranslation('subscription');
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  // If no subscription, show free plan
  if (!subscription) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => navigate('/pricing')}
            >
              <Badge variant="outline" className="px-1 py-0 h-5">
                {t('freePlan')}
              </Badge>
              <span className="hidden sm:inline">{t('upgrade')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('upgradeToPro')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // If subscription is past due or canceled
  if (subscription.status === 'past_due' || (subscription.status === 'canceled' && !subscription.cancelAtPeriodEnd)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-destructive"
              onClick={() => navigate('/account/subscription')}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <Badge variant="destructive" className="px-1 py-0 h-5">
                {subscription.status === 'past_due'
                  ? t('pastDue')
                  : t('canceled')}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {subscription.status === 'past_due'
                ? t('pastDueMessage')
                : t('canceledMessage')}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // If subscription is active but will be canceled at period end
  if (subscription.cancelAtPeriodEnd) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => navigate('/account/subscription')}
            >
              <Badge variant="outline" className="px-1 py-0 h-5">
                {getPlanBadgeText(subscription.planId)}
              </Badge>
              <span className="hidden sm:inline">{t('expiringShort')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {t('expiringMessage', {
                date: new Date(subscription.currentPeriodEnd).toLocaleDateString()
              })}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Active subscription
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => navigate('/account/subscription')}
          >
            {subscription.planId === 'pro' ? (
              <Crown className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <CreditCard className="h-3.5 w-3.5" />
            )}
            <Badge
              variant={subscription.planId === 'pro' ? 'default' : 'outline'}
              className="px-1 py-0 h-5"
            >
              {getPlanBadgeText(subscription.planId)}
            </Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('viewDetails')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Helper function to get the plan badge text
const getPlanBadgeText = (planId: string) => {
  switch (planId) {
    case 'starter':
      return 'Starter';
    case 'pro':
      return 'Pro';
    default:
      return 'Free';
  }
};
