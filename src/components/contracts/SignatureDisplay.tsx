import React from 'react';
import { Signature } from '@/types';
import { formatDate } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';

interface SignatureDisplayProps {
  signature: Signature;
  label?: string;
}

const SignatureDisplay: React.FC<SignatureDisplayProps> = ({ signature, label }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center border rounded-md p-4 bg-white">
      <div className="mb-2 text-sm font-medium">
        {label || t('contracts.signature')}
      </div>
      <div className="w-full h-20 flex items-center justify-center mb-2">
        <img 
          src={signature.signature} 
          alt={`${signature.name} signature`} 
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        <div>{signature.name}</div>
        <div>{signature.email}</div>
        <div>{formatDate(signature.timestamp)}</div>
      </div>
    </div>
  );
};

export default SignatureDisplay;
