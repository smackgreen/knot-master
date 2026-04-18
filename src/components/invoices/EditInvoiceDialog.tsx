import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/types";
import { FileText } from "lucide-react";
import { InvoiceForm } from "./invoice-form/InvoiceForm";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { useTranslation } from "react-i18next";

interface EditInvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditInvoiceDialog = ({ invoice, open, onOpenChange }: EditInvoiceDialogProps) => {
  const { updateInvoice } = useApp();
  const form = useInvoiceForm(invoice);
  const { t } = useTranslation();

  const handleUpdateInvoice = () => {
    if (!invoice) return;

    const updatedInvoice: Invoice = {
      ...invoice,
      clientId: form.clientId,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      items: form.items.map(item => ({ ...item, id: Math.random().toString(36).substring(2, 9) })),
      subtotal: form.calculateSubtotal(),
      tax: form.calculateTax(),
      total: form.calculateTotal(),
      notes: form.notes,
      legalText: form.legalText,
      customTitle: form.customTitle,
    };

    updateInvoice(invoice.id, updatedInvoice);
    onOpenChange(false);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('invoices.editInvoice')}
          </DialogTitle>
          <DialogDescription>
            {t('invoices.editInvoiceDescription', 'Edit invoice details and items')}
          </DialogDescription>
        </DialogHeader>

        <InvoiceForm form={form} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleUpdateInvoice}>{t('invoices.updateInvoice')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceDialog;
