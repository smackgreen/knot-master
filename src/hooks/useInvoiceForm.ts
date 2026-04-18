import { useState } from "react";
import { Invoice } from "@/types";

// Default legal text for invoices
const DEFAULT_INVOICE_LEGAL_TEXT = "This invoice is issued in accordance with our terms and conditions. Payment is due by the date specified. Late payments may incur additional fees. All prices are subject to applicable taxes.";

export const useInvoiceForm = (initialData?: Invoice | null) => {
  const [clientId, setClientId] = useState(initialData?.clientId || "");
  const [issueDate, setIssueDate] = useState(
    initialData?.issueDate || new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [items, setItems] = useState(
    initialData?.items || [
      { description: "", quantity: 1, unitPrice: 0, total: 0 },
    ]
  );
  const [tax, setTax] = useState(initialData?.tax ? (initialData.tax / initialData.subtotal) * 100 : 0);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [legalText, setLegalText] = useState(initialData?.legalText || DEFAULT_INVOICE_LEGAL_TEXT);
  const [customTitle, setCustomTitle] = useState(initialData?.customTitle || "");

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * tax) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return {
    clientId,
    issueDate,
    dueDate,
    items,
    tax,
    notes,
    legalText,
    customTitle,
    setClientId,
    setIssueDate,
    setDueDate,
    setItems,
    setTax,
    setNotes,
    setLegalText,
    setCustomTitle,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
  };
};
