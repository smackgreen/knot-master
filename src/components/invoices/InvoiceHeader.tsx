
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InvoiceHeaderProps {
  onCreateInvoice: () => void;
}

const InvoiceHeader = ({ onCreateInvoice }: InvoiceHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
        <FileText className="h-6 w-6" /> {t('invoices.title')}
      </h1>
      <Button onClick={onCreateInvoice}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {t('invoices.addInvoice')}
      </Button>
    </div>
  );
};

export default InvoiceHeader;
