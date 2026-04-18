
interface QuotationSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
}

const QuotationSummary = ({ subtotal, tax, total }: QuotationSummaryProps) => {
  return (
    <div className="flex flex-col space-y-1.5 items-end">
      <div className="flex justify-between w-1/2">
        <span className="text-sm">Subtotal:</span>
        <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between w-1/2">
        <span className="text-sm">Tax ({tax}%):</span>
        <span className="text-sm font-medium">
          ${(subtotal * (tax / 100)).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between w-1/2 pt-2 border-t">
        <span className="font-medium">Total:</span>
        <span className="font-medium">${total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default QuotationSummary;
