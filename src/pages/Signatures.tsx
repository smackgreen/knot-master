import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SignatureRequestsList from '@/components/signatures/SignatureRequestsList';
import CreateSignatureRequestDialog from '@/components/signatures/CreateSignatureRequestDialog';
import UploadDocumentForSignatureDialog from '@/components/signatures/UploadDocumentForSignatureDialog';
import { getSignatureRequests } from '@/services/signatureService';
import { SignatureRequest } from '@/types';

const Signatures = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchSignatureRequests();
  }, [activeTab]);

  const fetchSignatureRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const requests = await getSignatureRequests(activeTab as 'pending' | 'completed' | 'expired' | 'cancelled');
      setSignatureRequests(requests);
    } catch (error) {
      console.error('Error fetching signature requests:', error);
      toast({
        title: t('signatures.errorFetchingRequests'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchSignatureRequests();
    setIsCreateDialogOpen(false);
  };

  const handleUploadSuccess = () => {
    fetchSignatureRequests();
    setIsUploadDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('signatures.title')}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('signatures.uploadDocument')}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('signatures.createRequest')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="pending">{t('signatures.status.pending')}</TabsTrigger>
          <TabsTrigger value="completed">{t('signatures.status.completed')}</TabsTrigger>
          <TabsTrigger value="expired">{t('signatures.status.expired')}</TabsTrigger>
          <TabsTrigger value="cancelled">{t('signatures.status.cancelled')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <SignatureRequestsList
            requests={signatureRequests}
            isLoading={isLoading}
            status="pending"
            onRequestUpdated={fetchSignatureRequests}
          />
        </TabsContent>

        <TabsContent value="completed">
          <SignatureRequestsList
            requests={signatureRequests}
            isLoading={isLoading}
            status="completed"
            onRequestUpdated={fetchSignatureRequests}
          />
        </TabsContent>

        <TabsContent value="expired">
          <SignatureRequestsList
            requests={signatureRequests}
            isLoading={isLoading}
            status="expired"
            onRequestUpdated={fetchSignatureRequests}
          />
        </TabsContent>

        <TabsContent value="cancelled">
          <SignatureRequestsList
            requests={signatureRequests}
            isLoading={isLoading}
            status="cancelled"
            onRequestUpdated={fetchSignatureRequests}
          />
        </TabsContent>
      </Tabs>

      <CreateSignatureRequestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <UploadDocumentForSignatureDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Signatures;
