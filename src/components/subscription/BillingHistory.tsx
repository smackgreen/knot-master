import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, ExternalLink, FileText } from 'lucide-react';
import { getBillingHistory, BillingInvoice } from '@/services/stripeService';
import { toast } from 'sonner';

interface BillingHistoryProps {
  customerId?: string;
}

const BillingHistory: React.FC<BillingHistoryProps> = () => {
  const { t } = useTranslation('subscription');
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await getBillingHistory();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">{t('invoiceStatus.paid')}</Badge>;
      case 'open':
        return <Badge variant="outline">{t('invoiceStatus.open')}</Badge>;
      case 'void':
        return <Badge variant="secondary">{t('invoiceStatus.void')}</Badge>;
      case 'uncollectible':
        return <Badge variant="destructive">{t('invoiceStatus.uncollectible')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('noInvoices')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('billingHistory')}</CardTitle>
        <CardDescription>{t('billingHistoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {invoice.description}
                  </p>
                  {getStatusBadge(invoice.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                  {invoice.periodStart && invoice.periodEnd && (
                    <span className="ml-2">
                      ({formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-medium whitespace-nowrap">
                  {formatAmount(invoice.amount, invoice.currency)}
                </span>
                <div className="flex gap-1">
                  {invoice.invoicePdf && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(invoice.invoicePdf, '_blank')}
                      title={t('downloadInvoice')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {invoice.hostedInvoiceUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                      title={t('viewInvoice')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingHistory;
