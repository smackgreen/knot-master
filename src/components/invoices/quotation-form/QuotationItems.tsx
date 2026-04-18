
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceItem } from "@/types";
import { Plus, X } from "lucide-react";

interface QuotationItemsProps {
  items: Omit<InvoiceItem, "id">[];
  onItemsChange: (items: Omit<InvoiceItem, "id">[]) => void;
}

const QuotationItems = ({ items, onItemsChange }: QuotationItemsProps) => {
  const handleAddItem = () => {
    onItemsChange([
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
    onItemsChange(items.filter((_, i) => i !== index));
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

    onItemsChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Quotation Items</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-2 mb-2">
        <div className="col-span-6 text-sm font-medium">Description</div>
        <div className="col-span-2 text-sm font-medium">Qty</div>
        <div className="col-span-2 text-sm font-medium">Price</div>
        <div className="col-span-2 text-sm font-medium">Amount</div>
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
  );
};

export default QuotationItems;
