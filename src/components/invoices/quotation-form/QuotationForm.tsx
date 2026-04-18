
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import QuotationItems from "@/components/invoices/quotation-form/QuotationItems";
import QuotationSummary from "@/components/invoices/quotation-form/QuotationSummary";

interface QuotationFormProps {
  form: ReturnType<typeof import("@/hooks/useQuotationForm").useQuotationForm>;
}

export const QuotationForm = ({ form }: QuotationFormProps) => {
  const { clients } = useApp();

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client">Client</Label>
          <Select
            value={form.clientId}
            onValueChange={form.setClientId}
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="Select a client" />
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
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            value={form.issueDate}
            onChange={(e) => form.setIssueDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="validUntil">Valid Until</Label>
          <Input
            id="validUntil"
            type="date"
            value={form.validUntil}
            onChange={(e) => form.setValidUntil(e.target.value)}
          />
        </div>
      </div>

      <QuotationItems
        items={form.items}
        onItemsChange={form.setItems}
      />

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
      </div>

      <div className="grid grid-cols-1">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          placeholder="Add notes to quotation"
          value={form.notes}
          onChange={(e) => form.setNotes(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customTitle">Custom Title</Label>
          <Input
            id="customTitle"
            placeholder="Custom title for the quotation PDF"
            value={form.customTitle}
            onChange={(e) => form.setCustomTitle(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This title will appear in the top-right corner of the PDF.
          </p>
        </div>
        <div>
          <Label htmlFor="legalText">Legal Text</Label>
          <Textarea
            id="legalText"
            placeholder="Legal text for the quotation PDF"
            value={form.legalText}
            onChange={(e) => form.setLegalText(e.target.value)}
            className="min-h-[120px] resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This text will appear at the bottom of each page in the PDF.
          </p>
        </div>
      </div>

      <QuotationSummary
        subtotal={form.calculateSubtotal()}
        tax={form.tax}
        total={form.calculateTotal()}
      />
    </div>
  );
};
