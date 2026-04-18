import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useTranslation } from "react-i18next";

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amountBeforeTax: number;
  total: number;
}

interface InvoiceItemsProps {
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
}

const InvoiceItems = ({ items, onItemsChange }: InvoiceItemsProps) => {
  const { t } = useTranslation();
  const handleAddItem = () => {
    onItemsChange([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        amountBeforeTax: 0,
        total: 0
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

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

    onItemsChange(newItems);
  };

  return (
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">{t('invoices.description')}</TableHead>
            <TableHead>{t('invoices.quantity')}</TableHead>
            <TableHead>{t('invoices.unitPrice')}</TableHead>
            <TableHead>{t('invoices.amountBeforeTax')}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  placeholder={t('invoices.itemDescription')}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", Number(e.target.value))
                  }
                  placeholder={t('invoices.quantity')}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    handleItemChange(index, "unitPrice", Number(e.target.value))
                  }
                  placeholder={t('invoices.unitPrice')}
                />
              </TableCell>
              <TableCell>{formatCurrency(item.amountBeforeTax)}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceItems;
