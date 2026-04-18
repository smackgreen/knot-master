import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Equipment, ResourceCategory } from "@/types/resources";
import { toast } from "sonner";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ResourceCategory[];
  onSuccess: (equipment: Equipment) => void;
}

const AddEquipmentDialog = ({ open, onOpenChange, categories, onSuccess }: AddEquipmentDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: "",
    categoryId: "",
    description: "",
    serialNumber: "",
    purchaseDate: "",
    purchaseCost: undefined,
    currentValue: undefined,
    status: "operational",
    location: "",
    notes: ""
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error(t('resources.nameRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, this would call an API to create the equipment
      // For now, we'll simulate a successful creation
      const newEquipment: Equipment = {
        id: crypto.randomUUID(),
        name: formData.name!,
        categoryId: formData.categoryId,
        description: formData.description,
        serialNumber: formData.serialNumber,
        purchaseDate: formData.purchaseDate,
        purchaseCost: formData.purchaseCost,
        currentValue: formData.currentValue,
        status: formData.status as 'operational' | 'maintenance' | 'retired',
        location: formData.location,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryName: formData.categoryId ? categories.find(c => c.id === formData.categoryId)?.name : undefined
      };
      
      onSuccess(newEquipment);
      resetForm();
      onOpenChange(false);
      toast.success(t('resources.equipmentAdded'));
    } catch (error) {
      console.error("Error adding equipment:", error);
      toast.error(t('resources.errorAddingEquipment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      categoryId: "",
      description: "",
      serialNumber: "",
      purchaseDate: "",
      purchaseCost: undefined,
      currentValue: undefined,
      status: "operational",
      location: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('resources.addEquipment')}</DialogTitle>
          <DialogDescription>{t('resources.addEquipmentDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('resources.name')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('resources.enterName')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('resources.category')}</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleChange('categoryId', value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={t('resources.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('resources.description')}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('resources.enterDescription')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">{t('resources.serialNumber')}</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber || ''}
                onChange={(e) => handleChange('serialNumber', e.target.value)}
                placeholder={t('resources.enterSerialNumber')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">{t('resources.purchaseDate')}</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate || ''}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseCost">{t('resources.purchaseCost')}</Label>
              <Input
                id="purchaseCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchaseCost || ''}
                onChange={(e) => handleChange('purchaseCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('resources.enterPurchaseCost')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentValue">{t('resources.currentValue')}</Label>
              <Input
                id="currentValue"
                type="number"
                min="0"
                step="0.01"
                value={formData.currentValue || ''}
                onChange={(e) => handleChange('currentValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('resources.enterCurrentValue')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('resources.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('resources.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">{t('resources.operational')}</SelectItem>
                  <SelectItem value="maintenance">{t('resources.maintenance')}</SelectItem>
                  <SelectItem value="retired">{t('resources.retired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t('resources.location')}</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder={t('resources.enterLocation')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('resources.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder={t('resources.enterNotes')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('common.adding') : t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentDialog;
