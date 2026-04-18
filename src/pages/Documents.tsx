import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Document } from '@/types';
import { getDocumentsByContractId, getDocumentsByQuotationId, getDocumentsByInvoiceId, getDocumentsByUserId } from '@/services/documentService';
import { initializeStorage } from '@/services/storageService';
import { useToast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import DocumentsList from '@/components/documents/DocumentsList';
import UploadDocumentDialog from '@/components/documents/UploadDocumentDialog';

const Documents: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contractDocuments, setContractDocuments] = useState<Document[]>([]);
  const [quotationDocuments, setQuotationDocuments] = useState<Document[]>([]);
  const [invoiceDocuments, setInvoiceDocuments] = useState<Document[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('contracts');

  const [bucketExists, setBucketExists] = useState<boolean>(true);
  const [rlsError, setRlsError] = useState<boolean>(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const success = await initializeStorage();
        setBucketExists(success);

        if (!success) {
          toast({
            title: t('documents.storageInitError'),
            description: t('documents.bucketNotFound'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
        setBucketExists(false);
        toast({
          title: t('documents.storageInitError'),
          description: t('documents.storageInitErrorDescription'),
          variant: 'destructive',
        });
      }
    };

    initStorage();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch all documents for the current user
      const allDocuments = await getDocumentsByUserId(user.id);

      // Filter documents by type
      const contractDocs = allDocuments.filter(doc => doc.contractId);
      const quotationDocs = allDocuments.filter(doc => doc.quotationId);
      const invoiceDocs = allDocuments.filter(doc => doc.invoiceId);

      // Set the documents
      setContractDocuments(contractDocs);
      setQuotationDocuments(quotationDocs);
      setInvoiceDocuments(invoiceDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: t('documents.errorFetchingDocuments'),
        description: t('documents.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  const handleUploadError = (error: Error) => {
    // Check if it's an RLS policy error
    if (error.message.includes('Permission denied') ||
        error.message.includes('row-level security policy')) {
      setRlsError(true);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('documents.title')}</h1>
        {bucketExists ? (
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('documents.uploadDocument')}
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <Plus className="h-4 w-4 mr-2" />
            {t('documents.uploadDocument')}
          </Button>
        )}
      </div>

      {!bucketExists && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">
                {t('documents.bucketNotFound')}
              </p>
              <div className="mt-2 text-sm text-amber-700">
                <p>{t('documents.createBucketInstructions')}</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Go to the <a href="https://app.supabase.io/" target="_blank" rel="noopener noreferrer" className="text-amber-800 underline">Supabase Dashboard</a></li>
                  <li>Select your project</li>
                  <li>Go to "Storage" in the sidebar</li>
                  <li>Click "New Bucket"</li>
                  <li>Enter "documents" as the bucket name</li>
                  <li>Configure access permissions as needed</li>
                  <li>Click "Create bucket"</li>
                </ol>
                <p className="mt-2">After creating the bucket, refresh this page.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {rlsError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {t('documents.rlsError')}
              </p>
              <div className="mt-2 text-sm text-red-700">
                <p>{t('documents.rlsErrorInstructions')}</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Go to the <a href="https://app.supabase.io/" target="_blank" rel="noopener noreferrer" className="text-red-800 underline">Supabase Dashboard</a></li>
                  <li>Select your project</li>
                  <li>Go to "Storage" in the sidebar</li>
                  <li>Click on the "documents" bucket</li>
                  <li>Go to the "Policies" tab</li>
                  <li>Create a policy for INSERT operations with the following rule:</li>
                  <li><code className="bg-red-100 px-2 py-1 rounded">(bucket_id = 'documents' AND auth.uid() IS NOT NULL)</code></li>
                </ol>
                <p className="mt-2">After creating the policy, refresh this page.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="contracts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="contracts">{t('documents.contractDocuments')}</TabsTrigger>
          <TabsTrigger value="quotations">{t('documents.quotationDocuments')}</TabsTrigger>
          <TabsTrigger value="invoices">{t('documents.invoiceDocuments')}</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{t('documents.contractDocuments')}</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DocumentsList
                documents={contractDocuments}
                onDocumentUpdated={fetchDocuments}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="quotations">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{t('documents.quotationDocuments')}</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DocumentsList
                documents={quotationDocuments}
                onDocumentUpdated={fetchDocuments}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{t('documents.invoiceDocuments')}</h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DocumentsList
                documents={invoiceDocuments}
                onDocumentUpdated={fetchDocuments}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {bucketExists && (
        <UploadDocumentDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          documentType={activeTab} // Pass the active tab as document type
        />
      )}
    </div>
  );
};

export default Documents;
