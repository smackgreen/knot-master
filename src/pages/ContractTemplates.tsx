import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ContractTemplate, ContractCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DOMPurify from 'dompurify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, FileText } from 'lucide-react';
import ContractTemplateCard from '@/components/contracts/ContractTemplateCard';
import AddTemplateDialog from '@/components/contracts/AddTemplateDialog';
import EditTemplateDialog from '@/components/contracts/EditTemplateDialog';
import AddContractDialog from '@/components/contracts/AddContractDialog';

const ContractTemplates = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contractTemplates, deleteContractTemplate } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [templateToView, setTemplateToView] = useState<ContractTemplate | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<ContractTemplate | null>(null);
  const [templateToUse, setTemplateToUse] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Filter templates based on search term and category
  const filteredTemplates = contractTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort templates by name
  const sortedTemplates = [...filteredTemplates].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Handle template actions
  const handleViewTemplate = (id: string) => {
    const template = contractTemplates.find(t => t.id === id);
    if (template) {
      setTemplateToView(template);
    }
  };

  const handleEditTemplate = (id: string) => {
    const template = contractTemplates.find(t => t.id === id);
    if (template) {
      setTemplateToEdit(template);
    }
  };

  const handleUseTemplate = (id: string) => {
    setTemplateToUse(id);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await deleteContractTemplate(templateToDelete);
      setTemplateToDelete(null);
      toast.success(t('contracts.templateDeleteSuccess'));
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(t('contracts.templateDeleteError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">{t('contracts.templates')}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('contracts.addTemplate')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('contracts.searchTemplates')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('contracts.filterByCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('contracts.allCategories')}</SelectItem>
              <SelectItem value="client">{t('contracts.category.client')}</SelectItem>
              <SelectItem value="vendor">{t('contracts.category.vendor')}</SelectItem>
              <SelectItem value="planning">{t('contracts.category.planning')}</SelectItem>
              <SelectItem value="other">{t('contracts.category.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {contractTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t('contracts.noTemplates')}</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {t('contracts.noTemplatesDescription')}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('contracts.createFirstTemplate')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTemplates.map(template => (
            <ContractTemplateCard
              key={template.id}
              template={template}
              onView={handleViewTemplate}
              onEdit={handleEditTemplate}
              onUse={handleUseTemplate}
              onDelete={(id) => setTemplateToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Add Template Dialog */}
      <AddTemplateDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* View Template Dialog */}
      {templateToView && (
        <Dialog
          open={!!templateToView}
          onOpenChange={(open) => {
            if (!open) setTemplateToView(null);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{templateToView.name}</DialogTitle>
              <DialogDescription>
                {templateToView.description || t('contracts.noDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">{t('contracts.templateContent')}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTemplateToView(null);
                    handleUseTemplate(templateToView.id);
                  }}
                >
                  {t('contracts.useTemplate')}
                </Button>
              </div>
              <div className="border rounded-md p-4 bg-white overflow-auto max-h-[60vh]">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(templateToView.content) }} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Template Dialog */}
      {templateToEdit && (
        <EditTemplateDialog
          open={!!templateToEdit}
          onOpenChange={(open) => {
            if (!open) setTemplateToEdit(null);
          }}
          template={templateToEdit}
        />
      )}

      {/* Use Template Dialog */}
      {templateToUse && (
        <AddContractDialog
          open={!!templateToUse}
          onOpenChange={(open) => {
            if (!open) setTemplateToUse(null);
          }}
          templateId={templateToUse}
          onSuccess={(id) => navigate(`/app/contracts/${id}`)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={(open) => {
          if (!open) setTemplateToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.templateDeleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contracts.templateDeleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
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

export default ContractTemplates;
