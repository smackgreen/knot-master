import React, { useRef } from 'react';
import { Contract, Client, Vendor, Signature } from '@/types';
import { formatDate } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileSignature, Send } from 'lucide-react';
import SignatureDisplay from './SignatureDisplay';
import { useReactToPrint } from 'react-to-print';
import DOMPurify from 'dompurify';

interface ContractPreviewProps {
  contract: Contract;
  client?: Client;
  vendor?: Vendor;
  onSign?: () => void;
  onSend?: () => void;
}

const ContractPreview: React.FC<ContractPreviewProps> = ({
  contract,
  client,
  vendor,
  onSign,
  onSend,
}) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Get status badge
  const getStatusBadge = () => {
    switch (contract.status) {
      case 'draft':
        return <Badge variant="outline">{t('contracts.status.draft')}</Badge>;
      case 'sent':
        return <Badge variant="secondary">{t('contracts.status.sent')}</Badge>;
      case 'signed':
        return <Badge variant="success">{t('contracts.status.signed')}</Badge>;
      case 'expired':
        return <Badge variant="destructive">{t('contracts.status.expired')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('contracts.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{contract.status}</Badge>;
    }
  };
  
  // Handle print/download
  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `${contract.name}.pdf`,
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{contract.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge()}
            <span className="text-sm text-muted-foreground">
              {t('contracts.created')}: {formatDate(contract.createdAt)}
            </span>
            {contract.sentAt && (
              <span className="text-sm text-muted-foreground">
                {t('contracts.sent')}: {formatDate(contract.sentAt)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {(contract.status === 'draft' || contract.status === 'sent') && onSign && (
            <Button onClick={onSign}>
              <FileSignature className="mr-2 h-4 w-4" />
              {t('contracts.sign')}
            </Button>
          )}
          
          {contract.status === 'draft' && onSend && (
            <Button variant="outline" onClick={onSend}>
              <Send className="mr-2 h-4 w-4" />
              {t('contracts.send')}
            </Button>
          )}
          
          <Button variant="outline" onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" />
            {t('common.download')}
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-white p-8" ref={contentRef}>
            {/* Contract content */}
            <div 
              className="contract-content" 
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contract.content) }} 
            />
            
            {/* Signatures section */}
            {(contract.clientSignature || contract.vendorSignature || contract.plannerSignature) && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-xl font-bold mb-4">{t('contracts.signatures')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contract.clientSignature && (
                    <SignatureDisplay 
                      signature={contract.clientSignature} 
                      label={t('contracts.clientSignature')}
                    />
                  )}
                  
                  {contract.vendorSignature && (
                    <SignatureDisplay 
                      signature={contract.vendorSignature} 
                      label={t('contracts.vendorSignature')}
                    />
                  )}
                  
                  {contract.plannerSignature && (
                    <SignatureDisplay 
                      signature={contract.plannerSignature} 
                      label={t('contracts.plannerSignature')}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractPreview;
