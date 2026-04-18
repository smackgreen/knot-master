
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Invoice } from "@/types";
import { formatCurrency, formatDate, formatDateI18n } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { FileText, Printer, Building, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { generateInvoicePDF } from "@/utils/pdfGenerator";

interface InvoiceDetailDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: Invoice['status']) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'draft':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const InvoiceDetailDialog = ({ invoice, open, onOpenChange }: InvoiceDetailDialogProps) => {
  const { clients } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation();
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

  // Use company profile from user data or fallback to defaults
  const businessInfo = {
    name: user?.companyName || "Wedding Planner Co.",
    logo: user?.companyLogo || "/placeholder.svg",
    address: user?.companyAddress || "123 Wedding Street, Suite 100",
    city: user?.companyCity || "Los Angeles, CA 90001",
    email: user?.companyEmail || user?.email || "contact@weddingplanner.co",
    phone: user?.companyPhone || "(555) 123-4567",
    website: user?.companyWebsite || "https://weddingplanner.co"
  };

  if (!invoice) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              {businessInfo.logo ? (
                <img src={businessInfo.logo} alt="Business Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Building className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl font-serif">{t('invoices.title')} #{invoice.invoiceNumber}</DialogTitle>
                <p className="text-sm text-muted-foreground">{businessInfo.name}</p>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(invoice.status)}>
              {t(`invoices.status.${invoice.status}`)}
            </Badge>
          </div>
          <DialogDescription>
            {t('invoices.issueDate')}: {formatDateI18n(invoice.issueDate, 'MMMM d, yyyy')} • {t('invoices.dueDate')}: {formatDateI18n(invoice.dueDate, 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business and Client Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">{t('invoices.from')}</h3>
              <div className="text-sm">
                <p>{businessInfo.name}</p>
                <p>{businessInfo.address}</p>
                <p>{businessInfo.city}</p>
                <p>{businessInfo.email}</p>
                <p>{businessInfo.phone}</p>
                {businessInfo.website && <p>{businessInfo.website}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">{t('invoices.to')}</h3>
              {client ? (
                <div className="text-sm">
                  <p>{client.name} & {client.partnerName}</p>
                  <p>{client.email}</p>
                  {client.phone && <p>{client.phone}</p>}
                </div>
              ) : (
                <p className="text-sm">{t('invoices.unknownClient')}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm">{t('invoices.issueDate')}: {formatDateI18n(invoice.issueDate, 'MMMM d, yyyy')}</p>
              <p className="text-sm">{t('invoices.dueDate')}: {formatDateI18n(invoice.dueDate, 'MMMM d, yyyy')}</p>
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('invoices.items')}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoices.description')}</TableHead>
                  <TableHead className="text-right">{t('invoices.quantity')}</TableHead>
                  <TableHead className="text-right">{t('invoices.unitPrice')}</TableHead>
                  <TableHead className="text-right">{t('invoices.amountBeforeTax')}</TableHead>
                  <TableHead className="text-right">{t('invoices.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amountBeforeTax || (item.quantity * item.unitPrice))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary */}
            <div className="mt-4 space-y-1.5 items-end">
              <div className="flex justify-end">
                <div className="w-48 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">{t('invoices.subtotal')}:</span>
                    <span className="text-sm">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{t('invoices.amountBeforeTax')}:</span>
                    <span className="text-sm">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{t('invoices.vat')}:</span>
                    <span className="text-sm">{formatCurrency(invoice.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">{t('invoices.total')}:</span>
                    <span className="font-medium">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="text-sm font-medium mb-2">{t('invoices.notes')}</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (client) {
                  // Use the stored legal text or fall back to a default
                  const legalText = invoice.legalText || "This invoice is issued in accordance with our terms and conditions. Payment is due by the date specified. Late payments may incur additional fees. All prices are subject to applicable taxes.";

                  generateInvoicePDF(
                    invoice,
                    businessInfo,
                    {
                      name: client.name,
                      partnerName: client.partnerName,
                      email: client.email,
                      phone: client.phone
                    },
                    {
                      customTitle: invoice.customTitle || `${client.name} - ${formatDateI18n(invoice.issueDate, 'MMMM yyyy')}`,
                      legalText: legalText
                    }
                  );
                }
              }}
            >
              <Download className="h-4 w-4 mr-1" /> {t('invoices.download')} PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-1" /> {t('common.print')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailDialog;
