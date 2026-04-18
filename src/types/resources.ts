// Types for the resource management features

export interface ResourceCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InventoryItem {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitCost?: number;
  replacementCost?: number;
  rentalFee?: number;
  imageUrl?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  location?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  categoryName?: string;
  bookings?: InventoryBooking[];
}

export interface InventoryBooking {
  id: string;
  itemId: string;
  clientId?: string;
  quantity: number;
  startDate: Date | string;
  endDate: Date | string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  itemName?: string;
  clientName?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  hourlyRate?: number;
  skills?: string[];
  availability?: string; // JSON string with availability schedule
  notes?: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  assignments?: StaffAssignment[];
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  clientId?: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  staffName?: string;
  clientName?: string;
}

export interface Equipment {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  serialNumber?: string;
  purchaseDate?: Date | string;
  purchaseCost?: number;
  currentValue?: number;
  status: 'operational' | 'maintenance' | 'retired';
  maintenanceSchedule?: string; // JSON string with maintenance schedule
  lastMaintenanceDate?: Date | string;
  nextMaintenanceDate?: Date | string;
  location?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  categoryName?: string;
  bookings?: EquipmentBooking[];
  maintenanceLogs?: MaintenanceLog[];
}

export interface EquipmentBooking {
  id: string;
  equipmentId: string;
  clientId?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  equipmentName?: string;
  clientName?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string; // 'car', 'van', 'truck', 'bus', etc.
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  capacity?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  notes?: string;
  imageUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  schedules?: TransportationSchedule[];
  maintenanceLogs?: MaintenanceLog[];
}

export interface TransportationSchedule {
  id: string;
  vehicleId: string;
  driverId?: string;
  clientId?: string;
  title: string;
  description?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupTime: Date | string;
  dropoffTime: Date | string;
  passengerCount?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  vehicleName?: string;
  driverName?: string;
  clientName?: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentId?: string;
  vehicleId?: string;
  maintenanceDate: Date | string;
  maintenanceType: 'routine' | 'repair' | 'inspection';
  description?: string;
  cost?: number;
  performedBy?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  equipmentName?: string;
  vehicleName?: string;
}

// Resource availability types
export interface ResourceAvailability {
  id: string;
  name: string;
  type: 'inventory' | 'staff' | 'equipment' | 'vehicle';
  status: string;
  bookings: ResourceBooking[];
  isAvailable: boolean;
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  resourceType: 'inventory' | 'staff' | 'equipment' | 'vehicle';
  clientId?: string;
  clientName?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  notes?: string;
}

// Resource conflict types
export interface ResourceConflict {
  resourceId: string;
  resourceName: string;
  resourceType: 'inventory' | 'staff' | 'equipment' | 'vehicle';
  conflictingBookings: ResourceBooking[];
}

// Resource search and filter types
export interface ResourceSearchFilters {
  searchTerm?: string;
  categoryId?: string;
  status?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  location?: string;
}

// Resource statistics types
export interface ResourceStatistics {
  totalItems: number;
  availableItems: number;
  inUseItems: number;
  maintenanceItems: number;
  retiredItems: number;
  utilizationRate: number; // Percentage of time the resource is in use
  mostUsedResources: MostUsedResource[];
  upcomingMaintenance: Equipment[] | Vehicle[];
}

export interface MostUsedResource {
  id: string;
  name: string;
  type: 'inventory' | 'staff' | 'equipment' | 'vehicle';
  usageCount: number;
  usageHours: number;
}
