import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StaffMember } from "@/types/resources";
import { createStaffMember } from "@/services/resourceService";
import { toast } from "sonner";

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (staff: StaffMember) => void;
}

const AddStaffDialog = ({ open, onOpenChange, onSuccess }: AddStaffDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: "",
    email: "",
    phone: "",
    role: "",
    hourlyRate: undefined,
    skills: [],
    notes: "",
    status: "active"
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (skillsString: string) => {
    // Convert comma-separated string to array
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, skills: skillsArray }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.role) {
      toast.error(t('resources.requiredFieldsMissing'));
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, this would call an API to create the staff member
      const newStaff = await createStaffMember(formData as any);
      onSuccess(newStaff);
      resetForm();
      onOpenChange(false);
      toast.success(t('resources.staffMemberAdded'));
    } catch (error) {
      console.error("Error adding staff member:", error);
      toast.error(t('resources.errorAddingStaffMember'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      hourlyRate: undefined,
      skills: [],
      notes: "",
      status: "active"
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('resources.addStaffMember')}</DialogTitle>
          <DialogDescription>{t('resources.addStaffMemberDescription')}</DialogDescription>
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
            <Label htmlFor="role">{t('resources.role')} *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              placeholder={t('resources.enterRole')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('resources.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('resources.enterEmail')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('resources.phone')}</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t('resources.enterPhone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">{t('resources.hourlyRate')}</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourlyRate || ''}
                onChange={(e) => handleChange('hourlyRate', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('resources.enterHourlyRate')}
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
                  <SelectItem value="active">{t('resources.active')}</SelectItem>
                  <SelectItem value="inactive">{t('resources.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">{t('resources.skills')}</Label>
            <Input
              id="skills"
              value={formData.skills?.join(', ') || ''}
              onChange={(e) => handleSkillsChange(e.target.value)}
              placeholder={t('resources.enterSkillsCommaSeparated')}
            />
            <p className="text-xs text-muted-foreground">{t('resources.skillsHelperText')}</p>
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

export default AddStaffDialog;
