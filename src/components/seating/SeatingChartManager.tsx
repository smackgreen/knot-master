/**
 * ============================================================================
 * SEATING CHART MANAGER — Architectural Overview & Implementation
 * ============================================================================
 *
 * ## ARCHITECTURE
 *
 * This component serves as the unified entry point for the entire Seating Chart
 * subsystem. It orchestrates all sub-components, manages state, and handles
 * database persistence via Supabase.
 *
 * ### Framework Stack
 * - **React 18** with TypeScript — Component model with hooks
 * - **Framer Motion** — Smooth animations for drag-and-drop, transitions
 * - **@dnd-kit** — Drag-and-drop for table repositioning (via FloorPlan)
 * - **Tailwind CSS** — Utility-first styling with romantic theme
 * - **shadcn/ui** — Dialog, Button, Input, Select, Tabs, Slider, Switch
 * - **lucide-react** — Icon library (LayoutGrid, Users, Save, etc.)
 * - **sonner** — Toast notifications
 * - **react-i18next** — Internationalization (fr/en)
 * - **recharts** — (available for stats visualization)
 *
 * ### State Management
 * - **Local component state** (`useState`) for UI concerns:
 *   - `tables`: Array of Table objects (position, shape, guests, name)
 *   - `guests`: Array of Guest objects (name, email, rsvp status, table assignment)
 *   - `selectedTable`: Currently selected table for editing
 *   - `zoom`: Floor plan zoom level (0.25 – 3.0)
 *   - `showGrid`: Toggle grid overlay on floor plan
 *   - `snapToGrid`: Snap tables to grid positions
 *   - `showMinimap`: Toggle minimap navigation
 *   - `autoAssignStrategy`: 'family' | 'random' | 'balanced'
 *
 * - **AppContext** (via `useApp()`) for Supabase-backed operations:
 *   - `getTablesByClientId(clientId)` — Fetch tables from Supabase
 *   - `getGuestsByClientId(clientId)` — Fetch guests from Supabase
 *   - `addTable(table)` — Insert table into Supabase
 *   - `updateTable(id, updates)` — Update table in Supabase
 *   - `deleteTable(id)` — Delete table from Supabase
 *   - `assignGuestToTable(guestId, tableId)` — Assign guest to table
 *   - `removeGuestFromTable(guestId)` — Unassign guest from table
 *   - `autoAssignGuests(clientId, strategy)` — AI-assisted auto-assignment
 *
 * ### Database Schema (Supabase)
 * ```sql
 * -- Tables
 * CREATE TABLE tables (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES auth.users(id),
 *   client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   shape TEXT NOT NULL DEFAULT 'round',  -- 'round' | 'rectangular' | 'oval'
 *   capacity INTEGER NOT NULL DEFAULT 8,
 *   x_position FLOAT DEFAULT 0,
 *   y_position FLOAT DEFAULT 0,
 *   rotation FLOAT DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Guests (with table assignment)
 * CREATE TABLE guests (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES auth.users(id),
 *   client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   email TEXT,
 *   phone TEXT,
 *   rsvp_status TEXT DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'declined'
 *   dietary_restrictions TEXT,
 *   table_id UUID REFERENCES tables(id),  -- NULL = unassigned
 *   seat_number INTEGER,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ```
 *
 * ### Component Hierarchy
 * ```
 * SeatingChartManager (this file)
 * ├── Header (stats, controls, zoom)
 * ├── Tabs
 * │   ├── Floor Plan Tab
 * │   │   ├── FloorPlan (drag-and-drop canvas)
 * │   │   │   ├── DraggableTable (per-table rendering)
 * │   │   │   └── Minimap (navigation overlay)
 * │   │   └── Toolbar (zoom, grid, snap, reset)
 * │   ├── Tables Tab
 * │   │   └── TableList (list view of all tables)
 * │   ├── Guests Tab
 * │   │   └── GuestList (unassigned guests, drag to assign)
 * │   └── Stats Tab (analytics, occupancy, RSVP breakdown)
 * ├── AddTableDialog (create new table)
 * ├── EditTableDialog (edit table properties)
 * ├── ExportDialog (export as PNG/PDF)
 * └── PrintableCards (print place cards)
 * ```
 *
 * ### Icon Usage (lucide-react)
 * - `LayoutGrid` — Seating tab icon, floor plan grid
 * - `Users` — Guest management, capacity indicators
 * - `Circle` / `Square` / `RectangleHorizontal` — Table shape icons
 * - `Save` — Save layout button
 * - `Download` — Export button
 * - `Plus` — Add table/guest
 * - `Trash2` — Delete table
 * - `ZoomIn` / `ZoomOut` — Zoom controls
 * - `RotateCw` — Rotate table
 * - `Undo` / `Redo` — History navigation
 * - `Maximize` — Reset view
 * - `Map` — Minimap toggle
 * - `Shuffle` — Auto-assign guests
 * - `UserPlus` / `UserMinus` — Assign/unassign guests
 * - `MoveHorizontal` — Drag indicator
 * - `Heart` / `Sparkles` — Romantic decorative elements
 *
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Table, TableShape, Guest } from '@/types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// shadcn/ui components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  LayoutGrid, Plus, Save, Download, Users, Circle, Square,
  RectangleHorizontal, Undo, Redo, ZoomIn, ZoomOut, Trash2,
  MoveHorizontal, RotateCw, UserPlus, UserMinus, Shuffle,
  Maximize, Map, Heart, Sparkles, Settings2, ChevronDown,
  ChevronRight, Check, X, Pencil, Eye, PieChart as PieChartIcon,
  Armchair, Wine, Music,
} from 'lucide-react';

// Existing sub-components
import FloorPlan from './FloorPlan';
import TableList from './TableList';
import GuestList from './GuestList';
import AddTableDialog from './AddTableDialog';
import EditTableDialog from './EditTableDialog';
import PrintableCards from './PrintableCards';
import ExportDialog from './ExportDialog';

// ============================================================================
// Types
// ============================================================================

interface SeatingChartManagerProps {
  clientId: string;
}

// ============================================================================
// Main Component
// ============================================================================

const SeatingChartManager: React.FC<SeatingChartManagerProps> = ({ clientId }) => {
  const { t } = useTranslation();
  const {
    getTablesByClientId,
    getGuestsByClientId,
    addTable,
    updateTable,
    deleteTable,
    assignGuestToTable,
    removeGuestFromTable,
    autoAssignGuests,
  } = useApp();

  // ---- State ----
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<'family' | 'random' | 'balanced'>('family');
  const [resetView, setResetView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('floorplan');

  const floorPlanRef = useRef<HTMLDivElement>(null);

  // ---- Data Loading ----
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const tablesData = await getTablesByClientId(clientId);
        const guestsData = await getGuestsByClientId(clientId);
        setTables(tablesData || []);
        setGuests(guestsData || []);
      } catch (error) {
        console.error('Error loading seating data:', error);
        toast.error(t('seating.loadError', 'Erreur lors du chargement des données.'));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [clientId, getTablesByClientId, getGuestsByClientId, t]);

  // ---- Computed Stats ----
  const totalCapacity = useMemo(() => tables.reduce((sum, t) => sum + (t.capacity || 0), 0), [tables]);
  const assignedGuests = useMemo(() => guests.filter((g) => g.tableId), [guests]);
  const unassignedGuests = useMemo(() => guests.filter((g) => !g.tableId), [guests]);
  const confirmedGuests = useMemo(() => guests.filter((g) => g.rsvpStatus === 'confirmed'), [guests]);
  const occupancyPercent = totalCapacity > 0 ? Math.round((assignedGuests.length / totalCapacity) * 100) : 0;

  // ---- Handlers ----
  const handleAddTable = async (tableData: Partial<Table>) => {
    try {
      await addTable({
        ...tableData,
        clientId,
        xPosition: tableData.xPosition ?? Math.random() * 400 + 100,
        yPosition: tableData.yPosition ?? Math.random() * 300 + 100,
        rotation: tableData.rotation ?? 0,
      } as Omit<Table, 'id' | 'createdAt'>);
      const updated = await getTablesByClientId(clientId);
      setTables(updated || []);
      setIsAddTableOpen(false);
      toast.success(t('seating.tableAdded', 'Table ajoutée avec succès.'));
    } catch (error) {
      toast.error(t('seating.addTableError', 'Erreur lors de l\'ajout de la table.'));
    }
  };

  const handleUpdateTable = async (id: string, updates: Partial<Table>) => {
    try {
      await updateTable(id, updates);
      const updated = await getTablesByClientId(clientId);
      setTables(updated || []);
      if (selectedTable?.id === id) {
        setSelectedTable({ ...selectedTable, ...updates });
      }
      toast.success(t('seating.tableUpdated', 'Table mise à jour.'));
    } catch (error) {
      toast.error(t('seating.updateError', 'Erreur lors de la mise à jour.'));
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await deleteTable(id);
      const updated = await getTablesByClientId(clientId);
      setTables(updated || []);
      if (selectedTable?.id === id) setSelectedTable(null);
      toast.success(t('seating.tableDeleted', 'Table supprimée.'));
    } catch (error) {
      toast.error(t('seating.deleteError', 'Erreur lors de la suppression.'));
    }
  };

  const handleAssignGuest = async (guestId: string, tableId: string) => {
    try {
      await assignGuestToTable(guestId, tableId);
      const [updatedGuests, updatedTables] = await Promise.all([
        getGuestsByClientId(clientId),
        getTablesByClientId(clientId),
      ]);
      setGuests(updatedGuests || []);
      setTables(updatedTables || []);
      toast.success(t('seating.guestAssigned', 'Invité assigné.'));
    } catch (error) {
      toast.error(t('seating.assignError', 'Erreur lors de l\'assignation.'));
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    try {
      await removeGuestFromTable(guestId);
      const [updatedGuests, updatedTables] = await Promise.all([
        getGuestsByClientId(clientId),
        getTablesByClientId(clientId),
      ]);
      setGuests(updatedGuests || []);
      setTables(updatedTables || []);
      toast.success(t('seating.guestRemoved', 'Invité retiré de la table.'));
    } catch (error) {
      toast.error(t('seating.removeError', 'Erreur lors du retrait.'));
    }
  };

  const handleAutoAssign = async () => {
    try {
      await autoAssignGuests(clientId, autoAssignStrategy);
      const [updatedGuests, updatedTables] = await Promise.all([
        getGuestsByClientId(clientId),
        getTablesByClientId(clientId),
      ]);
      setGuests(updatedGuests || []);
      setTables(updatedTables || []);
      toast.success(t('seating.autoAssigned', 'Assignation automatique terminée !'));
    } catch (error) {
      toast.error(t('seating.autoAssignError', 'Erreur lors de l\'assignation automatique.'));
    }
  };

  const handleSelectTable = (table: Table | null) => {
    setSelectedTable(table);
    if (table) setIsEditTableOpen(true);
  };

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Chargement du plan de table...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // Main Render
  // ========================================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-gray-800">Plan de Table</h2>
            <p className="text-xs text-gray-400">
              {tables.length} tables • {assignedGuests.length}/{guests.length} invités placés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-9" onClick={() => setIsExportOpen(true)}>
                  <Download className="h-4 w-4 mr-1.5" /> Exporter
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exporter le plan de table</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setIsPrintCardsOpen(true)}>
            <Heart className="h-4 w-4 mr-1.5" /> Marque-places
          </Button>
          <Button size="sm" className="h-9 bg-gradient-to-r from-violet-500 to-purple-500 text-white" onClick={() => setIsAddTableOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter une table
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Tables', value: tables.length, icon: LayoutGrid, bg: 'from-violet-500 to-purple-500', color: 'text-violet-600' },
          { label: 'Capacité', value: `${totalCapacity} places`, icon: Armchair, bg: 'from-rose-500 to-pink-500', color: 'text-rose-600' },
          { label: 'Placés', value: `${assignedGuests.length}/${guests.length}`, icon: Users, bg: 'from-emerald-500 to-teal-500', color: 'text-emerald-600' },
          { label: 'Occupation', value: `${occupancyPercent}%`, icon: PieChartIcon, bg: 'from-amber-500 to-orange-500', color: 'text-amber-600' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-violet-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.bg} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-violet-50">
          <TabsTrigger value="floorplan" className="text-sm">
            <LayoutGrid className="mr-2 h-4 w-4" /> Plan
          </TabsTrigger>
          <TabsTrigger value="tables" className="text-sm">
            <Circle className="mr-2 h-4 w-4" /> Tables
          </TabsTrigger>
          <TabsTrigger value="guests" className="text-sm">
            <Users className="mr-2 h-4 w-4" /> Invités
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-sm">
            <PieChartIcon className="mr-2 h-4 w-4" /> Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Floor Plan Tab */}
        <TabsContent value="floorplan">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Floor Plan Canvas */}
            <div className="lg:col-span-9">
              <Card className="border-violet-100">
                <CardContent className="p-4">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-medium text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-5 bg-gray-200 mx-1" />
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => { setResetView(true); setTimeout(() => setResetView(false), 100); }}>
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Switch checked={showGrid} onCheckedChange={setShowGrid} className="scale-75" />
                        <span className="text-xs text-gray-400">Grille</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={showMinimap} onCheckedChange={setShowMinimap} className="scale-75" />
                        <span className="text-xs text-gray-400">Minimap</span>
                      </div>
                    </div>
                  </div>

                  {/* Floor Plan */}
                  <div ref={floorPlanRef} className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 rounded-xl overflow-hidden" style={{ height: '500px' }}>
                    <FloorPlan
                      tables={tables}
                      guests={guests}
                      selectedTable={selectedTable}
                      onSelectTable={handleSelectTable}
                      onUpdateTable={handleUpdateTable}
                      zoom={zoom}
                      showGrid={showGrid}
                      snapToGrid={snapToGrid}
                      showMinimap={showMinimap}
                      resetView={resetView}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="lg:col-span-3 space-y-4">
              {/* Auto-Assign */}
              <Card className="border-violet-100">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-serif">Assignation automatique</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Select value={autoAssignStrategy} onValueChange={(v: any) => setAutoAssignStrategy(v)}>
                    <SelectTrigger className="h-9 text-sm mb-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Par famille</SelectItem>
                      <SelectItem value="random">Aléatoire</SelectItem>
                      <SelectItem value="balanced">Équilibré</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAutoAssign} className="w-full h-9 text-sm bg-gradient-to-r from-violet-500 to-purple-500 text-white" disabled={unassignedGuests.length === 0}>
                    <Shuffle className="h-4 w-4 mr-1.5" />
                    Assigner {unassignedGuests.length} invités
                  </Button>
                </CardContent>
              </Card>

              {/* Selected Table Info */}
              {selectedTable && (
                <Card className="border-violet-100">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-serif">{selectedTable.name}</CardTitle>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedTable(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="text-xs">
                      {selectedTable.shape === 'round' ? 'Ronde' : selectedTable.shape === 'oval' ? 'Ovale' : 'Rectangulaire'} • {selectedTable.capacity} places
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-1.5 mb-3">
                      {guests
                        .filter((g) => g.tableId === selectedTable.id)
                        .map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between py-1 px-2 bg-violet-50 rounded-md">
                            <span className="text-xs font-medium text-gray-700">{guest.name}</span>
                            <button onClick={() => handleRemoveGuest(guest.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      {guests.filter((g) => g.tableId === selectedTable.id).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">Aucun invité assigné</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setIsEditTableOpen(true)}>
                        <Pencil className="h-3 w-3 mr-1" /> Modifier
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs text-red-500 hover:bg-red-50" onClick={() => handleDeleteTable(selectedTable.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Unassigned Guests Quick View */}
              {unassignedGuests.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-serif text-amber-700">
                      Invités non placés ({unassignedGuests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 max-h-[200px] overflow-y-auto">
                    <div className="space-y-1">
                      {unassignedGuests.slice(0, 10).map((guest) => (
                        <div key={guest.id} className="flex items-center justify-between py-1 px-2 bg-white rounded-md">
                          <span className="text-xs text-gray-600">{guest.name}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">
                            {guest.rsvpStatus === 'confirmed' ? '✓' : '⏳'}
                          </Badge>
                        </div>
                      ))}
                      {unassignedGuests.length > 10 && (
                        <p className="text-[10px] text-amber-500 text-center">+{unassignedGuests.length - 10} autres</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tables List Tab */}
        <TabsContent value="tables">
          <Card className="border-violet-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-serif">Liste des tables</CardTitle>
                  <CardDescription>Gérez vos tables et leurs capacités</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddTableOpen(true)} className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                  <Plus className="h-4 w-4 mr-1.5" /> Nouvelle table
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TableList
                tables={tables}
                guests={guests}
                onEditTable={(table) => { setSelectedTable(table); setIsEditTableOpen(true); }}
                onDeleteTable={handleDeleteTable}
                onAssignGuest={handleAssignGuest}
                onRemoveGuest={handleRemoveGuest}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests">
          <Card className="border-violet-100">
            <CardContent className="p-0">
              <GuestList
                clientId={clientId}
                tables={tables}
                onAssignGuest={handleAssignGuest}
                onRemoveGuest={handleRemoveGuest}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RSVP Breakdown */}
            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="text-base font-serif">Statut RSVP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Confirmés', count: guests.filter(g => g.rsvpStatus === 'confirmed').length, color: 'bg-emerald-400', total: guests.length },
                    { label: 'En attente', count: guests.filter(g => g.rsvpStatus === 'pending').length, color: 'bg-amber-400', total: guests.length },
                    { label: 'Refusés', count: guests.filter(g => g.rsvpStatus === 'declined').length, color: 'bg-red-400', total: guests.length },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.count} ({item.total > 0 ? Math.round((item.count / item.total) * 100) : 0}%)</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Table Occupancy */}
            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="text-base font-serif">Occupation des tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tables.map((table) => {
                    const tableGuests = guests.filter(g => g.tableId === table.id).length;
                    const percent = table.capacity > 0 ? Math.round((tableGuests / table.capacity) * 100) : 0;
                    return (
                      <div key={table.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{table.name}</span>
                          <span className="font-medium">{tableGuests}/{table.capacity}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${percent > 100 ? 'bg-red-400' : percent > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, percent)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {tables.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucune table créée</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-violet-100 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-serif">Résumé général</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-violet-600">{guests.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Total invités</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{assignedGuests.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Invités placés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{unassignedGuests.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Non placés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-rose-600">{totalCapacity - assignedGuests.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Places libres</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddTableDialog
        open={isAddTableOpen}
        onOpenChange={setIsAddTableOpen}
        onAddTable={handleAddTable}
      />

      {selectedTable && (
        <EditTableDialog
          open={isEditTableOpen}
          onOpenChange={setIsEditTableOpen}
          table={selectedTable}
          onUpdateTable={(updates) => handleUpdateTable(selectedTable.id, updates)}
          guests={guests.filter((g) => g.tableId === selectedTable.id)}
          onAssignGuest={handleAssignGuest}
          onRemoveGuest={handleRemoveGuest}
          unassignedGuests={unassignedGuests}
        />
      )}

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        tables={tables}
        guests={guests}
        floorPlanRef={floorPlanRef}
      />

      <PrintableCards
        open={isPrintCardsOpen}
        onOpenChange={setIsPrintCardsOpen}
        tables={tables}
        guests={guests}
      />
    </div>
  );
};

export default SeatingChartManager;
