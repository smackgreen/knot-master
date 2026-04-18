
import { Button } from "@/components/ui/button";
import { PlusCircle, Truck } from "lucide-react";

interface VendorHeaderProps {
  onAddClick: () => void;
}

const VendorHeader = ({ onAddClick }: VendorHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
        <Truck className="h-6 w-6" /> Vendors
      </h1>
      <Button onClick={onAddClick}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Vendor
      </Button>
    </div>
  );
};

export default VendorHeader;
