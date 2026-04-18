
import { InvoiceItem } from "@/types";
import { useMemo } from "react";

export const useQuotationCalculations = (
  items: Omit<InvoiceItem, "id">[],
  taxRate: number
) => {
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      // If amountBeforeTax is available, use it; otherwise calculate from quantity and unitPrice
      const itemAmountBeforeTax = item.amountBeforeTax || (item.quantity * item.unitPrice);
      return sum + itemAmountBeforeTax;
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return subtotal * (taxRate / 100);
  }, [subtotal, taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  return {
    subtotal,
    taxAmount,
    total
  };
};
