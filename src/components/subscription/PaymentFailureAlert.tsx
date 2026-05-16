import React from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createCustomerPortalSession } from '@/services/stripeService';
import { toast } from 'sonner';

/**
 * Shows an alert when the user's subscription is past due
 * (payment failed). Provides a button to update payment method.
 */
export const PaymentFailureAlert: React.FC = () => {
  const { subscription } = useSubscription();
  const { t } = useTranslation('subscription');

  if (!subscription || subscription.status !== 'past_due') return null;

  const handleUpdatePayment = async () => {
    try {
      const portalUrl = await createCustomerPortalSession();
      window.location.href = portalUrl;
    } catch (error) {
      toast.error(t('portalError'));
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('paymentFailed.title')}</AlertTitle>
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <span>{t('paymentFailed.description')}</span>
        <Button
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={handleUpdatePayment}
        >
          <CreditCard className="mr-1 h-3.5 w-3.5" />
          {t('paymentFailed.updatePayment')}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default PaymentFailureAlert;
