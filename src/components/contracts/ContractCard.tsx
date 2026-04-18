import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Contract, Client, Vendor } from '@/types';
import { formatDate } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';
import { Eye, FileSignature, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContractCardProps {
  contract: Contract;
  client?: Client;
  vendor?: Vendor;
  onView: (id: string) => void;
  onSign: (id: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
}

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  client,
  vendor,
  onView,
  onSign,
  onSend,
  onDelete
}) => {
  const { t } = useTranslation();
  
  // Get status badge color
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
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{contract.name}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          {client && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('contracts.client')}:</span>
              <Link to={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                {client.name}
              </Link>
            </div>
          )}
          
          {vendor && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('contracts.vendor')}:</span>
              <span>{vendor.name}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('contracts.created')}:</span>
            <span>{formatDate(contract.createdAt)}</span>
          </div>
          
          {contract.sentAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('contracts.sent')}:</span>
              <span>{formatDate(contract.sentAt)}</span>
            </div>
          )}
          
          {contract.signedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('contracts.signed')}:</span>
              <span>{formatDate(contract.signedAt)}</span>
            </div>
          )}
          
          {contract.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('contracts.expires')}:</span>
              <span>{formatDate(contract.expiresAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => onView(contract.id)}>
          <Eye className="h-4 w-4 mr-1" />
          {t('common.view')}
        </Button>
        
        {contract.status === 'draft' && (
          <Button variant="outline" size="sm" onClick={() => onSend(contract.id)}>
            <Send className="h-4 w-4 mr-1" />
            {t('contracts.send')}
          </Button>
        )}
        
        {(contract.status === 'sent' || contract.status === 'draft') && (
          <Button variant="default" size="sm" onClick={() => onSign(contract.id)}>
            <FileSignature className="h-4 w-4 mr-1" />
            {t('contracts.sign')}
          </Button>
        )}
        
        {(contract.status === 'draft' || contract.status === 'sent') && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(contract.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            {t('common.delete')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContractCard;
