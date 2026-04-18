import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InventoryItem, ResourceCategory } from "@/types/resources";
import { createInventoryItem } from "@/services/resourceService";
import { toast } from "sonner";

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ResourceCategory[];
  onSuccess: (item: InventoryItem) => void;
}

const AddInventoryDialog = ({ open, onOpenChange, categories, onSuccess }: AddInventoryDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    categoryId: "",
    description: "",
    quantity: 1,
    unitCost: undefined,
    replacementCost: undefined,
    rentalFee: undefined,
    status: "available",
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
      // In a real implementation, this would call an API to create the inventory item
      const newItem = await createInventoryItem({
        name: formData.name,
        categoryId: formData.categoryId,
        description: formData.description,
        quantity: formData.quantity || 1,
        unitCost: formData.unitCost,
        replacementCost: formData.replacementCost,
        rentalFee: formData.rentalFee,
        status: formData.status as 'available' | 'in_use' | 'maintenance' | 'retired',
        location: formData.location,
        notes: formData.notes
      } as any);
      
      onSuccess(newItem);
      resetForm();
      onOpenChange(false);
      toast.success(t('resources.inventoryItemAdded'));
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast.error(t('resources.errorAddingInventoryItem'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      categoryId: "",
      description: "",
      quantity: 1,
      unitCost: undefined,
      replacementCost: undefined,
      rentalFee: undefined,
      status: "available",
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
          <DialogTitle>{t('resources.addInventoryItem')}</DialogTitle>
          <DialogDescription>{t('resources.addInventoryItemDescription')}</DialogDescription>
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
              <Label htmlFor="quantity">{t('resources.quantity')} *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity || 1}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                required
              />
            </div>
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
                  <SelectItem value="available">{t('resources.available')}</SelectItem>
                  <SelectItem value="in_use">{t('resources.inUse')}</SelectItem>
                  <SelectItem value="maintenance">{t('resources.maintenance')}</SelectItem>
                  <SelectItem value="retired">{t('resources.retired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitCost">{t('resources.unitCost')}</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitCost || ''}
                onChange={(e) => handleChange('unitCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('resources.enterUnitCost')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replacementCost">{t('resources.replacementCost')}</Label>
              <Input
                id="replacementCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.replacementCost || ''}
                onChange={(e) => handleChange('replacementCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('resources.enterReplacementCost')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rentalFee">{t('resources.rentalFee')}</Label>
              <Input
                id="rentalFee"
                type="number"
                min="0"
                step="0.01"
                value={formData.rentalFee || ''}
                onChange={(e) => handleChange('rentalFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('resources.enterRentalFee')}
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

export default AddInventoryDialog;
