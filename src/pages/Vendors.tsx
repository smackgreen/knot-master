
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import VendorHeader from "@/components/vendors/VendorHeader";
import VendorSearch from "@/components/vendors/VendorSearch";
import VendorTable from "@/components/vendors/VendorTable";
import AddVendorDialog from "@/components/vendors/AddVendorDialog";
import EditVendorDialog from "@/components/vendors/EditVendorDialog";
import DeleteVendorDialog from "@/components/vendors/DeleteVendorDialog";
import { Vendor } from "@/types";
import { useTranslation } from "react-i18next";

const Vendors = () => {
  const { vendors, clients, addVendor, updateVendor, deleteVendor } = useApp();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(vendors.map(vendor => vendor.category)));

  // Filter vendors based on search term and category
  const filteredVendors = vendors.filter(vendor => {
    const searchMatch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (vendor.contactName && vendor.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const categoryMatch = categoryFilter === "all" || vendor.category === categoryFilter;
    
    return searchMatch && categoryMatch;
  });

  const handleAddVendor = (newVendor: Omit<Vendor, "id">) => {
    addVendor(newVendor);
    setIsAddVendorOpen(false);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setVendorToEdit({...vendor});
    setIsEditVendorOpen(true);
  };

  const handleSaveEditedVendor = () => {
    if (!vendorToEdit) return;
    
    updateVendor(vendorToEdit.id, vendorToEdit);
    setIsEditVendorOpen(false);
    setVendorToEdit(null);
  };

  const handleDeleteClick = (vendorId: string) => {
    setVendorToDelete(vendorId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!vendorToDelete) return;
    
    deleteVendor(vendorToDelete);
    setIsDeleteDialogOpen(false);
    setVendorToDelete(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Vendor Header Section */}
      <VendorHeader onAddClick={() => setIsAddVendorOpen(true)} />

      {/* Search and Filter Section */}
      <VendorSearch 
        searchTerm={searchTerm} 
        categoryFilter={categoryFilter}
        categories={categories}
        onSearchChange={setSearchTerm}
        onCategoryChange={setCategoryFilter}
      />

      {/* Vendors Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('vendors.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorTable 
            vendors={filteredVendors} 
            clients={clients}
            onEdit={handleEditVendor}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddVendorDialog 
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onAdd={handleAddVendor}
        clients={clients}
      />

      <EditVendorDialog 
        isOpen={isEditVendorOpen}
        onClose={() => setIsEditVendorOpen(false)}
        onSave={handleSaveEditedVendor}
        vendorToEdit={vendorToEdit}
        setVendorToEdit={setVendorToEdit}
        clients={clients}
      />

      <DeleteVendorDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteConfirm}
      />
    </div>
  );
};

export default Vendors;
