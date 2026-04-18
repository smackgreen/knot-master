import React from 'react';
import { useApp } from '@/context/AppContext';
import { Contract } from '@/types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ContractForm from './ContractForm';

interface EditContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  onSuccess?: () => void;
}

const EditContractDialog: React.FC<EditContractDialogProps> = ({
  open,
  onOpenChange,
  contract,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { updateContract } = useApp();
  
  const handleSubmit = async (values: any) => {
    try {
      await updateContract(contract.id, {
        name: values.name,
        content: values.content,
        expiresAt: values.expiresAt?.toISOString(),
      });
      
      toast.success(t('contracts.updateSuccess'));
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error(t('contracts.updateError'));
    }
  };
  
  // Convert dates from string to Date objects for the form
  const initialValues = {
    ...contract,
    expiresAt: contract.expiresAt ? new Date(contract.expiresAt) : undefined,
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('contracts.editContract')}</DialogTitle>
          <DialogDescription>
            {t('contracts.editContractDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <ContractForm
          onSubmit={handleSubmit}
          initialValues={initialValues}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditContractDialog;
