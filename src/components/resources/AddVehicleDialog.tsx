import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Vehicle } from "@/types/resources";
import { toast } from "sonner";

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (vehicle: Vehicle) => void;
}

const AddVehicleDialog = ({ open, onOpenChange, onSuccess }: AddVehicleDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: "",
    type: "",
    make: "",
    model: "",
    year: undefined,
    licensePlate: "",
    capacity: undefined,
    status: "available",
    notes: ""
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.type) {
      toast.error(t('resources.requiredFieldsMissing'));
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, this would call an API to create the vehicle
      // For now, we'll simulate a successful creation
      const newVehicle: Vehicle = {
        id: crypto.randomUUID(),
        name: formData.name!,
        type: formData.type!,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        licensePlate: formData.licensePlate,
        capacity: formData.capacity,
        status: formData.status as 'available' | 'in_use' | 'maintenance' | 'retired',
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      onSuccess(newVehicle);
      resetForm();
      onOpenChange(false);
      toast.success(t('resources.vehicleAdded'));
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast.error(t('resources.errorAddingVehicle'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      make: "",
      model: "",
      year: undefined,
      licensePlate: "",
      capacity: undefined,
      status: "available",
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
          <DialogTitle>{t('resources.addVehicle')}</DialogTitle>
          <DialogDescription>{t('resources.addVehicleDescription')}</DialogDescription>
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
            <Label htmlFor="type">{t('resources.type')} *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder={t('resources.selectType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">{t('resources.car')}</SelectItem>
                <SelectItem value="van">{t('resources.van')}</SelectItem>
                <SelectItem value="bus">{t('resources.bus')}</SelectItem>
                <SelectItem value="truck">{t('resources.truck')}</SelectItem>
                <SelectItem value="other">{t('resources.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">{t('resources.make')}</Label>
              <Input
                id="make"
                value={formData.make || ''}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder={t('resources.enterMake')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">{t('resources.model')}</Label>
              <Input
                id="model"
                value={formData.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder={t('resources.enterModel')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">{t('resources.year')}</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year || ''}
                onChange={(e) => handleChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={t('resources.enterYear')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">{t('resources.licensePlate')}</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate || ''}
                onChange={(e) => handleChange('licensePlate', e.target.value)}
                placeholder={t('resources.enterLicensePlate')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">{t('resources.capacity')}</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity || ''}
                onChange={(e) => handleChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={t('resources.enterCapacity')}
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

export default AddVehicleDialog;
