import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Contract, ContractStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, FileText } from 'lucide-react';
import ContractCard from '@/components/contracts/ContractCard';
import AddContractDialog from '@/components/contracts/AddContractDialog';
import SignContractDialog from '@/components/contracts/SignContractDialog';

const Contracts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contracts, clients, vendors, deleteContract, sendContract } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [contractToSign, setContractToSign] = useState<Contract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  // Filter contracts based on search term and status
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort contracts by creation date (newest first)
  const sortedContracts = [...filteredContracts].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Group contracts by status
  const draftContracts = sortedContracts.filter(c => c.status === 'draft');
  const sentContracts = sortedContracts.filter(c => c.status === 'sent');
  const signedContracts = sortedContracts.filter(c => c.status === 'signed');
  const otherContracts = sortedContracts.filter(c =>
    c.status !== 'draft' && c.status !== 'sent' && c.status !== 'signed'
  );

  // Get client and vendor for a contract
  const getClientForContract = (clientId?: string) => {
    if (!clientId) return undefined;
    return clients.find(client => client.id === clientId);
  };

  const getVendorForContract = (vendorId?: string) => {
    if (!vendorId) return undefined;
    return vendors.find(vendor => vendor.id === vendorId);
  };

  // Handle contract actions
  const handleViewContract = (id: string) => {
    navigate(`/app/contracts/${id}`);
  };

  const handleSignContract = (id: string) => {
    const contract = contracts.find(c => c.id === id);
    if (contract) {
      setContractToSign(contract);
    }
  };

  const handleSendContract = async (id: string) => {
    try {
      await sendContract(id);
      toast.success(t('contracts.sendSuccess'));
    } catch (error) {
      console.error('Error sending contract:', error);
      toast.error(t('contracts.sendError'));
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;

    try {
      await deleteContract(contractToDelete);
      setContractToDelete(null);
      toast.success(t('contracts.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error(t('contracts.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">{t('contracts.title')}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('contracts.addContract')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('contracts.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('contracts.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('contracts.allStatuses')}</SelectItem>
              <SelectItem value="draft">{t('contracts.status.draft')}</SelectItem>
              <SelectItem value="sent">{t('contracts.status.sent')}</SelectItem>
              <SelectItem value="signed">{t('contracts.status.signed')}</SelectItem>
              <SelectItem value="expired">{t('contracts.status.expired')}</SelectItem>
              <SelectItem value="cancelled">{t('contracts.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t('contracts.noContracts')}</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {t('contracts.noContractsDescription')}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('contracts.createFirstContract')}
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              {t('contracts.allContracts')} ({sortedContracts.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              {t('contracts.status.draft')} ({draftContracts.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              {t('contracts.status.sent')} ({sentContracts.length})
            </TabsTrigger>
            <TabsTrigger value="signed">
              {t('contracts.status.signed')} ({signedContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedContracts.map(contract => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  client={getClientForContract(contract.clientId)}
                  vendor={getVendorForContract(contract.vendorId)}
                  onView={handleViewContract}
                  onSign={handleSignContract}
                  onSend={handleSendContract}
                  onDelete={(id) => setContractToDelete(id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftContracts.map(contract => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  client={getClientForContract(contract.clientId)}
                  vendor={getVendorForContract(contract.vendorId)}
                  onView={handleViewContract}
                  onSign={handleSignContract}
                  onSend={handleSendContract}
                  onDelete={(id) => setContractToDelete(id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sentContracts.map(contract => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  client={getClientForContract(contract.clientId)}
                  vendor={getVendorForContract(contract.vendorId)}
                  onView={handleViewContract}
                  onSign={handleSignContract}
                  onSend={handleSendContract}
                  onDelete={(id) => setContractToDelete(id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="signed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signedContracts.map(contract => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  client={getClientForContract(contract.clientId)}
                  vendor={getVendorForContract(contract.vendorId)}
                  onView={handleViewContract}
                  onSign={handleSignContract}
                  onSend={handleSendContract}
                  onDelete={(id) => setContractToDelete(id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Add Contract Dialog */}
      <AddContractDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={(id) => navigate(`/app/contracts/${id}`)}
      />

      {/* Sign Contract Dialog */}
      {contractToSign && (
        <SignContractDialog
          open={!!contractToSign}
          onOpenChange={(open) => {
            if (!open) setContractToSign(null);
          }}
          contract={contractToSign}
          role="planner"
          onSuccess={() => setContractToSign(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contractToDelete} onOpenChange={(open) => {
        if (!open) setContractToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contracts.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContract} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contracts;
