
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Quotation } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { FileText, Building, Mail, Phone, MapPin, Printer, Globe, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { generateQuotationPDF } from "@/utils/pdfGenerator";
import { useTranslation } from "react-i18next";

interface QuotationDetailDialogProps {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: Quotation['status']) => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'draft':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const QuotationDetailDialog = ({ quotation, open, onOpenChange }: QuotationDetailDialogProps) => {
  const { clients } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation();
  const client = quotation ? clients.find(c => c.id === quotation.clientId) : null;

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

  if (!quotation) {
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
                <DialogTitle className="text-2xl font-serif">{t('quotations.title')} #{quotation.quotationNumber}</DialogTitle>
                <p className="text-sm text-muted-foreground">{businessInfo.name}</p>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(quotation.status)}>
              {t(`quotations.status.${quotation.status}`)}
            </Badge>
          </div>
          <DialogDescription>
            {t('quotations.issueDate')}: {formatDate(quotation.issueDate, 'MMMM d, yyyy')} • {t('quotations.validUntil')}: {formatDate(quotation.validUntil, 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Information */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div>
              <h3 className="font-semibold">{t('quotations.from')}</h3>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                <p className="flex items-center gap-2">
                  <Building className="h-4 w-4" /> {businessInfo.name}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {businessInfo.address}, {businessInfo.city}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {businessInfo.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {businessInfo.phone}
                </p>
                {businessInfo.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> {businessInfo.website}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('quotations.to')}</h3>
              {client ? (
                <div className="space-y-1">
                  <p className="font-medium">{client.name} & {client.partnerName}</p>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {client.email}
                  </p>
                  {client.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4" /> {client.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm">Unknown Client</p>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('quotations.quotationDetails')}</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">{t('quotations.subtotal')}:</span>
                  <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('quotations.amountBeforeTax')}:</span>
                  <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('quotations.vat')}:</span>
                  <span className="font-medium">{formatCurrency(quotation.tax)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-medium">{t('quotations.total')}:</span>
                  <span className="font-bold text-lg">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Items */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('quotations.items')}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('quotations.description')}</TableHead>
                  <TableHead className="text-right">{t('quotations.quantity')}</TableHead>
                  <TableHead className="text-right">{t('quotations.unitPrice')}</TableHead>
                  <TableHead className="text-right">{t('quotations.amountBeforeTax')}</TableHead>
                  <TableHead className="text-right">{t('quotations.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item) => (
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
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div>
              <h3 className="text-sm font-medium mb-2">{t('quotations.notes')}</h3>
              <p className="text-sm text-muted-foreground">{quotation.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (client) {
                  // Use the stored legal text or fall back to a default
                  const legalText = quotation.legalText || "This quotation is valid for the period specified. Prices are subject to change after the validity period. All prices are subject to applicable taxes. Acceptance of this quotation is subject to our terms and conditions.";

                  generateQuotationPDF(
                    quotation,
                    businessInfo,
                    {
                      name: client.name,
                      partnerName: client.partnerName,
                      email: client.email,
                      phone: client.phone
                    },
                    {
                      customTitle: quotation.customTitle || `${client.name} - ${formatDate(quotation.issueDate, 'MMMM yyyy')}`,
                      legalText: legalText
                    }
                  );
                }
              }}
            >
              <Download className="h-4 w-4 mr-1" /> {t('quotations.download')} PDF
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

export default QuotationDetailDialog;
