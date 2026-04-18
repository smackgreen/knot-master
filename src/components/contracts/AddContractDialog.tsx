import React from 'react';
import { useApp } from '@/context/AppContext';
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

interface AddContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  clientId?: string;
  vendorId?: string;
  onSuccess?: (contractId: string) => void;
}

const AddContractDialog: React.FC<AddContractDialogProps> = ({
  open,
  onOpenChange,
  templateId,
  clientId,
  vendorId,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { addContract } = useApp();
  
  const handleSubmit = async (values: any) => {
    try {
      const contractId = await addContract({
        name: values.name,
        templateId: values.templateId,
        clientId: values.clientId,
        vendorId: values.vendorId,
        content: values.content,
        status: 'draft',
        expiresAt: values.expiresAt?.toISOString(),
      });
      
      if (contractId) {
        toast.success(t('contracts.addSuccess'));
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(contractId);
        }
      }
    } catch (error) {
      console.error('Error adding contract:', error);
      toast.error(t('contracts.addError'));
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('contracts.addContract')}</DialogTitle>
          <DialogDescription>
            {t('contracts.addContractDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <ContractForm
          onSubmit={handleSubmit}
          templateId={templateId}
          clientId={clientId}
          vendorId={vendorId}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddContractDialog;
