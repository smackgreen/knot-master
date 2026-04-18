import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Users, Wrench, Car, Plus, Search, Filter, Calendar } from "lucide-react";
import {
  ResourceCategory,
  InventoryItem,
  StaffMember,
  Equipment,
  Vehicle,
  ResourceSearchFilters
} from "@/types/resources";
import {
  fetchResourceCategories,
  fetchInventoryItems,
  fetchStaffMembers
} from "@/services/resourceService";
import InventoryList from "@/components/resources/InventoryList";
import StaffList from "@/components/resources/StaffList";
import EquipmentList from "@/components/resources/EquipmentList";
import VehicleList from "@/components/resources/VehicleList";
import ResourceCalendar from "@/components/resources/ResourceCalendar";
import AddInventoryDialog from "@/components/resources/AddInventoryDialog";
import AddStaffDialog from "@/components/resources/AddStaffDialog";
import AddEquipmentDialog from "@/components/resources/AddEquipmentDialog";
import AddVehicleDialog from "@/components/resources/AddVehicleDialog";

const Resources = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("inventory");
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchFilters, setSearchFilters] = useState<ResourceSearchFilters>({
    searchTerm: "",
    categoryId: undefined,
    status: undefined
  });
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "inventory") {
      loadInventoryItems();
    } else if (activeTab === "staff") {
      loadStaffMembers();
    } else if (activeTab === "equipment") {
      // Load equipment
    } else if (activeTab === "vehicles") {
      // Load vehicles
    }
  }, [activeTab, searchFilters]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const categoriesData = await fetchResourceCategories();
      setCategories(categoriesData);

      // Load data for the active tab
      if (activeTab === "inventory") {
        await loadInventoryItems();
      } else if (activeTab === "staff") {
        await loadStaffMembers();
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const items = await fetchInventoryItems(searchFilters);
      setInventoryItems(items);
    } catch (error) {
      console.error("Error loading inventory items:", error);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const staff = await fetchStaffMembers(searchFilters);
      setStaffMembers(staff);
    } catch (error) {
      console.error("Error loading staff members:", error);
    }
  };

  const handleSearch = () => {
    // The search is already triggered by the useEffect when searchFilters changes
    console.log("Searching with filters:", searchFilters);
  };

  const handleResetFilters = () => {
    setSearchFilters({
      searchTerm: "",
      categoryId: undefined,
      status: undefined
    });
  };

  const handleAddInventorySuccess = (newItem: InventoryItem) => {
    setInventoryItems([...inventoryItems, newItem]);
    setIsAddInventoryOpen(false);
  };

  const handleAddStaffSuccess = (newStaff: StaffMember) => {
    setStaffMembers([...staffMembers, newStaff]);
    setIsAddStaffOpen(false);
  };

  const getAddButtonForActiveTab = () => {
    switch (activeTab) {
      case "inventory":
        return (
          <Button onClick={() => setIsAddInventoryOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('resources.addInventoryItem')}
          </Button>
        );
      case "staff":
        return (
          <Button onClick={() => setIsAddStaffOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('resources.addStaffMember')}
          </Button>
        );
      case "equipment":
        return (
          <Button onClick={() => setIsAddEquipmentOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('resources.addEquipment')}
          </Button>
        );
      case "vehicles":
        return (
          <Button onClick={() => setIsAddVehicleOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('resources.addVehicle')}
          </Button>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('resources.title')}</h2>
          <p className="text-muted-foreground">{t('resources.description')}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <Filter className="mr-2 h-4 w-4" />
            {t('resources.listView')}
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {t('resources.calendarView')}
          </Button>
          {getAddButtonForActiveTab()}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            {t('resources.inventory')}
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="mr-2 h-4 w-4" />
            {t('resources.staff')}
          </TabsTrigger>
          <TabsTrigger value="equipment">
            <Wrench className="mr-2 h-4 w-4" />
            {t('resources.equipment')}
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            <Car className="mr-2 h-4 w-4" />
            {t('resources.vehicles')}
          </TabsTrigger>
        </TabsList>

        {viewMode === "list" ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{getTabTitle()}</CardTitle>
                  <CardDescription>{getTabDescription()}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder={t('resources.search')}
                    value={searchFilters.searchTerm}
                    onChange={(e) => setSearchFilters({...searchFilters, searchTerm: e.target.value})}
                    className="w-[200px]"
                  />
                  {activeTab !== "staff" && (
                    <Select
                      value={searchFilters.categoryId}
                      onValueChange={(value) => setSearchFilters({...searchFilters, categoryId: value})}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('resources.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('resources.allCategories')}</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select
                    value={searchFilters.status}
                    onValueChange={(value) => setSearchFilters({...searchFilters, status: value})}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('resources.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('resources.allStatuses')}</SelectItem>
                      {getStatusOptions().map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    {t('resources.search')}
                  </Button>
                  <Button variant="ghost" onClick={handleResetFilters}>
                    {t('resources.resetFilters')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderTabContent()}
            </CardContent>
          </Card>
        ) : (
          <ResourceCalendar
            activeTab={activeTab}
            inventoryItems={inventoryItems}
            staffMembers={staffMembers}
            equipment={equipment}
            vehicles={vehicles}
          />
        )}
      </Tabs>

      {/* Add Resource Dialogs */}
      <AddInventoryDialog
        open={isAddInventoryOpen}
        onOpenChange={setIsAddInventoryOpen}
        categories={categories}
        onSuccess={handleAddInventorySuccess}
      />

      <AddStaffDialog
        open={isAddStaffOpen}
        onOpenChange={setIsAddStaffOpen}
        onSuccess={handleAddStaffSuccess}
      />

      <AddEquipmentDialog
        open={isAddEquipmentOpen}
        onOpenChange={setIsAddEquipmentOpen}
        categories={categories}
        onSuccess={() => setIsAddEquipmentOpen(false)}
      />

      <AddVehicleDialog
        open={isAddVehicleOpen}
        onOpenChange={setIsAddVehicleOpen}
        onSuccess={() => setIsAddVehicleOpen(false)}
      />
    </div>
  );

  function getTabTitle() {
    switch (activeTab) {
      case "inventory":
        return t('resources.inventoryItems');
      case "staff":
        return t('resources.staffMembers');
      case "equipment":
        return t('resources.equipmentItems');
      case "vehicles":
        return t('resources.vehiclesList');
      default:
        return "";
    }
  }

  function getTabDescription() {
    switch (activeTab) {
      case "inventory":
        return t('resources.inventoryDescription');
      case "staff":
        return t('resources.staffDescription');
      case "equipment":
        return t('resources.equipmentDescription');
      case "vehicles":
        return t('resources.vehiclesDescription');
      default:
        return "";
    }
  }

  function getStatusOptions() {
    switch (activeTab) {
      case "inventory":
        return [
          { value: "available", label: t('resources.available') },
          { value: "in_use", label: t('resources.inUse') },
          { value: "maintenance", label: t('resources.maintenance') },
          { value: "retired", label: t('resources.retired') }
        ];
      case "staff":
        return [
          { value: "active", label: t('resources.active') },
          { value: "inactive", label: t('resources.inactive') }
        ];
      case "equipment":
        return [
          { value: "operational", label: t('resources.operational') },
          { value: "maintenance", label: t('resources.maintenance') },
          { value: "retired", label: t('resources.retired') }
        ];
      case "vehicles":
        return [
          { value: "available", label: t('resources.available') },
          { value: "in_use", label: t('resources.inUse') },
          { value: "maintenance", label: t('resources.maintenance') },
          { value: "retired", label: t('resources.retired') }
        ];
      default:
        return [];
    }
  }

  function renderTabContent() {
    switch (activeTab) {
      case "inventory":
        return <InventoryList items={inventoryItems} onItemsChange={setInventoryItems} />;
      case "staff":
        return <StaffList staff={staffMembers} onStaffChange={setStaffMembers} />;
      case "equipment":
        return <EquipmentList equipment={equipment} onEquipmentChange={setEquipment} />;
      case "vehicles":
        return <VehicleList vehicles={vehicles} onVehiclesChange={setVehicles} />;
      default:
        return null;
    }
  }
};

export default Resources;
