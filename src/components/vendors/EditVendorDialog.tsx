
import { Vendor, VendorCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vendorToEdit: Vendor | null;
  setVendorToEdit: (vendor: Vendor | null) => void;
  clients: any[];
}

const EditVendorDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  vendorToEdit, 
  setVendorToEdit,
  clients 
}: EditVendorDialogProps) => {
  if (!vendorToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>
            Update vendor information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="editVendorName">Vendor Name</Label>
            <Input
              id="editVendorName"
              value={vendorToEdit.name}
              onChange={(e) => setVendorToEdit({...vendorToEdit, name: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="editCategory">Category</Label>
            <select
              id="editCategory"
              value={vendorToEdit.category}
              onChange={(e) => setVendorToEdit({...vendorToEdit, category: e.target.value as VendorCategory})}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="venue">Venue</option>
              <option value="catering">Catering</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="florist">Florist</option>
              <option value="music">Music</option>
              <option value="cake">Cake</option>
              <option value="attire">Attire</option>
              <option value="hair_makeup">Hair & Makeup</option>
              <option value="transportation">Transportation</option>
              <option value="rentals">Rentals</option>
              <option value="stationery">Stationery</option>
              <option value="gifts">Gifts</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="editClientId">Associated Client</Label>
            <select
              id="editClientId"
              value={vendorToEdit.clientId}
              onChange={(e) => setVendorToEdit({...vendorToEdit, clientId: e.target.value})}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} & {client.partnerName} - {client.venue}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editContactName">Contact Name</Label>
              <Input
                id="editContactName"
                value={vendorToEdit.contactName || ''}
                onChange={(e) => setVendorToEdit({...vendorToEdit, contactName: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={vendorToEdit.email || ''}
                onChange={(e) => setVendorToEdit({...vendorToEdit, email: e.target.value})}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={vendorToEdit.phone || ''}
                onChange={(e) => setVendorToEdit({...vendorToEdit, phone: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editCost">Cost</Label>
              <Input
                id="editCost"
                type="number"
                value={vendorToEdit.cost || 0}
                onChange={(e) => setVendorToEdit({...vendorToEdit, cost: parseFloat(e.target.value) || 0})}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editIsPaid"
              checked={vendorToEdit.isPaid || false}
              onChange={(e) => setVendorToEdit({...vendorToEdit, isPaid: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="editIsPaid">Mark as paid</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditVendorDialog;
