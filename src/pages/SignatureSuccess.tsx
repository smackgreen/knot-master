import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const SignatureSuccess: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">{t('documents.signatureSuccess')}</h1>
        <p className="mb-6">{t('documents.signatureSuccessMessage')}</p>
        <Button onClick={() => navigate('/')}>
          {t('common.backToHome')}
        </Button>
      </div>
    </div>
  );
};

export default SignatureSuccess;
