import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import ContractPreview from '@/components/contracts/ContractPreview';
import EditContractDialog from '@/components/contracts/EditContractDialog';
import SignContractDialog from '@/components/contracts/SignContractDialog';

const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    getContractById,
    getClientById,
    getVendorById,
    deleteContract,
    sendContract
  } = useApp();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get contract and related entities
  const contract = id ? getContractById(id) : undefined;
  const client = contract?.clientId ? getClientById(contract.clientId) : undefined;
  const vendor = contract?.vendorId ? getVendorById(contract.vendorId) : undefined;

  // Redirect if contract not found
  useEffect(() => {
    if (id && !contract) {
      toast.error(t('contracts.notFound'));
      navigate('/app/contracts');
    }
  }, [id, contract, navigate, t]);

  if (!contract) {
    return null;
  }

  // Handle contract actions
  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleSign = () => {
    setIsSignDialogOpen(true);
  };

  const handleSend = async () => {
    try {
      await sendContract(contract.id);
      toast.success(t('contracts.sendSuccess'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error sending contract:', error);
      toast.error(t('contracts.sendError'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContract(contract.id);
      toast.success(t('contracts.deleteSuccess'));
      navigate('/app/contracts');
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error(t('contracts.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate('/app/contracts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('contracts.backToContracts')}
        </Button>

        <div className="flex gap-2">
          {(contract.status === 'draft' || contract.status === 'sent') && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}

          {(contract.status === 'draft' || contract.status === 'sent') && (
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      <ContractPreview
        contract={contract}
        client={client}
        vendor={vendor}
        onSign={handleSign}
        onSend={handleSend}
      />

      {/* Edit Contract Dialog */}
      <EditContractDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contract={contract}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />

      {/* Sign Contract Dialog */}
      <SignContractDialog
        open={isSignDialogOpen}
        onOpenChange={setIsSignDialogOpen}
        contract={contract}
        role="planner"
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contracts.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContractDetails;
