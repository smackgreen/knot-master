/**
 * ============================================================================
 * SEATING CHART MANAGER — Konva.js Canvas Implementation
 * ============================================================================
 *
 * ## ARCHITECTURE
 *
 * This component serves as the unified entry point for the entire Seating Chart
 * subsystem. It uses Konva.js (react-konva) for canvas-based floor plan rendering.
 *
 * ### Framework Stack
 * - **React 18** with TypeScript — Component model with hooks
 * - **Konva.js / react-konva** — Canvas-based floor plan with zoom/pan/drag
 * - **Tailwind CSS** — Utility-first styling
 * - **shadcn/ui** — Dialog, Button, Input, Select, Tabs, Slider, Switch
 * - **lucide-react** — Icon library
 * - **sonner** — Toast notifications
 * - **react-i18next** — Internationalization (fr/en)
 *
 * ### Component Hierarchy
 * ```
 * SeatingChartManager (this file)
 * ├── Header (stats, controls, zoom)
 * ├── Main Layout (grid: canvas + sidebar)
 * │   ├── KonvaFloorPlan (canvas with zoom/pan)
 * │   │   └── KonvaTable (per-table rendering with seats)
 * │   └── Sidebar
 * │       ├── Guest Groups (Family, Friends, Colleagues, VIP)
 * │       ├── Auto-Assign Card
 * │       └── Selected Table Info
 * ├── AddTableDialog
 * ├── EditTableDialog
 * ├── ExportDialog
 * └── PrintableCards
 * ```
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Icons
import {
  LayoutGrid, Plus, Download, Users, Circle,
  ZoomIn, ZoomOut, Trash2,
  UserPlus, UserMinus, Shuffle,
  Heart, Sparkles, ChevronDown,
  ChevronRight, Check, X, Pencil, PieChart as PieChartIcon,
  Armchair, Search, User, Expand,
} from 'lucide-react';

// Konva components
import KonvaFloorPlan from './KonvaFloorPlan';

// Existing sub-components
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

// Guest group colors
const GROUP_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  family: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-200' },
  friends: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  colleagues: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  vip: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  unassigned: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' },
};

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
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<'family' | 'random' | 'balanced'>('family');
  const [isLoading, setIsLoading] = useState(true);
  const [guestSearch, setGuestSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    family: true,
    friends: true,
    colleagues: true,
    vip: true,
    unassigned: true,
  });

  const stageRef = useRef<any>(null);
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

  // ---- Guest Groups ----
  const guestGroups = useMemo(() => {
    const searchLower = guestSearch.toLowerCase();
    const filterBySearch = (g: Guest) =>
      !guestSearch ||
      g.firstName.toLowerCase().includes(searchLower) ||
      g.lastName.toLowerCase().includes(searchLower);

    const assigned = assignedGuests.filter(filterBySearch);
    const unassigned = unassignedGuests.filter(filterBySearch);

    // Group assigned guests by their table
    const byTable: Record<string, Guest[]> = {};
    assigned.forEach((g) => {
      const tid = g.tableId || 'unassigned';
      if (!byTable[tid]) byTable[tid] = [];
      byTable[tid].push(g);
    });

    return {
      assigned: byTable,
      unassigned,
    };
  }, [guests, guestSearch, assignedGuests, unassignedGuests]);

  // ---- Handlers ----
  const handleAddTable = async (tableData: Partial<Table>) => {
    try {
      await addTable({
        ...tableData,
        clientId,
        positionX: tableData.positionX ?? Math.random() * 400 + 100,
        positionY: tableData.positionY ?? Math.random() * 300 + 100,
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

  const handleTablePositionChange = useCallback(
    async (tableId: string, x: number, y: number) => {
      try {
        await updateTable(tableId, { positionX: x, positionY: y } as Partial<Table>);
        setTables((prev) =>
          prev.map((t) => (t.id === tableId ? { ...t, positionX: x, positionY: y } : t))
        );
      } catch (error) {
        console.error('Error updating table position:', error);
      }
    },
    [updateTable]
  );

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin mx-auto mb-4" />
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
            <h2 className="text-xl font-serif font-bold text-gray-800">Seating Chart</h2>
            <p className="text-xs text-gray-400">
              {tables.length} tables · {assignedGuests.length}/{guests.length} guests seated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-9" onClick={() => setIsExportOpen(true)}>
                  <Download className="h-4 w-4 mr-1.5" /> Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export seating chart</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setIsPrintCardsOpen(true)}>
            <Heart className="h-4 w-4 mr-1.5" /> Place Cards
          </Button>
          <Button size="sm" className="h-9 bg-gradient-to-r from-violet-500 to-purple-500 text-white" onClick={() => setIsAddTableOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Table
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Tables', value: tables.length, icon: LayoutGrid, bg: 'from-violet-500 to-purple-500', color: 'text-violet-600' },
          { label: 'Capacity', value: `${totalCapacity} seats`, icon: Armchair, bg: 'from-rose-500 to-pink-500', color: 'text-rose-600' },
          { label: 'Seated', value: `${assignedGuests.length}/${guests.length}`, icon: Users, bg: 'from-emerald-500 to-teal-500', color: 'text-emerald-600' },
          { label: 'Occupancy', value: `${occupancyPercent}%`, icon: PieChartIcon, bg: 'from-amber-500 to-orange-500', color: 'text-amber-600' },
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

      {/* Main Content: Canvas + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Floor Plan Canvas */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Card className="border-violet-100 overflow-hidden">
            <CardContent className="p-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => setZoom(1)}>
                    <Expand className="h-3.5 w-3.5 mr-1" /> Fit
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch checked={showGrid} onCheckedChange={setShowGrid} className="scale-75" />
                    <span className="text-xs text-gray-400">Grid</span>
                  </div>
                </div>
              </div>

              {/* Konva Canvas */}
              <div ref={floorPlanRef} className="bg-gradient-to-br from-slate-50 to-violet-50/30" style={{ height: '520px' }}>
                <KonvaFloorPlan
                  tables={tables}
                  guests={guests}
                  selectedTableId={selectedTable?.id || null}
                  zoom={zoom}
                  showGrid={showGrid}
                  onTablePositionChange={handleTablePositionChange}
                  onSelectTable={handleSelectTable}
                  onZoomChange={handleZoomChange}
                  stageRef={stageRef}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests..."
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white border-violet-100"
            />
          </div>

          {/* Guest Groups */}
          <Card className="border-violet-100">
            <CardContent className="p-0">
              <ScrollArea className="h-[340px]">
                <div className="p-2">
                  {/* Unassigned Guests */}
                  <Collapsible
                    open={expandedGroups.unassigned}
                    onOpenChange={() => toggleGroup('unassigned')}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          {expandedGroups.unassigned ? (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Unassigned</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 bg-gray-100 text-gray-600">
                          {unassignedGuests.length}
                        </Badge>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-5 pl-3 border-l-2 border-gray-200 space-y-0.5 mt-1 mb-2">
                        {unassignedGuests.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2 px-2">All guests are assigned</p>
                        ) : (
                          unassignedGuests.map((guest) => (
                            <div
                              key={guest.id}
                              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                  <User className="h-3 w-3 text-gray-500" />
                                </div>
                                <span className="text-xs text-gray-700">
                                  {guest.firstName} {guest.lastName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {tables.length > 0 && (
                                  <Select onValueChange={(tableId) => handleAssignGuest(guest.id, tableId)}>
                                    <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent">
                                      <UserPlus className="h-3 w-3 text-violet-500" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tables.map((table) => (
                                        <SelectItem key={table.id} value={table.id}>
                                          {table.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Assigned Guests by Table */}
                  {tables.map((table) => {
                    const tableGuests = guests.filter((g) => g.tableId === table.id);
                    const isExpanded = expandedGroups[table.id] !== false;

                    return (
                      <Collapsible
                        key={table.id}
                        open={isExpanded}
                        onOpenChange={() => toggleGroup(table.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-violet-50/50 transition-colors">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                              )}
                              <Circle className="h-2.5 w-2.5 text-violet-500" />
                              <span className="text-sm font-medium text-gray-700">{table.name}</span>
                              <span className="text-[10px] text-gray-400">
                                {tableGuests.length}/{table.capacity}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 ${
                                tableGuests.length >= table.capacity
                                  ? 'bg-red-100 text-red-600'
                                  : tableGuests.length > 0
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {tableGuests.length >= table.capacity ? 'Full' : `${tableGuests.length}`}
                            </Badge>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-5 pl-3 border-l-2 border-violet-200 space-y-0.5 mt-1 mb-2">
                            {tableGuests.length === 0 ? (
                              <p className="text-xs text-gray-400 py-2 px-2">No guests assigned</p>
                            ) : (
                              tableGuests.map((guest) => (
                                <div
                                  key={guest.id}
                                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-violet-50/50 group"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                                      <User className="h-3 w-3 text-violet-600" />
                                    </div>
                                    <span className="text-xs text-gray-700">
                                      {guest.firstName} {guest.lastName}
                                    </span>
                                    {guest.rsvpStatus === 'confirmed' && (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleRemoveGuest(guest.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <UserMinus className="h-3 w-3 text-red-400 hover:text-red-600" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}

                  {tables.length === 0 && unassignedGuests.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No guests or tables yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Auto-Assign */}
          <Card className="border-violet-100">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium text-gray-700">Auto Assign</span>
              </div>
              <Select value={autoAssignStrategy} onValueChange={(v: any) => setAutoAssignStrategy(v)}>
                <SelectTrigger className="h-8 text-xs mb-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">By Family</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAutoAssign}
                className="w-full h-8 text-xs bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                disabled={unassignedGuests.length === 0}
              >
                <Shuffle className="h-3.5 w-3.5 mr-1.5" />
                Assign {unassignedGuests.length} guests
              </Button>
            </CardContent>
          </Card>

          {/* Selected Table Info */}
          {selectedTable && (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <LayoutGrid className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{selectedTable.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {selectedTable.shape === 'round' ? 'Round' : selectedTable.shape === 'square' ? 'Square' : 'Rectangular'} · {selectedTable.capacity} seats
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedTable(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Guests in selected table */}
                <div className="space-y-1 mb-2">
                  {guests
                    .filter((g) => g.tableId === selectedTable.id)
                    .map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between py-1 px-2 bg-white rounded-md">
                        <span className="text-xs font-medium text-gray-700">{guest.firstName} {guest.lastName}</span>
                        <button onClick={() => handleRemoveGuest(guest.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <UserMinus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  {guests.filter((g) => g.tableId === selectedTable.id).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-1">No guests assigned</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setIsEditTableOpen(true)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => handleDeleteTable(selectedTable.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddTableDialog
        open={isAddTableOpen}
        onOpenChange={setIsAddTableOpen}
        clientId={clientId}
        tables={tables}
        onTableAdded={async () => {
          const updated = await getTablesByClientId(clientId);
          setTables(updated || []);
          setIsAddTableOpen(false);
          toast.success(t('seating.tableAdded', 'Table ajoutée avec succès.'));
        }}
      />

      {selectedTable && (
        <EditTableDialog
          open={isEditTableOpen}
          onOpenChange={(open) => {
            setIsEditTableOpen(open);
            if (!open) setSelectedTable(null);
          }}
          table={selectedTable}
          onTableUpdated={async () => {
            const updated = await getTablesByClientId(clientId);
            setTables(updated || []);
            toast.success(t('seating.tableUpdated', 'Table mise à jour.'));
          }}
        />
      )}

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        tables={tables}
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
