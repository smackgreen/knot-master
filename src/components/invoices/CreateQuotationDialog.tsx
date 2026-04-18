
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceItem } from "@/types";
import { FileText } from "lucide-react";
import QuotationItems from "./quotation-form/QuotationItems";
import QuotationSummary from "./quotation-form/QuotationSummary";
import { useQuotationCalculations } from "@/hooks/useQuotationCalculations";
import { useTranslation } from "react-i18next";

interface CreateQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateQuotationDialog = ({ open, onOpenChange }: CreateQuotationDialogProps) => {
  const { clients, addQuotation } = useApp();
  const { t } = useTranslation();
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<Omit<InvoiceItem, "id">[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      amountBeforeTax: 0,
      taxAmount: 0,
      total: 0
    },
  ]);
  const [notes, setNotes] = useState("This quote is valid for 30 days.");
  const [tax, setTax] = useState(8);
  const [legalText, setLegalText] = useState("This quotation is valid for the period specified. Prices are subject to change after the validity period. All prices are subject to applicable taxes. Acceptance of this quotation is subject to our terms and conditions.");
  const [customTitle, setCustomTitle] = useState("");

  const { subtotal, taxAmount, total } = useQuotationCalculations(items, tax);

  const handleCreateQuotation = () => {
    if (!clientId) return;

    // Generate a unique quotation number with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const nextQuotationNumber = `Q-${year}-${timestamp.toString().slice(-6)}-${randomPart}`;

    addQuotation({
      clientId,
      quotationNumber: nextQuotationNumber,
      issueDate,
      validUntil,
      status: "draft",
      items: items.map(item => ({ ...item, id: Math.random().toString(36).substring(2, 9) })),
      subtotal,
      tax: taxAmount,
      total,
      notes,
      legalText,
      customTitle,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('quotations.createNewQuotation')}
          </DialogTitle>
          <DialogDescription>
            {t('quotations.createQuotationDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">{t('quotations.client')}</Label>
              <Select
                value={clientId}
                onValueChange={(value) => setClientId(value)}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder={t('common.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} & {client.partnerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate">{t('quotations.issueDate')}</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="validUntil">{t('quotations.validUntil')}</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <QuotationItems items={items} onItemsChange={setItems} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax">{t('quotations.tax')}</Label>
              <Input
                id="tax"
                type="number"
                min="0"
                max="100"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('quotations.notes')}</Label>
              <Input
                id="notes"
                placeholder={t('quotations.notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customTitle">{t('quotations.customTitle')}</Label>
              <Input
                id="customTitle"
                placeholder={t('quotations.customTitlePlaceholder')}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('quotations.customTitleHelp')}
              </p>
            </div>
            <div>
              <Label htmlFor="legalText">{t('quotations.legalText')}</Label>
              <Textarea
                id="legalText"
                placeholder={t('quotations.legalText')}
                value={legalText}
                onChange={(e) => setLegalText(e.target.value)}
                className="min-h-[120px] resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('quotations.legalTextHelp')}
              </p>
            </div>
          </div>

          <QuotationSummary
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('quotations.cancel')}
          </Button>
          <Button onClick={handleCreateQuotation}>{t('quotations.createQuotation')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuotationDialog;
