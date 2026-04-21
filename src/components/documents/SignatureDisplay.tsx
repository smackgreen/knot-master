import React from 'react';
import { ElectronicSignature } from '@/types';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface SignatureDisplayProps {
  signature: ElectronicSignature;
  className?: string;
}

const SignatureDisplay: React.FC<SignatureDisplayProps> = ({ signature, className }) => {
  const { t, i18n } = useTranslation();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPpp', {
      locale: i18n.language === 'fr' ? fr : enUS,
    });
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client':
        return t('documents.roles.client');
      case 'vendor':
        return t('documents.roles.vendor');
      case 'planner':
        return t('documents.roles.planner');
      default:
        return role;
    }
  };
  
  return (
    <div className={`border rounded-md p-4 bg-white shadow-sm ${className}`}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="mb-2 md:mb-0">
          <h3 className="font-medium">{signature.signerName}</h3>
          <p className="text-sm text-gray-500">{signature.signerEmail}</p>
          <p className="text-sm text-gray-500">{getRoleLabel(signature.signerRole)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {t('documents.signedOn')}: {formatDate(signature.consentTimestamp)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <img 
          src={signature.signatureImage} 
          alt={`${signature.signerName} signature`}
          className="max-h-20 border-b border-gray-300 pb-2"
        />
      </div>
    </div>
  );
};

export default SignatureDisplay;
