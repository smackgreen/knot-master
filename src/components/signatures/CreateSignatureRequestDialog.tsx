import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { createSignatureRequest, getDocumentsForSignature } from '@/services/signatureService';
import { getDocumentsByInvoiceId, getDocumentsByQuotationId, getDocumentsByContractId } from '@/services/documentService';
import { Document, SignerRole, Client, Invoice, Quotation, Contract } from '@/types';
import { useApp } from '@/context/AppContext';
import UploadDocumentForSignatureDialog from './UploadDocumentForSignatureDialog';
import TestEmailButton from './TestEmailButton';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CreateSignatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateSignatureRequestDialog: React.FC<CreateSignatureRequestDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { clients, getInvoicesByClientId, getQuotationsByClientId, getContractsByClientId } = useApp();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState<boolean>(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [clientQuotations, setClientQuotations] = useState<Quotation[]>([]);
  const [clientContracts, setClientContracts] = useState<Contract[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [documentSource, setDocumentSource] = useState<'all' | 'invoice' | 'quotation' | 'contract'>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);

  // Form schema
  const formSchema = z.object({
    clientId: z.string().optional(),
    recipientName: z.string().min(1, { message: t('signatures.validation.nameRequired') }),
    recipientEmail: z.string().email({ message: t('signatures.validation.emailInvalid') }),
    recipientPhone: z.string().min(10, { message: t('signatures.validation.phoneInvalid') }).optional(),
    recipientRole: z.enum(['client', 'vendor', 'planner'], {
      required_error: t('signatures.validation.roleRequired'),
    }),
    expiresInDays: z.coerce.number().min(1).max(30),
    // Make documents optional - we'll handle validation in onSubmit
    documents: z.array(z.string()).optional(),
    invoiceId: z.string().optional(),
    quotationId: z.string().optional(),
    contractId: z.string().optional(),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: undefined,
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
      recipientRole: 'client',
      expiresInDays: 7,
      documents: [],
      invoiceId: undefined,
      quotationId: undefined,
      contractId: undefined,
    },
  });

  // Load documents when dialog opens
  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  // Handle document upload success
  const handleUploadSuccess = () => {
    // Refresh documents based on current selection
    if (selectedInvoice && selectedInvoice !== 'none') {
      fetchDocumentsForInvoice(selectedInvoice);
    } else if (selectedQuotation && selectedQuotation !== 'none') {
      fetchDocumentsForQuotation(selectedQuotation);
    } else if (selectedContract && selectedContract !== 'none') {
      fetchDocumentsForContract(selectedContract);
    } else {
      fetchDocuments();
    }
    setIsUploadDialogOpen(false);
  };

  // Fetch available documents
  const fetchDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      // Get all documents regardless of source
      const allDocs = await getDocumentsForSignature();

      // Filter documents based on source if needed
      if (documentSource === 'invoice' && selectedInvoice) {
        const invoiceDocs = await getDocumentsByInvoiceId(selectedInvoice);
        setDocuments(invoiceDocs);
      } else if (documentSource === 'quotation' && selectedQuotation) {
        const quotationDocs = await getDocumentsByQuotationId(selectedQuotation);
        setDocuments(quotationDocs);
      } else if (documentSource === 'contract' && selectedContract) {
        const contractDocs = await getDocumentsByContractId(selectedContract);
        setDocuments(contractDocs);
      } else {
        // Show all documents
        setDocuments(allDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: t('signatures.errorFetchingDocuments'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Helper function to fetch documents for an invoice
  const fetchDocumentsForInvoice = async (invoiceId: string) => {
    setIsLoadingDocuments(true);
    try {
      const invoiceDocs = await getDocumentsByInvoiceId(invoiceId);

      // Get all documents as well
      const allDocs = await getDocumentsForSignature();

      // Combine the documents, with invoice documents first
      const combinedDocs = [...invoiceDocs, ...allDocs.filter(doc =>
        !invoiceDocs.some(invDoc => invDoc.id === doc.id)
      )];

      setDocuments(combinedDocs);
    } catch (error) {
      console.error('Error fetching invoice documents:', error);
      toast({
        title: t('signatures.errorFetchingDocuments'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Helper function to fetch documents for a quotation
  const fetchDocumentsForQuotation = async (quotationId: string) => {
    setIsLoadingDocuments(true);
    try {
      const quotationDocs = await getDocumentsByQuotationId(quotationId);

      // Get all documents as well
      const allDocs = await getDocumentsForSignature();

      // Combine the documents, with quotation documents first
      const combinedDocs = [...quotationDocs, ...allDocs.filter(doc =>
        !quotationDocs.some(quoDoc => quoDoc.id === doc.id)
      )];

      setDocuments(combinedDocs);
    } catch (error) {
      console.error('Error fetching quotation documents:', error);
      toast({
        title: t('signatures.errorFetchingDocuments'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Helper function to fetch documents for a contract
  const fetchDocumentsForContract = async (contractId: string) => {
    setIsLoadingDocuments(true);
    try {
      const contractDocs = await getDocumentsByContractId(contractId);

      // Get all documents as well
      const allDocs = await getDocumentsForSignature();

      // Combine the documents, with contract documents first
      const combinedDocs = [...contractDocs, ...allDocs.filter(doc =>
        !contractDocs.some(conDoc => conDoc.id === doc.id)
      )];

      setDocuments(combinedDocs);
    } catch (error) {
      console.error('Error fetching contract documents:', error);
      toast({
        title: t('signatures.errorFetchingDocuments'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);

    // Get client data
    const client = clients.find(c => c.id === clientId);
    if (client) {
      // Auto-fill recipient information
      form.setValue('recipientName', client.name);
      form.setValue('recipientEmail', client.email);
      form.setValue('recipientPhone', client.phone);
      form.setValue('recipientRole', 'client');

      // Get client's invoices, quotations, and contracts
      const invoices = getInvoicesByClientId(clientId);
      const quotations = getQuotationsByClientId(clientId);
      const contracts = getContractsByClientId(clientId);
      setClientInvoices(invoices);
      setClientQuotations(quotations);
      setClientContracts(contracts);
    }
  };

  // Check if documents exist for an invoice
  const checkInvoiceDocuments = async (invoiceId: string): Promise<boolean> => {
    try {
      const docs = await getDocumentsByInvoiceId(invoiceId);
      return docs.length > 0;
    } catch (error) {
      console.error('Error checking invoice documents:', error);
      return false;
    }
  };

  // Check if documents exist for a quotation
  const checkQuotationDocuments = async (quotationId: string): Promise<boolean> => {
    try {
      const docs = await getDocumentsByQuotationId(quotationId);
      return docs.length > 0;
    } catch (error) {
      console.error('Error checking quotation documents:', error);
      return false;
    }
  };

  // Check if documents exist for a contract
  const checkContractDocuments = async (contractId: string): Promise<boolean> => {
    try {
      const docs = await getDocumentsByContractId(contractId);
      return docs.length > 0;
    } catch (error) {
      console.error('Error checking contract documents:', error);
      return false;
    }
  };

  // Handle invoice selection
  const handleInvoiceChange = async (invoiceId: string | null) => {
    setSelectedInvoice(invoiceId);
    if (invoiceId && invoiceId !== 'none') {
      // Set document source first
      setDocumentSource('invoice');
      setSelectedQuotation(null);
      setSelectedContract(null);
      form.setValue('invoiceId', invoiceId);
      form.setValue('quotationId', undefined);
      form.setValue('contractId', undefined);

      // Fetch all documents and invoice documents
      setIsLoadingDocuments(true);
      try {
        // Get invoice documents
        const invoiceDocs = await getDocumentsByInvoiceId(invoiceId);

        // Get all documents as well
        const allDocs = await getDocumentsForSignature();

        // Combine the documents, with invoice documents first
        const combinedDocs = [...invoiceDocs, ...allDocs.filter(doc =>
          !invoiceDocs.some(invDoc => invDoc.id === doc.id)
        )];

        setDocuments(combinedDocs);

        if (invoiceDocs.length === 0) {
          toast({
            title: t('signatures.noDocumentsForInvoice'),
            description: t('signatures.usingInvoiceDirectly'),
            variant: 'warning',
          });
          setSelectedDocuments([]);
          form.setValue('documents', []);
        } else {
          // Select all documents from this invoice
          const docIds = invoiceDocs.map(doc => doc.id);
          console.log('Auto-selecting invoice documents:', docIds);
          setSelectedDocuments(docIds);
          form.setValue('documents', docIds);

          // Force form validation update
          form.clearErrors('documents');

          toast({
            title: t('signatures.documentsFoundForInvoice'),
            description: t('signatures.documentsAutoSelected', { count: docIds.length }),
          });
        }
      } catch (error) {
        console.error('Error fetching invoice documents:', error);
        toast({
          title: t('signatures.errorFetchingDocuments'),
          description: t('signatures.usingInvoiceDirectly'),
          variant: 'warning',
        });
      } finally {
        setIsLoadingDocuments(false);
      }
    } else if (invoiceId === 'none') {
      // If "No invoice" is selected
      form.setValue('invoiceId', undefined);
      setDocumentSource('all');
      setSelectedDocuments([]);
      form.setValue('documents', []);
      fetchDocuments();
    }
  };

  // Handle quotation selection
  const handleQuotationChange = async (quotationId: string | null) => {
    setSelectedQuotation(quotationId);
    if (quotationId && quotationId !== 'none') {
      // Set document source first
      setDocumentSource('quotation');
      setSelectedInvoice(null);
      setSelectedContract(null);
      form.setValue('quotationId', quotationId);
      form.setValue('invoiceId', undefined);
      form.setValue('contractId', undefined);

      // Fetch all documents and quotation documents
      setIsLoadingDocuments(true);
      try {
        // Get quotation documents
        const quotationDocs = await getDocumentsByQuotationId(quotationId);

        // Get all documents as well
        const allDocs = await getDocumentsForSignature();

        // Combine the documents, with quotation documents first
        const combinedDocs = [...quotationDocs, ...allDocs.filter(doc =>
          !quotationDocs.some(quoDoc => quoDoc.id === doc.id)
        )];

        setDocuments(combinedDocs);

        if (quotationDocs.length === 0) {
          toast({
            title: t('signatures.noDocumentsForQuotation'),
            description: t('signatures.usingQuotationDirectly'),
            variant: 'warning',
          });
          setSelectedDocuments([]);
          form.setValue('documents', []);
        } else {
          // Select all documents from this quotation
          const docIds = quotationDocs.map(doc => doc.id);
          console.log('Auto-selecting quotation documents:', docIds);
          setSelectedDocuments(docIds);
          form.setValue('documents', docIds);

          // Force form validation update
          form.clearErrors('documents');

          toast({
            title: t('signatures.documentsFoundForQuotation'),
            description: t('signatures.documentsAutoSelected', { count: docIds.length }),
          });
        }
      } catch (error) {
        console.error('Error fetching quotation documents:', error);
        toast({
          title: t('signatures.errorFetchingDocuments'),
          description: t('signatures.usingQuotationDirectly'),
          variant: 'warning',
        });
      } finally {
        setIsLoadingDocuments(false);
      }
    } else if (quotationId === 'none') {
      // If "No quotation" is selected
      form.setValue('quotationId', undefined);
      setDocumentSource('all');
      setSelectedDocuments([]);
      form.setValue('documents', []);
      fetchDocuments();
    }
  };

  // Handle contract selection
  const handleContractChange = async (contractId: string | null) => {
    setSelectedContract(contractId);
    if (contractId && contractId !== 'none') {
      // Set document source first
      setDocumentSource('contract');
      setSelectedInvoice(null);
      setSelectedQuotation(null);
      form.setValue('contractId', contractId);
      form.setValue('invoiceId', undefined);
      form.setValue('quotationId', undefined);

      // Fetch all documents and contract documents
      setIsLoadingDocuments(true);
      try {
        // Get contract documents
        const contractDocs = await getDocumentsByContractId(contractId);

        // Get all documents as well
        const allDocs = await getDocumentsForSignature();

        // Combine the documents, with contract documents first
        const combinedDocs = [...contractDocs, ...allDocs.filter(doc =>
          !contractDocs.some(conDoc => conDoc.id === doc.id)
        )];

        setDocuments(combinedDocs);

        if (contractDocs.length === 0) {
          toast({
            title: t('signatures.noDocumentsForContract'),
            description: t('signatures.usingContractDirectly'),
            variant: 'warning',
          });
          setSelectedDocuments([]);
          form.setValue('documents', []);
        } else {
          // Select all documents from this contract
          const docIds = contractDocs.map(doc => doc.id);
          console.log('Auto-selecting contract documents:', docIds);
          setSelectedDocuments(docIds);
          form.setValue('documents', docIds);

          // Force form validation update
          form.clearErrors('documents');

          toast({
            title: t('signatures.documentsFoundForContract'),
            description: t('signatures.documentsAutoSelected', { count: docIds.length }),
          });
        }
      } catch (error) {
        console.error('Error fetching contract documents:', error);
        toast({
          title: t('signatures.errorFetchingDocuments'),
          description: t('signatures.usingContractDirectly'),
          variant: 'warning',
        });
      } finally {
        setIsLoadingDocuments(false);
      }
    } else if (contractId === 'none') {
      // If "No contract" is selected
      form.setValue('contractId', undefined);
      setDocumentSource('all');
      setSelectedDocuments([]);
      form.setValue('documents', []);
      fetchDocuments();
    }
  };



  // Reset document source to show all documents
  const showAllDocuments = () => {
    setDocumentSource('all');
    setSelectedInvoice(null);
    setSelectedQuotation(null);
    setSelectedContract(null);
    form.setValue('invoiceId', undefined);
    form.setValue('quotationId', undefined);
    form.setValue('contractId', undefined);
    fetchDocuments();
  };

  // Handle document selection
  const toggleDocument = (documentId: string) => {
    console.log('Toggling document:', documentId);
    setSelectedDocuments(prev => {
      let newSelection;
      if (prev.includes(documentId)) {
        newSelection = prev.filter(id => id !== documentId);
      } else {
        newSelection = [...prev, documentId];
      }
      console.log('New selection:', newSelection);

      // Debug log to help diagnose issues
      setTimeout(() => {
        console.log('Document selection state after update:', selectedDocuments);
      }, 100);

      return newSelection;
    });
  };

  // Update form value when selected documents change
  useEffect(() => {
    console.log('Selected documents changed:', selectedDocuments);
    form.setValue('documents', selectedDocuments);

    // Force validation update
    if (selectedDocuments.length > 0) {
      form.clearErrors('documents');
    }
  }, [selectedDocuments, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      console.log('Form values on submit:', values);
      console.log('Selected documents state:', selectedDocuments);

      // Initialize document IDs array
      let documentIds: string[] = [];

      // Check if we have an invoice selected
      if (selectedInvoice && selectedInvoice !== 'none') {
        console.log('Getting documents for invoice:', selectedInvoice);
        const invoiceDocs = await getDocumentsByInvoiceId(selectedInvoice);

        if (invoiceDocs.length === 0) {
          toast({
            title: t('signatures.noDocumentsForInvoice'),
            description: t('signatures.pleaseUploadDocumentsFirst'),
            variant: 'destructive',
          });
          setIsLoading(false);
          return; // Exit early
        }

        documentIds = invoiceDocs.map(doc => doc.id);
        console.log('Using invoice documents:', documentIds);
      }
      // Check if we have a quotation selected
      else if (selectedQuotation && selectedQuotation !== 'none') {
        console.log('Getting documents for quotation:', selectedQuotation);
        const quotationDocs = await getDocumentsByQuotationId(selectedQuotation);

        if (quotationDocs.length === 0) {
          toast({
            title: t('signatures.noDocumentsForQuotation'),
            description: t('signatures.pleaseUploadDocumentsFirst'),
            variant: 'destructive',
          });
          setIsLoading(false);
          return; // Exit early
        }

        documentIds = quotationDocs.map(doc => doc.id);
        console.log('Using quotation documents:', documentIds);
      }
      // Otherwise use the selected documents
      else if (values.documents && values.documents.length > 0) {
        documentIds = values.documents;
        console.log('Using directly selected documents:', documentIds);
      }
      // If still no documents, check the selectedDocuments state
      else if (selectedDocuments.length > 0) {
        documentIds = selectedDocuments;
        console.log('Using documents from state:', documentIds);
      }

      // Ensure we have at least one document
      if (documentIds.length === 0) {
        console.error('No documents found for submission');
        toast({
          title: t('signatures.noDocumentsSelected'),
          description: t('signatures.pleaseSelectDocuments'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return; // Exit early
      }

      const result = await createSignatureRequest({
        recipientName: values.recipientName,
        recipientEmail: values.recipientEmail,
        recipientPhone: values.recipientPhone,
        recipientRole: values.recipientRole as SignerRole,
        expiresInDays: values.expiresInDays,
        documentIds: documentIds,
      });

      if (result) {
        toast({
          title: t('signatures.requestCreated'),
          description: t('signatures.requestCreatedSuccess'),
        });

        if (onSuccess) {
          onSuccess();
        }

        onOpenChange(false);
        form.reset();
        setSelectedDocuments([]);
      } else {
        throw new Error('Failed to create signature request');
      }
    } catch (error) {
      console.error('Error creating signature request:', error);
      toast({
        title: t('signatures.errorCreatingRequest'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('signatures.createRequest')}</DialogTitle>
          <DialogDescription>
            {t('signatures.createRequestDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('signatures.selectClient')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleClientChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('signatures.selectClientPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('signatures.selectClientDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedClient && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signatures.selectInvoice')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleInvoiceChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('signatures.selectInvoicePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('signatures.noInvoice')}</SelectItem>
                          {clientInvoices.map((invoice) => (
                            <SelectItem key={invoice.id} value={invoice.id}>
                              {invoice.invoiceNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quotationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signatures.selectQuotation')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleQuotationChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('signatures.selectQuotationPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('signatures.noQuotation')}</SelectItem>
                          {clientQuotations.map((quotation) => (
                            <SelectItem key={quotation.id} value={quotation.id}>
                              {quotation.quotationNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signatures.selectContract')}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleContractChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('signatures.selectContractPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('signatures.noContract')}</SelectItem>
                          {clientContracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signatures.recipientName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signatures.recipientEmail')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signatures.recipientPhone')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormDescription>
                      {t('signatures.phoneDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('signatures.recipientRole')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('signatures.selectRole')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="client">{t('signatures.roles.client')}</SelectItem>
                        <SelectItem value="vendor">{t('signatures.roles.vendor')}</SelectItem>
                        <SelectItem value="planner">{t('signatures.roles.planner')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiresInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('signatures.expiresInDays')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} max={30} />
                  </FormControl>
                  <FormDescription>
                    {t('signatures.expiresDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <FormLabel>{t('signatures.selectDocuments')}</FormLabel>
                  {(selectedInvoice && selectedInvoice !== 'none') && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <span className="inline-flex items-center bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium mr-2">
                          <FileText className="h-3 w-3 mr-1" />
                          {t('signatures.usingInvoiceDocuments')}
                          {selectedDocuments.length > 0 && ` (${selectedDocuments.length})`}
                        </span>
                        {t('signatures.documentsFromInvoice')}
                      </p>
                    </div>
                  )}
                  {(selectedQuotation && selectedQuotation !== 'none') && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <span className="inline-flex items-center bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium mr-2">
                          <FileText className="h-3 w-3 mr-1" />
                          {t('signatures.usingQuotationDocuments')}
                          {selectedDocuments.length > 0 && ` (${selectedDocuments.length})`}
                        </span>
                        {t('signatures.documentsFromQuotation')}
                      </p>
                    </div>
                  )}
                  {(selectedContract && selectedContract !== 'none') && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <span className="inline-flex items-center bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium mr-2">
                          <FileText className="h-3 w-3 mr-1" />
                          {t('signatures.usingContractDocuments')}
                          {selectedDocuments.length > 0 && ` (${selectedDocuments.length})`}
                        </span>
                        {t('signatures.documentsFromContract')}
                      </p>
                    </div>
                  )}
                </div>
                {(selectedInvoice || selectedQuotation || selectedContract) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={showAllDocuments}
                  >
                    {t('signatures.showAllDocuments')}
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name="documents"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div className="border rounded-md p-4">
                        {isLoadingDocuments ? (
                          <div className="flex justify-center items-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : documents.length === 0 ? (
                          <div className="space-y-4 py-4">
                            <Alert variant="warning">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>
                                {documentSource === 'invoice' ?
                                  t('signatures.noDocumentsForInvoice') :
                                  documentSource === 'quotation' ?
                                    t('signatures.noDocumentsForQuotation') :
                                    documentSource === 'contract' ?
                                      t('signatures.noDocumentsForContract') :
                                      t('signatures.noDocumentsAvailable')
                                }
                              </AlertTitle>
                              <AlertDescription>
                                {t('signatures.pleaseUploadDocumentsFirst')}
                              </AlertDescription>
                            </Alert>

                            <div className="flex justify-center">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsUploadDialogOpen(true)}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                {t('signatures.uploadDocumentNow')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {documents.map((document) => (
                                <div key={document.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={document.id}
                                    checked={selectedDocuments.includes(document.id)}
                                    onCheckedChange={() => toggleDocument(document.id)}
                                  />
                                  <label
                                    htmlFor={document.id}
                                    className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                    {document.name}
                                    {document.invoiceId && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({t('signatures.invoiceDocument')})
                                      </span>
                                    )}
                                    {document.quotationId && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({t('signatures.quotationDocument')})
                                      </span>
                                    )}
                                    {document.contractId && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({t('signatures.contractDocument')})
                                      </span>
                                    )}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t('signatures.documentsDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Debug - Selected documents:', selectedDocuments);
                    console.log('Debug - Form values:', form.getValues());
                    console.log('Debug - Selected invoice:', selectedInvoice);
                    console.log('Debug - Selected quotation:', selectedQuotation);
                    console.log('Debug - Selected contract:', selectedContract);
                    console.log('Debug - Documents list:', documents);

                    // Force update selected documents in form
                    if (selectedInvoice && selectedInvoice !== 'none') {
                      getDocumentsByInvoiceId(selectedInvoice).then(docs => {
                        const docIds = docs.map(doc => doc.id);
                        setSelectedDocuments(docIds);
                        form.setValue('documents', docIds);
                        toast({
                          title: 'Debug: Updated documents',
                          description: `Selected ${docIds.length} documents from invoice`,
                        });
                      });
                    } else if (selectedQuotation && selectedQuotation !== 'none') {
                      getDocumentsByQuotationId(selectedQuotation).then(docs => {
                        const docIds = docs.map(doc => doc.id);
                        setSelectedDocuments(docIds);
                        form.setValue('documents', docIds);
                        toast({
                          title: 'Debug: Updated documents',
                          description: `Selected ${docIds.length} documents from quotation`,
                        });
                      });
                    } else if (selectedContract && selectedContract !== 'none') {
                      getDocumentsByContractId(selectedContract).then(docs => {
                        const docIds = docs.map(doc => doc.id);
                        setSelectedDocuments(docIds);
                        form.setValue('documents', docIds);
                        toast({
                          title: 'Debug: Updated documents',
                          description: `Selected ${docIds.length} documents from contract`,
                        });
                      });
                    }
                  }}
                >
                  Debug
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  {t('common.cancel')}
                </Button>
                <TestEmailButton
                  recipientEmail={form.getValues('recipientEmail')}
                  recipientName={form.getValues('recipientName')}
                />
              </div>
              <Button
                type="button"
                onClick={async () => {
                  // Direct approach - bypass the form submission and handle it manually
                  setIsLoading(true);

                  try {
                    // Validate form first
                    const isValid = await form.trigger();
                    if (!isValid) {
                      console.log('Form validation failed');
                      toast({
                        title: t('signatures.formValidationFailed'),
                        description: t('signatures.pleaseCheckFormFields'),
                        variant: 'destructive',
                      });
                      setIsLoading(false);
                      return;
                    }

                    // Get form values
                    const values = form.getValues();
                    console.log('Direct submission - Form values:', values);

                    // Get documents based on selected documents, invoice, quotation, or contract
                    let documentIds: string[] = [];
                    let invoiceId: string | undefined = undefined;
                    let quotationId: string | undefined = undefined;
                    let contractId: string | undefined = undefined;

                    // Check if we have selected documents
                    if (selectedDocuments.length > 0) {
                      documentIds = selectedDocuments;
                      console.log('Direct submission - Using selected documents:', documentIds);
                    } else if (values.documents && values.documents.length > 0) {
                      documentIds = values.documents;
                      console.log('Direct submission - Using form documents:', documentIds);
                    }

                    // Check if we have a selected invoice
                    if (selectedInvoice && selectedInvoice !== 'none') {
                      console.log('Direct submission - Using invoice for signature:', selectedInvoice);
                      invoiceId = selectedInvoice;

                      toast({
                        title: t('signatures.usingInvoiceAsDocument'),
                        description: t('signatures.usingInvoiceForSignature'),
                      });
                    }

                    // Check if we have a selected quotation
                    if (selectedQuotation && selectedQuotation !== 'none') {
                      console.log('Direct submission - Using quotation for signature:', selectedQuotation);
                      quotationId = selectedQuotation;

                      toast({
                        title: t('signatures.usingQuotationAsDocument'),
                        description: t('signatures.usingQuotationForSignature'),
                      });
                    }

                    // Check if we have a selected contract
                    if (selectedContract && selectedContract !== 'none') {
                      console.log('Direct submission - Using contract for signature:', selectedContract);
                      contractId = selectedContract;

                      toast({
                        title: t('signatures.usingContractAsDocument'),
                        description: t('signatures.usingContractForSignature'),
                      });
                    }

                    // Check if we have any documents, invoice, quotation, or contract
                    if (documentIds.length === 0 && !invoiceId && !quotationId && !contractId) {
                      console.error('Direct submission - No documents found');
                      toast({
                        title: t('signatures.noDocumentsSelected'),
                        description: t('signatures.pleaseSelectDocuments'),
                        variant: 'destructive',
                      });
                      setIsLoading(false);
                      return;
                    }

                    // Create the signature request with all the information
                    const result = await createSignatureRequest({
                      recipientName: values.recipientName,
                      recipientEmail: values.recipientEmail,
                      recipientPhone: values.recipientPhone,
                      recipientRole: values.recipientRole as SignerRole,
                      expiresInDays: values.expiresInDays,
                      documentIds: documentIds,
                      invoiceId: invoiceId,
                      quotationId: quotationId,
                      contractId: contractId,
                    });

                    if (result) {
                      let successMessage = t('signatures.requestCreatedSuccess');

                      if (invoiceId) {
                        successMessage = t('signatures.requestCreatedWithInvoice');
                      } else if (quotationId) {
                        successMessage = t('signatures.requestCreatedWithQuotation');
                      } else if (contractId) {
                        successMessage = t('signatures.requestCreatedWithContract');
                      }

                      toast({
                        title: t('signatures.requestCreated'),
                        description: successMessage,
                      });

                      if (onSuccess) {
                        onSuccess();
                      }

                      onOpenChange(false);
                      form.reset();
                      setSelectedDocuments([]);
                    } else {
                      throw new Error('Failed to create signature request');
                    }
                  } catch (error) {
                    console.error('Error creating signature request:', error);
                    toast({
                      title: t('signatures.errorCreatingRequest'),
                      description: t('signatures.tryAgainLater'),
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading || isLoadingDocuments}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('signatures.sendRequest')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Document Upload Dialog */}
      <UploadDocumentForSignatureDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </Dialog>
  );
};

export default CreateSignatureRequestDialog;
