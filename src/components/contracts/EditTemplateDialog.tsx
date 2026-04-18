import React from 'react';
import { useApp } from '@/context/AppContext';
import { ContractTemplate } from '@/types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ContractTemplateForm from './ContractTemplateForm';

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate;
  onSuccess?: () => void;
}

const EditTemplateDialog: React.FC<EditTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { updateContractTemplate } = useApp();
  
  const handleSubmit = async (values: any) => {
    try {
      await updateContractTemplate(template.id, {
        name: values.name,
        description: values.description,
        category: values.category,
        content: values.content,
      });
      
      toast.success(t('contracts.templateUpdateSuccess'));
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error(t('contracts.templateUpdateError'));
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('contracts.editTemplate')}</DialogTitle>
          <DialogDescription>
            {t('contracts.editTemplateDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <ContractTemplateForm
          onSubmit={handleSubmit}
          initialValues={template}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTemplateDialog;
