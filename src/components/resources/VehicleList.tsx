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
import { Edit, Trash2, Calendar, Eye, Car, Users } from "lucide-react";
import { Vehicle } from "@/types/resources";

interface VehicleListProps {
  vehicles: Vehicle[];
  onVehiclesChange: (vehicles: Vehicle[]) => void;
}

const VehicleList = ({ vehicles, onVehiclesChange }: VehicleListProps) => {
  const { t } = useTranslation();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null);

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditedVehicle({ ...vehicle });
    setIsEditDialogOpen(true);
  };

  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewDialogOpen(true);
  };

  const handleSchedule = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsScheduleDialogOpen(true);
  };

  const handleDelete = (vehicleId: string) => {
    // In a real implementation, this would call an API to delete the vehicle
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    onVehiclesChange(updatedVehicles);
  };

  const handleSaveEdit = () => {
    if (!editedVehicle) return;

    // In a real implementation, this would call an API to update the vehicle
    const updatedVehicles = vehicles.map(v => 
      v.id === editedVehicle.id ? editedVehicle : v
    );
    
    onVehiclesChange(updatedVehicles);
    setIsEditDialogOpen(false);
    setSelectedVehicle(null);
    setEditedVehicle(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">{t('resources.available')}</Badge>;
      case 'in_use':
        return <Badge variant="default">{t('resources.inUse')}</Badge>;
      case 'maintenance':
        return <Badge variant="warning">{t('resources.maintenance')}</Badge>;
      case 'retired':
        return <Badge variant="destructive">{t('resources.retired')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('resources.noVehicles')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('resources.addVehiclePrompt')}</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('resources.name')}</TableHead>
            <TableHead>{t('resources.type')}</TableHead>
            <TableHead>{t('resources.make')}</TableHead>
            <TableHead>{t('resources.model')}</TableHead>
            <TableHead>{t('resources.licensePlate')}</TableHead>
            <TableHead>{t('resources.capacity')}</TableHead>
            <TableHead>{t('resources.status')}</TableHead>
            <TableHead className="text-right">{t('resources.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map(vehicle => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.name}</TableCell>
              <TableCell>{vehicle.type}</TableCell>
              <TableCell>{vehicle.make || '-'}</TableCell>
              <TableCell>{vehicle.model || '-'}</TableCell>
              <TableCell>{vehicle.licensePlate || '-'}</TableCell>
              <TableCell>{vehicle.capacity || '-'}</TableCell>
              <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(vehicle)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleSchedule(vehicle)}>
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
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
                        <AlertDialogTitle>{t('resources.deleteVehicle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('resources.deleteVehicleConfirmation', { name: vehicle.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(vehicle.id)}>
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

      {/* View Vehicle Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedVehicle?.name}</DialogTitle>
            <DialogDescription>{t('resources.vehicleDetails')}</DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.type')}</p>
                  <p>{selectedVehicle.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.status')}</p>
                  <p>{getStatusBadge(selectedVehicle.status)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.make')}</p>
                  <p>{selectedVehicle.make || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.model')}</p>
                  <p>{selectedVehicle.model || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.year')}</p>
                  <p>{selectedVehicle.year || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.licensePlate')}</p>
                  <p>{selectedVehicle.licensePlate || '-'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('resources.capacity')}</p>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <p>{selectedVehicle.capacity || '-'} {t('resources.passengers')}</p>
                </div>
              </div>
              
              {selectedVehicle.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.notes')}</p>
                  <p>{selectedVehicle.notes}</p>
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
              if (selectedVehicle) handleEdit(selectedVehicle);
            }}>
              {t('common.edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('resources.editVehicle')}</DialogTitle>
            <DialogDescription>{t('resources.editVehicleDescription')}</DialogDescription>
          </DialogHeader>
          {editedVehicle && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t('resources.name')}
                </label>
                <Input
                  id="name"
                  value={editedVehicle.name}
                  onChange={(e) => setEditedVehicle({ ...editedVehicle, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    {t('resources.type')}
                  </label>
                  <Input
                    id="type"
                    value={editedVehicle.type}
                    onChange={(e) => setEditedVehicle({ ...editedVehicle, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    {t('resources.status')}
                  </label>
                  <Select
                    value={editedVehicle.status}
                    onValueChange={(value) => setEditedVehicle({ ...editedVehicle, status: value as any })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
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

      {/* Schedule Dialog would be implemented here */}
    </div>
  );
};

export default VehicleList;
