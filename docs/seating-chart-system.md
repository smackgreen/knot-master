# Seating Chart System — Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Hierarchy](#component-hierarchy)
4. [Database Schema](#database-schema)
5. [State Management](#state-management)
6. [Component Reference](#component-reference)
7. [Props Interfaces](#props-interfaces)
8. [User Workflows](#user-workflows)
9. [Icon Usage](#icon-usage)
10. [Internationalization](#internationalization)
11. [Known Issues & TODO](#known-issues--todo)

---

## Overview

The Seating Chart system is a comprehensive table-planning tool for wedding events. It provides:

- **Visual floor plan** with drag-and-drop table positioning
- **Table management** — create, edit, delete tables with custom shapes and capacities
- **Guest assignment** — manual drag-to-table or automatic algorithmic assignment
- **Statistics dashboard** — RSVP breakdown, table occupancy, summary metrics
- **Export capabilities** — PNG, JPG, PDF export of the floor plan
- **Printable place cards** — per-guest cards for physical seating

The system is accessed via the **"Seating" tab** in the Client Details page (`ClientDetails.tsx`).

---

## Architecture

### Framework Stack

| Technology | Purpose |
|-----------|---------|
| **React 18 + TypeScript** | Component model with hooks |
| **Framer Motion** | Smooth animations for transitions and drag feedback |
| **@dnd-kit/core** | Drag-and-drop for table repositioning on the floor plan |
| **@dnd-kit/modifiers** | Restrict drag to window edges |
| **Tailwind CSS** | Utility-first styling with romantic violet/purple theme |
| **shadcn/ui** | Dialog, Button, Input, Select, Tabs, Switch, Slider, Badge |
| **lucide-react** | Icon library |
| **sonner** | Toast notifications |
| **react-i18next** | Internationalization (French/English) |
| **html2canvas** | Floor plan screenshot for export |
| **jsPDF** | PDF generation for export |
| **react-to-print** | Printable place cards |
| **Supabase** | Database persistence (tables, guests) |

### File Structure

```
src/components/seating/
├── SeatingChartManager.tsx    ← Main orchestrator (entry point)
├── FloorPlan.tsx              ← Drag-and-drop canvas with grid
├── DraggableTable.tsx         ← Individual table rendering on canvas
├── Minimap.tsx                ← Navigation minimap overlay
├── TableList.tsx              ← List view of all tables
├── GuestList.tsx              ← Guest management with search/filter
├── AddTableDialog.tsx         ← Create new table dialog
├── EditTableDialog.tsx        ← Edit table properties dialog
├── ExportDialog.tsx           ← Export as PNG/JPG/PDF
├── PrintableCards.tsx         ← Print place cards
├── PlaceCard.tsx              ← Individual place card component
└── types.ts                   ← (optional) Seating-specific types
```

---

## Component Hierarchy

```
ClientDetails.tsx
└── SeatingChartManager (clientId: string)
    ├── Header
    │   ├── Title + subtitle (tables count, assigned guests)
    │   └── Action buttons (Export, Place Cards, Add Table)
    ├── Stats Row (4 cards)
    │   ├── Tables count
    │   ├── Total capacity
    │   ├── Assigned guests ratio
    │   └── Occupancy percentage
    ├── Tabs
    │   ├── Floor Plan Tab
    │   │   ├── Toolbar (zoom, grid toggle, minimap toggle, reset)
    │   │   ├── FloorPlan (drag-and-drop canvas)
    │   │   │   ├── DraggableTable (per-table, uses @dnd-kit)
    │   │   │   └── Minimap (navigation overlay)
    │   │   └── Side Panel
    │   │       ├── Auto-Assign card (strategy selector + button)
    │   │       ├── Selected Table Info (guests list, edit/delete)
    │   │       └── Unassigned Guests Quick View
    │   ├── Tables Tab
    │   │   └── TableList (list view with edit/delete)
    │   ├── Guests Tab
    │   │   └── GuestList (search, filter, assign to tables)
    │   └── Statistics Tab
    │       ├── RSVP Breakdown (progress bars)
    │       ├── Table Occupancy (per-table progress bars)
    │       └── Summary Grid (total, placed, unplaced, free seats)
    ├── AddTableDialog
    ├── EditTableDialog
    ├── ExportDialog
    └── PrintableCards
```

---

## Database Schema

### Supabase Tables

#### `tables`
```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape TEXT NOT NULL DEFAULT 'round',  -- 'round' | 'rectangular' | 'square' | 'custom'
  width INTEGER NOT NULL DEFAULT 100,
  height INTEGER NOT NULL DEFAULT 100,
  capacity INTEGER NOT NULL DEFAULT 8,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  rotation FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `guests` (with table assignment)
```sql
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  status TEXT DEFAULT 'invited',  -- 'invited' | 'confirmed' | 'declined' | 'pending'
  rsvp_status TEXT DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'declined'
  meal_preference TEXT,
  is_couple BOOLEAN DEFAULT false,
  partner_first_name TEXT,
  partner_last_name TEXT,
  partner_email TEXT,
  partner_meal_preference TEXT,
  has_children BOOLEAN DEFAULT false,
  children JSONB,
  table_assignment TEXT,  -- Legacy field (backward compatibility)
  table_id UUID REFERENCES tables(id),  -- NULL = unassigned
  seat_position INTEGER,  -- Position at the table
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Types (`src/types/index.ts`)

```typescript
type TableShape = 'round' | 'rectangular' | 'square' | 'custom';

interface Table {
  id: string;
  clientId: string;
  name: string;
  shape: TableShape;
  width: number;
  height: number;
  positionX: number;   // ← NOT xPosition
  positionY: number;   // ← NOT yPosition
  capacity: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

interface Guest {
  id: string;
  clientId: string;
  firstName: string;    // ← Guest has firstName/lastName, NOT name
  lastName: string;
  email?: string;
  phone?: string;
  rsvpStatus?: string;
  mealPreference?: string;
  isCouple: boolean;
  partnerFirstName?: string;
  partnerLastName?: string;
  hasChildren: boolean;
  children?: Child[];
  tableAssignment?: string;
  tableId?: string;      // NULL = unassigned
  seatPosition?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## State Management

### Local Component State (SeatingChartManager)

| State Variable | Type | Purpose |
|---------------|------|---------|
| `tables` | `Table[]` | All tables for this client |
| `guests` | `Guest[]` | All guests for this client |
| `selectedTable` | `Table \| null` | Currently selected table for editing |
| `isAddTableOpen` | `boolean` | AddTableDialog visibility |
| `isEditTableOpen` | `boolean` | EditTableDialog visibility |
| `isPrintCardsOpen` | `boolean` | PrintableCards dialog visibility |
| `isExportOpen` | `boolean` | ExportDialog visibility |
| `zoom` | `number` | Floor plan zoom level (0.25–3.0) |
| `showGrid` | `boolean` | Grid overlay toggle |
| `snapToGrid` | `boolean` | Snap tables to grid |
| `showMinimap` | `boolean` | Minimap toggle |
| `autoAssignStrategy` | `'family' \| 'random' \| 'balanced'` | Auto-assign algorithm |
| `resetView` | `boolean` | Trigger floor plan view reset |
| `isLoading` | `boolean` | Initial data loading state |
| `activeTab` | `string` | Current active tab |

### AppContext Methods (Supabase-backed)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getTablesByClientId` | `(clientId: string) => Promise<Table[]>` | Fetch all tables |
| `getGuestsByClientId` | `(clientId: string) => Promise<Guest[]>` | Fetch all guests |
| `addTable` | `(table: Omit<Table, 'id' \| 'createdAt'>) => Promise<Table>` | Insert table |
| `updateTable` | `(id: string, updates: Partial<Table>) => Promise<Table>` | Update table |
| `deleteTable` | `(id: string) => Promise<void>` | Delete table |
| `assignGuestToTable` | `(guestId: string, tableId: string) => Promise<void>` | Assign guest |
| `removeGuestFromTable` | `(guestId: string) => Promise<void>` | Unassign guest |
| `autoAssignGuests` | `(clientId: string, strategy: string) => Promise<void>` | Auto-assign |

### Data Flow

```
SeatingChartManager
  │
  ├── On Mount → loadData()
  │   ├── getTablesByClientId(clientId) → setTables()
  │   └── getGuestsByClientId(clientId) → setGuests()
  │
  ├── CRUD Operations → handler() → AppContext method → Supabase
  │   └── Then: re-fetch data → setTables()/setGuests()
  │
  └── Computed Values (useMemo)
      ├── totalCapacity = sum of all table capacities
      ├── assignedGuests = guests with tableId
      ├── unassignedGuests = guests without tableId
      └── occupancyPercent = assignedGuests / totalCapacity * 100
```

---

## Component Reference

### SeatingChartManager (Orchestrator)
- **File:** `src/components/seating/SeatingChartManager.tsx`
- **Props:** `{ clientId: string }`
- **Role:** Unified entry point — manages all state, handles CRUD, renders tabs and dialogs

### FloorPlan
- **File:** `src/components/seating/FloorPlan.tsx`
- **Role:** Drag-and-drop canvas with grid overlay, table rendering, and minimap
- **Key Features:** @dnd-kit sensors (mouse, touch, keyboard), zoom/pan, collision detection
- **Props:** See [Props Interfaces](#props-interfaces) below

### DraggableTable
- **File:** `src/components/seating/DraggableTable.tsx`
- **Role:** Renders a single table on the floor plan canvas
- **Features:** Visual representation based on shape (round/square/rectangular), shows guest count, selection state

### Minimap
- **File:** `src/components/seating/Minimap.tsx`
- **Role:** Navigation overlay showing a miniature view of the entire floor plan
- **Features:** Viewport indicator, click-to-navigate

### TableList
- **File:** `src/components/seating/TableList.tsx`
- **Role:** List view of all tables with shape icons, capacity, and edit/delete actions
- **Features:** ScrollArea, shape-based icons, alert confirmation for delete

### GuestList
- **File:** `src/components/seating/GuestList.tsx`
- **Role:** Guest management with search, filter (all/assigned/unassigned), and table assignment
- **Features:** Search by name/partner name, dropdown table assignment, RSVP status badges

### AddTableDialog
- **File:** `src/components/seating/AddTableDialog.tsx`
- **Role:** Form dialog for creating new tables
- **Features:** react-hook-form + zod validation, shape radio group, capacity slider, collision detection option

### EditTableDialog
- **File:** `src/components/seating/EditTableDialog.tsx`
- **Role:** Form dialog for editing existing table properties
- **Features:** Pre-populated form, position/rotation editing, shape/capacity editing

### ExportDialog
- **File:** `src/components/seating/ExportDialog.tsx`
- **Role:** Export floor plan as PNG, JPG, or PDF
- **Features:** Format selection, quality settings, scale, preview, html2canvas + jsPDF

### PrintableCards
- **File:** `src/components/seating/PrintableCards.tsx`
- **Role:** Generate printable place cards for guests
- **Features:** Filter by table/all, sort by name/table, react-to-print integration

### PlaceCard
- **File:** `src/components/seating/PlaceCard.tsx`
- **Role:** Individual place card rendering (guest name, table name, meal preference)

---

## Props Interfaces

### FloorPlanProps
```typescript
interface FloorPlanProps {
  tables: Table[];
  guests: Guest[];
  zoom: number;
  showGrid: boolean;
  resetView?: boolean;
  selectedTableIds?: string[];          // ← Array of IDs, NOT a Table object
  showMinimap?: boolean;
  onTablePositionChange: (tableId: string, positionX: number, positionY: number) => void;
  onTableRotationChange: (tableId: string, rotation: number) => void;
  onTableSelect: (table: Table, isMultiSelect: boolean) => void;
  onGuestAssign: (guestId: string, tableId: string) => void;
  onGuestRemove: (guestId: string) => void;
  onResetViewComplete?: () => void;
  onZoomChange?: (newZoom: number) => void;
}
```

### TableListProps
```typescript
interface TableListProps {
  tables: Table[];
  onEdit: (table: Table) => void;
  onDelete: (tableId: string) => void;
}
```

### GuestListProps
```typescript
interface GuestListProps {
  guests: Guest[];                      // ← Required! Must be passed
  tables: Table[];
  onAssign: (guestId: string, tableId: string) => void;
  onRemove: (guestId: string) => void;
}
```

### AddTableDialogProps
```typescript
interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;                     // ← Required!
  tables: Table[];                      // ← Required! (for collision detection)
  preventCollisions?: boolean;
  checkCollision?: (table1: Table, table2: Table) => boolean;
  onTableAdded: () => void;             // ← NOT onAddTable
}
```

### EditTableDialogProps
```typescript
interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table;
  onTableUpdated: () => void;           // ← NOT onUpdateTable
}
```

### ExportDialogProps
```typescript
interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlanRef: React.RefObject<HTMLDivElement>;
  tables: Table[];
  // NOTE: no 'guests' prop
}
```

### PrintableCardsProps
```typescript
interface PrintableCardsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: Guest[];
  tables: Table[];
  selectedTableIds?: string[];
}
```

---

## User Workflows

### Creating Tables
1. User clicks "Ajouter une table" button
2. `AddTableDialog` opens with form (name, shape, capacity, dimensions)
3. On submit, `addTable()` inserts into Supabase
4. Manager re-fetches tables and updates state

### Positioning Tables on Floor Plan
1. User drags a table on the FloorPlan canvas
2. `@dnd-kit` fires `onDragEnd` with new position
3. `onTablePositionChange(tableId, x, y)` is called
4. Manager calls `updateTable(id, { positionX, positionY })` on Supabase

### Assigning Guests to Tables
**Manual:**
1. User selects a guest in GuestList
2. Chooses a table from the dropdown
3. `onAssign(guestId, tableId)` → `assignGuestToTable()` on Supabase

**Automatic:**
1. User selects a strategy (family/random/balanced)
2. Clicks "Assigner X invités"
3. `autoAssignGuests(clientId, strategy)` runs on Supabase
4. Manager re-fetches both tables and guests

### Exporting
1. User clicks "Exporter" button
2. `ExportDialog` opens with format/quality/scale options
3. Uses `html2canvas` to capture the floor plan div
4. Generates PNG/JPG/PDF for download

### Printing Place Cards
1. User clicks "Marque-places" button
2. `PrintableCards` dialog opens with filter/sort options
3. Uses `react-to-print` to render `PlaceCard` components
4. Browser print dialog opens

---

## Icon Usage

| Icon | Component | Usage |
|------|-----------|-------|
| `LayoutGrid` | Manager header, Floor Plan tab | Main seating icon |
| `Users` | Stats, Guests tab | Guest count indicators |
| `Circle` | Tables tab | Round table icon |
| `Square` | TableList | Square table icon |
| `RectangleHorizontal` | TableList | Rectangular table icon |
| `Plus` | Add table buttons | Create new |
| `Trash2` | Delete table | Remove |
| `Download` | Export button | Export action |
| `Heart` | Place cards button | Romantic element |
| `ZoomIn` / `ZoomOut` | Toolbar | Zoom controls |
| `Maximize` | Toolbar | Reset view |
| `Shuffle` | Auto-assign | Random assignment |
| `UserMinus` | Guest list | Remove from table |
| `Pencil` | Selected table panel | Edit action |
| `X` | Selected table panel | Close/deselect |
| `PieChart` | Stats tab, occupancy | Statistics icon |
| `Search` | GuestList | Search input |
| `UserPlus` | GuestList | Assign to table |
| `Edit` | TableList | Edit table |

---

## Internationalization

The component uses `react-i18next` with the `t()` function. Translation keys used:

| Key | French Default | English |
|-----|---------------|---------|
| `seating.loadError` | Erreur lors du chargement des données | Error loading data |
| `seating.tableAdded` | Table ajoutée avec succès | Table added successfully |
| `seating.addTableError` | Erreur lors de l'ajout de la table | Error adding table |
| `seating.tableUpdated` | Table mise à jour | Table updated |
| `seating.updateError` | Erreur lors de la mise à jour | Error updating |
| `seating.tableDeleted` | Table supprimée | Table deleted |
| `seating.deleteError` | Erreur lors de la suppression | Error deleting |
| `seating.guestAssigned` | Invité assigné | Guest assigned |
| `seating.assignError` | Erreur lors de l'assignation | Error assigning |
| `seating.guestRemoved` | Invité retiré de la table | Guest removed from table |
| `seating.removeError` | Erreur lors du retrait | Error removing |
| `seating.autoAssigned` | Assignation automatique terminée ! | Auto-assignment complete! |
| `seating.autoAssignError` | Erreur lors de l'assignation automatique | Error during auto-assignment |

**Note:** Many UI strings are still hardcoded in French. See [Known Issues](#known-issues--todo).

---

## Known Issues & TODO

### Critical (Runtime Breakage)
- [ ] **FloorPlan prop mismatch** — `selectedTable`/`onSelectTable`/`onUpdateTable`/`snapToGrid` don't exist on `FloorPlanProps`. Must use `selectedTableIds`/`onTableSelect`/`onTablePositionChange`/`onTableRotationChange`/`onGuestAssign`/`onGuestRemove`
- [ ] **TableList prop mismatch** — Must use `onEdit`/`onDelete` (not `onEditTable`/`onDeleteTable`)
- [ ] **GuestList missing `guests` prop** — Must pass `guests={guests}` and use `onAssign`/`onRemove`
- [ ] **AddTableDialog missing `clientId`/`tables`** — Must pass `clientId` and `tables`; use `onTableAdded`
- [ ] **EditTableDialog extra props** — Remove `guests`/`onAssignGuest`/`onRemoveGuest`/`unassignedGuests`; use `onTableUpdated`
- [ ] **ExportDialog extra `guests` prop** — Remove it
- [ ] **Wrong Table property names** — `xPosition`/`yPosition` → `positionX`/`positionY`

### Warning (Type Errors)
- [ ] **`Guest.name` doesn't exist** — Use `guest.firstName + ' ' + guest.lastName`
- [ ] **Invalid `'oval'` shape comparison** — `TableShape` is `'round'|'rectangular'|'square'|'custom'`

### Suggestion (Code Quality)
- [ ] **18 unused icon imports** — Remove `Undo`, `Redo`, `MoveHorizontal`, `RotateCw`, `UserPlus`, `Settings2`, `ChevronDown`, `ChevronRight`, `Check`, `Eye`, `Armchair`, `Wine`, `Music`, etc.
- [ ] **Hardcoded French strings** — Move all UI labels to i18n translation keys
- [ ] **`floorPlanRef` type** — `MutableRefObject` vs `RefObject` mismatch with ExportDialog
