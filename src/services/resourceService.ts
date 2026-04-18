import { supabase } from '@/integrations/supabase/client';
import {
  ResourceCategory,
  InventoryItem,
  InventoryBooking,
  StaffMember,
  StaffAssignment,
  Equipment,
  EquipmentBooking,
  Vehicle,
  TransportationSchedule,
  MaintenanceLog,
  ResourceAvailability,
  ResourceConflict,
  ResourceSearchFilters,
  ResourceStatistics
} from '@/types/resources';
import { format, parseISO, isWithinInterval } from 'date-fns';

// Resource Categories
export const fetchResourceCategories = async (): Promise<ResourceCategory[]> => {
  const { data, error } = await supabase
    .from('resource_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching resource categories:', error);
    throw error;
  }

  return data.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    createdAt: category.created_at,
    updatedAt: category.updated_at
  }));
};

export const createResourceCategory = async (
  name: string,
  description?: string
): Promise<ResourceCategory> => {
  const { data, error } = await supabase
    .from('resource_categories')
    .insert({
      name,
      description
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resource category:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Inventory Items
export const fetchInventoryItems = async (
  filters?: ResourceSearchFilters
): Promise<InventoryItem[]> => {
  let query = supabase
    .from('inventory_items')
    .select(`
      *,
      category:resource_categories(id, name)
    `);

  if (filters) {
    if (filters.searchTerm) {
      query = query.ilike('name', `%${filters.searchTerm}%`);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }

  return data.map(item => ({
    id: item.id,
    categoryId: item.category_id,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unitCost: item.unit_cost,
    replacementCost: item.replacement_cost,
    rentalFee: item.rental_fee,
    imageUrl: item.image_url,
    status: item.status,
    location: item.location,
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    categoryName: item.category ? item.category.name : undefined
  }));
};

export const createInventoryItem = async (
  item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      category_id: item.categoryId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      replacement_cost: item.replacementCost,
      rental_fee: item.rentalFee,
      image_url: item.imageUrl,
      status: item.status,
      location: item.location,
      notes: item.notes
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }

  return {
    id: data.id,
    categoryId: data.category_id,
    name: data.name,
    description: data.description,
    quantity: data.quantity,
    unitCost: data.unit_cost,
    replacementCost: data.replacement_cost,
    rentalFee: data.rental_fee,
    imageUrl: data.image_url,
    status: data.status,
    location: data.location,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Staff Members
export const fetchStaffMembers = async (
  filters?: ResourceSearchFilters
): Promise<StaffMember[]> => {
  let query = supabase
    .from('staff')
    .select('*');

  if (filters) {
    if (filters.searchTerm) {
      query = query.or(`name.ilike.%${filters.searchTerm}%,role.ilike.%${filters.searchTerm}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching staff members:', error);
    throw error;
  }

  return data.map(staff => ({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    role: staff.role,
    hourlyRate: staff.hourly_rate,
    skills: staff.skills,
    availability: staff.availability,
    notes: staff.notes,
    imageUrl: staff.image_url,
    status: staff.status,
    createdAt: staff.created_at,
    updatedAt: staff.updated_at
  }));
};

export const createStaffMember = async (
  staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StaffMember> => {
  const { data, error } = await supabase
    .from('staff')
    .insert({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      hourly_rate: staff.hourlyRate,
      skills: staff.skills,
      availability: staff.availability,
      notes: staff.notes,
      image_url: staff.imageUrl,
      status: staff.status
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    hourlyRate: data.hourly_rate,
    skills: data.skills,
    availability: data.availability,
    notes: data.notes,
    imageUrl: data.image_url,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Staff Assignments
export const fetchStaffAssignments = async (
  staffId?: string,
  clientId?: string,
  startDate?: string,
  endDate?: string
): Promise<StaffAssignment[]> => {
  let query = supabase
    .from('staff_assignments')
    .select(`
      *,
      staff:staff(id, name),
      client:clients(id, name)
    `);

  if (staffId) {
    query = query.eq('staff_id', staffId);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  if (startDate) {
    query = query.gte('start_time', startDate);
  }

  if (endDate) {
    query = query.lte('end_time', endDate);
  }

  const { data, error } = await query.order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching staff assignments:', error);
    throw error;
  }

  return data.map(assignment => ({
    id: assignment.id,
    staffId: assignment.staff_id,
    clientId: assignment.client_id,
    title: assignment.title,
    description: assignment.description,
    startTime: assignment.start_time,
    endTime: assignment.end_time,
    location: assignment.location,
    status: assignment.status,
    notes: assignment.notes,
    createdAt: assignment.created_at,
    updatedAt: assignment.updated_at,
    staffName: assignment.staff ? assignment.staff.name : undefined,
    clientName: assignment.client ? assignment.client.name : undefined
  }));
};

// Check for resource conflicts
export const checkResourceAvailability = async (
  resourceType: 'inventory' | 'staff' | 'equipment' | 'vehicle',
  resourceId: string,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  let tableName: string;
  let resourceIdField: string;
  let startTimeField: string;
  let endTimeField: string;

  switch (resourceType) {
    case 'inventory':
      tableName = 'inventory_bookings';
      resourceIdField = 'item_id';
      startTimeField = 'start_date';
      endTimeField = 'end_date';
      break;
    case 'staff':
      tableName = 'staff_assignments';
      resourceIdField = 'staff_id';
      startTimeField = 'start_time';
      endTimeField = 'end_time';
      break;
    case 'equipment':
      tableName = 'equipment_bookings';
      resourceIdField = 'equipment_id';
      startTimeField = 'start_time';
      endTimeField = 'end_time';
      break;
    case 'vehicle':
      tableName = 'transportation_schedules';
      resourceIdField = 'vehicle_id';
      startTimeField = 'pickup_time';
      endTimeField = 'dropoff_time';
      break;
    default:
      throw new Error('Invalid resource type');
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq(resourceIdField, resourceId)
    .or(`${startTimeField}.lte.${endTime},${endTimeField}.gte.${startTime}`)
    .not('status', 'eq', 'cancelled');

  if (error) {
    console.error(`Error checking ${resourceType} availability:`, error);
    throw error;
  }

  // If there are any bookings in the specified time range, the resource is not available
  return data.length === 0;
};

// Resource Statistics
export const getResourceStatistics = async (
  resourceType: 'inventory' | 'staff' | 'equipment' | 'vehicle'
): Promise<ResourceStatistics> => {
  // This is a placeholder implementation
  // In a real implementation, you would query the database for statistics
  return {
    totalItems: 0,
    availableItems: 0,
    inUseItems: 0,
    maintenanceItems: 0,
    retiredItems: 0,
    utilizationRate: 0,
    mostUsedResources: [],
    upcomingMaintenance: []
  };
};
