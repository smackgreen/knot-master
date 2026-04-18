import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceItem } from "@/types";
import { X, Plus, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateInvoiceDialog = ({ open, onOpenChange }: CreateInvoiceDialogProps) => {
  const { clients, addInvoice } = useApp();
  const { t } = useTranslation();
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<Omit<InvoiceItem, "id">[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      amountBeforeTax: 0,
      total: 0
    },
  ]);
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(8);
  const [legalText, setLegalText] = useState("This invoice is issued in accordance with our terms and conditions. Payment is due by the date specified. Late payments may incur additional fees. All prices are subject to applicable taxes.");
  const [customTitle, setCustomTitle] = useState("");

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        amountBeforeTax: 0,
        total: 0
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Recalculate values when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? Number(value) : newItems[index].quantity;
      const unitPrice = field === "unitPrice" ? Number(value) : newItems[index].unitPrice;

      // Calculate amount before tax (quantity * unitPrice)
      const amountBeforeTax = quantity * unitPrice;
      newItems[index].amountBeforeTax = amountBeforeTax;

      // Total is just the amount before tax (tax will be applied globally)
      newItems[index].total = amountBeforeTax;
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCreateInvoice = () => {
    if (!clientId) return;

    // Generate a unique invoice number with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const nextInvoiceNumber = `INV-${year}-${timestamp.toString().slice(-6)}-${randomPart}`;

    addInvoice({
      clientId,
      invoiceNumber: nextInvoiceNumber,
      issueDate,
      dueDate,
      status: "draft",
      items: items.map(item => ({ ...item, id: Math.random().toString(36).substring(2, 9) })),
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
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
            {t('invoices.createNewInvoice')}
          </DialogTitle>
          <DialogDescription>
            {t('invoices.createInvoiceDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">{t('invoices.client')}</Label>
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
              <Label htmlFor="issueDate">{t('invoices.issueDate')}</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">{t('invoices.dueDate')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>{t('invoices.invoiceItems')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> {t('invoices.addItem')}
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-6 text-sm font-medium">{t('invoices.description')}</div>
              <div className="col-span-2 text-sm font-medium">{t('invoices.quantity')}</div>
              <div className="col-span-2 text-sm font-medium">{t('invoices.unitPrice')}</div>
              <div className="col-span-2 text-sm font-medium">{t('invoices.amount')}</div>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", Number(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="text"
                    placeholder="Amount"
                    disabled
                    value={item.amountBeforeTax?.toFixed(2) || "0.00"}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1">
            <Label htmlFor="notes">{t('invoices.notes')}</Label>
            <Input
              id="notes"
              placeholder={t('invoices.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customTitle">{t('invoices.customTitle')}</Label>
              <Input
                id="customTitle"
                placeholder={t('invoices.customTitlePlaceholder')}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
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
                value={legalText}
                onChange={(e) => setLegalText(e.target.value)}
                className="min-h-[120px] resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('invoices.legalTextHelp')}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div>
              <Label htmlFor="taxRate">{t('invoices.taxRate')}</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-32"
              />
            </div>

            <div className="flex flex-col space-y-1.5 items-end">
              <div className="flex justify-between w-1/2">
                <span className="text-sm">{t('invoices.subtotal')}:</span>
                <span className="text-sm font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-1/2">
                <span className="text-sm">{t('invoices.tax')} ({taxRate}%):</span>
                <span className="text-sm font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-1/2 pt-2 border-t">
                <span className="font-medium">{t('invoices.total')}:</span>
                <span className="font-medium">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('invoices.cancel')}
          </Button>
          <Button onClick={handleCreateInvoice}>{t('invoices.createInvoice')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceDialog;
