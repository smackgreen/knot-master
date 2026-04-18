import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Table, TableShape, Guest } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  LayoutGrid,
  Plus,
  Save,
  Download,
  Users,
  Circle,
  Square,
  RectangleHorizontal,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Trash2,
  MoveHorizontal,
  RotateCw,
  UserPlus,
  UserMinus,
  Shuffle,
  Maximize,
  Map
} from "lucide-react";
import FloorPlan from "./FloorPlan";
import TableList from "./TableList";
import GuestList from "./GuestList";
import AddTableDialog from "./AddTableDialog";
import EditTableDialog from "./EditTableDialog";
import PrintableCards from "./PrintableCards";
import ExportDialog from "./ExportDialog";

interface SeatingChartDesignerProps {
  clientId: string;
}

const SeatingChartDesigner = ({ clientId }: SeatingChartDesignerProps) => {
  const { t } = useTranslation();
  const {
    getTablesByClientId,
    getGuestsByClientId,
    addTable,
    updateTable,
    deleteTable,
    assignGuestToTable,
    removeGuestFromTable,
    autoAssignGuests
  } = useApp();

  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoAssignStrategy, setAutoAssignStrategy] = useState<'family' | 'random' | 'balanced'>('family');
  const [showGrid, setShowGrid] = useState(true);
  const [resetView, setResetView] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [preventCollisions, setPreventCollisions] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Ref for the floor plan for export
  const floorPlanRef = useRef<HTMLDivElement>(null);

  // Load tables and guests
  useEffect(() => {
    setTables(getTablesByClientId(clientId));
    setGuests(getGuestsByClientId(clientId));
  }, [clientId, getTablesByClientId, getGuestsByClientId]);

  // Add keyboard shortcuts for multi-selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A or Cmd+A to select all tables
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        handleClearSelection();
      }

      // Delete key to delete selected tables
      if (e.key === 'Delete' && selectedTableIds.length > 0) {
        e.preventDefault();
        // Delete all selected tables
        selectedTableIds.forEach(id => {
          deleteTable(id);
        });
        setSelectedTableIds([]);
        setTables(getTablesByClientId(clientId));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTableIds, clientId, deleteTable, getTablesByClientId]);

  const handleAddTable = () => {
    setIsAddTableOpen(true);
  };

  const handleTableSelect = (table: Table, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      // If shift key is pressed, toggle selection
      setSelectedTableIds(prev => {
        if (prev.includes(table.id)) {
          return prev.filter(id => id !== table.id);
        } else {
          return [...prev, table.id];
        }
      });
    } else {
      // If shift key is not pressed, select only this table
      setSelectedTableIds([table.id]);
      setSelectedTable(table);
    }
  };

  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setIsEditTableOpen(true);
  };

  const handleClearSelection = () => {
    setSelectedTableIds([]);
    setSelectedTable(null);
  };

  const handleSelectAll = () => {
    setSelectedTableIds(tables.map(table => table.id));
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      await deleteTable(tableId);
      setTables(getTablesByClientId(clientId));
      setGuests(getGuestsByClientId(clientId));
      toast.success(t("seating.tableDeleted"));
    } catch (error) {
      toast.error(t("seating.failedToDeleteTable"));
    }
  };

  const handleTablePositionChange = async (tableId: string, positionX: number, positionY: number) => {
    try {
      // If this table is part of a multi-selection, move all selected tables
      if (selectedTableIds.includes(tableId) && selectedTableIds.length > 1) {
        const movingTable = tables.find(t => t.id === tableId);
        if (!movingTable) return;

        // Calculate the delta from the original position
        const deltaX = positionX - movingTable.positionX;
        const deltaY = positionY - movingTable.positionY;

        // Apply snap to grid if enabled
        let snappedDeltaX = deltaX;
        let snappedDeltaY = deltaY;

        if (snapToGrid) {
          snappedDeltaX = Math.round(deltaX / gridSize) * gridSize;
          snappedDeltaY = Math.round(deltaY / gridSize) * gridSize;
        }

        // Check for collisions with all selected tables
        let hasCollision = false;
        if (preventCollisions) {
          for (const selectedTableId of selectedTableIds) {
            const selectedTable = tables.find(t => t.id === selectedTableId);
            if (selectedTable) {
              const newX = selectedTable.positionX + snappedDeltaX;
              const newY = selectedTable.positionY + snappedDeltaY;

              // Check if this would cause a collision with any non-selected table
              const wouldCollide = tables.some(otherTable => {
                if (selectedTableIds.includes(otherTable.id)) return false; // Skip selected tables

                const tempTable = {
                  ...selectedTable,
                  positionX: newX,
                  positionY: newY
                };

                return checkTableCollision(tempTable, otherTable);
              });

              if (wouldCollide) {
                hasCollision = true;
                break;
              }
            }
          }
        }

        // Only update if no collisions or collisions are allowed
        if (!hasCollision) {
          // Update all selected tables
          for (const selectedTableId of selectedTableIds) {
            const selectedTable = tables.find(t => t.id === selectedTableId);
            if (selectedTable) {
              const newX = selectedTable.positionX + snappedDeltaX;
              const newY = selectedTable.positionY + snappedDeltaY;

              // Update in database
              await updateTable(selectedTableId, { positionX: newX, positionY: newY });
            }
          }
        } else {
          toast.error(t("seating.cannotMoveTable"));
        }

        // Refresh tables
        setTables(getTablesByClientId(clientId));
      } else {
        // Single table movement
        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        // Apply snap to grid if enabled
        let snappedX = positionX;
        let snappedY = positionY;

        if (snapToGrid) {
          snappedX = Math.round(positionX / gridSize) * gridSize;
          snappedY = Math.round(positionY / gridSize) * gridSize;
        }

        // Check for collisions
        const hasCollision = checkCollisions(tableId, snappedX, snappedY);

        if (!hasCollision || !preventCollisions) {
          await updateTable(tableId, { positionX: snappedX, positionY: snappedY });
          setTables(getTablesByClientId(clientId));
        } else {
          toast.error(t("seating.cannotMoveTable"));
        }
      }
    } catch (error) {
      toast.error(t("seating.failedToUpdatePosition"));
    }
  };

  const handleTableRotationChange = async (tableId: string, rotation: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    try {
      await updateTable(tableId, { rotation });
      setTables(getTablesByClientId(clientId));
    } catch (error) {
      toast.error(t("seating.failedToUpdateRotation"));
    }
  };

  const handleAssignGuest = async (guestId: string, tableId: string) => {
    try {
      await assignGuestToTable(guestId, tableId);
      setGuests(getGuestsByClientId(clientId));
      toast.success(t("seating.guestAssigned"));
    } catch (error) {
      toast.error(t("seating.failedToAssignGuest"));
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    try {
      await removeGuestFromTable(guestId);
      setGuests(getGuestsByClientId(clientId));
      toast.success(t("seating.guestRemoved"));
    } catch (error) {
      toast.error(t("seating.failedToRemoveGuest"));
    }
  };

  const handleAutoAssign = async () => {
    try {
      await autoAssignGuests(clientId, autoAssignStrategy);
      setGuests(getGuestsByClientId(clientId));
      toast.success(t("seating.guestsAutoAssigned"));
    } catch (error) {
      toast.error(t("seating.failedToAutoAssign"));
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetView = () => {
    setResetView(true);
  };

  const handleResetViewComplete = () => {
    setResetView(false);
  };

  // Check if two tables collide
  const checkTableCollision = (table1: Table, table2: Table) => {
    // For simplicity, we'll use rectangular collision detection for all shapes
    // Get the bounds of each table
    const table1Left = table1.positionX;
    const table1Right = table1.positionX + table1.width;
    const table1Top = table1.positionY;
    const table1Bottom = table1.positionY + table1.height;

    const table2Left = table2.positionX;
    const table2Right = table2.positionX + table2.width;
    const table2Top = table2.positionY;
    const table2Bottom = table2.positionY + table2.height;

    // Check for overlap
    return !(
      table1Right < table2Left ||
      table1Left > table2Right ||
      table1Bottom < table2Top ||
      table1Top > table2Bottom
    );
  };

  // Check if a table collides with any other table
  const checkCollisions = (tableId: string, newX: number, newY: number) => {
    if (!preventCollisions) return false;

    const movingTable = tables.find(t => t.id === tableId);
    if (!movingTable) return false;

    // Create a temporary table with the new position
    const tempTable = {
      ...movingTable,
      positionX: newX,
      positionY: newY
    };

    // Check for collisions with all other tables
    return tables.some(otherTable => {
      if (otherTable.id === tableId) return false; // Skip the table itself
      return checkTableCollision(tempTable, otherTable);
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("seating.title")}</CardTitle>
          <CardDescription>{t("seating.description")}</CardDescription>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center space-x-4 mr-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="snap-to-grid"
                checked={snapToGrid}
                onCheckedChange={setSnapToGrid}
              />
              <Label htmlFor="snap-to-grid">{t("seating.snapToGrid")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="prevent-collisions"
                checked={preventCollisions}
                onCheckedChange={setPreventCollisions}
              />
              <Label htmlFor="prevent-collisions">{t("seating.preventCollisions")}</Label>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowGrid(!showGrid)}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            {showGrid ? t("seating.hideGrid") : t("seating.showGrid")}
          </Button>
          <Button onClick={handleAddTable}>
            <Plus className="mr-2 h-4 w-4" />
            {t("seating.addTable")}
          </Button>
          <Button variant="outline" onClick={() => setIsPrintCardsOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            {t("seating.placeCards")}
          </Button>
          <Button variant="outline" onClick={() => setIsExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            {t("seating.export")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Tables and Guests */}
          <div className="lg:col-span-1 space-y-6">
            <Tabs defaultValue="tables">
              <TabsList className="w-full">
                <TabsTrigger value="tables" className="flex-1">{t("seating.tables")}</TabsTrigger>
                <TabsTrigger value="guests" className="flex-1">{t("seating.guests")}</TabsTrigger>
              </TabsList>

              <TabsContent value="tables" className="space-y-4">
                <TableList
                  tables={tables}
                  onEdit={handleEditTable}
                  onDelete={handleDeleteTable}
                />
              </TabsContent>

              <TabsContent value="guests" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t("seating.autoAssignStrategy")}</Label>
                    <Select
                      value={autoAssignStrategy}
                      onValueChange={(value) => setAutoAssignStrategy(value as any)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("common.selectOption")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">{t("seating.keepFamiliesTogether")}</SelectItem>
                        <SelectItem value="random">{t("seating.randomAssignment")}</SelectItem>
                        <SelectItem value="balanced">{t("seating.balanceTables")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAutoAssign}
                    disabled={tables.length === 0}
                  >
                    <Shuffle className="mr-2 h-4 w-4" />
                    {t("seating.autoAssignAllGuests")}
                  </Button>

                  <GuestList
                    guests={guests}
                    tables={tables}
                    onAssign={handleAssignGuest}
                    onRemove={handleRemoveGuest}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main canvas area */}
          <div className="lg:col-span-3 border rounded-lg overflow-hidden relative">
            {/* Selection toolbar */}
            {selectedTableIds.length > 0 && (
              <div className="absolute top-2 left-2 z-10 bg-white/90 rounded-md shadow-md p-2 flex gap-2 items-center">
                <span className="text-sm font-medium">{selectedTableIds.length} {t("seating.selected")}</span>
                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  {t("seating.clear")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // Delete all selected tables
                    selectedTableIds.forEach(id => {
                      deleteTable(id);
                    });
                    setSelectedTableIds([]);
                    setTables(getTablesByClientId(clientId));
                  }}
                >
                  {t("seating.delete")}
                </Button>
              </div>
            )}

            {/* View controls */}
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} title={t("seating.zoomOut")}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomIn} title={t("seating.zoomIn")}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleResetView} title={t("seating.resetView")}>
                <Maximize className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMinimap(!showMinimap)}
                title={showMinimap ? t("seating.hideMinimap") : t("seating.showMinimap")}
                className={showMinimap ? "bg-muted" : ""}
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>

            <div ref={floorPlanRef}>
              <FloorPlan
                tables={tables}
                guests={guests}
                zoom={zoom}
                showGrid={showGrid}
                resetView={resetView}
                selectedTableIds={selectedTableIds}
                showMinimap={showMinimap}
                onTablePositionChange={handleTablePositionChange}
                onTableRotationChange={handleTableRotationChange}
                onTableSelect={handleTableSelect}
                onGuestAssign={handleAssignGuest}
                onGuestRemove={handleRemoveGuest}
                onResetViewComplete={handleResetViewComplete}
                onZoomChange={setZoom}
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Dialogs */}
      <AddTableDialog
        open={isAddTableOpen}
        onOpenChange={setIsAddTableOpen}
        clientId={clientId}
        tables={tables}
        preventCollisions={preventCollisions}
        checkCollision={checkTableCollision}
        onTableAdded={() => setTables(getTablesByClientId(clientId))}
      />

      {selectedTable && (
        <EditTableDialog
          open={isEditTableOpen}
          onOpenChange={setIsEditTableOpen}
          table={selectedTable}
          onTableUpdated={() => setTables(getTablesByClientId(clientId))}
        />
      )}

      <PrintableCards
        open={isPrintCardsOpen}
        onOpenChange={setIsPrintCardsOpen}
        guests={guests}
        tables={tables}
        selectedTableIds={selectedTableIds}
      />

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        floorPlanRef={floorPlanRef}
        tables={tables}
      />
    </Card>
  );
};

export default SeatingChartDesigner;
