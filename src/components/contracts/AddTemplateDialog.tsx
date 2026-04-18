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
import ContractTemplateForm from './ContractTemplateForm';
import { getDefaultClientTemplate, getDefaultVendorTemplate } from '@/utils/contractUtils';

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: 'client' | 'vendor' | 'planning' | 'other';
  onSuccess?: (templateId: string) => void;
}

const AddTemplateDialog: React.FC<AddTemplateDialogProps> = ({
  open,
  onOpenChange,
  category,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { addContractTemplate } = useApp();
  
  // Get default content based on category
  const getDefaultContent = () => {
    if (category === 'vendor') {
      return getDefaultVendorTemplate();
    }
    return getDefaultClientTemplate();
  };
  
  const handleSubmit = async (values: any) => {
    try {
      const templateId = await addContractTemplate({
        name: values.name,
        description: values.description,
        category: values.category,
        content: values.content,
      });
      
      if (templateId) {
        toast.success(t('contracts.templateAddSuccess'));
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(templateId);
        }
      }
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error(t('contracts.templateAddError'));
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('contracts.addTemplate')}</DialogTitle>
          <DialogDescription>
            {t('contracts.addTemplateDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <ContractTemplateForm
          onSubmit={handleSubmit}
          initialValues={{
            category: category || 'client',
            content: getDefaultContent(),
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddTemplateDialog;
