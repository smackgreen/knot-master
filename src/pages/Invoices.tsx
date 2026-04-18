
import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceHeader from "@/components/invoices/InvoiceHeader";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import QuotationTable from "@/components/invoices/QuotationTable";
import QuotationHeader from "@/components/invoices/QuotationHeader";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import CreateQuotationDialog from "@/components/invoices/CreateQuotationDialog";
import { useTranslation } from "react-i18next";

const Invoices = () => {
  const { invoices, quotations, sendInvoice, sendQuotation } = useApp();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("invoices");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateQuotation, setShowCreateQuotation] = useState(false);

  const handleCreateInvoice = () => {
    setShowCreateInvoice(true);
  };

  const handleCreateQuotation = () => {
    setShowCreateQuotation(true);
  };

  const handleSendInvoice = (id: string) => {
    sendInvoice(id);
  };

  const handleSendQuotation = (id: string) => {
    sendQuotation(id);
  };

  return (
    <div>
      <Tabs defaultValue="invoices" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="invoices">{t('invoices.title')}</TabsTrigger>
            <TabsTrigger value="quotations">{t('quotations.title')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceHeader onCreateInvoice={handleCreateInvoice} />
          <Card>
            <CardContent className="pt-6">
              <InvoiceTable
                invoices={invoices}
                onSend={handleSendInvoice}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-6">
          <QuotationHeader onCreateQuotation={handleCreateQuotation} />
          <Card>
            <CardContent className="pt-6">
              <QuotationTable
                quotations={quotations}
                onSend={handleSendQuotation}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateInvoiceDialog
        open={showCreateInvoice}
        onOpenChange={setShowCreateInvoice}
      />

      <CreateQuotationDialog
        open={showCreateQuotation}
        onOpenChange={setShowCreateQuotation}
      />
    </div>
  );
};

export default Invoices;
