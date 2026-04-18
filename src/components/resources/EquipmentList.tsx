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
import { Edit, Trash2, Calendar, Eye, Wrench, Clock } from "lucide-react";
import { Equipment } from "@/types/resources";
import { format, parseISO } from "date-fns";

interface EquipmentListProps {
  equipment: Equipment[];
  onEquipmentChange: (equipment: Equipment[]) => void;
}

const EquipmentList = ({ equipment, onEquipmentChange }: EquipmentListProps) => {
  const { t } = useTranslation();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [editedEquipment, setEditedEquipment] = useState<Equipment | null>(null);

  const handleEdit = (item: Equipment) => {
    setSelectedEquipment(item);
    setEditedEquipment({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleView = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsViewDialogOpen(true);
  };

  const handleMaintenance = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsMaintenanceDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    // In a real implementation, this would call an API to delete the equipment
    const updatedEquipment = equipment.filter(item => item.id !== itemId);
    onEquipmentChange(updatedEquipment);
  };

  const handleSaveEdit = () => {
    if (!editedEquipment) return;

    // In a real implementation, this would call an API to update the equipment
    const updatedEquipment = equipment.map(item =>
      item.id === editedEquipment.id ? editedEquipment : item
    );

    onEquipmentChange(updatedEquipment);
    setIsEditDialogOpen(false);
    setSelectedEquipment(null);
    setEditedEquipment(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="success">{t('resources.operational')}</Badge>;
      case 'maintenance':
        return <Badge variant="warning">{t('resources.maintenance')}</Badge>;
      case 'retired':
        return <Badge variant="destructive">{t('resources.retired')}</Badge>;
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

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '-';
    try {
      return format(typeof dateString === 'string' ? parseISO(dateString) : dateString, 'MMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return '-';
    }
  };

  if (equipment.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('resources.noEquipment')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('resources.addEquipmentPrompt')}</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('resources.name')}</TableHead>
            <TableHead>{t('resources.category')}</TableHead>
            <TableHead>{t('resources.serialNumber')}</TableHead>
            <TableHead>{t('resources.nextMaintenance')}</TableHead>
            <TableHead>{t('resources.status')}</TableHead>
            <TableHead>{t('resources.location')}</TableHead>
            <TableHead className="text-right">{t('resources.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.categoryName || '-'}</TableCell>
              <TableCell>{item.serialNumber || '-'}</TableCell>
              <TableCell>{formatDate(item.nextMaintenanceDate)}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>{item.location || '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleMaintenance(item)}>
                    <Wrench className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
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
                        <AlertDialogTitle>{t('resources.deleteEquipment')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('resources.deleteEquipmentConfirmation', { name: item.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
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

      {/* View Equipment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEquipment?.name}</DialogTitle>
            <DialogDescription>{t('resources.equipmentDetails')}</DialogDescription>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.category')}</p>
                  <p>{selectedEquipment.categoryName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.status')}</p>
                  <p>{getStatusBadge(selectedEquipment.status)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('resources.description')}</p>
                <p>{selectedEquipment.description || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.serialNumber')}</p>
                  <p>{selectedEquipment.serialNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.location')}</p>
                  <p>{selectedEquipment.location || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.purchaseDate')}</p>
                  <p>{formatDate(selectedEquipment.purchaseDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.purchaseCost')}</p>
                  <p>{formatCurrency(selectedEquipment.purchaseCost)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.currentValue')}</p>
                  <p>{formatCurrency(selectedEquipment.currentValue)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.lastMaintenance')}</p>
                  <p>{formatDate(selectedEquipment.lastMaintenanceDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('resources.nextMaintenance')}</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <p>{formatDate(selectedEquipment.nextMaintenanceDate)}</p>
                </div>
              </div>

              {selectedEquipment.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.notes')}</p>
                  <p>{selectedEquipment.notes}</p>
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
              if (selectedEquipment) handleEdit(selectedEquipment);
            }}>
              {t('common.edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('resources.editEquipment')}</DialogTitle>
            <DialogDescription>{t('resources.editEquipmentDescription')}</DialogDescription>
          </DialogHeader>
          {editedEquipment && (
            <div className="space-y-4 py-4">
              {/* Edit form fields would go here */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t('resources.name')}
                </label>
                <Input
                  id="name"
                  value={editedEquipment.name}
                  onChange={(e) => setEditedEquipment({ ...editedEquipment, name: e.target.value })}
                />
              </div>

              {/* Additional fields would be added here */}
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

      {/* Maintenance Dialog would be implemented here */}
    </div>
  );
};

export default EquipmentList;
