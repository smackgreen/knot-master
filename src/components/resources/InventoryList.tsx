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
import { Edit, Trash2, Calendar, Eye } from "lucide-react";
import { InventoryItem } from "@/types/resources";

interface InventoryListProps {
  items: InventoryItem[];
  onItemsChange: (items: InventoryItem[]) => void;
}

const InventoryList = ({ items, onItemsChange }: InventoryListProps) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<InventoryItem | null>(null);

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditedItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleBooking = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsBookingDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    // In a real implementation, this would call an API to delete the item
    const updatedItems = items.filter(item => item.id !== itemId);
    onItemsChange(updatedItems);
  };

  const handleSaveEdit = () => {
    if (!editedItem) return;

    // In a real implementation, this would call an API to update the item
    const updatedItems = items.map(item => 
      item.id === editedItem.id ? editedItem : item
    );
    
    onItemsChange(updatedItems);
    setIsEditDialogOpen(false);
    setSelectedItem(null);
    setEditedItem(null);
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

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('resources.noInventoryItems')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('resources.addInventoryItemPrompt')}</p>
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
            <TableHead>{t('resources.quantity')}</TableHead>
            <TableHead>{t('resources.rentalFee')}</TableHead>
            <TableHead>{t('resources.status')}</TableHead>
            <TableHead>{t('resources.location')}</TableHead>
            <TableHead className="text-right">{t('resources.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.categoryName || '-'}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{formatCurrency(item.rentalFee)}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>{item.location || '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleBooking(item)}>
                    <Calendar className="h-4 w-4" />
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
                        <AlertDialogTitle>{t('resources.deleteInventoryItem')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('resources.deleteInventoryItemConfirmation', { name: item.name })}
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

      {/* View Item Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>{t('resources.inventoryItemDetails')}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.category')}</p>
                  <p>{selectedItem.categoryName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.status')}</p>
                  <p>{getStatusBadge(selectedItem.status)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('resources.description')}</p>
                <p>{selectedItem.description || '-'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.quantity')}</p>
                  <p>{selectedItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.location')}</p>
                  <p>{selectedItem.location || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.unitCost')}</p>
                  <p>{formatCurrency(selectedItem.unitCost)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.replacementCost')}</p>
                  <p>{formatCurrency(selectedItem.replacementCost)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.rentalFee')}</p>
                  <p>{formatCurrency(selectedItem.rentalFee)}</p>
                </div>
              </div>
              
              {selectedItem.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('resources.notes')}</p>
                  <p>{selectedItem.notes}</p>
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
              if (selectedItem) handleEdit(selectedItem);
            }}>
              {t('common.edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('resources.editInventoryItem')}</DialogTitle>
            <DialogDescription>{t('resources.editInventoryItemDescription')}</DialogDescription>
          </DialogHeader>
          {editedItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t('resources.name')}
                </label>
                <Input
                  id="name"
                  value={editedItem.name}
                  onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  {t('resources.description')}
                </label>
                <Textarea
                  id="description"
                  value={editedItem.description || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    {t('resources.quantity')}
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={editedItem.quantity}
                    onChange={(e) => setEditedItem({ ...editedItem, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    {t('resources.status')}
                  </label>
                  <Select
                    value={editedItem.status}
                    onValueChange={(value) => setEditedItem({ ...editedItem, status: value as any })}
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
              
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  {t('resources.location')}
                </label>
                <Input
                  id="location"
                  value={editedItem.location || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, location: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="unitCost" className="text-sm font-medium">
                    {t('resources.unitCost')}
                  </label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editedItem.unitCost || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, unitCost: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="replacementCost" className="text-sm font-medium">
                    {t('resources.replacementCost')}
                  </label>
                  <Input
                    id="replacementCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editedItem.replacementCost || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, replacementCost: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="rentalFee" className="text-sm font-medium">
                    {t('resources.rentalFee')}
                  </label>
                  <Input
                    id="rentalFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editedItem.rentalFee || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, rentalFee: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  {t('resources.notes')}
                </label>
                <Textarea
                  id="notes"
                  value={editedItem.notes || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, notes: e.target.value })}
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

      {/* Booking Dialog would be implemented here */}
    </div>
  );
};

export default InventoryList;
