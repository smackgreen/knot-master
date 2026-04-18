import { Invoice, InvoiceStatus } from "@/types";
import { formatCurrency, formatDate, formatDateI18n } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Mail, Edit, Trash2, FileText, Download, Check, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useState } from "react";
import InvoiceDetailDialog from "./InvoiceDetailDialog";
import EditInvoiceDialog from "./EditInvoiceDialog";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceTableProps {
  invoices: Invoice[];
  onSend: (id: string) => void;
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

const InvoiceTable = ({ invoices, onSend }: InvoiceTableProps) => {
  const { clients, deleteInvoice, updateInvoice } = useApp();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  // Helper function to get status translation
  const getStatusTranslation = (status: string) => {
    // Map status to translation keys
    const statusMap: Record<string, string> = {
      'draft': t('invoices.status.draft'),
      'sent': t('invoices.status.sent'),
      'paid': t('invoices.status.paid'),
      'overdue': t('invoices.status.overdue')
    };
    return statusMap[status] || status;
  };
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Available status options for the dropdown
  const statusOptions: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue'];

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
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
  };

  // Handle status change
  const handleStatusChange = (invoice: Invoice, newStatus: InvoiceStatus) => {
    if (invoice.status === newStatus) return;

    // Update the invoice status
    updateInvoice(invoice.id, { status: newStatus });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('invoices.number')}</TableHead>
            <TableHead>{t('invoices.client')}</TableHead>
            <TableHead>{t('invoices.issueDate')}</TableHead>
            <TableHead>{t('invoices.dueDate')}</TableHead>
            <TableHead>{t('invoices.amount')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {t('invoices.noInvoicesFound')}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => {
              const client = clients.find(c => c.id === invoice.clientId);
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{client ? `${client.name} & ${client.partnerName}` : t('invoices.unknownClient')}</TableCell>
                  <TableCell>{formatDateI18n(invoice.issueDate, 'MM/dd/yyyy')}</TableCell>
                  <TableCell>{formatDateI18n(invoice.dueDate, 'MM/dd/yyyy')}</TableCell>
                  <TableCell>{formatCurrency(invoice.total)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0">
                          <Badge variant="outline" className={getStatusColor(invoice.status)}>
                            {getStatusTranslation(invoice.status)}
                          </Badge>
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {statusOptions.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(invoice, status)}
                            className="flex items-center gap-2"
                          >
                            {status === invoice.status && <Check className="h-4 w-4" />}
                            <span className={status === invoice.status ? "font-medium" : ""}>
                              {getStatusTranslation(status)}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('common.view')}
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('invoices.send')}
                          onClick={() => onSend(invoice.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('invoices.download')}
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('common.edit')}
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('common.delete')}
                        onClick={() => deleteInvoice(invoice.id)}
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

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <EditInvoiceDialog
        invoice={selectedInvoice}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
};

export default InvoiceTable;
