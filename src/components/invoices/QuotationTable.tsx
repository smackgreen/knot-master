
import { useState } from "react";
import { Quotation } from "@/types";
import { formatCurrency, formatDate, formatDateI18n } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Mail, Edit, Trash2, Download } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import QuotationDetailDialog from "./QuotationDetailDialog";
import EditQuotationDialog from "./EditQuotationDialog";
import { generateQuotationPDF } from "@/utils/pdfGenerator";

interface QuotationTableProps {
  quotations: Quotation[];
  onSend: (id: string) => void;
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

const QuotationTable = ({ quotations, onSend }: QuotationTableProps) => {
  const { clients, deleteQuotation } = useApp();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleViewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDetailDialogOpen(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setEditDialogOpen(true);
  };

  const handleDownloadQuotation = (quotation: Quotation) => {
    const client = clients.find(c => c.id === quotation.clientId);
    if (!client) return;

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
        customTitle: quotation.customTitle || `${client.name} - ${formatDateI18n(quotation.issueDate, 'MMMM yyyy')}`,
        legalText: legalText
      }
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('quotations.number')}</TableHead>
            <TableHead>{t('quotations.client')}</TableHead>
            <TableHead>{t('quotations.issueDate')}</TableHead>
            <TableHead>{t('quotations.validUntil')}</TableHead>
            <TableHead>{t('quotations.amount')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {t('quotations.noQuotationsFound')}
              </TableCell>
            </TableRow>
          ) : (
            quotations.map((quotation) => {
              const client = clients.find(c => c.id === quotation.clientId);
              return (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">{quotation.number}</TableCell>
                  <TableCell>{client ? `${client.name} & ${client.partnerName}` : t('quotations.unknownClient')}</TableCell>
                  <TableCell>{formatDateI18n(quotation.issueDate, 'MM/dd/yyyy')}</TableCell>
                  <TableCell>{formatDateI18n(quotation.validUntil, 'MM/dd/yyyy')}</TableCell>
                  <TableCell>{formatCurrency(quotation.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(quotation.status)}>
                      {t(`quotations.status.${quotation.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('common.view')}
                        onClick={() => handleViewQuotation(quotation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {quotation.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('quotations.send')}
                          onClick={() => onSend(quotation.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('quotations.download')}
                        onClick={() => handleDownloadQuotation(quotation)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('common.edit')}
                        onClick={() => handleEditQuotation(quotation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('common.delete')}
                        onClick={() => deleteQuotation(quotation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <QuotationDetailDialog
        quotation={selectedQuotation}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <EditQuotationDialog
        quotation={selectedQuotation}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
};

export default QuotationTable;
