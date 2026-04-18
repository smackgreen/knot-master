
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Quotation } from "@/types";
import { FileText } from "lucide-react";
import { QuotationForm } from "./quotation-form/QuotationForm";
import { useQuotationForm } from "@/hooks/useQuotationForm";
import { useTranslation } from "react-i18next";

interface EditQuotationDialogProps {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditQuotationDialog = ({ quotation, open, onOpenChange }: EditQuotationDialogProps) => {
  const { updateQuotation } = useApp();
  const form = useQuotationForm(quotation);
  const { t } = useTranslation();

  const handleUpdateQuotation = () => {
    if (!quotation) return;

    const updatedQuotation: Quotation = {
      ...quotation,
      clientId: form.clientId,
      issueDate: form.issueDate,
      validUntil: form.validUntil,
      items: form.items.map(item => ({ ...item, id: Math.random().toString(36).substring(2, 9) })),
      subtotal: form.calculateSubtotal(),
      tax: form.calculateTax(),
      total: form.calculateTotal(),
      notes: form.notes,
      legalText: form.legalText,
      customTitle: form.customTitle,
    };

    updateQuotation(quotation.id, updatedQuotation);
    onOpenChange(false);
  };

  if (!quotation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('quotations.editQuotation')}
          </DialogTitle>
          <DialogDescription>
            {t('quotations.editQuotationDescription', 'Edit quotation details and items')}
          </DialogDescription>
        </DialogHeader>

        <QuotationForm form={form} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleUpdateQuotation}>{t('quotations.updateQuotation')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuotationDialog;
