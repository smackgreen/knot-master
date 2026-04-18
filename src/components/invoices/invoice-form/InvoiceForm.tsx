import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import InvoiceItems from "./InvoiceItems";
import InvoiceSummary from "./InvoiceSummary";
import { useTranslation } from "react-i18next";

interface InvoiceFormProps {
  form: {
    clientId: string;
    issueDate: string;
    dueDate: string;
    items: Array<{
      id?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    tax: number;
    notes: string;
    customTitle: string;
    legalText: string;
    setClientId: (value: string) => void;
    setIssueDate: (value: string) => void;
    setDueDate: (value: string) => void;
    setItems: (items: any[]) => void;
    setTax: (value: number) => void;
    setNotes: (value: string) => void;
    setCustomTitle: (value: string) => void;
    setLegalText: (value: string) => void;
    calculateSubtotal: () => number;
    calculateTax: () => number;
    calculateTotal: () => number;
  };
}

export const InvoiceForm = ({ form }: InvoiceFormProps) => {
  const { clients } = useApp();
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client">{t('invoices.client')}</Label>
          <Select value={form.clientId} onValueChange={form.setClientId}>
            <SelectTrigger id="client">
              <SelectValue placeholder={t('common.selectOption')} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} {client.partnerName ? `& ${client.partnerName}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="issueDate">{t('invoices.issueDate')}</Label>
          <Input
            id="issueDate"
            type="date"
            value={form.issueDate}
            onChange={(e) => form.setIssueDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">{t('invoices.dueDate')}</Label>
          <Input
            id="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => form.setDueDate(e.target.value)}
          />
        </div>
      </div>

      <InvoiceItems items={form.items} onItemsChange={form.setItems} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tax">Tax Rate</Label>
          <Input
            id="tax"
            type="number"
            min="0"
            max="100"
            value={form.tax}
            onChange={(e) => form.setTax(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="notes">{t('invoices.notes')}</Label>
          <Input
            id="notes"
            placeholder={t('invoices.notes')}
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customTitle">{t('invoices.customTitle')}</Label>
          <Input
            id="customTitle"
            placeholder={t('invoices.customTitlePlaceholder')}
            value={form.customTitle}
            onChange={(e) => form.setCustomTitle(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('invoices.customTitleHelp')}
          </p>
        </div>
        <div>
          <Label htmlFor="legalText">{t('invoices.legalText')}</Label>
          <Textarea
            id="legalText"
            placeholder={t('invoices.legalText')}
            value={form.legalText}
            onChange={(e) => form.setLegalText(e.target.value)}
            className="min-h-[120px] resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('invoices.legalTextHelp')}
          </p>
        </div>
      </div>

      <InvoiceSummary
        subtotal={form.calculateSubtotal()}
        tax={form.calculateTax()}
        total={form.calculateTotal()}
      />
    </div>
  );
};
