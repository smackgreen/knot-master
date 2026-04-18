import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Calendar, Eye, Phone, Mail } from "lucide-react";
import { StaffMember } from "@/types/resources";

interface StaffListProps {
  staff: StaffMember[];
  onStaffChange: (staff: StaffMember[]) => void;
}

const StaffList = ({ staff, onStaffChange }: StaffListProps) => {
  const { t } = useTranslation();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editedStaff, setEditedStaff] = useState<StaffMember | null>(null);

  const handleEdit = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setEditedStaff({ ...staffMember });
    setIsEditDialogOpen(true);
  };

  const handleView = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setIsViewDialogOpen(true);
  };

  const handleSchedule = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setIsScheduleDialogOpen(true);
  };

  const handleDelete = (staffId: string) => {
    // In a real implementation, this would call an API to delete the staff member
    const updatedStaff = staff.filter(s => s.id !== staffId);
    onStaffChange(updatedStaff);
  };

  const handleSaveEdit = () => {
    if (!editedStaff) return;

    // In a real implementation, this would call an API to update the staff member
    const updatedStaff = staff.map(s => 
      s.id === editedStaff.id ? editedStaff : s
    );
    
    onStaffChange(updatedStaff);
    setIsEditDialogOpen(false);
    setSelectedStaff(null);
    setEditedStaff(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('resources.active')}</Badge>;
      case 'inactive':
        return <Badge variant="secondary">{t('resources.inactive')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  if (staff.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('resources.noStaffMembers')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('resources.addStaffMemberPrompt')}</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('resources.name')}</TableHead>
            <TableHead>{t('resources.role')}</TableHead>
            <TableHead>{t('resources.email')}</TableHead>
            <TableHead>{t('resources.phone')}</TableHead>
            <TableHead>{t('resources.hourlyRate')}</TableHead>
            <TableHead>{t('resources.status')}</TableHead>
            <TableHead className="text-right">{t('resources.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map(staffMember => (
            <TableRow key={staffMember.id}>
              <TableCell className="font-medium">{staffMember.name}</TableCell>
              <TableCell>{staffMember.role}</TableCell>
              <TableCell>{staffMember.email || '-'}</TableCell>
              <TableCell>{staffMember.phone || '-'}</TableCell>
              <TableCell>{formatCurrency(staffMember.hourlyRate)}</TableCell>
              <TableCell>{getStatusBadge(staffMember.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(staffMember)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleSchedule(staffMember)}>
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(staffMember)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('resources.deleteStaffMember')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('resources.deleteStaffMemberConfirmation', { name: staffMember.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(staffMember.id)}>
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View Staff Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedStaff?.name}</DialogTitle>
            <DialogDescription>{t('resources.staffMemberDetails')}</DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.role')}</p>
                  <p>{selectedStaff.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.status')}</p>
                  <p>{getStatusBadge(selectedStaff.status)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.email')}</p>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <p>{selectedStaff.email || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.phone')}</p>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <p>{selectedStaff.phone || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('resources.hourlyRate')}</p>
                <p>{formatCurrency(selectedStaff.hourlyRate)}</p>
              </div>
              
              {selectedStaff.skills && selectedStaff.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.skills')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedStaff.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedStaff.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.notes')}</p>
                  <p>{selectedStaff.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t('common.close')}
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedStaff) handleEdit(selectedStaff);
            }}>
              {t('common.edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('resources.editStaffMember')}</DialogTitle>
            <DialogDescription>{t('resources.editStaffMemberDescription')}</DialogDescription>
          </DialogHeader>
          {editedStaff && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t('resources.name')}
                </label>
                <Input
                  id="name"
                  value={editedStaff.name}
                  onChange={(e) => setEditedStaff({ ...editedStaff, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  {t('resources.role')}
                </label>
                <Input
                  id="role"
                  value={editedStaff.role}
                  onChange={(e) => setEditedStaff({ ...editedStaff, role: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t('resources.email')}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={editedStaff.email || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    {t('resources.phone')}
                  </label>
                  <Input
                    id="phone"
                    value={editedStaff.phone || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="hourlyRate" className="text-sm font-medium">
                    {t('resources.hourlyRate')}
                  </label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editedStaff.hourlyRate || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff, hourlyRate: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    {t('resources.status')}
                  </label>
                  <Select
                    value={editedStaff.status}
                    onValueChange={(value) => setEditedStaff({ ...editedStaff, status: value as any })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('resources.active')}</SelectItem>
                      <SelectItem value="inactive">{t('resources.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  {t('resources.notes')}
                </label>
                <Textarea
                  id="notes"
                  value={editedStaff.notes || ''}
                  onChange={(e) => setEditedStaff({ ...editedStaff, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog would be implemented here */}
    </div>
  );
};

export default StaffList;
