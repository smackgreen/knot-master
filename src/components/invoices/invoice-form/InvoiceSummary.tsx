import { formatCurrency } from "@/utils/formatters";
import { useTranslation } from "react-i18next";

interface InvoiceSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
}

const InvoiceSummary = ({ subtotal, tax, total }: InvoiceSummaryProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t('invoices.subtotal')}:</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t('invoices.tax')}:</span>
        <span>{formatCurrency(tax)}</span>
      </div>
      <div className="flex justify-between font-medium">
        <span>{t('invoices.total')}:</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

export default InvoiceSummary;
