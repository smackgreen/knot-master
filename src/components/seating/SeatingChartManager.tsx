/**
 * ============================================================================
 * SEATING CHART MANAGER — Performance-Optimized Three-Column Layout
 * ============================================================================
 *
 * Performance optimizations:
 * 1. Debounced Supabase position updates (only persist after drag ends)
 * 2. Optimistic local state updates (no re-fetch after every change)
 * 3. Stable handler references via useRef (no dependency on selectedTable)
 * 4. React.memo on child components (KonvaFloorPlan, KonvaTable, LeftSidebar, RightPanel)
 * 5. Separated drag state from data state to prevent unnecessary re-renders
 *
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Table, TableShape, Guest } from '@/types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Icons
import {
  Heart, Download, Users, Sparkles, LayoutGrid,
  MoveHorizontal, MousePointer, Square, Type,
  ZoomIn, ZoomOut,
} from 'lucide-react';

// Components
import KonvaFloorPlan, { ToolType } from './KonvaFloorPlan';
import LeftSidebar, { CanvasElement } from './LeftSidebar';
import RightPanel from './RightPanel';
import ExportDialog from './ExportDialog';
import PrintableCards from './PrintableCards';

// ─── Default canvas elements ─────────────────────────────────────────────────
const defaultCanvasElements: CanvasElement[] = [
  { id: 'danceFloor', type: 'dance', x: 390, y: 310, label: 'Dance Floor' },
  { id: 'arch', type: 'arch', x: 560, y: 85, label: 'Bride & Groom' },
  { id: 'stage', type: 'stage', x: 680, y: 200, label: 'Stage' },
  { id: 'wc', type: 'wc', x: 300, y: 452, label: 'WC' },
];

// ─── Canvas toolbar tools ────────────────────────────────────────────────────
const CANVAS_TOOLS: { id: ToolType; icon: any; label: string }[] = [
  { id: 'pan', icon: MoveHorizontal, label: 'Pan' },
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'text', icon: Type, label: 'Text' },
];

// ============================================================================
// Main Component
// ============================================================================

interface SeatingChartManagerProps {
  clientId: string;
}

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
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState<'layout' | 'guests' | 'auto'>('layout');
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>(defaultCanvasElements);
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'smartassist'>('properties');
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<'family' | 'random' | 'balanced'>('family');
  const [isLoading, setIsLoading] = useState(true);

  const stageRef = useRef<any>(null);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  // ---- Stable refs for callbacks ----
  // These refs hold the latest values without causing handler recreation
  const selectedTableRef = useRef<Table | null>(selectedTable);
  selectedTableRef.current = selectedTable;

  const tablesRef = useRef<Table[]>(tables);
  tablesRef.current = tables;

  const guestsRef = useRef<Guest[]>(guests);
  guestsRef.current = guests;

  // ---- Debounce timer for position persistence ----
  const positionSaveTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
        toast.error(t('seating.loadError', 'Error loading data.'));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [clientId]); // Only depend on clientId — context functions are stable

  // ---- Computed ----
  const assignedGuests = useMemo(() => guests.filter((g) => g.tableId), [guests]);
  const unassignedGuests = useMemo(() => guests.filter((g) => !g.tableId), [guests]);

  // ---- Optimized Handlers ----

  /**
   * Add a new table — only handler that does a full Supabase re-fetch
   * because we need the server-generated ID.
   */
  const handleAddTable = useCallback(async (tableData: Partial<Table>) => {
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
      toast.success(t('seating.tableAdded', 'Table added successfully.'));
    } catch (error) {
      toast.error(t('seating.addTableError', 'Error adding table.'));
    }
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Update table properties — OPTIMISTIC local update, background Supabase persist.
   * No re-fetch from server. Local state is updated immediately.
   */
  const handleUpdateTable = useCallback((id: string, updates: Partial<Table>) => {
    // Optimistic local update — instant UI response
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    // Update selectedTable if this is the selected one
    if (selectedTableRef.current?.id === id) {
      setSelectedTable((prev) => (prev ? { ...prev, ...updates } : null));
    }

    // Background persist to Supabase — no await, no blocking
    updateTable(id, updates).catch((error) => {
      console.error('Background save failed:', error);
      toast.error(t('seating.updateError', 'Error saving changes.'));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Delete table — requires Supabase call, then local state update.
   */
  const handleDeleteTable = useCallback(async (id: string) => {
    try {
      await deleteTable(id);
      setTables((prev) => prev.filter((t) => t.id !== id));
      if (selectedTableRef.current?.id === id) setSelectedTable(null);
      toast.success(t('seating.tableDeleted', 'Table deleted.'));
    } catch (error) {
      toast.error(t('seating.deleteError', 'Error deleting table.'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Assign guest to table — optimistic update, background persist.
   */
  const handleAssignGuest = useCallback(async (guestId: string, tableId: string) => {
    // Optimistic local update
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId } : g))
    );

    try {
      await assignGuestToTable(guestId, tableId);
      // Single re-fetch to ensure consistency after complex operation
      const [updatedGuests, updatedTables] = await Promise.all([
        getGuestsByClientId(clientId),
        getTablesByClientId(clientId),
      ]);
      setGuests(updatedGuests || []);
      setTables(updatedTables || []);
      toast.success(t('seating.guestAssigned', 'Guest assigned.'));
    } catch (error) {
      // Rollback on failure
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, tableId: undefined } : g))
      );
      toast.error(t('seating.assignError', 'Error assigning guest.'));
    }
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Remove guest from table — optimistic update, background persist.
   */
  const handleRemoveGuest = useCallback(async (guestId: string) => {
    const previousGuests = guestsRef.current;
    // Optimistic local update
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId: undefined } : g))
    );

    try {
      await removeGuestFromTable(guestId);
      const [updatedGuests, updatedTables] = await Promise.all([
        getGuestsByClientId(clientId),
        getTablesByClientId(clientId),
      ]);
      setGuests(updatedGuests || []);
      setTables(updatedTables || []);
      toast.success(t('seating.guestRemoved', 'Guest removed from table.'));
    } catch (error) {
      // Rollback
      setGuests(previousGuests);
      toast.error(t('seating.removeError', 'Error removing guest.'));
    }
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Auto-assign guests — full operation with re-fetch.
   */
  const handleAutoAssign = useCallback(async () => {
    try {
      await autoAssignGuests(clientId, autoAssignStrategy);
      const [updatedGuests, updatedTables] = await Promise.all([
        getGuestsByClientId(clientId),
        getTablesByClientId(clientId),
      ]);
      setGuests(updatedGuests || []);
      setTables(updatedTables || []);
      toast.success(t('seating.autoAssigned', 'Auto-assignment complete!'));
    } catch (error) {
      toast.error(t('seating.autoAssignError', 'Error during auto-assignment.'));
    }
  }, [clientId, autoAssignStrategy]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Select table — lightweight, no Supabase call.
   */
  const handleSelectTable = useCallback((table: Table | null) => {
    setSelectedTable(table);
    if (table) setRightPanelTab('properties');
  }, []);

  /**
   * Handle table position change during drag — LOCAL STATE ONLY.
   * Supabase persist is debounced to once per second per table.
   * This is the critical performance path.
   */
  const handleTablePositionChange = useCallback((tableId: string, x: number, y: number) => {
    // Immediate local state update — no Supabase call
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, positionX: x, positionY: y } : t))
    );

    // Debounced background persist — max once per second per table
    const existingTimer = positionSaveTimerRef.current.get(tableId);
    if (existingTimer) clearTimeout(existingTimer);

    positionSaveTimerRef.current.set(tableId, setTimeout(() => {
      updateTable(tableId, { positionX: x, positionY: y } as Partial<Table>).catch((err) => {
        console.error('Position save failed:', err);
      });
      positionSaveTimerRef.current.delete(tableId);
    }, 1000)); // 1 second debounce
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Zoom change — lightweight state update.
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  /**
   * Drop element from sidebar — only creates tables via handleAddTable.
   */
  const handleDropElement = useCallback((elementType: string, x: number, y: number) => {
    if (elementType === 'round' || elementType === 'rect' || elementType === 'square') {
      handleAddTable({
        name: `Table ${tablesRef.current.length + 1}`,
        shape: elementType === 'round' ? 'round' : elementType === 'square' ? 'square' : 'rectangular',
        capacity: elementType === 'round' ? 8 : elementType === 'square' ? 4 : 10,
        positionX: x,
        positionY: y,
        width: elementType === 'round' ? 120 : elementType === 'square' ? 80 : 160,
        height: elementType === 'round' ? 120 : elementType === 'square' ? 80 : 80,
      } as Partial<Table>);
    } else {
      setCanvasElements((prev) => [
        ...prev,
        {
          id: `${elementType}-${Date.now()}`,
          type: elementType,
          x,
          y,
          label: elementType.charAt(0).toUpperCase() + elementType.slice(1),
        },
      ]);
    }
  }, [handleAddTable]);

  const handleAddCanvasElement = useCallback((element: CanvasElement) => {
    setCanvasElements((prev) => [...prev, element]);
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      positionSaveTimerRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading seating chart...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // Main Render
  // ========================================================================

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden rounded-xl border border-violet-100">
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div className="h-12 border-b border-violet-100 flex items-center px-3 gap-2 bg-white flex-shrink-0">
        {/* Logo pill */}
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <Heart className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm text-gray-400 cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
          Wedding Planner ▾
        </span>
        <div className="w-px h-5 bg-gray-200" />
        <span className="text-sm font-medium px-2 py-1 rounded cursor-pointer">
          Seating Chart ✎
        </span>

        {/* Layout / Guests / Auto tabs */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 ml-2">
          {(['layout', 'guests', 'auto'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'auto' ? (
                <>
                  <Sparkles className="inline h-3 w-3 mr-1" />
                  Auto
                  <span className="ml-1 text-[9px] bg-violet-600 text-white px-1 rounded">NEW</span>
                </>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>

        {/* Right side buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-md flex items-center gap-1 hover:bg-gray-50 transition-colors">
            <Users className="h-3 w-3" /> Share
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-md flex items-center gap-1 font-medium hover:bg-violet-700 transition-colors"
          >
            <Download className="h-3 w-3" /> Export ▾
          </button>
        </div>
      </div>

      {/* ── Main three-column area ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {activeTab === 'layout' && (
          <LeftSidebar
            onAddTable={handleAddTable}
            onAddCanvasElement={handleAddCanvasElement}
            canvasElements={canvasElements}
            tables={tables}
          />
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#f8f7f5]">
          {/* Canvas Toolbar */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm z-10">
            {CANVAS_TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                  selectedTool === tool.id
                    ? 'bg-violet-100 text-violet-600'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
                title={tool.label}
              >
                <tool.icon className="h-3.5 w-3.5" />
              </button>
            ))}

            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                showGrid ? 'bg-violet-100 text-violet-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
              title="Toggle grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Konva Canvas */}
          <div ref={floorPlanRef} className="w-full h-full">
            <KonvaFloorPlan
              tables={tables}
              guests={guests}
              selectedTableId={selectedTable?.id || null}
              zoom={zoom}
              showGrid={showGrid}
              selectedTool={selectedTool}
              canvasElements={canvasElements}
              onTablePositionChange={handleTablePositionChange}
              onSelectTable={handleSelectTable}
              onZoomChange={handleZoomChange}
              onDropElement={handleDropElement}
              stageRef={stageRef}
            />
          </div>
        </div>

        {/* Right Panel */}
        <RightPanel
          selectedTable={selectedTable}
          guests={guests}
          unassignedGuests={unassignedGuests}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
          onUpdateTable={handleUpdateTable}
          onDeleteTable={handleDeleteTable}
          onRemoveGuest={handleRemoveGuest}
          onAssignGuest={handleAssignGuest}
          onAutoAssign={handleAutoAssign}
          autoAssignStrategy={autoAssignStrategy}
          onStrategyChange={setAutoAssignStrategy}
        />
      </div>

      {/* Dialogs */}
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
