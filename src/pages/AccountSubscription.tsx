import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionManager from '@/components/account/SubscriptionManager';

const AccountSubscription = () => {
  const { t } = useTranslation(['subscription', 'common', 'nav']);
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" /> {t('subscription:title')}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center gap-1"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t('nav:dashboard')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            {t('nav:home')}
          </Button>
        </div>
      </div>

      <SubscriptionManager />
    </div>
  );
};

export default AccountSubscription;
