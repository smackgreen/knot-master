-- Create tables for resource management

-- Create resource_categories table
CREATE TABLE IF NOT EXISTS resource_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create inventory_items table for rental items and decor
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES resource_categories ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2),
  replacement_cost DECIMAL(10,2),
  rental_fee DECIMAL(10,2),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'retired'
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_bookings table to track when items are booked
CREATE TABLE IF NOT EXISTS inventory_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff table for team members
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  hourly_rate DECIMAL(10,2),
  skills TEXT[],
  availability TEXT, -- JSON string with availability schedule
  notes TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff_assignments table to track when staff are assigned to events
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  staff_id UUID REFERENCES staff ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create equipment table for equipment items
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES resource_categories ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  current_value DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'operational', -- 'operational', 'maintenance', 'retired'
  maintenance_schedule TEXT, -- JSON string with maintenance schedule
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  location TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create equipment_bookings table to track when equipment is booked
CREATE TABLE IF NOT EXISTS equipment_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  equipment_id UUID REFERENCES equipment ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicles table for transportation
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'car', 'van', 'truck', 'bus', etc.
  make TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'retired'
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transportation_schedules table for vehicle bookings
CREATE TABLE IF NOT EXISTS transportation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES staff ON DELETE SET NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pickup_location TEXT,
  dropoff_location TEXT,
  pickup_time TIMESTAMPTZ NOT NULL,
  dropoff_time TIMESTAMPTZ NOT NULL,
  passenger_count INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create maintenance_logs table for equipment and vehicle maintenance
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  equipment_id UUID REFERENCES equipment ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL, -- 'routine', 'repair', 'inspection'
  description TEXT,
  cost DECIMAL(10,2),
  performed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((equipment_id IS NOT NULL AND vehicle_id IS NULL) OR (equipment_id IS NULL AND vehicle_id IS NOT NULL))
);

-- Add RLS policies
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own resource categories"
  ON resource_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resource categories"
  ON resource_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resource categories"
  ON resource_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resource categories"
  ON resource_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view their own inventory items"
  ON inventory_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON inventory_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON inventory_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_resource_categories_user_id ON resource_categories(user_id);
CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX idx_inventory_bookings_user_id ON inventory_bookings(user_id);
CREATE INDEX idx_inventory_bookings_client_id ON inventory_bookings(client_id);
CREATE INDEX idx_inventory_bookings_item_id ON inventory_bookings(item_id);
CREATE INDEX idx_inventory_bookings_date_range ON inventory_bookings(start_date, end_date);
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_assignments_user_id ON staff_assignments(user_id);
CREATE INDEX idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX idx_staff_assignments_client_id ON staff_assignments(client_id);
CREATE INDEX idx_staff_assignments_time_range ON staff_assignments(start_time, end_time);
CREATE INDEX idx_equipment_user_id ON equipment(user_id);
CREATE INDEX idx_equipment_category_id ON equipment(category_id);
CREATE INDEX idx_equipment_bookings_user_id ON equipment_bookings(user_id);
CREATE INDEX idx_equipment_bookings_equipment_id ON equipment_bookings(equipment_id);
CREATE INDEX idx_equipment_bookings_client_id ON equipment_bookings(client_id);
CREATE INDEX idx_equipment_bookings_time_range ON equipment_bookings(start_time, end_time);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_transportation_schedules_user_id ON transportation_schedules(user_id);
CREATE INDEX idx_transportation_schedules_vehicle_id ON transportation_schedules(vehicle_id);
CREATE INDEX idx_transportation_schedules_driver_id ON transportation_schedules(driver_id);
CREATE INDEX idx_transportation_schedules_client_id ON transportation_schedules(client_id);
CREATE INDEX idx_transportation_schedules_time_range ON transportation_schedules(pickup_time, dropoff_time);
CREATE INDEX idx_maintenance_logs_user_id ON maintenance_logs(user_id);
CREATE INDEX idx_maintenance_logs_equipment_id ON maintenance_logs(equipment_id);
CREATE INDEX idx_maintenance_logs_vehicle_id ON maintenance_logs(vehicle_id);
