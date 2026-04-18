
import { useState } from "react";
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

interface AddVendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vendor: Omit<Vendor, "id">) => void;
  clients: any[];
}

const AddVendorDialog = ({ isOpen, onClose, onAdd, clients }: AddVendorDialogProps) => {
  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "venue" as VendorCategory,
    clientId: "",
    contactName: "",
    email: "",
    phone: "",
    cost: 0,
    isPaid: false,
  });

  const handleAddVendor = () => {
    if (!newVendor.name || !newVendor.clientId) {
      return; // Basic validation
    }
    
    onAdd(newVendor);
    setNewVendor({
      name: "",
      category: "venue" as VendorCategory,
      clientId: "",
      contactName: "",
      email: "",
      phone: "",
      cost: 0,
      isPaid: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor to the directory
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              value={newVendor.name}
              onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={newVendor.category}
              onChange={(e) => setNewVendor({...newVendor, category: e.target.value as VendorCategory})}
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
            <Label htmlFor="clientId">Associated Client</Label>
            <select
              id="clientId"
              value={newVendor.clientId}
              onChange={(e) => setNewVendor({...newVendor, clientId: e.target.value})}
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
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={newVendor.contactName}
                onChange={(e) => setNewVendor({...newVendor, contactName: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vendorEmail">Email</Label>
              <Input
                id="vendorEmail"
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendorPhone">Phone</Label>
              <Input
                id="vendorPhone"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                value={newVendor.cost}
                onChange={(e) => setNewVendor({...newVendor, cost: parseFloat(e.target.value) || 0})}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPaid"
              checked={newVendor.isPaid}
              onChange={(e) => setNewVendor({...newVendor, isPaid: e.target.checked})}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isPaid">Mark as paid</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAddVendor}>Add Vendor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVendorDialog;
