
import { useState, useEffect } from "react";
import { InvoiceItem, Quotation } from "@/types";

// Default legal text for quotations
const DEFAULT_QUOTATION_LEGAL_TEXT = "This quotation is valid for the period specified. Prices are subject to change after the validity period. All prices are subject to applicable taxes. Acceptance of this quotation is subject to our terms and conditions.";

export const useQuotationForm = (quotation: Quotation | null) => {
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<Omit<InvoiceItem, "id">[]>([]);
  const [notes, setNotes] = useState("");
  const [tax, setTax] = useState(8);
  const [legalText, setLegalText] = useState(DEFAULT_QUOTATION_LEGAL_TEXT);
  const [customTitle, setCustomTitle] = useState("");

  useEffect(() => {
    if (quotation) {
      setClientId(quotation.clientId);
      setIssueDate(quotation.issueDate.split('T')[0]);
      setValidUntil(quotation.validUntil.split('T')[0]);
      setItems(quotation.items.map(({ id, ...rest }) => rest));
      setNotes(quotation.notes || "");
      setTax((quotation.tax / quotation.subtotal) * 100);
      setLegalText(quotation.legalText || DEFAULT_QUOTATION_LEGAL_TEXT);
      setCustomTitle(quotation.customTitle || "");
    }
  }, [quotation]);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
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

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].total =
        Number(newItems[index].quantity) *
        Number(newItems[index].unitPrice);
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (tax / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return {
    clientId,
    setClientId,
    issueDate,
    setIssueDate,
    validUntil,
    setValidUntil,
    items,
    setItems,
    notes,
    setNotes,
    tax,
    setTax,
    legalText,
    setLegalText,
    customTitle,
    setCustomTitle,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    calculateSubtotal,
    calculateTax,
    calculateTotal
  };
};
