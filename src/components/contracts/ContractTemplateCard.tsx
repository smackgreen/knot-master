import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContractTemplate } from '@/types';
import { formatDate } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';
import { Eye, FileText, Edit, Trash2 } from 'lucide-react';

interface ContractTemplateCardProps {
  template: ContractTemplate;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onUse: (id: string) => void;
  onDelete: (id: string) => void;
}

const ContractTemplateCard: React.FC<ContractTemplateCardProps> = ({
  template,
  onView,
  onEdit,
  onUse,
  onDelete
}) => {
  const { t } = useTranslation();
  
  // Get category badge
  const getCategoryBadge = () => {
    switch (template.category) {
      case 'client':
        return <Badge variant="secondary">{t('contracts.category.client')}</Badge>;
      case 'vendor':
        return <Badge variant="secondary">{t('contracts.category.vendor')}</Badge>;
      case 'planning':
        return <Badge variant="secondary">{t('contracts.category.planning')}</Badge>;
      case 'other':
        return <Badge variant="secondary">{t('contracts.category.other')}</Badge>;
      default:
        return <Badge variant="secondary">{template.category}</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{template.name}</CardTitle>
          {getCategoryBadge()}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          {template.description && (
            <p className="text-muted-foreground">{template.description}</p>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('contracts.lastUpdated')}:</span>
            <span>{formatDate(template.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => onView(template.id)}>
          <Eye className="h-4 w-4 mr-1" />
          {t('common.view')}
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => onEdit(template.id)}>
          <Edit className="h-4 w-4 mr-1" />
          {t('common.edit')}
        </Button>
        
        <Button variant="default" size="sm" onClick={() => onUse(template.id)}>
          <FileText className="h-4 w-4 mr-1" />
          {t('contracts.useTemplate')}
        </Button>
        
        <Button variant="destructive" size="sm" onClick={() => onDelete(template.id)}>
          <Trash2 className="h-4 w-4 mr-1" />
          {t('common.delete')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ContractTemplateCard;
